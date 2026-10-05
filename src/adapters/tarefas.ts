import type { EnvioTarefa, Tarefa } from '../domain/types';

const texto = (el: Element | null | undefined): string => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

function paragrafos(el: Element | null | undefined): string[] {
  if (!el) return [];
  const ps = [...el.querySelectorAll('p, li')].map(texto).filter(Boolean);
  return ps.length > 0 ? ps : [texto(el)].filter(Boolean);
}

/** "de 24/09/2026 às 14h15 a 11/10/2026 às 23h59" → ["24/09/2026 14:15", "11/10/2026 23:59"]. */
function datasDoPeriodo(periodo: string): [string, string] {
  const datas = [...periodo.matchAll(/(\d{2}\/\d{2}\/\d{4})\D+?(\d{1,2})h(\d{2})/g)].map(([, d, h, m]) => `${d} ${h?.padStart(2, '0')}:${m}`);
  return [datas[0] ?? '', datas[1] ?? ''];
}

/** Lista em /ava/TarefaTurma/listar.jsf: cada tarefa ocupa duas linhas (dados e descrição). */
export function extrairTarefas(doc: Document): Tarefa[] | null {
  const tabelas = [...doc.querySelectorAll('table.tarefas table.listing')];
  if (tabelas.length === 0) return null;
  return tabelas.flatMap((tabela) => {
    const linhas = [...tabela.querySelectorAll(':scope > tbody > tr')];
    return linhas.flatMap((tr, i) => {
      const titulo = tr.querySelector('td.first[style*="bold"]');
      if (!titulo) return [];
      const celulas = [...tr.children];
      const enviar = tr.querySelector<HTMLElement>('a[title="Enviar tarefa"]');
      const visualizar = tr.querySelector<HTMLElement>('a[title^="Visualizar"]');
      const [inicio, fim] = datasDoPeriodo(texto(celulas[2]));
      return [{
        titulo: texto(titulo),
        inicio,
        fim,
        possuiNota: /sim/i.test(texto(celulas[3])),
        enviada: !!visualizar,
        corrigida: !!tr.querySelector('img[src*="accept"]'),
        paragrafos: paragrafos(linhas[i + 1]?.querySelector('td.first')),
        enviar: enviar ? () => enviar.click() : null,
        visualizar: visualizar ? () => visualizar.click() : null,
      }];
    });
  });
}

/** Formulário em /ava/TarefaTurma/enviarTarefa.jsf. O envio preenche os campos originais e clica no botão do SIGAA. */
export function extrairEnvioTarefa(doc: Document): EnvioTarefa | null {
  const fieldset = doc.querySelector('fieldset.responderTarefa');
  const form = fieldset?.closest('form');
  if (!fieldset || !form) return null;

  const campoPorRotulo = (rotulo: RegExp) =>
    [...fieldset.querySelectorAll('li')].find((li) => rotulo.test(texto(li.querySelector('label'))))?.querySelector('.campo');

  const textos = [...form.querySelectorAll<HTMLTextAreaElement>('textarea')].map((t) => ({
    id: t.id || t.name,
    rotulo: texto(t.closest('li')?.querySelector('label')).replace(/:$/, '') || 'Texto',
    obrigatorio: !!t.closest('li')?.querySelector('.required'),
  }));
  const arquivos = [...form.querySelectorAll<HTMLInputElement>('input[type="file"]')].map((i) => ({
    id: i.id || i.name,
    rotulo: texto(i.closest('li')?.querySelector('label')).replace(/:$/, '') || 'Arquivo',
  }));
  const botaoEnviar = form.querySelector<HTMLInputElement>('input[type="submit"][value="Enviar"]');
  const botaoCancelar = form.querySelector<HTMLInputElement>('input[type="submit"][value="Cancelar"]');
  const janela = doc.defaultView;

  return {
    titulo: texto(campoPorRotulo(/nome da tarefa/i)),
    periodo: texto(campoPorRotulo(/per[ií]odo/i)),
    paragrafos: paragrafos(campoPorRotulo(/descri/i)),
    textos,
    arquivos,
    enviar: (valores, anexos) => {
      for (const t of textos) {
        const campo = form.querySelector<HTMLTextAreaElement>(`[id="${t.id}"], [name="${t.id}"]`);
        if (campo) campo.value = valores[t.id] ?? '';
      }
      for (const a of arquivos) {
        const arquivo = anexos[a.id];
        const campo = form.querySelector<HTMLInputElement>(`[id="${a.id}"], [name="${a.id}"]`);
        if (!campo || !arquivo || !janela) continue;
        // A FileList precisa nascer no realm da página do SIGAA para ser aceita pelo input dela.
        const transferencia = new (janela as Window & typeof globalThis).DataTransfer();
        transferencia.items.add(arquivo);
        campo.files = transferencia.files;
      }
      botaoEnviar?.click();
    },
    cancelar: botaoCancelar
      ? () => {
          botaoCancelar.removeAttribute('onclick');
          botaoCancelar.click();
        }
      : null,
  };
}
