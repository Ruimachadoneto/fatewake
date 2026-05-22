// Parser de fichas Daggerheart em PDF para FichaPDF intermediário.
// Suporta o template PDF usado pelo grupo do Rui (Jambô 2025 PT-BR).
// A tela de revisão cuida de qualquer campo que não tenha sido extraído corretamente.

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

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
  // Limiares EXIBIDOS no PDF (menor, maior) — base = display - nivel
  limiares_display: [number, number];
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

// ─── Constantes ────────────────────────────────────────────────────────────────

const NOMES_CLASSES = ['BARDO', 'DRUIDA', 'FEITICEIRO', 'GUARDIÃO', 'GUERREIRO', 'LADINO', 'MAGO', 'PATRULHEIRO', 'SERAFIM'];

const SECTION_LABELS = new Set([
  'NOME', 'GÊNERO', 'HERANÇA', 'SUBCLASSE', 'NÍVEL', 'AGILIDADE', 'FORÇA', 'ACUIDADE',
  'INSTINTO', 'PRESENÇA', 'CONHECIMENTO', 'EVASÃO', 'ARMADURA', 'LIMIARES DE DANO',
  'SAÚDE & DANO', 'MENOR MAIOR GRAVE', 'PF', 'ARMAS ATIVAS', 'EXPERIÊNCIAS',
  'ARMADURA ATIVA', 'LIMIARES BASE', 'ARMADURA BASE', 'LIMIARES BASE ARMADURA BASE',
  'INVENTÁRIO', 'HABILIDADES DE CLASSE', 'HABILIDADE DE ESPERANÇA',
  'CARTAS DE DOMÍNIO (NÍVEL 1)', 'HISTÓRICO & ORIGEM', 'CONCEITO CENTRAL',
  'TIPO', 'ATRIB. & ALCANCE', 'DANO & TIPO', 'HABILIDADE', 'ANCESTRALIDADE', 'COMUNIDADE',
  'COMEÇA EM 11', 'COMEÇA EM 13',
]);

function isSectionLabel(s: string): boolean {
  return SECTION_LABELS.has(s.trim().toUpperCase()) || NOMES_CLASSES.includes(s.trim().toUpperCase());
}

const ALCANCES = ['Corpo a corpo', 'Muito próximo', 'Próximo', 'Distante', 'Muito distante'];
const ATRIBUTOS_NOMES = ['Agilidade', 'Força', 'Acuidade', 'Instinto', 'Presença', 'Conhecimento'];

function parseNum(s: string, fallback = 0): number {
  const n = parseInt(s.replace('+', '').trim(), 10);
  return isNaN(n) ? fallback : n;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim();
}

// ─── Extração de texto ─────────────────────────────────────────────────────────

async function extrairLinhas(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;

  const todasLinhas: string[] = [];

  for (let pg = 1; pg <= pdf.numPages; pg++) {
    const page = await pdf.getPage(pg);
    const content = await page.getTextContent();
    const items = (content.items as { str: string; transform: number[] }[])
      .filter(i => i.str.trim().length > 0);

    // Ordenar por y descendente (topo primeiro), depois x
    items.sort((a, b) => {
      const dy = b.transform[5] - a.transform[5];
      if (Math.abs(dy) > 4) return dy;
      return a.transform[4] - b.transform[4];
    });

    // Agrupar em linhas (y dentro de ±5pt)
    const linhas: string[] = [];
    let grupoAtual: { str: string; transform: number[] }[] = [];
    let lastY = NaN;

    for (const item of items) {
      const y = item.transform[5];
      if (grupoAtual.length === 0 || Math.abs(y - lastY) <= 5) {
        grupoAtual.push(item);
        lastY = isNaN(lastY) ? y : (lastY + y) / 2;
      } else {
        if (grupoAtual.length) linhas.push(grupoAtual.map(i => i.str).join(' ').trim());
        grupoAtual = [item];
        lastY = y;
      }
    }
    if (grupoAtual.length) linhas.push(grupoAtual.map(i => i.str).join(' ').trim());

    todasLinhas.push(...linhas.filter(Boolean));
  }

  return todasLinhas;
}

