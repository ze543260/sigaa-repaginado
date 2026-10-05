import { useState } from 'react';
import { cn } from './cn';
import { SeletorEstilo } from './SeletorEstilo';
import { plataforma } from '../plataforma';
import { ACENTOS, ESCALAS, TEMAS, usarPreferencias, type Acento, type Escala, type Tema } from './tema';

const NOME_ESCALA: Readonly<Record<Escala, string>> = { compacta: 'Compacto', normal: 'Normal', grande: 'Grande' };

const NOME_TEMA: Readonly<Record<Tema, string>> = { sistema: 'Sistema', claro: 'Claro', escuro: 'Escuro' };

const NOME_ACENTO: Readonly<Record<Acento, string>> = {
  vermelho: 'Vermelho',
  laranja: 'Laranja',
  verde: 'Verde',
  azul: 'Azul',
  violeta: 'Violeta',
  rosa: 'Rosa',
};

// Amostras fixas: o painel mostra todas as cores, não só a ativa.
const AMOSTRA: Readonly<Record<Acento, string>> = {
  vermelho: 'hsl(357 80% 47%)',
  laranja: 'hsl(17 88% 40%)',
  verde: 'hsl(142 72% 29%)',
  azul: 'hsl(221 83% 53%)',
  violeta: 'hsl(262 83% 58%)',
  rosa: 'hsl(336 78% 42%)',
};

function Interruptor({ rotulo, descricao, ligado, onMudar }: {
  readonly rotulo: string;
  readonly descricao: string;
  readonly ligado: boolean;
  readonly onMudar: (ligado: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => onMudar(!ligado)}
      className="flex min-h-12 w-full items-center justify-between gap-4 rounded-2xl px-3 py-2 text-left hover:bg-accent"
    >
      <span>
        <span className="block text-sm font-medium">{rotulo}</span>
        <span className="block text-xs text-muted-foreground">{descricao}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full border transition-colors',
          ligado ? 'border-transparent bg-destaque' : 'bg-secondary',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform',
            ligado ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}

export function PainelAparencia() {
  const { prefs, alterar } = usarPreferencias();
  const [bloqueio, setBloqueio] = useState(() => plataforma.bloqueio?.ativo() ?? false);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="px-1 pb-2 text-xs text-muted-foreground">Estilo</legend>
        <SeletorEstilo />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="px-1 pb-2 text-xs text-muted-foreground">Modo</legend>
        <div className="grid grid-cols-3 gap-1 rounded-full border p-1">
          {TEMAS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={prefs.tema === t}
              onClick={() => alterar({ tema: t })}
              className={cn(
                'min-h-10 rounded-full text-sm transition-colors',
                prefs.tema === t ? 'bg-foreground text-background' : 'hover:bg-accent',
              )}
            >
              {NOME_TEMA[t]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="px-1 pb-2 text-xs text-muted-foreground">Cor de destaque</legend>
        <div className="grid grid-cols-6 gap-2">
          {ACENTOS.map((a) => (
            <button
              key={a}
              type="button"
              aria-label={NOME_ACENTO[a]}
              aria-pressed={prefs.acento === a}
              title={NOME_ACENTO[a]}
              onClick={() => alterar({ acento: a })}
              className={cn(
                'grid aspect-square place-items-center rounded-full ring-offset-2 ring-offset-card transition-transform active:scale-90',
                prefs.acento === a && 'ring-2 ring-foreground',
              )}
              style={{ background: AMOSTRA[a] }}
            >
              {prefs.acento === a && <span className="h-2 w-2 rounded-full bg-white" aria-hidden="true" />}
            </button>
          ))}
        </div>
        <p className="px-1 pt-2 text-xs text-muted-foreground">{NOME_ACENTO[prefs.acento]}</p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="px-1 pb-2 text-xs text-muted-foreground">Tamanho</legend>
        <div className="grid grid-cols-3 gap-1 rounded-full border p-1">
          {ESCALAS.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={prefs.escala === e}
              onClick={() => alterar({ escala: e })}
              className={cn(
                'min-h-10 rounded-full text-sm transition-colors',
                prefs.escala === e ? 'bg-foreground text-background' : 'hover:bg-accent',
              )}
            >
              {NOME_ESCALA[e]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="-mx-3 space-y-1">
        {plataforma.agendarLembretes && (
          <Interruptor
            rotulo="Lembretes"
            descricao="Aula em 10 min e prazos de atividades"
            ligado={prefs.lembretes}
            onMudar={(lembretes) => alterar({ lembretes })}
          />
        )}
        <Interruptor
          rotulo="Fundo pontilhado"
          descricao="Grade de pontos atrás do conteúdo"
          ligado={prefs.pontos}
          onMudar={(pontos) => alterar({ pontos })}
        />
        {plataforma.bloqueio && (
          <Interruptor
            rotulo="Bloquear com digital"
            descricao="Pede digital ao voltar após 2 min fora"
            ligado={bloqueio}
            onMudar={(ligado) => {
              plataforma.bloqueio?.definir(ligado);
              setBloqueio(ligado);
            }}
          />
        )}
        <Interruptor
          rotulo="Animações"
          descricao="Transições, contagens e entradas"
          ligado={prefs.animacoes}
          onMudar={(animacoes) => alterar({ animacoes })}
        />
      </div>

    </div>
  );
}
