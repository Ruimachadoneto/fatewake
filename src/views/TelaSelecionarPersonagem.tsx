import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/store/app';
import { importarPersonagemArquivo, exportarTodos } from '@/lib/storage';
import { parsearFichaPDF } from '@/lib/pdf-import';
import { TelaRevisarImportacao } from '@/views/TelaRevisarImportacao';
import { Plus, Upload, Download, User, Sparkles, FileText, Loader2, Trash2 } from 'lucide-react';
import type { FichaPDF } from '@/lib/pdf-import';
import type { Personagem } from '@/types/personagem';

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
  const { personagens, criarNovo, selecionar, importarPersonagem, remover, carregarTudo } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [fichaPDF, setFichaPDF] = useState<FichaPDF | null>(null);
  const [carregandoPDF, setCarregandoPDF] = useState(false);
  const [erroPDF, setErroPDF] = useState('');
  const [confirmandoDelete, setConfirmandoDelete] = useState<string | null>(null);

  const handleImport = async (file: File) => {
    try {
      const p = await importarPersonagemArquivo(file);
      carregarTudo();
      selecionar(p.id);
    } catch (err) {
      alert(`Erro ao importar: ${err instanceof Error ? err.message : 'desconhecido'}`);
    }
  };

  const handleImportPDF = async (file: File) => {
    setErroPDF('');
    setCarregandoPDF(true);
    try {
      const ficha = await parsearFichaPDF(file);
      setFichaPDF(ficha);
    } catch (err) {
      setErroPDF(err instanceof Error ? err.message : 'Erro ao ler o PDF');
    } finally {
      setCarregandoPDF(false);
    }
  };

  const handleConfirmarImportacao = (p: Personagem) => {
    importarPersonagem(p);
    setFichaPDF(null);
  };

  return (
    <>
    <AnimatePresence>
      {fichaPDF && (
        <TelaRevisarImportacao
          fichaPDF={fichaPDF}
          onConfirmar={handleConfirmarImportacao}
          onCancelar={() => setFichaPDF(null)}
        />
      )}
    </AnimatePresence>

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

              const confirmando = confirmandoDelete === p.id;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07, type: 'spring', stiffness: 340, damping: 30 }}
                  className="card text-left group relative overflow-hidden"
                  style={{ borderLeftWidth: '3px', borderLeftColor: `rgba(${accent}, 0.65)`, padding: 0 }}
                >
                  {/* Hover glow da classe */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                    style={{ background: `radial-gradient(ellipse 80% 60% at 0% 50%, rgba(${accent}, 0.08) 0%, transparent 70%)` }} />

                  {/* Área clicável principal */}
                  <button
                    type="button"
                    onClick={() => { setConfirmandoDelete(null); selecionar(p.id); }}
                    className="w-full text-left relative p-3 pr-10"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-[54px] rounded-xl flex-shrink-0 overflow-hidden border"
                        style={{ borderColor: `rgba(${accent}, 0.40)`, boxShadow: `0 0 14px rgba(${accent}, 0.18)` }}>
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
                              <span className="text-2xs font-medium" style={{ color: `rgb(${accent})` }}>{p.classe}</span>
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
                        {temClasse && (
                          <div className="h-0.5 bg-bg-inset rounded-full mt-2 overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{
                                width: `${pvPct * 100}%`,
                                backgroundColor: pvPct > 0.6 ? '#ff8a8a' : pvPct > 0.3 ? '#dc9646' : '#9d1f2d',
                              }} />
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      {temClasse && (
                        <div className="text-right flex-shrink-0 space-y-1">
                          <div className="font-display text-2xs px-1.5 py-0.5 rounded-md"
                            style={{ color: `rgb(${accent})`, background: `rgba(${accent}, 0.1)` }}>
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
                  </button>

                  {/* Botão deletar */}
                  <div className="absolute top-0 right-0 h-full flex items-center pr-2">
                    <AnimatePresence mode="wait">
                      {confirmando ? (
                        <motion.button
                          key="confirmar"
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={e => { e.stopPropagation(); remover(p.id); setConfirmandoDelete(null); }}
                          className="text-2xs text-blood-glow bg-blood/15 border border-blood/30 rounded-lg px-2 py-1 hover:bg-blood/25 transition-colors"
                        >
                          Confirmar
                        </motion.button>
                      ) : (
                        <motion.button
                          key="lixeira"
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={e => { e.stopPropagation(); setConfirmandoDelete(p.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-dim hover:text-blood-glow hover:bg-blood/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
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
        {/* Importar PDF */}
        <div className="section-header">
          <span className="section-title">Importar Ficha</span>
        </div>
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleImportPDF(f);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => { setErroPDF(''); pdfInputRef.current?.click(); }}
          disabled={carregandoPDF}
          className="btn-primary w-full mb-2 disabled:opacity-50"
        >
          {carregandoPDF
            ? <><Loader2 size={14} className="animate-spin" />Lendo PDF...</>
            : <><FileText size={14} />Importar ficha via PDF</>
          }
        </button>
        {erroPDF && (
          <p className="text-2xs text-blood-glow bg-blood/8 border border-blood/20 rounded-lg px-3 py-2 mb-2">
            {erroPDF}
          </p>
        )}

        {/* Backup JSON */}
        <div className="section-header mt-4">
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
    </>
  );
}
