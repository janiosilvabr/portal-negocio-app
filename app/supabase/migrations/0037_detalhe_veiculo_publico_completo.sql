-- Sessão G (SESSOES_ATUALIZADAS_25jul.md): completa a página pública de
-- detalhe do veículo (/vitrine/:id) com descrição, checklist de vistoria e
-- card da garagem com telefone/cidade para o botão "Falar com a garagem".
--
-- Decisão do usuário (25/07): reverter parcialmente a decisão de privacidade
-- da migração 0021 — descrição, cidade e telefone da empresa passam a ser
-- públicos (telefone comercial já costuma ser público em site/fachada/
-- anúncios; descrição é texto livre do garagista, não é dado sensível).
-- CPF, endereço completo, RENAVAM e chassi continuam fora, sem mudança.

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
         e.nome as empresa_nome, e.cidade as empresa_cidade, e.telefone as empresa_telefone,
         v.created_at
  from veiculos v
  join empresas e on e.id = v.empresa_id
  where v.id = p_veiculo_id and v.status = 'disponivel';
$$;

grant execute on function public.obter_veiculo_publico(uuid) to anon, authenticated;

-- checklist_vistoria tem RLS restrito à própria empresa (migração 0006) —
-- esta function expõe só item/observacao, só para veículos disponíveis.
create function public.obter_checklist_veiculo_publico(p_veiculo_id uuid)
returns table (
  item text,
  observacao text
)
language sql
security definer
set search_path = public
stable
as $$
  select c.item, c.observacao
  from checklist_vistoria c
  join veiculos v on v.id = c.veiculo_id
  where c.veiculo_id = p_veiculo_id and v.status = 'disponivel'
  order by c.created_at asc;
$$;

grant execute on function public.obter_checklist_veiculo_publico(uuid) to anon, authenticated;
