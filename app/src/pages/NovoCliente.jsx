import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const CAMPOS_INICIAIS = {
  nome: "",
  telefone: "",
  email: "",
  cpf: "",
  endereco: "",
};

export default function NovoCliente() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setCampos((c) => ({ ...c, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!perfil?.empresa_id) {
      setErro("Perfil da empresa ainda não carregado. Aguarde um instante e tente de novo.");
      return;
    }
    if (!campos.nome) {
      setErro("Nome é obrigatório.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("clientes").insert({
      empresa_id: perfil.empresa_id,
      nome: campos.nome,
      telefone: campos.telefone || null,
      email: campos.email || null,
      cpf: campos.cpf || null,
      endereco: campos.endereco || null,
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/clientes");
  }

  return (
    <div className="page">
      <h1>Novo cliente</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="nome">Nome *</label>
            <input id="nome" name="nome" value={campos.nome} onChange={handleChange} required />
          </div>

          <div>
            <label htmlFor="cpf">CPF</label>
            <input id="cpf" name="cpf" value={campos.cpf} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="telefone">Telefone</label>
            <input id="telefone" name="telefone" value={campos.telefone} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" value={campos.email} onChange={handleChange} />
          </div>
        </div>

        <label htmlFor="endereco">Endereço</label>
        <input id="endereco" name="endereco" value={campos.endereco} onChange={handleChange} />

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar cliente"}
        </button>
      </form>
    </div>
  );
}
