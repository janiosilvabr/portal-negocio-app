import { useState } from "react";
import { AlertTriangle, Mail } from "lucide-react";
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
  const [aceitouRevisao, setAceitouRevisao] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroConfirmacao, setErroConfirmacao] = useState("");

  const destinatarioPadrao =
    documento.negocios?.clientes ?? documento.consignacoes?.proprietario ?? null;
  const [email, setEmail] = useState(destinatarioPadrao?.email ?? "");
  const [nome, setNome] = useState(destinatarioPadrao?.nome ?? "");

  const revisado = Boolean(documento.revisao_confirmada_em);

  async function handleCopiar() {
    await navigator.clipboard.writeText(documento.conteudo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function handleConfirmarRevisao() {
    setErroConfirmacao("");
    setConfirmando(true);

    const { data, error } = await supabase.rpc("confirmar_revisao_documento", {
      p_documento_id: documento.id,
    });

    setConfirmando(false);

    if (error) {
      setErroConfirmacao(error.message ?? "Falha ao confirmar a revisão.");
      return;
    }

    onDocumentoAtualizado?.(data);
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
        {revisado && (
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
        )}
      </div>

      <div className="tutorial-alerta tutorial-alerta-aviso no-print">
        <AlertTriangle size={16} />
        <p>
          Este é um modelo de minuta padrão gerado por inteligência artificial a partir dos
          dados que você cadastrou — não é uma peça jurídica validada nem substitui a revisão de
          um advogado.
        </p>
      </div>

      {!revisado && (
        <div className="form-card no-print" style={{ marginTop: 16 }}>
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              checked={aceitouRevisao}
              onChange={(e) => setAceitouRevisao(e.target.checked)}
            />
            <span>
              Declaro que li integralmente a minuta gerada, que conferi todos os dados
              preenchidos e que assumo total responsabilidade pela sua utilização na negociação,
              eximindo a plataforma e seus desenvolvedores por eventuais incorreções, omissões ou
              inadequações ao caso concreto.
            </span>
          </label>

          {erroConfirmacao && <p className="auth-erro">{erroConfirmacao}</p>}

          <button
            type="button"
            onClick={handleConfirmarRevisao}
            disabled={!aceitouRevisao || confirmando}
          >
            {confirmando ? "Confirmando..." : "Confirmar revisão e liberar ações"}
          </button>
        </div>
      )}

      <p className="auth-nota no-print">
        Status: {documento.status === "finalizado" ? "finalizado" : "rascunho"} — revise o
        conteúdo antes de considerar final. Trechos marcados "[PREENCHER: ...]" não têm dado
        cadastrado no sistema e precisam ser completados manualmente.
      </p>

      {revisado && (
        <p className="auth-nota no-print">
          Revisão confirmada em {formatDataHora(documento.revisao_confirmada_em)}
          {documento.revisao_confirmada_ip ? ` (IP ${documento.revisao_confirmada_ip})` : ""}.
        </p>
      )}

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
