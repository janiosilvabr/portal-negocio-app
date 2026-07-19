import { useState } from "react";

const TIPO_LABEL = {
  contrato_consignacao: "Contrato de Consignação",
  contrato_compra_venda: "Contrato de Compra e Venda",
};

export function DocumentoResultado({ documento }) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopiar() {
    await navigator.clipboard.writeText(documento.conteudo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
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
        </div>
      </div>

      <p className="auth-nota no-print">
        Status: {documento.status === "finalizado" ? "finalizado" : "rascunho"} — revise o
        conteúdo antes de considerar final. Trechos marcados "[PREENCHER: ...]" não têm dado
        cadastrado no sistema e precisam ser completados manualmente.
      </p>

      <pre className="documento-conteudo">{documento.conteudo}</pre>
    </div>
  );
}
