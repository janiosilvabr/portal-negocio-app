import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { VeiculoCard } from "../components/VeiculoCard";

export default function Inicio() {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase
      .rpc("listar_vitrine_veiculos")
      .then(({ data }) => {
        setVeiculos((data ?? []).slice(0, 6));
        setCarregando(false);
      });
  }, []);

  return (
    <>
      <section className="inicio-hero">
        <div className="inicio-hero-glow" aria-hidden="true" />
        <div className="inicio-hero-inner">
          <span className="inicio-hero-selo">
            <ShieldCheck size={14} />
            VEÍCULOS COM PREÇO JUSTO
          </span>
          <h1>
            O carro ideal <span>para você</span> está aqui.
          </h1>
          <p>
            Encontre veículos usados com preço justo, direto com garagens e concessionárias
            de confiança — sem intermediários.
          </p>
          <Link to="/vitrine" className="botao-link inicio-hero-cta">
            Ver Veículos
          </Link>
        </div>
      </section>

      <div className="vitrine-content">
        <div className="inicio-secao-header">
          <h2>Veículos disponíveis</h2>
          <Link to="/vitrine">Ver todos →</Link>
        </div>

        {carregando && <p>Carregando...</p>}
        {!carregando && veiculos.length === 0 && (
          <p className="auth-nota">Nenhum veículo disponível no momento.</p>
        )}

        <div className="vitrine-grid">
          {veiculos.map((v) => (
            <VeiculoCard veiculo={v} key={v.id} />
          ))}
        </div>
      </div>
    </>
  );
}
