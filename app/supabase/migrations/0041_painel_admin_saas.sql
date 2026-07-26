-- Sessão C (SESSOES_ATUALIZADAS_25jul.md): painel administrativo do dono
-- do Portal Negócio (superadmin), pra gerenciar todas as garagens clientes.
--
-- Toda leitura/escrita cruzando empresas passa por function security
-- definer com checagem explícita de is_superadmin — a RLS normal das
-- tabelas isola cada garagem da outra por empresa_id, então o próprio
-- superadmin não conseguiria ver nada entre tenants sem isso.
--
-- mudar_plano_empresa precisa rodar como o dono da function (postgres)
-- para passar pelo trigger protege_campos_billing_empresa (migração 0038),
-- que bloqueia qualquer alteração de "plano" vinda de fora do
-- service_role/postgres — inclusive de um usuário comum autenticado, o que
-- inclui o próprio superadmin logado normalmente pelo app.

alter table usuarios add column is_superadmin boolean not null default false;
alter table empresas add column ativo boolean not null default true;

update usuarios set is_superadmin = true
where id = (select id from auth.users where email = 'janiosilvabr@gmail.com');

create function public.eh_superadmin()
returns boolean
language sql
stable
as $$
  select coalesce((select is_superadmin from usuarios where id = auth.uid()), false);
$$;

create function public.admin_dashboard_kpis()
returns table (
  total_garagens bigint,
  garagens_gratis bigint,
  garagens_basico bigint,
  garagens_pro bigint,
  mrr numeric,
  total_veiculos bigint,
  total_negocios_fechados bigint,
  total_documentos_gerados bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  return query
  select
    (select count(*) from empresas where ativo)::bigint,
    (select count(*) from empresas where ativo and plano = 'gratis')::bigint,
    (select count(*) from empresas where ativo and plano = 'basico')::bigint,
    (select count(*) from empresas where ativo and plano = 'pro')::bigint,
    (
      (select count(*) from empresas where ativo and plano = 'basico') *
        coalesce((select preco_mensal from planos where nome = 'Básico' limit 1), 0)
      +
      (select count(*) from empresas where ativo and plano = 'pro') *
        coalesce((select preco_mensal from planos where nome = 'Pro' limit 1), 0)
    )::numeric,
    (select count(*) from veiculos)::bigint,
    (select count(*) from negocios where status = 'fechado')::bigint,
    (select count(*) from documentos_gerados)::bigint;
end;
$$;

grant execute on function public.admin_dashboard_kpis() to authenticated;

create function public.admin_listar_garagens()
returns table (
  id uuid,
  nome text,
  cnpj text,
  cidade text,
  plano text,
  ativo boolean,
  created_at timestamptz,
  qtd_veiculos bigint,
  qtd_negocios bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  return query
  select
    e.id, e.nome, e.cnpj, e.cidade, e.plano, e.ativo, e.created_at,
    (select count(*) from veiculos v where v.empresa_id = e.id)::bigint,
    (select count(*) from negocios n where n.empresa_id = e.id)::bigint
  from empresas e
  order by e.created_at desc;
end;
$$;

grant execute on function public.admin_listar_garagens() to authenticated;

create function public.admin_mudar_plano_empresa(p_empresa_id uuid, p_novo_plano text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  if p_novo_plano not in ('gratis', 'basico', 'pro') then
    raise exception 'Plano inválido.';
  end if;

  update empresas set plano = p_novo_plano where id = p_empresa_id;
end;
$$;

grant execute on function public.admin_mudar_plano_empresa(uuid, text) to authenticated;

create function public.admin_desativar_empresa(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  update empresas set ativo = false where id = p_empresa_id;
end;
$$;

grant execute on function public.admin_desativar_empresa(uuid) to authenticated;

create function public.admin_reativar_empresa(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  update empresas set ativo = true where id = p_empresa_id;
end;
$$;

grant execute on function public.admin_reativar_empresa(uuid) to authenticated;

create function public.admin_detalhe_garagem(p_empresa_id uuid)
returns table (
  id uuid,
  nome text,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  cidade text,
  plano text,
  ativo boolean,
  created_at timestamptz,
  responsavel_legal_nome text,
  responsavel_legal_cargo text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  return query
  select e.id, e.nome, e.cnpj, e.telefone, e.email, e.endereco, e.cidade, e.plano, e.ativo,
    e.created_at, e.responsavel_legal_nome, e.responsavel_legal_cargo
  from empresas e
  where e.id = p_empresa_id;
end;
$$;

grant execute on function public.admin_detalhe_garagem(uuid) to authenticated;

create function public.admin_veiculos_da_garagem(p_empresa_id uuid)
returns table (
  id uuid,
  marca text,
  modelo text,
  ano_modelo int,
  preco numeric,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  return query
  select v.id, v.marca, v.modelo, v.ano_modelo, v.preco, v.status, v.created_at
  from veiculos v
  where v.empresa_id = p_empresa_id
  order by v.created_at desc;
end;
$$;

grant execute on function public.admin_veiculos_da_garagem(uuid) to authenticated;

create function public.admin_documentos_da_garagem(p_empresa_id uuid)
returns table (
  id uuid,
  tipo text,
  status text,
  gerado_em timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  return query
  select d.id, d.tipo, d.status, d.gerado_em
  from documentos_gerados d
  where
    d.negocio_id in (select n.id from negocios n where n.empresa_id = p_empresa_id)
    or
    d.consignacao_id in (
      select c.id from consignacoes c
      join veiculos v on v.id = c.veiculo_id
      where v.empresa_id = p_empresa_id
    )
  order by d.gerado_em desc;
end;
$$;

grant execute on function public.admin_documentos_da_garagem(uuid) to authenticated;

create function public.admin_pagamentos_da_garagem(p_empresa_id uuid)
returns table (
  id uuid,
  valor numeric,
  status text,
  data_pagamento timestamptz,
  plano_nome text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  return query
  select p.id, p.valor, p.status, p.data_pagamento, pl.nome
  from pagamentos_saas p
  join assinaturas a on a.id = p.assinatura_id
  join planos pl on pl.id = a.plano_id
  where a.empresa_id = p_empresa_id
  order by p.created_at desc;
end;
$$;

grant execute on function public.admin_pagamentos_da_garagem(uuid) to authenticated;
