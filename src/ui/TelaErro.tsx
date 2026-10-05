import { PiadaDoContexto } from './Surpresas';
import { tituloBr } from '../domain/texto';
import { lerPortalSalvo } from '../domain/cache';
import type { ErroPagina, Turma } from '../domain/types';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { GradeSemanal } from './GradeSemanal';
import { AulasDeHoje } from './ListaTurmas';

const TITULO: Readonly<Record<ErroPagina['tipo'], string>> = {
  offline: 'sem conexão',
  sessao: 'sessão encerrada',
  indisponivel: 'sigaa fora do ar',
};

const DESCRICAO: Readonly<Record<ErroPagina['tipo'], string>> = {
  offline: 'Não foi possível falar com o SIGAA. Verifique a internet e tente de novo.',
  sessao: 'O SIGAA encerrou sua sessão. Entre de novo para continuar.',
  indisponivel: 'O SIGAA respondeu com erro. Costuma voltar em alguns minutos.',
};

function IconeErro({ tipo }: { readonly tipo: ErroPagina['tipo'] }) {
  // Matriz 7×7: só os pontos do desenho acendem; o resto fica apagado como num visor.
  const desenho: Readonly<Record<ErroPagina['tipo'], readonly string[]>> = {
    offline: ['0010100', '0100010', '1001001', '0010100', '0001000', '0000000', '0001000'],
    sessao: ['0111110', '1000001', '1001001', '1001111', '1000001', '1000001', '0111110'],
    indisponivel: ['0001000', '0011100', '0010100', '0110110', '0100010', '1101011', '1111111'],
  };
  return (
    <svg viewBox="0 0 70 70" className="h-20 w-20" aria-hidden="true">
      {desenho[tipo].flatMap((linha, y) =>
        [...linha].map((c, x) => (
          <circle
            key={`${x}-${y}`} cx={x * 10 + 5} cy={y * 10 + 5} r="3.4"
            fill={c === '1' ? (tipo === 'indisponivel' && y === 6 ? 'hsl(var(--destaque))' : 'currentColor') : 'currentColor'}
            opacity={c === '1' ? 1 : 0.1}
            className={c === '1' ? 'animate-entrar' : undefined}
            style={c === '1' ? { animationDelay: `${(x + y) * 30}ms` } : undefined}
          />
        )),
      )}
    </svg>
  );
}

function quandoSalvo(ms: number): string {
  const d = new Date(ms);
  const hoje = new Date().toDateString() === d.toDateString();
  return hoje ? `hoje às ${d.toTimeString().slice(0, 5)}` : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function TelaErro({ erro }: { readonly erro: ErroPagina }) {
  const salvo = lerPortalSalvo();
  const turmas: Turma[] = salvo?.turmas.map((t) => ({ ...t, acessar: erro.tentar })) ?? [];
  const pendentes = salvo?.atividades.filter((a) => a.status !== 'passada') ?? [];

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col items-start gap-4">
        <IconeErro tipo={erro.tipo} />
        <h1 className="font-dot text-4xl font-extrabold leading-none sm:text-6xl">{TITULO[erro.tipo]}</h1>
        <p className="text-muted-foreground">{DESCRICAO[erro.tipo]}</p>
        <PiadaDoContexto contexto="erro" className="font-mono text-sm text-destaque-texto" />
        {erro.tipo === 'indisponivel' && erro.mensagem && (
          <p className="max-w-prose rounded-2xl border px-4 py-3 font-mono text-xs text-muted-foreground">{erro.mensagem}</p>
        )}
        <Button variant="destaque" size="lg" onClick={erro.tentar}>
          {erro.tipo === 'sessao' ? 'Entrar de novo' : 'Tentar de novo'}
        </Button>
      </div>

      {salvo && (
        <section className="space-y-6 border-t pt-8">
          <p className="text-sm text-muted-foreground">Última versão salva · {quandoSalvo(salvo.salvoEm)}</p>
          <div className="space-y-3">
            <h2 className="px-1 text-sm font-medium text-muted-foreground">Hoje</h2>
            <AulasDeHoje turmas={turmas} />
          </div>
          <div className="space-y-3">
            <h2 className="px-1 text-sm font-medium text-muted-foreground">Semana</h2>
            <GradeSemanal turmas={turmas} />
          </div>
          {pendentes.length > 0 && (
            <div className="space-y-3">
              <h2 className="px-1 text-sm font-medium text-muted-foreground">Atividades</h2>
              <Card className="divide-y overflow-hidden">
                {pendentes.map((a, i) => (
                  <div key={i} className="px-5 py-3 text-sm">
                    <p className="font-mono text-xs text-muted-foreground">{a.data}</p>
                    <p className="font-medium">{a.descricao}</p>
                    <p className="text-xs text-muted-foreground">{tituloBr(a.turma)} · {a.tipo}</p>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
