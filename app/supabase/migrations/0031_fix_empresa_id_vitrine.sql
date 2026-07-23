-- Bug encontrado durante o redesign visual da Vitrine (23/07): a página
-- Garagens linka pra /vitrine?empresa=ID, e Vitrine.jsx filtra comparando
-- v.empresa_id com esse ID — mas listar_vitrine_veiculos() nunca devolvia
-- empresa_id (só empresa_nome), então o filtro nunca dava match e a lista
-- sempre ficava vazia ao entrar por uma garagem específica.

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
         e.id as empresa_id,
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
