import type { Bloco, Tabela } from './types';

export const MEDIA_APROVACAO = 6;
const LIMITE_FALTAS = 0.25;

const NAO_NOTA = /falta|freq|situa|c[oó]d|^ch$|carga|turma|ano|per[ií]odo|cr[eé]d|hor[aá]rio|local|docente|componente|disciplina/i;
const CABECALHO_NOTA = /unidade|nota|prova|avalia|^av|^n\d|recupera|resultado|m[eé]dia/i;
const RESULTADO = /m[eé]dia|resultado|final|^nota$/i;
const RECUPERACAO = /recupera/i;

export function numero(texto: string | undefined): number | null {
  if (!texto) return null;
  const m = texto.trim().match(/^(\d{1,2})(?:[.,](\d+))?$/);
  if (!m) return null;
  const v = Number(`${m[1]}.${m[2] ?? 0}`);
  return v >= 0 && v <= 10 ? v : null;
}

const vazio = (t: string | undefined): boolean => !t || /^[-–—\s]*$/.test(t);

export interface LinhaNotas {
  readonly rotulo: string;
  readonly codigo: string;
  readonly avaliacoes: readonly { readonly nome: string; readonly nota: number | null }[];
  readonly recuperacao: number | null;
  readonly resultado: number | null;
  readonly faltas: number | null;
  readonly situacao: string;
}

export interface AnaliseNotas {
  readonly colunas: readonly number[];
  readonly linhas: readonly LinhaNotas[];
}

/** Reconhece tabelas de notas: colunas com cabeçalho de nota ou cujos valores preenchidos são todos de 0 a 10. */
export function analisarNotas(tabela: Tabela): AnaliseNotas | null {
  const { colunas, linhas } = tabela;
  if (linhas.length === 0 || colunas.length === 0) return null;
  const colunasNota = colunas.flatMap((c, i) => {
    if (NAO_NOTA.test(c)) return [];
    const preenchidos = linhas.map((l) => l.celulas[i]).filter((v) => !vazio(v));
    if (!preenchidos.every((v) => numero(v) !== null)) return [];
    return preenchidos.length > 0 || CABECALHO_NOTA.test(c) ? [i] : [];
  });
  if (!colunasNota.some((i) => preenchidosEm(tabela, i))) return null;

  const achar = (re: RegExp) => colunas.findIndex((c) => re.test(c));
  const iNome = achar(/disciplina|componente|nome/i);
  const iCodigo = achar(/c[oó]d/i);
  const iFaltas = achar(/falta/i);
  const iSituacao = achar(/situa/i);
  const iResultado = colunasNota.find((i) => RESULTADO.test(colunas[i] ?? ''));
  const iRecuperacao = colunasNota.find((i) => RECUPERACAO.test(colunas[i] ?? ''));

  return {
    colunas: colunasNota,
    linhas: linhas.map((l, n) => ({
      rotulo: (iNome >= 0 ? l.celulas[iNome] : l.celulas[0])?.split('\n')[0] ?? `Linha ${n + 1}`,
      codigo: iCodigo >= 0 ? (l.celulas[iCodigo] ?? '') : '',
      avaliacoes: colunasNota
        .filter((i) => i !== iResultado && i !== iRecuperacao)
        .map((i) => ({ nome: (colunas[i] ?? '').replace(/\.\s*/, ' '), nota: numero(l.celulas[i]) })),
      recuperacao: iRecuperacao === undefined ? null : numero(l.celulas[iRecuperacao]),
      resultado: iResultado === undefined ? null : numero(l.celulas[iResultado]),
      faltas: iFaltas >= 0 && /^\d+$/.test(l.celulas[iFaltas]?.trim() ?? '') ? Number(l.celulas[iFaltas]) : null,
      situacao: iSituacao >= 0 && !vazio(l.celulas[iSituacao]) ? (l.celulas[iSituacao] ?? '') : '',
    })),
  };
}

function preenchidosEm(tabela: Tabela, i: number): boolean {
  return tabela.linhas.some((l) => numero(l.celulas[i]) !== null);
}

export type Previsao =
  | { readonly tipo: 'encerrada'; readonly media: number; readonly aprovado: boolean }
  | { readonly tipo: 'precisa'; readonly nota: number; readonly faltantes: number }
  | { readonly tipo: 'recuperacao'; readonly media: number; readonly nota: number }
  | { readonly tipo: 'impossivel'; readonly faltantes: number }
  | { readonly tipo: 'com-recuperacao'; readonly nota: number; readonly faltantes: number }
  | { readonly tipo: 'sem-notas' }
  | { readonly tipo: 'sem-dados' };

const arredondar = (n: number): number => Math.max(0, Math.ceil(n * 10 - 1e-9) / 10);

/**
 * Regra da UNIFEI (conferida no relatório de notas): resultado é a média das unidades,
 * e a recuperação substitui a menor delas.
 */
