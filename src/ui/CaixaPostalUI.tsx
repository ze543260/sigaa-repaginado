import { tituloBr } from '../domain/texto';
import { useRef, useState, type FormEvent } from 'react';
import type { CaixaPostal, CompositorMensagem, LeituraMensagem } from '../domain/types';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { cn } from './cn';

const capitalizar = tituloBr;

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
        {caixa.escrever && <Button variant="destaque" size="sm" onClick={caixa.escrever}>Escrever</Button>}
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
        {m.automatica ? (
          <p className="text-xs text-muted-foreground">Mensagem automática — não precisa responder.</p>
        ) : (
          m.responder && <Button variant="destaque" onClick={m.responder} className="h-11">Responder</Button>
        )}
      </article>
    </main>
  );
}

export function CompositorUI({ compositor: c }: { readonly compositor: CompositorMensagem }) {
  const [destinatarios, setDestinatarios] = useState<readonly string[]>(c.destinatarios);
  const [termo, setTermo] = useState('');
  const [sugestoes, setSugestoes] = useState<readonly string[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [assunto, setAssunto] = useState(c.assunto);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const espera = useRef(0);

  const buscar = (valor: string) => {
    setTermo(valor);
    window.clearTimeout(espera.current);
    if (valor.trim().length < 3) {
      setSugestoes([]);
      return;
    }
    espera.current = window.setTimeout(async () => {
      setBuscando(true);
      setSugestoes(await c.sugerir(valor));
      setBuscando(false);
    }, 400);
  };

  const adicionar = async (nome: string) => {
    setSugestoes([]);
    setTermo('');
    setDestinatarios(await c.adicionar(nome));
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    c.enviar(assunto, texto);
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="font-dot text-4xl font-extrabold leading-none">escrever</h1>
      <form onSubmit={enviar} className="space-y-4">
        <div className="space-y-2">
          <span className="px-1 text-sm font-medium">Para</span>
          {destinatarios.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {destinatarios.map((d) => (
                <span key={d} className="rounded-full border px-3 py-1 text-sm">{tituloBr(d)}</span>
              ))}
            </div>
          )}
          <div className="relative">
            <input
              value={termo}
              onChange={(e) => buscar(e.target.value)}
              placeholder="Nome, setor ou login (3 letras ou mais)"
              className="h-12 w-full rounded-2xl border bg-card px-4 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {(sugestoes.length > 0 || buscando) && (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-2xl border bg-card p-1 shadow-lg">
                {buscando && <li className="px-4 py-3 text-sm text-muted-foreground">Buscando…</li>}
                {sugestoes.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => adicionar(s)} className="w-full rounded-xl px-4 py-3 text-left text-sm hover:bg-accent">
                      {tituloBr(s)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <label className="block space-y-2">
          <span className="px-1 text-sm font-medium">Assunto</span>
          <input
            required
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            className="h-12 w-full rounded-2xl border bg-card px-4 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block space-y-2">
          <span className="px-1 text-sm font-medium">Mensagem</span>
          <textarea
            required
            rows={9}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full rounded-2xl border bg-card px-4 py-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="destaque" size="lg" disabled={enviando || destinatarios.length === 0}>
            {enviando ? 'Enviando…' : 'Enviar'}
          </Button>
          {c.cancelar && <Button type="button" variant="outline" size="lg" onClick={c.cancelar}>Cancelar</Button>}
        </div>
      </form>
    </main>
  );
}
