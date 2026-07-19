import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function NovoVendedor() {
  const { perfil } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("vendedor");
  const [comissaoPercentual, setComissaoPercentual] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [linkConvite, setLinkConvite] = useState("");
  const [copiado, setCopiado] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!perfil?.empresa_id) {
      setErro("Perfil da empresa ainda não carregado. Aguarde um instante e tente de novo.");
      return;
    }
    if (!nome || !email) {
      setErro("Nome e e-mail são obrigatórios.");
      return;
    }

    setSalvando(true);

    const { data, error } = await supabase
      .from("convites")
      .insert({
        empresa_id: perfil.empresa_id,
        nome,
        email,
        papel,
        comissao_percentual:
          papel === "vendedor" && comissaoPercentual ? Number(comissaoPercentual) : null,
        criado_por: perfil.id,
      })
      .select()
      .single();

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setLinkConvite(`${window.location.origin}/cadastro?convite=${data.token}`);
  }

  async function handleCopiar() {
    await navigator.clipboard.writeText(linkConvite);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (linkConvite) {
    return (
      <div className="page">
        <h1>Convite gerado</h1>
        <div className="form-card">
          <p>
            Envie este link para <strong>{nome}</strong> (por WhatsApp, e-mail etc.). Ao se cadastrar
            por ele, a pessoa entra direto na sua equipe.
          </p>
          <p className="documento-conteudo" style={{ padding: 16, fontSize: "0.85rem" }}>
            {linkConvite}
          </p>
          <div className="documento-acoes">
            <button type="button" onClick={handleCopiar}>
              {copiado ? "Copiado!" : "Copiar link"}
            </button>
          </div>
          <p className="auth-nota" style={{ marginTop: 16 }}>
            <Link to="/vendedores">Voltar para Vendedores</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Convidar vendedor</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="nome">Nome *</label>
            <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="email">E-mail *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="papel">Papel</label>
            <select id="papel" value={papel} onChange={(e) => setPapel(e.target.value)}>
              <option value="vendedor">Vendedor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {papel === "vendedor" && (
            <div>
              <label htmlFor="comissao">Comissão (%)</label>
              <input
                id="comissao"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={comissaoPercentual}
                onChange={(e) => setComissaoPercentual(e.target.value)}
              />
            </div>
          )}
        </div>

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Gerando..." : "Gerar convite"}
        </button>
      </form>
    </div>
  );
}
