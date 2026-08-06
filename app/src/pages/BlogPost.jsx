import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { renderLinha } from "../lib/textoFormatado";

function formatData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  useEffect(() => {
    setCarregando(true);
    setNaoEncontrado(false);

    supabase
      .rpc("obter_blog_post_publico", { p_slug: slug })
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setNaoEncontrado(true);
        else setPost(data);
        setCarregando(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!post) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.titulo,
      ...(post.imagem_capa_url && { image: post.imagem_capa_url }),
      ...(post.publicado_em && { datePublished: post.publicado_em }),
      author: { "@type": "Organization", name: "Portal Negócio" },
      publisher: { "@type": "Organization", name: "Portal Negócio" },
    });
    document.head.appendChild(script);

    return () => document.head.removeChild(script);
  }, [post]);

  if (carregando) {
    return (
      <div className="vitrine-content">
        <p>Carregando...</p>
      </div>
    );
  }

  if (naoEncontrado) {
    return (
      <div className="vitrine-content">
        <p className="auth-erro">Post não encontrado.</p>
        <Link to="/blog" className="botao-link">
          Voltar para Artigos
        </Link>
      </div>
    );
  }

  const linhas = post.conteudo.trim().split("\n");

  return (
    <div className="vitrine-content pagina-texto">
      <Link to="/blog" className="detalhe-voltar">
        ← Voltar para Artigos
      </Link>

      <h1>{post.titulo}</h1>
      {post.publicado_em && <p className="auth-nota">{formatData(post.publicado_em)}</p>}

      {post.imagem_capa_url && (
        <img src={post.imagem_capa_url} alt="" className="blog-post-capa" />
      )}

      {linhas.map(renderLinha)}
    </div>
  );
}
