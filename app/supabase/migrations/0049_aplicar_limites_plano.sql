-- Aplica de verdade os limites de plano (limite_veiculos, limite_documentos)
-- e o consumo de créditos avulsos (decisão de 03/08). Até aqui nada bloqueava
-- ninguém de passar do limite do próprio plano, e créditos comprados não
-- desbloqueavam nada — pagar não mudava o que o sistema deixava fazer.
--
-- Mesmo padrão de security definer já usado em tentativas_login (0032) e
-- confirmar_revisao_documento (0047): só assim dá pra escrever em
-- empresas.creditos_*_disponiveis, protegido pelo trigger
-- protege_campos_billing_empresa (0038) que só libera write pra
-- service_role/postgres — uma function security definer roda como o dono
-- dela (postgres), então passa por essa trava sem service role key em
-- nenhum lugar do frontend.

-- planos.nome tem acento ("Grátis"/"Básico"/"Pro") e empresas.plano é slug
-- ("gratis"/"basico"/"pro") — até agora o único lugar que ligava os dois era
-- um mapeamento manual duplicado no frontend (Planos.jsx). slug dá uma chave
-- de join confiável pras functions abaixo, sem mexer em quem já usa `nome`.
alter table planos add column slug text;
update planos set slug = case nome
  when 'Pro' then 'pro'
  when 'Básico' then 'basico'
  when 'Grátis' then 'gratis'
  else lower(nome)
end;

-- "Anúncio ativo" = veiculos.status = 'disponivel', o mesmo filtro que
-- listar_vitrine_veiculos() (0048) já usa pra decidir o que é público.
-- Reservado/vendido/consignado não contam pro limite.
create or replace function public.aplicar_limite_veiculos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limite int;
  v_ativos int;
  v_creditos int;
begin
  if new.status is distinct from 'disponivel' then
    return new;
  end if;

  -- já estava disponivel antes (edição normal, não é uma nova ativação)
  if tg_op = 'UPDATE' and old.status = 'disponivel' then
    return new;
  end if;

  select p.limite_veiculos into v_limite
  from empresas e
  join planos p on p.slug = e.plano
  where e.id = new.empresa_id;

  select count(*) into v_ativos
  from veiculos
  where empresa_id = new.empresa_id
    and status = 'disponivel'
    and id is distinct from new.id;

  if v_ativos < coalesce(v_limite, 0) then
    return new;
  end if;

  -- for update: trava a linha da empresa até o fim da transação, evitando
  -- que duas criações concorrentes leiam o mesmo saldo de crédito "por
  -- baixo" e as duas passem quando só havia 1 crédito.
  select creditos_anuncios_disponiveis into v_creditos
  from empresas where id = new.empresa_id
  for update;

  if coalesce(v_creditos, 0) <= 0 then
    raise exception 'limite_anuncios_excedido';
  end if;

  update empresas
    set creditos_anuncios_disponiveis = creditos_anuncios_disponiveis - 1
    where id = new.empresa_id;

  return new;
end;
$$;

drop trigger if exists trg_aplicar_limite_veiculos on veiculos;
create trigger trg_aplicar_limite_veiculos
  before insert or update of status on veiculos
  for each row execute function public.aplicar_limite_veiculos();

-- Chamada via RPC pela Edge Function gerar-documento (que roda com o JWT do
-- usuário, nunca service role) antes de qualquer chamada à Claude API — evita
-- gastar tokens num pedido que vai ser bloqueado por limite.
create or replace function public.verificar_e_consumir_limite_documento(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limite int;
  v_gerados_mes int;
  v_creditos int;
begin
  select (p.recursos->>'limite_documentos')::int into v_limite
  from empresas e
  join planos p on p.slug = e.plano
  where e.id = p_empresa_id;

  select count(*) into v_gerados_mes
  from documentos_gerados d
  left join negocios n on n.id = d.negocio_id
  left join consignacoes c on c.id = d.consignacao_id
  left join veiculos v on v.id = c.veiculo_id
  where d.gerado_em >= date_trunc('month', now())
    and (
      (d.negocio_id is not null and n.empresa_id = p_empresa_id)
      or
      (d.consignacao_id is not null and v.empresa_id = p_empresa_id)
    );

  if v_gerados_mes < coalesce(v_limite, 0) then
    return;
  end if;

  select creditos_documentos_disponiveis into v_creditos
  from empresas where id = p_empresa_id
  for update;

  if coalesce(v_creditos, 0) <= 0 then
    raise exception 'limite_documentos_excedido';
  end if;

  update empresas
    set creditos_documentos_disponiveis = creditos_documentos_disponiveis - 1
    where id = p_empresa_id;
end;
$$;

grant execute on function public.verificar_e_consumir_limite_documento(uuid) to authenticated;
