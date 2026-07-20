function formatMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TermometroMargem({ preco, custos, comissaoPercentual }) {
  const precoNum = Number(preco) || 0;
  const somaCustos = custos.reduce((soma, c) => soma + (Number(c.valor) || 0), 0);
  const comissaoEstimada = comissaoPercentual ? (precoNum * Number(comissaoPercentual)) / 100 : 0;
  const margem = precoNum - somaCustos - comissaoEstimada;
  const margemPercentual = precoNum > 0 ? (margem / precoNum) * 100 : null;

  // Margem mínima de segurança: mesmo patamar de 15% já usado como corte
  // para o nível "atenção" abaixo — abaixo disso não sobra espaço pra
  // negociar desconto sem a venda deixar de valer a pena.
  const margemMinima = precoNum * 0.15;
  const limiteDesconto = precoNum > 0 ? margem - margemMinima : null;

  let nivel = "sem-dados";
  let label = "Sem dados suficientes";
  if (precoNum > 0) {
    if (margem <= 0) {
      nivel = "ruim";
      label = "Margem negativa ou nula";
    } else if (margemPercentual < 15) {
      nivel = "atencao";
      label = "Margem apertada";
    } else {
      nivel = "boa";
      label = "Margem saudável";
    }
  }

  return (
    <div className="checklist">
      <h2>Termômetro de margem</h2>

      <div className={`termometro termometro-${nivel}`}>
        <p className="termometro-valor">{formatMoeda(margem)}</p>
        <p className="termometro-label">
          {label}
          {margemPercentual != null && ` (${margemPercentual.toFixed(1)}% do preço)`}
        </p>
      </div>

      <ul className="termometro-detalhe">
        <li>Preço de venda: {formatMoeda(precoNum)}</li>
        <li>Custos lançados: {formatMoeda(somaCustos)}</li>
        <li>
          Comissão estimada{comissaoPercentual ? ` (${comissaoPercentual}%)` : " (sem comissão definida)"}:{" "}
          {formatMoeda(comissaoEstimada)}
        </li>
      </ul>

      {limiteDesconto != null && (
        <p className={`termometro-limite-desconto ${limiteDesconto > 0 ? "" : "termometro-limite-negativo"}`}>
          {limiteDesconto > 0
            ? `Até ${formatMoeda(limiteDesconto)} de desconto sem perder a margem mínima de 15%.`
            : "Sem espaço para desconto sem cair abaixo da margem mínima de 15%."}
        </p>
      )}

      <p className="auth-nota">
        Cálculo com base no seu percentual de comissão. Não considera Tabela FIPE nem alertas de
        mercado — isso fica para uma fase futura (ver roadmap).
      </p>
    </div>
  );
}
