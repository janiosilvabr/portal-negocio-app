-- Sessão E (SESSOES_ATUALIZADAS_25jul.md): Financeiro completo.
-- Adiciona forma de pagamento à transação, usada na tabela e no filtro.

alter table transacoes_financeiras
  add column forma_pagamento text
    check (forma_pagamento in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'outro'));