// ─── Parser principal ──────────────────────────────────────────────────────────

function parseLinhas(linhas: string[]): FichaPDF {
  const norm = linhas.map(l => l.trim());

  const resultado: FichaPDF = {
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

  // ── NOME ───────────────────────────────────────────────────────────────────
  const nomeIdx = norm.findIndex(l => l === 'NOME');
  if (nomeIdx >= 0) {
    const partes: string[] = [];
    for (let i = nomeIdx + 1; i < Math.min(nomeIdx + 5, norm.length); i++) {
      const l = norm[i];
      if (!l || l === 'GÊNERO' || NOMES_CLASSES.includes(l.toUpperCase()) || l === 'HERANÇA') break;
      partes.push(l);
    }
    resultado.nome = partes.join(' ').trim();
  }

  // ── GÊNERO ─────────────────────────────────────────────────────────────────
  const generoIdx = norm.findIndex(l => l === 'GÊNERO');
  if (generoIdx >= 0) {
    const val = norm[generoIdx + 1]?.trim() ?? '';
    if (val && !isSectionLabel(val)) resultado.genero = val;
  }

  // ── CLASSE ─────────────────────────────────────────────────────────────────
  const classeIdx = norm.findIndex(l => NOMES_CLASSES.includes(l.toUpperCase()));
  if (classeIdx >= 0) {
    resultado.classe = titleCase(norm[classeIdx]);
  }

  // ── SUBCLASSE ──────────────────────────────────────────────────────────────
  const subIdx = norm.findIndex(l => l.toUpperCase() === 'SUBCLASSE');
  if (subIdx >= 0) {
    const partes: string[] = [];
    for (let i = subIdx + 1; i < Math.min(subIdx + 5, norm.length); i++) {
      const l = norm[i];
      if (!l || l.toUpperCase() === 'NÍVEL' || l.toUpperCase() === 'HERANÇA') break;
      if (!isSectionLabel(l)) partes.push(l);
    }
    resultado.subclasse = titleCase(partes.join(' ').trim());
  }

  // ── NÍVEL ──────────────────────────────────────────────────────────────────
  const nivelIdx = norm.findIndex(l => l.toUpperCase() === 'NÍVEL');
  if (nivelIdx >= 0) {
    for (let i = nivelIdx + 1; i < Math.min(nivelIdx + 4, norm.length); i++) {
      const n = parseInt(norm[i], 10);
      if (!isNaN(n)) { resultado.nivel = n; break; }
    }
  }

  // ── HERANÇA → ancestralidade / comunidade ──────────────────────────────────
  const herancaIdx = norm.findIndex(l => l.toUpperCase() === 'HERANÇA');
  if (herancaIdx >= 0) {
    const val = norm[herancaIdx + 1]?.trim() ?? '';
    const partes = val.split('/').map(s => s.trim());
    resultado.ancestralidade = titleCase(partes[0] ?? '');
    resultado.comunidade = titleCase(partes[1] ?? '');
  }

  // ── ATRIBUTOS ─────────────────────────────────────────────────────────────
  const attrMap: Record<string, keyof typeof resultado.atributos> = {
    'AGILIDADE': 'agilidade', 'FORÇA': 'forca', 'ACUIDADE': 'acuidade',
    'INSTINTO': 'instinto', 'PRESENÇA': 'presenca', 'CONHECIMENTO': 'conhecimento',
  };
  for (const [label, key] of Object.entries(attrMap)) {
    const idx = norm.findIndex(l => l.toUpperCase() === label);
    if (idx < 0) continue;
    for (let i = idx + 1; i < Math.min(idx + 5, norm.length); i++) {
      const v = norm[i];
      if (/^[+-]?\d+$/.test(v)) { resultado.atributos[key] = parseNum(v); break; }
    }
  }

  // ── EVASÃO ────────────────────────────────────────────────────────────────
  const evasaoIdx = norm.findIndex(l => l.toUpperCase() === 'EVASÃO');
  if (evasaoIdx >= 0) {
    for (let i = evasaoIdx + 1; i < Math.min(evasaoIdx + 5, norm.length); i++) {
      const v = norm[i];
      if (/^\d+$/.test(v)) { resultado.evasao = parseInt(v, 10); break; }
    }
  }

  // ── LIMIARES ─────────────────────────────────────────────────────────────
  // Formato 1: "MENOR MAIOR GRAVE" → linha seguinte "7 14 18"
  const mmgIdx = norm.findIndex(l => /MENOR\s+MAIOR/i.test(l));
  if (mmgIdx >= 0) {
    const nums = (norm[mmgIdx + 1] ?? '').match(/\d+/g);
    if (nums && nums.length >= 2) {
      resultado.limiares_display = [parseInt(nums[0]), parseInt(nums[1])];
    }
  } else {
    // Formato 2: "6 (Menor) 12 (Maior) 16 (Grave)" em uma linha ou em partes
    const limLine = norm.find(l => /\d+\s*\(Menor\)/i.test(l));
    if (limLine) {
      const menor = parseInt(limLine.match(/(\d+)\s*\(Menor\)/i)?.[1] ?? '0', 10);
      const maior = parseInt(limLine.match(/(\d+)\s*\(Maior\)/i)?.[1] ?? '0', 10);
      resultado.limiares_display = [menor, maior];
    } else {
      // Valores em linhas separadas ao lado das labels
      const menorLine = norm.find(l => /\(Menor\)/i.test(l));
      const maiorLine = norm.find(l => /\(Maior\)/i.test(l));
      if (menorLine) resultado.limiares_display[0] = parseNum(menorLine.match(/\d+/)?.[0] ?? '0');
      if (maiorLine) resultado.limiares_display[1] = parseNum(maiorLine.match(/\d+/)?.[0] ?? '0');
    }
  }

  // ── PV MÁX ───────────────────────────────────────────────────────────────
  const pvLine = norm.find(l => /PV\s*\(MAX\s*\d+\)/i.test(l));
  if (pvLine) {
    resultado.pv_max = parseInt(pvLine.match(/PV\s*\(MAX\s*(\d+)\)/i)?.[1] ?? '6', 10);
  }

  // ── ARMADURA ATIVA ────────────────────────────────────────────────────────
  const armAtivaIdx = norm.findIndex(l => l.toUpperCase() === 'ARMADURA ATIVA');
  if (armAtivaIdx >= 0) {
    // Nome da armadura (próxima linha não-label)
    for (let i = armAtivaIdx + 1; i < Math.min(armAtivaIdx + 4, norm.length); i++) {
      const l = norm[i];
      if (l && !isSectionLabel(l) && !/^[\d/ ]+$/.test(l)) {
        resultado.armadura_nome = titleCase(l);
        break;
      }
    }

    // Linha de limiares e armadura base: "5 / 11   3" ou "6 / 13   3"
    const limBaseIdx = norm.findIndex((l, i) => i > armAtivaIdx && /LIMIARES BASE/i.test(l));
    if (limBaseIdx >= 0) {
      const dataLine = norm[limBaseIdx + 1] ?? '';
      const nums = dataLine.match(/\d+/g);
      if (nums && nums.length >= 3) {
        resultado.armadura_limiares = [parseInt(nums[0]), parseInt(nums[1])];
        resultado.armadura_base = parseInt(nums[2], 10);
      } else if (nums && nums.length === 2) {
        // Armadura base na linha seguinte
        resultado.armadura_limiares = [parseInt(nums[0]), parseInt(nums[1])];
        const nextLine = norm[limBaseIdx + 2] ?? '';
        const nextNum = nextLine.match(/\d+/)?.[0];
        if (nextNum) resultado.armadura_base = parseInt(nextNum, 10);
      }
    }

    // Evasão bônus da armadura (Flexível: +1 em Evasão / Rígida: -1 / Pesada: -2)
    for (let i = armAtivaIdx + 1; i < Math.min(armAtivaIdx + 8, norm.length); i++) {
      const l = norm[i];
      if (/Flexível/i.test(l)) { resultado.armadura_evasao_bonus = 1; break; }
      if (/Rígida/i.test(l)) { resultado.armadura_evasao_bonus = -1; break; }
      if (/Pesada/i.test(l) || /Placas/i.test(l)) { resultado.armadura_evasao_bonus = -2; break; }
    }
  }

  // ── ARMAS ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < norm.length; i++) {
    const l = norm[i];
    if (!l.toUpperCase().startsWith('PRINCIPAL') && !l.toUpperCase().startsWith('SECUND')) continue;
    const isPrincipal = l.toUpperCase().startsWith('PRINCIPAL');

    // Concatenar até 3 linhas para capturar dados particionados
    const texto = [l, norm[i + 1] ?? '', norm[i + 2] ?? ''].join(' ');
    const arma = parseWeaponText(texto, isPrincipal);
    if (isPrincipal) resultado.arma_principal = arma;
    else resultado.arma_secundaria = arma;
  }

  // ── EXPERIÊNCIAS ──────────────────────────────────────────────────────────
  const exps: { nome: string; mod: number }[] = [];
  for (let i = 0; i < norm.length; i++) {
    const l = norm[i];
    // "+2 NOME DA EXP" em uma linha
    const inlineMatch = l.match(/^(\+\d+)\s+(.{3,})$/);
    if (inlineMatch) {
      const mod = parseNum(inlineMatch[1]);
      if (mod > 0 && mod <= 3) {
        let nome = inlineMatch[2];
        // Pode continuar na próxima linha
        const next = norm[i + 1] ?? '';
        if (next && !next.startsWith('+') && !isSectionLabel(next) && next.length < 50) {
          nome += ' ' + next;
          i++;
        }
        exps.push({ nome: titleCase(nome.trim()), mod });
        continue;
      }
    }
    // "+2" sozinho → nome nas próximas linhas
    if (/^\+\d+$/.test(l)) {
      const mod = parseNum(l);
      if (mod <= 0 || mod > 3) continue;
      const nomePartes: string[] = [];
      let j = i + 1;
      while (j < i + 4 && j < norm.length) {
        const nl = norm[j];
        if (!nl || nl.startsWith('+') || isSectionLabel(nl)) break;
        nomePartes.push(nl);
        j++;
      }
      if (nomePartes.length > 0) {
        exps.push({ nome: titleCase(nomePartes.join(' ').trim()), mod });
        i = j - 1;
      }
    }
  }
  resultado.experiencias = exps.filter(e => e.nome.length > 1).slice(0, 4);

  // ── INVENTÁRIO ────────────────────────────────────────────────────────────
  const invIdx = norm.findIndex(l => l.toUpperCase() === 'INVENTÁRIO');
  if (invIdx >= 0) {
    const itens: string[] = [];
    for (let i = invIdx + 1; i < norm.length; i++) {
      const l = norm[i];
      if (isSectionLabel(l) || l.toUpperCase() === 'HABILIDADES DE CLASSE') break;
      const item = l.replace(/^[•\-\*]\s*/, '').trim();
      if (item && item.length > 1 && !item.startsWith('CORRER') && !item.startsWith('AGARRAR')) {
        itens.push(item);
      }
    }
    resultado.inventario = itens;
  }

  // ── CARTAS ────────────────────────────────────────────────────────────────
  const cartasIdx = norm.findIndex(l => /CARTAS DE DOMÍNIO/i.test(l));
  if (cartasIdx >= 0) {
    const nomes: string[] = [];
    for (let i = cartasIdx + 1; i < norm.length; i++) {
      const l = norm[i];
      const nextL = norm[i + 1] ?? '';
      if (/^(FEITIÇO|TALENTO|GRIMÓRIO)\s+D[OA]\s+/i.test(nextL)) {
        if (l.length > 2 && !/^Custo:/i.test(l)) {
          nomes.push(l.trim());
        }
      }
    }
    resultado.cartas_nomes = nomes;
  }

  // ── ORIGEM ────────────────────────────────────────────────────────────────
  const origemIdx = norm.findIndex(l => l.toUpperCase() === 'HISTÓRICO & ORIGEM');
  if (origemIdx >= 0) {
    const conceitoIdx = norm.findIndex((l, i) => i > origemIdx && l.toUpperCase() === 'CONCEITO CENTRAL');
    if (conceitoIdx >= 0) {
      const val = norm[conceitoIdx + 1] ?? '';
      if (val && !isSectionLabel(val)) resultado.conceito_central = val;
    }

    const respostas: string[] = [];
    for (let i = origemIdx; i < norm.length; i++) {
      if (norm[i].endsWith('?')) {
        const partes: string[] = [];
        let j = i + 1;
        while (j < norm.length && j < i + 5) {
          const nl = norm[j];
          if (!nl || nl.endsWith('?') || isSectionLabel(nl)) break;
          partes.push(nl);
          j++;
          if (partes.join(' ').length > 200) break;
        }
        const resposta = partes.join(' ').trim();
        if (resposta) respostas.push(resposta);
      }
    }
    resultado.respostas_origem = respostas.slice(0, 5);
  }

  return resultado;
}

