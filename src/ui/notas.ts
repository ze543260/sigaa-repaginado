import { useEffect, useState } from 'react';
import { semestresDeNotas, type LinhaNotas, type Semestre } from '../domain/desempenho';
import type { PortalDiscente } from '../domain/types';
import { plataforma } from '../plataforma';
import { fmtNota } from './PainelNotas';

const CHAVE = 'sigaa-v2:notas-semestres';
const INTERVALO_MS = 20 * 60_000;

interface Cache {
  readonly buscadoEm: number;
  readonly semestres: readonly Semestre[];
}

function lerCache(): Cache | null {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as Cache | null;
  } catch {
    return null;
  }
}

const assinatura = (l: LinhaNotas): string =>
  [...l.avaliacoes.map((a) => a.nota), l.recuperacao, l.resultado].map((n) => (n === null ? '' : String(n))).join('|');

/** Descreve as notas que apareceram desde a busca anterior. */
function novidades(antes: readonly Semestre[], depois: readonly Semestre[]): string[] {
  const anteriores = new Map(antes.flatMap((s) => s.linhas.map((l) => [`${s.periodo}|${l.rotulo}`, l] as const)));
  return depois.flatMap((s) =>
    s.linhas.flatMap((l) => {
      const velha = anteriores.get(`${s.periodo}|${l.rotulo}`);
      if (!velha || assinatura(velha) === assinatura(l)) return [];
      const nova = l.avaliacoes.find((a, i) => a.nota !== null && a.nota !== velha.avaliacoes[i]?.nota);
      const nome = l.rotulo.charAt(0) + l.rotulo.slice(1).toLowerCase();
      if (nova) return [`${nome}: ${nova.nome} ${fmtNota(nova.nota ?? 0)}`];
      if (l.resultado !== null && l.resultado !== velha.resultado) return [`${nome}: média ${fmtNota(l.resultado)}`];
      return [`${nome}: notas atualizadas`];
    }),
  );
}

/**
 * Mantém as notas do semestre à mão no portal: usa o cache e, a cada 20 min, busca o relatório
 * "Minhas Notas" em segundo plano, avisando quando sai nota nova.
 */
export function useNotas(portal: PortalDiscente): Semestre | null {
  const [cache, setCache] = useState<Cache | null>(lerCache);

  useEffect(() => {
    const buscar = portal.buscarNotas;
    if (!buscar || (cache && Date.now() - cache.buscadoEm < INTERVALO_MS)) return;
    let ativo = true;
    buscar()
      .then((blocos) => {
        const semestres = semestresDeNotas(blocos);
        if (!ativo || semestres.length === 0) return;
        const novas = cache ? novidades(cache.semestres, semestres) : [];
        const atualizado: Cache = { buscadoEm: Date.now(), semestres };
        try {
          localStorage.setItem(CHAVE, JSON.stringify(atualizado));
        } catch {
          /* sem armazenamento: usa só nesta visita */
        }
        setCache(atualizado);
        if (novas.length > 0) {
          plataforma.notificar?.(novas.length === 1 ? 'Nota nova' : `${novas.length} notas novas`, novas.join('\n'));
        }
      })
      .catch(() => {
        /* SIGAA lento ou fora: tenta de novo na próxima abertura do portal */
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal]);

  return cache?.semestres.find((s) => s.emCurso) ?? null;
}
