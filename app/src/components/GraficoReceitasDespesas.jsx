import { useMemo, useState } from "react";

const COR_RECEITA = "#2a78d6";
const COR_DESPESA = "#e34948";

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ultimosSeisMeses() {
  const meses = [];
  const hoje = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({ ano: d.getFullYear(), mes: d.getMonth(), chave: `${d.getFullYear()}-${d.getMonth()}` });
  }
  return meses;
}

// Gráfico de barras agrupadas (Receita x Despesa), últimos 6 meses.
// SVG desenhado à mão (sem biblioteca) para manter o bundle leve.
export function GraficoReceitasDespesas({ transacoes }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const dados = useMemo(() => {
    const meses = ultimosSeisMeses();
    const porMes = Object.fromEntries(meses.map((m) => [m.chave, { receita: 0, despesa: 0 }]));

    for (const t of transacoes) {
      const d = new Date(`${t.data}T00:00:00`);
      const chave = `${d.getFullYear()}-${d.getMonth()}`;
      if (!porMes[chave]) continue;
      if (t.tipo === "receita") porMes[chave].receita += Number(t.valor);
      else if (t.tipo === "despesa") porMes[chave].despesa += Number(t.valor);
    }

    return meses.map((m) => ({
      label: new Date(m.ano, m.mes, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      ...porMes[m.chave],
    }));
  }, [transacoes]);

  const maxValor = Math.max(1, ...dados.map((d) => Math.max(d.receita, d.despesa)));

  const largura = 560;
  const altura = 220;
  const margemEsq = 44;
  const margemBaixo = 24;
  const areaLargura = largura - margemEsq - 12;
  const areaAltura = altura - margemBaixo - 12;
  const larguraGrupo = areaLargura / dados.length;
  const larguraBarra = larguraGrupo * 0.3;

  const linhasGrade = 4;

  return (
    <div className="grafico-financeiro">
      <div className="grafico-financeiro-legenda">
        <span className="grafico-legenda-item">
          <span className="grafico-legenda-swatch" style={{ background: COR_RECEITA }} /> Receita
        </span>
        <span className="grafico-legenda-item">
          <span className="grafico-legenda-swatch" style={{ background: COR_DESPESA }} /> Despesa
        </span>
      </div>

      <svg viewBox={`0 0 ${largura} ${altura}`} className="grafico-financeiro-svg" role="img" aria-label="Receitas e despesas dos últimos 6 meses">
        {Array.from({ length: linhasGrade + 1 }).map((_, i) => {
          const y = 12 + (areaAltura / linhasGrade) * i;
          const valor = maxValor - (maxValor / linhasGrade) * i;
          return (
            <g key={i}>
              <line x1={margemEsq} y1={y} x2={largura - 8} y2={y} stroke="#e1e0d9" strokeWidth="1" />
              <text x={margemEsq - 6} y={y + 3} textAnchor="end" className="grafico-eixo-texto">
                {valor >= 1000 ? `${(valor / 1000).toFixed(0)}k` : valor.toFixed(0)}
              </text>
            </g>
          );
        })}

        {dados.map((d, i) => {
          const xGrupo = margemEsq + larguraGrupo * i;
          const alturaReceita = (d.receita / maxValor) * areaAltura;
          const alturaDespesa = (d.despesa / maxValor) * areaAltura;
          const yBase = 12 + areaAltura;
          const emHover = hoverIndex === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={xGrupo}
                y={12}
                width={larguraGrupo}
                height={areaAltura}
                fill={emHover ? "rgba(26,39,68,0.04)" : "transparent"}
              />
              <rect
                x={xGrupo + larguraGrupo / 2 - larguraBarra - 2}
                y={yBase - alturaReceita}
                width={larguraBarra}
                height={Math.max(alturaReceita, 1)}
                rx="3"
                fill={COR_RECEITA}
              />
              <rect
                x={xGrupo + larguraGrupo / 2 + 2}
                y={yBase - alturaDespesa}
                width={larguraBarra}
                height={Math.max(alturaDespesa, 1)}
                rx="3"
                fill={COR_DESPESA}
              />
              <text x={xGrupo + larguraGrupo / 2} y={altura - 4} textAnchor="middle" className="grafico-eixo-texto">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverIndex != null && (
        <div className="grafico-tooltip">
          <strong>{dados[hoverIndex].label}</strong>
          <span>Receita: {formatMoeda(dados[hoverIndex].receita)}</span>
          <span>Despesa: {formatMoeda(dados[hoverIndex].despesa)}</span>
        </div>
      )}
    </div>
  );
}
