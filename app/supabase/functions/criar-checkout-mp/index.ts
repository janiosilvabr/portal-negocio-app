// Edge Function: criar-checkout-mp
//
// Sessão B (SESSOES_ATUALIZADAS_25jul.md) + decisão de 25/07: cria uma
// preferência de pagamento no Mercado Pago (Checkout Pro) para duas
// finalidades possíveis:
//   - "assinatura": assinar/trocar de plano mensal (gratis não passa por
//     aqui, só basico/pro)
//   - "creditos": comprar créditos avulsos (R$10 = 1 crédito = +1 anúncio
//     + 1 documento, consumidos separadamente na hora do uso — ver
//     CLAUDE.md "Decisão de 25/07 — Créditos avulsos")
//
// O registro "pendente" (pagamentos_saas ou compras_creditos) é criado
// AQUI, antes de redirecionar pro Mercado Pago — o webhook (mp-webhook)
// só confirma e atualiza esse registro depois, nunca cria do zero, pra
// sempre existir um empresa_id/quantidade/plano confiável de origem
// mesmo que o metadata do MP falhe por algum motivo.
//
// RLS não permite ao usuário comum inserir em assinaturas/pagamentos_saas/
// compras_creditos (só leitura) — por isso esta function usa a service
// role key (disponível automaticamente no ambiente da Edge Function) só
// para essas duas gravações pontuais, depois de identificar a empresa
// através do JWT do usuário autenticado (nunca confiando em empresa_id
// vindo do corpo da requisição).
//
// Arquivo único de propósito: dá pra colar direto no editor de Edge
// Functions da Dashboard do Supabase, sem precisar do CLI.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MERCADOPAGO_ACCESS_TOKEN = (Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "").trim();

const SITE_URL = "https://portalnegocio.com.br";
const PRECO_CREDITO = 10.0;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return jsonResponse(
        { error: "MERCADOPAGO_ACCESS_TOKEN não chegou até a function. Confirme a secret em Edge Functions → Secrets." },
        500
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autenticado." }, 401);

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) return jsonResponse({ error: "Não autenticado." }, 401);

    const { data: perfil, error: erroPerfil } = await supabaseUser
      .from("usuarios")
      .select("empresa_id, nome")
      .eq("id", userData.user.id)
      .single();

    if (erroPerfil || !perfil?.empresa_id) {
      return jsonResponse({ error: "Perfil ou empresa não encontrados." }, 404);
    }

    const body = await req.json();
    const tipo = body?.tipo;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let item: { title: string; quantity: number; unit_price: number };
    let metadata: Record<string, unknown>;
    let externalReference: string;

    if (tipo === "assinatura") {
      const planoId = body?.plano_id;
      if (!planoId) return jsonResponse({ error: "plano_id é obrigatório." }, 400);

      const { data: plano, error: erroPlano } = await supabaseAdmin
        .from("planos")
        .select("*")
        .eq("id", planoId)
        .single();

      if (erroPlano || !plano) return jsonResponse({ error: "Plano não encontrado." }, 404);
      if (!plano.preco_mensal || Number(plano.preco_mensal) <= 0) {
        return jsonResponse({ error: "Este plano não precisa de checkout (é gratuito)." }, 400);
      }

      const { data: assinatura, error: erroAssinatura } = await supabaseAdmin
        .from("assinaturas")
        .insert({ empresa_id: perfil.empresa_id, plano_id: planoId, status: "trial" })
        .select()
        .single();

      if (erroAssinatura || !assinatura) {
        return jsonResponse({ error: erroAssinatura?.message ?? "Falha ao criar assinatura." }, 500);
      }

      const { data: pagamento, error: erroPagamento } = await supabaseAdmin
        .from("pagamentos_saas")
        .insert({ assinatura_id: assinatura.id, valor: plano.preco_mensal, status: "pendente" })
        .select()
        .single();

      if (erroPagamento || !pagamento) {
        return jsonResponse({ error: erroPagamento?.message ?? "Falha ao criar pagamento." }, 500);
      }

      item = {
        title: `Assinatura ${plano.nome} — Portal Negócio`,
        quantity: 1,
        unit_price: Number(plano.preco_mensal),
      };
      metadata = {
        tipo: "assinatura",
        empresa_id: perfil.empresa_id,
        plano_id: planoId,
        pagamento_id: pagamento.id,
      };
      externalReference = pagamento.id;
    } else if (tipo === "creditos") {
      const quantidade = Number(body?.quantidade);
      if (!quantidade || quantidade < 1 || !Number.isInteger(quantidade)) {
        return jsonResponse({ error: "Informe uma quantidade de créditos válida (inteiro >= 1)." }, 400);
      }

      const valorPago = quantidade * PRECO_CREDITO;

      const { data: compra, error: erroCompra } = await supabaseAdmin
        .from("compras_creditos")
        .insert({ empresa_id: perfil.empresa_id, quantidade, valor_pago: valorPago, status: "pendente" })
        .select()
        .single();

      if (erroCompra || !compra) {
        return jsonResponse({ error: erroCompra?.message ?? "Falha ao criar registro de compra." }, 500);
      }

      item = {
        title: `Créditos avulsos Portal Negócio (${quantidade}x — +${quantidade} anúncio(s) e +${quantidade} documento(s))`,
        quantity: 1,
        unit_price: valorPago,
      };
      metadata = {
        tipo: "creditos",
        empresa_id: perfil.empresa_id,
        quantidade,
        compra_id: compra.id,
      };
      externalReference = compra.id;
    } else {
      return jsonResponse({ error: "tipo deve ser 'assinatura' ou 'creditos'." }, 400);
    }

    const preferencia = {
      items: [{ ...item, currency_id: "BRL" }],
      metadata,
      external_reference: externalReference,
      back_urls: {
        success: `${SITE_URL}/planos?status=aprovado`,
        failure: `${SITE_URL}/planos?status=recusado`,
        pending: `${SITE_URL}/planos?status=pendente`,
      },
      auto_return: "approved",
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
    };

    const mpResp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferencia),
    });

    if (!mpResp.ok) {
      const errText = await mpResp.text();
      return jsonResponse({ error: `Falha ao criar preferência no Mercado Pago (${mpResp.status}): ${errText}` }, 502);
    }

    const mpData = await mpResp.json();

    // O token de produção (APP_USR-...) precisa sempre ir para o
    // init_point real — nunca para o sandbox_init_point, mesmo que a API
    // do MP ainda devolva esse campo preenchido na resposta.
    const ehTokenProducao = MERCADOPAGO_ACCESS_TOKEN.startsWith("APP_USR-");
    const initPoint = ehTokenProducao
      ? mpData.init_point
      : mpData.sandbox_init_point || mpData.init_point;

    return jsonResponse({ ok: true, init_point: initPoint });
  } catch (e) {
    console.error("[criar-checkout-mp] excecao nao tratada:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
