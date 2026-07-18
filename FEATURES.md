# FEATURES.md — Inventário de funcionalidades (referência: Base44 em produção)

> Extraído das telas reais do portalnegocio.com.br em 18/07/2026. Serve de especificação
> funcional para a reconstrução — não precisa ser reconstruído na mesma ordem em que aparece
> aqui; ver "Ordem de construção recomendada" no CLAUDE.md.

## Site público (vitrine)

- **Home**: chamada principal + botões "Ver Veículos" / "Ver Imóveis" (imóveis fora do escopo
  do v1, ignorar) + botão "Quanto vale seu veículo ou imóvel?" (avaliação — investigar se liga
  à Calc. PMC)
- **Vitrine de Veículos**: grade de cards com 7 filtros dropdown (prováveis: marca, modelo, ano,
  faixa de preço, km, combustível, câmbio — confirmar exatamente quais no Base44 antes de
  replicar). Cada card mostra: foto, selo de condição (ex. "Bom"), nome/modelo, preço, ano, km,
  combustível, câmbio, cidade, nome da garagem/vendedor, botão "Ver Detalhes".

## Painel interno (dashboard logado)

Menu lateral: Dashboard, Veículos, Clientes, Negócios, CRM, Financeiro, Vendedores, Documentos,
Calc. PMC, Administrativo, Configurações. (Sem "Imóveis" no painel interno — já está isolado
corretamente do módulo cortado.)

### Dashboard
KPIs do dia: Novos Leads, Negócios em Andamento, Test Drives Agendados, Documentos Pendentes,
Veículos Reservados, Valor em Negociações. Gráficos: Pipeline de Negócios (barras por estágio),
Status dos Veículos (rosca/pizza).

### Veículos
(tela de listagem não capturada em detalhe — replicar campos do schema em CONTEXTO.md)

### Clientes
Lista com busca (nome/CPF/e-mail). Colunas: Nome, Situação (badge: "Cliente ativo" /
"Em negociação"), CPF, Contato (telefone e/ou e-mail), ações (editar/excluir). Botão
"+ Novo Cliente".

### Negócios
Pipeline com filtro por estágio e contadores por estágio:
**Contato Realizado → Interesse Confirmado → Test Drive → Proposta →
Negociação e Geração de Documentos → Venda Concluída.**
Cada card: nome do negócio, cliente, veículo (com foto), valor, data, estágio (dropdown),
busca por negócio/cliente/veículo, botão "Filtros", botão "Relatórios", botão "+ Novo Negócio".

### CRM
KPIs: Leads Novos, Atividades Hoje, Atividades Concluídas, Taxa de Conversão.
Lista de "Atividades e Follow-ups": tipo (ex. Ligação), contato associado, data/hora, ações
(marcar concluída ✓, cancelar ✗, editar, excluir). Botão "+ Nova Atividade".

### Financeiro
KPIs: Total de Receitas, Total de Despesas, Lucro Líquido, Pendente. Gráficos: Receitas x
Despesas (6 meses), Despesas por Categoria. Tabela de Transações (Data, Descrição, Categoria,
Forma, Status, Valor, ações). Botão "+ Nova Transação".
*(Módulo de menor prioridade no v1 — funcional, mas não é o núcleo do produto.)*

### Vendedores
Cards por vendedor: nome, % de comissão, status (Ativo/Inativo), e-mail, telefone. Ações:
Editar, Ativar/Desativar, Excluir. Botão "+ Novo Vendedor".

### Documentos
Lista de documentos gerados (ex.: "Confissão de Dívida de Veículo", "Termo de Garantia de
Veículo", "Contrato Particular de Compra e Venda de Veículo", "Contrato de Compra e Venda").
Cada item: cliente + veículo associado, data, status (ex. "rascunho"), versão (ex. "v2"),
ações: Abrir, Email, Excluir. Botão "+ Gerar Documento" (texto do painel: "Geração de
documentos administrativos com o Motor Administrativo Inteligente" — geração via IA/Claude API).

### Calc. PMC
**Confirmado pelo usuário: simulador de margem de lucro sobre o veículo.**
PMC = "Preço Máximo de Compra" — o valor máximo que o garagista pode pagar num veículo para
manter a margem desejada. Fórmula: **PMC = PVP − CPT − Lucro Desejado**
(PVP = Preço de Venda Praticável / valor de mercado pronto; CPT = Custo Total de Preparação).

Fluxo da tela:
1. **Identificação do veículo**: descrição (marca/modelo/ano), tipo (Moto/Carro/Utilitário-SUV)
2. **Parâmetros principais**: PVP, Lucro Desejado (líquido no bolso)
3. **Custos de Preparação (CPT)**: Mecânica (motor/câmbio), Estética (lavagem/polimento/
   martelinho), Reserva de Garantia (valor automático sugerido, ex. R$ 1.200 para carro),
   Outros Custos Extras (logística/guincho) — soma um "Total CPT"
4. **Resultado**: card destacado com o Preço Máximo de Compra (ex.: "-R$ 1.200,00" quando o
   PVP não cobre custos + lucro — alerta "PVP insuficiente para cobrir custos e lucro desejado")
5. **Análise de Viabilidade**: campo opcional "Preço pedido pelo vendedor atual" para comparar
   contra o PMC calculado
6. **Avaliação de Preço por IA**: botão pago — **R$ 4,99 por consulta**, análise inteligente do
   valor de mercado via IA. **Isto é uma receita avulsa (pay-per-use), separada da assinatura
   mensal do SaaS** — precisa de um jeito de cobrar valores pequenos e pontuais via Mercado
   Pago, distinto da tabela `assinaturas`. Anotar como pendência de schema para quando este
   módulo entrar em construção (não é v1 imediato).
7. Ações finais: "Gerar Relatório / Salvar PDF" e "Copiar para WhatsApp"

## Identidade visual a preservar

O usuário pediu para manter o mesmo design/tema atual, só com melhorias pontuais. Paleta
observada nas telas: sidebar em azul-marinho escuro, acento em laranja (botões primários,
badges de destaque, ícones ativos), área de conteúdo em fundo claro/branco, cards com sombra
sutil. Logo "Portal Negócio" (ícone de carro) com tagline "ECOSSISTEMA INTELIGENTE".

### Administrativo / Configurações
Não exploradas em detalhe ainda — telas de configuração geral da conta/empresa.

## Observação importante

O painel interno já mostra dados de teste reais (ex. cliente "Regigaldo Ferreira", negócio
"Reginaldo x Peugeot Boxer" em estágio "Negociação e Geração de Documentos"), confirmando que
o fluxo ponta a ponta (lead → negócio → documento) já foi validado conceitualmente no Base44.
Isso reduz risco: não estamos inventando o produto, estamos reconstruindo algo que já provou
que funciona para o caso de uso.
