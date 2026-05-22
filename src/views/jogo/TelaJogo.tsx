import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gerarUUID } from '@/lib/uuid';
import { useApp } from '@/store/app';
import { CLASSES, SUBCLASSES, ANCESTRALIDADES, COMUNIDADES, getCarta } from '@/data';
import { DOMINIO_CORES } from '@/data/dominiosCores';
import { FileText, TrendingUp, ChevronDown, Loader, Trash2, Plus, Camera, Zap, Flame, Crosshair, Eye, Sparkles, BookOpen, Lock } from 'lucide-react';
import type { Atributo, NomeClasse, ItemInventario } from '@/types/personagem';
import { PainelTrackerClasse } from './PainelTrackerClasse';

// ─── Condições Daggerheart ────────────────────────────────────────────────────

const CONDICOES = [
  { nome: 'Escondido',   efeito: 'Testes contra você: desvantagem. Perdida ao atacar ou ser visto.' },
  { nome: 'Imobilizado', efeito: 'Não pode se mover, mas ainda pode agir.' },
  { nome: 'Vulnerável',  efeito: 'Todos os testes que tenham você como alvo: vantagem.' },
];

// ─── Tema de cor por classe ───────────────────────────────────────────────────

const CLASS_ACCENTS: Record<string, string> = {
  'Bardo':        '196, 100, 196', // rosa arcano
  'Druida':       '80, 180, 100',  // verde floresta
  'Feiticeiro':   '120, 80, 200',  // violeta profundo
  'Guardião':     '80, 140, 210',  // azul aço
  'Guerreiro':    '200, 100, 60',  // laranja forja
  'Ladino':       '100, 160, 160', // azul-verde sombra
  'Mago':         '60, 180, 210',  // ciano arcano
  'Patrulheiro':  '100, 170, 80',  // verde trilha
  'Serafim':      '220, 180, 80',  // âmbar divino
};

function getDominioStyle(dominio: string) {
  const rgb = DOMINIO_CORES[dominio] ?? '212, 175, 55';
  return {
    color: `rgb(${rgb})`,
    borderColor: `rgba(${rgb}, 0.35)`,
    background: `rgba(${rgb}, 0.08)`,
  };
}

// ─── Dados estáticos do sistema ───────────────────────────────────────────────

const ATRIBUTOS_ORDEM: Atributo[] = [
  'Agilidade', 'Força', 'Acuidade', 'Instinto', 'Presença', 'Conhecimento',
];

const SUB_HABILIDADES: Record<Atributo, [string, string, string]> = {
  Agilidade:    ['Correr', 'Equilibrar-se', 'Saltar'],
  Força:        ['Agarrar', 'Levantar', 'Romper'],
  Acuidade:     ['Esconder-se', 'Manipular', 'Manobrar'],
  Instinto:     ['Perceber', 'Pressentir', 'Orientar'],
  Presença:     ['Comover', 'Convencer', 'Enganar'],
  Conhecimento: ['Analisar', 'Aprender', 'Lembrar'],
};

// ─── Barra de recursos sticky (modo Jogo) ─────────────────────────────────────

