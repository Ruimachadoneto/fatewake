import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, Camera } from 'lucide-react';
import { useApp } from '@/store/app';
import { CLASSES } from '@/data';
import type { NomeClasse } from '@/types/personagem';

const CLASS_ACCENTS: Record<string, string> = {
  'Bardo':        '196, 100, 196',
  'Druida':       '80, 180, 100',
  'Feiticeiro':   '120, 80, 200',
  'Guardião':     '80, 140, 210',
  'Guerreiro':    '200, 100, 60',
  'Ladino':       '100, 160, 160',
  'Mago':         '60, 180, 210',
  'Patrulheiro':  '100, 170, 80',
  'Serafim':      '220, 180, 80',
};

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

export function TelaSaga() {
  const { personagemAtivo: p, atualizar } = useApp();

  if (!p) return null;

  const accentRGB = CLASS_ACCENTS[p.classe ?? ''] ?? '212, 175, 55';
  const classeData = p.classe ? CLASSES[p.classe as NomeClasse] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-6">

      {/* Mini header do personagem */}
      <div className="flex items-center gap-3 mb-5 card py-3 px-4"
        style={{ borderColor: `rgba(${accentRGB}, 0.25)` }}>
        <div className="w-10 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${accentRGB}, 0.12)`, border: `1px solid rgba(${accentRGB}, 0.25)` }}>
          <Camera size={16} style={{ color: `rgba(${accentRGB}, 0.6)` }} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm text-ink truncate tracking-wider">
            {p.nome || 'Sem nome'}
          </div>
          <div className="text-[10px] text-ink-dim truncate mt-0.5">
            {p.classe
              ? `Nv.${p.nivel} · ${p.classe}${p.subclasse ? ` · ${p.subclasse}` : ''}`
              : 'Em criação'}
          </div>
        </div>
        <div className="ml-auto">
          <span className="text-2xs px-2 py-0.5 rounded-full font-medium"
            style={{
              color: `rgb(${accentRGB})`,
              background: `rgba(${accentRGB}, 0.1)`,
              border: `1px solid rgba(${accentRGB}, 0.2)`,
            }}>
            Saga
          </span>
        </div>
      </div>

      {/* ══════════════ DIÁRIO DA SAGA ══════════════ */}
      <Secao titulo="Diário da Saga" icone={<BookOpen size={14} className="text-gold/60" />} defaultOpen>
        <textarea
          className="w-full rounded-xl border border-border/40 bg-bg-inset px-3 py-3 text-sm text-ink leading-relaxed resize-none focus:outline-none focus:border-gold/30 transition-colors placeholder:text-ink-dim/40"
          style={{
            minHeight: '160px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: '1.75',
            letterSpacing: '0.01em',
          }}
          value={p.notas}
          onChange={e => atualizar({ notas: e.target.value })}
          placeholder={"Sessão 1 — O herói começa sua jornada...\n\n• Pistas descobertas\n• NPCs encontrados\n• Segredos revelados"}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2 flex-wrap">
            {(['Pista', 'NPC', 'Segredo', 'Objetivo'] as const).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => atualizar({ notas: p.notas + (p.notas && !p.notas.endsWith('\n') ? '\n' : '') + `[${tag}] ` })}
                className="text-2xs px-2 py-0.5 rounded-md border border-border/50 text-ink-dim hover:border-gold/40 hover:text-gold/70 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
          {p.notas && (
            <span className="text-2xs text-ink-dim/40 flex-shrink-0">
              {p.notas.trim().split(/\s+/).filter(Boolean).length} palavras
            </span>
          )}
        </div>
      </Secao>

      {/* ══════════════ VÍNCULOS ══════════════ */}
      {p.vinculos.some(v => v.trim()) && (
        <Secao titulo="Vínculos" defaultOpen>
          <p className="text-2xs text-ink-dim mb-3 leading-relaxed">
            Quando um aliado age heroicamente a seu favor, ganhe 1 Esperança. Vínculos definem essas relações.
          </p>
          <div className="space-y-2">
            {p.vinculos.map((v, i) => {
              const template = classeData?.vinculos?.[i];
              if (!v.trim() && !template) return null;
              return (
                <div key={i} className="rounded-xl border overflow-hidden"
                  style={{ borderColor: `rgba(${accentRGB},0.2)` }}>
                  {template && (
                    <div className="px-3 pt-2.5 pb-1">
                      <p className="text-2xs text-ink-dim/70 italic leading-snug">{template}</p>
                    </div>
                  )}
                  <div className="px-3 pb-2.5" style={{ background: v.trim() ? `rgba(${accentRGB},0.04)` : undefined }}>
                    {v.trim() ? (
                      <p className="text-sm text-ink leading-relaxed">
                        <span className="font-display text-base mr-2" style={{ color: `rgb(${accentRGB})` }}>◆</span>
                        {v}
                      </p>
                    ) : (
                      <p className="text-2xs text-ink-dim/50 italic">Não preenchido</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Secao>
      )}

      {/* ══════════════ ORIGEM ══════════════ */}
      {p.respostas_origem.some(r => r.trim()) && (
        <Secao titulo="Origem" defaultOpen={false}>
          <div className="space-y-3">
            {p.respostas_origem.map((resp, i) => {
              const pergunta = classeData?.perguntas_origem?.[i];
              if (!resp.trim()) return null;
              return (
                <div key={i}>
                  {pergunta && (
                    <p className="text-2xs text-ink-dim/70 italic mb-1 leading-snug">{pergunta}</p>
                  )}
                  <p className="text-sm text-ink leading-relaxed pl-3"
                    style={{ borderLeft: `2px solid rgba(${accentRGB},0.35)` }}>
                    {resp}
                  </p>
                </div>
              );
            })}
          </div>
        </Secao>
      )}

    </div>
  );
}
