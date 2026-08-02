import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Coins } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { cnpjValido } from "../lib/cnpj";
import { salvarIntencaoCheckout } from "../lib/checkoutIntent";
import { iniciarCheckout } from "../lib/iniciarCheckout";

const RECURSOS_POR_PLANO = {
  "Grátis": ["Vitrine pública", "CRM básico de leads", "Cadastro de clientes"],
  "Básico": ["CRM completo de leads", "Pipeline de negócios", "Financeiro básico", "Painel da empresa", "Veículos em destaque na Home, à frente do plano Grátis"],
  "Pro": ["CRM completo de leads", "Pipeline de negócios", "Financeiro completo", "Painel com indicadores", "Envio de contrato por e-mail", "Veículos na primeira fileira da Home, à frente dos demais planos"],
};

const STATUS_MENSAGEM = {
  aprovado: { texto: "Pagamento aprovado! Pode levar alguns instantes até seu plano/créditos atualizarem aqui.", classe: "auth-sucesso" },
  recusado: { texto: "Pagamento não foi aprovado. Nenhuma cobrança foi feita.", classe: "auth-erro" },
  pendente: { texto: "Pagamento pendente de confirmação. Assim que aprovado, atualizamos automaticamente.", classe: "auth-nota" },
};

function formatPreco(valor) {
  if (!valor || Number(valor) === 0) return "Grátis";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Planos() {
  const { session, perfil, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [empresa, setEmpresa] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoPlanoId, setProcessandoPlanoId] = useState(null);
  const [quantidadeCreditos, setQuantidadeCreditos] = useState(1);
  const [comprandoCreditos, setComprandoCreditos] = useState(false);
  const [erro, setErro] = useState("");

  const statusCheckout = searchParams.get("status");
  const logado = Boolean(session);

  useEffect(() => {
    if (authLoading) return;

    const consultaPlanos = supabase.from("planos").select("*").order("preco_mensal", { ascending: true });

    if (!logado) {
      consultaPlanos.then(({ data }) => {
        setPlanos(data ?? []);
        setCarregando(false);
      });
      return;
    }

    Promise.all([
      supabase
        .from("empresas")
        .select("plano, cnpj, creditos_anuncios_disponiveis, creditos_documentos_disponiveis")
        .eq("id", perfil?.empresa_id)
        .single(),
      consultaPlanos,
    ]).then(([{ data: dataEmpresa }, { data: dataPlanos }]) => {
      setEmpresa(dataEmpresa);
      setPlanos(dataPlanos ?? []);
      setCarregando(false);
    });
  }, [authLoading, logado, perfil?.empresa_id]);

  function iniciarOuRedirecionar(intencao, aoProcessar) {
    if (!logado) {
      salvarIntencaoCheckout(intencao);
      navigate("/cadastro");
      return;
    }

    if (!cnpjValido(empresa?.cnpj)) {
      setErro("Complete o CNPJ da sua empresa antes de assinar um plano pago ou comprar créditos.");
      return;
    }

    setErro("");
    aoProcessar(true);

    iniciarCheckout(intencao)
      .catch((e) => {
        aoProcessar(false);
        setErro(e.message ?? "Falha ao iniciar checkout.");
      });
  }

  function assinarPlano(plano) {
    iniciarOuRedirecionar(
      { tipo: "assinatura", plano_id: plano.id },
      (processando) => setProcessandoPlanoId(processando ? plano.id : null)
    );
  }

  function comprarCreditos(e) {
    e.preventDefault();
    iniciarOuRedirecionar(
      { tipo: "creditos", quantidade: Number(quantidadeCreditos) },
      setComprandoCreditos
    );
  }

  if (authLoading || carregando) {
    return (
      <div className="vitrine-content">
        <p>Carregando...</p>
      </div>
    );
  }

  const mensagemStatus = statusCheckout ? STATUS_MENSAGEM[statusCheckout] : null;
  const cnpjPendente = logado && !cnpjValido(empresa?.cnpj);

  return (
    <div className="vitrine-content">
      <h1>Planos e créditos</h1>

      {mensagemStatus && <p className={mensagemStatus.classe}>{mensagemStatus.texto}</p>}
      {cnpjPendente && (
        <p className="auth-nota">
          Sua empresa ainda não tem CNPJ cadastrado — necessário para assinar um plano pago ou
          comprar créditos. <Link to="/empresa">Complete o cadastro da empresa</Link>.
        </p>
      )}
      {erro && <p className="auth-erro">{erro}</p>}

      <div className="cf-planos-grid">
        {planos.map((plano) => {
          const limiteDocumentos = plano.recursos?.limite_documentos ?? 0;
          const ehPlanoAtual =
            logado && empresa?.plano === (plano.nome === "Pro" ? "pro" : plano.nome === "Básico" ? "basico" : "gratis");
          const ehGratis = Number(plano.preco_mensal) === 0;

          return (
            <div className={`cf-plano-card ${plano.nome === "Pro" ? "cf-plano-destaque" : ""}`} key={plano.id}>
              {ehPlanoAtual && <span className="cf-plano-selo">SEU PLANO ATUAL</span>}
              <h3>{plano.nome}</h3>
              <p className="cf-plano-preco">
                {formatPreco(plano.preco_mensal)}
                {Number(plano.preco_mensal) > 0 && <span>/mês</span>}
              </p>
              <ul className="cf-plano-lista">
                <li>
                  <Check size={15} /> Até {plano.limite_veiculos} anúncios ativos
                </li>
                <li>
                  <Check size={15} />{" "}
                  {limiteDocumentos > 0 ? `${limiteDocumentos} gerações de contrato/mês` : "Sem geração de contrato"}
                </li>
                {(RECURSOS_POR_PLANO[plano.nome] ?? []).map((r) => (
                  <li key={r}>
                    <Check size={15} /> {r}
                  </li>
                ))}
              </ul>
              {ehPlanoAtual ? (
                <button type="button" className="botao-link cf-plano-cta" disabled>
                  Plano atual
                </button>
              ) : ehGratis ? (
                logado ? (
                  <span className="auth-nota">Plano de entrada, sem custo.</span>
                ) : (
                  <Link to="/cadastro" className="botao-link cf-plano-cta">
                    Criar conta grátis
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  className="botao-link cf-plano-cta"
                  onClick={() => assinarPlano(plano)}
                  disabled={processandoPlanoId === plano.id}
                >
                  {processandoPlanoId === plano.id ? "Abrindo checkout..." : `Assinar ${plano.nome}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="painel-secao">
        <h2>
          <Coins size={18} /> Créditos avulsos
        </h2>
        <p className="auth-nota">
          Disponível para qualquer plano. Cada crédito (R$ 10,00) dá direito a +1 anúncio ativo
          e +1 geração de documento, consumidos separadamente conforme forem usados. Não expiram.
        </p>

        {logado && (
          <div className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-label">Créditos de anúncio disponíveis</p>
              <p className="kpi-valor">{empresa?.creditos_anuncios_disponiveis ?? 0}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Créditos de documento disponíveis</p>
              <p className="kpi-valor">{empresa?.creditos_documentos_disponiveis ?? 0}</p>
            </div>
          </div>
        )}

        <form className="form-card" onSubmit={comprarCreditos}>
          <label htmlFor="quantidade-creditos">Quantos créditos você quer comprar?</label>
          <input
            id="quantidade-creditos"
            type="number"
            min="1"
            step="1"
            value={quantidadeCreditos}
            onChange={(e) => setQuantidadeCreditos(e.target.value)}
            required
          />
          <p className="auth-nota">Total: {formatPreco(Number(quantidadeCreditos || 0) * 10)}</p>
          <button type="submit" disabled={comprandoCreditos}>
            {comprandoCreditos ? "Abrindo checkout..." : "Comprar créditos"}
          </button>
        </form>
      </div>
    </div>
  );
}
