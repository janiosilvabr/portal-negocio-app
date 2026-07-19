-- documentos_gerados (CONTEXTO.md seção 3), com uma correção necessária:
-- o SQL original define negocio_id NOT NULL, mas as notas de desenvolvimento
-- do TEMPLATE_CONTRATO_CONSIGNACAO.md dizem explicitamente que esse contrato
-- é gerado ANTES de existir negocio (associado a consignacoes, não a
-- negocios) — as duas informações do próprio CONTEXTO.md se contradizem.
-- Solução: negocio_id passa a ser opcional, consignacao_id (novo, opcional)
-- cobre o caso do contrato de consignação; constraint garante que sempre
-- existe exatamente um dos dois.

create table documentos_gerados (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id),
  consignacao_id uuid references consignacoes(id),
  tipo text check (tipo in ('contrato_compra_venda','contrato_consignacao','recibo','outro')),
  conteudo text,
  template_versao text,
  status text check (status in ('rascunho','finalizado')) default 'rascunho',
  gerado_por_usuario_id uuid references usuarios(id),
  gerado_em timestamptz default now(),
  constraint documentos_gerados_negocio_ou_consignacao check (
    (negocio_id is not null and consignacao_id is null) or
    (negocio_id is null and consignacao_id is not null)
  )
);

alter table documentos_gerados enable row level security;

create policy "usuarios veem documentos da propria empresa"
  on documentos_gerados for select
  using (
    (negocio_id is not null and negocio_id in (
      select id from negocios where empresa_id in (
        select empresa_id from usuarios where usuarios.id = auth.uid()
      )
    ))
    or
    (consignacao_id is not null and consignacao_id in (
      select id from consignacoes where veiculo_id in (
        select id from veiculos where empresa_id in (
          select empresa_id from usuarios where usuarios.id = auth.uid()
        )
      )
    ))
  );

create policy "usuarios cadastram documentos na propria empresa"
  on documentos_gerados for insert
  with check (
    (negocio_id is not null and negocio_id in (
      select id from negocios where empresa_id in (
        select empresa_id from usuarios where usuarios.id = auth.uid()
      )
    ))
    or
    (consignacao_id is not null and consignacao_id in (
      select id from consignacoes where veiculo_id in (
        select id from veiculos where empresa_id in (
          select empresa_id from usuarios where usuarios.id = auth.uid()
        )
      )
    ))
  );
