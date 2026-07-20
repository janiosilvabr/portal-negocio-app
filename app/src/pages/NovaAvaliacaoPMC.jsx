import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const RESERVA_SUGERIDA = { moto: 400, carro: 1200, utilitario_suv: 1800 };

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function NovaAvaliacaoPMC() {
  const navigate = useNavigate();
  const { perfil } = useAuth();

  const [descricaoVeiculo, setDescricaoVeiculo] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("carro");
  const [pvp, setPvp] = useState("");
  const [lucroDesejado, setLucroDesejado] = useState("");
  const [custoMecanica, setCustoMecanica] = useState("");
  const [custoEstetica, setCustoEstetica] = useState("");
  const [reservaGarantia, setReservaGarantia] = useState(String(RESERVA_SUGERIDA.carro));
  const [reservaEditadaManualmente, setReservaEditadaManualmente] = useState(false);
  const [outrosCustos, setOutrosCustos] = useState("");
  const [precoPedidoVendedor, setPrecoPedidoVendedor] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function handleTipoChange(e) {
    const novoTipo = e.target.value;
    setTipoVeiculo(novoTipo);
    if (!reservaEditadaManualmente) {
      setReservaGarantia(String(RESERVA_SUGERIDA[novoTipo] ?? 0));
    }
  }

  function handleReservaChange(e) {
    setReservaGarantia(e.target.value);
    setReservaEditadaManualmente(true);
  }

  const pvpNum = Number(pvp) || 0;
  const lucroNum = Number(lucroDesejado) || 0;
  const cpt =
    (Number(custoMecanica) || 0) +
    (Number(custoEstetica) || 0) +
    (Number(reservaGarantia) || 0) +
    (Number(outrosCustos) || 0);
  const pmc = pvpNum - cpt - lucroNum;
  const precoNum = precoPedidoVendedor ? Number(precoPedidoVendedor) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!perfil?.empresa_id) {
      setErro("Perfil da empresa ainda não carregado. Aguarde um instante e tente de novo.");
      return;
    }
    if (!pvp) {
      setErro("Informe o PVP (preço de venda praticável).");
      return;
    }

    setSalvando(true);

    const { data, error } = await supabase
      .from("avaliacoes_pmc")
      .insert({
        empresa_id: perfil.empresa_id,
        usuario_id: perfil.id,
        veiculo_id: null,
        descricao_veiculo: descricaoVeiculo || null,
        tipo_veiculo: tipoVeiculo,
        pvp: pvpNum,
        lucro_desejado: lucroNum,
        custo_mecanica: Number(custoMecanica) || 0,
        custo_estetica: Number(custoEstetica) || 0,
        reserva_garantia: Number(reservaGarantia) || 0,
        outros_custos: Number(outrosCustos) || 0,
        preco_pedido_vendedor: precoNum,
        pmc_calculado: pmc,
      })
      .select()
      .single();

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate(`/calc-pmc/${data.id}`);
  }

  return (
    <div className="page">
      <h1>Nova simulação — Calc. PMC</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Identificação do veículo</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="descricaoVeiculo">Descrição (marca/modelo/ano)</label>
            <input
              id="descricaoVeiculo"
              placeholder="Ex.: Fiat Argo 2021"
              value={descricaoVeiculo}
              onChange={(e) => setDescricaoVeiculo(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="tipoVeiculo">Tipo</label>
            <select id="tipoVeiculo" value={tipoVeiculo} onChange={handleTipoChange}>
              <option value="moto">Moto</option>
              <option value="carro">Carro</option>
              <option value="utilitario_suv">Utilitário/SUV</option>
            </select>
          </div>
        </div>

        <h2>Parâmetros principais</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="pvp">PVP — Preço de Venda Praticável (R$) *</label>
            <input id="pvp" type="number" min="0" step="0.01" value={pvp} onChange={(e) => setPvp(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="lucroDesejado">Lucro desejado (R$)</label>
            <input
              id="lucroDesejado"
              type="number"
              min="0"
              step="0.01"
              value={lucroDesejado}
              onChange={(e) => setLucroDesejado(e.target.value)}
            />
          </div>
        </div>

        <h2>Custos de preparação (CPT)</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="custoMecanica">Mecânica (R$)</label>
            <input
              id="custoMecanica"
              type="number"
              min="0"
              step="0.01"
              value={custoMecanica}
              onChange={(e) => setCustoMecanica(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="custoEstetica">Estética (R$)</label>
            <input
              id="custoEstetica"
              type="number"
              min="0"
              step="0.01"
              value={custoEstetica}
              onChange={(e) => setCustoEstetica(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="reservaGarantia">Reserva de garantia (R$)</label>
            <input
              id="reservaGarantia"
              type="number"
              min="0"
              step="0.01"
              value={reservaGarantia}
              onChange={handleReservaChange}
            />
            <p className="auth-nota campo-nota">
              Sugestão automática para {tipoVeiculo === "utilitario_suv" ? "utilitário/SUV" : tipoVeiculo}: {formatMoeda(RESERVA_SUGERIDA[tipoVeiculo])} — pode editar.
            </p>
          </div>
          <div>
            <label htmlFor="outrosCustos">Outros custos (logística, guincho...) (R$)</label>
            <input
              id="outrosCustos"
              type="number"
              min="0"
              step="0.01"
              value={outrosCustos}
              onChange={(e) => setOutrosCustos(e.target.value)}
            />
          </div>
        </div>
        <p className="pmc-total-cpt">Total CPT: {formatMoeda(cpt)}</p>

        <h2>Resultado</h2>
        <div className={`pmc-resultado ${pmc < 0 ? "pmc-resultado-negativo" : "pmc-resultado-positivo"}`}>
          <p className="pmc-resultado-label">PMC — Preço Máximo de Compra</p>
          <p className="pmc-resultado-valor">{formatMoeda(pmc)}</p>
          {pmc < 0 && (
            <p className="pmc-alerta">
              ⚠️ PVP insuficiente para cobrir os custos de preparação e o lucro desejado.
            </p>
          )}
        </div>

        <h2>Análise de viabilidade</h2>
        <div>
          <label htmlFor="precoPedidoVendedor">Preço pedido pelo vendedor atual (opcional, R$)</label>
          <input
            id="precoPedidoVendedor"
            type="number"
            min="0"
            step="0.01"
            value={precoPedidoVendedor}
            onChange={(e) => setPrecoPedidoVendedor(e.target.value)}
          />
        </div>
        {precoNum != null && (
          <p className={precoNum <= pmc ? "pmc-viavel" : "pmc-inviavel"}>
            {precoNum <= pmc
              ? `Negócio viável: o preço pedido está R$ ${(pmc - precoNum).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} abaixo do PMC.`
              : `Acima do PMC em ${formatMoeda(precoNum - pmc)} — negociar o preço ou repensar a compra.`}
          </p>
        )}

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar simulação"}
        </button>
      </form>
    </div>
  );
}
