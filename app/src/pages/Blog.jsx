import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function formatData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase
      .rpc("listar_blog_posts_publicos")
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setPosts(data ?? []);
        setCarregando(false);
      });
  }, []);

  return (
    <div className="vitrine-content">
      <h1>Artigos</h1>
      <p className="auth-nota">Conteúdo sobre gestão de garagem, vendas e o mercado de veículos usados.</p>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && posts.length === 0 && (
        <p className="auth-nota">Nenhum post publicado ainda.</p>
      )}

      {posts.length > 0 && (
        <div className="blog-grid">
          {posts.map((p) => (
            <Link to={`/blog/${p.slug}`} className="blog-card" key={p.id}>
              <div className="blog-card-capa">
                {p.imagem_capa_url ? <img src={p.imagem_capa_url} alt="" /> : "Sem imagem"}
              </div>
              <div className="blog-card-body">
                <h3>{p.titulo}</h3>
                {p.resumo && <p className="blog-card-resumo">{p.resumo}</p>}
                <p className="blog-card-data">{formatData(p.publicado_em)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
