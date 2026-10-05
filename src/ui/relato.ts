import { version } from '../../package.json';
import type { Pagina } from '../domain/types';
import { plataforma } from '../plataforma';

const REPOSITORIO = 'https://github.com/ze543260/sigaa-repaginado';

function ambiente(): string {
  const android = navigator.userAgent.match(/Android [\d.]+/)?.[0];
  if (plataforma.agendarLembretes) return `app Android${android ? ` · ${android}` : ''}`;
  const navegador = navigator.userAgent.match(/(Firefox|Edg|Vivaldi|Chrome)\/\d+/)?.[0]?.replace('Edg', 'Edge') ?? 'navegador';
  return `extensão · ${navegador}`;
}

/** Formulário de problema já com versão, plataforma e tela; nenhum dado do aluno vai junto. */
export function linkRelato(pagina: Pagina): string {
  const parametros = new URLSearchParams({
    template: 'problema.yml',
    tela: pagina.tipo,
    versao: `${version} · ${ambiente()}`,
  });
  return `${REPOSITORIO}/issues/new?${parametros}`;
}

export const linkSugestao = `${REPOSITORIO}/issues/new?template=sugestao.yml`;
