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

## ⚠️ Regra crítica — produção não se toca

O site **portalnegocio.com.br** roda hoje no **Base44** e está em produção real (402 visitantes
únicos nos últimos 7 dias, dado do Cloudflare). **Nunca alterar, desligar ou apontar o DNS dele
enquanto este projeto não estiver pronto e testado.**

Este projeto novo é construído isolado, no domínio **ocarroideal.com** (ambiente de construção
e teste), hospedado na Hostinger. **Plano confirmado:** quando estiver pronto e validado, o
DNS de portalnegocio.com.br (hoje no Base44) migra para este sistema novo, que passa a ser o
produto definitivo. ocarroideal.com não é uma marca separada — é só o canteiro de obras.

## Stack desta reconstrução

| Peça | Ferramenta | Observação |
|---|---|---|
| Hospedagem | Hostinger (plano Compartilhado atual) | domínio ocarroideal.com |
| Banco de dados | Supabase | projeto novo e vazio (id `tvzyrhepfqtnuvkavrtl`) — substitui o projeto anterior "O Carro Ideal" que foi zerado |
| DNS | Cloudflare | já configurado para portalnegocio.com.br; configurar também para ocarroideal.com |
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
5. **"Commitado e publicado" não é o mesmo que "está no ar" no ocarroideal.com.** Depois de
   qualquer commit, rodar `npm run build`, compactar a pasta `dist` e reenviar pra Hostinger
   (Gerenciador de Arquivos → extrair) — sem isso, o site publicado fica desatualizado mesmo
   com o código correto no GitHub. Testar sempre em aba anônima depois do reenvio.
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
