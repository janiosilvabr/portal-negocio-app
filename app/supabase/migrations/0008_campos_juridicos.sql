-- Alinha veiculos/clientes com os campos jurídicos exigidos pelo módulo de
-- Documentos (CONTEXTO.md seção 3) — só os campos aqui, sem nenhuma
-- validação de bloqueio ainda (isso é responsabilidade do próprio módulo de
-- Documentos, quando existir: "bloquear a geração do contrato se esses
-- campos estiverem vazios"). Cadastro/edição continuam aceitando esses
-- campos em branco.

alter table veiculos add column renavam text;
alter table veiculos add column chassi text;

alter table clientes add column rg text;
alter table clientes add column estado_civil text
  check (estado_civil in ('solteiro','casado','uniao_estavel','separado','divorciado','viuvo'));
alter table clientes add column regime_bens text
  check (regime_bens in ('comunhao_universal','comunhao_parcial','separacao_total'));
alter table clientes add column uniao_estavel_comprovada boolean default false;
alter table clientes add column conjuge_nome text;
alter table clientes add column conjuge_cpf text;
