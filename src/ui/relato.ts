import { version } from '../../package.json';
import { plataforma } from '../plataforma';

const REPOSITORIO = 'https://github.com/ze543260/sigaa-repaginado';

function ambiente(): string {
  const android = navigator.userAgent.match(/Android [\d.]+/)?.[0];
  if (plataforma.agendarLembretes) return `app Android${android ? ` · ${android}` : ''}`;
  const navegador = navigator.userAgent.match(/(Firefox|Edg|Vivaldi|Chrome)\/\d+/)?.[0]?.replace('Edg', 'Edge') ?? 'navegador';
  return `extensão · ${navegador}`;
}

export const linkSugestao = `${REPOSITORIO}/issues/new?template=sugestao.yml`;

// Worker em relatos/ (wrangler deploy).
const ENDPOINT_RELATO = 'https://sigaa-relatos.josevitorg170.workers.dev';
const EVENTO = 'sigaa:relatar';
const erros: string[] = [];

export function registrarErros(alvo: Window): void {
  const guardar = (msg: string) => {
    erros.push(`${new Date().toISOString().slice(11, 19)} ${msg}`.slice(0, 300));
    if (erros.length > 10) erros.shift();
  };
  alvo.addEventListener('error', (e) => guardar(`${e.message} @ ${e.filename?.split('/').pop()}:${e.lineno}`));
  alvo.addEventListener('unhandledrejection', (e) => guardar(`promise: ${String(e.reason?.message ?? e.reason)}`));
}

export const abrirRelato = () => window.dispatchEvent(new Event(EVENTO));

export function aoPedirRelato(abrir: () => void): () => void {
  window.addEventListener(EVENTO, abrir);
  return () => window.removeEventListener(EVENTO, abrir);
}

export interface DadosRelato {
  readonly texto: string;
  readonly contato: string;
  readonly tela: string;
  readonly estilo: string;
}

export function tecnicoDoRelato(d: Pick<DadosRelato, 'tela' | 'estilo'>) {
  return { versao: version, plataforma: ambiente(), tela: d.tela, estilo: d.estilo, erros: [...erros] };
}

export async function enviarRelato(d: DadosRelato): Promise<{ numero: number; url: string }> {
  const r = await fetch(ENDPOINT_RELATO, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: d.texto, contato: d.contato || undefined, ...tecnicoDoRelato(d) }),
  });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(corpo.erro ?? 'Não foi possível enviar agora.');
  return corpo;
}
