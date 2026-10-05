import { tituloBr } from '../domain/texto';
import { useEffect, useState } from 'react';
import { horariosDoCodigo, intervaloDoBloco, lerData, ordemHorario } from '../domain/horario';
import { salvarPortal } from '../domain/cache';
import { gerarIcs } from '../domain/ics';
import type { Atividade, PortalDiscente } from '../domain/types';
import { plataforma, type Lembrete } from '../plataforma';
import { achatar, Favoritos } from './BuscaComandos';
import { useNotas } from './notas';
import { LinhaDisciplina } from './PainelNotas';
import { CHAVE_FEITAS, useConjunto } from './memoria';
import { usarPreferencias } from './tema';
import { Button } from './components/Button';
import { Card, CardContent, CardHeader, CardTitle } from './components/Card';
import { BarraPontos, ContagemPontos, Sinal } from './components/Glifos';
import { AnelProgresso, GraficoBarras } from './components/Graficos';
import { cn } from './cn';
import { GradeSemanal } from './GradeSemanal';
import { AulasDeHoje, ListaTurmas } from './ListaTurmas';

export type AbaPortal = 'inicio' | 'turmas' | 'atividades';

interface Props {
  readonly portal: PortalDiscente;
}

interface PropsPortal extends Props {
  readonly aba: AbaPortal;
  readonly onAba: (aba: AbaPortal) => void;
}

// Abaixo de md cada aba mostra só o seu conteúdo; no desktop tudo aparece junto.
const naAba = (atual: AbaPortal, ...abas: readonly AbaPortal[]): string => (abas.includes(atual) ? '' : 'hidden md:block');

const STATUS: Readonly<Record<Atividade['status'], string>> = {
  semana: 'Esta semana',
  mes: 'Este mês',
  futura: 'Em breve',
  passada: 'Encerrada',
};

