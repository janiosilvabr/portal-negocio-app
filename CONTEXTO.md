# CONTEXTO.md — Portal Negócio: CRM Concessionária/Garagista + Vitrine de Veículos

> Documento de planejamento (fase "Planejar" do fluxo Explorar → Planejar → Codificar → Commitar).
> Entregar este arquivo ao Claude Code no início de cada sessão de trabalho neste projeto.

---

## 1. Escopo do produto (v1)

**O que é:** SaaS para pequenos e médios garagistas/concessionárias centralizarem cadastro de
veículos, CRM de leads/clientes e emissão automática de contrato de compra e venda.

**Fora do escopo do v1 (não construir agora):**
- Módulo de imóveis / corretores (era um segundo produto dentro do mesmo projeto — cortado)
- Automação via N8N ou Make (entra só na fase 2, depois do fluxo manual validado)
- Módulo financeiro completo (despesas gerais da empresa)
- Ordens de serviço (nome duplicado no banco antigo, não migrado — avaliar depois)
- Créditos (ambíguo: crédito de financiamento de veículo vs. crédito de uso do sistema —
  não migrado até esclarecer)

---

## 2. Estado atual da infraestrutura

| Peça | Decisão | Status |
|---|---|---|
| Banco de dados | Supabase | Projeto criado (`O Carro Ideal`), **schema vazio**, não ligado ao site em produção |
| Hospedagem | Hostinger | Plano atual: Compartilhada (não roda N8N — ok, N8N é fase 2) |
| Domínio | portalnegocio.com.br | Registro.br, DNS na Cloudflare |
| Protótipo atual em produção | Base44 | app.base44.com — usa banco interno próprio, não o Supabase acima |
| Pagamento | **Mercado Pago** (não Stripe) | Já integrado no Base44 (`MERCADO_PAGO_ACCESS_TOKEN`) — manter, é melhor para Pix/boleto no Brasil |
| E-mail/CRM marketing | Brevo | Já integrado (`BREVO_API_KEY`) |
| Geração de documentos / IA | Claude API | Já integrado (`ANTHROPIC_API_KEY`) |
| Automação | Make (existente) → migrar para N8N depois | Adiado para fase 2 |

**Decisão de migração:** construir o schema novo do zero no Supabase (não aproveitar/podar o
schema exportado do Base44, que veio misturado com o módulo de imóveis).

---

## 3. Schema v1 — tabelas a criar

Todas as tabelas usam `id uuid primary key default gen_random_uuid()` e `created_at timestamptz default now()`
salvo indicação contrária. `empresa_id` existe nas tabelas principais porque o produto é
multi-tenant (cada garagista é uma "empresa" isolada dentro do mesmo banco).

### empresas
Cada assinante do SaaS (o garagista/concessionária).
- nome, cnpj, telefone, email, endereco, logo_url

### usuarios
Perfil ligado ao `auth.users` do Supabase (autenticação já vem pronta no Supabase).
- id (= auth.users.id), empresa_id (fk), nome, papel (enum: admin/vendedor), telefone,
  **comissao_percentual (numeric, nullable — só relevante quando papel = vendedor)**

### veiculos
- empresa_id (fk), marca, modelo, versao, ano_fabricacao, ano_modelo, placa, **renavam, chassi**,
  **tipo_carroceria (enum: sedan/suv/hatch/pickup/utilitario/moto/outro — usado pelo Match
  Ideal e reforça os filtros da Vitrine)**, km, cor, combustivel, cambio, preco,
  status (enum: disponivel/reservado/vendido/consignado), descricao, updated_at

> **Nota jurídica:** `renavam` e `chassi` são obrigatórios para o módulo de Documentos gerar um
> contrato válido — o sistema deve bloquear a geração do contrato se esses campos (ou placa,
> ou CPF das partes) estiverem vazios.

### fotos_veiculos
- veiculo_id (fk), url, ordem

### checklist_vistoria (novo — "prontuário" do veículo)
Registro do estado/desgaste do veículo no momento da entrada, usado para preencher a
Cláusula de Ciência do Estado do Bem no contrato de venda — o que o comprador declara ciente
deixa de ser vício oculto perante o CDC.
- veiculo_id (fk), item (text — ex.: "amortecedores", "pneus", "para-choque traseiro"),
  observacao (text — ex.: "40% de vida útil", "risco visível"), created_at

