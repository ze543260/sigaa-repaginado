import { useEffect, useRef, useState } from 'react';
import { resumirHorario } from '../domain/horario';
import { ehSecaoAtual } from '../domain/secao';
import type { Material, Noticia, PaginaTurma, Topico } from '../domain/types';
import { Avisos, Blocos } from './Blocos';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { cn } from './cn';

interface Props {
  readonly turma: PaginaTurma;
}

const ROTULO_TIPO: Readonly<Record<Material['tipo'], string>> = {
  pdf: 'PDF',
  zip: 'ZIP',
  tarefa: 'Tarefa',
  arquivo: 'Arquivo',
};

const AULAS_ABERTAS = 3;
const NOTICIA_CURTA = 180;

const Seta = () => (
  <svg
    viewBox="0 0 16 16"
    className="h-4 w-4 shrink-0 opacity-50 transition-transform [details[open]>summary>&]:rotate-90"
    aria-hidden="true"
  >
    <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/** "T01 (2026.2 - 3M23 5M45)" → "T01 · 2026.2 · Ter manhã, Qui manhã" */
function descreverTurma(info: string): string {
  const partes = info.match(/^(\S+)\s*\((\S+)\s*-\s*(.+)\)$/);
  if (!partes) return info;
  const [, turma = '', periodo = '', horario = ''] = partes;
  return [turma, periodo, resumirHorario(horario)].filter(Boolean).join(' · ');
}

function ItemMaterial({ material }: { readonly material: Material }) {
  return (
    <button
      type="button"
      disabled={!material.abrir}
      onClick={material.abrir ?? undefined}
      className="flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm transition-[background-color,transform] hover:bg-accent active:scale-[0.98]"
    >
      <span
        className={cn(
          'w-14 shrink-0 rounded-full px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold',
          material.tipo === 'tarefa' ? 'bg-destaque text-white' : 'bg-secondary text-secondary-foreground',
        )}
      >
        {ROTULO_TIPO[material.tipo]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium [overflow-wrap:anywhere] sm:truncate">{material.nome}</span>
        {material.descricao && <span className="block text-xs text-muted-foreground">{material.descricao}</span>}
      </span>
    </button>
  );
}

function CartaoNoticia({ noticia }: { readonly noticia: Noticia }) {
  const [aberta, setAberta] = useState(false);
  const longa = noticia.paragrafos.join(' ').length > NOTICIA_CURTA;

  return (
    <Card className="space-y-3 p-5 sm:p-6">
      <div>
        <p className="text-xs text-muted-foreground">Última notícia</p>
        <h2 className="font-medium leading-snug">{noticia.titulo}</h2>
      </div>
      {longa && !aberta ? (
        <p className="line-clamp-3 text-sm">{noticia.paragrafos.join(' ')}</p>
      ) : (
        <div className="space-y-2 text-sm">
          {noticia.paragrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        {noticia.autor && <span className="capitalize">{noticia.autor.toLowerCase()}</span>}
        {longa && (
          <button
            type="button"
            onClick={() => setAberta((a) => !a)}
            className="min-h-9 shrink-0 rounded-full px-3 font-medium text-foreground hover:bg-accent"
          >
            {aberta ? 'Mostrar menos' : 'Ler mais'}
          </button>
        )}
      </div>
    </Card>
  );
}

function CartaoAula({ topico, aberto }: { readonly topico: Topico; readonly aberto: boolean }) {
  const materiais = topico.materiais.length;
  return (
    <details open={aberto} className="rounded-3xl border bg-card">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block font-medium leading-snug">{topico.titulo}</span>
          <span className="block font-mono text-xs text-muted-foreground">
            {topico.periodo}
            {materiais > 0 && ` · ${materiais} ${materiais === 1 ? 'material' : 'materiais'}`}
          </span>
        </span>
        <Seta />
      </summary>
      <div className="space-y-3 px-5 pb-5">
        {topico.paragrafos.length > 0 && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {topico.paragrafos.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </div>
        )}
        {materiais > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {topico.materiais.map((m, j) => (
              <ItemMaterial key={j} material={m} />
            ))}
          </div>
        )}
        {topico.paragrafos.length === 0 && materiais === 0 && (
          <p className="text-sm text-muted-foreground">Sem conteúdo publicado nesta aula.</p>
        )}
      </div>
    </details>
  );
}

const INTERVALO_DOWNLOAD_MS = 2500;

/** Baixa os arquivos um por vez: cada download é um envio de formulário JSF e eles não podem se sobrepor. */
function BaixarTodos({ topicos }: { readonly topicos: readonly Topico[] }) {
  const arquivos = topicos.flatMap((t) => t.materiais).filter((m) => m.tipo !== 'tarefa' && m.abrir);
  const [feitos, setFeitos] = useState<number | null>(null);
  const espera = useRef(0);
  useEffect(() => () => window.clearTimeout(espera.current), []);

  if (arquivos.length < 2) return null;

  const baixar = (i: number) => {
    if (i >= arquivos.length) {
      setFeitos(null);
      return;
    }
    setFeitos(i + 1);
    arquivos[i]?.abrir?.();
    espera.current = window.setTimeout(() => baixar(i + 1), INTERVALO_DOWNLOAD_MS);
  };
  const cancelar = () => {
    window.clearTimeout(espera.current);
    setFeitos(null);
  };

  return feitos === null ? (
    <Button variant="outline" onClick={() => baixar(0)} className="h-11 w-full lg:h-9 lg:w-auto">
      Baixar todos os materiais · {arquivos.length}
    </Button>
  ) : (
    <div className="flex items-center gap-3 rounded-3xl border p-3 pl-5 text-sm" role="status">
      <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 flex-1" aria-hidden="true">
        <rect width="100" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
        <rect width={(feitos / arquivos.length) * 100} height="6" rx="3" fill="hsl(var(--destaque))" className="transition-[width] duration-500" />
      </svg>
      <span className="font-mono text-xs tabular-nums">{feitos}/{arquivos.length}</span>
      <Button variant="ghost" size="sm" onClick={cancelar}>Parar</Button>
    </div>
  );
}

function Principal({ noticia, topicos }: { readonly noticia: Noticia | null; readonly topicos: readonly Topico[] }) {
  const recentes = [...topicos].reverse();
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const visiveis = mostrarTodas ? recentes : recentes.slice(0, AULAS_ABERTAS);

  return (
    <>
      {noticia && <CartaoNoticia noticia={noticia} />}
      <section className="space-y-3">
        <h2 className="px-1 text-sm font-medium text-muted-foreground">Aulas · {topicos.length}</h2>
        <BaixarTodos topicos={topicos} />
        {topicos.length === 0 ? (
          <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma aula publicada ainda.</Card>
        ) : (
          <ol className="cascata space-y-2">
            {visiveis.map((t, i) => (
              <li key={`${t.periodo}-${t.titulo}`}>
                <CartaoAula topico={t} aberto={i < AULAS_ABERTAS} />
              </li>
            ))}
          </ol>
        )}
        {recentes.length > AULAS_ABERTAS && (
          <button
            type="button"
            onClick={() => setMostrarTodas((m) => !m)}
            className="flex min-h-12 w-full items-center justify-center rounded-3xl border text-sm text-muted-foreground hover:bg-accent"
          >
            {mostrarTodas ? 'Mostrar só as recentes' : `Ver aulas anteriores · ${recentes.length - AULAS_ABERTAS}`}
          </button>
        )}
      </section>
    </>
  );
}

export function Turma({ turma }: Props) {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-[220px_1fr]">
      <aside className="hidden space-y-6 lg:sticky lg:top-24 lg:block lg:self-start">
        {turma.voltarPortal && (
          <Button variant="outline" size="sm" className="w-full" onClick={turma.voltarPortal}>
            ← Voltar ao portal
          </Button>
        )}
        {turma.menu.map((secao) => (
          <nav key={secao.titulo} className="space-y-1">
            <p className="px-3 text-xs font-medium text-muted-foreground">{secao.titulo}</p>
            {secao.itens.map((item) => {
              const atual = ehSecaoAtual(item.rotulo, turma.secaoAtual);
              return (
                <button
                  key={item.rotulo}
                  type="button"
                  onClick={item.abrir}
                  aria-current={atual ? 'page' : undefined}
                  className={cn(
                    'block w-full rounded-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                    atual && 'bg-accent font-medium',
                  )}
                >
                  {item.rotulo}
                </button>
              );
            })}
          </nav>
        ))}
      </aside>

      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <span className="inline-flex rounded-full border px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {turma.codigo}
          </span>
          <h1 className="font-dot text-3xl font-extrabold capitalize leading-none sm:text-6xl">{turma.nome.toLowerCase()}</h1>
          <p className="text-sm text-muted-foreground sm:text-base">{descreverTurma(turma.info)}</p>
        </div>

        <Avisos avisos={turma.avisos} />
        {turma.conteudo.tipo === 'principal' ? (
          <Principal noticia={turma.conteudo.noticia} topicos={turma.conteudo.topicos} />
        ) : (
          <Blocos blocos={turma.conteudo.blocos} />
        )}
      </div>
    </main>
  );
}
