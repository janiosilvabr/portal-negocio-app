function renderLinha(linha, index) {
  const texto = linha.replace(/\*\*(.+?)\*\*/g, "$1");
  const partes = linha.split(/(\*\*.+?\*\*)/g).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") ? (
      <strong key={i}>{parte.slice(2, -2)}</strong>
    ) : (
      parte
    )
  );

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

export function DocumentoLegal({ titulo, ultimaAtualizacao, texto }) {
  const linhas = texto.trim().split("\n");

  return (
    <div className="vitrine-content pagina-texto pagina-legal">
      <h1>{titulo}</h1>
      {ultimaAtualizacao && <p className="auth-nota">Última atualização: {ultimaAtualizacao}</p>}
      {linhas.map(renderLinha)}
    </div>
  );
}
