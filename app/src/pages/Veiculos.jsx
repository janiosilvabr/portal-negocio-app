import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const STATUS_LABEL = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
  consignado: "Consignado",
};

function formatPreco(preco) {
  if (preco == null) return "-";
  return Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase
      .from("veiculos")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setErro(error.message);
        } else {
          setVeiculos(data);
        }
        setCarregando(false);
      });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Veículos</h1>
        <Link to="/veiculos/novo" className="botao-link">
          + Novo Veículo
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && veiculos.length === 0 && (
        <p className="auth-nota">Nenhum veículo cadastrado ainda.</p>
      )}

      {veiculos.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Marca / Modelo</th>
                <th>Ano</th>
                <th>Km</th>
                <th>Cor</th>
                <th>Combustível</th>
                <th>Câmbio</th>
                <th>Preço</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {veiculos.map((v) => (
                <tr key={v.id}>
                  <td>
                    {v.marca} {v.modelo}
                    {v.versao ? ` ${v.versao}` : ""}
                  </td>
                  <td>
                    {v.ano_fabricacao ?? "-"}/{v.ano_modelo ?? "-"}
                  </td>
                  <td>{v.km != null ? v.km.toLocaleString("pt-BR") : "-"}</td>
                  <td>{v.cor ?? "-"}</td>
                  <td>{v.combustivel ?? "-"}</td>
                  <td>{v.cambio ?? "-"}</td>
                  <td>{formatPreco(v.preco)}</td>
                  <td>
                    <span className={`badge badge-${v.status}`}>
                      {STATUS_LABEL[v.status] ?? v.status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/veiculos/${v.id}/editar`}>Editar</Link>
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
