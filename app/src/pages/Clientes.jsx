import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setClientes(data);
        setCarregando(false);
      });
  }, []);

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? clientes.filter(
        (c) =>
          c.nome?.toLowerCase().includes(termo) ||
          c.cpf?.toLowerCase().includes(termo) ||
          c.email?.toLowerCase().includes(termo)
      )
    : clientes;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clientes</h1>
        <Link to="/clientes/novo" className="botao-link">
          + Novo Cliente
        </Link>
      </div>

      <input
        className="busca-input"
        placeholder="Buscar por nome, CPF ou e-mail"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {carregando && <p>Carregando...</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      {!carregando && !erro && filtrados.length === 0 && (
        <p className="auth-nota">Nenhum cliente encontrado.</p>
      )}

      {filtrados.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Endereço</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.cpf ?? "-"}</td>
                  <td>{c.telefone ?? "-"}</td>
                  <td>{c.email ?? "-"}</td>
                  <td>{c.endereco ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
