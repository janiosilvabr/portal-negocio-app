# TEMPLATE_CONTRATO_COMPRA_VENDA.md

> **Rascunho para sua análise e adequação — não é um documento pronto para uso.**
> Escrito como ponto de partida, com base na estrutura padrão de contrato particular de
> compra e venda de veículo automotor sob o Código Civil (arts. 481 e seguintes — compra e
> venda) e o Código de Trânsito Brasileiro (art. 134 — comunicação de venda ao órgão de
> trânsito). Como advogado responsável pelo produto, você decide a redação final; isto é
> insumo, não conclusão jurídica.
>
> **Convenção usada:** `{{variavel}}` = dado preenchido automaticamente pelo sistema a partir
> do cadastro. Blocos marcados `[CONDICIONAL: ...]` só entram no texto final se a condição
> descrita for verdadeira para aquele negócio específico — o sistema escolhe entre um
> conjunto fixo de blocos pré-aprovados por você, nunca redige um bloco novo.

---

## CONTRATO PARTICULAR DE COMPRA E VENDA DE VEÍCULO AUTOMOTOR

**VENDEDOR(A):**
`{{vendedor_nome}}`, `{{vendedor_qualificacao — CPF/CNPJ, RG se pessoa física, endereço}}`.

*(No caso de consignação, ver bloco condicional de consignação abaixo, que substitui a
qualificação do vendedor pelo proprietário consignante + a garagem como intermediária.)*

**COMPRADOR(A):**
`{{comprador_nome}}`, CPF `{{comprador_cpf}}`, RG `{{comprador_rg}}`,
estado civil `{{comprador_estado_civil}}`, residente em `{{comprador_endereco}}`.

As partes acima qualificadas têm entre si justo e contratado o seguinte:

### Cláusula 1ª — Do Objeto

O presente contrato tem por objeto a venda do veículo abaixo descrito, de propriedade do(a)
VENDEDOR(A), livre e desembaraçado de quaisquer ônus, salvo disposição em contrário prevista
neste instrumento:

- Marca/Modelo: `{{veiculo_marca}} {{veiculo_modelo}} {{veiculo_versao}}`
- Ano de Fabricação/Modelo: `{{veiculo_ano_fabricacao}}/{{veiculo_ano_modelo}}`
- Placa: `{{veiculo_placa}}`
- RENAVAM: `{{veiculo_renavam}}`
- Chassi: `{{veiculo_chassi}}`
- Cor: `{{veiculo_cor}}`
- Quilometragem na data da venda: `{{veiculo_km}}` km

### Cláusula 2ª — Do Preço e Forma de Pagamento

O preço certo e ajustado para a presente venda é de `{{negocio_valor}}`
(`{{negocio_valor_por_extenso}}`), a ser pago pelo(a) COMPRADOR(A) da seguinte forma:
`{{forma_pagamento — à vista, sinal + parcelas, financiamento etc.}}`.

### Cláusula 3ª — Da Tradição e Entrega

A tradição (entrega) do veículo, com transferência da posse, ocorrerá em `{{data_entrega}}`,
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

`{{checklist_vistoria — lista gerada a partir dos itens cadastrados para este veículo, ex.:
"amortecedores com 60 mil km de uso", "pneus com 40% de vida útil", "risco no para-choque
traseiro"}}`

O(A) COMPRADOR(A) reconhece expressamente que se trata de veículo usado, sujeito a
manutenções preventivas e corretivas, cujo padrão de qualidade não se equipara ao de veículo
zero quilômetro — os itens listados acima constituem desgaste natural aceito no preço do
negócio, e não vício oculto.

`[CONDICIONAL: garantia — inclui esta cláusula somente se a garagem oferecer garantia
contratual sobre o veículo, com prazo e cobertura definidos por ela]`

