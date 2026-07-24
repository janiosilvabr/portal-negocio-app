import { useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const TIPO_LABEL = {
  contrato_consignacao: "Contrato de Consignação",
  contrato_compra_venda: "Contrato de Compra e Venda",
};

function formatDataHora(iso) {
  return new Date(iso).toLocaleString("pt-BR");
}

export function DocumentoResultado({ documento, onDocumentoAtualizado }) {
  const [copiado, setCopiado] = useState(false);
  const [mostrarEnvio, setMostrarEnvio] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");

  const destinatarioPadrao =
    documento.negocios?.clientes ?? documento.consignacoes?.proprietario ?? null;
  const [email, setEmail] = useState(destinatarioPadrao?.email ?? "");
  const [nome, setNome] = useState(destinatarioPadrao?.nome ?? "");

  async function handleCopiar() {
    await navigator.clipboard.writeText(documento.conteudo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function handleEnviar(e) {
    e.preventDefault();
    setErroEnvio("");
    setEnviando(true);

    const { data, error } = await supabase.functions.invoke("enviar-documento-email", {
      body: { documento_id: documento.id, destinatario_email: email, destinatario_nome: nome },
    });

    setEnviando(false);

    if (error) {
      setErroEnvio(error.message ?? "Falha ao enviar o e-mail.");
      return;
    }
    if (data?.error) {
      setErroEnvio(data.error);
      return;
    }

    setMostrarEnvio(false);
    if (data.documento) onDocumentoAtualizado?.(data.documento);
  }

  return (
    <div>
      <div className="page-header no-print">
        <h1>{TIPO_LABEL[documento.tipo] ?? "Documento"} (rascunho)</h1>
        <div className="documento-acoes">
          <button type="button" onClick={handleCopiar}>
            {copiado ? "Copiado!" : "Copiar"}
          </button>
          <button type="button" onClick={() => window.print()}>
            Baixar PDF
          </button>
          <button type="button" onClick={() => setMostrarEnvio((v) => !v)}>
            <Mail size={14} /> Enviar por E-mail
          </button>
        </div>
      </div>

      <p className="auth-nota no-print">
        Status: {documento.status === "finalizado" ? "finalizado" : "rascunho"} — revise o
        conteúdo antes de considerar final. Trechos marcados "[PREENCHER: ...]" não têm dado
        cadastrado no sistema e precisam ser completados manualmente.
      </p>

      {documento.enviado_email_em && (
        <p className="auth-nota no-print">
          Enviado por e-mail para {documento.enviado_email_para} em{" "}
          {formatDataHora(documento.enviado_email_em)}.
        </p>
      )}

      {mostrarEnvio && (
        <form className="form-card documento-envio-form no-print" onSubmit={handleEnviar}>
          <div className="form-grid">
            <div>
              <label htmlFor="envio-nome">Nome do destinatário</label>
              <input id="envio-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label htmlFor="envio-email">E-mail do destinatário *</label>
              <input
                id="envio-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {erroEnvio && <p className="auth-erro">{erroEnvio}</p>}

          <button type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Confirmar envio"}
          </button>
        </form>
      )}

      <pre className="documento-conteudo">{documento.conteudo}</pre>
    </div>
  );
}
