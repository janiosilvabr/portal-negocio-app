-- Tabela negocios (CONTEXTO.md seção 3) + RLS no mesmo padrão de veiculos/clientes.
-- Diferente dos módulos anteriores, negocios também tem policy de UPDATE:
-- um negócio precisa poder mudar de status (em_andamento -> fechado/cancelado)
-- ao longo do pipeline, isso é o próprio propósito da tabela.

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

alter table negocios enable row level security;

create policy "usuarios veem negocios da propria empresa"
  on negocios for select
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios cadastram negocios na propria empresa"
  on negocios for insert
  with check (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios atualizam negocios da propria empresa"
  on negocios for update
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
