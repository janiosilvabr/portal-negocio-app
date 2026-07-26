import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RotaSuperAdmin({ children }) {
  const { perfil } = useAuth();

  if (!perfil) return null;
  if (!perfil.is_superadmin) return <Navigate to="/painel" replace />;

  return children;
}
