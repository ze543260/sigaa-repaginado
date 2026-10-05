import { cn } from './cn';
import { usarPreferencias, type Acento, type Estilo } from './tema';

interface InfoEstilo {
  readonly nome: string;
  readonly descricao: string;
  readonly acentoSugerido: Acento;
  /** Miniatura: fundo, texto e fonte do estilo, independentes do tema atual. */
  readonly amostra: { readonly fundo: string; readonly texto: string; readonly fonte: string; readonly raio: string; readonly titulo: string };
}

export const INFO_ESTILO: Readonly<Record<Estilo, InfoEstilo>> = {
  minimalista: {
    nome: 'Minimalista',
    descricao: 'Matriz de pontos e um acento só. Inspirado no Nothing OS.',
    acentoSugerido: 'vermelho',
    amostra: { fundo: '#000', texto: '#f5f5f5', fonte: 'Doto, monospace', raio: '14px', titulo: 'sigaa' },
  },
  terminal: {
    nome: 'Terminal',
    descricao: 'Engenharia de Computação: fósforo verde, monoespaçada e grade de circuito.',
    acentoSugerido: 'verde',
    amostra: { fundo: '#050b07', texto: '#c6f5c2', fonte: "'Space Mono', monospace", raio: '3px', titulo: '> sigaa_' },
  },
};

export function SeletorEstilo() {
  const { prefs, alterar } = usarPreferencias();
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Estilo">
      {(Object.keys(INFO_ESTILO) as Estilo[]).map((e) => {
        const info = INFO_ESTILO[e];
        const ativo = prefs.estilo === e;
        return (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => {
              // Ao trocar de estilo, a cor-assinatura dele entra junto; a pessoa pode mudar depois.
              alterar(ativo ? {} : { estilo: e, acento: info.acentoSugerido });
            }}
            className={cn(
              'overflow-hidden rounded-2xl border text-left transition-transform active:scale-[0.97]',
              ativo && 'ring-2 ring-destaque ring-offset-2 ring-offset-background',
            )}
          >
            <span
              className="flex h-16 items-center justify-center text-xl font-bold"
              style={{ background: info.amostra.fundo, color: info.amostra.texto, fontFamily: info.amostra.fonte, borderRadius: 0 }}
              aria-hidden="true"
            >
              {info.amostra.titulo}
            </span>
            <span className="block space-y-0.5 p-3">
              <span className="block text-sm font-medium">{info.nome}</span>
              <span className="block text-xs leading-snug text-muted-foreground">{info.descricao}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