function MiniBar({ pct, color, critical }: { pct: number; color: string; critical?: boolean }) {
  return (
    <div className="h-1 bg-bg-inset rounded-full overflow-hidden mt-0.5">
      <motion.div
        className={`h-full rounded-full ${color}`}
        animate={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={critical ? { boxShadow: '0 0 6px rgba(157,31,45,0.7)' } : undefined}
      />
    </div>
  );
}

function StickyResourceBar() {
  const { personagemAtivo } = useApp();
  if (!personagemAtivo) return null;
  const p = personagemAtivo;
  const pvPct = p.pv_max > 0 ? (p.pv_max - p.pv_marcados) / p.pv_max : 0;
  const pfPct = p.pf_max > 0 ? (p.pf_max - p.pf_marcados) / p.pf_max : 0;
  const pvCritical = pvPct < 0.35 && p.pv_max > 0;

  return (
    <div className={`sticky top-0 z-[9] bg-bg-card/95 backdrop-blur-md border-b transition-colors duration-700 ${
      pvCritical ? 'border-blood/40' : 'border-border/30'
    }`}>
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
        {/* PV */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-hp-soft uppercase tracking-widest">PV</span>
            <motion.span key={p.pv_marcados} className="font-display text-sm text-hp-soft"
              initial={{ scale: 1.25 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
              {p.pv_max - p.pv_marcados}/{p.pv_max}
            </motion.span>
          </div>
          <MiniBar pct={pvPct} color={pvCritical ? 'bg-blood' : 'bg-hp-soft'} critical={pvCritical} />
        </div>

        <div className="w-px h-8 bg-border/50 flex-shrink-0" />

        {/* PF */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-arcane-glow uppercase tracking-widest">PF</span>
            <motion.span key={p.pf_marcados} className="font-display text-sm text-arcane-glow"
              initial={{ scale: 1.25 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
              {p.pf_max - p.pf_marcados}/{p.pf_max}
            </motion.span>
          </div>
          <MiniBar pct={pfPct} color="bg-arcane" />
        </div>

        <div className="w-px h-8 bg-border/50 flex-shrink-0" />

        {/* Esperança */}
        <div className="flex gap-0.5 items-center flex-shrink-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.span key={i}
              className={`text-sm leading-none select-none ${i < p.esperanca ? 'text-gold' : 'text-border/50'}`}
              animate={{ scale: i < p.esperanca ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 400 }}>
              {i < p.esperanca ? '◆' : '◇'}
            </motion.span>
          ))}
        </div>

        <div className="w-px h-8 bg-border/50 flex-shrink-0" />

        {/* ARM */}
        <div className="text-right flex-shrink-0">
          <span className="text-2xs text-armor-soft uppercase tracking-widest block">ARM</span>
          <span className="font-display text-sm text-armor-soft">{p.pa_max - p.pa_marcados}/{p.pa_max}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Rótulo de campo (helper visual) ─────────────────────────────────────────

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-2xs text-ink-muted uppercase tracking-widest mb-0.5">{children}</div>
  );
}

// ─── Track de ícones (PV / PF / PA) ──────────────────────────────────────────

function TrackIcons({
  label, marcados, max, cor, onToggle, critical,
}: {
  label: string; marcados: number; max: number;
  cor: 'hp' | 'stress' | 'armor'; onToggle: (i: number) => void;
  critical?: boolean;
}) {
  const cfg = {
    hp:     { filled: '♥', empty: '♡', activeClass: critical ? 'text-blood-glow' : 'text-[rgb(220,80,80)]', emptyClass: 'text-[rgb(220,80,80)]/30', glowColor: 'rgba(220,80,80,0.7)', counter: critical ? 'text-blood-glow' : 'text-hp-soft' },
    stress: { filled: '◆', empty: '◇', activeClass: 'text-arcane-glow', emptyClass: 'text-arcane-glow/30', glowColor: 'rgba(123,63,160,0.7)', counter: 'text-arcane-glow' },
    armor:  { filled: '◈', empty: '◇', activeClass: 'text-armor-soft',  emptyClass: 'text-armor-soft/30',  glowColor: 'rgba(180,150,80,0.6)', counter: 'text-armor-soft' },
  }[cor];

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xs uppercase tracking-widest text-ink-muted">{label}</span>
        <motion.span key={marcados} className={`font-display text-sm ${cfg.counter}`}
          initial={{ scale: 1.25 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
          {max - marcados}/{max}
        </motion.span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: max }).map((_, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={() => onToggle(i)}
            whileTap={{ scale: 0.6 }}
            animate={{
              scale: i < marcados ? 1.1 : 1,
              filter: i < marcados
                ? `drop-shadow(0 0 5px ${cfg.glowColor})`
                : 'drop-shadow(0 0 0px transparent)',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className={`text-2xl leading-none select-none transition-colors ${
              i < marcados ? cfg.activeClass : cfg.emptyClass
            }`}
          >
            {i < marcados ? cfg.filled : cfg.empty}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Track de Esperança (diamantes) ──────────────────────────────────────────

function TrackEsperanca({ valor, onToggle }: { valor: number; onToggle: (i: number) => void }) {
  return (
    <div className="flex gap-3 flex-wrap items-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.button
          key={i}
          type="button"
          onClick={() => onToggle(i)}
          whileTap={{ scale: 0.6 }}
          animate={{
            scale: i < valor ? 1.2 : 1.0,
            filter: i < valor
              ? 'drop-shadow(0 0 6px rgba(212,175,55,0.9))'
              : 'drop-shadow(0 0 0px rgba(212,175,55,0))',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={`text-3xl leading-none select-none ${
            i < valor ? 'text-gold' : 'text-border/60'
          }`}
        >
          {i < valor ? '◆' : '◇'}
        </motion.button>
      ))}
    </div>
  );
}


// ─── Seção colapsável ─────────────────────────────────────────────────────────

function Secao({
  titulo, icone, children, defaultOpen = true,
}: {
  titulo: string; icone?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-ornate mb-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full section-header flex items-center justify-between"
      >
        <span className="section-title flex items-center gap-1.5">{icone}{titulo}</span>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-ink-dim" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Painel de cartas de domínio ──────────────────────────────────────────────

function PainelCartas() {
  const { personagemAtivo, atualizarFn } = useApp();
  if (!personagemAtivo) return null;

  const mao = personagemAtivo.cartas_mao;
  const reserva = personagemAtivo.cartas_reserva;
  const [expanded, setExpanded] = useState<string | null>(null);

  if (mao.length === 0 && reserva.length === 0) {
    return <p className="text-2xs text-ink-dim">Nenhuma carta adquirida.</p>;
  }

  function CartaItem({ id, naReserva }: { id: string; naReserva: boolean }) {
    const carta = getCarta(id);
    if (!carta) return null;
    const aberta = expanded === id;
    const ds = getDominioStyle(carta.dominio);

    function moverReserva() {
      atualizarFn(p => ({
        ...p,
        cartas_mao: p.cartas_mao.filter(c => c !== id),
        cartas_reserva: [...p.cartas_reserva, id],
      }));
    }
    function recuperar() {
      atualizarFn(p => ({
        ...p,
        cartas_reserva: p.cartas_reserva.filter(c => c !== id),
        cartas_mao: [...p.cartas_mao, id],
      }));
    }

    return (
      <motion.div
        layout
        className="rounded-xl border transition-all"
        style={naReserva
          ? { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(7,10,18,0.6)', opacity: 0.55 }
          : { borderColor: ds.borderColor, background: ds.background }
        }
      >
        <div className="px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <button type="button" onClick={() => setExpanded(aberta ? null : id)} className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="font-display text-sm tracking-wide"
                  style={naReserva ? undefined : { color: ds.color }}
                >
                  {carta.nome}
                </span>
                <span
                  className="text-2xs border rounded px-1.5 py-0.5"
                  style={naReserva
                    ? { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(232,223,207,0.4)' }
                    : { borderColor: ds.borderColor, color: ds.color, background: ds.background }
                  }
                >
                  {carta.dominio}
                </span>
                <span className="text-2xs border rounded px-1.5 py-0.5"
                  style={naReserva
                    ? { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(232,223,207,0.3)' }
                    : carta.nivel >= 5
                      ? { borderColor: 'rgba(212,175,55,0.35)', color: 'rgba(212,175,55,0.7)', background: 'rgba(212,175,55,0.06)' }
                      : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(232,223,207,0.35)' }
                  }
                >
                  Nv.{carta.nivel}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xs text-ink-dim/60">{carta.tipo}</span>
                {carta.custo_recordacao > 0 && (
                  <span className="text-2xs text-arcane-glow/70">{carta.custo_recordacao} PF para recuperar</span>
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={() => naReserva ? recuperar() : moverReserva()}
              className="text-2xs border rounded-lg px-2.5 py-1.5 flex-shrink-0 transition-colors font-medium hover:bg-blood/10 hover:border-blood/40 hover:text-blood-glow"
              style={naReserva
                ? { borderColor: 'rgba(212,175,55,0.4)', color: 'rgba(212,175,55,0.7)' }
                : { borderColor: ds.borderColor, color: ds.color }
              }
            >
              {naReserva ? 'Recuperar' : 'Usar'}
            </button>
          </div>

          {/* Descrição expandível */}
          <AnimatePresence>
            {aberta && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-2xs text-ink-muted leading-relaxed mt-2 pt-2 border-t border-border/30">
                  {carta.descricao}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {mao.map(id => <CartaItem key={id} id={id} naReserva={false} />)}
      {reserva.length > 0 && (
        <>
          <div className="text-2xs text-ink-dim uppercase tracking-widest text-center py-1">— reserva —</div>
          {reserva.map(id => <CartaItem key={id} id={id} naReserva={true} />)}
        </>
      )}
    </div>
  );
}

// ─── Inventário dinâmico ─────────────────────────────────────────────────────

function AdicionarItemForm({ onAdicionar }: { onAdicionar: (item: ItemInventario) => void }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  function adicionar() {
    if (!nome.trim()) return;
    onAdicionar({ id: gerarUUID(), nome: nome.trim(), descricao: descricao.trim() || undefined, tipo: 'manual', timestamp: Date.now() });
    setNome(''); setDescricao(''); setAberto(false);
  }

  if (!aberto) return (
    <button type="button" onClick={() => setAberto(true)}
      className="w-full flex items-center justify-center gap-1.5 py-2 text-2xs text-ink-dim
        hover:text-gold border border-dashed border-border/40 hover:border-gold/30 rounded-lg transition-all mb-3">
      <Plus size={11} /> Adicionar item
    </button>
  );

  return (
    <div className="space-y-1.5 mb-3 p-2.5 rounded-lg border border-border/30 bg-bg-inset/40">
      <input value={nome} onChange={e => setNome(e.target.value)}
        placeholder="Nome do item *" className="input w-full text-sm" autoFocus
        onKeyDown={e => e.key === 'Enter' && adicionar()} />
      <input value={descricao} onChange={e => setDescricao(e.target.value)}
        placeholder="Descrição (opcional)" className="input w-full text-xs"
        onKeyDown={e => e.key === 'Enter' && adicionar()} />
      <div className="flex gap-2 pt-0.5">
        <button type="button" onClick={() => { setAberto(false); setNome(''); setDescricao(''); }}
          className="btn text-2xs px-3 py-1.5 flex-1">Cancelar</button>
        <button type="button" onClick={adicionar} disabled={!nome.trim()}
          className="btn-primary text-2xs px-4 py-1.5 flex-1 disabled:opacity-40">Adicionar</button>
      </div>
    </div>
  );
}

// ─── TelaJogo principal ───────────────────────────────────────────────────────

export function TelaJogo() {
  const { personagemAtivo, atualizar, setModo } = useApp();
  const [pdfCarregando, setPdfCarregando] = useState(false);
  const [mostraDescanso, setMostraDescanso] = useState<null | 'curto' | 'longo'>(null);
  const [contagemMoves, setContagemMoves] = useState<Record<string, number>>({});
  const [comAliados, setComAliados] = useState(false);
  const [danoFlash, setDanoFlash] = useState<'menor' | 'maior' | 'grave' | null>(null);
  if (!personagemAtivo) return null;

  const p = personagemAtivo;
  const classeData = p.classe ? CLASSES[p.classe as NomeClasse] : null;
  const subclasseDados = (p.subclasse && p.classe)
    ? SUBCLASSES.classes[p.classe as NomeClasse]?.find(s => s.nome === p.subclasse)
    : undefined;
  const ancestralidadeDados = p.ancestralidade ? ANCESTRALIDADES[p.ancestralidade] : undefined;
  const comunidadeDados = p.comunidade ? COMUNIDADES[p.comunidade] : undefined;

  const patamar = p.nivel >= 8 ? 4 : p.nivel >= 5 ? 3 : p.nivel >= 2 ? 2 : 1;
  const totalMoves = Object.values(contagemMoves).reduce((s, v) => s + v, 0);

  function togglePV(i: number) {
    atualizar({ pv_marcados: Math.max(0, Math.min(p.pv_max, i < p.pv_marcados ? i : i + 1)) });
  }
  function togglePF(i: number) {
    atualizar({ pf_marcados: Math.max(0, Math.min(p.pf_max, i < p.pf_marcados ? i : i + 1)) });
  }
  function togglePA(i: number) {
    atualizar({ pa_marcados: Math.max(0, Math.min(p.pa_max, i < p.pa_marcados ? i : i + 1)) });
  }
  function toggleEsperanca(i: number) {
    atualizar({ esperanca: Math.max(0, Math.min(6, i < p.esperanca ? i : i + 1)) });
  }

  function receberDano(marks: number) {
    atualizar({ pv_marcados: Math.min(p.pv_max, p.pv_marcados + marks) });
    const tipo = marks === 1 ? 'menor' : marks === 2 ? 'maior' : 'grave';
    setDanoFlash(tipo);
    setTimeout(() => setDanoFlash(null), 700);
  }

  function abrirDescanso(tipo: 'curto' | 'longo') {
    if (mostraDescanso === tipo) {
      setMostraDescanso(null);
    } else {
      setMostraDescanso(tipo);
      setContagemMoves({});
      setComAliados(false);
    }
  }

  function addMove(id: string) {
    if (totalMoves < 2) {
      const atual = contagemMoves[id] ?? 0;
      setContagemMoves(prev => ({ ...prev, [id]: atual + 1 }));
    }
  }

  function removeMove(id: string) {
    const atual = contagemMoves[id] ?? 0;
    if (atual > 0) {
      setContagemMoves(prev => ({ ...prev, [id]: atual - 1 }));
    }
  }

  function rolar1d4() { return Math.floor(Math.random() * 4) + 1; }

  function confirmarDescanso(tipo: 'curto' | 'longo') {
    let novoPV = p.pv_marcados;
    let novoPF = p.pf_marcados;
    let novoPA = p.pa_marcados;
    let novaEsperanca = p.esperanca;
    for (const [id, count] of Object.entries(contagemMoves)) {
      for (let i = 0; i < count; i++) {
        if (id === 'preparar') {
          novaEsperanca = Math.min(6, novaEsperanca + (comAliados ? 2 : 1));
        } else if (id === 'armadura') {
          novoPA = tipo === 'curto' ? Math.max(0, novoPA - (rolar1d4() + patamar)) : 0;
        } else if (id === 'fadiga') {
          novoPF = tipo === 'curto' ? Math.max(0, novoPF - (rolar1d4() + patamar)) : 0;
        } else if (id === 'feridas') {
          novoPV = tipo === 'curto' ? Math.max(0, novoPV - (rolar1d4() + patamar)) : 0;
        }
      }
    }
    atualizar({ pv_marcados: novoPV, pf_marcados: novoPF, pa_marcados: novoPA, esperanca: novaEsperanca });
    setMostraDescanso(null);
    setContagemMoves({});
  }

  const armasEquipadas = [
    { label: 'Principal', arma: p.arma_principal },
    { label: 'Secundária', arma: p.arma_secundaria },
  ].filter(({ arma }) => arma.nome.trim() !== '');

  const accentRGB = p.classe ? (CLASS_ACCENTS[p.classe] ?? '212, 175, 55') : '212, 175, 55';

  // limiares_base + bônus (subclasse/ancestralidade) + nível atual = limiares efetivos de dano
  const limiaresEfetivos: [number, number] = [p.limiares[0] + p.nivel, p.limiares[1] + p.nivel];

  const pvCritical = p.pv_marcados >= limiaresEfetivos[0] && limiaresEfetivos[0] > 0;

  return (
    <div style={{ '--fw-accent': accentRGB } as React.CSSProperties}>

    {/* Flash de dano — overlay na tela toda */}
    <AnimatePresence>
      {danoFlash && (
        <motion.div
          key="dano-flash"
          initial={{ opacity: danoFlash === 'grave' ? 0.55 : danoFlash === 'maior' ? 0.3 : 0.15 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="fixed inset-0 pointer-events-none z-[200] bg-blood"
        />
      )}
    </AnimatePresence>

    <StickyResourceBar />
    <div className="max-w-2xl mx-auto px-3 pt-4 pb-14" style={{
      backgroundImage: `radial-gradient(ellipse 100% 320px at 50% 0, rgba(${accentRGB}, 0.05) 0%, transparent 70%)`,
    }}>

      {/* ══════════════ CABEÇALHO ══════════════ */}
      <div className="card-ornate mb-4 relative overflow-hidden">
        {/* Glow da classe no fundo */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 120% 180px at 80% -20%, rgba(${accentRGB}, 0.18) 0%, transparent 65%)` }} />

        {/* Retrato + Identidade */}
        <div className="relative flex gap-4 mb-4">
          {/* Retrato com cantos decorativos */}
          <div className="flex-shrink-0 relative" onClick={() => setModo('criacao')}>
            <div
              className="w-[88px] h-[110px] rounded-xl overflow-hidden cursor-pointer"
              style={{ boxShadow: `0 0 24px rgba(${accentRGB}, 0.2)` }}
            >
              {p.foto_url ? (
                <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-bg-inset flex flex-col items-center justify-center gap-1.5">
                  <Camera size={20} style={{ color: `rgba(${accentRGB},0.35)` }} />
                  <span style={{ fontSize: '8px', color: `rgba(${accentRGB},0.3)` }} className="uppercase tracking-widest">foto</span>
                </div>
              )}
            </div>
            {/* Cantos dourados decorativos */}
            {(['tl','tr','bl','br'] as const).map(c => (
              <div key={c} className="absolute w-3 h-3 pointer-events-none" style={{
                top:    c.startsWith('t') ? -2 : undefined,
                bottom: c.startsWith('b') ? -2 : undefined,
                left:   c.endsWith('l')   ? -2 : undefined,
                right:  c.endsWith('r')   ? -2 : undefined,
                borderTop:    c.startsWith('t') ? `2px solid rgba(${accentRGB},0.8)` : undefined,
                borderBottom: c.startsWith('b') ? `2px solid rgba(${accentRGB},0.8)` : undefined,
                borderLeft:   c.endsWith('l')   ? `2px solid rgba(${accentRGB},0.8)` : undefined,
                borderRight:  c.endsWith('r')   ? `2px solid rgba(${accentRGB},0.8)` : undefined,
              }} />
            ))}
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0 py-0.5 pr-16">
            <div className="font-display text-2xl text-gold tracking-[0.15em] leading-tight mb-1"
              style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.35))' }}>
              {p.nome || '—'}
            </div>
            <div className="text-xs font-medium tracking-wide mb-0.5" style={{ color: `rgb(${accentRGB})` }}>
              {[p.ancestralidade, p.classe].filter(Boolean).join(' · ') || '—'}
            </div>
            {p.subclasse && (
              <div className="text-2xs text-ink-muted mb-1">{p.subclasse}</div>
            )}
            {p.descricao_aparencia && (
              <div className="text-2xs text-ink-dim/80 leading-relaxed italic line-clamp-3 mt-1"
                style={{ borderLeft: `2px solid rgba(${accentRGB},0.3)`, paddingLeft: '8px' }}>
                {p.descricao_aparencia}
              </div>
            )}
          </div>

          {/* Badge de nível */}
          <div className="absolute top-0 right-0">
            <div className="w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center relative"
              style={{
                borderColor: `rgba(${accentRGB}, 0.6)`,
                background: `radial-gradient(circle, rgba(${accentRGB},0.15) 0%, rgba(${accentRGB},0.05) 100%)`,
                boxShadow: `0 0 20px rgba(${accentRGB}, 0.2), inset 0 0 12px rgba(${accentRGB},0.08)`,
              }}>
              <div style={{ fontSize: '9px' }} className="text-ink-muted uppercase tracking-widest leading-none mb-0.5">NÍV</div>
              <div className="font-display text-3xl leading-none" style={{ color: `rgb(${accentRGB})` }}>{p.nivel}</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative grid grid-cols-4 gap-2">
          {[
            {
              lbl: 'EVASÃO',
              val: String(p.evasao),
              sub: (() => {
                const base = classeData?.evasao_base ?? 10;
                const armBonus = p.armadura_ativa.evasao_bonus ?? 0;
                const ancBonus = p.ancestralidade === 'Símio' ? 1 : 0;
                const evolBonus = p.evasao_bonus_perm ?? 0;
                const partes: string[] = [`base ${base}`];
                if (armBonus !== 0)
                  partes.push(`${armBonus > 0 ? '+' : ''}${armBonus} arm`);
                if (ancBonus !== 0)
                  partes.push('+1 anc');
                if (evolBonus > 0)
                  partes.push(`+${evolBonus} evol`);
                return partes.join(' ');
              })(),
              color: 'text-gold',
            },
            {
              lbl: 'ARMADURA',
              val: String(p.pa_max - p.pa_marcados),
              sub: p.armadura_ativa.nome || `/${p.pa_max} pts`,
              color: 'text-armor-soft',
            },
            {
              lbl: 'PROF.',
              val: `+${p.proficiencia}`,
              sub: 'bônus de prof.',
              color: `rgb(${accentRGB})`,
            },
          ].map(({ lbl, val, sub, color }) => (
            <div key={lbl} className="bg-bg-inset/60 rounded-xl border border-border/30 text-center py-3 px-1 flex flex-col items-center justify-between gap-1">
              <div style={{ fontSize: '9px' }} className="text-ink-muted uppercase tracking-widest leading-none">{lbl}</div>
              <div className={`font-display text-3xl leading-none ${color}`}
                style={color.startsWith('rgb') ? { color } : undefined}>{val}</div>
              <div className="text-ink-dim/70 leading-none truncate w-full text-center" style={{ fontSize: '8px' }}>{sub}</div>
            </div>
          ))}
          {/* Esperança inline */}
          <div className="bg-bg-inset/60 rounded-xl border border-gold/20 text-center py-3 px-1 flex flex-col items-center justify-between gap-1">
            <div style={{ fontSize: '9px' }} className="text-ink-muted uppercase tracking-widest leading-none">ESPERANÇA</div>
            <div className="flex justify-center gap-0.5 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.span key={i}
                  animate={{ scale: i < p.esperanca ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className={`text-sm leading-none select-none ${i < p.esperanca ? 'text-gold' : 'text-border/50'}`}
                  style={i < p.esperanca ? { filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.8))' } : undefined}>
                  {i < p.esperanca ? '◆' : '◇'}
                </motion.span>
              ))}
            </div>
            <div className="text-ink-dim/70 leading-none" style={{ fontSize: '8px' }}>
              {p.esperanca > 0 ? `${p.esperanca} de 6` : '—'}
            </div>
          </div>
        </div>

        {/* Badge de severidade */}
        {(() => {
          const pv = p.pv_marcados;
          if (pv === 0) return null;
          const grave = pv >= p.pv_max;
          const danoGrave = pv >= limiaresEfetivos[1];
          const danoMaior = pv >= limiaresEfetivos[0];
          const [label, cls] = grave
            ? ['⚠ Incapacitado', 'border-blood bg-blood/20 text-blood-glow animate-pulse']
            : danoGrave
            ? ['● Dano Grave', 'border-blood/70 bg-blood/10 text-blood-glow']
            : danoMaior
            ? ['● Dano Maior', 'border-[rgba(200,120,50,0.6)] bg-[rgba(200,120,50,0.08)] text-[rgb(220,150,80)]']
            : ['● Dano Menor', 'border-border/60 bg-bg-inset text-ink-muted'];
          return (
            <div className={`relative mt-3 text-center text-2xs font-medium rounded-xl border py-1.5 tracking-widest uppercase ${cls}`}>
              {label}
              {p.condicoes.length > 0 && (
                <span className="ml-2 text-blood-glow/70 normal-case tracking-normal">· {p.condicoes.join(', ')}</span>
              )}
            </div>
          );
        })()}
      </div>

      {/* ══════════════ ATRIBUTOS ══════════════ */}
      <div className="card-ornate mb-4">
        <div className="section-header mb-3">
          <span className="section-title">Atributos</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ATRIBUTOS_ORDEM.map(nome => {
            const a = p.atributos[nome];
            const efetivo = (a.valor ?? 0) + a.bonus;
            const positivo = efetivo > 0;
            const negativo = efetivo < 0;
            const IconeAtributo = { Agilidade: Zap, Força: Flame, Acuidade: Crosshair, Instinto: Eye, Presença: Sparkles, Conhecimento: BookOpen }[nome];
            const iconColor = positivo ? `rgb(${accentRGB})` : negativo ? 'rgb(157,31,45)' : 'rgba(232,223,207,0.4)';
            return (
              <motion.div
                key={nome}
                className="bg-bg-inset rounded-xl border border-border/50 px-2 py-3 text-center flex flex-col items-center gap-1.5"
                whileTap={{ scale: 0.97 }}
              >
                <IconeAtributo size={14} style={{ color: iconColor, filter: positivo ? `drop-shadow(0 0 5px rgba(${accentRGB},0.6))` : undefined }} />
                <div className="text-ink-muted uppercase tracking-widest leading-none" style={{ fontSize: '9px' }}>
                  {nome}
                </div>
                <div className={`font-display text-3xl leading-none ${
                  positivo ? 'text-gold' : negativo ? 'text-blood-glow' : 'text-ink-dim'
                }`} style={positivo ? { filter: `drop-shadow(0 0 8px rgba(${accentRGB},0.45))` } : undefined}>
                  {positivo ? `+${efetivo}` : efetivo}
                </div>
                <div className="space-y-0.5 border-t border-border/30 pt-1.5 w-full">
                  {SUB_HABILIDADES[nome].map(s => (
                    <div key={s} className="text-ink-muted leading-snug" style={{ fontSize: '9px' }}>{s}</div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ══════════════ SAÚDE & DANO ══════════════ */}
      <div className={`card-ornate mb-4 transition-all duration-700 ${
        pvCritical ? 'shadow-[0_0_30px_rgba(157,31,45,0.22)] ring-1 ring-blood/25' : ''
      }`}>
        <div className="section-header mb-1">
          <span className="section-title">Saúde & Dano</span>
        </div>
        <p className="text-2xs text-ink-dim/60 text-center mb-3 leading-relaxed">
          Some seu nível atual aos seus limiares de dano.
        </p>

        {/* Limiares — toque para receber dano */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(() => {
            const pv = p.pv_marcados;
            const ativo = pv >= limiaresEfetivos[1] ? 2 : pv >= limiaresEfetivos[0] ? 1 : pv > 0 ? 0 : -1;
            return [
              { marks: 1, label: 'Dano Menor', range: `≤ ${Math.max(0, limiaresEfetivos[0] - 1)}`,
                border: 'border-border/40', borderAtivo: 'border-ink/50 bg-bg-card',
                num: 'text-ink', sub: 'text-ink-dim/70', idx: 0 },
              { marks: 2, label: 'Dano Maior', range: `${limiaresEfetivos[0]} – ${limiaresEfetivos[1] - 1}`,
                border: 'border-[rgba(200,130,50,0.35)]', borderAtivo: 'border-[rgba(200,130,50,0.8)] bg-[rgba(200,130,50,0.07)]',
                num: 'text-[rgb(225,155,70)]', sub: 'text-[rgb(225,155,70)]/60', idx: 1 },
              { marks: 3, label: 'Dano Grave', range: `≥ ${limiaresEfetivos[1]}`,
                border: 'border-blood/30', borderAtivo: 'border-blood/80 bg-blood/10',
                num: 'text-blood-glow', sub: 'text-blood-glow/60', idx: 2 },
            ].map(({ marks, label, range, border, borderAtivo, num, sub, idx }) => (
              <motion.button key={label} type="button" onClick={() => receberDano(marks)}
                whileTap={{ scale: 0.87, y: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={`bg-bg-inset rounded-xl border text-center py-3 transition-all ${ativo === idx ? borderAtivo : border}`}>
                <div className="text-2xs uppercase tracking-wider font-medium text-ink-muted mb-1">{label}</div>
                <div className={`font-display text-2xl leading-none mb-1 ${num}`}>{range}</div>
                <div className={`text-2xs ${sub}`}>Marque {marks} PV</div>
                {ativo === idx && (
                  <div className={`text-2xs font-medium mt-1 ${num}`}>← atual</div>
                )}
              </motion.button>
            ));
          })()}
        </div>

        {/* Tracks */}
        <TrackIcons label="PV — Pontos de Vida"     marcados={p.pv_marcados} max={p.pv_max} cor="hp"     onToggle={togglePV} critical={pvCritical} />
        <TrackIcons label="PF — Pontos de Fadiga"   marcados={p.pf_marcados} max={p.pf_max} cor="stress" onToggle={togglePF} />
        {p.pa_max > 0 && (
          <TrackIcons label="PA — Pontos de Armadura" marcados={p.pa_marcados} max={p.pa_max} cor="armor" onToggle={togglePA} />
        )}

        {/* Condições */}
        <div className="border-t border-border/40 pt-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs uppercase tracking-widest text-ink-muted">Condições</span>
            {p.condicoes.length > 0 && (
              <span className="text-2xs text-blood-glow">{p.condicoes.length} ativa{p.condicoes.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {CONDICOES.map(c => {
              const ativa = p.condicoes.includes(c.nome);
              return (
                <button
                  key={c.nome}
                  type="button"
                  onClick={() => atualizar({
                    condicoes: ativa
                      ? p.condicoes.filter(n => n !== c.nome)
                      : [...p.condicoes, c.nome],
                  })}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition-all ${
                    ativa
                      ? 'border-blood/60 bg-blood/10'
                      : 'border-border/40 bg-bg-inset hover:border-blood/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-medium ${ativa ? 'text-blood-glow' : 'text-ink-muted'}`}>
                      {ativa ? '◉ ' : '○ '}{c.nome}
                    </span>
                    <span className="text-2xs text-ink-dim leading-snug text-right flex-1 max-w-[60%]">{c.efeito}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Descanso */}
        <div className="border-t border-border/40 pt-3">
          <div className="flex gap-2 mb-2">
            <button type="button"
              onClick={() => abrirDescanso('curto')}
              className={`flex-1 text-2xs rounded-xl py-2 border transition-colors ${
                mostraDescanso === 'curto'
                  ? 'border-gold/60 text-gold bg-gold/10'
                  : 'border-gold/30 text-gold/70 hover:bg-gold/10'
              }`}>
              Descanso Curto
            </button>
            <button type="button"
              onClick={() => abrirDescanso('longo')}
              className={`flex-1 text-2xs rounded-xl py-2 border transition-colors ${
                mostraDescanso === 'longo'
                  ? 'border-arcane/60 text-arcane-glow bg-arcane/10'
                  : 'border-arcane/30 text-arcane-glow/70 hover:bg-arcane/10'
              }`}>
              Descanso Longo
            </button>
          </div>

          {mostraDescanso !== null && (() => {
            const tipo = mostraDescanso;
            const ehCurto = tipo === 'curto';
            const moves = ehCurto ? [
              { id: 'preparar', label: 'Preparar-se',      desc: `+${comAliados ? 2 : 1} Esperança` },
              { id: 'armadura', label: 'Reparar Armadura',  desc: `1d4+${patamar} PA` },
              { id: 'fadiga',   label: 'Reduzir Fadiga',    desc: `1d4+${patamar} PF` },
              { id: 'feridas',  label: 'Tratar Feridas',    desc: `1d4+${patamar} PV` },
            ] : [
              { id: 'preparar', label: 'Preparar-se',                   desc: `+${comAliados ? 2 : 1} Esperança` },
              { id: 'armadura', label: 'Reparar Armadura por Completo', desc: 'Todo o PA' },
              { id: 'feridas',  label: 'Tratar Todas as Feridas',       desc: 'Todos os PV' },
              { id: 'projeto',  label: 'Trabalhar em um Projeto',       desc: 'Ação narrativa' },
              { id: 'fadiga',   label: 'Zerar Fadiga',                  desc: 'Todos os PF' },
            ];
            return (
              <div className={`bg-bg-inset rounded-xl border px-3 py-3 ${ehCurto ? 'border-gold/20' : 'border-arcane/20'}`}>
                <div className={`text-2xs mb-3 leading-relaxed ${ehCurto ? 'text-gold/60' : 'text-arcane-glow/60'}`}>
                  {ehCurto
                    ? 'MJ recebe 1d4 Medo · jogadores podem trocar cartas (mão ↔ reserva)'
                    : 'MJ recebe Medo · avança Contagem · jogadores trocam todas as cartas'
                  }
                </div>

                <button
                  type="button"
                  onClick={() => setComAliados(a => !a)}
                  className={`text-2xs rounded-lg border px-2.5 py-1 mb-3 transition-colors ${
                    comAliados
                      ? 'border-gold/60 bg-gold/10 text-gold'
                      : 'border-border text-ink-dim hover:border-gold/30'
                  }`}
                >
                  {comAliados ? '✓' : '○'} Com aliados (+2 Esp. em Preparar-se)
                </button>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs text-ink-muted">Escolha 2 movimentos (pode repetir):</span>
                  <span className={`text-2xs font-display ${totalMoves === 2 ? 'text-gold' : 'text-ink-dim'}`}>{totalMoves}/2</span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {moves.map(move => {
                    const count = contagemMoves[move.id] ?? 0;
                    return (
                      <div key={move.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all ${
                        count > 0 ? 'border-gold/40 bg-gold/5' : 'border-border'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-medium ${count > 0 ? 'text-gold' : 'text-ink'}`}>{move.label}</span>
                          <span className="text-2xs text-ink-dim ml-2">{move.desc}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button type="button" onClick={() => removeMove(move.id)} disabled={count === 0}
                            className="w-8 h-8 rounded border border-border text-ink-muted text-sm hover:border-blood/50 disabled:opacity-30 transition-colors flex items-center justify-center">−</button>
                          <span className={`w-5 text-center text-sm font-display ${count > 0 ? 'text-gold' : 'text-ink-dim'}`}>{count}</span>
                          <button type="button" onClick={() => addMove(move.id)} disabled={totalMoves >= 2}
                            className="w-8 h-8 rounded border border-border text-ink-muted text-sm hover:border-gold/50 disabled:opacity-30 transition-colors flex items-center justify-center">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => confirmarDescanso(tipo)} disabled={totalMoves < 2}
                    className={`flex-1 text-xs rounded-xl py-2 border transition-colors disabled:opacity-40 ${
                      ehCurto ? 'border-gold/60 text-gold hover:bg-gold/10' : 'border-arcane/60 text-arcane-glow hover:bg-arcane/10'
                    }`}>
                    Confirmar Descanso
                  </button>
                  <button type="button" onClick={() => { setMostraDescanso(null); setContagemMoves({}); }}
                    className="px-3 text-2xs border border-border text-ink-muted rounded-xl hover:border-gold/30 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ══════════════ ESPERANÇA ══════════════ */}
      <div className="card-ornate mb-4">
        <div className="section-header mb-3">
          <span className="section-title">Esperança</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <TrackEsperanca valor={p.esperanca} onToggle={toggleEsperanca} />
          <div className="flex-shrink-0 ml-3 text-right">
            <div className="font-display text-3xl text-gold leading-none"
              style={{ filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.6))' }}>
              {p.esperanca}
            </div>
            <div className="text-ink-dim/60 leading-none mt-0.5" style={{ fontSize: '8px' }}>de 6</div>
          </div>
        </div>
        <p className="text-2xs text-ink-dim/70 mb-4 leading-relaxed">
          Gaste 1 Esperança para usar uma Experiência, prestar ajuda ou ativar a habilidade abaixo.
        </p>

        {classeData && (
          <div className="rounded-xl border overflow-hidden flex" style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
            <div className="w-1 flex-shrink-0" style={{ background: 'rgba(212,175,55,0.7)' }} />
            <div className="flex-1 px-3 py-2.5" style={{ background: 'rgba(212,175,55,0.04)' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium text-gold/90">{classeData.esperanca.nome}</div>
                <span className="text-2xs border border-gold/30 text-gold/60 rounded px-1.5 py-0.5 flex-shrink-0 ml-2">
                  {classeData.esperanca.custo} Esperança
                </span>
              </div>
              <div className="text-2xs text-ink-muted leading-relaxed">{classeData.esperanca.efeito}</div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ TRACKER DA CLASSE ══════════════ */}
      {p.classe && (
        <Secao titulo={`Tracker — ${p.classe}`} defaultOpen>
          <PainelTrackerClasse />
        </Secao>
      )}

      {/* ══════════════ EXPERIÊNCIAS ══════════════ */}
      <div className="card-ornate mb-4">
        <div className="section-header mb-3">
          <span className="section-title">Experiências</span>
        </div>
        {p.experiencias.filter(e => e.nome.trim() !== '').length === 0
          ? (
            <div className="rounded-xl border border-dashed border-gold/20 bg-bg-inset/50 px-4 py-5 text-center">
              <p className="text-sm text-ink-muted mb-1">Nenhuma experiência registrada.</p>
              <p className="text-2xs text-ink-dim leading-relaxed">
                Experiências definem onde sua história pesa nas rolagens.
              </p>
            </div>
          )
          : (
            <div className="space-y-2">
              {p.experiencias.filter(e => e.nome.trim() !== '').map((e, i) => (
                <div key={i} className="rounded-xl border overflow-hidden flex"
                  style={{ borderColor: `rgba(${accentRGB},0.25)` }}>
                  <div className="w-1 flex-shrink-0" style={{ background: `rgba(${accentRGB},0.5)` }} />
                  <div className="flex-1 flex items-center justify-between px-3 py-2.5 gap-2"
                    style={{ background: `rgba(${accentRGB},0.03)` }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-display text-xl leading-none flex-shrink-0"
                        style={{ color: `rgb(${accentRGB})`, filter: `drop-shadow(0 0 6px rgba(${accentRGB},0.5))` }}>
                        +{e.mod}
                      </span>
                      <span className="text-sm text-ink truncate">{e.nome}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { if (p.esperanca > 0) atualizar({ esperanca: p.esperanca - 1 }); }}
                      title="Gasta 1 Esperança — adicione +2 ao próximo teste"
                      disabled={p.esperanca === 0}
                      className="text-2xs border border-gold/30 text-gold/70 rounded-lg px-2.5 py-1.5 hover:bg-gold/10 flex-shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ◆ Usar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* ══════════════ ARMAS ATIVAS ══════════════ */}
      <div className="card-ornate mb-4">
        <div className="section-header mb-3">
          <span className="section-title">Armas Ativas</span>
        </div>
        {armasEquipadas.length === 0 && (
          <p className="text-2xs text-ink-dim italic">Nenhuma arma equipada.</p>
        )}
        <div className="space-y-3">
          {armasEquipadas.map(({ label, arma }) => (
            <div key={label} className="rounded-xl border overflow-hidden"
              style={{ borderColor: `rgba(${accentRGB}, 0.25)`, background: `rgba(${accentRGB}, 0.04)` }}>
              {/* Header da arma */}
              <div className="flex items-center justify-between px-3 py-2 border-b"
                style={{ borderColor: `rgba(${accentRGB}, 0.15)`, background: `rgba(${accentRGB}, 0.07)` }}>
                <span className="text-2xs uppercase tracking-widest font-medium"
                  style={{ color: `rgba(${accentRGB}, 0.8)` }}>{label}</span>
                <span className="font-display text-sm text-ink font-medium">{arma.nome}</span>
              </div>
              {/* Stats da arma */}
              <div className="grid grid-cols-3 gap-0 divide-x"
                style={{ borderColor: `rgba(${accentRGB}, 0.12)` }}>
                <div className="px-2 py-2.5 text-center"
                  style={{ borderColor: `rgba(${accentRGB}, 0.12)` }}>
                  <Lbl>Atributo</Lbl>
                  <div className="text-xs text-ink mt-0.5">{arma.atributo || '—'}</div>
                </div>
                <div className="px-2 py-2.5 text-center border-l"
                  style={{ borderColor: `rgba(${accentRGB}, 0.15)` }}>
                  <Lbl>Dano</Lbl>
                  <div className="font-display text-base leading-tight mt-0.5"
                    style={{ color: `rgb(${accentRGB})`, filter: `drop-shadow(0 0 6px rgba(${accentRGB},0.5))` }}>
                    {arma.dado || '—'}
                  </div>
                </div>
                <div className="px-2 py-2.5 text-center border-l"
                  style={{ borderColor: `rgba(${accentRGB}, 0.15)` }}>
                  <Lbl>Alcance</Lbl>
                  <div className="text-xs text-ink mt-0.5 leading-tight">{arma.alcance || '—'}</div>
                </div>
              </div>
              {arma.habilidade && (
                <div className="px-3 py-2 border-t"
                  style={{ borderColor: `rgba(${accentRGB}, 0.12)` }}>
                  <div className="text-2xs text-ink-muted leading-relaxed italic">{arma.habilidade}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ ARMADURA ATIVA ══════════════ */}
      {p.armadura_ativa.nome && (
        <div className="card-ornate mb-4">
          <div className="section-header mb-3">
            <span className="section-title">Armadura Ativa</span>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(180,150,80,0.3)' }}>
            {/* Header da armadura */}
            <div className="flex items-center justify-between px-3 py-2 border-b"
              style={{ borderColor: 'rgba(180,150,80,0.15)', background: 'rgba(180,150,80,0.07)' }}>
              <span className="text-xs font-medium text-armor-soft">{p.armadura_ativa.nome}</span>
              {(p.armadura_ativa.evasao_bonus ?? 0) !== 0 && (
                <span className="text-2xs border border-[rgba(180,150,80,0.3)] text-armor-soft/70 rounded px-1.5 py-0.5">
                  Evasão {(p.armadura_ativa.evasao_bonus ?? 0) > 0 ? '+' : ''}{p.armadura_ativa.evasao_bonus}
                </span>
              )}
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 divide-x bg-bg-inset/60" style={{ borderColor: 'rgba(180,150,80,0.12)' }}>
              <div className="px-2 py-2.5 text-center" style={{ borderColor: 'rgba(180,150,80,0.12)' }}>
                <Lbl>Limiares Base</Lbl>
                <div className="text-sm text-ink mt-0.5">{p.armadura_ativa.limiares_base[0]}/{p.armadura_ativa.limiares_base[1]}</div>
              </div>
              <div className="px-2 py-2.5 text-center border-l" style={{ borderColor: 'rgba(180,150,80,0.15)' }}>
                <Lbl>PA Base</Lbl>
                <div className="font-display text-lg text-armor-soft mt-0.5">{p.armadura_ativa.armadura_base}</div>
              </div>
              <div className="px-2 py-2.5 text-center border-l" style={{ borderColor: 'rgba(180,150,80,0.15)' }}>
                <Lbl>PA Atual</Lbl>
                <div className="font-display text-lg text-armor-soft mt-0.5">{p.pa_max - p.pa_marcados}/{p.pa_max}</div>
              </div>
            </div>
            {p.armadura_ativa.efeito && (
              <div className="px-3 py-2.5 border-t" style={{ borderColor: 'rgba(180,150,80,0.12)' }}>
                <div className="text-2xs text-ink-muted leading-relaxed italic">{p.armadura_ativa.efeito}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ CARTAS DE DOMÍNIO ══════════════ */}
      <Secao titulo="Cartas de Domínio" defaultOpen>
        <PainelCartas />
      </Secao>

      {/* ══════════════ HABILIDADES DE CLASSE ══════════════ */}
      {classeData && (
        <Secao titulo="Habilidades de Classe" defaultOpen={false}>
          <div className="space-y-2">
            {classeData.habilidades_classe.map(h => (
              <div key={h.nome} className="rounded-xl border overflow-hidden flex"
                style={{ borderColor: `rgba(${accentRGB},0.25)` }}>
                {/* Barra lateral colorida */}
                <div className="w-1 flex-shrink-0" style={{ background: `rgba(${accentRGB},0.7)` }} />
                {/* Conteúdo */}
                <div className="flex-1 px-3 py-2.5" style={{ background: `rgba(${accentRGB},0.04)` }}>
                  <div className="text-xs font-medium mb-1" style={{ color: `rgb(${accentRGB})` }}>{h.nome}</div>
                  <div className="text-2xs text-ink-muted leading-relaxed">{h.descricao}</div>
                </div>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {/* ══════════════ HABILIDADES DE SUBCLASSE ══════════════ */}
      {subclasseDados && (() => {
        const temEspec = p.patamares_marcados.some(
          pm => pm.patamar === 3 && pm.opcoes_escolhidas.includes('Subclasse Aprimorada')
        );
        const temMaestria = p.patamares_marcados.some(
          pm => pm.patamar === 4 && pm.opcoes_escolhidas.includes('Subclasse Aprimorada')
        );

        return (
          <Secao titulo={`Subclasse — ${p.subclasse}`} defaultOpen={false}>
            {subclasseDados.atributo_conjuracao && (
              <div className="flex items-center justify-between bg-bg-inset rounded-xl border border-arcane/30 px-3 py-2 mb-3">
                <span className="text-2xs text-ink-muted uppercase tracking-widest">Atributo de Conjuração</span>
                <span className="font-display text-sm text-arcane-glow">{subclasseDados.atributo_conjuracao}</span>
              </div>
            )}

            {subclasseDados.fundamental.length > 0 && (
              <div className="mb-3">
                <div className="text-2xs text-gold/60 uppercase tracking-widest mb-1.5">Habilidades Fundamentais</div>
                <div className="space-y-2">
                  {subclasseDados.fundamental.map(h => (
                    <div key={h.nome} className="rounded-xl border overflow-hidden flex"
                      style={{ borderColor: `rgba(${accentRGB},0.25)` }}>
                      <div className="w-1 flex-shrink-0" style={{ background: `rgba(${accentRGB},0.7)` }} />
                      <div className="flex-1 px-3 py-2.5" style={{ background: `rgba(${accentRGB},0.04)` }}>
                        <div className="text-xs font-medium mb-1" style={{ color: `rgb(${accentRGB})` }}>{h.nome}</div>
                        <div className="text-2xs text-ink-muted leading-relaxed">{h.descricao}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Especialização — Patamar 3 */}
            <div className="mb-2">
              <div className="text-2xs uppercase tracking-widest mb-1.5 flex items-center gap-2">
                {temEspec ? (
                  <span className="text-gold/70">Especialização</span>
                ) : (
                  <span className="text-ink-dim/60 flex items-center gap-1">
                    <Lock size={9} />
                    Especialização
                  </span>
                )}
                <span className={`border rounded px-1.5 py-0.5 text-[9px] ${
                  temEspec ? 'border-gold/40 text-gold/70' : 'border-border/30 text-ink-dim/50'
                }`}>
                  Patamar 3
                </span>
                {temEspec && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="text-[9px] text-gold border border-gold/30 bg-gold/10 rounded px-1.5 py-0.5"
                  >
                    ✦ Desbloqueada
                  </motion.span>
                )}
              </div>
              <div className={`rounded-xl border overflow-hidden flex transition-opacity ${
                temEspec ? '' : 'opacity-40'
              }`} style={{ borderColor: temEspec ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.15)' }}>
                <div className="w-1 flex-shrink-0" style={{ background: temEspec ? 'rgba(212,175,55,0.8)' : 'rgba(212,175,55,0.25)' }} />
                <div className="flex-1 px-3 py-2.5" style={{ background: temEspec ? 'rgba(212,175,55,0.04)' : undefined }}>
                  <div className={`text-xs font-medium mb-1 ${temEspec ? 'text-gold/80' : 'text-ink-dim/70'}`}>
                    {subclasseDados.especializacao.nome}
                  </div>
                  <div className="text-2xs text-ink-muted leading-relaxed">{subclasseDados.especializacao.descricao}</div>
                </div>
              </div>
            </div>

            {/* Maestria — Patamar 4 */}
            <div>
              <div className="text-2xs uppercase tracking-widest mb-1.5 flex items-center gap-2">
                {temMaestria ? (
                  <span className="text-arcane-glow/80">Maestria</span>
                ) : (
                  <span className="text-ink-dim/60 flex items-center gap-1">
                    <Lock size={9} />
                    Maestria
                  </span>
                )}
                <span className={`border rounded px-1.5 py-0.5 text-[9px] ${
                  temMaestria ? 'border-arcane/40 text-arcane-glow/70' : 'border-border/30 text-ink-dim/50'
                }`}>
                  Patamar 4
                </span>
                {temMaestria && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="text-[9px] text-arcane-glow border border-arcane/30 bg-arcane/10 rounded px-1.5 py-0.5"
                  >
                    ✦ Desbloqueada
                  </motion.span>
                )}
              </div>
              <div className={`rounded-xl border overflow-hidden flex transition-opacity ${
                temMaestria ? '' : 'opacity-40'
              }`} style={{ borderColor: temMaestria ? 'rgba(123,63,160,0.35)' : 'rgba(123,63,160,0.15)' }}>
                <div className="w-1 flex-shrink-0" style={{ background: temMaestria ? 'rgba(123,63,160,0.8)' : 'rgba(123,63,160,0.25)' }} />
                <div className="flex-1 px-3 py-2.5" style={{ background: temMaestria ? 'rgba(123,63,160,0.04)' : undefined }}>
                  <div className={`text-xs font-medium mb-1 ${temMaestria ? 'text-arcane-glow/80' : 'text-ink-dim/70'}`}>
                    {subclasseDados.maestria.nome}
                  </div>
                  <div className="text-2xs text-ink-muted leading-relaxed">{subclasseDados.maestria.descricao}</div>
                </div>
              </div>
            </div>
          </Secao>
        );
      })()}

      {/* ══════════════ ANCESTRALIDADE ══════════════ */}
      {ancestralidadeDados && (
        <Secao titulo={`Ancestralidade — ${p.ancestralidade}`} defaultOpen={false}>
          <p className="text-2xs text-ink-dim leading-relaxed mb-3">{ancestralidadeDados.descricao}</p>
          <div className="space-y-2">
            {[ancestralidadeDados.habilidade_1, ancestralidadeDados.habilidade_2].map(h => (
              <div key={h.nome} className="rounded-xl border overflow-hidden flex border-gold/20">
                <div className="w-1 flex-shrink-0 bg-gold/40" />
                <div className="flex-1 px-3 py-2.5 bg-gold/[0.02]">
                  <div className="text-xs text-gold/80 font-medium mb-1">{h.nome}</div>
                  <div className="text-2xs text-ink-muted leading-relaxed">{h.descricao}</div>
                </div>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {/* ══════════════ COMUNIDADE ══════════════ */}
      {comunidadeDados && (
        <Secao titulo={`Comunidade — ${p.comunidade}`} defaultOpen={false}>
          <p className="text-2xs text-ink-dim leading-relaxed mb-3">{comunidadeDados.descricao}</p>
          <div className="rounded-xl border overflow-hidden flex border-gold/20">
            <div className="w-1 flex-shrink-0 bg-gold/40" />
            <div className="flex-1 px-3 py-2.5 bg-gold/[0.02]">
              <div className="text-xs text-gold/80 font-medium mb-1">{comunidadeDados.habilidade.nome}</div>
              <div className="text-2xs text-ink-muted leading-relaxed">{comunidadeDados.habilidade.descricao}</div>
            </div>
          </div>
        </Secao>
      )}

      {/* ══════════════ INVENTÁRIO ══════════════ */}
      <Secao titulo={`Inventário${p.inventario.length > 0 ? ` (${p.inventario.length})` : ''}`} defaultOpen={false}>
        <AnimatePresence initial={false}>
          {p.inventario.length === 0 && (
            <motion.p key="vazio"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-2xs text-ink-dim text-center py-3 mb-3">
              Inventário vazio.
            </motion.p>
          )}
          {p.inventario.map(item => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="flex items-start gap-2 rounded-lg border border-border/40 bg-bg-inset px-2.5 py-2 group mb-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink leading-tight">{item.nome}</div>
                {item.descricao && (
                  <p className="text-2xs text-ink-muted mt-0.5 leading-relaxed">{item.descricao}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                {item.tipo !== 'manual' && (
                  <span className="text-[9px] border rounded px-1 py-0.5"
                    style={item.tipo === 'consumivel'
                      ? { borderColor: 'rgba(100,200,160,0.35)', color: 'rgba(100,200,160,0.85)', background: 'rgba(100,200,160,0.08)' }
                      : { borderColor: 'rgba(212,175,55,0.35)', color: 'rgba(212,175,55,0.85)', background: 'rgba(212,175,55,0.08)' }}>
                    {item.tipo}
                  </span>
                )}
                <button type="button"
                  onClick={() => atualizar({ inventario: p.inventario.filter(i => i.id !== item.id) })}
                  className="p-1 text-ink-dim hover:text-blood-glow opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={11} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AdicionarItemForm onAdicionar={novoItem => atualizar({ inventario: [...p.inventario, novoItem] })} />

        {/* Ouro */}
        <div className="border-t border-border/40 pt-3">
          <div className="section-header mb-2"><span className="section-title text-sm">Ouro</span></div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'punhados' as const, label: 'Punhados' },
              { key: 'bolsas'   as const, label: 'Bolsas'   },
              { key: 'baus'     as const, label: 'Baús'     },
            ].map(({ key, label }) => (
              <div key={key} className="bg-bg-inset rounded-xl border border-border px-2 py-2 text-center">
                <Lbl>{label}</Lbl>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => atualizar({ ouro: { ...p.ouro, [key]: Math.max(0, p.ouro[key] - 1) } })}
                    className="w-6 h-6 rounded bg-bg-inset border border-border text-ink-muted text-xs hover:border-gold/50 transition-colors"
                  >−</button>
                  <span className="font-display text-base text-gold w-5 text-center">{p.ouro[key]}</span>
                  <button
                    type="button"
                    onClick={() => atualizar({ ouro: { ...p.ouro, [key]: p.ouro[key] + 1 } })}
                    className="w-6 h-6 rounded bg-bg-inset border border-border text-ink-muted text-xs hover:border-gold/50 transition-colors"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Secao>

      {/* ══════════════ AÇÕES ══════════════ */}
      <button type="button" onClick={() => setModo('levelup')} className="btn-primary w-full mt-4">
        <TrendingUp size={16} />
        Subir de Nível (→ {p.nivel + 1})
      </button>

      <button
        type="button"
        disabled={pdfCarregando}
        onClick={async () => {
          setPdfCarregando(true);
          try {
            const { exportarFichaPDF } = await import('@/lib/exportarPDF');
            await exportarFichaPDF(p);
          } finally {
            setPdfCarregando(false);
          }
        }}
        className="btn w-full mt-2 disabled:opacity-50"
      >
        {pdfCarregando
          ? <><Loader size={14} className="animate-spin" /> Gerando PDF...</>
          : <><FileText size={14} /> Gerar PDF da Ficha</>}
      </button>
    </div>
    </div>
  );
}
