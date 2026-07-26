// Edge Function: excluir-vendedor
//
// Correção pontual (26/07): exclui de verdade o login (auth.users) de um
// vendedor/membro da equipe, não só o registro em "usuarios". Precisa da
// service role key (Admin API do Supabase) porque excluir um usuário de
// auth.users não é algo que a policy de RLS de uma tabela normal consegue
// fazer — só a Admin API tem esse poder.
//
// Depois da migração 0043 (on delete cascade / set null nas tabelas que
// referenciam usuarios), a exclusão do login já arrasta a limpeza do
// perfil e preserva o histórico de vendas/leads/transações/atividades
// (só perdem o vínculo com o vendedor removido, os dados continuam).
//
// Segurança: só um admin da MESMA empresa do vendedor-alvo pode excluí-lo
// -- nunca confia em empresa_id vindo do corpo da requisição, sempre
// deriva do JWT de quem chamou.
//
// Arquivo único de propósito: dá pra colar direto no editor de Edge
// Functions da Dashboard do Supabase, sem precisar do CLI.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autenticado." }, 401);

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) return jsonResponse({ error: "Não autenticado." }, 401);

    const body = await req.json();
    const { usuario_id } = body;
    if (!usuario_id) return jsonResponse({ error: "usuario_id é obrigatório." }, 400);

    const { data: chamador, error: erroChamador } = await supabaseUser
      .from("usuarios")
      .select("empresa_id, papel")
      .eq("id", userData.user.id)
      .single();

    if (erroChamador || !chamador) return jsonResponse({ error: "Perfil não encontrado." }, 404);
    if (chamador.papel !== "admin") {
      return jsonResponse({ error: "Só um admin da empresa pode excluir um vendedor." }, 403);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: alvo, error: erroAlvo } = await supabaseAdmin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", usuario_id)
      .maybeSingle();

    if (erroAlvo) return jsonResponse({ error: erroAlvo.message }, 500);
    if (!alvo) return jsonResponse({ error: "Vendedor não encontrado." }, 404);
    if (alvo.empresa_id !== chamador.empresa_id) {
      return jsonResponse({ error: "Esse vendedor não pertence à sua empresa." }, 403);
    }
    if (usuario_id === userData.user.id) {
      return jsonResponse({ error: "Você não pode excluir a própria conta por aqui." }, 400);
    }

    const { error: erroExclusao } = await supabaseAdmin.auth.admin.deleteUser(usuario_id);
    if (erroExclusao) return jsonResponse({ error: erroExclusao.message }, 500);

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error("[excluir-vendedor] excecao nao tratada:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
