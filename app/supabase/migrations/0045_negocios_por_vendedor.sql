-- Decisão de 27/07: Painel do Vendedor. Vendedor convidado (papel =
-- 'vendedor') passa a ver/mexer só nos negócios em que ele é o
-- vendedor_id -- admin continua vendo/mexendo em todos os negócios da
-- empresa, como sempre. Mesmo padrão "admin-ou-dono" já usado em leads
-- (migração 0019, passagem de bastão).
--
-- Efeito colateral bom: Painel.jsx e Negocios.jsx não precisam de
-- nenhuma mudança de código pra isso -- a query já existente
-- ("select * from negocios") passa a devolver só o que a RLS libera,
-- automaticamente.

drop policy "usuarios veem negocios da propria empresa" on negocios;

create policy "usuarios veem negocios da propria empresa"
  on negocios for select
  using (
    empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid())
    and (
      vendedor_id = auth.uid()
      or exists (select 1 from usuarios u2 where u2.id = auth.uid() and u2.papel = 'admin')
    )
  );

drop policy "usuarios atualizam negocios da propria empresa" on negocios;

create policy "usuarios atualizam negocios da propria empresa"
  on negocios for update
  using (
    empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid())
    and (
      vendedor_id = auth.uid()
      or exists (select 1 from usuarios u2 where u2.id = auth.uid() and u2.papel = 'admin')
    )
  );
