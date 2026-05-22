import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, Package, FlaskConical, Download, Upload } from 'lucide-react';
import { useCampanha } from '@/store/campanha';
import type { SessaoCampanha } from '@/store/campanha';

function SessaoCard({ sessao, ativa, onClick }: { sessao: SessaoCampanha; ativa: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
        ativa
          ? 'border-gold/40 bg-gold/08 text-gold'
          : 'border-border/40 text-ink-muted hover:text-ink hover:border-border/60'
      }`}>
      <div className="font-display text-xs tracking-wider truncate">{sessao.titulo}</div>
      <div className="text-[9px] text-ink-dim mt-0.5">{sessao.data}</div>
    </button>
  );
}

function LootItem({ item, onRemover }: {
  item: import('@/store/campanha').LootRegistrado;
  onRemover: () => void;
}) {
  const isConsumivel = item.tipo === 'consumivel';
  const cor = isConsumivel ? '100, 200, 160' : '212, 175, 55';
  return (
    <div className="flex items-start gap-2 rounded-lg border px-2.5 py-2 group"
      style={{ borderColor: `rgba(${cor}, 0.2)`, background: `rgba(${cor}, 0.04)` }}>
      <div className="mt-0.5 flex-shrink-0" style={{ color: `rgba(${cor}, 0.7)` }}>
        {isConsumivel ? <FlaskConical size={12} /> : <Package size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xs font-medium text-ink truncate">{item.nome}</div>
        <div className="text-[9px] text-ink-muted leading-relaxed mt-0.5 line-clamp-2">{item.descricao}</div>
        {item.personagem && (
          <div className="text-[9px] text-ink-dim mt-0.5">→ {item.personagem}</div>
        )}
      </div>
      <button type="button" onClick={onRemover}
        className="text-ink-dim hover:text-blood-glow opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5">
        <Trash2 size={11} />
      </button>
    </div>
  );
}

function EditorSessao({ sessao }: { sessao: SessaoCampanha }) {
  const { updateSessao, removerLoot } = useCampanha();
  const [lootExpandido, setLootExpandido] = useState(true);

  return (
    <div className="space-y-3">
      <div className="card space-y-3">
        <input
          value={sessao.titulo}
          onChange={e => updateSessao(sessao.numero, { titulo: e.target.value })}
          className="w-full bg-transparent font-display text-base tracking-wider text-gold border-b border-gold/20 pb-1
            focus:outline-none focus:border-gold/50 placeholder-ink-dim"
          placeholder="Título da sessão"
        />
        <div className="flex items-center gap-2">
          <label className="text-2xs text-ink-muted flex-shrink-0">Data</label>
          <input
            type="date"
            value={sessao.data}
            onChange={e => updateSessao(sessao.numero, { data: e.target.value })}
            className="bg-transparent text-2xs text-ink border border-border/30 rounded px-2 py-1
              focus:outline-none focus:border-gold/40"
          />
        </div>
        <div>
          <div className="text-2xs text-ink-muted mb-1.5">Notas</div>
          <textarea
            value={sessao.notas}
            onChange={e => updateSessao(sessao.numero, { notas: e.target.value })}
            rows={5}
            className="w-full bg-bg-inset text-xs text-ink rounded-lg border border-border/30 px-3 py-2
              focus:outline-none focus:border-gold/30 resize-none placeholder-ink-dim leading-relaxed"
            placeholder="O que aconteceu nesta sessão..."
          />
        </div>
      </div>

      {sessao.loot.length > 0 && (
        <div className="card">
          <button type="button"
            onClick={() => setLootExpandido(e => !e)}
            className="flex items-center justify-between w-full text-left">
            <span className="font-display text-xs tracking-wider text-gold">
              Loot Gerado ({sessao.loot.length})
            </span>
            {lootExpandido ? <ChevronUp size={13} className="text-ink-muted" /> : <ChevronDown size={13} className="text-ink-muted" />}
          </button>

          <AnimatePresence>
            {lootExpandido && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden">
                <div className="mt-3 space-y-1.5">
                  {sessao.loot.map(item => (
                    <LootItem key={item.id} item={item}
                      onRemover={() => removerLoot(sessao.numero, item.id)} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function BibliotecaGM() {
  const { sessoes, sessaoAtual, setSessaoAtual, addSessao, importarSessoes } = useCampanha();
  const sessao = sessoes.find(s => s.numero === sessaoAtual) ?? sessoes[0];
  const importRef = useRef<HTMLInputElement>(null);

  function exportar() {
    const data = JSON.stringify({ sessoes, exportadoEm: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fatewake-biblioteca-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (importRef.current) importRef.current.value = '';
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const novas: SessaoCampanha[] = parsed.sessoes ?? parsed;
        if (Array.isArray(novas) && novas.length > 0) importarSessoes(novas);
      } catch { /* arquivo inválido, ignorar */ }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xs tracking-wider text-ink-muted uppercase">Sessões</h3>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={exportar}
            className="flex items-center gap-1 text-2xs text-ink-muted hover:text-gold border border-border/40
              hover:border-gold/30 px-2 py-1 rounded-lg transition-all">
            <Download size={10} />
            Export
          </button>
          <button type="button" onClick={() => importRef.current?.click()}
            className="flex items-center gap-1 text-2xs text-ink-muted hover:text-gold border border-border/40
              hover:border-gold/30 px-2 py-1 rounded-lg transition-all">
            <Upload size={10} />
            Import
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button type="button" onClick={addSessao}
            className="flex items-center gap-1 text-2xs text-ink-muted hover:text-gold border border-border/40
              hover:border-gold/30 px-2 py-1 rounded-lg transition-all">
            <Plus size={11} />
            Nova sessão
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {sessoes.map(s => (
          <div key={s.numero} className="flex-shrink-0 w-28">
            <SessaoCard sessao={s} ativa={s.numero === sessaoAtual}
              onClick={() => setSessaoAtual(s.numero)} />
          </div>
        ))}
      </div>

      {sessao && (
        <AnimatePresence mode="wait">
          <motion.div key={sessao.numero}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}>
            <EditorSessao sessao={sessao} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
