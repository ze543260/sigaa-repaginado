import { horaConfirmada, horariosDoCodigo, siglaDisciplina } from '../domain/horario';
import { tituloBr } from '../domain/texto';
import type { Atividade, Turma } from '../domain/types';
import { cn } from './cn';
import { Card } from './components/Card';
import { aulasDoDia, hhmm, useAgora } from './ListaTurmas';
import { intervaloDoBloco } from '../domain/horario';

type Estado = 'passou' | 'agora' | 'depois' | null;

function useHoje(turmas: readonly Turma[]) {
  const agora = useAgora();
  return aulasDoDia(turmas, agora).map(({ turma, primeira, ultima }) => {
    const tempo = intervaloDoBloco(agora, primeira, ultima);
    const estado: Estado = !tempo ? null : agora >= tempo.fim ? 'passou' : agora >= tempo.inicio ? 'agora' : 'depois';
    const aprox = horaConfirmada(primeira) ? '' : '~';
    const quando = tempo ? `${aprox}${hhmm(tempo.inicio)}-${hhmm(tempo.fim)}` : `${primeira.turno}${primeira.aula}-${ultima.turno}${ultima.aula}`;
    return { turma, estado, quando, tempo };
  });
}

export function TerminalHoje({ turmas }: { readonly turmas: readonly Turma[] }) {
  const hoje = useHoje(turmas);
  return (
    <Card className="overflow-hidden p-4 font-mono text-xs leading-relaxed">
      <p className="text-muted-foreground">$ crontab -l | grep hoje</p>
      {hoje.length === 0 && <p>nenhum job agendado. vai dormir.</p>}
      {hoje.map(({ turma, estado, quando }) => (
        <button
          key={turma.codigo || turma.nome}
          type="button"
          onClick={turma.acessar}
          className={cn('flex w-full gap-2 py-1 text-left hover:bg-accent', estado === 'passou' && 'opacity-50')}
        >
          <span className={cn('w-12 shrink-0', estado === 'agora' && 'text-destaque-texto')}>
            {estado === 'agora' ? '[RUN]' : estado === 'passou' ? '[ OK]' : '[   ]'}
          </span>
          <span className="w-[5.5rem] shrink-0 text-muted-foreground">{quando}</span>
          <span className="min-w-0 truncate">{turma.nome.toLowerCase()}</span>
        </button>
      ))}
    </Card>
  );
}

export function TerminalTurmas({ turmas }: { readonly turmas: readonly Turma[] }) {
  return (
    <Card className="overflow-hidden p-4 font-mono text-xs leading-relaxed">
      <p className="text-muted-foreground">$ ls -l ~/turmas</p>
      <p className="text-muted-foreground">total {turmas.length}</p>
      {turmas.map((t) => (
        <button key={t.codigo || t.nome} type="button" onClick={t.acessar} className="flex w-full gap-2 py-1 text-left hover:bg-accent">
          <span className="hidden shrink-0 text-muted-foreground sm:inline">drwxr-xr-x</span>
          <span className="w-16 shrink-0 text-destaque-texto">{t.horario.split(' ')[0]}</span>
          <span className="min-w-0 truncate">{t.nome.toLowerCase().replace(/\s+/g, '_')}/</span>
        </button>
      ))}
    </Card>
  );
}

export function LadderHoje({ turmas }: { readonly turmas: readonly Turma[] }) {
  const hoje = useHoje(turmas);
  if (hoje.length === 0) return <p className="px-1 font-mono text-xs text-muted-foreground">CICLO PARADO · SEM AULAS HOJE</p>;
  return (
    <div className="relative border-x-[3px] border-foreground/60 px-0 py-2">
      {hoje.map(({ turma, estado, quando }, n) => {
        const ligado = estado === 'agora';
        return (
          <button
            key={turma.codigo || turma.nome}
            type="button"
            onClick={turma.acessar}
            className={cn('flex w-full items-center py-3 text-left', estado === 'passou' && 'opacity-50')}
          >
            <span className={cn('h-0.5 w-3 shrink-0', ligado ? 'bg-destaque' : 'bg-foreground/50')} />
            <span className="flex shrink-0 flex-col items-center px-1">
              <span className="font-mono text-[10px] text-muted-foreground">I0.{n}</span>
              <span className={cn('font-mono text-sm font-bold', ligado && 'text-destaque-texto')}>┤ ├</span>
            </span>
            <span className={cn('h-0.5 w-3 shrink-0', ligado ? 'bg-destaque' : 'bg-foreground/50')} />
            <span className="min-w-0 flex-1 px-2">
              <span className="block truncate text-sm font-medium uppercase tracking-wide">{tituloBr(turma.nome)}</span>
              <span className="block font-mono text-[11px] text-muted-foreground">{quando} · {turma.local}</span>
            </span>
            <span className={cn('h-0.5 w-3 shrink-0', ligado ? 'bg-destaque' : 'bg-foreground/50')} />
            <span
              className={cn(
                'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 font-mono text-[10px]',
                ligado ? 'border-destaque bg-destaque text-white shadow-[0_0_12px_hsl(var(--destaque))]' : 'border-foreground/60',
              )}
            >
              Q{n}
            </span>
            <span className={cn('h-0.5 w-3 shrink-0', ligado ? 'bg-destaque' : 'bg-foreground/50')} />
          </button>
        );
      })}
    </div>
  );
}

