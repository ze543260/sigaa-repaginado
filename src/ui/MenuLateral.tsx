import { useEffect } from 'react';
import type { ItemMenu } from '../domain/types';
import { cn } from './cn';

interface ArvoreProps {
  readonly itens: readonly ItemMenu[];
  readonly aoEscolher?: () => void;
  readonly nivel?: number;
}

const Seta = () => (
  <svg
    viewBox="0 0 16 16"
    className="h-4 w-4 shrink-0 opacity-50 transition-transform [details[open]>summary>&]:rotate-90"
    aria-hidden="true"
  >
    <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export function ArvoreMenu({ itens, aoEscolher, nivel = 0 }: ArvoreProps) {
  return (
    <ul className={cn(nivel > 0 && 'ml-3 border-l pl-2')}>
      {itens.map((item, i) => {
        if (item.separador) return null;
        if (item.filhos.length > 0) {
          return (
            <li key={i}>
              <details>
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-3 text-sm hover:bg-accent [&::-webkit-details-marker]:hidden">
                  {item.rotulo}
                  <Seta />
                </summary>
                <ArvoreMenu itens={item.filhos} aoEscolher={aoEscolher} nivel={nivel + 1} />
              </details>
            </li>
          );
        }
        return (
          <li key={i}>
            <button
              type="button"
              disabled={!item.abrir}
              onClick={() => {
                aoEscolher?.();
                item.abrir?.();
              }}
              className="flex min-h-11 w-full items-center rounded-2xl px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
            >
              {item.rotulo}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface Props {
  readonly titulo: string;
  readonly itens: readonly ItemMenu[];
}

export function BarraLateral({ titulo, itens }: Props) {
  return (
    <aside
      aria-label={titulo}
      className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r px-2 py-6 lg:block"
    >
      <p className="px-3 pb-2 text-xs text-muted-foreground">{titulo}</p>
      <ArvoreMenu itens={itens} />
    </aside>
  );
}

interface GavetaProps extends Props {
  readonly aberta: boolean;
  readonly onFechar: () => void;
  readonly onVerOriginal: () => void;
}

export function GavetaMenu({ titulo, itens, aberta, onFechar, onVerOriginal }: GavetaProps) {
  useEffect(() => {
    if (!aberta) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberta, onFechar]);

  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-40 animate-[entrar_120ms_ease-out_both] bg-background/85 lg:hidden" onClick={onFechar}>
      <nav
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-y-0 left-0 flex w-[85%] max-w-80 animate-[deslizar_220ms_cubic-bezier(0.2,0.8,0.2,1)_both] flex-col border-r bg-card pt-[env(safe-area-inset-top)] text-card-foreground"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <span className="text-sm font-medium">{titulo}</span>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar menu"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <ArvoreMenu itens={itens} aoEscolher={onFechar} />
        </div>
        <div className="border-t px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={() => {
              onFechar();
              onVerOriginal();
            }}
            className="w-full rounded-full border py-3 text-sm"
          >
            Ver SIGAA original
          </button>
        </div>
      </nav>
    </div>
  );
}
