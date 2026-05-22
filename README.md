# Fatewake

**Sua história. O destino responde.**

Companion narrativo para Daggerheart RPG, em PT-BR, mobile-first (PWA + Capacitor para Android/iOS).

**Status:** Fase 1 — scaffold inicial com identidade visual Fatewake. Próximas sessões preenchem o wizard de criação e o dashboard de jogo.

## Identidade

- **Nome:** Fatewake
- **Tagline:** Sua história. O destino responde.
- **Paleta:** Azul-noite cósmico (#0B0F1A) · Violeta arcano (#2A1B3D, #4B2E83) · Dourado destino (#D4AF37) · Sangue (#9D1F2D) · Pergaminho luminoso (#E8DFCF)
- **Tipografia:** Cinzel (títulos épicos, espaçada) · Inter (UI, leitura)

## Stack

- Vite 5 + React 18 + TypeScript
- Tailwind v3 (paleta Fatewake completa) + Framer Motion
- Zustand (state management leve)
- Vite PWA Plugin (offline-ready)
- Capacitor 6 (build nativo Android/iOS)
- Lucide React (ícones)
- @fontsource (Cinzel + Inter, offline)

## Começar a desenvolver

```bash
npm install
npm run dev   # http://localhost:5173
```

Para celular na mesma rede, o Vite serve em `0.0.0.0:5173` — você consegue testar diretamente no seu celular abrindo `http://<ip-do-seu-pc>:5173`.

## Estrutura

```
src/
├── App.tsx                   # Shell + toggle Criação/Jogo
├── main.tsx                  # Entry point
├── index.css                 # Tailwind + tema Fatewake + classes utility
├── data/                     # JSONs de referência (tipados)
│   ├── classes.json          # 9 classes Daggerheart
│   ├── subclasses.json       # 18 subclasses
│   ├── ancestralidades.json  # 19 ancestralidades
│   ├── comunidades.json      # 9 comunidades
│   ├── formas-fera.json      # Druida
│   ├── companheiro-animal.json  # Patrulheiro
│   ├── levelup.json          # Sistema de patamares
│   ├── index.ts              # Loader central tipado
│   └── cartas/
│       ├── nivel-1.json      # 24 cartas dos 9 domínios
│       └── nivel-2.json      # próxima fatia
├── types/
│   ├── personagem.ts         # Modelo do Personagem + novoPersonagem()
│   └── dados.ts              # Tipos dos JSONs
├── lib/
│   └── storage.ts            # localStorage + export/import JSON
├── store/
│   └── app.ts                # Zustand
├── components/
│   ├── ui/HeaderApp.tsx
│   ├── personagem/           # (a preencher)
│   └── jogo/                 # (a preencher)
└── views/
    ├── TelaSelecionarPersonagem.tsx
    ├── criacao/TelaCriacao.tsx
    └── jogo/TelaJogo.tsx
```

## Sistema visual

Classes utility prontas no `index.css`:

- `.card` / `.card-elevated` / `.card-ornate` / `.card-gold` / `.card-arcane` / `.card-blood`
- `.btn` / `.btn-primary` / `.btn-danger` / `.btn-arcane`
- `.input` / `.label` / `.label-gold`
- `.section-header` + `.section-title` (linha dourada decorativa)
- `.icon-glow-gold` / `.icon-glow-blood` / `.icon-glow-arcane`
- `.bg-starfield` (estrelas decorativas)
- `.display-xl` (Cinzel + tracking dourado)

Animações Tailwind: `animate-pulse-glow`, `animate-pulse-fear`, `animate-float`, `animate-shimmer`, `animate-shake`.

## Build mobile (Capacitor)

```bash
npm run cap:add:android   # precisa Android Studio
npm run cap:add:ios       # precisa Mac + Xcode

npm run cap:sync          # build + sync após mudanças
npm run cap:open:android  # abre projeto no Android Studio
npm run cap:open:ios      # abre projeto no Xcode
```

## PWA — instalar no celular

1. Acesse o app via `https://` (após deploy: Netlify/Vercel)
2. Chrome/Safari → "Adicionar à tela inicial"
3. Abre fullscreen como nativo, funciona offline

## Próximos passos

### Prioridade imediata (próxima conversa)
- [ ] Extrair cartas nível 2 do PDF do Baralho
- [ ] Wizard de Criação (9 passos)
- [ ] Dashboard de Jogo completo
- [ ] Ícones PWA (3 PNGs: 192, 512, 512-maskable)

### Roadmap Fase 1 (MVP de campo — até sessão 4)
- [x] Scaffold + tipos + dados + storage + store
- [x] Identidade visual Fatewake
- [ ] Wizard de criação completo
- [ ] Dashboard de jogo completo
- [ ] Trackers específicos de classe

### Fase 2
- Cartas níveis 3-10
- Subclasse Aprimorada + Multiclasse
- Equipamentos completos
- Condições (Vulnerável, Imobilizado, Envenenado, etc.)

### Fase 3 — Visão grande "companion narrativo"
- Salas/campanhas multi-usuário (Supabase)
- Real-time (presença, rolagens compartilhadas)
- Mapas e battlemaps
- Registros de campanha
- Galeria de imagens/pistas
- Rastreador de Medo do mestre

## Créditos

Daggerheart © Jambô Editora 2025. Textos de regras reproduzidos/parafraseados para fins de companion não-comercial.

Fatewake é um projeto independente, sem afiliação oficial com a Jambô Editora ou Critical Role / Darrington Press.
