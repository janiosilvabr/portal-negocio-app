import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(iso) {
  if (!iso) return "-";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function ExtratoVendedor() {
  const { perfil } = useAuth();
  const [comissoes, setComissoes] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadsConvertidos, setLeadsConvertidos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!perfil?.id) return;

    Promise.all([
      supabase
        .from("transacoes_financeiras")
        .select("*")
        .eq("vendedor_id", perfil.id)
        .order("data", { ascending: false }),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("vendedor_id", perfil.id),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("vendedor_id", perfil.id)
        .eq("status", "convertido"),
    ]).then(([{ data: dataComissoes, error }, { count: countLeads }, { count: countConvertidos }]) => {
      if (error) setErro(error.message);
      else setComissoes(dataComissoes);
      setTotalLeads(countLeads ?? 0);
      setLeadsConvertidos(countConvertidos ?? 0);
      setCarregando(false);
    });
  }, [perfil?.id]);

  const totalPago = comissoes.filter((c) => c.status === "pago").reduce((s, c) => s + Number(c.valor), 0);
  const totalPendente = comissoes
    .filter((c) => c.status === "pendente")
    .reduce((s, c) => s + Number(c.valor), 0);
  const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : null;

  return (
    <div className="page">
      <h1>Meu extrato</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-label">Comissão paga</p>
              <p className="kpi-valor kpi-positivo">{formatMoeda(totalPago)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Comissão pendente</p>
              <p className="kpi-valor">{formatMoeda(totalPendente)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Leads recebidos</p>
              <p className="kpi-valor">{totalLeads}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Taxa de conversão</p>
              <p className="kpi-valor">{taxaConversao != null ? `${taxaConversao.toFixed(1)}%` : "-"}</p>
            </div>
          </div>

          <h2>Histórico de comissões</h2>

          {comissoes.length === 0 && <p className="auth-nota">Nenhuma comissão registrada ainda.</p>}

          {comissoes.length > 0 && (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Status</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {comissoes.map((c) => (
                    <tr key={c.id}>
                      <td>{formatData(c.data)}</td>
                      <td>{c.descricao ?? "-"}</td>
                      <td>
                        <span className={`badge badge-${c.status}`}>
                          {c.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td>{formatMoeda(c.valor)}</td>
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
