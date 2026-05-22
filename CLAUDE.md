# CLAUDE.md — Fatewake

> **Briefing de continuidade.** Este arquivo é o "estado da nação" do projeto. Sempre leia este arquivo PRIMEIRO ao começar uma nova sessão. Ele contém visão, decisões, convenções e status atual.

---

## 🎯 Visão do produto

**Fatewake** é um companion narrativo para RPG de mesa, com foco inicial em **Daggerheart** (Jambô Editora 2025, PT-BR).

**Tagline:** *Sua história. O destino responde.*

### Quatro fases planejadas

| Fase | Escopo | Status |
|------|--------|--------|
| **1 — MVP de campo** | Ficha digital completa: criação + jogo, persistência local, export/import JSON, PWA mobile-first | ✅ Completo (wizard 9 passos + dashboard + polish visual) |
| **2 — Sala de Sessão** | Supabase Realtime: GM vê fichas ao vivo, controla Medo, jogadores sync em tempo real | ✅ Implementado |
| **3 — Pós-MVP** | ~~Cartas níveis 3-10~~ ✅, Subclasse Aprimorada, Multiclasse, equipamentos completos | 🔄 Parcial (cartas done) |
| **4 — Companion narrativo** | Mapas, registros de campanha, galeria de imagens, multi-sistema | ⚪ Visão futura |

### Regra de ouro de escopo

Antes de adicionar qualquer feature, perguntar:
1. Isso ajuda a **mesa presencial**?
2. Isso ajuda o **jogador a usar a ficha**?
3. Isso ajuda o **mestre a conduzir a sessão**?
4. Isso **evita virar VTT**?

Se a resposta a alguma dessas for "não" ou "talvez" — adiar para Fase 4+.

### Por que existe

O dono do projeto (Rui Machado, PMO Jr na BlendIT, João Pessoa) é mestre de uma mesa de Daggerheart com 2 jogadores. A campanha já está na sessão 3, personagens nível 2. **Existem apps similares** (Demiplane Nexus, Heart of Daggers, Quest Portal), mas:
- Demiplane tem bugs e UX confusa (level up enterrado em menus, campos de Experiência cortados em 35 chars)
- Falta companion em PT-BR pensado para uso mobile durante a sessão
- Visão de longo prazo é integrar com a fase narrativa imersiva (companion completo, não só ficha)

**Mesa-alvo imediata:** 2 jogadores, possivelmente Druida e/ou Patrulheiro (por isso Formas de Fera e Companheiro Animal entraram na Fase 1).

---

## 🎨 Identidade visual

**Branding:** Fatewake (não usar "Daggerheart Companion" — esse era nome provisório anterior)

**Paleta oficial:**
```
Base       #0B0F1A  azul-noite cósmico
Card       #141B2B  panel
Elevated   #1B2238  raised
Inset      #070A12  recessed
Violet     #2A1B3D  violeta profundo
ViolHigh   #4B2E83  glow violeta

Gold       #D4AF37  destino, esperança, destaque primário
Blood      #9D1F2D  medo, perigo, sangue
Arcane     #7B3FA0  magia, mistério
Ink        #E8DFCF  pergaminho luminoso
```

**Tipografia:**
- `Cinzel` — títulos épicos, tracking generoso (0.2-0.3em)
- `Inter` — UI, leitura

**Princípios visuais:**
- Dark-first, sempre
- Cantos dourados decorativos em cards importantes (`.card-ornate`)
- Linha dourada decorativa em section headers
- Ícones com glow (filter drop-shadow)
- Gradientes cósmicos no body (radial violeta + sangue)
- Animações sutis: float, pulse-glow, shimmer (nunca exageradas)
- Cantos arredondados (rounded-xl) — nunca quadrados
- Bordas finas (0.5px-1px), nunca grossas

**O que NÃO fazer:**
- Não usar emoji ou ícone padrão sem contexto narrativo
- Não usar cores chapadas/saturadas demais (cor sempre passa por gradient ou opacity)
- Não usar "criar personagem" — usar "despertar herói"; copy narrativa
- Não usar termos D&D (HP, MP, XP) — sempre PT-BR Daggerheart (PV, PF, PA, Esperança, Medo)

