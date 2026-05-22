import { useApp } from '@/store/app';
import { CLASSES } from '@/data';
import type { NomeClasse, Experiencia } from '@/types/personagem';

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

export function PassoOrigemVinculos() {
  const { personagemAtivo, atualizar } = useApp();
  if (!personagemAtivo) return null;

  const p = personagemAtivo;
  const classeData = CLASSES[p.classe as NomeClasse];
  const perguntas = classeData?.perguntas_origem ?? [];
  const vinculoTemplates = classeData?.vinculos ?? [];
  const descPessoal = classeData?.descricao_pessoal;
  const accent = CLASSE_ACCENT[p.classe ?? ''] ?? '212, 175, 55';

  const exps: Experiencia[] = p.experiencias.length >= 2
    ? p.experiencias
    : [
        p.experiencias[0] ?? { nome: '', mod: 2 },
        p.experiencias[1] ?? { nome: '', mod: 2 },
      ];

  function setExp(i: number, nome: string) {
    const novos = [...exps];
    novos[i] = { nome, mod: 2 };
    atualizar({ experiencias: novos.slice(0, 2) });
  }

  function setOrigem(i: number, valor: string) {
    const novo = [...p.respostas_origem];
    while (novo.length <= i) novo.push('');
    novo[i] = valor;
    atualizar({ respostas_origem: novo });
  }

  function setVinculo(i: number, valor: string) {
    const novo = [...p.vinculos];
    while (novo.length <= i) novo.push('');
    novo[i] = valor;
    atualizar({ vinculos: novo });
  }

  const resumo = [
    ['Classe', p.classe || '—'],
    ['Subclasse', p.subclasse || '—'],
    ['Ancestralidade', p.ancestralidade || '—'],
    ['Comunidade', p.comunidade || '—'],
    ['PV / PF / PA', `${p.pv_max} / ${p.pf_max} / ${p.pa_max}`],
    ['Evasão', String(p.evasao)],
    ['Limiares', `${p.limiares[0]} / ${p.limiares[1]}`],
    ['Cartas', `${p.cartas_mao.length}/2`],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="section-header">
        <span className="section-title">Origens & Vínculos</span>
      </div>

      {/* Experiências */}
      <div className="card space-y-3">
        <div className="text-xs text-gold uppercase tracking-wider">Experiências (+2)</div>
        <p className="text-2xs text-ink-muted">
          Duas áreas de expertise do seu passado. Ex: "navegação", "ervas medicinais", "xadrez".
        </p>
        {[0, 1].map(i => (
          <div key={i}>
            <label className="label">Experiência {i + 1}</label>
            <input
              className="input"
              value={exps[i]?.nome ?? ''}
              onChange={e => setExp(i, e.target.value)}
              placeholder="Descreva sua área de expertise..."
            />
          </div>
        ))}
      </div>

      {/* Perguntas de origem */}
      {perguntas.length > 0 && (
        <div className="card space-y-3">
          <div className="text-xs uppercase tracking-wider" style={{ color: `rgba(${accent}, 0.9)` }}>
            Sua História
          </div>
          {perguntas.map((pergunta, i) => (
            <div key={i}>
              <label className="label text-ink-muted text-2xs leading-relaxed">{pergunta}</label>
              <textarea
                className="input min-h-[56px] resize-none mt-1"
                value={p.respostas_origem[i] ?? ''}
                onChange={e => setOrigem(i, e.target.value)}
                placeholder="Opcional..."
              />
            </div>
          ))}
        </div>
      )}

      {/* Vínculos */}
      {vinculoTemplates.length > 0 && (
        <div className="card space-y-3">
          <div className="text-xs text-gold uppercase tracking-wider">Vínculos com o Grupo</div>
          {vinculoTemplates.map((template, i) => (
            <div key={i}>
              <label className="label text-ink-muted text-2xs leading-relaxed">{template}</label>
              <input
                className="input mt-1"
                value={p.vinculos[i] ?? ''}
                onChange={e => setVinculo(i, e.target.value)}
                placeholder="Nome do aliado ou resposta..."
              />
            </div>
          ))}
        </div>
      )}

      {/* Aparência */}
      <div className="card space-y-3">
        <label className="label">Aparência & Descrição</label>

        {descPessoal && (
          <div className="space-y-2">
            <div className="text-2xs text-ink-dim">Toque para adicionar à descrição:</div>
            <div>
              <div className="text-2xs text-ink-muted uppercase tracking-widest mb-1.5">Roupas</div>
              <div className="flex flex-wrap gap-1.5">
                {descPessoal.roupas.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => atualizar({
                      descricao_aparencia: p.descricao_aparencia
                        ? `${p.descricao_aparencia}, roupas ${r}`
                        : `Roupas ${r}`
                    })}
                    className="text-2xs bg-bg-inset border border-border rounded-lg px-2.5 py-1 text-ink-muted hover:border-gold/40 hover:text-ink transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-2xs text-ink-muted uppercase tracking-widest mb-1.5">Postura</div>
              <div className="flex flex-wrap gap-1.5">
                {descPessoal.postura.map(pos => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => atualizar({
                      descricao_aparencia: p.descricao_aparencia
                        ? `${p.descricao_aparencia}, postura de ${pos}`
                        : `Postura de ${pos}`
                    })}
                    className="text-2xs bg-bg-inset border border-border rounded-lg px-2.5 py-1 text-ink-muted hover:border-gold/40 hover:text-ink transition-colors"
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <textarea
          className="input min-h-[72px] resize-none"
          value={p.descricao_aparencia}
          onChange={e => atualizar({ descricao_aparencia: e.target.value })}
          placeholder="Como seu herói aparenta? Que impressão causa?"
        />
      </div>

      {/* Resumo */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: `rgba(${accent}, 0.3)` }}
      >
        <div
          className="px-4 py-2.5 text-xs uppercase tracking-wider font-medium"
          style={{ background: `rgba(${accent}, 0.1)`, color: `rgb(${accent})` }}
        >
          Resumo do Herói
        </div>
        <div className="bg-bg-inset px-4 py-3">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-2xs">
            {resumo.map(([label, value]) => [
              <dt key={`dt-${label}`} className="text-ink-muted">{label}</dt>,
              <dd key={`dd-${label}`} className={label === 'Cartas' && p.cartas_mao.length === 2 ? 'text-gold' : 'text-ink'}>
                {value}
              </dd>,
            ])}
          </dl>
        </div>
      </div>
    </div>
  );
}
