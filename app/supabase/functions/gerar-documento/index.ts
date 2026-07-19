// Edge Function: gerar-documento
//
// Regra de ouro do produto (CLAUDE.md): a Claude API nunca decide conteúdo
// jurídico. Todas as decisões de quais blocos condicionais entram no
// contrato (regra do cônjuge, apontamento do laudo, modelo de remuneração,
// consignação etc.) são calculadas aqui em código, de forma determinística.
// A Claude API só recebe o template fixo + os fatos já resolvidos + a
// decisão de quais blocos usar, e faz apenas a substituição de variáveis e
// formatação (datas/valores por extenso) — nunca redige cláusula nova.
//
// Roda com o JWT do usuário que chamou (repassado no header Authorization),
// então todas as leituras no banco respeitam o RLS normal — a function não
// usa service role key em nenhum momento.
//
// Arquivo único de propósito: dá pra colar direto no editor de Edge
// Functions da Dashboard do Supabase, sem precisar do CLI.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").trim();
const CLAUDE_MODEL = "claude-sonnet-5";
const TEMPLATE_VERSAO = "v1.1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Templates (cópia de TEMPLATE_CONTRATO_CONSIGNACAO.md / _COMPRA_VENDA.md,
// só a parte do contrato em si — sem o preâmbulo nem as "Notas para o
// desenvolvimento"). As crases decorativas do markdown original foram
// removidas: elas só serviam pra destacar {{variavel}} visualmente no
// documento-fonte, mas apareceriam literalmente no contrato final, já que
// esta tela mostra o texto puro (sem renderizar markdown).

