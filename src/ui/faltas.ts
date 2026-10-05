import { plataforma } from '../plataforma';

const CHAVE = 'sigaa-v2:faltas';
const CHAVE_AVISADAS = 'sigaa-v2:faltas-avisadas';
export const MARGEM_AVISO = 2;

export interface FaltasTurma {
  readonly faltas: number;
  readonly maximo: number;
  readonly em: number;
}

export const chaveTurma = (nome: string): string =>
  nome.replace(/^\S+\s+-\s+/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

function ler<T>(chave: string, padrao: T): T {
  try {
    return (JSON.parse(localStorage.getItem(chave) ?? 'null') as T | null) ?? padrao;
  } catch {
    return padrao;
  }
}

export function lerFaltas(): Record<string, FaltasTurma> {
  return ler<Record<string, FaltasTurma>>(CHAVE, {});
}

/** Guarda as faltas vistas na frequência da turma e avisa uma vez quando chega perto do limite. */
export function guardarFaltas(nome: string, faltas: number, maximo: number): void {
  const chave = chaveTurma(nome);
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...lerFaltas(), [chave]: { faltas, maximo, em: Date.now() } }));
    const avisadas = ler<Record<string, number>>(CHAVE_AVISADAS, {});
    const restantes = maximo - faltas;
    if (restantes <= MARGEM_AVISO && avisadas[chave] !== faltas) {
      localStorage.setItem(CHAVE_AVISADAS, JSON.stringify({ ...avisadas, [chave]: faltas }));
      plataforma.notificar?.(
        restantes < 0 ? 'Limite de faltas ultrapassado' : 'Perto do limite de faltas',
        restantes < 0 ? `${nome}: ${faltas} de ${maximo}.` : `${nome}: pode faltar só mais ${restantes}.`,
      );
    }
  } catch {
    /* sem armazenamento: só não lembra */
  }
}
