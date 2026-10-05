import type { Relatorio } from '../domain/types';
import { Avisos, Blocos } from './Blocos';
import { Button } from './components/Button';

export function RelatorioUI({ relatorio }: { readonly relatorio: Relatorio }) {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-dot text-3xl font-extrabold leading-none sm:text-5xl">{relatorio.titulo}</h1>
        <div className="hidden gap-2 sm:flex">
          {relatorio.voltar && (
            <Button variant="outline" size="sm" onClick={relatorio.voltar}>
              ← Voltar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Imprimir
          </Button>
        </div>
      </div>
      <Avisos avisos={relatorio.avisos} />
      <Blocos blocos={relatorio.blocos} />
    </main>
  );
}
