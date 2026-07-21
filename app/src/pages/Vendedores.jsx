import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const PAPEL_LABEL = {
  admin: "Admin",
  vendedor: "Vendedor",
};

export default function Vendedores() {
  const [usuarios, setUsuarios] = useState([]);
  const [convites, setConvites] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    Promise.all([
      supabase.from("usuarios").select("*").order("nome"),
      supabase.from("convites").select("*").eq("usado", false).order("created_at", { ascending: false }),
    ]).then(([{ data: dataUsuarios, error: erroUsuarios }, { data: dataConvites, error: erroConvites }]) => {
      if (erroUsuarios) setErro(erroUsuarios.message);
      else if (erroConvites) setErro(erroConvites.message);
      else {
        setUsuarios(dataUsuarios);
        setConvites(dataConvites);
      }
      setCarregando(false);
    });
  }

  async function handleComissaoChange(usuario, valor) {
    const novaComissao = valor === "" ? null : Number(valor);

    const { error } = await supabase
      .from("usuarios")
      .update({ comissao_percentual: novaComissao })
      .eq("id", usuario.id);

    if (error) {
      setErro(error.message);
      return;
    }

    setUsuarios((atual) =>
      atual.map((u) => (u.id === usuario.id ? { ...u, comissao_percentual: novaComissao } : u))
    );
  }

  async function handleToggleAtivo(usuario) {
    const { error } = await supabase
      .from("usuarios")
      .update({ ativo: !usuario.ativo })
      .eq("id", usuario.id);

    if (error) {
      setErro(error.message);
      return;
    }

    setUsuarios((atual) => atual.map((u) => (u.id === usuario.id ? { ...u, ativo: !u.ativo } : u)));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Vendedores</h1>
        <Link to="/vendedores/convidar" className="botao-link">
          + Convidar Vendedor
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && (
        <>
          <div className="vendedores-grid">
            {usuarios.map((u) => (
              <div className="vendedor-card" key={u.id}>
                <p className="vendedor-nome">{u.nome}</p>
                <span className={`badge badge-${u.ativo ? "disponivel" : "vendido"}`}>
                  {u.ativo ? "Ativo" : "Inativo"}
                </span>
                <p className="auth-nota">{PAPEL_LABEL[u.papel] ?? u.papel}</p>

                {u.papel === "vendedor" && (
                  <label className="vendedor-comissao-label">
                    Comissão (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="Não definida"
                      className={u.comissao_percentual == null ? "vendedor-comissao-vazia" : ""}
                      defaultValue={u.comissao_percentual ?? ""}
                      onBlur={(e) => handleComissaoChange(u, e.target.value)}
                    />
                    {u.comissao_percentual == null && (
                      <span className="vendedor-comissao-alerta">
                        ⚠️ Sem comissão definida — vendas fechadas por {u.nome} não vão gerar despesa
                        automática.
                      </span>
                    )}
                  </label>
                )}

                <button type="button" onClick={() => handleToggleAtivo(u)}>
                  {u.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            ))}
          </div>

          {convites.length > 0 && (
            <div className="page">
              <h2>Convites pendentes</h2>
              <div className="tabela-wrap">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Papel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convites.map((c) => (
                      <tr key={c.id}>
                        <td>{c.nome}</td>
                        <td>{c.email}</td>
                        <td>{PAPEL_LABEL[c.papel] ?? c.papel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
