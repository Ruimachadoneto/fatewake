---
description: Implementa o tracker específico de classe (Inspiração/Determinação/Marca/Dados de Oração/etc) no dashboard de jogo
---

Vou pedir pra implementar o tracker específico de uma classe Daggerheart. Antes de codar:

1. Pergunte qual classe (Bardo/Druida/Feiticeiro/Guardião/Guerreiro/Ladino/Mago/Patrulheiro/Serafim)
2. Releia a habilidade de classe em `src/data/classes.json` para essa classe — o tracker é uma UI da Habilidade de Classe principal
3. Considere também a interação com Subclasse (em `subclasses.json`) — algumas subclasses modificam o tracker

Cada tracker tem mecânica única:
- **Bardo**: Dado de Inspiração (d6 base, d8 no nível 5) — usar 1x por sessão, distribuir entre aliados
- **Druida**: Forma de Fera ativa + seletor de forma disponível por patamar
- **Feiticeiro**: Carta na Reserva via Canalizar Poder Bruto (1x por descanso longo)
- **Guardião**: Dado de Determinação (d4 base, d6 no nível 5) — escalonável (+1 ao causar dano)
- **Guerreiro**: Ataque de Oportunidade (memo de regra, não tem state) + Treinamento de Combate bônus
- **Ladino**: Toggle Oculto + dado de Ataque Furtivo (Xd6 onde X = patamar)
- **Mago**: Padrões Estranhos (escolha número 1-12, editável em descanso longo)
- **Patrulheiro**: Marca da Presa ativa (apontar alvo) + ficha lateral de Companheiro Animal se subclasse Treinador
- **Serafim**: Dados de Oração (Xd4 onde X = atributo conjuração da subclasse), gastáveis até alcance distante

Convenções:
- Componente em `src/components/jogo/trackers/Tracker[NomeClasse].tsx`
- Importar e renderizar condicional em `TelaJogo.tsx` baseado em `personagemAtivo.classe`
- Estado persiste em `Personagem` (adicionar campos opcionais ao tipo se necessário)
- Visual Fatewake: dado animado, glow dourado/violeta conforme tema da classe
- Mobile-first: tracker compacto, expandível tap

Não comece sem me confirmar qual classe e o plano de UI em alto nível.
