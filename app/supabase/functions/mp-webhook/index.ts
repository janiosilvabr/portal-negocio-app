// Edge Function: mp-webhook
//
// Recebe a notificação do Mercado Pago quando um pagamento muda de status
// (criado via criar-checkout-mp) e confirma/credita o que foi comprado:
// assinatura de plano (empresas.plano + assinaturas + pagamentos_saas) ou
// créditos avulsos (empresas.creditos_*_disponiveis + compras_creditos).
// Ver CLAUDE.md "Decisão de 25/07 — Créditos avulsos" e "Lacuna crítica".
//
// Segurança:
// - Nunca confia no corpo da notificação por si só — ele só diz "um
//   pagamento mudou, o id é X"; os dados reais (status, metadata) são
//   sempre buscados de volta na API do Mercado Pago com o nosso próprio
//   Access Token antes de qualquer gravação.
// - É a única function do projeto que usa a service role key pra ESCREVER
//   em empresas/assinaturas/pagamentos_saas/compras_creditos — não roda
//   com JWT de usuário porque o Mercado Pago chama isso direto, sem login.
// - Idempotente: se a notificação chegar mais de uma vez pro mesmo
//   pagamento (comportamento normal do Mercado Pago), a segunda vez não
//   credita de novo — verifica se o registro já está "pago" antes.
// - Sempre responde 200 rapidamente (mesmo em erros de negócio, como
//   "pagamento não aprovado" ou "tipo desconhecido") pra evitar retentativas
//   agressivas do Mercado Pago; só erros realmente inesperados (exceção,
//   token ausente) retornam status diferente.
//
// Arquivo único de propósito: dá pra colar direto no editor de Edge
// Functions da Dashboard do Supabase, sem precisar do CLI.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MERCADOPAGO_ACCESS_TOKEN = (Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "").trim();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// O Mercado Pago manda notificação em mais de um formato dependendo da
// origem (webhook configurado vs. botão "Simular" do painel vs. IPN
// legado) — aceita todos: POST com JSON {data:{id}}, ou query string
// ?type=payment&data.id=X, ou legado ?topic=payment&id=X.
async function extrairPaymentId(req: Request): Promise<{ tipo: string | null; id: string | null }> {
  const url = new URL(req.url);
  const tipoQuery = url.searchParams.get("type") ?? url.searchParams.get("topic");
  const idQuery = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (tipoQuery && idQuery) return { tipo: tipoQuery, id: idQuery };

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const tipo = body?.type ?? body?.topic ?? null;
      const id = body?.data?.id ?? body?.id ?? null;
      if (tipo && id) return { tipo, id: String(id) };
    } catch {
      // corpo vazio ou não-JSON — segue sem dados, tratado abaixo
    }
  }

  return { tipo: tipoQuery, id: idQuery };
}

Deno.serve(async (req) => {
  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error("[mp-webhook] MERCADOPAGO_ACCESS_TOKEN ausente.");
      return jsonResponse({ error: "config ausente" }, 500);
    }

    const { tipo, id: paymentId } = await extrairPaymentId(req);

    if (tipo !== "payment" || !paymentId) {
      // Outros tipos de evento (ex.: merchant_order) ou chamada de teste
      // sem dados — não é erro, só não há o que processar.
      return jsonResponse({ ok: true, ignorado: true });
    }

    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
    });

    if (!mpResp.ok) {
      console.error(`[mp-webhook] falha ao consultar pagamento ${paymentId}: ${mpResp.status}`);
      return jsonResponse({ ok: true, erroConsulta: true });
    }

    const pagamento = await mpResp.json();

    if (pagamento.status !== "approved") {
      return jsonResponse({ ok: true, status: pagamento.status });
    }

    const metadata = pagamento.metadata ?? {};
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (metadata.tipo === "assinatura") {
      const { data: registro } = await supabaseAdmin
        .from("pagamentos_saas")
        .select("*, assinaturas(empresa_id, plano_id)")
        .eq("id", metadata.pagamento_id)
        .maybeSingle();

      if (!registro) return jsonResponse({ ok: true, naoEncontrado: true });
      if (registro.status === "pago") return jsonResponse({ ok: true, jaProcessado: true });

      const empresaId = registro.assinaturas?.empresa_id ?? metadata.empresa_id;
      const planoId = registro.assinaturas?.plano_id ?? metadata.plano_id;

      const { data: plano } = await supabaseAdmin.from("planos").select("nome").eq("id", planoId).maybeSingle();
      const nomePlano = (plano?.nome ?? "").toLowerCase();
      const planoSlug = nomePlano === "pro" ? "pro" : nomePlano === "básico" || nomePlano === "basico" ? "basico" : "gratis";

      const proximaCobranca = new Date();
      proximaCobranca.setDate(proximaCobranca.getDate() + 30);

      await supabaseAdmin.from("empresas").update({ plano: planoSlug }).eq("id", empresaId);

      await supabaseAdmin
        .from("assinaturas")
        .update({
          status: "ativa",
          mercadopago_subscription_id: String(pagamento.id),
          proxima_cobranca: proximaCobranca.toISOString().slice(0, 10),
        })
        .eq("empresa_id", empresaId)
        .eq("plano_id", planoId);

      await supabaseAdmin
        .from("pagamentos_saas")
        .update({
          status: "pago",
          mercadopago_payment_id: String(pagamento.id),
          data_pagamento: new Date().toISOString(),
        })
        .eq("id", metadata.pagamento_id);

      return jsonResponse({ ok: true, processado: "assinatura" });
    }

    if (metadata.tipo === "creditos") {
      const { data: registro } = await supabaseAdmin
        .from("compras_creditos")
        .select("*")
        .eq("id", metadata.compra_id)
        .maybeSingle();

      if (!registro) return jsonResponse({ ok: true, naoEncontrado: true });
      if (registro.status === "pago") return jsonResponse({ ok: true, jaProcessado: true });

      const { data: empresa } = await supabaseAdmin
        .from("empresas")
        .select("creditos_anuncios_disponiveis, creditos_documentos_disponiveis")
        .eq("id", registro.empresa_id)
        .single();

      await supabaseAdmin
        .from("empresas")
        .update({
          creditos_anuncios_disponiveis: (empresa?.creditos_anuncios_disponiveis ?? 0) + registro.quantidade,
          creditos_documentos_disponiveis: (empresa?.creditos_documentos_disponiveis ?? 0) + registro.quantidade,
        })
        .eq("id", registro.empresa_id);

      await supabaseAdmin
        .from("compras_creditos")
        .update({
          status: "pago",
          mercadopago_payment_id: String(pagamento.id),
          data_pagamento: new Date().toISOString(),
        })
        .eq("id", metadata.compra_id);

      return jsonResponse({ ok: true, processado: "creditos" });
    }

    return jsonResponse({ ok: true, tipoDesconhecido: metadata.tipo ?? null });
  } catch (e) {
    console.error("[mp-webhook] excecao nao tratada:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
