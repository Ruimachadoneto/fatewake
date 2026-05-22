# 🚀 Guia de Transição — Fatewake → Claude Code

Este documento te leva do **zip atual** até **Claude Code rodando no VS Code com o projeto**, passo a passo. Você é o Rui, no Windows, com VS Code já instalado.

---

## ✅ Checklist rápido (resumo)

- [ ] 1. Descompactar o `fatewake.zip` em uma pasta do seu PC
- [ ] 2. Verificar pré-requisitos (Node.js, Git)
- [ ] 3. Instalar Claude Code (extensão VS Code)
- [ ] 4. Abrir projeto no VS Code
- [ ] 5. Rodar `npm install` e `npm run dev` pra confirmar que funciona
- [ ] 6. Autenticar Claude Code com sua conta Pro/Max
- [ ] 7. Iniciar primeira sessão com o prompt de continuidade

Tempo estimado: **15-30 minutos** (depende se vai precisar instalar Node).

---

## 1. Descompactar o projeto

1. Mova `fatewake.zip` para uma pasta de projetos no seu PC, ex: `C:\Users\Rui Neto\dev\fatewake\`
2. Descompacte. Você deve ver a estrutura:
   ```
   fatewake/
   ├── CLAUDE.md
   ├── README.md
   ├── package.json
   ├── src/
   ├── public/
   └── ... (outros arquivos)
   ```

---

## 2. Pré-requisitos no Windows

### Node.js 18+
Verifique no PowerShell:
```powershell
node --version
```
Se aparecer `v18.x.x` ou maior → ok. Se não, baixe e instale: https://nodejs.org/ (escolha a versão LTS)

### Git
```powershell
git --version
```
Se aparecer versão → ok. Se não, instale: https://git-scm.com/download/win
(Aceite todas as opções padrão durante a instalação. **Importante:** confirme que "Git from the command line and also from 3rd-party software" está selecionado — é o padrão)

### VS Code
Você já tem, mas confirme que está versão recente (1.85+). Em VS Code: `Help → About`.

---

## 3. Instalar Claude Code (recomendado: extensão VS Code)

Existem duas formas — vou recomendar a extensão por ser mais visual e estável para iniciante.

### Opção A — Extensão VS Code (recomendada)

1. Abra VS Code
2. Pressione `Ctrl+Shift+X` (abre Extensions)
3. Pesquise: **Claude Code**
4. Encontre a extensão oficial da **Anthropic** e clique **Install**
5. Após instalar, reinicie o VS Code (`Developer: Reload Window` no Command Palette `Ctrl+Shift+P`)

A extensão adiciona:
- Painel lateral com Spark icon (✨) para conversar com Claude
- Botão Spark no canto superior direito do editor
- Diffs visuais para mudanças propostas
- @-mentions para referenciar arquivos

### Opção B — CLI no terminal (alternativa)

Se preferir terminal puro:

```powershell
# Em PowerShell como admin
irm https://claude.ai/install.ps1 | iex
```

Aí você roda `claude` no terminal do VS Code. Mas a extensão é mais amigável para começar.

---

## 4. Abrir projeto no VS Code

1. VS Code → `File → Open Folder` → selecione `fatewake/` (não o zip, a pasta descompactada)
2. Se aparecer "Do you trust the authors of the files in this folder?" → **Yes, I trust the authors**
3. Você deve ver toda a estrutura na barra lateral esquerda

---

## 5. Rodar o projeto pra confirmar que funciona

Abra o terminal integrado (`Ctrl+Shift+\`` ou `View → Terminal`):

```powershell
# Na raiz do projeto fatewake/
npm install
```

Vai demorar 1-2 minutos. Vai baixar dependências, criar pasta `node_modules`. **Pode aparecer alguns warnings — não tem problema, contanto que não tenha erro vermelho fatal.**

Em seguida:

```powershell
npm run dev
```

Você deve ver:
```
  VITE v5.x.x  ready in ___ ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Abra http://localhost:5173 no navegador. Você deve ver:
- Header "FATEWAKE" dourado
- Hero "SUA SAGA COMEÇA AQUI"
- Botão "Despertar primeiro herói"

**Se algo quebrar nesse passo**, screenshot o erro e compartilhe na primeira mensagem do Claude Code — ele vai consertar.

### Bônus: testar no celular

Na mesma rede Wi-Fi, abra http://192.168.x.x:5173 (o IP que apareceu em "Network") no Chrome/Safari do celular. Você verá o app rodando como vai ficar quando publicar.

---

## 6. Autenticar Claude Code

1. Na barra lateral do VS Code, clique no Spark icon (✨)
2. Clique **Sign in**
3. Vai abrir o navegador → autorize com sua conta Pro/Max
4. Volte ao VS Code → deve aparecer "Logged in"

**Se aparecer "Not logged in · Please run /login later"**: feche e reabra o VS Code, ou rode `Developer: Reload Window` no Command Palette.

---

## 7. Primeira sessão com Claude Code

Abra o painel do Claude Code (Spark icon) e cole **exatamente** o seguinte prompt:

```
Continuando o projeto Fatewake (companion narrativo para Daggerheart RPG, PT-BR, mobile-first).