export function prever(linha: LinhaNotas, alvo = MEDIA_APROVACAO): Previsao {
  const n = linha.avaliacoes.length;
  if (n === 0) return { tipo: 'sem-dados' };
  if (linha.resultado !== null && linha.situacao) {
    return { tipo: 'encerrada', media: linha.resultado, aprovado: /aprovad/i.test(linha.situacao) && !/reprovad/i.test(linha.situacao) };
  }
  const feitas = linha.avaliacoes.flatMap((a) => (a.nota === null ? [] : [a.nota]));
  const soma = feitas.reduce((t, x) => t + x, 0);
  const faltantes = n - feitas.length;

  if (faltantes === 0) {
    const media = soma / n;
    if (media >= alvo || linha.recuperacao !== null) {
      const final = linha.recuperacao === null ? media : (soma - Math.min(...feitas) + Math.max(linha.recuperacao, Math.min(...feitas))) / n;
      return { tipo: 'encerrada', media: final, aprovado: final >= alvo };
    }
    const nota = alvo * n - (soma - Math.min(...feitas));
    return nota > 10 ? { tipo: 'impossivel', faltantes: 0 } : { tipo: 'recuperacao', media, nota: arredondar(nota) };
  }

  if (feitas.length === 0) return { tipo: 'sem-notas' };
  const nota = (alvo * n - soma) / faltantes;
  if (nota > 10) {
    // A recuperação troca a menor nota: conta como mais uma avaliação no lugar dela.
    if (linha.recuperacao === null) {
      const comRec = (alvo * n - (soma - Math.min(...feitas))) / (faltantes + 1);
      if (comRec <= 10) return { tipo: 'com-recuperacao', nota: arredondar(comRec), faltantes };
    }
    return { tipo: 'impossivel', faltantes };
  }
  return { tipo: 'precisa', nota: arredondar(nota), faltantes };
}

export interface Semestre {
  readonly periodo: string;
  readonly linhas: readonly LinhaNotas[];
  readonly media: number | null;
  readonly aprovadas: number;
  readonly reprovadas: number;
  readonly emCurso: boolean;
}

/** Agrupa as tabelas do relatório "Minhas Notas" (uma por semestre, legenda "2026.1"). */
export function semestresDeNotas(blocos: readonly Bloco[]): Semestre[] {
  return blocos.flatMap((b) => {
    if (b.tipo !== 'tabela' || !/^\d{4}\.\d$/.test(b.titulo.trim())) return [];
    const analise = analisarNotas(b.tabela);
    if (!analise) return [];
    const resultados = analise.linhas.flatMap((l) => (l.resultado === null || !l.situacao ? [] : [l.resultado]));
    return [{
      periodo: b.titulo.trim(),
      linhas: analise.linhas,
      media: resultados.length ? resultados.reduce((t, x) => t + x, 0) / resultados.length : null,
      aprovadas: analise.linhas.filter((l) => /aprovad/i.test(l.situacao) && !/reprovad/i.test(l.situacao)).length,
      reprovadas: analise.linhas.filter((l) => /reprovad|trancad|cancelad/i.test(l.situacao)).length,
      emCurso: analise.linhas.some((l) => !l.situacao),
    }];
  }).sort((a, b) => a.periodo.localeCompare(b.periodo));
}

export interface Faltas {
  readonly faltas: number;
  readonly maximo: number;
}

function textoDosBlocos(blocos: readonly Bloco[]): string {
  return blocos
    .map((b) => {
      switch (b.tipo) {
        case 'pares':
          return b.pares.map((p) => `${p.rotulo}: ${p.valor}`).join('\n');
        case 'texto':
          return b.paragrafos.join('\n');
        case 'tabela':
          return b.tabela.linhas.map((l) => l.celulas.map((c, i) => `${b.tabela.colunas[i] ?? ''}: ${c}`).join('\n')).join('\n');
        default:
          return '';
      }
    })
    .join('\n');
}

/** Extrai total de faltas e limite permitido de uma página de frequência. */
export function analisarFaltas(blocos: readonly Bloco[]): Faltas | null {
  const texto = textoDosBlocos(blocos);
  const total =
    texto.match(/total\s+de\s+faltas\D{0,20}(\d+)/i)?.[1] ??
    texto.match(/(?:n[uú]mero|qtd\.?|quantidade)\s+de\s+faltas\D{0,20}(\d+)/i)?.[1];
  const maximo =
    texto.match(/(?:m[aá]ximo\s+de\s+faltas|faltas\s+permitidas|limite\s+de\s+faltas)\D{0,40}(\d+)/i)?.[1] ??
    (() => {
      const ch = texto.match(/carga\s+hor[aá]ria\D{0,20}(\d+)/i)?.[1];
      return ch ? String(Math.floor(Number(ch) * LIMITE_FALTAS)) : undefined;
    })();

  const registros = blocos.flatMap((b) => (b.tipo === 'tabela' ? b.tabela.linhas.flatMap((l) => l.celulas) : []));
  const marcadas = registros.filter((c) => /^(faltou|ausente|falta)$/i.test(c.trim())).length;

  const faltas = total !== undefined ? Number(total) : marcadas > 0 ? marcadas : null;
  if (faltas === null || maximo === undefined) return null;
  return { faltas, maximo: Number(maximo) };
}
