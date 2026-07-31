import { Car, ShieldCheck, Download } from "lucide-react";
import { PaginaArtigoJuridico } from "../components/PaginaArtigoJuridico";

const BENEFICIOS = [
  {
    icone: Car,
    titulo: "Dados já cadastrados",
    texto:
      "O contrato é gerado a partir dos dados que você já cadastrou do veículo, do comprador e da sua garagem — sem redigitar nada.",
  },
  {
    icone: ShieldCheck,
    titulo: "IA preenche, não decide",
    texto:
      "A IA preenche um template jurídico fixo, validado por advogado, e escolhe entre blocos de cláusula condicional pré-aprovados (consignação, financiamento em aberto, garantia). Ela nunca redige cláusula nova.",
  },
  {
    icone: Download,
    titulo: "PDF e envio por e-mail",
    texto:
      "Baixe o contrato em PDF pronto para assinatura, ou envie direto para o e-mail do cliente pelo sistema — recurso disponível no plano Pro.",
  },
];

const CHECKLIST = [
  "Identificação completa das partes (nome, CPF/CNPJ, endereço)",
  "Dados do veículo: placa, RENAVAM, chassi e quilometragem",
  "Ciência do estado do bem (checklist de vistoria) declarada pelo comprador",
  "Prazo e cobertura da garantia, quando houver",
  "Oficina credenciada para acionamento da garantia",
  "Forma de pagamento e responsabilidade por débitos/multas até a entrega",
  "Prazo para comunicação da venda e transferência no DETRAN",
];

const FAQS = [
  {
    pergunta: "Esse contrato tem validade jurídica?",
    resposta:
      "Sim. O texto segue um template jurídico fixo, com base no Código Civil e no Código de Trânsito Brasileiro, revisado por advogado. A IA só preenche os dados — não cria cláusula nova — e o documento nasce como rascunho, editável antes de ser considerado final.",
  },
  {
    pergunta: "Preciso de advogado além do sistema?",
    resposta:
      "O template já foi validado por advogado antes de entrar no sistema, mas cada garagem pode ter uma situação específica que mereça revisão própria — o Portal Negócio acelera a redação, não substitui aconselhamento jurídico individual quando necessário.",
  },
  {
    pergunta: "Funciona para venda direta e consignação?",
    resposta:
      "Sim. O sistema identifica o tipo de negócio e inclui automaticamente o bloco de cláusula certo — venda direta ou consignação, com a comissão da garagem e a qualificação do proprietário consignante.",
  },
];

export default function ContratoCompraVenda() {
  return (
    <PaginaArtigoJuridico
      titulo="Como fazer contrato de compra e venda de carro usado com segurança jurídica?"
      respostaDireta="Um contrato de compra e venda de veículo usado precisa identificar claramente vendedor e comprador (nome, CPF/CNPJ, endereço), descrever o veículo com todos os dados que o vinculam a ele — placa, RENAVAM, chassi, quilometragem — e deixar o comprador ciente por escrito do estado de conservação do bem, incluindo desgastes já constatados na vistoria. Se a garagem oferece garantia, o contrato deve definir o prazo, o que está coberto e qual oficina credenciada o comprador deve procurar em caso de pane. Também precisa deixar claro quem responde por multas e débitos até a data da entrega, e lembrar o comprador do prazo legal para transferir o veículo no DETRAN. Sem esses pontos por escrito, tanto o vendedor quanto o comprador ficam expostos a discussões depois da venda — sobre um defeito que já existia, sobre uma multa anterior à venda, ou sobre a validade de uma garantia prometida verbalmente."
      beneficios={BENEFICIOS}
      checklistTitulo="O que não pode faltar no contrato"
      checklist={CHECKLIST}
      ctaTitulo="Gere seu primeiro contrato grátis."
      ctaTexto="Cadastre o veículo e o comprador — o resto o sistema preenche por você."
      ctaBotaoTexto="Gere seu primeiro contrato grátis"
      faqs={FAQS}
    />
  );
}
