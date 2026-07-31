import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { AdminLayout } from "./components/AdminLayout";
import { PublicLayout } from "./components/PublicLayout";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Painel from "./pages/Painel";
import Veiculos from "./pages/Veiculos";
import NovoVeiculo from "./pages/NovoVeiculo";
import EditarVeiculo from "./pages/EditarVeiculo";
import Vitrine from "./pages/Vitrine";
import DetalheVeiculo from "./pages/DetalheVeiculo";
import Inicio from "./pages/Inicio";
import Clientes from "./pages/Clientes";
import NovoCliente from "./pages/NovoCliente";
import EditarCliente from "./pages/EditarCliente";
import Negocios from "./pages/Negocios";
import NovoNegocio from "./pages/NovoNegocio";
import GerarDocumento from "./pages/GerarDocumento";
import VerDocumento from "./pages/VerDocumento";
import DocumentosGerados from "./pages/DocumentosGerados";
import EditarEmpresa from "./pages/EditarEmpresa";
import Planos from "./pages/Planos";
import AdminDashboard from "./pages/AdminDashboard";
import AdminGaragens from "./pages/AdminGaragens";
import AdminDetalheGaragem from "./pages/AdminDetalheGaragem";
import Leads from "./pages/Leads";
import NovoLead from "./pages/NovoLead";
import Crm from "./pages/Crm";
import Vendedores from "./pages/Vendedores";
import NovoVendedor from "./pages/NovoVendedor";
import EditarVendedor from "./pages/EditarVendedor";
import { RotaAdmin } from "./components/RotaAdmin";
import Financeiro from "./pages/Financeiro";
import NovaTransacao from "./pages/NovaTransacao";
import EditarTransacao from "./pages/EditarTransacao";
import ExtratoVendedor from "./pages/ExtratoVendedor";
import IndiceConversao from "./pages/IndiceConversao";
import CalcPMC from "./pages/CalcPMC";
import NovaAvaliacaoPMC from "./pages/NovaAvaliacaoPMC";
import VerAvaliacaoPMC from "./pages/VerAvaliacaoPMC";
import Garagens from "./pages/Garagens";
import ComoFunciona from "./pages/ComoFunciona";
import ParaGaragens from "./pages/ParaGaragens";
import CalculadoraPmcPublica from "./pages/CalculadoraPmcPublica";
import Tutorial from "./pages/Tutorial";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import TermosUso from "./pages/TermosUso";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/vitrine" element={<Vitrine />} />
          <Route path="/vitrine/:id" element={<DetalheVeiculo />} />
          <Route path="/garagens" element={<Garagens />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/para-garagens" element={<ParaGaragens />} />
          <Route path="/calculadora-pmc" element={<CalculadoraPmcPublica />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/termos-uso" element={<TermosUso />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/painel" element={<Painel />} />
          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/veiculos/novo" element={<NovoVeiculo />} />
          <Route path="/veiculos/:id/editar" element={<EditarVeiculo />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/novo" element={<NovoCliente />} />
          <Route path="/clientes/:id/editar" element={<EditarCliente />} />
          <Route path="/negocios" element={<Negocios />} />
          <Route path="/negocios/novo" element={<NovoNegocio />} />
          <Route path="/documentos" element={<DocumentosGerados />} />
          <Route path="/documentos/gerar" element={<GerarDocumento />} />
          <Route path="/documentos/:id" element={<VerDocumento />} />
          <Route path="/empresa" element={<EditarEmpresa />} />
          <Route
            path="/planos"
            element={
              <RotaAdmin>
                <Planos />
              </RotaAdmin>
            }
          />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/novo" element={<NovoLead />} />
          <Route
            path="/crm"
            element={
              <RotaAdmin>
                <Crm />
              </RotaAdmin>
            }
          />
          <Route
            path="/vendedores"
            element={
              <RotaAdmin>
                <Vendedores />
              </RotaAdmin>
            }
          />
          <Route
            path="/vendedores/convidar"
            element={
              <RotaAdmin>
                <NovoVendedor />
              </RotaAdmin>
            }
          />
          <Route
            path="/vendedores/:id"
            element={
              <RotaAdmin>
                <EditarVendedor />
              </RotaAdmin>
            }
          />
          <Route
            path="/financeiro"
            element={
              <RotaAdmin>
                <Financeiro />
              </RotaAdmin>
            }
          />
          <Route
            path="/financeiro/nova"
            element={
              <RotaAdmin>
                <NovaTransacao />
              </RotaAdmin>
            }
          />
          <Route
            path="/financeiro/:id"
            element={
              <RotaAdmin>
                <EditarTransacao />
              </RotaAdmin>
            }
          />
          <Route path="/extrato" element={<ExtratoVendedor />} />
          <Route
            path="/indice-conversao"
            element={
              <RotaAdmin>
                <IndiceConversao />
              </RotaAdmin>
            }
          />
          <Route
            path="/calc-pmc"
            element={
              <RotaAdmin>
                <CalcPMC />
              </RotaAdmin>
            }
          />
          <Route
            path="/calc-pmc/nova"
            element={
              <RotaAdmin>
                <NovaAvaliacaoPMC />
              </RotaAdmin>
            }
          />
          <Route
            path="/calc-pmc/:id"
            element={
              <RotaAdmin>
                <VerAvaliacaoPMC />
              </RotaAdmin>
            }
          />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/garagens" element={<AdminGaragens />} />
          <Route path="/admin/garagens/:id" element={<AdminDetalheGaragem />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
