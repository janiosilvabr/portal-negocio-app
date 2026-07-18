-- CORREÇÃO DE SEGURANÇA: as policies públicas de 0003_vitrine_publica.sql
-- ("status = 'disponivel'" em veiculos, "tem veiculo disponivel" em empresas)
-- expunham TODOS os campos das duas tabelas — não só os do card da vitrine —
-- para qualquer usuário autenticado de QUALQUER empresa (inclusive placa,
-- descrição interna, CNPJ, telefone, endereço). Confirmado em teste: a conta
-- de uma empresa conseguia ler dados completos de veículo/empresa de outra
-- via REST direto e via /veiculos/:id/editar, porque RLS não distingue
-- "select da vitrine" de "select da tela interna" — é a mesma query.
--
-- Correção: revoga as policies públicas (veiculos e empresas voltam a ser
-- 100% restritas à própria empresa, sem exceção) e expõe a vitrine só através
-- de uma function SECURITY DEFINER que devolve apenas os campos do card
-- público. Funções SECURITY DEFINER rodam com o privilégio do dono da tabela
-- (que ignora RLS), então continuam funcionando para visitante anônimo.

drop policy "publico ve veiculos disponiveis" on veiculos;
drop policy "publico ve nome de empresas com veiculos disponiveis" on empresas;

create or replace function public.listar_vitrine_veiculos()
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
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select v.id, v.marca, v.modelo, v.versao, v.ano_fabricacao, v.ano_modelo,
         v.km, v.cor, v.combustivel, v.cambio, v.preco, v.status,
         e.nome as empresa_nome, v.created_at
  from veiculos v
  join empresas e on e.id = v.empresa_id
  where v.status = 'disponivel'
  order by v.created_at desc;
$$;

grant execute on function public.listar_vitrine_veiculos() to anon, authenticated;
