# TEMPLATE_CONTRATO_CONSIGNACAO.md

> **Rascunho para sua análise e adequação — não é um documento pronto para uso.**
> Contrato estimatório (art. 534 e seguintes do Código Civil), usado no momento em que a
> garagem **recebe** um veículo de terceiro para revenda — momento distinto e anterior ao
> `TEMPLATE_CONTRATO_COMPRA_VENDA.md`, que cobre a saída (venda ao cliente final). Como
> advogado responsável pelo produto, você decide a redação final; isto é insumo, não
> conclusão jurídica.
>
> **Convenção usada:** `{{variavel}}` = dado preenchido automaticamente pelo sistema a partir
> do cadastro. Blocos marcados `[CONDICIONAL: ...]` só entram no texto final se a condição
> descrita for verdadeira para aquele negócio específico.

---

## CONTRATO DE CONSIGNAÇÃO DE VEÍCULO AUTOMOTOR

**CONSIGNANTE (proprietário do veículo):**
`{{proprietario_nome}}`, CPF `{{proprietario_cpf}}`, RG `{{proprietario_rg}}`,
estado civil `{{proprietario_estado_civil}}`, residente em `{{proprietario_endereco}}`.

**CONSIGNATÁRIA (garagem intermediária):**
`{{empresa_nome}}`, CNPJ `{{empresa_cnpj}}`, com sede em `{{empresa_endereco}}`.

As partes acima qualificadas têm entre si justo e contratado o seguinte:

### Cláusula 1ª — Do Objeto

O(A) CONSIGNANTE entrega à CONSIGNATÁRIA, em regime de consignação, o veículo abaixo descrito,
para fins de exposição, divulgação e venda a terceiros:

- Marca/Modelo: `{{veiculo_marca}} {{veiculo_modelo}} {{veiculo_versao}}`
- Ano de Fabricação/Modelo: `{{veiculo_ano_fabricacao}}/{{veiculo_ano_modelo}}`
- Placa: `{{veiculo_placa}}` — RENAVAM: `{{veiculo_renavam}}` — Chassi: `{{veiculo_chassi}}`
- Cor: `{{veiculo_cor}}` — Quilometragem na entrada: `{{veiculo_km}}` km

### Cláusula 2ª — Do Laudo Cautelar na Entrada

O(A) CONSIGNANTE obriga-se a apresentar, no ato da entrega, laudo de vistoria cautelar do
veículo, às suas expensas, atestando a inexistência de sinistro, roubo/furto, passagem por
leilão ou restrição judicial não declarada. Resultado da vistoria:

`{{laudo_cautelar_apontamentos — se houver qualquer apontamento (sinistro, leilão, restrição),
descrever aqui; se nenhum apontamento, registrar "sem apontamentos"}}`

`[CONDICIONAL: apontamento constatado — inclui somente se laudo_cautelar_apontamentos não
estiver vazio/"sem apontamentos"]`

> As partes ajustam, em razão do apontamento acima, o seguinte: `{{ajuste_preco_ou_recusa}}`
> (ex.: ajuste no preço de referência de venda, ou recusa do veículo pela CONSIGNATÁRIA).

### Cláusula 3ª — Da Vigência

O presente contrato vigora pelo prazo de `{{prazo_vigencia_dias}}` dias, contados da data de
entrada do veículo, `[CONDICIONAL: prorrogação automática]` prorrogável automaticamente por
igual período, caso nenhuma das partes se manifeste em contrário.

### Cláusula 4ª — Da Remuneração da Consignatária

`[CONDICIONAL: modelo comissão fixa]`

> O preço de referência para a venda do veículo é de `{{preco_referencia}}`. A CONSIGNATÁRIA
> fará jus a uma comissão de `{{percentual_comissao}}%` sobre o valor efetivamente realizado
> na venda.

`[CONDICIONAL: modelo ágio]`

