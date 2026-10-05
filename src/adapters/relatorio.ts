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
