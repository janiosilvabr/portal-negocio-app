-- Perfis institucionais das garagens (decisão de 03/08, item 2 da sequência
-- pós-limites/créditos): hoje clicar num card de /garagens só filtra a
-- Home por ?empresa=id (Inicio.jsx), sem logo/cidade/telefone/identidade
-- nenhuma da garagem. Isso cria uma página pública de verdade em
-- /garagens/:id, usável como link de divulgação pra captação de garagens.

alter table empresas add column sobre text;

-- Mesmo padrão de listar_garagens_publicas (0026): nunca expor a tabela
-- empresas direto pra anon, só os campos do perfil público via function
-- SECURITY DEFINER, e só quando visivel_publicamente = true.
create function public.obter_garagem_publica(p_empresa_id uuid)
returns table (
  id uuid,
  nome text,
  logo_url text,
  cidade text,
  telefone text,
  sobre text
)
language sql
security definer
set search_path = public
stable
as $$
  select id, nome, logo_url, cidade, telefone, sobre
  from empresas
  where id = p_empresa_id and visivel_publicamente = true;
$$;

grant execute on function public.obter_garagem_publica(uuid) to anon, authenticated;

-- obter_veiculo_publico (0037) ganha empresa_id, pra DetalheVeiculo.jsx
-- poder linkar pro perfil da garagem que vende o veículo. Muda a lista de
-- colunas retornadas, então precisa dropar antes de recriar.
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
  preco numeric,
  status text,
  descricao text,
  empresa_id uuid,
  empresa_nome text,
  empresa_cidade text,
  empresa_telefone text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select v.id, v.marca, v.modelo, v.versao, v.ano_fabricacao, v.ano_modelo,
         v.km, v.cor, v.combustivel, v.cambio, v.preco, v.status, v.descricao,
         e.id as empresa_id, e.nome as empresa_nome, e.cidade as empresa_cidade,
         e.telefone as empresa_telefone, v.created_at
  from veiculos v
  join empresas e on e.id = v.empresa_id
  where v.id = p_veiculo_id and v.status = 'disponivel';
$$;

grant execute on function public.obter_veiculo_publico(uuid) to anon, authenticated;
