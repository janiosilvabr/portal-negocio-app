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

const TIPO_CARROCERIA_LABEL = {
  sedan: "Sedã",
  suv: "SUV",
  hatch: "Hatch",
  pickup: "Picape",
  utilitario: "Utilitário",
  moto: "Moto",
  outro: "Outro",
};

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Filtro direto no banco (sem Claude API): preço dentro do orçamento, mesmo
// tipo de carroceria e mesmo câmbio quando o lead informou essas preferências.
function veiculosIdeaisPara(lead, estoque) {
  const temPreferencia = lead.orcamento_maximo || lead.tipo_carroceria_desejado || lead.cambio_desejado;
  if (!temPreferencia) return [];

  return estoque
    .filter((v) => {
      if (lead.orcamento_maximo != null && (v.preco == null || Number(v.preco) > Number(lead.orcamento_maximo)))
        return false;
      if (lead.tipo_carroceria_desejado && v.tipo_carroceria !== lead.tipo_carroceria_desejado) return false;
      if (lead.cambio_desejado && v.cambio !== lead.cambio_desejado) return false;
      return true;
    })
    .slice(0, 3);
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    Promise.all([
      supabase
        .from("leads")
        .select(
          "*, clientes(nome), veiculos(marca, modelo), vendedor:usuarios(nome)"
        )
        .order("created_at", { ascending: false }),
      supabase.rpc("listar_equipe_empresa"),
      supabase
        .from("veiculos")
        .select("id, marca, modelo, preco, tipo_carroceria, cambio")
        .in("status", ["disponivel", "consignado"])
        .order("created_at", { ascending: false }),
    ]).then(([{ data: dataLeads, error: erroLeads }, { data: dataUsuarios }, { data: dataEstoque }]) => {
      if (erroLeads) setErro(erroLeads.message);
      else setLeads(dataLeads);
      setUsuarios((dataUsuarios ?? []).filter((u) => u.ativo));
      setEstoque(dataEstoque ?? []);
      setCarregando(false);
    });
  }

  async function handleStatusChange(lead, novoStatus) {
    const { data, error } = await supabase
      .from("leads")
      .update({ status: novoStatus })
      .eq("id", lead.id)
      .select("id")
      .maybeSingle();

    if (error) {
      setErro(error.message);
      return;
    }

    if (!data) {
      setErro(
        "Não foi possível alterar: enquanto o lead está \"negociando\", só o vendedor atual ou um admin pode alterá-lo."
      );
      return;
    }

    setErro("");
    setLeads((atual) => atual.map((l) => (l.id === lead.id ? { ...l, status: novoStatus } : l)));
  }

  async function handleVendedorChange(lead, novoVendedorId) {
    const { data, error } = await supabase
      .from("leads")
      .update({ vendedor_id: novoVendedorId || null })
      .eq("id", lead.id)
      .select("*, clientes(nome), veiculos(marca, modelo), vendedor:usuarios(nome)")
      .maybeSingle();

    if (error) {
      setErro(error.message);
      return;
    }

    if (!data) {
      setErro(
        "Não foi possível reatribuir: enquanto o lead está \"negociando\", só o vendedor atual ou um admin pode alterá-lo."
      );
      return;
    }

    setErro("");
    setLeads((atual) => atual.map((l) => (l.id === lead.id ? data : l)));
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

      {!carregando && (
        <div className="kanban kanban-leads">
          {COLUNAS.map((coluna) => {
            const itens = leads.filter((l) => l.status === coluna.status);
            return (
              <div className="kanban-coluna" key={coluna.status}>
                <div className="kanban-coluna-titulo">
                  {coluna.titulo} <span className="kanban-contador">{itens.length}</span>
                </div>

                {itens.length === 0 && <p className="auth-nota">Nenhum lead aqui.</p>}

                {itens.map((l) => {
                  const ideais = veiculosIdeaisPara(l, estoque);
                  return (
                  <div className="kanban-card" key={l.id}>
                    <p className="kanban-card-cliente">{l.clientes?.nome ?? "Contato não identificado"}</p>
                    {l.veiculos && (
                      <p className="kanban-card-veiculo">
                        {l.veiculos.marca} {l.veiculos.modelo}
                      </p>
                    )}
                    <span className="badge">{ORIGEM_LABEL[l.origem] ?? l.origem}</span>
                    {l.observacoes && <p className="lead-observacoes">{l.observacoes}</p>}

                    {ideais.length > 0 && (
                      <div className="veiculos-ideais">
                        <p className="veiculos-ideais-titulo">Veículos Ideais para este Cliente</p>
                        <ul>
                          {ideais.map((v) => (
                            <li key={v.id}>
                              <span>
                                {v.marca} {v.modelo}
                                {v.tipo_carroceria && ` · ${TIPO_CARROCERIA_LABEL[v.tipo_carroceria] ?? v.tipo_carroceria}`}
                              </span>
                              <strong>{formatMoeda(v.preco)}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <label className="lead-vendedor-label">
                      Vendedor
                      <select
                        className="kanban-select"
                        value={l.vendedor_id ?? ""}
                        onChange={(e) => handleVendedorChange(l, e.target.value)}
                      >
                        <option value="">Sem vendedor</option>
                        {usuarios.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome}
                          </option>
                        ))}
                      </select>
                    </label>

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
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
