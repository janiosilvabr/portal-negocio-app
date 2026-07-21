# TEMPLATE_TERMOS_USO.md

> **Rascunho para sua análise e adequação — não é um documento pronto para uso.**
> Estruturado em 12 seções, no mesmo padrão abrangente usado na versão anterior (Base44),
> adaptado às funcionalidades reais do produto (CRM multi-tenant, vitrine pública, geração de
> documentos via IA, assinaturas). Como advogado responsável pelo produto, você decide a
> redação final; isto é insumo, não conclusão jurídica.

---

## TERMOS DE USO — PORTAL NEGÓCIO

**Última atualização:** `20/07/2026`

### 1. Aceitação dos Termos

Ao criar uma conta ou utilizar o Portal Negócio, o usuário declara ter lido, compreendido e
aceito integralmente estes Termos de Uso e a Política de Privacidade. Caso não concorde, deve
abster-se de utilizar a Plataforma.

### 2. Descrição do Serviço

O Portal Negócio é uma plataforma SaaS (Software como Serviço) destinada a garagistas e
concessionárias de veículos, oferecendo: cadastro e gestão de estoque de veículos, CRM de
leads e clientes, pipeline de negócios, geração assistida por IA de documentos contratuais
(contratos de compra e venda e de consignação), controle financeiro e vitrine pública de
veículos para consulta por visitantes.

### 3. Cadastro e Conta de Usuário

O cadastro exige informações verdadeiras, completas e atualizadas. O usuário é responsável
pela guarda de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
O Portal Negócio pode suspender ou encerrar contas que violem estes Termos.

### 4. Papel do Portal Negócio

O Portal Negócio é uma **plataforma de intermediação tecnológica** — não é parte nas
negociações de compra, venda ou consignação de veículos realizadas entre garagens e seus
clientes. A responsabilidade pela veracidade dos anúncios, pela condição dos veículos
ofertados e pelo cumprimento das obrigações contratuais é exclusiva da garagem responsável
pelo anúncio/negócio.

### 5. Responsabilidades da Garagem e de seus Vendedores

Cada garagem cadastrada é responsável por: (a) garantir a veracidade dos dados de veículos,
clientes e negócios inseridos no sistema; (b) cumprir a legislação de trânsito, consumidor
(CDC) e de proteção de dados (LGPD) aplicável às suas atividades; (c) obter o consentimento
adequado de seus clientes para o tratamento de dados pessoais inseridos na Plataforma; (d)
revisar e validar todo documento gerado automaticamente antes de utilizá-lo, conforme Seção 6.

### 6. Documentos Gerados Automaticamente

A Plataforma oferece geração assistida de documentos contratuais por meio de inteligência
artificial (Claude API), a partir de **templates jurídicos pré-aprovados** e dos dados
cadastrados pelo próprio usuário. **A IA preenche variáveis e seleciona blocos de cláusula
dentro de um conjunto pré-definido — não redige conteúdo jurídico livre.** Todo documento
gerado nasce com status de rascunho, e é de responsabilidade do usuário revisá-lo e validá-lo
antes de utilizá-lo como instrumento definitivo. O Portal Negócio não se responsabiliza por
prejuízos decorrentes do uso de documento gerado sem a devida revisão pelo usuário.

### 7. Planos, Pagamentos e Assinaturas

O acesso a determinadas funcionalidades da Plataforma pode estar condicionado à contratação de
um plano pago, processado através do Mercado Pago. Os valores, periodicidade e recursos de
cada plano estão descritos na área de Planos da Plataforma. O cancelamento pode ser feito a
qualquer momento, com efeitos a partir do fim do ciclo de cobrança vigente, ressalvadas
disposições específicas de cada plano.

### 8. Propriedade Intelectual

O software, marca, layout e demais elementos do Portal Negócio são de propriedade de
`K Motors Tecnologia`, sendo vedada sua reprodução, engenharia reversa ou uso não
autorizado. Os dados inseridos pelo usuário (veículos, clientes, negócios) permanecem de
titularidade do usuário/garagem que os inseriu.

### 9. Condutas Vedadas

É vedado ao usuário: inserir dados falsos ou de terceiros sem autorização; utilizar a
Plataforma para fins ilícitos, fraudulentos ou discriminatórios; tentar acessar dados de
outras garagens sem autorização; realizar engenharia reversa, scraping automatizado não
autorizado, ou sobrecarregar deliberadamente a infraestrutura da Plataforma.

### 10. Limitação de Responsabilidade

O Portal Negócio envida esforços razoáveis para manter a Plataforma disponível e funcional,
mas não garante disponibilidade ininterrupta. Não se responsabiliza por: negociações
realizadas entre garagens e seus clientes; conteúdo de anúncios publicados pelas garagens;
decisões tomadas com base em simulações da Calc. PMC ou documentos gerados sem a devida
revisão profissional do usuário.

### 11. Rescisão e Cancelamento

O usuário pode encerrar sua conta a qualquer momento. O Portal Negócio pode suspender ou
encerrar contas que violem estes Termos, mediante notificação prévia sempre que possível,
ressalvados casos de violação grave que exijam ação imediata.

### 12. Alterações nos Termos e Foro

Estes Termos podem ser atualizados periodicamente, com aviso ao usuário através da Plataforma
ou por e-mail. O uso continuado após a atualização implica aceite dos novos termos. Fica eleito
o foro da comarca de `Cuiabá/MT` para dirimir controvérsias oriundas destes Termos,
renunciando as partes a qualquer outro, por mais privilegiado que seja.

---

## Notas para o desenvolvimento (não fazem parte do texto publicado)

- Campos `{{...}}` precisam ser preenchidos por você antes de publicar.
- A Seção 6 é a mais sensível do documento — reforça juridicamente o mesmo princípio já
  registrado no CLAUDE.md ("a IA nunca redige cláusula livre"). Mantenha os dois documentos
  consistentes entre si caso um dos dois seja alterado no futuro.
- Vincular esta página no rodapé do site e no checkbox de aceite do cadastro (ver
  `usuarios.lgpd_aceite_em` no CONTEXTO.md — o mesmo checkbox deve referenciar Termos de Uso
  **e** Política de Privacidade juntos).
