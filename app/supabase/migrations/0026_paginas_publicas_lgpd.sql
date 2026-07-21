-- Páginas públicas novas (Garagens) + LGPD (CONTEXTO.md, decisão de 21/07).

alter table empresas
  add column visivel_publicamente boolean default true,
  add column cidade text;

alter table usuarios
  add column lgpd_aceite_em timestamptz;

-- handle_new_user (0015) passa a gravar lgpd_aceite_em a partir do
-- checkbox obrigatório do cadastro (chega em raw_user_meta_data, mesmo
-- mecanismo já usado por nome/nome_empresa/convite_token).
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

  insert into usuarios (id, empresa_id, nome, papel, comissao_percentual, lgpd_aceite_em)
  values (
    new.id,
    empresa_final,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    papel_final,
    comissao_final,
    case when (new.raw_user_meta_data->>'lgpd_aceite')::boolean then now() else null end
  );

  return new;
end;
$$;

-- Página pública "Garagens": mesmo padrão de segurança de
-- listar_vitrine_veiculos (0007/0013) — nunca expor a tabela empresas
-- direto pra anon (vazaria cnpj/telefone/endereco/email), só os campos
-- do card público via function SECURITY DEFINER.
create function public.listar_garagens_publicas()
returns table (
  id uuid,
  nome text,
  logo_url text,
  cidade text
)
language sql
security definer
set search_path = public
stable
as $$
  select id, nome, logo_url, cidade
  from empresas
  where visivel_publicamente = true
  order by nome;
$$;

grant execute on function public.listar_garagens_publicas() to anon, authenticated;

-- listar_vitrine_veiculos ganha empresa_id, pra permitir "Vitrine filtrada
-- por uma garagem" (link a partir da página Garagens) sem depender de
-- casar nome de empresa como texto.
drop function if exists public.listar_vitrine_veiculos();

create function public.listar_vitrine_veiculos()
returns table (
  id uuid,
  marca text,
  modelo text,
  versao text,
  ano_fabricacao int,
  ano_modelo int,
  km int,
  cor text,
  combustivel text,
  cambio text,
  tipo_carroceria text,
  preco numeric,
  status text,
  empresa_id uuid,
  empresa_nome text,
  foto_url text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select v.id, v.marca, v.modelo, v.versao, v.ano_fabricacao, v.ano_modelo,
         v.km, v.cor, v.combustivel, v.cambio, v.tipo_carroceria, v.preco, v.status,
         e.id as empresa_id, e.nome as empresa_nome,
         (
           select f.url from fotos_veiculos f
           where f.veiculo_id = v.id
           order by f.ordem asc, f.created_at asc
           limit 1
         ) as foto_url,
         v.created_at
  from veiculos v
  join empresas e on e.id = v.empresa_id
  where v.status = 'disponivel'
  order by v.created_at desc;
$$;

grant execute on function public.listar_vitrine_veiculos() to anon, authenticated;
