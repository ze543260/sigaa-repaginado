import { useEffect, useState } from 'react';
import { version } from '../../package.json';
import { plataforma } from '../plataforma';

const REPO = 'ze543260/sigaa-repaginado';
const CHAVE_CHECADA = 'sigaa-v2:versao-checada';
const CHAVE_DISPENSADA = 'sigaa-v2:versao-dispensada';

export function maisNova(a: string, b: string): boolean {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/** Toast no topo quando há versão publicada mais nova que a que está rodando. */
export function AvisoVersaoNova() {
  const [nova, setNova] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    try {
      // Uma vez por abertura do app: a sessão some quando o app fecha, e a interface remonta a cada página do SIGAA.
      if (sessionStorage.getItem(CHAVE_CHECADA)) return;
      sessionStorage.setItem(CHAVE_CHECADA, '1');
    } catch {
      return;
    }
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then((r) => (r.ok ? r.json() : null))
      .then((r: { tag_name?: string } | null) => {
        const tag = r?.tag_name?.replace(/^v/, '');
        if (!ativo || !tag || !maisNova(tag, version)) return;
        try {
          if (localStorage.getItem(CHAVE_DISPENSADA) === tag) return;
        } catch {
          /* sem armazenamento: mostra mesmo assim */
        }
        setNova(tag);
      })
      .catch(() => {
        /* sem rede: tenta na próxima janela */
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (!nova) return null;

  const dispensar = () => {
    try {
      localStorage.setItem(CHAVE_DISPENSADA, nova);
    } catch {
      /* só fecha */
    }
    setNova(null);
  };
  const atualizar = () => {
    if (plataforma.verificarAtualizacao) plataforma.verificarAtualizacao();
    else window.open(`https://github.com/${REPO}/releases/latest`, '_blank', 'noreferrer');
    setNova(null);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[70] flex justify-center px-4" role="status">
      <div className="pointer-events-auto flex animate-[descer_380ms_cubic-bezier(0.2,0.8,0.2,1)_both] items-center gap-2 rounded-full border bg-card py-1.5 pl-4 pr-1.5 text-xs shadow-lg">
        <span className="h-2 w-2 rounded-full bg-destaque pulso" aria-hidden="true" />
        <span>
          Versão <strong className="font-mono">{nova}</strong> disponível
        </span>
        <button type="button" onClick={atualizar} className="rounded-full bg-foreground px-3 py-1.5 font-medium text-background">
          Atualizar
        </button>
        <button type="button" onClick={dispensar} aria-label="Dispensar" className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent">
          ×
        </button>
      </div>
    </div>
  );
}
