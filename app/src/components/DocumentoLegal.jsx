import { renderLinha } from "../lib/textoFormatado";

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
