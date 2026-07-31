import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Handshake, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function PublicLayout() {
  const { session, loading } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="vitrine">
      <header className="vitrine-header">
        <Link to="/" className="vitrine-logo" onClick={() => setMenuAberto(false)}>
          <span className="vitrine-logo-icone">
            <Handshake size={18} />
          </span>
          Portal Negócio
        </Link>

        <button
          type="button"
          className="vitrine-menu-toggle"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          {menuAberto ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`vitrine-nav ${menuAberto ? "vitrine-nav-aberto" : ""}`}>
          <Link to="/" onClick={() => setMenuAberto(false)}>Início</Link>
          <Link to="/vitrine" onClick={() => setMenuAberto(false)}>Veículos</Link>
          <Link to="/para-garagens" onClick={() => setMenuAberto(false)}>Para Garagens</Link>
          <Link to="/como-funciona" onClick={() => setMenuAberto(false)}>Como Funciona</Link>
          <Link to="/tutorial" onClick={() => setMenuAberto(false)}>Tutorial</Link>
          <Link to="/faq" onClick={() => setMenuAberto(false)}>FAQ</Link>
          <Link to="/garagens" onClick={() => setMenuAberto(false)}>Garagens</Link>
          <Link to="/sobre" onClick={() => setMenuAberto(false)}>Sobre</Link>
          <Link to="/contato" onClick={() => setMenuAberto(false)}>Contato</Link>
          {!loading && (
            <Link
              to={session ? "/painel" : "/login"}
              className="vitrine-login-link vitrine-login-link-mobile"
              onClick={() => setMenuAberto(false)}
            >
              {session ? "Meu Painel" : "Entrar"}
            </Link>
          )}
        </nav>

        {!loading && (
          <Link to={session ? "/painel" : "/login"} className="vitrine-login-link vitrine-login-link-desktop">
            {session ? "Meu Painel" : "Entrar"}
          </Link>
        )}
      </header>

      <Outlet />

      <footer className="vitrine-footer">
        <p>© {new Date().getFullYear()} Portal Negócio. Todos os direitos reservados.</p>
        <div className="vitrine-footer-links">
          <Link to="/calculadora-pmc">Calculadora PMC</Link>
          <Link to="/contrato-compra-e-venda-veiculo-usado">Contrato de Compra e Venda</Link>
          <Link to="/contrato-de-consignacao-veiculo">Contrato de Consignação</Link>
          <Link to="/politica-privacidade">Política de Privacidade</Link>
          <Link to="/termos-uso">Termos de Uso</Link>
        </div>
      </footer>
    </div>
  );
}
