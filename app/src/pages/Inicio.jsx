import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, SlidersHorizontal } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { VeiculoCard } from "../components/VeiculoCard";

const FILTROS_INICIAIS = {
  marca: "",
  modelo: "",
  combustivel: "",
  cambio: "",
  tipoCarroceria: "",
  anoMin: "",
  kmMax: "",
  precoMin: "",
  precoMax: "",
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

function uniqueSorted(valores) {
  return [...new Set(valores.filter(Boolean))].sort();
}

export default function Inicio() {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);

  useEffect(() => {
    supabase
      .rpc("listar_vitrine_veiculos")
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setVeiculos(data ?? []);
        setCarregando(false);
      });
  }, []);

  const marcas = useMemo(() => uniqueSorted(veiculos.map((v) => v.marca)), [veiculos]);
  const combustiveis = useMemo(() => uniqueSorted(veiculos.map((v) => v.combustivel)), [veiculos]);
  const cambios = useMemo(() => uniqueSorted(veiculos.map((v) => v.cambio)), [veiculos]);
  const tiposCarroceria = useMemo(
    () => uniqueSorted(veiculos.map((v) => v.tipo_carroceria)),
    [veiculos]
  );

  function handleFiltro(e) {
    const { name, value } = e.target;
    setFiltros((f) => ({ ...f, [name]: value }));
  }

  const filtrados = veiculos.filter((v) => {
    if (filtros.marca && v.marca !== filtros.marca) return false;
    if (filtros.modelo && !v.modelo?.toLowerCase().includes(filtros.modelo.toLowerCase())) return false;
    if (filtros.combustivel && v.combustivel !== filtros.combustivel) return false;
    if (filtros.cambio && v.cambio !== filtros.cambio) return false;
    if (filtros.tipoCarroceria && v.tipo_carroceria !== filtros.tipoCarroceria) return false;
    if (filtros.anoMin && (v.ano_fabricacao == null || v.ano_fabricacao < Number(filtros.anoMin))) return false;
    if (filtros.kmMax && (v.km == null || v.km > Number(filtros.kmMax))) return false;
    if (filtros.precoMin && (v.preco == null || v.preco < Number(filtros.precoMin))) return false;
    if (filtros.precoMax && (v.preco == null || v.preco > Number(filtros.precoMax))) return false;
    return true;
  });

  return (
    <>
      <section className="inicio-hero inicio-hero-compacta">
        <div className="inicio-hero-glow" aria-hidden="true" />
        <div className="inicio-hero-inner">
          <span className="inicio-hero-selo">
            <ShieldCheck size={14} />
            VEÍCULOS COM PREÇO JUSTO
          </span>
          <h1>
            O carro ideal <span>para você</span> está aqui.
          </h1>
        </div>
      </section>

      <div className="vitrine-content">
        <h2>Veículos disponíveis</h2>

        <div className="vitrine-filtros-header">
          <SlidersHorizontal size={15} />
          Filtrar veículos
        </div>

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

          <select name="tipoCarroceria" value={filtros.tipoCarroceria} onChange={handleFiltro}>
            <option value="">Tipo</option>
            {tiposCarroceria.map((t) => (
              <option key={t} value={t}>
                {TIPO_CARROCERIA_LABEL[t] ?? t}
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
            <VeiculoCard veiculo={v} key={v.id} />
          ))}
        </div>
      </div>
    </>
  );
}
