import { useState } from 'react';
import { motion } from 'framer-motion';
import { gerarUUID } from '@/lib/uuid';
import { supabase } from '@/lib/supabase';
import { useSessao } from '@/store/sessao';
import { useApp } from '@/store/app';
import { Users, ArrowLeft, Sparkles } from 'lucide-react';
import type { Campanha, PersonagemSala } from '@/types/supabase';

export function TelaEntrarSala() {
  const { entrarSalaJogador, setTela } = useSessao();
  const { personagemAtivo } = useApp();
  const [codigo, setCodigo] = useState('');
  const [nomeJogador, setNomeJogador] = useState('');
  const [campanha, setCampanhaLocal] = useState<Campanha | null>(null);
  const [etapa, setEtapa] = useState<'codigo' | 'confirmar'>('codigo');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function buscarSala(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('codigo_sala', codigo.toUpperCase().trim())
        .single();
      if (error || !data) throw new Error('Sala não encontrada. Verifique o código.');
      if (!(data as Campanha).sessao_ativa) throw new Error('Esta sala ainda não está aberta pelo mestre.');
      setCampanhaLocal(data as Campanha);
      setNomeJogador(personagemAtivo?.nome || '');
      setEtapa('confirmar');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao buscar sala');
    } finally {
      setCarregando(false);
    }
  }

  async function entrarNaSala(e: React.FormEvent) {
    e.preventDefault();
    if (!campanha || !nomeJogador.trim()) return;
    setErro('');
    setCarregando(true);
    try {
      const novoToken = gerarUUID();
      const tokenExistente = sessionStorage.getItem('fw_session_token');
      let slotExistenteId: string | null = null;

      // 1. Tenta reusar slot pelo token da sessão atual
      if (tokenExistente) {
        const { data } = await supabase
          .from('personagens_sala')
          .select()
          .eq('campanha_id', campanha.id)
          .eq('session_token', tokenExistente)
          .maybeSingle();
        slotExistenteId = (data as PersonagemSala | null)?.id ?? null;
      }

      // 2. Fallback: slot offline com mesmo nome (jogador que fechou a aba)
      if (!slotExistenteId) {
        const { data } = await supabase
          .from('personagens_sala')
          .select()
          .eq('campanha_id', campanha.id)
          .eq('nome_jogador', nomeJogador.trim())
          .eq('online', false)
          .maybeSingle();
        slotExistenteId = (data as PersonagemSala | null)?.id ?? null;
      }

      const camposBase = {
        nome_jogador: nomeJogador.trim(),
        session_token: novoToken,
        personagem: (personagemAtivo ?? {}) as unknown,
        online: true,
      } as never;

      let resultData: PersonagemSala;
      if (slotExistenteId) {
        // Reativa slot existente com novo token
        const { data, error } = await supabase
          .from('personagens_sala')
          .update(camposBase)
          .eq('id', slotExistenteId)
          .select()
          .single();
        if (error) throw error;
        resultData = data as PersonagemSala;
      } else {
        // Novo jogador
        const { data, error } = await supabase
          .from('personagens_sala')
          .insert({
            campanha_id: campanha.id,
            nome_jogador: nomeJogador.trim(),
            session_token: novoToken,
            personagem: (personagemAtivo ?? {}) as unknown,
            online: true,
          } as never)
          .select()
          .single();
        if (error) throw error;
        resultData = data as PersonagemSala;
      }

      sessionStorage.setItem('fw_session_token', novoToken);
      entrarSalaJogador(campanha, resultData.id, novoToken);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar na sala');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <button type="button"
        onClick={() => etapa === 'confirmar' ? setEtapa('codigo') : setTela('idle')}
        className="fixed top-4 left-4 flex items-center gap-1.5 text-2xs text-ink-muted hover:text-gold
          transition-colors z-10 px-2.5 py-1.5 rounded-lg hover:bg-gold/8 border border-transparent hover:border-gold/20">
        <ArrowLeft size={13} />
        Voltar
      </button>

      {/* Atmospheric header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center mx-auto mb-3"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.02) 100%)', boxShadow: '0 0 24px rgba(212,175,55,0.12)' }}>
          <Users size={22} className="text-gold/70" strokeWidth={1.3} />
        </div>
        <h2 className="font-display text-xl text-gold tracking-[0.3em]">
          {etapa === 'codigo' ? 'ENTRAR NA MESA' : 'CONFIRMAR ENTRADA'}
        </h2>
        <p className="text-2xs text-ink-dim tracking-widest mt-1">
          {etapa === 'codigo' ? 'O destino aguarda.' : 'Sua saga começa aqui.'}
        </p>
      </motion.div>

      <motion.div
        key={etapa}
        initial={{ opacity: 0, x: etapa === 'confirmar' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="card-ornate w-full max-w-sm"
      >
        {etapa === 'codigo' ? (
          <form onSubmit={buscarSala} className="space-y-4">
            <div>
              <label className="label">Código da sala</label>
              <input
                className="input font-mono text-center text-2xl tracking-[0.5em] uppercase"
                style={{ letterSpacing: '0.5em' }}
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                placeholder="AB3K7F"
                maxLength={6}
                autoFocus
              />
              <p className="text-2xs text-ink-dim mt-2 text-center">
                Peça o código ao mestre da mesa.
              </p>
            </div>
            {erro && (
              <p className="text-2xs text-blood-glow bg-blood/8 border border-blood/20 rounded-lg px-3 py-2">
                {erro}
              </p>
            )}
            <button
              type="submit"
              disabled={codigo.length < 6 || carregando}
              className="btn-primary w-full disabled:opacity-40"
            >
              <Sparkles size={14} />
              {carregando ? 'Buscando...' : 'Entrar na saga'}
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/30" />
              <span className="text-2xs text-ink-dim">ou</span>
              <div className="flex-1 h-px bg-border/30" />
            </div>
            <button
              type="button"
              onClick={() => setTela('auth')}
              className="btn w-full text-xs"
            >
              Sou o Mestre — fazer login
            </button>
          </form>
        ) : (
          <form onSubmit={entrarNaSala} className="space-y-4">
            {/* Sala encontrada */}
            <div className="rounded-xl border border-gold/25 px-4 py-3"
              style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 100%)' }}>
              <p className="text-2xs text-gold/60 uppercase tracking-widest mb-1">Sala encontrada</p>
              <p className="font-display text-lg text-gold leading-tight">{campanha?.nome}</p>
              {campanha?.sistema && <p className="text-2xs text-ink-dim mt-0.5">{campanha.sistema}</p>}
            </div>

            <div>
              <label className="label">Seu nome na mesa</label>
              <input
                className="input"
                value={nomeJogador}
                onChange={e => setNomeJogador(e.target.value)}
                placeholder="Como o mestre vai te ver"
                autoFocus
              />
            </div>

            {personagemAtivo && (
              <div className="flex items-center gap-2.5 bg-bg-inset rounded-xl border border-border/60 px-3 py-2.5">
                <div className="w-7 h-7 rounded-full border border-gold/25 flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(212,175,55,0.08)' }}>
                  <Users size={13} className="text-gold/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gold font-display truncate">{personagemAtivo.nome || '(sem nome)'}</p>
                  <p className="text-2xs text-ink-dim">{personagemAtivo.classe || 'Em criação'}</p>
                </div>
              </div>
            )}
            {!personagemAtivo && (
              <p className="text-2xs text-ink-muted bg-bg-inset rounded-xl border border-border/40 px-3 py-2.5">
                Sem personagem ativo — você entrará na sala sem ficha.
              </p>
            )}

            {erro && (
              <p className="text-2xs text-blood-glow bg-blood/8 border border-blood/20 rounded-lg px-3 py-2">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={!nomeJogador.trim() || carregando}
              className="btn-primary w-full disabled:opacity-40"
            >
              <Sparkles size={14} />
              {carregando ? 'Entrando...' : 'Entrar na mesa'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
