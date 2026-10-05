import { useState } from 'react';
import { MEDIA_APROVACAO, prever, type LinhaNotas, type Semestre } from '../domain/desempenho';
import { Card } from './components/Card';
import { GraficoBarras, GraficoLinha } from './components/Graficos';
import { cn } from './cn';

export const fmtNota = (n: number): string => n.toFixed(1).replace('.', ',');

const capitalizar = (s: string): string => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export function TextoPrevisao({ linha, compacto = false }: { readonly linha: LinhaNotas; readonly compacto?: boolean }) {
  const p = prever(linha);
  const classe = compacto ? 'text-xs' : 'text-sm';
  switch (p.tipo) {
    case 'precisa':
      return (
        <p className={classe}>
          Precisa de <strong className="font-mono font-bold text-destaque-texto">{fmtNota(p.nota)}</strong>{' '}
          {p.faltantes === 1 ? 'na unidade restante' : `em média nas ${p.faltantes} unidades restantes`}
        </p>
      );
    case 'recuperacao':
      return (
        <p className={classe}>
          Média {fmtNota(p.media)} · na recuperação precisa de{' '}
          <strong className="font-mono font-bold text-destaque-texto">{fmtNota(p.nota)}</strong>
        </p>
      );
    case 'com-recuperacao':
      return (
        <p className={classe}>
          Só com recuperação: precisa de <strong className="font-mono font-bold text-destaque-texto">{fmtNota(p.nota)}</strong>{' '}
          {p.faltantes === 1 ? 'na unidade restante e na recuperação' : 'nas unidades restantes e na recuperação'}
        </p>
      );
    case 'sem-notas':
      return <p className={cn(classe, 'text-muted-foreground')}>Sem notas lançadas ainda.</p>;
    case 'impossivel':
      return <p className={cn(classe, 'font-medium text-destaque-texto')}>Média {MEDIA_APROVACAO} fora de alcance sem recuperação.</p>;
    case 'encerrada':
      return (
        <p className={classe}>
          Média <strong className="font-mono font-bold">{fmtNota(p.media)}</strong>
          {!p.aprovado && <span className="text-destaque-texto"> · abaixo de {MEDIA_APROVACAO}</span>}
        </p>
      );
    case 'sem-dados':
      return null;
  }
}

