import { useState, type FormEvent } from 'react';
import { lerData, relativo } from '../domain/horario';
import type { EnvioTarefa, Tarefa } from '../domain/types';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { cn } from './cn';

type Estado = 'enviada' | 'aberta' | 'urgente' | 'futura' | 'encerrada';

function estadoDa(t: Tarefa, agora: Date): Estado {
  if (t.enviada) return 'enviada';
  const inicio = lerData(t.inicio);
  const fim = lerData(t.fim);
  if (inicio && inicio > agora) return 'futura';
  if (fim && fim < agora) return 'encerrada';
  if (fim && fim.getTime() - agora.getTime() < 2 * 86_400_000) return 'urgente';
  return 'aberta';
}

const ROTULO: Readonly<Record<Estado, string>> = {
  enviada: 'Enviada',
  aberta: 'Aberta',
  urgente: 'Vence logo',
  futura: 'Ainda não abriu',
  encerrada: 'Encerrada',
};

const ORDEM: Readonly<Record<Estado, number>> = { urgente: 0, aberta: 1, futura: 2, enviada: 3, encerrada: 4 };

function Prazo({ t, estado, agora }: { readonly t: Tarefa; readonly estado: Estado; readonly agora: Date }) {
  const fim = lerData(t.fim);
  if (!fim) return null;
  if (estado === 'aberta' || estado === 'urgente') {
    return <span className={cn(estado === 'urgente' && 'font-medium text-destaque-texto')}>Termina {relativoLongo(fim, agora)}</span>;
  }
  if (estado === 'futura') {
    const inicio = lerData(t.inicio);
    return inicio ? <span>Abre {relativoLongo(inicio, agora)}</span> : null;
  }
  return <span className="font-mono">{t.fim}</span>;
}

function relativoLongo(alvo: Date, agora: Date): string {
  const dias = Math.floor((alvo.getTime() - agora.getTime()) / 86_400_000);
  return dias >= 2 ? `em ${dias} dias · ${alvo.toLocaleDateString('pt-BR')}` : relativo(alvo, agora);
}

function CartaoTarefa({ t, agora }: { readonly t: Tarefa; readonly agora: Date }) {
  const estado = estadoDa(t, agora);
  const [aberta, setAberta] = useState(estado === 'urgente' || estado === 'aberta');
  return (
    <Card className={cn('space-y-3 p-5', estado === 'encerrada' && 'opacity-60')}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug">{t.titulo}</h3>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2 py-0.5 font-mono text-[11px]',
            estado === 'urgente' && 'border-transparent bg-destaque text-white',
            estado === 'enviada' && 'border-destaque/60',
          )}
        >
          {t.corrigida ? 'Corrigida' : ROTULO[estado]}
        </span>
      </div>
      <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        <Prazo t={t} estado={estado} agora={agora} />
        {t.possuiNota && <span>· vale nota</span>}
      </p>
      {t.paragrafos.length > 0 && (
        <div className="text-sm">
          {aberta ? (
            <div className="space-y-2 [overflow-wrap:anywhere]">{t.paragrafos.map((p, i) => <p key={i}>{p}</p>)}</div>
          ) : (
            <p className="line-clamp-2 text-muted-foreground">{t.paragrafos.join(' ')}</p>
          )}
          <button type="button" onClick={() => setAberta((a) => !a)} className="-ml-3 mt-1 min-h-9 rounded-full px-3 text-xs font-medium hover:bg-accent">
            {aberta ? 'Mostrar menos' : 'Ler enunciado'}
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {t.enviar && <Button variant="destaque" onClick={t.enviar} className="h-11 lg:h-9">{t.enviada ? 'Reenviar' : 'Enviar resposta'}</Button>}
        {t.visualizar && <Button variant="outline" onClick={t.visualizar} className="h-11 lg:h-9">Ver envio</Button>}
      </div>
    </Card>
  );
}

export function ListaTarefas({ tarefas }: { readonly tarefas: readonly Tarefa[] }) {
  const agora = new Date();
  if (tarefas.length === 0) return <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma tarefa publicada.</Card>;
  const ordenadas = [...tarefas].sort((a, b) => ORDEM[estadoDa(a, agora)] - ORDEM[estadoDa(b, agora)]);
  return (
    <div className="cascata space-y-3">
      {ordenadas.map((t) => <CartaoTarefa key={t.titulo + t.fim} t={t} agora={agora} />)}
    </div>
  );
}

export function FormularioTarefa({ envio }: { readonly envio: EnvioTarefa }) {
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [arquivos, setArquivos] = useState<Record<string, File>>({});
  const [enviando, setEnviando] = useState(false);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    envio.enviar(textos, arquivos);
  };

  return (
    <form onSubmit={enviar} className="space-y-5">
      <Card className="space-y-3 p-5 sm:p-6">
        <p className="text-xs text-muted-foreground">{envio.periodo}</p>
        <h2 className="text-xl font-semibold leading-tight">{envio.titulo}</h2>
        <div className="space-y-2 text-sm [overflow-wrap:anywhere]">{envio.paragrafos.map((p, i) => <p key={i}>{p}</p>)}</div>
      </Card>

      {envio.textos.map((t) => (
        <label key={t.id} className="block space-y-2">
          <span className="px-1 text-sm font-medium">{t.rotulo}{t.obrigatorio && <span className="text-destaque-texto"> *</span>}</span>
          <textarea
            required={t.obrigatorio}
            rows={t.obrigatorio ? 7 : 3}
            value={textos[t.id] ?? ''}
            onChange={(e) => setTextos((v) => ({ ...v, [t.id]: e.target.value }))}
            className="w-full rounded-2xl border bg-card px-4 py-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      ))}

      {envio.arquivos.map((a) => (
        <label key={a.id} className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-sm hover:bg-accent">
          <span className="font-mono text-xs text-muted-foreground">ARQUIVO</span>
          <span className="min-w-0 flex-1 truncate">{arquivos[a.id]?.name ?? `Escolher ${a.rotulo.toLowerCase()}`}</span>
          <input
            type="file"
            className="sr-only"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) setArquivos((v) => ({ ...v, [a.id]: arquivo }));
            }}
          />
        </label>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destaque" size="lg" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar tarefa'}</Button>
        {envio.cancelar && <Button type="button" variant="outline" size="lg" onClick={envio.cancelar} disabled={enviando}>Cancelar</Button>}
      </div>
    </form>
  );
}
