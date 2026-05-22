import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, AlertCircle, FileText, Swords, Package, ScrollText } from 'lucide-react';
import { gerarUUID } from '@/lib/uuid';
import { CLASSES, CARTAS, getNomesAncestralidades, getNomesComunidades } from '@/data';
import { novoPersonagem } from '@/types/personagem';
import type { Personagem, NomeClasse, Alcance, Atributo } from '@/types/personagem';
import type { FichaPDF, ArmaRaw } from '@/lib/pdf-import';

interface Props {
  fichaPDF: FichaPDF;
  onConfirmar: (p: Personagem) => void;
  onCancelar: () => void;
}

const NOMES_CLASSES: NomeClasse[] = [
  'Bardo', 'Druida', 'Feiticeiro', 'Guardião', 'Guerreiro',
  'Ladino', 'Mago', 'Patrulheiro', 'Serafim',
];

const ATRIBUTOS_LABELS: { key: keyof FichaPDF['atributos']; label: string }[] = [
  { key: 'agilidade', label: 'Agilidade' },
  { key: 'forca', label: 'Força' },
  { key: 'acuidade', label: 'Acuidade' },
  { key: 'instinto', label: 'Instinto' },
  { key: 'presenca', label: 'Presença' },
  { key: 'conhecimento', label: 'Conhecimento' },
];

const ALCANCES_OPTS: Alcance[] = ['Corpo a corpo', 'Muito próximo', 'Próximo', 'Distante', 'Muito distante'];
const ATRIBUTOS_OPTS: Atributo[] = ['Agilidade', 'Força', 'Acuidade', 'Instinto', 'Presença', 'Conhecimento'];

function matchCartaId(nome: string): string | null {
  if (!nome) return null;
  return CARTAS.find(c => c.nome.toLowerCase() === nome.toLowerCase())?.id ?? null;
}

function construirPersonagem(dados: FichaPDF): Personagem {
  const id = gerarUUID();
  const p = novoPersonagem(id);
  const nivel = dados.nivel;

  p.nome = dados.nome;
  p.genero = dados.genero;
  p.pronomes = '';
  p.classe = dados.classe as NomeClasse | '';
  p.subclasse = dados.subclasse;
  p.nivel = nivel;
  p.ancestralidade = dados.ancestralidade;
  p.comunidade = dados.comunidade;

  // Atributos
  const attrKeys: [keyof FichaPDF['atributos'], Atributo][] = [
    ['agilidade', 'Agilidade'], ['forca', 'Força'], ['acuidade', 'Acuidade'],
    ['instinto', 'Instinto'], ['presenca', 'Presença'], ['conhecimento', 'Conhecimento'],
  ];
  for (const [pdfKey, attrKey] of attrKeys) {
    p.atributos[attrKey] = { valor: dados.atributos[pdfKey], marcado: false, bonus: 0 };
  }

  // Combate
  p.evasao = dados.evasao;
  p.evasao_bonus_perm = 0;
  // Limiares base = display - nivel (nossa fórmula: efetivo = base + nivel)
  p.limiares = [
    Math.max(0, dados.limiares_display[0] - nivel),
    Math.max(0, dados.limiares_display[1] - nivel),
  ];

  // Saúde
  p.pv_max = dados.pv_max;
  p.pv_marcados = 0;
  p.pa_max = 3;
  p.pa_marcados = 0;
  // pf_max da classe, com fallback
  const classeData = CLASSES[dados.classe as NomeClasse];
  p.pf_max = classeData ? (classeData as { pf_base?: number }).pf_base ?? 6 : 6;
  p.pf_marcados = 0;
  p.esperanca = 2;

  // Armadura
  p.armadura_ativa = {
    nome: dados.armadura_nome,
    limiares_base: dados.armadura_limiares,
    armadura_base: dados.armadura_base,
    evasao_bonus: dados.armadura_evasao_bonus || undefined,
  };

  // Armas
  const mapArma = (a: ArmaRaw) => ({
    nome: a.nome,
    atributo: (a.atributo as Atributo) || ('' as Atributo),
    alcance: (a.alcance as Alcance) || ('' as Alcance),
    dado: a.dado,
    tipo: a.tipo === 'Mágico' ? 'mágico' as const : 'físico' as const,
    habilidade: a.habilidade,
  });
  p.arma_principal = mapArma(dados.arma_principal);
  p.arma_secundaria = mapArma(dados.arma_secundaria);

  // Experiências
  p.experiencias = dados.experiencias;

  // Cartas
  p.cartas_mao = dados.cartas_nomes
    .map(n => matchCartaId(n))
    .filter(Boolean) as string[];

  // Inventário
  p.inventario = dados.inventario.map((nome, i) => ({
    id: gerarUUID(),
    nome,
    tipo: /poção|veneno|óleo/i.test(nome) ? 'consumivel' as const : 'item' as const,
    timestamp: Date.now() + i,
  }));

  // Ouro
  const ourosIdx = dados.inventario.findIndex(i => /punhado.*ouro|ouro/i.test(i));
  if (ourosIdx >= 0) p.ouro.punhados = 1;

  // Origem
  p.respostas_origem = dados.respostas_origem.length >= 3
    ? dados.respostas_origem.slice(0, 3)
    : [...dados.respostas_origem, ...Array(3 - dados.respostas_origem.length).fill('')];
  p.notas = dados.conceito_central;

  return p;
}