---

## 🏗️ Stack técnica

```
Vite 5 + React 18 + TypeScript (strict)
Tailwind v3 (paleta Fatewake custom)
Framer Motion (animações)
Zustand (state global)
Vite PWA Plugin (offline + installable)
Capacitor 6 (build Android/iOS)
Lucide React (ícones)
@fontsource (Cinzel + Inter, offline)
```

**Decisão "projeto real" vs "Artifact":** projeto real Vite, rodando no PC do Rui (Windows). PWA primeiro, Capacitor depois quando a Fase 1 estiver completa.

**Persistência:**
- Atualmente: `localStorage` (chave `dh_companion_v1` — manter por compat; em refactor futuro renomear `fatewake_v1`)
- Export/Import JSON funcional (por personagem ou backup completo)
- **Abstração crítica:** todas operações de storage passam por `src/lib/storage.ts`. Quando migrar pra Supabase (Fase 3), só essa pasta muda. Componentes nunca chamam `localStorage` diretamente.

---

## 📁 Estrutura de pastas

```
fatewake/
├── CLAUDE.md                 ← Este arquivo. Sempre ler primeiro.
├── README.md                 ← Documentação pública/instalação
├── package.json
├── vite.config.ts            ← PWA configurado
├── tailwind.config.ts        ← Paleta Fatewake
├── tsconfig.*.json
├── capacitor.config.ts
├── postcss.config.js
├── index.html
├── public/
│   ├── favicon.svg           ← Lua dourada + estrelas
│   └── icons/                ← PWA icons ✅ icon-192.png (29KB), icon-512.png, icon-512-maskable.png (130KB)
└── src/
    ├── main.tsx
    ├── App.tsx               ← Shell com toggle Criação/Jogo
    ├── index.css             ← Tailwind + tema + classes utility
    ├── types/
    │   ├── personagem.ts     ← Modelo de domínio + novoPersonagem()
    │   └── dados.ts          ← Tipos dos JSONs de referência
    ├── data/                 ← Dados estáticos do sistema Daggerheart
    │   ├── index.ts          ← Loader central tipado (USAR ESTE, não imports diretos)
    │   ├── dominiosCores.ts  ← ⭐ Cores canônicas dos 9 domínios (single source of truth)
    │   ├── classes.json      ← 9 classes
    │   ├── subclasses.json   ← 18 subclasses
    │   ├── ancestralidades.json  ← 19
    │   ├── comunidades.json  ← 9 (inclui item_inventario para Nômade)
    │   ├── formas-fera.json  ← Druida (22 formas, 4 patamares)
    │   ├── companheiro-animal.json  ← Patrulheiro (8 treinamentos)
    │   ├── levelup.json      ← Sistema de patamares 2/3/4
    │   └── cartas/
    │       ├── nivel-1.json  ← 27 cartas (domínios e tipos verificados contra baralho oficial)
    │       ├── nivel-2.json  ← 18 cartas (corrigido: Força Esmagadora/Presença Corajosa são Valor)
    │       ├── nivel-3.json  ← 18 cartas (2 por domínio)
    │       ├── nivel-4.json  ← 18 cartas (2 por domínio)
    │       ├── nivel-5.json  ← 13 cartas (Meia-noite e Valor sem nível 5)
    │       ├── nivel-6.json  ← 10 cartas (5 domínios)
    │       ├── nivel-7.json  ← 9 cartas (Dons de Domínio incluídos)
    │       ├── nivel-8.json  ← 6 cartas
    │       ├── nivel-9.json  ← 3 cartas
    │       └── nivel-10.json ← 2 cartas (Falange only)
    ├── lib/
    │   ├── storage.ts        ← Persistência abstraída + export/import
    │   ├── supabase.ts       ← Cliente Supabase
    │   └── exportarPDF.tsx   ← Export PDF da ficha
    ├── store/
    │   ├── app.ts            ← Zustand: personagem ativo + modo
    │   ├── sessao.ts         ← Zustand: estado da sala de sessão
    │   └── campanha.ts       ← Zustand: sessões da campanha + loot registrado
    ├── components/
    │   ├── ui/HeaderApp.tsx       ← Simplificado: só logo + botão voltar (nav movida para BottomNav)
    │   ├── ui/BottomNav.tsx       ← ⭐ Nav inferior 4 abas: Ficha/Editar/Saga/Sala (animated pill)
    │   └── circulo/
    │       └── CirculoClasses.tsx  ← ⭐ SVG interativo "Círculo das Classes" (PassoClasse)
    └── views/
        ├── TelaSelecionarPersonagem.tsx
        ├── TelaSaga.tsx           ← Aba Saga: Diário da Saga + Vínculos + Origem
        ├── criacao/
        │   ├── TelaCriacao.tsx       ← Wizard shell (9 passos, barra de progresso, navegação)
        │   └── steps/
        │       ├── PassoIdentidade.tsx    ← Nome, gênero, pronomes + chips de nomes sugeridos
        │       ├── PassoClasse.tsx        ← CirculoClasses SVG + card de detalhe
        │       ├── PassoSubclasse.tsx     ← 2 subclasses + expansores Elementalista/Treinador
        │       ├── PassoAncestralidade.tsx ← 19 ancestralidades
        │       ├── PassoComunidade.tsx    ← 9 comunidades (gerencia item Nômade no inventário)
        │       ├── PassoAtributos.tsx     ← Pool [2,1,1,0,0,-1] com sugestão da classe
        │       ├── PassoEquipamento.tsx   ← Armas + armadura editáveis
        │       ├── PassoCartas.tsx        ← 2 cartas dos domínios da classe
        │       └── PassoOrigemVinculos.tsx ← Experiências, origem, vínculos, resumo
        ├── jogo/
        │   ├── TelaJogo.tsx          ← Dashboard completo (gauges, armas, cartas, trackers)
        │   └── PainelTrackerClasse.tsx ← Trackers específicos das 9 classes
        ├── levelup/
        │   └── TelaLevelUp.tsx       ← Tela de level up guiado (carta obrigatória + 2 opções)
        ├── campanha/
        │   └── BibliotecaGM.tsx      ← Histórico de sessões + loot distribuído (aba "Biblioteca" da sala GM)
        └── sessao/
            ├── TelaSessao.tsx        ← Shell da sala de sessão
            ├── TelaSalaGM.tsx        ← Visão do mestre: 4 abas (Fichas/Ferramentas/Biblioteca/Roteiro)
            ├── TelaSalaJogador.tsx   ← Visão do jogador (ficha + sync, dado de medo inline)
            ├── TelaEntrarSala.tsx    ← Entrada por código 6 dígitos
            ├── TelaAuthGM.tsx        ← Auth do mestre
            ├── TelaCampanhas.tsx     ← Lista de campanhas do mestre
            └── FerramentasGM.tsx     ← Adversários, Contagens, Imagens, Objetivos, Ambiente, Tesouro
```

