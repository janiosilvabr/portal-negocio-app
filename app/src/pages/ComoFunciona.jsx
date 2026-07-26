import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  UserPlus,
  Handshake,
  Wallet,
  FileText,
  LayoutDashboard,
  Check,
  ClipboardList,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const FUNCIONALIDADES = [
  { icone: Car, titulo: "Vitrine pública", texto: "Seus veículos aparecem numa página pública, com fotos e filtros, recebendo interessados sem esforço extra." },
  { icone: UserPlus, titulo: "CRM de Leads", texto: "Acompanhe cada interessado desde o primeiro contato até a conversão, com sugestão automática de veículos ideais." },
  { icone: Handshake, titulo: "Pipeline de Negócios", texto: "Veja em qual etapa está cada negociação — em andamento, fechado ou cancelado — e saiba onde focar." },
  { icone: Wallet, titulo: "Financeiro", texto: "Receitas, despesas e comissões lançadas automaticamente quando um negócio fecha, sem planilha separada." },
  { icone: FileText, titulo: "Documentos automáticos", texto: "Contratos de compra e venda e de consignação gerados a partir dos dados já cadastrados, prontos pra revisão e envio por e-mail." },
  { icone: LayoutDashboard, titulo: "Painel com indicadores", texto: "KPIs do dia, resumo do pipeline e estoque recente num único painel, sem precisar somar nada na mão." },
];

const PASSOS = [
  { numero: "01", titulo: "Cadastre sua garagem", texto: "Crie sua conta em minutos." },
  { numero: "02", titulo: "Publique seus veículos", texto: "Adicione fotos, preço e detalhes de cada veículo." },
  { numero: "03", titulo: "Receba interessados", texto: "Leads da vitrine pública chegam direto no seu CRM." },
  { numero: "04", titulo: "Acompanhe o funil", texto: "Veja cada negociação por etapa e tome decisões com dados." },
  { numero: "05", titulo: "Gere e envie o contrato", texto: "Documento pronto em poucos cliques, revisado e enviado por e-mail." },
];

const RECURSOS_POR_PLANO = {
  "Grátis": ["Vitrine pública", "CRM básico de leads", "Cadastro de clientes"],
  "Básico": ["CRM completo de leads", "Pipeline de negócios", "Financeiro básico", "Painel da empresa", "Veículos em destaque na Home, à frente do plano Grátis"],
  "Pro": ["CRM completo de leads", "Pipeline de negócios", "Financeiro completo", "Painel com indicadores", "Envio de contrato por e-mail", "Veículos na primeira fileira da Home, à frente dos demais planos"],
};

function formatPreco(valor) {
  if (!valor || Number(valor) === 0) return "Grátis";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ComoFunciona() {
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase
      .from("planos")
      .select("*")
      .order("preco_mensal", { ascending: true })
      .then(({ data }) => {
        setPlanos(data ?? []);
        setCarregando(false);
      });
  }, []);

  return (
    <div>
      <section className="cf-hero">
        <div className="inicio-hero-glow" aria-hidden="true" />
        <div className="cf-hero-inner">
          <h1>
            Venda mais com uma plataforma que organiza seus <span>anúncios, clientes e documentos</span>.
          </h1>
          <p>
            O Portal Negócio reúne vitrine online, CRM, funil de vendas, controle financeiro e
            geração automática de contratos para garagens e concessionárias de veículos.
          </p>
          <div className="cf-hero-cta">
            <Link to="/cadastro" className="botao-link inicio-hero-cta">
              Criar conta grátis
            </Link>
            <a href="#planos" className="cf-hero-cta-secundario">
              Ver planos
            </a>
          </div>
        </div>
      </section>

      <section className="cf-secao">
        <h2 className="cf-secao-titulo">Tudo que você precisa pra vender com mais controle.</h2>
        <div className="cf-funcionalidades-grid">
          {FUNCIONALIDADES.map((f) => (
            <div className="cf-funcionalidade-card" key={f.titulo}>
              <span className="cf-funcionalidade-icone">
                <f.icone size={20} />
              </span>
              <h3>{f.titulo}</h3>
              <p>{f.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cf-secao cf-secao-passos">
        <h2 className="cf-secao-titulo">Como funciona na prática</h2>
        <div className="cf-passos">
          {PASSOS.map((p) => (
            <div className="cf-passo" key={p.numero}>
              <span className="cf-passo-numero">{p.numero}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cf-secao" id="planos">
        <h2 className="cf-secao-titulo">Escolha o plano ideal para começar.</h2>
        <p className="cf-secao-subtitulo">Sem fidelidade. Cancele quando quiser.</p>

        {carregando && <p>Carregando planos...</p>}

        {!carregando && (
          <div className="cf-planos-grid">
            {planos.map((plano) => {
              const limiteDocumentos = plano.recursos?.limite_documentos ?? 0;
              return (
                <div className={`cf-plano-card ${plano.nome === "Pro" ? "cf-plano-destaque" : ""}`} key={plano.id}>
                  {plano.nome === "Pro" && <span className="cf-plano-selo">MAIS RECOMENDADO</span>}
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
                      {limiteDocumentos > 0
                        ? `${limiteDocumentos} gerações de contrato/mês`
                        : "Sem geração de contrato"}
                    </li>
                    {(RECURSOS_POR_PLANO[plano.nome] ?? []).map((r) => (
                      <li key={r}>
                        <Check size={15} /> {r}
                      </li>
                    ))}
                  </ul>
                  <Link to="/cadastro" className="botao-link cf-plano-cta">
                    Começar no {plano.nome}
                  </Link>
                </div>
              );
            })}

            <div className="cf-plano-card cf-plano-avulso">
              <span className="cf-funcionalidade-icone">
                <ClipboardList size={20} />
              </span>
              <h3>Créditos avulsos</h3>
              <p className="cf-plano-preco">
                R$ 10,00<span>/crédito</span>
              </p>
              <p className="cf-plano-avulso-texto">
                Precisou de mais um anúncio ou um documento além do limite do seu plano? Cada
                crédito dá direito a +1 anúncio ativo e +1 geração de documento, sem precisar
                trocar de plano — disponível em qualquer plano, inclusive o Grátis. Escolha
                quantos créditos quiser; eles não expiram.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="cf-cta-final">
        <h2>Comece a vender com mais organização.</h2>
        <p>Transforme anúncios, clientes, negociações e documentos em um processo simples.</p>
        <Link to="/cadastro" className="botao-link inicio-hero-cta">
          Criar conta grátis
        </Link>
      </section>
    </div>
  );
}
