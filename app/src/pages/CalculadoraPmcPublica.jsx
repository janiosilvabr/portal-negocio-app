import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, AlertTriangle, ChevronDown } from "lucide-react";

const FAQS = [
  {
    pergunta: "O que é PMC?",
    resposta:
      "PMC é o Preço Máximo de Compra: o valor mais alto que você pode pagar por um veículo e ainda vender depois com o lucro que quer, cobrindo os custos de preparação (mecânica, estética e documentação).",
  },
  {
    pergunta: "Isso substitui a Tabela FIPE?",
    resposta:
      "Não. A Tabela FIPE mostra uma referência de mercado; a Calculadora PMC mostra até quanto vale a pena você pagar considerando seus próprios custos de preparação e a margem que você quer ter — são informações complementares, não a mesma coisa.",
  },
  {
    pergunta: "Posso usar isso para qualquer veículo?",
    resposta:
      "Sim, a conta é a mesma para carro, moto ou utilitário: basta ajustar o preço de venda praticável e os custos de preparação específicos daquele veículo.",
  },
];

function formatMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CalculadoraPmcPublica() {
  const [pvp, setPvp] = useState("");
  const [custoMecanica, setCustoMecanica] = useState("");
  const [custoEstetica, setCustoEstetica] = useState("");
  const [custoDocumentacao, setCustoDocumentacao] = useState("");
  const [lucroDesejado, setLucroDesejado] = useState("");
  const [calculado, setCalculado] = useState(false);
  const [faqAberta, setFaqAberta] = useState(null);

  const cpt = (Number(custoMecanica) || 0) + (Number(custoEstetica) || 0) + (Number(custoDocumentacao) || 0);
  const pmc = (Number(pvp) || 0) - cpt - (Number(lucroDesejado) || 0);

  function handleCalcular(e) {
    e.preventDefault();
    setCalculado(true);
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.pergunta,
        acceptedAnswer: { "@type": "Answer", text: f.resposta },
      })),
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
            Calculadora <span>PMC</span> — Preço Máximo de Compra
          </h1>
          <p>
            PMC é o valor mais alto que você pode pagar por um veículo sem comer sua margem.
            Informe o preço de venda, os custos de preparação e o lucro que você quer ter — a
            calculadora mostra até quanto vale a pena pagar na compra, evitando prejuízo antes
            mesmo de fechar negócio.
          </p>
        </div>
      </section>

      <section className="cf-secao">
        <form className="form-card" style={{ margin: "0 auto" }} onSubmit={handleCalcular}>
          <h2>Preço de venda</h2>
          <div>
            <label htmlFor="pvp">Preço de Venda Praticável — PVP (R$)</label>
            <input
              id="pvp"
              type="number"
              min="0"
              step="0.01"
              value={pvp}
              onChange={(e) => {
                setPvp(e.target.value);
                setCalculado(false);
              }}
              required
            />
          </div>

          <h2>Custo de preparação</h2>
          <div className="form-grid">
            <div>
              <label htmlFor="custoMecanica">Mecânica (R$)</label>
              <input
                id="custoMecanica"
                type="number"
                min="0"
                step="0.01"
                value={custoMecanica}
                onChange={(e) => {
                  setCustoMecanica(e.target.value);
                  setCalculado(false);
                }}
              />
            </div>
            <div>
              <label htmlFor="custoEstetica">Estética (R$)</label>
              <input
                id="custoEstetica"
                type="number"
                min="0"
                step="0.01"
                value={custoEstetica}
                onChange={(e) => {
                  setCustoEstetica(e.target.value);
                  setCalculado(false);
                }}
              />
            </div>
            <div>
              <label htmlFor="custoDocumentacao">Documentação (R$)</label>
              <input
                id="custoDocumentacao"
                type="number"
                min="0"
                step="0.01"
                value={custoDocumentacao}
                onChange={(e) => {
                  setCustoDocumentacao(e.target.value);
                  setCalculado(false);
                }}
              />
            </div>
          </div>
          <p className="pmc-total-cpt">Total de preparação: {formatMoeda(cpt)}</p>

          <h2>Lucro desejado</h2>
          <div>
            <label htmlFor="lucroDesejado">Quanto você quer ganhar líquido nessa venda (R$)</label>
            <input
              id="lucroDesejado"
              type="number"
              min="0"
              step="0.01"
              value={lucroDesejado}
              onChange={(e) => {
                setLucroDesejado(e.target.value);
                setCalculado(false);
              }}
            />
          </div>

          <button type="submit">
            <Calculator size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />
            Calcular PMC
          </button>

          {calculado && (
            <div className={`pmc-resultado ${pmc < 0 ? "pmc-resultado-negativo" : "pmc-resultado-positivo"}`}>
              <p className="pmc-resultado-label">Preço Máximo de Compra</p>
              <p className="pmc-resultado-valor">
                {pmc < 0 ? formatMoeda(pmc) : `Você pode pagar até ${formatMoeda(pmc)} neste veículo`}
              </p>
              {pmc < 0 && (
                <p className="pmc-alerta">
                  <AlertTriangle size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  Nas condições informadas, a operação não é viável: o preço de venda não cobre
                  o custo de preparação e o lucro desejado.
                </p>
              )}
            </div>
          )}
        </form>

        {calculado && (
          <div className="cf-cta-final" style={{ borderRadius: 16, marginTop: 32 }}>
            <h2>Gostaria de salvar essa simulação?</h2>
            <p>
              Organize todo o seu estoque com controle de margem automático — teste o Portal
              Negócio grátis.
            </p>
            <Link to="/cadastro" className="botao-link inicio-hero-cta">
              Testar grátis
            </Link>
          </div>
        )}
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
      </section>
    </div>
  );
}
