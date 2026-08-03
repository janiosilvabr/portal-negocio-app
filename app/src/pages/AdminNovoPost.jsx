import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function slugify(texto) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const CAMPOS_INICIAIS = {
  titulo: "",
  slug: "",
  resumo: "",
  conteudo: "",
  imagem_capa_url: "",
  status: "rascunho",
};

export default function AdminNovoPost() {
  const navigate = useNavigate();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function handleTituloChange(e) {
    const titulo = e.target.value;
    setCampos((c) => ({
      ...c,
      titulo,
      slug: slugEditadoManualmente ? c.slug : slugify(titulo),
    }));
  }

  function handleSlugChange(e) {
    setSlugEditadoManualmente(true);
    setCampos((c) => ({ ...c, slug: e.target.value }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setCampos((c) => ({ ...c, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!campos.titulo || !campos.slug || !campos.conteudo) {
      setErro("Título, slug e conteúdo são obrigatórios.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("blog_posts").insert({
      titulo: campos.titulo,
      slug: campos.slug,
      resumo: campos.resumo || null,
      conteudo: campos.conteudo,
      imagem_capa_url: campos.imagem_capa_url || null,
      status: campos.status,
      publicado_em: campos.status === "publicado" ? new Date().toISOString() : null,
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/admin/blog");
  }

  return (
    <div className="page">
      <h1>Novo post</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <label htmlFor="titulo">Título *</label>
        <input id="titulo" name="titulo" value={campos.titulo} onChange={handleTituloChange} required />

        <label htmlFor="slug">Slug (URL) *</label>
        <input id="slug" name="slug" value={campos.slug} onChange={handleSlugChange} required />
        <p className="auth-nota">Fica em portalnegocio.com.br/blog/{campos.slug || "..."}</p>

        <label htmlFor="resumo">Resumo</label>
        <textarea id="resumo" name="resumo" value={campos.resumo} onChange={handleChange} rows={2} />
        <p className="auth-nota">Aparece na listagem do blog e como descrição do post.</p>

        <label htmlFor="conteudo">Conteúdo *</label>
        <textarea id="conteudo" name="conteudo" value={campos.conteudo} onChange={handleChange} rows={16} required />
        <p className="auth-nota">
          Suporta formatação simples: linha começando com <code>## </code> vira título, <code>### </code>
          vira subtítulo, e <code>**texto**</code> vira negrito. Linha em branco separa parágrafos.
        </p>

        <label htmlFor="imagem_capa_url">URL da imagem de capa</label>
        <input
          id="imagem_capa_url"
          name="imagem_capa_url"
          value={campos.imagem_capa_url}
          onChange={handleChange}
        />

        <label htmlFor="status">Status</label>
        <select id="status" name="status" value={campos.status} onChange={handleChange}>
          <option value="rascunho">Rascunho (não aparece no site)</option>
          <option value="publicado">Publicado</option>
        </select>

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
