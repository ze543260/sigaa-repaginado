import { PiadaDoContexto, usePiada } from './Surpresas';
import { tituloBr } from '../domain/texto';
import { useEffect, useState } from 'react';
import { diaSigaaHoje, horaConfirmada, horariosDoCodigo, intervaloDoBloco, ordemHorario, relativo, resumirHorario, siglaDisciplina } from '../domain/horario';
import { cn } from './cn';
import { EstadoVazio } from './IlustracaoLogin';
import type { Turma } from '../domain/types';
import { Card, CardDescription, CardHeader, CardTitle } from './components/Card';

interface Props {
  readonly turmas: readonly Turma[];
}

const Seta = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 opacity-40" aria-hidden="true">
    <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export function useAgora(intervaloMs = 30_000): Date {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

export const hhmm = (d: Date): string => d.toTimeString().slice(0, 5);

export function aulasDoDia(turmas: readonly Turma[], agora: Date) {
  const dia = diaSigaaHoje(agora);
  return turmas
    .flatMap((t) => {
      const aulas = horariosDoCodigo(t.horario)
        .filter((h) => h.dia === dia)
        .sort((a, b) => ordemHorario(a) - ordemHorario(b));
      const primeira = aulas[0];
      const ultima = aulas[aulas.length - 1];
      return primeira && ultima ? [{ turma: t, primeira, ultima }] : [];
    })
    .sort((a, b) => ordemHorario(a.primeira) - ordemHorario(b.primeira));
}

export function AulasDeHoje({ turmas }: Props) {
  const agora = useAgora();
  const temPiada = !!usePiada('sem-aulas');
  const hoje = aulasDoDia(turmas, agora);

  if (hoje.length === 0) {
    return (
      <EstadoVazio className="items-start p-1 text-left sm:flex-row sm:items-center">
        <PiadaDoContexto contexto="sem-aulas" className="font-mono" /> {!temPiada && 'Sem aulas hoje.'}
      </EstadoVazio>
    );
  }

  return (
    <ol className="cascata relative space-y-2 pl-14 before:absolute before:bottom-2 before:left-[2.6rem] before:top-2 before:w-px before:bg-border">
      {hoje.map(({ turma, primeira, ultima }) => {
        const aulas = ultima.aula - primeira.aula + 1;
        const tempo = intervaloDoBloco(agora, primeira, ultima);
        const estado = !tempo ? null : agora >= tempo.fim ? 'passou' : agora >= tempo.inicio ? 'agora' : 'depois';
        const aprox = horaConfirmada(primeira) ? '' : '~';
        return (
          <li key={turma.codigo || turma.nome} className={cn('relative transition-opacity', estado === 'passou' && 'opacity-50')}>
            <span className="absolute -left-14 top-3 w-8 text-right font-mono text-[11px] leading-tight text-muted-foreground">
              {tempo ? `${aprox}${hhmm(tempo.inicio)}` : `${primeira.turno}${primeira.aula}`}
              {tempo ? <span className="block">{hhmm(tempo.fim)}</span> : aulas > 1 && <span className="block">–{ultima.turno}{ultima.aula}</span>}
            </span>
            <span
              className={cn('absolute -left-[0.95rem] top-4 h-2 w-2 rounded-full bg-destaque', estado === 'agora' && 'pulso')}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={turma.acessar}
              style={{ minHeight: `${3 + aulas * 0.75}rem` }}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left transition-[background-color,transform] hover:bg-accent active:scale-[0.98]',
                estado === 'agora' && 'border-destaque',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-snug">{tituloBr(turma.nome)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {turma.local} · {aulas} {aulas === 1 ? 'aula' : 'aulas'}
                </span>
                {tempo && estado !== 'passou' && (
                  <span className={cn('mt-1 block text-xs font-medium', estado === 'agora' ? 'text-destaque-texto' : 'text-muted-foreground')}>
                    {estado === 'agora' ? `Agora · termina ${relativo(tempo.fim, agora)}` : `Começa ${relativo(tempo.inicio, agora)}`}
                  </span>
                )}
              </span>
              <Seta />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function ListaTurmas({ turmas }: Props) {
  if (turmas.length === 0) {
    return (
      <Card className="border-dashed p-10 text-center text-sm text-muted-foreground">
        Nenhuma turma encontrada neste semestre.
      </Card>
    );
  }

  return (
    <>
      <ul className="cascata divide-y overflow-hidden rounded-3xl border bg-card sm:hidden">
        {turmas.map((t) => (
          <li key={t.codigo || t.nome}>
            <button
              type="button"
              onClick={t.acessar}
              className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left transition-colors active:bg-accent"
            >
              <span className="w-11 shrink-0 font-mono text-xs font-bold">{siglaDisciplina(t.nome)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{tituloBr(t.nome)}</span>
                <span className="block truncate text-xs text-muted-foreground">{resumirHorario(t.horario)}</span>
              </span>
              <Seta />
            </button>
          </li>
        ))}
      </ul>

      <ul className="hidden gap-3 sm:grid sm:grid-cols-2">
        {turmas.map((t) => (
          <li key={t.codigo || t.nome}>
            <button
              type="button"
              onClick={t.acessar}
              className="block h-full w-full rounded-3xl text-left transition-transform duration-150 active:scale-[0.98]"
            >
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader className="p-5">
                  <CardTitle className="leading-snug">{tituloBr(t.nome)}</CardTitle>
                  <CardDescription className="text-xs">{t.local}</CardDescription>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="rounded-full border px-2 py-0.5 font-mono text-muted-foreground">{t.horario}</span>
                    <span className="text-muted-foreground">{resumirHorario(t.horario)}</span>
                  </div>
                </CardHeader>
              </Card>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
