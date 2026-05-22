import { create } from 'zustand';
import type { Campanha, PersonagemSala } from '@/types/supabase';

export const SESSAO_SALVA_KEY = 'fatewake_sessao_v1';

interface SessaoState {
  // Auth do GM
  gmEmail: string | null;
  gmId: string | null;

  // Campanha ativa
  campanha: Campanha | null;

  // Sala de sessão
  // Para o GM: lista de todos os personagens na sala
  personagensSala: PersonagemSala[];
  // Para o jogador: seu slot na sala
  meuSlotId: string | null;
  meuSessionToken: string | null;

  // Modo de exibição
  tela: 'idle' | 'auth' | 'campanhas' | 'sala-gm' | 'sala-jogador' | 'entrar-sala';

  inicializar: () => void;
  setGm: (email: string, id: string) => void;
  setTela: (tela: SessaoState['tela']) => void;
  setCampanha: (c: Campanha | null) => void;
  setPersonagensSala: (lista: PersonagemSala[]) => void;
  upsertPersonagemSala: (p: PersonagemSala) => void;
  removerPersonagemSala: (id: string) => void;
  setMeuSlot: (id: string, token: string) => void;
  entrarSalaJogador: (campanha: Campanha, slotId: string, token: string) => void;
  logout: () => void;
}

export const useSessao = create<SessaoState>((set) => ({
  gmEmail: null,
  gmId: null,
  campanha: null,
  personagensSala: [],
  meuSlotId: null,
  meuSessionToken: null,
  tela: 'idle',

  inicializar: () => {
    try {
      const raw = localStorage.getItem(SESSAO_SALVA_KEY);
      if (!raw) return;
      const { campanha, meuSlotId, meuSessionToken } = JSON.parse(raw) as {
        campanha: Campanha;
        meuSlotId: string;
        meuSessionToken: string;
      };
      if (campanha?.id && meuSlotId && meuSessionToken) {
        set({ campanha, meuSlotId, meuSessionToken, tela: 'sala-jogador' });
      }
    } catch {
      localStorage.removeItem(SESSAO_SALVA_KEY);
    }
  },

  setGm: (email, id) => set({ gmEmail: email, gmId: id, tela: 'campanhas' }),
  setTela: (tela) => set({ tela }),
  setCampanha: (campanha) => set({ campanha }),
  setPersonagensSala: (lista) => set({ personagensSala: lista }),
  upsertPersonagemSala: (p) =>
    set(s => ({
      personagensSala: s.personagensSala.some(x => x.id === p.id)
        ? s.personagensSala.map(x => x.id === p.id ? p : x)
        : [...s.personagensSala, p],
    })),
  removerPersonagemSala: (id) =>
    set(s => ({ personagensSala: s.personagensSala.filter(x => x.id !== id) })),
  setMeuSlot: (id, token) => set({ meuSlotId: id, meuSessionToken: token }),

  entrarSalaJogador: (campanha, slotId, token) => {
    try {
      localStorage.setItem(SESSAO_SALVA_KEY, JSON.stringify({ campanha, meuSlotId: slotId, meuSessionToken: token }));
    } catch {}
    set({ campanha, meuSlotId: slotId, meuSessionToken: token, tela: 'sala-jogador' });
  },

  logout: () => {
    localStorage.removeItem(SESSAO_SALVA_KEY);
    set({
      gmEmail: null, gmId: null, campanha: null,
      personagensSala: [], meuSlotId: null, meuSessionToken: null,
      tela: 'idle',
    });
  },
}));
