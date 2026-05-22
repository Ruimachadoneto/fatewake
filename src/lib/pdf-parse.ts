// Parser posicional de fichas Daggerheart (template Jambô 2025 PT-BR).
// Recebe itens de texto com coordenadas (x, y) e reconstrói os campos
// usando a posição relativa (rótulo em cima, valor logo abaixo, em colunas).
// SEM dependência de pdfjs — testável em Node. A extração fica em pdf-import.ts.

export interface ItemTexto {
  str: string;
  x: number;   // canto esquerdo
  y: number;   // base da linha (maior = mais ao topo da página)
  w: number;
  fonte?: string; // fontName do pdfjs — distingue pergunta (negrito) de resposta (itálico)
}

export interface ArmaRaw {
  nome: string;
  atributo: string;
  alcance: string;
  dado: string;
  tipo: 'Físico' | 'Mágico' | '';
  habilidade: string;
}

export interface FichaPDF {
  nome: string;
  genero: string;
  classe: string;
  subclasse: string;
  nivel: number;
  ancestralidade: string;
  comunidade: string;
  atributos: {
    agilidade: number;
    forca: number;
    acuidade: number;
    instinto: number;
    presenca: number;
    conhecimento: number;
  };
  evasao: number;
  pv_max: number;
  limiares_display: [number, number]; // [menor, maior] exibidos no PDF
  armadura_nome: string;
  armadura_limiares: [number, number];
  armadura_base: number;
  armadura_evasao_bonus: number;
  arma_principal: ArmaRaw;
  arma_secundaria: ArmaRaw;
  experiencias: { nome: string; mod: number }[];
  inventario: string[];
  cartas_nomes: string[];
  conceito_central: string;
  respostas_origem: string[];
}

const NOMES_CLASSES = ['BARDO', 'DRUIDA', 'FEITICEIRO', 'GUARDIÃO', 'GUERREIRO', 'LADINO', 'MAGO', 'PATRULHEIRO', 'SERAFIM'];
const ALCANCES = ['Muito distante', 'Corpo a corpo', 'Muito próximo', 'Próximo', 'Distante'];
const ATRIBUTOS_NOMES = ['Agilidade', 'Força', 'Acuidade', 'Instinto', 'Presença', 'Conhecimento'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Normaliza removendo espaços internos (lida com "SUBCL ASSE", "ARM ADURA", "H ABILIDADE")
function norm(s: string): string {
  return s.replace(/\s+/g, '').toUpperCase();
}

function titleCase(s: string): string {
  // Maiúscula no início e após espaço (\b é ASCII-only e quebra com acentos)
  return s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, sep, c) => sep + (c as string).toUpperCase()).trim();
}

function parseNum(s: string, fallback = 0): number {
  const m = s.match(/-?\d+/);
  return m ? parseInt(m[0], 10) : fallback;
}

