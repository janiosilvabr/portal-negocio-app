import { useEffect, useMemo, useState } from "react";
import { Check, X, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const TIPO_LABEL = {
  ligacao: "Ligação",
  email: "E-mail",
  visita: "Visita",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

const STATUS_BADGE = {
  pendente: "badge-consignado",
  concluida: "badge-disponivel",
  cancelada: "badge-perdido",
};

const STATUS_LABEL = {
  pendente: "Pendente",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const CAMPOS_INICIAIS = {
  tipo: "ligacao",
  cliente_id: "",
  lead_id: "",
  veiculo_id: "",
  vendedor_id: "",
  data_hora: "",
  observacoes: "",
};

function formatDataHora(iso) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function ehHoje(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  );
}

export default function Crm() {
  const { perfil } = useAuth();
  const [atividades, setAtividades] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadsNovos, setLeadsNovos] = useState(0);
  const [leadsConvertidos, setLeadsConvertidos] = useState(0);
  const [clientes, setClientes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("pendente");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    Promise.all([
      supabase
        .from("atividades")
        .select("*, clientes(nome), leads(id), veiculos(marca, modelo), vendedor:usuarios(nome)")
        .order("data_hora", { ascending: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "novo"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "convertido"),
      supabase.from("clientes").select("id, nome").order("nome"),
      supabase.from("leads").select("id, clientes(nome)").order("created_at", { ascending: false }),
      supabase.from("veiculos").select("id, marca, modelo").order("created_at", { ascending: false }),
      supabase.rpc("listar_equipe_empresa"),
    ]).then(
      ([
        { data: dataAtividades, error: erroAtividades },
        { count: countTotalLeads },
        { count: countLeadsNovos },
        { count: countLeadsConvertidos },
        { data: dataClientes },
        { data: dataLeads },
        { data: dataVeiculos },
        { data: dataUsuarios },
      ]) => {
        if (erroAtividades) setErro(erroAtividades.message);
        else setAtividades(dataAtividades ?? []);
        setTotalLeads(countTotalLeads ?? 0);
        setLeadsNovos(countLeadsNovos ?? 0);
        setLeadsConvertidos(countLeadsConvertidos ?? 0);
        setClientes(dataClientes ?? []);
        setLeads(dataLeads ?? []);
        setVeiculos(dataVeiculos ?? []);
        setUsuarios((dataUsuarios ?? []).filter((u) => u.ativo));
        setCarregando(false);
      }
    );
  }

  const kpis = useMemo(() => {
    const atividadesHoje = atividades.filter((a) => a.status === "pendente" && ehHoje(a.data_hora)).length;
    const atividadesConcluidas = atividades.filter((a) => a.status === "concluida").length;
    const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : null;
    return { atividadesHoje, atividadesConcluidas, taxaConversao };
  }, [atividades, totalLeads, leadsConvertidos]);

  const filtradas = atividades.filter((a) => abaAtiva === "todas" || a.status === abaAtiva);

  function handleChange(e) {
    const { name, value } = e.target;
    setCampos((c) => ({ ...c, [name]: value }));
  }

  function abrirNovaAtividade() {
    setEditandoId(null);
    setCampos(CAMPOS_INICIAIS);
    setMostrarForm(true);
  }

  function abrirEdicao(a) {
    setEditandoId(a.id);
    setCampos({
      tipo: a.tipo,
      cliente_id: a.cliente_id ?? "",
      lead_id: a.lead_id ?? "",
      veiculo_id: a.veiculo_id ?? "",
      vendedor_id: a.vendedor_id ?? "",
      data_hora: a.data_hora ? a.data_hora.slice(0, 16) : "",
      observacoes: a.observacoes ?? "",
    });
    setMostrarForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!campos.data_hora) {
      setErro("Informe a data e hora.");
      return;
    }

    setSalvando(true);

    const payload = {
      tipo: campos.tipo,
      cliente_id: campos.cliente_id || null,
      lead_id: campos.lead_id || null,
      veiculo_id: campos.veiculo_id || null,
      vendedor_id: campos.vendedor_id || null,
      data_hora: new Date(campos.data_hora).toISOString(),
      observacoes: campos.observacoes || null,
    };

    const { error } = editandoId
      ? await supabase.from("atividades").update(payload).eq("id", editandoId)
      : await supabase.from("atividades").insert({ ...payload, empresa_id: perfil.empresa_id, status: "pendente" });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setMostrarForm(false);
    carregar();
  }

  async function alterarStatus(atividade, novoStatus) {
    const { error } = await supabase.from("atividades").update({ status: novoStatus }).eq("id", atividade.id);
    if (error) {
      setErro(error.message);
      return;
    }
    setAtividades((atual) => atual.map((a) => (a.id === atividade.id ? { ...a, status: novoStatus } : a)));
  }

  async function excluirAtividade(atividade) {
    if (!window.confirm("Excluir esta atividade?")) return;

    const { error } = await supabase.from("atividades").delete().eq("id", atividade.id);
    if (error) {
      setErro(error.message);
      return;
    }
    setAtividades((atual) => atual.filter((a) => a.id !== atividade.id));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>CRM</h1>
        <button type="button" className="botao-link" onClick={abrirNovaAtividade}>
          + Nova Atividade
        </button>
      </div>

      {erro && <p className="auth-erro">{erro}</p>}

      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Leads Novos</p>
          <p className="kpi-valor">{leadsNovos}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Atividades Hoje</p>
          <p className="kpi-valor">{kpis.atividadesHoje}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Atividades Concluídas</p>
          <p className="kpi-valor">{kpis.atividadesConcluidas}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Taxa de Conversão</p>
          <p className="kpi-valor">{kpis.taxaConversao != null ? `${kpis.taxaConversao.toFixed(1)}%` : "-"}</p>
        </div>
      </div>

      {mostrarForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h2>{editandoId ? "Editar atividade" : "Nova atividade"}</h2>
          <div className="form-grid">
            <div>
              <label htmlFor="tipo">Tipo</label>
              <select id="tipo" name="tipo" value={campos.tipo} onChange={handleChange}>
                <option value="ligacao">Ligação</option>
                <option value="email">E-mail</option>
                <option value="visita">Visita</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="cliente_id">Cliente</label>
              <select id="cliente_id" name="cliente_id" value={campos.cliente_id} onChange={handleChange}>
                <option value="">Nenhum</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lead_id">Lead</label>
              <select id="lead_id" name="lead_id" value={campos.lead_id} onChange={handleChange}>
                <option value="">Nenhum</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.clientes?.nome ?? "Contato não identificado"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="veiculo_id">Veículo (opcional)</label>
              <select id="veiculo_id" name="veiculo_id" value={campos.veiculo_id} onChange={handleChange}>
                <option value="">Nenhum</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="vendedor_id">Responsável</label>
              <select id="vendedor_id" name="vendedor_id" value={campos.vendedor_id} onChange={handleChange}>
                <option value="">Sem responsável</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="data_hora">Data e hora *</label>
              <input
                id="data_hora"
                name="data_hora"
                type="datetime-local"
                value={campos.data_hora}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label htmlFor="observacoes">Observações</label>
          <textarea id="observacoes" name="observacoes" rows={3} value={campos.observacoes} onChange={handleChange} />

          {erro && <p className="auth-erro">{erro}</p>}

          <div className="documento-acoes">
            <button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="lista-abas">
        {[
          { valor: "pendente", titulo: "Pendentes" },
          { valor: "concluida", titulo: "Concluídas" },
          { valor: "cancelada", titulo: "Canceladas" },
          { valor: "todas", titulo: "Todas" },
        ].map((aba) => (
          <button
            type="button"
            key={aba.valor}
            className={`lista-aba ${abaAtiva === aba.valor ? "ativa" : ""}`}
            onClick={() => setAbaAtiva(aba.valor)}
          >
            {aba.titulo}
          </button>
        ))}
      </div>

      {carregando && <p>Carregando...</p>}

      {!carregando && filtradas.length === 0 && (
        <p className="auth-nota">Nenhuma atividade encontrada.</p>
      )}

      {!carregando && filtradas.length > 0 && (
        <div className="lista-linhas">
          {filtradas.map((a) => (
            <div className="negocio-linha" key={a.id}>
              <div className="negocio-linha-principal">
                <p className="negocio-linha-titulo">
                  {TIPO_LABEL[a.tipo] ?? a.tipo}
                  <span className={`badge ${STATUS_BADGE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                </p>
                <p className="negocio-linha-veiculo">
                  {a.clientes?.nome ?? "Sem cliente"}
                  {a.veiculos && ` — ${a.veiculos.marca} ${a.veiculos.modelo}`}
                </p>
                {a.observacoes && <p className="lead-linha-observacoes">{a.observacoes}</p>}
              </div>

              <p className="negocio-linha-valor">{formatDataHora(a.data_hora)}</p>
              <p className="auth-nota">{a.vendedor?.nome ?? "Sem responsável"}</p>

              <div className="documento-acoes">
                {a.status === "pendente" && (
                  <>
                    <button type="button" onClick={() => alterarStatus(a, "concluida")} title="Marcar concluída">
                      <Check size={14} />
                    </button>
                    <button type="button" onClick={() => alterarStatus(a, "cancelada")} title="Cancelar">
                      <X size={14} />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => abrirEdicao(a)} title="Editar">
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => excluirAtividade(a)} title="Excluir">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
