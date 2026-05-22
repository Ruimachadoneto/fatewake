// Carregador central de todos os dados de referência com tipos
import classesData from './classes.json';
import subclassesData from './subclasses.json';
import ancestralidadesData from './ancestralidades.json';
import comunidadesData from './comunidades.json';
import formasFeraData from './formas-fera.json';
import companheiroData from './companheiro-animal.json';
import levelupData from './levelup.json';
import cartasN1Data from './cartas/nivel-1.json';
import cartasN2Data from './cartas/nivel-2.json';
import cartasN3Data from './cartas/nivel-3.json';
import cartasN4Data from './cartas/nivel-4.json';
import cartasN5Data from './cartas/nivel-5.json';
import cartasN6Data from './cartas/nivel-6.json';
import cartasN7Data from './cartas/nivel-7.json';
import cartasN8Data from './cartas/nivel-8.json';
import cartasN9Data from './cartas/nivel-9.json';
import cartasN10Data from './cartas/nivel-10.json';
import equipamentosData from './equipamentos.json';
import objetivosData from './objetivos.json';
import ambientesData from './ambientes.json';
import tesouroData from './tesouro.json';
import consumiveisData from './consumiveis.json';

import type {
  DadosClasses,
  DadosSubclasses,
  DadosAncestralidade,
  DadosComunidade,
  DadosFormasFera,
  DadosCompanheiroAnimal,
  DadosLevelUp,
  DadosEquipamentos
} from '@/types/dados';
import type { Carta } from '@/types/personagem';

// Tipagem dos JSONs ao importar
export const CLASSES = classesData as unknown as DadosClasses;
export const SUBCLASSES = subclassesData as unknown as DadosSubclasses;
export const ANCESTRALIDADES = ancestralidadesData as unknown as Record<string, DadosAncestralidade>;
export const COMUNIDADES = comunidadesData as unknown as Record<string, DadosComunidade>;
export const FORMAS_FERA = formasFeraData as unknown as DadosFormasFera;
export const COMPANHEIRO = companheiroData as unknown as DadosCompanheiroAnimal;
export const LEVELUP = levelupData as unknown as DadosLevelUp;
export const EQUIPAMENTOS = equipamentosData as unknown as DadosEquipamentos;

// Cartas: unifica em uma lista única para busca/filtro
const cartasN1 = (cartasN1Data as { cartas: Carta[] }).cartas;
const cartasN2 = (cartasN2Data as { cartas: Carta[] }).cartas;
const cartasN3 = (cartasN3Data as { cartas: Carta[] }).cartas;
const cartasN4 = (cartasN4Data as { cartas: Carta[] }).cartas;
const cartasN5 = (cartasN5Data as { cartas: Carta[] }).cartas;
const cartasN6 = (cartasN6Data as { cartas: Carta[] }).cartas;
const cartasN7 = (cartasN7Data as { cartas: Carta[] }).cartas;
const cartasN8 = (cartasN8Data as { cartas: Carta[] }).cartas;
const cartasN9 = (cartasN9Data as { cartas: Carta[] }).cartas;
const cartasN10 = (cartasN10Data as { cartas: Carta[] }).cartas;
export const CARTAS: Carta[] = [
  ...cartasN1, ...cartasN2, ...cartasN3, ...cartasN4, ...cartasN5,
  ...cartasN6, ...cartasN7, ...cartasN8, ...cartasN9, ...cartasN10,
];

// Helpers de busca
export function getCarta(id: string): Carta | undefined {
  return CARTAS.find(c => c.id === id);
}

export function getCartasPorDominio(dominio: string, nivelMax = 10): Carta[] {
  return CARTAS.filter(c => c.dominio === dominio && c.nivel <= nivelMax);
}

export function getNomesClasses(): string[] {
  return Object.keys(CLASSES).filter(k => !k.startsWith('_'));
}

export function getNomesAncestralidades(): string[] {
  return Object.keys(ANCESTRALIDADES).filter(k => !k.startsWith('_'));
}

export function getNomesComunidades(): string[] {
  return Object.keys(COMUNIDADES).filter(k => !k.startsWith('_'));
}

// ─── Dados de Campanha ────────────────────────────────────────────────────────
export interface Objetivo { valor: number; descricao: string }
export interface HabilidadeAmbiente { nome: string; tipo: string; custo?: string; descricao: string }
export interface Ambiente {
  nome: string; tipo: string; descricao: string;
  impulsos?: string[]; dificuldade?: number | null;
  dificuldade_especial?: string;
  adversarios: string[];
  habilidades: HabilidadeAmbiente[];
}
export interface PatamarAmbiente { patamar: number; niveis: string; ambientes: Ambiente[] }
export interface ItemTesouro { soma: number; nome: string; descricao: string }
export interface RaridadeTesouro { label: string; dados: number; descricao: string }

export const OBJETIVOS: Objetivo[] = (objetivosData as { objetivos: Objetivo[] }).objetivos;
export const AMBIENTES: PatamarAmbiente[] = (ambientesData as { patamares: PatamarAmbiente[] }).patamares;
export const TESOURO_ITENS: ItemTesouro[] = (tesouroData as { itens: ItemTesouro[] }).itens;
export const TESOURO_RARIDADES: Record<string, RaridadeTesouro> = (tesouroData as { raridades: Record<string, RaridadeTesouro> }).raridades;
export const CONSUMIVEIS: ItemTesouro[] = (consumiveisData as { consumiveis: ItemTesouro[] }).consumiveis;
