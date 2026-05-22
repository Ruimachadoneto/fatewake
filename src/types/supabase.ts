// Tipos gerados do schema do Supabase (Fatewake)

export interface Database {
  public: {
    Tables: {
      campanhas: {
        Row: Campanha;
        Insert: CampanhaInsert;
        Update: Partial<CampanhaInsert>;
        Relationships: [];
      };
      personagens_sala: {
        Row: PersonagemSala;
        Insert: PersonagemSalaInsert;
        Update: Partial<PersonagemSalaInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface ImagemRevelada {
  url: string;
  titulo: string;
  timestamp: number;
}

export interface Campanha {
  id: string;
  gm_id: string;
  nome: string;
  sistema: string;
  codigo_sala: string;       // 6 caracteres maiúsculos
  sessao_ativa: boolean;
  medo: number;              // tracker do GM (0-12)
  notas_gm: string;
  imagens_reveladas: ImagemRevelada[];
  criado_em: string;
  atualizado_em: string;
}

export type CampanhaInsert = Omit<Campanha, 'id' | 'criado_em' | 'atualizado_em'>;

export interface PersonagemSala {
  id: string;
  campanha_id: string;
  nome_jogador: string;       // display name sem conta
  session_token: string;      // uuid gerado no cliente para autenticar updates
  personagem: unknown;        // JSON completo da ficha (Personagem do types/personagem.ts)
  online: boolean;
  criado_em: string;
  atualizado_em: string;
}

export type PersonagemSalaInsert = Omit<PersonagemSala, 'id' | 'criado_em' | 'atualizado_em'>;
