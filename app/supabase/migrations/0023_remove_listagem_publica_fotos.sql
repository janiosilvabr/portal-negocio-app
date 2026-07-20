-- Remove a policy "qualquer um le fotos do bucket publico" (0011), que
-- permitia a QUALQUER cliente (anon incluso) listar todos os arquivos do
-- bucket "fotos-veiculos" via storage.objects (o método .list() da API de
-- Storage) — não confundir com abrir uma foto por link direto, que não
-- depende de RLS em bucket público e continua funcionando normalmente
-- sem essa policy.
--
-- Sinalizado pelo próprio linter do Supabase Dashboard ("Clients can
-- list all files in this bucket") e removido por lá em 20/07. Essa
-- migração só registra a mudança no histórico do schema — não expunha
-- dados sensíveis por si só (os nomes de pasta são UUIDs de empresa,
-- não dados pessoais), mas deixava enumerável a estrutura de pastas/
-- arquivos de outras garagens, o que não é necessário: o app sempre
-- busca fotos pela tabela fotos_veiculos (que já tem seu próprio RLS,
-- ver 0011 e 0022), nunca listando o bucket diretamente.

drop policy if exists "qualquer um le fotos do bucket publico" on storage.objects;
