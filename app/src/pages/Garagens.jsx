import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Garagens() {
  const [garagens, setGaragens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase
      .rpc("listar_garagens_publicas")
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setGaragens(data ?? []);
        setCarregando(false);
      });
  }, []);

  return (
    <div className="vitrine-content">
      <h1>Garagens parceiras</h1>
      <p className="auth-nota">Concessionárias e garagens que anunciam no Portal Negócio.</p>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && garagens.length === 0 && (
        <p className="auth-nota">Nenhuma garagem pública no momento.</p>
      )}

      {garagens.length > 0 && (
        <div className="garagens-grid">
          {garagens.map((g) => (
            <Link to={`/vitrine?empresa=${g.id}`} className="garagem-card" key={g.id}>
              <div className="garagem-card-logo">
                {g.logo_url ? <img src={g.logo_url} alt="" /> : g.nome.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3>{g.nome}</h3>
                <p>{g.cidade ?? "Cidade não informada"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
