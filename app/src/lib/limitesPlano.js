// Traduz as mensagens fixas que os triggers/functions de limite de plano
// (migration 0049) devolvem em erro cru do Postgres pra algo que o usuário
// entende, com caminho claro pra resolver.
export function mensagemLimitePlano(mensagemErro) {
  if (!mensagemErro) return null;

  if (mensagemErro.includes("limite_anuncios_excedido")) {
    return "Limite de anúncios ativos do seu plano atingido, e você não tem créditos avulsos disponíveis. Compre créditos ou faça upgrade em Planos.";
  }

  if (mensagemErro.includes("limite_documentos_excedido")) {
    return "Limite de gerações de documento do seu plano neste mês atingido, e você não tem créditos avulsos disponíveis. Compre créditos ou faça upgrade em Planos.";
  }

  return null;
}
