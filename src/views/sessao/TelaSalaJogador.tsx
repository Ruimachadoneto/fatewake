import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gerarUUID } from '@/lib/uuid';
import { supabase } from '@/lib/supabase';
import { useSessao, SESSAO_SALVA_KEY } from '@/store/sessao';
import { useApp } from '@/store/app';
import { TelaJogo } from '@/views/jogo/TelaJogo';
import { ChevronLeft, Users, Shield, Package, Scroll, X, MapPin, Target, Image, BookOpen, Swords } from 'lucide-react';
import type { PersonagemSala, ImagemRevelada } from '@/types/supabase';
import type { Personagem, ItemInventario } from '@/types/personagem';
import { CANAL_REVELA, type RevelacaoPayload, type Contagem } from './FerramentasGM';

interface RevelacaoRecebida extends RevelacaoPayload {
  id: string;
  timestamp: number;
}

interface RegistroEvento {
  id: string;
  tipo: 'revelacao' | 'medo' | 'contagem' | 'item';
  texto: string;
  timestamp: number;
}

const CLASSE_ACCENT: Record<string, string> = {
  'Bardo': '196,100,196', 'Druida': '80,180,100', 'Feiticeiro': '120,80,200',
  'Guardião': '80,140,210', 'Guerreiro': '200,100,60', 'Ladino': '100,160,160',
  'Mago': '60,180,210', 'Patrulheiro': '100,170,80', 'Serafim': '220,180,80',
};

const TIPO_ICONE: Record<string, typeof Package> = {
  item: Package, consumivel: Scroll, objetivo: Target, ambiente: MapPin, imagem: Image,
};
const TIPO_COR: Record<string, string> = {
  item: '212, 175, 55', consumivel: '100, 200, 160',
  objetivo: '200, 100, 60', ambiente: '60, 180, 210', imagem: '180, 120, 220',
};
const REGISTRO_COR: Record<RegistroEvento['tipo'], string> = {
  revelacao: '180, 120, 220',
  medo:      '224, 112, 132',
  contagem:  '100, 200, 160',
  item:      '212, 175, 55',
};

function nivelMedo(m: number): { label: string; desc: string; cor: string } {
  if (m <= 2)  return { label: 'Calmo',       desc: 'A ameaça ainda dorme.',          cor: 'text-ink-muted' };
  if (m <= 5)  return { label: 'Instável',    desc: 'O perigo se move nas sombras.',  cor: 'text-[rgb(220,150,80)]' };
  if (m <= 8)  return { label: 'Perigoso',    desc: 'O medo sussurra e se alimenta.', cor: 'text-blood-glow' };
  if (m <= 11) return { label: 'Desesperado', desc: 'A escuridão toma forma.',        cor: 'text-blood-glow animate-pulse' };
  return       { label: 'Catástrofe',  desc: 'O destino pede seu preço.',      cor: 'text-blood-glow animate-pulse' };
}

function getP(slot: PersonagemSala): Personagem | null {
  const raw = slot.personagem as Partial<Personagem> | null;
  if (!raw || !raw.nome) return null;
  return raw as Personagem;
}

