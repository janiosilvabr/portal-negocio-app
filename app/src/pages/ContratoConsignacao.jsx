import { ClipboardCheck, ShieldCheck, Download } from "lucide-react";
import { PaginaArtigoJuridico } from "../components/PaginaArtigoJuridico";

const BENEFICIOS = [
  {
    icone: ClipboardCheck,
    titulo: "Laudo cautelar incluído",
    texto:
      "O contrato já nasce com o laudo cautelar de entrada registrado — sinistro, roubo/furto ou restrição judicial não declarada ficam documentados desde o primeiro dia.",
  },
  {
    icone: ShieldCheck,
    titulo: "Regresso automático e proteção pro consignante",
    texto:
      "O template já prevê a cláusula de regresso automático (se surgir um vício oculto depois da venda, quem responde é o consignante) e a salvaguarda conjugal, quando aplicável — tudo pré-aprovado por advogado, a IA só preenche.",
  },
  {
    icone: Download,
    titulo: "PDF e envio por e-mail",
    texto:
      "Baixe o contrato em PDF pronto para assinatura, ou envie direto para o e-mail do consignante pelo sistema — recurso disponível no plano Pro.",
  },
];

const CHECKLIST = [
  "Identificação completa do consignante (nome, CPF, RG, estado civil)",
  "Laudo cautelar de entrada (sinistro, roubo/furto, restrição judicial)",
  "Prazo de vigência da consignação",
  "Condições de devolução antecipada do veículo",
  "Responsabilidade por danos enquanto o veículo está no pátio",
  "Comissão da revenda (garagem)",
];

const FAQS = [
  {
    pergunta: "Quem é responsável se o carro for danificado?",
    resposta:
      "Enquanto o veículo está no pátio da garagem, ela responde como fiel depositária por furto, roubo e colisão ocorridos ali. Já o desgaste natural, a manutenção preventiva e vícios anteriores à entrada continuam sendo responsabilidade do consignante.",
  },
  {
    pergunta: "Posso devolver o veículo antes do prazo?",
    resposta:
      "Sim, mas se o veículo ainda não foi vendido, o contrato pode prever o ressarcimento à garagem pelas despesas já feitas com preparação e divulgação (fotos, lavagem, anúncios pagos) durante o período de consignação.",
  },
  {
    pergunta: "A consignatária pode vender por conta própria?",
    resposta:
      "Não sem seguir o que foi combinado no contrato: o preço de referência e a forma de remuneração da garagem (comissão fixa ou ágio) ficam definidos por escrito, e o saldo devido ao consignante é repassado dentro do prazo acordado após a venda.",
  },
];

export default function ContratoConsignacao() {
  return (
    <PaginaArtigoJuridico
      titulo="Como funciona contrato de consignação de veículo usado?"
      respostaDireta="Consignação de veículo é quando o proprietário (consignante) entrega o carro para uma garagem (consignatária) expor, anunciar e vender por ele, sem transferir a propriedade até a venda se concretizar. Para evitar disputas depois, o contrato precisa identificar as duas partes, registrar um laudo cautelar na entrada — atestando que o veículo não tem sinistro, roubo/furto ou restrição judicial não declarada —, definir o prazo de vigência da consignação e as condições para o consignante retirar o veículo antes desse prazo, e deixar claro quem responde pelo carro enquanto ele está no pátio da garagem (furto, roubo e colisão) e o que acontece se surgir um problema depois da venda, como vício oculto ou quilometragem adulterada. Também deve prever a comissão da garagem e, quando aplicável, a assinatura do cônjuge do consignante. Sem isso por escrito, é comum surgir divergência sobre quem paga o quê se o carro for danificado no pátio, ou se o antigo dono pode simplesmente pedir o veículo de volta a qualquer momento."
      beneficios={BENEFICIOS}
      checklistTitulo="O que não pode faltar no contrato de consignação"
      checklist={CHECKLIST}
      ctaTitulo="Gere seu contrato de consignação grátis."
      ctaTexto="Cadastre o veículo e o consignante — o resto o sistema preenche por você."
      ctaBotaoTexto="Gere seu contrato de consignação grátis"
      faqs={FAQS}
    />
  );
}
