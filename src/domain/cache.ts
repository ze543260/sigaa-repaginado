import type { Atividade, Par, PortalDiscente, Turma } from './types';

const CHAVE = 'sigaa-v2:cache-portal';

export interface PortalSalvo {
  readonly nome: string;
  readonly semestre: string;
  readonly turmas: readonly Omit<Turma, 'acessar'>[];
  readonly atividades: readonly Omit<Atividade, 'abrir'>[];
  readonly indices: readonly Par[];
  readonly percentualIntegralizado: number | null;
  readonly salvoEm: number;
}

export function salvarPortal(p: PortalDiscente): void {
  const dados: PortalSalvo = {
    nome: p.nome,
    semestre: p.semestre,
    turmas: p.turmas.map(({ codigo, nome, local, horario }) => ({ codigo, nome, local, horario })),
    atividades: p.atividades.map(({ data, turma, tipo, descricao, status }) => ({ data, turma, tipo, descricao, status })),
    indices: p.indices,
    percentualIntegralizado: p.percentualIntegralizado,
    salvoEm: Date.now(),
  };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    /* sem armazenamento: só não haverá versão offline */
  }
}

export function lerPortalSalvo(): PortalSalvo | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as PortalSalvo) : null;
  } catch {
    return null;
  }
}
