-- fotos_veiculos (CONTEXTO.md seção 3) + bucket de Storage público
-- "fotos-veiculos" (a vitrine pública precisa exibir as fotos sem sessão).
-- Sem marca d'água/selo automático ainda — isso é fase 2, registrado em
-- CLAUDE.md "Roadmap futuro".

create table fotos_veiculos (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references veiculos(id) not null,
  url text not null,
  ordem int default 0,
  created_at timestamptz default now()
);

alter table fotos_veiculos enable row level security;

create policy "usuarios veem fotos da propria empresa"
  on fotos_veiculos for select
  using (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

create policy "usuarios cadastram fotos na propria empresa"
  on fotos_veiculos for insert
  with check (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

create policy "usuarios excluem fotos da propria empresa"
  on fotos_veiculos for delete
  using (veiculo_id in (
    select id from veiculos where empresa_id in (
      select empresa_id from usuarios where usuarios.id = auth.uid()
    )
  ));

-- "publico ve fotos de veiculos disponiveis" cobre a vitrine (mesmo padrão
-- de segurança de 0007_fix_vazamento_vitrine.sql: só a foto em si, nunca a
-- tabela veiculos/empresas direto).
create policy "publico ve fotos de veiculos disponiveis"
  on fotos_veiculos for select
  using (veiculo_id in (select id from veiculos where status = 'disponivel'));

-- Bucket de Storage público (URL direta funciona sem autenticação).
insert into storage.buckets (id, name, public)
values ('fotos-veiculos', 'fotos-veiculos', true)
on conflict (id) do nothing;

-- Caminho de upload esperado: {empresa_id}/{veiculo_id}/{arquivo}. A policy
-- confere que o primeiro segmento do caminho é a empresa do usuário logado.
create policy "usuarios sobem fotos na pasta da propria empresa"
  on storage.objects for insert
  with check (
    bucket_id = 'fotos-veiculos'
    and (storage.foldername(name))[1] in (
      select empresa_id::text from usuarios where usuarios.id = auth.uid()
    )
  );

create policy "usuarios excluem fotos da propria empresa"
  on storage.objects for delete
  using (
    bucket_id = 'fotos-veiculos'
    and (storage.foldername(name))[1] in (
      select empresa_id::text from usuarios where usuarios.id = auth.uid()
    )
  );

create policy "qualquer um le fotos do bucket publico"
  on storage.objects for select
  using (bucket_id = 'fotos-veiculos');
