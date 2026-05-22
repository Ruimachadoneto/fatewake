import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { importarPersonagemArquivo, exportarTodos } from '@/lib/storage';
import { Plus, Upload, Download, User, Sparkles } from 'lucide-react';

const CLASSE_ACCENT: Record<string, string> = {
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

export function TelaSelecionarPersonagem() {
  const { personagens, criarNovo, selecionar, carregarTudo } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File) => {
    try {
      const p = await importarPersonagemArquivo(file);
      carregarTudo();
      selecionar(p.id);
    } catch (err) {
      alert(`Erro ao importar: ${err instanceof Error ? err.message : 'desconhecido'}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-3xl mx-auto px-4 py-8"
    >
      {/* Hero */}
      <div className="text-center mb-10 relative">
        <div className="absolute inset-0 bg-starfield opacity-30 pointer-events-none" />
        <div className="relative">
          <Sparkles className="mx-auto text-gold icon-glow-gold mb-4 animate-float" size={40} strokeWidth={1.2} />
          <h2 className="font-display text-3xl text-gold tracking-[0.3em] mb-2">
            SUA SAGA
          </h2>
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            <span className="text-2xs text-ink-muted tracking-widest uppercase">começa aqui</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </div>
        </div>
      </div>

      {personagens.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="card-ornate text-center py-14"
        >
          <div className="w-16 h-16 rounded-full bg-bg-inset border border-gold/20 flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: '0 0 24px rgba(212,175,55,0.1)' }}>
            <User className="text-gold/40" size={28} strokeWidth={1.2} />
          </div>
          <p className="font-display text-base text-ink-muted tracking-wider mb-1">
            Nenhum herói despertou ainda
          </p>
          <p className="text-2xs text-ink-dim mb-8">Sua primeira lenda começa agora.</p>
          <button onClick={criarNovo} className="btn-primary px-8">
            <Plus size={16} />
            Despertar primeiro herói
          </button>
        </motion.div>
      ) : (
        <>
          <div className="space-y-2.5 mb-6">
            {personagens.map((p, index) => {
              const accent = CLASSE_ACCENT[p.classe ?? ''] ?? '212, 175, 55';
              const pvPct = p.pv_max > 0 ? (p.pv_max - p.pv_marcados) / p.pv_max : 1;
              const temClasse = Boolean(p.classe);

              return (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07, type: 'spring', stiffness: 340, damping: 30 }}
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
                  onClick={() => selecionar(p.id)}
                  className="w-full card text-left group relative overflow-hidden"
                  style={{ borderLeftWidth: '3px', borderLeftColor: `rgba(${accent}, 0.65)` }}
                >
                  {/* Hover glow da classe */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                    style={{ background: `radial-gradient(ellipse 80% 60% at 0% 50%, rgba(${accent}, 0.08) 0%, transparent 70%)` }} />

                  <div className="relative flex items-center gap-3">
                    {/* Avatar / Retrato */}
                    <div className="w-11 h-[54px] rounded-xl flex-shrink-0 overflow-hidden border"
                      style={{
                        borderColor: `rgba(${accent}, 0.40)`,
                        boxShadow: `0 0 14px rgba(${accent}, 0.18)`,
                      }}>
                      {p.foto_url ? (
                        <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: `radial-gradient(circle, rgba(${accent}, 0.15) 0%, rgba(${accent}, 0.04) 100%)` }}>
                          <User size={18} style={{ color: `rgb(${accent})`, opacity: 0.65 }} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-base text-ink group-hover:text-gold transition-colors truncate tracking-wider">
                        {p.nome || 'Sem nome'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {temClasse ? (
                          <>
                            <span className="text-2xs font-medium" style={{ color: `rgb(${accent})` }}>
                              {p.classe}
                            </span>
                            <span className="text-border/50 text-2xs">·</span>
                            <span className="text-2xs text-ink-dim">Nível {p.nivel}</span>
                            {p.ancestralidade && (
                              <>
                                <span className="text-border/50 text-2xs">·</span>
                                <span className="text-2xs text-ink-dim truncate">{p.ancestralidade}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-2xs text-ink-dim italic">Em criação</span>
                        )}
                      </div>

                      {/* Mini HP bar */}
                      {temClasse && (
                        <div className="h-0.5 bg-bg-inset rounded-full mt-2 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              width: `${pvPct * 100}%`,
                              background: pvPct > 0.6 ? 'rgb(var(--tw-color-hp-soft, 255 138 138))' : pvPct > 0.3 ? 'rgb(220,150,70)' : 'rgb(157,31,45)',
                              backgroundColor: pvPct > 0.6 ? '#ff8a8a' : pvPct > 0.3 ? '#dc9646' : '#9d1f2d',
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Stats direita */}
                    {temClasse && (
                      <div className="text-right flex-shrink-0 space-y-1">
                        <div
                          className="font-display text-2xs px-1.5 py-0.5 rounded-md text-right"
                          style={{ color: `rgb(${accent})`, background: `rgba(${accent}, 0.1)` }}
                        >
                          Nv.{p.nivel}
                        </div>
                        <div className="font-display text-sm text-hp-soft">
                          {p.pv_max - p.pv_marcados}
                          <span className="text-ink-dim/60 text-xs">/{p.pv_max}</span>
                        </div>
                        <div className="flex gap-0.5 justify-end">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <span key={i} className={`text-xs leading-none ${i < (p.esperanca ?? 0) ? 'text-gold' : 'text-border/40'}`}>
                              {i < (p.esperanca ?? 0) ? '◆' : '◇'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: personagens.length * 0.07 + 0.1 }}
            onClick={criarNovo}
            className="btn-primary w-full mb-3"
          >
            <Plus size={16} />
            Despertar novo personagem
          </motion.button>
        </>
      )}

      {/* Backup/Import */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <div className="section-header">
          <span className="section-title">Persistência</span>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
          <button onClick={() => inputRef.current?.click()} className="btn flex-1 text-2xs">
            <Upload size={14} />
            Importar JSON
          </button>
          <button
            onClick={exportarTodos}
            disabled={personagens.length === 0}
            className="btn flex-1 text-2xs"
          >
            <Download size={14} />
            Backup completo
          </button>
        </div>
        <p className="text-2xs text-ink-dim mt-3 text-center tracking-wider">
          Seus personagens vivem no dispositivo. Exporte para preservá-los.
        </p>
      </motion.div>
    </motion.div>
  );
}
