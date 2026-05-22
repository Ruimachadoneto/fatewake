import { useState } from 'react';
import { motion } from 'framer-motion';
import { gerarUUID } from '@/lib/uuid';
import { useApp } from '@/store/app';
import { CLASSES, EQUIPAMENTOS } from '@/data';
import type { NomeClasse, Arma, TipoDano } from '@/types/personagem';
import type { ArmaEquipamento, ArmaduraEquipamento } from '@/types/dados';

function ArmaLinha({
  arma,
  selecionada,
  sugerida,
  index,
  onClick,
}: {
  arma: ArmaEquipamento;
  selecionada: boolean;
  sugerida: boolean;
  index: number;
  onClick: () => void;
}) {
  const [expandida, setExpandida] = useState(false);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, type: 'spring', stiffness: 380, damping: 30 }}
      onClick={() => { onClick(); setExpandida(false); }}
      className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
        selecionada
          ? 'border-gold/60 bg-gold/8'
          : 'border-border/60 hover:border-gold/40 bg-bg-inset'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selecionada
            ? <span className="text-gold text-xs flex-shrink-0">✓</span>
            : <span className="w-3 flex-shrink-0" />}
          <span className={`font-display text-sm tracking-wide truncate ${selecionada ? 'text-gold' : 'text-ink'}`}>
            {arma.nome}
          </span>
          {sugerida && !selecionada && (
            <span className="text-2xs text-gold/50 border border-gold/20 rounded px-1.5 flex-shrink-0">sugerida</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`font-display text-sm ${selecionada ? 'text-gold' : 'text-ink-muted'}`}>
            {arma.dado}
          </span>
          <span className={`text-2xs ${arma.tipo === 'mágico' ? 'text-arcane-glow' : 'text-ink-dim'}`}>
            {arma.tipo === 'mágico' ? 'mág' : 'fís'}
          </span>
        </div>
      </div>

      {selecionada && (
        <div className="mt-2 pt-2 border-t border-gold/20 grid grid-cols-3 gap-x-2 gap-y-0.5">
          <div className="text-2xs text-ink-muted">Atributo</div>
          <div className="text-2xs text-ink-muted">Alcance</div>
          <div className="text-2xs text-ink-muted">Empunhadura</div>
          <div className="text-2xs text-gold/80">{arma.atributo}</div>
          <div className="text-2xs text-ink/80">{arma.alcance}</div>
          <div className="text-2xs text-ink/80">{arma.empunhadura}</div>
          {arma.habilidade && (
            <div className="col-span-3 mt-1.5 text-2xs text-arcane-glow/80 leading-relaxed border-t border-border/40 pt-1.5">
              {arma.habilidade}
            </div>
          )}
        </div>
      )}

      {!selecionada && arma.habilidade && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setExpandida(v => !v); }}
          className="mt-1 text-2xs text-ink-dim hover:text-ink-muted"
        >
          {expandida ? '▲ fechar' : '▼ habilidade'}
        </button>
      )}
      {!selecionada && expandida && arma.habilidade && (
        <div className="mt-1.5 text-2xs text-arcane-glow/70 leading-relaxed">{arma.habilidade}</div>
      )}
    </motion.button>
  );
}

