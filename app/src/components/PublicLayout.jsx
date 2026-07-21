import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function PublicLayout() {
  const { session, loading } = useAuth();

  return (
    <div className="vitrine">
      <header className="vitrine-header">
        <Link to="/" className="app-logo">
          Portal Negócio
        </Link>
        <nav className="vitrine-nav">
          <Link to="/">Início</Link>
          <Link to="/vitrine">Veículos</Link>
          <Link to="/garagens">Garagens</Link>
          <Link to="/sobre">Sobre</Link>
          <Link to="/contato">Contato</Link>
        </nav>
        {!loading && (
          <Link to={session ? "/painel" : "/login"} className="vitrine-login-link">
            {session ? "Meu Painel" : "Entrar"}
          </Link>
        )}
      </header>

      <Outlet />

      <footer className="vitrine-footer">
        <p>© {new Date().getFullYear()} Portal Negócio. Todos os direitos reservados.</p>
        <div className="vitrine-footer-links">
          <Link to="/politica-privacidade">Política de Privacidade</Link>
          <Link to="/termos-uso">Termos de Uso</Link>
        </div>
      </footer>
    </div>
  );
}
