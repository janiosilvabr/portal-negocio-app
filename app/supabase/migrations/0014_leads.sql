-- Tabela leads (CONTEXTO.md seção 3) — módulo CRM. Diferente de
-- checklist_vistoria/consignacoes/fotos_veiculos, leads já tem empresa_id
-- próprio, então o RLS é direto (sem join), no mesmo padrão de
-- veiculos/clientes/negocios.

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

alter table leads enable row level security;

create policy "usuarios veem leads da propria empresa"
  on leads for select
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios cadastram leads na propria empresa"
  on leads for insert
  with check (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios atualizam leads da propria empresa"
  on leads for update
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
