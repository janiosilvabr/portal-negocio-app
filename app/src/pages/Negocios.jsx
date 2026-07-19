import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const COLUNAS = [
  { status: "em_andamento", titulo: "Em andamento" },
  { status: "fechado", titulo: "Fechado" },
  { status: "cancelado", titulo: "Cancelado" },
];

function formatPreco(preco) {
  if (preco == null) return "Consulte";
  return Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Negocios() {
  const [negocios, setNegocios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    supabase
      .from("negocios")
      .select("*, veiculos(marca, modelo), clientes(nome)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setNegocios(data);
        setCarregando(false);
      });
  }

  async function handleStatusChange(negocio, novoStatus) {
    const atualizacao = {
      status: novoStatus,
      data_fechamento: novoStatus === "fechado" ? new Date().toISOString().slice(0, 10) : null,
    };

    const { error } = await supabase.from("negocios").update(atualizacao).eq("id", negocio.id);

    if (error) {
      setErro(error.message);
      return;
    }

    setNegocios((atual) =>
      atual.map((n) => (n.id === negocio.id ? { ...n, ...atualizacao } : n))
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Negócios</h1>
        <Link to="/negocios/novo" className="botao-link">
          + Novo Negócio
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && (
        <div className="kanban">
          {COLUNAS.map((coluna) => {
            const itens = negocios.filter((n) => n.status === coluna.status);
            return (
              <div className="kanban-coluna" key={coluna.status}>
                <div className="kanban-coluna-titulo">
                  {coluna.titulo} <span className="kanban-contador">{itens.length}</span>
                </div>

                {itens.length === 0 && <p className="auth-nota">Nenhum negócio aqui.</p>}

                {itens.map((n) => (
                  <div className="kanban-card" key={n.id}>
                    <p className="kanban-card-cliente">{n.clientes?.nome ?? "Cliente removido"}</p>
                    <p className="kanban-card-veiculo">
                      {n.veiculos ? `${n.veiculos.marca} ${n.veiculos.modelo}` : "Veículo removido"}
                    </p>
                    <p className="kanban-card-valor">{formatPreco(n.valor)}</p>
                    <span className={`badge badge-${n.tipo}`}>
                      {n.tipo === "consignacao" ? "Consignação" : "Venda"}
                    </span>

                    <select
                      className="kanban-select"
                      value={n.status}
                      onChange={(e) => handleStatusChange(n, e.target.value)}
                    >
                      {COLUNAS.map((c) => (
                        <option key={c.status} value={c.status}>
                          {c.titulo}
                        </option>
                      ))}
                    </select>

                    {n.status === "em_andamento" && (
                      <Link className="kanban-card-link" to={`/documentos/gerar?negocio_id=${n.id}`}>
                        Gerar Documento
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
