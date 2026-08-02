-- Fusão /vitrine → home (02/08): a home passa a mostrar a listagem completa de
-- veículos, e o usuário pediu para manter a ordenação por plano da garagem
-- (Pro primeiro, depois Básico, depois Grátis) — vantagem visual real para
-- quem paga, não só um placeholder round-robin como era antes em Inicio.jsx.
--
-- listar_vitrine_veiculos() nunca devolvia o plano da empresa (só empresa_id/
-- empresa_nome — ver migration 0031). Agora que empresas.plano existe de
-- verdade (migration 0038), dá para ordenar por plano real em vez de round-robin.

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
  empresa_plano text,
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
         e.plano as empresa_plano,
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
  order by
    case e.plano when 'pro' then 0 when 'basico' then 1 else 2 end,
    v.created_at desc;
$$;

grant execute on function public.listar_vitrine_veiculos() to anon, authenticated;
