import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RotaAdmin({ children }) {
  const { perfil } = useAuth();

  if (!perfil) return null;
  if (perfil.papel !== "admin") return <Navigate to="/" replace />;

  return children;
}