export function LinhaDisciplina({ linha }: { readonly linha: LinhaNotas }) {
  return (
    <li className="space-y-2 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-medium">{capitalizar(linha.rotulo)}</p>
        {linha.faltas !== null && (
          <span className={cn('shrink-0 rounded-full border px-2 py-0.5 font-mono text-[11px]', linha.faltas > 0 && 'border-destaque/60')}>
            {linha.faltas} {linha.faltas === 1 ? 'falta' : 'faltas'}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
        {linha.avaliacoes.map((a) => (
          <span key={a.nome}>
            {a.nome.replace(/unidade/i, 'U').replace(/\s+/g, '')} <span className="text-foreground">{a.nota === null ? '—' : fmtNota(a.nota)}</span>
          </span>
        ))}
        {linha.recuperacao !== null && (
          <span>Rec <span className="text-foreground">{fmtNota(linha.recuperacao)}</span></span>
        )}
      </div>
      <TextoPrevisao linha={linha} compacto />
    </li>
  );
}

/** Notas que o aluno espera tirar em cada disciplina em curso, e a média resultante. */
function Simulador({ concluidas, emCurso }: { readonly concluidas: readonly number[]; readonly emCurso: readonly LinhaNotas[] }) {
  const inicial = (l: LinhaNotas): number => {
    const feitas = l.avaliacoes.flatMap((a) => (a.nota === null ? [] : [a.nota]));
    return feitas.length ? Math.round((feitas.reduce((t, x) => t + x, 0) / feitas.length) * 2) / 2 : MEDIA_APROVACAO;
  };
  const [notas, setNotas] = useState<readonly number[]>(() => emCurso.map(inicial));
  const todas = [...concluidas, ...notas];
  const media = todas.length ? todas.reduce((t, x) => t + x, 0) / todas.length : 0;
  const atual = concluidas.length ? concluidas.reduce((t, x) => t + x, 0) / concluidas.length : null;

  return (
    <Card className="space-y-5 p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Simulador de média</p>
          <p className="text-xs text-muted-foreground">Média simples das disciplinas, sem peso de carga horária</p>
        </div>
        <div className="text-right">
          <p className="font-dot text-4xl font-extrabold leading-none">{fmtNota(media)}</p>
          {atual !== null && (
            <p className={cn('font-mono text-xs', media >= atual ? 'text-muted-foreground' : 'text-destaque-texto')}>
              {media >= atual ? '+' : ''}{fmtNota(media - atual)} vs. hoje
            </p>
          )}
        </div>
      </div>
      <ul className="space-y-4">
        {emCurso.map((l, i) => (
          <li key={l.rotulo} className="space-y-1.5">
            <div className="flex justify-between gap-3 text-sm">
              <span className="truncate">{capitalizar(l.rotulo)}</span>
              <span className="font-mono">{fmtNota(notas[i] ?? 0)}</span>
            </div>
            <input
              type="range" min={0} max={10} step={0.5} value={notas[i] ?? 0}
              aria-label={`Nota esperada em ${capitalizar(l.rotulo)}`}
              onChange={(e) => setNotas((atuais) => atuais.map((n, j) => (j === i ? Number(e.target.value) : n)))}
              className="h-6 w-full accent-[hsl(var(--destaque))]"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Painel do relatório "Minhas Notas": evolução, semestre atual com previsões e simulador. */
export function PainelSemestres({ semestres }: { readonly semestres: readonly Semestre[] }) {
  const encerrados = semestres.filter((s) => s.media !== null && !s.emCurso);
  const atual = semestres.find((s) => s.emCurso);
  const concluidas = semestres.flatMap((s) => s.linhas.flatMap((l) => (l.resultado !== null && l.situacao ? [l.resultado] : [])));
  const aprovadas = semestres.reduce((t, s) => t + s.aprovadas, 0);
  const reprovadas = semestres.reduce((t, s) => t + s.reprovadas, 0);
  const emCurso = atual?.linhas.filter((l) => !l.situacao) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-3 p-5">
          <p className="text-sm text-muted-foreground">Média por semestre</p>
          {encerrados.length === 1 ? (
            <div className="flex items-baseline gap-3">
              <span className="font-dot text-6xl font-extrabold">{fmtNota(encerrados[0]?.media ?? 0)}</span>
              <span className="font-mono text-sm text-muted-foreground">{encerrados[0]?.periodo}</span>
            </div>
          ) : encerrados.length > 1 ? (
            <GraficoLinha rotulo="Média por semestre" limite={MEDIA_APROVACAO} pontos={encerrados.map((s) => ({ rotulo: s.periodo, valor: s.media ?? 0 }))} />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum semestre encerrado ainda.</p>
          )}
        </Card>
        <Card className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">Disciplinas cursadas</p>
          <GraficoBarras
            rotulo="Disciplinas"
            barras={[
              { rotulo: 'Aprovadas', valor: aprovadas, destaque: true },
              { rotulo: 'Reprovadas', valor: reprovadas },
              { rotulo: 'Em curso', valor: emCurso.length },
            ]}
          />
        </Card>
      </div>

      {atual && emCurso.length > 0 && (
        <>
          <Card className="overflow-hidden">
            <p className="border-b px-5 py-4 text-sm font-medium">Semestre {atual.periodo} · em curso</p>
            <ul className="cascata divide-y">
              {emCurso.map((l) => (
                <LinhaDisciplina key={l.rotulo} linha={l} />
              ))}
            </ul>
          </Card>
          <Simulador concluidas={concluidas} emCurso={emCurso} />
        </>
      )}
    </div>
  );
}
