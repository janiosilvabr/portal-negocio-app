-- Correção pontual (27/07): a trava anti-autopromoção (migração 0015) só
-- impedia um NÃO-admin de mudar papel/ativo/comissão/empresa_id — não
-- impedia um admin de se rebaixar ou desativar A SI MESMO por engano
-- (foi exatamente o que aconteceu num teste real da tela de Vendedores
-- hoje). Fecha esse buraco: ninguém, nem admin, altera o próprio
-- papel/ativo por uma UPDATE comum — precisa ser outro admin, ou uma
-- correção manual via SQL Editor (com o trigger desativado
-- temporariamente, como foi feito pra corrigir o caso de hoje).

create or replace function public.impedir_autopromocao_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ator_papel text;
begin
  if new.id = auth.uid() and (new.papel is distinct from old.papel or new.ativo is distinct from old.ativo) then
    raise exception 'Você não pode alterar seu próprio papel ou status ativo. Peça para outro admin.';
  end if;

  select papel into ator_papel from usuarios where id = auth.uid();

  if ator_papel is distinct from 'admin' then
    if new.papel is distinct from old.papel
       or new.comissao_percentual is distinct from old.comissao_percentual
       or new.empresa_id is distinct from old.empresa_id
       or new.ativo is distinct from old.ativo then
      raise exception 'Apenas administradores podem alterar papel, comissão, empresa ou status ativo.';
    end if;
  end if;

  return new;
end;
$$;
