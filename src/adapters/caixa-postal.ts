import type { CaixaPostal, LeituraMensagem } from '../domain/types';
import { plataforma } from '../plataforma';
import { texto } from './blocos';

const clicar = (el: Element | null): (() => void) | null =>
  el && 'click' in el ? () => (el as HTMLElement).click() : null;

const sem = (s: string): string => s.replace(/^ +| +$/g, '').replace(/^\s*-\s*/, '').trim();

/** Caixa de entrada/saída/lixeira em sigadmin.unifei.edu.br/cxpostal/caixa_postal.jsf. */
export function extrairCaixaPostal(doc: Document): CaixaPostal | null {
  const corpo = doc.getElementById('form:itens:tb');
  const lista = doc.getElementById('mensagens');
  if (!lista) return null;

  const mensagens = [...(corpo?.children ?? [])].flatMap((tr) => {
    const resumo = tr.querySelector('[id$="msgResumido"]');
    if (!resumo) return [];
    const envelope = tr.querySelector<HTMLImageElement>('img[id*="envelope"]');
    return [{
      assunto: texto(resumo).replace(/\.\.\.$/, '…'),
      remetente: texto(tr.querySelector('[id$="panelRemetente"]')) || texto(tr.querySelector('[id$="colunaRemetente"]')),
      data: texto(tr.querySelector('[id$="datacadastrostrMsg"]')),
      lida: !/n[aã]o lida/i.test(envelope?.alt ?? ''),
      anexo: !!tr.querySelector('img[src*="anexo"]'),
      abrir: clicar(resumo),
    }];
  });

  const pasta = (id: string) => clicar(doc.getElementById(id));
  return {
    pasta: texto(lista.querySelector('caption')) || 'Caixa de Entrada',
    mensagens,
    pastas: [
      { rotulo: 'Entrada', abrir: pasta('form:cxEntrada') },
      { rotulo: 'Enviadas', abrir: pasta('form:cxSaida') },
      { rotulo: 'Lixeira', abrir: pasta('form:cmdLixeira') },
    ].flatMap((p) => (p.abrir ? [{ rotulo: p.rotulo, abrir: p.abrir }] : [])),
    marcarTodasLidas: (() => {
      const select = doc.getElementById('form:selectOpMarcarMsg');
      if (!select || select.tagName !== 'SELECT') return null;
      return () => {
        (select as HTMLSelectElement).value = '11';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      };
    })(),
    voltarSigaa: clicar(doc.querySelector('a[href*="entrarSistema"]')),
  };
}

/** Leitura de mensagem em /cxpostal/ver_mensagem.jsf. */
export function extrairMensagem(doc: Document): LeituraMensagem | null {
  const tabela = doc.querySelector('table.lerMsg');
  if (!tabela) return null;
  const campo = (rotulo: RegExp): string => {
    const linha = [...tabela.querySelectorAll('thead tr')].find((tr) => rotulo.test(texto(tr.querySelector('strong'))));
    return sem(texto(linha?.querySelectorAll('td')[1]));
  };

  const anexos = [...tabela.querySelectorAll('a[id*="visualizar"]')].map((a, i) => ({
    rotulo: `Anexo ${i + 1}`,
    abrir: () => {
      plataforma.ultimoDownload = Date.now();
      plataforma.prepararDownload();
      (a as HTMLElement).click();
    },
  }));

  return {
    assunto: campo(/assunto/i),
    remetente: campo(/remetente/i).replace(/^\d+\s*-\s*/, ''),
    unidade: campo(/unidade/i),
    data: campo(/data/i),
    automatica: /gerada automaticamente/i.test(texto(tabela.querySelector('tbody'))),
    paragrafos: (doc.getElementById('mensagem')?.textContent ?? '')
      .split(/\n\s*\n|\n(?=\S+:\s)/)
      .map((p) => p.replace(/ /g, ' ').trim())
      .filter(Boolean),
    anexos,
    voltar: clicar(doc.getElementById('form:entrada')),
    anterior: clicar(doc.getElementById('form:anterior')),
    proxima: clicar(doc.getElementById('form:proxima')),
  };
}
