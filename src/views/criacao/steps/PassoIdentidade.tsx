import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, User } from 'lucide-react';
import { useApp } from '@/store/app';

const PRONOMES = ['ele/dele', 'ela/dela', 'elu/delu', 'they/them'];

const NOMES_SUGERIDOS: Record<string, string[]> = {
  'Bardo':        ['Lyra', 'Calix', 'Vesper', 'Idris', 'Tavi', 'Seren'],
  'Druida':       ['Briar', 'Sylvan', 'Fern', 'Yew', 'Hazel', 'Thorn'],
  'Feiticeiro':   ['Zara', 'Draven', 'Sable', 'Kael', 'Nyx', 'Vex'],
  'Guardião':     ['Aldric', 'Brynn', 'Gareth', 'Thora', 'Sevan', 'Dax'],
  'Guerreiro':    ['Bram', 'Kira', 'Dag', 'Sura', 'Holt', 'Redd'],
  'Ladino':       ['Jinx', 'Cinder', 'Rook', 'Dusk', 'Nyx', 'Vex'],
  'Mago':         ['Aelindra', 'Zephyr', 'Arcen', 'Lyss', 'Voran', 'Elion'],
  'Patrulheiro':  ['Wren', 'Heath', 'Finn', 'Cora', 'Reed', 'Lark'],
  'Serafim':      ['Caelum', 'Selene', 'Ardis', 'Lumen', 'Isiel', 'Vera'],
};
const NOMES_GENERICOS = ['Rowan', 'Ash', 'Soren', 'Lyra', 'Vex', 'Cael', 'Thorn', 'Mira', 'Drake', 'Sage'];

function comprimirImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 400;
      const ratio = Math.min(MAX / img.width, MAX / img.height);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function PassoIdentidade() {
  const { personagemAtivo, atualizar } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  if (!personagemAtivo) return null;

  const nomesSugeridos = personagemAtivo.classe
    ? (NOMES_SUGERIDOS[personagemAtivo.classe] ?? NOMES_GENERICOS)
    : NOMES_GENERICOS;

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await comprimirImagem(file);
    atualizar({ foto_url: base64 });
  }

  return (
    <div className="space-y-4">
      <div className="section-header">
        <span className="section-title">Identidade do Herói</span>
      </div>

      {/* Retrato */}
      <div className="card-ornate">
        <label className="label-gold mb-3 block">Retrato</label>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div
              className="w-24 h-28 rounded-xl overflow-hidden border-2 border-gold/40 bg-bg-inset cursor-pointer"
              style={{ boxShadow: '0 0 20px rgba(212,175,55,0.1)' }}
              onClick={() => inputRef.current?.click()}
            >
              {personagemAtivo.foto_url ? (
                <img
                  src={personagemAtivo.foto_url}
                  alt="Retrato"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <User size={28} className="text-ink-dim/30" />
                  <span className="text-[9px] text-ink-dim/40 uppercase tracking-widest">Retrato</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gold/90 hover:bg-gold flex items-center justify-center shadow-lg transition-colors"
            >
              <Camera size={14} className="text-bg" />
            </button>
          </div>

          <div className="text-xs text-ink-muted leading-relaxed">
            <p>Toque no retrato para escolher uma imagem do dispositivo.</p>
            <p className="text-ink-dim mt-1">A imagem será redimensionada automaticamente.</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFoto}
        />
        {personagemAtivo.foto_url && (
          <button
            type="button"
            onClick={() => atualizar({ foto_url: undefined })}
            className="mt-3 text-2xs text-blood-glow/60 hover:text-blood-glow transition-colors"
          >
            Remover retrato
          </button>
        )}
      </div>

      <div className="card-ornate space-y-4">
        <div>
          <label className="label-gold">Nome verdadeiro</label>
          <input
            className="input font-display text-lg tracking-wider text-center"
            value={personagemAtivo.nome}
            onChange={e => atualizar({ nome: e.target.value })}
            placeholder="Como será conhecido?"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {nomesSugeridos.map((nome, i) => (
              <motion.button
                key={nome}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 400, damping: 28 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => atualizar({ nome })}
                className={`text-2xs px-2.5 py-1 rounded-lg border transition-colors ${
                  personagemAtivo.nome === nome
                    ? 'border-gold/60 bg-gold/10 text-gold'
                    : 'border-gold/30 text-gold/70 hover:border-gold/60 hover:text-gold hover:bg-gold/5'
                }`}
              >
                {nome}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Gênero / apresentação</label>
          <input
            className="input"
            value={personagemAtivo.genero}
            onChange={e => atualizar({ genero: e.target.value })}
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="label">Pronomes</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {PRONOMES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => atualizar({ pronomes: p })}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  personagemAtivo.pronomes === p
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-border text-ink-muted hover:border-gold/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            className="input"
            value={personagemAtivo.pronomes}
            onChange={e => atualizar({ pronomes: e.target.value })}
            placeholder="ou escreva livremente"
          />
        </div>
      </div>
    </div>
  );
}
