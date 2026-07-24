-- Mesmo bug de 0034, agora pra DELETE: documentos_gerados também não tinha
-- policy de RLS para exclusão. Encontrado ao tentar limpar um documento de
-- teste usado pra validar o envio por e-mail — o delete não retornou erro,
-- mas também não afetou nenhuma linha (mesma classe de 0007/0018/0022/0027/
-- 0030/0034).

create policy "usuarios excluem documentos da propria empresa"
  on documentos_gerados for delete
  using (
    (negocio_id is not null and negocio_id in (
      select id from negocios where empresa_id in (
        select empresa_id from usuarios where usuarios.id = auth.uid()
      )
    ))
    or
    (consignacao_id is not null and consignacao_id in (
      select id from consignacoes where veiculo_id in (
        select id from veiculos where empresa_id in (
          select empresa_id from usuarios where usuarios.id = auth.uid()
        )
      )
    ))
  );