// Corrige ligaduras tipográficas que o pdfjs separa em itens próprios
// ("Pro fi ciência" → "Proficiência", "Petri fi cação" → "Petrificação")
function limparLigaduras(s: string): string {
  return s
    .replace(/(\p{Ll}) (ffi|ffl|fi|fl|ff) (\p{Ll})/gu, '$1$2$3')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function acharLabel(items: ItemTexto[], alvo: string): ItemTexto | undefined {
  const a = norm(alvo);
  return items.find(it => norm(it.str) === a);
}

// Itens dentro de uma região retangular, ordenados topo→baixo, esquerda→direita
function regiao(
  items: ItemTexto[],
  box: { xMin: number; xMax: number; yMin: number; yMax: number },
  excluir: ItemTexto[] = [],
): ItemTexto[] {
  return items
    .filter(it =>
      it.x >= box.xMin && it.x <= box.xMax &&
      it.y >= box.yMin && it.y <= box.yMax &&
      !excluir.includes(it))
    .sort((a, b) => (Math.abs(b.y - a.y) > 3 ? b.y - a.y : a.x - b.x));
}

// Itens logo abaixo de um rótulo (mesma coluna), mais próximo primeiro
function abaixo(items: ItemTexto[], ref: ItemTexto, dx: number, dyMax: number): ItemTexto[] {
  return items
    .filter(it => it !== ref && it.y < ref.y && ref.y - it.y <= dyMax && Math.abs(it.x - ref.x) <= dx)
    .sort((a, b) => b.y - a.y);
}

// ─── Parser principal ──────────────────────────────────────────────────────────

export function parseFicha(paginas: ItemTexto[][]): FichaPDF {
  const p1 = paginas[0] ?? [];
  const p2 = paginas[1] ?? [];

  const r: FichaPDF = {
    nome: '', genero: '', classe: '', subclasse: '', nivel: 1,
    ancestralidade: '', comunidade: '',
    atributos: { agilidade: 0, forca: -1, acuidade: 0, instinto: 0, presenca: 0, conhecimento: 0 },
    evasao: 10, pv_max: 6,
    limiares_display: [0, 0],
    armadura_nome: '', armadura_limiares: [0, 0], armadura_base: 3, armadura_evasao_bonus: 0,
    arma_principal: { nome: '', atributo: '', alcance: '', dado: '', tipo: '', habilidade: '' },
    arma_secundaria: { nome: '', atributo: '', alcance: '', dado: '', tipo: '', habilidade: '' },
    experiencias: [], inventario: [], cartas_nomes: [],
    conceito_central: '', respostas_origem: [],
  };

  const lblNome = acharLabel(p1, 'NOME');
  const lblHeranca = acharLabel(p1, 'HERANÇA');
  const lblGenero = acharLabel(p1, 'GÊNERO');
  const lblSub = acharLabel(p1, 'SUBCLASSE');
  const lblNivel = acharLabel(p1, 'NÍVEL');
  const lblAgil = acharLabel(p1, 'AGILIDADE');
  const yAtributos = lblAgil?.y ?? 636;

  // ── NOME ──
  if (lblNome) {
    const yMin = (lblHeranca?.y ?? lblNome.y - 90) + 10;
    const partes = regiao(p1, { xMin: lblNome.x - 5, xMax: lblNome.x + 130, yMin, yMax: lblNome.y - 8 }, [lblNome]);
    r.nome = titleCase(partes.map(i => i.str).join(' '));
  }

  // ── GÊNERO ──
  if (lblGenero) {
    const v = abaixo(p1, lblGenero, 60, 40)[0];
    if (v) r.genero = v.str.trim();
  }

  // ── CLASSE (texto grande no topo-direita, não rotulado) ──
  const classeItem = p1.find(it => it.y > 760 && it.x > 410 && NOMES_CLASSES.includes(norm(it.str)));
  if (classeItem) r.classe = titleCase(classeItem.str);

  // ── SUBCLASSE ──
  if (lblSub) {
    const partes = regiao(p1, { xMin: lblSub.x - 5, xMax: lblSub.x + 150, yMin: yAtributos + 8, yMax: lblSub.y - 6 }, [lblSub]);
    r.subclasse = titleCase(partes.map(i => i.str).join(' '));
  }

  // ── NÍVEL ──
  if (lblNivel) {
    const v = abaixo(p1, lblNivel, 35, 45).find(i => /^\d+$/.test(i.str.trim()));
    if (v) r.nivel = parseInt(v.str, 10);
  }

  // ── HERANÇA → ancestralidade / comunidade ──
  if (lblHeranca) {
    const v = abaixo(p1, lblHeranca, 100, 45)[0];
    if (v) {
      const partes = v.str.split('/').map(s => s.trim());
      r.ancestralidade = titleCase(partes[0] ?? '');
      r.comunidade = titleCase(partes[1] ?? '');
    }
  }

  // ── ATRIBUTOS ──
  const attrMap: [string, keyof FichaPDF['atributos']][] = [
    ['AGILIDADE', 'agilidade'], ['FORÇA', 'forca'], ['ACUIDADE', 'acuidade'],
    ['INSTINTO', 'instinto'], ['PRESENÇA', 'presenca'], ['CONHECIMENTO', 'conhecimento'],
  ];
  for (const [label, key] of attrMap) {
    // Pode haver "CONHECIMENTO" duas vezes (atributo e subclasse). Pega o da linha de atributos.
    const lbls = p1.filter(it => norm(it.str) === label && Math.abs(it.y - yAtributos) <= 6);
    const lbl = lbls[0] ?? acharLabel(p1, label);
    if (!lbl) continue;
    const v = abaixo(p1, lbl, 55, 45).find(i => /^[+-]?\d+$/.test(i.str.trim()));
    if (v) r.atributos[key] = parseInt(v.str, 10);
  }

  // ── EVASÃO ──
  const lblEvasao = acharLabel(p1, 'EVASÃO');
  if (lblEvasao) {
    const v = abaixo(p1, lblEvasao, 50, 50).find(i => /^\d+$/.test(i.str.trim()));
    if (v) r.evasao = parseInt(v.str, 10);
  }

  // ── ARMADURA (combate) ──
  const lblArmadura = acharLabel(p1, 'ARMADURA');
  if (lblArmadura) {
    const v = abaixo(p1, lblArmadura, 50, 50).find(i => /^\d+$/.test(i.str.trim()));
    if (v) r.armadura_base = parseInt(v.str, 10);
  }

  // ── LIMIARES exibidos ──
  // Formato A: itens "7 (Menor)", "14 (Maior)"
  const itMenor = p1.find(i => /\(Menor\)/i.test(i.str));
  const itMaior = p1.find(i => /\(Maior\)/i.test(i.str));
  if (itMenor && /\d/.test(itMenor.str)) {
    r.limiares_display = [parseNum(itMenor.str), itMaior ? parseNum(itMaior.str) : 0];
  } else {
    // Formato B: rótulos MENOR / MAIOR com números abaixo
    const lblMenor = acharLabel(p1, 'MENOR');
    const lblMaior = acharLabel(p1, 'MAIOR');
    if (lblMenor) {
      const vm = abaixo(p1, lblMenor, 30, 40).find(i => /^\d+$/.test(i.str.trim()));
      const vM = lblMaior ? abaixo(p1, lblMaior, 30, 40).find(i => /^\d+$/.test(i.str.trim())) : undefined;
      r.limiares_display = [vm ? parseInt(vm.str, 10) : 0, vM ? parseInt(vM.str, 10) : 0];
    }
  }

  // ── PV MÁX ──
  const itPv = p1.find(i => /PV\s*\(MAX\s*\d+\)/i.test(i.str));
  if (itPv) r.pv_max = parseInt(itPv.str.match(/MAX\s*(\d+)/i)?.[1] ?? '6', 10);

  // ── ARMAS ──
  const lblPrinc = p1.find(i => /^PRINCIPAL$/i.test(i.str.trim()));
  const lblSec = p1.find(i => /^SECUND/i.test(i.str.trim()));
  if (lblPrinc) r.arma_principal = lerArma(p1, lblPrinc);
  if (lblSec) r.arma_secundaria = lerArma(p1, lblSec);

  // ── EXPERIÊNCIAS ──
  const lblExp = acharLabel(p1, 'EXPERIÊNCIAS');
  if (lblExp) {
    const reg = regiao(p1, { xMin: 28, xMax: 205, yMin: 238, yMax: lblExp.y - 4 });
    const mods = reg.filter(i => /^\+\d+$/.test(i.str.trim()));
    for (const mod of mods) {
      const nomeItens = reg
        .filter(i => i.x > 55 && Math.abs(i.y - mod.y) <= 20 && !/^\+\d+$/.test(i.str.trim()))
        .sort((a, b) => b.y - a.y);
      const nome = titleCase(nomeItens.map(i => i.str).join(' '));
      if (nome.length > 1) r.experiencias.push({ nome, mod: parseNum(mod.str) });
    }
    r.experiencias = r.experiencias.slice(0, 4);
  }

  // ── ARMADURA ATIVA ──
  const lblAA = acharLabel(p1, 'ARMADURA ATIVA');
  const lblLimBase = acharLabel(p1, 'LIMIARES BASE');
  if (lblAA) {
    const yMinNome = lblLimBase?.y ?? lblAA.y - 50;
    const nomeItens = regiao(p1, { xMin: lblAA.x - 12, xMax: lblAA.x + 130, yMin: yMinNome + 4, yMax: lblAA.y - 6 });
    r.armadura_nome = titleCase(nomeItens.map(i => i.str).join(' '));

    if (lblLimBase) {
      // "6 / 13" na coluna esquerda da seção
      const limItem = abaixo(p1, lblLimBase, 60, 40).find(i => /\d+\s*\/\s*\d+/.test(i.str));
      if (limItem) {
        const nums = limItem.str.match(/\d+/g);
        if (nums && nums.length >= 2) r.armadura_limiares = [parseInt(nums[0]), parseInt(nums[1])];
      }
      // base = número à direita
      const lblArmBase = acharLabel(p1, 'ARMADURA BASE');
      if (lblArmBase) {
        const baseItem = abaixo(p1, lblArmBase, 50, 40).find(i => /^\d+$/.test(i.str.trim()));
        if (baseItem) r.armadura_base = parseInt(baseItem.str, 10);
      }
    }
    // bônus de evasão da armadura
    const tagItem = regiao(p1, { xMin: lblAA.x - 12, xMax: lblAA.x + 180, yMin: 238, yMax: lblAA.y })
      .find(i => /Flexível|Rígida|Pesada/i.test(i.str));
    if (tagItem) {
      if (/Flexível/i.test(tagItem.str)) r.armadura_evasao_bonus = 1;
      else if (/Rígida/i.test(tagItem.str)) r.armadura_evasao_bonus = -1;
      else if (/Pesada/i.test(tagItem.str)) r.armadura_evasao_bonus = -2;
    }
  }

  // ── INVENTÁRIO ──
  const lblInv = acharLabel(p1, 'INVENTÁRIO');
  if (lblInv) {
    const reg = regiao(p1, { xMin: lblInv.x - 15, xMax: 600, yMin: 170, yMax: lblInv.y - 6 });
    const itens: string[] = [];
    let prevY = Infinity;
    for (const it of reg) {
      const txt = it.str.replace(/^[•\-\*]\s*/, '').trim();
      if (!txt || /^Custo:/i.test(txt)) continue;
      const gap = prevY - it.y;
      // Continuação de linha quebrada: minúscula E muito próxima da anterior (~13px)
      if (itens.length && gap < 15 && /^[a-zà-ú]/.test(txt)) {
        itens[itens.length - 1] += ' ' + txt;
      } else {
        itens.push(txt);
      }
      prevY = it.y;
    }
    r.inventario = itens;
  }

  // ── CARTAS (ambas as páginas) ──
  const nomesCartas: string[] = [];
  for (const pg of [p1, p2]) {
    for (const it of pg) {
      const tipoAbaixo = pg.find(o =>
        o !== it && Math.abs(o.x - it.x) <= 14 && it.y - o.y > 4 && it.y - o.y <= 20 &&
        /^(FEITIÇO|TALENTO|GRIMÓRIO)\s+D[OA]\s+/i.test(o.str));
      if (tipoAbaixo && it.str.trim().length > 2 && !/^Custo:/i.test(it.str)) {
        nomesCartas.push(it.str.trim());
      }
    }
  }
  r.cartas_nomes = [...new Set(nomesCartas)];

  // ── ORIGEM (página 2) ──
  const lblConceito = acharLabel(p2, 'CONCEITO CENTRAL');
  if (lblConceito) {
    const v = abaixo(p2, lblConceito, 80, 30)[0];
    if (v) r.conceito_central = v.str.trim();
  }
  // Perguntas vs respostas pela FONTE: perguntas são negrito, respostas itálico.
  // Detecta a fonte das perguntas pelos itens que terminam com "?".
  // Tudo que não for fonte-de-pergunta (abaixo do conceito) é conteúdo de resposta.
  const yConceito = lblConceito ? (abaixo(p2, lblConceito, 80, 30)[0]?.y ?? lblConceito.y) : Infinity;
  const fontesPergunta = new Set(
    p2.filter(i => i.x < 290 && i.str.trim().endsWith('?') && i.fonte).map(i => i.fonte as string),
  );
  if (fontesPergunta.size > 0) {
    const origemItens = p2
      .filter(it => it.x < 290 && it.y < yConceito - 2)
      .sort((a, b) => (Math.abs(b.y - a.y) > 3 ? b.y - a.y : a.x - b.x));
    const respostas: string[] = [];
    let atual: string[] = [];
    for (const it of origemItens) {
      if (it.fonte && fontesPergunta.has(it.fonte)) {
        // linha de pergunta = fronteira
        if (atual.length) { respostas.push(limparLigaduras(atual.join(' '))); atual = []; }
      } else {
        atual.push(it.str);
      }
    }
    if (atual.length) respostas.push(limparLigaduras(atual.join(' ')));
    r.respostas_origem = respostas.filter(s => s.length > 1).slice(0, 5);
  }

  return r;
}

function lerArma(items: ItemTexto[], lbl: ItemTexto): ArmaRaw {
  const arma: ArmaRaw = { nome: '', atributo: '', alcance: '', dado: '', tipo: '', habilidade: '' };
  const banda = { yMin: lbl.y - 14, yMax: lbl.y + 10 };

  const col = (xMin: number, xMax: number) =>
    items
      .filter(i => i.x >= xMin && i.x < xMax && i.y >= banda.yMin && i.y <= banda.yMax && i !== lbl)
      .sort((a, b) => b.y - a.y)
      .map(i => i.str.trim())
      .join(' ')
      .trim();

  const nome = col(58, 205);
  const atribAlc = col(205, 295);
  const dano = col(295, 382);
  const hab = col(382, 600);

  if (!nome || nome === '—') return arma;
  arma.nome = titleCase(nome);

  // atributo / alcance
  for (const a of ATRIBUTOS_NOMES) {
    if (atribAlc.toLowerCase().includes(a.toLowerCase())) { arma.atributo = a; break; }
  }
  for (const a of ALCANCES) {
    if (atribAlc.toLowerCase().includes(a.toLowerCase())) { arma.alcance = a; break; }
  }

  // dado + tipo
  const dadoMatch = dano.match(/d\d+(?:[+-]\d+)?/i);
  if (dadoMatch) arma.dado = dadoMatch[0];
  if (/Mágico/i.test(dano)) arma.tipo = 'Mágico';
  else if (/Físico/i.test(dano)) arma.tipo = 'Físico';

  arma.habilidade = hab === '—' ? '' : hab;
  return arma;
}
