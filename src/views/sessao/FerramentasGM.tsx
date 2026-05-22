import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gerarUUID } from '@/lib/uuid';
import { Dice6, ChevronDown, ChevronUp, Send, X, Check, Hash, BookmarkPlus, ImagePlus, Loader2, Trash2, Eye, EyeOff, Plus, RotateCcw, Skull, SlidersHorizontal, Package } from 'lucide-react';
import { OBJETIVOS, AMBIENTES, TESOURO_ITENS, CONSUMIVEIS, type Ambiente, type ItemTesouro } from '@/data';
import { supabase } from '@/lib/supabase';
import type { PersonagemSala } from '@/types/supabase';
import { useCampanha } from '@/store/campanha';

// ─── Tipos de revelação ───────────────────────────────────────────────────────
export interface RevelacaoPayload {
  tipo: 'objetivo' | 'ambiente' | 'item' | 'consumivel' | 'imagem';
  titulo: string;
  conteudo: string;
  destinatarios: string[] | 'todos';
}

export const CANAL_REVELA = (campanhaId: string) => `reveals-${campanhaId}`;

// ─── helpers ─────────────────────────────────────────────────────────────────
type CanalRef = React.MutableRefObject<ReturnType<typeof supabase.channel> | null>;

function rolarDado(faces: number) { return Math.floor(Math.random() * faces) + 1; }

const TIPO_CORES: Record<string, string> = {
  Travessia: '100, 170, 80', Exploração: '60, 180, 210',
  Evento: '200, 100, 60',   Social: '196, 100, 196',
};

function BadgeTipo({ tipo }: { tipo: string }) {
  const cor = TIPO_CORES[tipo] ?? '212, 175, 55';
  return (
    <span className="text-[9px] border rounded px-1.5 py-0.5 uppercase tracking-widest"
      style={{ color: `rgba(${cor}, 0.9)`, borderColor: `rgba(${cor}, 0.3)`, background: `rgba(${cor}, 0.08)` }}>
      {tipo}
    </span>
  );
}

