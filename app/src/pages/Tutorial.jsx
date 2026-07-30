import { useState } from "react";
import {
  LayoutDashboard,
  Car,
  Users,
  Briefcase,
  FileText,
  Calculator,
  Settings,
  Search,
  X,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
} from "lucide-react";

const MODULOS = [
  {
    id: "painel",
    icone: LayoutDashboard,
    cor: "azul",
    titulo: "Painel — visão geral do seu negócio",
    passos: [
      "O painel é a tela inicial após o login. Mostra tudo que está acontecendo no seu negócio em tempo real.",
      "KPIs no topo: Novos Leads Hoje, Negócios em andamento, Documentos pendentes, Valor total em negociações.",
      "Resumo do pipeline: mostra o valor total Em andamento, Fechado e Cancelado no mês.",
      "Leads por estágio: barras coloridas mostrando quantos leads estão em cada fase (Novo, Em contato, Negociando, Convertido, Perdido).",
      "Veículos por status: quantos estão Disponíveis, Reservados, Vendidos e Consignados.",
      "Estoque recente: lista dos últimos veículos adicionados com link rápido para editar.",
      "Próximas ações: atalhos para gerar documentos de negócios em andamento.",
    ],
  },
  {
    id: "veiculos",
    icone: Car,
    cor: "verde",
    titulo: "Veículos — cadastro e gestão do estoque",
    passos: [
      'Clique em "+ Novo Veículo" para cadastrar. Preencha marca, modelo, ano, quilometragem, preço, combustível e câmbio.',
      "Fotos: faça upload de pelo menos 3 fotos — frontal, lateral e interior. Fotos aumentam o interesse do comprador na vitrine.",
      "RENAVAM e Chassi são obrigatórios para gerar contratos. Não deixe em branco — o sistema vai bloquear a geração do contrato sem esses dados.",
      'Preço em branco: se você ainda não definiu o preço de venda, deixe o campo vazio — a vitrine pública mostra "Consulte" automaticamente no lugar do valor.',
      'O status do veículo muda automaticamente: ao fechar um negócio, o sistema atualiza de "Disponível" para "Vendido" sem você precisar fazer nada.',
      "Para excluir um veículo, o sistema pede confirmação — isso evita exclusões acidentais.",
    ],
    alerta:
      "Sempre preencha RENAVAM e Chassi no cadastro. Sem esses dados, o sistema bloqueia a geração do contrato na hora da venda.",
  },
  {
    id: "clientes-leads",
    icone: Users,
    cor: "laranja",
    titulo: "Clientes e Leads — da vitrine à venda",
    passos: [
      "Lead é quem demonstrou interesse: quando um comprador preenche o formulário na vitrine pública, o lead aparece automaticamente na sua lista de Leads.",
      "Cliente é quem você cadastrou manualmente: para clientes que vieram por indicação, telefone ou pessoalmente na garagem.",
      "Passagem de bastão: você pode atribuir um lead a um vendedor específico, que passa a ser o responsável pelo atendimento.",
      "Estágios do lead: mova o lead conforme o avanço da negociação — Novo → Em contato → Negociando → Convertido (ou Perdido).",
      'Depois de "Convertido": cadastre o cliente manualmente pelo botão "+ Novo Cliente" (se ele ainda não existir) usando os dados já coletados no atendimento, para então criar o negócio.',
      'Cadastro manual: use o botão "+ Novo Cliente" para clientes que não vieram pela vitrine. Preencha CPF e e-mail — são necessários para o contrato.',
    ],
  },
  {
    id: "negocios",
    icone: Briefcase,
    cor: "roxo",
    titulo: "Negócios — pipeline de vendas",
    passos: [
      'Criar negócio: clique em "+ Novo Negócio", vincule um cliente, escolha o veículo e informe o valor de venda combinado.',
      "Atribuir vendedor: selecione qual vendedor está responsável pela negociação. Isso alimenta o Índice de Conversão e o cálculo de comissão.",
      "Status do negócio: Em andamento (negociando), Fechado (venda realizada), Cancelado (negociação encerrada).",
      'Ao fechar o negócio: o sistema automaticamente lança a receita no Financeiro, atualiza o status do veículo para "Vendido" e calcula a comissão do vendedor.',
      'Gerar documento: com o negócio fechado, o botão "Gerar Documento" fica disponível. Um clique e o contrato é gerado pela IA com os dados já cadastrados.',
      "Resumo do pipeline: no rodapé da tela de Negócios você vê o total, em andamento, valor total e taxa de conversão do mês.",
    ],
    dica:
      "Sempre feche o negócio pelo botão \"Fechar\" — esse clique dispara os lançamentos financeiros e atualiza o estoque automaticamente. Não mude o status manualmente.",
  },
  {
    id: "documentos",
    icone: FileText,
    cor: "vermelho",
    titulo: "Documentos — contratos gerados por IA",
    passos: [
      'Como acessar: abra um negócio e clique em "Gerar Documento". Escolha o tipo: Contrato de Compra e Venda ou Contrato de Consignação.',
      "A IA preenche automaticamente: nome das partes, dados do veículo, valor, forma de pagamento — tudo a partir do que já está cadastrado no sistema.",
      "Revise o rascunho: trechos marcados com [PREENCHER...] precisam ser completados por você antes de finalizar. São campos que dependem de informações específicas da negociação.",
      'Baixar PDF: clique em "Baixar PDF" para gerar o arquivo pronto para impressão e assinatura física.',
      'Enviar por e-mail: clique em "Enviar por e-mail" para enviar o contrato diretamente para o e-mail do cliente, direto pelo sistema.',
      "Status \"Rascunho\": o documento fica salvo como rascunho até você finalizar todos os campos. Você pode voltar e completar depois.",
    ],
    alerta:
      "Você é o responsável pela revisão final antes de enviar ao cliente. A IA preenche o modelo, mas a validação jurídica é sua. Sempre leia o contrato completo antes de enviar.",
  },
  {
    id: "pmc-financeiro",
    icone: Calculator,
    cor: "verde",
    titulo: "Calc. PMC e Financeiro — controle de resultados",
    passos: [
      "PMC significa Preço Máximo de Compra: é o valor máximo que você pode pagar por um veículo para ainda ter lucro após os custos de preparação.",
      "Como usar: informe o PVP (preço que quer vender ao público), o lucro mínimo desejado e os custos de preparação (mecânica, estética, documentação). O sistema calcula o PMC automaticamente.",
      "Resultado negativo: se o PMC aparecer em vermelho e negativo, significa que o PVP informado não cobre os custos. Aumente o PVP ou reduza os custos de preparação.",
      "Financeiro — receitas automáticas: ao fechar um negócio, o sistema lança a receita da venda e a comissão do vendedor automaticamente.",
      'Nova transação manual: use o botão "+ Nova Transação" para despesas fixas como aluguel, IPVA, seguro, ou receitas que não vieram de uma venda do sistema.',
      "Gráficos: Receitas × Despesas dos últimos 6 meses para visualizar a tendência do negócio. Despesas por categoria em gráfico de rosca.",
      "Extrato do vendedor: cada vendedor tem acesso ao próprio extrato com comissões recebidas, leads atendidos e taxa de conversão individual.",
    ],
  },
  {
    id: "empresa-vendedores-planos",
    icone: Settings,
    cor: "azul",
    titulo: "Empresa, Vendedores e Planos",
    passos: [
      "Dados da empresa: CNPJ, responsável legal e CPF do responsável aparecem automaticamente nos contratos gerados. Mantenha sempre atualizado.",
      "Logo: faça upload de uma imagem quadrada 512×512px (PNG ou JPG). Aparece na página pública da garagem na vitrine e no portal.",
      'Toggle "Mostrar na vitrine pública": controla se sua garagem aparece na página /garagens do portal para compradores. Ative quando estiver com estoque disponível.',
      'Convidar vendedor: clique em "+ Convidar Vendedor", informe o nome e o e-mail. O sistema gera um link de convite — copie e envie para o vendedor (por WhatsApp, e-mail etc.). Ele cria a própria senha ao abrir o link. Você define o percentual de comissão.',
      'Planos: a tela /planos mostra o plano atual e os disponíveis. Clique em "Assinar" para fazer upgrade — o pagamento é pelo Mercado Pago.',
      "Créditos avulsos: disponíveis para qualquer plano. Cada crédito (R$ 10,00) dá direito a +1 anúncio ativo e +1 geração de documento. Compre conforme a necessidade.",
      "Painel Admin (somente dono): acesso exclusivo para o administrador do Portal Negócio gerenciar todas as garagens cadastradas.",
    ],
  },
];

