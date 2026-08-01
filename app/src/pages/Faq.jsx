import { useEffect, useMemo, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";

const CATEGORIAS = [
  {
    nome: "Contratos e segurança jurídica",
    perguntas: [
      {
        pergunta: "Como fazer contrato de venda de carro usado com segurança jurídica?",
        resposta:
          "Um contrato de venda de carro usado precisa identificar claramente vendedor e comprador (nome, CPF/CNPJ, endereço), descrever o veículo com placa, RENAVAM, chassi e quilometragem, e deixar o comprador ciente por escrito do estado de conservação do bem. Se a garagem oferece garantia, o contrato deve definir prazo, cobertura e a oficina credenciada para acionamento. Também precisa deixar claro quem responde por multas e débitos até a entrega, e lembrar o comprador do prazo legal para transferir o veículo no DETRAN. No Portal Negócio, esse contrato é gerado automaticamente com os dados já cadastrados do veículo e do comprador, a partir de um modelo de minuta padrão estruturado com base na legislação vigente — um rascunho de apoio, não uma peça jurídica pronta e definitiva.",
      },
      {
        pergunta: "O contrato gerado pela IA tem validade jurídica?",
        resposta:
          "O sistema não presta serviço jurídico nem garante validade — ele automatiza o preenchimento de um modelo de minuta padrão, elaborado com base no Código Civil e no Código de Trânsito Brasileiro, disponibilizado como ferramenta de apoio à digitação. A IA não redige cláusula nova — ela só preenche os dados do negócio (partes, veículo, valor, forma de pagamento) e escolhe entre blocos de cláusula condicional pré-definidos, como consignação, financiamento em aberto ou garantia. Todo documento gerado nasce como rascunho, e a leitura completa, a conferência dos dados e a decisão de uso são sempre de responsabilidade de quem está negociando.",
      },
      {
        pergunta: "Como funciona contrato de consignação de veículo?",
        resposta:
          "Na consignação, o proprietário do veículo (consignante) entrega o carro para a garagem (consignatária) expor, anunciar e vender por ele, sem transferir a propriedade até a venda acontecer. O contrato de consignação do Portal Negócio já nasce com o laudo cautelar de entrada, a cláusula de regresso automático — que protege a garagem se aparecer um vício oculto depois da venda — e a salvaguarda conjugal, quando aplicável. O prazo de vigência, as condições de devolução antecipada e a comissão da revenda também ficam registrados por escrito, evitando divergência entre as partes depois.",
      },
      {
        pergunta: "Preciso de advogado além do sistema?",
        resposta:
          "Sim, principalmente em negociações atípicas ou fora do padrão. O uso do sistema e de seus modelos não constitui prestação de serviços advocatícios, consultoria ou auditoria jurídica — o Portal Negócio automatiza o preenchimento de um modelo genérico de referência, reduzindo erro de digitação e esquecimento de campo obrigatório, mas a adequação do conteúdo ao caso concreto é sempre responsabilidade das partes. Recomendamos a contratação de advogado particular para situações que fujam do modelo padrão.",
      },
    ],
  },
  {
    nome: "Margem e precificação",
    perguntas: [
      {
        pergunta: "Como calcular o preço máximo que posso pagar por um carro usado?",
        resposta:
          "O cálculo é conhecido como PMC — Preço Máximo de Compra: PMC = PVP (preço de venda que você pretende praticar depois de preparado) menos o custo total de preparação (mecânica, estética, documentação) menos o lucro que você quer ter na venda. Se o resultado for negativo, significa que o preço pedido pelo vendedor atual não deixa margem nenhuma nas condições informadas. O Portal Negócio tem uma Calculadora PMC gratuita e pública, sem necessidade de login, além de uma versão completa dentro do sistema que salva o histórico de simulações vinculado a cada veículo.",
      },
      {
        pergunta: "Como calcular a margem de lucro de uma revenda de veículos?",
        resposta:
          "A margem real de uma venda é o valor de venda menos tudo que entrou no custo do veículo: o valor pago na aquisição, os custos de preparação (mecânica, estética, documentação) e, quando existir, a comissão do vendedor. Muita revenda calcula só 'vendi por X, comprei por Y' e esquece os custos ocultos do meio do caminho — é aí que a margem que parecia boa no papel encolhe na prática. No Portal Negócio, o Financeiro lança a receita e a comissão automaticamente quando um negócio fecha, e os custos de preparação ficam registrados por veículo, então a margem real fica visível, não estimada de cabeça.",
      },
      {
        pergunta: "O que é 'lucro ilusório' e como evitar?",
        resposta:
          "Lucro ilusório é achar que ganhou mais do que realmente ganhou numa venda, porque alguns custos — mecânica, estética, documentação, uma comissão paga informalmente — não foram somados na hora de calcular o resultado. É um erro comum quando o controle é feito de cabeça ou em anotações soltas, sem vincular cada custo ao veículo específico. A forma de evitar é registrar todo custo de preparação assim que ele acontece, vinculado ao veículo, e deixar o sistema calcular a margem real no fechamento da venda — não uma conta aproximada feita de memória.",
      },
    ],
  },
  {
    nome: "Gestão de leads e CRM",
    perguntas: [
      {
        pergunta: "Como organizar os leads da minha revenda de veículos?",
        resposta:
          "O primeiro passo é parar de deixar contatos interessados soltos no WhatsApp ou em anotações de papel, e colocar cada um numa lista com estágio claro de atendimento: Novo, Em contato, Negociando, Convertido ou Perdido. No Portal Negócio, todo interessado que preenche o formulário na vitrine pública já entra automaticamente na lista de Leads da garagem, e você move cada lead conforme a negociação avança. Isso evita o problema mais comum de gestão informal: esquecer de retornar para um cliente porque ele ficou perdido no meio de outras conversas.",
      },
      {
        pergunta: "Como funciona a passagem de bastão entre vendedores?",
        resposta:
          "Cada lead pode ser atribuído a um vendedor específico, que passa a ser o responsável por aquele atendimento do início ao fim. Isso evita duas situações comuns numa revenda com equipe: dois vendedores atendendo o mesmo cliente sem saber, ou um lead esfriando porque ninguém assumiu a responsabilidade por ele. Quando o negócio fecha, a comissão já fica vinculada ao vendedor responsável, então não há dúvida sobre quem tem direito a quê.",
      },
      {
        pergunta: "Dá para saber quem atendeu cada cliente?",
        resposta:
          "Sim. Todo lead e todo negócio ficam vinculados ao vendedor responsável pelo atendimento, e cada vendedor tem acesso ao próprio extrato — com os leads que atendeu, as comissões recebidas e a taxa de conversão individual. Para o dono da garagem, isso resolve a dúvida mais recorrente numa equipe de vendas: saber quem realmente fechou cada negócio, sem depender da palavra de cada um.",
      },
    ],
  },
  {
    nome: "Financeiro",
    perguntas: [
      {
        pergunta: "Como funciona o controle financeiro automático do sistema?",
        resposta:
          "Quando um negócio é fechado no sistema, o Portal Negócio lança automaticamente a receita da venda e a comissão do vendedor no Financeiro, sem que o usuário precise digitar nada de novo — os dados já vêm do próprio negócio. Despesas que não vêm de uma venda registrada pelo sistema, como aluguel, IPVA ou seguro, podem ser lançadas manualmente. O resultado é um painel com receitas e despesas reais, gráficos de tendência e despesas por categoria, em vez de uma planilha separada que precisa ser atualizada à mão.",
      },
      {
        pergunta: "O sistema calcula a comissão do vendedor sozinho?",
        resposta:
          "Sim. Cada vendedor tem um percentual de comissão definido pelo dono da garagem, e quando um negócio atribuído a ele é fechado, o sistema calcula e lança a comissão automaticamente no Financeiro, sem cálculo manual. Isso reduz uma fonte comum de desconfiança entre dono e equipe: divergência sobre quanto cada vendedor tem a receber.",
      },
    ],
  },
  {
    nome: "Planos e uso do sistema",
    perguntas: [
      {
        pergunta: "Quanto custa o Portal Negócio?",
        resposta:
          "O Portal Negócio tem um plano Grátis (até 4 anúncios, vitrine pública), o plano Básico por R$ 97/mês (CRM completo, pipeline de negócios e painel da empresa) e o plano Pro por R$ 197/mês (tudo do Básico, mais financeiro completo, envio de contrato por e-mail e destaque na home). Também existem créditos avulsos de R$ 10 cada, disponíveis em qualquer plano, que dão direito a +1 anúncio ativo e +1 geração de documento sem precisar trocar de plano.",
      },
      {
        pergunta: "Existe plano gratuito?",
        resposta:
          "Sim. O plano Grátis permite cadastrar até 4 veículos ativos na vitrine pública, sem custo e sem prazo de expiração. Ele não inclui geração de contrato — para isso, é preciso o plano Básico ou Pro, ou usar um crédito avulso.",
      },
      {
        pergunta: "Preciso saber tecnologia para usar o sistema?",
        resposta:
          "Não. A interface do Portal Negócio foi pensada para quem trabalha na loja, não para quem trabalha em TI — se você sabe usar WhatsApp e enviar uma foto pelo celular, consegue cadastrar um veículo, atender um lead e gerar um contrato no sistema. Além disso, o sistema tem uma Central de Ajuda com módulos explicando cada tela na prática.",
      },
      {
        pergunta: "Posso cancelar quando quiser?",
        resposta:
          "Sim, não há fidelidade. Você pode usar o plano Grátis por tempo indeterminado, ou assinar um plano pago e cancelar quando quiser, sem multa.",
      },
      {
        pergunta: "O que são os créditos avulsos e quando usar?",
        resposta:
          "Créditos avulsos custam R$ 10 cada e estão disponíveis para qualquer plano, inclusive o Grátis. Cada crédito dá direito a +1 anúncio ativo e +1 geração de documento, consumidos separadamente conforme a necessidade — não é um bônus permanente no limite do plano, o crédito é usado só quando você realmente ultrapassa o limite normal. Eles não expiram: ficam parados no saldo até serem usados. É útil, por exemplo, quando a garagem está com um mês de estoque maior que o normal e não quer trocar de plano só por causa disso.",
      },
    ],
  },
];

export default function Faq() {
  const [busca, setBusca] = useState("");
  const [abertas, setAbertas] = useState(new Set());

  function toggle(pergunta) {
    setAbertas((atual) => {
      const novo = new Set(atual);
      if (novo.has(pergunta)) novo.delete(pergunta);
      else novo.add(pergunta);
      return novo;
    });
  }

  const termo = busca.trim().toLowerCase();
  const categoriasFiltradas = useMemo(() => {
    if (!termo) return CATEGORIAS;
    return CATEGORIAS.map((cat) => ({
      ...cat,
      perguntas: cat.perguntas.filter(
        (p) => p.pergunta.toLowerCase().includes(termo) || p.resposta.toLowerCase().includes(termo)
      ),
    })).filter((cat) => cat.perguntas.length > 0);
  }, [termo]);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: CATEGORIAS.flatMap((cat) =>
        cat.perguntas.map((p) => ({
          "@type": "Question",
          name: p.pergunta,
          acceptedAnswer: { "@type": "Answer", text: p.resposta },
        }))
      ),
    });
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  return (
    <div>
      <div className="vitrine-content tutorial-page">
        <div className="tutorial-header">
          <h1>Perguntas frequentes — Portal Negócio</h1>
          <p>Tudo que um garagista costuma perguntar antes de decidir usar o sistema</p>

          <div className="lista-busca tutorial-busca">
            <Search size={16} />
            <input
              placeholder="Buscar por assunto (ex.: contrato, margem, comissão)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button
                type="button"
                className="tutorial-busca-limpar"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {categoriasFiltradas.length === 0 && (
          <p className="auth-nota">Nenhuma pergunta encontrada para "{busca}".</p>
        )}

        {categoriasFiltradas.map((cat) => (
          <div key={cat.nome} className="faq-categoria">
            <h2 className="faq-categoria-titulo">{cat.nome}</h2>
            <div className="tutorial-lista">
              {cat.perguntas.map((p) => {
                const aberta = abertas.has(p.pergunta);
                return (
                  <div className="tutorial-card" key={p.pergunta}>
                    <button
                      type="button"
                      className="tutorial-card-cabecalho"
                      onClick={() => toggle(p.pergunta)}
                      aria-expanded={aberta}
                    >
                      <h2>{p.pergunta}</h2>
                      <ChevronDown
                        size={18}
                        className={`tutorial-chevron ${aberta ? "tutorial-chevron-aberto" : ""}`}
                      />
                    </button>
                    {aberta && (
                      <div className="tutorial-card-corpo">
                        <p>{p.resposta}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <section className="cf-cta-final">
        <h2>Não encontrou sua dúvida?</h2>
        <p>Fale com a gente direto no WhatsApp.</p>
        <a
          href="https://wa.me/5566999726985"
          target="_blank"
          rel="noopener noreferrer"
          className="botao-link contato-botao-whatsapp"
        >
          💬 Falar no WhatsApp
        </a>
      </section>
    </div>
  );
}
