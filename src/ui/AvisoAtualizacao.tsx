import { useEffect, useState } from 'react';
import { version } from '../../package.json';

const CHAVE = 'sigaa-v2:versao-vista';
const RELEASES = 'https://github.com/ze543260/sigaa-repaginado/releases/tag/v';

/** Toast pequeno no topo na primeira abertura depois de uma atualização (APK ou pacote da interface). */
export function AvisoAtualizacao() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      const anterior = localStorage.getItem(CHAVE);
      localStorage.setItem(CHAVE, version);
      if (!anterior || anterior === version) return;
    } catch {
      return;
    }
    setVisivel(true);
    const id = window.setTimeout(() => setVisivel(false), 5000);
    return () => window.clearTimeout(id);
  }, []);

  if (!visivel) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[70] flex justify-center px-4" role="status">
      <a
        href={`${RELEASES}${version}`}
        target="_blank"
        rel="noreferrer"
        className="pointer-events-auto flex animate-[descer_380ms_cubic-bezier(0.2,0.8,0.2,1)_both] items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs shadow-lg"
      >
        <span className="h-2 w-2 rounded-full bg-destaque" aria-hidden="true" />
        Atualizado para <strong className="font-mono">{version}</strong>
        <span className="text-muted-foreground">· o que mudou</span>
      </a>
    </div>
  );
}
