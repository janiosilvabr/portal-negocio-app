# TEMPLATE_POLITICA_PRIVACIDADE.md

> **Rascunho para sua análise e adequação — não é um documento pronto para uso.**
> Estruturado com base na Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD) e no
> padrão de 9 seções já usado na versão anterior (Base44). Como advogado responsável pelo
> produto, você decide a redação final, os prazos exatos de retenção e os dados de contato do
> Encarregado; isto é insumo, não conclusão jurídica.

---

## POLÍTICA DE PRIVACIDADE — PORTAL NEGÓCIO

**Última atualização:** `20/07/2026`

### 1. Introdução e Abrangência

Esta Política de Privacidade descreve como o **Portal Negócio** ("Plataforma", "nós") coleta,
usa, armazena e protege os dados pessoais de garagistas, concessionárias, vendedores,
clientes cadastrados e visitantes que utilizam nossos serviços, em conformidade com a Lei
Geral de Proteção de Dados (Lei nº 13.709/2018). Ao utilizar a Plataforma, o titular declara
ciência dos termos aqui descritos.

### 2. Quem Somos (Controlador de Dados)

`K Motors Tecnologia` (CNPJ em fase de formalização — contato: contato@portalnegocio.com.br)
é a controladora dos
dados pessoais tratados através da Plataforma, ressalvado que **cada garagem/concessionária
cadastrada atua como controladora dos dados de seus próprios clientes**, inseridos por ela no
sistema — o Portal Negócio atua, nesse caso, como operador desses dados.

### 3. Dados Coletados

**Dados de garagistas e vendedores (usuários da Plataforma):** nome, CPF ou CNPJ, e-mail,
telefone, endereço, dados de acesso (login e senha criptografada).

**Dados de clientes cadastrados pelas garagens (compradores e consignantes):** nome, CPF, RG,
estado civil, regime de bens, dados de cônjuge/companheiro(a) quando aplicável, endereço,
telefone, e-mail. Estes dados são coletados **pela garagem**, não diretamente pelo Portal
Negócio, e existem para viabilizar o CRM e a geração de documentos contratuais.

**Dados de veículos:** marca, modelo, placa, RENAVAM, chassi, quilometragem e demais
especificações — não são dados pessoais, mas podem se tornar identificáveis quando associados
a um proprietário.

**Dados de navegação:** endereço IP, tipo de dispositivo, páginas visitadas, cookies (ver
Seção 9).

### 4. Finalidade do Tratamento

Os dados são tratados para: (a) viabilizar o cadastro e a operação do CRM; (b) gerar
documentos contratuais automatizados (contratos de compra e venda e de consignação); (c)
processar pagamentos de assinatura da Plataforma; (d) enviar comunicações operacionais e,
mediante consentimento, comunicações de marketing; (e) cumprir obrigações legais e
regulatórias; (f) prevenir fraudes e garantir a segurança da Plataforma.

### 5. Base Legal (art. 7º da LGPD)

O tratamento de dados pelo Portal Negócio se fundamenta, conforme o caso, em: **execução de
contrato** (prestação do serviço de SaaS à garagem), **cumprimento de obrigação legal ou
regulatória**, **legítimo interesse** (segurança, prevenção a fraudes, melhoria do serviço), e
**consentimento do titular**, quando exigido (ex.: comunicações de marketing, ou dados
sensíveis específicos como estado civil/regime de bens, coletados para viabilizar a proteção
jurídica da própria garagem nos contratos de consignação).

### 6. Compartilhamento de Dados com Terceiros

Os dados podem ser compartilhados com prestadores de serviço estritamente necessários à
operação da Plataforma, sob obrigações contratuais de confidencialidade e segurança:

- **Supabase** (hospedagem de banco de dados e autenticação)
- **Brevo** (envio de e-mails transacionais e, quando aplicável, marketing)
- **Mercado Pago** (processamento de pagamentos de assinatura)
- **Anthropic (Claude API)** (geração assistida de texto de documentos contratuais, a partir
  de dados fornecidos pelo usuário — os dados enviados para geração de documento não são
  utilizados para treinar modelos de IA de terceiros)

O Portal Negócio **não vende dados pessoais a terceiros** em nenhuma hipótese.

### 7. Direitos do Titular (art. 18 da LGPD)

O titular dos dados pode, mediante solicitação: confirmar a existência de tratamento; acessar
seus dados; corrigir dados incompletos, inexatos ou desatualizados; solicitar anonimização,
bloqueio ou eliminação de dados desnecessários; solicitar portabilidade; obter informação
sobre entidades com as quais os dados foram compartilhados; revogar o consentimento; e
solicitar eliminação dos dados tratados com base no consentimento. Solicitações podem ser
feitas através de `contato@portalnegocio.com.br`.

### 8. Retenção e Eliminação de Dados

Os dados são mantidos pelo período de vigência da relação contratual entre o titular e a
garagem/Portal Negócio, acrescido de **5 (cinco) anos** após seu término — prazo geral de
prescrição de pretensões cíveis previsto no art. 205 do Código Civil, usado aqui como
parâmetro médio provisório. *(Prazo a refinar por você conforme a natureza específica de cada
categoria de dado — ex.: documentos fiscais podem ter prazo legal próprio.)* Após esse período,
os dados são eliminados ou anonimizados, ressalvadas as hipóteses legais de conservação. *(Definir aqui prazo específico,
ex.: "dados contratuais são mantidos por X anos após o encerramento da relação".)*

### 9. Cookies e Tecnologias de Rastreamento

A Plataforma utiliza cookies essenciais ao funcionamento (sessão de login) e, mediante
configuração do usuário, cookies de análise de uso. O usuário pode gerenciar preferências de
cookies nas configurações do próprio navegador.

### 10. Encarregado de Dados (DPO) e Contato

Dúvidas, solicitações ou reclamações relativas a esta Política podem ser dirigidas ao
Encarregado de Proteção de Dados: `Janio Silva`, através de `contato@portalnegocio.com.br`.

---

## Notas para o desenvolvimento (não fazem parte do texto publicado)

- Campos `{{...}}` preenchidos com dados fornecidos em 20/07. **Pendências reais ainda
  abertas:** CNPJ formal da K Motors Tecnologia (hoje substituído por e-mail de contato como
  provisório) e refinamento do prazo de retenção por categoria de dado (hoje um prazo médio
  genérico de 5 anos).
- Vincular esta página no rodapé do site e no checkbox de aceite do cadastro (ver
  `usuarios.lgpd_aceite_em` no CONTEXTO.md).
- Revisar a Seção 6 sempre que um novo fornecedor/integração for adicionado ao projeto (ex.:
  quando N8N ou Storage de fotos entrarem em uso pleno).
