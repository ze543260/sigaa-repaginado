import { cn } from './cn';
import { ESTILOS, definicao } from './estilos';
import { usarPreferencias } from './tema';
import { IlustracaoLogin } from './IlustracaoLogin';

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
              className="tema relative flex h-24 items-center justify-center overflow-hidden"
              data-estilo={e}
              data-tema={prefs.tema === 'sistema' ? undefined : prefs.tema}
              data-acento={info.acento}
              style={{ borderRadius: 0 }}
              aria-hidden="true"
            >
              <IlustracaoLogin estilo={e} className="h-full w-auto" />
              <span className="absolute bottom-1 left-2 font-dot text-sm font-bold text-foreground">{info.amostra.titulo}</span>
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
