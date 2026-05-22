import { motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { CLASSES, getCartasPorDominio } from '@/data';
import { DOMINIO_CORES } from '@/data/dominiosCores';
import type { NomeClasse } from '@/types/personagem';

export function PassoCartas() {
  const { personagemAtivo, atualizar } = useApp();
  if (!personagemAtivo || !personagemAtivo.classe) return null;

  const classeData = CLASSES[personagemAtivo.classe as NomeClasse];
  const dominios = classeData?.dominios ?? [];
  const selecionadas = personagemAtivo.cartas_mao;

  const maxCartas = personagemAtivo.subclasse === 'Discípulo do Conhecimento' ? 3 : 2;
  const bonusTexto = personagemAtivo.subclasse === 'Discípulo do Conhecimento'
    ? ' (+1 Discípulo do Conhecimento)'
    : '';

  function toggle(id: string) {
    if (selecionadas.includes(id)) {
      atualizar({ cartas_mao: selecionadas.filter(c => c !== id) });
    } else if (selecionadas.length < maxCartas) {
      atualizar({ cartas_mao: [...selecionadas, id] });
    }
  }

  let cardIndex = 0;

  return (
    <div className="space-y-4">
      <div className="section-header">
        <span className="section-title">Cartas de Domínio</span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted">
          Escolha {maxCartas} cartas dos seus domínios.
          {bonusTexto && <span className="text-arcane-glow">{bonusTexto}</span>}
        </p>
        <span className={`font-display text-base ${selecionadas.length === maxCartas ? 'text-gold' : 'text-ink-muted'}`}>
          {selecionadas.length}/{maxCartas}
        </span>
      </div>

      {dominios.map(dominio => {
        const cartas = getCartasPorDominio(dominio, personagemAtivo.nivel ?? 1);
        const acc = DOMINIO_CORES[dominio] ?? '212, 175, 55';
        return (
          <div key={dominio}>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-px flex-1 rounded" style={{ background: `rgba(${acc}, 0.25)` }} />
              <span className="text-2xs uppercase tracking-widest font-medium" style={{ color: `rgba(${acc}, 0.85)` }}>
                {dominio}
              </span>
              <span className="h-px flex-1 rounded" style={{ background: `rgba(${acc}, 0.25)` }} />
            </div>

            <div className="space-y-2">
              {cartas.map(carta => {
                const sel = selecionadas.includes(carta.id);
                const bloqueada = !sel && selecionadas.length >= maxCartas;
                const delay = (cardIndex++) * 0.025;
                return (
                  <motion.button
                    key={carta.id}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: bloqueada ? 0.4 : 1, y: 0 }}
                    transition={{ delay, type: 'spring', stiffness: 380, damping: 30 }}
                    onClick={() => !bloqueada && toggle(carta.id)}
                    disabled={bloqueada}
                    className={`card w-full text-left transition-all ${
                      sel
                        ? 'shadow-[0_0_16px_rgba(212,175,55,0.12)]'
                        : bloqueada
                        ? 'cursor-not-allowed'
                        : 'hover:border-gold/40'
                    }`}
                    style={sel ? {
                      borderColor: `rgba(${acc}, 0.5)`,
                      background: `rgba(${acc}, 0.06)`,
                    } : {}}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="font-display text-sm tracking-wider"
                            style={sel ? { color: `rgb(${acc})` } : undefined}
                          >
                            {carta.nome}
                          </span>
                          <span
                            className="text-2xs border rounded px-1.5 py-0.5"
                            style={{
                              color: `rgba(${acc}, 0.85)`,
                              borderColor: `rgba(${acc}, 0.3)`,
                              background: `rgba(${acc}, 0.06)`,
                            }}
                          >
                            {carta.tipo}
                          </span>
                          {carta.custo_recordacao > 0 && (
                            <span className="text-2xs text-ink-dim">
                              {carta.custo_recordacao} PF
                            </span>
                          )}
                        </div>
                        <div className="text-2xs text-ink-muted leading-relaxed">
                          {carta.descricao}
                        </div>
                      </div>
                      {sel && (
                        <span className="text-sm flex-shrink-0 font-bold" style={{ color: `rgb(${acc})` }}>✓</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