---

## ✅ O que está PRONTO

### Tipos
- [x] `Personagem` completo com atributos, saúde, equipamento, cartas, narrativa, level-up
  - `evasao_bonus_perm: number` — bônus permanente acumulado de level-up ("Aumentar Evasão")
  - `Modo` type: `'criacao' | 'jogo' | 'levelup' | 'saga'`
- [x] `CompanheiroAnimal` (subclasse Treinador do Patrulheiro)
- [x] `PatamarMarcado` (rastreio de escolhas de level up)
- [x] `Carta` (id, domínio, nível, tipo, `custo_recordacao`, descrição) — campo correto é `custo_recordacao`, não `custo`
- [x] `ItemInventario` (id, nome, descricao?, tipo: item/consumivel/manual, timestamp) — inventário dinâmico
- [x] `novoPersonagem(id)` factory function

### Dados
- [x] 9 classes com habilidades de esperança, habilidades de classe, atributos sugeridos, armas/armadura sugeridas, descrição pessoal, perguntas de origem, vínculos, tagline, inventário inicial
- [x] 18 subclasses (2 por classe) com habilidades fundamentais, especialização, maestria, atributo de conjuração
- [x] 19 ancestralidades com 2 habilidades cada
- [x] 9 comunidades com habilidade característica
- [x] 22 Formas de Fera (4 patamares) do Druida
- [x] 8 Treinamentos do Companheiro Animal + 19 Experiências sugeridas
- [x] Sistema de level up patamares 2/3/4 com opções, vagas e exclusões
- [x] **124 cartas de domínio níveis 1–10** nos 9 domínios (verificadas contra baralho oficial)
  - nivel-1: 27 cartas, nivel-2: 18, nivel-3: 18, nivel-4: 18, nivel-5: 13, nivel-6: 10, nivel-7: 9, nivel-8: 6, nivel-9: 3, nivel-10: 2
  - Correções aplicadas: `Armadura Corporal` pertence a Valor (não Códice); `Força Esmagadora`/`Presença Corajosa` são Valor lv2 (não Lâmina); `Resistir`/`Táticas` são Falange lv3 (não Valor lv2)

