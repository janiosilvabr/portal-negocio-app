-- Correção pontual (26/07): hoje não é possível excluir um vendedor que já
-- tem venda/lead/transação/atividade vinculada — o banco bloqueia por
-- integridade referencial (comportamento padrão sem "on delete" definido).
-- Isso "protegia" o histórico sem querer, mas também impedia excluir de
-- verdade. Troca para "on delete set null": a venda/lead/transação/
-- atividade continua intacta (valor, data, tudo), só perde o vínculo com
-- o vendedor removido (fica "sem vendedor", igual já acontece hoje quando
-- um cliente ou veículo é removido).
--
-- usuarios.id -> auth.users(id) passa a ser "on delete cascade": ao
-- remover o login do vendedor (via Admin API, na Edge Function
-- excluir-vendedor), o perfil em usuarios some junto automaticamente.
--
-- Nomes de constraint assumidos pelo padrão de nomenclatura automática do
-- Postgres (<tabela>_<coluna>_fkey), já que nenhuma delas foi criada com
-- nome explícito nas migrações originais.

alter table negocios drop constraint negocios_vendedor_id_fkey;
alter table negocios add constraint negocios_vendedor_id_fkey
  foreign key (vendedor_id) references usuarios(id) on delete set null;

alter table leads drop constraint leads_vendedor_id_fkey;
alter table leads add constraint leads_vendedor_id_fkey
  foreign key (vendedor_id) references usuarios(id) on delete set null;

alter table transacoes_financeiras drop constraint transacoes_financeiras_vendedor_id_fkey;
alter table transacoes_financeiras add constraint transacoes_financeiras_vendedor_id_fkey
  foreign key (vendedor_id) references usuarios(id) on delete set null;

alter table atividades drop constraint atividades_vendedor_id_fkey;
alter table atividades add constraint atividades_vendedor_id_fkey
  foreign key (vendedor_id) references usuarios(id) on delete set null;

alter table usuarios drop constraint usuarios_id_fkey;
alter table usuarios add constraint usuarios_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;
