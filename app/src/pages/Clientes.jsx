import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const NEGOCIOS_ABERTOS = ["em_andamento"];
const LEADS_ABERTOS = ["novo", "em_contato", "negociando"];

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [emNegociacao, setEmNegociacao] = useState(new Set());
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    Promise.all([
      supabase.from("clientes").select("*").order("created_at", { ascending: false }),
      supabase.from("negocios").select("cliente_id, status").in("status", NEGOCIOS_ABERTOS),
      supabase.from("leads").select("cliente_id, status").in("status", LEADS_ABERTOS),
    ]).then(([{ data, error }, { data: dataNegocios }, { data: dataLeads }]) => {
      if (error) setErro(error.message);
      else setClientes(data);

      const abertos = new Set();
      (dataNegocios ?? []).forEach((n) => n.cliente_id && abertos.add(n.cliente_id));
      (dataLeads ?? []).forEach((l) => l.cliente_id && abertos.add(l.cliente_id));
      setEmNegociacao(abertos);

      setCarregando(false);
    });
  }

  async function handleExcluir(c) {
    const confirmado = window.confirm(`Excluir o cliente ${c.nome}? Essa ação não pode ser desfeita.`);
    if (!confirmado) return;

    setExcluindoId(c.id);
    const { error } = await supabase.from("clientes").delete().eq("id", c.id);
    setExcluindoId(null);

    if (error) {
      setErro(
        error.message.includes("foreign key")
          ? "Não é possível excluir: este cliente está vinculado a um negócio ou lead. Remova esses vínculos primeiro."
          : error.message
      );
      return;
    }

    setErro("");
    setClientes((atual) => atual.filter((item) => item.id !== c.id));
  }

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? clientes.filter(
        (c) =>
          c.nome?.toLowerCase().includes(termo) ||
          c.cpf?.toLowerCase().includes(termo) ||
          c.email?.toLowerCase().includes(termo)
      )
    : clientes;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="lista-subtitulo">{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <Link to="/clientes/novo" className="botao-link">
          + Novo Cliente
        </Link>
      </div>

      <div className="lista-toolbar">
        <div className="lista-busca">
          <Search size={16} />
          <input
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && filtrados.length === 0 && (
        <p className="auth-nota">Nenhum cliente encontrado.</p>
      )}

      {filtrados.length > 0 && (
        <div className="lista-linhas">
          {filtrados.map((c) => {
            const ativo = emNegociacao.has(c.id);
            return (
              <div className="cliente-linha" key={c.id}>
                <div className="cliente-linha-principal">
                  <p className="cliente-linha-nome">
                    <span className={`cliente-linha-dot ${ativo ? "negociacao" : "ativo"}`} />
                    {c.nome}
                  </p>
                  <span className={`badge ${ativo ? "badge-negociando" : "badge-disponivel"}`}>
                    {ativo ? "Em negociação" : "Cliente ativo"}
                  </span>
                </div>

                <p className="cliente-linha-cpf">{c.cpf ?? "-"}</p>

                <div className="cliente-linha-contato">
                  {c.telefone && (
                    <span>
                      <Phone size={13} /> {c.telefone}
                    </span>
                  )}
                  {c.email && (
                    <span>
                      <Mail size={13} /> {c.email}
                    </span>
                  )}
                  {!c.telefone && !c.email && <span className="auth-nota">Sem contato</span>}
                </div>

                <div className="cliente-linha-acoes">
                  <Link to={`/clientes/${c.id}/editar`} aria-label="Editar cliente">
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleExcluir(c)}
                    disabled={excluindoId === c.id}
                    aria-label="Excluir cliente"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