// ─── Componentes menores ───────────────────────────────────────────────────────

function Secao({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card space-y-3">
      <div className="section-header">
        <span className="flex items-center gap-1.5 section-title">
          {icone}{titulo}
        </span>
      </div>
      {children}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function TelaRevisarImportacao({ fichaPDF, onConfirmar, onCancelar }: Props) {
  const [dados, setDados] = useState<FichaPDF>({ ...fichaPDF });

  const set = <K extends keyof FichaPDF>(key: K, val: FichaPDF[K]) =>
    setDados(prev => ({ ...prev, [key]: val }));

  const setAtrib = (key: keyof FichaPDF['atributos'], val: number) =>
    setDados(prev => ({ ...prev, atributos: { ...prev.atributos, [key]: val } }));

  const setArma = (tipo: 'arma_principal' | 'arma_secundaria', key: keyof ArmaRaw, val: string) =>
    setDados(prev => ({ ...prev, [tipo]: { ...prev[tipo], [key]: val } }));

  const setExp = (idx: number, key: 'nome' | 'mod', val: string | number) =>
    setDados(prev => {
      const exps = [...prev.experiencias];
      exps[idx] = { ...exps[idx], [key]: val };
      return { ...prev, experiencias: exps };
    });

  const setLimiar = (i: 0 | 1, val: number) =>
    setDados(prev => {
      const l: [number, number] = [...prev.limiares_display] as [number, number];
      l[i] = val;
      return { ...prev, limiares_display: l };
    });

  const setArmLimiar = (i: 0 | 1, val: number) =>
    setDados(prev => {
      const l: [number, number] = [...prev.armadura_limiares] as [number, number];
      l[i] = val;
      return { ...prev, armadura_limiares: l };
    });

  const setResposta = (idx: number, val: string) =>
    setDados(prev => {
      const r = [...prev.respostas_origem];
      r[idx] = val;
      return { ...prev, respostas_origem: r };
    });

  const cartasNaoEncontradas = dados.cartas_nomes.filter(n => matchCartaId(n) === null);

  function confirmar() {
    const p = construirPersonagem(dados);
    onConfirmar(p);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 bg-bg z-50 overflow-y-auto"
    >
      <div className="max-w-lg mx-auto px-4 py-8 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={onCancelar}
            className="flex items-center gap-1.5 text-2xs text-ink-muted hover:text-gold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gold/8 border border-transparent hover:border-gold/20">
            <ArrowLeft size={13} />
            Cancelar
          </button>
          <div className="flex-1">
            <h2 className="font-display text-lg text-gold tracking-[0.2em]">REVISAR IMPORTAÇÃO</h2>
            <p className="text-2xs text-ink-dim">Verifique e edite os dados antes de confirmar.</p>
          </div>
        </div>

        {/* Alertas de cartas não encontradas */}
        {cartasNaoEncontradas.length > 0 && (
          <div className="flex items-start gap-2 bg-blood/8 border border-blood/20 rounded-xl px-3 py-2.5 mb-4">
            <AlertCircle size={14} className="text-blood-glow mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blood-glow font-medium">Cartas não identificadas</p>
              <p className="text-2xs text-ink-dim mt-0.5">
                {cartasNaoEncontradas.join(', ')} — verifique o nome e adicione manualmente pelo Wizard de criação.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">

          {/* IDENTIDADE */}
          <Secao titulo="Identidade" icone={<FileText size={13} />}>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Nome">
                <input className="input" value={dados.nome} onChange={e => set('nome', e.target.value)} />
              </Campo>
              <Campo label="Gênero">
                <input className="input" value={dados.genero} onChange={e => set('genero', e.target.value)} />
              </Campo>
            </div>
          </Secao>

          {/* CLASSE */}
          <Secao titulo="Classe" icone={<FileText size={13} />}>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Classe">
                <select className="input" value={dados.classe}
                  onChange={e => set('classe', e.target.value)}>
                  <option value="">— selecione —</option>
                  {NOMES_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Campo>
              <Campo label="Nível">
                <input className="input" type="number" min={1} max={10}
                  value={dados.nivel} onChange={e => set('nivel', parseInt(e.target.value) || 1)} />
              </Campo>
            </div>
            <Campo label="Subclasse">
              <input className="input" value={dados.subclasse} onChange={e => set('subclasse', e.target.value)} />
            </Campo>
          </Secao>

          {/* HERANÇA */}
          <Secao titulo="Herança" icone={<FileText size={13} />}>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Ancestralidade">
                <input className="input" list="ancs-list" value={dados.ancestralidade}
                  onChange={e => set('ancestralidade', e.target.value)} />
                <datalist id="ancs-list">
                  {getNomesAncestralidades().map(a => <option key={a} value={a} />)}
                </datalist>
              </Campo>
              <Campo label="Comunidade">
                <input className="input" list="comm-list" value={dados.comunidade}
                  onChange={e => set('comunidade', e.target.value)} />
                <datalist id="comm-list">
                  {getNomesComunidades().map(c => <option key={c} value={c} />)}
                </datalist>
              </Campo>
            </div>
          </Secao>

          {/* ATRIBUTOS */}
          <Secao titulo="Atributos" icone={<FileText size={13} />}>
            <div className="grid grid-cols-3 gap-2">
              {ATRIBUTOS_LABELS.map(({ key, label }) => (
                <div key={key} className="text-center">
                  <p className="text-2xs text-ink-dim mb-1 tracking-wider uppercase">{label}</p>
                  <div className="flex items-center justify-center gap-1">
                    <button type="button"
                      onClick={() => setAtrib(key, dados.atributos[key] - 1)}
                      className="w-6 h-6 rounded-md bg-bg-inset border border-border/40 text-xs flex items-center justify-center hover:border-gold/40 transition-colors">−</button>
                    <span className="font-display text-base w-8 text-center text-gold">
                      {dados.atributos[key] >= 0 ? `+${dados.atributos[key]}` : dados.atributos[key]}
                    </span>
                    <button type="button"
                      onClick={() => setAtrib(key, dados.atributos[key] + 1)}
                      className="w-6 h-6 rounded-md bg-bg-inset border border-border/40 text-xs flex items-center justify-center hover:border-gold/40 transition-colors">+</button>
                  </div>
                </div>
              ))}
            </div>
          </Secao>

          {/* COMBATE */}
          <Secao titulo="Combate & Saúde" icone={<FileText size={13} />}>
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Evasão">
                <input className="input text-center" type="number"
                  value={dados.evasao} onChange={e => set('evasao', parseInt(e.target.value) || 10)} />
              </Campo>
              <Campo label="Limiar Menor">
                <input className="input text-center" type="number"
                  value={dados.limiares_display[0]} onChange={e => setLimiar(0, parseInt(e.target.value) || 0)} />
              </Campo>
              <Campo label="Limiar Maior">
                <input className="input text-center" type="number"
                  value={dados.limiares_display[1]} onChange={e => setLimiar(1, parseInt(e.target.value) || 0)} />
              </Campo>
            </div>
            <Campo label="PV Máximo">
              <input className="input text-center" type="number"
                value={dados.pv_max} onChange={e => set('pv_max', parseInt(e.target.value) || 6)} />
            </Campo>

            {/* Armadura */}
            <div className="pt-1 border-t border-border/30 space-y-3">
              <p className="text-2xs text-ink-dim uppercase tracking-wider">Armadura Ativa</p>
              <Campo label="Nome da Armadura">
                <input className="input" value={dados.armadura_nome}
                  onChange={e => set('armadura_nome', e.target.value)} />
              </Campo>
              <div className="grid grid-cols-3 gap-3">
                <Campo label="Limiar Base 1">
                  <input className="input text-center" type="number"
                    value={dados.armadura_limiares[0]} onChange={e => setArmLimiar(0, parseInt(e.target.value) || 0)} />
                </Campo>
                <Campo label="Limiar Base 2">
                  <input className="input text-center" type="number"
                    value={dados.armadura_limiares[1]} onChange={e => setArmLimiar(1, parseInt(e.target.value) || 0)} />
                </Campo>
                <Campo label="Armadura Base">
                  <input className="input text-center" type="number"
                    value={dados.armadura_base} onChange={e => set('armadura_base', parseInt(e.target.value) || 0)} />
                </Campo>
              </div>
              <Campo label="Bônus de Evasão (armadura)">
                <input className="input text-center" type="number"
                  value={dados.armadura_evasao_bonus}
                  onChange={e => set('armadura_evasao_bonus', parseInt(e.target.value) || 0)} />
              </Campo>
            </div>
          </Secao>

          {/* ARMAS */}
          <Secao titulo="Armas" icone={<Swords size={13} />}>
            {(['arma_principal', 'arma_secundaria'] as const).map((tipo, idx) => (
              <div key={tipo} className={idx === 1 ? 'border-t border-border/30 pt-3' : ''}>
                <p className="text-2xs text-gold/60 uppercase tracking-widest mb-2">
                  {idx === 0 ? 'Arma Principal' : 'Arma Secundária'}
                </p>
                <div className="space-y-2">
                  <Campo label="Nome">
                    <input className="input" value={dados[tipo].nome}
                      onChange={e => setArma(tipo, 'nome', e.target.value)} />
                  </Campo>
                  <div className="grid grid-cols-2 gap-2">
                    <Campo label="Atributo">
                      <select className="input" value={dados[tipo].atributo}
                        onChange={e => setArma(tipo, 'atributo', e.target.value)}>
                        <option value="">—</option>
                        {ATRIBUTOS_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </Campo>
                    <Campo label="Alcance">
                      <select className="input" value={dados[tipo].alcance}
                        onChange={e => setArma(tipo, 'alcance', e.target.value)}>
                        <option value="">—</option>
                        {ALCANCES_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </Campo>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Campo label="Dado de Dano">
                      <input className="input" placeholder="d8+1" value={dados[tipo].dado}
                        onChange={e => setArma(tipo, 'dado', e.target.value)} />
                    </Campo>
                    <Campo label="Tipo">
                      <select className="input" value={dados[tipo].tipo}
                        onChange={e => setArma(tipo, 'tipo', e.target.value)}>
                        <option value="">—</option>
                        <option value="Físico">Físico</option>
                        <option value="Mágico">Mágico</option>
                      </select>
                    </Campo>
                  </div>
                  <Campo label="Habilidade">
                    <input className="input" value={dados[tipo].habilidade}
                      onChange={e => setArma(tipo, 'habilidade', e.target.value)} />
                  </Campo>
                </div>
              </div>
            ))}
          </Secao>

          {/* EXPERIÊNCIAS */}
          <Secao titulo="Experiências" icone={<FileText size={13} />}>
            {dados.experiencias.length === 0 && (
              <p className="text-2xs text-ink-dim italic">Nenhuma experiência detectada — adicione manualmente.</p>
            )}
            {dados.experiencias.map((exp, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-14">
                  <label className="label">Mod</label>
                  <input className="input text-center font-display"
                    value={exp.mod >= 0 ? `+${exp.mod}` : exp.mod}
                    onChange={e => setExp(i, 'mod', parseInt(e.target.value.replace('+', '')) || 0)} />
                </div>
                <div className="flex-1">
                  <label className="label">Nome</label>
                  <input className="input" value={exp.nome}
                    onChange={e => setExp(i, 'nome', e.target.value)} />
                </div>
              </div>
            ))}
            {dados.experiencias.length < 4 && (
              <button type="button"
                onClick={() => set('experiencias', [...dados.experiencias, { nome: '', mod: 2 }])}
                className="btn w-full text-2xs">+ Adicionar experiência</button>
            )}
          </Secao>

          {/* CARTAS */}
          <Secao titulo="Cartas de Domínio" icone={<ScrollText size={13} />}>
            {dados.cartas_nomes.length === 0 && (
              <p className="text-2xs text-ink-dim italic">Nenhuma carta detectada.</p>
            )}
            <div className="space-y-2">
              {dados.cartas_nomes.map((nome, i) => {
                const carta = CARTAS.find(c => c.nome.toLowerCase() === nome.toLowerCase());
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${carta ? 'bg-gold' : 'bg-blood-glow'}`} />
                    <div className="flex-1">
                      <input className="input text-xs" value={nome}
                        onChange={e => {
                          const novas = [...dados.cartas_nomes];
                          novas[i] = e.target.value;
                          set('cartas_nomes', novas);
                        }} />
                    </div>
                    {carta && (
                      <span className="text-2xs text-ink-dim px-1.5 py-0.5 bg-bg-inset rounded-md border border-border/30 flex-shrink-0">
                        {carta.dominio}
                      </span>
                    )}
                    <button type="button"
                      onClick={() => set('cartas_nomes', dados.cartas_nomes.filter((_, j) => j !== i))}
                      className="text-ink-dim hover:text-blood-glow transition-colors text-xs flex-shrink-0">✕</button>
                  </div>
                );
              })}
            </div>
            <p className="text-2xs text-ink-dim">
              <span className="inline-block w-2 h-2 rounded-full bg-gold mr-1" />identificada ·{' '}
              <span className="inline-block w-2 h-2 rounded-full bg-blood-glow mr-1" />não encontrada no banco
            </p>
          </Secao>

          {/* INVENTÁRIO */}
          <Secao titulo="Inventário" icone={<Package size={13} />}>
            {dados.inventario.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className="input flex-1 text-xs" value={item}
                  onChange={e => {
                    const inv = [...dados.inventario];
                    inv[i] = e.target.value;
                    set('inventario', inv);
                  }} />
                <button type="button"
                  onClick={() => set('inventario', dados.inventario.filter((_, j) => j !== i))}
                  className="text-ink-dim hover:text-blood-glow transition-colors text-xs flex-shrink-0">✕</button>
              </div>
            ))}
            <button type="button"
              onClick={() => set('inventario', [...dados.inventario, ''])}
              className="btn w-full text-2xs">+ Adicionar item</button>
          </Secao>

          {/* ORIGEM */}
          <Secao titulo="Histórico & Origem" icone={<ScrollText size={13} />}>
            <Campo label="Conceito Central">
              <input className="input" value={dados.conceito_central}
                onChange={e => set('conceito_central', e.target.value)} />
            </Campo>
            {dados.respostas_origem.map((r, i) => (
              <Campo key={i} label={`Resposta ${i + 1}`}>
                <textarea className="input min-h-[60px] resize-none text-xs" value={r}
                  onChange={e => setResposta(i, e.target.value)} />
              </Campo>
            ))}
          </Secao>

        </div>

        {/* Footer fixo */}
        <div className="fixed bottom-0 left-0 right-0 z-10 px-4 pb-6 pt-3"
          style={{ background: 'linear-gradient(to top, var(--color-bg) 70%, transparent)' }}>
          <div className="max-w-lg mx-auto">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={confirmar}
              className="btn-primary w-full"
            >
              <Check size={16} />
              Confirmar e criar personagem
            </motion.button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
