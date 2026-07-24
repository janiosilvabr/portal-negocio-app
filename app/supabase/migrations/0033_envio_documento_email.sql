-- Envio de documento por e-mail via Brevo (decisão de 24/07, item já
-- previsto no roadmap do CLAUDE.md). O plano original era gatear por
-- planos.recursos, mas essa tabela nunca foi criada de verdade no banco —
-- só existe como rascunho no CONTEXTO.md. Fica sem gate de plano por
-- enquanto; o gate de "Premium" de verdade nasce junto com a sessão de
-- Mercado Pago, quando planos/assinaturas forem criadas de fato.
--
-- Só colunas novas em documentos_gerados (sem tabela nova, como o roadmap
-- já previa) — guardam quando e pra quem o documento foi enviado, pra tela
-- poder mostrar "Enviado em X" e evitar reenvio confuso.

alter table documentos_gerados add column enviado_email_em timestamptz;
alter table documentos_gerados add column enviado_email_para text;
