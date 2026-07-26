import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Coins } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

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
  const { perfil } = useAuth();
  const [searchParams] = useSearchParams();
  const [empresa, setEmpresa] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoPlanoId, setProcessandoPlanoId] = useState(null);
  const [quantidadeCreditos, setQuantidadeCreditos] = useState(1);
  const [comprandoCreditos, setComprandoCreditos] = useState(false);
  const [erro, setErro] = useState("");

  const statusCheckout = searchParams.get("status");

  useEffect(() => {
    if (!perfil?.empresa_id) return;

    Promise.all([
      supabase.from("empresas").select("plano, creditos_anuncios_disponiveis, creditos_documentos_disponiveis").eq("id", perfil.empresa_id).single(),
      supabase.from("planos").select("*").order("preco_mensal", { ascending: true }),
    ]).then(([{ data: dataEmpresa }, { data: dataPlanos }]) => {
      setEmpresa(dataEmpresa);
      setPlanos(dataPlanos ?? []);
      setCarregando(false);
    });
  }, [perfil?.empresa_id]);

  async function assinarPlano(plano) {
    setErro("");
    setProcessandoPlanoId(plano.id);

    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("criar-checkout-mp", {
      body: { tipo: "assinatura", plano_id: plano.id },
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
    });

    setProcessandoPlanoId(null);

    if (error || data?.error) {
      setErro(data?.error ?? error.message ?? "Falha ao iniciar checkout.");
      return;
    }

    window.location.href = data.init_point;
  }

  async function comprarCreditos(e) {
    e.preventDefault();
    setErro("");
    setComprandoCreditos(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("criar-checkout-mp", {
      body: { tipo: "creditos", quantidade: Number(quantidadeCreditos) },
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
    });

    setComprandoCreditos(false);

    if (error || data?.error) {
      setErro(data?.error ?? error.message ?? "Falha ao iniciar checkout.");
      return;
    }

    window.location.href = data.init_point;
  }

  if (carregando) {
    return (
      <div className="page">
        <p>Carregando...</p>
      </div>
    );
  }

  const mensagemStatus = statusCheckout ? STATUS_MENSAGEM[statusCheckout] : null;

  return (
    <div className="page">
      <h1>Planos e créditos</h1>

      {mensagemStatus && <p className={mensagemStatus.classe}>{mensagemStatus.texto}</p>}
      {erro && <p className="auth-erro">{erro}</p>}

      <div className="cf-planos-grid">
        {planos.map((plano) => {
          const limiteDocumentos = plano.recursos?.limite_documentos ?? 0;
          const ehPlanoAtual = empresa?.plano === (plano.nome === "Pro" ? "pro" : plano.nome === "Básico" ? "basico" : "gratis");
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
              ) : Number(plano.preco_mensal) > 0 ? (
                <button
                  type="button"
                  className="botao-link cf-plano-cta"
                  onClick={() => assinarPlano(plano)}
                  disabled={processandoPlanoId === plano.id}
                >
                  {processandoPlanoId === plano.id ? "Abrindo checkout..." : `Assinar ${plano.nome}`}
                </button>
              ) : (
                <span className="auth-nota">Plano de entrada, sem custo.</span>
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