const TEMPLATE_CONSIGNACAO = `## CONTRATO DE CONSIGNAÇÃO DE VEÍCULO AUTOMOTOR

**CONSIGNANTE (proprietário do veículo):**
{{proprietario_nome}}, CPF {{proprietario_cpf}}, RG {{proprietario_rg}},
estado civil {{proprietario_estado_civil}}, residente em {{proprietario_endereco}}.

**CONSIGNATÁRIA (garagem intermediária):**
{{empresa_nome}}, CNPJ {{empresa_cnpj}}, com sede em {{empresa_endereco}}.

As partes acima qualificadas têm entre si justo e contratado o seguinte:

### Cláusula 1ª — Do Objeto

O(A) CONSIGNANTE entrega à CONSIGNATÁRIA, em regime de consignação, o veículo abaixo descrito,
para fins de exposição, divulgação e venda a terceiros:

- Marca/Modelo: {{veiculo_marca}} {{veiculo_modelo}} {{veiculo_versao}}
- Ano de Fabricação/Modelo: {{veiculo_ano_fabricacao}}/{{veiculo_ano_modelo}}
- Placa: {{veiculo_placa}} — RENAVAM: {{veiculo_renavam}} — Chassi: {{veiculo_chassi}}
- Cor: {{veiculo_cor}} — Quilometragem na entrada: {{veiculo_km}} km

### Cláusula 2ª — Do Laudo Cautelar na Entrada

O(A) CONSIGNANTE obriga-se a apresentar, no ato da entrega, laudo de vistoria cautelar do
veículo, às suas expensas, atestando a inexistência de sinistro, roubo/furto, passagem por
leilão ou restrição judicial não declarada. Resultado da vistoria:

{{laudo_cautelar_apontamentos}}

[CONDICIONAL: apontamento_constatado]

> As partes ajustam, em razão do apontamento acima, o seguinte: {{ajuste_preco_ou_recusa}}
> (ex.: ajuste no preço de referência de venda, ou recusa do veículo pela CONSIGNATÁRIA).

### Cláusula 3ª — Da Vigência

O presente contrato vigora pelo prazo de {{prazo_vigencia_dias}} dias, contados da data de
entrada do veículo, [CONDICIONAL: prorrogacao_automatica] prorrogável automaticamente por
igual período, caso nenhuma das partes se manifeste em contrário.

### Cláusula 4ª — Da Remuneração da Consignatária

[CONDICIONAL: modelo_comissao_fixa]

> O preço de referência para a venda do veículo é de {{preco_referencia}}. A CONSIGNATÁRIA
> fará jus a uma comissão de {{percentual_comissao}}% sobre o valor efetivamente realizado
> na venda.

[CONDICIONAL: modelo_agio]

> O(A) CONSIGNANTE deseja receber, líquido, o valor de {{preco_liquido_consignante}} pela
> venda do veículo. A CONSIGNATÁRIA está autorizada a comercializá-lo pelo valor que o mercado
> praticar, constituindo sua remuneração a diferença entre o valor efetivamente realizado na
> venda e o preço líquido aqui fixado.

Em qualquer dos modelos, o saldo devido ao(à) CONSIGNANTE será repassado em até
{{prazo_repasse}} dias após a efetivação da venda.

### Cláusula 5ª — Do Fiel Depositário e da Responsabilidade pela Guarda

Enquanto o veículo permanecer no pátio da CONSIGNATÁRIA, esta responde na qualidade de fiel
depositária pelos riscos de furto, roubo e colisão ocorridos em suas dependências. Fica
expressamente ressalvado que a manutenção mecânica preventiva, o desgaste por tempo parado e
quaisquer vícios preexistentes à entrada permanecem de responsabilidade do(a) CONSIGNANTE.

### Cláusula 6ª — Da Cláusula de Regresso Automático

Caso o comprador final do veículo venha a acionar judicial ou extrajudicialmente a
CONSIGNATÁRIA por vícios ocultos preexistentes à consignação, adulteração de quilometragem,
ou problemas estruturais/histórico de leilão não informados nesta vistoria, o(a) CONSIGNANTE
obriga-se a ressarcir integralmente a CONSIGNATÁRIA, incluindo custas processuais, honorários
advocatícios e o valor pago ao comprador, no prazo de {{prazo_ressarcimento}} dias contados
da notificação.

**Autorização de retenção:** caso o vício venha a se manifestar antes do repasse integral do
valor da venda ao(à) CONSIGNANTE, fica a CONSIGNATÁRIA desde já autorizada a reter, do saldo
ainda não repassado, o valor necessário para cobrir o reparo, compensando-o com o que for
devido nos termos desta cláusula.

### Cláusula 7ª — Dos Débitos, Multas e Infrações

O(A) CONSIGNANTE responde por todo e qualquer débito (IPVA, licenciamento, multas) anterior à
entrada do veículo na CONSIGNATÁRIA, ainda que a notificação chegue posteriormente. Infrações
de trânsito cometidas por prepostos da CONSIGNATÁRIA durante a guarda do veículo (ex.:
deslocamento interno, lavagem, test-drive com cliente) serão de responsabilidade exclusiva da
CONSIGNATÁRIA.

### Cláusula 8ª — Da Retirada Antecipada do Veículo

Caso o(a) CONSIGNANTE retire o veículo antes do término da vigência sem que tenha sido
vendido, obriga-se a ressarcir a CONSIGNATÁRIA pelas despesas comprovadamente incorridas com
preparação e divulgação do veículo (lavagem, polimento, fotos profissionais, anúncios pagos em
portais), conforme registro de custos vinculado a este veículo.

### Cláusula 9ª — Da Salvaguarda Conjugal

O(A) CONSIGNANTE declara, sob as penas da lei:

1. Seu real estado civil e regime de bens: {{proprietario_estado_civil}} /
   {{proprietario_regime_bens}};
2. Que o veículo é de sua exclusiva propriedade, livre e desembaraçado de meação, união
   estável fática ou litígio de partilha em curso;
3. Que assume total e exclusiva responsabilidade perante eventuais terceiros, cônjuge ou
   companheiro(a), isentando a CONSIGNATÁRIA de qualquer litígio decorrente desta declaração.

[CONDICIONAL: anuencia_conjuge]

> Anui expressamente com os termos deste contrato:
> {{conjuge_nome}}, CPF {{conjuge_cpf}}, cônjuge/companheiro(a) do(a) CONSIGNANTE.

### Cláusula 10ª — Do Foro

As partes elegem o foro da comarca de {{comarca}} para dirimir quaisquer controvérsias
oriundas deste contrato.


{{cidade}}, {{data_por_extenso}}.


_______________________________________
**CONSIGNANTE** — {{proprietario_nome}}

[CONDICIONAL: anuencia_conjuge]

_______________________________________
**CÔNJUGE/COMPANHEIRO(A)** — {{conjuge_nome}}


_______________________________________
**CONSIGNATÁRIA** — {{empresa_nome}}, representada por {{vendedor_intermediario_nome}}


Testemunhas:

1. _______________________________________
2. _______________________________________`;

