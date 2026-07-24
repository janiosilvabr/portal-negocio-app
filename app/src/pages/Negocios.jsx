import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Car, FileText } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const COLUNAS = [
  { status: "em_andamento", titulo: "Em andamento", badge: "badge-consignado" },
  { status: "fechado", titulo: "Fechado", badge: "badge-disponivel" },
  { status: "cancelado", titulo: "Cancelado", badge: "badge-vendido" },
];

const BADGE_POR_STATUS = Object.fromEntries(COLUNAS.map((c) => [c.status, c.badge]));

function formatPreco(preco) {
  if (preco == null) return "Consulte";
  return Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fotoDoNegocio(n) {
  const fotos = n.veiculos?.fotos_veiculos;
  if (!fotos || fotos.length === 0) return null;
  return [...fotos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))[0]?.url ?? null;
}

export default function Negocios() {
  const [negocios, setNegocios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
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
        .from("negocios")
        .select(
          "*, veiculos(marca, modelo, fotos_veiculos(url, ordem)), clientes(nome), vendedor:usuarios(nome)"
        )
        .order("created_at", { ascending: false }),
      supabase.rpc("listar_equipe_empresa"),
    ]).then(([{ data, error }, { data: dataUsuarios }]) => {
      if (error) setErro(error.message);
      else setNegocios(data);
      setUsuarios((dataUsuarios ?? []).filter((u) => u.ativo));
      setCarregando(false);
    });
  }

  async function handleVendedorChange(negocio, novoVendedorId) {
    const { data, error } = await supabase
      .from("negocios")
      .update({ vendedor_id: novoVendedorId || null })
      .eq("id", negocio.id)
      .select(
        "*, veiculos(marca, modelo, fotos_veiculos(url, ordem)), clientes(nome), vendedor:usuarios(nome)"
      )
      .maybeSingle();

    if (error) {
      setErro(error.message);
      return;
    }

    setErro("");
    setNegocios((atual) => atual.map((n) => (n.id === negocio.id ? data : n)));
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

    if (novoStatus === "fechado") {
      const consolidar = window.confirm(
        "Negócio fechado! A receita e a comissão do vendedor já foram lançadas automaticamente.\n\n" +
          "Quer também consolidar os custos lançados neste veículo (compra, mecânica, estética...) como uma despesa no Financeiro?"
      );
      if (consolidar) {
        await consolidarCustosComoDespesa(negocio);
      }
    }
  }

  async function consolidarCustosComoDespesa(negocio) {
    const { data: custos, error: erroCustos } = await supabase
      .from("custos_veiculo")
      .select("valor")
      .eq("veiculo_id", negocio.veiculo_id);

    if (erroCustos) {
      setErro(erroCustos.message);
      return;
    }

    const soma = (custos ?? []).reduce((s, c) => s + Number(c.valor ?? 0), 0);
    if (soma <= 0) {
      setErro("Nenhum custo lançado para este veículo — nada a consolidar.");
      return;
    }

    const { error } = await supabase.from("transacoes_financeiras").insert({
      empresa_id: negocio.empresa_id,
      tipo: "despesa",
      categoria: "custo_veiculo",
      descricao: "Custos consolidados do veículo",
      valor: soma,
      negocio_id: negocio.id,
      data: new Date().toISOString().slice(0, 10),
      status: "pago",
    });

    if (error) setErro(error.message);
  }

  const termo = busca.trim().toLowerCase();

  const filtrados = negocios.filter((n) => {
    if (abaAtiva !== "todos" && n.status !== abaAtiva) return false;
    if (!termo) return true;
    const cliente = n.clientes?.nome?.toLowerCase() ?? "";
    const veiculo = n.veiculos ? `${n.veiculos.marca} ${n.veiculos.modelo}`.toLowerCase() : "";
    return cliente.includes(termo) || veiculo.includes(termo);
  });

  const resumo = useMemo(() => {
    const emAndamento = negocios.filter((n) => n.status === "em_andamento");
    const fechados = negocios.filter((n) => n.status === "fechado");
    const valorTotal = negocios.reduce((s, n) => s + Number(n.valor ?? 0), 0);
    const conversao = negocios.length > 0 ? (fechados.length / negocios.length) * 100 : 0;
    return {
      total: negocios.length,
      emAndamento: emAndamento.length,
      valorTotal,
      conversao,
    };
  }, [negocios]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Negócios</h1>
        <Link to="/negocios/novo" className="botao-link">
          + Novo Negócio
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
          Todos <span className="lista-aba-contador">{negocios.length}</span>
        </button>
        {COLUNAS.map((c) => (
          <button
            type="button"
            key={c.status}
            className={`lista-aba ${abaAtiva === c.status ? "ativa" : ""}`}
            onClick={() => setAbaAtiva(c.status)}
          >
            {c.titulo}{" "}
            <span className="lista-aba-contador">
              {negocios.filter((n) => n.status === c.status).length}
            </span>
          </button>
        ))}
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && filtrados.length === 0 && (
        <p className="auth-nota">Nenhum negócio encontrado.</p>
      )}

      {!carregando && !erro && filtrados.length > 0 && (
        <div className="lista-linhas">
          {filtrados.map((n) => {
            const foto = fotoDoNegocio(n);
            return (
              <div className="negocio-linha" key={n.id}>
                <div className="negocio-linha-foto">
                  {foto ? <img src={foto} alt="" /> : <Car size={18} />}
                </div>

                <div className="negocio-linha-principal">
                  <p className="negocio-linha-titulo">
                    {n.clientes?.nome ?? "Cliente removido"}
                    <span className={`badge badge-${n.tipo}`}>
                      {n.tipo === "consignacao" ? "Consignação" : "Venda"}
                    </span>
                  </p>
                  <p className="negocio-linha-veiculo">
                    {n.veiculos ? `${n.veiculos.marca} ${n.veiculos.modelo}` : "Veículo removido"}
                  </p>
                </div>

                <p className="negocio-linha-valor">{formatPreco(n.valor)}</p>

                <div className="negocio-linha-vendedor">
                  <label>Vendedor</label>
                  <select
                    className={!n.vendedor_id ? "negocio-vendedor-vazio" : ""}
                    value={n.vendedor_id ?? ""}
                    onChange={(e) => handleVendedorChange(n, e.target.value)}
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                  {!n.vendedor_id && (
                    <span className="negocio-vendedor-alerta">⚠️ Sem vendedor responsável.</span>
                  )}
                </div>

                <select
                  className={`negocio-linha-status badge ${BADGE_POR_STATUS[n.status]}`}
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
                  <Link className="negocio-linha-doc" to={`/documentos/gerar?negocio_id=${n.id}`}>
                    <FileText size={14} /> Gerar Documento
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!carregando && !erro && (
        <div className="painel-secao">
          <h2>Resumo do pipeline</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div>
                <p className="kpi-label">Total de Negócios</p>
                <p className="kpi-valor">{resumo.total}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div>
                <p className="kpi-label">Em Andamento</p>
                <p className="kpi-valor">{resumo.emAndamento}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div>
                <p className="kpi-label">Valor Total</p>
                <p className="kpi-valor">{formatPreco(resumo.valorTotal)}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div>
                <p className="kpi-label">Conversão</p>
                <p className="kpi-valor">{resumo.conversao.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
