-- checklist_vistoria (CONTEXTO.md seção 3): "prontuário" do veículo, usado depois
-- para a Cláusula de Ciência do Estado do Bem no contrato. Não tem empresa_id
-- próprio — o isolamento por empresa é feito via join com veiculos.empresa_id.

create table checklist_vistoria (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references veiculos(id) not null,
  item text not null,
  observacao text,
  created_at timestamptz default now()
);

alter table checklist_vistoria enable row level security;

create policy "usuarios veem checklist da propria empresa"
  on checklist_vistoria for select
  using (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

create policy "usuarios cadastram checklist na propria empresa"
  on checklist_vistoria for insert
  with check (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

create policy "usuarios atualizam checklist da propria empresa"
  on checklist_vistoria for update
  using (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

create policy "usuarios excluem checklist da propria empresa"
  on checklist_vistoria for delete
  using (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

-- Editar veículo é uma tela nova (só existia cadastro até agora) — falta a
-- policy de UPDATE em veiculos, que nunca tinha sido necessária.
create policy "usuarios atualizam veiculos da propria empresa"
  on veiculos for update
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
