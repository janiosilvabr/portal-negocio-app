import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function EditarVendedor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState("vendedor");
  const [comissaoPercentual, setComissaoPercentual] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    supabase
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setErro(error.message);
        } else if (!data) {
          setNaoEncontrado(true);
        } else {
          setNome(data.nome ?? "");
          setPapel(data.papel ?? "vendedor");
          setComissaoPercentual(data.comissao_percentual ?? "");
        }
        setCarregando(false);
      });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!nome) {
      setErro("Nome é obrigatório.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("usuarios")
      .update({
        nome,
        papel,
        comissao_percentual: papel === "vendedor" && comissaoPercentual ? Number(comissaoPercentual) : null,
      })
      .eq("id", id);

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/vendedores");
  }

  if (carregando) {
    return (
      <div className="page">
        <p>Carregando...</p>
      </div>
    );
  }

  if (naoEncontrado) {
    return (
      <div className="page">
        <p className="auth-erro">Vendedor não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Editar vendedor</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="nome">Nome *</label>
            <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
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
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
