import { Link } from "react-router-dom";

const PARTE_REGEX = /(\*\*.+?\*\*|\[.+?\]\(.+?\))/g;
const LINK_REGEX = /^\[(.+?)\]\((.+?)\)$/;

function renderParte(parte, key) {
  if (parte.startsWith("**") && parte.endsWith("**")) {
    return <strong key={key}>{parte.slice(2, -2)}</strong>;
  }

  const linkMatch = parte.match(LINK_REGEX);
  if (linkMatch) {
    const [, textoLink, url] = linkMatch;
    if (url.startsWith("/")) {
      return (
        <Link key={key} to={url}>
          {textoLink}
        </Link>
      );
    }
    return (
      <a key={key} href={url} target="_blank" rel="noopener noreferrer">
        {textoLink}
      </a>
    );
  }

  return parte;
}

export function renderLinha(linha, index) {
  const texto = linha.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\(.+?\)/g, "$1");
  const partes = linha.split(PARTE_REGEX).map((parte, i) => renderParte(parte, i));

  if (linha.startsWith("### ")) {
    return <h3 key={index}>{linha.slice(4)}</h3>;
  }
  if (linha.startsWith("## ")) {
    return <h2 key={index}>{linha.slice(3)}</h2>;
  }
  if (!texto.trim()) {
    return null;
  }
  return <p key={index}>{partes}</p>;
}
