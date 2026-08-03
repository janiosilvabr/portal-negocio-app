-- Troca o campo "URL da imagem de capa" do Blog por upload de arquivo de
-- verdade (pedido do usuário, 03/08). Mesmo padrão de bucket usado em
-- logos-empresas (0042), mas sem pasta por empresa — blog_posts é
-- conteúdo institucional do Portal, só o superadmin escreve nele (mesma
-- trava eh_superadmin() já usada na RLS de blog_posts, migration 0051).

insert into storage.buckets (id, name, public)
values ('blog-imagens', 'blog-imagens', true)
on conflict (id) do nothing;

create policy "superadmin sobe imagem de capa do blog"
  on storage.objects for insert
  with check (bucket_id = 'blog-imagens' and eh_superadmin());

create policy "superadmin substitui imagem de capa do blog"
  on storage.objects for update
  using (bucket_id = 'blog-imagens' and eh_superadmin());

create policy "superadmin exclui imagem de capa do blog"
  on storage.objects for delete
  using (bucket_id = 'blog-imagens' and eh_superadmin());
