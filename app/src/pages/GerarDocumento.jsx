import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const TIPO_LABEL = {
  contrato_compra_venda: "Contrato de Compra e Venda",
  contrato_consignacao: "Contrato de Consignação",
};

export default function GerarDocumento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const negocioId = searchParams.get("negocio_id");
  const consignacaoId = searchParams.get("consignacao_id");
  const tipo = negocioId ? "contrato_compra_venda" : "contrato_consignacao";

  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [faltando, setFaltando] = useState(null);
  const [limiteAtingido, setLimiteAtingido] = useState(null);

  async function handleGerar() {
    setGerando(true);
    setErro("");
    setFaltando(null);
    setLimiteAtingido(null);

    const { data, error } = await supabase.functions.invoke("gerar-documento", {
      body: { tipo, negocio_id: negocioId, consignacao_id: consignacaoId },
    });

    if (error) {
      setErro(error.message ?? "Falha ao gerar o documento.");
      setGerando(false);
      return;
    }

    if (data.error) {
      setErro(data.error);
      setGerando(false);
      return;
    }

    if (data.limiteAtingido) {
      setLimiteAtingido(data.mensagem);
      setGerando(false);
      return;
    }

    if (data.bloqueado) {
      setFaltando(data.faltando);
      setGerando(false);
      return;
    }

    navigate(`/documentos/${data.documento.id}`, { replace: true });
  }

  if (gerando) {
    return (
      <div className="page">
        <p>Gerando documento com a Claude API...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="page">
        <h1>Não foi possível gerar</h1>
        <p className="auth-erro">{erro}</p>
        <Link to="/documentos">Voltar para Documentos</Link>
      </div>
    );
  }

  if (faltando) {
    return (
      <div className="page">
        <h1>Faltam dados obrigatórios</h1>
        <p className="auth-nota">Complete os campos abaixo antes de gerar o documento:</p>
        <ul className="lista-pendencias">
          {faltando.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (limiteAtingido) {
    return (
      <div className="page">
        <h1>Limite do plano atingido</h1>
        <p className="auth-erro">
          {limiteAtingido} <Link to="/planos">Ver Planos</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Gerar {TIPO_LABEL[tipo]}</h1>
      <p className="auth-nota">
        O sistema vai preencher um modelo de minuta padrão com os dados já cadastrados deste
        negócio.
      </p>

      <div className="tutorial-alerta tutorial-alerta-aviso" style={{ marginTop: 16, maxWidth: 640 }}>
        <AlertTriangle size={16} />
        <p>
          Aviso: este documento é um rascunho automatizado gerado por inteligência artificial com
          base em dados fornecidos por você. Ele não substitui a revisão de um advogado.
        </p>
      </div>

      <button type="button" onClick={handleGerar} style={{ marginTop: 20 }}>
        Gerar Documento
      </button>
    </div>
  );
}
