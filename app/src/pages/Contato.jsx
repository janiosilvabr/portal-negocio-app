export default function Contato() {
  return (
    <div className="vitrine-content pagina-texto">
      <h1>Contato</h1>
      <p>Fale com a gente — dúvidas, sugestões ou interesse em cadastrar sua garagem no Portal Negócio.</p>

      <div className="contato-acoes">
        <a
          href="https://wa.me/5566999726985"
          target="_blank"
          rel="noopener noreferrer"
          className="botao-link contato-botao-whatsapp"
        >
          💬 Falar no WhatsApp
        </a>
        <a href="mailto:contato@portalnegocio.com.br" className="botao-link contato-botao-email">
          ✉️ contato@portalnegocio.com.br
        </a>
      </div>
    </div>
  );
}
