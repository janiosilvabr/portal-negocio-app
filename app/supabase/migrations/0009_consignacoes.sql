-- Tabela consignacoes (CONTEXTO.md seção 3) + RLS no mesmo padrão de
-- checklist_vistoria: sem empresa_id próprio, isolamento via join com
-- veiculos.empresa_id.

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
  laudo_cautelar_apontamentos text,
  created_at timestamptz default now()
);

alter table consignacoes enable row level security;

create policy "usuarios veem consignacoes da propria empresa"
  on consignacoes for select
  using (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

create policy "usuarios cadastram consignacoes na propria empresa"
  on consignacoes for insert
  with check (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

create policy "usuarios atualizam consignacoes da propria empresa"
  on consignacoes for update
  using (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));
