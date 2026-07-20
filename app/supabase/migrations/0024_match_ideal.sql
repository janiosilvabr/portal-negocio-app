-- "Match Ideal" (CLAUDE.md roadmap, decisão de 20/07): campos de perfil de
-- busca no lead + tipo de carroceria no veículo, usados por um filtro
-- direto no banco (sem Claude API) que sugere os 3 veículos do estoque
-- mais aderentes ao perfil de cada lead.

alter table veiculos
  add column tipo_carroceria text
    check (tipo_carroceria in ('sedan','suv','hatch','pickup','utilitario','moto','outro'));

alter table leads
  add column orcamento_maximo numeric(12,2),
  add column tipo_carroceria_desejado text,
  add column cambio_desejado text;

-- listar_vitrine_veiculos precisa devolver tipo_carroceria pra reforçar o
-- filtro da Vitrine — "create or replace" não deixa mudar as colunas de
-- retorno (mesmo problema de 0013), então precisa dropar antes.
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

-- obter_veiculo_publico (Detalhe do Veículo) também ganha tipo_carroceria,
-- mesmo motivo/mesma correção de "drop antes de recriar".
drop function if exists public.obter_veiculo_publico(uuid);

create function public.obter_veiculo_publico(p_veiculo_id uuid)
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
  empresa_nome text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select v.id, v.marca, v.modelo, v.versao, v.ano_fabricacao, v.ano_modelo,
         v.km, v.cor, v.combustivel, v.cambio, v.tipo_carroceria, v.preco, v.status,
         e.nome as empresa_nome, v.created_at
  from veiculos v
  join empresas e on e.id = v.empresa_id
  where v.id = p_veiculo_id and v.status = 'disponivel';
$$;

grant execute on function public.obter_veiculo_publico(uuid) to anon, authenticated;
