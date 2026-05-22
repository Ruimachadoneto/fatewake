import { motion, AnimatePresence } from 'framer-motion';
import { gerarUUID } from '@/lib/uuid';
import { useApp } from '@/store/app';
import { COMUNIDADES, getNomesComunidades } from '@/data';

export function PassoComunidade() {
  const { personagemAtivo, atualizarFn } = useApp();
  if (!personagemAtivo) return null;

  const nomes = getNomesComunidades();
  const sel = personagemAtivo.comunidade;

  function selecionarComunidade(chave: string) {
    atualizarFn(prev => {
      let inventario = [...prev.inventario];

      // Remove item da comunidade anterior
      const dadosAntiga = prev.comunidade ? COMUNIDADES[prev.comunidade] : null;
      if (dadosAntiga?.item_inventario) {
        inventario = inventario.filter(item => item.nome !== dadosAntiga.item_inventario);
      }

      // Adiciona item da nova comunidade
      const dadosNova = COMUNIDADES[chave];
      if (dadosNova?.item_inventario && !inventario.some(item => item.nome === dadosNova.item_inventario)) {
        inventario = [...inventario, {
          id: gerarUUID(),
          nome: dadosNova.item_inventario,
          tipo: 'manual' as const,
          timestamp: Date.now(),
        }];
      }

      return { ...prev, comunidade: chave, inventario };
    });
  }

  return (
    <div className="space-y-3">
      <div className="section-header">
        <span className="section-title">Onde Cresceu</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {nomes.map((chave, i) => {
          const ativo = sel === chave;
          return (
            <motion.button
              key={chave}
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 380, damping: 30 }}
              onClick={() => selecionarComunidade(chave)}
              className={`relative rounded-xl border p-3 text-left transition-all ${
                ativo
                  ? 'border-gold/60 bg-gold/8 shadow-[0_0_16px_rgba(212,175,55,0.1)]'
                  : 'border-border/60 bg-bg-card hover:border-gold/30 hover:bg-gold/4'
              }`}
            >
              <div className={`font-display text-sm tracking-wider leading-tight ${ativo ? 'text-gold' : 'text-ink'}`}>
                {chave}
              </div>
              {ativo && <span className="absolute top-2 right-2.5 text-gold text-xs">✓</span>}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {sel && (() => {
          const d = COMUNIDADES[sel];
          return (
            <motion.div
              key={sel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="card-ornate space-y-2"
            >
              <div className="section-header mb-2">
                <span className="section-title">{sel}</span>
              </div>
              <p className="text-2xs text-ink-muted leading-relaxed">{d.descricao}</p>
              <div className="bg-bg-inset rounded-lg px-3 py-2 border border-border/40">
                <span className="text-2xs text-gold/80 font-medium">{d.habilidade.nome}: </span>
                <span className="text-2xs text-ink-muted leading-relaxed">{d.habilidade.descricao}</span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
