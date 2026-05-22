---
description: Cria um passo novo do wizard de criação de personagem seguindo o padrão visual Fatewake
---

Vou pedir pra criar um passo do wizard de criação. Antes de codar:

1. Confirme qual passo é (Classe, Ancestralidade, Comunidade, Atributos, Equipamento, Cartas, Experiências, Vínculos, Revisão)
2. Olhe o `CLAUDE.md` para entender a ordem e o que esse passo precisa coletar do usuário
3. Verifique se já existe componente ou se vai criar do zero em `src/views/criacao/`
4. Confirme os tipos relevantes em `src/types/personagem.ts`
5. Use os dados de referência via `@/data` (não importe direto dos JSONs)

Convenções obrigatórias:
- Visual Fatewake (classes utility do index.css: card-ornate, section-header, section-title, btn-primary)
- Tipografia: Cinzel para títulos com tracking, Inter para UI
- Cores: gold para ações principais, blood para perigo/destrutivo, arcane para magia
- Atualizar personagem via `useApp().atualizar()` ou `atualizarFn()`
- Navegação entre passos: botões "Anterior" e "Próximo" no rodapé do card
- Validação: o botão "Próximo" só fica habilitado quando os campos obrigatórios estão preenchidos
- Mobile-first: design pensando em tela de 380px de largura
- Copy narrativa: "Despertar" não "Criar", "Sua jornada", "O destino..."

Não comece codando sem antes me confirmar o plano em alto nível.
