import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useSessao } from '@/store/sessao';
import type { PersonagemSala } from '@/types/supabase';
import type { Personagem, Atributo } from '@/types/personagem';
import { ChevronLeft, Shield, X, Users2, Wrench, BookOpen, ScrollText, Zap, Send, MessageSquare } from 'lucide-react';
import { FerramentasGM, CANAL_REVELA } from './FerramentasGM';
import { BibliotecaGM } from '@/views/campanha/BibliotecaGM';

const ATRIBUTOS: Atributo[] = ['Agilidade', 'Força', 'Acuidade', 'Instinto', 'Presença', 'Conhecimento'];
const ATTR_SHORT: Record<Atributo, string> = {
  Agilidade: 'AGI', Força: 'FOR', Acuidade: 'ACU',
  Instinto: 'INS', Presença: 'PRE', Conhecimento: 'CON',
};

function getP(slot: PersonagemSala): Personagem | null {
  const raw = slot.personagem as Partial<Personagem> | null;
  if (!raw || !raw.nome) return null;
  return raw as Personagem;
}

function attrTotal(p: Personagem, attr: Atributo): number {
  const a = p.atributos[attr];
  return (a.valor ?? 0) + (a.bonus ?? 0);
}

function BarraRecurso({ label, valor, max, cor }: {
  label: string; valor: number; max: number; cor: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, (max - valor) / max)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-2xs text-ink-dim uppercase tracking-widest">{label}</span>
        <motion.span
          key={valor}
          className={`text-2xs font-display ${cor}`}
          initial={{ scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          {max - valor}/{max}
        </motion.span>
      </div>
      <div className="h-1.5 bg-bg-inset rounded-full overflow-hidden border border-border/30">
        <motion.div
          className={`h-full rounded-full ${cor.replace('text-', 'bg-')}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Tracker de Medo — círculo de 12 pips ────────────────────────────────────

function CirculoMedo({ medo, max = 12 }: { medo: number; max?: number }) {
  const R = 54, CX = 72, CY = 72, SZ = 144, PR = 5.5;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>
        {/* Anéis decorativos */}
        <circle cx={CX} cy={CY} r={R + 11} fill="none" stroke="rgba(157,31,45,0.07)" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r={R - 11} fill="rgba(157,31,45,0.04)" stroke="rgba(157,31,45,0.06)" strokeWidth="1" />
        {/* 12 pips */}
        {Array.from({ length: max }, (_, i) => {
          const angle = ((i * 360 / max) - 90) * (Math.PI / 180);
          const x = CX + R * Math.cos(angle);
          const y = CY + R * Math.sin(angle);
          const filled = i < medo;
          return (
            <circle key={i}
              cx={x} cy={y} r={filled && i >= 9 ? PR + 1 : PR}
              fill={filled ? (i >= 9 ? '#DC2828' : i >= 6 ? '#A81E2A' : '#7A1220') : '#100A0C'}
              stroke={filled ? (i >= 9 ? 'rgba(240,60,80,0.7)' : i >= 6 ? 'rgba(200,50,65,0.5)' : 'rgba(157,31,45,0.4)') : 'rgba(157,31,45,0.15)'}
              strokeWidth="1"
            />
          );
        })}
        {/* Marcadores de limiar (posições 3, 6, 9) */}
        {[3, 6, 9].map(t => {
          const angle = ((t * 360 / max) - 90) * (Math.PI / 180);
          const x = CX + (R + 17) * Math.cos(angle);
          const y = CY + (R + 17) * Math.sin(angle);
          return <circle key={t} cx={x} cy={y} r={1.5} fill="rgba(157,31,45,0.35)" />;
        })}
      </svg>
      {/* Número sobreposto */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          key={medo}
          className="font-display text-5xl text-blood-glow leading-none"
          style={{
            filter: medo >= 9 ? 'drop-shadow(0 0 14px rgba(157,31,45,0.9))'
                  : medo >= 6 ? 'drop-shadow(0 0 8px rgba(157,31,45,0.7))'
                  : medo > 0  ? 'drop-shadow(0 0 4px rgba(157,31,45,0.5))'
                  : undefined,
          }}
          initial={{ scale: 1.3 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          {medo}
        </motion.div>
        <div className="text-[9px] text-blood-glow/40 uppercase tracking-[0.25em] mt-0.5">medo</div>
      </div>
    </div>
  );
}

function FichaExpandida({ slot, onClose, onKick, confirmandoKick, kickError, onCondicaoToggle }: {
  slot: PersonagemSala; onClose: () => void; onKick: () => void; confirmandoKick: boolean; kickError: string | null;
  onCondicaoToggle: (condicoes: string[]) => void;
}) {
  const p = getP(slot);
  const [condicoesLocais, setCondicoesLocais] = useState<string[]>(p?.condicoes ?? []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="w-full max-h-[90dvh] overflow-y-auto bg-bg-card rounded-t-2xl border-t border-border/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-bg-card z-10">
          <div className="w-9 h-1 rounded-full bg-border/60" />
        </div>

        <div className="px-4 pb-8">
          {(() => {
            const accent = p?.classe ? (CLASSE_ACCENT_GM[p.classe] ?? '212,175,55') : '212,175,55';
            return (
              <div className="flex items-start gap-3 mb-4">
                {/* Retrato */}
                <div className="w-16 h-[80px] rounded-xl overflow-hidden flex-shrink-0 border"
                  style={{ borderColor: `rgba(${accent},0.45)`, boxShadow: `0 0 18px rgba(${accent},0.18)` }}>
                  {p?.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: `rgba(${accent},0.1)` }}>
                      <span className="font-display text-3xl" style={{ color: `rgba(${accent},0.6)` }}>
                        {(p?.nome || slot.nome_jogador).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg text-gold tracking-wide">
                    {p?.nome || slot.nome_jogador}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: `rgb(${accent})` }}>
                    {p?.classe ?? '—'}
                    {p?.subclasse && <span className="text-ink-dim font-normal"> · {p.subclasse}</span>}
                    {p?.nivel && <span className="text-ink-dim font-normal"> · Nível {p.nivel}</span>}
                  </div>
                  {p && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[
                        `Evasão ${p.evasao}`,
                        `Prof. +${p.proficiencia}`,
                        ...(p.limiares[0] > 0 ? [`Limiares ${p.limiares[0]}/${p.limiares[1]}`] : []),
                        ...(p.ancestralidade ? [p.ancestralidade] : []),
                      ].map(tag => (
                        <span key={tag} className="text-2xs bg-bg-inset border border-border/40 rounded px-2 py-0.5 text-ink-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={onClose}
                  className="p-1.5 text-ink-dim hover:text-ink rounded-lg hover:bg-bg-inset transition-colors flex-shrink-0">
                  <X size={18} />
                </button>
              </div>
            );
          })()}

          {p ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap size={11} className="text-blood-glow/70" />
                  <span className="text-2xs text-ink-dim uppercase tracking-widest">Condições</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {CONDICOES_PRESET.map(c => {
                    const ativa = condicoesLocais.includes(c);
                    return (
                      <button key={c} type="button"
                        onClick={() => {
                          const nova = ativa
                            ? condicoesLocais.filter(x => x !== c)
                            : [...condicoesLocais, c];
                          setCondicoesLocais(nova);
                          onCondicaoToggle(nova);
                        }}
                        className={`text-2xs border rounded-lg px-2.5 py-1 transition-all font-medium ${
                          ativa
                            ? 'text-blood-glow border-blood/50 bg-blood/10'
                            : 'text-ink-muted border-border/40 hover:border-border hover:text-ink'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card space-y-2.5">
                <BarraRecurso label="PV" valor={p.pv_marcados} max={p.pv_max} cor="text-hp-soft" />
                <BarraRecurso label="PF" valor={p.pf_marcados} max={p.pf_max} cor="text-arcane-glow" />
                {p.pa_max > 0 && (
                  <BarraRecurso label="ARM" valor={p.pa_marcados} max={p.pa_max} cor="text-armor-soft" />
                )}
                <div className="flex items-center justify-between pt-1 border-t border-border/30">
                  <span className="text-2xs text-ink-dim uppercase tracking-widest">Esperança</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span key={i} className={`text-sm leading-none ${i < p.esperanca ? 'text-gold' : 'text-border'}`}>
                        {i < p.esperanca ? '◆' : '◇'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="section-header mb-2">
                  <span className="section-title">Atributos</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {ATRIBUTOS.map(attr => {
                    const total = attrTotal(p, attr);
                    return (
                      <div key={attr} className="bg-bg-inset rounded-xl border border-border/50 py-2 text-center">
                        <div className="text-2xs text-ink-dim uppercase leading-none mb-1" style={{ fontSize: '8px' }}>
                          {ATTR_SHORT[attr]}
                        </div>
                        <div className={`font-display text-sm leading-none ${total >= 0 ? 'text-gold' : 'text-blood-glow'}`}>
                          {total >= 0 ? '+' : ''}{total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(p.arma_principal?.nome || p.arma_secundaria?.nome) && (
                <div>
                  <div className="section-header mb-2">
                    <span className="section-title">Armas</span>
                  </div>
                  <div className="space-y-1.5">
                    {[p.arma_principal, p.arma_secundaria].filter(a => a?.nome).map((a, i) => (
                      <div key={i} className="card py-2 px-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm text-ink">{a!.nome}</span>
                          {a!.atributo && <span className="text-2xs text-ink-dim ml-2">{a!.atributo}</span>}
                          {a!.alcance && <span className="text-2xs text-ink-dim ml-1">· {a!.alcance}</span>}
                        </div>
                        <span className="font-mono text-sm text-gold">{a!.dado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {p.experiencias?.length > 0 && (
                <div>
                  <div className="section-header mb-2">
                    <span className="section-title">Experiências</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.experiencias.map((e, i) => (
                      <span key={i} className="text-2xs bg-bg-inset border border-border/40 rounded-lg px-2 py-1 text-ink-muted">
                        {e.nome} <span className="text-gold">+{e.mod}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(p.cartas_mao?.length > 0 || p.cartas_reserva?.length > 0) && (
                <div className="flex gap-3 text-2xs text-ink-dim">
                  <span>Cartas na mão: <span className="text-gold">{p.cartas_mao?.length ?? 0}</span></span>
                  <span>Na reserva: <span className="text-arcane-glow">{p.cartas_reserva?.length ?? 0}</span></span>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-6">
              <p className="text-sm text-ink-muted">Sem ficha vinculada.</p>
              <p className="text-2xs text-ink-dim mt-1">O jogador ainda não selecionou um personagem.</p>
            </div>
          )}

          <div className="border-t border-border/30 pt-4 mt-2">
            <button type="button" onClick={onKick}
              className={`w-full text-2xs rounded-xl py-2 transition-all border ${
                confirmandoKick
                  ? 'text-blood-glow border-blood/60 bg-blood/10 font-medium'
                  : 'text-blood-glow/50 hover:text-blood-glow border-blood/20 hover:border-blood/40'
              }`}>
              {confirmandoKick ? 'Confirmar remoção? Toque novamente.' : 'Remover jogador da sala'}
            </button>
            {kickError && (
              <p className="text-2xs text-blood-glow text-center mt-2">{kickError}</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const CONDICOES_PRESET = ['Escondido', 'Imobilizado', 'Vulnerável'];

const CLASSE_ACCENT_GM: Record<string, string> = {
  'Bardo': '196,100,196', 'Druida': '80,180,100', 'Feiticeiro': '120,80,200',
  'Guardião': '80,140,210', 'Guerreiro': '200,100,60', 'Ladino': '100,160,160',
  'Mago': '60,180,210', 'Patrulheiro': '100,170,80', 'Serafim': '220,180,80',
};

function CartaoJogador({ slot, onClick }: { slot: PersonagemSala; onClick: () => void }) {
  const p = getP(slot);
  const accent = p?.classe ? (CLASSE_ACCENT_GM[p.classe] ?? '212,175,55') : '212,175,55';
  const condicoes = p?.condicoes ?? [];
  const pvCritical = p ? (p.pv_marcados >= p.limiares[0] && p.limiares[0] > 0) : false;
  const incapacitado = p ? p.pv_marcados >= p.pv_max : false;

  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left transition-all active:scale-[0.99] rounded-xl border overflow-hidden ${slot.online ? '' : 'opacity-55'}`}
      style={{ borderColor: `rgba(${accent},0.3)`, borderLeftWidth: '3px', borderLeftColor: `rgba(${accent},0.7)` }}
    >
      {/* Cabeçalho: retrato + identidade */}
      <div className="flex items-start gap-3 p-3" style={{ background: `rgba(${accent},0.04)` }}>
        {/* Retrato */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-[70px] rounded-xl overflow-hidden border"
            style={{ borderColor: `rgba(${accent},0.4)`, boxShadow: `0 0 14px rgba(${accent},0.15)` }}>
            {p?.foto_url ? (
              <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: `rgba(${accent},0.1)` }}>
                <span className="font-display text-2xl" style={{ color: `rgba(${accent},0.7)` }}>
                  {(p?.nome || slot.nome_jogador).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-bg-card ${slot.online ? 'bg-green-400' : 'bg-bg-inset'}`} />
        </div>

        {/* Identidade */}
        <div className="flex-1 min-w-0 py-0.5">
          <div className="font-display text-base text-gold tracking-wide truncate">
            {p?.nome || slot.nome_jogador}
          </div>
          <div className="text-2xs mt-0.5">
            {p?.classe
              ? <span style={{ color: `rgb(${accent})` }}>{p.classe}</span>
              : <span className="text-ink-dim italic">Sem ficha</span>
            }
            {p?.nivel && <span className="text-ink-dim"> · Nv.{p.nivel}</span>}
            {p?.ancestralidade && <span className="text-ink-dim"> · {p.ancestralidade}</span>}
          </div>
          {p && (
            <div className="flex items-center gap-1 flex-wrap mt-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className={`text-xs leading-none ${i < p.esperanca ? 'text-gold' : 'text-border/40'}`}>
                    {i < p.esperanca ? '◆' : '◇'}
                  </span>
                ))}
              </div>
              {condicoes.map(c => (
                <span key={c} className="ml-1 text-2xs text-blood-glow border border-blood/30 rounded px-1.5 py-0.5">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barras de recurso */}
      {p ? (
        <div className="px-3 pb-2.5 pt-1 space-y-1.5">
          <BarraRecurso label="PV" valor={p.pv_marcados} max={p.pv_max} cor="text-hp-soft" />
          <BarraRecurso label="PF" valor={p.pf_marcados} max={p.pf_max} cor="text-arcane-glow" />
          {p.pa_max > 0 && (
            <BarraRecurso label="ARM" valor={p.pa_marcados} max={p.pa_max} cor="text-armor-soft" />
          )}
          {(pvCritical || incapacitado) && (
            <div className={`text-2xs text-center pt-0.5 font-medium tracking-wide ${incapacitado ? 'text-blood-glow animate-pulse' : 'text-blood-glow/70'}`}>
              {incapacitado ? '⚠ Incapacitado' : p.pv_marcados >= p.limiares[1] ? '● Dano Grave' : '● Dano Maior'}
            </div>
          )}
        </div>
      ) : (
        <div className="px-3 pb-3">
          <p className="text-2xs text-ink-dim">Aguardando conexão do jogador.</p>
        </div>
      )}
    </button>
  );
}

export function TelaSalaGM() {
  const { campanha, personagensSala, setPersonagensSala, upsertPersonagemSala, removerPersonagemSala, setTela } = useSessao();
  const [medo, setMedo] = useState(campanha?.medo ?? 0);
  const [salvandoMedo, setSalvandoMedo] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PersonagemSala | null>(null);
  const [aba, setAba] = useState<'fichas' | 'ferramentas' | 'biblioteca' | 'roteiro'>('fichas');
  const [kickConfirm, setKickConfirm] = useState<string | null>(null);
  const [kickError, setKickError] = useState<string | null>(null);
  const [mensagemGM, setMensagemGM] = useState('');
  const [mensagemEnviada, setMensagemEnviada] = useState(false);
  const broadcastChRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => { setMedo(campanha?.medo ?? 0); }, [campanha?.medo]);

  function publicarMensagem() {
    if (!mensagemGM.trim()) return;
    broadcastChRef.current?.send({
      type: 'broadcast',
      event: 'gm_message',
      payload: { texto: mensagemGM.trim() },
    });
    setMensagemEnviada(true);
    setTimeout(() => setMensagemEnviada(false), 2500);
  }

  function setCondicoes(slotId: string, condicoes: string[]) {
    broadcastChRef.current?.send({
      type: 'broadcast',
      event: 'condition_update',
      payload: { slotId, condicoes },
    });
  }

  async function kickJogador(slotId: string) {
    if (kickConfirm !== slotId) { setKickConfirm(slotId); return; }
    setKickError(null);
    const { error } = await supabase.from('personagens_sala').delete().eq('id', slotId);
    if (!error) {
      broadcastChRef.current?.send({ type: 'broadcast', event: 'kick', payload: { slotId } });
      removerPersonagemSala(slotId); // atualiza estado local imediatamente — não depende do evento DELETE
      setSelectedSlot(null);
    } else {
      setKickError('Falha ao remover. Verifique as políticas RLS no Supabase.');
    }
    setKickConfirm(null);
  }

  useEffect(() => {
    if (!campanha) return;

    supabase
      .from('personagens_sala')
      .select('*')
      .eq('campanha_id', campanha.id)
      .then(({ data }) => {
        if (data) setPersonagensSala(data as PersonagemSala[]);
      });

    const channel = supabase
      .channel(`sala-gm-${campanha.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personagens_sala', filter: `campanha_id=eq.${campanha.id}` },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            upsertPersonagemSala(payload.new as PersonagemSala);
            setSelectedSlot(prev =>
              prev?.id === (payload.new as PersonagemSala).id ? (payload.new as PersonagemSala) : prev
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            removerPersonagemSala(deletedId);
            setSelectedSlot(prev => (prev?.id === deletedId ? null : prev));
            setKickConfirm(prev => (prev === deletedId ? null : prev));
          }
        }
      )
      .subscribe();

    const broadcastCh = supabase.channel(CANAL_REVELA(campanha.id));
    broadcastCh.subscribe((status) => {
      if (status === 'SUBSCRIBED') broadcastChRef.current = broadcastCh;
    });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastCh);
      broadcastChRef.current = null;
    };
  }, [campanha]);

  async function alterarMedo(delta: number) {
    const anterior = medo;
    const novo = Math.max(0, Math.min(12, medo + delta));
    setMedo(novo);
    setSalvandoMedo(true);
    const { error } = await supabase.from('campanhas').update({ medo: novo } as never).eq('id', campanha!.id);
    if (error) setMedo(anterior);
    setSalvandoMedo(false);
  }

  async function encerrarSessao() {
    if (!campanha) return;
    await supabase.from('campanhas').update({ sessao_ativa: false } as never).eq('id', campanha.id);
    setTela('campanhas');
  }

  if (!campanha) return null;

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header sem tabs */}
      <div className="sticky top-0 z-10 bg-bg-card/95 backdrop-blur-md border-b border-border/30">
        <div className="max-w-2xl mx-auto px-3 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-sm text-gold tracking-wide">{campanha.nome}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[10px] text-gold/60 bg-bg-inset border border-gold/15 rounded px-1.5 py-0.5 tracking-widest">
                  {campanha.codigo_sala}
                </span>
                <span className="text-[9px] text-green-400 border border-green-400/30 rounded px-1.5 py-0.5 animate-pulse">ao vivo</span>
              </div>
            </div>
            <button type="button" onClick={encerrarSessao} className="btn text-xs gap-1 flex-shrink-0">
              <ChevronLeft size={12} /> Encerrar
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo por aba */}
      <AnimatePresence mode="wait" initial={false}>
        {aba === 'ferramentas' ? (
          <motion.div key="ferramentas"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="max-w-2xl mx-auto w-full px-3 py-4 pb-24">
            <FerramentasGM campanhaId={campanha.id} jogadores={personagensSala} />
          </motion.div>
        ) : aba === 'biblioteca' ? (
          <motion.div key="biblioteca"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="max-w-2xl mx-auto w-full px-3 py-4 pb-24">
            <BibliotecaGM />
          </motion.div>
        ) : aba === 'roteiro' ? (
          <motion.div key="roteiro"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ height: 'calc(100dvh - 118px)' }}
            className="w-full">
            <iframe
              src="/sessoes/Sessao3_AsRaizesDaDor.html"
              className="w-full h-full border-0"
              title="Roteiro da Sessão"
            />
          </motion.div>
        ) : (
          <motion.div key="fichas"
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}>
            <div className="max-w-2xl mx-auto px-3 py-4 pb-24 space-y-4">

              {/* Tracker de Medo */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 }}
                className="card-blood"
              >
                <div className="section-header mb-3">
                  <span className="section-title" style={{ color: 'rgb(224, 112, 132)' }}>Dado de Medo</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button type="button" onClick={() => alterarMedo(-1)} disabled={medo <= 0}
                    className="w-12 h-12 rounded-xl bg-bg-inset border border-blood/40 text-blood-glow text-2xl font-display hover:bg-blood/10 active:scale-95 disabled:opacity-30 transition-all">
                    −
                  </button>
                  <CirculoMedo medo={medo} />
                  <button type="button" onClick={() => alterarMedo(1)} disabled={medo >= 12}
                    className="w-12 h-12 rounded-xl bg-bg-inset border border-blood/40 text-blood-glow text-2xl font-display hover:bg-blood/10 active:scale-95 disabled:opacity-30 transition-all">
                    +
                  </button>
                </div>
                {salvandoMedo && <p className="text-2xs text-ink-dim/60 text-center mt-2">Sincronizando...</p>}
              </motion.div>

              {/* Jogadores */}
              <div>
                <div className="section-header mb-3">
                  <span className="section-title">Jogadores</span>
                </div>

                {personagensSala.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="card text-center py-8"
                  >
                    <Shield size={28} className="text-ink-dim mx-auto mb-2" strokeWidth={1.2} />
                    <p className="text-ink-muted text-sm">Nenhum jogador na sala ainda.</p>
                    <p className="text-2xs text-ink-dim mt-1">
                      Compartilhe o código{' '}
                      <span className="font-mono text-gold tracking-wider">{campanha.codigo_sala}</span>{' '}
                      com os jogadores.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {personagensSala.map((slot, i) => (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 340, damping: 30 }}
                      >
                        <CartaoJogador slot={slot} onClick={() => setSelectedSlot(slot)} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mensagem para jogadores */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare size={13} className="text-gold/70" />
                  <span className="text-2xs text-gold/70 uppercase tracking-widest font-display">Mensagem aos Jogadores</span>
                </div>
                <div className="space-y-2">
                  <textarea
                    className="input min-h-[64px] resize-none w-full text-sm"
                    value={mensagemGM}
                    onChange={e => setMensagemGM(e.target.value)}
                    placeholder="Escreva um recado visível a todos os jogadores..."
                  />
                  <button type="button" onClick={publicarMensagem}
                    disabled={!mensagemGM.trim()}
                    className={`w-full flex items-center justify-center gap-2 text-sm py-2 rounded-xl border font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      mensagemEnviada
                        ? 'border-green-400/40 bg-green-400/10 text-green-400'
                        : 'border-gold/40 bg-gold/8 text-gold hover:bg-gold/15'
                    }`}>
                    <Send size={13} />
                    {mensagemEnviada ? 'Publicado!' : 'Publicar para jogadores'}
                  </button>
                </div>
              </div>

              {/* Notas do GM (privadas) */}
              <div>
                <div className="section-header mb-2">
                  <span className="section-title">Notas Privadas</span>
                </div>
                <textarea
                  className="input min-h-[80px] resize-none w-full"
                  defaultValue={campanha.notas_gm}
                  onBlur={async e => {
                    await supabase.from('campanhas').update({ notas_gm: e.target.value } as never).eq('id', campanha.id);
                  }}
                  placeholder="Anotações da sessão, pistas, NPCs..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-10 bg-bg-card/95 backdrop-blur-md border-t border-border/30">
        <div className="max-w-2xl mx-auto flex">
          {([
            { id: 'fichas'      as const, label: 'Fichas',      Icon: Users2      },
            { id: 'ferramentas' as const, label: 'Ferramentas', Icon: Wrench      },
            { id: 'biblioteca'  as const, label: 'Biblioteca',  Icon: BookOpen    },
            { id: 'roteiro'     as const, label: 'Roteiro',     Icon: ScrollText  },
          ]).map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => { setAba(id); setSelectedSlot(null); }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                aba === id ? 'text-gold' : 'text-ink-muted hover:text-ink'
              }`}>
              <Icon size={18} />
              <span className="text-[9px] uppercase tracking-wide truncate w-full text-center leading-none">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modal de ficha expandida */}
      <AnimatePresence>
        {selectedSlot && (
          <FichaExpandida
            slot={selectedSlot}
            onClose={() => { setSelectedSlot(null); setKickConfirm(null); setKickError(null); }}
            onKick={() => kickJogador(selectedSlot.id)}
            confirmandoKick={kickConfirm === selectedSlot.id}
            kickError={kickError}
            onCondicaoToggle={(condicoes) => setCondicoes(selectedSlot.id, condicoes)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
