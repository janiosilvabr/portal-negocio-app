import { Navigate, Outlet, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, Newspaper, LogOut, ArrowLeftCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Layout próprio do Painel Admin (dono do SaaS) — separado de propósito
// do ProtectedLayout (painel de cada garagem): menu enxuto, cor diferente,
// pra nunca ficar confundido com o painel de uma garagem cliente.
export function AdminLayout() {
  const { session, perfil, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;

  async function handleSair() {
    await logout();
    navigate("/");
  }

  return (
    <div className="app-shell admin-shell">
      <header className="app-header admin-header">
        <Link to="/admin" className="app-logo">
          ⚙ Administração do Portal Negócio
        </Link>
        <nav className="app-nav">
          <Link to="/admin">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link to="/admin/garagens">
            <Building2 size={16} /> Garagens
          </Link>
          <Link to="/admin/blog">
            <Newspaper size={16} /> Artigos
          </Link>
        </nav>
        <div className="app-header-acoes">
          <Link to="/painel" className="app-admin-link">
            <ArrowLeftCircle size={16} /> Voltar ao meu painel
          </Link>
          <button type="button" onClick={handleSair}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>
      <main className="app-content">
        {perfil && !perfil.is_superadmin ? <Navigate to="/painel" replace /> : <Outlet />}
      </main>
    </div>
  );
}
