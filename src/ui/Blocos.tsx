import { useMemo, useState } from 'react';
import { analisarFaltas, analisarNotas, MEDIA_APROVACAO, semestresDeNotas } from '../domain/desempenho';
import { horariosDoCodigo, NOME_DIA_CURTO } from '../domain/horario';
import { GradeSemanal } from './GradeSemanal';
import { fmtNota as fmt, PainelSemestres, TextoPrevisao } from './PainelNotas';
import type { Bloco, Tabela } from '../domain/types';
import { GraficoBarras, Medidor } from './components/Graficos';
import { Card, CardContent, CardHeader, CardTitle } from './components/Card';
import { Sinal } from './components/Glifos';
import { cn } from './cn';

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

function ConteudoBloco({ bloco }: { readonly bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'tabela':
      return <TabelaUI tabela={bloco.tabela} />;
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
      return (
        <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {bloco.pessoas.map((p, i) => (
            <li key={i} className="flex items-center gap-3">
              {p.foto ? (
                <img src={p.foto} alt="" className="h-10 w-10 shrink-0 rounded-full border object-cover" />
              ) : (
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                  {p.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium capitalize">{p.nome.toLowerCase()}</p>
                <p className="truncate text-xs text-muted-foreground">{p.detalhes.join(' · ')}</p>
              </div>
            </li>
          ))}
        </ul>
      );
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

function ResumoDesempenho({ blocos }: { readonly blocos: readonly Bloco[] }) {
  const semestres = semestresDeNotas(blocos);
  if (semestres.length > 0) return <PainelSemestres semestres={semestres} />;
  const faltas = analisarFaltas(blocos);
  const notas = blocos.flatMap((b) => (b.tipo === 'tabela' ? [analisarNotas(b.tabela)] : [])).find(Boolean) ?? null;
  if (!faltas && !notas) return null;

  const restantes = faltas ? Math.max(0, faltas.maximo - faltas.faltas) : 0;
  const unica = notas?.linhas.length === 1 ? notas.linhas[0] : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {faltas && (
        <Card className="flex flex-col items-center gap-2 p-5 text-center">
          <p className="self-start text-sm text-muted-foreground">Faltas</p>
          <Medidor valor={faltas.faltas} maximo={faltas.maximo} rotulo="Faltas" />
          <p className={cn('text-sm', restantes <= faltas.maximo * 0.25 && 'font-medium text-destaque-texto')}>
            {restantes === 0 ? 'Limite de faltas atingido' : `Ainda pode faltar ${restantes}`}
          </p>
        </Card>
      )}
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
  const turmas = blocos.flatMap((b) => {
    if (b.tipo !== 'tabela') return [];
    const { colunas, linhas } = b.tabela;
    const iHorario = colunas.findIndex((c, i) => /hor[aá]rio/i.test(c) || linhas.filter((l) => CODIGO_HORARIO.test(l.celulas[i] ?? '')).length >= Math.max(2, linhas.length / 2));
    if (iHorario < 0) return [];
    const iNome = colunas.findIndex((c) => /disciplina|componente|nome/i.test(c));
    return linhas.flatMap((l) => {
      const horario = l.celulas[iHorario]?.match(CODIGO_HORARIO)?.[0]?.trim();
      const nome = (l.celulas[iNome >= 0 ? iNome : 0] ?? '').split('\n')[0]?.replace(/^\S+\s*-\s*/, '') ?? '';
      return horario && nome ? [{ codigo: '', nome, local: '', horario, acessar: l.abrir ?? (() => {}) }] : [];
    });
  });
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
      <p className="text-sm text-muted-foreground">Grade da semana</p>
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
  for (const g of grupos) g.blocos.sort((a, b) => PRIORIDADE[a.tipo] - PRIORIDADE[b.tipo]);

  return (
    <div className="cascata space-y-4 sm:space-y-6">
      <ResumoDesempenho blocos={blocos} />
      <GradeDasTabelas blocos={blocos} />
      {grupos.map((g, i) => (
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
