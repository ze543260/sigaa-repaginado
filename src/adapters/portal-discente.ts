import type { Atalho, Atividade, Atualizacao, Par, PortalDiscente } from '../domain/types';
import { extrairBlocos } from './blocos';
import { extrairMenu } from './menu';
import { extrairTurmas } from './portal-turmas';

const DATA = /\d{2}\/\d{2}\/\d{4}/;

const texto = (el: Element | null | undefined): string =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const clicavel = (a: HTMLAnchorElement | null): (() => void) | null => (a ? () => a.click() : null);

const ATALHOS = [
  'Caixa Postal',
  'Mensagens',
  'Meus Dados Pessoais',
  'Atualizar Foto e Perfil',
  'Alterar senha',
  'Calendário Acadêmico de Graduação',
  'Norma de Graduação',
  'Ver turmas anteriores',
  'Abrir Chamado',
] as const;

function extrairDados(doc: Document): Par[] {
  return [...doc.querySelectorAll('#agenda-docente > table > tbody > tr, #agenda-docente > table > tr')].flatMap((linha) => {
    const [rotulo, valor] = linha.querySelectorAll(':scope > td');
    const r = texto(rotulo);
    return r.endsWith(':') && valor ? [{ rotulo: r.slice(0, -1), valor: texto(valor) }] : [];
  });
}

function extrairIndices(doc: Document): Par[] {
  return [...doc.querySelectorAll('#agenda-docente acronym')].flatMap((sigla) => {
    const valor = texto(sigla.closest('td')?.nextElementSibling);
    return valor
      ? [{ rotulo: texto(sigla).replace(/:$/, ''), valor, descricao: sigla.getAttribute('title') ?? undefined }]
      : [];
  });
}

function extrairIntegralizacao(doc: Document): { integralizacao: Par[]; percentualIntegralizado: number | null } {
  const integralizacao = [...doc.querySelectorAll('#agenda-docente tr')].flatMap((linha) => {
    const [rotulo, valor] = linha.querySelectorAll(':scope > td');
    const r = texto(rotulo);
    return /^CH\./.test(r) && valor ? [{ rotulo: r.replace(/^CH\.\s*/, ''), valor: texto(valor) }] : [];
  });
  const pct = [...doc.querySelectorAll('#agenda-docente')].map((el) => el.textContent ?? '').join(' ').match(/(\d+)%\s*Integralizado/)?.[1];
  return { integralizacao, percentualIntegralizado: pct ? Number(pct) : null };
}

function extrairAtualizacoes(doc: Document): Atualizacao[] {
  return [...doc.querySelectorAll('#atualizacoes-turma .rotator > table')].map((bloco) => {
    const [cabecalho, corpo] = bloco.querySelectorAll('td');
    const link = cabecalho?.querySelector<HTMLAnchorElement>('a') ?? null;
    return {
      data: texto(cabecalho).match(DATA)?.[0] ?? '',
      turma: texto(link).replace(/\s*\(\d{4}\.\d\)$/, ''),
      descricao: texto(corpo),
      abrir: clicavel(link),
    };
  });
}

function statusAtividade(linha: Element): Atividade['status'] {
  const icone = linha.querySelector('td:first-child img')?.getAttribute('src') ?? '';
  if (icone.includes('semana')) return 'semana';
  if (icone.includes('mes')) return 'mes';
  return linha.querySelector('font[color="gray"]') ? 'passada' : 'futura';
}

function extrairAtividades(doc: Document): Atividade[] {
  return [...doc.querySelectorAll('#avaliacao-portal tbody tr')].flatMap((linha) => {
    const celulas = linha.querySelectorAll(':scope > td');
    if (celulas.length < 3) return [];
    const info = celulas[2];
    const tipo = texto(info?.querySelector('strong')).replace(/:$/, '');
    const link = info?.querySelector<HTMLAnchorElement>('a') ?? null;
    const turma = (tipo ? texto(info).split(tipo)[0] : texto(info))?.trim() ?? '';
    const descricao = link ? texto(link) : texto(info).split(`${tipo}:`)[1]?.trim() ?? texto(info);
    return [{
      data: texto(celulas[1]),
      turma,
      tipo,
      descricao,
      status: statusAtividade(linha),
      abrir: clicavel(link),
    }];
  });
}

function extrairAtalhos(doc: Document): Atalho[] {
  const links = [...doc.querySelectorAll<HTMLAnchorElement>('a')];
  return ATALHOS.flatMap((rotulo) => {
    const link = links.find((a) => texto(a).toLowerCase() === rotulo.toLowerCase());
    return link ? [{ rotulo, abrir: () => link.click() }] : [];
  });
}

/** Envia uma ação do menu por fetch (como o JSCookMenu faria) e devolve o HTML da resposta. */
function buscarAcaoDoMenu(doc: Document, metodo: string): (() => Promise<Document>) | null {
  const fontes = [...doc.querySelectorAll('script')].map((s) => s.textContent ?? '').join('\n');
  const acao = fontes.match(new RegExp(String.raw`'([^']*#\{\s*${metodo.replace('.', String.raw`\.`)}\s*\})'`))?.[1];
  const form = doc.getElementById('menu:form_menu_discente');
  if (!acao || !form || form.tagName !== 'FORM') return null;
  const formulario = form as HTMLFormElement;

  return async () => {
    const corpo = new URLSearchParams();
    for (const [k, v] of new FormData(formulario)) corpo.append(k, String(v));
    corpo.set('jscook_action', acao);
    const resposta = await fetch(formulario.action, { method: 'POST', body: corpo, credentials: 'include' });
    if (!resposta.ok || !(resposta.headers.get('content-type') ?? '').includes('html')) throw new Error(`SIGAA ${resposta.status}`);
    // O SIGAA responde em ISO-8859-1.
    const html = new TextDecoder('iso-8859-1').decode(await resposta.arrayBuffer());
    return new DOMParser().parseFromString(html, 'text/html');
  };
}

export function extrairPortal(doc: Document): PortalDiscente {
  const buscarRelatorioNotas = buscarAcaoDoMenu(doc, 'relatorioNotasAluno.gerarRelatorio');
  return {
    nome: texto(doc.querySelector('#perfil-docente .info-docente .nome')) || texto(doc.querySelector('#info-usuario .usuario')),
    foto: doc.querySelector<HTMLImageElement>('#perfil-docente .foto img')?.src ?? null,
    semestre: texto(doc.querySelector('#info-usuario .periodo-atual strong')),
    turmas: extrairTurmas(doc),
    dados: extrairDados(doc),
    indices: extrairIndices(doc),
    ...extrairIntegralizacao(doc),
    atualizacoes: extrairAtualizacoes(doc),
    atividades: extrairAtividades(doc),
    atalhos: extrairAtalhos(doc),
    menu: extrairMenu(doc),
    buscarNotas: buscarRelatorioNotas
      ? async () => {
          const pagina = await buscarRelatorioNotas();
          const corpo = pagina.querySelector('#relatorio') ?? pagina.body;
          return corpo ? extrairBlocos(corpo) : [];
        }
      : null,
  };
}
