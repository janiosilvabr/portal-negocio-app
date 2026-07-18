-- Tabela clientes (CONTEXTO.md seção 3) + RLS no mesmo padrão de veiculos
-- (0002_veiculos_schema.sql): isolado por empresa, sem policy pública
-- (diferente de veiculos, clientes não têm vitrine).

create table clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  nome text not null,
  telefone text,
  email text,
  cpf text,
  endereco text,
  created_at timestamptz default now()
);

alter table clientes enable row level security;

create policy "usuarios veem clientes da propria empresa"
  on clientes for select
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios cadastram clientes na propria empresa"
  on clientes for insert
  with check (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
