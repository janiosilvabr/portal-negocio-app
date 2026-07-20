import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MODULOS = [
  { to: "/veiculos", titulo: "Veículos", descricao: "Cadastro, fotos e checklist de vistoria." },
  { to: "/clientes", titulo: "Clientes", descricao: "Cadastro de compradores e consignantes." },
  { to: "/leads", titulo: "Leads", descricao: "Kanban de atendimento (CRM)." },
  { to: "/negocios", titulo: "Negócios", descricao: "Pipeline de vendas e consignações." },
  { to: "/documentos", titulo: "Documentos", descricao: "Contratos gerados automaticamente." },
  { to: "/vendedores", titulo: "Vendedores", descricao: "Equipe, convites e comissão.", admin: true },
  { to: "/financeiro", titulo: "Financeiro", descricao: "Receitas, despesas e lucro líquido.", admin: true },
  { to: "/extrato", titulo: "Extrato", descricao: "Suas comissões e taxa de conversão." },
  {
    to: "/indice-conversao",
    titulo: "Índice de Conversão",
    descricao: "Ranking do mês por vendedor.",
    admin: true,
  },
];

export default function Painel() {
  const { user, perfil } = useAuth();
  const ehAdmin = perfil?.papel === "admin";

  return (
    <div className="page">
      <h1>Bem-vindo{perfil?.nome ? `, ${perfil.nome}` : ""}</h1>
      <p>Logado como {user?.email}</p>

      <div className="painel-grid">
        {MODULOS.filter((m) => !m.admin || ehAdmin).map((m) => (
          <Link to={m.to} className="painel-card" key={m.to}>
            <h2>{m.titulo}</h2>
            <p>{m.descricao}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
