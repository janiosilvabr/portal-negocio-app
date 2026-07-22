-- Qualificação da VENDEDORA em vendas diretas (sem consignação) no
-- TEMPLATE_CONTRATO_COMPRA_VENDA.md: quando quem vende é a própria garagem
-- (pessoa jurídica), o contrato precisa de uma pessoa física assinando por
-- ela — nome, cargo e CPF do responsável legal. CNPJ e endereço já existiam
-- (ver EditarEmpresa.jsx); estes três completam a qualificação.

alter table empresas add column responsavel_legal_nome text;
alter table empresas add column responsavel_legal_cargo text;
alter table empresas add column responsavel_legal_cpf text;