### clientes
- empresa_id (fk), nome, telefone, email, cpf, rg, estado_civil, regime_bens (text,
  nullable — relevante quando o cliente é consignante/vendedor: comunhão parcial/universal,
  separação total etc.), **uniao_estavel_comprovada (boolean, default false — true somente se
  houver contrato de união estável ou declaração com assinatura reconhecida em cartório)**,
  conjuge_nome (text, nullable), conjuge_cpf (text, nullable), endereco

> **Regra de negócio (definida pelo usuário, 18/07):** exigir assinatura do cônjuge/
> companheiro(a) no `TEMPLATE_CONTRATO_CONSIGNACAO.md` quando **qualquer uma** das condições
> for verdadeira: (1) `estado_civil = 'casado'` **e** `regime_bens` in
> ('comunhao_universal', 'comunhao_parcial'); **ou** (2) `estado_civil = 'uniao_estavel'`
> **e** `uniao_estavel_comprovada = true`. Em qualquer outro caso (solteiro, separação total,
> união estável não comprovada), a assinatura não é exigida.

### leads
Contato interessado, ainda não é negócio fechado.
- empresa_id (fk), cliente_id (fk, nullable), veiculo_id (fk, nullable),
  origem (enum: site/whatsapp/indicacao/outro), status (enum: novo/em_contato/negociando/perdido/convertido),
  vendedor_id (fk usuarios), observacoes, **orcamento_maximo (numeric, nullable),
  tipo_carroceria_desejado (text, nullable), cambio_desejado (text, nullable) — os 3 usados
  pelo "Match Ideal" (ver roadmap) para sugerir veículos do estoque aderentes ao perfil**

> **Regra de "Passagem de Bastão" (decisão de 19/07):** sempre que `vendedor_id` de um lead
> mudar, anexar automaticamente em `observacoes` uma linha "Lead assumido por [vendedor] em
> [data]" (não sobrescrever o histórico anterior, só acrescentar). **Bloqueio:** enquanto
> `status = 'negociando'`, apenas o `vendedor_id` atual do lead ou um usuário com
> `papel = 'admin'` pode alterá-lo — implementar como policy de **RLS de UPDATE** (regra de
> segurança do Postgres específica para escrita, separada da regra de leitura), não apenas
> como validação de tela, para não poder ser burlada.

### negocios
Venda ou consignação em andamento/fechada.
- empresa_id (fk), veiculo_id (fk), cliente_id (fk), vendedor_id (fk usuarios),
  tipo (enum: venda/consignacao), valor, status (enum: em_andamento/fechado/cancelado),
  data_fechamento

### consignacoes
- veiculo_id (fk), proprietario_cliente_id (fk clientes), **modelo_remuneracao (enum:
  comissao_fixa/agio)**, percentual_comissao (usado só se modelo_remuneracao = comissao_fixa),
  **preco_liquido_consignante (numeric, usado só se modelo_remuneracao = agio — valor exato
  que o proprietário quer receber; a diferença para o preço de venda final é a remuneração
  da garagem)**, data_inicio, data_fim, **prazo_vigencia_dias (int, default 60),
  prorrogacao_automatica (boolean, default true)**, status, laudo_cautelar_realizado
  (boolean — vistoria cautelar na entrada, às custas do consignante), laudo_cautelar_apontamentos
  (text, nullable — ex.: sinistro ou passagem por leilão constatados, usados para ajustar
  preço ou recusar o veículo)

### custos_veiculo
Controle simples de custo por veículo (revisão, funilaria, etc. — não é o financeiro completo
da empresa). **Convenção (decisão de 19/07):** o custo de aquisição do veículo (quanto a
garagem pagou por ele) é registrado como o primeiro lançamento aqui, com
`categoria = 'aquisicao'` — não criamos campo separado em `veiculos` pra isso, reaproveitamos
esta tabela. Usado pelo "Termômetro de Margem" (ver `negocios`/UI de veículo): margem estimada
= `veiculos.preco` (venda) − soma de `custos_veiculo` (incluindo aquisição) − comissão
estimada do vendedor, exibida antes mesmo da venda acontecer.
- veiculo_id (fk), descricao, **categoria (text — ex.: "aquisicao", "mecanica", "estetica",
  "outro")**, valor, data