const TEMPLATE_COMPRA_VENDA = `## CONTRATO PARTICULAR DE COMPRA E VENDA DE VEÍCULO AUTOMOTOR

**VENDEDOR(A):**
{{vendedor_nome}}, {{vendedor_qualificacao}}.

*(No caso de consignação, ver bloco condicional de consignação abaixo, que substitui a
qualificação do vendedor pelo proprietário consignante + a garagem como intermediária.)*

**COMPRADOR(A):**
{{comprador_nome}}, CPF {{comprador_cpf}}, RG {{comprador_rg}},
estado civil {{comprador_estado_civil}}, residente em {{comprador_endereco}}.

As partes acima qualificadas têm entre si justo e contratado o seguinte:

### Cláusula 1ª — Do Objeto

O presente contrato tem por objeto a venda do veículo abaixo descrito, de propriedade do(a)
VENDEDOR(A), livre e desembaraçado de quaisquer ônus, salvo disposição em contrário prevista
neste instrumento:

- Marca/Modelo: {{veiculo_marca}} {{veiculo_modelo}} {{veiculo_versao}}
- Ano de Fabricação/Modelo: {{veiculo_ano_fabricacao}}/{{veiculo_ano_modelo}}
- Placa: {{veiculo_placa}}
- RENAVAM: {{veiculo_renavam}}
- Chassi: {{veiculo_chassi}}
- Cor: {{veiculo_cor}}
- Quilometragem na data da venda: {{veiculo_km}} km

### Cláusula 2ª — Do Preço e Forma de Pagamento

O preço certo e ajustado para a presente venda é de {{negocio_valor}}
({{negocio_valor_por_extenso}}), a ser pago pelo(a) COMPRADOR(A) da seguinte forma:
{{forma_pagamento}}.

### Cláusula 3ª — Da Tradição e Entrega

A tradição (entrega) do veículo, com transferência da posse, ocorrerá em {{data_entrega}},
mediante a entrega do documento de transferência devidamente assinado, do CRLV e das chaves.

### Cláusula 4ª — Da Responsabilidade por Débitos e Infrações

Os débitos de IPVA, licenciamento, multas e demais encargos incidentes sobre o veículo até a
data da tradição são de responsabilidade exclusiva do(a) VENDEDOR(A). A partir da tradição,
toda responsabilidade por débitos, multas e infrações passa a ser do(a) COMPRADOR(A).

### Cláusula 5ª — Da Comunicação da Venda

Em cumprimento ao art. 134 do Código de Trânsito Brasileiro, o(a) VENDEDOR(A) comunicará a
venda ao órgão de trânsito competente no prazo legal, sendo de responsabilidade do(a)
COMPRADOR(A) providenciar a transferência de propriedade perante o DETRAN no prazo legal
aplicável.

### Cláusula 6ª — Da Ciência do Estado do Bem

O veículo é vendido no estado em que se encontra. O(A) COMPRADOR(A) declara ter vistoriado o
veículo e ter ciência prévia e expressa do seguinte estado de conservação e desgaste,
constatado no ato da venda (checklist de vistoria):

{{checklist_vistoria}}

O(A) COMPRADOR(A) reconhece expressamente que se trata de veículo usado, sujeito a
manutenções preventivas e corretivas, cujo padrão de qualidade não se equipara ao de veículo
zero quilômetro — os itens listados acima constituem desgaste natural aceito no preço do
negócio, e não vício oculto.

[CONDICIONAL: garantia]

> O veículo conta com garantia de {{prazo_garantia}} para os seguintes itens:
> {{itens_cobertos_garantia}}, nos termos do Termo de Garantia em anexo.
>
> **Eleição de oficina:** em caso de pane coberta por esta garantia ou pela garantia legal,
> o veículo deverá ser obrigatoriamente encaminhado à oficina credenciada
> {{oficina_credenciada_nome}} para diagnóstico, sendo vedado ao(à) COMPRADOR(A) realizar
> reparos por conta própria ou em oficina de sua escolha sem autorização prévia e por escrito
> da VENDEDORA, sob pena de perda da garantia.
>
> **Perda de garantia por modificação:** a garantia ora concedida extingue-se imediatamente
> caso o(a) COMPRADOR(A) realize qualquer alteração das características originais do veículo,
> incluindo rebaixamento, instalação de kit gás, reprogramação/remap da injeção eletrônica, ou
> instalação de equipamentos que afetem o sistema elétrico original.

[CONDICIONAL: consignacao]

> O veículo é comercializado em regime de consignação, sendo {{proprietario_consignante_nome}}
> o(a) proprietário(a) e vendedor(a) de fato, e {{empresa_nome}} (garagem intermediária)
> atuando como mandatária para fins de divulgação, negociação e formalização da venda,
> fazendo jus à comissão de {{percentual_comissao}}% sobre o valor da venda, conforme
> instrumento de consignação previamente firmado entre as partes.

[CONDICIONAL: financiamento_em_aberto]

> O veículo encontra-se alienado fiduciariamente à instituição financeira
> {{credor_fiduciario_nome}}, sendo a presente venda condicionada à quitação do saldo devedor
> e à liberação do gravame, ou à anuência expressa da credora fiduciária.

### Cláusula 7ª — Da Declaração de Estado Civil

O(A) COMPRADOR(A) declara, para os fins de faturamento e preenchimento do ATPV-e (documento
de transferência), que seu estado civil é {{comprador_estado_civil}}. Esta declaração tem
por finalidade identificar o real adquirente do bem perante o estabelecimento, não se
confundindo com eventual necessidade de anuência conjugal, que é tratada no instrumento de
consignação quando aplicável ao(à) vendedor(a)/consignante.

### Cláusula 8ª — Do Foro

As partes elegem o foro da comarca de {{comarca}} para dirimir quaisquer controvérsias
oriundas deste contrato.


{{cidade}}, {{data_por_extenso}}.


_______________________________________
**VENDEDOR(A)** — {{vendedor_nome}}


_______________________________________
**COMPRADOR(A)** — {{comprador_nome}}


_______________________________________
Intermediação: {{vendedor_intermediario_nome}} (registro interno — vendedor(a) responsável
pelo atendimento, empresa {{empresa_nome}})


Testemunhas:

1. _______________________________________
2. _______________________________________`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function apontamentoConstatado(texto: string | null): boolean {
  const t = (texto ?? "").trim().toLowerCase();
  return t.length > 0 && t !== "sem apontamentos";
}

