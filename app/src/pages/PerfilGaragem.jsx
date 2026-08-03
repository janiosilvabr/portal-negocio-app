import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { linkWhatsapp } from "../lib/whatsapp";
import { VeiculoCard } from "../components/VeiculoCard";

export default function PerfilGaragem() {
  const { id } = useParams();
  const [garagem, setGaragem] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  useEffect(() => {
    setCarregando(true);
    setNaoEncontrada(false);

    Promise.all([
      supabase.rpc("obter_garagem_publica", { p_empresa_id: id }).maybeSingle(),
      supabase.rpc("listar_vitrine_veiculos"),
    ]).then(([{ data: dataGaragem, error: erroGaragem }, { data: dataVeiculos }]) => {
      if (erroGaragem || !dataGaragem) {
        setNaoEncontrada(true);
      } else {
        setGaragem(dataGaragem);
        setVeiculos((dataVeiculos ?? []).filter((v) => v.empresa_id === id));
      }
      setCarregando(false);
    });
  }, [id]);

  useEffect(() => {
    if (!garagem) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AutomotiveBusiness",
      name: garagem.nome,
      ...(garagem.logo_url && { image: garagem.logo_url }),
      ...(garagem.cidade && { address: { "@type": "PostalAddress", addressLocality: garagem.cidade } }),
      ...(garagem.telefone && { telephone: garagem.telefone }),
    });
    document.head.appendChild(script);

    return () => document.head.removeChild(script);
  }, [garagem]);

  if (carregando) {
    return (
      <div className="vitrine-content">
        <p>Carregando...</p>
      </div>
    );
  }

  if (naoEncontrada) {
    return (
      <div className="vitrine-content">
        <p className="auth-erro">Garagem não encontrada.</p>
        <Link to="/garagens" className="botao-link">
          Voltar para Garagens
        </Link>
      </div>
    );
  }

  const whatsapp = linkWhatsapp(garagem.telefone);

  return (
    <div className="vitrine-content">
      <Link to="/garagens" className="detalhe-voltar">
        ← Voltar para Garagens
      </Link>

      <div className="garagem-perfil-hero">
        <div className="garagem-perfil-hero-logo">
          {garagem.logo_url ? (
            <img src={garagem.logo_url} alt="" />
          ) : (
            garagem.nome.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="garagem-perfil-hero-info">
          <h1>{garagem.nome}</h1>
          <p className="garagem-perfil-hero-cidade">{garagem.cidade ?? "Cidade não informada"}</p>
          {garagem.sobre && <p className="garagem-perfil-hero-sobre">{garagem.sobre}</p>}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="botao-link contato-botao-whatsapp">
              <MessageCircle size={16} /> Falar com a garagem
            </a>
          )}
        </div>
      </div>

      <h2>Veículos disponíveis</h2>

      {veiculos.length === 0 ? (
        <p className="auth-nota">Nenhum veículo disponível no momento.</p>
      ) : (
        <div className="vitrine-grid">
          {veiculos.map((v) => (
            <VeiculoCard veiculo={v} key={v.id} />
          ))}
        </div>
      )}
    </div>
  );
}
