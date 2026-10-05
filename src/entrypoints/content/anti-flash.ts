const CHAVE_TEMA = 'sigaa-v2:tema';
const FUNDO = { claro: '#EDEDED', escuro: '#000000' } as const;

const CHAVE_CORES = 'sigaa-v2:cores';

interface Cores {
  readonly fundo: string;
  readonly card: string;
  readonly borda: string;
  readonly texto?: string;
  readonly destaque?: string;
}

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function modoEscuro(): boolean {
  const salvo = ler(CHAVE_TEMA);
  if (salvo === 'claro' || salvo === 'escuro') return salvo === 'escuro';
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Cores reais do estilo atual, gravadas pela interface; sem elas, o preto/cinza padrão. */
function coresIniciais(): Cores {
  const escuro = modoEscuro();
  try {
    const salvas = JSON.parse(ler(CHAVE_CORES) ?? '{}') as Partial<Record<'claro' | 'escuro', Cores>>;
    const cores = salvas[escuro ? 'escuro' : 'claro'];
    if (cores?.fundo) return cores;
  } catch {
    /* cores corrompidas: usa o padrão */
  }
  const fundo = escuro ? FUNDO.escuro : FUNDO.claro;
  return { fundo, card: escuro ? '#141414' : '#ffffff', borda: escuro ? '#2e2e2e' : '#d1d1d1', texto: escuro ? '#ffffff' : '#000000', destaque: '#d7191f' };
}

/** Esqueleto do topo e de alguns cartões, para a troca de página não passar por um quadro vazio. */
function esqueleto({ card, borda }: Cores): string {
  const bloco = (topo: number, altura: number) => `linear-gradient(${card}, ${card}) 16px ${topo}px / calc(100% - 32px) ${altura}px no-repeat`;
  return [
    `linear-gradient(${borda}, ${borda}) 0 64px / 100% 1px no-repeat`,
    `linear-gradient(${borda}, ${borda}) 16px 96px / 40% 14px no-repeat`,
    `linear-gradient(${borda}, ${borda}) 16px 124px / 70% 36px no-repeat`,
    bloco(184, 150),
    bloco(350, 96),
    bloco(462, 96),
  ].join(', ') + ',';
}

const CHAVE_ENTRANDO = 'sigaa-v2:entrando';
const ENTRANDO_VALIDO_MS = 60_000;

// Mesmo carregador de pontos da tela de login, para a espera continuar sem corte até a interface montar.
function estiloTerminal(): boolean {
  try {
    return (JSON.parse(ler('sigaa-v2:prefs') ?? '{}') as { estilo?: string }).estilo === 'terminal';
  } catch {
    return false;
  }
}

function carregadorLogin({ texto = '#000', destaque = '#d7191f' }: Cores): string {
  let marcado = 0;
  try {
    marcado = Number(sessionStorage.getItem(CHAVE_ENTRANDO) ?? 0);
  } catch {
    marcado = 0;
  }
  if (Date.now() - marcado > ENTRANDO_VALIDO_MS) return '';
  const quadrado = estiloTerminal();
  const pontos = Array.from({ length: 25 }, (_, i) => {
    const x = (i % 5) * 12 + 6;
    const y = Math.floor(i / 5) * 12 + 6;
    const atraso = (((i % 5) + Math.floor(i / 5)) * 0.09).toFixed(2);
    const cor = encodeURIComponent(i === 12 ? destaque : texto);
    const anima = `<animate attributeName='opacity' values='.15;1;.15' dur='1.1s' begin='${atraso}s' repeatCount='indefinite'/>`;
    return quadrado
      ? `<rect x='${x - 4}' y='${y - 4}' width='8' height='8' fill='${cor}' opacity='.15'>${anima}</rect>`
      : `<circle cx='${x}' cy='${y}' r='3.6' fill='${cor}' opacity='.15'>${anima}</circle>`;
  }).join('');
  return `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' width='80' height='80'>${pontos}</svg>") center / 80px no-repeat,`;
}

export const domPronto = (): Promise<void> =>
  document.readyState === 'loading'
    ? new Promise((ok) => document.addEventListener('DOMContentLoaded', () => ok(), { once: true }))
    : Promise.resolve();

export function ocultarOriginal(nomeHost: string): () => void {
  const cores = coresIniciais();
  const carregador = carregadorLogin(cores);
  const estilo = document.createElement('style');
  estilo.textContent = `
    html { background: ${carregador || esqueleto(cores)} ${cores.fundo} !important; }
    body { background: transparent !important; }
    body > :not(${nomeHost}) { visibility: hidden !important; }
  `;
  document.documentElement.append(estilo);
  return () => estilo.remove();
}