function precisaAnuenciaConjuge(cliente: any): boolean {
  if (!cliente) return false;
  if (
    cliente.estado_civil === "casado" &&
    ["comunhao_universal", "comunhao_parcial"].includes(cliente.regime_bens)
  ) {
    return true;
  }
  if (cliente.estado_civil === "uniao_estavel" && cliente.uniao_estavel_comprovada === true) {
    return true;
  }
  return false;
}

async function preencherTemplateComClaude(opts: {
  template: string;
  fatos: Record<string, unknown>;
  blocos: Record<string, boolean>;
}) {
  const prompt = `Você vai preencher um contrato jurídico a partir de um template fixo. Regras estritas:

1. NUNCA escreva, altere ou invente cláusulas jurídicas. Use exatamente o texto do template abaixo, palavra por palavra, fora das substituições descritas nos itens seguintes.
2. Substitua cada {{variavel}} pelo valor correspondente em FATOS. Se o valor for null, ausente, ou vazio, escreva "[PREENCHER: nome_da_variavel]" no lugar exato da variável — nunca invente ou estime um valor.
3. O template tem marcações "[CONDICIONAL: nome]" seguidas de um trecho (geralmente uma citação em bloco "> ..."). Para cada marcação, inclua o trecho correspondente (sem a marcação "[CONDICIONAL: ...]") SOMENTE se BLOCOS.nome for true. Se for false ou não existir em BLOCOS, remova completamente a marcação e o trecho que ela introduz.
4. Você pode formatar datas por extenso e valores monetários por extenso em português quando o template pedir isso explicitamente (ex.: "negocio_valor_por_extenso", "data_por_extenso") — isso é formatação, não conteúdo jurídico.
5. Não adicione nenhum texto, comentário, explicação ou marcação de código (sem \`\`\`) fora do próprio contrato. A saída deve ser exclusivamente o texto final do contrato em texto plano/Markdown simples.

TEMPLATE:
"""
${opts.template}
"""

FATOS (JSON):
${JSON.stringify(opts.fatos, null, 2)}

BLOCOS (quais marcações CONDICIONAL incluir, JSON):
${JSON.stringify(opts.blocos, null, 2)}`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    const k = ANTHROPIC_API_KEY;
    const mascara = k ? `len=${k.length} inicio="${k.slice(0, 12)}" fim="${k.slice(-4)}"` : "vazia";
    throw new Error(`Falha ao chamar a Claude API (${resp.status}): ${errText} | chave lida pela function: ${mascara}`);
  }

  const data = await resp.json();
  // Alguns blocos de resposta podem vir antes do texto (ex.: raciocínio
  // interno do modelo) — procura o primeiro bloco do tipo "text" em vez de
  // assumir que é sempre o content[0].
  const blocoTexto = (data.content ?? []).find((bloco: any) => bloco.type === "text");
  const texto = blocoTexto?.text;
  if (!texto) {
    throw new Error(`Claude API não retornou texto. Resposta bruta: ${JSON.stringify(data).slice(0, 500)}`);
  }

  if (data.stop_reason === "max_tokens") {
    console.log("[gerar-documento] AVISO: resposta cortada por max_tokens, tamanho =", texto.length);
    return (
      texto +
      "\n\n[AVISO DO SISTEMA: este documento foi cortado porque ultrapassou o limite de tamanho da resposta da IA. Gere novamente ou avise o desenvolvedor.]"
    );
  }

  return texto as string;
}

