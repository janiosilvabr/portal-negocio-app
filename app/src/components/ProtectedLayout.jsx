import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedLayout() {
  const { session, perfil, loading, logout } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;

  const ehAdmin = perfil?.papel === "admin";

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">Portal Negócio</span>
        <nav className="app-nav">
          <Link to="/painel">Painel</Link>
          <Link to="/veiculos">Veículos</Link>
          <Link to="/clientes">Clientes</Link>
          <Link to="/leads">Leads</Link>
          <Link to="/negocios">Negócios</Link>
          <Link to="/documentos">Documentos</Link>
          <Link to="/calc-pmc">Calc. PMC</Link>
          {ehAdmin && <Link to="/vendedores">Vendedores</Link>}
          {ehAdmin && <Link to="/financeiro">Financeiro</Link>}
          <Link to="/extrato">Extrato</Link>
          {ehAdmin && <Link to="/indice-conversao">Índice de Conversão</Link>}
          <Link to="/empresa">Empresa</Link>
        </nav>
        <button type="button" onClick={logout}>
          Sair
        </button>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
