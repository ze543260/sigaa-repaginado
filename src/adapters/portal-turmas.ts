import type { Turma } from '../domain/types';

const CABECALHO = 'componente curricular';

const texto = (el: Element | null | undefined): string =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

function acharTabela(doc: Document): HTMLTableElement | null {
  const tabelas = doc.querySelectorAll<HTMLTableElement>('#turmas-portal table, table');
  return (
    [...tabelas].find((t) =>
      [...t.querySelectorAll('th, td')].some((c) => texto(c).toLowerCase() === CABECALHO),
    ) ?? null
  );
}

export function extrairTurmas(doc: Document): Turma[] {
  const tabela = acharTabela(doc);
  if (!tabela) return [];

  return [...tabela.querySelectorAll('tr')].flatMap((linha) => {
    const celulas = linha.querySelectorAll('td');
    const link = celulas[0]?.querySelector<HTMLAnchorElement>('a');
    if (!link || celulas.length < 3) return [];

    const titulo = texto(link);
    const [codigo = '', ...resto] = titulo.split(' - ');
    const temCodigo = resto.length > 0;
    return [{
      codigo: temCodigo ? codigo : '',
      nome: temCodigo ? resto.join(' - ') : titulo,
      local: texto(celulas[1]),
      horario: texto(celulas[2]),
      acessar: () => link.click(),
    }];
  });
}
