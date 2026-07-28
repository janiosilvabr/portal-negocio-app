// Edge Function: notificar-novo-lead
//
// Integração completa com Brevo (decisão de 27/07): quando um visitante
// da vitrine pública clica em "Tenho interesse" e o lead é criado (via
// criar_lead_publico, migração 0021), esta function manda um e-mail pra
// garagem avisando -- antes disso, o único jeito de saber era abrir a
// tela de Leads manualmente.
//
// Chamada sem JWT (o visitante nunca está logado), então usa a service
// role key pra buscar os dados (lead/cliente/veículo/empresa), que a RLS
// normal bloquearia pra um visitante anônimo. Pra não virar uma forma de
// espiar dados de qualquer lead por id, só aceita lead_id de um lead
// criado nos últimos 5 minutos com origem = 'site' -- é o suficiente pra
// cobrir o caso real (notificar logo após o cadastro) sem abrir uma
// consulta genérica.
//
// Reply-to do e-mail vai pro contato do cliente interessado (telefone
// não dá, mas e-mail sim, se informado), então a garagem pode responder
// direto pro cliente sem precisar copiar/colar nada.
//
// Falha desta function nunca deve quebrar a experiência do visitante --
// o lead já foi salvo antes desta chamada; se o e-mail falhar, o
// visitante já viu "Interesse enviado!" de qualquer forma.
//
// Arquivo único de propósito: dá pra colar direto no editor de Edge
// Functions da Dashboard do Supabase, sem precisar do CLI.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_API_KEY = (Deno.env.get("BREVO_API_KEY") ?? "").trim();
const REMETENTE_EMAIL = "contato@portalnegocio.com.br";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function escapeHtml(texto: string) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    if (!BREVO_API_KEY) {
      return jsonResponse({ error: "BREVO_API_KEY não configurada." }, 500);
    }

    const body = await req.json();
    const { lead_id } = body;
    if (!lead_id) return jsonResponse({ error: "lead_id é obrigatório." }, 400);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: lead, error: erroLead } = await supabaseAdmin
      .from("leads")
      .select(
        "id, observacoes, created_at, origem, clientes(nome, telefone, email), veiculos(marca, modelo, versao, empresas(nome, email))"
      )
      .eq("id", lead_id)
      .eq("origem", "site")
      .gte("created_at", cincoMinutosAtras)
      .maybeSingle();

    if (erroLead) return jsonResponse({ error: erroLead.message }, 500);
    // Lead não encontrado, não é do site, ou muito antigo -- não é erro
    // pro visitante (o lead pode já ter sido criado normalmente), só não
    // há o que notificar.
    if (!lead) return jsonResponse({ ok: true, ignorado: true });

    const empresa = lead.veiculos?.empresas;
    const cliente = lead.clientes;

    if (!empresa?.email) {
      return jsonResponse({ ok: true, semEmailEmpresa: true });
    }

    const veiculoDescricao = lead.veiculos
      ? `${lead.veiculos.marca} ${lead.veiculos.modelo}${lead.veiculos.versao ? ` ${lead.veiculos.versao}` : ""}`
      : "veículo";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #212529;">
        <p>Olá, ${escapeHtml(empresa.nome ?? "")}!</p>
        <p>Você recebeu um novo interesse pela vitrine pública do Portal Negócio:</p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; font-size: 0.95rem; line-height: 1.7;">
          <p><strong>Veículo:</strong> ${escapeHtml(veiculoDescricao)}</p>
          <p><strong>Nome:</strong> ${escapeHtml(cliente?.nome ?? "não informado")}</p>
          <p><strong>Telefone:</strong> ${escapeHtml(cliente?.telefone ?? "não informado")}</p>
          <p><strong>E-mail:</strong> ${escapeHtml(cliente?.email ?? "não informado")}</p>
          ${lead.observacoes ? `<p><strong>Mensagem:</strong> ${escapeHtml(lead.observacoes)}</p>` : ""}
        </div>
        <p style="color: #6c757d; font-size: 0.8rem; margin-top: 20px;">
          Esse lead já está registrado no seu painel do Portal Negócio, na tela de Leads.
          ${cliente?.email ? "Você pode responder este e-mail diretamente para falar com o cliente." : ""}
        </p>
      </div>
    `;

    const brevoResp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Portal Negócio", email: REMETENTE_EMAIL },
        ...(cliente?.email ? { replyTo: { name: cliente.nome || undefined, email: cliente.email } } : {}),
        to: [{ email: empresa.email, name: empresa.nome || undefined }],
        subject: `Novo interesse: ${veiculoDescricao}${cliente?.nome ? ` — ${cliente.nome}` : ""}`,
        htmlContent,
      }),
    });

    if (!brevoResp.ok) {
      const errText = await brevoResp.text();
      console.error(`[notificar-novo-lead] falha Brevo (${brevoResp.status}): ${errText}`);
      // O lead já existe independente do e-mail -- não propaga erro pro
      // visitante, só registra pra investigar depois.
      return jsonResponse({ ok: true, falhaEnvio: true });
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error("[notificar-novo-lead] excecao nao tratada:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
