-- Sessão D (SESSOES_ATUALIZADAS_25jul.md): CRM completo — atividades e
-- follow-up. Tabela nova, RLS no mesmo padrão das demais (escopo por
-- empresa_id do usuário logado).
--
-- vendedor_id (não estava no rascunho original do documento, adicionado
-- por decisão do usuário em 25/07): quem é responsável por realizar o
-- follow-up — fica nullable, já que uma atividade pode não ter um
-- vendedor específico designado ainda.

create table atividades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  tipo text check (tipo in ('ligacao', 'email', 'visita', 'whatsapp', 'outro')) not null,
  cliente_id uuid references clientes(id),
  lead_id uuid references leads(id),
  veiculo_id uuid references veiculos(id),
  vendedor_id uuid references usuarios(id),
  data_hora timestamptz not null,
  observacoes text,
  status text default 'pendente' check (status in ('pendente', 'concluida', 'cancelada')),
  created_at timestamptz default now()
);

alter table atividades enable row level security;

create policy "usuarios veem atividades da propria empresa"
  on atividades for select
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios cadastram atividades na propria empresa"
  on atividades for insert
  with check (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios atualizam atividades da propria empresa"
  on atividades for update
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios excluem atividades da propria empresa"
  on atividades for delete
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
