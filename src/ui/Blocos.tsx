import { tituloBr } from '../domain/texto';
import { useMemo, useState } from 'react';
import { analisarFaltas, analisarNotas, MEDIA_APROVACAO, registrosDeFrequencia, semestresDeNotas, type RegistroAula } from '../domain/desempenho';
import { horariosDoCodigo, NOME_DIA_CURTO } from '../domain/horario';
import { GradeSemanal } from './GradeSemanal';
import { fmtNota as fmt, PainelSemestres, TextoPrevisao } from './PainelNotas';
import type { Bloco, Pessoa, Tabela } from '../domain/types';
import { GraficoBarras, Medidor } from './components/Graficos';
import { Card, CardContent, CardHeader, CardTitle } from './components/Card';
import { Sinal } from './components/Glifos';
import { cn } from './cn';
import { usarPreferencias } from './tema';

const corSituacao = (valor: string): string => {
  if (/REPROVADO|TRANCADO|CANCELADO|Falta/i.test(valor)) return 'font-medium text-destaque-texto';
  return '';
};

function CelulaTexto({ texto }: { readonly texto: string }) {
  const [primeira, ...resto] = texto.split('\n');
  if (resto.length === 0) return <>{primeira}</>;
  return (
    <>
      <span className="block font-medium">{primeira}</span>
      <span className="block text-xs text-muted-foreground">{resto.join('\n')}</span>
    </>
  );
}

const DIAS_NOVIDADE = 3;

/** Células de nota que mudaram desde a última visita, mantidas como "novas" por alguns dias. */
function useNovidades(tabela: Tabela): ReadonlySet<string> {
  return useMemo(() => {
    const analise = analisarNotas(tabela);
    if (!analise) return new Set<string>();
    const chave = `sigaa-v2:notas:${tabela.colunas.join('|')}:${tabela.linhas.map((l) => l.celulas[0]?.slice(0, 20)).join('|')}`;
    const atual: Record<string, string> = {};
    for (const [n, l] of tabela.linhas.entries()) for (const i of analise.colunas) if (l.celulas[i]) atual[`${n},${i}`] = l.celulas[i] ?? '';

    try {
      const salvo = JSON.parse(localStorage.getItem(chave) ?? 'null') as { valores: Record<string, string>; novas: Record<string, number> } | null;
      const agora = Date.now();
      const novas: Record<string, number> = {};
      for (const [k, ate] of Object.entries(salvo?.novas ?? {})) if (ate > agora && atual[k] === salvo?.valores[k]) novas[k] = ate;
      if (salvo) for (const [k, v] of Object.entries(atual)) if (salvo.valores[k] !== v) novas[k] = agora + DIAS_NOVIDADE * 86_400_000;
      localStorage.setItem(chave, JSON.stringify({ valores: atual, novas }));
      return new Set(Object.keys(novas));
    } catch {
      return new Set<string>();
    }
  }, [tabela]);
}

const PontoNovo = () => (
  <span className="ml-1.5 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-destaque align-middle pulso" title="Nota nova" aria-label="nova" />
);

