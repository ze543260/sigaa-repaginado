import type { Pagina } from '../domain/types';
import { PainelAparencia } from './PainelAparencia';
import { Sobre } from './Sobre';

interface Props {
  readonly pagina: Pagina;
  readonly onFechar: () => void;
  readonly onVerOriginal: () => void;
  readonly onRever: () => void;
}

function Secao({ titulo, children }: { readonly titulo: string; readonly children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-sm font-medium text-muted-foreground">{titulo}</h2>
      <div className="rounded-3xl border bg-card p-5 text-card-foreground sm:p-6">{children}</div>
    </section>
  );
}

export function TelaConfiguracoes({ pagina, onFechar, onVerOriginal, onRever }: Props) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Configurações" className="fixed inset-0 z-40 animate-tela overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-2 px-4 sm:px-6">
          <button
            type="button"
            onClick={onFechar}
            aria-label="Voltar"
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-accent active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="font-dot text-2xl font-extrabold leading-none">configurações</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-4 py-6 pb-16 sm:px-6 sm:py-10">
        <Secao titulo="Aparência e avisos">
          <PainelAparencia />
        </Secao>

        <Secao titulo="Atalhos">
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={onRever} className="min-h-11 rounded-full border text-sm transition-colors hover:bg-accent">
              Ver boas-vindas de novo
            </button>
            <button type="button" onClick={onVerOriginal} className="min-h-11 rounded-full border text-sm transition-colors hover:bg-accent">
              Abrir SIGAA original
            </button>
          </div>
        </Secao>

        <Secao titulo="Sobre">
          <Sobre pagina={pagina} />
        </Secao>
      </main>
    </div>
  );
}
