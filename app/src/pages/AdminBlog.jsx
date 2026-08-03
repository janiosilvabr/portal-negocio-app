import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const STATUS_BADGE = { rascunho: "badge-perdido", publicado: "badge-disponivel" };
const STATUS_LABEL = { rascunho: "Rascunho", publicado: "Publicado" };

function formatData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setPosts(data ?? []);
        setCarregando(false);
      });
  }

  async function handleExcluir(post) {
    const confirmado = window.confirm(`Excluir o post "${post.titulo}"? Essa ação não pode ser desfeita.`);
    if (!confirmado) return;

    setExcluindoId(post.id);
    const { error } = await supabase.from("blog_posts").delete().eq("id", post.id);
    setExcluindoId(null);

    if (error) {
      setErro(error.message);
      return;
    }

    setErro("");
    setPosts((atual) => atual.filter((p) => p.id !== post.id));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Blog</h1>
        <Link to="/admin/blog/novo" className="botao-link">
          + Novo Post
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && posts.length === 0 && (
        <p className="auth-nota">Nenhum post criado ainda.</p>
      )}

      {!carregando && posts.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Título</th>
                <th>Status</th>
                <th>Publicado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>{p.titulo}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  </td>
                  <td>{formatData(p.publicado_em)}</td>
                  <td className="tabela-acoes">
                    <Link to={`/admin/blog/${p.id}/editar`}>Editar</Link>
                    <button
                      type="button"
                      className="link-perigo"
                      onClick={() => handleExcluir(p)}
                      disabled={excluindoId === p.id}
                    >
                      {excluindoId === p.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