### Componentes/Views
- [x] `HeaderApp` simplificado — só logo Fatewake + botão voltar ao selecionar personagem (navegação movida para BottomNav)
- [x] `BottomNav` — nav inferior 4 abas com animated pill (Framer Motion `layoutId="nav-pill"`):
  - **Ficha** → modo `jogo`, **Editar** → modo `criacao`, **Saga** → modo `saga`, **Sala** → toggle sessão
  - Badge verde na aba Sala quando sessão ativa; só visível com `personagemAtivo`
- [x] `TelaSaga` — aba dedicada para narrativa do personagem:
  - Diário da Saga (textarea + quick-tags + contador de palavras)
  - Vínculos (exibidos se preenchidos na criação)
  - Origem (respostas exibidas se preenchidas na criação)
  - Mini-header com portrait placeholder, nome, classe e badge de nível
- [x] `TelaSelecionarPersonagem` funcional (criar, listar, importar/exportar, cards com acento de classe)
- [x] `TelaCriacao` **Wizard completo** 9 passos + transições AnimatePresence (slide L/R por direção)
  - Todos os 9 passos com **Framer Motion polish**: stagger de entrada, AnimatePresence nos detalhes
  - Cores canônicas por domínio em PassoCartas, PassoClasse
  - Comunidade Nômade: adiciona/remove "Mochila de Nômade" do inventário automaticamente
- [x] `CirculoClasses` — **SVG interativo** inspirado no Círculo dos Domínios oficial:
  - 9 domínios no anel externo (círculos coloridos com abreviação)
  - 9 classes no anel interno (pills clicáveis, nome completo)
  - Ciclo hamiltoniano perfeito: toda classe entre seus exatos 2 domínios
  - Linhas tracejadas de conexão aparecem ao selecionar uma classe
  - Estrela de 9 pontas dourada no centro, raios decorativos, anéis concêntricos
  - Cores derivadas de `dominiosCores.ts` + cores de classe hardcoded
- [x] `TelaJogo` **Dashboard completo**:
  - StickyResourceBar (PV/PF/Esperança/ARM — `sticky top-0` no scroll container)
  - Gauges PV/PF/PA/Esperança interativos com Framer Motion
  - Limiares de dano com receberDano(1/2/3) por severidade → `limiaresEfetivos = p.limiares + p.nivel`
  - Badge de severidade dinâmico no cabeçalho
  - Painel de Condições marcáveis/desmarcáveis
  - Descanso Curto/Longo, armas, cartas, experiências, habilidades, trackers
  - Theming por classe (`--fw-accent`) + cores de domínio via `getDominioStyle()`
  - **Evasão display corrigido**: `base X · ±N arm · +1 anc · +N evol` — sem "outros", sem adição automática de nível
  - Vínculos/Origem/Diário da Saga removidos do TelaJogo → movidos para `TelaSaga`
- [x] `PainelTrackerClasse` — tracker dedicado para todas as 9 classes
- [x] `TelaLevelUp` **Level up guiado** — visual overhaul completo:
  - Header banner com portrait + cor da classe + badge de nível/patamar
  - Cartas com barra lateral colorida por domínio + `Nv.X` dourado para Nv.5+ (usa `custo_recordacao`)
  - **Subclasse Aprimorada**: quando selecionada, expande mostrando `especializacao` (patamar 3) ou `maestria` (patamar 4) com card dourado + AnimatePresence
  - Todas as sub-seleções (Atributos, Experiências, Carta) com AnimatePresence, botão confirmar com `whileTap`
  - "Aumentar Evasão" incrementa `evasao_bonus_perm` + `evasao` (antes só incrementava `evasao`)
