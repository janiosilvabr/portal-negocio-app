import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function GerarDocumento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const negocioId = searchParams.get("negocio_id");
  const consignacaoId = searchParams.get("consignacao_id");
  const tipo = negocioId ? "contrato_compra_venda" : "contrato_consignacao";

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [faltando, setFaltando] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function gerar() {
      const { data, error } = await supabase.functions.invoke("gerar-documento", {
        body: { tipo, negocio_id: negocioId, consignacao_id: consignacaoId },
      });

      if (cancelado) return;

      if (error) {
        setErro(error.message ?? "Falha ao gerar o documento.");
        setCarregando(false);
        return;
      }

      if (data.error) {
        setErro(data.error);
        setCarregando(false);
        return;
      }

      if (data.bloqueado) {
        setFaltando(data.faltando);
        setCarregando(false);
        return;
      }

      navigate(`/documentos/${data.documento.id}`, { replace: true });
    }

    gerar();

    return () => {
      cancelado = true;
    };
  }, [tipo, negocioId, consignacaoId, navigate]);

  if (carregando) {
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

  return null;
}
