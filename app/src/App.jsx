import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedLayout } from "./components/ProtectedLayout";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Painel from "./pages/Painel";
import Veiculos from "./pages/Veiculos";
import NovoVeiculo from "./pages/NovoVeiculo";
import Vitrine from "./pages/Vitrine";
import Clientes from "./pages/Clientes";
import NovoCliente from "./pages/NovoCliente";
import Negocios from "./pages/Negocios";
import NovoNegocio from "./pages/NovoNegocio";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/vitrine" element={<Vitrine />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Painel />} />
          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/veiculos/novo" element={<NovoVeiculo />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/novo" element={<NovoCliente />} />
          <Route path="/negocios" element={<Negocios />} />
          <Route path="/negocios/novo" element={<NovoNegocio />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
