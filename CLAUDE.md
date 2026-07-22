# CLAUDE.md — O Carro Ideal (CRM Concessionária/Garagista + Vitrine de Veículos)

> Este arquivo é lido automaticamente pelo Claude Code no início de toda sessão neste projeto.
> Mantenha-o curto. Detalhes de schema e de funcionalidades ficam em CONTEXTO.md e FEATURES.md.

## O que é este projeto

SaaS multi-tenant (cada garagista/concessionária é um cliente isolado) para cadastro de
veículos, CRM de leads, pipeline de negócios e emissão automática de contratos.
Reconstrução, com stack própria, de um protótipo validado no Base44.

## Diferencial do produto (prioridade de negócio, não só técnica)

O dono do produto define isto como o diferencial central do PORTALNEGOCIO: **geração automática
de documentos (contrato de compra e venda, recibo, termo de garantia etc.) via Claude API,
usando os dados já cadastrados do veículo e do comprador — ou da consignação feita pela própria
garagem** — sem o usuário precisar redigitar nada. O módulo "Documentos" não é um recurso
secundário; é o motivo do produto existir. Ao planejar cada módulo, lembrar que Veículos,
Clientes e Negócios existem, entre outras razões, para alimentar esse módulo com dados prontos.

**Segundo carro-chefe (decisão de 19/07):** Vendedores + Financeiro, juntos, atacam duas dores
reais do garagista — desconfiança de comissão entre dono/equipe, e "lucro ilusório" (achar que
ganhou mais do que ganhou por esquecer custos ocultos). Ver detalhamento no roadmap e nas
seções `leads`/`custos_veiculo`/`transacoes_financeiras` do CONTEXTO.md.

**Regra de ouro do módulo Documentos:** a Claude API **nunca redige cláusula jurídica livre**.
Ela preenche um template-base fixo (escrito e validado pelo usuário, que é advogado) e escolhe
entre blocos de cláusula condicional pré-aprovados (ex.: consignação vs. venda direta,
financiamento em aberto vs. veículo livre de ônus). Isso garante consistência jurídica entre
todos os contratos gerados — a IA acelera a redação, não decide o conteúdo legal.
Todo documento gerado nasce com status "rascunho", editável antes de ser considerado final.

**Dois contratos, dois momentos do fluxo (não confundir):**
1. **Entrada** — veículo consignado chega na loja: `TEMPLATE_CONTRATO_CONSIGNACAO.md`
   (proteções: laudo cautelar, regresso automático, blindagem conjugal do consignante).
2. **Saída** — venda ao cliente final: `TEMPLATE_CONTRATO_COMPRA_VENDA.md`
   (proteções: ciência do estado do bem/desgaste, oficina credenciada, perda de garantia por
   modificação).

## Identidade visual

Manter o mesmo design/tema do Base44 atual, com melhorias pontuais onde fizer sentido — não
redesenhar do zero. Ver paleta e estilo observados em FEATURES.md.

## ✅ Migração concluída (21/07) — portalnegocio.com.br é produção agora

O domínio **portalnegocio.com.br** rodava no Base44; a migração para este sistema (React +
Supabase) foi feita em 21/07 e confirmada no ar (build servido corretamente, rotas internas
funcionando, dados da K Motors aparecendo). **Esta reconstrução agora é o produto real em
produção** — trate qualquer alteração de banco/RLS com o mesmo cuidado que se trataria uma
alteração em produção de verdade, porque é.

**ocarroideal.com** continua no ar como ambiente de teste secundário (mesmo Supabase, mesmo
build) — útil pra validar algo antes de reenviar pra portalnegocio.com.br, mas não é mais o
único lugar "seguro" pra mexer; os dois domínios servem o mesmo backend.

*Nota histórica:* antes da migração, este arquivo tinha uma regra "produção não se toca"
protegendo o Base44 enquanto o sistema novo era construído isolado em ocarroideal.com. Essa
fase terminou — não recriar o Base44 nem apontar o DNS de volta pra ele sem decisão explícita
do usuário.

## Stack desta reconstrução

| Peça | Ferramenta | Observação |
|---|---|---|
| Hospedagem | Hostinger (plano Compartilhado atual) | portalnegocio.com.br (produção) e ocarroideal.com (teste), mesmo build nos dois |
| Banco de dados | Supabase | projeto novo (id `tvzyrhepfqtnuvkavrtl`) — agora é o banco de produção |
| DNS | Cloudflare | portalnegocio.com.br e ocarroideal.com |
| E-mail | Brevo | conta contato@portalnegocio.com.br já configurada |
| Pagamento | Mercado Pago | (não Stripe — já integrado no Base44, manter) |
| Geração de documentos | Claude API | contratos/recibos automáticos |
| Automação | N8N | **fase 2 — não implementar agora** |

