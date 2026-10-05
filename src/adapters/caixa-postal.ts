import type { CaixaPostal, CompositorMensagem, LeituraMensagem } from '../domain/types';
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
    escrever: clicar(doc.getElementById('form:cmdMsg')),
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
    responder: clicar(doc.getElementById('form:resp')),
  };
}

const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

async function aguardar<T>(ler: () => T | null, limiteMs: number): Promise<T | null> {
  for (let t = 0; t < limiteMs; t += 150) {
    const valor = ler();
    if (valor) return valor;
    await esperar(150);
  }
  return ler();
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Tela /cxpostal/envia_mensagem.jsf: destinatário via sugestão RichFaces, corpo no TinyMCE da página. */
export function extrairCompositor(doc: Document): CompositorMensagem | null {
  const campo = doc.getElementById('form:usuarioAuto') as HTMLInputElement | null;
  const assunto = doc.getElementById('form:assunto') as HTMLInputElement | null;
  const texto_ = doc.getElementById('form:texto') as HTMLTextAreaElement | null;
  const botao = doc.getElementById('form:btnBotaoCancelar') as HTMLInputElement | null;
  if (!campo || !assunto || !texto_ || !botao) return null;
  const janela = doc.defaultView as (Window & { tinyMCE?: { get: (id: string) => { setContent: (html: string) => void } | null } }) | null;

  const destinatarios = (): string[] =>
    [...(doc.getElementById('form:tabDestinatarios')?.querySelectorAll('td') ?? [])]
      .map((td) => texto(td))
      .filter((t) => t && !/^remover$/i.test(t));

  const linhasSugestao = () => [...(doc.getElementById('form:suggestion:suggest')?.querySelectorAll('tr') ?? [])]
    .filter((tr) => tr.querySelector('.richfaces_suggestionSelectValue'));

  // O RichFaces só consulta o servidor quando recebe eventos de teclado reais no campo.
  const digitar = (valor: string) => {
    campo.focus();
    campo.value = valor;
    for (const tipo of ['keydown', 'keypress', 'input', 'keyup'] as const) {
      campo.dispatchEvent(new KeyboardEvent(tipo, { bubbles: true, key: 'a', keyCode: 65 }));
    }
  };

  return {
    destinatarios: destinatarios(),
    assunto: assunto.value,
    sugerir: async (termo) => {
      if (termo.trim().length < 3) return [];
      const antes = linhasSugestao().map((tr) => texto(tr)).join('|');
      digitar(termo);
      await aguardar(() => {
        const agora = linhasSugestao().map((tr) => texto(tr)).join('|');
        return agora && agora !== antes ? agora : null;
      }, 4000);
      return linhasSugestao().map((tr) => texto(tr.querySelector('.richfaces_suggestionSelectValue')));
    },
    adicionar: async (nome) => {
      const linha = linhasSugestao().find((tr) => texto(tr.querySelector('.richfaces_suggestionSelectValue')) === nome);
      if (!linha) return destinatarios();
      linha.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      linha.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      campo.value = nome;
      const quantos = destinatarios().length;
      (doc.getElementById('form:addDestinatario') as HTMLElement | null)?.click();
      return (await aguardar(() => (destinatarios().length > quantos ? destinatarios() : null), 5000)) ?? destinatarios();
    },
    enviar: (novoAssunto, corpo) => {
      assunto.value = novoAssunto;
      const html = corpo.split(/\n{2,}/).map((p) => `<p>${escaparHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
      const editor = janela?.tinyMCE?.get('form:texto');
      if (editor) editor.setContent(html);
      texto_.value = html;
      botao.click();
    },
    cancelar: clicar(doc.getElementById('form:entrada')),
  };
}
