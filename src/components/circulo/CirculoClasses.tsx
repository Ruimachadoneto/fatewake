import { CLASSES } from '@/data';
import { DOMINIO_CORES } from '@/data/dominiosCores';
import type { NomeClasse } from '@/types/personagem';

// ─── Geometria ────────────────────────────────────────────────────────────────
const CX = 220;
const CY = 220;
const DOMAIN_R    = 162;   // anel externo — nós dos domínios
const CLASS_R     = 105;   // anel interno — labels das classes
const STAR_OUTER  = 34;
const STAR_INNER  = 14;
const DOM_NODE_R  = 20;    // raio do círculo do domínio
const DOM_LABEL_R = 188;   // texto do domínio, fora do nó

function rad(deg: number) { return (deg * Math.PI) / 180; }
function pos(ang: number, r: number) {
  return { x: CX + r * Math.cos(rad(ang)), y: CY + r * Math.sin(rad(ang)) };
}
function starPath(cx: number, cy: number, ro: number, ri: number, pts: number) {
  const step = Math.PI / pts;
  return Array.from({ length: 2 * pts }, (_, i) => {
    const r = i % 2 === 0 ? ro : ri;
    const a = i * step - Math.PI / 2;
    return `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ') + ' Z';
}

// ─── Dados ────────────────────────────────────────────────────────────────────
// Ciclo hamiltoniano perfeito: CADA classe está exatamente entre seus 2 domínios.
// Derivado matematicamente dos dados reais de classes.json.
//
// Classes no anel interno (-90°, -50°, -10°, 30°, 70°, 110°, 150°, 190°, 230°)
// Domínios no anel externo (250°, -70°, -30°, 10°, 50°, 90°, 130°, 170°, 210°)
//
// Verificação: Feiticeiro(-90°) entre Arcano(250°) e Meia-noite(-70°) ✓
//              Ladino(-50°) entre Meia-noite(-70°) e Graça(-30°) ✓  etc.

const CLASSES_RING = (([
  { nome: 'Feiticeiro',  accent: '120, 80, 200',  ang: -90  },
  { nome: 'Ladino',      accent: '100, 160, 160', ang: -50  },
  { nome: 'Bardo',       accent: '196, 100, 196', ang: -10  },
  { nome: 'Mago',        accent: '60, 180, 210',  ang:  30  },
  { nome: 'Serafim',     accent: '220, 180, 80',  ang:  70  },
  { nome: 'Guardião',    accent: '80, 140, 210',  ang: 110  },
  { nome: 'Guerreiro',   accent: '200, 100, 60',  ang: 150  },
  { nome: 'Patrulheiro', accent: '100, 170, 80',  ang: 190  },
  { nome: 'Druida',      accent: '80, 180, 100',  ang: 230  },
] as { nome: NomeClasse; accent: string; ang: number }[])).map(c => ({
  ...c,
  dominios: CLASSES[c.nome].dominios as [string, string],
}));

const DOMAINS_RING: { nome: string; ang: number }[] = [
  { nome: 'Arcano',      ang: 250  },
  { nome: 'Meia-noite',  ang: -70  },
  { nome: 'Graça',       ang: -30  },
  { nome: 'Códice',      ang:  10  },
  { nome: 'Esplendor',   ang:  50  },
  { nome: 'Valor',       ang:  90  },
  { nome: 'Lâmina',     ang: 130  },
  { nome: 'Falange',     ang: 170  },
  { nome: 'Sabedoria',   ang: 210  },
];

// ─── Componente ───────────────────────────────────────────────────────────────
interface Props {
  selecionado: NomeClasse | '';
  onSelecionar: (nome: NomeClasse) => void;
}

export function CirculoClasses({ selecionado, onSelecionar }: Props) {
  const domByName = Object.fromEntries(DOMAINS_RING.map(d => [d.nome, d]));
  const selNode   = CLASSES_RING.find(c => c.nome === selecionado);
  const selDoms   = selNode
    ? selNode.dominios.map(n => domByName[n]).filter(Boolean)
    : [];

  return (
    <svg
      viewBox="0 0 440 440"
      overflow="visible"
      className="w-full select-none"
      style={{ display: 'block' }}
      aria-label="Círculo das Classes"
    >
      <defs>
        {CLASSES_RING.map(c => (
          <radialGradient key={c.nome} id={`gc-${c.nome}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={`rgb(${c.accent})`} stopOpacity="0.5" />
            <stop offset="100%" stopColor={`rgb(${c.accent})`} stopOpacity="0"   />
          </radialGradient>
        ))}
        {DOMAINS_RING.map(d => {
          const cor = DOMINIO_CORES[d.nome] ?? '212,175,55';
          return (
            <radialGradient key={d.nome} id={`gd-${d.nome}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={`rgb(${cor})`} stopOpacity="0.55" />
              <stop offset="100%" stopColor={`rgb(${cor})`} stopOpacity="0"    />
            </radialGradient>
          );
        })}
        <radialGradient id="gc-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgb(212,175,55)" stopOpacity="0.2"  />
          <stop offset="100%" stopColor="rgb(212,175,55)" stopOpacity="0"    />
        </radialGradient>
      </defs>

      {/* Anéis decorativos */}
      <circle cx={CX} cy={CY} r={DOMAIN_R + DOM_NODE_R + 12}
        fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={DOMAIN_R - DOM_NODE_R - 7}
        fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.6" />

      {/* Raios decorativos: domínio → estrela */}
      {DOMAINS_RING.map(d => {
        const outer = pos(d.ang, DOMAIN_R - DOM_NODE_R - 9);
        const inner = pos(d.ang, STAR_OUTER + 7);
        const isActive = selDoms.some(sd => sd.nome === d.nome);
        return (
          <line key={`ray-${d.nome}`}
            x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
            stroke={`rgba(212,175,55,${isActive ? 0.28 : 0.09})`}
            strokeWidth={isActive ? 1.2 : 0.7}
            style={{ transition: 'all 0.25s ease' }}
          />
        );
      })}

      {/* Linhas de conexão classe → seus 2 domínios */}
      {selNode && selDoms.map((dom, i) => {
        const cp = pos(selNode.ang, CLASS_R + 16);
        const dp = pos(dom.ang, DOMAIN_R - DOM_NODE_R - 3);
        return (
          <line key={i}
            x1={cp.x} y1={cp.y} x2={dp.x} y2={dp.y}
            stroke={`rgba(${selNode.accent}, 0.55)`}
            strokeWidth="1.8"
            strokeDasharray="5 3"
          />
        );
      })}

      {/* Brilho central */}
      <circle cx={CX} cy={CY} r={STAR_OUTER + 28} fill="url(#gc-center)" />

      {/* Estrela de 9 pontas */}
      <path d={starPath(CX, CY, STAR_OUTER, STAR_INNER, 9)}
        fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.35)"
        strokeWidth="0.9" strokeLinejoin="round" />
      <path d={starPath(CX, CY, STAR_OUTER * 0.55, STAR_INNER * 0.55, 9)}
        fill="rgba(212,175,55,0.13)" stroke="rgba(212,175,55,0.25)"
        strokeWidth="0.6" strokeLinejoin="round" />

      {/* ── Nós dos domínios (anel externo) ── */}
      {DOMAINS_RING.map(d => {
        const { x, y } = pos(d.ang, DOMAIN_R);
        const cor = DOMINIO_CORES[d.nome] ?? '212, 175, 55';
        const isActive = selDoms.some(sd => sd.nome === d.nome);
        const lp = pos(d.ang, DOM_LABEL_R);
        const cosA = Math.cos(rad(d.ang));
        const anchor = cosA > 0.22 ? 'start' : cosA < -0.22 ? 'end' : 'middle';
        const abrev = d.nome.substring(0, 3).toUpperCase();

        return (
          <g key={d.nome}>
            {isActive && (
              <circle cx={x} cy={y} r={DOM_NODE_R + 15}
                fill={`url(#gd-${d.nome})`} />
            )}
            <circle cx={x} cy={y} r={DOM_NODE_R}
              fill={isActive ? `rgba(${cor}, 0.25)` : `rgba(${cor}, 0.07)`}
              stroke={`rgba(${cor}, ${isActive ? 1 : 0.35})`}
              strokeWidth={isActive ? 1.8 : 1}
              style={{ transition: 'all 0.22s ease' }}
            />
            <text x={x} y={y + 0.5}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fontFamily="Cinzel, serif" fontWeight="700"
              fill={`rgba(${cor}, ${isActive ? 1 : 0.72})`}
              style={{ userSelect: 'none' }}
            >
              {abrev}
            </text>
            <text x={lp.x} y={lp.y}
              textAnchor={anchor} dominantBaseline="middle"
              fontSize="7" fontFamily="Cinzel, serif"
              fontWeight={isActive ? '700' : '400'}
              fill={`rgba(${cor}, ${isActive ? 1 : 0.5})`}
              letterSpacing="0.8"
              style={{ transition: 'all 0.22s ease', userSelect: 'none' }}
            >
              {d.nome.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* ── Labels das classes (anel interno, clicáveis) ── */}
      {CLASSES_RING.map(cls => {
        const { x, y } = pos(cls.ang, CLASS_R);
        const sel = selecionado === cls.nome;
        const PILL_W = 70;
        const PILL_H = 16;

        return (
          <g key={cls.nome}
            onClick={() => onSelecionar(cls.nome)}
            style={{ cursor: 'pointer' }}
            role="button" aria-pressed={sel} aria-label={cls.nome}
          >
            {sel && (
              <circle cx={x} cy={y} r={36} fill={`url(#gc-${cls.nome})`} />
            )}
            <rect
              x={x - PILL_W / 2} y={y - PILL_H / 2}
              width={PILL_W} height={PILL_H} rx="4"
              fill={sel ? `rgba(${cls.accent}, 0.2)` : `rgba(${cls.accent}, 0.07)`}
              stroke={`rgba(${cls.accent}, ${sel ? 0.75 : 0.25})`}
              strokeWidth="0.9"
              style={{ transition: 'all 0.22s ease' }}
            />
            <text x={x} y={y + 0.5}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fontFamily="Cinzel, serif"
              fontWeight={sel ? '700' : '500'}
              fill={`rgba(${cls.accent}, ${sel ? 1 : 0.82})`}
              letterSpacing="0.4"
              style={{ transition: 'all 0.22s ease', userSelect: 'none' }}
            >
              {cls.nome}
            </text>
          </g>
        );
      })}

      {/* Texto central */}
      <text x={CX} y={CY - 8}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="6.5" fontFamily="Cinzel, serif"
        fill="rgba(212,175,55,0.45)" letterSpacing="2"
        style={{ userSelect: 'none' }}
      >VOCAÇÃO</text>
      <text x={CX} y={CY + 7}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="5.2" fontFamily="Cinzel, serif"
        fill="rgba(212,175,55,0.28)" letterSpacing="1.2"
        style={{ userSelect: 'none' }}
      >DO HERÓI</text>
    </svg>
  );
}
