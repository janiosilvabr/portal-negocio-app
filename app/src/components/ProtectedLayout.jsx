import { Navigate, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Users,
  UserPlus,
  Handshake,
  FileText,
  Calculator,
  Briefcase,
  Wallet,
  Receipt,
  TrendingUp,
  Building2,
  LogOut,
  CreditCard,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function ProtectedLayout() {
  const { session, perfil, loading, logout } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;

  const ehAdmin = perfil?.papel === "admin";

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-logo">
          Portal Negócio
        </Link>
        <nav className="app-nav">
          <Link to="/painel">
            <LayoutDashboard size={16} /> Painel
          </Link>
          <Link to="/veiculos">
            <Car size={16} /> Veículos
          </Link>
          <Link to="/clientes">
            <Users size={16} /> Clientes
          </Link>
          <Link to="/leads">
            <UserPlus size={16} /> Leads
          </Link>
          <Link to="/negocios">
            <Handshake size={16} /> Negócios
          </Link>
          <Link to="/crm">
            <ClipboardCheck size={16} /> CRM
          </Link>
          <Link to="/documentos">
            <FileText size={16} /> Documentos
          </Link>
          <Link to="/calc-pmc">
            <Calculator size={16} /> Calc. PMC
          </Link>
          {ehAdmin && (
            <Link to="/vendedores">
              <Briefcase size={16} /> Vendedores
            </Link>
          )}
          {ehAdmin && (
            <Link to="/financeiro">
              <Wallet size={16} /> Financeiro
            </Link>
          )}
          <Link to="/extrato">
            <Receipt size={16} /> Extrato
          </Link>
          {ehAdmin && (
            <Link to="/indice-conversao">
              <TrendingUp size={16} /> Índice de Conversão
            </Link>
          )}
          <Link to="/empresa">
            <Building2 size={16} /> Empresa
          </Link>
          {ehAdmin && (
            <Link to="/planos">
              <CreditCard size={16} /> Planos
            </Link>
          )}
          {perfil?.is_superadmin && (
            <Link to="/admin">
              <ShieldCheck size={16} /> Admin
            </Link>
          )}
        </nav>
        <button type="button" onClick={logout}>
          <LogOut size={16} /> Sair
        </button>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
