-- CORREÇÃO: a policy "publico ve fotos de veiculos disponiveis" (0011)
-- faz "select id from veiculos where status = 'disponivel'" dentro da
-- própria policy — essa subconsulta roda com o RLS de veiculos também
-- aplicado (veiculos não tem policy pública de select, só as funções
-- SECURITY DEFINER da vitrine), então pra um visitante anônimo a
-- subconsulta sempre voltava vazia e NENHUMA foto era visível via select
-- direto em fotos_veiculos. Passou despercebido até agora porque a grade
-- da vitrine usa listar_vitrine_veiculos() (SECURITY DEFINER, contorna
-- RLS), que só precisa da 1ª foto — a tela de Detalhe do Veículo, que
-- precisa de TODAS as fotos via select direto, expôs o problema.
--
-- Mesmo padrão de correção de 0020_fix_recursao_rls_usuarios.sql: mover o
-- lookup para uma function SECURITY DEFINER, que ignora RLS internamente.

create function public.veiculo_esta_disponivel(p_veiculo_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from veiculos where id = p_veiculo_id and status = 'disponivel'
  );
$$;

drop policy if exists "publico ve fotos de veiculos disponiveis" on fotos_veiculos;

create policy "publico ve fotos de veiculos disponiveis"
  on fotos_veiculos for select
  using (public.veiculo_esta_disponivel(veiculo_id));
