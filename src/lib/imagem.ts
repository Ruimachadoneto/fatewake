// Comprime uma imagem do dispositivo para um data URL JPEG pequeno.
// Usado para retratos de personagem (foto_url) — leve o bastante para
// caber no localStorage e sincronizar no JSON da sala.
export function comprimirImagem(file: File, max = 400, qualidade = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(max / img.width, max / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = reject;
    img.src = url;
  });
}