- [x] **Sala de Sessão** (Supabase Realtime):
  - GM: fichas ao vivo de todos jogadores, tracker de Medo, kick de jogadores
  - Jogador: ficha + sync debounced, detecção de kick, cleanup com `.catch(() => {})`
  - Entrada por código 6 dígitos sem login
  - Botões de voltar em `TelaAuthGM` e `TelaEntrarSala` (fixed top-left)
  - GM pode enviar loot diretamente ao inventário do jogador via broadcast `inventario_add`
  - **GeradorAdversarios**: campos Dificuldade/Limiares/ATQ/Arma/Alcance/Experiências/Habilidades, 10 funções com Pontos de Batalha, `STATS_PATAMAR` sugestão automática, `HABILIDADES_PRESET` por função
  - **TelaSalaGM** — `CirculoMedo` (SVG 12 pips, intensidade dinâmica, limiar em 3/6/9), `CartaoJogador` (portrait com acento de classe, diamantes Esperança, badge de severidade), `FichaExpandida` (portrait sempre presente)
  - **TelaSalaJogador** — Dado de Medo inline (SVG circular 120px), cards "Na Mesa" com portrait 36×44px
  - **Condições pelo GM**: `FichaExpandida` tem chips interativos (Escondido/Imobilizado/Vulnerável), envia broadcast `condition_update`; jogador aplica via `atualizarFn`
  - **Mensagem do Mestre**: GM escreve mensagem na aba Fichas → botão "Publicar" envia broadcast `gm_message`; jogador vê banner dourado dismissível no topo da aba Sala
  - **Reconexão automática**: `meuSlotId` persiste no Zustand ao "Sair" da sala → BottomNav roteia direto para `sala-jogador` sem redigitar código
  - **Supabase broadcast fix**: canais em `FerramentasGM` e `TelaSalaGM` agora só setam `canalRef.current` no callback `status === 'SUBSCRIBED'` — elimina falha silenciosa no primeiro envio
- [x] **Inventário dinâmico** em `TelaJogo`: adicionar/remover `ItemInventario`, badges por tipo, integração com loot da sala
- [x] **Migração de inventário** (`migrarInventario` em `storage.ts`): converte saves antigos `string[]` → `ItemInventario[]` automaticamente
- [x] **FerramentasGM** (`views/sessao/FerramentasGM.tsx`) — aba "Ferramentas" da sala GM: Adversários (PV ao vivo, habilidades, Pontos de Batalha), Contagens (progressiva/regressiva, visibilidade), Imagens (upload Supabase Storage + revelar), Objetivos (1d12), Ambiente (por patamar), Tesouro (1–4d12, item/consumível, revelar ou enviar ao inventário)
- [x] **BibliotecaGM** (`views/campanha/BibliotecaGM.tsx`) — aba "Biblioteca": histórico de sessões por número, registro de loot distribuído, export/import JSON da campanha
- [x] **store/campanha.ts** — Zustand: estado de campanha (sessões, loot, sessão ativa)
- [x] **TelaSalaGM** — 4 abas: Fichas (ao vivo), Ferramentas, Biblioteca, Roteiro (notas do GM)
- [x] **TelaJogo** — polish visual (sessões 4–5):
  - Portrait placeholder: Camera icon na cor da classe
  - Esperança: counter numérico + habilidade de Esperança como card com barra dourada
  - Tracker da Classe: movido para posição logo após Esperança (mais acessível em combate)
  - Experiências: barra lateral colorida + mod em destaque + botão "Usar" desabilitado sem Esperança
  - Armadura Ativa: header colorido + grid Limiares/PA Base/PA Atual + badge evasão_bonus
  - Vínculos e Origem exibidos quando preenchidos na criação
  - **Diário da Saga** (era "Notas de Sessão"): ícone BookOpen, textarea Inter 160px, quick-tags (+ Pista/NPC/Segredo/Objetivo), contador de palavras
  - `Secao` aceita prop `icone?: React.ReactNode`
