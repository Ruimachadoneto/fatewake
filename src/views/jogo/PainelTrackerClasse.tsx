import { useState } from 'react';
import { useApp } from '@/store/app';
import { FORMAS_FERA } from '@/data';
import type { NomeClasse } from '@/types/personagem';

// ─── Tracker: Bardo ───────────────────────────────────────────────────────────

function TrackerBardo() {
  const { personagemAtivo } = useApp();
  const nivel = personagemAtivo?.nivel ?? 1;
  const subclasse = personagemAtivo?.subclasse ?? '';
  const dadoInspiracao = nivel >= 5 ? 'd8' : 'd6';
  const [inspiracaoUsada, setInpiracaoUsada] = useState(false);
  // Trovador: 3 canções, cada uma 1×/descanso longo
  const [cancoes, setCancoes] = useState({ comovente: false, epica: false, relaxante: false });

  const ehTrovador = subclasse === 'Trovador';

  return (
    <div className="space-y-3">
      {/* Inspiração — universal */}
      <div className="bg-bg-inset rounded-xl border border-border px-3 py-3">
        <div className="text-xs text-gold/80 font-medium mb-2">Inspiração</div>
        <div className="flex items-center justify-between">
          <span className="text-2xs text-ink-muted">
            Dado: <span className="text-arcane-glow font-display">{dadoInspiracao}</span>
          </span>
          <button
            type="button"
            onClick={() => setInpiracaoUsada(d => !d)}
            className={`text-2xs border rounded-lg px-3 py-1.5 transition-colors ${
              !inspiracaoUsada
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-border text-ink-dim hover:border-gold/40'
            }`}
          >
            {inspiracaoUsada ? 'Usado' : '✓ Disponível'}
          </button>
        </div>
        <p className="text-2xs text-ink-dim mt-2 leading-relaxed">
          1× por sessão → grupo recebe {dadoInspiracao}. Some a teste, reação, dano ou recupere PF.
        </p>
      </div>

      {/* Trovador: Artista Talentoso */}
      {ehTrovador && (
        <div className="bg-bg-inset rounded-xl border border-arcane/30 px-3 py-3">
          <div className="text-xs text-arcane-glow font-medium mb-2">Artista Talentoso</div>
          <p className="text-2xs text-ink-dim mb-3 leading-relaxed">
            1× por descanso longo cada canção:
          </p>
          <div className="space-y-2">
            {([
              { key: 'comovente', label: 'Canção Comovente', desc: 'Você e aliados próximos recebem 1 Esperança' },
              { key: 'epica',     label: 'Canção Épica',     desc: 'Um alvo próximo fica temporariamente Vulnerável' },
              { key: 'relaxante', label: 'Canção Relaxante', desc: 'Você e aliados próximos recuperam 1 PV' },
            ] as const).map(({ key, label, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCancoes(c => ({ ...c, [key]: !c[key] }))}
                className={`w-full text-left rounded-lg border px-3 py-2 transition-all ${
                  cancoes[key]
                    ? 'border-border/30 bg-bg-card opacity-40 cursor-not-allowed'
                    : 'border-arcane/30 hover:border-arcane/60'
                }`}
              >
                <div className={`text-2xs font-medium ${cancoes[key] ? 'text-ink-dim' : 'text-arcane-glow'}`}>
                  {cancoes[key] ? '✓ Usada —' : ''} {label}
                </div>
                <div className="text-2xs text-ink-dim mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCancoes({ comovente: false, epica: false, relaxante: false })}
            className="w-full mt-2 text-2xs border border-border text-ink-dim rounded-lg px-2 py-1.5 hover:border-arcane/30 transition-colors"
          >
            ↺ Descanso longo — restaurar canções
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tracker: Druida ──────────────────────────────────────────────────────────

function TrackerDruida() {
  const { personagemAtivo, atualizar } = useApp();
  if (!personagemAtivo) return null;

  const nivel = personagemAtivo.nivel ?? 1;
  // Patamar = 1 para níveis 1-2, 2 para 3-4, 3 para 5-6, 4 para 7-8
  const patamarMax = nivel <= 2 ? 1 : nivel <= 4 ? 2 : nivel <= 6 ? 3 : 4;

  const formasDisponiveis = FORMAS_FERA.patamares
    .filter(p => p.patamar <= patamarMax)
    .flatMap(p => p.formas.map(f => ({ ...f, patamar: p.patamar })));

  const formaAtiva = personagemAtivo.forma_fera_ativa;
  const emForma = !!formaAtiva;
  const formaData = formasDisponiveis.find(f => f.nome === formaAtiva);

  function ativarForma(nome: string) {
    atualizar({ forma_fera_ativa: nome });
  }

  function sairForma() {
    atualizar({ forma_fera_ativa: undefined });
  }

  return (
    <div className="space-y-3">
      {/* Status da forma */}
      <div className={`rounded-xl border px-3 py-3 ${
        emForma ? 'border-arcane/50 bg-arcane/5' : 'border-border bg-bg-inset'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gold/80 font-medium">Forma de Fera</span>
          {emForma && (
            <button
              type="button"
              onClick={sairForma}
              className="text-2xs border border-blood/40 text-blood-glow rounded-lg px-2 py-1 hover:bg-blood/10 transition-colors"
            >
              Sair da Forma
            </button>
          )}
        </div>

        {emForma && formaData ? (
          <div className="space-y-1.5">
            <div className="font-display text-base text-arcane-glow">{formaData.nome}</div>
            <div className="text-2xs text-ink-dim">{formaData.exemplos}</div>
            <div className="flex gap-3 text-2xs text-ink-muted flex-wrap">
              {formaData.ataque && (
                <span>⚔ {formaData.ataque.dado} {formaData.ataque.tipo} · {formaData.ataque.alcance}</span>
              )}
              {formaData.evasao_bonus && (
                <span>Evasão +{formaData.evasao_bonus}</span>
              )}
              {formaData.atributo_bonus && (
                <span>
                  {Object.entries(formaData.atributo_bonus).map(([a, v]) => `${a} +${v}`).join(', ')}
                </span>
              )}
            </div>
            {formaData.vantagem_em && formaData.vantagem_em.length > 0 && (
              <div className="text-2xs text-ink-dim">
                Vantagem em: {formaData.vantagem_em.join(', ')}
              </div>
            )}
            {formaData.habilidades.map((h, i) => (
              <div key={i} className="text-2xs text-ink-muted leading-relaxed border-t border-border/50 pt-1.5">
                {h}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-2xs text-ink-dim">Fora da Forma de Fera.</p>
        )}
      </div>

      {/* Seletor de forma */}
      <div>
        <div className="text-2xs text-ink-muted uppercase tracking-wider mb-2">
          Formas disponíveis (patamar ≤ {patamarMax})
        </div>
        <div className="space-y-1">
          {formasDisponiveis.map(f => (
            <button
              key={f.nome}
              type="button"
              onClick={() => ativarForma(f.nome)}
              className={`w-full text-left rounded-lg border px-3 py-2 transition-all text-2xs ${
                formaAtiva === f.nome
                  ? 'border-arcane/50 bg-arcane/10 text-arcane-glow'
                  : 'border-border text-ink-muted hover:border-arcane/40'
              }`}
            >
              <span className="font-medium">{f.nome}</span>
              <span className="text-ink-dim ml-1.5">— {f.exemplos}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tracker: Feiticeiro ──────────────────────────────────────────────────────

function TrackerFeiticeiro() {
  const { personagemAtivo } = useApp();
  const [cartaReserva, setCartaReserva] = useState<string>('');
  const [reservaAtiva, setReservaAtiva] = useState(false);

  const elemento = personagemAtivo?.elemento_feiticeiro;
  const ehElementalista = personagemAtivo?.subclasse === 'Elementalista';

  return (
    <div className="space-y-3">
      {/* Elemento (Elementalista) */}
      {ehElementalista && (
        <div className="bg-bg-inset rounded-xl border border-arcane/30 px-3 py-3">
          <div className="text-xs text-arcane-glow font-medium mb-1">Elementalismo</div>
          {elemento ? (
            <div className="flex items-center gap-2">
              <span className="text-2xs text-ink-muted">Elemento:</span>
              <span className="font-display text-sm text-arcane-glow">{elemento}</span>
            </div>
          ) : (
            <p className="text-2xs text-ink-dim">Elemento não definido — configure na edição da ficha.</p>
          )}
          <p className="text-2xs text-ink-dim mt-1.5 leading-relaxed">
            Gaste 1 Esperança e descreva como usa {elemento ?? 'o elemento'} → +2 no teste ou +3 no dano.
          </p>
        </div>
      )}

      {/* Carta na Reserva (Canalizar Poder Bruto) */}
      <div className="bg-bg-inset rounded-xl border border-border px-3 py-3">
        <div className="text-xs text-gold/80 font-medium mb-2">Canalizar Poder Bruto</div>
        <div className="flex gap-2 mb-2">
          <input
            className="input flex-1 text-sm"
            value={cartaReserva}
            onChange={e => setCartaReserva(e.target.value)}
            placeholder="Carta colocada na reserva..."
          />
          <button
            type="button"
            onClick={() => setReservaAtiva(r => !r)}
            className={`text-2xs border rounded-lg px-3 py-1.5 transition-colors flex-shrink-0 ${
              reservaAtiva
                ? 'border-arcane/50 bg-arcane/10 text-arcane-glow'
                : 'border-border text-ink-dim hover:border-arcane/40'
            }`}
          >
            {reservaAtiva ? 'Usada' : 'Disponível'}
          </button>
        </div>
        <p className="text-2xs text-ink-dim leading-relaxed">
          1× por descanso longo: coloque uma carta da mão na reserva → receba Esperança igual ao nível da carta, ou bônus de dano igual ao dobro do nível.
        </p>
      </div>
    </div>
  );
}

// ─── Tracker: Guardião ────────────────────────────────────────────────────────

function TrackerGuardiao() {
  const { personagemAtivo } = useApp();
  const nivel = personagemAtivo?.nivel ?? 1;
  const dado = nivel >= 5 ? 'd6' : 'd4';
  const dadoMax = nivel >= 5 ? 6 : 4;
  const [determinado, setDeterminado] = useState(false);
  const [usadoDescanso, setUsadoDescanso] = useState(false);
  const [valor, setValor] = useState(1);

  function ativar() {
    setDeterminado(true);
    setUsadoDescanso(true);
    setValor(1);
  }

  function avancar() {
    if (valor >= dadoMax) {
      setDeterminado(false);
    } else {
      setValor(v => v + 1);
    }
  }

  return (
    <div className="space-y-2">
      <div className={`rounded-xl border px-3 py-3 ${
        determinado ? 'border-gold/50 bg-gold/5' : 'bg-bg-inset border-border'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gold/80 font-medium">Determinação · {dado}</span>
          {determinado && (
            <button
              type="button"
              onClick={() => setDeterminado(false)}
              className="text-2xs border border-blood/40 text-blood-glow rounded px-2 py-1 hover:bg-blood/10 transition-colors"
            >
              Encerrar
            </button>
          )}
        </div>

        {determinado ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="font-display text-4xl text-gold">{valor}</div>
                <div className="text-2xs text-ink-dim">/ {dadoMax}</div>
              </div>
              <button
                type="button"
                onClick={avancar}
                className="flex-1 text-2xs border border-gold/40 text-gold rounded-lg px-3 py-2 hover:bg-gold/10 transition-colors"
              >
                +1 (ao marcar PV)
              </button>
            </div>
            <p className="text-2xs text-gold/70 leading-relaxed">
              ↓ gravidade física · +{valor} ao dano · imune Imobilizado/Vulnerável
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={ativar}
              disabled={usadoDescanso}
              className={`w-full text-sm border rounded-lg px-3 py-2 transition-colors ${
                !usadoDescanso
                  ? 'border-gold/50 text-gold hover:bg-gold/10'
                  : 'border-border text-ink-dim opacity-50 cursor-not-allowed'
              }`}
            >
              {usadoDescanso ? 'Usado (1× por descanso longo)' : 'Ativar Determinação'}
            </button>
            <p className="text-2xs text-ink-dim leading-relaxed">
              Começa em 1 · sobe +1 ao marcar PV em alvo · encerra ao ultrapassar {dadoMax} ou cena acabar.
            </p>
          </div>
        )}
      </div>

      {usadoDescanso && !determinado && (
        <button
          type="button"
          onClick={() => { setUsadoDescanso(false); setValor(1); }}
          className="w-full text-2xs border border-border text-ink-dim rounded-lg px-2 py-1.5 hover:border-gold/30 transition-colors"
        >
          ↺ Após descanso longo — restaurar
        </button>
      )}
    </div>
  );
}

// ─── Tracker: Guerreiro ───────────────────────────────────────────────────────

function TrackerGuerreiro() {
  const { personagemAtivo } = useApp();
  const subclasse = personagemAtivo?.subclasse ?? '';
  const proficiencia = personagemAtivo?.proficiencia ?? 1;
  const ehMatanca = subclasse === 'Escolhido da Matança';

  // Dados de Matança: máx = Proficiência, acumulados ao rolar com Esperança
  const [dadosMatanca, setDadosMatanca] = useState(0);

  return (
    <div className="space-y-3">
      {/* Ataque de Oportunidade — universal */}
      <div className="bg-bg-inset rounded-xl border border-border px-3 py-3">
        <div className="text-xs text-gold/80 font-medium mb-2">Ataque de Oportunidade</div>
        <p className="text-2xs text-ink-dim leading-relaxed">
          Quando adversário corpo a corpo tenta se afastar, faça um teste de reação. Em sucesso: impeça o movimento, cause dano ou mova-se com ele.
        </p>
      </div>

      {/* Escolhido da Matança: Dados de Matança */}
      {ehMatanca && (
        <div className="bg-bg-inset rounded-xl border border-arcane/30 px-3 py-3">
          <div className="text-xs text-arcane-glow font-medium mb-3">
            Matança — Dados de Matança
          </div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <button
              type="button"
              onClick={() => setDadosMatanca(d => Math.max(0, d - 1))}
              className="w-10 h-10 rounded-xl border border-blood/40 text-blood-glow text-lg hover:bg-blood/10 transition-colors"
            >−</button>
            <div className="text-center flex-1">
              <div className="font-display text-3xl text-arcane-glow">{dadosMatanca}</div>
              <div className="text-2xs text-ink-dim">/ {proficiencia} d6</div>
            </div>
            <button
              type="button"
              onClick={() => setDadosMatanca(d => Math.min(proficiencia, d + 1))}
              className="w-10 h-10 rounded-xl border border-gold/40 text-gold text-lg hover:bg-gold/10 transition-colors"
            >+</button>
          </div>
          <p className="text-2xs text-ink-dim leading-relaxed">
            Ao rolar com Esperança, receba 1d6 em vez de +1 Esperança (máx. {proficiencia} dados).
            Gaste qualquer quantidade em teste de ataque ou rolagem de dano.
            Dados não utilizados ao fim da sessão → +1 Esperança por dado perdido.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tracker: Ladino ──────────────────────────────────────────────────────────

function TrackerLadino() {
  const { personagemAtivo } = useApp();
  const nivel = personagemAtivo?.nivel ?? 1;
  const patamar = nivel >= 8 ? 4 : nivel >= 5 ? 3 : nivel >= 2 ? 2 : 1;
  const [oculto, setOculto] = useState(false);

  return (
    <div className="space-y-2">
      <div className="bg-bg-inset rounded-xl border border-border px-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gold/80 font-medium">Estado</span>
          <button
            type="button"
            onClick={() => setOculto(o => !o)}
            className={`text-sm border rounded-lg px-3 py-1.5 transition-colors font-medium ${
              oculto
                ? 'border-arcane/50 bg-arcane/10 text-arcane-glow'
                : 'border-border text-ink-muted hover:border-arcane/40'
            }`}
          >
            {oculto ? 'Oculto' : 'Descoberto'}
          </button>
        </div>
        <p className="text-2xs text-ink-dim leading-relaxed">
          Oculto: permanece sem ser visto mesmo que o oponente se mova para onde o veria, desde que fique parado. Descobre-se ao atacar ou se mover na linha de visão.
        </p>
      </div>
      <div className="bg-bg-inset rounded-xl border border-border px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-2xs text-ink-muted">Ataque Furtivo</span>
          <span className="text-arcane-glow font-display text-base">{patamar}d6</span>
        </div>
        <p className="text-2xs text-ink-dim mt-1 leading-relaxed">
          Some ao dano ao atacar Oculto ou com aliado corpo a corpo ao alvo.
        </p>
      </div>
    </div>
  );
}

// ─── Tracker: Mago ────────────────────────────────────────────────────────────

function TrackerMago() {
  const [padroes, setPadroes] = useState(7);

  return (
    <div className="bg-bg-inset rounded-xl border border-border px-3 py-3">
      <div className="text-xs text-gold/80 font-medium mb-1">Padrões Estranhos</div>
      <p className="text-2xs text-ink-dim mb-3 leading-relaxed">
        Escolha um número. Quando o Dado do Destino mostrar este número, receba 1 Esperança ou recupere 1 PF.
      </p>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPadroes(p => Math.max(1, p - 1))}
          className="w-10 h-10 rounded-xl border border-border text-ink-muted text-lg hover:border-arcane/50 hover:text-arcane-glow transition-colors"
        >−</button>
        <div className="text-center flex-1">
          <div className="font-display text-4xl text-arcane-glow">{padroes}</div>
          <div className="text-2xs text-ink-dim">número de gatilho</div>
        </div>
        <button
          type="button"
          onClick={() => setPadroes(p => Math.min(12, p + 1))}
          className="w-10 h-10 rounded-xl border border-border text-ink-muted text-lg hover:border-arcane/50 hover:text-arcane-glow transition-colors"
        >+</button>
      </div>
      <p className="text-2xs text-ink-dim mt-2 leading-relaxed text-center">
        Pode alterar o número durante descanso longo.
      </p>
    </div>
  );
}

// ─── Tracker: Patrulheiro ─────────────────────────────────────────────────────

function TrackerPatrulheiro() {
  const { personagemAtivo, atualizarFn } = useApp();
  if (!personagemAtivo) return null;

  const [marcaPresa, setMarcaPresaLocal] = useState('');
  const comp = personagemAtivo.companheiro;

  function marcaPF(n: number) {
    if (!personagemAtivo?.companheiro) return;
    atualizarFn(p => ({
      ...p,
      companheiro: p.companheiro
        ? {
            ...p.companheiro,
            pf_marcados: Math.max(0, Math.min(p.companheiro.pf_max, p.companheiro.pf_marcados + n)),
          }
        : undefined,
    }));
  }

  return (
    <div className="space-y-3">
      {/* Marca da Presa */}
      <div className="bg-bg-inset rounded-xl border border-border px-3 py-3">
        <div className="text-xs text-gold/80 font-medium mb-2">Marca da Presa</div>
        <input
          className="input text-sm"
          value={marcaPresa}
          onChange={e => setMarcaPresaLocal(e.target.value)}
          placeholder="Nome/descrição da presa marcada..."
        />
        <p className="text-2xs text-ink-dim mt-1.5 leading-relaxed">
          Gaste 1 Esperança e ataque. Em acerto: você sabe sua direção; alvo marca 1 PF ao sofrer dano; ao errar, pode encerrar a Marca para rerolar os Dados de Dualidade.
        </p>
      </div>

      {/* Companheiro */}
      {comp ? (
        <div className="rounded-xl border border-arcane/30 bg-arcane/5 px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-display text-sm text-arcane-glow">{comp.nome}</span>
              <span className="text-2xs text-ink-dim ml-1.5">{comp.tipo}</span>
            </div>
            <span className="text-2xs text-arcane-glow border border-arcane/30 rounded px-2 py-0.5">
              {comp.dado_dano} · {comp.alcance}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xs text-ink-muted">PF:</span>
            <span className="font-display text-base text-arcane-glow">
              {comp.pf_max - comp.pf_marcados}
            </span>
            <span className="text-2xs text-ink-dim">/ {comp.pf_max}</span>
            <div className="flex gap-1 ml-auto">
              <button
                type="button"
                onClick={() => marcaPF(-1)}
                className="w-7 h-7 rounded-lg border border-border text-ink-muted text-sm hover:border-gold/50 transition-colors"
              >−</button>
              <button
                type="button"
                onClick={() => marcaPF(1)}
                className="w-7 h-7 rounded-lg border border-border text-ink-muted text-sm hover:border-blood/50 transition-colors"
              >+</button>
            </div>
          </div>
          {comp.treinamentos.length > 0 && (
            <div className="text-2xs text-ink-dim border-t border-border/50 pt-2">
              Treinamentos: {comp.treinamentos.join(', ')}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-bg-inset rounded-xl border border-dashed border-border/50 px-3 py-3 text-center">
          <p className="text-2xs text-ink-dim">
            Companheiro Animal não configurado. Edite a ficha para adicionar.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tracker: Serafim ─────────────────────────────────────────────────────────

function TrackerSerafim() {
  const { personagemAtivo } = useApp();
  if (!personagemAtivo) return null;

  // Atributo de conjuração: Força (ambas as subclasses — Portador Divino e Sentinela Alada)
  const forcaAtrib = personagemAtivo.atributos.Força;
  const forca = (forcaAtrib?.valor ?? 0) + (forcaAtrib?.bonus ?? 0);
  const qtdDados = Math.max(1, forca);
  const [usados, setUsados] = useState(0);

  const disponiveis = Math.max(0, qtdDados - usados);

  return (
    <div className="bg-bg-inset rounded-xl border border-border px-3 py-3">
      <div className="text-xs text-gold/80 font-medium mb-3">Dados de Oração</div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-center flex-1">
          <div className="font-display text-3xl text-gold-glow">{disponiveis}</div>
          <div className="text-2xs text-ink-dim">de {qtdDados} d4</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUsados(u => Math.min(qtdDados, u + 1))}
            disabled={disponiveis === 0}
            className="w-10 h-10 rounded-xl border border-blood/40 text-blood-glow text-lg hover:bg-blood/10 transition-colors disabled:opacity-30"
          >−</button>
          <button
            type="button"
            onClick={() => setUsados(0)}
            className="w-10 h-10 rounded-xl border border-gold/40 text-gold text-xs hover:bg-gold/10 transition-colors"
          >↺</button>
        </div>
      </div>
      <p className="text-2xs text-ink-dim leading-relaxed">
        Força {forca >= 0 ? '+' : ''}{forca} → {qtdDados} dado{qtdDados !== 1 ? 's' : ''} de d4 no início de cada sessão.
        Gaste para reduzir dano, somar a rolagem ou ganhar Esperança igual ao resultado.
      </p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PainelTrackerClasse() {
  const { personagemAtivo } = useApp();
  if (!personagemAtivo?.classe) return null;

  const classe = personagemAtivo.classe as NomeClasse;

  switch (classe) {
    case 'Bardo':       return <TrackerBardo />;
    case 'Druida':      return <TrackerDruida />;
    case 'Feiticeiro':  return <TrackerFeiticeiro />;
    case 'Guardião':    return <TrackerGuardiao />;
    case 'Guerreiro':   return <TrackerGuerreiro />;
    case 'Ladino':      return <TrackerLadino />;
    case 'Mago':        return <TrackerMago />;
    case 'Patrulheiro': return <TrackerPatrulheiro />;
    case 'Serafim':     return <TrackerSerafim />;
    default:            return null;
  }
}
