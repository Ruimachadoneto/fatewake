import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Overlay de tela cheia que toca UM efeito dramático quando `gatilho` muda.
// Incremente o contador `gatilho` para disparar. Não bloqueia cliques.
export type EfeitoTipo = 'dano-menor' | 'dano-maior' | 'dano-grave' | 'esperanca' | 'medo';

interface Props {
  gatilho: number;        // contador — cada incremento dispara o efeito
  tipo: EfeitoTipo;
  intensidade?: number;   // 0..1 — usado pelo Medo (escala com o tracker)
}

function fundo(tipo: EfeitoTipo, i: number): string {
  switch (tipo) {
    case 'dano-menor':
      return 'radial-gradient(ellipse at center, transparent 58%, rgba(157,31,45,0.32) 100%)';
    case 'dano-maior':
      return 'radial-gradient(ellipse at center, transparent 45%, rgba(157,31,45,0.55) 100%)';
    case 'dano-grave':
      return 'radial-gradient(ellipse at center, transparent 28%, rgba(157,31,45,0.82) 100%)';
    case 'esperanca':
      return 'radial-gradient(ellipse 150% 80% at 50% -15%, rgba(212,175,55,0.5) 0%, transparent 58%)';
    case 'medo': {
      const buraco = Math.max(20, 52 - i * 30);
      const alpha = (0.42 + 0.45 * i).toFixed(2);
      return `radial-gradient(ellipse at center, transparent ${buraco}%, rgba(120,18,32,${alpha}) 100%)`;
    }
  }
}

export function FlashDramatico({ gatilho, tipo, intensidade = 1 }: Props) {
  const [ativo, setAtivo] = useState<{ n: number; tipo: EfeitoTipo; i: number } | null>(null);

  useEffect(() => {
    if (gatilho > 0) {
      setAtivo({ n: gatilho, tipo, i: intensidade });
      const t = setTimeout(() => setAtivo(null), 1300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatilho]);

  const lento = ativo?.tipo === 'medo' || ativo?.tipo === 'dano-grave';
  const dur = lento ? 1.15 : 0.85;

  return (
    <AnimatePresence>
      {ativo && (
        <motion.div
          key={ativo.n}
          aria-hidden
          className="fixed inset-0 pointer-events-none z-[120]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.9, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur, times: [0, 0.15, 0.45, 1], ease: 'easeOut' }}
          style={{ background: fundo(ativo.tipo, ativo.i) }}
        />
      )}
    </AnimatePresence>
  );
}
