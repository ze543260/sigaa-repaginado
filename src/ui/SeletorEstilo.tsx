import { cn } from './cn';
import { ESTILOS, definicao } from './estilos';
import { usarPreferencias } from './tema';

export function SeletorEstilo() {
  const { prefs, alterar } = usarPreferencias();
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Estilo">
      {ESTILOS.map((e) => {
        const info = definicao(e);
        const ativo = prefs.estilo === e;
        return (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => {
              // Ao trocar de estilo, a cor-assinatura dele entra junto; a pessoa pode mudar depois.
              alterar(ativo ? {} : { estilo: e, acento: info.acento });
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
              {info.curso && <span className="block font-mono text-[10px] uppercase tracking-wide text-destaque-texto">{info.curso}</span>}
              <span className="block text-xs leading-snug text-muted-foreground">{info.descricao}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
