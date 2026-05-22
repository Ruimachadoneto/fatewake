import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useApp } from '@/store/app';
import type { Personagem } from '@/types/personagem';
import { PassoIdentidade } from './steps/PassoIdentidade';
import { PassoClasse } from './steps/PassoClasse';
import { PassoSubclasse } from './steps/PassoSubclasse';
import { PassoAncestralidade } from './steps/PassoAncestralidade';
import { PassoComunidade } from './steps/PassoComunidade';
import { PassoAtributos } from './steps/PassoAtributos';
import { PassoEquipamento } from './steps/PassoEquipamento';
import { PassoCartas } from './steps/PassoCartas';
import { PassoOrigemVinculos } from './steps/PassoOrigemVinculos';

const PASSOS = [
  'Identidade', 'Classe', 'Subclasse', 'Ancestralidade',
  'Comunidade', 'Atributos', 'Equipamento', 'Cartas', 'Origens',
] as const;

function podeAvancar(passo: number, p: Personagem): boolean {
  switch (passo) {
    case 1: return p.nome.trim().length > 0;
    case 2: return p.classe !== '';
    case 3: return p.subclasse !== '';
    case 4: return p.ancestralidade !== '';
    case 5: return p.comunidade !== '';
    case 6: return Object.values(p.atributos).every(a => a.valor !== null);
    case 7: return p.arma_principal.nome.trim().length > 0;
    case 8: return p.cartas_mao.length >= 2;
    default: return true;
  }
}

const STEP_COMPONENTS = [
  PassoIdentidade,
  PassoClasse,
  PassoSubclasse,
  PassoAncestralidade,
  PassoComunidade,
  PassoAtributos,
  PassoEquipamento,
  PassoCartas,
  PassoOrigemVinculos,
];

export function TelaCriacao() {
  const { personagemAtivo, atualizar, setModo } = useApp();
  const [passo, setPasso] = useState(() => {
    if (!personagemAtivo) return 1;
    for (let i = 1; i <= 9; i++) {
      if (!podeAvancar(i, personagemAtivo)) return i;
    }
    return 9;
  });
  const direcao = useRef<1 | -1>(1);

  if (!personagemAtivo) return null;

  const pode = podeAvancar(passo, personagemAtivo);

  function avancar() {
    if (passo < 9) {
      direcao.current = 1;
      setPasso(p => p + 1);
    }
  }

  function voltar() {
    if (passo > 1) {
      direcao.current = -1;
      setPasso(p => p - 1);
    }
  }

  function despertar() {
    if (!personagemAtivo) return;
    const exps = personagemAtivo.experiencias.length >= 2
      ? personagemAtivo.experiencias
      : [
          personagemAtivo.experiencias[0] ?? { nome: '', mod: 2 },
          personagemAtivo.experiencias[1] ?? { nome: '', mod: 2 },
        ];
    atualizar({ nivel: 1, proficiencia: 1, experiencias: exps });
    setModo('jogo');
  }

  const StepComponent = STEP_COMPONENTS[passo - 1];
  const x = direcao.current * 40;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      {/* Barra de progresso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xs text-ink-muted uppercase tracking-widest">
            Passo {passo} de {PASSOS.length}
          </span>
          <span className="text-2xs text-gold tracking-wider uppercase font-display">
            {PASSOS[passo - 1]}
          </span>
        </div>
        <div className="flex gap-1">
          {PASSOS.map((nome, i) => (
            <button
              key={i}
              type="button"
              title={nome}
              onClick={() => {
                direcao.current = i + 1 > passo ? 1 : -1;
                setPasso(i + 1);
              }}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i + 1 < passo
                  ? 'bg-gold'
                  : i + 1 === passo
                  ? 'bg-gold/60'
                  : 'bg-bg-inset hover:bg-bg-elevated'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Conteúdo do passo — transição slide */}
      <div className="mb-6 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={passo}
            initial={{ opacity: 0, x }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -x }}
            transition={{ type: 'spring', stiffness: 340, damping: 32, mass: 0.9 }}
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegação */}
      <div className="flex gap-3">
        {passo > 1 && (
          <button type="button" onClick={voltar} className="btn flex-1">
            <ChevronLeft size={16} />
            Voltar
          </button>
        )}

        {passo < 9 ? (
          <button
            type="button"
            onClick={avancar}
            disabled={!pode}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Próximo
            <ChevronRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={despertar} className="btn-primary flex-1">
            <Sparkles size={16} />
            Despertar!
          </button>
        )}
      </div>

      {!pode && passo < 9 && (
        <p className="text-center text-2xs text-ink-dim mt-3">
          {passo === 1 && 'Insira o nome do herói para continuar.'}
          {passo === 2 && 'Escolha uma classe para continuar.'}
          {passo === 3 && 'Escolha uma subclasse para continuar.'}
          {passo === 4 && 'Escolha uma ancestralidade para continuar.'}
          {passo === 5 && 'Escolha uma comunidade para continuar.'}
          {passo === 6 && 'Distribua todos os atributos para continuar.'}
          {passo === 7 && 'Nomeie ao menos a arma principal para continuar.'}
          {passo === 8 && 'Selecione 2 cartas de domínio para continuar.'}
        </p>
      )}
    </div>
  );
}
