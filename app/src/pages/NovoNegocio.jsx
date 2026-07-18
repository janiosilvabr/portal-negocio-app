import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function NovoNegocio() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [veiculos, setVeiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculoId, setVeiculoId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState("venda");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    supabase
      .from("veiculos")
      .select("id, marca, modelo, preco")
      .eq("status", "disponivel")
      .order("created_at", { ascending: false })
      .then(({ data }) => setVeiculos(data ?? []));

    supabase
      .from("clientes")
      .select("id, nome, cpf")
      .order("nome")
      .then(({ data }) => setClientes(data ?? []));
  }, []);

  function handleVeiculoChange(e) {
    const id = e.target.value;
    setVeiculoId(id);
    const veiculo = veiculos.find((v) => v.id === id);
    if (veiculo?.preco != null) setValor(String(veiculo.preco));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!perfil?.empresa_id) {
      setErro("Perfil da empresa ainda não carregado. Aguarde um instante e tente de novo.");
      return;
    }
    if (!veiculoId || !clienteId) {
      setErro("Selecione o veículo e o cliente.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("negocios").insert({
      empresa_id: perfil.empresa_id,
      veiculo_id: veiculoId,
      cliente_id: clienteId,
      vendedor_id: perfil.id,
      tipo,
      valor: valor ? Number(valor) : null,
      status: "em_andamento",
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/negocios");
  }

  return (
    <div className="page">
      <h1>Novo negócio</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="veiculo">Veículo *</label>
            <select id="veiculo" value={veiculoId} onChange={handleVeiculoChange} required>
              <option value="">Selecione</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cliente">Cliente *</label>
            <select id="cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
              <option value="">Selecione</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="venda">Venda</option>
              <option value="consignacao">Consignação</option>
            </select>
          </div>

          <div>
            <label htmlFor="valor">Valor (R$)</label>
            <input
              id="valor"
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>

        {erro && <p className="auth-erro">{erro}</p>}

        {veiculos.length === 0 && (
          <p className="auth-nota">
            Nenhum veículo disponível para negociar. Cadastre um veículo primeiro.
          </p>
        )}
        {clientes.length === 0 && (
          <p className="auth-nota">Nenhum cliente cadastrado ainda. Cadastre um cliente primeiro.</p>
        )}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar negócio"}
        </button>
      </form>
    </div>
  );
}
