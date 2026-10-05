import type { Bloco, LinhaTabela, Relatorio } from '../domain/types';

const texto = (el: Element | null | undefined): string => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

/** "Todas as Turmas": uma tabela.listagem com linhas td.periodo separando os semestres. */
export function extrairTurmasAnteriores(doc: Document): Relatorio | null {
  const tabela = doc.querySelector('#conteudo table.listagem');
  if (!tabela?.querySelector('td.periodo')) return null;

  const colunas = [...tabela.querySelectorAll('thead th')].map(texto).filter(Boolean);
  const blocos: { titulo: string; linhas: LinhaTabela[] }[] = [];
  for (const tr of tabela.querySelectorAll('tbody tr')) {
    const periodo = tr.querySelector('td.periodo');
    if (periodo) {
      blocos.push({ titulo: texto(periodo), linhas: [] });
      continue;
    }
    const celulas = [...tr.querySelectorAll('td')].map(texto);
    const link = tr.querySelector<HTMLElement>('a[onclick]');
    if (!celulas[0]) continue;
    if (blocos.length === 0) blocos.push({ titulo: '', linhas: [] });
    blocos[blocos.length - 1]!.linhas.push({ celulas: celulas.slice(0, colunas.length), nota: '', abrir: link ? () => link.click() : null });
  }

  const titulo = texto(doc.querySelector('#conteudo h2')).split('>').pop()?.trim() || 'Turmas';
  return {
    titulo,
    avisos: [],
    blocos: blocos.map((b): Bloco => ({ tipo: 'tabela', titulo: b.titulo, tabela: { colunas, linhas: b.linhas } })),
    voltar: () => doc.defaultView?.history.back(),
  };
}
