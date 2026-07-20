import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function inicioDoMes() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
}

export default function IndiceConversao() {
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const desde = inicioDoMes();

    Promise.all([
      supabase.rpc("listar_equipe_empresa"),
      supabase.from("negocios").select("vendedor_id, valor").eq("status", "fechado").gte("data_fechamento", desde),
      supabase
        .from("transacoes_financeiras")
        .select("vendedor_id, valor")
        .eq("categoria", "comissao")
        .gte("data", desde),
      supabase.from("leads").select("vendedor_id, status"),
    ]).then(([{ data: usuarios, error }, { data: negocios }, { data: comissoes }, { data: leads }]) => {
      if (error) {
        setErro(error.message);
        setCarregando(false);
        return;
      }

      const linhasCalculadas = (usuarios ?? [])
        .filter((u) => u.ativo)
        .map((u) => {
          const negociosDoVendedor = (negocios ?? []).filter((n) => n.vendedor_id === u.id);
          const comissaoDoVendedor = (comissoes ?? [])
            .filter((c) => c.vendedor_id === u.id)
            .reduce((s, c) => s + Number(c.valor), 0);
          const leadsDoVendedor = (leads ?? []).filter((l) => l.vendedor_id === u.id);
          const leadsConvertidos = leadsDoVendedor.filter((l) => l.status === "convertido").length;
          const taxaConversao =
            leadsDoVendedor.length > 0 ? (leadsConvertidos / leadsDoVendedor.length) * 100 : null;

          return {
            id: u.id,
            nome: u.nome,
            negociosFechados: negociosDoVendedor.length,
            valorVendido: negociosDoVendedor.reduce((s, n) => s + Number(n.valor ?? 0), 0),
            comissaoTotal: comissaoDoVendedor,
            totalLeads: leadsDoVendedor.length,
            taxaConversao,
          };
        })
        .sort((a, b) => b.negociosFechados - a.negociosFechados || b.valorVendido - a.valorVendido);

      setLinhas(linhasCalculadas);
      setCarregando(false);
    });
  }, []);

  return (
    <div className="page">
      <h1>Índice de Conversão</h1>
      <p className="auth-nota">Negócios fechados e comissão do mês atual, por vendedor.</p>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && linhas.length === 0 && (
        <p className="auth-nota">Nenhum vendedor cadastrado ainda.</p>
      )}

      {!carregando && !erro && linhas.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Negócios fechados (mês)</th>
                <th>Valor vendido (mês)</th>
                <th>Comissão (mês)</th>
                <th>Taxa de conversão</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id}>
                  <td>{l.nome}</td>
                  <td>{l.negociosFechados}</td>
                  <td>{formatMoeda(l.valorVendido)}</td>
                  <td>{formatMoeda(l.comissaoTotal)}</td>
                  <td>{l.taxaConversao != null ? `${l.taxaConversao.toFixed(1)}%` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
