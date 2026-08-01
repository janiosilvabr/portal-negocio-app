-- Reposicionamento jurídico (decisão de 02/08): documento gerado deixa de ser
-- "validado por advogado" e passa a exigir aceite explícito do usuário antes
-- de poder ser copiado, baixado ou enviado. Este aceite precisa ficar
-- registrado (data/hora + IP) como prova técnica, conforme estratégia do
-- advogado responsável pelo produto.
--
-- Segue o mesmo padrão já usado em tentativas_login (migration 0032): uma
-- function security definer chamada via RPC pelo frontend, em vez de
-- depender de policy de UPDATE direta na tabela — evita a classe de bug de
-- "RLS sem policy = 0 rows afetadas" que já mordeu esta mesma tabela
-- (migrations 0034/0035).
--
-- Captura de IP via current_setting('request.headers', true): mecanismo
-- padrão do PostgREST/Supabase para expor os headers da requisição dentro de
-- uma function Postgres. Se o header não vier por algum motivo, grava NULL
-- em vez de quebrar a confirmação.

alter table documentos_gerados add column revisao_confirmada_em timestamptz;
alter table documentos_gerados add column revisao_confirmada_ip text;

create function public.confirmar_revisao_documento(p_documento_id uuid)
returns documentos_gerados
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc documentos_gerados%rowtype;
  v_ip text;
begin
  if not exists (
    select 1 from documentos_gerados d
    where d.id = p_documento_id
      and (
        (d.negocio_id is not null and d.negocio_id in (
          select id from negocios where empresa_id in (
            select empresa_id from usuarios where usuarios.id = auth.uid()
          )
        ))
        or
        (d.consignacao_id is not null and d.consignacao_id in (
          select id from consignacoes where veiculo_id in (
            select id from veiculos where empresa_id in (
              select empresa_id from usuarios where usuarios.id = auth.uid()
            )
          )
        ))
      )
  ) then
    raise exception 'Documento não encontrado ou sem permissão.';
  end if;

  v_ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);

  update documentos_gerados
    set status = 'finalizado',
        revisao_confirmada_em = now(),
        revisao_confirmada_ip = nullif(trim(v_ip), '')
    where id = p_documento_id
    returning * into v_doc;

  return v_doc;
end;
$$;

grant execute on function public.confirmar_revisao_documento(uuid) to authenticated;
