import { useState } from 'react';
import { Button } from './components/Button';
import { enviarRelato, tecnicoDoRelato } from './relato';

type Estado = { tipo: 'editando' } | { tipo: 'enviando' } | { tipo: 'enviado'; numero: number; url: string } | { tipo: 'erro'; mensagem: string };

export function RelatoUI({ tela, estilo, onFechar }: { readonly tela: string; readonly estilo: string; readonly onFechar: () => void }) {
  const [texto, setTexto] = useState('');
  const [contato, setContato] = useState('');
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' });
  const tecnico = tecnicoDoRelato({ tela, estilo });

  const enviar = async () => {
    setEstado({ tipo: 'enviando' });
    try {
      setEstado({ tipo: 'enviado', ...(await enviarRelato({ texto: texto.trim(), contato: contato.trim(), tela, estilo })) });
    } catch (e) {
      setEstado({ tipo: 'erro', mensagem: e instanceof Error ? e.message : 'Não foi possível enviar agora.' });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex animate-[entrar_120ms_ease-out_both] items-end justify-center bg-background/85 sm:items-center" onClick={onFechar}>
      <div
        role="dialog"
        aria-label="Relatar problema"
        onClick={(e) => e.stopPropagation()}
        className="casca-card w-full max-w-lg space-y-4 rounded-t-3xl border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-dot text-xl font-extrabold">relatar problema</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {estado.tipo === 'enviado' ? (
          <div className="space-y-4 text-sm">
            <p>
              Valeu! Registrado como{' '}
              <a href={estado.url} target="_blank" rel="noreferrer" className="font-mono underline underline-offset-4">#{estado.numero}</a>.
            </p>
            <Button className="w-full" onClick={onFechar}>Fechar</Button>
          </div>
        ) : (
          <>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="O que aconteceu? O que você esperava que acontecesse?"
              maxLength={4000}
              rows={5}
              autoFocus
              className="w-full resize-none rounded-2xl border bg-background p-3 text-sm outline-none focus:border-foreground"
            />
            <input
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              placeholder="Contato para retorno (opcional)"
              maxLength={80}
              className="h-11 w-full rounded-full border bg-background px-4 text-sm outline-none focus:border-foreground"
            />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Vai junto (sem dados pessoais)</summary>
              <p className="mt-2 font-mono">
                {tecnico.versao} · {tecnico.plataforma} · tela {tecnico.tela} · estilo {tecnico.estilo} · {tecnico.erros.length} erros recentes
              </p>
            </details>
            <p className="text-xs text-muted-foreground">O relato vira uma issue pública no GitHub do projeto. Não escreva matrícula, senha nem notas.</p>
            {estado.tipo === 'erro' && <p className="text-sm text-destaque-texto">{estado.mensagem}</p>}
            <Button variant="destaque" className="w-full" disabled={texto.trim().length < 10 || estado.tipo === 'enviando'} onClick={enviar}>
              {estado.tipo === 'enviando' ? 'Enviando…' : 'Enviar relato'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
