import type { CaixaPostal, LeituraMensagem } from '../domain/types';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { cn } from './cn';

const capitalizar = (s: string): string => s.toLowerCase().replace(/(^|[\s/(])\S/g, (c) => c.toUpperCase());

/** "[OPORTUNIDADE] Bolsa..." → etiqueta "oportunidade" + assunto limpo. */
function separarEtiqueta(assunto: string): { readonly etiqueta: string | null; readonly titulo: string } {
  const m = assunto.match(/^\[([^\]]+)\]\s*(.*)$/);
  return m ? { etiqueta: m[1]?.toLowerCase() ?? null, titulo: m[2] ?? assunto } : { etiqueta: null, titulo: assunto };
}

export function CaixaPostalUI({ caixa }: { readonly caixa: CaixaPostal }) {
  const naoLidas = caixa.mensagens.filter((m) => !m.lida).length;
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <p className="font-mono text-sm text-muted-foreground">{caixa.pasta}{naoLidas > 0 && ` · ${naoLidas} não lidas`}</p>
        <h1 className="font-dot text-4xl font-extrabold leading-none sm:text-6xl">mensagens</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {caixa.pastas.map((p) => (
          <Button key={p.rotulo} variant={caixa.pasta.toLowerCase().includes(p.rotulo.toLowerCase().slice(0, 5)) ? 'default' : 'outline'} size="sm" onClick={p.abrir}>
            {p.rotulo}
          </Button>
        ))}
        {caixa.marcarTodasLidas && naoLidas > 0 && (
          <Button variant="ghost" size="sm" onClick={caixa.marcarTodasLidas}>Marcar todas como lidas</Button>
        )}
      </div>

      {caixa.mensagens.length === 0 ? (
        <Card className="border-dashed p-10 text-center text-sm text-muted-foreground">Nenhuma mensagem.</Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="cascata divide-y">
            {caixa.mensagens.map((m, i) => {
              const { etiqueta, titulo } = separarEtiqueta(m.assunto);
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={!m.abrir}
                    onClick={m.abrir ?? undefined}
                    className="flex w-full gap-3 px-5 py-4 text-left transition-colors enabled:hover:bg-accent enabled:active:bg-accent"
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', m.lida ? 'bg-transparent' : 'bg-destaque')} aria-label={m.lida ? undefined : 'não lida'} />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span className="truncate">{capitalizar(m.remetente.split('/')[0] ?? m.remetente)}</span>
                        <span className="shrink-0 font-mono">{m.data.split(' ')[0]}</span>
                      </span>
                      <span className={cn('block text-sm leading-snug', !m.lida && 'font-semibold')}>{titulo}</span>
                      <span className="flex gap-2">
                        {etiqueta && <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{etiqueta}</span>}
                        {m.anexo && <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">anexo</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </main>
  );
}

export function MensagemUI({ mensagem: m }: { readonly mensagem: LeituraMensagem }) {
  const { etiqueta, titulo } = separarEtiqueta(m.assunto);
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-2">
        {m.voltar && <Button variant="outline" size="sm" onClick={m.voltar}>← Caixa de entrada</Button>}
        <div className="flex gap-1">
          {m.anterior && <Button variant="ghost" size="sm" onClick={m.anterior} aria-label="Mensagem anterior">↑</Button>}
          {m.proxima && <Button variant="ghost" size="sm" onClick={m.proxima} aria-label="Próxima mensagem">↓</Button>}
        </div>
      </div>
      <article className="space-y-5">
        <header className="space-y-3">
          {etiqueta && <span className="inline-flex rounded-full border px-2 py-0.5 font-mono text-xs text-muted-foreground">{etiqueta}</span>}
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{titulo}</h1>
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">{capitalizar(m.remetente)}</span>
              {m.unidade && <span className="block truncate text-xs">{capitalizar(m.unidade)}</span>}
            </span>
            <span className="shrink-0 font-mono text-xs">{m.data}</span>
          </div>
        </header>
        <Card className="space-y-3 p-5 text-[15px] leading-relaxed sm:p-6">
          {m.paragrafos.map((p, i) => (
            <p key={i} className="whitespace-pre-line [overflow-wrap:anywhere]">{p}</p>
          ))}
        </Card>
        {m.anexos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {m.anexos.map((a) => (
              <Button key={a.rotulo} variant="outline" onClick={a.abrir} className="h-11">Baixar {a.rotulo.toLowerCase()}</Button>
            ))}
          </div>
        )}
        {m.automatica && <p className="text-xs text-muted-foreground">Mensagem automática — não precisa responder.</p>}
      </article>
    </main>
  );
}
