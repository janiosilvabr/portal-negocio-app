import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function NovaTransacao() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [tipo, setTipo] = useState("receita");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("pago");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!perfil?.empresa_id) {
      setErro("Perfil da empresa ainda não carregado. Aguarde um instante e tente de novo.");
      return;
    }
    if (!valor) {
      setErro("Informe o valor.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("transacoes_financeiras").insert({
      empresa_id: perfil.empresa_id,
      tipo,
      categoria: categoria || null,
      descricao: descricao || null,
      valor: Number(valor),
      data,
      status,
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/financeiro");
  }

  return (
    <div className="page">
      <h1>Nova transação</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>

          <div>
            <label htmlFor="categoria">Categoria</label>
            <input
              id="categoria"
              placeholder="ex.: venda, aluguel, comissão"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="valor">Valor (R$) *</label>
            <input
              id="valor"
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="data">Data</label>
            <input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div>
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
        </div>

        <label htmlFor="descricao">Descrição</label>
        <input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar transação"}
        </button>
      </form>
    </div>
  );
}
