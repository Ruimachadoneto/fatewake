// Store Zustand: gerencia personagem ativo + estado da UI
// Persistência: chama storage automaticamente a cada mutação

import { create } from 'zustand';
import { gerarUUID } from '@/lib/uuid';
import { storage } from '@/lib/storage';
import { novoPersonagem } from '@/types/personagem';
import type { Personagem } from '@/types/personagem';

type Modo = 'criacao' | 'jogo' | 'levelup' | 'saga';

interface AppStore {
  // Estado
  personagens: Personagem[];
  personagemAtivo: Personagem | null;
  modo: Modo;

  // Ações
  carregarTudo: () => void;
  criarNovo: () => void;
  importarPersonagem: (p: Personagem) => void;
  selecionar: (id: string) => void;
  atualizar: (patch: Partial<Personagem>) => void;
  atualizarFn: (fn: (p: Personagem) => Personagem) => void;
  remover: (id: string) => void;
  setModo: (modo: Modo) => void;
}

export const useApp = create<AppStore>((set, get) => ({
  personagens: [],
  personagemAtivo: null,
  modo: 'criacao',

  carregarTudo: () => {
    const personagens = storage.listarPersonagens();
    const estado = storage.obterEstadoApp();
    const ativo = estado.personagem_ativo_id
      ? personagens.find(p => p.id === estado.personagem_ativo_id) ?? null
      : null;
    set({
      personagens,
      personagemAtivo: ativo,
      modo: estado.modo
    });
  },

  criarNovo: () => {
    const id = gerarUUID();
    const p = novoPersonagem(id);
    storage.salvarPersonagem(p);
    storage.salvarEstadoApp({ personagem_ativo_id: id, modo: 'criacao' });
    set({
      personagens: [p, ...get().personagens],
      personagemAtivo: p,
      modo: 'criacao'
    });
  },

  importarPersonagem: (p) => {
    storage.salvarPersonagem(p);
    storage.salvarEstadoApp({ personagem_ativo_id: p.id, modo: 'jogo' });
    set({
      personagens: [p, ...get().personagens],
      personagemAtivo: p,
      modo: 'jogo',
    });
  },

  selecionar: (id) => {
    if (!id) {
      storage.salvarEstadoApp({ personagem_ativo_id: null, modo: get().modo });
      set({ personagemAtivo: null });
      return;
    }
    const p = storage.obterPersonagem(id);
    if (!p) return;
    storage.salvarEstadoApp({ personagem_ativo_id: id, modo: get().modo });
    set({ personagemAtivo: p });
  },

  atualizar: (patch) => {
    const atual = get().personagemAtivo;
    if (!atual) return;
    const atualizado = { ...atual, ...patch };
    storage.salvarPersonagem(atualizado);
    set({
      personagemAtivo: atualizado,
      personagens: get().personagens.map(p => (p.id === atualizado.id ? atualizado : p))
    });
  },

  atualizarFn: (fn) => {
    const atual = get().personagemAtivo;
    if (!atual) return;
    const atualizado = fn(atual);
    storage.salvarPersonagem(atualizado);
    set({
      personagemAtivo: atualizado,
      personagens: get().personagens.map(p => (p.id === atualizado.id ? atualizado : p))
    });
  },

  remover: (id) => {
    storage.removerPersonagem(id);
    const personagens = get().personagens.filter(p => p.id !== id);
    const ativo = get().personagemAtivo;
    set({
      personagens,
      personagemAtivo: ativo?.id === id ? null : ativo
    });
  },

  setModo: (modo) => {
    storage.salvarEstadoApp({
      personagem_ativo_id: get().personagemAtivo?.id ?? null,
      modo
    });
    set({ modo });
  }
}));