- [x] **TelaSelecionarPersonagem**: `whileHover={{ x: 3 }}` + `whileTap={{ scale: 0.985 }}` + badge `Nv.X` com cor da classe
- [x] **PassoEquipamento**: armor cards exibem `evasao_bonus` como badge colorido (arcano = positivo, sangue = negativo); troca de armadura usa delta (`evasao += novoBonus - bonusAnterior`) preservando bônus permanentes
- [x] **PassoAtributos**: `recalcEvasao()` inclui `evasao_bonus_perm` — bônus de level-up preservados ao editar atributos
- [x] **TelaCriacao wizard inteligente**:
  - Passo inicial detectado automaticamente (último passo incompleto ou 9 se tudo preenchido) — editar ficha já não volta ao passo 1
  - Dots da barra de progresso são botões clicáveis para pular a qualquer passo diretamente
- [x] **Subclasse Aprimorada no TelaJogo**: seção "Subclasse" mostra Especialização (Patamar 3) e Maestria (Patamar 4) com ícone de cadeado quando bloqueadas e badge "✦ Desbloqueada" quando liberadas
- [x] **Mobile iPhone SE**: navbars de sessão (GM e jogador) corrigidas para `tracking-wide truncate` — "Ferramentas"/"Biblioteca" não transbordam mais em 375px

### Infra
- [x] Persistência localStorage com export/import JSON
- [x] Store Zustand com auto-save
- [x] PWA configurado com ícones 192/512/maskable gerados em `public/icons/`
- [x] Capacitor configurado (não adicionado plataforma ainda)
- [x] Tema Fatewake completo (paleta, fontes, classes utility, animações)
- [x] Supabase integrado (`lib/supabase.ts`, `store/sessao.ts`, `types/supabase.ts`)
- [x] `dominiosCores.ts` — mapa canônico de cores RGB dos 9 domínios (usado em PassoClasse, PassoCartas, TelaJogo)
- [x] App-level AnimatePresence com telas absolute-positioned (resolve stacking + sticky correto)

---

## 🚧 O que está PENDENTE (em ordem de prioridade)

### 🔴 Alta — para a mesa de jogo funcionar bem

1. **Testar fluxo de sessão end-to-end** — GM cria sala → jogador entra → sync ao vivo → loot vai pro inventário → kick funciona → GM adiciona condição → jogador recebe mensagem do mestre. Testar com Supabase real antes da próxima sessão de RPG. *(Parcialmente testado: criação de personagem via IP local funcionando após fix crypto.randomUUID)*

### 🟡 Médio — qualidade de vida na mesa

2. **Audit mobile completo** — navbars de sessão corrigidas, FerramentasGM e FichaExpandida auditadas sem overflow detectado. Falta validação em dispositivo físico com todos os fluxos.

### 🟢 Baixo — pós-estabilização

3. **Build APK / instalar como PWA** — instalar como PWA (Add to Home Screen) reduz agressividade do browser em matar a aba. Capacitor (`npm run cap:add:android`) quando PWA estiver estável.

4. **Multiclasse** — baixa prioridade, complexo, sem demanda imediata.

### ✅ Resolvido nessa sessão (21/05/2026)
- `crypto.randomUUID()` falha em HTTP não-localhost → `gerarUUID()` com fallback em `src/lib/uuid.ts`
- Reconexão após bloqueio de tela → `entrarSalaJogador()` persiste sessão no localStorage; `inicializar()` restaura no boot
- Broadcast Supabase (revelar item exige clique duplo) → canais só setados após `SUBSCRIBED`
- Wizard de criação volta ao passo 1 ao trocar de aba → lazy initializer detecta último passo incompleto
- Condições pelo GM → `FichaExpandida` com chips interativos, broadcast `condition_update`
- Mensagem do Mestre → GM publica via broadcast `gm_message`, jogador vê banner dourado dismissível
- Navbars de sessão iPhone SE → `tracking-wide truncate`
- Upload de imagens → RLS policies `session-images` bucket configuradas no Supabase
- Fórmula limiares `base + nível` → confirmada pela ficha física do Sage (Mago nível 1)