> O(A) CONSIGNANTE deseja receber, líquido, o valor de `{{preco_liquido_consignante}}` pela
> venda do veículo. A CONSIGNATÁRIA está autorizada a comercializá-lo pelo valor que o mercado
> praticar, constituindo sua remuneração a diferença entre o valor efetivamente realizado na
> venda e o preço líquido aqui fixado.

Em qualquer dos modelos, o saldo devido ao(à) CONSIGNANTE será repassado em até
`{{prazo_repasse}}` dias após a efetivação da venda.

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
advocatícios e o valor pago ao comprador, no prazo de `{{prazo_ressarcimento}}` dias contados
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

1. Seu real estado civil e regime de bens: `{{proprietario_estado_civil}}` /
   `{{proprietario_regime_bens}}`;
2. Que o veículo é de sua exclusiva propriedade, livre e desembaraçado de meação, união
   estável fática ou litígio de partilha em curso;
3. Que assume total e exclusiva responsabilidade perante eventuais terceiros, cônjuge ou
   companheiro(a), isentando a CONSIGNATÁRIA de qualquer litígio decorrente desta declaração.

`[CONDICIONAL: anuência do cônjuge — inclui a assinatura abaixo somente quando QUALQUER uma
das condições for verdadeira: (1) estado civil "casado" com regime de bens "comunhão
universal" ou "comunhão parcial"; ou (2) estado civil "união estável" comprovada por contrato
ou declaração com assinatura reconhecida em cartório. Em qualquer outro caso (solteiro,
separação total, união estável não comprovada), este bloco NÃO entra no documento.]`

> Anui expressamente com os termos deste contrato:
> `{{conjuge_nome}}`, CPF `{{conjuge_cpf}}`, cônjuge/companheiro(a) do(a) CONSIGNANTE.

### Cláusula 10ª — Do Foro

As partes elegem o foro da comarca de `{{comarca}}` para dirimir quaisquer controvérsias
oriundas deste contrato.

---

`{{cidade}}`, `{{data_por_extenso}}`.

&nbsp;

_______________________________________
**CONSIGNANTE** — `{{proprietario_nome}}`

`[CONDICIONAL: anuência do cônjuge]`

_______________________________________
**CÔNJUGE/COMPANHEIRO(A)** — `{{conjuge_nome}}`

&nbsp;

_______________________________________
**CONSIGNATÁRIA** — `{{empresa_nome}}`, representada por `{{vendedor_intermediario_nome}}`

&nbsp;

Testemunhas:

1. _______________________________________
2. _______________________________________

---

## Notas para o desenvolvimento (não fazem parte do texto do contrato)

- Campos obrigatórios que bloqueiam a geração se estiverem vazios: `veiculo_renavam`,
  `veiculo_chassi`, `veiculo_placa`, `proprietario_cpf`, `proprietario_estado_civil`.
- **Regra definitiva do cônjuge (definida pelo usuário, 18/07):** exigir assinatura quando
  `estado_civil = 'casado'` E `regime_bens` in ('comunhao_universal', 'comunhao_parcial'); OU
  quando `estado_civil = 'uniao_estavel'` E `uniao_estavel_comprovada = true`. Ver também
  CONTEXTO.md, seção `clientes`.
- A Cláusula 8ª (retirada antecipada) referencia os custos já registrados na tabela
  `custos_veiculo` daquele veículo durante o período de consignação — a lista desses custos
  deve ser somada e exibida ao usuário antes de gerar o documento, não calculada "de cabeça"
  pela IA.
- Este contrato é gerado **antes** do `TEMPLATE_CONTRATO_COMPRA_VENDA.md`, no momento em que o
  veículo entra em consignação — ou seja, associado ao registro em `consignacoes`, não
  diretamente a um `negocio` de venda (que só existe quando aparece um comprador).
- `template_versao`: "v1.1" para esta revisão (vigência, dois modelos de remuneração,
  autorização de retenção, infrações por test-drive, retirada antecipada).
- `gerado_por_usuario_id` registra o usuário logado que disparou a geração.
