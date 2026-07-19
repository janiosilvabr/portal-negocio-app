import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { DocumentoResultado } from "../components/DocumentoResultado";

export default function VerDocumento() {
  const { id } = useParams();
  const [documento, setDocumento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase
      .from("documentos_gerados")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else if (!data) setErro("Documento não encontrado.");
        else setDocumento(data);
        setCarregando(false);
      });
  }, [id]);

  if (carregando) {
    return (
      <div className="page">
        <p>Carregando...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="page">
        <p className="auth-erro">{erro}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <DocumentoResultado documento={documento} />
    </div>
  );
}
