-- Blog dinâmico do Portal Negócio (decisão de 03/08, item 4 da sequência
-- pós-limites/perfis/captação): conteúdo institucional, gerenciado pelo
-- superadmin em /admin/blog, sem depender de deploy a cada post novo —
-- alimenta a estratégia GEO que precisa de conteúdo novo com frequência.

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  slug text not null unique,
  resumo text,
  conteudo text not null,
  imagem_capa_url text,
  status text check (status in ('rascunho', 'publicado')) default 'rascunho',
  publicado_em timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table blog_posts enable row level security;

-- blog_posts não tem empresa_id (é conteúdo institucional do Portal, não
-- por garagem) — diferente das functions admin_* de 0041 (que precisam de
-- security definer pra cruzar RLS por tenant), aqui basta RLS direto
-- checando eh_superadmin() (0041) pra cobrir todo o CRUD do admin.
create policy "publico ve posts publicados"
  on blog_posts for select
  using (status = 'publicado');

create policy "superadmin gerencia posts"
  on blog_posts for all
  using (eh_superadmin())
  with check (eh_superadmin());

-- Leitura pública via function, mesmo padrão de listar_garagens_publicas
-- (0026): nunca expor a tabela direto pra anon. A listagem não devolve
-- conteudo (só usado na página do post), deixando o payload mais leve.
create function public.listar_blog_posts_publicos()
returns table (
  id uuid,
  titulo text,
  slug text,
  resumo text,
  imagem_capa_url text,
  publicado_em timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select id, titulo, slug, resumo, imagem_capa_url, publicado_em
  from blog_posts
  where status = 'publicado'
  order by publicado_em desc;
$$;

grant execute on function public.listar_blog_posts_publicos() to anon, authenticated;

create function public.obter_blog_post_publico(p_slug text)
returns table (
  id uuid,
  titulo text,
  slug text,
  resumo text,
  conteudo text,
  imagem_capa_url text,
  publicado_em timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select id, titulo, slug, resumo, conteudo, imagem_capa_url, publicado_em
  from blog_posts
  where slug = p_slug and status = 'publicado';
$$;

grant execute on function public.obter_blog_post_publico(text) to anon, authenticated;