export default function Tutorial() {
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState(new Set());

  function toggleModulo(id) {
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? MODULOS.filter(
        (m) =>
          m.titulo.toLowerCase().includes(termo) ||
          m.passos.some((p) => p.toLowerCase().includes(termo))
      )
    : MODULOS;

  return (
    <div className="vitrine-content tutorial-page">
      <div className="tutorial-header">
        <h1>Central de ajuda</h1>
        <p>Aprenda a usar cada módulo do Portal Negócio</p>

        <div className="lista-busca tutorial-busca">
          <Search size={16} />
          <input
            placeholder="Buscar por assunto (ex.: fotos, contrato, comissão)..."
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

      {filtrados.length === 0 && (
        <p className="auth-nota">Nenhum módulo encontrado para "{busca}".</p>
      )}

      <div className="tutorial-lista">
        {filtrados.map((m) => {
          const aberto = abertos.has(m.id);
          return (
            <div className="tutorial-card" key={m.id}>
              <button
                type="button"
                className="tutorial-card-cabecalho"
                onClick={() => toggleModulo(m.id)}
                aria-expanded={aberto}
              >
                <span className={`tutorial-icone kpi-icone-${m.cor}`}>
                  <m.icone size={20} />
                </span>
                <h2>{m.titulo}</h2>
                <ChevronDown
                  size={18}
                  className={`tutorial-chevron ${aberto ? "tutorial-chevron-aberto" : ""}`}
                />
              </button>

              {aberto && (
                <div className="tutorial-card-corpo">
                  <ol>
                    {m.passos.map((passo, i) => (
                      <li key={i}>{passo}</li>
                    ))}
                  </ol>

                  {m.alerta && (
                    <div className="tutorial-alerta tutorial-alerta-aviso">
                      <AlertTriangle size={16} />
                      <p>{m.alerta}</p>
                    </div>
                  )}

                  {m.dica && (
                    <div className="tutorial-alerta tutorial-alerta-dica">
                      <Lightbulb size={16} />
                      <p>{m.dica}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
