import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, TrendingUp, CheckCircle, Circle, User, Star } from 'lucide-react';
import { useApp } from '@/store/app';
import { CLASSES, LEVELUP, SUBCLASSES, getCartasPorDominio } from '@/data';
import { DOMINIO_CORES } from '@/data/dominiosCores';
import type { Atributo, NomeClasse, PatamarMarcado } from '@/types/personagem';

const ATRIBUTOS: Atributo[] = ['Força', 'Agilidade', 'Acuidade', 'Instinto', 'Presença', 'Conhecimento'];

const CLASS_ACCENTS: Record<string, string> = {
  'Bardo':       '196, 100, 196',
  'Druida':      '80, 180, 100',
  'Feiticeiro':  '120, 80, 200',
  'Guardião':    '80, 140, 210',
  'Guerreiro':   '200, 100, 60',
  'Ladino':      '100, 160, 160',
  'Mago':        '60, 180, 210',
  'Patrulheiro': '100, 170, 80',
  'Serafim':     '220, 180, 80',
};

function getPatamar(nivel: number): 1 | 2 | 3 | 4 {
  if (nivel <= 1) return 1;
  if (nivel <= 4) return 2;
  if (nivel <= 7) return 3;
  return 4;
}

function isEntrandoPatamar(nivelNovo: number): boolean {
  return [2, 5, 8].includes(nivelNovo);
}

// ─── TelaLevelUp ─────────────────────────────────────────────────────────────

