import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/store/app';
import { ANCESTRALIDADES, getNomesAncestralidades } from '@/data';
import type { Personagem } from '@/types/personagem';

function deltaBonusAncestralidade(nova: string, velha: string | undefined, p: Personagem) {
  let pv_max = p.pv_max;
  let pf_max = p.pf_max;
  let evasao = p.evasao;
  let limiares = [p.limiares[0], p.limiares[1]] as [number, number];
  if (velha === 'Gigante') pv_max -= 1;
  if (velha === 'Humano')  pf_max -= 1;
  if (velha === 'Símio')   evasao -= 1;
  if (velha === 'Galapa') { limiares[0] -= p.proficiencia; limiares[1] -= p.proficiencia; }
  if (nova === 'Gigante') pv_max += 1;
  if (nova === 'Humano')  pf_max += 1;
  if (nova === 'Símio')   evasao += 1;
  if (nova === 'Galapa') { limiares[0] += p.proficiencia; limiares[1] += p.proficiencia; }
  return { pv_max, pf_max, evasao, limiares };
}

const ANCESTRALIDADES_COM_BONUS = ['Gigante', 'Humano', 'Símio', 'Galapa'];

export function PassoAncestralidade() {
  const { personagemAtivo, atualizarFn } = useApp();
  if (!personagemAtivo) return null;

  const nomes = getNomesAncestralidades();
  const sel = personagemAtivo.ancestralidade;

  return (
    <div className="space-y-3">
      <div className="section-header">
        <span className="section-title">Sua Linhagem</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {nomes.map((chave, i) => {
          const ativo = sel === chave;
          return (
            <motion.button
              key={chave}
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 380, damping: 30 }}
              onClick={() => atualizarFn(p => {
                const bonus = ANCESTRALIDADES_COM_BONUS.includes(chave) || (p.ancestralidade && ANCESTRALIDADES_COM_BONUS.includes(p.ancestralidade))
                  ? deltaBonusAncestralidade(chave, p.ancestralidade, p)
                  : {};
                return { ...p, ...bonus, ancestralidade: chave };
              })}
              className={`relative rounded-xl border p-3 text-left transition-all ${
                ativo
                  ? 'border-gold/60 bg-gold/8 shadow-[0_0_16px_rgba(212,175,55,0.1)]'
                  : 'border-border/60 bg-bg-card hover:border-gold/30 hover:bg-gold/4'
              }`}
            >
              <div className={`font-display text-sm tracking-wider leading-tight ${ativo ? 'text-gold' : 'text-ink'}`}>
                {chave}
              </div>
              {ativo && <span className="absolute top-2 right-2.5 text-gold text-xs">✓</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Habilidades da selecionada */}
      <AnimatePresence mode="wait">
        {sel && (() => {
          const d = ANCESTRALIDADES[sel];
          return (
            <motion.div
              key={sel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="card-ornate space-y-2"
            >
              <div className="section-header mb-2">
                <span className="section-title">{sel}</span>
              </div>
              {[d.habilidade_1, d.habilidade_2].map(h => (
                <div key={h.nome} className="bg-bg-inset rounded-lg px-3 py-2 border border-border/40">
                  <span className="text-2xs text-gold/80 font-medium">{h.nome}: </span>
                  <span className="text-2xs text-ink-muted leading-relaxed">{h.descricao}</span>
                </div>
              ))}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
