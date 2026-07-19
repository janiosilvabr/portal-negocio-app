import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const TIPO_LABEL = {
  contrato_consignacao: "Contrato de Consignação",
  contrato_compra_venda: "Contrato de Compra e Venda",
};

const STATUS_LABEL = {
  rascunho: "Rascunho",
  finalizado: "Finalizado",
};

function formatData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function descreverContexto(doc) {
  if (doc.negocios) {
    const veiculo = doc.negocios.veiculos;
    const cliente = doc.negocios.clientes;
    return `${veiculo?.marca ?? ""} ${veiculo?.modelo ?? ""} — ${cliente?.nome ?? "cliente removido"}`;
  }
  if (doc.consignacoes) {
    const veiculo = doc.consignacoes.veiculos;
    const proprietario = doc.consignacoes.proprietario;
    return `${veiculo?.marca ?? ""} ${veiculo?.modelo ?? ""} — proprietário ${proprietario?.nome ?? "removido"}`;
  }
  return "-";
}

export default function DocumentosGerados() {
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase
      .from("documentos_gerados")
      .select(
        "*, negocios(veiculos(marca,modelo), clientes(nome)), consignacoes(veiculos(marca,modelo), proprietario:clientes(nome))"
      )
      .order("gerado_em", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setDocumentos(data);
        setCarregando(false);
      });
  }, []);

  return (
    <div className="page">
      <h1>Documentos gerados</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && documentos.length === 0 && (
        <p className="auth-nota">Nenhum documento gerado ainda.</p>
      )}

      {documentos.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Contexto</th>
                <th>Status</th>
                <th>Gerado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc) => (
                <tr key={doc.id}>
                  <td>{TIPO_LABEL[doc.tipo] ?? doc.tipo}</td>
                  <td>{descreverContexto(doc)}</td>
                  <td>
                    <span className={`badge badge-${doc.status}`}>
                      {STATUS_LABEL[doc.status] ?? doc.status}
                    </span>
                  </td>
                  <td>{formatData(doc.gerado_em)}</td>
                  <td>
                    <Link to={`/documentos/${doc.id}`}>Abrir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