export function TelaLevelUp() {
  const { personagemAtivo, atualizarFn, setModo } = useApp();
  if (!personagemAtivo) return null;

  const p = personagemAtivo;
  const nivelAtual = p.nivel;
  const nivelNovo = nivelAtual + 1;
  const patamarNovo = getPatamar(nivelNovo);
  const entraPatamar = isEntrandoPatamar(nivelNovo);
  const classeData = CLASSES[p.classe as NomeClasse];
  const dominios = classeData?.dominios ?? [];
  const acc = CLASS_ACCENTS[p.classe ?? ''] ?? '212, 175, 55';

  // Subclasse data for Subclasse Aprimorada preview
  const subclasseData = p.subclasse
    ? SUBCLASSES.classes[p.classe as NomeClasse]?.find(s => s.nome === p.subclasse)
    : null;

  // Discípulo do Conhecimento: Promissor garante +1 carta obrigatória em cada nível
  const qtdCartasObrig = p.subclasse === 'Discípulo do Conhecimento' ? 2 : 1;

  // Cartas disponíveis para escolha obrigatória (nível ≤ nivelNovo, não possuídas)
  const cartasObrigatorias = useMemo(() => {
    const possuidas = new Set([...p.cartas_mao, ...p.cartas_reserva]);
    return dominios
      .flatMap(d => getCartasPorDominio(d, nivelNovo))
      .filter(c => !possuidas.has(c.id));
  }, [nivelNovo, dominios, p.cartas_mao, p.cartas_reserva]);

  // Opções do patamar atual e uso de vagas
  const dadosPatamar = LEVELUP.patamares[String(patamarNovo) as '2' | '3' | '4'];
  const opcoesPatamar = dadosPatamar?.opcoes ?? [];

  const vagasUsadas = useMemo(() => {
    const usadas: Record<string, number> = {};
    p.patamares_marcados
      .filter(pm => pm.patamar === patamarNovo)
      .forEach(pm => pm.opcoes_escolhidas.forEach(op => {
        usadas[op] = (usadas[op] ?? 0) + 1;
      }));
    return usadas;
  }, [p.patamares_marcados, patamarNovo]);

  // ─── Estado local das seleções ───────────────────────────────────────────

  const [cartasSelecionadas, setCartasSelecionadas] = useState<string[]>([]);
  const [opcoesSelecionadas, setOpcoesSelecionadas] = useState<string[]>([]);
  const [atributosSel, setAtributosSel] = useState<Atributo[]>([]);
  const [expsSel, setExpsSel] = useState<number[]>([]);
  const [cartaOpcionalSel, setCartaOpcionalSel] = useState<string | null>(null);

  // ─── Validação ───────────────────────────────────────────────────────────

  const precisaAtributos = opcoesSelecionadas.includes('Atributos');
  const precisaExps = opcoesSelecionadas.includes('Aprimorar Experiências');
  const precisaCartaOpcional = opcoesSelecionadas.includes('Nova Carta de Domínio');

  const expsDisponiveis = p.experiencias.map((e, i) => ({ e, i })).filter(({ e }) => e.nome.trim() !== '');

  const cartasDisponiveis = cartasObrigatorias.length;
  const cartasEsgotadas = cartasDisponiveis === 0;
  const cartasSatisfeitas = cartasSelecionadas.length >= Math.min(qtdCartasObrig, cartasDisponiveis);

  const podeConfirmar =
    (cartasSatisfeitas || cartasEsgotadas) &&
    opcoesSelecionadas.length === 2 &&
    (!precisaAtributos || atributosSel.length === 2) &&
    (!precisaExps || expsSel.length === 2) &&
    (!precisaCartaOpcional || cartaOpcionalSel !== null);

  // ─── Aplicar level up ────────────────────────────────────────────────────

  function confirmar() {
    atualizarFn(prev => {
      let novo = { ...prev };

      novo.nivel = nivelNovo;

      if (entraPatamar && patamarNovo !== 1) {
        novo.proficiencia = prev.proficiencia + 1;
        novo.experiencias = [...prev.experiencias, { nome: '', mod: 2 }];
        const atrs = { ...prev.atributos };
        for (const a of ATRIBUTOS) {
          atrs[a] = { ...atrs[a], marcado: false };
        }
        novo.atributos = atrs;
      }

      for (const id of cartasSelecionadas) {
        if (!novo.cartas_mao.includes(id)) {
          novo.cartas_mao = [...novo.cartas_mao, id];
        }
      }

      for (const op of opcoesSelecionadas) {
        switch (op) {
          case 'Aumentar PV':
            novo.pv_max = novo.pv_max + 1;
            break;
          case 'Aumentar PF':
            novo.pf_max = novo.pf_max + 1;
            break;
          case 'Aumentar Evasão':
            novo.evasao_bonus_perm = (novo.evasao_bonus_perm ?? 0) + 1;
            novo.evasao = novo.evasao + 1;
            break;
          case 'Proficiência+1':
            novo.proficiencia = novo.proficiencia + 1;
            break;
          case 'Atributos': {
            const atrs = { ...novo.atributos };
            for (const a of atributosSel) {
              atrs[a] = { ...atrs[a], bonus: atrs[a].bonus + 1, marcado: true };
            }
            novo.atributos = atrs;
            break;
          }
          case 'Aprimorar Experiências': {
            const exps = [...novo.experiencias];
            for (const idx of expsSel) {
              exps[idx] = { ...exps[idx], mod: exps[idx].mod + 1 };
            }
            novo.experiencias = exps;
            break;
          }
          case 'Nova Carta de Domínio':
            if (cartaOpcionalSel) {
              novo.cartas_mao = [...novo.cartas_mao, cartaOpcionalSel];
            }
            break;
        }
      }

      const entrada: PatamarMarcado = {
        patamar: patamarNovo as 2 | 3 | 4,
        nivel: nivelNovo,
        opcoes_escolhidas: opcoesSelecionadas,
      };
      novo.patamares_marcados = [...novo.patamares_marcados, entrada];

      return novo;
    });

    setModo('jogo');
  }

  // ─── Helpers de UI ───────────────────────────────────────────────────────

  function toggleOpcao(nome: string) {
    setOpcoesSelecionadas(prev => {
      if (prev.includes(nome)) {
        const novas = prev.filter(o => o !== nome);
        if (nome === 'Atributos') setAtributosSel([]);
        if (nome === 'Aprimorar Experiências') setExpsSel([]);
        if (nome === 'Nova Carta de Domínio') setCartaOpcionalSel(null);
        return novas;
      }
      if (prev.length >= 2) return prev;
      return [...prev, nome];
    });
  }

  function toggleAtributo(a: Atributo) {
    setAtributosSel(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : prev.length < 2 ? [...prev, a] : prev,
    );
  }

  function toggleExp(i: number) {
    setExpsSel(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 2 ? [...prev, i] : prev,
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-3xl mx-auto px-4 py-5 pb-12"
    >
      {/* Back button */}
      <button type="button" onClick={() => setModo('jogo')} className="btn p-2 mb-4">
        <ChevronLeft size={18} />
      </button>

      {/* Header banner */}
      <div
        className="rounded-2xl border overflow-hidden relative mb-5"
        style={{
          borderColor: `rgba(${acc}, 0.25)`,
          background: `linear-gradient(135deg, rgba(${acc}, 0.07) 0%, transparent 55%)`,
        }}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Portrait */}
          <div
            className="w-14 h-[68px] rounded-xl overflow-hidden border flex-shrink-0"
            style={{
              borderColor: `rgba(${acc}, 0.4)`,
              boxShadow: `0 0 18px rgba(${acc}, 0.18)`,
            }}
          >
            {p.foto_url ? (
              <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `radial-gradient(circle, rgba(${acc}, 0.15) 0%, rgba(${acc}, 0.04) 100%)` }}
              >
                <User size={22} style={{ color: `rgb(${acc})`, opacity: 0.7 }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <TrendingUp size={18} className="text-gold icon-glow-gold flex-shrink-0" />
              <h2 className="font-display text-lg text-gold tracking-[0.2em]">SUBIR DE NÍVEL</h2>
            </div>
            <div className="text-2xs text-ink-muted tracking-wider truncate mb-2">{p.nome}</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="font-display text-2xs px-2 py-0.5 rounded-lg"
                style={{
                  background: `rgba(${acc}, 0.12)`,
                  color: `rgb(${acc})`,
                  border: `1px solid rgba(${acc}, 0.25)`,
                }}
              >
                {p.classe}
              </span>
              <span className="text-ink-dim text-2xs">
                Nível {nivelAtual}{' '}
                <span className="text-gold">→</span>{' '}
                <span style={{ color: `rgb(${acc})` }}>{nivelNovo}</span>
              </span>
              {entraPatamar && (
                <span
                  className="text-2xs px-2 py-0.5 rounded-lg font-display"
                  style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
                >
                  ✦ Patamar {patamarNovo}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mudanças automáticas */}
      <div className="card-ornate mb-4">
        <div className="section-header">
          <span className="section-title">Automático</span>
        </div>
        <div className="mt-3 space-y-2">
          <ItemAuto texto={`Nível atualizado: ${nivelAtual} → ${nivelNovo}`} />
          {entraPatamar && (
            <>
              <ItemAuto texto="Proficiência +1" destaque />
              <ItemAuto texto="Nova Experiência (+2) — preencha o nome nas notas" destaque />
              {(patamarNovo === 3 || patamarNovo === 4) && (
                <ItemAuto texto="Todas as marcações de atributos removidas" destaque />
              )}
            </>
          )}
          {dadosPatamar?.obrigatorio?.map((ob, i) => (
            <div key={i} className="text-2xs text-ink-dim leading-relaxed pl-5 border-l border-gold/20">
              {ob}
            </div>
          ))}
        </div>
      </div>

      {/* Nova carta obrigatória */}
      <div className="card-ornate mb-4">
        <div className="section-header">
          <span className="section-title">
            {qtdCartasObrig > 1 ? `${qtdCartasObrig} Cartas de Domínio — obrigatórias` : 'Nova Carta de Domínio — obrigatória'}
          </span>
        </div>
        <p className="text-2xs text-ink-muted mt-3 mb-3">
          Escolha {qtdCartasObrig} carta{qtdCartasObrig > 1 ? 's' : ''} de nível ≤ {nivelNovo} dos domínios{' '}
          <span className="text-arcane-glow">{dominios.join(' e ')}</span>.
          {qtdCartasObrig > 1 && (
            <span className="text-arcane-glow"> (Promissor — Discípulo do Conhecimento)</span>
          )}
          {' '}({cartasSelecionadas.length}/{Math.min(qtdCartasObrig, cartasDisponiveis)} selecionadas)
        </p>

        {dominios.map(dom => {
          const cartas = cartasObrigatorias.filter(c => c.dominio === dom);
          if (cartas.length === 0) return null;
          const domColor = DOMINIO_CORES[dom] ?? '130, 70, 200';
          return (
            <div key={dom} className="mb-4">
              <div
                className="text-2xs font-display uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{ color: `rgb(${domColor})` }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: `rgb(${domColor})` }}
                />
                {dom}
              </div>
              <div className="space-y-1.5">
                {cartas.map(c => {
                  const sel = cartasSelecionadas.includes(c.id);
                  const bloq = !sel && cartasSelecionadas.length >= qtdCartasObrig;
                  const isHighLevel = c.nivel >= 5;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (sel) setCartasSelecionadas(prev => prev.filter(id => id !== c.id));
                        else if (!bloq) setCartasSelecionadas(prev => [...prev, c.id]);
                      }}
                      disabled={bloq}
                      className={`w-full rounded-xl border text-left overflow-hidden transition-all ${
                        sel
                          ? 'border-gold/60'
                          : bloq
                          ? 'opacity-40 cursor-not-allowed border-border/30'
                          : 'border-border hover:border-gold/30'
                      }`}
                      style={sel ? { background: `rgba(${domColor}, 0.05)` } : undefined}
                    >
                      <div className="flex">
                        <div
                          className="w-1 flex-shrink-0"
                          style={{ background: `rgba(${domColor}, ${sel ? 0.9 : 0.35})` }}
                        />
                        <div className="flex-1 px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span
                                  className={`font-display text-sm tracking-wide ${
                                    sel ? 'text-gold' : isHighLevel ? 'text-ink' : 'text-ink'
                                  }`}
                                >
                                  {c.nome}
                                </span>
                                <span
                                  className="text-2xs border rounded px-1.5 font-display flex-shrink-0"
                                  style={{
                                    color: isHighLevel ? '#D4AF37' : `rgb(${domColor})`,
                                    borderColor: isHighLevel ? 'rgba(212,175,55,0.35)' : `rgba(${domColor}, 0.3)`,
                                    background: isHighLevel ? 'rgba(212,175,55,0.08)' : undefined,
                                  }}
                                >
                                  Nv.{c.nivel}
                                </span>
                                {c.custo_recordacao > 0 && (
                                  <span className="text-2xs text-ink-dim border border-border/40 rounded px-1.5">
                                    {c.custo_recordacao} PF
                                  </span>
                                )}
                              </div>
                              <p className="text-2xs text-ink-muted leading-relaxed">{c.descricao}</p>
                            </div>
                            {sel ? (
                              <CheckCircle size={16} className="text-gold flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle size={16} className="text-border flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {cartasObrigatorias.length === 0 && (
          <p className="text-2xs text-ink-dim">
            Todas as cartas disponíveis até nível {nivelNovo} já foram adquiridas.
          </p>
        )}
      </div>

      {/* Escolha de opções (2 por nível) */}
      {opcoesPatamar.length > 0 && (
        <div className="card-ornate mb-4">
          <div className="section-header">
            <span className="section-title">Escolha 2 Opções</span>
          </div>
          <p className="text-2xs text-ink-muted mt-3 mb-3">
            Patamar {patamarNovo} · {opcoesSelecionadas.length}/2 selecionadas
          </p>

          <div className="space-y-2">
            {opcoesPatamar.map(op => {
              const usadas = vagasUsadas[op.nome] ?? 0;
              const restantes = op.vagas - usadas;
              const esgotada = restantes <= 0;
              const selecionada = opcoesSelecionadas.includes(op.nome);
              const bloqueada = !selecionada && opcoesSelecionadas.length >= 2;
              const isSubclasse = op.nome === 'Subclasse Aprimorada';

              // Determine which subclass ability to show
              const subAbility = isSubclasse && subclasseData
                ? patamarNovo === 3
                  ? subclasseData.especializacao
                  : patamarNovo === 4
                  ? subclasseData.maestria
                  : null
                : null;

              return (
                <div key={op.nome}>
                  <button
                    type="button"
                    onClick={() => !esgotada && !bloqueada && toggleOpcao(op.nome)}
                    disabled={esgotada || bloqueada}
                    className={`w-full rounded-xl border text-left overflow-hidden transition-all ${
                      selecionada
                        ? 'border-gold/60'
                        : esgotada
                        ? 'opacity-30 cursor-not-allowed border-border/20'
                        : bloqueada
                        ? 'opacity-50 cursor-not-allowed border-border/30'
                        : 'border-border hover:border-gold/30'
                    }`}
                    style={selecionada ? { background: 'rgba(212,175,55,0.04)' } : undefined}
                  >
                    <div className="flex">
                      <div
                        className="w-1 flex-shrink-0 transition-opacity"
                        style={{ background: selecionada ? 'rgba(212,175,55,0.9)' : 'rgba(212,175,55,0.2)' }}
                      />
                      <div className="flex-1 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {selecionada
                                ? <CheckCircle size={14} className="text-gold flex-shrink-0" />
                                : <Circle size={14} className="text-border/60 flex-shrink-0" />}
                              <span className={`font-display text-sm tracking-wide ${selecionada ? 'text-gold' : 'text-ink'}`}>
                                {op.nome}
                              </span>
                              {isSubclasse && (
                                <Star size={11} className="text-gold/60 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-2xs text-ink-muted leading-relaxed pl-5">{op.descricao}</p>
                          </div>
                          <span className={`text-2xs flex-shrink-0 ${restantes > 0 ? 'text-ink-dim' : 'text-blood-glow'}`}>
                            {restantes}/{op.vagas}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Subclasse Aprimorada — mostra habilidade específica quando selecionada */}
                  <AnimatePresence>
                    {selecionada && isSubclasse && subAbility && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-2 rounded-xl border border-gold/25 overflow-hidden"
                          style={{ background: 'rgba(212,175,55,0.04)' }}>
                          <div className="flex">
                            <div className="w-1 flex-shrink-0" style={{ background: 'rgba(212,175,55,0.7)' }} />
                            <div className="flex-1 px-3 py-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Star size={11} className="text-gold" />
                                <span className="text-2xs text-gold font-display tracking-wider">
                                  {patamarNovo === 3 ? 'Especialização' : 'Maestria'} Desbloqueada
                                </span>
                              </div>
                              <div className="text-xs text-ink font-display tracking-wide mb-1">{subAbility.nome}</div>
                              <p className="text-2xs text-ink-muted leading-relaxed">{subAbility.descricao}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sub-seleção: Atributos */}
                  <AnimatePresence>
                    {selecionada && op.nome === 'Atributos' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-2 card bg-bg-inset">
                          <p className="text-2xs text-gold mb-2">
                            Escolha 2 atributos desmarcados ({atributosSel.length}/2):
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {ATRIBUTOS.map(a => {
                              const marcado = p.atributos[a].marcado;
                              const selA = atributosSel.includes(a);
                              const bloq = !selA && atributosSel.length >= 2;
                              const efetivo = (p.atributos[a].valor ?? 0) + p.atributos[a].bonus;
                              return (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => !marcado && !bloq && toggleAtributo(a)}
                                  disabled={marcado || bloq}
                                  className={`rounded-lg border px-2 py-2 text-left transition-all text-2xs ${
                                    marcado
                                      ? 'border-border/30 opacity-30 cursor-not-allowed'
                                      : selA
                                      ? 'border-gold bg-gold/10 text-gold'
                                      : bloq
                                      ? 'border-border opacity-50'
                                      : 'border-border hover:border-gold/50 text-ink-muted'
                                  }`}
                                >
                                  <span className="font-medium">{a}</span>
                                  <span className="ml-1 text-ink-dim">
                                    {efetivo > 0 ? `+${efetivo}` : efetivo}
                                    {selA && ' → ' + (efetivo + 1 > 0 ? `+${efetivo + 1}` : efetivo + 1)}
                                  </span>
                                  {marcado && <span className="ml-1 text-ink-dim">(já marcado)</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sub-seleção: Aprimorar Experiências */}
                  <AnimatePresence>
                    {selecionada && op.nome === 'Aprimorar Experiências' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-2 card bg-bg-inset">
                          <p className="text-2xs text-gold mb-2">
                            Escolha 2 experiências para +1 ({expsSel.length}/2):
                          </p>
                          <div className="space-y-1">
                            {expsDisponiveis.map(({ e, i }) => {
                              const selE = expsSel.includes(i);
                              const bloq = !selE && expsSel.length >= 2;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => !bloq && toggleExp(i)}
                                  disabled={bloq}
                                  className={`w-full rounded-lg border px-3 py-2 text-left transition-all text-2xs flex items-center justify-between ${
                                    selE
                                      ? 'border-gold bg-gold/10 text-gold'
                                      : bloq
                                      ? 'border-border/50 opacity-50'
                                      : 'border-border text-ink-muted hover:border-gold/50'
                                  }`}
                                >
                                  <span>{e.nome}</span>
                                  <span className="font-display">
                                    +{e.mod}
                                    {selE && ` → +${e.mod + 1}`}
                                  </span>
                                </button>
                              );
                            })}
                            {expsDisponiveis.length === 0 && (
                              <p className="text-2xs text-ink-dim">Nenhuma experiência cadastrada.</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sub-seleção: Nova Carta de Domínio (opção extra) */}
                  <AnimatePresence>
                    {selecionada && op.nome === 'Nova Carta de Domínio' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-2 card bg-bg-inset">
                          <p className="text-2xs text-gold mb-2">Escolha uma carta adicional:</p>
                          <div className="space-y-1.5 max-h-64 overflow-y-auto">
                            {cartasObrigatorias
                              .filter(c => !cartasSelecionadas.includes(c.id))
                              .map(c => {
                                const sel = cartaOpcionalSel === c.id;
                                const domColor = DOMINIO_CORES[c.dominio] ?? '130, 70, 200';
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCartaOpcionalSel(sel ? null : c.id)}
                                    className={`w-full rounded-lg border text-left overflow-hidden text-2xs transition-all ${
                                      sel ? 'border-gold/60' : 'border-border hover:border-gold/30'
                                    }`}
                                  >
                                    <div className="flex">
                                      <div className="w-1 flex-shrink-0" style={{ background: `rgba(${domColor}, ${sel ? 0.9 : 0.35})` }} />
                                      <div className="flex-1 px-2.5 py-1.5 flex items-center gap-2">
                                        {sel
                                          ? <CheckCircle size={12} className="text-gold flex-shrink-0" />
                                          : <Circle size={12} className="text-border flex-shrink-0" />}
                                        <span className={sel ? 'text-gold' : 'text-ink'}>{c.nome}</span>
                                        <span
                                          className="text-2xs border rounded px-1 ml-auto font-display flex-shrink-0"
                                          style={{ color: `rgb(${domColor})`, borderColor: `rgba(${domColor}, 0.3)` }}
                                        >
                                          Nv.{c.nivel}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lembrete de limiares */}
      <div className="card mb-5 border-gold/15">
        <p className="text-2xs text-ink-dim leading-relaxed">
          <span className="text-gold/80">Lembrete:</span> Verifique seus limiares de dano ao nível {nivelNovo}.
          Se adquiriu nova armadura, atualize a ficha em Editar Personagem.
        </p>
      </div>

      {/* Botão confirmar */}
      <motion.button
        type="button"
        onClick={confirmar}
        disabled={!podeConfirmar}
        whileTap={podeConfirmar ? { scale: 0.97 } : undefined}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <TrendingUp size={16} />
        Confirmar — Subir para Nível {nivelNovo}
      </motion.button>

      <AnimatePresence>
        {!podeConfirmar && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-2xs text-ink-dim mt-2"
          >
            {!cartasSatisfeitas && !cartasEsgotadas && `Escolha ${qtdCartasObrig - cartasSelecionadas.length} carta(s) de domínio · `}
            {opcoesSelecionadas.length < 2 && `Escolha mais ${2 - opcoesSelecionadas.length} opção(ões) · `}
            {precisaAtributos && atributosSel.length < 2 && `Marque 2 atributos · `}
            {precisaExps && expsSel.length < 2 && `Escolha 2 experiências · `}
            {precisaCartaOpcional && !cartaOpcionalSel && `Escolha a carta adicional`}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Componente auxiliar ─────────────────────────────────────────────────────

function ItemAuto({ texto, destaque }: { texto: string; destaque?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle size={14} className={`flex-shrink-0 mt-0.5 ${destaque ? 'text-gold' : 'text-ink-dim'}`} />
      <span className={`text-2xs leading-relaxed ${destaque ? 'text-ink' : 'text-ink-muted'}`}>{texto}</span>
    </div>
  );
}
