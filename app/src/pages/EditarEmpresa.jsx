import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const CAMPOS_INICIAIS = {
  nome: "",
  cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  cidade: "",
  logo_url: "",
  visivel_publicamente: true,
};

export default function EditarEmpresa() {
  const { perfil } = useAuth();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!perfil?.empresa_id) return;

    supabase
      .from("empresas")
      .select("*")
      .eq("id", perfil.empresa_id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setErro(error.message);
        } else {
          setCampos({
            nome: data.nome ?? "",
            cnpj: data.cnpj ?? "",
            telefone: data.telefone ?? "",
            email: data.email ?? "",
            endereco: data.endereco ?? "",
            cidade: data.cidade ?? "",
            logo_url: data.logo_url ?? "",
            visivel_publicamente: data.visivel_publicamente ?? true,
          });
        }
        setCarregando(false);
      });
  }, [perfil?.empresa_id]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setCampos((c) => ({ ...c, [name]: type === "checkbox" ? checked : value }));
    setSucesso(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setSucesso(false);

    if (!campos.nome) {
      setErro("Nome é obrigatório.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("empresas")
      .update({
        nome: campos.nome,
        cnpj: campos.cnpj || null,
        telefone: campos.telefone || null,
        email: campos.email || null,
        endereco: campos.endereco || null,
        cidade: campos.cidade || null,
        logo_url: campos.logo_url || null,
        visivel_publicamente: campos.visivel_publicamente,
      })
      .eq("id", perfil.empresa_id);

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(true);
  }

  if (carregando) {
    return (
      <div className="page">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Dados da empresa</h1>
      <p className="auth-nota">
        CNPJ e endereço são usados na qualificação da VENDEDORA nos contratos de venda direta
        (sem consignação).
      </p>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="nome">Nome *</label>
            <input id="nome" name="nome" value={campos.nome} onChange={handleChange} required />
          </div>

          <div>
            <label htmlFor="cnpj">CNPJ</label>
            <input id="cnpj" name="cnpj" value={campos.cnpj} onChange={handleChange} />
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

        <label htmlFor="cidade">Cidade</label>
        <input id="cidade" name="cidade" value={campos.cidade} onChange={handleChange} />

        <label htmlFor="logo_url">URL do logo (opcional)</label>
        <input id="logo_url" name="logo_url" value={campos.logo_url} onChange={handleChange} />

        <label className="auth-checkbox-label">
          <input
            type="checkbox"
            name="visivel_publicamente"
            checked={campos.visivel_publicamente}
            onChange={handleChange}
          />
          <span>Mostrar minha garagem na página pública "Garagens" do Portal Negócio.</span>
        </label>

        {erro && <p className="auth-erro">{erro}</p>}
        {sucesso && <p className="auth-sucesso">Dados salvos.</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