### Fora de escopo definitivo
- Dados digitais (app é para sessões presenciais — dados físicos na mesa)
- Mapas/battlemaps (Fatewake não é VTT)
- Multi-sistema (Fase 4+)
- Tema claro

---

## 📜 Convenções de código

### TypeScript
- **Strict mode** sempre ligado (`tsconfig.app.json`)
- Prefira `type` para uniões e shapes, `interface` para objetos/contratos extensíveis
- Não usar `any` — se realmente precisar, use `unknown` e narrow
- Nomes em PT-BR para domínio do jogo (`Personagem`, `Atributo`, `Carta`), inglês para infra (`Storage`, `useApp`)
- Tipo de chave do localStorage: declarado em `lib/storage.ts`

### Imports
- Sempre usar alias `@/` (configurado em `tsconfig.app.json` e `vite.config.ts`)
- Ordem: 1) React/libs externas, 2) `@/` internos, 3) types
- Importar dados sempre via `@/data` (loader central), não direto dos JSONs

### Componentes React
- Functional components com `export function NomeDoComponente`
- Props tipadas inline para componentes pequenos, interface separada para grandes
- Não usar `React.FC` (preferência atual da comunidade)
- Hooks customizados em `src/hooks/` quando lógica reusável

### Estilo
- **Sempre Tailwind**, nunca inline styles (`style={}`) — exceto valores dinâmicos calculados
- Usar classes utility do `index.css` (`.card`, `.card-ornate`, `.btn-primary`, `.section-header`, etc.)
- Tracking generoso em títulos (`tracking-wider` ou `tracking-[0.25em]`)
- `text-2xs` (10px) pra labels secundárias

### Persistência
- Componentes NUNCA chamam `localStorage` diretamente
- Usar `storage.*` de `lib/storage.ts`
- Usar `useApp()` (Zustand) para state em componentes
- Auto-save é automático (store chama `storage.salvarPersonagem` a cada mutação)

### Copy (textos da UI)
- Sempre PT-BR
- Tom narrativo épico mas não exagerado
- "Despertar" em vez de "Criar"
- "Sua saga", "O destino aguarda", "Companion narrativo"
- Termos do sistema sempre corretos: PV (não HP), PF (não Stress/MP), PA, Esperança, Medo, Dado do Destino, Dados de Dualidade

---

## ⚠️ Decisões importantes (não voltar atrás sem conversar)

1. **Daggerheart only na Fase 1.** Multi-sistema (Cthulhu, etc.) fica pra Fase 3+ se vier. Não confundir o MVP.
2. **PT-BR como idioma único.** Inglês fica pra depois.
3. **Dark-first.** Tema claro só se houver demanda real.
4. **localStorage para fichas, Supabase para sessão.** Persistência primária dos personagens segue localStorage. Supabase já está em uso para Sala de Sessão/Realtime, mas não substitui o storage local da ficha — esse refactor fica para Fase 3+. Componentes nunca chamam `localStorage` diretamente (`lib/storage.ts` é a única porta).
5. **Mobile-first.** Toda decisão de UX pondera: "como fica num celular médio na mesa do RPG?"
6. **Não competir com Demiplane.** Fatewake é companion narrativo, não VTT completo. Distinção importante:
   - **Mapas narrativos / imagens compartilhadas:** permitidos e já existem via FerramentasGM (aba Imagens).
   - **Battlemaps, grid, fog of war, VTT:** fora de escopo definitivo — isso é Foundry/Roll20 territory.
7. **PWA primeiro, Capacitor depois.** Não instalar plataforma nativa enquanto a web não estiver utilizável.
8. **Capacitor configurado mas não adicionado.** Quando for adicionar: `npm run cap:add:android` (precisa Android Studio). Não rodar isso ainda.
9. **Evasão base é por classe, não 10 universal.** Confirmado no livro: "Evasão inicial: cada classe tem sua própria Evasão inicial." Usar `classeData.evasao_base`, nunca hardcodar 10. Fórmula: `classeBase + armorBonus + ancestryBonus + evasao_bonus_perm`.
10. **Evasão NÃO sobe automaticamente com nível.** Só aumenta se o jogador escolher "Aumentar Evasão" no level-up. `evasao_bonus_perm` rastreia esse acúmulo explicitamente. Não implementar `EvasionModifier[]` — overengineered para o escopo.
11. **Limiares de dano: `limiaresEfetivos = p.limiares + p.nivel`.** `p.limiares` armazena `armor.limiares_base` e nunca é atualizado pelo TelaLevelUp (que só incrementa `p.nivel`). Fórmula automática no display. O livro diz "você sempre soma seu nível atual aos limiares de dano."

