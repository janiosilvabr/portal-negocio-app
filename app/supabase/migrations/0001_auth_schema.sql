-- Escopo: só as tabelas que a autenticação (login/cadastro) exige.
-- Demais tabelas do schema v1 (veiculos, clientes, negocios...) ficam para quando
-- esses módulos entrarem em construção — ver CONTEXTO.md seção 3.

create extension if not exists "pgcrypto";

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  logo_url text,
  created_at timestamptz default now()
);

create table usuarios (
  id uuid primary key references auth.users(id),
  empresa_id uuid references empresas(id),
  nome text not null,
  papel text check (papel in ('admin','vendedor')) default 'vendedor',
  telefone text,
  created_at timestamptz default now()
);

alter table empresas enable row level security;
alter table usuarios enable row level security;

-- Cada usuário só enxerga/edita a própria empresa e o próprio perfil.
create policy "usuarios veem a propria empresa"
  on empresas for select
  using (id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios atualizam a propria empresa"
  on empresas for update
  using (id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuario ve o proprio perfil"
  on usuarios for select
  using (id = auth.uid());

create policy "usuario atualiza o proprio perfil"
  on usuarios for update
  using (id = auth.uid());

-- No cadastro (supabase.auth.signUp), nome e nome_empresa chegam em raw_user_meta_data
-- (ver src/pages/Cadastro.jsx). Esse trigger cria a empresa e o perfil admin
-- automaticamente, com privilégio elevado (security definer) porque nesse momento
-- o usuário ainda não tem sessão/RLS liberada para inserir nas tabelas ele mesmo.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  nova_empresa_id uuid;
begin
  insert into empresas (nome)
  values (coalesce(new.raw_user_meta_data->>'nome_empresa', 'Minha empresa'))
  returning id into nova_empresa_id;

  insert into usuarios (id, empresa_id, nome, papel)
  values (new.id, nova_empresa_id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'admin');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
