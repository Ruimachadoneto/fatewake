import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/store/app';
import { CLASSES } from '@/data';
import type { Atributo, NomeClasse } from '@/types/personagem';

const ATRIBUTOS: Atributo[] = ['Força', 'Agilidade', 'Acuidade', 'Instinto', 'Presença', 'Conhecimento'];
const POOL_BASE = [2, 1, 1, 0, 0, -1];

function valorDisplay(v: number | null): string {
  if (v === null) return '—';
  return v > 0 ? `+${v}` : String(v);
}

function valorCor(v: number | null, ativo: boolean): string {
  if (ativo) return 'text-gold';
  if (v === null) return 'text-ink-dim';
  if (v >= 1) return 'text-gold-glow';
  if (v === 0) return 'text-ink-muted';
  return 'text-blood-glow';
}

export function PassoAtributos() {
  const { personagemAtivo, atualizar } = useApp();
  const [pendente, setPendente] = useState<Atributo | null>(null);

  if (!personagemAtivo) return null;

  const classeData = CLASSES[personagemAtivo.classe as NomeClasse];
  const sugeridos = classeData?.atributos_sugeridos ?? {};

  const pool = [...POOL_BASE];
  for (const a of ATRIBUTOS) {
    const v = personagemAtivo.atributos[a].valor;
    if (v !== null) {
      const idx = pool.indexOf(v);
      if (idx !== -1) pool.splice(idx, 1);
    }
  }

  function recalcEvasao() {
    const armBonus = personagemAtivo?.armadura_ativa.evasao_bonus ?? 0;
    const ancBonus = personagemAtivo?.ancestralidade === 'Símio' ? 1 : 0;
    const permBonus = personagemAtivo?.evasao_bonus_perm ?? 0;
    return (classeData?.evasao_base ?? 10) + armBonus + ancBonus + permBonus;
  }

  function atribuir(valor: number) {
    if (!pendente || !personagemAtivo) return;
    const novos = {
      ...personagemAtivo.atributos,
      [pendente]: { ...personagemAtivo.atributos[pendente], valor },
    };
    atualizar({ atributos: novos, evasao: recalcEvasao() });
    setPendente(null);
  }

  function limpar(a: Atributo) {
    if (!personagemAtivo) return;
    const novos = {
      ...personagemAtivo.atributos,
      [a]: { ...personagemAtivo.atributos[a], valor: null },
    };
    atualizar({ atributos: novos, evasao: recalcEvasao() });
    setPendente(a);
  }

  function usarSugeridos() {
    if (!personagemAtivo || !classeData) return;
    const novos = { ...personagemAtivo.atributos };
    for (const a of ATRIBUTOS) {
      novos[a] = { ...novos[a], valor: sugeridos[a] ?? 0 };
    }
    atualizar({ atributos: novos, evasao: recalcEvasao() });
    setPendente(null);
  }

  const tudo = ATRIBUTOS.every(a => personagemAtivo.atributos[a].valor !== null);

  return (
    <div className="space-y-4">
      <div className="section-header">
        <span className="section-title">Distribuir Atributos</span>
      </div>

      <p className="text-xs text-ink-muted">
        Toque um atributo para selecioná-lo, depois toque um valor do pool para atribuí-lo. Toque um atributo preenchido para trocar.
      </p>

      {classeData && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={usarSugeridos}
          className="w-full text-2xs border border-arcane/40 text-arcane-glow rounded-xl py-2.5 px-3 hover:bg-arcane/10 transition-colors flex items-center justify-center gap-2"
        >
          <span className="opacity-60">✦</span>
          <span>Usar sugestão do {personagemAtivo.classe}</span>
          <span className="opacity-60">—</span>
          <span className="text-ink-muted">
            {ATRIBUTOS.map(a => `${a.slice(0, 3)} ${(sugeridos[a] ?? 0) > 0 ? '+' : ''}${sugeridos[a] ?? 0}`).join(' ')}
          </span>
        </motion.button>
      )}

      <div className="grid grid-cols-2 gap-2">
        {ATRIBUTOS.map((a, i) => {
          const val = personagemAtivo.atributos[a].valor;
          const ativo = pendente === a;
          return (
            <motion.button
              key={a}
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 380, damping: 30 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => val !== null ? limpar(a) : setPendente(a)}
              className={`rounded-xl border px-3 py-3 text-left transition-all ${
                ativo
                  ? 'border-gold bg-gold/10 shadow-[0_0_16px_rgba(212,175,55,0.15)]'
                  : val !== null
                  ? 'border-border/60 bg-bg-card'
                  : 'border-dashed border-border/50 bg-bg-inset'
              }`}
            >
              <div className="text-2xs text-ink-muted uppercase tracking-wider">{a}</div>
              <div className={`font-display text-2xl mt-1 leading-none ${valorCor(val, ativo)}`}>
                {valorDisplay(val)}
              </div>
              <div className="text-2xs mt-1">
                {ativo
                  ? <span className="text-gold">← escolha valor</span>
                  : val !== null
                  ? <span className="text-ink-dim">toque p/ trocar</span>
                  : <span className="text-ink-dim">não atribuído</span>}
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {pendente && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="card-ornate"
          >
            <div className="text-2xs text-gold uppercase tracking-widest mb-3">
              Valor para {pendente}:
            </div>
            <div className="flex gap-2 flex-wrap">
              {pool.map((v, i) => (
                <motion.button
                  key={i}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => atribuir(v)}
                  className="w-14 h-14 rounded-xl border border-gold/50 bg-gold/10 font-display text-gold text-lg hover:bg-gold/25 transition-colors"
                >
                  {v > 0 ? `+${v}` : v}
                </motion.button>
              ))}
              {pool.length === 0 && (
                <span className="text-2xs text-ink-dim">Todos os valores foram atribuídos.</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPendente(null)}
              className="mt-3 text-2xs text-ink-dim hover:text-ink-muted"
            >
              cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tudo && !pendente && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center bg-bg-inset rounded-xl border border-gold/20 py-3"
          >
            <div className="text-sm text-gold font-display tracking-wider">
              Evasão: {personagemAtivo.evasao}
            </div>
            <div className="text-2xs text-ink-dim mt-0.5">
              base {classeData?.evasao_base ?? 10}{(personagemAtivo.armadura_ativa.evasao_bonus ?? 0) !== 0 ? ` + ${personagemAtivo.armadura_ativa.evasao_bonus} arm` : ''}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