> O veículo conta com garantia de `{{prazo_garantia}}` para os seguintes itens:
> `{{itens_cobertos_garantia}}`, nos termos do Termo de Garantia em anexo.
>
> **Eleição de oficina:** em caso de pane coberta por esta garantia ou pela garantia legal,
> o veículo deverá ser obrigatoriamente encaminhado à oficina credenciada
> `{{oficina_credenciada_nome}}` para diagnóstico, sendo vedado ao(à) COMPRADOR(A) realizar
> reparos por conta própria ou em oficina de sua escolha sem autorização prévia e por escrito
> da VENDEDORA, sob pena de perda da garantia.
>
> **Perda de garantia por modificação:** a garantia ora concedida extingue-se imediatamente
> caso o(a) COMPRADOR(A) realize qualquer alteração das características originais do veículo,
> incluindo rebaixamento, instalação de kit gás, reprogramação/remap da injeção eletrônica, ou
> instalação de equipamentos que afetem o sistema elétrico original.

`[CONDICIONAL: consignação — substitui a qualificação simples do vendedor quando o negócio é
do tipo "consignação"]`

> O veículo é comercializado em regime de consignação, sendo `{{proprietario_consignante_nome}}`
> o(a) proprietário(a) e vendedor(a) de fato, e `{{empresa_nome}}` (garagem intermediária)
> atuando como mandatária para fins de divulgação, negociação e formalização da venda,
> fazendo jus à comissão de `{{percentual_comissao}}%` sobre o valor da venda, conforme
> instrumento de consignação previamente firmado entre as partes.

`[CONDICIONAL: financiamento em aberto — inclui somente se o veículo tiver alienação
fiduciária ativa no momento da venda]`

> O veículo encontra-se alienado fiduciariamente à instituição financeira
> `{{credor_fiduciario_nome}}`, sendo a presente venda condicionada à quitação do saldo devedor
> e à liberação do gravame, ou à anuência expressa da credora fiduciária.

### Cláusula 7ª — Da Declaração de Estado Civil

O(A) COMPRADOR(A) declara, para os fins de faturamento e preenchimento do ATPV-e (documento
de transferência), que seu estado civil é `{{comprador_estado_civil}}`. Esta declaração tem
por finalidade identificar o real adquirente do bem perante o estabelecimento, não se
confundindo com eventual necessidade de anuência conjugal, que é tratada no instrumento de
consignação quando aplicável ao(à) vendedor(a)/consignante.

### Cláusula 8ª — Do Foro

As partes elegem o foro da comarca de `{{comarca}}` para dirimir quaisquer controvérsias
oriundas deste contrato.

---

`{{cidade}}`, `{{data_por_extenso}}`.

&nbsp;

_______________________________________
**VENDEDOR(A)** — `{{vendedor_nome}}`

&nbsp;

_______________________________________
**COMPRADOR(A)** — `{{comprador_nome}}`

&nbsp;

_______________________________________
Intermediação: `{{vendedor_intermediario_nome}}` (registro interno — vendedor(a) responsável
pelo atendimento, empresa `{{empresa_nome}}`)

&nbsp;

Testemunhas:

1. _______________________________________
2. _______________________________________

---

## Notas para o desenvolvimento (não fazem parte do texto do contrato)

- Campos obrigatórios que bloqueiam a geração se estiverem vazios: `veiculo_renavam`,
  `veiculo_chassi`, `veiculo_placa`, `comprador_cpf`, `vendedor_qualificacao` (ou
  `proprietario_consignante` + dados da empresa, se consignação).
- A Cláusula 6ª depende da tabela `checklist_vistoria` ter ao menos 1 item cadastrado para o
  veículo. Se estiver vazia, considerar se o sistema deve bloquear a geração (recomendado) ou
  gerar com uma ressalva genérica de "estado usado, sem itens específicos declarados" — decisão
  do usuário/advogado.
- `template_versao` no banco deve referenciar a versão deste arquivo (ex.: "v1.1" — nesta
  revisão foram incorporadas as cláusulas de ciência do estado do bem, oficina credenciada e
  perda de garantia por modificação). Se você editar este template no futuro, incremente a
  versão para manter o histórico de auditoria.
- `gerado_por_usuario_id` registra o usuário logado que disparou a geração, não o vendedor do
  negócio (podem ser pessoas diferentes).
