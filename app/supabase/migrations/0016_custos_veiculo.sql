-- custos_veiculo (CONTEXTO.md seção 3) — nunca tinha sido migrada. Mesmo
-- padrão de RLS de checklist_vistoria (sem empresa_id próprio, isolamento
-- via join com veiculos.empresa_id). O custo de aquisição do veículo entra
-- aqui como categoria = 'aquisicao' (convenção do CONTEXTO.md, sem coluna
-- separada em veiculos).

create table custos_veiculo (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references veiculos(id) not null,
  descricao text,
  categoria text default 'outro',
  valor numeric(12,2),
  data date default now(),
  created_at timestamptz default now()
);

alter table custos_veiculo enable row level security;

create policy "usuarios veem custos da propria empresa"
  on custos_veiculo for select
  using (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

create policy "usuarios cadastram custos na propria empresa"
  on custos_veiculo for insert
  with check (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

create policy "usuarios excluem custos da propria empresa"
  on custos_veiculo for delete
  using (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));
