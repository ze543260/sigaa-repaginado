import { useEffect, useMemo, useRef, useState } from 'react';
import type { ItemMenu } from '../domain/types';
import { cn } from './cn';
import { CHAVE_FAVORITOS, useConjunto } from './memoria';

interface Props {
  readonly itens: readonly ItemMenu[];
}

export interface Comando {
  readonly caminho: string;
  readonly rotulo: string;
  readonly abrir: () => void;
  readonly chave: string;
  readonly fixavel?: boolean;
}

const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function achatar(itens: readonly ItemMenu[], caminho: readonly string[] = []): Comando[] {
  return itens.flatMap((item) => {
    if (item.separador) return [];
    if (item.filhos.length > 0) return achatar(item.filhos, [...caminho, item.rotulo]);
    if (!item.abrir) return [];
    const trilha = caminho.join(' › ');
    return [{ caminho: trilha, rotulo: item.rotulo, abrir: item.abrir, chave: normalizar(`${trilha} ${item.rotulo}`), fixavel: true }];
  });
}

const EVENTO_ABRIR = 'sigaa:buscar';

export const abrirBusca = (): void => {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
};

const Estrela = ({ cheia }: { readonly cheia: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill={cheia ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.5 2.9 1-6.1-4.4-4.3 6.1-.9z" strokeLinejoin="round" />
  </svg>
);

/** Itens do menu marcados com estrela na busca, como atalhos na tela inicial. */
export function Favoritos({ itens, className }: Props & { readonly className?: string }) {
  const [favoritos] = useConjunto(CHAVE_FAVORITOS);
  const comandos = useMemo(() => achatar(itens), [itens]).filter((c) => favoritos.has(c.chave));
  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="flex items-center px-1 text-sm font-medium text-muted-foreground">
        <span className="mr-auto">Favoritos</span>
        <button type="button" onClick={abrirBusca} className="rounded-full px-2 py-1 text-xs hover:bg-accent">
          {comandos.length ? 'Editar' : 'Adicionar'}
        </button>
      </h2>
      {comandos.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">Toque na estrela de um item da busca para fixá-lo aqui.</p>
      ) : (
        <div className="cascata flex flex-wrap gap-2">
          {comandos.map((c) => (
            <button
              key={c.chave}
              type="button"
              onClick={c.abrir}
              className="min-h-11 rounded-full border bg-card px-4 text-sm transition-[background-color,transform] hover:bg-accent active:scale-95 lg:min-h-9"
            >
              {c.rotulo}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export const comando = (caminho: string, rotulo: string, abrir: () => void): Comando => ({ caminho, rotulo, abrir, chave: normalizar(`${caminho} ${rotulo}`) });

export function BuscaComandos({ itens, extras = [] }: Props & { readonly extras?: readonly Comando[] }) {
  const [favoritos, alternarFavorito] = useConjunto(CHAVE_FAVORITOS);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const comandos = useMemo(() => [...extras, ...achatar(itens)], [itens, extras]);

  const resultados = useMemo(() => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean);
    const achados = comandos.filter((c) => termos.every((t) => c.chave.includes(t)));
    // Sem busca, os favoritos vêm primeiro para facilitar editar a lista.
    return (termos.length ? achados : [...achados].sort((a, b) => Number(favoritos.has(b.chave)) - Number(favoritos.has(a.chave)))).slice(0, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, comandos]);

  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAberto((a) => !a);
      }
    };
    const abrir = () => setAberto(true);
    window.addEventListener('keydown', atalho);
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => {
      window.removeEventListener('keydown', atalho);
      window.removeEventListener(EVENTO_ABRIR, abrir);
    };
  }, []);

  useEffect(() => {
    if (aberto) {
      setBusca('');
      setAtivo(0);
      campo.current?.focus();
    }
  }, [aberto]);

  const executar = (c: Comando | undefined) => {
    if (!c) return;
    setAberto(false);
    c.abrir();
  };

  const navegar = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setAtivo((a) => Math.min(a + 1, resultados.length - 1));
    else if (e.key === 'ArrowUp') setAtivo((a) => Math.max(a - 1, 0));
    else if (e.key === 'Enter') executar(resultados[ativo]);
    else if (e.key === 'Escape') setAberto(false);
    else return;
    e.preventDefault();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="hidden h-8 items-center gap-3 rounded-full md:inline-flex border bg-transparent px-3.5 text-xs text-muted-foreground transition-colors hover:bg-accent sm:w-56 sm:justify-between"
      >
        <span className="hidden sm:inline">Buscar no SIGAA</span>
        <span className="sm:hidden">Buscar</span>
        <kbd className="hidden rounded-full border px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 animate-[entrar_120ms_ease-out_both] bg-background/85 p-4" onPointerDown={() => setAberto(false)}>
          <div
            className="mx-auto mt-[15vh] w-full max-w-lg animate-surgir overflow-hidden rounded-3xl border bg-card text-card-foreground"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              ref={campo}
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setAtivo(0);
              }}
              onKeyDown={navegar}
              placeholder="Turmas, atividades, novidades ou menu…"
              className="h-14 w-full border-b bg-transparent px-5 text-base outline-none placeholder:text-muted-foreground"
            />
            <ul className="max-h-80 overflow-y-auto p-1">
              {resultados.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">Nenhum resultado.</li>
              )}
              {resultados.map((c, i) => (
                <li key={c.chave} className={cn('flex items-center rounded-2xl', i === ativo && 'bg-accent')}>
                  <button
                    type="button"
                    onMouseMove={() => setAtivo(i)}
                    onClick={() => executar(c)}
                    className="flex min-w-0 flex-1 flex-col px-4 py-2.5 text-left"
                  >
                    <span className="text-sm">{c.rotulo}</span>
                    <span className="text-xs text-muted-foreground">{c.caminho}</span>
                  </button>
                  {c.fixavel && <button
                    type="button"
                    aria-pressed={favoritos.has(c.chave)}
                    aria-label={favoritos.has(c.chave) ? `Remover ${c.rotulo} dos favoritos` : `Fixar ${c.rotulo} nos favoritos`}
                    onClick={() => alternarFavorito(c.chave)}
                    className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full active:scale-90', favoritos.has(c.chave) ? 'text-destaque-texto' : 'text-muted-foreground')}
                  >
                    <Estrela cheia={favoritos.has(c.chave)} />
                  </button>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
