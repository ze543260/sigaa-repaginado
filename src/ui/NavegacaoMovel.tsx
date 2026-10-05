import { useEffect, useState, type ReactNode } from 'react';
import { cn } from './cn';

export const ICONES = {
  inicio: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  buscar: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm9 3l-4.3-4.3',
  turmas: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  atividades: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  voltar: 'M15 5l-7 7 7 7',
  mais: 'M5 12h.01M12 12h.01M19 12h.01',
  menu: 'M4 7h16M4 12h16M4 17h10',
  notas: 'M5 19V9M10 19V5M15 19v-7M20 19v-4',
  frequencia: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm4 9l2 2 4-4',
} as const;

export interface AcaoNavegacao {
  readonly id: string;
  readonly rotulo: string;
  readonly icone: keyof typeof ICONES;
  readonly ativo?: boolean;
  readonly onClick: () => void;
}

interface Props {
  readonly acoes: readonly AcaoNavegacao[];
  readonly conteudoMais?: ReactNode;
}

export const Icone = ({ d }: { readonly d: string }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function NavegacaoMovel({ acoes, conteudoMais }: Props) {
  const [folhaAberta, setFolhaAberta] = useState(false);
  const fechar = () => setFolhaAberta(false);

  useEffect(() => {
    if (!folhaAberta) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [folhaAberta]);

  if (acoes.length === 0 && !conteudoMais) return null;

  const botao =
    'casca-nav-item flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-xs text-muted-foreground transition-[background-color,color,transform] active:scale-95';
  const ativo = 'text-foreground font-medium';
  const pilula = (ligada: boolean | undefined) =>
    cn('casca-pilula grid h-7 w-12 place-items-center rounded-full transition-colors', ligada && 'bg-accent');

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="casca-nav fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden"
      >
        <div className="mx-auto flex max-w-md gap-1">
          {acoes.map((acao) => (
            <button
              key={acao.id}
              type="button"
              className={cn(botao, acao.ativo && ativo)}
              aria-current={acao.ativo ? 'page' : undefined}
              onClick={acao.onClick}
            >
              <span key={acao.ativo ? 'ativo' : 'inativo'} className={cn(pilula(acao.ativo), acao.ativo && 'pulinho')}>
                <Icone d={ICONES[acao.icone]} />
              </span>
              {acao.rotulo}
            </button>
          ))}
          {conteudoMais && (
            <button
              type="button"
              className={cn(botao, folhaAberta && ativo)}
              onClick={() => setFolhaAberta(true)}
              aria-expanded={folhaAberta}
            >
              <span className={pilula(folhaAberta)}>
                <Icone d={ICONES.mais} />
              </span>
              Mais
            </button>
          )}
        </div>
      </nav>

      {folhaAberta && conteudoMais && (
        <div className="fixed inset-0 z-40 animate-[entrar_120ms_ease-out_both] bg-background/85 md:hidden" onClick={fechar}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mais opções"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 flex max-h-[85%] animate-[subir_220ms_cubic-bezier(0.2,0.8,0.2,1)_both] flex-col rounded-t-3xl border-t bg-card text-card-foreground"
          >
            <div className="flex justify-center px-5 pb-2 pt-4">
              <span className="h-1 w-10 rounded-full bg-foreground/20" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">{conteudoMais}</div>
          </div>
        </div>
      )}
    </>
  );
}
