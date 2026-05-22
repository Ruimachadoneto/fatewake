import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useSessao } from '@/store/sessao';
import { Shield, ArrowLeft } from 'lucide-react';

export function TelaAuthGM() {
  const { setGm, setTela } = useSessao();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (modo === 'registro') {
        const { data, error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
        if (data.user) setGm(data.user.email ?? email, data.user.id);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        if (data.user) setGm(data.user.email ?? email, data.user.id);
      }
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <button type="button" onClick={() => setTela('idle')}
        className="fixed top-4 left-4 flex items-center gap-1.5 text-2xs text-ink-muted hover:text-gold
          transition-colors z-10 px-2.5 py-1.5 rounded-lg hover:bg-gold/8 border border-transparent hover:border-gold/20">
        <ArrowLeft size={13} />
        Voltar
      </button>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="w-12 h-12 rounded-full border border-arcane/30 flex items-center justify-center mx-auto mb-3"
          style={{ background: 'radial-gradient(circle, rgba(123,63,160,0.2) 0%, rgba(123,63,160,0.04) 100%)', boxShadow: '0 0 24px rgba(123,63,160,0.2)' }}>
          <Shield size={22} className="text-arcane-glow/80" strokeWidth={1.3} />
        </div>
        <h2 className="font-display text-xl text-gold tracking-[0.3em]">MESTRE</h2>
        <p className="text-2xs text-ink-dim tracking-widest mt-1">Acesso à sala de sessão</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="card-ornate w-full max-w-sm"
      >
        <div className="flex gap-1 mb-5 bg-bg-inset rounded-xl p-1">
          {(['login', 'registro'] as const).map(m => (
            <button key={m} type="button" onClick={() => setModo(m)}
              className={`flex-1 text-xs rounded-lg py-2 transition-all ${
                modo === m
                  ? 'bg-bg-card text-gold border border-gold/30 shadow-[0_0_8px_rgba(212,175,55,0.1)]'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {m === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form onSubmit={submeter} className="space-y-3">
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" value={senha}
              onChange={e => setSenha(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>

          {erro && (
            <p className="text-2xs text-blood-glow bg-blood/8 border border-blood/20 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando} className="btn-primary w-full mt-2 disabled:opacity-50">
            {carregando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="border-t border-border/30 mt-5 pt-4 text-center">
          <p className="text-2xs text-ink-dim mb-3">Você é jogador?</p>
          <button type="button" onClick={() => setTela('entrar-sala')} className="btn w-full">
            Entrar em uma sala
          </button>
        </div>
      </motion.div>
    </div>
  );
}
