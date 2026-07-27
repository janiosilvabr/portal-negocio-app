import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const PLANO_LABEL = { gratis: "Grátis", basico: "Básico", pro: "Pro" };
const STATUS_VEICULO_LABEL = { disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido", consignado: "Consignado" };
const TIPO_DOCUMENTO_LABEL = { contrato_compra_venda: "Contrato de Compra e Venda", contrato_consignacao: "Contrato de Consignação", recibo: "Recibo", outro: "Outro" };

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function AdminDetalheGaragem() {
  const { id } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  const [planoTrial, setPlanoTrial] = useState("basico");
  const [diasTrial, setDiasTrial] = useState(30);
  const [concedendoTrial, setConcedendoTrial] = useState(false);

  useEffect(() => {
    carregar();
  }, [id]);

  function carregar() {
    setCarregando(true);
    Promise.all([
      supabase.rpc("admin_detalhe_garagem", { p_empresa_id: id }).maybeSingle(),
      supabase.rpc("admin_veiculos_da_garagem", { p_empresa_id: id }),
      supabase.rpc("admin_documentos_da_garagem", { p_empresa_id: id }),
      supabase.rpc("admin_pagamentos_da_garagem", { p_empresa_id: id }),
    ]).then(([{ data: dataEmpresa, error: erroEmpresa }, { data: dataVeiculos }, { data: dataDocumentos }, { data: dataPagamentos }]) => {
      if (erroEmpresa) setErro(erroEmpresa.message);
      else setEmpresa(dataEmpresa);
      setVeiculos(dataVeiculos ?? []);
      setDocumentos(dataDocumentos ?? []);
      setPagamentos(dataPagamentos ?? []);
      setCarregando(false);
    });
  }

  async function handleAlterarAtivo() {
    const acao = empresa.ativo ? "desativar" : "reativar";
    const confirmado = window.confirm(`Quer ${acao} a garagem "${empresa.nome}"?`);
    if (!confirmado) return;

    setAlterandoStatus(true);
    const { error } = await supabase.rpc(
      empresa.ativo ? "admin_desativar_empresa" : "admin_reativar_empresa",
      { p_empresa_id: id }
    );
    setAlterandoStatus(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setErro("");
    setEmpresa((atual) => ({ ...atual, ativo: !atual.ativo }));
  }

  async function handleConcederTrial(e) {
    e.preventDefault();
    setErro("");
    setConcedendoTrial(true);

    const { error } = await supabase.rpc("admin_conceder_trial", {
      p_empresa_id: id,
      p_novo_plano: planoTrial,
      p_dias: Number(diasTrial),
    });

    setConcedendoTrial(false);

    if (error) {
      setErro(error.message);
      return;
    }

    carregar();
  }

  if (carregando) {
    return (
      <div className="page">
        <p>Carregando...</p>
      </div>
    );
  }

  if (erro && !empresa) {
    return (
      <div className="page">
        <p className="auth-erro">{erro}</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="page">
        <p className="auth-erro">Garagem não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{empresa.nome}</h1>
        <button type="button" className={empresa.ativo ? "botao-perigo" : ""} onClick={handleAlterarAtivo} disabled={alterandoStatus}>
          {alterandoStatus ? "Aguarde..." : empresa.ativo ? "Desativar garagem" : "Reativar garagem"}
        </button>
      </div>

      {erro && <p className="auth-erro">{erro}</p>}

      <div className="painel-secao">
        <h2>Dados da empresa</h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <p className="kpi-label">Plano</p>
            <p className="kpi-valor">{PLANO_LABEL[empresa.plano] ?? empresa.plano}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Status</p>
            <p className="kpi-valor">{empresa.ativo ? "Ativa" : "Desativada"}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Cadastro</p>
            <p className="kpi-valor">{formatData(empresa.created_at)}</p>
          </div>
        </div>
        <p className="auth-nota">CNPJ: {empresa.cnpj ?? "-"} · Cidade: {empresa.cidade ?? "-"}</p>
        <p className="auth-nota">Telefone: {empresa.telefone ?? "-"} · E-mail: {empresa.email ?? "-"}</p>
        {empresa.responsavel_legal_nome && (
          <p className="auth-nota">
            Responsável legal: {empresa.responsavel_legal_nome} ({empresa.responsavel_legal_cargo ?? "-"})
          </p>
        )}

        {empresa.trial_expira_em && (
          <p className="auth-aviso">
            ⚠ Teste grátis concedido — expira em {formatData(empresa.trial_expira_em)}. Não some
            sozinho: troque o plano manualmente quando terminar.
          </p>
        )}

        <form className="admin-trial-form" onSubmit={handleConcederTrial}>
          <label htmlFor="plano-trial">Conceder teste grátis</label>
          <div className="admin-trial-form-linha">
            <select id="plano-trial" value={planoTrial} onChange={(e) => setPlanoTrial(e.target.value)}>
              <option value="basico">Básico</option>
              <option value="pro">Pro</option>
            </select>
            <input
              type="number"
              min="1"
              value={diasTrial}
              onChange={(e) => setDiasTrial(e.target.value)}
              aria-label="Dias de teste"
            />
            <span className="auth-nota">dias</span>
            <button type="submit" disabled={concedendoTrial}>
              {concedendoTrial ? "Aplicando..." : "Conceder"}
            </button>
          </div>
        </form>
      </div>

      <div className="painel-secao">
        <h2>Histórico de pagamentos</h2>
        {pagamentos.length === 0 && <p className="auth-nota">Nenhum pagamento registrado ainda.</p>}
        {pagamentos.length > 0 && (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Plano</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.plano_nome}</td>
                    <td>{formatMoeda(p.valor)}</td>
                    <td>
                      <span className={`badge badge-${p.status}`}>{p.status}</span>
                    </td>
                    <td>{formatData(p.data_pagamento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="painel-secao">
        <h2>Veículos cadastrados ({veiculos.length})</h2>
        {veiculos.length === 0 && <p className="auth-nota">Nenhum veículo cadastrado ainda.</p>}
        {veiculos.length > 0 && (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Ano</th>
                  <th>Preço</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {veiculos.map((v) => (
                  <tr key={v.id}>
                    <td>{v.marca} {v.modelo}</td>
                    <td>{v.ano_modelo ?? "-"}</td>
                    <td>{formatMoeda(v.preco)}</td>
                    <td>{STATUS_VEICULO_LABEL[v.status] ?? v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="painel-secao">
        <h2>Documentos gerados ({documentos.length})</h2>
        {documentos.length === 0 && <p className="auth-nota">Nenhum documento gerado ainda.</p>}
        {documentos.length > 0 && (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Gerado em</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((d) => (
                  <tr key={d.id}>
                    <td>{TIPO_DOCUMENTO_LABEL[d.tipo] ?? d.tipo}</td>
                    <td>{d.status}</td>
                    <td>{formatData(d.gerado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
