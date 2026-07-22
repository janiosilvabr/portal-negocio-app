import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const LEAD_STATUS_LABEL = {
  novo: "Novo",
  em_contato: "Em contato",
  negociando: "Negociando",
  convertido: "Convertido",
  perdido: "Perdido",
};

const LEAD_ORDEM = ["novo", "em_contato", "negociando", "convertido", "perdido"];

const VEICULO_STATUS_LABEL = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
  consignado: "Consignado",
};

const VEICULO_ORDEM = ["disponivel", "reservado", "vendido", "consignado"];

const NEGOCIO_STATUS_LABEL = {
  em_andamento: "Em andamento",
  fechado: "Fechado",
  cancelado: "Cancelado",
};

const NEGOCIO_ORDEM = ["em_andamento", "fechado", "cancelado"];

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function contarPor(lista, campo, ordem) {
  const contagem = Object.fromEntries(ordem.map((k) => [k, 0]));
  for (const item of lista) {
    if (contagem[item[campo]] != null) contagem[item[campo]] += 1;
  }
  return contagem;
}

function BarraContagem({ dados, labels, ordem }) {
  const total = ordem.reduce((s, k) => s + (dados[k] ?? 0), 0);
  const max = Math.max(1, ...ordem.map((k) => dados[k] ?? 0));

  if (total === 0) {
    return <p className="auth-nota">Nenhum dado ainda.</p>;
  }

  return (
    <div className="painel-grafico">
      {ordem.map((k) => (
        <div className="painel-grafico-linha" key={k}>
          <span className="painel-grafico-label">{labels[k] ?? k}</span>
          <div className="painel-grafico-barra-fundo">
            <div
              className="painel-grafico-barra"
              style={{ width: `${((dados[k] ?? 0) / max) * 100}%` }}
            />
          </div>
          <span className="painel-grafico-valor">{dados[k] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

export default function Painel() {
  const { user, perfil } = useAuth();
  const ehAdmin = perfil?.papel === "admin";

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [leads, setLeads] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [equipe, setEquipe] = useState([]);
  const [comissoesFaltando, setComissoesFaltando] = useState([]);

  useEffect(() => {
    if (!perfil?.empresa_id) return;

    const consultas = [
      supabase.from("leads").select("id, status, vendedor_id, created_at, clientes(nome)"),
      supabase.from("negocios").select("id, status, valor"),
      supabase
        .from("veiculos")
        .select("id, marca, modelo, versao, preco, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("documentos_gerados").select("id, status, negocio_id"),
      supabase.rpc("listar_equipe_empresa"),
    ];

    Promise.all(consultas).then(([resLeads, resNegocios, resVeiculos, resDocumentos, resEquipe]) => {
      const primeiroErro = [resLeads, resNegocios, resVeiculos, resDocumentos].find((r) => r.error);
      if (primeiroErro) {
        setErro(primeiroErro.error.message);
        setCarregando(false);
        return;
      }

      setLeads(resLeads.data ?? []);
      setNegocios(resNegocios.data ?? []);
      setVeiculos(resVeiculos.data ?? []);
      setDocumentos(resDocumentos.data ?? []);
      setEquipe((resEquipe.data ?? []).filter((u) => u.ativo));
      setCarregando(false);
    });

    if (ehAdmin) {
      supabase
        .from("usuarios")
        .select("id, nome, papel, ativo, comissao_percentual")
        .eq("papel", "vendedor")
        .eq("ativo", true)
        .then(({ data }) => {
          setComissoesFaltando((data ?? []).filter((u) => u.comissao_percentual == null));
        });
    }
  }, [perfil?.empresa_id, ehAdmin]);

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

  const hojeInicio = new Date();
  hojeInicio.setHours(0, 0, 0, 0);

  const novosLeadsHoje = leads.filter((l) => new Date(l.created_at) >= hojeInicio).length;
  const negociosEmAndamento = negocios.filter((n) => n.status === "em_andamento");
  const documentosPendentes = documentos.filter((d) => d.status === "rascunho").length;
  const valorEmNegociacoes = negociosEmAndamento.reduce((s, n) => s + Number(n.valor ?? 0), 0);

  const pipelineNegocios = NEGOCIO_ORDEM.map((status) => {
    const itens = negocios.filter((n) => n.status === status);
    return {
      status,
      titulo: NEGOCIO_STATUS_LABEL[status],
      contagem: itens.length,
      valor: itens.reduce((s, n) => s + Number(n.valor ?? 0), 0),
    };
  });

  const leadsPorEstagio = contarPor(leads, "status", LEAD_ORDEM);
  const veiculosPorStatus = contarPor(veiculos, "status", VEICULO_ORDEM);

  const negocioIdsComDocumento = new Set(documentos.filter((d) => d.negocio_id).map((d) => d.negocio_id));

  const leadsSemVendedor = leads.filter(
    (l) => !l.vendedor_id && ["novo", "em_contato", "negociando"].includes(l.status)
  );
  const negociosSemDocumento = negociosEmAndamento.filter((n) => !negocioIdsComDocumento.has(n.id));

  const proximasAcoes = [
    ...leadsSemVendedor.map((l) => ({
      key: `lead-${l.id}`,
      texto: `Atribuir vendedor ao lead de ${l.clientes?.nome ?? "contato não identificado"}`,
      to: "/leads",
    })),
    ...negociosSemDocumento.map((n) => ({
      key: `negocio-${n.id}`,
      texto: `Gerar documento do negócio em andamento (${formatMoeda(n.valor)})`,
      to: `/documentos/gerar?negocio_id=${n.id}`,
    })),
    ...comissoesFaltando.map((u) => ({
      key: `comissao-${u.id}`,
      texto: `Definir comissão de ${u.nome}`,
      to: "/vendedores",
    })),
  ].slice(0, 8);

  const estoqueRecente = veiculos.slice(0, 5);

  return (
    <div className="page">
      <h1>Bem-vindo{perfil?.nome ? `, ${perfil.nome}` : ""}</h1>
      <p className="auth-nota">Logado como {user?.email}</p>

      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Novos Leads Hoje</p>
          <p className="kpi-valor">{novosLeadsHoje}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Negócios em Andamento</p>
          <p className="kpi-valor">{negociosEmAndamento.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Documentos Pendentes</p>
          <p className={`kpi-valor ${documentosPendentes > 0 ? "kpi-negativo" : ""}`}>
            {documentosPendentes}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Valor em Negociações</p>
          <p className="kpi-valor kpi-positivo">{formatMoeda(valorEmNegociacoes)}</p>
        </div>
      </div>

      <div className="painel-secao">
        <h2>Resumo do pipeline de negócios</h2>
        <div className="painel-pipeline">
          {pipelineNegocios.map((p) => (
            <div className="painel-pipeline-item" key={p.status}>
              <p className="kpi-label">
                {p.titulo} ({p.contagem})
              </p>
              <p className="kpi-valor">{formatMoeda(p.valor)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="painel-secao-grid">
        <div className="painel-secao">
          <h2>Leads por estágio</h2>
          <BarraContagem dados={leadsPorEstagio} labels={LEAD_STATUS_LABEL} ordem={LEAD_ORDEM} />
        </div>

        <div className="painel-secao">
          <h2>Veículos por status</h2>
          <BarraContagem dados={veiculosPorStatus} labels={VEICULO_STATUS_LABEL} ordem={VEICULO_ORDEM} />
        </div>
      </div>

      <div className="painel-secao-grid">
        <div className="painel-secao">
          <h2>Próximas ações</h2>
          {proximasAcoes.length === 0 ? (
            <p className="auth-nota">Nenhuma ação pendente. Tudo em dia!</p>
          ) : (
            <ul className="painel-acoes">
              {proximasAcoes.map((a) => (
                <li key={a.key}>
                  <Link to={a.to}>{a.texto}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="painel-secao">
          <h2>Estoque recente</h2>
          {estoqueRecente.length === 0 ? (
            <p className="auth-nota">Nenhum veículo cadastrado ainda.</p>
          ) : (
            <ul className="painel-estoque">
              {estoqueRecente.map((v) => (
                <li key={v.id}>
                  <Link to={`/veiculos/${v.id}/editar`}>
                    {v.marca} {v.modelo}
                    {v.versao ? ` ${v.versao}` : ""}
                  </Link>
                  <span className="painel-estoque-preco">{formatMoeda(v.preco)}</span>
                  <span className={`badge badge-${v.status}`}>
                    {VEICULO_STATUS_LABEL[v.status] ?? v.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
