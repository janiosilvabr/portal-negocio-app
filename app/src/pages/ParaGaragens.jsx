import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Calculator,
  LayoutDashboard,
  Car,
  UserPlus,
  Handshake,
  Wallet,
  CheckCircle2,
  Check,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const DORES = [
  {
    icone: FileText,
    titulo: "Vender sem contrato seguro",
    texto:
      "Contratos de compra e venda e de consignação são gerados automaticamente por IA, a partir dos dados que você já cadastrou. A IA preenche um modelo de minuta padrão, estruturado com base na legislação vigente — um rascunho pronto pra você revisar e ajustar, em vez de sair improvisando um contrato do zero na hora da venda.",
  },
  {
    icone: Calculator,
    titulo: "Comprar sem saber a margem real",
    texto:
      "Antes de fechar a compra de um veículo, use a Calculadora PMC para saber o preço máximo que vale a pena pagar sem comer sua margem de lucro.",
    link: { to: "/calculadora-pmc", texto: "Conhecer a Calculadora PMC" },
  },
  {
    icone: LayoutDashboard,
    titulo: "Operar no improviso",
    texto:
      "CRM de leads, pipeline de negócios, gestão de vendedores e financeiro atualizado automaticamente a cada venda — sem depender de planilha paralela ou de decorar em que pé está cada negociação.",
  },
];

const FLUXO = [
  { icone: Car, texto: "Veículo cadastrado" },
  { icone: UserPlus, texto: "Lead" },
  { icone: Handshake, texto: "Negócio" },
  { icone: CheckCircle2, texto: "Venda fechada" },
  { icone: Wallet, texto: "Financeiro atualizado" },
  { icone: FileText, texto: "Contrato gerado" },
];

const RESUMO_POR_PLANO = {
  "Grátis": ["Até 4 anúncios", "Vitrine pública"],
  "Básico": ["CRM completo, pipeline", "Painel da empresa"],
  "Pro": ["Tudo do Básico", "Financeiro completo", "Envio de contrato por e-mail", "Destaque na home"],
};

const FAQS = [
  {
    pergunta: "Preciso saber tecnologia para usar?",
    resposta:
      "Não. Se você sabe usar WhatsApp e enviar uma foto, sabe usar o Portal Negócio — a interface foi pensada pra quem trabalha na loja, não pra quem trabalha em TI.",
  },
  {
    pergunta: "O contrato gerado tem validade jurídica?",
    resposta:
      "O texto é um modelo de minuta padrão, elaborado com base na legislação vigente, com blocos condicionais pra cada situação (consignação, financiamento em aberto etc.). A IA preenche os dados — não redige cláusula nova —, mas o documento nasce como rascunho: a leitura completa e a decisão de uso são sempre responsabilidade de quem está negociando.",
  },
  {
    pergunta: "Posso cancelar quando quiser?",
    resposta:
      "Sim, sem fidelidade. Você pode usar o plano Grátis por tempo indeterminado ou cancelar a assinatura paga quando quiser.",
  },
];

