-- Tela pública de Detalhe do Veículo (CLAUDE.md/FEATURES.md: botão "Ver
-- Detalhes" da vitrine). Segue o mesmo padrão de segurança de
-- 0007_fix_vazamento_vitrine.sql: nunca expor veiculos/empresas/clientes
-- direto para anon — só funções SECURITY DEFINER com os campos certos.

-- Detalhe de 1 veículo disponível (mesmos campos "seguros" de
-- listar_vitrine_veiculos, sem descricao interna nem dados de contato da
-- empresa — o contato acontece via lead, não expondo telefone/endereco).
create function public.obter_veiculo_publico(p_veiculo_id uuid)
returns table (
  id uuid,
  marca text,
  modelo text,
  versao text,
  ano_fabricacao int,
  ano_modelo int,
  km int,
  cor text,
  combustivel text,
  cambio text,
  preco numeric,
  status text,
  empresa_nome text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select v.id, v.marca, v.modelo, v.versao, v.ano_fabricacao, v.ano_modelo,
         v.km, v.cor, v.combustivel, v.cambio, v.preco, v.status,
         e.nome as empresa_nome, v.created_at
  from veiculos v
  join empresas e on e.id = v.empresa_id
  where v.id = p_veiculo_id and v.status = 'disponivel';
$$;

grant execute on function public.obter_veiculo_publico(uuid) to anon, authenticated;

-- Botão "Tenho interesse" da tela de detalhe: cria (ou reaproveita, por
-- telefone) um cliente mínimo + um lead com origem 'site', sem exigir login
-- nem os dados completos (CPF, endereço etc.) do visitante anônimo. Rodar
-- como SECURITY DEFINER é o que permite isso com segurança: a policy de
-- INSERT normal de leads/clientes exige usuário autenticado da própria
-- empresa, então um visitante anônimo não pode inserir direto — mas a
-- function valida que o veiculo_id é de um veículo realmente disponível e
-- deriva o empresa_id a partir dele, então não há como o visitante forjar
-- lead para uma empresa arbitrária.
create function public.criar_lead_publico(
  p_veiculo_id uuid,
  p_nome text,
  p_telefone text,
  p_email text,
  p_mensagem text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_cliente_id uuid;
  v_lead_id uuid;
begin
  select empresa_id into v_empresa_id
  from veiculos
  where id = p_veiculo_id and status = 'disponivel';

  if v_empresa_id is null then
    raise exception 'Veículo não encontrado ou indisponível.';
  end if;

  if p_nome is null or trim(p_nome) = '' then
    raise exception 'Nome é obrigatório.';
  end if;

  if (p_telefone is null or trim(p_telefone) = '') and (p_email is null or trim(p_email) = '') then
    raise exception 'Informe telefone ou e-mail.';
  end if;

  if p_telefone is not null and trim(p_telefone) <> '' then
    select id into v_cliente_id
    from clientes
    where empresa_id = v_empresa_id and telefone = trim(p_telefone)
    limit 1;
  end if;

  if v_cliente_id is null then
    insert into clientes (empresa_id, nome, telefone, email)
    values (v_empresa_id, trim(p_nome), nullif(trim(p_telefone), ''), nullif(trim(p_email), ''))
    returning id into v_cliente_id;
  end if;

  insert into leads (empresa_id, cliente_id, veiculo_id, origem, status, observacoes)
  values (v_empresa_id, v_cliente_id, p_veiculo_id, 'site', 'novo', nullif(trim(p_mensagem), ''))
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

grant execute on function public.criar_lead_publico(uuid, text, text, text, text) to anon, authenticated;