### transacoes_financeiras (novo — módulo Financeiro)
Receitas e despesas da empresa. Alimentada de duas formas: manualmente (botão "Nova
Transação", igual ao Base44) e **automaticamente**, quando um negócio muda para "fechado":
gera 1 registro de receita (valor da venda) e, se houver vendedor com `comissao_percentual`
definido, 1 registro de despesa de comissão vinculado a ele. Isso evita o garagista calcular
comissão na mão todo mês.
- empresa_id (fk), tipo (enum: receita/despesa), categoria (text — ex.: "venda", "comissao",
  "custo_veiculo", "outro"), descricao, valor, negocio_id (fk, nullable — liga a transação ao
  negócio que a gerou, quando automática), vendedor_id (fk usuarios, nullable — só em
  despesas de comissão), data, status (enum: pago/pendente), created_at

> **Lucro líquido por negócio** (não é campo armazenado, é calculado): valor do negócio menos
> a soma de `custos_veiculo` daquele veículo menos a comissão do vendedor. Ver roadmap no
> CLAUDE.md sobre comparar isso com a estimativa da Calc. PMC.

### documentos_gerados
Contratos/recibos gerados automaticamente (via Claude API, através de uma Edge Function do
Supabase — a chave da Claude API nunca fica exposta no navegador). **A IA preenche um
template jurídico fixo (validado pelo usuário/advogado) e escolhe cláusulas condicionais
dentro de um conjunto pré-aprovado — nunca redige cláusula livremente.**
- negocio_id (fk), tipo (enum: contrato_compra_venda/**contrato_consignacao**/recibo/outro), conteudo (text — o texto
  do documento gerado, guardado no banco; v1 não usa Storage/arquivo, exporta como PDF via
  impressão do navegador), **template_versao (text — qual versão do template-base foi usada,
  para auditoria caso o template mude no futuro)**, status (enum: rascunho/finalizado),
  **gerado_por_usuario_id (fk usuarios — registra quem disparou a geração, para
  responsabilização caso um dado incorreto tenha sido inserido por descuido)**, gerado_em

> **Decisão registrada (18/07):** o pipeline de `negocios` mantém os 3 status simples
> (em_andamento/fechado/cancelado) definidos originalmente — não foi expandido para os 6
> estágios do Base44 documentados em FEATURES.md. O botão "Gerar Documento" fica disponível
> manualmente em qualquer negócio "em_andamento", sem depender de um estágio específico.

### planos
Planos de assinatura do seu SaaS (o que o garagista paga a você).
- nome, preco_mensal, limite_veiculos, recursos (jsonb)

### assinaturas
- empresa_id (fk), plano_id (fk), status (enum: trial/ativa/cancelada),
  mercadopago_subscription_id, data_inicio, proxima_cobranca

### pagamentos_saas
(Renomeada de `pagamentos_documentos`, que tinha nome ambíguo — cobre o pagamento da
assinatura do garagista, não documentos do veículo.)
- assinatura_id (fk), valor, status (enum: pago/pendente/falhou), mercadopago_payment_id, data_pagamento

---

## 4. Rascunho de SQL (revisar com Claude Code antes de rodar — não executar às cegas)

```sql
create extension if not exists "pgcrypto";

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  logo_url text,
  created_at timestamptz default now()
);

create table usuarios (
  id uuid primary key references auth.users(id),
  empresa_id uuid references empresas(id),
  nome text not null,
  papel text check (papel in ('admin','vendedor')) default 'vendedor',
  telefone text,
  comissao_percentual numeric(5,2),
  created_at timestamptz default now()
);

create table veiculos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  marca text, modelo text, versao text,
  ano_fabricacao int, ano_modelo int,
  placa text, renavam text, chassi text,
  tipo_carroceria text check (tipo_carroceria in ('sedan','suv','hatch','pickup','utilitario','moto','outro')),
  km int, cor text, combustivel text, cambio text,
  preco numeric(12,2),
  status text check (status in ('disponivel','reservado','vendido','consignado')) default 'disponivel',
  descricao text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table fotos_veiculos (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references veiculos(id) not null,
  url text not null,
  ordem int default 0
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  nome text not null, telefone text, email text, cpf text, rg text, estado_civil text,
  regime_bens text, uniao_estavel_comprovada boolean default false,
  conjuge_nome text, conjuge_cpf text,
  endereco text,
  created_at timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  cliente_id uuid references clientes(id),
  veiculo_id uuid references veiculos(id),
  origem text check (origem in ('site','whatsapp','indicacao','outro')),
  status text check (status in ('novo','em_contato','negociando','perdido','convertido')) default 'novo',
  vendedor_id uuid references usuarios(id),
  observacoes text,
  orcamento_maximo numeric(12,2),
  tipo_carroceria_desejado text,
  cambio_desejado text,
  created_at timestamptz default now()
);

create table negocios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  veiculo_id uuid references veiculos(id) not null,
  cliente_id uuid references clientes(id) not null,
  vendedor_id uuid references usuarios(id),
  tipo text check (tipo in ('venda','consignacao')),
  valor numeric(12,2),
  status text check (status in ('em_andamento','fechado','cancelado')) default 'em_andamento',
  data_fechamento date,
  created_at timestamptz default now()
);

create table checklist_vistoria (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references veiculos(id) not null,
  item text not null,
  observacao text,
  created_at timestamptz default now()
);

create table consignacoes (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references veiculos(id) not null,
  proprietario_cliente_id uuid references clientes(id) not null,
  modelo_remuneracao text check (modelo_remuneracao in ('comissao_fixa','agio')) default 'comissao_fixa',
  percentual_comissao numeric(5,2),
  preco_liquido_consignante numeric(12,2),
  data_inicio date, data_fim date,
  prazo_vigencia_dias int default 60,
  prorrogacao_automatica boolean default true,
  status text default 'ativa',
  laudo_cautelar_realizado boolean default false,
  laudo_cautelar_apontamentos text
);

create table custos_veiculo (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references veiculos(id) not null,
  descricao text, categoria text default 'outro', valor numeric(12,2), data date default now()
);

create table transacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  tipo text check (tipo in ('receita','despesa')) not null,
  categoria text,
  descricao text,
  valor numeric(12,2) not null,
  negocio_id uuid references negocios(id),
  vendedor_id uuid references usuarios(id),
  data date default now(),
  status text check (status in ('pago','pendente')) default 'pendente',
  created_at timestamptz default now()
);

create table documentos_gerados (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) not null,
  tipo text check (tipo in ('contrato_compra_venda','contrato_consignacao','recibo','outro')),
  conteudo text,
  template_versao text,
  status text check (status in ('rascunho','finalizado')) default 'rascunho',
  gerado_por_usuario_id uuid references usuarios(id),
  gerado_em timestamptz default now()
);

create table planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco_mensal numeric(10,2),
  limite_veiculos int,
  recursos jsonb
);

create table assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  plano_id uuid references planos(id) not null,
  status text check (status in ('trial','ativa','cancelada')) default 'trial',
  mercadopago_subscription_id text,
  data_inicio date default now(),
  proxima_cobranca date
);

create table pagamentos_saas (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid references assinaturas(id) not null,
  valor numeric(10,2),
  status text check (status in ('pago','pendente','falhou')) default 'pendente',
  mercadopago_payment_id text,
  data_pagamento timestamptz
);
```

---

## 5. Pontos em aberto (confirmar antes de rodar o SQL)

1. `ordens_servico` vs `orders_service` (schema antigo) — qual é a versão oficial? Não migrado ainda.
2. `despesas_base` / `despesas_saas` (schema antigo) — financeiro completo, adiado para fase 2.
3. `creditos` (schema antigo) — crédito de financiamento do veículo ou crédito de uso do sistema? Não migrado.
4. Confirmar se `documentos_gerados` deve conter também o **link do PDF** ou só metadados (o PDF fica armazenado no Supabase Storage, não na tabela).

---

## 6. Próxima fase: Codificar

Com este arquivo, a próxima sessão no Claude Code deve:
1. Rodar o SQL da seção 4 no Supabase (ambiente de teste, não produção).
2. Conferir se as tabelas foram criadas sem erro.
3. **Não** avançar para telas/frontend ainda — antes disso, testar inserção manual de 1 registro
   em cada tabela principal (`empresas`, `veiculos`, `clientes`) para validar o schema.
4. Só depois disso: planejar a primeira tela (provavelmente cadastro de veículo).

**Commit:** após o SQL rodar sem erro e o teste manual funcionar, esse é o primeiro commit do projeto.
