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
- id (= auth.users.id), empresa_id (fk), nome, papel (enum: admin/vendedor), telefone

### veiculos
- empresa_id (fk), marca, modelo, versao, ano_fabricacao, ano_modelo, placa, km, cor,
  combustivel, cambio, preco, status (enum: disponivel/reservado/vendido/consignado),
  descricao, updated_at

### fotos_veiculos
- veiculo_id (fk), url, ordem

### clientes
- empresa_id (fk), nome, telefone, email, cpf, endereco

### leads
Contato interessado, ainda não é negócio fechado.
- empresa_id (fk), cliente_id (fk, nullable), veiculo_id (fk, nullable),
  origem (enum: site/whatsapp/indicacao/outro), status (enum: novo/em_contato/negociando/perdido/convertido),
  vendedor_id (fk usuarios), observacoes

### negocios
Venda ou consignação em andamento/fechada.
- empresa_id (fk), veiculo_id (fk), cliente_id (fk), vendedor_id (fk usuarios),
  tipo (enum: venda/consignacao), valor, status (enum: em_andamento/fechado/cancelado),
  data_fechamento

### consignacoes
- veiculo_id (fk), proprietario_cliente_id (fk clientes), percentual_comissao,
  data_inicio, data_fim, status

### custos_veiculo
Controle simples de custo por veículo (revisão, funilaria, etc. — não é o financeiro completo da empresa).
- veiculo_id (fk), descricao, valor, data

### documentos_gerados
Contratos/recibos gerados automaticamente (via Claude API).
- negocio_id (fk), tipo (enum: contrato_compra_venda/recibo/outro), url_arquivo, gerado_em

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
  created_at timestamptz default now()
);

create table veiculos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  marca text, modelo text, versao text,
  ano_fabricacao int, ano_modelo int,
  placa text, km int, cor text, combustivel text, cambio text,
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
  nome text not null, telefone text, email text, cpf text, endereco text,
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

create table consignacoes (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references veiculos(id) not null,
  proprietario_cliente_id uuid references clientes(id) not null,
  percentual_comissao numeric(5,2),
  data_inicio date, data_fim date,
  status text default 'ativa'
);

create table custos_veiculo (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references veiculos(id) not null,
  descricao text, valor numeric(12,2), data date default now()
);

create table documentos_gerados (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) not null,
  tipo text check (tipo in ('contrato_compra_venda','recibo','outro')),
  url_arquivo text,
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