function formataHora(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function TelaSalaJogador() {
  const { campanha, meuSlotId, meuSessionToken, personagensSala, setPersonagensSala, upsertPersonagemSala, setTela } = useSessao();
  const { personagemAtivo, atualizarFn } = useApp();
  const [aba, setAba] = useState<'sala' | 'diario' | 'ficha'>('sala');
  const [medo, setMedo] = useState(campanha?.medo ?? 0);
  const [revelacoes, setRevelacoes] = useState<RevelacaoRecebida[]>([]);
  const [contagensAtivas, setContagensAtivas] = useState<Contagem[]>([]);
  const [registros, setRegistros] = useState<RegistroEvento[]>([]);
  const [diarioNotas, setDiarioNotas] = useState('');
  const [ocultarPvPf, setOcultarPvPf] = useState(false);
  const [mensagemMestre, setMensagemMestre] = useState<string | null>(null);
  const [imagemAberta, setImagemAberta] = useState<{ url: string; titulo: string } | null>(null);
  const [imagensGaleria, setImagensGaleria] = useState<ImagemRevelada[]>([]);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef<string>('');

  // Valida slot ao montar — trata reconexão após bloqueio de tela / reload
  useEffect(() => {
    if (!meuSlotId || !meuSessionToken) return;
    supabase
      .from('personagens_sala')
      .select('id')
      .eq('id', meuSlotId)
      .eq('session_token', meuSessionToken)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          localStorage.removeItem(SESSAO_SALVA_KEY);
          sessionStorage.removeItem('fw_session_token');
          setTela('idle');
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar notas do diário + galeria de imagens (preferência: DB > localStorage)
  useEffect(() => {
    if (!campanha?.id) return;
    setDiarioNotas(localStorage.getItem(`fatewake_diario_${campanha.id}`) ?? '');
    const imgs = campanha.imagens_reveladas ?? [];
    if (imgs.length > 0) {
      setImagensGaleria(imgs);
    } else {
      try {
        const raw = localStorage.getItem(`fatewake_galeria_${campanha.id}`);
        if (raw) setImagensGaleria(JSON.parse(raw));
      } catch {}
    }
  }, [campanha?.id]);

  // Sincroniza ficha com a sala (debounce 2s)
  useEffect(() => {
    if (!meuSlotId || !meuSessionToken || !personagemAtivo) return;
    const snapshot = JSON.stringify(personagemAtivo);
    if (snapshot === lastSyncedRef.current) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      await supabase
        .from('personagens_sala')
        .update({ personagem: personagemAtivo, atualizado_em: new Date().toISOString() } as never)
        .eq('id', meuSlotId)
        .eq('session_token', meuSessionToken);
      lastSyncedRef.current = snapshot;
    }, 2000);
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [personagemAtivo, meuSlotId, meuSessionToken]);

  // Realtime: Medo e outros jogadores
  useEffect(() => {
    if (!campanha) return;

    supabase.from('personagens_sala').select('*').eq('campanha_id', campanha.id)
      .then(({ data }) => { if (data) setPersonagensSala(data as PersonagemSala[]); });

    const ch = supabase.channel(`sala-jogador-${campanha.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'campanhas', filter: `id=eq.${campanha.id}` },
        payload => {
          const novo = payload.new as { medo: number; imagens_reveladas?: { url: string; titulo: string; timestamp: number }[] };
          const novoMedo = novo.medo ?? 0;
          setMedo(novoMedo);
          if (novo.imagens_reveladas) {
            setImagensGaleria(novo.imagens_reveladas);
            try { localStorage.setItem(`fatewake_galeria_${campanha.id}`, JSON.stringify(novo.imagens_reveladas)); } catch {}
          }
          setRegistros(r => [{
            id: gerarUUID(), tipo: 'medo' as const,
            texto: `Dado de Medo mudou para ${novoMedo}`,
            timestamp: Date.now(),
          }, ...r].slice(0, 50));
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'personagens_sala', filter: `campanha_id=eq.${campanha.id}` },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            upsertPersonagemSala(payload.new as PersonagemSala);
          } else if (payload.eventType === 'DELETE') {
            if ((payload.old as { id?: string }).id === meuSlotId) {
              localStorage.removeItem(SESSAO_SALVA_KEY);
              sessionStorage.removeItem('fw_session_token');
              setTela('idle');
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [campanha]);

  // Realtime: revelações + contagens + controles do mestre
  useEffect(() => {
    if (!campanha || !meuSlotId) return;
    const ch = supabase
      .channel(CANAL_REVELA(campanha.id))
      .on('broadcast', { event: 'revelacao' }, (msg) => {
        const payload = msg.payload as RevelacaoPayload;
        const { destinatarios } = payload;
        const isParaMim = destinatarios === 'todos' || (Array.isArray(destinatarios) && destinatarios.includes(meuSlotId!));
        if (!isParaMim) return;
        const rev: RevelacaoRecebida = { ...payload, id: gerarUUID(), timestamp: Date.now() };
        setRevelacoes(prev => [rev, ...prev]);
        setRegistros(r => [{
          id: gerarUUID(), tipo: 'revelacao' as const,
          texto: `Revelação recebida: ${payload.titulo}`,
          timestamp: Date.now(),
        }, ...r].slice(0, 50));
      })
      .on('broadcast', { event: 'contagem_update' }, (msg) => {
        const novas = msg.payload as Contagem[];
        setContagensAtivas(novas);
        if (novas.length > 0) {
          setRegistros(r => [{
            id: gerarUUID(), tipo: 'contagem' as const,
            texto: `Contagem: ${novas.map(c => `${c.titulo} (${c.valorAtual}/${c.valorMax})`).join(', ')}`,
            timestamp: Date.now(),
          }, ...r].slice(0, 50));
        }
      })
      .on('broadcast', { event: 'controles_update' }, (msg) => {
        setOcultarPvPf((msg.payload as { ocultarPvPf: boolean }).ocultarPvPf ?? false);
      })
      .on('broadcast', { event: 'kick' }, (msg) => {
        const { slotId } = msg.payload as { slotId: string };
        if (slotId === meuSlotId) {
          sessionStorage.removeItem('fw_session_token');
          setTela('idle');
        }
      })
      .on('broadcast', { event: 'inventario_add' }, (msg) => {
        const { item, destinatarios } = msg.payload as { item: ItemInventario; destinatarios: string[] | 'todos' };
        const isParaMim = destinatarios === 'todos' || (Array.isArray(destinatarios) && destinatarios.includes(meuSlotId!));
        if (!isParaMim) return;
        atualizarFn(p => ({ ...p, inventario: [...(p.inventario ?? []), item] }));
        setRegistros(r => [{
          id: gerarUUID(), tipo: 'item' as const,
          texto: `Item recebido: ${item.nome}`,
          timestamp: Date.now(),
        }, ...r].slice(0, 50));
      })
      .on('broadcast', { event: 'condition_update' }, (msg) => {
        const { slotId, condicoes } = msg.payload as { slotId: string; condicoes: string[] };
        if (slotId !== meuSlotId) return;
        atualizarFn(p => ({ ...p, condicoes }));
      })
      .on('broadcast', { event: 'gm_message' }, (msg) => {
        setMensagemMestre((msg.payload as { texto: string }).texto);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [campanha, meuSlotId]);

  // Marcar online ao entrar, offline ao sair (permite reconectar sem redigitar código)
  useEffect(() => {
    if (!meuSlotId || !meuSessionToken) return;
    supabase.from('personagens_sala').update({ online: true } as never)
      .eq('id', meuSlotId).eq('session_token', meuSessionToken)
      .then(() => {}, () => {});
    return () => {
      supabase.from('personagens_sala').update({ online: false } as never)
        .eq('id', meuSlotId).eq('session_token', meuSessionToken)
        .then(() => {}, () => {});
    };
  }, [meuSlotId, meuSessionToken]);

  if (!campanha) return null;

  const nivel = nivelMedo(medo);
  const outros = personagensSala.filter(s => s.id !== meuSlotId);

  function sairSala() {
    setTela('idle'); // minimiza — cleanup do useEffect seta online: false
  }

  function salvarDiario(texto: string) {
    setDiarioNotas(texto);
    localStorage.setItem(`fatewake_diario_${campanha!.id}`, texto);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg">

      {/* Header — apenas título + sair */}
      <header className="sticky top-0 z-20 bg-bg-card/95 backdrop-blur-md border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="font-display text-sm text-gold tracking-wide truncate">{campanha.nome}</span>
          </div>
          <button type="button" onClick={sairSala}
            className="text-2xs text-ink-dim hover:text-ink flex items-center gap-1 transition-colors">
            <ChevronLeft size={11} />
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo por aba */}
      <main className="flex-1 pb-20">
        <AnimatePresence mode="wait" initial={false}>
          {aba === 'sala' ? (
            <motion.div key="sala"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="max-w-2xl mx-auto px-3 py-4 space-y-4"
            >
              {/* Mensagem do Mestre */}
              <AnimatePresence>
                {mensagemMestre && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-xl border border-gold/40 bg-gold/6 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BookOpen size={11} className="text-gold/70 flex-shrink-0" />
                        <span className="text-2xs text-gold/70 uppercase tracking-widest">Mestre</span>
                      </div>
                      <button type="button" onClick={() => setMensagemMestre(null)}
                        className="text-ink-dim hover:text-ink flex-shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{mensagemMestre}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Revelações do Mestre */}
              <AnimatePresence initial={false}>
                {revelacoes.map(rev => {
                  const cor = TIPO_COR[rev.tipo] ?? '212, 175, 55';
                  const Icon = TIPO_ICONE[rev.tipo] ?? Package;
                  return (
                    <motion.div key={rev.id}
                      initial={{ opacity: 0, y: -12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 40, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="rounded-xl border overflow-hidden"
                      style={{ borderColor: `rgba(${cor}, 0.4)`, background: `rgba(${cor}, 0.06)` }}>
                      <div className="px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon size={12} style={{ color: `rgb(${cor})` }} />
                            <span className="text-2xs font-medium" style={{ color: `rgb(${cor})` }}>
                              {rev.titulo}
                            </span>
                          </div>
                          <button type="button"
                            onClick={() => setRevelacoes(prev => prev.filter(r => r.id !== rev.id))}
                            className="text-ink-dim hover:text-ink transition-colors flex-shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                        {rev.tipo === 'imagem' ? (
                          <button type="button"
                            onClick={() => setImagemAberta({ url: rev.conteudo, titulo: rev.titulo })}
                            className="w-full mt-1 rounded-lg overflow-hidden relative group">
                            <img
                              src={rev.conteudo}
                              alt={rev.titulo}
                              className="w-full object-cover max-h-48 rounded-lg"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-2xs text-white bg-black/50 rounded-full px-2.5 py-1">
                                ampliar
                              </span>
                            </div>
                          </button>
                        ) : (
                          <p className="text-2xs text-ink-muted leading-relaxed whitespace-pre-line">
                            {rev.conteudo}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Contagens ativas */}
              <AnimatePresence initial={false}>
                {contagensAtivas.map(c => {
                  const cor = c.tipo === 'regressiva' ? '224, 112, 132' : '100, 200, 160';
                  const pct = c.valorMax > 0 ? c.valorAtual / c.valorMax : 0;
                  const esgotada = c.tipo === 'regressiva' ? c.valorAtual <= 0 : c.valorAtual >= c.valorMax;
                  return (
                    <motion.div key={c.id}
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: esgotada ? 0.5 : 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="rounded-xl border overflow-hidden"
                      style={{ borderColor: `rgba(${cor}, 0.35)`, background: `rgba(${cor}, 0.05)` }}>
                      <div className="px-3 pt-2.5 pb-1.5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <div className="font-display text-sm tracking-wide" style={{ color: `rgb(${cor})` }}>
                              {c.titulo}
                            </div>
                            {c.situacao && (
                              <p className="text-2xs text-ink-muted leading-relaxed mt-0.5">{c.situacao}</p>
                            )}
                          </div>
                          <motion.div key={c.valorAtual}
                            className="font-display text-3xl leading-none flex-shrink-0"
                            style={{ color: `rgb(${cor})` }}
                            initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
                            {c.valorAtual}
                          </motion.div>
                        </div>
                        <div className="h-1.5 bg-bg-inset rounded-full overflow-hidden border border-border/20 mt-2">
                          <motion.div className="h-full rounded-full"
                            style={{ background: `rgb(${cor})` }}
                            animate={{ width: `${pct * 100}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }} />
                        </div>
                        {c.dificuldade && (
                          <p className="text-[9px] text-ink-dim mt-1">Dificuldade {c.dificuldade}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Dado de Medo */}
              <div className="card-blood">
                <div className="section-header mb-3">
                  <span className="section-title" style={{ color: 'rgb(224, 112, 132)' }}>Dado de Medo</span>
                </div>
                <div className="flex items-center gap-4">
                  {/* Círculo de medo — read-only, tamanho reduzido */}
                  <div className="relative inline-flex items-center justify-center flex-shrink-0">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="53" fill="none" stroke="rgba(157,31,45,0.07)" strokeWidth="1.5" />
                      <circle cx="60" cy="60" r="34" fill="rgba(157,31,45,0.04)" stroke="rgba(157,31,45,0.06)" strokeWidth="1" />
                      {Array.from({ length: 12 }, (_, i) => {
                        const angle = ((i * 30) - 90) * (Math.PI / 180);
                        const x = 60 + 44 * Math.cos(angle);
                        const y = 60 + 44 * Math.sin(angle);
                        const filled = i < medo;
                        return (
                          <circle key={i}
                            cx={x} cy={y} r={filled && i >= 9 ? 5 : 4.5}
                            fill={filled ? (i >= 9 ? '#DC2828' : i >= 6 ? '#A81E2A' : '#7A1220') : '#100A0C'}
                            stroke={filled ? (i >= 9 ? 'rgba(240,60,80,0.7)' : 'rgba(157,31,45,0.4)') : 'rgba(157,31,45,0.15)'}
                            strokeWidth="1"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <motion.div key={medo}
                        className={`font-display text-4xl leading-none ${nivel.cor}`}
                        style={{ filter: medo >= 9 ? 'drop-shadow(0 0 10px rgba(157,31,45,0.8))' : medo >= 6 ? 'drop-shadow(0 0 6px rgba(157,31,45,0.6))' : undefined }}
                        initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
                        {medo}
                      </motion.div>
                    </div>
                  </div>
                  {/* Label narrativo */}
                  <div className="flex-1">
                    <div className={`font-display text-xl tracking-wider leading-tight ${nivel.cor}`}>{nivel.label}</div>
                    <div className="text-2xs text-ink-muted mt-1.5 leading-relaxed italic">{nivel.desc}</div>
                  </div>
                </div>
              </div>

              {/* Na Mesa — outros jogadores */}
              <div>
                <div className="section-header mb-3">
                  <span className="section-title">Na Mesa</span>
                </div>
                {outros.length === 0 ? (
                  <div className="card text-center py-6">
                    <Users size={22} className="text-ink-dim mx-auto mb-2" />
                    <p className="text-2xs text-ink-dim">Nenhum outro jogador na sala ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {outros.map(slot => {
                      const p = getP(slot);
                      const acc = p?.classe ? (CLASSE_ACCENT[p.classe] ?? '212,175,55') : '212,175,55';
                      return (
                        <div key={slot.id}
                          className={`rounded-xl border overflow-hidden transition-opacity ${slot.online ? '' : 'opacity-40'}`}
                          style={{ borderColor: `rgba(${acc},0.25)`, borderLeftWidth: '3px', borderLeftColor: `rgba(${acc},0.6)` }}>
                          <div className="flex items-center gap-2.5 px-3 py-2" style={{ background: `rgba(${acc},0.03)` }}>
                            {/* Portrait mini */}
                            <div className="w-9 h-11 rounded-lg overflow-hidden flex-shrink-0 border relative"
                              style={{ borderColor: `rgba(${acc},0.35)` }}>
                              {p?.foto_url ? (
                                <img src={p.foto_url} alt={p?.nome} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"
                                  style={{ background: `rgba(${acc},0.1)` }}>
                                  <span className="font-display text-sm" style={{ color: `rgba(${acc},0.7)` }}>
                                    {(p?.nome || slot.nome_jogador).charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-bg-card ${slot.online ? 'bg-green-400' : 'bg-bg-inset'}`} />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-display text-sm text-gold truncate">{p?.nome || slot.nome_jogador}</div>
                              <div className="text-2xs" style={{ color: `rgba(${acc},0.8)` }}>
                                {p?.classe ?? <span className="text-ink-dim italic">sem ficha</span>}
                                {p?.nivel && <span className="text-ink-dim"> · Nv.{p.nivel}</span>}
                              </div>
                            </div>
                            {/* Status */}
                            <div className="flex-shrink-0 text-right">
                              {p && !ocultarPvPf && (
                                <>
                                  <div className="text-2xs text-hp-soft">{p.pv_max - p.pv_marcados}/{p.pv_max} PV</div>
                                  <div className="flex gap-0.5 justify-end mt-0.5">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                      <span key={i} className={`text-xs leading-none ${i < p.esperanca ? 'text-gold' : 'text-border/40'}`}>
                                        {i < p.esperanca ? '◆' : '◇'}
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                              {p && ocultarPvPf && (
                                <span className="text-2xs text-ink-dim italic">em combate</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Meu personagem resumido */}
              {personagemAtivo && (() => {
                const acc = personagemAtivo.classe ? (CLASSE_ACCENT[personagemAtivo.classe] ?? '212,175,55') : '212,175,55';
                return (
                <div>
                  <div className="section-header mb-3">
                    <span className="section-title">Meu Personagem</span>
                  </div>
                  <div className="card-ornate">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Portrait */}
                      <div className="w-12 h-[58px] rounded-xl overflow-hidden flex-shrink-0 border"
                        style={{ borderColor: `rgba(${acc},0.4)`, boxShadow: `0 0 12px rgba(${acc},0.15)` }}>
                        {personagemAtivo.foto_url ? (
                          <img src={personagemAtivo.foto_url} alt={personagemAtivo.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"
                            style={{ background: `rgba(${acc},0.1)` }}>
                            <span className="font-display text-xl" style={{ color: `rgba(${acc},0.6)` }}>
                              {personagemAtivo.nome?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-base text-gold tracking-wide truncate">{personagemAtivo.nome}</div>
                        <div className="text-2xs mt-0.5" style={{ color: `rgb(${acc})` }}>
                          {personagemAtivo.classe}
                          <span className="text-ink-dim"> · Nível {personagemAtivo.nivel}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => setAba('ficha')}
                        className="text-2xs text-gold/70 border border-gold/30 rounded-lg px-2.5 py-1 hover:bg-gold/10 transition-colors flex-shrink-0">
                        Ver ficha →
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'PV', v: personagemAtivo.pv_max - personagemAtivo.pv_marcados, max: personagemAtivo.pv_max, cor: 'text-hp-soft' },
                        { label: 'PF', v: personagemAtivo.pf_max - personagemAtivo.pf_marcados, max: personagemAtivo.pf_max, cor: 'text-arcane-glow' },
                        { label: 'ARM', v: personagemAtivo.pa_max - personagemAtivo.pa_marcados, max: personagemAtivo.pa_max, cor: 'text-armor-soft' },
                      ].map(r => (
                        <div key={r.label} className="bg-bg-inset rounded-xl border border-border/50 py-2 text-center">
                          <div className="text-2xs text-ink-dim uppercase tracking-widest mb-0.5">{r.label}</div>
                          <div className={`font-display text-lg leading-none ${r.cor}`}>{r.v}/{r.max}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-border/20">
                      <span className="text-2xs text-ink-dim uppercase tracking-widest">Esperança</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xs font-display text-gold">{personagemAtivo.esperanca}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <span key={i} className={`text-xs leading-none ${i < personagemAtivo.esperanca ? 'text-gold' : 'text-border/50'}`}>
                              {i < personagemAtivo.esperanca ? '◆' : '◇'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {personagemAtivo.condicoes?.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {personagemAtivo.condicoes.map(c => (
                          <span key={c} className="text-2xs text-blood-glow border border-blood/30 rounded px-2 py-0.5">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
              })()}

              <div className="flex items-center justify-center gap-2 py-2">
                <Shield size={12} className="text-ink-dim" />
                <p className="text-2xs text-ink-dim">
                  Sua ficha sincroniza automaticamente com o mestre.
                </p>
              </div>
            </motion.div>

          ) : aba === 'diario' ? (
            <motion.div key="diario"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="max-w-2xl mx-auto px-3 py-4 space-y-4"
            >
              {/* Notas pessoais */}
              <div>
                <div className="section-header mb-2">
                  <span className="section-title">Minhas Anotações</span>
                </div>
                <textarea
                  value={diarioNotas}
                  onChange={e => salvarDiario(e.target.value)}
                  placeholder="Anote pistas, planos, nomes de NPCs, segredos descobertos..."
                  rows={10}
                  className="input w-full resize-none text-sm leading-relaxed"
                />
                <p className="text-[9px] text-ink-dim mt-1 text-right">Salvo automaticamente</p>
              </div>

              {/* Galeria de imagens reveladas */}
              {imagensGaleria.length > 0 && (
                <div>
                  <div className="section-header mb-2">
                    <span className="section-title">Imagens da Sessão</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {imagensGaleria.map(img => (
                      <button key={img.url} type="button"
                        onClick={() => setImagemAberta({ url: img.url, titulo: img.titulo })}
                        className="relative rounded-xl overflow-hidden border border-border/40 aspect-video group">
                        <img src={img.url} alt={img.titulo} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1.5">
                          <span className="text-[9px] text-white/80 leading-tight truncate w-full text-left">{img.titulo}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Registro de eventos */}
              <div>
                <div className="section-header mb-2">
                  <span className="section-title">Registro da Sessão</span>
                </div>
                {registros.length === 0 ? (
                  <div className="card text-center py-6">
                    <p className="text-2xs text-ink-dim">Nenhum evento registrado ainda.</p>
                    <p className="text-[9px] text-ink-dim/60 mt-1">Revelações, mudanças de Medo e contagens aparecem aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {registros.map(r => {
                      const cor = REGISTRO_COR[r.tipo];
                      return (
                        <div key={r.id} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 border"
                          style={{ borderColor: `rgba(${cor}, 0.2)`, background: `rgba(${cor}, 0.04)` }}>
                          <span className="text-[9px] text-ink-dim flex-shrink-0 mt-0.5 font-mono">{formataHora(r.timestamp)}</span>
                          <p className="text-2xs text-ink-muted leading-relaxed flex-1">{r.texto}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

          ) : (
            <motion.div key="ficha"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            >
              <TelaJogo />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal fullscreen de imagem */}
      <AnimatePresence>
        {imagemAberta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
            onClick={() => setImagemAberta(null)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="relative max-w-full"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={imagemAberta.url}
                alt={imagemAberta.titulo}
                className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
              />
              <p className="text-center text-sm text-white/50 mt-2.5 tracking-wide">{imagemAberta.titulo}</p>
              <button
                type="button"
                onClick={() => setImagemAberta(null)}
                className="absolute -top-2 -right-2 bg-bg-card rounded-full p-1.5 border border-border/50 text-ink-muted hover:text-ink transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-bg-card/95 backdrop-blur-md border-t border-border/30">
        <div className="max-w-2xl mx-auto flex">
          {([
            { id: 'sala'   as const, label: 'Sala',   Icon: Swords   },
            { id: 'diario' as const, label: 'Diário', Icon: BookOpen },
            { id: 'ficha'  as const, label: 'Ficha',  Icon: Shield   },
          ]).map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => setAba(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                aba === id ? 'text-gold' : 'text-ink-muted hover:text-ink'
              }`}>
              <Icon size={18} />
              <span className="text-[9px] uppercase tracking-wide leading-none">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