POR FAVOR:
1. Leia primeiro o CLAUDE.md na raiz — ele tem visão, decisões, stack, status atual e roadmap
2. Leia o README.md
3. Faça um scan rápido de src/ pra entender a estrutura
4. Me dê um resumo do que está pronto e qual deve ser o próximo passo segundo o roadmap

Não comece a codar ainda — primeiro confirme que entendeu o estado atual. Depois conversamos sobre prioridade.
```

Ele vai ler os arquivos, sintetizar, e devolver o que está pronto + sugerir próximo passo. A partir daí, você direciona.

---

## 💡 Dicas de uso (do dia 2 em diante)

### Workflow recomendado

1. **Antes de codar**: discuta o que vai fazer. "Quero adicionar o passo 1 do wizard (escolher classe). Como sugere estruturar?"
2. **Claude propõe**: ele te diz a abordagem antes de tocar em arquivo
3. **Você aprova**: "vai" ou "ajuste X"
4. **Claude executa**: edita arquivos, você vê os diffs antes de aceitar
5. **Testa**: roda `npm run dev` (Claude pode rodar), você abre o browser e valida

### Comandos úteis no Claude Code

- `/clear` — limpa o contexto da conversa (use quando trocar de feature)
- `/help` — ajuda
- `@arquivo.tsx` — referencia um arquivo específico no prompt
- Selecione código no editor → ele vira contexto automático

### Quando parar e voltar pro chat web (claude.ai)

- Decisões de produto/escopo grandes
- Pesquisa de UX/concorrentes
- Brainstorm de features futuras
- Quando você não está no PC

### Manter o CLAUDE.md atualizado

A cada feature grande concluída, peça: **"atualize o CLAUDE.md refletindo o que está pronto agora"**. Isso é a memória do projeto entre sessões.

---

## 🆘 Problemas comuns

### `'claude' não é reconhecido` (apenas CLI)
PATH não foi atualizado. Feche todos os terminais, reabra o VS Code, tente de novo. Se persistir: https://docs.claude.com/en/docs/claude-code

### Extensão não aparece após instalar
Command Palette (`Ctrl+Shift+P`) → `Developer: Reload Window`

### `npm install` falha
- Verifique versão do Node: `node --version` (precisa ser 18+)
- Tente: `npm install --legacy-peer-deps`
- Se ainda falhar: cole o erro pro Claude resolver

### Localhost não abre
- Outro processo na 5173? Vite vai sugerir 5174 automaticamente
- Antivírus/Windows Defender bloqueando? Adicione exceção pra `node.exe`

### Build do Capacitor não funciona ainda
**Não tente Capacitor agora.** Foque na PWA web primeiro. Capacitor entra quando a Fase 1 estiver completa.

---

## 📦 O que vem depois (próximas sessões)

Na ordem natural, sua primeira sessão real de desenvolvimento via Claude Code deve cobrir:

1. **Validar que rodou ok** (passos 1-5 acima)
2. **Pedir Claude pra ler o CLAUDE.md e dar status** (passo 7)
3. **Subir o `DH-Baralho.pdf` no chat** e pedir: "extraia as cartas nível 2 dos 9 domínios e popule `src/data/cartas/nivel-2.json`"
4. **Começar o wizard de criação**: "vamos começar o passo 1 do wizard — escolher classe + subclasse. Sugira a interface."

A partir daí, é iterativo. Você vai construir junto.

---

## 🎯 Filosofia da transição

O chat web (claude.ai) foi ótimo pra **decisões de arquitetura, definição de produto e geração do scaffold inicial**. Agora o trabalho vira **execução de código**, e o Claude Code é dramaticamente mais eficiente pra isso: vê o filesystem, edita direto, roda comandos.

Mantenha o chat web aberto pra **conversas estratégicas** quando precisar pensar grande. Use Claude Code pra **toda a parte de mãos no código**.

Sucesso, Rui. A saga começa agora. ⚔️
