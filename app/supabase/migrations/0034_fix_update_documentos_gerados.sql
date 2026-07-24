-- Bug real encontrado testando o envio por e-mail (24/07): documentos_gerados
-- nunca teve policy de RLS para UPDATE (só select/insert, ver
-- 0010_documentos_gerados.sql) — mesma classe de bug de 0007/0018/0022/0027/
-- 0030. A Edge Function enviar-documento-email envia o e-mail com sucesso
-- pela Brevo, mas falha ao gravar enviado_email_em/enviado_email_para
-- porque o UPDATE não afeta nenhuma linha sob RLS, e ".single()" no
-- supabase-js explode com "Cannot coerce the result to a single JSON
-- object" quando 0 linhas voltam.

create policy "usuarios atualizam documentos da propria empresa"
  on documentos_gerados for update
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
