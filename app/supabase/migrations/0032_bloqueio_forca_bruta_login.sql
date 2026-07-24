-- Segurança no login (decisão de 24/07): proteção contra força bruta.
-- 5 tentativas erradas seguidas pro mesmo e-mail bloqueiam novas tentativas
-- por 15 minutos. Como o front é estático (sem servidor próprio), a
-- verificação/registro roda via RPC security definer no Postgres — chamado
-- pelo Login.jsx antes e depois de cada tentativa de autenticação. RLS fica
-- ligada na tabela sem nenhuma policy: ninguém lê/escreve direto via API
-- REST, só através das duas funções abaixo (mesmo padrão de
-- listar_vitrine_veiculos, listar_equipe_empresa).
--
-- Não guarda senha nem nada sensível — só e-mail (identifica o alvo das
-- tentativas) e contadores/carimbos de tempo.

create table tentativas_login (
  email text primary key,
  tentativas int not null default 0,
  ultima_tentativa timestamptz not null default now(),
  bloqueado_ate timestamptz
);

alter table tentativas_login enable row level security;

create function public.verificar_bloqueio_login(p_email text)
returns table (bloqueado boolean, bloqueado_ate timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select
    (t.bloqueado_ate is not null and t.bloqueado_ate > now()) as bloqueado,
    t.bloqueado_ate
  from tentativas_login t
  where t.email = lower(trim(p_email))
  union all
  select false, null::timestamptz
  where not exists (select 1 from tentativas_login where email = lower(trim(p_email)))
  limit 1;
$$;

grant execute on function public.verificar_bloqueio_login(text) to anon, authenticated;

create function public.registrar_tentativa_login(p_email text, p_sucesso boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_row tentativas_login%rowtype;
begin
  select * into v_row from tentativas_login where email = v_email;

  if p_sucesso then
    delete from tentativas_login where email = v_email;
    return;
  end if;

  if v_row.email is null then
    insert into tentativas_login (email, tentativas, ultima_tentativa)
    values (v_email, 1, now());
    return;
  end if;

  -- já bloqueado e dentro da janela: só atualiza o carimbo, não soma mais
  if v_row.bloqueado_ate is not null and v_row.bloqueado_ate > now() then
    update tentativas_login set ultima_tentativa = now() where email = v_email;
    return;
  end if;

  -- mais de 15 min desde a última tentativa e não está bloqueado: reinicia
  -- a contagem em vez de acumular tentativas antigas indefinidamente
  if now() - v_row.ultima_tentativa > interval '15 minutes' then
    update tentativas_login
      set tentativas = 1, ultima_tentativa = now(), bloqueado_ate = null
      where email = v_email;
    return;
  end if;

  if v_row.tentativas + 1 >= 5 then
    update tentativas_login
      set tentativas = tentativas + 1, ultima_tentativa = now(),
          bloqueado_ate = now() + interval '15 minutes'
      where email = v_email;
  else
    update tentativas_login
      set tentativas = tentativas + 1, ultima_tentativa = now()
      where email = v_email;
  end if;
end;
$$;

grant execute on function public.registrar_tentativa_login(text, boolean) to anon, authenticated;
