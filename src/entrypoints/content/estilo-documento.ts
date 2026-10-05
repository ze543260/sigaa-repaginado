// @font-face e ::view-transition não funcionam dentro do shadow root; precisam viver no documento.

export const FONTES = [
  ['Doto', 600, 'doto-latin-600'],
  ['Doto', 800, 'doto-latin-800'],
  ['Space Grotesk', 400, 'space-grotesk-latin-400'],
  ['Space Grotesk', 500, 'space-grotesk-latin-500'],
  ['Space Grotesk', 600, 'space-grotesk-latin-600'],
  ['Space Mono', 400, 'space-mono-latin-400'],
  ['Space Mono', 700, 'space-mono-latin-700'],
  ['Caveat', 700, 'caveat-latin-700'],
  ['Archivo Black', 400, 'archivo-black-latin-400'],
  ['Press Start 2P', 400, 'press-start-2p-latin-400'],
  ['IBM Plex Sans', 400, 'ibm-plex-sans-latin-400'],
  ['IBM Plex Sans', 600, 'ibm-plex-sans-latin-600'],
  ['IBM Plex Mono', 600, 'ibm-plex-mono-latin-600'],
  ['Barlow', 400, 'barlow-latin-400'],
  ['Barlow', 600, 'barlow-latin-600'],
  ['Barlow Condensed', 600, 'barlow-condensed-latin-600'],
  ['Archivo', 400, 'archivo-latin-400'],
  ['Archivo', 600, 'archivo-latin-600'],
  ['Permanent Marker', 400, 'permanent-marker-latin-400'],
  ['Work Sans', 400, 'work-sans-latin-400'],
  ['Work Sans', 600, 'work-sans-latin-600'],
  ['Patrick Hand', 400, 'patrick-hand-latin-400'],
  ['Chakra Petch', 400, 'chakra-petch-latin-400'],
  ['Chakra Petch', 600, 'chakra-petch-latin-600'],
  ['Nunito', 400, 'nunito-latin-400'],
  ['Nunito', 700, 'nunito-latin-700'],
  ['Fraunces', 600, 'fraunces-latin-600'],
  ['Sora', 400, 'sora-latin-400'],
  ['Sora', 600, 'sora-latin-600'],
  ['VT323', 400, 'vt323-latin-400'],
  ['Exo 2', 400, 'exo-2-latin-400'],
  ['Exo 2', 700, 'exo-2-latin-700'],
  ['Lexend', 400, 'lexend-latin-400'],
  ['Lexend', 600, 'lexend-latin-600'],
  ['Inter', 400, 'inter-latin-400'],
  ['Inter', 600, 'inter-latin-600'],
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
