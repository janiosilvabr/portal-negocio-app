-- Automação: negócio fechado → receita + comissão automáticas
-- (CONTEXTO.md, transacoes_financeiras). Roda como trigger de banco (não
-- no front) pra funcionar não importa qual tela mude o status pra
-- 'fechado'. Proteção simples contra duplicidade se o negócio for reaberto
-- e fechado de novo por engano: só insere se ainda não existir uma
-- transação daquele tipo pra esse negocio_id.

create function public.negocio_fechado_gerar_financeiro()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_comissao_percentual numeric(5,2);
  v_comissao numeric(12,2);
begin
  if new.status = 'fechado' and old.status is distinct from 'fechado' then

    if not exists (
      select 1 from transacoes_financeiras where negocio_id = new.id and categoria = 'venda'
    ) then
      insert into transacoes_financeiras (empresa_id, tipo, categoria, descricao, valor, negocio_id, data, status)
      values (
        new.empresa_id, 'receita', 'venda', 'Venda do negócio', new.valor, new.id,
        coalesce(new.data_fechamento, current_date), 'pago'
      );
    end if;

    if new.vendedor_id is not null and new.valor is not null then
      select comissao_percentual into v_comissao_percentual from usuarios where id = new.vendedor_id;

      if v_comissao_percentual is not null and not exists (
        select 1 from transacoes_financeiras where negocio_id = new.id and categoria = 'comissao'
      ) then
        v_comissao := round(new.valor * v_comissao_percentual / 100, 2);

        insert into transacoes_financeiras
          (empresa_id, tipo, categoria, descricao, valor, negocio_id, vendedor_id, data, status)
        values (
          new.empresa_id, 'despesa', 'comissao', 'Comissão de venda', v_comissao, new.id,
          new.vendedor_id, coalesce(new.data_fechamento, current_date), 'pendente'
        );
      end if;
    end if;

  end if;

  return new;
end;
$$;

create trigger trg_negocio_fechado_financeiro
  after update on negocios
  for each row execute function public.negocio_fechado_gerar_financeiro();
