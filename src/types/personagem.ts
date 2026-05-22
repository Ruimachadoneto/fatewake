// Modelo de domínio Daggerheart - PT-BR
// Fonte: Daggerheart Jambô Editora 2025

export type Atributo =
  | 'Agilidade'
  | 'Força'
  | 'Acuidade'
  | 'Instinto'
  | 'Presença'
  | 'Conhecimento';

export type Dominio =
  | 'Arcano'
  | 'Códice'
  | 'Esplendor'
  | 'Graça'
  | 'Lâmina'
  | 'Meia-noite'
  | 'Falange'
  | 'Sabedoria'
  | 'Valor';

export type Alcance =
  | 'Corpo a corpo'
  | 'Muito próximo'
  | 'Próximo'
  | 'Distante'
  | 'Muito distante';

export type TipoDano = 'físico' | 'mágico';
export type Empunhadura = 'Uma mão' | 'Duas mãos';

export type NomeClasse =
  | 'Bardo'
  | 'Druida'
  | 'Feiticeiro'
  | 'Guardião'
  | 'Guerreiro'
  | 'Ladino'
  | 'Mago'
  | 'Patrulheiro'
  | 'Serafim';

export interface Arma {
  nome: string;
  atributo: Atributo | '';
  alcance: Alcance | '';
  dado: string; // "d8+3"
  tipo: TipoDano;
  empunhadura?: Empunhadura;
  habilidade?: string;
}

export interface Armadura {
  nome: string;
  limiares_base: [number, number]; // [maior, grave]
  armadura_base: number;
  tag?: string;
  efeito?: string;
  evasao_bonus?: number; // modificador de evasão da armadura (+1 Gibão, -1 Cota, -2 Placas)
}

export interface Experiencia {
  nome: string;
  mod: number; // tipicamente +2
}

export interface Carta {
  id: string;
  nome: string;
  dominio: Dominio;
  nivel: number;
  tipo: 'Feitiço' | 'Talento' | 'Grimório';
  custo_recordacao: number; // PF para recolocar na mão
  descricao: string;
}

export interface ItemInventario {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'item' | 'consumivel' | 'manual';
  timestamp: number;
}

export interface AtributoMarcacao {
  valor: number | null; // valor inicial atribuído (+2, +1, 0, -1)
  marcado: boolean; // marcado em level up (não pode ser escolhido de novo)
  bonus: number; // bônus permanente acumulado de level ups
}

export interface Personagem {
  // Identificação
  id: string;
  criado_em: string; // ISO date
  atualizado_em: string;

  // Identidade
  nome: string;
  foto_url?: string;
  genero: string;
  pronomes: string;
  classe: NomeClasse | '';
  subclasse: string;
  ancestralidade: string;
  comunidade: string;
  nivel: number;

  // Atributos (com tracking de marcação para level up)
  atributos: Record<Atributo, AtributoMarcacao>;

  // Combate
  evasao: number;
  evasao_bonus_perm: number; // bônus permanente acumulado ("Aumentar Evasão" no level-up)
  proficiencia: number;
  limiares: [number, number]; // [maior, grave] já somados ao nível

  // Saúde
  pv_max: number;
  pv_marcados: number;
  pf_max: number;
  pf_marcados: number;
  pa_max: number;
  pa_marcados: number;

  // Esperança
  esperanca: number; // 0-6

  // Equipamento
  arma_principal: Arma;
  arma_secundaria: Arma;
  armadura_ativa: Armadura;
  inventario_armas: Arma[]; // até 2 slots "arma no inventário"

  // Experiências (criação + nível 2/5/8)
  experiencias: Experiencia[];

  // Cartas de domínio
  cartas_mao: string[]; // ids das cartas na mão (ativas)
  cartas_reserva: string[]; // ids das cartas guardadas/conjuradas

  // Inventário
  inventario: ItemInventario[];
  ouro: { punhados: number; bolsas: number; baus: number };

  // Narrativa
  respostas_origem: string[]; // até 3 ou mais
  vinculos: string[];
  descricao_aparencia: string;
  notas: string;

  // Trackers de classe específicos
  forma_fera_ativa?: string; // nome da forma se ativa (Druida)
  elemento_feiticeiro?: string; // elemento escolhido na criação (Elementalista)
  companheiro?: CompanheiroAnimal;

  // Condições ativas (Daggerheart)
  condicoes: string[]; // subconjunto de CONDICOES_NOMES

  // Estado de level up
  patamares_marcados: PatamarMarcado[];

  // Preparação para Fase 2 (multi-usuário/campanhas)
  campanha_id?: string;
  usuario_id?: string;
}

export interface CompanheiroAnimal {
  nome: string;
  tipo: string; // ex: "Lobo de neve"
  imagem?: string; // base64 ou URL
  evasao: number;
  dado_dano: 'd6' | 'd8' | 'd10' | 'd12';
  alcance: Alcance;
  ataque_descricao: string;
  pf_max: number;
  pf_marcados: number;
  experiencias: Experiencia[];
  treinamentos: string[]; // nomes dos treinamentos aprendidos
}

export interface PatamarMarcado {
  patamar: 2 | 3 | 4;
  nivel: number;
  opcoes_escolhidas: string[]; // nomes das opções marcadas
}

// Helpers de criação
export function novoPersonagem(id: string): Personagem {
  const agora = new Date().toISOString();
  return {
    id,
    criado_em: agora,
    atualizado_em: agora,
    nome: '',
    genero: '',
    pronomes: '',
    classe: '',
    subclasse: '',
    ancestralidade: '',
    comunidade: '',
    nivel: 1,
    atributos: {
      Agilidade: { valor: null, marcado: false, bonus: 0 },
      Força: { valor: null, marcado: false, bonus: 0 },
      Acuidade: { valor: null, marcado: false, bonus: 0 },
      Instinto: { valor: null, marcado: false, bonus: 0 },
      Presença: { valor: null, marcado: false, bonus: 0 },
      Conhecimento: { valor: null, marcado: false, bonus: 0 }
    },
    evasao: 10,
    evasao_bonus_perm: 0,
    proficiencia: 1,
    limiares: [0, 0],
    pv_max: 6,
    pv_marcados: 0,
    pf_max: 6,
    pf_marcados: 0,
    pa_max: 3,
    pa_marcados: 0,
    esperanca: 2,
    arma_principal: { nome: '', atributo: '', alcance: '', dado: '', tipo: 'físico' },
    arma_secundaria: { nome: '', atributo: '', alcance: '', dado: '', tipo: 'físico' },
    armadura_ativa: { nome: '', limiares_base: [0, 0], armadura_base: 0 },
    inventario_armas: [],
    experiencias: [],
    cartas_mao: [],
    cartas_reserva: [],
    inventario: [],
    ouro: { punhados: 0, bolsas: 0, baus: 0 },
    respostas_origem: ['', '', ''],
    vinculos: ['', '', ''],
    descricao_aparencia: '',
    notas: '',
    condicoes: [],
    patamares_marcados: []
  };
}
