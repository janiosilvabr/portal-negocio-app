import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedLayout() {
  const { session, loading, logout } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">Portal Negócio</span>
        <nav className="app-nav">
          <Link to="/">Painel</Link>
          <Link to="/veiculos">Veículos</Link>
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
