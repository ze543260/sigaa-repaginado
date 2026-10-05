const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const PALAVRAS_VAZIAS = new Set(['ver', 'meus', 'minhas', 'da', 'de', 'do', 'turma']);

/** Indica se o item de menu corresponde à seção aberta (ex.: "Frequência" ↔ "Mapa de Frequências"). */
export function ehSecaoAtual(rotuloItem: string, secaoAtual: string): boolean {
  const atual = normalizar(secaoAtual);
  if (!atual) return false;
  return normalizar(rotuloItem)
    .split(/[^a-z]+/)
    .filter((p) => p.length >= 4 && !PALAVRAS_VAZIAS.has(p))
    .some((p) => atual.includes(p.slice(0, 6)));
}
