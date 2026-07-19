-- transacoes_financeiras (CONTEXTO.md seção 3). RLS diferente do padrão
-- usual: SELECT é dividido — admin vê tudo da empresa, vendedor só as
-- próprias transações (comissões, vendedor_id = auth.uid()). O restante
-- da equipe não deve ver receita total nem despesas de outros. INSERT é
-- liberado pra qualquer usuário da empresa (lançamento manual e o
-- consolidado opcional de custos_veiculo ao fechar negócio, ambos ações
-- de qualquer vendedor, não só admin).

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

alter table transacoes_financeiras enable row level security;

create policy "admin ve transacoes da propria empresa"
  on transacoes_financeiras for select
  using (empresa_id in (
    select empresa_id from usuarios where usuarios.id = auth.uid() and usuarios.papel = 'admin'
  ));

create policy "vendedor ve as proprias transacoes"
  on transacoes_financeiras for select
  using (vendedor_id = auth.uid());

create policy "usuarios cadastram transacoes na propria empresa"
  on transacoes_financeiras for insert
  with check (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
