import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Car, Camera, Calendar, Gauge, Fuel, Settings2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const STATUS_LABEL = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
  consignado: "Consignado",
};

function formatPreco(preco) {
  if (preco == null) return "Consulte";
  return Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fotosOrdenadas(v) {
  return [...(v.fotos_veiculos ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [excluindoId, setExcluindoId] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    supabase
      .from("veiculos")
      .select("*, fotos_veiculos(url, ordem)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setVeiculos(data);
        setCarregando(false);
      });
  }

  async function handleExcluir(v) {
    const confirmado = window.confirm(`Excluir o veículo ${v.marca} ${v.modelo}? Essa ação não pode ser desfeita.`);
    if (!confirmado) return;

    setExcluindoId(v.id);
    const { error } = await supabase.from("veiculos").delete().eq("id", v.id);
    setExcluindoId(null);

    if (error) {
      setErro(
        error.message.includes("foreign key")
          ? "Não é possível excluir: este veículo está vinculado a um negócio, consignação ou anúncio. Cancele ou remova esses vínculos primeiro."
          : error.message
      );
      return;
    }

    setErro("");
    setVeiculos((atual) => atual.filter((item) => item.id !== v.id));
  }

  const marcas = useMemo(
    () => [...new Set(veiculos.map((v) => v.marca).filter(Boolean))].sort(),
    [veiculos]
  );

  const termo = busca.trim().toLowerCase();

  const filtrados = veiculos.filter((v) => {
    if (filtroMarca && v.marca !== filtroMarca) return false;
    if (filtroStatus && v.status !== filtroStatus) return false;
    if (!termo) return true;
    const alvo = `${v.marca ?? ""} ${v.modelo ?? ""} ${v.placa ?? ""}`.toLowerCase();
    return alvo.includes(termo);
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Veículos</h1>
          <p className="lista-subtitulo">{veiculos.length} veículo(s) no estoque</p>
        </div>
        <Link to="/veiculos/novo" className="botao-link">
          + Novo Veículo
        </Link>
      </div>

      <div className="vitrine-filtros-header">
        <Search size={15} />
        Filtros
      </div>

      <div className="vitrine-filtros">
        <input
          placeholder="Marca, modelo, placa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)}>
          <option value="">Todas as marcas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && (
        <p className="lista-subtitulo">{filtrados.length} veículo(s) encontrado(s)</p>
      )}

      {!carregando && !erro && filtrados.length === 0 && (
        <p className="auth-nota">Nenhum veículo encontrado.</p>
      )}

      {filtrados.length > 0 && (
        <div className="veiculos-grid">
          {filtrados.map((v) => {
            const fotos = fotosOrdenadas(v);
            const foto = fotos[0]?.url;
            return (
              <div className="veiculo-card" key={v.id}>
                <div className="veiculo-card-foto">
                  <span className={`badge badge-${v.status} veiculo-card-badge-status`}>
                    {STATUS_LABEL[v.status] ?? v.status}
                  </span>
                  {fotos.length > 0 && (
                    <span className="veiculo-card-badge-fotos">
                      <Camera size={12} /> {fotos.length}
                    </span>
                  )}
                  {foto ? <img src={foto} alt="" /> : <Car size={28} />}
                </div>

                <div className="veiculo-card-body">
                  <p className="veiculo-card-preco">{formatPreco(v.preco)}</p>
                  <h3>
                    {v.marca} {v.modelo}
                  </h3>
                  {v.versao && <p className="vitrine-card-versao">{v.versao}</p>}

                  <ul className="vitrine-card-specs">
                    <li>
                      <Calendar size={13} />
                      {v.ano_fabricacao ?? "-"}/{v.ano_modelo ?? "-"}
                    </li>
                    <li>
                      <Gauge size={13} />
                      {v.km != null ? `${v.km.toLocaleString("pt-BR")} km` : "-"}
                    </li>
                    <li>
                      <Fuel size={13} />
                      {v.combustivel ?? "-"}
                    </li>
                    <li>
                      <Settings2 size={13} />
                      {v.cambio ?? "-"}
                    </li>
                  </ul>

                  <div className="veiculo-card-acoes">
                    <Link to={`/veiculos/${v.id}/editar`} className="botao-link veiculo-card-editar">
                      <Pencil size={14} /> Editar
                    </Link>
                    <button
                      type="button"
                      className="veiculo-card-excluir"
                      onClick={() => handleExcluir(v)}
                      disabled={excluindoId === v.id}
                      aria-label="Excluir veículo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
