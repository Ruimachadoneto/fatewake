import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/store/app';
import { SUBCLASSES, COMPANHEIRO } from '@/data';
import type { NomeClasse, Personagem } from '@/types/personagem';

const CLASSE_ACCENT: Record<string, string> = {
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

function deltaBonusSubclasse(nova: string, velha: string | undefined, p: Personagem) {
  let pv_max = p.pv_max;
  let pf_max = p.pf_max;
  let limiares = [p.limiares[0], p.limiares[1]] as [number, number];
  if (velha === 'Baluarte')             { limiares[0] -= 1; limiares[1] -= 1; }
  if (velha === 'Vingador')             pf_max -= 1;
  if (velha === 'Discípulo da Guerra')  pv_max -= 1;
  if (nova === 'Baluarte')            { limiares[0] += 1; limiares[1] += 1; }
  if (nova === 'Vingador')            pf_max += 1;
  if (nova === 'Discípulo da Guerra') pv_max += 1;
  return { pv_max, pf_max, limiares };
}

const SUBCLASSES_COM_BONUS = ['Baluarte', 'Vingador', 'Discípulo da Guerra'];
const ELEMENTOS_FEITICEIRO = ['Água', 'Ar', 'Fogo', 'Relâmpago', 'Terra'];

function defaultCompanheiro(p: Personagem) {
  return p.companheiro ?? {
    nome: '',
    tipo: '',
    evasao: 10,
    dado_dano: 'd6' as const,
    alcance: 'Corpo a corpo' as const,
    ataque_descricao: '',
    pf_max: 6,
    pf_marcados: 0,
    experiencias: [],
    treinamentos: [],
  };
}

export function PassoSubclasse() {
  const { personagemAtivo, atualizar, atualizarFn } = useApp();
  if (!personagemAtivo || !personagemAtivo.classe) return null;

  const p = personagemAtivo;
  const lista = SUBCLASSES.classes[p.classe as NomeClasse] ?? [];
  const accent = CLASSE_ACCENT[p.classe] ?? '212, 175, 55';
  const comp = defaultCompanheiro(p);
  const expSugeridas: string[] = COMPANHEIRO.experiencias_sugeridas ?? [];

  return (
    <div className="space-y-3">
      <div className="section-header">
        <span className="section-title">Especialização — {p.classe}</span>
      </div>

      <div className="space-y-3">
        {lista.map((sub, index) => {
          const sel = p.subclasse === sub.nome;
          return (
            <motion.div
              key={sub.nome}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07, type: 'spring', stiffness: 340, damping: 30 }}
            >
              <button
                type="button"
                onClick={() => atualizarFn(prev => {
                  const bonus = SUBCLASSES_COM_BONUS.includes(sub.nome) || (prev.subclasse && SUBCLASSES_COM_BONUS.includes(prev.subclasse))
                    ? deltaBonusSubclasse(sub.nome, prev.subclasse, prev)
                    : {};
                  const elemento = sub.nome === 'Elementalista' ? prev.elemento_feiticeiro : undefined;
                  return { ...prev, ...bonus, subclasse: sub.nome, elemento_feiticeiro: elemento };
                })}
                className="card w-full text-left transition-all group relative overflow-hidden"
                style={sel ? {
                  borderColor: `rgba(${accent}, 0.6)`,
                  boxShadow: `0 0 20px rgba(${accent}, 0.12), inset 0 1px 0 rgba(255,255,255,0.03)`,
                } : {}}
              >
                {/* Hover/selected glow */}
                <div
                  className={`absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-300 ${sel ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                  style={{ background: `radial-gradient(ellipse 80% 60% at 0% 50%, rgba(${accent}, 0.1) 0%, transparent 70%)` }}
                />

                <div className="relative flex items-start justify-between gap-2 mb-2">
                  <div
                    className="font-display text-base tracking-wider transition-colors"
                    style={sel ? { color: `rgb(${accent})` } : undefined}
                  >
                    {sub.nome}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sub.atributo_conjuracao && (
                      <span
                        className="text-2xs border rounded px-2 py-0.5"
                        style={{
                          color: `rgba(${accent}, 0.85)`,
                          borderColor: `rgba(${accent}, 0.3)`,
                          background: `rgba(${accent}, 0.06)`,
                        }}
                      >
                        conj: {sub.atributo_conjuracao}
                      </span>
                    )}
                    {sel && (
                      <span className="font-bold text-sm" style={{ color: `rgb(${accent})` }}>✓</span>
                    )}
                  </div>
                </div>

                <div className="relative space-y-2">
                  {sub.fundamental.map(h => (
                    <div
                      key={h.nome}
                      className="rounded-lg px-3 py-2 border"
                      style={{
                        background: `rgba(${accent}, 0.05)`,
                        borderColor: `rgba(${accent}, 0.15)`,
                      }}
                    >
                      <div className="text-2xs font-medium mb-0.5" style={{ color: `rgba(${accent}, 0.9)` }}>{h.nome}</div>
                      <div className="text-2xs text-ink-muted leading-relaxed">{h.descricao}</div>
                    </div>
                  ))}
                </div>
              </button>

              {/* Seleção de elemento para Elementalista */}
              <AnimatePresence>
                {sel && sub.nome === 'Elementalista' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-3 mt-2 card bg-bg-inset border-arcane/30">
                      <div className="text-2xs text-arcane-glow uppercase tracking-widest mb-2">
                        Escolha seu elemento:
                        {p.elemento_feiticeiro && <span className="ml-2 text-gold normal-case">✓ {p.elemento_feiticeiro}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ELEMENTOS_FEITICEIRO.map(el => {
                          const selEl = p.elemento_feiticeiro === el;
                          return (
                            <button
                              key={el}
                              type="button"
                              onClick={e => { e.stopPropagation(); atualizar({ elemento_feiticeiro: el }); }}
                              className={`text-xs rounded-xl border px-3 py-2 transition-all ${
                                selEl
                                  ? 'border-arcane bg-arcane/20 text-arcane-glow font-medium'
                                  : 'border-border text-ink-muted hover:border-arcane/40'
                              }`}
                            >
                              {el}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Configuração do Companheiro Animal para Treinador */}
              <AnimatePresence>
                {sel && sub.nome === 'Treinador' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-3 mt-2 card bg-bg-inset border-arcane/30 space-y-4">
                      <div className="text-2xs text-arcane-glow uppercase tracking-widest">
                        Companheiro Animal
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="label">Nome</label>
                          <input
                            className="input"
                            value={comp.nome}
                            onChange={e => atualizar({ companheiro: { ...comp, nome: e.target.value } })}
                            placeholder="Ex: Brix"
                          />
                        </div>
                        <div>
                          <label className="label">Tipo de animal</label>
                          <input
                            className="input"
                            value={comp.tipo}
                            onChange={e => atualizar({ companheiro: { ...comp, tipo: e.target.value } })}
                            placeholder="Ex: Lobo de neve"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-2xs text-ink-muted uppercase tracking-widest mb-1.5">
                          Experiências{' '}
                          <span className={comp.experiencias.length >= 2 ? 'text-gold' : 'text-ink-dim'}>
                            ({comp.experiencias.length}/2)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {expSugeridas.map(exp => {
                            const selExp = comp.experiencias.some(e => e.nome === exp);
                            const bloqueada = !selExp && comp.experiencias.length >= 2;
                            return (
                              <button
                                key={exp}
                                type="button"
                                disabled={bloqueada}
                                onClick={() => {
                                  const novas = selExp
                                    ? comp.experiencias.filter(e => e.nome !== exp)
                                    : [...comp.experiencias, { nome: exp, mod: 2 }];
                                  atualizar({ companheiro: { ...comp, experiencias: novas } });
                                }}
                                className={`text-2xs px-2 py-1 rounded-lg border transition-colors ${
                                  selExp
                                    ? 'border-gold bg-gold/10 text-gold'
                                    : bloqueada
                                    ? 'border-border/30 text-ink-dim opacity-40 cursor-not-allowed'
                                    : 'border-border text-ink-muted hover:border-arcane/50 hover:text-arcane-glow'
                                }`}
                              >
                                {exp}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 border-t border-border/40 pt-3">
                        {[
                          { label: 'Evasão', value: '10' },
                          { label: 'Dado', value: 'd6' },
                          { label: 'Alcance', value: 'CC' },
                          { label: 'PF', value: '6' },
                        ].map(({ label, value }) => (
                          <div key={label} className="text-center">
                            <div className="text-2xs text-ink-dim uppercase tracking-widest mb-0.5">{label}</div>
                            <div className="font-display text-sm text-ink">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
