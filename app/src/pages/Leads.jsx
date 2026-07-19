import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const COLUNAS = [
  { status: "novo", titulo: "Novo" },
  { status: "em_contato", titulo: "Em contato" },
  { status: "negociando", titulo: "Negociando" },
  { status: "convertido", titulo: "Convertido" },
  { status: "perdido", titulo: "Perdido" },
];

const ORIGEM_LABEL = {
  site: "Site",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  outro: "Outro",
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    supabase
      .from("leads")
      .select("*, clientes(nome), veiculos(marca, modelo)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setLeads(data);
        setCarregando(false);
      });
  }

  async function handleStatusChange(lead, novoStatus) {
    const { error } = await supabase.from("leads").update({ status: novoStatus }).eq("id", lead.id);

    if (error) {
      setErro(error.message);
      return;
    }

    setLeads((atual) => atual.map((l) => (l.id === lead.id ? { ...l, status: novoStatus } : l)));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Leads</h1>
        <Link to="/leads/novo" className="botao-link">
          + Novo Lead
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && (
        <div className="kanban kanban-leads">
          {COLUNAS.map((coluna) => {
            const itens = leads.filter((l) => l.status === coluna.status);
            return (
              <div className="kanban-coluna" key={coluna.status}>
                <div className="kanban-coluna-titulo">
                  {coluna.titulo} <span className="kanban-contador">{itens.length}</span>
                </div>

                {itens.length === 0 && <p className="auth-nota">Nenhum lead aqui.</p>}

                {itens.map((l) => (
                  <div className="kanban-card" key={l.id}>
                    <p className="kanban-card-cliente">{l.clientes?.nome ?? "Contato não identificado"}</p>
                    {l.veiculos && (
                      <p className="kanban-card-veiculo">
                        {l.veiculos.marca} {l.veiculos.modelo}
                      </p>
                    )}
                    <span className="badge">{ORIGEM_LABEL[l.origem] ?? l.origem}</span>
                    {l.observacoes && <p className="lead-observacoes">{l.observacoes}</p>}

                    <select
                      className="kanban-select"
                      value={l.status}
                      onChange={(e) => handleStatusChange(l, e.target.value)}
                    >
                      {COLUNAS.map((c) => (
                        <option key={c.status} value={c.status}>
                          {c.titulo}
                        </option>
                      ))}
                    </select>
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
