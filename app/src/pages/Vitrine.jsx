import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const FILTROS_INICIAIS = {
  marca: "",
  modelo: "",
  combustivel: "",
  cambio: "",
  anoMin: "",
  kmMax: "",
  precoMin: "",
  precoMax: "",
};

function formatPreco(preco) {
  if (preco == null) return "Consulte";
  return Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function uniqueSorted(valores) {
  return [...new Set(valores.filter(Boolean))].sort();
}

export default function Vitrine() {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);

  useEffect(() => {
    supabase
      .rpc("listar_vitrine_veiculos")
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setVeiculos(data);
        setCarregando(false);
      });
  }, []);

  const marcas = useMemo(() => uniqueSorted(veiculos.map((v) => v.marca)), [veiculos]);
  const combustiveis = useMemo(() => uniqueSorted(veiculos.map((v) => v.combustivel)), [veiculos]);
  const cambios = useMemo(() => uniqueSorted(veiculos.map((v) => v.cambio)), [veiculos]);

  function handleFiltro(e) {
    const { name, value } = e.target;
    setFiltros((f) => ({ ...f, [name]: value }));
  }

  const filtrados = veiculos.filter((v) => {
    if (filtros.marca && v.marca !== filtros.marca) return false;
    if (filtros.modelo && !v.modelo?.toLowerCase().includes(filtros.modelo.toLowerCase())) return false;
    if (filtros.combustivel && v.combustivel !== filtros.combustivel) return false;
    if (filtros.cambio && v.cambio !== filtros.cambio) return false;
    if (filtros.anoMin && (v.ano_fabricacao == null || v.ano_fabricacao < Number(filtros.anoMin))) return false;
    if (filtros.kmMax && (v.km == null || v.km > Number(filtros.kmMax))) return false;
    if (filtros.precoMin && (v.preco == null || v.preco < Number(filtros.precoMin))) return false;
    if (filtros.precoMax && (v.preco == null || v.preco > Number(filtros.precoMax))) return false;
    return true;
  });

  return (
    <div className="vitrine">
      <header className="vitrine-header">
        <span className="app-logo">Portal Negócio</span>
        <Link to="/login" className="vitrine-login-link">
          Entrar
        </Link>
      </header>

      <div className="vitrine-content">
        <h1>Veículos disponíveis</h1>

        <div className="vitrine-filtros">
          <select name="marca" value={filtros.marca} onChange={handleFiltro}>
            <option value="">Marca</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input name="modelo" placeholder="Modelo" value={filtros.modelo} onChange={handleFiltro} />

          <select name="combustivel" value={filtros.combustivel} onChange={handleFiltro}>
            <option value="">Combustível</option>
            {combustiveis.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select name="cambio" value={filtros.cambio} onChange={handleFiltro}>
            <option value="">Câmbio</option>
            {cambios.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            name="anoMin"
            type="number"
            placeholder="Ano mínimo"
            value={filtros.anoMin}
            onChange={handleFiltro}
          />

          <input name="kmMax" type="number" placeholder="Km até" value={filtros.kmMax} onChange={handleFiltro} />

          <input
            name="precoMin"
            type="number"
            placeholder="Preço mínimo"
            value={filtros.precoMin}
            onChange={handleFiltro}
          />

          <input
            name="precoMax"
            type="number"
            placeholder="Preço máximo"
            value={filtros.precoMax}
            onChange={handleFiltro}
          />
        </div>

        {carregando && <p>Carregando...</p>}
        {erro && <p className="auth-erro">{erro}</p>}

        {!carregando && !erro && filtrados.length === 0 && (
          <p className="auth-nota">Nenhum veículo encontrado com esses filtros.</p>
        )}

        <div className="vitrine-grid">
          {filtrados.map((v) => (
            <div className="vitrine-card" key={v.id}>
              <div className="vitrine-card-foto">Sem foto</div>
              <div className="vitrine-card-body">
                <h3>
                  {v.marca} {v.modelo}
                </h3>
                {v.versao && <p className="vitrine-card-versao">{v.versao}</p>}
                <p className="vitrine-card-preco">{formatPreco(v.preco)}</p>
                <ul className="vitrine-card-specs">
                  <li>
                    {v.ano_fabricacao ?? "-"}/{v.ano_modelo ?? "-"}
                  </li>
                  <li>{v.km != null ? `${v.km.toLocaleString("pt-BR")} km` : "-"}</li>
                  <li>{v.combustivel ?? "-"}</li>
                  <li>{v.cambio ?? "-"}</li>
                </ul>
                {v.empresa_nome && <p className="vitrine-card-garagem">{v.empresa_nome}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
