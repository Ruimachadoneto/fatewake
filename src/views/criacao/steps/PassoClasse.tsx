import { AnimatePresence, motion } from 'framer-motion';
import { gerarUUID } from '@/lib/uuid';
import { useApp } from '@/store/app';
import { CLASSES, EQUIPAMENTOS } from '@/data';
import { DOMINIO_CORES } from '@/data/dominiosCores';
import { CirculoClasses } from '@/components/circulo/CirculoClasses';
import type { NomeClasse, Arma, Armadura } from '@/types/personagem';
import type { DadosClasse } from '@/types/dados';

const CLASSE_ACCENT: Record<string, string> = {
  'Bardo':        '196, 100, 196',
  'Druida':       '80, 180, 100',
  'Feiticeiro':   '120, 80, 200',
  'Guardião':     '80, 140, 210',
  'Guerreiro':    '200, 100, 60',
  'Ladino':       '100, 160, 160',
  'Mago':         '60, 180, 210',
  'Patrulheiro':  '100, 170, 80',
  'Serafim':      '220, 180, 80',
};

function aplicarClasse(nome: NomeClasse, d: DadosClasse, atualizar: (p: object) => void) {
  const armaP: Arma = {
    nome: d.arma_primaria_sugerida.nome,
    atributo: d.arma_primaria_sugerida.atributo,
    alcance: d.arma_primaria_sugerida.alcance,
    dado: d.arma_primaria_sugerida.dado,
    tipo: d.arma_primaria_sugerida.tipo,
    empunhadura: d.arma_primaria_sugerida.empunhadura,
    habilidade: d.arma_primaria_sugerida.habilidade,
  };
  const armaS: Arma = d.arma_secundaria_sugerida
    ? {
        nome: d.arma_secundaria_sugerida.nome,
        atributo: d.arma_secundaria_sugerida.atributo,
        alcance: d.arma_secundaria_sugerida.alcance,
        dado: d.arma_secundaria_sugerida.dado,
        tipo: d.arma_secundaria_sugerida.tipo,
        empunhadura: d.arma_secundaria_sugerida.empunhadura,
        habilidade: d.arma_secundaria_sugerida.habilidade,
      }
    : { nome: '', atributo: '', alcance: '', dado: '', tipo: 'físico' };
  const armEvasaoBonus = EQUIPAMENTOS.armaduras.find(a => a.nome === d.armadura_sugerida.nome)?.evasao_bonus ?? 0;
  const arm: Armadura = {
    nome: d.armadura_sugerida.nome,
    limiares_base: d.armadura_sugerida.limiares_base,
    armadura_base: d.armadura_sugerida.armadura_base,
    tag: d.armadura_sugerida.tag,
    efeito: d.armadura_sugerida.efeito,
    evasao_bonus: armEvasaoBonus,
  };
  const inventarioBase = d.inventario_inicial.padrao
    .filter(Boolean)
    .map(nome => ({
      id: gerarUUID(),
      nome,
      tipo: 'item' as const,
      timestamp: Date.now(),
    }));

  atualizar({
    classe: nome,
    subclasse: '',
    cartas_mao: [],
    pv_max: d.pv_base,
    pf_max: d.pf_base,
    pa_max: d.armadura_sugerida.armadura_base,
    limiares: d.armadura_sugerida.limiares_base,
    evasao: d.evasao_base + armEvasaoBonus,
    armadura_ativa: arm,
    arma_principal: armaP,
    arma_secundaria: armaS,
    inventario: inventarioBase,
  });
}

export function PassoClasse() {
  const { personagemAtivo, atualizar } = useApp();
  if (!personagemAtivo) return null;

  const sel = personagemAtivo.classe as NomeClasse | '';
  const selDados = sel ? CLASSES[sel] : null;
  const accent = sel ? (CLASSE_ACCENT[sel] ?? '212, 175, 55') : '212, 175, 55';

  function handleSelecionar(nome: NomeClasse) {
    aplicarClasse(nome, CLASSES[nome], atualizar);
  }

  return (
    <div className="space-y-4">
      <div className="section-header">
        <span className="section-title">Sua Vocação</span>
      </div>

      <div style={{ maxWidth: '580px', margin: '0 auto' }}>
        <CirculoClasses selecionado={sel} onSelecionar={handleSelecionar} />
      </div>

      <AnimatePresence mode="wait">
        {selDados ? (
          <motion.div
            key={sel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border p-4 space-y-3 relative overflow-hidden"
            style={{
              borderColor: `rgba(${accent}, 0.4)`,
              background: `rgba(${accent}, 0.04)`,
              boxShadow: `0 0 24px rgba(${accent}, 0.08)`,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 70% 50% at 0% 0%, rgba(${accent}, 0.08) 0%, transparent 70%)`,
              }}
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-display text-lg tracking-wider" style={{ color: `rgb(${accent})` }}>
                    {sel}
                  </div>
                  <div className="text-2xs text-ink-muted leading-relaxed mt-0.5">
                    {selDados.tagline}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <div className="text-2xs text-hp-soft">PV {selDados.pv_base}</div>
                  <div className="text-2xs text-arcane-glow">PF {selDados.pf_base}</div>
                  <div className="text-2xs text-ink-muted">EV {selDados.evasao_base}</div>
                </div>
              </div>

              <div className="flex gap-1.5 flex-wrap mb-3">
                {selDados.dominios.map(dom => {
                  const dc = DOMINIO_CORES[dom] ?? accent;
                  return (
                    <span key={dom} className="text-2xs border rounded px-2 py-0.5"
                      style={{
                        color: `rgba(${dc}, 0.9)`,
                        borderColor: `rgba(${dc}, 0.35)`,
                        background: `rgba(${dc}, 0.08)`,
                      }}>
                      {dom}
                    </span>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                {selDados.habilidades_classe.map(h => (
                  <div key={h.nome} className="rounded-lg px-2.5 py-1.5 border"
                    style={{
                      background: `rgba(${accent}, 0.05)`,
                      borderColor: `rgba(${accent}, 0.15)`,
                    }}>
                    <span className="text-2xs font-medium" style={{ color: `rgba(${accent}, 0.9)` }}>
                      {h.nome}:{' '}
                    </span>
                    <span className="text-2xs text-ink-muted">{h.descricao}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <p className="text-center text-2xs text-ink-muted py-2">
            Toque em uma vocação para conhecê-la
          </p>
        )}
      </AnimatePresence>
    </div>
  );
}
