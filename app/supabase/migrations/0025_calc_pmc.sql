-- Calc. PMC (CONTEXTO.md, avaliacoes_pmc / FEATURES.md). Simulação de
-- "Preço Máximo de Compra" — pode existir sem veículo cadastrado (o
-- garagista simula antes de decidir comprar); liga-se a um veículo já
-- cadastrado depois, se/quando aplicável (não obrigatório na criação).
-- Não inclui a "Avaliação de Preço por IA" (FEATURES.md passo 6) — é
-- recurso pago via Mercado Pago, fase 2, fora deste módulo.

create table avaliacoes_pmc (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  usuario_id uuid references usuarios(id),
  veiculo_id uuid references veiculos(id),
  descricao_veiculo text,
  tipo_veiculo text check (tipo_veiculo in ('moto','carro','utilitario_suv')),
  pvp numeric(12,2),
  lucro_desejado numeric(12,2),
  custo_mecanica numeric(12,2) default 0,
  custo_estetica numeric(12,2) default 0,
  reserva_garantia numeric(12,2) default 0,
  outros_custos numeric(12,2) default 0,
  preco_pedido_vendedor numeric(12,2),
  pmc_calculado numeric(12,2),
  created_at timestamptz default now()
);

alter table avaliacoes_pmc enable row level security;

create policy "usuarios veem avaliacoes pmc da propria empresa"
  on avaliacoes_pmc for select
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios criam avaliacoes pmc na propria empresa"
  on avaliacoes_pmc for insert
  with check (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

-- update é usado só para vincular a simulação a um veículo já cadastrado
-- depois de salva (o resto do cálculo não é editável após criado — refaz
-- uma simulação nova, mais simples que rastrear histórico de edição).
create policy "usuarios vinculam veiculo a avaliacoes pmc da propria empresa"
  on avaliacoes_pmc for update
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()))
  with check (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
