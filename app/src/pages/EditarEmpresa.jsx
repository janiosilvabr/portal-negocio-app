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
  responsavel_legal_nome: "",
  responsavel_legal_cargo: "",
  responsavel_legal_cpf: "",
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
            responsavel_legal_nome: data.responsavel_legal_nome ?? "",
            responsavel_legal_cargo: data.responsavel_legal_cargo ?? "",
            responsavel_legal_cpf: data.responsavel_legal_cpf ?? "",
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
        responsavel_legal_nome: campos.responsavel_legal_nome || null,
        responsavel_legal_cargo: campos.responsavel_legal_cargo || null,
        responsavel_legal_cpf: campos.responsavel_legal_cpf || null,
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
        CNPJ, endereço e responsável legal são usados na qualificação da VENDEDORA nos contratos
        de venda direta (sem consignação) — como pessoa jurídica não assina sozinha, o contrato
        precisa do nome, cargo e CPF de quem assina pela empresa.
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

        <h2>Responsável legal</h2>
        <p className="auth-nota">Quem assina os contratos de venda direta pela empresa.</p>

        <div className="form-grid">
          <div>
            <label htmlFor="responsavel_legal_nome">Nome do responsável legal</label>
            <input
              id="responsavel_legal_nome"
              name="responsavel_legal_nome"
              value={campos.responsavel_legal_nome}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="responsavel_legal_cargo">Cargo</label>
            <input
              id="responsavel_legal_cargo"
              name="responsavel_legal_cargo"
              placeholder="Ex.: Sócio-administrador"
              value={campos.responsavel_legal_cargo}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="responsavel_legal_cpf">CPF do responsável</label>
            <input
              id="responsavel_legal_cpf"
              name="responsavel_legal_cpf"
              value={campos.responsavel_legal_cpf}
              onChange={handleChange}
            />
          </div>
        </div>

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