function ArmaduraCard({
  arm,
  selecionada,
  sugerida,
  index,
  onClick,
}: {
  arm: ArmaduraEquipamento;
  selecionada: boolean;
  sugerida: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 380, damping: 30 }}
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-3 py-3 transition-all ${
        selecionada
          ? 'border-gold/60 bg-gold/8'
          : 'border-border/60 hover:border-gold/40 bg-bg-inset'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {selecionada && <span className="text-gold text-xs">✓</span>}
          <span className={`font-display text-sm tracking-wide ${selecionada ? 'text-gold' : 'text-ink'}`}>
            {arm.nome}
          </span>
          {sugerida && !selecionada && (
            <span className="text-2xs text-gold/50 border border-gold/20 rounded px-1.5">sugerida</span>
          )}
        </div>
        <span className={`font-display text-xl leading-none ${selecionada ? 'text-gold' : 'text-arcane-glow'}`}>
          {arm.armadura_base}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-1.5">
        <div className="bg-bg-card rounded-lg px-2 py-1.5 text-center border border-border/40">
          <div className="text-2xs text-ink-muted mb-0.5">Lim. Maior</div>
          <div className="font-display text-sm text-ink">{arm.limiares_base[0]}</div>
        </div>
        <div className="bg-bg-card rounded-lg px-2 py-1.5 text-center border border-blood/20">
          <div className="text-2xs text-blood-glow mb-0.5">Lim. Grave</div>
          <div className="font-display text-sm text-blood-glow">{arm.limiares_base[1]}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {arm.evasao_bonus !== 0 && (
          <span className={`text-2xs border rounded px-1.5 py-0.5 ${
            arm.evasao_bonus > 0
              ? 'text-arcane-glow border-arcane/30'
              : 'text-blood-glow border-blood/30'
          }`}>
            Evasão {arm.evasao_bonus > 0 ? `+${arm.evasao_bonus}` : arm.evasao_bonus}
          </span>
        )}
        {arm.tag && (
          <span className="text-2xs text-arcane-glow/80">
            <span className="font-medium">{arm.tag}:</span> {arm.efeito}
          </span>
        )}
        {!arm.tag && arm.evasao_bonus === 0 && (
          <span className="text-2xs text-ink-dim">Sem habilidade especial</span>
        )}
      </div>
    </motion.button>
  );
}