async function gerarContratoConsignacao(supabase: any, perfil: any, consignacaoId: string) {
  console.log("[gerar-documento] consignacao: buscando dados", consignacaoId);

  const { data: consignacao, error } = await supabase
    .from("consignacoes")
    .select("*, veiculos(*, empresas(*)), proprietario:clientes(*)")
    .eq("id", consignacaoId)
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!consignacao) return jsonResponse({ error: "Consignação não encontrada." }, 404);

  console.log("[gerar-documento] consignacao: dados carregados, validando campos obrigatorios");

  const veiculo = consignacao.veiculos;
  const empresa = veiculo?.empresas;
  const proprietario = consignacao.proprietario;

  const anuenciaConjuge = precisaAnuenciaConjuge(proprietario);

  const faltando: string[] = [];
  if (!veiculo?.renavam) faltando.push("Renavam do veículo");
  if (!veiculo?.chassi) faltando.push("Chassi do veículo");
  if (!veiculo?.placa) faltando.push("Placa do veículo");
  if (!proprietario?.cpf) faltando.push("CPF do proprietário/consignante");
  if (!proprietario?.estado_civil) faltando.push("Estado civil do proprietário/consignante");
  if (anuenciaConjuge && !proprietario?.conjuge_nome) {
    faltando.push("Nome do cônjuge/companheiro(a) do consignante (exigido pela regra de anuência conjugal)");
  }
  if (anuenciaConjuge && !proprietario?.conjuge_cpf) {
    faltando.push("CPF do cônjuge/companheiro(a) do consignante (exigido pela regra de anuência conjugal)");
  }

  if (faltando.length > 0) {
    return jsonResponse({ bloqueado: true, faltando });
  }

  const blocos = {
    apontamento_constatado: apontamentoConstatado(consignacao.laudo_cautelar_apontamentos),
    modelo_comissao_fixa: consignacao.modelo_remuneracao === "comissao_fixa",
    modelo_agio: consignacao.modelo_remuneracao === "agio",
    prorrogacao_automatica: !!consignacao.prorrogacao_automatica,
    anuencia_conjuge: anuenciaConjuge,
  };

  const fatos = {
    proprietario_nome: proprietario.nome,
    proprietario_cpf: proprietario.cpf,
    proprietario_rg: proprietario.rg ?? null,
    proprietario_estado_civil: proprietario.estado_civil,
    proprietario_regime_bens: proprietario.regime_bens ?? null,
    proprietario_endereco: proprietario.endereco ?? null,
    empresa_nome: empresa?.nome ?? null,
    empresa_cnpj: empresa?.cnpj ?? null,
    empresa_endereco: empresa?.endereco ?? null,
    veiculo_marca: veiculo.marca,
    veiculo_modelo: veiculo.modelo,
    veiculo_versao: veiculo.versao,
    veiculo_ano_fabricacao: veiculo.ano_fabricacao,
    veiculo_ano_modelo: veiculo.ano_modelo,
    veiculo_placa: veiculo.placa,
    veiculo_renavam: veiculo.renavam,
    veiculo_chassi: veiculo.chassi,
    veiculo_cor: veiculo.cor,
    veiculo_km: veiculo.km,
    laudo_cautelar_apontamentos: consignacao.laudo_cautelar_apontamentos?.trim() || "sem apontamentos",
    ajuste_preco_ou_recusa: null,
    prazo_vigencia_dias: consignacao.prazo_vigencia_dias,
    preco_referencia: veiculo.preco,
    percentual_comissao: consignacao.percentual_comissao,
    preco_liquido_consignante: consignacao.preco_liquido_consignante,
    prazo_repasse: null,
    prazo_ressarcimento: null,
    conjuge_nome: proprietario.conjuge_nome ?? null,
    conjuge_cpf: proprietario.conjuge_cpf ?? null,
    comarca: null,
    cidade: null,
    data_por_extenso: new Date().toISOString().slice(0, 10),
    vendedor_intermediario_nome: perfil.nome,
  };

  console.log("[gerar-documento] consignacao: chamando Claude API");
  const conteudo = await preencherTemplateComClaude({ template: TEMPLATE_CONSIGNACAO, fatos, blocos });
  console.log("[gerar-documento] consignacao: Claude respondeu, tamanho do texto =", conteudo.length);

  const { data: documento, error: erroSalvar } = await supabase
    .from("documentos_gerados")
    .insert({
      consignacao_id: consignacaoId,
      tipo: "contrato_consignacao",
      conteudo,
      template_versao: TEMPLATE_VERSAO,
      status: "rascunho",
      gerado_por_usuario_id: perfil.id,
    })
    .select()
    .single();

  if (erroSalvar) {
    console.log("[gerar-documento] consignacao: erro ao salvar", erroSalvar.message);
    return jsonResponse({ error: erroSalvar.message }, 500);
  }

  console.log("[gerar-documento] consignacao: salvo com sucesso", documento.id);
  return jsonResponse({ bloqueado: false, documento });
}

