import type { ConteudoTurma, Material, Noticia, PaginaTurma, SecaoMenuTurma, Topico } from '../domain/types';
import { plataforma } from '../plataforma';
import { extrairAvisos, extrairBlocos } from './blocos';
import { extrairEnvioTarefa, extrairTarefas } from './tarefas';

const texto = (el: Element | null | undefined): string =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const clicavel = (el: HTMLElement | null | undefined): (() => void) | null => (el ? () => el.click() : null);

const BLOCOS = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, pre';

function paragrafos(raiz: Element): string[] {
  const copia = raiz.cloneNode(true) as Element;
  copia.querySelectorAll('script, style, .drgind_fly, .item').forEach((el) => el.remove());
  const blocos = [...copia.querySelectorAll(BLOCOS)].filter((el) => !el.parentElement?.closest(BLOCOS));
  const linhas = blocos.length > 0 ? blocos.map(texto) : [texto(copia)];
  return linhas.filter(Boolean);
}

function tipoMaterial(icone: string): Material['tipo'] {
  if (icone.includes('pdf')) return 'pdf';
  if (icone.includes('zip')) return 'zip';
  if (icone.includes('tarefa')) return 'tarefa';
  return 'arquivo';
}

function extrairMateriais(topico: Element): Material[] {
  return [...topico.querySelectorAll('.item')].flatMap((item) => {
    const link = item.querySelector<HTMLAnchorElement>('a');
    if (!link) return [];
    const icone = item.querySelector('img:not([src*="indicator"])')?.getAttribute('src') ?? '';
    const tipo = tipoMaterial(icone);
    return [{
      nome: texto(link),
      tipo,
      descricao: texto(item.querySelector('.descricao-item')),
      abrir: () => {
        if (tipo !== 'tarefa') {
          plataforma.ultimoDownload = Date.now();
          plataforma.prepararDownload();
        }
        link.click();
      },
    }];
  });
}

function simplificarPeriodo(periodo: string): string {
  const [inicio, fim] = periodo.split(/\s+-\s+/);
  return inicio && inicio === fim ? inicio : periodo;
}

function extrairTopicos(doc: Document): Topico[] {
  return [...doc.querySelectorAll('.topico-aula')].map((topico) => {
    const titulo = texto(topico.querySelector('.titulo'));
    const periodo = titulo.match(/\(([^()]*\d{2}\/\d{2}\/\d{4}[^()]*)\)\s*$/);
    const conteudo = topico.querySelector('.conteudotopico');
    return {
      titulo: periodo ? titulo.slice(0, periodo.index).trim() : titulo,
      periodo: simplificarPeriodo(periodo?.[1] ?? ''),
      paragrafos: conteudo ? paragrafos(conteudo) : [],
      materiais: extrairMateriais(topico),
    };
  });
}

function extrairNoticia(doc: Document): Noticia | null {
  const bloco = doc.querySelector('#ultimaNoticia');
  if (!bloco) return null;
  const titulo = texto(bloco.querySelector('h4')).replace(/^Última Notícia\s*/i, '');
  const conteudo = bloco.querySelector('.conteudoNoticia');
  return {
    titulo,
    paragrafos: conteudo ? paragrafos(conteudo) : [],
    autor: texto(bloco.querySelector('small i')),
  };
}

function extrairMenu(doc: Document): SecaoMenuTurma[] {
  return [...doc.querySelectorAll('#barraEsquerda .rich-panelbar-interior')].map((secao) => ({
    titulo: texto(secao.querySelector('.rich-panelbar-header')),
    itens: [...secao.querySelectorAll<HTMLElement>('.itemMenu')].flatMap((item) => {
      const link = item.closest<HTMLAnchorElement>('a');
      return link ? [{ rotulo: texto(item), abrir: () => link.click() }] : [];
    }),
  }));
}

function extrairConteudo(doc: Document): ConteudoTurma | null {
  if (doc.querySelector('.topico-aula, #ultimaNoticia')) {
    return { tipo: 'principal', noticia: extrairNoticia(doc), topicos: extrairTopicos(doc) };
  }
  const envio = extrairEnvioTarefa(doc);
  if (envio) return { tipo: 'enviar-tarefa', envio };
  const tarefas = extrairTarefas(doc);
  if (tarefas) return { tipo: 'tarefas', tarefas };
  const raiz = doc.querySelector('#conteudo');
  return raiz ? { tipo: 'secao', blocos: extrairBlocos(raiz) } : null;
}

export function extrairTurma(doc: Document): PaginaTurma | null {
  const nome = texto(doc.querySelector('#linkNomeTurma'));
  const conteudo = nome ? extrairConteudo(doc) : null;
  if (!conteudo) return null;

  return {
    codigo: texto(doc.querySelector('#linkCodigoTurma')).replace(/\s*-$/, ''),
    nome,
    info: texto(doc.querySelector('#linkPeriodoTurma')).replace(/^-\s*/, ''),
    avisos: extrairAvisos(doc),
    secaoAtual: conteudo.tipo === 'principal' ? 'Principal' : conteudo.tipo === 'secao' ? texto(doc.querySelector('#conteudo legend')) : 'Tarefas',
    conteudo,
    menu: extrairMenu(doc),
    voltarPortal: clicavel(doc.getElementById('formAcoesTurma:botaoPortalDiscente')),
  };
}