const POST_ITS = ['#fde68a', '#fbcfe8', '#bae6fd', '#bbf7d0'];

interface PropsKanban {
  readonly atividades: readonly Atividade[];
  readonly feita: (a: Atividade) => boolean;
  readonly alternar: (a: Atividade) => void;
}

export function KanbanAtividades({ atividades, feita, alternar }: PropsKanban) {
  const abertas = atividades.filter((a) => a.status !== 'passada');
  const colunas = [
    { titulo: 'Esta semana', itens: abertas.filter((a) => a.status === 'semana' && !feita(a)) },
    { titulo: 'Depois', itens: abertas.filter((a) => a.status !== 'semana' && !feita(a)) },
    { titulo: 'Feito', itens: abertas.filter(feita) },
  ];
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
      {colunas.map((c) => (
        <section key={c.titulo} className="w-[78%] shrink-0 snap-start space-y-3 rounded-2xl bg-secondary/60 p-3 md:w-auto">
          <h3 className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {c.titulo}
            <span className="rounded-full bg-background px-2 py-0.5 font-mono">{c.itens.length}</span>
          </h3>
          {c.itens.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">vazio</p>}
          {c.itens.map((a, n) => (
            <div
              key={`${a.turma}${a.descricao}${n}`}
              className="space-y-2 p-3 text-sm text-[#1c1917] shadow-[2px_4px_0_-1px_rgb(0_0_0/0.15)]"
              style={{ background: POST_ITS[n % POST_ITS.length], transform: `rotate(${n % 2 ? 0.6 : -0.5}deg)` }}
            >
              <button type="button" disabled={!a.abrir} onClick={a.abrir ?? undefined} className="block w-full text-left">
                <span className={cn('block font-semibold leading-snug', feita(a) && 'line-through')}>{a.descricao}</span>
                <span className="block text-xs opacity-75">{tituloBr(a.turma)}</span>
              </button>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono opacity-75">{a.data.replace(/\s*\(.*\)$/, '')}</span>
                <button type="button" onClick={() => alternar(a)} className="rounded-full border border-current px-2 py-0.5 font-medium">
                  {feita(a) ? 'reabrir' : 'feito ✓'}
                </button>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

const COLUNAS = ['A', 'B', 'C', 'D'];

export function PlanilhaTurmas({ turmas }: { readonly turmas: readonly Turma[] }) {
  const celula = 'border-b border-r px-2 py-2';
  return (
    <div className="casca-card overflow-x-auto border bg-card">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-secondary text-xs text-muted-foreground">
          <tr>
            <th className={cn(celula, 'w-8 text-center font-normal')} />
            {COLUNAS.map((c) => (
              <th key={c} className={cn(celula, 'text-center font-normal')}>{c}</th>
            ))}
          </tr>
          <tr className="font-semibold text-foreground">
            <td className={cn(celula, 'bg-secondary text-center text-xs font-normal text-muted-foreground')}>1</td>
            <td className={celula}>Sigla</td>
            <td className={celula}>Disciplina</td>
            <td className={celula}>Horário</td>
            <td className={celula}>Local</td>
          </tr>
        </thead>
        <tbody>
          {turmas.map((t, n) => (
            <tr key={t.codigo || t.nome} onClick={t.acessar} className="cursor-pointer hover:bg-accent">
              <td className={cn(celula, 'bg-secondary text-center text-xs text-muted-foreground')}>{n + 2}</td>
              <td className={cn(celula, 'font-mono text-xs')}>{siglaDisciplina(t.nome)}</td>
              <td className={cn(celula, 'min-w-[10rem]')}>
                <button type="button" className="text-left hover:underline">{tituloBr(t.nome)}</button>
              </td>
              <td className={cn(celula, 'whitespace-nowrap font-mono text-xs')}>{t.horario}</td>
              <td className={cn(celula, 'whitespace-nowrap text-xs')}>{t.local}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const simbolo = (nome: string) => {
  const s = siglaDisciplina(nome);
  return s[0] + s.slice(1, 2).toLowerCase();
};

export function TabelaPeriodicaTurmas({ turmas }: { readonly turmas: readonly Turma[] }) {
  return (
    <ul className="cascata grid grid-cols-3 gap-2 sm:grid-cols-4">
      {turmas.map((t, n) => {
        const turno = t.horario.match(/\d([MTN])/)?.[1] ?? 'M';
        return (
          <li key={t.codigo || t.nome}>
            <button
              type="button"
              onClick={t.acessar}
              title={tituloBr(t.nome)}
              className={cn(
                'flex aspect-square w-full flex-col justify-between rounded-md border-2 p-2 text-left transition-transform active:scale-95',
                turno === 'M' && 'bg-destaque/10',
                turno === 'T' && 'bg-destaque/25',
                turno === 'N' && 'bg-foreground/10',
              )}
            >
              <span className="flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>{n + 1}</span>
                <span>{turno}</span>
              </span>
              <span className="font-dot text-3xl font-semibold leading-none">{simbolo(t.nome)}</span>
              <span className="line-clamp-2 text-[10px] leading-tight">{tituloBr(t.nome)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function HudRetro({ nome, ira, integralizado, semestre }: { readonly nome: string; readonly ira?: string; readonly integralizado: number | null; readonly semestre: string }) {
  const blocos = 10;
  const cheios = integralizado === null ? 0 : Math.round((integralizado / 100) * blocos);
  return (
    <div className="casca-card space-y-3 border bg-card p-4 font-mono text-sm uppercase">
      <div className="flex justify-between">
        <span>1P {nome}</span>
        <span className="text-destaque-texto">LVL {semestre}</span>
      </div>
      {ira && (
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground">Score</span>
          <span className="font-dot text-2xl">{ira.replace(',', '').padStart(6, '0')}</span>
        </div>
      )}
      {integralizado !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>XP do curso</span>
            <span>{integralizado}%</span>
          </div>
          <div className="flex gap-1" role="progressbar" aria-label="Curso integralizado" aria-valuenow={integralizado} aria-valuemin={0} aria-valuemax={100}>
            {Array.from({ length: blocos }, (_, i) => (
              <span key={i} className={cn('h-4 flex-1', i < cheios ? 'bg-destaque' : 'bg-foreground/15')} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BateriaSolar({ valor }: { readonly valor: number }) {
  return (
    <div className="flex items-center gap-1" role="progressbar" aria-label="Curso integralizado" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
      <div className="relative h-7 flex-1 overflow-hidden rounded-md border-2 border-foreground/70 p-0.5">
        <div className="crescer h-full rounded-sm bg-gradient-to-r from-destaque/70 to-destaque" style={{ width: `${valor}%` }} />
        <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto h-4 w-4 text-foreground" aria-hidden="true">
          <path d="M13 3L5 14h6l-1 7 8-11h-6z" fill="currentColor" />
        </svg>
      </div>
      <span className="h-3 w-1 rounded-r-sm bg-foreground/70" />
    </div>
  );
}

const INICIO_DIA = 7;
const FIM_DIA = 23;
const posicao = (d: Date) => ((d.getHours() + d.getMinutes() / 60 - INICIO_DIA) / (FIM_DIA - INICIO_DIA)) * 100;

/** Aulas do dia sobre uma régua de horas: como onda quadrada (osciloscópio) ou barras de cronograma (canteiro). */
export function LinhaDoTempo({ turmas, modo }: { readonly turmas: readonly Turma[]; readonly modo: 'onda' | 'gantt' }) {
  const agora = useAgora();
  const hoje = useHoje(turmas).filter((a) => a.tempo);
  if (hoje.length === 0) return <p className="px-1 font-mono text-xs text-muted-foreground">{modo === 'onda' ? 'sinal em nível baixo · sem aulas hoje' : 'canteiro parado · sem aulas hoje'}</p>;
  const cursor = posicao(agora);
  const horas = [7, 10, 13, 16, 19, 22];

  if (modo === 'onda') {
    let d = 'M0 40';
    for (const { tempo } of hoje) {
      const a = posicao(tempo!.inicio);
      const b = posicao(tempo!.fim);
      d += ` L${a} 40 L${a} 8 L${b} 8 L${b} 40`;
    }
    d += ' L100 40';
    return (
      <Card className="space-y-3 p-4">
        <div className="relative">
          <svg viewBox="0 0 100 48" preserveAspectRatio="none" className="h-20 w-full" aria-hidden="true">
            {[0, 25, 50, 75, 100].map((x) => <line key={x} x1={x} x2={x} y1="0" y2="48" stroke="hsl(var(--border))" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />)}
            <line x1="0" x2="100" y1="24" y2="24" stroke="hsl(var(--border))" strokeDasharray="1 1" vectorEffect="non-scaling-stroke" />
            <path d={d} fill="none" stroke="hsl(var(--destaque))" strokeWidth="2" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_4px_hsl(var(--destaque))]" />
            {cursor >= 0 && cursor <= 100 && <line x1={cursor} x2={cursor} y1="0" y2="48" stroke="hsl(var(--foreground))" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />}
          </svg>
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
            {horas.map((h) => <span key={h}>{h}h</span>)}
          </div>
        </div>
        <ul className="space-y-1 font-mono text-xs">
          {hoje.map(({ turma, quando, estado }, n) => (
            <li key={turma.codigo || turma.nome}>
              <button type="button" onClick={turma.acessar} className={cn('flex w-full gap-2 text-left hover:underline', estado === 'passou' && 'opacity-50')}>
                <span className={cn(estado === 'agora' && 'text-destaque-texto')}>CH{n + 1}</span>
                <span className="text-muted-foreground">{quando}</span>
                <span className="min-w-0 truncate">{tituloBr(turma.nome)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <Card className="space-y-2 p-4">
      <div className="flex justify-between pl-[30%] font-mono text-[10px] text-muted-foreground">
        {horas.map((h) => <span key={h}>{h}h</span>)}
      </div>
      {hoje.map(({ turma, tempo, estado }) => {
        const a = posicao(tempo!.inicio);
        const b = posicao(tempo!.fim);
        return (
          <button key={turma.codigo || turma.nome} type="button" onClick={turma.acessar} className={cn('flex w-full items-center gap-2 text-left', estado === 'passou' && 'opacity-50')}>
            <span className="w-[30%] shrink-0 truncate text-xs font-semibold uppercase">{siglaDisciplina(turma.nome)}</span>
            <span className="relative h-6 flex-1 bg-secondary">
              <span
                className="absolute inset-y-0"
                style={{
                  left: `${a}%`,
                  width: `${b - a}%`,
                  background: estado === 'agora' ? 'repeating-linear-gradient(-45deg, #f2b705 0 6px, #161616 6px 12px)' : 'hsl(var(--destaque))',
                }}
              />
              {cursor >= 0 && cursor <= 100 && <span className="absolute inset-y-[-4px] w-0.5 bg-foreground" style={{ left: `${cursor}%` }} />}
            </span>
          </button>
        );
      })}
    </Card>
  );
}

/** Turmas como lista de peças de um desenho técnico. */
export function ListaPecas({ turmas }: { readonly turmas: readonly Turma[] }) {
  const celula = 'border border-foreground/40 px-2 py-1.5';
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border-2 border-foreground/60 text-left text-xs uppercase tracking-wide">
        <thead>
          <tr className="font-semibold">
            <th className={cn(celula, 'w-10 text-center')}>Item</th>
            <th className={celula}>Denominação</th>
            <th className={cn(celula, 'w-12 text-center')}>Qtd</th>
            <th className={celula}>Ref.</th>
          </tr>
        </thead>
        <tbody>
          {turmas.map((t, n) => (
            <tr key={t.codigo || t.nome} onClick={t.acessar} className="cursor-pointer hover:bg-accent">
              <td className={cn(celula, 'text-center font-mono')}>{String(n + 1).padStart(2, '0')}</td>
              <td className={celula}>
                <button type="button" className="text-left normal-case tracking-normal">{tituloBr(t.nome)}</button>
              </td>
              <td className={cn(celula, 'text-center font-mono')}>{horariosDoCodigo(t.horario).length || '—'}</td>
              <td className={cn(celula, 'whitespace-nowrap font-mono normal-case')}>{t.horario}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-right font-mono text-[10px] uppercase text-muted-foreground">Qtd = aulas por semana</p>
    </div>
  );
}
