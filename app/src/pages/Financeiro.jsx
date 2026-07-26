import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { GraficoReceitasDespesas } from "../components/GraficoReceitasDespesas";
import { GraficoDespesasPorCategoria } from "../components/GraficoDespesasPorCategoria";

const STATUS_LABEL = {
  pago: "Pago",
  pendente: "Pendente",
};

const FORMA_PAGAMENTO_LABEL = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
  boleto: "Boleto",
  outro: "Outro",
};

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(iso) {
  if (!iso) return "-";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

function dataDentroDoPeriodo(dataIso, periodo, inicioPersonalizado, fimPersonalizado) {
  if (periodo === "todos") return true;

  const data = new Date(`${dataIso}T00:00:00`);
  const hoje = new Date();

  if (periodo === "mes_atual") {
    return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth();
  }

  if (periodo === "ultimos_3_meses") {
    const limite = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
    return data >= limite;
  }

  if (periodo === "personalizado") {
    if (inicioPersonalizado && data < new Date(`${inicioPersonalizado}T00:00:00`)) return false;
    if (fimPersonalizado && data > new Date(`${fimPersonalizado}T00:00:00`)) return false;
    return true;
  }

  return true;
}

export default function Financeiro() {
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState(null);

  const [periodo, setPeriodo] = useState("mes_atual");
  const [inicioPersonalizado, setInicioPersonalizado] = useState("");
  const [fimPersonalizado, setFimPersonalizado] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    supabase
      .from("transacoes_financeiras")
      .select("*")
      .order("data", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setTransacoes(data);
        setCarregando(false);
      });
  }

  async function handleExcluir(transacao) {
    const confirmado = window.confirm(
      `Excluir a transação "${transacao.descricao ?? transacao.categoria ?? "sem descrição"}" (${formatMoeda(transacao.valor)})? Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    setExcluindoId(transacao.id);
    const { error } = await supabase.from("transacoes_financeiras").delete().eq("id", transacao.id);
    setExcluindoId(null);

    if (error) {
      setErro(error.message);
      return;
    }

    setErro("");
    setTransacoes((atual) => atual.filter((t) => t.id !== transacao.id));
  }

  const totalReceitas = transacoes.filter((t) => t.tipo === "receita").reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = transacoes.filter((t) => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);
  const lucroLiquido = totalReceitas - totalDespesas;
  const totalPendente = transacoes.filter((t) => t.status === "pendente").reduce((s, t) => s + Number(t.valor), 0);

  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((t) => {
      if (!dataDentroDoPeriodo(t.data, periodo, inicioPersonalizado, fimPersonalizado)) return false;
      if (tipoFiltro && t.tipo !== tipoFiltro) return false;
      if (statusFiltro && t.status !== statusFiltro) return false;
      return true;
    });
  }, [transacoes, periodo, inicioPersonalizado, fimPersonalizado, tipoFiltro, statusFiltro]);

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

          <div className="financeiro-graficos">
            <div className="painel-secao">
              <h2>Receitas × Despesas (últimos 6 meses)</h2>
              <GraficoReceitasDespesas transacoes={transacoes} />
            </div>
            <div className="painel-secao">
              <h2>Despesas por categoria</h2>
              <GraficoDespesasPorCategoria transacoes={transacoes} />
            </div>
          </div>

          <div className="painel-secao">
            <div className="financeiro-filtros">
              <div>
                <label htmlFor="filtro-periodo">Período</label>
                <select id="filtro-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                  <option value="mes_atual">Mês atual</option>
                  <option value="ultimos_3_meses">Últimos 3 meses</option>
                  <option value="personalizado">Personalizado</option>
                  <option value="todos">Todos</option>
                </select>
              </div>

              {periodo === "personalizado" && (
                <>
                  <div>
                    <label htmlFor="filtro-inicio">De</label>
                    <input
                      id="filtro-inicio"
                      type="date"
                      value={inicioPersonalizado}
                      onChange={(e) => setInicioPersonalizado(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="filtro-fim">Até</label>
                    <input
                      id="filtro-fim"
                      type="date"
                      value={fimPersonalizado}
                      onChange={(e) => setFimPersonalizado(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="filtro-tipo">Tipo</label>
                <select id="filtro-tipo" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>

              <div>
                <label htmlFor="filtro-status">Status</label>
                <select id="filtro-status" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>

            {transacoesFiltradas.length === 0 && (
              <p className="auth-nota">Nenhuma transação encontrada para esse filtro.</p>
            )}

            {transacoesFiltradas.length > 0 && (
              <div className="tabela-wrap">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Forma de Pagamento</th>
                      <th>Status</th>
                      <th>Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoesFiltradas.map((t) => (
                      <tr key={t.id}>
                        <td>{formatData(t.data)}</td>
                        <td>{t.descricao ?? "-"}</td>
                        <td>{t.categoria ?? "-"}</td>
                        <td>{FORMA_PAGAMENTO_LABEL[t.forma_pagamento] ?? "-"}</td>
                        <td>
                          <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status] ?? t.status}</span>
                        </td>
                        <td className={t.tipo === "receita" ? "kpi-positivo" : "kpi-negativo"}>
                          {t.tipo === "receita" ? "+" : "−"} {formatMoeda(t.valor)}
                        </td>
                        <td className="tabela-acoes">
                          <Link to={`/financeiro/${t.id}`}>Editar</Link>
                          <button
                            type="button"
                            className="link-perigo"
                            onClick={() => handleExcluir(t)}
                            disabled={excluindoId === t.id}
                          >
                            {excluindoId === t.id ? "Excluindo..." : "Excluir"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