function TabelaUI({ tabela }: { readonly tabela: Tabela }) {
  const novidades = useNovidades(tabela);
  if (tabela.linhas.length === 0) {
    return <p className="p-6 text-center text-sm text-muted-foreground">Nenhum registro.</p>;
  }
  const colunas = tabela.colunas.length > 0 ? tabela.colunas : (tabela.linhas[0]?.celulas.map(() => '') ?? []);
  const visiveis = colunas
    .map((c, i) => ({ c, i }))
    .filter(({ i }) => tabela.linhas.some((l) => l.celulas[i]));

  const vazio = (v: string | undefined) => !v || /^-{2,3}$/.test(v);
  const ehGrade = visiveis.length >= 6;
  const principal =
    visiveis.find(({ c }) => /disciplina|componente|t[ií]tulo|descri|atividade/i.test(c)) ??
    visiveis.reduce((maior, atual) => {
      const tamanho = (i: number) => tabela.linhas.reduce((t, l) => t + (l.celulas[i]?.length ?? 0), 0);
      return tamanho(atual.i) > tamanho(maior.i) ? atual : maior;
    }, visiveis[0] ?? { c: '', i: 0 });

  const tabelaCompleta = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {colunas.some(Boolean) && (
          <thead>
            <tr className="border-b">
              {visiveis.map(({ c, i }) => (
                <th key={i} className="h-10 whitespace-nowrap px-5 text-left align-middle text-xs font-medium text-muted-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {tabela.linhas.map((linha, n) => (
            <tr
              key={n}
              onClick={linha.abrir ?? undefined}
              className={cn('border-b transition-colors last:border-0', linha.abrir && 'cursor-pointer hover:bg-accent')}
            >
              {visiveis.map(({ i }) => (
                <td key={i} className={cn('whitespace-pre-line px-5 py-3 align-top', corSituacao(linha.celulas[i] ?? ''))}>
                  {vazio(linha.celulas[i]) ? (
                    <span className="text-muted-foreground" aria-label="vazio">·</span>
                  ) : (
                    <CelulaTexto texto={linha.celulas[i] ?? ''} />
                  )}
                  {novidades.has(`${n},${i}`) && <PontoNovo />}
                  {i === visiveis[0]?.i && linha.nota && (
                    <p className="mt-1 max-w-prose text-xs font-normal text-muted-foreground">{linha.nota}</p>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (ehGrade) return tabelaCompleta;

  return (
    <>
      <ul className="cascata divide-y sm:hidden">
        {tabela.linhas.map((linha, n) => {
          const detalhes = visiveis.filter(({ i }) => i !== principal.i && !vazio(linha.celulas[i]));
          const Raiz = linha.abrir ? 'button' : 'div';
          return (
            <li key={n}>
              <Raiz
                {...(linha.abrir ? { type: 'button' as const, onClick: linha.abrir } : {})}
                className={cn('block w-full space-y-2 px-5 py-4 text-left text-sm', linha.abrir && 'active:bg-accent')}
              >
                <div className="whitespace-pre-line">
                  <CelulaTexto texto={linha.celulas[principal.i] ?? ''} />
                </div>
                {detalhes.length > 0 && (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {detalhes.map(({ c, i }) => (
                      <div key={i} className={cn('min-w-0', (linha.celulas[i]?.length ?? 0) > 18 && 'col-span-2')}>
                        <dt className="text-xs text-muted-foreground">{c}</dt>
                        <dd className={cn('whitespace-pre-line break-words', corSituacao(linha.celulas[i] ?? ''))}>
                          {linha.celulas[i]}
                          {novidades.has(`${n},${i}`) && <PontoNovo />}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {linha.nota && <p className="text-xs text-muted-foreground">{linha.nota}</p>}
              </Raiz>
            </li>
          );
        })}
      </ul>
      <div className="hidden sm:block">{tabelaCompleta}</div>
    </>
  );
}

const TEXTO_CURTO = 220;

function TextoRecolhivel({ paragrafos }: { readonly paragrafos: readonly string[] }) {
  const [aberto, setAberto] = useState(false);
  const longo = paragrafos.join(' ').length > TEXTO_CURTO;
  return (
    <div className="space-y-2 p-5 text-sm sm:p-6">
      {longo && !aberto ? (
        <p className="line-clamp-3">{paragrafos.join(' ')}</p>
      ) : (
        <div className="space-y-2">
          {paragrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {longo && (
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="-ml-3 min-h-9 rounded-full px-3 text-xs font-medium hover:bg-accent"
        >
          {aberto ? 'Mostrar menos' : 'Ler mais'}
        </button>
      )}
    </div>
  );
}

// Resumos (pares) antes de tabelas e textos: no celular o número importante aparece sem rolar.
const PRIORIDADE: Readonly<Record<Bloco['tipo'], number>> = {
  pares: 0,
  vazio: 1,
  tabela: 2,
  pessoas: 2,
  imagem: 2,
  texto: 3,
};

const normalizar = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function ListaPessoas({ pessoas }: { readonly pessoas: readonly Pessoa[] }) {
  const [busca, setBusca] = useState('');
  const termo = normalizar(busca.trim());
  const visiveis = termo ? pessoas.filter((p) => normalizar(`${p.nome} ${p.detalhes.join(' ')}`).includes(termo)) : pessoas;
  return (
    <div className="space-y-4 p-5 sm:p-6">
      {pessoas.length > 8 && (
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={`Buscar entre ${pessoas.length} pessoas`}
          className="h-11 w-full rounded-full border bg-transparent px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((p, i) => {
          const email = p.detalhes.find((d) => d.includes('@'));
          return (
            <li key={i} className="flex min-w-0 items-center gap-3">
              {p.foto ? (
                <img src={p.foto} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full border object-cover" />
              ) : (
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                  {p.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tituloBr(p.nome)}</p>
                <p className="truncate text-xs text-muted-foreground">{p.detalhes.filter((d) => d !== email).map(tituloBr).join(' · ')}</p>
              </div>
              {email && (
                <a href={`mailto:${email}`} target="_top" aria-label={`E-mail para ${tituloBr(p.nome)}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-accent">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {visiveis.length === 0 && <p className="text-center text-sm text-muted-foreground">Ninguém encontrado.</p>}
    </div>
  );
}

const EXTENSAO_ROTULO = (nome: string): string => nome.match(/\.([a-z0-9]{1,4})$/i)?.[1]?.toUpperCase() ?? 'ARQ';

function ListaArquivos({ tabela, iTopico }: { readonly tabela: Tabela; readonly iTopico: number }) {
  const grupos = tabela.linhas.reduce<Map<string, Tabela['linhas'][number][]>>((acc, l) => {
    const topico = l.celulas[iTopico] || 'Sem aula';
    acc.set(topico, [...(acc.get(topico) ?? []), l]);
    return acc;
  }, new Map());
  return (
    <div className="divide-y">
      {[...grupos.entries()].map(([topico, linhas]) => (
        <section key={topico} className="space-y-2 p-4 sm:p-5">
          <h3 className="text-xs font-medium text-muted-foreground">{topico}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {linhas.map((l, i) => (
              <li key={i}>
                <button
                  type="button"
                  disabled={!l.abrir}
                  onClick={l.abrir ?? undefined}
                  className="flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <span className="w-12 shrink-0 rounded-md bg-secondary py-1 text-center font-mono text-[10px] font-semibold">{EXTENSAO_ROTULO(l.celulas[0] ?? '')}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium [overflow-wrap:anywhere]">{l.celulas[0]}</span>
                    {l.celulas[1] && <span className="block text-xs text-muted-foreground">{l.celulas[1]}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ConteudoBloco({ bloco }: { readonly bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'tabela': {
      const iTopico = bloco.tabela.colunas.findIndex((c) => /t[oó]pico de aula/i.test(c));
      return iTopico > 0 ? <ListaArquivos tabela={bloco.tabela} iTopico={iTopico} /> : <TabelaUI tabela={bloco.tabela} />;
    }
    case 'pares':
      return (
        <dl className="grid gap-x-6 gap-y-1 p-5 text-sm sm:grid-cols-[minmax(140px,auto)_1fr] sm:gap-y-3 sm:p-6">
          {bloco.pares.map((p, i) => (
            <div key={i} className="contents">
              <dt className="text-muted-foreground">{p.rotulo}</dt>
              <dd className="whitespace-pre-line pb-2 font-medium sm:pb-0">{p.valor}</dd>
            </div>
          ))}
        </dl>
      );
    case 'texto':
      return <TextoRecolhivel paragrafos={bloco.paragrafos} />;
    case 'vazio':
      return <p className="p-6 text-center text-sm text-muted-foreground">{bloco.mensagem}</p>;
    case 'imagem':
      return <img src={bloco.src} alt={bloco.titulo} className="mx-auto max-w-full p-6" />;
    case 'pessoas':
      return <ListaPessoas pessoas={bloco.pessoas} />;
  }
}

export function Avisos({ avisos }: { readonly avisos: readonly string[] }) {
  if (avisos.length === 0) return null;
  return (
    <div role="status" className="space-y-1 rounded-3xl border border-destaque/50 px-5 py-4 text-sm">
      {avisos.map((a, i) => (
        <p key={i} className="flex items-center gap-2">
          <Sinal ativo={false} />
          {a}
        </p>
      ))}
    </div>
  );
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Cada aula registrada vira um quadrado: presença, falta (com quantas) ou ainda sem registro. */
function ToleranciaFaltas({ registros, maximo }: { readonly registros: readonly RegistroAula[]; readonly maximo: number }) {
  let acumulado = 0;
  const celula = 'border border-foreground/40 px-2 py-1.5';
  return (
    <div className="overflow-x-auto sm:col-span-2">
      <table className="w-full border-collapse border-2 border-foreground/60 text-left text-xs uppercase tracking-wide">
        <thead>
          <tr className="font-semibold">
            <th className={celula}>Data</th>
            <th className={cn(celula, 'text-center')}>Desvio</th>
            <th className={cn(celula, 'text-center')}>Acum.</th>
            <th className={cn(celula, 'text-center')}>Tol. {maximo}</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {registros.map((r) => {
            acumulado += r.faltas ?? 0;
            const situacao = acumulado > maximo ? 'FORA' : acumulado >= maximo * 0.75 ? 'LIMITE' : 'OK';
            return (
              <tr key={r.data} className={cn(r.faltas === null && 'text-muted-foreground')}>
                <td className={celula}>{r.data}</td>
                <td className={cn(celula, 'text-center')}>{r.faltas === null ? '—' : r.faltas ? `+${r.faltas}` : '0'}</td>
                <td className={cn(celula, 'text-center')}>{acumulado}</td>
                <td className={cn(celula, 'text-center font-semibold', situacao !== 'OK' && 'text-destaque-texto')}>{situacao}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CalendarioFrequencia({ registros }: { readonly registros: readonly RegistroAula[] }) {
  const porMes = registros.reduce<Map<string, RegistroAula[]>>((acc, r) => {
    const [, mes = '', ano = ''] = r.data.split('/');
    const chave = `${MESES[Number(mes) - 1] ?? mes}/${ano.slice(2)}`;
    acc.set(chave, [...(acc.get(chave) ?? []), r]);
    return acc;
  }, new Map());
  return (
    <Card className="space-y-4 p-5 sm:col-span-2">
      <p className="text-sm text-muted-foreground">Aula a aula</p>
      <div className="space-y-3">
        {[...porMes.entries()].map(([mes, lista]) => (
          <div key={mes} className="flex items-start gap-3">
            <span className="w-12 shrink-0 pt-2 font-mono text-xs text-muted-foreground">{mes}</span>
            <ul className="cascata flex flex-wrap gap-1.5">
              {lista.map((r) => (
                <li
                  key={r.data}
                  title={`${r.data}: ${r.faltas === null ? 'não registrada' : r.faltas === 0 ? 'presente' : `${r.faltas} falta(s)`}`}
                  className={cn(
                    'relative grid h-10 w-10 place-items-center rounded-xl font-mono text-xs',
                    r.faltas === null && 'border border-dashed text-muted-foreground',
                    r.faltas === 0 && 'bg-foreground/10',
                    r.faltas !== null && r.faltas > 0 && 'bg-destaque font-bold text-white',
                  )}
                >
                  {r.data.slice(0, 2)}
                  {r.faltas !== null && r.faltas > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-background px-1 text-[9px] text-destaque-texto ring-1 ring-destaque">
                      {r.faltas}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-foreground/10" /> presente</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destaque" /> falta</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed" /> sem registro</span>
      </p>
    </Card>
  );
}

function ResumoDesempenho({ blocos }: { readonly blocos: readonly Bloco[] }) {
  const estilo = usarPreferencias().prefs.estilo;
  const semestres = semestresDeNotas(blocos);
  if (semestres.length > 0) return <PainelSemestres semestres={semestres} />;
  const faltas = analisarFaltas(blocos);
  const notas = blocos.flatMap((b) => (b.tipo === 'tabela' ? [analisarNotas(b.tabela)] : [])).find(Boolean) ?? null;
  if (!faltas && !notas) return null;

  const restantes = faltas ? faltas.maximo - faltas.faltas : 0;
  const registros = registrosDeFrequencia(blocos);
  const unica = notas?.linhas.length === 1 ? notas.linhas[0] : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {faltas && (
        <Card className="flex flex-col items-center gap-2 p-5 text-center">
          <p className="self-start text-sm text-muted-foreground">Faltas</p>
          <Medidor valor={faltas.faltas} maximo={faltas.maximo} rotulo="Faltas" />
          <p className={cn('text-sm', restantes <= faltas.maximo * 0.25 && 'font-medium text-destaque-texto')}>
            {restantes < 0
              ? `Passou do limite de ${faltas.maximo} faltas`
              : restantes === 0
                ? 'No limite: mais uma falta reprova'
                : `Ainda pode faltar ${restantes}`}
          </p>
        </Card>
      )}
      {registros.length > 0 &&
        (estilo === 'mecanica' && faltas ? <ToleranciaFaltas registros={registros} maximo={faltas.maximo} /> : <CalendarioFrequencia registros={registros} />)}
      {unica && unica.avaliacoes.length > 0 && (
        <Card className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">Notas · média {MEDIA_APROVACAO}</p>
          <GraficoBarras
            rotulo="Notas"
            maximo={10}
            limite={MEDIA_APROVACAO}
            barras={unica.avaliacoes.map((a) => ({ rotulo: a.nome, valor: a.nota ?? 0, detalhe: a.nota === null ? '—' : fmt(a.nota) }))}
          />
          <TextoPrevisao linha={unica} />
        </Card>
      )}
      {notas && !unica && (
        <Card className="space-y-4 p-5 sm:col-span-2">
          <p className="text-sm text-muted-foreground">Médias · linha em {MEDIA_APROVACAO}</p>
          <GraficoBarras
            rotulo="Médias por disciplina"
            maximo={10}
            limite={MEDIA_APROVACAO}
            barras={notas.linhas.flatMap((l) => {
              const feitas = l.avaliacoes.flatMap((a) => (a.nota === null ? [] : [a.nota]));
              const media = l.resultado ?? (feitas.length ? feitas.reduce((t, n) => t + n, 0) / feitas.length : null);
              return media === null ? [] : [{ rotulo: l.rotulo.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()), valor: media, detalhe: fmt(media) }];
            })}
          />
        </Card>
      )}
    </div>
  );
}

const CODIGO_HORARIO = /^\s*[1-7]+[MTN][1-6]+(\s+[1-7]+[MTN][1-6]+)*/;

/** Tabelas com coluna de horário (matrícula, comprovante, turmas) viram grade semanal com conflitos marcados. */
function GradeDasTabelas({ blocos }: { readonly blocos: readonly Bloco[] }) {
  const grupos = blocos.map((b) => {
    if (b.tipo !== 'tabela') return { titulo: '', turmas: [] };
    const { colunas, linhas } = b.tabela;
    const iHorario = colunas.findIndex((c, i) => /hor[aá]rio/i.test(c) || linhas.filter((l) => CODIGO_HORARIO.test(l.celulas[i] ?? '')).length >= Math.max(2, linhas.length / 2));
    if (iHorario < 0) return { titulo: '', turmas: [] };
    const iNome = colunas.findIndex((c) => /disciplina|componente|nome/i.test(c));
    const daTabela = linhas.flatMap((l) => {
      const horario = l.celulas[iHorario]?.match(CODIGO_HORARIO)?.[0]?.trim();
      const nome = (l.celulas[iNome >= 0 ? iNome : 0] ?? '').split('\n')[0]?.replace(/^\S+\s*-\s*/, '') ?? '';
      return horario && nome ? [{ codigo: '', nome, local: '', horario, acessar: l.abrir ?? (() => {}) }] : [];
    });
    return { titulo: b.titulo, turmas: daTabela };
  }).filter((g) => g.turmas.length > 0);
  // Tabelas separadas por semestre (ex.: todas as turmas): só o mais recente vira grade, senão sobram conflitos falsos.
  const porSemestre = grupos.length > 1 && grupos.every((g) => /^\d{4}\.\d/.test(g.titulo));
  const turmas = porSemestre ? grupos[0]!.turmas : grupos.flatMap((g) => g.turmas);
  if (turmas.length < 2) return null;

  const ocupacao = new Map<string, string[]>();
  for (const t of turmas) {
    for (const h of horariosDoCodigo(t.horario)) {
      const chave = `${h.dia}|${h.turno}${h.aula}`;
      ocupacao.set(chave, [...(ocupacao.get(chave) ?? []), t.nome]);
    }
  }
  const conflitos = [...ocupacao.entries()].filter(([, nomes]) => new Set(nomes).size > 1);

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">Grade da semana{porSemestre && ` · ${grupos[0]!.titulo}`}</p>
      <GradeSemanal turmas={turmas} />
      {conflitos.length > 0 && (
        <div role="alert" className="space-y-1 rounded-2xl border border-destaque/60 px-4 py-3 text-sm">
          <p className="font-medium text-destaque-texto">Conflito de horário</p>
          {conflitos.map(([chave, nomes]) => {
            const [dia, aula] = chave.split('|');
            return (
              <p key={chave} className="text-xs">
                <span className="font-mono">{NOME_DIA_CURTO[Number(dia)]} {aula}</span> · {[...new Set(nomes)].map((n) => n.toLowerCase()).join(' × ')}
              </p>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function Blocos({ blocos }: { readonly blocos: readonly Bloco[] }) {
  const grupos = blocos.reduce<{ titulo: string; blocos: Bloco[] }[]>((acc, b) => {
    const ultimo = acc[acc.length - 1];
    if (ultimo && ultimo.titulo === b.titulo) ultimo.blocos.push(b);
    else acc.push({ titulo: b.titulo, blocos: [b] });
    return acc;
  }, []);
  for (const g of grupos) {
    g.blocos = g.blocos.filter((b) => registrosDeFrequencia([b]).length === 0);
  }
  for (const g of grupos) g.blocos.sort((a, b) => PRIORIDADE[a.tipo] - PRIORIDADE[b.tipo]);

  return (
    <div className="cascata space-y-4 sm:space-y-6">
      <ResumoDesempenho blocos={blocos} />
      <GradeDasTabelas blocos={blocos} />
      {grupos.filter((g) => g.blocos.length > 0).map((g, i) => (
        <Card key={i} className="overflow-hidden">
          {g.titulo && (
            <CardHeader className="border-b p-5 pb-4 sm:p-6 sm:pb-4">
              <CardTitle className="text-base">{g.titulo}</CardTitle>
            </CardHeader>
          )}
          <CardContent className="p-0">
            <div className="divide-y">
              {g.blocos.map((b, j) => (
                <ConteudoBloco key={j} bloco={b} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