## Arquitetura recomendada (caminho simples para iniciante)

**Frontend estático (React + Vite) + Supabase como backend completo** (Auth, banco, storage).
A hospedagem Compartilhada da Hostinger serve arquivos estáticos sem problema — não precisa
rodar servidor Node. Supabase resolve login, dados e upload de fotos direto do navegador.

**Exceção: chamadas à Claude API (módulo Documentos) passam por uma Supabase Edge Function**,
nunca direto do navegador — isso mantém a `ANTHROPIC_API_KEY` fora do código público. Ver
detalhe em CONTEXTO.md, seção `documentos_gerados`.

*Avançado/opcional, não fazer agora:* um framework com servidor (Next.js, etc.) exigiria
upgrade para plano VPS na Hostinger. Só considerar isso se o site estático se mostrar
insuficiente mais adiante.

## Regra de ouro — aprendida com o erro do loop de login

O projeto anterior ficou preso num loop de login por pular Explorar/Planejar. Para não repetir:

1. **Nunca pular Explorar → Planejar → Codificar → Commitar.**
2. **Autenticação é construída e testada sozinha, isolada, antes de qualquer outra tela.**
   Testar login, logout e recuperação de senha numa janela anônima antes de seguir em frente.
3. **Um módulo por sessão do Claude Code.** Não pedir "constrói o sistema todo".
4. **Commit só depois de testar manualmente** que a fatia funciona.
5. **"Commitado e publicado" não é o mesmo que "está no ar".** Depois de qualquer commit, rodar
   `npm run build`, compactar a pasta `dist` e reenviar pra Hostinger (Gerenciador de Arquivos
   → extrair) — sem isso, o site publicado fica desatualizado mesmo com o código correto no
   GitHub. **Desde a migração de 21/07, reenviar em portalnegocio.com.br (produção) é o que
   importa de verdade; ocarroideal.com é só o ambiente de teste.** Testar sempre em aba anônima
   depois do reenvio — e, se possível, confirmar pelo método sem cache (fetch direto checando o
   hash do JS/CSS no HTML) antes de dar como concluído, porque cache de CDN/navegador já mascarou
   deploy desatualizado mais de uma vez neste projeto.
   **Sempre que qualquer alteração de frontend for finalizada e commitada, encerre a resposta
   lembrando ativamente o usuário: "Rode `npm run build`, gere o zip da pasta `dist` e reenvie
   pro Gerenciador de Arquivos da Hostinger (portalnegocio.com.br) antes de considerar isso
   publicado."** Não deixe esse passo implícito nem assuma que o usuário vai lembrar sozinho —
   pergunte/lembre em toda sessão que gerar mudança visível no site, mesmo que pequena.
6. **Testes automatizados usam a conta real do usuário (janiosilvabr@gmail.com), nunca criam
   contas/empresas novas via cadastro para testar** (decisão de 20/07, após acúmulo de
   empresas e usuários órfãos de sessões de teste anteriores). A senha usada nos testes é
   provisória — trocada por uma definitiva antes de haver dados reais de clientes no sistema.

## Escopo do v1

Só CRM Concessionária/Garagista + Vitrine de veículos. **Sem módulo de imóveis. Sem N8N ainda.**
(Decisão tomada após perceber que o projeto original misturava 3 SaaS em 1.)

## Documentos de referência

- **CONTEXTO.md** — schema completo do banco de dados (tabelas, campos, SQL de criação)
- **FEATURES.md** — inventário de funcionalidades, extraído do Base44 em produção
- **TEMPLATE_CONTRATO_CONSIGNACAO.md** — template do contrato de entrada (loja recebe veículo)
- **TEMPLATE_CONTRATO_COMPRA_VENDA.md** — template do contrato de saída (loja vende ao cliente)

## Ordem de construção recomendada

1. Autenticação (login/cadastro) — testar isolado antes de seguir
2. Cadastro de Veículos + fotos
3. Vitrine pública (lista + filtros)
4. Clientes
5. Negócios (pipeline de vendas)
6. Documentos automáticos (contratos)
7. CRM (atividades/follow-up)
8. Vendedores + Financeiro (menor prioridade, pode ficar para o fim do MVP)
9. Calc. PMC — função ainda não explorada (ver pendências)

