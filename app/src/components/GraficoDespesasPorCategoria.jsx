import { useMemo, useState } from "react";

// Ordem fixa de cores categóricas (validada contra daltonismo — ver skill
// dataviz do ambiente). "Outros" sempre usa a cor neutra, fora da sequência.
const CORES_CATEGORIA = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#4a3aa7"];
const COR_OUTROS = "#9aa5b8";
const MAX_CATEGORIAS = 5;

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Gráfico de rosca (despesas por categoria) — SVG desenhado à mão com
// círculos e stroke-dasharray, sem biblioteca externa.
export function GraficoDespesasPorCategoria({ transacoes }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const segmentos = useMemo(() => {
    const somaPorCategoria = {};
    for (const t of transacoes) {
      if (t.tipo !== "despesa") continue;
      const chave = t.categoria?.trim() || "Outro";
      somaPorCategoria[chave] = (somaPorCategoria[chave] ?? 0) + Number(t.valor);
    }

    const ordenado = Object.entries(somaPorCategoria).sort((a, b) => b[1] - a[1]);
    const principais = ordenado.slice(0, MAX_CATEGORIAS);
    const resto = ordenado.slice(MAX_CATEGORIAS).reduce((s, [, v]) => s + v, 0);

    const itens = principais.map(([nome, valor], i) => ({ nome, valor, cor: CORES_CATEGORIA[i] }));
    if (resto > 0) itens.push({ nome: "Outros", valor: resto, cor: COR_OUTROS });

    const total = itens.reduce((s, it) => s + it.valor, 0);
    return itens.map((it) => ({ ...it, percentual: total > 0 ? (it.valor / total) * 100 : 0 }));
  }, [transacoes]);

  const total = segmentos.reduce((s, it) => s + it.valor, 0);

  if (segmentos.length === 0) {
    return <p className="auth-nota">Nenhuma despesa lançada ainda.</p>;
  }

  const raio = 60;
  const circunferencia = 2 * Math.PI * raio;
  const gap = 3;

  let acumulado = 0;

  return (
    <div className="grafico-financeiro grafico-financeiro-rosca">
      <svg viewBox="0 0 160 160" className="grafico-rosca-svg" role="img" aria-label="Despesas por categoria">
        <g transform="translate(80,80) rotate(-90)">
          {segmentos.map((s, i) => {
            const comprimento = (s.percentual / 100) * circunferencia - gap;
            const offset = -((acumulado / 100) * circunferencia);
            acumulado += s.percentual;
            const emHover = hoverIndex === i;
            return (
              <circle
                key={s.nome}
                r={raio}
                cx="0"
                cy="0"
                fill="none"
                stroke={s.cor}
                strokeWidth={emHover ? 24 : 20}
                strokeDasharray={`${Math.max(comprimento, 0)} ${circunferencia}`}
                strokeDashoffset={offset}
                style={{ cursor: "pointer", transition: "stroke-width 0.1s" }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            );
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" className="grafico-rosca-total-label">
          Total
        </text>
        <text x="80" y="92" textAnchor="middle" className="grafico-rosca-total-valor">
          {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
        </text>
      </svg>

      <ul className="grafico-rosca-legenda">
        {segmentos.map((s, i) => (
          <li
            key={s.nome}
            className={hoverIndex === i ? "ativo" : ""}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <span className="grafico-legenda-swatch" style={{ background: s.cor }} />
            <span className="grafico-rosca-legenda-nome">{s.nome}</span>
            <span className="grafico-rosca-legenda-valor">
              {formatMoeda(s.valor)} · {s.percentual.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
