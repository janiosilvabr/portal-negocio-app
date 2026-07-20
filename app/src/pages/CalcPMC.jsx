import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const TIPO_LABEL = {
  moto: "Moto",
  carro: "Carro",
  utilitario_suv: "Utilitário/SUV",
};

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function CalcPMC() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase
      .from("avaliacoes_pmc")
      .select("*, veiculos(marca, modelo)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setAvaliacoes(data);
        setCarregando(false);
      });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Calc. PMC</h1>
        <Link to="/calc-pmc/nova" className="botao-link">
          + Nova Simulação
        </Link>
      </div>
      <p className="auth-nota">Preço Máximo de Compra — quanto pagar por um veículo sem perder a margem.</p>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && avaliacoes.length === 0 && (
        <p className="auth-nota">Nenhuma simulação feita ainda.</p>
      )}

      {avaliacoes.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Tipo</th>
                <th>PVP</th>
                <th>PMC</th>
                <th>Vinculado</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {avaliacoes.map((a) => (
                <tr key={a.id}>
                  <td>{a.veiculos ? `${a.veiculos.marca} ${a.veiculos.modelo}` : a.descricao_veiculo ?? "-"}</td>
                  <td>{TIPO_LABEL[a.tipo_veiculo] ?? a.tipo_veiculo ?? "-"}</td>
                  <td>{formatMoeda(a.pvp)}</td>
                  <td className={Number(a.pmc_calculado) < 0 ? "kpi-negativo" : "kpi-positivo"}>
                    {formatMoeda(a.pmc_calculado)}
                  </td>
                  <td>{a.veiculo_id ? "Sim" : "-"}</td>
                  <td>{formatData(a.created_at)}</td>
                  <td>
                    <Link to={`/calc-pmc/${a.id}`}>Abrir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