## Roadmap futuro (fase 2+, não construir agora)

- **Agenda automática de test-drives (decisão de 19/07, desmembrada da Ideia "Extrato do
  Vendedor"):** exige tabela nova (`agendamentos`: veiculo_id, cliente_id, vendedor_id, tipo,
  data_hora, status) — não construir junto com o Extrato do Vendedor, é módulo próprio.
- **Alerta de margem baseado em Tabela FIPE (decisão de 19/07):** o "Termômetro de Margem"
  (ver CONTEXTO.md, `custos_veiculo`) usa só valor pago (custo de aquisição) na v1; alerta
  comparando contra a Tabela FIPE precisa de integração externa nova, fica para quando a
  Calc. PMC também for revisitada.
- **"Match Ideal" + polish de nomenclatura (decisão de 20/07, inspirado no conceito do programa
  "Car Matchmaker" — usar nomes próprios do produto, nunca o nome da série/apresentador, por
  serem marca/pessoa real):**
  - **Match Ideal (novo, modesto):** adicionar a `leads` os campos `orcamento_maximo`,
    `tipo_carroceria_desejado`, `cambio_desejado`; adicionar a `veiculos` o campo
    `tipo_carroceria` (sedan/suv/hatch/pickup/utilitario/moto/outro — também reforça os
    filtros da Vitrine). Exibir na tela do lead um card com os 3 veículos do estoque mais
    aderentes ao perfil — é filtro/consulta direta no banco, **não precisa de Claude API**.
  - **Ranking do mês por vendedor** (já no roadmap): renomear na UI como algo como "Índice de
    Conversão" — zero custo adicional, mesma query já prevista.
  - **Limite de desconto** no Termômetro de Margem (já construído): adicionar um número
    derivado ("até R$ Z de desconto sem perder a margem mínima") — pequeno acréscimo ao que já
    existe, não é tela nova.
  Sessão curta, cabe antes da Calc. PMC.
- **PMC estimado vs. margem real (decisão de 19/07):** ligar o resultado salvo da Calc. PMC
  (margem estimada na compra) ao lucro líquido real apurado no Financeiro após a venda do
  mesmo veículo — permite comparar "estimei X, ganhei Y". Requer que o resultado da Calc. PMC
  seja salvo vinculado ao veículo, não só exibido na hora.
- **Avaliação por IA da Calc. PMC baseada em dados da própria rede (fase avançada, só faz
  sentido com volume real de anúncios):** em vez de a IA "chutar" valor de mercado com base só
  em conhecimento geral (risco de imprecisão numa feature paga), fundamentar a avaliação em
  anúncios reais similares já publicados no Portal por outras garagens. Diferencial que só o
  Portal tem, por agregar dados de várias garagens.
- **Upload de Fotos + Marca d'água dupla (decisão de 18/07):** quando o módulo de Fotos/Storage
  entrar (hoje pausado), aplicar automaticamente, no upload, marca d'água com o logo da
  garagem + selo discreto "Anunciado no Portal Negócio" (com QR code/link pro anúncio, se
  viável). Objetivo: cada foto compartilhada pela garagem em outros canais (WhatsApp,
  Instagram, grupos) carrega o Portal junto — efeito de rede orgânico. O selo do Portal deve
  ser removível apenas em planos pagos superiores (alavanca de upsell).
- Outros tipos de documento (Recibo, Termo de Garantia, Confissão de Dívida)
- **Envio de documento por e-mail via Brevo, como recurso Premium (decisão de 20/07):** v1
  desta feature = enviar o contrato/documento já gerado por e-mail ao cliente, não uma
  ferramenta de e-mail marketing completa. Gatear pelo campo `planos.recursos` (jsonb, já
  existe no schema) — não criar tabela nova. Risco a monitorar: todas as garagens usando a
  mesma conta Brevo compartilham reputação de envio; se o volume crescer e houver problema de
  entrega/spam, considerar sub-contas ou domínio de envio próprio por garagem (fase mais
  avançada, só se necessário). Construir de preferência já com garagens reais pagantes, não
  antes.
- Cobrança avulsa (pay-per-use) para a futura Calc. PMC
- N8N para automações condicionais mais complexas

## Pendências técnicas (não travam o início do v1)

- Quando o módulo Calc. PMC entrar em construção: precisa de um mecanismo de cobrança avulsa
  (R$ 4,99 por consulta de "Avaliação por IA") via Mercado Pago, separado da tabela
  `assinaturas` (que é só mensalidade). Ver detalhe em FEATURES.md.
