import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const CAMPOS_INICIAIS = {
  titulo: "",
  slug: "",
  resumo: "",
  conteudo: "",
  imagem_capa_url: "",
  status: "rascunho",
};

export default function AdminEditarPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [publicadoEm, setPublicadoEm] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [enviandoCapa, setEnviandoCapa] = useState(false);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setErro(error.message);
        } else if (!data) {
          setNaoEncontrado(true);
        } else {
          setCampos({
            titulo: data.titulo ?? "",
            slug: data.slug ?? "",
            resumo: data.resumo ?? "",
            conteudo: data.conteudo ?? "",
            imagem_capa_url: data.imagem_capa_url ?? "",
            status: data.status ?? "rascunho",
          });
          setPublicadoEm(data.publicado_em);
        }
        setCarregando(false);
      });
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setCampos((c) => ({ ...c, [name]: value }));
  }

  async function handleUploadCapa(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErro("");
    setEnviandoCapa(true);

    const extensao = arquivo.name.split(".").pop();
    const caminho = `capa-${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage.from("blog-imagens").upload(caminho, arquivo);

    if (erroUpload) {
      setEnviandoCapa(false);
      setErro(erroUpload.message);
      return;
    }

    const { data } = supabase.storage.from("blog-imagens").getPublicUrl(caminho);

    setEnviandoCapa(false);
    setCampos((c) => ({ ...c, imagem_capa_url: data.publicUrl }));
    e.target.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!campos.titulo || !campos.slug || !campos.conteudo) {
      setErro("Título, slug e conteúdo são obrigatórios.");
      return;
    }

    setSalvando(true);

    const novoPublicadoEm =
      campos.status === "publicado" ? publicadoEm ?? new Date().toISOString() : publicadoEm;

    const { error } = await supabase
      .from("blog_posts")
      .update({
        titulo: campos.titulo,
        slug: campos.slug,
        resumo: campos.resumo || null,
        conteudo: campos.conteudo,
        imagem_capa_url: campos.imagem_capa_url || null,
        status: campos.status,
        publicado_em: novoPublicadoEm,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/admin/blog");
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
        <p className="auth-erro">Post não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Editar post</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <label htmlFor="titulo">Título *</label>
        <input id="titulo" name="titulo" value={campos.titulo} onChange={handleChange} required />

        <label htmlFor="slug">Slug (URL) *</label>
        <input id="slug" name="slug" value={campos.slug} onChange={handleChange} required />
        <p className="auth-nota">Fica em portalnegocio.com.br/blog/{campos.slug || "..."}</p>

        <label htmlFor="resumo">Resumo</label>
        <textarea id="resumo" name="resumo" value={campos.resumo} onChange={handleChange} rows={2} />
        <p className="auth-nota">Aparece na listagem do blog e como descrição do post.</p>

        <label htmlFor="conteudo">Conteúdo *</label>
        <textarea id="conteudo" name="conteudo" value={campos.conteudo} onChange={handleChange} rows={16} required />
        <p className="auth-nota">
          Suporta formatação simples: linha começando com <code>## </code> vira título, <code>### </code>
          vira subtítulo, <code>**texto**</code> vira negrito, e <code>[texto](url)</code> vira link
          (use isso pra transformar uma palavra ou chamada para ação em link, ex.:{" "}
          <code>[Teste grátis](/cadastro)</code>). Linha em branco separa parágrafos.
        </p>

        <label htmlFor="capa_upload">Imagem de capa</label>
        <p className="auth-nota">Recomendado: proporção 16:9 (ex.: 1200×675px), PNG ou JPG.</p>

        <div className="empresa-logo-linha">
          {campos.imagem_capa_url && (
            <img src={campos.imagem_capa_url} alt="Capa atual" className="blog-capa-preview" />
          )}
          <label className="checklist-add fotos-label-upload">
            {enviandoCapa ? "Enviando..." : campos.imagem_capa_url ? "Trocar imagem" : "Enviar imagem"}
            <input
              id="capa_upload"
              type="file"
              accept="image/*"
              onChange={handleUploadCapa}
              disabled={enviandoCapa}
              hidden
            />
          </label>
        </div>

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
