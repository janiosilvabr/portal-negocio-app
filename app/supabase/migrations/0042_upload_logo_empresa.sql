-- Correção pontual (26/07): tela Empresa exigia colar uma URL de logo —
-- troca por upload de arquivo de verdade. Mesmo padrão de bucket usado em
-- fotos-veiculos (0011), mas aqui é 1 logo por empresa (sem tabela própria,
-- só grava a URL pública direto em empresas.logo_url).

insert into storage.buckets (id, name, public)
values ('logos-empresas', 'logos-empresas', true)
on conflict (id) do nothing;

-- Caminho de upload esperado: {empresa_id}/{arquivo}. A policy confere que
-- o primeiro segmento do caminho é a empresa do usuário logado.
create policy "usuarios sobem logo na pasta da propria empresa"
  on storage.objects for insert
  with check (
    bucket_id = 'logos-empresas'
    and (storage.foldername(name))[1] in (
      select empresa_id::text from usuarios where usuarios.id = auth.uid()
    )
  );

create policy "usuarios substituem logo da propria empresa"
  on storage.objects for update
  using (
    bucket_id = 'logos-empresas'
    and (storage.foldername(name))[1] in (
      select empresa_id::text from usuarios where usuarios.id = auth.uid()
    )
  );

create policy "usuarios excluem logo da propria empresa"
  on storage.objects for delete
  using (
    bucket_id = 'logos-empresas'
    and (storage.foldername(name))[1] in (
      select empresa_id::text from usuarios where usuarios.id = auth.uid()
    )
  );
