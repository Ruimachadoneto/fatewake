import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { useSessao } from '@/store/sessao';
import { TelaSelecionarPersonagem } from '@/views/TelaSelecionarPersonagem';
import { TelaCriacao } from '@/views/criacao/TelaCriacao';
import { TelaJogo } from '@/views/jogo/TelaJogo';
import { TelaLevelUp } from '@/views/levelup/TelaLevelUp';
import { TelaSessao, TelaSalaJogador } from '@/views/sessao/TelaSessao';
import { TelaSaga } from '@/views/TelaSaga';
import { HeaderApp } from '@/components/ui/HeaderApp';
import { BottomNav } from '@/components/ui/BottomNav';

const pageTransition = { duration: 0.22, ease: 'easeOut' };

export function App() {
  const { personagemAtivo, modo, carregarTudo } = useApp();
  const { tela: telaSessao, inicializar: inicializarSessao } = useSessao();

  useEffect(() => {
    carregarTudo();
    inicializarSessao();
  }, [carregarTudo, inicializarSessao]);

  if (telaSessao === 'sala-jogador') {
    return <TelaSalaJogador />;
  }

  if (telaSessao !== 'idle') {
    return <TelaSessao />;
  }

  const screenKey = !personagemAtivo ? 'selecionar' : `${personagemAtivo.id}-${modo}`;

  const content = !personagemAtivo
    ? <TelaSelecionarPersonagem />
    : modo === 'criacao'
      ? <TelaCriacao />
      : modo === 'levelup'
        ? <TelaLevelUp />
        : modo === 'saga'
          ? <TelaSaga />
          : <TelaJogo />;

  return (
    <div className="min-h-dvh flex flex-col">
      <HeaderApp />
      {/* min-h-0 prevents flex child from overflowing; relative gives context for absolute screens */}
      <main className="flex-1 relative min-h-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={screenKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={pageTransition}
            style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}