function Secao({ titulo, className, children }: { readonly titulo: string; readonly className?: string; readonly children: React.ReactNode }) {
  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="px-1 text-sm font-medium text-muted-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 5) return 'Boa madrugada';
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function separarPrazo(data: string): { readonly quando: string; readonly prazo: string | null } {
  const prazo = data.match(/\((.*)\)/)?.[1] ?? null;
  return { quando: data.replace(/\s*\(.*\)$/, ''), prazo };
}

export const chaveAtividade = (a: Atividade): string => `${a.turma}|${a.descricao}|${a.data.slice(0, 10)}`;

function useFeitas() {
  const [feitas, alternar] = useConjunto(CHAVE_FEITAS);
  return { feita: (a: Atividade) => feitas.has(chaveAtividade(a)), alternar: (a: Atividade) => alternar(chaveAtividade(a)) };
}

function LinhaAtividade({ atividade: a }: { readonly atividade: Atividade }) {
  const { feita, alternar } = useFeitas();
  const ok = feita(a);
  return (
    <div className={cn('flex items-stretch', ok && 'opacity-55')}>
      {a.status !== 'passada' && (
        <button
          type="button"
          role="checkbox"
          aria-checked={ok}
          aria-label={ok ? 'Marcar como pendente' : 'Marcar como feita'}
          onClick={() => alternar(a)}
          className="grid w-12 shrink-0 place-items-center pl-3 active:scale-90"
        >
          <span
            className={cn(
              'grid h-5 w-5 place-items-center rounded-full border-2 transition-colors',
              ok ? 'border-destaque bg-destaque text-white' : 'border-muted-foreground/50',
            )}
          >
            {ok && (
              <svg viewBox="0 0 16 16" className="h-3 w-3 pulinho" aria-hidden="true">
                <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            )}
          </span>
        </button>
      )}
      <ConteudoAtividade atividade={a} feita={ok} />
    </div>
  );
}

function ConteudoAtividade({ atividade: a, feita }: { readonly atividade: Atividade; readonly feita: boolean }) {
  const { quando, prazo } = separarPrazo(a.data);
  return (
    <button
      type="button"
      disabled={!a.abrir}
      onClick={a.abrir ?? undefined}
      className={cn(
        'flex min-h-14 min-w-0 flex-1 flex-col gap-1 px-5 py-4 text-left text-sm transition-colors enabled:hover:bg-accent enabled:active:bg-accent sm:grid sm:grid-cols-[7.5rem_1fr_auto] sm:items-start sm:gap-x-4',
        a.status !== 'passada' && 'pl-2',
        a.status === 'passada' && 'text-muted-foreground',
      )}
    >
      <span className="flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground sm:block">
        <span>
          {quando}
          {prazo && <span className="sm:block"> · em {prazo}</span>}
        </span>
        <span
          className={cn(
            'flex items-center gap-1.5 font-sans sm:hidden',
            a.status === 'semana' && 'font-medium text-destaque-texto',
          )}
        >
          <Sinal ativo={a.status === 'semana'} />
          {STATUS[a.status]}
        </span>
      </span>
      <span className="min-w-0">
        <span className={cn('block font-medium', feita && 'line-through')}>{a.descricao}</span>
        <span className="block text-xs text-muted-foreground">
          {tituloBr(a.turma)} · {a.tipo}
        </span>
      </span>
      <span
        className={cn(
          'hidden items-center gap-2 text-xs sm:flex',
          a.status === 'semana' ? 'font-medium text-destaque-texto' : 'text-muted-foreground',
        )}
      >
        <Sinal ativo={a.status === 'semana'} />
        {STATUS[a.status]}
      </span>
    </button>
  );
}

function ListaAtividades({ atividades }: { readonly atividades: readonly Atividade[] }) {
  const { feita } = useFeitas();
  const pendentes = atividades
    .filter((a) => a.status !== 'passada')
    .sort((a, b) => Number(feita(a)) - Number(feita(b)));
  const encerradas = atividades.filter((a) => a.status === 'passada');

  if (atividades.length === 0) {
    return <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">Nada pendente por enquanto.</Card>;
  }

  return (
    <Card className="overflow-hidden">
      {pendentes.length > 0 ? (
        <ul className="cascata divide-y">
          {pendentes.map((a, n) => (
            <li key={n}>
              <LinhaAtividade atividade={a} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-5 text-sm text-muted-foreground">Nada pendente por enquanto.</p>
      )}
      {encerradas.length > 0 && (
        <details className="border-t">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
            Encerradas · {encerradas.length}
            <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform [details[open]>summary>&]:rotate-90" aria-hidden="true">
              <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </summary>
          <ul className="divide-y border-t">
            {encerradas.map((a, n) => (
              <li key={n}>
                <LinhaAtividade atividade={a} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

export function DadosPessoais({ portal }: Props) {
  const iniciais = portal.nome.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('');
  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          {portal.foto ? (
            <img src={portal.foto} alt="" className="h-14 w-14 rounded-full object-cover grayscale" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary font-mono">{iniciais}</div>
          )}
          <CardTitle className="min-w-0">{tituloBr(portal.nome)}</CardTitle>
        </CardHeader>
        {portal.dados.length > 0 && (
          <CardContent>
            <dl className="grid gap-2.5 text-sm">
              {portal.dados.map((d) => (
                <div key={d.rotulo} className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <dt className="text-muted-foreground">{d.rotulo}</dt>
                  <dd className="break-words">{d.valor}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        )}
      </Card>

      {portal.integralizacao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Carga horária</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoBarras
              rotulo="Carga horária"
              barras={portal.integralizacao.map((p) => ({ rotulo: p.rotulo, valor: Number(p.valor.replace(/\D/g, '')) || 0, detalhe: `${p.valor} h` }))}
            />
          </CardContent>
        </Card>
      )}

      {portal.atalhos.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {portal.atalhos.map((a) => (
            <Button key={a.rotulo} variant="outline" onClick={a.abrir} className="h-11 lg:h-8 lg:px-3.5 lg:text-xs">
              {a.rotulo}
            </Button>
          ))}
        </div>
      )}
    </>
  );
}

export function Portal({ portal, aba, onAba }: PropsPortal) {
  const primeiroNome = portal.nome.split(' ')[0]?.toLowerCase() ?? '';
  const ira = portal.indices.find((i) => i.rotulo === 'IRA');
  const outrosIndices = portal.indices.filter((i) => i.rotulo !== 'IRA');
  const { feita } = useFeitas();
  const urgentes = portal.atividades.filter((a) => a.status === 'semana' && !feita(a)).length;
  const proximas = portal.atividades.filter((a) => a.status !== 'passada' && !feita(a)).slice(0, 3);
  useLembretes(portal, feita);
  useEffect(() => salvarPortal(portal), [portal]);
  const novasAtualizacoes = useNovasAtualizacoes(portal);
  const semestreAtual = useNotas(portal);
  const notasEmCurso = semestreAtual?.linhas.filter((l) => !l.situacao) ?? [];

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 sm:py-10 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-8 sm:space-y-10">
        <div className={cn('space-y-3', naAba(aba, 'inicio'))}>
          <p className="font-mono text-sm text-muted-foreground">
            {saudacao()} · semestre {portal.semestre}
          </p>
          <h1 className="font-dot text-4xl font-extrabold capitalize leading-[0.95] sm:text-7xl">{primeiroNome || 'olá'}</h1>
          {(ira || portal.percentualIntegralizado !== null) && (
            <dl className="flex gap-6 pt-2 lg:hidden">
              {ira && (
                <div>
                  <dt className="text-xs text-muted-foreground">IRA</dt>
                  <dd>
                    <ContagemPontos className="text-4xl" valor={ira.valor} />
                  </dd>
                </div>
              )}
              {portal.percentualIntegralizado !== null && (
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground">Curso integralizado</dt>
                  <dd className="space-y-2">
                    <ContagemPontos className="text-4xl" valor={`${portal.percentualIntegralizado}%`} />
                    <BarraPontos valor={portal.percentualIntegralizado} pontos={20} rotulo="Curso integralizado" />
                  </dd>
                </div>
              )}
            </dl>
          )}
          {urgentes > 0 && (
            <p className="flex items-center gap-2 text-sm">
              <Sinal />
              {urgentes === 1 ? '1 atividade vence esta semana' : `${urgentes} atividades vencem esta semana`}
            </p>
          )}
        </div>

        <Favoritos itens={portal.menu} className={naAba(aba, 'inicio')} />

        <Documentos portal={portal} className={naAba(aba, 'inicio')} />

        <Secao titulo="Hoje" className={naAba(aba, 'inicio')}>
          <AulasDeHoje turmas={portal.turmas} />
        </Secao>

        {proximas.length > 0 && (
          <Secao titulo="Próximas" className={cn('md:hidden', aba !== 'inicio' && 'hidden')}>
            <Card className="overflow-hidden">
              <ul className="cascata divide-y">
                {proximas.map((a, n) => (
                  <li key={n}>
                    <LinhaAtividade atividade={a} />
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onAba('atividades')}
                className="flex min-h-12 w-full items-center justify-center border-t text-sm text-muted-foreground active:bg-accent"
              >
                Ver todas as atividades
              </button>
            </Card>
          </Secao>
        )}

        <Secao titulo="Minhas atividades" className={naAba(aba, 'atividades')}>
          <ListaAtividades atividades={portal.atividades} />
        </Secao>

        {notasEmCurso.length > 0 && (
          <Secao titulo={`Notas · ${semestreAtual?.periodo ?? ''}`} className={naAba(aba, 'turmas')}>
            <Card className="overflow-hidden">
              <ul className="cascata divide-y">
                {notasEmCurso.map((l) => (
                  <LinhaDisciplina key={l.rotulo} linha={l} />
                ))}
              </ul>
            </Card>
          </Secao>
        )}

        <Secao titulo="Semana" className={naAba(aba, 'turmas')}>
          <GradeSemanal turmas={portal.turmas} />
          <Button variant="outline" onClick={() => exportarCalendario(portal)} className="h-11 w-full sm:w-auto lg:h-9">
            Exportar para o calendário (.ics)
          </Button>
        </Secao>

        <Secao titulo={`Turmas · ${portal.turmas.length}`} className={naAba(aba, 'turmas')}>
          <ListaTurmas turmas={portal.turmas} />
        </Secao>

        {portal.atualizacoes.length > 0 && (
          <Secao
            titulo={novasAtualizacoes.size > 0 ? `Novidades · ${novasAtualizacoes.size} desde a última visita` : 'Últimas atualizações'}
            className={naAba(aba, 'inicio')}
          >
            <Card className="overflow-hidden">
              <ul className="cascata divide-y">
                {portal.atualizacoes.map((a, n) => (
                  <li key={n} className={cn(n >= Math.max(3, novasAtualizacoes.size) && 'hidden md:block')}>
                    <button
                      type="button"
                      disabled={!a.abrir}
                      onClick={a.abrir ?? undefined}
                      className="flex min-h-14 w-full flex-col gap-1 px-5 py-4 text-left text-sm transition-colors enabled:hover:bg-accent enabled:active:bg-accent sm:grid sm:grid-cols-[7.5rem_1fr] sm:gap-x-4"
                    >
                      <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                        {novasAtualizacoes.has(chaveAtualizacao(a)) && <span className="h-2 w-2 rounded-full bg-destaque pulso" aria-label="nova" />}
                        {a.data}
                      </span>
                      <span className="min-w-0">
                        <span className={cn('block break-words', novasAtualizacoes.has(chaveAtualizacao(a)) && 'font-medium')}>{a.descricao}</span>
                        <span className="block text-xs text-muted-foreground">{tituloBr(a.turma)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </Secao>
        )}

      </div>

      <aside className="hidden space-y-4 lg:block">
        {(ira || portal.percentualIntegralizado !== null) && (
          <Card className="space-y-8 p-6">
            {ira && (
              <div title={ira.descricao}>
                <p className="text-sm text-muted-foreground">{ira.descricao ?? ira.rotulo}</p>
                <ContagemPontos className="mt-2 block text-7xl" valor={ira.valor} />
              </div>
            )}
            {portal.percentualIntegralizado !== null && (
              <div className="flex items-center gap-5">
                <AnelProgresso valor={portal.percentualIntegralizado} rotulo="Curso integralizado" tamanho={104} />
                <p className="text-sm text-muted-foreground">Curso integralizado</p>
              </div>
            )}
            {outrosIndices.length > 0 && (
              <dl className="grid grid-cols-3 gap-x-3 gap-y-4 border-t pt-6">
                {outrosIndices.map((i) => (
                  <div key={i.rotulo} title={i.descricao}>
                    <dt className="text-xs text-muted-foreground">{i.rotulo}</dt>
                    <dd className="font-mono text-sm">{i.valor}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
        )}
        <DadosPessoais portal={portal} />
      </aside>
    </main>
  );
}

function exportarCalendario(portal: PortalDiscente): void {
  const ate = new Date();
  // Fim do semestre: fim de junho ou de dezembro.
  ate.setMonth(ate.getMonth() < 6 ? 5 : 11, 30);
  plataforma.salvarArquivo(`sigaa-${portal.semestre.replace(/\W/g, '-') || 'semestre'}.ics`, 'text/calendar', gerarIcs(portal.turmas, portal.atividades, ate));
}

const DIA_MS = 24 * 60 * 60_000;

/** Agenda no aparelho avisos de aula (10 min antes) e de prazo (1 dia e 3 h antes). */
function useLembretes(portal: PortalDiscente, feita: (a: Atividade) => boolean): void {
  const { prefs } = usarPreferencias();
  const agendar = plataforma.agendarLembretes;
  const assinatura = JSON.stringify([prefs.lembretes, portal.turmas.map((t) => t.horario), portal.atividades.map((a) => [a.data, feita(a)])]);

  useEffect(() => {
    if (!agendar) return;
    const agora = Date.now();
    const lembretes: Lembrete[] = [];

    for (let d = 0; d < 7; d++) {
      const dia = new Date(agora + d * DIA_MS);
      for (const t of portal.turmas) {
        const aulas = horariosDoCodigo(t.horario)
          .filter((h) => h.dia === dia.getDay() + 1)
          .sort((a, b) => ordemHorario(a) - ordemHorario(b));
        const primeira = aulas[0];
        const ultima = aulas[aulas.length - 1];
        const intervalo = primeira && ultima ? intervaloDoBloco(dia, primeira, ultima) : null;
        if (!intervalo) continue;
        const inicio = intervalo.inicio.getTime();
        const hhmm = intervalo.inicio.toTimeString().slice(0, 5);
        lembretes.push({
          id: `aula-${t.codigo || t.nome}-${inicio}`,
          titulo: t.nome.charAt(0) + t.nome.slice(1).toLowerCase(),
          texto: `Aula às ${hhmm} · ${t.local}`,
          quando: inicio - 10 * 60_000,
          aula: { nome: t.nome, local: t.local, inicio, fim: intervalo.fim.getTime() },
        });
      }
    }

    for (const a of portal.atividades) {
      const prazo = lerData(a.data)?.getTime();
      if (!prazo || a.status === 'passada' || feita(a)) continue;
      for (const [antes, rotulo] of [[DIA_MS, 'amanhã'], [3 * 60 * 60_000, 'em 3 horas']] as const) {
        lembretes.push({
          id: `prazo-${chaveAtividade(a)}-${antes}`,
          titulo: `${a.tipo || 'Atividade'} vence ${rotulo}`,
          texto: a.descricao,
          quando: prazo - antes,
        });
      }
    }

    // Com lembretes desligados as aulas ainda seguem (com horário passado) só para o widget.
    const validos = lembretes.filter((l) => l.quando > agora || (l.aula && l.aula.fim > agora));
    agendar(prefs.lembretes ? validos : validos.flatMap((l) => (l.aula ? [{ ...l, quando: 0 }] : [])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura]);
}

const chaveAtualizacao = (a: PortalDiscente['atualizacoes'][number]): string => `${a.data}|${a.turma}|${a.descricao}`;
const CHAVE_VISTAS = 'sigaa-v2:atualizacoes-vistas';

/** Atualizações que não estavam no portal da visita anterior; a primeira visita só registra. */
function useNovasAtualizacoes(portal: PortalDiscente): ReadonlySet<string> {
  const [novas] = useState<ReadonlySet<string>>(() => {
    const atuais = portal.atualizacoes.map(chaveAtualizacao);
    try {
      const vistas = JSON.parse(localStorage.getItem(CHAVE_VISTAS) ?? 'null') as string[] | null;
      localStorage.setItem(CHAVE_VISTAS, JSON.stringify([...new Set([...(vistas ?? []), ...atuais])].slice(-200)));
      return vistas ? new Set(atuais.filter((k) => !vistas.includes(k))) : new Set();
    } catch {
      return new Set();
    }
  });
  return novas;
}

const DOCUMENTOS: readonly { readonly rotulo: string; readonly menu: RegExp; readonly arquivo: boolean }[] = [
  { rotulo: 'Atestado de matrícula', menu: /^emitir atestado de matr[ií]cula$/i, arquivo: false },
  { rotulo: 'Histórico', menu: /^emitir hist[oó]rico$/i, arquivo: true },
  { rotulo: 'Declaração de vínculo', menu: /^emitir declara[cç][aã]o de v[ií]nculo$/i, arquivo: true },
  { rotulo: 'Comprovante de matrícula', menu: /^ver comprovante de matr[ií]cula$/i, arquivo: false },
  { rotulo: 'Minhas notas', menu: /^consultar minhas notas$/i, arquivo: false },
];

/** Documentos mais pedidos a um toque; os que o SIGAA devolve como PDF seguem pelo download do app. */
function Documentos({ portal, className }: { readonly portal: PortalDiscente; readonly className?: string }) {
  const comandos = achatar(portal.menu);
  const itens = DOCUMENTOS.flatMap((d) => {
    const c = comandos.find((x) => d.menu.test(x.rotulo.trim()));
    return c ? [{ ...d, abrir: c.abrir }] : [];
  });
  if (itens.length === 0) return null;
  return (
    <Secao titulo="Documentos" className={className}>
      <div className="cascata grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {itens.map((d) => (
          <button
            key={d.rotulo}
            type="button"
            onClick={() => {
              if (d.arquivo) {
                plataforma.ultimoDownload = Date.now();
                plataforma.prepararDownload();
              }
              d.abrir();
            }}
            className="flex min-h-16 flex-col justify-between gap-2 rounded-2xl border bg-card p-3 text-left text-sm transition-[background-color,transform] hover:bg-accent active:scale-[0.97]"
          >
            <span className="font-mono text-[10px] text-muted-foreground">{d.arquivo ? 'PDF' : 'SIGAA'}</span>
            <span className="font-medium leading-tight">{d.rotulo}</span>
          </button>
        ))}
      </div>
    </Secao>
  );
}
