import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { VeiculoCard } from "../components/VeiculoCard";

const ORDEM_PLANOS = ["pro", "basico", "gratis"];

export default function Inicio() {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase
      .rpc("listar_vitrine_veiculos")
      .then(({ data }) => {
        setVeiculos((data ?? []).slice(0, 18));
        setCarregando(false);
      });
  }, []);

  // Divisão por plano ainda é um placeholder visual: o schema não tem vínculo
  // real garagem→plano (empresas não tem plano_atual, e a tabela assinaturas
  // nem existe ainda — ver "Lacuna crítica" no CLAUDE.md). Até essa lacuna ser
  // resolvida, distribuímos os veículos existentes em round-robin só para
  // ordenar as fileiras (Pro primeiro, depois Básico, depois Grátis) — o
  // plano de cada garagem nunca é mostrado ao público, só define a ordem.
  const grupos = { pro: [], basico: [], gratis: [] };
  veiculos.forEach((v, i) => {
    const chave = ORDEM_PLANOS[i % 3];
    grupos[chave].push(v);
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
        {carregando && <p>Carregando...</p>}
        {!carregando && veiculos.length === 0 && (
          <p className="auth-nota">Nenhum veículo disponível no momento.</p>
        )}

        {!carregando && veiculos.length > 0 && (
          <div className="inicio-secao-header">
            <h2>Veículos em destaque</h2>
            <Link to="/vitrine">Ver todos →</Link>
          </div>
        )}

        {!carregando &&
          ORDEM_PLANOS.filter((chave) => grupos[chave].length > 0).map((chave) => (
            <div className="inicio-carrossel-secao" key={chave}>
              <div className="inicio-carrossel">
                {grupos[chave].map((v) => (
                  <div className="inicio-carrossel-item" key={v.id}>
                    <VeiculoCard veiculo={v} />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
