// Camada de persistência abstraída
// Hoje: localStorage. Futuro: Supabase ou outro backend.
// Mantém interface estável para que componentes nunca precisem mudar.

import { gerarUUID } from '@/lib/uuid';
import type { Personagem, ItemInventario } from '@/types/personagem';

const STORAGE_KEY = 'dh_companion_v1';
const APP_STATE_KEY = 'dh_companion_state_v1';

interface StorageShape {
  personagens: Record<string, Personagem>;
  ultima_atualizacao: string;
}

interface AppState {
  personagem_ativo_id: string | null;
  modo: 'criacao' | 'jogo' | 'levelup' | 'saga';
}

function migrarInventario(raw: unknown): ItemInventario[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] === 'string') {
    // formato antigo: string[] com 10 slots (alguns podem ser '')
    return (raw as string[])
      .filter(s => s.trim())
      .map(nome => ({ id: gerarUUID(), nome, tipo: 'manual' as const, timestamp: Date.now() }));
  }
  return raw as ItemInventario[];
}

// Garante compatibilidade de personagens salvos com versões antigas do schema
function migrarPersonagem(p: Personagem): Personagem {
  return {
    ...p,
    condicoes: p.condicoes ?? [],
    inventario_armas: p.inventario_armas ?? [],
    patamares_marcados: p.patamares_marcados ?? [],
    vinculos: p.vinculos ?? ['', '', ''],
    respostas_origem: p.respostas_origem ?? ['', '', ''],
    ouro: p.ouro ?? { punhados: 0, bolsas: 0, baus: 0 },
    cartas_reserva: p.cartas_reserva ?? [],
    notas: p.notas ?? '',
    inventario: migrarInventario(p.inventario as unknown),
  };
}

function ler(): StorageShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { personagens: {}, ultima_atualizacao: new Date().toISOString() };
    const data = JSON.parse(raw) as StorageShape;
    // Migrar cada personagem para garantir campos novos com defaults
    for (const id of Object.keys(data.personagens)) {
      data.personagens[id] = migrarPersonagem(data.personagens[id]);
    }
    return data;
  } catch {
    return { personagens: {}, ultima_atualizacao: new Date().toISOString() };
  }
}

function escrever(data: StorageShape): void {
  data.ultima_atualizacao = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const storage = {
  listarPersonagens(): Personagem[] {
    const data = ler();
    return Object.values(data.personagens).sort(
      (a, b) => new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime()
    );
  },

  obterPersonagem(id: string): Personagem | null {
    const data = ler();
    return data.personagens[id] ?? null;
  },

  salvarPersonagem(p: Personagem): void {
    const data = ler();
    p.atualizado_em = new Date().toISOString();
    data.personagens[p.id] = p;
    escrever(data);
  },

  removerPersonagem(id: string): void {
    const data = ler();
    delete data.personagens[id];
    escrever(data);
  },

  obterEstadoApp(): AppState {
    try {
      const raw = localStorage.getItem(APP_STATE_KEY);
      if (raw) return JSON.parse(raw) as AppState;
    } catch {
      // ignore
    }
    return { personagem_ativo_id: null, modo: 'criacao' };
  },

  salvarEstadoApp(state: AppState): void {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  }
};

// ======= EXPORT / IMPORT JSON =======

export function exportarPersonagem(p: Personagem): void {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${p.nome || 'personagem'}-${p.classe || 'dh'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importarPersonagemArquivo(file: File): Promise<Personagem> {
  const texto = await file.text();
  const p = JSON.parse(texto) as Personagem;
  if (!p.id || !p.nome === undefined) {
    throw new Error('Arquivo inválido: não parece ser uma ficha de personagem.');
  }
  // Atribui novo id para evitar conflito ao importar em outro dispositivo
  p.id = gerarUUID();
  p.atualizado_em = new Date().toISOString();
  storage.salvarPersonagem(p);
  return p;
}

export function exportarTodos(): void {
  const data = ler();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dh-companion-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