---

## 🧪 Roteiro de teste — próxima sessão de RPG

Antes de jogar, executar este checklist com Supabase real:

1. `npm run dev` — app sobe sem erros no console
2. GM cria sala → recebe código de 6 dígitos
3. Jogador entra com o código → aparece na lista do GM
4. Jogador altera PV/PF/Esperança → GM vê mudança ao vivo
5. GM envia loot → item aparece no inventário do jogador
6. GM faz kick → jogador é redirecionado para fora da sala
7. Verificar que ao sair da sala o personagem não perdeu dados
8. Audit mobile: abrir no celular físico (ou DevTools 375px) e navegar todos os fluxos

---

## 🔧 Comandos úteis

```bash
# Dev
npm install
npm run dev               # http://localhost:5173, acessível na rede local

# Build
npm run build             # gera dist/
npm run preview           # serve build local

# Capacitor (quando for ativar)
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

---

## 🧠 Contexto do dono do projeto

- **Nome:** Rui Machado, 36 anos, João Pessoa - PB
- **Perfil:** PMO Jr na BlendIT (consultoria SAP), gerencia clientes CDL e Norte Energia
- **Linguagens:** Confortável com JS/HTML/CSS, fez Flutter (Barbarela App). Não desenvolveu TS antes mas tem mindset técnico estruturado
- **Outras peças do contexto:** Constrói PMO Cockpit v6 (HTML standalone com Jira), está prototipando "Palavrinha do Céu" (app Catholic kids em Flutter+Firebase), tem business 3D printing PIXELFORGE 3D/FABRIKA3D
- **Personagem RPG:** Joga Vampire V5 (Tariq Al-Haq, Banu Haqim), narra Daggerheart "O Surto Selvagem"
- **Comunicação:** Direto, pragmático, gosta de trade-offs honestos. Não tem medo de tomar decisão grande, mas valoriza alguém apontar quando está expandindo escopo demais. Aprecia evenhanded analysis e push-back construtivo.

---

## 📝 Como esta conversa começou

O scaffold do projeto foi montado em conversa única na interface web do Claude (claude.ai), iterativamente:
1. Definição de stack (TS, Tailwind, Capacitor, Zustand)
2. Geração dos JSONs de dados a partir do PDF da ficha oficial
3. Decisão pela paleta Fatewake (inspirada em mockup do usuário "Círculo da Saga")
4. Branding Fatewake escolhido
5. Migração para Claude Code (este momento)

A partir daqui, **toda iteração de código acontece via Claude Code com você lendo este arquivo no início de cada sessão**.

---

## 🎬 Como começar uma nova sessão

1. **Leia este arquivo inteiro.**
2. Leia `README.md` para detalhes de instalação/setup.
3. Confirme o que está pronto rodando `npm run dev` (se ainda não rodou).
4. Pergunte ao Rui qual é a prioridade da sessão (geralmente vai estar no roadmap acima).
5. Antes de mudanças estruturais (mover pastas, mudar storage, trocar libs), **conversar primeiro**.
6. Após mudanças significativas, **atualizar este CLAUDE.md** com novo status.

---

**Última atualização:** 21 de maio de 2026 — Sessão de estabilização e teste real. Novidades: (1) `gerarUUID()` com fallback para HTTP não-localhost (fix crypto.randomUUID); (2) Reconexão após bloqueio de tela — sessão do jogador persiste no localStorage via `entrarSalaJogador()` + `inicializar()` no boot; (3) RLS policies do Supabase Storage (`session-images`) configuradas — upload de imagens funcionando; (4) Fórmula limiares `base + nível` confirmada pela ficha física do Sage. Pendente: teste end-to-end completo (loot, kick, condições, mensagem do mestre) + instalar como PWA para reduzir kills de aba pelo browser mobile.