// ─── Modal de seleção de destinatário ────────────────────────────────────────
function ModalRevelar({
  jogadores, onConfirmar, onCancelar,
}: {
  jogadores: PersonagemSala[];
  onConfirmar: (dest: string[] | 'todos') => void;
  onCancelar: () => void;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [todos, setTodos] = useState(false);

  function toggleJogador(id: string) {
    setTodos(false);
    setSel(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function confirmar() {
    if (todos) { onConfirmar('todos'); return; }
    if (sel.size === 0) return;
    onConfirmar(Array.from(sel));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
      onClick={onCancelar}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="w-full bg-bg-card rounded-t-2xl border-t border-border/50 px-4 pb-8 pt-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-3">
          <div className="w-9 h-1 rounded-full bg-border/60" />
        </div>
        <div className="font-display text-sm text-gold tracking-wider mb-4">Revelar para...</div>

        <div className="space-y-2 mb-4">
          <button type="button" onClick={() => { setTodos(t => !t); setSel(new Set()); }}
            className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all text-left ${
              todos ? 'border-gold/50 bg-gold/10 text-gold' : 'border-border/40 text-ink-muted hover:text-ink'
            }`}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
              todos ? 'border-gold bg-gold/20' : 'border-border/60'
            }`}>
              {todos && <Check size={10} className="text-gold" />}
            </div>
            <span className="text-sm font-medium">Todos os jogadores</span>
          </button>

          {jogadores.map(slot => {
            const ativo = sel.has(slot.id);
            const nome = (slot.personagem as { nome?: string } | null)?.nome || slot.nome_jogador;
            return (
              <button key={slot.id} type="button" onClick={() => toggleJogador(slot.id)}
                className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all text-left ${
                  ativo ? 'border-gold/40 bg-gold/8 text-gold' : 'border-border/40 text-ink-muted hover:text-ink'
                }`}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  ativo ? 'border-gold bg-gold/20' : 'border-border/60'
                }`}>
                  {ativo && <Check size={10} className="text-gold" />}
                </div>
                <div>
                  <div className="text-sm">{nome}</div>
                  <div className="text-[9px] text-ink-dim">{slot.nome_jogador}</div>
                </div>
                <span className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  slot.online ? 'bg-green-400' : 'bg-border'
                }`} />
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onCancelar}
            className="btn flex-1 flex items-center justify-center gap-1.5">
            <X size={13} />
            Cancelar
          </button>
          <button type="button" onClick={confirmar}
            disabled={!todos && sel.size === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <Send size={13} />
            Revelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Botão de Revelar ─────────────────────────────────────────────────────────
function BotaoRevelar({
  label, jogadores, onRevelar,
}: {
  label: string;
  jogadores: PersonagemSala[];
  onRevelar: (dest: string[] | 'todos') => void;
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function confirmar(dest: string[] | 'todos') {
    setModalAberto(false);
    await onRevelar(dest);
    setEnviado(true);
    setTimeout(() => setEnviado(false), 2500);
  }

  return (
    <>
      <button type="button" onClick={() => setModalAberto(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium border transition-all ${
          enviado
            ? 'border-green-400/40 bg-green-400/10 text-green-400'
            : 'border-gold/30 bg-gold/8 text-gold hover:bg-gold/15'
        }`}>
        {enviado ? <Check size={11} /> : <Send size={11} />}
        {enviado ? 'Revelado!' : label}
      </button>

      <AnimatePresence>
        {modalAberto && (
          <ModalRevelar
            jogadores={jogadores}
            onConfirmar={confirmar}
            onCancelar={() => setModalAberto(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Adversários ─────────────────────────────────────────────────────────────
export interface Adversario {
  id: string;
  nome: string;
  funcao: string;
  patamar: number;
  dificuldade: number;
  limiares: { maior: number; grave: number };
  pv_max: number;
  pv_atual: number;
  pf_max: number;
  pf_atual: number;
  atq: string;
  arma: string;
  alcance: string;
  experiencias: string[];
  habilidades: { nome: string; descricao: string }[];
}

interface FuncaoAdv { id: string; nome: string; pb: number }

const FUNCOES_ADV: FuncaoAdv[] = [
  { id: 'lacaio',      nome: 'Lacaio',      pb: 1 },
  { id: 'padrao',      nome: 'Padrão',      pb: 2 },
  { id: 'horda',       nome: 'Horda',       pb: 2 },
  { id: 'atirador',    nome: 'Atirador',    pb: 2 },
  { id: 'oportunista', nome: 'Oportunista', pb: 2 },
  { id: 'assistente',  nome: 'Assistente',  pb: 2 },
  { id: 'manipulador', nome: 'Manipulador', pb: 3 },
  { id: 'lider',       nome: 'Líder',       pb: 3 },
  { id: 'brutamonte',  nome: 'Brutamonte',  pb: 3 },
  { id: 'solo',        nome: 'Solo',        pb: 4 },
];

const STATS_PATAMAR: Record<number, { pv: number; limiarMaior: number; limiarGrave: number; dificuldade: number; atq: string }> = {
  1: { pv: 6,  limiarMaior: 5,  limiarGrave: 10, dificuldade: 12, atq: '+3'  },
  2: { pv: 12, limiarMaior: 8,  limiarGrave: 16, dificuldade: 14, atq: '+5'  },
  3: { pv: 20, limiarMaior: 12, limiarGrave: 22, dificuldade: 16, atq: '+7'  },
  4: { pv: 30, limiarMaior: 18, limiarGrave: 32, dificuldade: 18, atq: '+10' },
};

function sugerirStats(patamar: number, funcao: string) {
  const b = STATS_PATAMAR[patamar] ?? STATS_PATAMAR[1];
  if (funcao === 'lacaio')     return { ...b, pv: Math.max(1, Math.ceil(b.pv * 0.5)), dificuldade: b.dificuldade - 2 };
  if (funcao === 'horda')      return { ...b, pv: Math.max(1, Math.ceil(b.pv * 0.3)), dificuldade: b.dificuldade - 2 };
  if (funcao === 'brutamonte') return { ...b, pv: b.pv * 2, dificuldade: b.dificuldade + 2 };
  if (funcao === 'lider')      return { ...b, dificuldade: b.dificuldade + 1 };
  if (funcao === 'solo')       return { ...b, pv: b.pv * 3, dificuldade: b.dificuldade + 4, atq: `+${parseInt(b.atq) + 2}` };
  return b;
}

const HABILIDADES_PRESET: Record<string, { nome: string; descricao: string }[]> = {
  lacaio: [
    { nome: 'Em Horda',        descricao: 'Se dois ou mais Lacaios atacarem o mesmo alvo, soma +1 ao ataque por cada Lacaio adicional além do primeiro.' },
    { nome: 'Queda Rentável',  descricao: 'Quando este Lacaio é eliminado, o GM ganha 1 de Medo.' },
    { nome: 'Covardia',        descricao: 'Se o Líder do grupo for derrubado, este Lacaio fica com a condição Vulnerável até o fim do encontro.' },
    { nome: 'Sacrifício',      descricao: 'Reação: quando um aliado adjacente for alvo de um ataque, este Lacaio pode interceptá-lo e receber o dano no lugar.' },
  ],
  padrao: [
    { nome: 'Pressionar',         descricao: 'Em um acerto, empurra o alvo 1 espaço para trás. Se o alvo não puder recuar, o GM ganha 1 de Medo.' },
    { nome: 'Posição Defensiva',  descricao: 'Reação: quando atacado, aumenta a própria Dificuldade em +2 até o início de seu próximo turno.' },
    { nome: 'Agressividade',      descricao: 'Se este adversário não recebeu dano nesta rodada, ganha +1 ao próximo ataque.' },
    { nome: 'Contra-Ataque',      descricao: 'Reação: se um ataque corpo a corpo o acertar, pode realizar imediatamente um ataque de volta com -2.' },
  ],
  horda: [
    { nome: 'Ataque em Enxame',   descricao: 'Ataca todos os personagens dentro do alcance simultaneamente; cada personagem resiste individualmente.' },
    { nome: 'Números Opressivos', descricao: 'Ignora a primeira tentativa de empurrá-la ou afastá-la em cada rodada.' },
    { nome: 'Maré Imparável',     descricao: 'Move-se e ataca no mesmo turno sem penalidade, mesmo passando por espaços adjacentes a inimigos.' },
    { nome: 'Reagrupar',          descricao: 'Se reduzida a 0 PV enquanto houver outra Horda do mesmo tipo em cena, absorve os PV dela e sobrevive com esses PV.' },
    { nome: 'Afogar',             descricao: 'Alvo coberto pela Horda tem -1 à Dificuldade dos ataques contra ele feitos por aliados da Horda.' },
  ],
  atirador: [
    { nome: 'Disparar e Recuar',  descricao: 'Após atacar, move-se metade do movimento gratuitamente sem provocar ataques de oportunidade.' },
    { nome: 'Mirando',            descricao: 'Gasta a ação para mirar; no próximo turno soma +3 ao ataque e ignora cobertura parcial do alvo.' },
    { nome: 'Ponto Cego',         descricao: 'Se atacado em corpo a corpo enquanto não se moveu neste turno, sofre -2 ao próximo ataque à distância.' },
    { nome: 'Tiro Preciso',       descricao: 'Uma vez por rodada, pode rolar novamente um dado de dano do ataque, ficando com o maior resultado.' },
    { nome: 'Barragem',           descricao: 'Ação: atira em dois alvos diferentes no mesmo turno, rolando separadamente para cada um com -1 ao ataque.' },
  ],
  oportunista: [
    { nome: 'Golpe Sorrateiro',    descricao: 'Adiciona +1 dado de dano quando o alvo está Vulnerável ou flanqueado por um aliado.' },
    { nome: 'Aproveitar a Brecha', descricao: 'Reação: quando um aliado acertar um ataque, pode realizar um ataque imediato sem gastar ação.' },
    { nome: 'Desaparecer',         descricao: 'Ação: move-se para cobertura e adquire a condição Escondido até agir novamente.' },
    { nome: 'Agilidade Furtiva',   descricao: 'Não provoca ataques de oportunidade ao sair de corpo a corpo.' },
    { nome: 'Sangue no Ar',        descricao: 'Ganha +2 ao ataque contra alvos com menos de 50% de PV.' },
  ],
  assistente: [
    { nome: 'Curar Ferimentos',  descricao: 'Ação: remove dano de um aliado adjacente igual a 1d6 + metade do Patamar (arredondado).' },
    { nome: 'Escudo Vivo',       descricao: 'Reação: quando aliado adjacente receber dano, pode absorver metade desse dano para si.' },
    { nome: 'Fortalecer',        descricao: 'Ação: aliado adjacente ganha +2 ao próximo rolamento de ataque ou de resistência.' },
    { nome: 'Remover Condição',  descricao: 'Ação: remove uma condição negativa (Vulnerável, Imobilizado ou similar) de um aliado adjacente.' },
    { nome: 'Aura Protetora',    descricao: 'Passivo: aliados a até 1 espaço de distância ignoram o primeiro ponto de Medo gerado por rodada.' },
  ],
  manipulador: [
    { nome: 'Mente Dominada',     descricao: 'Ação: o alvo deve resistir (Dificuldade base) ou atacará o aliado mais próximo no próximo turno.' },
    { nome: 'Semente de Medo',    descricao: 'Toda vez que este adversário acerta um ataque, o GM ganha 1 de Medo adicional.' },
    { nome: 'Campo de Confusão',  descricao: 'Ação: todos os personagens em alcance curto resistem ou ficam com a condição Vulnerável.' },
    { nome: 'Ilusão de Fraqueza', descricao: 'Passivo: a primeira vez que receber dano de um ataque, a fonte fica com a condição Vulnerável.' },
    { nome: 'Ligação Parasita',   descricao: 'Reação: quando este adversário receber dano, pode transferir metade desse dano para um aliado a até 2 espaços.' },
  ],
  lider: [
    { nome: 'Ordem de Ataque',       descricao: 'Ação: um aliado visível pode agir imediatamente fora de sua vez, antes do turno normal.' },
    { nome: 'Presença Intimidante',  descricao: 'Passivo: enquanto vivo, todos os aliados em campo ganham +1 à Dificuldade para serem acertados.' },
    { nome: 'Rali',                  descricao: 'Ação: remove a condição Vulnerável de todos os aliados visíveis.' },
    { nome: 'Morte Motivadora',      descricao: 'Quando um aliado é eliminado no alcance do Líder, todos os outros aliados ganham +2 ao próximo ataque.' },
    { nome: 'Comandante de Campo',   descricao: 'Passivo: Lacaios e aliados de Padrão a até 2 espaços somam +1 de bônus à Dificuldade.' },
  ],
  brutamonte: [
    { nome: 'Esmagar',           descricao: 'Além do dano, o alvo é empurrado 2 espaços e fica com a condição Vulnerável.' },
    { nome: 'Avanço Imparável',  descricao: 'Move-se o dobro do movimento, passando por obstáculos; cada personagem no caminho sofre dano igual ao Limiar Maior.' },
    { nome: 'Pele Grossa',       descricao: 'Passivo: o primeiro ataque que causar dano em cada rodada tem os Limiares reduzidos em 1 nível (Grave → Maior).' },
    { nome: 'Fúria Crescente',   descricao: 'Para cada marcador de Limiar recebido, ganha +1 ao ataque cumulativo (máximo +3).' },
    { nome: 'Arremesso',         descricao: 'Ação: lança um aliado ou objeto adjacente até 3 espaços, causando dano de Limiar Maior ao alvo atingido.' },
  ],
  solo: [
    { nome: 'Fases de Batalha',      descricao: 'Ao cair abaixo de 50% e de 25% de PV, o Solo recupera 1d6 PV, transforma-se e ganha uma nova habilidade; seu ataque aumenta em +2 em cada fase.' },
    { nome: 'Ação Lendária',         descricao: 'Uma vez por rodada, quando outro personagem age, o Solo pode mover-se ou atacar fora de seu turno. Custa 2 de Medo para o GM.' },
    { nome: 'Presença Aterrorizante',descricao: 'Passivo: no início de cada rodada, o GM ganha automaticamente 1 de Medo.' },
    { nome: 'Resistência Brutal',    descricao: 'Quando receber dano igual ou superior ao Limiar Grave, role 1d6. No 4+, o dano é tratado como Limiar Maior.' },
    { nome: 'Alvo Múltiplo',         descricao: 'Pode atacar dois alvos diferentes com uma única ação, rolando separadamente para cada um.' },
    { nome: 'Campo de Força',        descricao: 'Uma vez por fase, pode anular completamente um ataque que ultrapassaria o Limiar Grave. O GM ganha 2 de Medo.' },
  ],
};

interface FormAdv {
  nome: string; funcao: string; patamar: number;
  dificuldade: string; limiarMaior: string; limiarGrave: string;
  pv_max: string; pf_max: string;
  atq: string; arma: string; alcance: string;
  experiencias: string; habNome: string; habDesc: string;
}

const FORM_ADV_0: FormAdv = {
  nome: '', funcao: 'padrao', patamar: 1,
  dificuldade: '12', limiarMaior: '5', limiarGrave: '10',
  pv_max: '6', pf_max: '0',
  atq: '+3', arma: '', alcance: '',
  experiencias: '', habNome: '', habDesc: '',
};

function AdversarioCard({ adv, onChange, onRemover }: {
  adv: Adversario;
  onChange: (patch: Partial<Adversario>) => void;
  onRemover: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const pvPct = adv.pv_max > 0 ? Math.max(0, adv.pv_atual / adv.pv_max) : 0;
  const pfPct = adv.pf_max > 0 ? Math.max(0, adv.pf_atual / adv.pf_max) : 0;
  const pvCor = pvPct > 0.5 ? '100,200,120' : pvPct > 0.25 ? '220,150,60' : '224,112,132';
  const funcao = FUNCOES_ADV.find(f => f.id === adv.funcao);

  return (
    <div className="rounded-xl border border-border/50 bg-bg-inset/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex-1 min-w-0">
          <div className="font-display text-xs tracking-wider text-ink truncate">{adv.nome}</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {funcao && (
              <span className="text-[9px] border border-blood/30 bg-blood/8 text-blood-glow rounded px-1.5 py-0.5 uppercase tracking-widest">
                {funcao.nome} · {funcao.pb}PB
              </span>
            )}
            <span className="text-[9px] text-ink-dim">{adv.patamar}º Patamar</span>
          </div>
        </div>
        <button type="button" onClick={onRemover}
          className="p-1.5 text-ink-dim hover:text-blood-glow transition-colors flex-shrink-0 mt-0.5">
          <X size={12} />
        </button>
      </div>

      {/* Stat block */}
      <div className="grid grid-cols-4 gap-px mx-3 mb-2.5 rounded-lg overflow-hidden border border-border/20 bg-border/10">
        {([
          { label: 'DIF',   value: adv.dificuldade },
          { label: 'ATQ',   value: adv.atq },
          { label: 'L.MAI', value: adv.limiares.maior },
          { label: 'L.GRA', value: adv.limiares.grave },
        ] as const).map(({ label, value }) => (
          <div key={label} className="bg-bg-inset/60 px-2 py-1.5 text-center">
            <div className="text-[8px] text-ink-dim uppercase tracking-widest">{label}</div>
            <div className="font-display text-xs text-ink">{value}</div>
          </div>
        ))}
      </div>

      {/* PV */}
      <div className="px-3 pb-2.5 space-y-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-ink-dim uppercase tracking-widest">PV</span>
            <motion.span key={adv.pv_atual} className="text-2xs font-display"
              style={{ color: `rgb(${pvCor})` }}
              initial={{ scale: 1.3 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
              {adv.pv_atual}/{adv.pv_max}
            </motion.span>
          </div>
          <div className="h-1.5 bg-bg-card rounded-full overflow-hidden border border-border/20">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pvPct * 100}%`, background: `rgb(${pvCor})` }} />
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {[1, 3, 5].map(v => (
              <button key={v} type="button"
                onClick={() => onChange({ pv_atual: Math.max(0, adv.pv_atual - v) })}
                disabled={adv.pv_atual <= 0}
                className="flex-1 text-[10px] py-1 rounded-lg border border-blood/30 text-blood-glow/70
                  hover:bg-blood/10 hover:text-blood-glow disabled:opacity-30 transition-all">
                -{v}
              </button>
            ))}
            <button type="button"
              onClick={() => onChange({ pv_atual: Math.min(adv.pv_max, adv.pv_atual + 1) })}
              disabled={adv.pv_atual >= adv.pv_max}
              className="flex-1 text-[10px] py-1 rounded-lg border border-border/40 text-ink-muted
                hover:text-ink disabled:opacity-30 transition-all">
              +1
            </button>
          </div>
        </div>

        {/* PF */}
        {adv.pf_max > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-ink-dim uppercase tracking-widest">PF</span>
              <span className="text-2xs font-display text-arcane-glow">{adv.pf_atual}/{adv.pf_max}</span>
            </div>
            <div className="h-1 bg-bg-card rounded-full overflow-hidden border border-border/20">
              <div className="h-full rounded-full bg-arcane transition-all duration-300"
                style={{ width: `${pfPct * 100}%` }} />
            </div>
            <div className="flex gap-1.5 mt-1.5">
              <button type="button"
                onClick={() => onChange({ pf_atual: Math.max(0, adv.pf_atual - 1) })}
                disabled={adv.pf_atual <= 0}
                className="flex-1 text-[10px] py-0.5 rounded-lg border border-arcane/30 text-arcane-glow/70
                  hover:bg-arcane/10 disabled:opacity-30 transition-all">-1</button>
              <button type="button"
                onClick={() => onChange({ pf_atual: Math.min(adv.pf_max, adv.pf_atual + 1) })}
                disabled={adv.pf_atual >= adv.pf_max}
                className="flex-1 text-[10px] py-0.5 rounded-lg border border-border/40 text-ink-muted
                  hover:text-ink disabled:opacity-30 transition-all">+1</button>
            </div>
          </div>
        )}

        {/* Arma */}
        {adv.arma && (
          <div className="flex items-baseline gap-1.5 text-2xs">
            <span className="text-[9px] uppercase tracking-widest text-ink-dim flex-shrink-0">Arma</span>
            <span className="text-ink">{adv.arma}</span>
            {adv.alcance && <span className="text-ink-dim">· {adv.alcance}</span>}
          </div>
        )}

        {/* Experiências */}
        {adv.experiencias.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {adv.experiencias.map((e, i) => (
              <span key={i} className="text-[9px] border border-gold/25 bg-gold/6 text-gold/80 rounded px-1.5 py-0.5">
                {e}
              </span>
            ))}
          </div>
        )}

        {/* Habilidades */}
        {adv.habilidades.length > 0 && (
          <div>
            <button type="button" onClick={() => setExpandido(e => !e)}
              className="flex items-center gap-1 text-[9px] text-ink-muted uppercase tracking-widest hover:text-ink transition-colors">
              {expandido ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              Habilidades ({adv.habilidades.length})
            </button>
            <AnimatePresence>
              {expandido && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                  <div className="mt-1.5 space-y-1.5">
                    {adv.habilidades.map((h, i) => (
                      <div key={i} className="rounded-lg bg-bg-card/50 border border-border/20 px-2.5 py-1.5">
                        <div className="text-2xs font-medium text-ink">{h.nome}</div>
                        {h.descricao && <p className="text-[9px] text-ink-muted leading-relaxed mt-0.5">{h.descricao}</p>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function GeradorAdversarios() {
  const [adversarios, setAdversarios] = useState<Adversario[]>([]);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState<FormAdv>(FORM_ADV_0);
  const [habilidades, setHabilidades] = useState<{ nome: string; descricao: string }[]>([]);

  const totalPB = adversarios.reduce((acc, a) => acc + (FUNCOES_ADV.find(f => f.id === a.funcao)?.pb ?? 2), 0);

  function aplicarSugestao(patamar: number, funcao: string) {
    const s = sugerirStats(patamar, funcao);
    setForm(f => ({
      ...f, patamar, funcao,
      dificuldade: String(s.dificuldade),
      limiarMaior: String(s.limiarMaior),
      limiarGrave: String(s.limiarGrave),
      pv_max: String(s.pv),
      atq: s.atq,
    }));
  }

  function adicionarHab() {
    if (!form.habNome.trim()) return;
    setHabilidades(hs => [...hs, { nome: form.habNome.trim(), descricao: form.habDesc.trim() }]);
    setForm(f => ({ ...f, habNome: '', habDesc: '' }));
  }

  function criar() {
    if (!form.nome.trim()) return;
    const pv = Math.max(1, parseInt(form.pv_max) || 6);
    const novo: Adversario = {
      id: gerarUUID(),
      nome: form.nome.trim(),
      funcao: form.funcao,
      patamar: form.patamar,
      dificuldade: parseInt(form.dificuldade) || 12,
      limiares: {
        maior: parseInt(form.limiarMaior) || 5,
        grave: parseInt(form.limiarGrave) || 10,
      },
      pv_max: pv, pv_atual: pv,
      pf_max: Math.max(0, parseInt(form.pf_max) || 0),
      pf_atual: 0,
      atq: form.atq.trim(),
      arma: form.arma.trim(),
      alcance: form.alcance.trim(),
      experiencias: form.experiencias ? form.experiencias.split(',').map(e => e.trim()).filter(Boolean) : [],
      habilidades,
    };
    setAdversarios(prev => [...prev, novo]);
    setCriando(false);
    setForm(FORM_ADV_0);
    setHabilidades([]);
  }

  function atualizar(id: string, patch: Partial<Adversario>) {
    setAdversarios(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wider text-gold flex items-center gap-1.5">
          <Skull size={13} className="text-blood-glow" />
          Adversários
          {adversarios.length > 0 && (
            <span className="text-[9px] text-ink-dim font-sans font-normal tracking-normal">
              {totalPB} PB
            </span>
          )}
        </h3>
        <button type="button" onClick={() => setCriando(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-2xs border transition-all ${
            criando ? 'border-gold/50 bg-gold/10 text-gold' : 'border-border/40 text-ink-muted hover:text-ink'
          }`}>
          <Plus size={11} />
          Adicionar
        </button>
      </div>

      <AnimatePresence initial={false}>
        {criando && (
          <motion.div key="form-adv"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden">
            <div className="space-y-3 pt-1 border-t border-border/20 mt-1">

              {/* Nome */}
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome do adversário *" className="input w-full text-sm mt-2" autoFocus
                onKeyDown={e => e.key === 'Enter' && criar()} />

              {/* Função */}
              <div>
                <div className="text-[9px] text-ink-muted uppercase tracking-widest mb-1.5">Função</div>
                <div className="grid grid-cols-2 gap-1">
                  {FUNCOES_ADV.map(f => (
                    <button key={f.id} type="button"
                      onClick={() => aplicarSugestao(form.patamar, f.id)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all text-left ${
                        form.funcao === f.id
                          ? 'border-blood/50 bg-blood/12 text-blood-glow'
                          : 'border-border/40 text-ink-muted hover:text-ink'
                      }`}>
                      <span className="text-2xs font-medium">{f.nome}</span>
                      <span className={`text-[9px] ${form.funcao === f.id ? 'text-blood-glow/70' : 'text-ink-dim'}`}>
                        {f.pb}PB
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patamar */}
              <div>
                <div className="text-[9px] text-ink-muted uppercase tracking-widest mb-1.5">Patamar</div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(p => (
                    <button key={p} type="button"
                      onClick={() => aplicarSugestao(p, form.funcao)}
                      className={`flex-1 text-2xs py-1.5 rounded-lg border transition-all font-medium ${
                        form.patamar === p
                          ? 'border-gold/50 bg-gold/12 text-gold'
                          : 'border-border/40 text-ink-muted hover:text-ink'
                      }`}>
                      {p}º
                    </button>
                  ))}
                </div>
              </div>

              {/* Habilidades Sugeridas */}
              {(HABILIDADES_PRESET[form.funcao]?.length ?? 0) > 0 && (
                <div>
                  <div className="text-[9px] text-ink-muted uppercase tracking-widest mb-1.5">
                    Habilidades Sugeridas
                    <span className="ml-1.5 normal-case tracking-normal font-normal text-ink-dim">
                      (toque para adicionar)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {HABILIDADES_PRESET[form.funcao].map((h) => {
                      const ativa = habilidades.some(hab => hab.nome === h.nome);
                      return (
                        <button key={h.nome} type="button"
                          onClick={() => {
                            if (ativa) {
                              setHabilidades(hs => hs.filter(hab => hab.nome !== h.nome));
                            } else {
                              setHabilidades(hs => [...hs, h]);
                            }
                          }}
                          className={`w-full text-left rounded-lg border px-2.5 py-2 transition-all ${
                            ativa
                              ? 'border-gold/40 bg-gold/8'
                              : 'border-border/30 bg-bg-inset/30 hover:border-border/60 hover:bg-bg-inset/60'
                          }`}>
                          <div className="flex items-start gap-2">
                            <div className={`flex-shrink-0 mt-0.5 transition-colors ${ativa ? 'text-gold' : 'text-ink-dim'}`}>
                              {ativa ? <Check size={10} /> : <Plus size={10} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-2xs font-medium leading-tight ${ativa ? 'text-gold' : 'text-ink'}`}>
                                {h.nome}
                              </div>
                              <p className="text-[9px] text-ink-muted leading-relaxed mt-0.5">{h.descricao}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: 'Dificuldade', key: 'dificuldade', type: 'number' },
                  { label: 'Ataque',      key: 'atq',         type: 'text'   },
                  { label: 'Limiar Maior', key: 'limiarMaior', type: 'number' },
                  { label: 'Limiar Grave', key: 'limiarGrave', type: 'number' },
                  { label: 'PV máx',      key: 'pv_max',      type: 'number' },
                  { label: 'PF máx',      key: 'pf_max',      type: 'number' },
                ] as { label: string; key: keyof FormAdv; type: string }[]).map(({ label, key, type }) => (
                  <div key={key}>
                    <div className="text-[9px] text-ink-muted mb-1">{label}</div>
                    <input type={type} value={form[key] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={key === 'atq' ? '+3' : key === 'pf_max' ? '0 = sem PF' : undefined}
                      className="input w-full text-sm text-center" />
                  </div>
                ))}
              </div>

              {/* Arma e Alcance */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] text-ink-muted mb-1">Arma</div>
                  <input value={form.arma} onChange={e => setForm(f => ({ ...f, arma: e.target.value }))}
                    placeholder="ex: Garras (1d8+3)" className="input w-full text-xs" />
                </div>
                <div>
                  <div className="text-[9px] text-ink-muted mb-1">Alcance</div>
                  <input value={form.alcance} onChange={e => setForm(f => ({ ...f, alcance: e.target.value }))}
                    placeholder="ex: Corpo a corpo" className="input w-full text-xs" />
                </div>
              </div>

              {/* Experiências */}
              <div>
                <div className="text-[9px] text-ink-muted mb-1">Experiências (vírgula)</div>
                <input value={form.experiencias} onChange={e => setForm(f => ({ ...f, experiencias: e.target.value }))}
                  placeholder="ex: Intimidar, Escalar, Rastrear" className="input w-full text-xs" />
              </div>

              {/* Habilidades */}
              <div>
                <div className="text-[9px] text-ink-muted uppercase tracking-widest mb-1.5">
                  Habilidades{habilidades.length > 0 && ` (${habilidades.length})`}
                </div>
                {habilidades.map((h, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1.5">
                    <div className="flex-1 rounded-lg bg-bg-inset/60 border border-border/20 px-2.5 py-1.5">
                      <div className="text-2xs font-medium text-ink">{h.nome}</div>
                      {h.descricao && <p className="text-[9px] text-ink-muted mt-0.5">{h.descricao}</p>}
                    </div>
                    <button type="button" onClick={() => setHabilidades(hs => hs.filter((_, j) => j !== i))}
                      className="p-1.5 text-ink-dim hover:text-blood-glow transition-colors mt-0.5 flex-shrink-0">
                      <X size={11} />
                    </button>
                  </div>
                ))}
                <div className="space-y-1.5">
                  <input value={form.habNome} onChange={e => setForm(f => ({ ...f, habNome: e.target.value }))}
                    placeholder="Nome da habilidade" className="input w-full text-xs" />
                  <div className="flex gap-1.5">
                    <input value={form.habDesc} onChange={e => setForm(f => ({ ...f, habDesc: e.target.value }))}
                      placeholder="Descrição (opcional)" className="input flex-1 text-xs"
                      onKeyDown={e => e.key === 'Enter' && adicionarHab()} />
                    <button type="button" onClick={adicionarHab} disabled={!form.habNome.trim()}
                      className="btn text-2xs px-2.5 py-1.5 disabled:opacity-40 flex-shrink-0 flex items-center gap-1">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setCriando(false); setForm(FORM_ADV_0); setHabilidades([]); }}
                  className="btn text-2xs px-3 py-1.5">Cancelar</button>
                <button type="button" onClick={criar} disabled={!form.nome.trim()}
                  className="btn-primary text-2xs px-4 py-1.5 disabled:opacity-40">Criar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {adversarios.length === 0 && !criando && (
        <p className="text-2xs text-ink-dim text-center py-2 leading-relaxed">
          Nenhum adversário em cena.<br />Adicione para rastrear PV, stats e habilidades.
        </p>
      )}

      <AnimatePresence initial={false}>
        {adversarios.map(adv => (
          <motion.div key={adv.id}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
            <AdversarioCard adv={adv}
              onChange={p => atualizar(adv.id, p)}
              onRemover={() => setAdversarios(prev => prev.filter(a => a.id !== adv.id))} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Controles da Sessão ──────────────────────────────────────────────────────
export interface ControlesSessao {
  ocultarPvPf: boolean;
}

function ControlesSessaoPanel({ canal }: { canal: CanalRef }) {
  const [controles, setControles] = useState<ControlesSessao>({ ocultarPvPf: false });

  async function toggle(key: keyof ControlesSessao) {
    const novos = { ...controles, [key]: !controles[key] };
    setControles(novos);
    await canal.current?.send({
      type: 'broadcast', event: 'controles_update', payload: novos,
    });
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-display text-sm tracking-wider text-gold flex items-center gap-1.5">
        <SlidersHorizontal size={13} />
        Controles da Sessão
      </h3>
      <div className="flex items-center justify-between py-1">
        <div>
          <div className="text-2xs text-ink">Ocultar PV/PF entre jogadores</div>
          <div className="text-[9px] text-ink-dim mt-0.5">Cada jogador só vê seus próprios stats</div>
        </div>
        <button type="button" onClick={() => toggle('ocultarPvPf')}
          className={`w-11 h-6 rounded-full border relative transition-all flex-shrink-0 ${
            controles.ocultarPvPf ? 'bg-gold/20 border-gold/50' : 'bg-bg-inset border-border/40'
          }`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
            controles.ocultarPvPf ? 'right-1 bg-gold' : 'left-1 bg-border/60'
          }`} />
        </button>
      </div>
    </div>
  );
}

// ─── Gerador de Objetivos ─────────────────────────────────────────────────────
function GeradorObjetivos({ jogadores, canal }: { jogadores: PersonagemSala[]; canal: CanalRef }) {
  const [resultado, setResultado] = useState<{ valor: number; descricao: string } | null>(null);

  function rolar() {
    const v = Math.floor(Math.random() * 12) + 1;
    setResultado(OBJETIVOS[v - 1]);
  }

  async function revelar(dest: string[] | 'todos') {
    if (!resultado || !canal.current) return;
    await canal.current.send({
      type: 'broadcast',
      event: 'revelacao',
      payload: {
        tipo: 'objetivo',
        titulo: `Objetivo — ${resultado.valor}`,
        conteudo: resultado.descricao,
        destinatarios: dest,
      } satisfies RevelacaoPayload,
    });
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wider text-gold">Objetivo do Encontro</h3>
        <span className="text-2xs text-ink-muted">1d12</span>
      </div>
      <button type="button" onClick={rolar}
        className="btn-primary w-full flex items-center justify-center gap-2">
        <Dice6 size={15} />
        Rolar 1d12
      </button>
      <AnimatePresence mode="wait">
        {resultado && (
          <motion.div key={resultado.valor}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg border border-gold/20 bg-gold/5 px-3 py-2.5 space-y-2">
            <div className="text-2xs text-gold">Resultado {resultado.valor}</div>
            <div className="text-sm text-ink leading-relaxed">{resultado.descricao}</div>
            <div className="flex justify-end pt-1">
              <BotaoRevelar label="Revelar objetivo" jogadores={jogadores} onRevelar={revelar} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Gerador de Ambiente ──────────────────────────────────────────────────────
function GeradorAmbiente({ jogadores, canal }: { jogadores: PersonagemSala[]; canal: CanalRef }) {
  const [patamarSel, setPatamarSel] = useState(1);
  const [resultado, setResultado] = useState<Ambiente | null>(null);
  const [expandido, setExpandido] = useState(false);

  function rolar() {
    const pat = AMBIENTES.find(p => p.patamar === patamarSel);
    if (!pat || pat.ambientes.length === 0) return;
    const idx = Math.floor(Math.random() * pat.ambientes.length);
    setResultado(pat.ambientes[idx]);
    setExpandido(false);
  }

  async function revelar(dest: string[] | 'todos') {
    if (!resultado || !canal.current) return;
    await canal.current.send({
      type: 'broadcast',
      event: 'revelacao',
      payload: {
        tipo: 'ambiente',
        titulo: `${resultado.nome} (${resultado.tipo})`,
        conteudo: `${resultado.descricao}${resultado.impulsos ? '\n\nImpulsos: ' + resultado.impulsos.join(', ') : ''}${resultado.dificuldade ? '\nDificuldade: ' + resultado.dificuldade : ''}`,
        destinatarios: dest,
      } satisfies RevelacaoPayload,
    });
  }

  const cor = resultado ? (TIPO_CORES[resultado.tipo] ?? '212, 175, 55') : '212, 175, 55';

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wider text-gold">Ambiente</h3>
        <span className="text-2xs text-ink-muted">por patamar</span>
      </div>

      <div className="flex gap-1.5">
        {AMBIENTES.map(p => (
          <button key={p.patamar} type="button"
            onClick={() => { setPatamarSel(p.patamar); setResultado(null); }}
            className={`flex-1 text-2xs py-1.5 rounded-lg border transition-all font-medium ${
              patamarSel === p.patamar
                ? 'border-gold/50 bg-gold/12 text-gold'
                : 'border-border/40 text-ink-muted hover:text-ink hover:border-border'
            }`}>
            {p.patamar}º
          </button>
        ))}
      </div>

      <button type="button" onClick={rolar}
        className="btn-primary w-full flex items-center justify-center gap-2">
        <Dice6 size={15} />
        Rolar Ambiente
      </button>

      <AnimatePresence mode="wait">
        {resultado && (
          <motion.div key={resultado.nome}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: `rgba(${cor}, 0.3)`, background: `rgba(${cor}, 0.04)` }}>
            <div className="px-3 py-2.5 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-display text-base tracking-wider" style={{ color: `rgb(${cor})` }}>
                  {resultado.nome}
                </div>
                <BadgeTipo tipo={resultado.tipo} />
              </div>
              <p className="text-2xs text-ink-muted leading-relaxed">{resultado.descricao}</p>
              {resultado.impulsos && (
                <div className="text-2xs text-ink-dim">
                  <span className="text-ink-muted">Impulsos: </span>
                  {resultado.impulsos.join(' · ')}
                </div>
              )}
              {resultado.dificuldade && (
                <div className="text-2xs">
                  <span className="text-ink-muted">Dificuldade </span>
                  <span className="text-ink font-medium">{resultado.dificuldade}</span>
                  {resultado.adversarios.length > 0 && (
                    <span className="text-ink-dim"> · {resultado.adversarios.join(', ')}</span>
                  )}
                </div>
              )}
            </div>

            {resultado.habilidades.length > 0 && (
              <>
                <button type="button"
                  onClick={() => setExpandido(e => !e)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-2xs border-t transition-colors hover:bg-white/3"
                  style={{ borderColor: `rgba(${cor}, 0.2)`, color: `rgba(${cor}, 0.8)` }}>
                  <span>Habilidades ({resultado.habilidades.length})</span>
                  {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <AnimatePresence>
                  {expandido && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                      <div className="px-3 pb-3 pt-1 space-y-2">
                        {resultado.habilidades.map(h => (
                          <div key={h.nome} className="rounded-lg px-2.5 py-2 border"
                            style={{ background: `rgba(${cor}, 0.05)`, borderColor: `rgba(${cor}, 0.15)` }}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-2xs font-medium" style={{ color: `rgba(${cor}, 0.9)` }}>{h.nome}</span>
                              <span className="text-[9px] text-ink-dim uppercase tracking-wide">
                                {h.tipo}{h.custo ? ` · ${h.custo}` : ''}
                              </span>
                            </div>
                            <p className="text-2xs text-ink-muted leading-relaxed">{h.descricao}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            <div className="px-3 pb-3 pt-2 flex justify-end border-t"
              style={{ borderColor: `rgba(${cor}, 0.15)` }}>
              <BotaoRevelar label="Revelar ambiente" jogadores={jogadores} onRevelar={revelar} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Botão Enviar ao Inventário ───────────────────────────────────────────────
function BotaoEnviarInventario({
  jogadores, onEnviar,
}: {
  jogadores: PersonagemSala[];
  onEnviar: (dest: string[] | 'todos') => void;
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function confirmar(dest: string[] | 'todos') {
    setModalAberto(false);
    await onEnviar(dest);
    setEnviado(true);
    setTimeout(() => setEnviado(false), 2500);
  }

  return (
    <>
      <button type="button" onClick={() => setModalAberto(true)}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium border transition-all ${
          enviado
            ? 'border-green-400/40 bg-green-400/10 text-green-400'
            : 'border-arcane/30 bg-arcane/6 text-arcane-glow hover:bg-arcane/12'
        }`}>
        {enviado ? <Check size={11} /> : <Package size={11} />}
        {enviado ? 'Enviado ao inventário!' : '→ Enviar direto ao inventário do jogador'}
      </button>
      <AnimatePresence>
        {modalAberto && (
          <ModalRevelar
            jogadores={jogadores}
            onConfirmar={confirmar}
            onCancelar={() => setModalAberto(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Gerador de Tesouro ───────────────────────────────────────────────────────
type TipoTesouro = 'item' | 'consumivel';
type Raridade = 'comum' | 'incomum' | 'raro' | 'lendario';

const RARIDADE_CONFIG: Record<Raridade, { label: string; dados: number; cor: string }> = {
  comum:    { label: 'Comum',    dados: 1, cor: '160, 160, 160' },
  incomum:  { label: 'Incomum',  dados: 2, cor: '100, 170, 80'  },
  raro:     { label: 'Raro',     dados: 3, cor: '60, 130, 215'  },
  lendario: { label: 'Lendário', dados: 4, cor: '212, 175, 55'  },
};

function GeradorTesouro({ jogadores, canal }: { jogadores: PersonagemSala[]; canal: CanalRef }) {
  const [tipo, setTipo] = useState<TipoTesouro>('item');
  const [raridade, setRaridade] = useState<Raridade>('comum');
  const [modoManual, setModoManual] = useState(false);
  const [valorManual, setValorManual] = useState('');
  const [resultado, setResultado] = useState<ItemTesouro | null>(null);
  const [dadosRolados, setDadosRolados] = useState<number[]>([]);
  const [salvo, setSalvo] = useState(false);
  const { sessaoAtual, adicionarLoot } = useCampanha();

  function buscarPorSoma(soma: number): ItemTesouro | null {
    const tabela = tipo === 'item' ? TESOURO_ITENS : CONSUMIVEIS;
    const clamp = Math.max(1, Math.min(60, soma));
    return tabela.find(t => t.soma === clamp) ?? tabela[clamp - 1] ?? null;
  }

  function rolarAutomatico() {
    const { dados } = RARIDADE_CONFIG[raridade];
    const dices: number[] = [];
    for (let i = 0; i < dados; i++) dices.push(rolarDado(12));
    const soma = dices.reduce((a, b) => a + b, 0);
    setDadosRolados(dices);
    setResultado(buscarPorSoma(soma));
  }

  function confirmarManual() {
    const v = parseInt(valorManual, 10);
    if (isNaN(v) || v < 1 || v > 60) return;
    setDadosRolados([]);
    setResultado(buscarPorSoma(v));
  }

  async function revelar(dest: string[] | 'todos') {
    if (!resultado || !canal.current) return;
    await canal.current.send({
      type: 'broadcast',
      event: 'revelacao',
      payload: {
        tipo: tipo,
        titulo: resultado.nome,
        conteudo: resultado.descricao,
        destinatarios: dest,
      } satisfies RevelacaoPayload,
    });
  }

  async function enviarInventario(dest: string[] | 'todos') {
    if (!resultado || !canal.current) return;
    await canal.current.send({
      type: 'broadcast',
      event: 'inventario_add',
      payload: {
        item: {
          id: gerarUUID(),
          nome: resultado.nome,
          descricao: resultado.descricao,
          tipo: tipo,
          timestamp: Date.now(),
        },
        destinatarios: dest,
      },
    });
  }

  function salvarNaSessao() {
    if (!resultado) return;
    adicionarLoot(sessaoAtual, { tipo, nome: resultado.nome, descricao: resultado.descricao });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  const { cor } = RARIDADE_CONFIG[raridade];

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wider text-gold">Tesouro</h3>
        <span className="text-2xs text-ink-muted">tabela 01–60</span>
      </div>

      <div className="flex gap-1.5">
        {(['item', 'consumivel'] as TipoTesouro[]).map(t => (
          <button key={t} type="button" onClick={() => { setTipo(t); setResultado(null); }}
            className={`flex-1 text-2xs py-1.5 rounded-lg border transition-all font-medium ${
              tipo === t ? 'border-gold/50 bg-gold/12 text-gold' : 'border-border/40 text-ink-muted hover:text-ink'
            }`}>
            {t === 'item' ? 'Item' : 'Consumível'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1">
        {(Object.entries(RARIDADE_CONFIG) as [Raridade, typeof RARIDADE_CONFIG[Raridade]][]).map(([k, v]) => (
          <button key={k} type="button" onClick={() => { setRaridade(k); setResultado(null); }}
            className="text-[9px] py-1.5 rounded-lg border transition-all font-medium"
            style={raridade === k
              ? { borderColor: `rgba(${v.cor}, 0.6)`, background: `rgba(${v.cor}, 0.18)`, color: `rgb(${v.cor})` }
              : { borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(232,223,207,0.5)' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Toggle modo rolar / inserir valor */}
      <div className="flex gap-1.5">
        <button type="button" onClick={() => setModoManual(false)}
          className={`flex-1 text-2xs py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 ${
            !modoManual ? 'border-gold/40 bg-gold/10 text-gold' : 'border-border/40 text-ink-muted hover:text-ink'
          }`}>
          <Dice6 size={11} /> Rolar automático
        </button>
        <button type="button" onClick={() => setModoManual(true)}
          className={`flex-1 text-2xs py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 ${
            modoManual ? 'border-gold/40 bg-gold/10 text-gold' : 'border-border/40 text-ink-muted hover:text-ink'
          }`}>
          <Hash size={11} /> Inserir valor
        </button>
      </div>

      {modoManual ? (
        <div className="flex gap-2">
          <input
            type="number" min="1" max="60"
            value={valorManual}
            onChange={e => setValorManual(e.target.value)}
            placeholder="Soma dos dados (1–60)"
            className="input flex-1 text-sm"
            onKeyDown={e => e.key === 'Enter' && confirmarManual()}
          />
          <button type="button" onClick={confirmarManual}
            className="btn-primary px-3 py-2 text-2xs flex-shrink-0">
            Ver
          </button>
        </div>
      ) : (
        <button type="button" onClick={rolarAutomatico}
          className="btn-primary w-full flex items-center justify-center gap-2">
          <Dice6 size={15} />
          Rolar {RARIDADE_CONFIG[raridade].dados}d12
        </button>
      )}

      <AnimatePresence mode="wait">
        {resultado && (
          <motion.div key={resultado.soma}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: `rgba(${cor}, 0.3)`, background: `rgba(${cor}, 0.04)` }}>
            <div className="px-3 py-2.5 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-sm tracking-wide" style={{ color: `rgb(${cor})` }}>
                    {resultado.nome}
                  </div>
                  {dadosRolados.length > 0 ? (
                    <div className="text-[9px] text-ink-dim mt-0.5">
                      {dadosRolados.join(' + ')} = {dadosRolados.reduce((a, b) => a + b, 0)} → soma {resultado.soma}
                    </div>
                  ) : (
                    <div className="text-[9px] text-ink-dim mt-0.5">soma {resultado.soma}</div>
                  )}
                </div>
              </div>
              <p className="text-2xs text-ink-muted leading-relaxed">{resultado.descricao}</p>
            </div>
            <div className="px-3 pb-3 pt-2 border-t space-y-2"
              style={{ borderColor: `rgba(${cor}, 0.15)` }}>
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={salvarNaSessao}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium border transition-all ${
                    salvo
                      ? 'border-green-400/40 bg-green-400/10 text-green-400'
                      : 'border-border/40 text-ink-muted hover:text-ink hover:border-border'
                  }`}>
                  {salvo ? <Check size={11} /> : <BookmarkPlus size={11} />}
                  {salvo ? 'Salvo!' : 'Salvar na sessão'}
                </button>
                <BotaoRevelar label="Revelar" jogadores={jogadores} onRevelar={revelar} />
              </div>
              <BotaoEnviarInventario jogadores={jogadores} onEnviar={enviarInventario} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Contagens ────────────────────────────────────────────────────────────────
export interface Contagem {
  id: string;
  titulo: string;
  situacao: string;
  tipo: 'progressiva' | 'regressiva';
  valorAtual: number;
  valorMax: number;
  dificuldade: string;
  visivelJogadores: boolean;
}

const COR_CONTAGEM = { regressiva: '224, 112, 132', progressiva: '100, 200, 160' };

function ContagemCard({ c, onAlterarValor, onToggle, onReiniciar, onRemover }: {
  c: Contagem;
  onAlterarValor: (delta: number) => void;
  onToggle: () => void;
  onReiniciar: () => void;
  onRemover: () => void;
}) {
  const cor = COR_CONTAGEM[c.tipo];
  const pct = c.valorMax > 0 ? c.valorAtual / c.valorMax : 0;
  const esgotada = c.tipo === 'regressiva' ? c.valorAtual <= 0 : c.valorAtual >= c.valorMax;

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 transition-all ${
      c.visivelJogadores ? 'border-gold/30 bg-gold/4' : 'border-border/40'
    } ${esgotada ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xs tracking-wider text-ink truncate">{c.titulo}</span>
            <span className="text-[9px] text-ink-dim border border-border/30 rounded px-1 py-0.5 flex-shrink-0">
              {c.tipo === 'regressiva' ? '↓' : '↑'} {c.tipo}
            </span>
          </div>
          {c.situacao && <p className="text-[9px] text-ink-dim mt-0.5 leading-relaxed line-clamp-2">{c.situacao}</p>}
          {c.dificuldade && <p className="text-[9px] text-ink-muted mt-0.5">Dificuldade {c.dificuldade}</p>}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" onClick={onReiniciar} title="Reiniciar"
            className="p-1.5 rounded-lg text-ink-dim hover:text-ink transition-colors">
            <RotateCcw size={11} />
          </button>
          <button type="button" onClick={onToggle}
            title={c.visivelJogadores ? 'Visível para jogadores' : 'Apenas GM'}
            className={`p-1.5 rounded-lg transition-colors ${
              c.visivelJogadores ? 'text-gold bg-gold/10' : 'text-ink-dim hover:text-ink'
            }`}>
            {c.visivelJogadores ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button type="button" onClick={onRemover}
            className="p-1.5 rounded-lg text-ink-dim hover:text-blood-glow transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-bg-inset rounded-full overflow-hidden border border-border/20">
        <motion.div className="h-full rounded-full transition-all duration-400"
          style={{ width: `${pct * 100}%`, background: `rgb(${cor})` }} />
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onAlterarValor(-1)}
          disabled={c.valorAtual <= 0}
          className="w-9 h-9 rounded-xl bg-bg-inset border border-border/40 text-xl font-display
            text-ink-muted hover:text-ink disabled:opacity-25 transition-all flex items-center justify-center">
          −
        </button>
        <div className="text-center">
          <motion.div key={c.valorAtual}
            className="font-display text-3xl leading-none"
            style={{ color: `rgb(${cor})` }}
            initial={{ scale: 1.35 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
            {c.valorAtual}
          </motion.div>
          <div className="text-[9px] text-ink-dim mt-0.5">/ {c.valorMax}</div>
        </div>
        <button type="button" onClick={() => onAlterarValor(1)}
          disabled={c.valorAtual >= c.valorMax}
          className="w-9 h-9 rounded-xl bg-bg-inset border border-border/40 text-xl font-display
            text-ink-muted hover:text-ink disabled:opacity-25 transition-all flex items-center justify-center">
          +
        </button>
      </div>
    </div>
  );
}

const FORM_INICIAL = { titulo: '', situacao: '', tipo: 'regressiva' as 'progressiva' | 'regressiva', valorMax: '5', dificuldade: '', visivelJogadores: false };

function GeradorContagens({ canal }: { canal: CanalRef }) {
  const [contagens, setContagens] = useState<Contagem[]>([]);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  async function broadcastVisiveis(cs: Contagem[]) {
    if (!canal.current) return;
    await canal.current.send({
      type: 'broadcast',
      event: 'contagem_update',
      payload: cs.filter(c => c.visivelJogadores),
    });
  }

  function criar() {
    if (!form.titulo.trim()) return;
    const max = Math.max(1, parseInt(form.valorMax) || 5);
    const nova: Contagem = {
      id: gerarUUID(),
      titulo: form.titulo.trim(),
      situacao: form.situacao.trim(),
      tipo: form.tipo,
      valorAtual: form.tipo === 'regressiva' ? max : 0,
      valorMax: max,
      dificuldade: form.dificuldade,
      visivelJogadores: form.visivelJogadores,
    };
    const novas = [...contagens, nova];
    setContagens(novas);
    broadcastVisiveis(novas);
    setCriando(false);
    setForm(FORM_INICIAL);
  }

  async function alterarValor(id: string, delta: number) {
    const novas = contagens.map(c =>
      c.id === id ? { ...c, valorAtual: Math.max(0, Math.min(c.valorMax, c.valorAtual + delta)) } : c
    );
    setContagens(novas);
    await broadcastVisiveis(novas);
  }

  async function reiniciar(id: string) {
    const novas = contagens.map(c =>
      c.id === id ? { ...c, valorAtual: c.tipo === 'regressiva' ? c.valorMax : 0 } : c
    );
    setContagens(novas);
    await broadcastVisiveis(novas);
  }

  async function toggleVisivel(id: string) {
    const novas = contagens.map(c => c.id === id ? { ...c, visivelJogadores: !c.visivelJogadores } : c);
    setContagens(novas);
    await broadcastVisiveis(novas);
  }

  async function remover(id: string) {
    const novas = contagens.filter(c => c.id !== id);
    setContagens(novas);
    await broadcastVisiveis(novas);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wider text-gold">Contagens</h3>
        <button type="button" onClick={() => setCriando(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-2xs border transition-all ${
            criando ? 'border-gold/50 bg-gold/10 text-gold' : 'border-border/40 text-ink-muted hover:text-ink hover:border-border'
          }`}>
          <Plus size={11} />
          Nova
        </button>
      </div>

      <AnimatePresence initial={false}>
        {criando && (
          <motion.div key="form"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden">
            <div className="space-y-2.5 pt-1 border-t border-border/20">
              <input value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && criar()}
                placeholder="Título (ex: Chão Quebrando)"
                className="input w-full text-sm mt-2" autoFocus />
              <textarea value={form.situacao}
                onChange={e => setForm(f => ({ ...f, situacao: e.target.value }))}
                placeholder="Situação / descrição (opcional)"
                rows={2} className="input w-full text-xs resize-none" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[9px] text-ink-muted mb-1 uppercase tracking-widest">Tipo</div>
                  <div className="flex gap-1">
                    {(['regressiva', 'progressiva'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t }))}
                        className={`flex-1 text-[10px] py-1.5 rounded-lg border transition-all font-medium ${
                          form.tipo === t ? 'border-gold/50 bg-gold/12 text-gold' : 'border-border/40 text-ink-muted hover:text-ink'
                        }`}>
                        {t === 'regressiva' ? '↓ Regressiva' : '↑ Progressiva'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-ink-muted mb-1 uppercase tracking-widest">Valor</div>
                  <input type="number" min="1" max="20" value={form.valorMax}
                    onChange={e => setForm(f => ({ ...f, valorMax: e.target.value }))}
                    className="input w-16 text-sm text-center" />
                </div>
                <div>
                  <div className="text-[9px] text-ink-muted mb-1 uppercase tracking-widest">Dif.</div>
                  <input type="number" min="1" value={form.dificuldade}
                    onChange={e => setForm(f => ({ ...f, dificuldade: e.target.value }))}
                    placeholder="—" className="input w-14 text-sm text-center" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => setForm(f => ({ ...f, visivelJogadores: !f.visivelJogadores }))}
                  className={`flex items-center gap-1.5 text-2xs transition-colors ${
                    form.visivelJogadores ? 'text-gold' : 'text-ink-muted'
                  }`}>
                  {form.visivelJogadores ? <Eye size={12} /> : <EyeOff size={12} />}
                  {form.visivelJogadores ? 'Visível para jogadores' : 'Apenas GM'}
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setCriando(false); setForm(FORM_INICIAL); }}
                    className="btn text-2xs px-3 py-1.5">Cancelar</button>
                  <button type="button" onClick={criar}
                    disabled={!form.titulo.trim()}
                    className="btn-primary text-2xs px-4 py-1.5 disabled:opacity-40">Criar</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {contagens.length === 0 && !criando && (
        <p className="text-2xs text-ink-dim text-center py-2 leading-relaxed">
          Nenhuma contagem ativa.<br />Use para perseguições, tempo, colapsos...
        </p>
      )}

      <AnimatePresence initial={false}>
        {contagens.map(c => (
          <motion.div key={c.id}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
            <ContagemCard c={c}
              onAlterarValor={delta => alterarValor(c.id, delta)}
              onToggle={() => toggleVisivel(c.id)}
              onReiniciar={() => reiniciar(c.id)}
              onRemover={() => remover(c.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Gerador de Imagens ───────────────────────────────────────────────────────
interface ImagemUpload {
  id: string;
  nome: string;
  url: string;
  uploading: boolean;
  erro?: boolean;
}

function GeradorImagens({ campanhaId, jogadores, canal }: {
  campanhaId: string;
  jogadores: PersonagemSala[];
  canal: CanalRef;
}) {
  const [imagens, setImagens] = useState<ImagemUpload[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';

    const id = gerarUUID();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${campanhaId}/${id}.${ext}`;

    setImagens(prev => [...prev, { id, nome: file.name, url: '', uploading: true }]);

    const { error } = await supabase.storage
      .from('session-images')
      .upload(path, file, { upsert: true });

    if (error) {
      setImagens(prev => prev.map(i => i.id === id ? { ...i, uploading: false, erro: true } : i));
      return;
    }

    const { data } = supabase.storage.from('session-images').getPublicUrl(path);
    setImagens(prev => prev.map(i =>
      i.id === id ? { ...i, url: data.publicUrl, uploading: false } : i
    ));
  }

  async function revelar(img: ImagemUpload, dest: string[] | 'todos') {
    if (!canal.current) return;
    await canal.current.send({
      type: 'broadcast',
      event: 'revelacao',
      payload: {
        tipo: 'imagem',
        titulo: img.nome,
        conteudo: img.url,
        destinatarios: dest,
      } satisfies RevelacaoPayload,
    });
    // Persiste no DB para jogadores que entrarem depois
    const { data } = await supabase
      .from('campanhas')
      .select('imagens_reveladas')
      .eq('id', campanhaId)
      .single() as { data: { imagens_reveladas: { url: string; titulo: string; timestamp: number }[] | null } | null; error: unknown };
    const atual = data?.imagens_reveladas ?? [];
    await supabase
      .from('campanhas')
      .update({ imagens_reveladas: [...atual, { url: img.url, titulo: img.nome, timestamp: Date.now() }] } as never)
      .eq('id', campanhaId);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wider text-gold">Imagens</h3>
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs border border-gold/30 text-gold hover:bg-gold/10 transition-all">
          <ImagePlus size={11} />
          Subir imagem
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {imagens.length === 0 ? (
        <p className="text-2xs text-ink-dim text-center py-2">Nenhuma imagem enviada. Suba NPCs, mapas ou ambientes.</p>
      ) : (
        <div className="space-y-2">
          {imagens.map(img => (
            <div key={img.id} className="flex items-center gap-2.5 rounded-xl border border-border/40 px-2.5 py-2">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg-inset border border-border/30 flex-shrink-0 flex items-center justify-center">
                {img.uploading ? (
                  <Loader2 size={16} className="text-ink-dim animate-spin" />
                ) : img.erro ? (
                  <span className="text-[9px] text-blood-glow text-center leading-tight px-1">Erro</span>
                ) : (
                  <img src={img.url} alt={img.nome} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xs text-ink truncate leading-tight">{img.nome}</div>
                {img.uploading && <div className="text-[9px] text-ink-dim mt-0.5">Enviando...</div>}
                {img.erro && <div className="text-[9px] text-blood-glow mt-0.5">Falha no envio</div>}
              </div>
              {!img.uploading && !img.erro && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <BotaoRevelar label="Revelar" jogadores={jogadores} onRevelar={dest => revelar(img, dest)} />
                  <button type="button" onClick={() => setImagens(prev => prev.filter(i => i.id !== img.id))}
                    className="text-ink-dim hover:text-blood-glow transition-colors p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function FerramentasGM({
  campanhaId,
  jogadores,
}: {
  campanhaId: string;
  jogadores: PersonagemSala[];
}) {
  const canalRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const ch = supabase.channel(CANAL_REVELA(campanhaId));
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') canalRef.current = ch;
    });
    return () => {
      supabase.removeChannel(ch);
      canalRef.current = null;
    };
  }, [campanhaId]);

  return (
    <div className="space-y-4">
      <ControlesSessaoPanel canal={canalRef} />
      <GeradorAdversarios />
      <GeradorContagens canal={canalRef} />
      <GeradorImagens campanhaId={campanhaId} jogadores={jogadores} canal={canalRef} />
      <GeradorObjetivos jogadores={jogadores} canal={canalRef} />
      <GeradorAmbiente jogadores={jogadores} canal={canalRef} />
      <GeradorTesouro jogadores={jogadores} canal={canalRef} />
    </div>
  );
}
