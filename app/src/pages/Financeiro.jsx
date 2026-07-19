import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const STATUS_LABEL = {
  pago: "Pago",
  pendente: "Pendente",
};

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(iso) {
  if (!iso) return "-";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function Financeiro() {
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase
      .from("transacoes_financeiras")
      .select("*")
      .order("data", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setTransacoes(data);
        setCarregando(false);
      });
  }, []);

  const totalReceitas = transacoes.filter((t) => t.tipo === "receita").reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = transacoes.filter((t) => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);
  const lucroLiquido = totalReceitas - totalDespesas;
  const totalPendente = transacoes.filter((t) => t.status === "pendente").reduce((s, t) => s + Number(t.valor), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Financeiro</h1>
        <Link to="/financeiro/nova" className="botao-link">
          + Nova Transação
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-label">Total de Receitas</p>
              <p className="kpi-valor kpi-positivo">{formatMoeda(totalReceitas)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Total de Despesas</p>
              <p className="kpi-valor kpi-negativo">{formatMoeda(totalDespesas)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Lucro Líquido</p>
              <p className={`kpi-valor ${lucroLiquido >= 0 ? "kpi-positivo" : "kpi-negativo"}`}>
                {formatMoeda(lucroLiquido)}
              </p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Pendente</p>
              <p className="kpi-valor">{formatMoeda(totalPendente)}</p>
            </div>
          </div>

          {transacoes.length === 0 && <p className="auth-nota">Nenhuma transação lançada ainda.</p>}

          {transacoes.length > 0 && (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoes.map((t) => (
                    <tr key={t.id}>
                      <td>{formatData(t.data)}</td>
                      <td>{t.descricao ?? "-"}</td>
                      <td>{t.categoria ?? "-"}</td>
                      <td>
                        <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status] ?? t.status}</span>
                      </td>
                      <td className={t.tipo === "receita" ? "kpi-positivo" : "kpi-negativo"}>
                        {t.tipo === "receita" ? "+" : "−"} {formatMoeda(t.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