function formatPreco(valor) {
  if (!valor || Number(valor) === 0) return "Grátis";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function scrollSuaveParaComoFunciona(e) {
  e.preventDefault();
  document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
}

export default function ParaGaragens() {
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [faqAberta, setFaqAberta] = useState(null);

  useEffect(() => {
    supabase
      .from("planos")
      .select("*")
      .in("nome", ["Grátis", "Básico", "Pro"])
      .order("preco_mensal", { ascending: true })
      .then(({ data }) => {
        setPlanos(data ?? []);
        setCarregando(false);
      });
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Portal Negócio",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "BRL",
        lowPrice: "0",
        highPrice: "197",
        offerCount: "3",
      },
    });
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  return (
    <div>
      <section className="cf-hero">
        <div className="inicio-hero-glow" aria-hidden="true" />
        <div className="cf-hero-inner">
          <h1>
            Portal Negócio — da entrada do veículo ao contrato assinado,{" "}
            <span>tudo em um só lugar</span>
          </h1>
          <p>
            Elimine papel, planilha desatualizada e WhatsApp solto na gestão da sua revenda —
            do cadastro do veículo ao contrato assinado, tudo dentro do Portal Negócio.
          </p>
          <div className="cf-hero-cta">
            <Link to="/cadastro" className="botao-link inicio-hero-cta">
              Testar grátis
            </Link>
            <a href="#como-funciona" className="cf-hero-cta-secundario" onClick={scrollSuaveParaComoFunciona}>
              Ver como funciona
            </a>
          </div>
        </div>
      </section>

      <section className="cf-secao">
        <h2 className="cf-secao-titulo">As 3 dores que toda garagem já sentiu</h2>
        <div className="cf-funcionalidades-grid">
          {DORES.map((d) => (
            <div className="cf-funcionalidade-card" key={d.titulo}>
              <span className="cf-funcionalidade-icone">
                <d.icone size={20} />
              </span>
              <h3>{d.titulo}</h3>
              <p>{d.texto}</p>
              {d.link && (
                <Link to={d.link.to} className="cf-funcionalidade-link">
                  {d.link.texto} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="cf-secao cf-secao-passos" id="como-funciona">
        <h2 className="cf-secao-titulo">Como funciona</h2>
        <div className="cf-passos">
          {FLUXO.map((f) => (
            <div className="cf-passo" key={f.texto}>
              <span className="cf-passo-numero">
                <f.icone size={18} />
              </span>
              <h3>{f.texto}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="cf-secao" id="planos">
        <h2 className="cf-secao-titulo">Um plano pra cada tamanho de garagem</h2>

        {carregando && <p>Carregando planos...</p>}

        {!carregando && (
          <div className="cf-planos-grid">
            {planos.map((plano) => (
              <div className={`cf-plano-card ${plano.nome === "Pro" ? "cf-plano-destaque" : ""}`} key={plano.id}>
                {plano.nome === "Pro" && <span className="cf-plano-selo">MAIS RECOMENDADO</span>}
                <h3>{plano.nome}</h3>
                <p className="cf-plano-preco">
                  {formatPreco(plano.preco_mensal)}
                  {Number(plano.preco_mensal) > 0 && <span>/mês</span>}
                </p>
                <ul className="cf-plano-lista">
                  {(RESUMO_POR_PLANO[plano.nome] ?? []).map((r) => (
                    <li key={r}>
                      <Check size={15} /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="cf-plano-card">
              <span className="cf-funcionalidade-icone">
                <ClipboardList size={20} />
              </span>
              <h3>Créditos avulsos</h3>
              <p className="cf-plano-preco">
                R$ 10,00<span>/crédito</span>
              </p>
              <p className="cf-plano-avulso-texto">
                1 anúncio em destaque + 1 documento adicional, sem trocar de plano.
              </p>
            </div>
          </div>
        )}

        <p className="cf-secao-subtitulo" style={{ marginTop: 32 }}>
          <Link to="/como-funciona#planos" className="botao-link">
            Ver todos os planos
          </Link>
        </p>
      </section>

      <section className="cf-secao">
        <h2 className="cf-secao-titulo">Perguntas frequentes</h2>
        <div className="tutorial-lista" style={{ maxWidth: 800, margin: "40px auto 0" }}>
          {FAQS.map((f, i) => {
            const aberta = faqAberta === i;
            return (
              <div className="tutorial-card" key={f.pergunta}>
                <button
                  type="button"
                  className="tutorial-card-cabecalho"
                  onClick={() => setFaqAberta(aberta ? null : i)}
                  aria-expanded={aberta}
                >
                  <h2>{f.pergunta}</h2>
                  <ChevronDown size={18} className={`tutorial-chevron ${aberta ? "tutorial-chevron-aberto" : ""}`} />
                </button>
                {aberta && (
                  <div className="tutorial-card-corpo">
                    <p>{f.resposta}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="cf-secao-subtitulo" style={{ marginTop: 24 }}>
          <Link to="/faq">Ver todas as perguntas</Link>
        </p>
      </section>

      <section className="cf-cta-final">
        <h2>Comece a vender com mais organização.</h2>
        <p>Testar é grátis — sem cartão de crédito.</p>
        <Link to="/cadastro" className="botao-link inicio-hero-cta">
          Testar grátis
        </Link>
      </section>
    </div>
  );
}
