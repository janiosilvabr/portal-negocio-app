-- Sessão B (SESSOES_ATUALIZADAS_25jul.md) + decisão de 25/07: resolve a
-- "Lacuna crítica" do CLAUDE.md (cobrança da própria assinatura) e o ponto
-- em aberto do CONTEXTO.md sobre "creditos" (schema antigo, ambíguo).
--
-- Modelo de negócio definido nesta sessão:
-- 1) Assinatura mensal (empresas.plano + assinaturas + pagamentos_saas):
--    gratis/basico/pro, cobrada via Mercado Pago (webhook cuida disso na
--    Parte 2 — este arquivo só cria o schema).
-- 2) Créditos avulsos, independentes da assinatura, disponíveis pra
--    qualquer plano (inclusive Grátis): R$10,00 = 1 crédito = direito a
--    +1 anúncio ativo E +1 geração de documento, cada um consumido
--    separadamente na hora do uso (não expiram, ficam parados até serem
--    usados). Cliente escolhe a quantidade de créditos (não um valor livre
--    em R$), evitando arredondamento.
--
-- Segurança: plano e os saldos de crédito só podem ser alterados por uma
-- conexão com o role service_role (usado pela Edge Function do webhook do
-- Mercado Pago, na Parte 2) — nunca pelo próprio usuário da empresa, mesmo
-- que ele tenha permissão de UPDATE em empresas para os outros campos
-- (nome, telefone etc.). Um trigger reverte qualquer tentativa vinda de
-- fora do service_role.

alter table empresas
  add column plano text not null default 'gratis' check (plano in ('gratis', 'basico', 'pro')),
  add column creditos_anuncios_disponiveis int not null default 0,
  add column creditos_documentos_disponiveis int not null default 0;

create or replace function public.protege_campos_billing_empresa()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('service_role', 'postgres') then
    new.plano := old.plano;
    new.creditos_anuncios_disponiveis := old.creditos_anuncios_disponiveis;
    new.creditos_documentos_disponiveis := old.creditos_documentos_disponiveis;
  end if;
  return new;
end;
$$;

create trigger trg_protege_billing_empresa
  before update on empresas
  for each row execute function public.protege_campos_billing_empresa();

create table assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  plano_id uuid references planos(id) not null,
  status text check (status in ('trial', 'ativa', 'cancelada')) default 'trial',
  mercadopago_subscription_id text,
  data_inicio date default now(),
  proxima_cobranca date,
  created_at timestamptz default now()
);

alter table assinaturas enable row level security;

create policy "usuarios veem a assinatura da propria empresa"
  on assinaturas for select
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create table pagamentos_saas (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid references assinaturas(id) not null,
  valor numeric(10,2),
  status text check (status in ('pago', 'pendente', 'falhou')) default 'pendente',
  mercadopago_payment_id text,
  data_pagamento timestamptz,
  created_at timestamptz default now()
);

alter table pagamentos_saas enable row level security;

create policy "usuarios veem pagamentos da propria assinatura"
  on pagamentos_saas for select
  using (assinatura_id in (
    select id from assinaturas where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

-- Log de auditoria de cada compra de crédito avulso (independente da
-- assinatura). O saldo "vivo" fica em empresas.creditos_*_disponiveis; esta
-- tabela é só o histórico de compras, pra suporte/conferência.
create table compras_creditos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  quantidade int not null check (quantidade > 0),
  valor_pago numeric(10,2) not null,
  status text check (status in ('pago', 'pendente', 'falhou')) default 'pendente',
  mercadopago_payment_id text,
  data_pagamento timestamptz,
  created_at timestamptz default now()
);

alter table compras_creditos enable row level security;

create policy "usuarios veem as compras de credito da propria empresa"
  on compras_creditos for select
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
