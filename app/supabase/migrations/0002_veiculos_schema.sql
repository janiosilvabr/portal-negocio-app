-- Escopo: tabela veiculos (CONTEXTO.md seção 3) + RLS no mesmo padrão de
-- empresas/usuarios (0001_auth_schema.sql). Sem fotos_veiculos ainda (upload de
-- fotos e vitrine pública ficam para depois).

create table veiculos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  marca text,
  modelo text,
  versao text,
  ano_fabricacao int,
  ano_modelo int,
  placa text,
  km int,
  cor text,
  combustivel text,
  cambio text,
  preco numeric(12,2),
  status text check (status in ('disponivel','reservado','vendido','consignado')) default 'disponivel',
  descricao text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table veiculos enable row level security;

create policy "usuarios veem veiculos da propria empresa"
  on veiculos for select
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios cadastram veiculos na propria empresa"
  on veiculos for insert
  with check (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
