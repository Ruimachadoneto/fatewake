import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useSessao } from '@/store/sessao';
import type { Campanha } from '@/types/supabase';
import { Plus, Users, LogOut, BookOpen } from 'lucide-react';

function gerarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function TelaCampanhas() {
  const { gmId, gmEmail, setCampanha, setTela, logout } = useSessao();
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [criando, setCriando] = useState(false);
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!gmId) return;
    supabase
      .from('campanhas')
      .select('*')
      .eq('gm_id', gmId)
      .order('atualizado_em', { ascending: false })
      .then(({ data }) => {
        if (data) setCampanhas(data as Campanha[]);
        setCarregando(false);
      });
  }, [gmId]);

  async function criarCampanha(e: React.FormEvent) {
    e.preventDefault();
    if (!gmId || !nomeCampanha.trim()) return;
    setErro('');
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .insert({
          gm_id: gmId,
          nome: nomeCampanha.trim(),
          sistema: 'daggerheart',
          codigo_sala: gerarCodigo(),
          sessao_ativa: false,
          medo: 0,
          notas_gm: '',
        } as never)
        .select()
        .single();
      if (error) throw error;
      setCampanhas(prev => [data as Campanha, ...prev]);
      setNomeCampanha('');
      setCriando(false);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar campanha');
    }
  }

  async function abrirSessao(c: Campanha) {
    await supabase.from('campanhas').update({ sessao_ativa: true } as never).eq('id', c.id);
    setCampanha({ ...c, sessao_ativa: true });
    setTela('sala-gm');
  }

  async function fazerLogout() {
    await supabase.auth.signOut();
    logout();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-gold/20 flex items-center justify-center flex-shrink-0"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 100%)' }}>
            <BookOpen size={16} className="text-gold/70" strokeWidth={1.4} />
          </div>
          <div>
            <h1 className="font-display text-lg text-gold tracking-wider leading-tight">Minhas Campanhas</h1>
            <p className="text-2xs text-ink-dim mt-0.5">{gmEmail}</p>
          </div>
        </div>
        <button type="button" onClick={fazerLogout} className="btn text-xs gap-1.5">
          <LogOut size={13} />
          Sair
        </button>
      </motion.div>

      {/* Criar nova campanha */}
      {criando ? (
        <motion.form
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={criarCampanha}
          className="card-ornate mb-4 space-y-3"
        >
          <div className="section-header mb-2">
            <span className="section-title">Nova Campanha</span>
          </div>
          <div>
            <label className="label">Nome da campanha</label>
            <input
              className="input"
              value={nomeCampanha}
              onChange={e => setNomeCampanha(e.target.value)}
              placeholder='Ex: "O Surto Selvagem"'
              autoFocus
            />
          </div>
          {erro && (
            <p className="text-2xs text-blood-glow bg-blood/8 border border-blood/20 rounded-lg px-3 py-2">{erro}</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setCriando(false)} className="btn flex-1">Cancelar</button>
            <button type="submit" disabled={!nomeCampanha.trim()} className="btn-primary flex-1 disabled:opacity-40">
              Criar
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          type="button"
          onClick={() => setCriando(true)}
          className="btn-primary w-full mb-4 gap-2"
        >
          <Plus size={15} />
          Nova Campanha
        </motion.button>
      )}

      {/* Lista de campanhas */}
      {carregando ? (
        <div className="flex items-center justify-center py-12 gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse" />
          <p className="text-ink-dim text-sm">Carregando...</p>
        </div>
      ) : campanhas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="card text-center py-10"
        >
          <BookOpen size={28} className="text-ink-dim mx-auto mb-3" strokeWidth={1.2} />
          <p className="text-ink-muted text-sm mb-1">Nenhuma campanha ainda.</p>
          <p className="text-2xs text-ink-dim">Crie sua primeira campanha para começar.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {campanhas.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 340, damping: 30 }}
              className="card-ornate"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base text-gold tracking-wide truncate">{c.nome}</div>
                  <div className="flex items-center flex-wrap gap-2 mt-1.5">
                    <span className="text-2xs text-ink-dim uppercase tracking-widest">{c.sistema}</span>
                    <span className="text-2xs font-mono text-gold/60 bg-bg-inset border border-gold/15 rounded px-2 py-0.5">
                      {c.codigo_sala}
                    </span>
                    {c.sessao_ativa && (
                      <span className="text-2xs text-green-400 border border-green-400/30 rounded px-2 py-0.5 animate-pulse">
                        ao vivo
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => abrirSessao(c)}
                  className="btn-primary text-xs gap-1.5 flex-shrink-0"
                >
                  <Users size={13} />
                  Abrir Sessão
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
