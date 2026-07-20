import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function NovoLead() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");
  const [origem, setOrigem] = useState("site");
  const [orcamentoMaximo, setOrcamentoMaximo] = useState("");
  const [tipoCarroceriaDesejado, setTipoCarroceriaDesejado] = useState("");
  const [cambioDesejado, setCambioDesejado] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    supabase
      .from("clientes")
      .select("id, nome")
      .order("nome")
      .then(({ data }) => setClientes(data ?? []));

    supabase
      .from("veiculos")
      .select("id, marca, modelo")
      .order("created_at", { ascending: false })
      .then(({ data }) => setVeiculos(data ?? []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!perfil?.empresa_id) {
      setErro("Perfil da empresa ainda não carregado. Aguarde um instante e tente de novo.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("leads").insert({
      empresa_id: perfil.empresa_id,
      cliente_id: clienteId || null,
      veiculo_id: veiculoId || null,
      origem,
      status: "novo",
      vendedor_id: perfil.id,
      orcamento_maximo: orcamentoMaximo ? Number(orcamentoMaximo) : null,
      tipo_carroceria_desejado: tipoCarroceriaDesejado || null,
      cambio_desejado: cambioDesejado || null,
      observacoes: observacoes || null,
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/leads");
  }

  return (
    <div className="page">
      <h1>Novo lead</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="cliente">Cliente</label>
            <select id="cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Não identificado ainda</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="veiculo">Veículo de interesse</label>
            <select id="veiculo" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
              <option value="">Nenhum em específico</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="origem">Origem</label>
            <select id="origem" value={origem} onChange={(e) => setOrigem(e.target.value)}>
              <option value="site">Site</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="indicacao">Indicação</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="orcamentoMaximo">Orçamento máximo (R$)</label>
            <input
              id="orcamentoMaximo"
              type="number"
              min="0"
              step="0.01"
              value={orcamentoMaximo}
              onChange={(e) => setOrcamentoMaximo(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="tipoCarroceriaDesejado">Tipo de carroceria desejado</label>
            <select
              id="tipoCarroceriaDesejado"
              value={tipoCarroceriaDesejado}
              onChange={(e) => setTipoCarroceriaDesejado(e.target.value)}
            >
              <option value="">Qualquer</option>
              <option value="sedan">Sedã</option>
              <option value="suv">SUV</option>
              <option value="hatch">Hatch</option>
              <option value="pickup">Picape</option>
              <option value="utilitario">Utilitário</option>
              <option value="moto">Moto</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="cambioDesejado">Câmbio desejado</label>
            <select
              id="cambioDesejado"
              value={cambioDesejado}
              onChange={(e) => setCambioDesejado(e.target.value)}
            >
              <option value="">Qualquer</option>
              <option value="Manual">Manual</option>
              <option value="Automático">Automático</option>
              <option value="CVT">CVT</option>
              <option value="Automatizado">Automatizado</option>
            </select>
          </div>
        </div>

        <label htmlFor="observacoes">Observações</label>
        <textarea
          id="observacoes"
          rows={4}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar lead"}
        </button>
      </form>
    </div>
  );
}
