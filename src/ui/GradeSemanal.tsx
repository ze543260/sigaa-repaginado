import { diaSigaaHoje, faixaHoraria, horariosDoCodigo, NOME_DIA_CURTO, ordemHorario, siglaDisciplina, type Horario } from '../domain/horario';
import type { Turma } from '../domain/types';
import { cn } from './cn';

interface Props {
  readonly turmas: readonly Turma[];
}

interface Bloco {
  readonly turma: Turma;
  readonly coluna: number;
  readonly linhaInicio: number;
  readonly linhaFim: number;
}

const DIAS_UTEIS = [2, 3, 4, 5, 6] as const;
const rotuloLinha = (h: Pick<Horario, 'turno' | 'aula'>): string => `${h.turno}${h.aula}`;

function montarGrade(turmas: readonly Turma[]) {
  const horarios = turmas.map((turma) => ({ turma, horarios: horariosDoCodigo(turma.horario) }));
  const todos = horarios.flatMap((h) => h.horarios);

  const dias = [...new Set([...DIAS_UTEIS, ...todos.map((h) => h.dia)])].sort((a, b) => a - b);
  const linhas = [...new Map(todos.map((h) => [rotuloLinha(h), h])).values()].sort(
    (a, b) => ordemHorario(a) - ordemHorario(b),
  );
  const indiceLinha = new Map(linhas.map((h, i) => [rotuloLinha(h), i]));

  // Aulas consecutivas da mesma turma no mesmo dia viram um único bloco.
  const blocos: Bloco[] = horarios.flatMap(({ turma, horarios: lista }) =>
    dias.flatMap((dia, coluna) => {
      const indices = lista
        .filter((h) => h.dia === dia)
        .map((h) => indiceLinha.get(rotuloLinha(h)) ?? -1)
        .filter((i) => i >= 0)
        .sort((a, b) => a - b);
      const resultado: Bloco[] = [];
      for (const i of indices) {
        const ultimo = resultado[resultado.length - 1];
        if (ultimo && ultimo.linhaFim === i - 1) resultado[resultado.length - 1] = { ...ultimo, linhaFim: i };
        else resultado.push({ turma, coluna, linhaInicio: i, linhaFim: i });
      }
      return resultado;
    }),
  );

  return { dias, linhas, blocos };
}

export function GradeSemanal({ turmas }: Props) {
  const { dias, linhas, blocos } = montarGrade(turmas);
  const hoje = diaSigaaHoje();

  if (linhas.length === 0) {
    return <p className="px-1 text-sm text-muted-foreground">Nenhum horário encontrado.</p>;
  }

  const siglas = [...new Map(turmas.map((t) => [siglaDisciplina(t.nome), t])).entries()];

  return (
    <div className="space-y-3">
      <div
        role="grid"
        aria-label="Grade semanal de aulas"
        className="grid gap-1 rounded-3xl border bg-card p-2 sm:p-3"
        style={{
          gridTemplateColumns: `2.5rem repeat(${dias.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${linhas.length}, minmax(2.75rem, auto))`,
        }}
      >
        {dias.map((dia, i) => (
          <div
            key={dia}
            role="columnheader"
            style={{ gridColumn: i + 2, gridRow: 1 }}
            className={cn(
              'mx-auto my-1 rounded-full px-2 py-0.5 text-center text-xs',
              dia === hoje ? 'bg-destaque font-medium text-white' : 'text-muted-foreground',
            )}
          >
            {NOME_DIA_CURTO[dia]}
          </div>
        ))}

        {linhas.map((h, i) => {
          const mudaTurno = i > 0 && linhas[i - 1]?.turno !== h.turno;
          return (
            <div
              key={rotuloLinha(h)}
              role="rowheader"
              style={{ gridColumn: 1, gridRow: i + 2 }}
              className={cn(
                'flex items-start justify-end pr-1 pt-1 font-mono text-[10px] text-muted-foreground',
                mudaTurno && 'border-t border-dashed',
              )}
            >
              <span className="text-right leading-tight">
                {rotuloLinha(h)}
                <span className="block text-[9px] opacity-70">{faixaHoraria(h)?.[0]}</span>
              </span>
            </div>
          );
        })}

        {linhas.map((h, i) =>
          dias.map((dia, j) => (
            <div
              key={`${rotuloLinha(h)}-${dia}`}
              aria-hidden="true"
              style={{ gridColumn: j + 2, gridRow: i + 2 }}
              className={cn('rounded-lg', dia === hoje ? 'bg-destaque/5' : 'bg-foreground/[0.03]')}
            />
          )),
        )}

        {blocos.map((b) => {
          const ehHoje = dias[b.coluna] === hoje;
          return (
            <button
              key={`${b.turma.nome}-${b.coluna}-${b.linhaInicio}`}
              type="button"
              onClick={b.turma.acessar}
              title={`${b.turma.nome} · ${b.turma.local}`}
              aria-label={`${b.turma.nome}, ${NOME_DIA_CURTO[dias[b.coluna] ?? 0]}, ${rotuloLinha(linhas[b.linhaInicio] ?? { turno: 'M', aula: 0 })}`}
              style={{ gridColumn: b.coluna + 2, gridRow: `${b.linhaInicio + 2} / ${b.linhaFim + 3}` }}
              className={cn(
                'flex min-w-0 flex-col justify-center rounded-xl border px-1.5 py-1 text-left transition-[transform,background-color] active:scale-95 sm:px-2',
                ehHoje ? 'border-transparent bg-destaque text-white' : 'bg-card hover:bg-accent',
              )}
            >
              <span className="block font-mono text-[11px] font-bold leading-tight sm:hidden">{siglaDisciplina(b.turma.nome)}</span>
              <span className="hidden text-xs font-medium capitalize leading-tight sm:line-clamp-2">{b.turma.nome.toLowerCase()}</span>
              <span className={cn('hidden truncate text-[10px] md:block', ehHoje ? 'text-white/80' : 'text-muted-foreground')}>
                {b.turma.local}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground sm:hidden">
        {siglas.map(([sigla, t]) => (
          <li key={sigla}>
            <span className="font-mono font-bold text-foreground">{sigla}</span> <span className="capitalize">{t.nome.toLowerCase()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