function parseWeaponText(texto: string, isPrincipal: boolean): ArmaRaw {
  const arma: ArmaRaw = { nome: '', atributo: '', alcance: '', dado: '', tipo: '', habilidade: '' };
  if (!texto.trim() || /^[—\-]+$/.test(texto.trim())) return arma;

  // Remover prefixo PRINCIPAL / SECUND.
  let restante = texto
    .replace(/^PRINCIPAL\s*/i, '')
    .replace(/^SECUND\.\s*/i, '')
    .trim();

  if (!restante || restante === '—') return arma;

  // Extrair dado (dN ou dN+N ou dN Mágico)
  const dadoMatch = restante.match(/(d\d+(?:[+-]\d+)?)/i);
  if (dadoMatch) {
    arma.dado = dadoMatch[1];
    const antes = restante.slice(0, dadoMatch.index ?? 0).trim();
    const depois = restante.slice((dadoMatch.index ?? 0) + dadoMatch[0].length).trim();

    // Tipo: Físico / Mágico
    const tipoMatch = depois.match(/^(Físico|Mágico)/i);
    if (tipoMatch) {
      arma.tipo = tipoMatch[1] as 'Físico' | 'Mágico';
      arma.habilidade = depois.slice(tipoMatch[0].length).replace(/^[\s—\-]+/, '').trim();
    }

    // Atributo e alcance no texto antes do dado
    for (const atrib of ATRIBUTOS_NOMES) {
      if (antes.toLowerCase().includes(atrib.toLowerCase())) {
        arma.atributo = atrib;
        break;
      }
    }
    for (const alc of ALCANCES) {
      if (antes.toLowerCase().includes(alc.toLowerCase())) {
        arma.alcance = alc;
        break;
      }
    }

    // Nome = tudo antes do atributo
    const atribIdx = arma.atributo
      ? antes.toLowerCase().indexOf(arma.atributo.toLowerCase())
      : antes.length;
    arma.nome = titleCase(antes.slice(0, atribIdx).replace(/\s*\/\s*$/, '').trim());
  } else {
    // Sem dado identificado — tudo como nome
    arma.nome = isPrincipal ? titleCase(restante) : '';
  }

  if (arma.habilidade === '—') arma.habilidade = '';
  return arma;
}

// ─── Entry point ───────────────────────────────────────────────────────────────

export async function parsearFichaPDF(file: File): Promise<FichaPDF> {
  const linhas = await extrairLinhas(file);
  if (linhas.length < 10) throw new Error('Não foi possível extrair texto do PDF. Verifique se o arquivo não está protegido ou é baseado em imagem.');
  return parseLinhas(linhas);
}
