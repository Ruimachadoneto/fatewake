import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSessao } from '@/store/sessao';
import { TelaAuthGM } from './TelaAuthGM';
import { TelaCampanhas } from './TelaCampanhas';
import { TelaEntrarSala } from './TelaEntrarSala';
import { TelaSalaGM } from './TelaSalaGM';
import { TelaSalaJogador } from './TelaSalaJogador';

export function TelaSessao() {
  const { tela, setGm, gmId } = useSessao();

  // Recuperar sessão do GM ao entrar no fluxo de sessão
  useEffect(() => {
    if (tela === 'idle') return;
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user && !gmId) {
        setGm(user.email ?? '', user.id);
      }
    });
  }, [tela === 'idle']);

  if (tela === 'idle') return null; // não deveria chegar aqui, mas seguro
  if (tela === 'auth') return <TelaAuthGM />;
  if (tela === 'entrar-sala') return <TelaEntrarSala />;
  if (tela === 'campanhas') return <TelaCampanhas />;
  if (tela === 'sala-gm') return <TelaSalaGM />;
  if (tela === 'sala-jogador') return <TelaSalaJogador />;

  return null;
}

export { TelaSalaJogador };
