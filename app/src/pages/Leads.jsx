import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const COLUNAS = [
  { status: "novo", titulo: "Novo", badge: "badge-consignado" },
  { status: "em_contato", titulo: "Em contato", badge: "badge-reservado" },
  { status: "negociando", titulo: "Negociando", badge: "badge-negociando" },
  { status: "convertido", titulo: "Convertido", badge: "badge-disponivel" },
  { status: "perdido", titulo: "Perdido", badge: "badge-perdido" },
];

const BADGE_POR_STATUS = Object.fromEntries(COLUNAS.map((c) => [c.status, c.badge]));

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
  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("todos");

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

  const termo = busca.trim().toLowerCase();

  const filtrados = leads.filter((l) => {
    if (abaAtiva !== "todos" && l.status !== abaAtiva) return false;
    if (!termo) return true;
    const cliente = l.clientes?.nome?.toLowerCase() ?? "";
    const veiculo = l.veiculos ? `${l.veiculos.marca} ${l.veiculos.modelo}`.toLowerCase() : "";
    return cliente.includes(termo) || veiculo.includes(termo);
  });

  const contagemPorStatus = useMemo(() => {
    const contagem = Object.fromEntries(COLUNAS.map((c) => [c.status, 0]));
    for (const l of leads) {
      if (contagem[l.status] != null) contagem[l.status] += 1;
    }
    return contagem;
  }, [leads]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Leads</h1>
        <Link to="/leads/novo" className="botao-link">
          + Novo Lead
        </Link>
      </div>

      <div className="lista-toolbar">
        <div className="lista-busca">
          <Search size={16} />
          <input
            placeholder="Buscar por cliente ou veículo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="lista-abas">
        <button
          type="button"
          className={`lista-aba ${abaAtiva === "todos" ? "ativa" : ""}`}
          onClick={() => setAbaAtiva("todos")}
        >
          Todos <span className="lista-aba-contador">{leads.length}</span>
        </button>
        {COLUNAS.map((c) => (
          <button
            type="button"
            key={c.status}
            className={`lista-aba ${abaAtiva === c.status ? "ativa" : ""}`}
            onClick={() => setAbaAtiva(c.status)}
          >
            {c.titulo} <span className="lista-aba-contador">{contagemPorStatus[c.status]}</span>
          </button>
        ))}
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && filtrados.length === 0 && <p className="auth-nota">Nenhum lead encontrado.</p>}

      {!carregando && filtrados.length > 0 && (
        <div className="lista-linhas">
          {filtrados.map((l) => {
            const ideais = veiculosIdeaisPara(l, estoque);
            return (
              <div className="lead-linha" key={l.id}>
                <div className="lead-linha-foto">
                  <UserRound size={18} />
                </div>

                <div className="negocio-linha-principal">
                  <p className="negocio-linha-titulo">
                    {l.clientes?.nome ?? "Contato não identificado"}
                    <span className="badge">{ORIGEM_LABEL[l.origem] ?? l.origem}</span>
                  </p>
                  {l.veiculos && (
                    <p className="negocio-linha-veiculo">
                      {l.veiculos.marca} {l.veiculos.modelo}
                    </p>
                  )}
                  {l.observacoes && <p className="lead-linha-observacoes">{l.observacoes}</p>}

                  {ideais.length > 0 && (
                    <div className="lead-linha-ideais">
                      {ideais.map((v) => (
                        <span className="lead-linha-ideal-chip" key={v.id}>
                          {v.marca} {v.modelo}
                          {v.tipo_carroceria && ` · ${TIPO_CARROCERIA_LABEL[v.tipo_carroceria] ?? v.tipo_carroceria}`}
                          {" — "}
                          {formatMoeda(v.preco)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="negocio-linha-vendedor">
                  <label>Vendedor</label>
                  <select
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
                </div>

                <select
                  className={`negocio-linha-status badge ${BADGE_POR_STATUS[l.status]}`}
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
      )}
    </div>
  );
}
