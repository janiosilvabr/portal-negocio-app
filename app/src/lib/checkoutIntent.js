// Guarda a intenção de compra (plano ou créditos) escolhida em /planos por um
// visitante sem conta, pra retomar o checkout automaticamente depois que ele
// cria a conta/confirma o e-mail/faz login — sem precisar escolher de novo.
// localStorage (não sessionStorage) porque a confirmação de e-mail do Supabase
// costuma abrir em outra aba, que não compartilha sessionStorage com a aba
// onde a intenção foi salva.

const CHAVE = "portalnegocio_checkout_intent";

export function salvarIntencaoCheckout(intencao) {
  localStorage.setItem(CHAVE, JSON.stringify(intencao));
}

export function lerIntencaoCheckout() {
  const bruto = localStorage.getItem(CHAVE);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto);
  } catch {
    return null;
  }
}

export function limparIntencaoCheckout() {
  localStorage.removeItem(CHAVE);
}
