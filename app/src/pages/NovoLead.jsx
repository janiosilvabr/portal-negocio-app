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
