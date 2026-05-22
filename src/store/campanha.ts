import { create } from 'zustand';
import { gerarUUID } from '@/lib/uuid';

export interface LootRegistrado {
  id: string;
  tipo: 'item' | 'consumivel';
  nome: string;
  descricao: string;
  personagem?: string;
  timestamp: number;
}

export interface SessaoCampanha {
  numero: number;
  titulo: string;
  data: string;
  notas: string;
  loot: LootRegistrado[];
}

interface CampanhaStore {
  sessoes: SessaoCampanha[];
  sessaoAtual: number;

  setSessaoAtual: (numero: number) => void;
  addSessao: () => void;
  updateSessao: (numero: number, patch: Partial<Pick<SessaoCampanha, 'titulo' | 'data' | 'notas'>>) => void;
  adicionarLoot: (numero: number, loot: Omit<LootRegistrado, 'id' | 'timestamp'>) => void;
  removerLoot: (sessaoNumero: number, lootId: string) => void;
  importarSessoes: (novas: SessaoCampanha[]) => void;
}

const STORAGE_KEY = 'fatewake_campanha_v1';

function carregar(): { sessoes: SessaoCampanha[]; sessaoAtual: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    sessoes: [{ numero: 1, titulo: 'Sessão 1', data: new Date().toISOString().split('T')[0], notas: '', loot: [] }],
    sessaoAtual: 1,
  };
}

function salvar(state: { sessoes: SessaoCampanha[]; sessaoAtual: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessoes: state.sessoes, sessaoAtual: state.sessaoAtual }));
}

const inicial = carregar();

export const useCampanha = create<CampanhaStore>((set, get) => ({
  sessoes: inicial.sessoes,
  sessaoAtual: inicial.sessaoAtual,

  setSessaoAtual: (numero) => {
    set({ sessaoAtual: numero });
    salvar({ sessoes: get().sessoes, sessaoAtual: numero });
  },

  addSessao: () => {
    const sessoes = get().sessoes;
    const proximo = Math.max(...sessoes.map(s => s.numero)) + 1;
    const nova: SessaoCampanha = {
      numero: proximo,
      titulo: `Sessão ${proximo}`,
      data: new Date().toISOString().split('T')[0],
      notas: '',
      loot: [],
    };
    const novas = [...sessoes, nova];
    set({ sessoes: novas, sessaoAtual: proximo });
    salvar({ sessoes: novas, sessaoAtual: proximo });
  },

  updateSessao: (numero, patch) => {
    const sessoes = get().sessoes.map(s =>
      s.numero === numero ? { ...s, ...patch } : s
    );
    set({ sessoes });
    salvar({ sessoes, sessaoAtual: get().sessaoAtual });
  },

  adicionarLoot: (numero, loot) => {
    const item: LootRegistrado = {
      ...loot,
      id: gerarUUID(),
      timestamp: Date.now(),
    };
    const sessoes = get().sessoes.map(s =>
      s.numero === numero ? { ...s, loot: [item, ...s.loot] } : s
    );
    set({ sessoes });
    salvar({ sessoes, sessaoAtual: get().sessaoAtual });
  },

  removerLoot: (sessaoNumero, lootId) => {
    const sessoes = get().sessoes.map(s =>
      s.numero === sessaoNumero
        ? { ...s, loot: s.loot.filter(l => l.id !== lootId) }
        : s
    );
    set({ sessoes });
    salvar({ sessoes, sessaoAtual: get().sessaoAtual });
  },

  importarSessoes: (novas) => {
    const atual = novas[0]?.numero ?? 1;
    set({ sessoes: novas, sessaoAtual: atual });
    salvar({ sessoes: novas, sessaoAtual: atual });
  },
}));
