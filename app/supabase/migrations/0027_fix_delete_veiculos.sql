-- BUG: veiculos nunca teve policy de RLS para DELETE (só select/insert/
-- update — ver 0002/0006). Um delete sem policy correspondente não dá
-- erro, só afeta 0 linhas silenciosamente — foi assim que um veículo de
-- teste ("Teste SemPreco") sobreviveu a uma tentativa de exclusão e
-- acabou indo parar em produção (ocarroideal.com) sem que o erro
-- aparecesse em lugar nenhum. Mesma classe de bug de 0007/0022/0018.

create policy "usuarios excluem veiculos da propria empresa"
  on veiculos for delete
  using (empresa_id in (select empresa_id from usuarios where usuarios.id = auth.uid()));
