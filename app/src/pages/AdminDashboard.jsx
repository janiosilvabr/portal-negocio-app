import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase
      .rpc("admin_dashboard_kpis")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setKpis(data);
        setCarregando(false);
      });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Painel Admin — Portal Negócio</h1>
        <Link to="/admin/garagens" className="botao-link">
          Ver garagens
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && kpis && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-label">Garagens ativas</p>
              <p className="kpi-valor">{kpis.total_garagens}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">MRR (receita recorrente/mês)</p>
              <p className="kpi-valor kpi-positivo">{formatMoeda(kpis.mrr)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Total de veículos no sistema</p>
              <p className="kpi-valor">{kpis.total_veiculos}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Negócios fechados (todos)</p>
              <p className="kpi-valor">{kpis.total_negocios_fechados}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Documentos gerados (todos)</p>
              <p className="kpi-valor">{kpis.total_documentos_gerados}</p>
            </div>
          </div>

          <div className="painel-secao">
            <h2>Garagens por plano</h2>
            <div className="kpi-grid">
              <div className="kpi-card">
                <p className="kpi-label">Grátis</p>
                <p className="kpi-valor">{kpis.garagens_gratis}</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-label">Básico</p>
                <p className="kpi-valor">{kpis.garagens_basico}</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-label">Pro</p>
                <p className="kpi-valor">{kpis.garagens_pro}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
