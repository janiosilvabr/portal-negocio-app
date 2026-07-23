-- Bug real encontrado em teste funcional completo (23/07): clientes nunca
-- teve policy de RLS para UPDATE nem DELETE (só select/insert, ver
-- 0004_clientes_schema.sql) — não existia forma de corrigir um CPF/telefone
-- errado, e mesmo construindo a tela de edição, o update falharia
-- silenciosamente (0 linhas afetadas, sem erro). Mesma classe de bug de
-- 0007/0018/0022/0027.

create policy "usuarios atualizam clientes da propria empresa"
  on clientes for update
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios excluem clientes da propria empresa"
  on clientes for delete
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
