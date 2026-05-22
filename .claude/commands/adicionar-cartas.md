---
description: Extrai cartas de domínio de um PDF/imagem e popula o JSON correspondente
---

Vou anexar conteúdo (PDF ou imagens) de cartas de domínio Daggerheart. Por favor:

1. Pergunte qual nível das cartas (1-10) se eu não tiver dito explicitamente
2. Identifique o arquivo correto a popular em `src/data/cartas/nivel-N.json`
3. Para cada carta, extraia:
   - `id`: slug `dominio-nome-da-carta` em kebab-case minúsculo, sem acento (ex: `arcano-protecao-runica`)
   - `dominio`: um dos 9 oficiais (Arcano, Códice, Esplendor, Graça, Lâmina, Meia-noite, Falange, Sabedoria, Valor) — com acentuação correta
   - `nivel`: número do nível
   - `tipo`: "Feitiço" ou "Talento" (sempre exatamente assim, com cedilha e acento)
   - `nome`: nome oficial da carta em PT-BR
   - `custo_recordacao`: número de PF para retornar à mão (0 se nenhum)
   - `descricao`: texto completo da carta em PT-BR, sem perder nenhum detalhe mecânico
4. Antes de gravar, me mostre 1-2 cartas como amostra pra eu validar o formato
5. Após eu aprovar, popule o JSON completo
6. No final, valide o JSON com Python ou Node (`JSON.parse`) para garantir que está bem formado
7. Confirme quantas cartas foram adicionadas e por domínio

Importante:
- NÃO inventar cartas ou inferir mecânicas. Se algo não estiver claro no PDF, marcar com TODO e perguntar
- Preservar texto original (paráfrases curtas só se necessário pra caber, sem perder regras)
- Cartas Códice frequentemente afetam stats — confirmar que o texto reflete isso
- Cartas de Meia-noite geralmente envolvem furtividade/sombras
