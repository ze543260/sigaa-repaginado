import type { Relatorio } from '../domain/types';
import { extrairAvisos, extrairBlocos, texto } from './blocos';

export function extrairRelatorio(doc: Document): Relatorio | null {
  const corpo = doc.querySelector('#relatorio');
  if (!doc.querySelector('#relatorio-cabecalho') || !corpo) return null;

  const voltar = doc.querySelector<HTMLAnchorElement>('#relatorio-rodape td.voltar a, #relatorio-rodape a[href*="voltar" i]');
  return {
    titulo: texto(corpo.querySelector('h3')) || texto(doc.querySelector('#relatorio-cabecalho a')) || 'Relatório',
    avisos: extrairAvisos(doc),
    blocos: extrairBlocos(corpo),
    voltar: voltar ? () => voltar.click() : () => doc.defaultView?.history.back(),
  };
}

/** Qualquer tela comum do SIGAA com tabelas ou formulários em #conteudo, mostrada no visual genérico. */
export function extrairPaginaGenerica(doc: Document): Relatorio | null {
  const conteudo = doc.querySelector('#conteudo');
  if (!conteudo) return null;
  const blocos = extrairBlocos(conteudo);
  if (!blocos.some((b) => b.tipo === 'tabela' || b.tipo === 'pares')) return null;
  const titulo = texto(conteudo.querySelector('h2')) || texto(conteudo.querySelector('legend')) || doc.title.replace(/^SIGAA\s*-\s*/, '') || 'SIGAA';
  return {
    titulo,
    avisos: extrairAvisos(doc),
    blocos,
    voltar: () => doc.defaultView?.history.back(),
  };
}
