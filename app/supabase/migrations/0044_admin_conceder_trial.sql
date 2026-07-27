-- Decisão de 27/07: o superadmin pode conceder um plano de teste (trial)
-- por N dias a uma garagem, sem passar pelo Mercado Pago -- pra bônus
-- pontual, cortesia ou parceria. Reaproveita o status 'trial' que já
-- existia em assinaturas desde a migração 0038 (nunca tinha sido usado
-- por nenhuma tela ainda), e o campo proxima_cobranca guarda a data em
-- que o teste expira.
--
-- Limitação conhecida e aceita por decisão do usuário: não expira
-- sozinho -- não existe agendador/cron neste projeto ainda (fase 2 do
-- roadmap). O superadmin acompanha a data em /admin/garagens e troca o
-- plano de volta manualmente quando o teste terminar.

create function public.admin_conceder_trial(p_empresa_id uuid, p_novo_plano text, p_dias int default 30)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plano_id uuid;
  v_nome_plano text;
begin
  if not public.eh_superadmin() then
    raise exception 'Acesso negado.';
  end if;

  if p_novo_plano not in ('basico', 'pro') then
    raise exception 'Plano inválido para teste grátis (só basico ou pro).';
  end if;

  if p_dias is null or p_dias < 1 then
    raise exception 'Quantidade de dias inválida.';
  end if;

  v_nome_plano := case p_novo_plano when 'basico' then 'Básico' when 'pro' then 'Pro' end;
  select id into v_plano_id from planos where nome = v_nome_plano limit 1;

  if v_plano_id is null then
    raise exception 'Plano % não encontrado.', v_nome_plano;
  end if;

  update empresas set plano = p_novo_plano where id = p_empresa_id;

  insert into assinaturas (empresa_id, plano_id, status, data_inicio, proxima_cobranca)
  values (p_empresa_id, v_plano_id, 'trial', current_date, current_date + p_dias);
end;
$$;

grant execute on function public.admin_conceder_trial(uuid, text, int) to authenticated;

-- Expõe a data de expiração do trial mais recente (se houver) nas
-- functions já existentes de listar/detalhar garagem.

drop function if exists public.admin_listar_garagens();

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
  qtd_negocios bigint,
  trial_expira_em date
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
    (select count(*) from negocios n where n.empresa_id = e.id)::bigint,
    (
      select a.proxima_cobranca from assinaturas a
      where a.empresa_id = e.id and a.status = 'trial'
      order by a.created_at desc limit 1
    )
  from empresas e
  order by e.created_at desc;
end;
$$;

grant execute on function public.admin_listar_garagens() to authenticated;

drop function if exists public.admin_detalhe_garagem(uuid);

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
  responsavel_legal_cargo text,
  trial_expira_em date
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
    e.created_at, e.responsavel_legal_nome, e.responsavel_legal_cargo,
    (
      select a.proxima_cobranca from assinaturas a
      where a.empresa_id = e.id and a.status = 'trial'
      order by a.created_at desc limit 1
    )
  from empresas e
  where e.id = p_empresa_id;
end;
$$;

grant execute on function public.admin_detalhe_garagem(uuid) to authenticated;
