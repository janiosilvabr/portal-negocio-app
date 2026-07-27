import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const PLANO_BADGE = { gratis: "badge-vendido", basico: "badge-consignado", pro: "badge-disponivel" };

function formatData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function AdminGaragens() {
  const [garagens, setGaragens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [alterandoId, setAlterandoId] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    supabase
      .rpc("admin_listar_garagens")
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setGaragens(data ?? []);
        setCarregando(false);
      });
  }

  async function handleMudarPlano(garagem, novoPlano) {
    setAlterandoId(garagem.id);
    const { error } = await supabase.rpc("admin_mudar_plano_empresa", {
      p_empresa_id: garagem.id,
      p_novo_plano: novoPlano,
    });
    setAlterandoId(null);

    if (error) {
      setErro(error.message);
      return;
    }

    setErro("");
    setGaragens((atual) => atual.map((g) => (g.id === garagem.id ? { ...g, plano: novoPlano } : g)));
  }

  return (
    <div className="page">
      <h1>Garagens</h1>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && garagens.length === 0 && (
        <p className="auth-nota">Nenhuma garagem cadastrada ainda.</p>
      )}

      {!carregando && garagens.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Cidade</th>
                <th>Plano</th>
                <th>Cadastro</th>
                <th>Veículos</th>
                <th>Negócios</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {garagens.map((g) => (
                <tr key={g.id}>
                  <td>
                    {g.nome} {!g.ativo && <span className="badge badge-perdido">Desativada</span>}
                  </td>
                  <td>{g.cnpj ?? "-"}</td>
                  <td>{g.cidade ?? "-"}</td>
                  <td>
                    <select
                      className={`negocio-linha-status badge ${PLANO_BADGE[g.plano]}`}
                      value={g.plano}
                      onChange={(e) => handleMudarPlano(g, e.target.value)}
                      disabled={alterandoId === g.id}
                    >
                      <option value="gratis">Grátis</option>
                      <option value="basico">Básico</option>
                      <option value="pro">Pro</option>
                    </select>
                    {g.trial_expira_em && (
                      <p className="admin-trial-aviso">Teste até {formatData(g.trial_expira_em)}</p>
                    )}
                  </td>
                  <td>{formatData(g.created_at)}</td>
                  <td>{g.qtd_veiculos}</td>
                  <td>{g.qtd_negocios}</td>
                  <td className="tabela-acoes">
                    <Link to={`/admin/garagens/${g.id}`}>Ver detalhe</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
