-- Bug real encontrado em teste funcional completo (23/07): abrir ou fechar
-- um negócio nunca atualizava o status do veículo vinculado. Um Honda Civic
-- com negócio "fechado" (vendido) continuava aparecendo como "Disponível"
-- na Vitrine pública — um comprador podia demonstrar interesse num carro
-- já vendido. Mesmo problema, menos grave, com veículos em negociação
-- (em_andamento): também seguiam "Disponível" em vez de "Reservado".
--
-- Mesmo padrão de 0018_automacao_financeiro.sql: trigger de banco (não no
-- front), security definer, roda não importa qual tela mude o status.

create function public.negocio_sincroniza_status_veiculo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'em_andamento' then
      update veiculos set status = 'reservado' where id = new.veiculo_id and status = 'disponivel';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'fechado' then
      update veiculos
        set status = case when new.tipo = 'consignacao' then 'consignado' else 'vendido' end
        where id = new.veiculo_id;
    elsif new.status = 'cancelado' then
      -- só devolve pra "disponível" se ainda estava reservado por causa
      -- deste negócio — nunca sobrescreve um vendido/consignado por engano.
      update veiculos set status = 'disponivel' where id = new.veiculo_id and status = 'reservado';
    elsif new.status = 'em_andamento' then
      update veiculos set status = 'reservado' where id = new.veiculo_id and status = 'disponivel';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_negocio_sincroniza_status_veiculo
  after insert or update on negocios
  for each row execute function public.negocio_sincroniza_status_veiculo();

-- Corrige os dados já existentes (negócios criados antes deste trigger existir).
update veiculos v
set status = case when n.tipo = 'consignacao' then 'consignado' else 'vendido' end
from negocios n
where n.veiculo_id = v.id and n.status = 'fechado' and v.status = 'disponivel';

update veiculos v
set status = 'reservado'
from negocios n
where n.veiculo_id = v.id and n.status = 'em_andamento' and v.status = 'disponivel';
