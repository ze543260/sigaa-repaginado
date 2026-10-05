// @font-face e ::view-transition não funcionam dentro do shadow root; precisam viver no documento.

export const FONTES = [
  ['Doto', 600, 'doto-latin-600'],
  ['Doto', 800, 'doto-latin-800'],
  ['Space Grotesk', 400, 'space-grotesk-latin-400'],
  ['Space Grotesk', 500, 'space-grotesk-latin-500'],
  ['Space Grotesk', 600, 'space-grotesk-latin-600'],
  ['Space Mono', 400, 'space-mono-latin-400'],
  ['Space Mono', 700, 'space-mono-latin-700'],
] as const;

export type ArquivoFonte = `${(typeof FONTES)[number][2]}-normal.woff2`;

const TRANSICAO_TEMA = `
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
    mix-blend-mode: normal;
  }
  ::view-transition-new(root) {
    animation: sigaa-revelar 480ms cubic-bezier(0.65, 0, 0.35, 1);
  }
  @keyframes sigaa-revelar {
    from { clip-path: circle(0 at var(--sigaa-x, 100%) var(--sigaa-y, 0)); }
    to { clip-path: circle(var(--sigaa-r, 150vmax) at var(--sigaa-x, 100%) var(--sigaa-y, 0)); }
  }
`;

export function injetarEstiloDocumento(urlFonte: (arquivo: ArquivoFonte) => string): void {
  if (document.getElementById('sigaa-v2-documento')) return;
  const fontes = FONTES.map(
    ([familia, peso, arquivo]) => `@font-face {
      font-family: '${familia}';
      font-weight: ${peso};
      font-style: normal;
      font-display: swap;
      src: url('${urlFonte(`${arquivo}-normal.woff2`)}') format('woff2');
    }`,
  ).join('\n');

  const estilo = document.createElement('style');
  estilo.id = 'sigaa-v2-documento';
  estilo.textContent = fontes + TRANSICAO_TEMA;
  document.head.append(estilo);
}
