const CHAVE_TEMA = 'sigaa-v2:tema';
const FUNDO = { claro: '#EDEDED', escuro: '#000000' } as const;

function fundoInicial(): string {
  let salvo: string | null = null;
  try {
    salvo = localStorage.getItem(CHAVE_TEMA);
  } catch {
    salvo = null;
  }
  if (salvo === 'claro' || salvo === 'escuro') return FUNDO[salvo];
  return matchMedia('(prefers-color-scheme: dark)').matches ? FUNDO.escuro : FUNDO.claro;
}

const CHAVE_ENTRANDO = 'sigaa-v2:entrando';
const ENTRANDO_VALIDO_MS = 60_000;

// Mesmo carregador de pontos da tela de login, para a espera continuar sem corte até a interface montar.
function carregadorLogin(escuro: boolean): string {
  let marcado = 0;
  try {
    marcado = Number(sessionStorage.getItem(CHAVE_ENTRANDO) ?? 0);
  } catch {
    marcado = 0;
  }
  if (Date.now() - marcado > ENTRANDO_VALIDO_MS) return '';
  const cor = escuro ? '%23ffffff' : '%23000000';
  const pontos = Array.from({ length: 25 }, (_, i) => {
    const x = (i % 5) * 12 + 6;
    const y = Math.floor(i / 5) * 12 + 6;
    const atraso = (((i % 5) + Math.floor(i / 5)) * 0.09).toFixed(2);
    return `<circle cx='${x}' cy='${y}' r='3.6' fill='${cor}' opacity='.15'><animate attributeName='opacity' values='.15;1;.15' dur='1.1s' begin='${atraso}s' repeatCount='indefinite'/></circle>`;
  }).join('');
  return `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' width='80' height='80'>${pontos}</svg>") center / 80px no-repeat,`;
}

export const domPronto = (): Promise<void> =>
  document.readyState === 'loading'
    ? new Promise((ok) => document.addEventListener('DOMContentLoaded', () => ok(), { once: true }))
    : Promise.resolve();

export function ocultarOriginal(nomeHost: string): () => void {
  const estilo = document.createElement('style');
  estilo.textContent = `
    html { background: ${carregadorLogin(fundoInicial() === FUNDO.escuro)} ${fundoInicial()} !important; }
    body { background: transparent !important; }
    body > :not(${nomeHost}) { visibility: hidden !important; }
  `;
  document.documentElement.append(estilo);
  return () => estilo.remove();
}
