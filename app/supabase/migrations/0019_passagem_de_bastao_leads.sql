-- Regra de "Passagem de Bastão" (CONTEXTO.md, seção leads, decisão de 19/07):
-- 1) sempre que vendedor_id de um lead mudar, anexa automaticamente em
--    observacoes "Lead assumido por [vendedor] em [data]" (nunca sobrescreve
--    o histórico anterior).
-- 2) enquanto status = 'negociando', só o vendedor_id atual do lead ou um
--    admin pode alterá-lo — via RLS de UPDATE (não dá pra burlar mudando só
--    a tela), substituindo a policy de update de 0014_leads.sql.

create function public.leads_passagem_bastao()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  nome_novo_vendedor text;
begin
  if new.vendedor_id is distinct from old.vendedor_id and new.vendedor_id is not null then
    select nome into nome_novo_vendedor from usuarios where id = new.vendedor_id;

    new.observacoes := trim(both E'\n' from
      coalesce(old.observacoes || E'\n', '') ||
      'Lead assumido por ' || coalesce(nome_novo_vendedor, 'usuário') ||
      ' em ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || '.'
    );
  end if;

  return new;
end;
$$;

create trigger trg_leads_passagem_bastao
  before update on leads
  for each row execute function public.leads_passagem_bastao();

drop policy if exists "usuarios atualizam leads da propria empresa" on leads;

create policy "usuarios atualizam leads da propria empresa"
  on leads for update
  using (
    empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid())
    and (
      status is distinct from 'negociando'
      or vendedor_id = auth.uid()
      or exists (select 1 from usuarios u2 where u2.id = auth.uid() and u2.papel = 'admin')
    )
  );

-- A tela de Leads precisa listar os colegas pra reatribuir vendedor_id, mas
-- a policy de SELECT em usuarios é restrita (só admin vê a equipe toda,
-- de propósito, por causa de comissao_percentual). Function pública restrita
-- à própria empresa, com só os campos necessários — mesmo padrão de
-- listar_vitrine_veiculos.
create function public.listar_equipe_empresa()
returns table (id uuid, nome text, papel text, ativo boolean)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.nome, u.papel, u.ativo
  from usuarios u
  where u.empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid())
  order by u.nome;
$$;

grant execute on function public.listar_equipe_empresa() to authenticated;
