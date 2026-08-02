import { supabase } from "./supabaseClient";
import { cnpjValido } from "./cnpj";
import { salvarIntencaoCheckout } from "./checkoutIntent";

// Dispara a criação da preferência de pagamento e redireciona pro checkout do
// Mercado Pago. Assume que o CNPJ já foi validado por quem chamou.
export async function iniciarCheckout(intencao) {
  const { data: sessionData } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke("criar-checkout-mp", {
    body: intencao,
    headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
  });

  if (error || data?.error) {
    throw new Error(data?.error ?? error?.message ?? "Falha ao iniciar checkout.");
  }

  window.location.href = data.init_point;
}

// Chamado logo depois de login/cadastro quando existe uma intenção de compra
// pendente (salva em /planos por um visitante sem conta). Confirma que a
// empresa já tem CNPJ válido antes de seguir pro checkout — como o cadastro
// (Cadastro.jsx) não pede CNPJ, toda conta nova cai aqui sem CNPJ na primeira
// vez. Se faltar, guarda a intenção de novo e manda pra tela de Empresa
// completar o cadastro antes de pagar; quem retoma o checkout depois de salvo
// é EditarEmpresa.jsx.
export async function retomarCheckoutAposLogin(intencao, navigate) {
  const { data: userData } = await supabase.auth.getUser();
  const { data: perfilRow } = await supabase
    .from("usuarios")
    .select("empresa_id")
    .eq("id", userData.user.id)
    .single();
  const { data: empresa } = await supabase
    .from("empresas")
    .select("cnpj")
    .eq("id", perfilRow.empresa_id)
    .single();

  if (!cnpjValido(empresa?.cnpj)) {
    salvarIntencaoCheckout(intencao);
    navigate("/empresa?checkout=pendente");
    return;
  }

  await iniciarCheckout(intencao);
}
