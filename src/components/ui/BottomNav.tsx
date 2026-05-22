import { motion } from 'framer-motion';
import { Shield, Hammer, BookOpen, Users } from 'lucide-react';
import { useApp } from '@/store/app';
import { useSessao } from '@/store/sessao';

const TABS = [
  { id: 'jogo',    label: 'Ficha',    icon: Shield   },
  { id: 'criacao', label: 'Editar',   icon: Hammer   },
  { id: 'saga',    label: 'Saga',     icon: BookOpen },
  { id: 'sala',    label: 'Sala',     icon: Users    },
] as const;

type TabId = typeof TABS[number]['id'];

export function BottomNav() {
  const { personagemAtivo, modo, setModo } = useApp();
  const { tela: telaSessao, setTela, meuSlotId } = useSessao();

  if (!personagemAtivo) return null;

  // levelup é sub-estado de jogo — mantém Ficha ativo
  const activeTab: TabId =
    telaSessao !== 'idle' ? 'sala' :
    modo === 'levelup'    ? 'jogo' :
    (modo as TabId);

  function handleTab(id: TabId) {
    if (id === 'sala') {
      if (telaSessao !== 'idle') {
        setTela('idle'); // minimiza
      } else if (meuSlotId) {
        setTela('sala-jogador'); // reconecta sem digitar código
      } else {
        setTela('entrar-sala');
      }
    } else {
      if (telaSessao !== 'idle') setTela('idle'); // minimiza sessão
      setModo(id as 'criacao' | 'jogo' | 'saga');
    }
  }

  return (
    <nav className="sticky bottom-0 z-30 border-t border-[rgba(212,175,55,0.18)] bg-bg-card/96 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-2 py-2">
        <div className="grid grid-cols-4 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTab(id)}
                className="relative flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors"
              >
                {/* glow de fundo no tab ativo */}
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'rgba(212,175,55,0.09)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}

                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={active ? 2 : 1.5}
                    className="transition-colors"
                    style={{
                      color: active ? 'rgb(212,175,55)' : 'rgba(232,223,207,0.45)',
                      filter: active ? 'drop-shadow(0 0 8px rgba(212,175,55,0.55))' : undefined,
                    }}
                  />
                  {/* badge sessão ativa */}
                  {id === 'sala' && telaSessao !== 'idle' && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                  )}
                </div>

                <span
                  className="text-[10px] uppercase tracking-[0.14em] leading-none transition-colors"
                  style={{ color: active ? 'rgb(212,175,55)' : 'rgba(232,223,207,0.4)' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
