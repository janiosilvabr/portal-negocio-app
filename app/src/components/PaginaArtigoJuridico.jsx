import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";

export function PaginaArtigoJuridico({
  titulo,
  respostaDireta,
  beneficios,
  checklistTitulo,
  checklist,
  ctaTitulo,
  ctaTexto,
  ctaBotaoTexto,
  faqs,
}) {
  const [faqAberta, setFaqAberta] = useState(null);

  useEffect(() => {
    const scriptArticle = document.createElement("script");
    scriptArticle.type = "application/ld+json";
    scriptArticle.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: titulo,
      author: { "@type": "Organization", name: "Portal Negócio" },
      publisher: { "@type": "Organization", name: "Portal Negócio" },
    });
    document.head.appendChild(scriptArticle);

    const scriptFaq = document.createElement("script");
    scriptFaq.type = "application/ld+json";
    scriptFaq.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.pergunta,
        acceptedAnswer: { "@type": "Answer", text: f.resposta },
      })),
    });
    document.head.appendChild(scriptFaq);

    return () => {
      document.head.removeChild(scriptArticle);
      document.head.removeChild(scriptFaq);
    };
  }, [titulo, faqs]);

  return (
    <div>
      <div className="vitrine-content pagina-texto">
        <h1>{titulo}</h1>
        <p>{respostaDireta}</p>
      </div>

      <section className="cf-secao">
        <h2 className="cf-secao-titulo">Como o Portal Negócio resolve isso</h2>
        <div className="cf-funcionalidades-grid">
          {beneficios.map((b) => (
            <div className="cf-funcionalidade-card" key={b.titulo}>
              <span className="cf-funcionalidade-icone">
                <b.icone size={20} />
              </span>
              <h3>{b.titulo}</h3>
              <p>{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cf-secao cf-secao-passos">
        <h2 className="cf-secao-titulo">{checklistTitulo}</h2>
        <div className="form-card" style={{ margin: "40px auto 0" }}>
          <ul className="cf-plano-lista">
            {checklist.map((item) => (
              <li key={item}>
                <Check size={15} /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cf-cta-final">
        <h2>{ctaTitulo}</h2>
        <p>{ctaTexto}</p>
        <Link to="/cadastro" className="botao-link inicio-hero-cta">
          {ctaBotaoTexto}
        </Link>
      </section>

      <section className="cf-secao">
        <h2 className="cf-secao-titulo">Perguntas frequentes</h2>
        <div className="tutorial-lista" style={{ maxWidth: 800, margin: "40px auto 0" }}>
          {faqs.map((f, i) => {
            const aberta = faqAberta === i;
            return (
              <div className="tutorial-card" key={f.pergunta}>
                <button
                  type="button"
                  className="tutorial-card-cabecalho"
                  onClick={() => setFaqAberta(aberta ? null : i)}
                  aria-expanded={aberta}
                >
                  <h2>{f.pergunta}</h2>
                  <ChevronDown size={18} className={`tutorial-chevron ${aberta ? "tutorial-chevron-aberto" : ""}`} />
                </button>
                {aberta && (
                  <div className="tutorial-card-corpo">
                    <p>{f.resposta}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
