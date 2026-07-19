-- CORREÇÃO CRÍTICA: as policies "admin ve/atualiza usuarios da propria
-- empresa" (0015) fazem "select ... from usuarios" DENTRO de uma policy da
-- própria tabela usuarios — isso é recursão direta, e o Postgres recusa
-- com "infinite recursion detected in policy for relation usuarios"
-- (42P17). Como praticamente toda outra tabela do sistema também
-- subconsulta usuarios (pra achar empresa_id), esse erro se propaga pra
-- quase todo o app, não só pra tela de Vendedores.
--
-- Correção padrão: mover o lookup para dentro de uma function
-- SECURITY DEFINER. Funções security definer rodam com o privilégio do
-- dono (que ignora RLS), então a consulta interna não reaciona a policy —
-- quebra o ciclo.

create function public.usuario_e_admin(p_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios where id = p_usuario_id and papel = 'admin'
  );
$$;

create function public.usuario_empresa_id(p_usuario_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select empresa_id from usuarios where id = p_usuario_id;
$$;

drop policy if exists "admin ve usuarios da propria empresa" on usuarios;

create policy "admin ve usuarios da propria empresa"
  on usuarios for select
  using (
    public.usuario_e_admin(auth.uid())
    and empresa_id = public.usuario_empresa_id(auth.uid())
  );

drop policy if exists "admin atualiza usuarios da propria empresa" on usuarios;

create policy "admin atualiza usuarios da propria empresa"
  on usuarios for update
  using (
    public.usuario_e_admin(auth.uid())
    and empresa_id = public.usuario_empresa_id(auth.uid())
  );
