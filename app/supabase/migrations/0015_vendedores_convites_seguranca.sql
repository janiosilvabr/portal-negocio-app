-- Módulo Vendedores, parte 1: schema + segurança.
--
-- 1) usuarios ganha comissao_percentual (já estava no CONTEXTO.md, nunca
--    migrado) e ativo (novo — pedido explícito do módulo Vendedores, sem
--    equivalente no CONTEXTO.md, espelha o FEATURES.md do Base44).
--
-- 2) convites: hoje não existe forma de um segundo usuário entrar numa
--    empresa já existente — todo cadastro (Cadastro.jsx) cria uma empresa
--    nova via handle_new_user. "Cadastrar vendedor" exige resolver isso:
--    o admin gera um convite (token), a pessoa se cadastra pelo link
--    /cadastro?convite=TOKEN, e o trigger junta ela à empresa do convite em
--    vez de criar uma nova. Nunca enviamos e-mail automático — o admin
--    compartilha o link manualmente (WhatsApp etc.).
--
-- 3) Endurecimento de segurança: a policy de UPDATE em usuarios só checava
--    "id = auth.uid()", sem travar QUAIS colunas — qualquer usuário logado
--    podia, via API direta, mudar o próprio papel pra 'admin' ou inflar a
--    própria comissao_percentual. Isso passa a importar de verdade agora
--    que comissão vira transação financeira automática. Trigger BEFORE
--    UPDATE bloqueia isso para quem não é admin.

alter table usuarios add column comissao_percentual numeric(5,2);
alter table usuarios add column ativo boolean default true;

create table convites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) not null,
  email text not null,
  nome text not null,
  papel text check (papel in ('admin','vendedor')) default 'vendedor',
  comissao_percentual numeric(5,2),
  token uuid not null default gen_random_uuid(),
  usado boolean default false,
  criado_por uuid references usuarios(id),
  created_at timestamptz default now()
);

alter table convites enable row level security;

-- Só admin cria/vê convites da própria empresa. Sem policy pública de
-- select: a consulta por token acontece dentro do trigger (security
-- definer), nunca direto do navegador.
create policy "admin ve convites da propria empresa"
  on convites for select
  using (empresa_id in (
    select empresa_id from usuarios where usuarios.id = auth.uid() and usuarios.papel = 'admin'
  ));

create policy "admin cria convites na propria empresa"
  on convites for insert
  with check (empresa_id in (
    select empresa_id from usuarios where usuarios.id = auth.uid() and usuarios.papel = 'admin'
  ));

-- Reescreve handle_new_user (0001_auth_schema.sql): se o cadastro trouxer
-- um convite_token válido e não usado em raw_user_meta_data, junta a
-- empresa do convite (com o papel/comissão definidos por ele) em vez de
-- criar uma empresa nova.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  convite_row convites%rowtype;
  empresa_final uuid;
  papel_final text := 'admin';
  comissao_final numeric(5,2) := null;
begin
  if new.raw_user_meta_data->>'convite_token' is not null then
    select * into convite_row
    from convites
    where token = (new.raw_user_meta_data->>'convite_token')::uuid
      and usado = false
    limit 1;
  end if;

  if convite_row.id is not null then
    empresa_final := convite_row.empresa_id;
    papel_final := convite_row.papel;
    comissao_final := convite_row.comissao_percentual;

    update convites set usado = true where id = convite_row.id;
  else
    insert into empresas (nome)
    values (coalesce(new.raw_user_meta_data->>'nome_empresa', 'Minha empresa'))
    returning id into empresa_final;
  end if;

  insert into usuarios (id, empresa_id, nome, papel, comissao_percentual)
  values (
    new.id,
    empresa_final,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    papel_final,
    comissao_final
  );

  return new;
end;
$$;

-- Trigger anti-escalação de privilégio: sem ser admin, ninguém muda o
-- próprio (ou de outro usuário) papel, comissao_percentual, empresa_id ou
-- ativo — mesmo estando dentro da própria linha permitida pela policy de
-- UPDATE "usuario atualiza o proprio perfil".
create function public.impedir_autopromocao_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ator_papel text;
begin
  select papel into ator_papel from usuarios where id = auth.uid();

  if ator_papel is distinct from 'admin' then
    if new.papel is distinct from old.papel
       or new.comissao_percentual is distinct from old.comissao_percentual
       or new.empresa_id is distinct from old.empresa_id
       or new.ativo is distinct from old.ativo then
      raise exception 'Apenas administradores podem alterar papel, comissão, empresa ou status ativo.';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_impedir_autopromocao_usuario
  before update on usuarios
  for each row execute function public.impedir_autopromocao_usuario();

-- Admin passa a poder atualizar qualquer usuário da própria empresa (além
-- da policy já existente de cada um editar o próprio perfil). O trigger
-- acima é quem garante que só admin muda os campos sensíveis mesmo que
-- outra policy futura seja mais permissiva.
create policy "admin atualiza usuarios da propria empresa"
  on usuarios for update
  using (empresa_id in (
    select empresa_id from usuarios u2 where u2.id = auth.uid() and u2.papel = 'admin'
  ));

-- Sem isso, o admin não conseguiria listar a equipe (tela Vendedores) —
-- a policy de select original só deixava cada um ver o próprio perfil.
create policy "admin ve usuarios da propria empresa"
  on usuarios for select
  using (empresa_id in (
    select empresa_id from usuarios u2 where u2.id = auth.uid() and u2.papel = 'admin'
  ));
