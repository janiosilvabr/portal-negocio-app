// Edge Function: enviar-documento-email
//
// Envia por e-mail (via Brevo) um documento já gerado no módulo Documentos.
// V1 desta feature = enviar o contrato/documento já pronto ao cliente, não
// uma ferramenta de e-mail marketing (ver CLAUDE.md, roadmap "Envio de
// documento por e-mail via Brevo").
//
// Remetente técnico é sempre contato@portalnegocio.com.br (remetente
// verificado na conta Brevo, compartilhado entre todas as garagens) — o
// nome de exibição usa o nome da garagem, e reply-to aponta pro e-mail da
// garagem, então a resposta do cliente cai na caixa certa mesmo com o
// envio saindo de um remetente técnico único. Isso é intencional (ver nota
// de risco de reputação compartilhada no CLAUDE.md).
//
// Roda com o JWT do usuário que chamou, então a leitura do documento
// respeita o RLS normal de documentos_gerados (escopo por empresa) — a
// function não usa service role key em nenhum momento.
//
// Arquivo único de propósito: dá pra colar direto no editor de Edge
// Functions da Dashboard do Supabase, sem precisar do CLI.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BREVO_API_KEY = (Deno.env.get("BREVO_API_KEY") ?? "").trim();
const REMETENTE_EMAIL = "contato@portalnegocio.com.br";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIPO_LABEL: Record<string, string> = {
  contrato_consignacao: "Contrato de Consignação",
  contrato_compra_venda: "Contrato de Compra e Venda",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function escapeHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function montarHtml(opts: { empresaNome: string; tipoLabel: string; conteudo: string }) {
  const corpo = escapeHtml(opts.conteudo).replace(/\n/g, "<br>");
  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #212529;">
      <p>Olá,</p>
      <p>Segue abaixo o <strong>${opts.tipoLabel}</strong> enviado por <strong>${escapeHtml(opts.empresaNome)}</strong> através do Portal Negócio.</p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap;">${corpo}</div>
      <p style="color: #6c757d; font-size: 0.8rem; margin-top: 20px;">
        Documento gerado automaticamente — revise o conteúdo com atenção antes de assinar.
        Em caso de dúvida, responda este e-mail que ele chega diretamente para ${escapeHtml(opts.empresaNome)}.
      </p>
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    if (!BREVO_API_KEY) {
      return jsonResponse(
        { error: "BREVO_API_KEY não chegou até a function. Confirme a secret em Edge Functions → Secrets." },
        500
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autenticado." }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return jsonResponse({ error: "Não autenticado." }, 401);

    const body = await req.json();
    const { documento_id, destinatario_email, destinatario_nome } = body;

    if (!documento_id) return jsonResponse({ error: "documento_id é obrigatório." }, 400);
    if (!destinatario_email || !destinatario_email.includes("@")) {
      return jsonResponse({ error: "Informe um e-mail de destino válido." }, 400);
    }

    const { data: documento, error: erroDocumento } = await supabase
      .from("documentos_gerados")
      .select(
        "*, negocios(veiculos(empresas(nome, email))), consignacoes(veiculos(empresas(nome, email)))"
      )
      .eq("id", documento_id)
      .maybeSingle();

    if (erroDocumento) return jsonResponse({ error: erroDocumento.message }, 500);
    // RLS de documentos_gerados já escopa por empresa — chegar aqui vazio
    // significa "não existe ou não é seu", nunca revelamos a diferença.
    if (!documento) return jsonResponse({ error: "Documento não encontrado." }, 404);

    const empresa = documento.negocios?.veiculos?.empresas ?? documento.consignacoes?.veiculos?.empresas;
    const empresaNome = empresa?.nome ?? "Portal Negócio";
    const empresaEmail = empresa?.email || REMETENTE_EMAIL;
    const tipoLabel = TIPO_LABEL[documento.tipo] ?? "Documento";

    const brevoResp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: `${empresaNome} via Portal Negócio`, email: REMETENTE_EMAIL },
        replyTo: { name: empresaNome, email: empresaEmail },
        to: [{ email: destinatario_email, name: destinatario_nome || undefined }],
        subject: `${tipoLabel} — ${empresaNome}`,
        htmlContent: montarHtml({ empresaNome, tipoLabel, conteudo: documento.conteudo ?? "" }),
      }),
    });

    if (!brevoResp.ok) {
      const errText = await brevoResp.text();
      return jsonResponse({ error: `Falha ao enviar pela Brevo (${brevoResp.status}): ${errText}` }, 502);
    }

    // O e-mail já saiu pela Brevo neste ponto — se o registro do envio
    // falhar (ex.: RLS), não faz sentido reportar "erro" pro usuário e
    // arriscar reenvio duplicado; só loga e devolve sucesso mesmo assim.
    const { data: atualizado, error: erroAtualizar } = await supabase
      .from("documentos_gerados")
      .update({
        enviado_email_em: new Date().toISOString(),
        enviado_email_para: destinatario_email,
      })
      .eq("id", documento_id)
      .select()
      .maybeSingle();

    if (erroAtualizar || !atualizado) {
      console.error("[enviar-documento-email] e-mail enviado mas falhou ao registrar:", erroAtualizar?.message);
      return jsonResponse({ ok: true, documento: null });
    }

    return jsonResponse({ ok: true, documento: atualizado });
  } catch (e) {
    console.error("[enviar-documento-email] excecao nao tratada:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