export function PassoEquipamento() {
  const { personagemAtivo, atualizar, atualizarFn } = useApp();
  const [tabPrimaria, setTabPrimaria] = useState<'fisica' | 'magica'>('fisica');

  if (!personagemAtivo) return null;

  const p = personagemAtivo;
  const classeData = p.classe ? CLASSES[p.classe as NomeClasse] : null;
  const inv = classeData?.inventario_inicial;

  const armSugerida = classeData?.armadura_sugerida.nome ?? '';
  const armaPSugerida = classeData?.arma_primaria_sugerida.nome ?? '';
  const armaSSugerida = classeData?.arma_secundaria_sugerida?.nome ?? '';

  function armaParaPersonagem(a: ArmaEquipamento): Arma {
    return {
      nome: a.nome,
      atributo: a.atributo,
      alcance: a.alcance,
      dado: a.dado,
      tipo: a.tipo as TipoDano,
      empunhadura: a.empunhadura,
      habilidade: a.habilidade,
    };
  }

  function selecionarPrimaria(a: ArmaEquipamento) {
    atualizar({ arma_principal: armaParaPersonagem(a) });
  }

  function selecionarSecundaria(a: ArmaEquipamento | null) {
    atualizar({
      arma_secundaria: a
        ? armaParaPersonagem(a)
        : { nome: '', atributo: '', alcance: '', dado: '', tipo: 'físico' },
    });
  }

  function selecionarArmadura(arm: ArmaduraEquipamento) {
    atualizarFn(prev => {
      const eraPlacas = prev.armadura_ativa.nome === 'Armadura de placas';
      const ehPlacas = arm.nome === 'Armadura de placas';
      // Evasão = base da classe + bônus da armadura + bônus de ancestralidade (Símio)
      // Agilidade NÃO entra na Evasão — aplica só o delta entre a armadura anterior e a nova
      const bonusAnterior = prev.armadura_ativa.evasao_bonus ?? 0;
      const novaEvasao = prev.evasao + (arm.evasao_bonus - bonusAnterior);
      // Armadura de Placas penaliza Agilidade em -1 (atributo, não evasão)
      const deltaAg = (eraPlacas ? 1 : 0) + (ehPlacas ? -1 : 0);
      const novoBonusAg = prev.atributos.Agilidade.bonus + deltaAg;
      let limiares: [number, number] = [...arm.limiares_base];
      if (prev.subclasse === 'Baluarte') { limiares[0]++; limiares[1]++; }
      if (prev.ancestralidade === 'Galapa') { limiares[0] += prev.proficiencia; limiares[1] += prev.proficiencia; }
      return {
        ...prev,
        armadura_ativa: {
          nome: arm.nome,
          limiares_base: arm.limiares_base,
          armadura_base: arm.armadura_base,
          tag: arm.tag,
          efeito: arm.efeito,
          evasao_bonus: arm.evasao_bonus,
        },
        pa_max: arm.armadura_base,
        limiares,
        evasao: novaEvasao,
        atributos: {
          ...prev.atributos,
          Agilidade: { ...prev.atributos.Agilidade, bonus: novoBonusAg },
        },
      };
    });
  }

  // helpers para o inventário inicial da classe
  const pocaoSel = inv ? p.inventario.find(i => inv.escolha_pocao.includes(i.nome))?.nome : undefined;
  const itemSel  = inv ? p.inventario.find(i => inv.escolha_item.includes(i.nome))?.nome  : undefined;
  const decidaSel = inv
    ? (p.inventario.find(i =>
        i.tipo === 'manual' &&
        !inv.padrao.includes(i.nome) &&
        !inv.escolha_pocao.includes(i.nome) &&
        !inv.escolha_item.includes(i.nome)
      )?.nome ?? '')
    : '';

  function escolherPocao(opcao: string) {
    if (!inv) return;
    atualizarFn(prev => ({
      ...prev,
      inventario: [
        ...prev.inventario.filter(i => !inv.escolha_pocao.includes(i.nome)),
        { id: gerarUUID(), nome: opcao, tipo: 'consumivel' as const, timestamp: Date.now() },
      ],
    }));
  }

  function escolherItem(opcao: string) {
    if (!inv) return;
    atualizarFn(prev => ({
      ...prev,
      inventario: [
        ...prev.inventario.filter(i => !inv.escolha_item.includes(i.nome)),
        { id: gerarUUID(), nome: opcao, tipo: 'item' as const, timestamp: Date.now() },
      ],
    }));
  }

  function confirmarDecida(valor: string) {
    if (!inv) return;
    atualizarFn(prev => {
      const semDecida = prev.inventario.filter(i =>
        !(i.tipo === 'manual' && !inv.padrao.includes(i.nome) && !inv.escolha_pocao.includes(i.nome) && !inv.escolha_item.includes(i.nome))
      );
      if (!valor.trim()) return { ...prev, inventario: semDecida };
      return { ...prev, inventario: [...semDecida, { id: gerarUUID(), nome: valor.trim(), tipo: 'manual' as const, timestamp: Date.now() }] };
    });
  }

  const todasPrimarias = [
    ...EQUIPAMENTOS.armas_primarias_fisicas,
    ...EQUIPAMENTOS.armas_primarias_magicas,
  ];
  const listaPrimaria = tabPrimaria === 'fisica'
    ? EQUIPAMENTOS.armas_primarias_fisicas
    : EQUIPAMENTOS.armas_primarias_magicas;

  const armaduraSel = p.armadura_ativa.nome;
  const armaPSel = p.arma_principal.nome;
  const armaSSel = p.arma_secundaria.nome;

  return (
    <div className="space-y-5">

      {/* Arma Principal */}
      <div>
        <div className="section-header mb-3">
          <span className="section-title">Arma Principal</span>
        </div>

        <div className="flex gap-1 mb-3 bg-bg-inset rounded-xl p-1">
          {(['fisica', 'magica'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabPrimaria(tab)}
              className={`flex-1 text-xs rounded-lg py-1.5 transition-colors ${
                tabPrimaria === tab
                  ? tab === 'fisica'
                    ? 'bg-bg-card text-gold border border-gold/30'
                    : 'bg-bg-card text-arcane-glow border border-arcane/30'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab === 'fisica'
                ? `Físicas (${EQUIPAMENTOS.armas_primarias_fisicas.length})`
                : `Mágicas (${EQUIPAMENTOS.armas_primarias_magicas.length})`}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {listaPrimaria.map((a, i) => (
            <ArmaLinha
              key={a.nome}
              arma={a}
              selecionada={armaPSel === a.nome}
              sugerida={armaPSugerida === a.nome}
              index={i}
              onClick={() => selecionarPrimaria(a)}
            />
          ))}
        </div>

        {armaPSugerida && !todasPrimarias.some(a => a.nome === armaPSugerida) && (
          <p className="text-2xs text-ink-dim mt-2">
            Arma sugerida da classe: <span className="text-gold">{armaPSugerida}</span> (pré-configurada)
          </p>
        )}
      </div>

      {/* Arma Secundária */}
      <div>
        <div className="section-header mb-3">
          <span className="section-title">Arma Secundária</span>
          <span className="text-2xs text-ink-dim normal-case ml-2">(opcional)</span>
        </div>

        <div className="space-y-1.5">
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => selecionarSecundaria(null)}
            className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all text-xs ${
              armaSSel === ''
                ? 'border-gold/40 bg-gold/5 text-gold/70'
                : 'border-border/50 text-ink-dim hover:border-border bg-bg-inset'
            }`}
          >
            {armaSSel === '' ? '✓ ' : ''}Nenhuma
          </motion.button>

          {EQUIPAMENTOS.armas_secundarias.map((a, i) => (
            <ArmaLinha
              key={a.nome}
              arma={a}
              selecionada={armaSSel === a.nome}
              sugerida={armaSSugerida === a.nome}
              index={i + 1}
              onClick={() => selecionarSecundaria(a)}
            />
          ))}
        </div>
      </div>

      {/* Armadura */}
      <div>
        <div className="section-header mb-3">
          <span className="section-title">Armadura</span>
        </div>
        <div className="space-y-2">
          {EQUIPAMENTOS.armaduras.map((arm, i) => (
            <ArmaduraCard
              key={arm.nome}
              arm={arm}
              selecionada={armaduraSel === arm.nome}
              sugerida={armSugerida === arm.nome}
              index={i}
              onClick={() => selecionarArmadura(arm)}
            />
          ))}
        </div>
        {armaduraSel && (
          <p className="text-2xs text-ink-dim mt-2 text-center">
            Evasão recalculada automaticamente ao trocar de armadura.
          </p>
        )}
      </div>

      {/* Inventário Inicial */}
      {inv && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card space-y-4"
        >
          <div className="section-header">
            <span className="section-title">Inventário Inicial</span>
          </div>

          <div>
            <div className="text-2xs text-ink-muted uppercase tracking-widest mb-2">Você possui:</div>
            <div className="flex flex-wrap gap-1.5">
              {inv.padrao.map(item => (
                <span key={item} className="text-2xs bg-bg-inset border border-border rounded-lg px-2.5 py-1 text-ink-muted">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-2xs text-gold/70 uppercase tracking-widest mb-2">
              Escolha uma poção:
              {pocaoSel && <span className="ml-2 text-gold normal-case">✓</span>}
            </div>
            <div className="flex flex-col gap-2">
              {inv.escolha_pocao.map(opcao => (
                <button key={opcao} type="button" onClick={() => escolherPocao(opcao)}
                  className={`text-xs rounded-xl border px-3 py-2.5 text-left transition-all ${
                    pocaoSel === opcao ? 'border-gold bg-gold/10 text-gold' : 'border-border text-ink-muted hover:border-gold/40'
                  }`}>
                  {opcao}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-2xs text-gold/70 uppercase tracking-widest mb-2">
              Escolha um item:
              {itemSel && <span className="ml-2 text-gold normal-case">✓</span>}
            </div>
            <div className="flex flex-col gap-2">
              {inv.escolha_item.map(opcao => (
                <button key={opcao} type="button" onClick={() => escolherItem(opcao)}
                  className={`text-xs rounded-xl border px-3 py-2.5 text-left transition-all ${
                    itemSel === opcao ? 'border-gold bg-gold/10 text-gold' : 'border-border text-ink-muted hover:border-gold/40'
                  }`}>
                  {opcao}
                </button>
              ))}
            </div>
          </div>

          {inv.decida && (
            <div>
              <div className="text-2xs text-gold/70 uppercase tracking-widest mb-1">Decida:</div>
              <div className="text-2xs text-ink-dim leading-relaxed mb-2">{inv.decida}</div>
              <input
                className="input"
                defaultValue={decidaSel}
                onBlur={e => confirmarDecida(e.target.value)}
                placeholder="Ex: caderno de partituras"
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
