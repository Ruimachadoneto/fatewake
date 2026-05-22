// Extração de texto posicional de PDFs com pdfjs-dist + parser de ficha Daggerheart.
// A lógica de parsing fica em pdf-parse.ts (pura, testável em Node).

import * as pdfjsLib from 'pdfjs-dist';
import { parseFicha, type ItemTexto, type FichaPDF } from './pdf-parse';

export type { FichaPDF, ArmaRaw } from './pdf-parse';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

async function extrairItens(file: File): Promise<ItemTexto[][]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;

  const paginas: ItemTexto[][] = [];
  for (let pg = 1; pg <= pdf.numPages; pg++) {
    const page = await pdf.getPage(pg);
    const content = await page.getTextContent();
    const itens: ItemTexto[] = (content.items as { str: string; transform: number[]; width: number; fontName?: string }[])
      .filter(i => i.str.trim().length > 0)
      .map(i => ({ str: i.str, x: i.transform[4], y: i.transform[5], w: i.width, fonte: i.fontName }));
    paginas.push(itens);
  }
  return paginas;
}

export async function parsearFichaPDF(file: File): Promise<FichaPDF> {
  const paginas = await extrairItens(file);
  const totalItens = paginas.reduce((acc, p) => acc + p.length, 0);
  if (totalItens < 10) {
    throw new Error('Este PDF não tem texto selecionável — provavelmente foi salvo como imagem. Reexporte a ficha mantendo o texto, ou crie o personagem manualmente.');
  }
  return parseFicha(paginas);
}
