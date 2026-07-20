import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

function formatPreco(preco) {
  if (preco == null) return "Consulte";
  return Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Inicio() {
  const { session, loading } = useAuth();
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
    <div className="vitrine">
      <header className="vitrine-header">
        <span className="app-logo">Portal Negócio</span>
        {!loading && (
          <Link to={session ? "/painel" : "/login"} className="vitrine-login-link">
            {session ? "Meu Painel" : "Entrar"}
          </Link>
        )}
      </header>

      <section className="inicio-hero">
        <div className="inicio-hero-inner">
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
            <div className="vitrine-card" key={v.id}>
              <div className="vitrine-card-foto">
                {v.foto_url ? <img src={v.foto_url} alt="" /> : "Sem foto"}
              </div>
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
                <Link to={`/vitrine/${v.id}`} className="botao-link vitrine-card-detalhes">
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