async function gerarContratoCompraVenda(supabase: any, perfil: any, negocioId: string) {
  const { data: negocio, error } = await supabase
    .from("negocios")
    .select("*, veiculos(*, empresas(*)), clientes(*), vendedor:usuarios(nome)")
    .eq("id", negocioId)
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!negocio) return jsonResponse({ error: "Negócio não encontrado." }, 404);

  const veiculo = negocio.veiculos;
  const empresa = veiculo?.empresas;
  const comprador = negocio.clientes;
  const vendedorNome = negocio.vendedor?.nome ?? perfil.nome;
  const ehConsignacao = negocio.tipo === "consignacao";

  const { data: checklist } = await supabase
    .from("checklist_vistoria")
    .select("item, observacao")
    .eq("veiculo_id", veiculo.id)
    .order("created_at");

  let consignacaoInfo: any = null;
  if (ehConsignacao) {
    const { data: consig } = await supabase
      .from("consignacoes")
      .select("*, proprietario:clientes(*)")
      .eq("veiculo_id", veiculo.id)
      .maybeSingle();
    consignacaoInfo = consig;
  }

  const faltando: string[] = [];
  if (!veiculo?.renavam) faltando.push("Renavam do veículo");
  if (!veiculo?.chassi) faltando.push("Chassi do veículo");
  if (!veiculo?.placa) faltando.push("Placa do veículo");
  if (!comprador?.cpf) faltando.push("CPF do comprador");

  if (ehConsignacao) {
    if (!consignacaoInfo) {
      faltando.push("Registro de consignação deste veículo (cadastre a consignação antes de gerar o contrato de venda)");
    } else if (!consignacaoInfo.proprietario?.cpf) {
      faltando.push("CPF do proprietário consignante");
    }
  } else {
    if (!empresa?.cnpj) faltando.push("CNPJ da empresa (vendedora)");
    if (!empresa?.endereco) faltando.push("Endereço da empresa (vendedora)");
  }

  if (!checklist || checklist.length === 0) {
    faltando.push("Checklist de vistoria do veículo (cadastre ao menos 1 item)");
  }

  if (faltando.length > 0) {
    return jsonResponse({ bloqueado: true, faltando });
  }

  const blocos = {
    // Sem campo no schema para prazo/cobertura de garantia nem para oficina
    // credenciada — em v1 esse bloco nunca é oferecido (limitação conhecida).
    garantia: false,
    consignacao: ehConsignacao,
    // Idem: sem campo para alienação fiduciária ativa.
    financiamento_em_aberto: false,
  };

  const fatos = {
    vendedor_nome: ehConsignacao ? consignacaoInfo.proprietario.nome : empresa?.nome,
    vendedor_qualificacao: ehConsignacao
      ? `CPF ${consignacaoInfo.proprietario.cpf}${consignacaoInfo.proprietario.rg ? `, RG ${consignacaoInfo.proprietario.rg}` : ""}`
      : `CNPJ ${empresa?.cnpj ?? ""}, com sede em ${empresa?.endereco ?? ""}`,
    comprador_nome: comprador.nome,
    comprador_cpf: comprador.cpf,
    comprador_rg: comprador.rg ?? null,
    comprador_estado_civil: comprador.estado_civil ?? null,
    comprador_endereco: comprador.endereco ?? null,
    veiculo_marca: veiculo.marca,
    veiculo_modelo: veiculo.modelo,
    veiculo_versao: veiculo.versao,
    veiculo_ano_fabricacao: veiculo.ano_fabricacao,
    veiculo_ano_modelo: veiculo.ano_modelo,
    veiculo_placa: veiculo.placa,
    veiculo_renavam: veiculo.renavam,
    veiculo_chassi: veiculo.chassi,
    veiculo_cor: veiculo.cor,
    veiculo_km: veiculo.km,
    negocio_valor: negocio.valor,
    negocio_valor_por_extenso: null,
    forma_pagamento: null,
    data_entrega: negocio.data_fechamento ?? null,
    checklist_vistoria: checklist.map((i: any) => `${i.item}${i.observacao ? ` — ${i.observacao}` : ""}`).join("; "),
    proprietario_consignante_nome: ehConsignacao ? consignacaoInfo.proprietario.nome : null,
    percentual_comissao: ehConsignacao ? consignacaoInfo.percentual_comissao : null,
    empresa_nome: empresa?.nome ?? null,
    vendedor_intermediario_nome: vendedorNome,
    comarca: null,
    cidade: null,
    data_por_extenso: new Date().toISOString().slice(0, 10),
  };

  const conteudo = await preencherTemplateComClaude({ template: TEMPLATE_COMPRA_VENDA, fatos, blocos });

  const { data: documento, error: erroSalvar } = await supabase
    .from("documentos_gerados")
    .insert({
      negocio_id: negocioId,
      tipo: "contrato_compra_venda",
      conteudo,
      template_versao: TEMPLATE_VERSAO,
      status: "rascunho",
      gerado_por_usuario_id: perfil.id,
    })
    .select()
    .single();

  if (erroSalvar) return jsonResponse({ error: erroSalvar.message }, 500);

  return jsonResponse({ bloqueado: false, documento });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    if (!ANTHROPIC_API_KEY) {
      return jsonResponse(
        {
          error:
            "ANTHROPIC_API_KEY não chegou até a function (Deno.env.get retornou vazio). Confirme o nome exato da secret em Edge Functions → Secrets e tente redeploy.",
        },
        500
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autenticado." }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return jsonResponse({ error: "Não autenticado." }, 401);

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("id, nome, empresa_id")
      .eq("id", userData.user.id)
      .single();

    if (!perfil) return jsonResponse({ error: "Perfil não encontrado." }, 403);

    const body = await req.json();
    const { tipo, negocio_id, consignacao_id } = body;

    if (tipo === "contrato_consignacao") {
      if (!consignacao_id) return jsonResponse({ error: "consignacao_id é obrigatório." }, 400);
      return await gerarContratoConsignacao(supabase, perfil, consignacao_id);
    }

    if (tipo === "contrato_compra_venda") {
      if (!negocio_id) return jsonResponse({ error: "negocio_id é obrigatório." }, 400);
      return await gerarContratoCompraVenda(supabase, perfil, negocio_id);
    }

    return jsonResponse({ error: "Tipo de documento inválido." }, 400);
  } catch (e) {
    console.error("[gerar-documento] excecao nao tratada:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
