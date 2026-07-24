-- Cria de fato a tabela planos (decisão de 24/07) — até aqui ela só existia
-- como rascunho no CONTEXTO.md, nunca tinha sido migrada (fazia parte da
-- "lacuna crítica" já registrada no CLAUDE.md sobre a cobrança da própria
-- assinatura não estar implementada). Semeada com os 3 planos recorrentes
-- definidos nesta sessão pra alimentar a página pública /como-funciona.
--
-- "Documento Avulso" (R$ 9,90) não entra aqui: não é assinatura, é
-- cobrança por uso — fica como preço fixo na própria página por enquanto,
-- mesmo padrão do avulso de R$ 4,99 da Calc. PMC já anotado nas pendências
-- técnicas do CLAUDE.md.
--
-- limite_documentos (quantas gerações de contrato o plano inclui por mês)
-- fica dentro de recursos (jsonb), já que a coluna limite_veiculos é a
-- única dedicada no schema original — sem criar coluna nova pra isso.
--
-- RLS: leitura pública (a página de vendas roda sem login), sem policy de
-- escrita — só se edita via SQL Editor por enquanto, não existe tela de
-- admin de planos ainda.

create table planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco_mensal numeric(10,2),
  limite_veiculos int,
  recursos jsonb
);

alter table planos enable row level security;

create policy "qualquer um le os planos"
  on planos for select
  using (true);

insert into planos (nome, preco_mensal, limite_veiculos, recursos) values
  ('Grátis', 0, 4, '{"limite_documentos": 0}'),
  ('Básico', 47.00, 10, '{"limite_documentos": 10}'),
  ('Pro', 147.00, 30, '{"limite_documentos": 30}');
