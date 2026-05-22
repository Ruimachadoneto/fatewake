// Tipos para os JSONs de dados de referência
import type { Atributo, Dominio, NomeClasse, Alcance, TipoDano, Empunhadura } from './personagem';

export interface ArmaSugerida {
  nome: string;
  atributo: Atributo;
  alcance: Alcance;
  dado: string;
  tipo: TipoDano;
  empunhadura?: Empunhadura;
  habilidade?: string;
}

export interface ArmaduraSugerida {
  nome: string;
  limiares_base: [number, number];
  armadura_base: number;
  tag?: string;
  efeito?: string;
}

export interface HabilidadeEsperanca {
  nome: string;
  custo: number;
  efeito: string;
}

export interface HabilidadeClasse {
  nome: string;
  descricao: string;
}

export interface InventarioInicial {
  padrao: string[];
  escolha_pocao: string[];
  escolha_item: string[];
  decida?: string;
}

export interface DescricaoPessoal {
  roupas: string[];
  postura: string[];
}

export interface DadosClasse {
  dominios: [Dominio, Dominio];
  evasao_base: number;
  pv_base: number;
  pf_base: number;
  armadura_sugerida: ArmaduraSugerida;
  atributos_sugeridos: Record<Atributo, number>;
  arma_primaria_sugerida: ArmaSugerida;
  arma_secundaria_sugerida?: ArmaSugerida;
  esperanca: HabilidadeEsperanca;
  habilidades_classe: HabilidadeClasse[];
  inventario_inicial: InventarioInicial;
  descricao_pessoal: DescricaoPessoal;
  perguntas_origem: string[];
  vinculos: string[];
  tagline: string;
  ficha_extra?: 'formas-fera' | 'companheiro-animal';
}

export type DadosClasses = {
  _meta: { fonte: string; versao: string; ultima_atualizacao: string };
} & Record<NomeClasse, DadosClasse>;

// Subclasses
export interface DadosSubclasse {
  nome: string;
  atributo_conjuracao?: Atributo;
  fundamental: HabilidadeClasse[];
  especializacao: HabilidadeClasse;
  maestria: HabilidadeClasse;
}

export interface DadosSubclasses {
  _meta: { fonte: string; versao: string };
  classes: Record<NomeClasse, DadosSubclasse[]>;
}

// Ancestralidades — a chave do objeto é o nome; não há campo `nome` interno
export interface DadosAncestralidade {
  descricao: string;
  habilidade_1: HabilidadeClasse;
  habilidade_2: HabilidadeClasse;
}

// Comunidades — a chave do objeto é o nome; não há campo `nome` interno
export interface DadosComunidade {
  descricao: string;
  habilidade: HabilidadeClasse;
  item_inventario?: string;
}

// Formas de Fera
export interface FormaFera {
  nome: string;
  exemplos: string;
  atributo_bonus?: Partial<Record<Atributo, number>>;
  evasao_bonus?: number;
  ataque?: {
    alcance: Alcance;
    atributo: Atributo;
    dado: string;
    tipo: TipoDano;
  };
  vantagem_em?: string[];
  habilidades: string[];
}

export interface PatamarFormaFera {
  patamar: 1 | 2 | 3 | 4;
  niveis: string;
  formas: FormaFera[];
}

export interface DadosFormasFera {
  _meta: { fonte: string; classe: string; descricao: string };
  patamares: PatamarFormaFera[];
}

// Companheiro Animal
export interface TreinamentoCompanheiro {
  nome: string;
  frequencia?: string;
  descricao: string;
}

export interface DadosCompanheiroAnimal {
  _meta: { fonte: string; classe: string; descricao: string };
  regras_basicas: Record<string, unknown>;
  ataque: Record<string, unknown>;
  fadiga: Record<string, string>;
  experiencias_sugeridas: string[];
  treinamentos: TreinamentoCompanheiro[];
}

// Equipamentos
export interface ArmaEquipamento {
  nome: string;
  atributo: Atributo;
  alcance: Alcance;
  dado: string;
  tipo: TipoDano;
  empunhadura: Empunhadura;
  habilidade?: string;
}

export interface ArmaduraEquipamento {
  nome: string;
  limiares_base: [number, number];
  armadura_base: number;
  tag?: string;
  efeito?: string;
  evasao_bonus: number;
}

export interface DadosEquipamentos {
  _meta: { fonte: string; versao: string; descricao: string };
  armas_primarias_fisicas: ArmaEquipamento[];
  armas_primarias_magicas: ArmaEquipamento[];
  armas_secundarias: ArmaEquipamento[];
  armaduras: ArmaduraEquipamento[];
}

// Level Up
export interface OpcaoPatamar {
  nome: string;
  vagas: number;
  descricao: string;
  exclui?: string;
}

export interface DadosPatamar {
  niveis: string;
  obrigatorio?: string[];
  por_nivel?: string[];
  opcoes?: OpcaoPatamar[];
  descricao?: string;
}

export interface DadosLevelUp {
  _meta: { fonte: string; descricao: string };
  patamares: Record<'1' | '2' | '3' | '4', DadosPatamar>;
}
