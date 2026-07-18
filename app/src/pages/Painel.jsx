import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Painel() {
  const { user, perfil } = useAuth();

  return (
    <div className="page">
      <h1>Bem-vindo{perfil?.nome ? `, ${perfil.nome}` : ""}</h1>
      <p>Logado como {user?.email}</p>
      <p className="auth-nota">
        Outros módulos do painel (Clientes, Negócios etc.) ainda não foram construídos.
      </p>
      <Link to="/veiculos" className="botao-link">
        Ver veículos
      </Link>
    </div>
  );
}
