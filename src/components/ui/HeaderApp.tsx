import { useApp } from '@/store/app';
import { useSessao } from '@/store/sessao';
import { ChevronLeft, Moon, Users } from 'lucide-react';

const GradientBorder = () => (
  <div className="absolute bottom-0 left-0 right-0 h-px"
    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.25) 30%, rgba(212,175,55,0.4) 50%, rgba(212,175,55,0.25) 70%, transparent 100%)' }}
  />
);

export function HeaderApp() {
  const { personagemAtivo, selecionar } = useApp();
  const { setTela, tela: telaSessao } = useSessao();

  if (!personagemAtivo) {
    return (
      <header className="bg-bg-card/70 backdrop-blur-md sticky top-0 z-10"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(212,175,55,0.06)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Moon className="text-gold" size={18} strokeWidth={1.5}
              style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.7))' }} />
            <div>
              <h1 className="font-display text-base text-gold tracking-[0.3em] leading-none"
                style={{ textShadow: '0 0 20px rgba(212,175,55,0.35)' }}>
                FATEWAKE
              </h1>
              <p className="text-[9px] text-ink-dim tracking-[0.25em] uppercase mt-0.5 leading-none">
                Companion · Daggerheart
              </p>
            </div>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setTela(telaSessao === 'idle' ? 'entrar-sala' : 'idle')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium border transition-all
              border-border/50 text-ink-muted hover:text-gold hover:border-gold/30 hover:bg-gold/5"
          >
            <Users size={12} />
            <span>Sala</span>
          </button>
        </div>
        <GradientBorder />
      </header>
    );
  }

  return (
    <header className="bg-bg-card/80 backdrop-blur-md sticky top-0 z-10"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(212,175,55,0.06)' }}>
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-2">
        <button
          onClick={() => selecionar('')}
          className="text-ink-muted hover:text-gold p-2 -ml-2 rounded-lg hover:bg-gold/8 transition-all"
          aria-label="Voltar à lista"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 min-w-0 border-l border-border/30 pl-2.5">
          <div className="font-display text-sm text-ink truncate tracking-wider leading-tight">
            {personagemAtivo.nome || 'Sem nome'}
          </div>
          <div className="text-[10px] text-ink-dim truncate tracking-wide leading-tight mt-0.5">
            {personagemAtivo.classe
              ? `Nv.${personagemAtivo.nivel} · ${personagemAtivo.classe}${personagemAtivo.subclasse ? ` · ${personagemAtivo.subclasse}` : ''}`
              : 'Em criação'}
          </div>
        </div>

      </div>
      <GradientBorder />
    </header>
  );
}
