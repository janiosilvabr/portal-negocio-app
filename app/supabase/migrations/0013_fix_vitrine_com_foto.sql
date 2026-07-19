-- 0012_vitrine_com_foto.sql provavelmente falhou ao rodar: "create or replace
-- function" não permite mudar as colunas da tabela retornada (estamos
-- adicionando foto_url) — o Postgres exige DROP antes nesse caso.

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
  preco numeric,
  status text,
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
         v.km, v.cor, v.combustivel, v.cambio, v.preco, v.status,
         e.nome as empresa_nome,
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
