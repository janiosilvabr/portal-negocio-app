import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function montarTextoWhatsApp(a) {
  const cpt =
    Number(a.custo_mecanica ?? 0) +
    Number(a.custo_estetica ?? 0) +
    Number(a.reserva_garantia ?? 0) +
    Number(a.outros_custos ?? 0);

  const linhas = [
    `📋 Simulação PMC — ${a.descricao_veiculo || TIPO_LABEL[a.tipo_veiculo] || "Veículo"}`,
    `Tipo: ${TIPO_LABEL[a.tipo_veiculo] ?? a.tipo_veiculo ?? "-"}`,
    "",
    `PVP (valor de mercado): ${formatMoeda(a.pvp)}`,
    `Lucro desejado: ${formatMoeda(a.lucro_desejado)}`,
    "",
    "Custos de preparação (CPT):",
    `- Mecânica: ${formatMoeda(a.custo_mecanica)}`,
    `- Estética: ${formatMoeda(a.custo_estetica)}`,
    `- Reserva de garantia: ${formatMoeda(a.reserva_garantia)}`,
    `- Outros custos: ${formatMoeda(a.outros_custos)}`,
    `Total CPT: ${formatMoeda(cpt)}`,
    "",
    `💰 PMC (Preço Máximo de Compra): ${formatMoeda(a.pmc_calculado)}`,
  ];

  if (a.pmc_calculado < 0) {
    linhas.push("⚠️ PVP insuficiente para cobrir custos e lucro desejado.");
  }

  if (a.preco_pedido_vendedor != null) {
    linhas.push("");
    linhas.push(`Preço pedido pelo vendedor: ${formatMoeda(a.preco_pedido_vendedor)}`);
    linhas.push(
      a.preco_pedido_vendedor <= a.pmc_calculado
        ? "✅ Dentro do PMC — negócio viável."
        : "❌ Acima do PMC — negociar ou repensar."
    );
  }

  return linhas.join("\n");
}

export default function VerAvaliacaoPMC() {
  const { id } = useParams();
  const [avaliacao, setAvaliacao] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [vinculando, setVinculando] = useState(false);

  useEffect(() => {
    carregar();
  }, [id]);

  function carregar() {
    setCarregando(true);
    Promise.all([
      supabase.from("avaliacoes_pmc").select("*, veiculos(marca, modelo)").eq("id", id).maybeSingle(),
      supabase.from("veiculos").select("id, marca, modelo").order("created_at", { ascending: false }),
    ]).then(([{ data, error }, { data: dataVeiculos }]) => {
      if (error) setErro(error.message);
      else if (!data) setErro("Simulação não encontrada.");
      else setAvaliacao(data);
      setVeiculos(dataVeiculos ?? []);
      setCarregando(false);
    });
  }

  async function handleCopiar() {
    await navigator.clipboard.writeText(montarTextoWhatsApp(avaliacao));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function handleVincular(e) {
    e.preventDefault();
    if (!veiculoSelecionado) return;

    setVinculando(true);
    const { error } = await supabase
      .from("avaliacoes_pmc")
      .update({ veiculo_id: veiculoSelecionado })
      .eq("id", id);
    setVinculando(false);

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

  if (erro && !avaliacao) {
    return (
      <div className="page">
        <p className="auth-erro">{erro}</p>
      </div>
    );
  }

  const cpt =
    Number(avaliacao.custo_mecanica ?? 0) +
    Number(avaliacao.custo_estetica ?? 0) +
    Number(avaliacao.reserva_garantia ?? 0) +
    Number(avaliacao.outros_custos ?? 0);

  return (
    <div className="page">
      <div className="page-header no-print">
        <h1>Simulação PMC</h1>
        <div className="documento-acoes">
          <button type="button" onClick={handleCopiar}>
            {copiado ? "Copiado!" : "Copiar para WhatsApp"}
          </button>
          <button type="button" onClick={() => window.print()}>
            Gerar PDF
          </button>
        </div>
      </div>

      {erro && <p className="auth-erro no-print">{erro}</p>}

      <div className="documento-conteudo pmc-resultado-conteudo">
        <h2>{avaliacao.descricao_veiculo || avaliacao.veiculos?.marca + " " + avaliacao.veiculos?.modelo || "Veículo"}</h2>
        <p className="auth-nota">
          {TIPO_LABEL[avaliacao.tipo_veiculo] ?? avaliacao.tipo_veiculo} · Simulado em {formatData(avaliacao.created_at)}
          {avaliacao.veiculos && ` · Vinculado a ${avaliacao.veiculos.marca} ${avaliacao.veiculos.modelo}`}
        </p>

        <ul className="termometro-detalhe">
          <li>PVP (valor de mercado): {formatMoeda(avaliacao.pvp)}</li>
          <li>Lucro desejado: {formatMoeda(avaliacao.lucro_desejado)}</li>
          <li>Mecânica: {formatMoeda(avaliacao.custo_mecanica)}</li>
          <li>Estética: {formatMoeda(avaliacao.custo_estetica)}</li>
          <li>Reserva de garantia: {formatMoeda(avaliacao.reserva_garantia)}</li>
          <li>Outros custos: {formatMoeda(avaliacao.outros_custos)}</li>
          <li>
            <strong>Total CPT: {formatMoeda(cpt)}</strong>
          </li>
        </ul>

        <div className={`pmc-resultado ${avaliacao.pmc_calculado < 0 ? "pmc-resultado-negativo" : "pmc-resultado-positivo"}`}>
          <p className="pmc-resultado-label">PMC — Preço Máximo de Compra</p>
          <p className="pmc-resultado-valor">{formatMoeda(avaliacao.pmc_calculado)}</p>
          {avaliacao.pmc_calculado < 0 && (
            <p className="pmc-alerta">
              ⚠️ PVP insuficiente para cobrir os custos de preparação e o lucro desejado.
            </p>
          )}
        </div>

        {avaliacao.preco_pedido_vendedor != null && (
          <p className={avaliacao.preco_pedido_vendedor <= avaliacao.pmc_calculado ? "pmc-viavel" : "pmc-inviavel"}>
            Preço pedido pelo vendedor: {formatMoeda(avaliacao.preco_pedido_vendedor)} —{" "}
            {avaliacao.preco_pedido_vendedor <= avaliacao.pmc_calculado
              ? "dentro do PMC, negócio viável."
              : "acima do PMC calculado."}
          </p>
        )}
      </div>

      <div className="no-print">
        {!avaliacao.veiculo_id ? (
          <form className="form-card pmc-vincular-form" onSubmit={handleVincular}>
            <h2>Vincular a um veículo já cadastrado</h2>
            <div className="form-grid">
              <div>
                <label htmlFor="veiculoSelecionado">Veículo</label>
                <select
                  id="veiculoSelecionado"
                  value={veiculoSelecionado}
                  onChange={(e) => setVeiculoSelecionado(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={vinculando || !veiculoSelecionado}>
              {vinculando ? "Vinculando..." : "Vincular"}
            </button>
          </form>
        ) : (
          <p className="auth-nota">
            Vinculado a {avaliacao.veiculos?.marca} {avaliacao.veiculos?.modelo}.
          </p>
        )}

        <p className="auth-nota" style={{ marginTop: 16 }}>
          <Link to="/calc-pmc">← Voltar para simulações</Link>
        </p>
      </div>
    </div>
  );
}
