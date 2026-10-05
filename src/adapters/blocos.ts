import type { Bloco, Par, Pessoa, Tabela } from '../domain/types';

export const texto = (el: Element | null | undefined): string =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const SELETOR_BLOCOS = [
  'table.listing',
  'table.tabelaRelatorio',
  'table.visualizacao',
  'table.programaRelatorio',
  'table.participantes',
  '.botoes-show',
  '.descricaoOperacao',
  'p.empty-listing',
  'center > img',
  '#relatorio table:not([class]):not(:has(table))',
  '#autenticacao p',
].join(', ');

const SELETOR_TITULOS = 'h3, h4, legend';

// Checagens por tagName em vez de instanceof: no app, os elementos vêm de outro realm (o documento pai).
const ehTabela = (el: Element): el is HTMLTableElement => el.tagName === 'TABLE';
const ehImagem = (el: Element): el is HTMLImageElement => el.tagName === 'IMG';
const QUEBRA_DEPOIS = new Set(['BR', 'P', 'DIV', 'LI', 'TR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

// Não usa innerText: ele ignora elementos com visibility:hidden, e o SIGAA original fica oculto.
function textoVisivel(el: Element): string {
  let saida = '';
  const visitar = (no: Node): void => {
    if (no.nodeType === Node.TEXT_NODE) {
      saida += (no.textContent ?? '').replace(/\s+/g, ' ');
      return;
    }
    if (no.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (no as Element).tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE') return;
    no.childNodes.forEach(visitar);
    if (QUEBRA_DEPOIS.has(tag)) saida += '\n';
  };
  visitar(el);
  return saida;
}

const textoCelula = (celula: Element): string =>
  textoVisivel(celula)
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

export function extrairAvisos(doc: Document): string[] {
  return [...doc.querySelectorAll('#painel-erros li')].map(texto).filter(Boolean);
}

function linhasDe(tabela: HTMLTableElement): HTMLTableRowElement[] {
  return [...tabela.rows].filter((tr) => tr.closest('table') === tabela);
}

function extrairTabela(tabela: HTMLTableElement): Tabela {
  const linhas = linhasDe(tabela);
  const cabecalho = linhas.find(
    (tr) => tr.matches('.titulo') || (tr.querySelector(':scope > th') && !tr.querySelector(':scope > td')),
  );
  const colunas = cabecalho ? [...cabecalho.cells].map(texto) : [];
  const resultado: { celulas: string[]; nota: string; abrir: (() => void) | null }[] = [];

  for (const tr of linhas) {
    if (tr === cabecalho) continue;
    const celulas = [...tr.cells];
    if (celulas.length === 0) continue;
    const anterior = resultado[resultado.length - 1];
    if (anterior && colunas.length > 1 && celulas.length === 1) {
      anterior.nota = [anterior.nota, texto(celulas[0])].filter(Boolean).join(' ');
      continue;
    }
    if (celulas.length === 1 && colunas.length > 1) continue;
    if (celulas.every((c) => !texto(c))) continue;
    const link = [...tr.querySelectorAll<HTMLAnchorElement>('a')].pop();
    resultado.push({ celulas: celulas.map(textoCelula), nota: '', abrir: link ? () => link.click() : null });
  }
  return { colunas, linhas: resultado };
}

function extrairParesTabela(tabela: HTMLTableElement): Par[] {
  const pares: Par[] = [];
  let rotuloPendente = '';
  for (const tr of linhasDe(tabela)) {
    const th = tr.querySelector(':scope > th');
    const td = tr.querySelector(':scope > td');
    if (th && td) pares.push({ rotulo: texto(th).replace(/:$/, ''), valor: texto(td) });
    else if (th) rotuloPendente = texto(th).replace(/:$/, '');
    else if (td && rotuloPendente && texto(td)) {
      pares.push({ rotulo: rotuloPendente, valor: texto(td) });
      rotuloPendente = '';
    }
  }
  return pares;
}

function ehParesEmTd(tabela: HTMLTableElement): boolean {
  return !tabela.querySelector('th') && linhasDe(tabela).some((tr) => texto(tr.cells[0]).endsWith(':'));
}

function extrairParesTd(tabela: HTMLTableElement): Par[] {
  return linhasDe(tabela).flatMap((tr) => {
    const celulas = [...tr.cells];
    const pares: Par[] = [];
    for (let i = 0; i + 1 < celulas.length; i += 2) {
      const rotulo = texto(celulas[i]);
      if (rotulo.endsWith(':')) pares.push({ rotulo: rotulo.slice(0, -1), valor: texto(celulas[i + 1]) });
    }
    return pares;
  });
}

function extrairParesTexto(el: Element): Par[] {
  return textoVisivel(el)
    .split('\n')
    .map((l) => l.trim())
    .flatMap((linha) => {
      const i = linha.indexOf(':');
      return i > 0 ? [{ rotulo: linha.slice(0, i).trim(), valor: linha.slice(i + 1).trim() }] : [];
    });
}

function extrairPessoas(tabela: HTMLTableElement): Pessoa[] {
  return [...tabela.querySelectorAll('td')].flatMap((td) => {
    const nome = td.querySelector('strong');
    if (!nome) return [];
    const foto = td.previousElementSibling?.querySelector('img')?.getAttribute('src') ?? null;
    return [{
      nome: texto(nome),
      foto: foto && !foto.includes('no_picture') ? new URL(foto, td.ownerDocument.baseURI).href : null,
      detalhes: [...td.querySelectorAll('em')].map(texto).filter(Boolean),
    }];
  });
}

function paragrafos(el: Element): string[] {
  const blocos = [...el.querySelectorAll('p, li')];
  const linhas = blocos.length > 0 ? blocos.map(texto) : [texto(el)];
  return linhas.filter(Boolean);
}

function converter(el: Element, titulo: string): Bloco | null {
  if (ehTabela(el)) {
    const legenda = texto(el.caption);
    if (el.matches('.participantes')) return { tipo: 'pessoas', titulo, pessoas: extrairPessoas(el) };
    if (el.matches('.visualizacao, .programaRelatorio')) return { tipo: 'pares', titulo, pares: extrairParesTabela(el) };
    if (ehParesEmTd(el)) return { tipo: 'pares', titulo, pares: extrairParesTd(el) };
    return { tipo: 'tabela', titulo: legenda || titulo, tabela: extrairTabela(el) };
  }
  if (el.matches('.botoes-show')) return { tipo: 'pares', titulo, pares: extrairParesTexto(el) };
  if (el.matches('p.empty-listing')) return { tipo: 'vazio', titulo, mensagem: texto(el) };
  if (ehImagem(el)) return { tipo: 'imagem', titulo, src: el.src };
  const ps = paragrafos(el);
  return ps.length > 0 ? { tipo: 'texto', titulo, paragrafos: ps } : null;
}

export function extrairBlocos(raiz: Element): Bloco[] {
  const blocos: Bloco[] = [];
  let titulo = '';
  for (const el of raiz.querySelectorAll(`${SELETOR_BLOCOS}, ${SELETOR_TITULOS}`)) {
    if (el.matches(SELETOR_TITULOS)) {
      titulo = texto(el);
      continue;
    }
    if (el.parentElement?.closest(SELETOR_BLOCOS) || el.closest('#painel-erros')) continue;
    const bloco = converter(el, titulo);
    if (bloco) blocos.push(bloco);
  }
  return blocos;
}
