import { useState } from 'react';
import { cn } from './cn';
import { SeletorEstilo } from './SeletorEstilo';
import { ACENTOS, TEMAS, usarPreferencias, type Acento, type Tema } from './tema';

const CHAVE = 'sigaa-v2:boas-vindas';

export function jaViuBoasVindas(): boolean {
  try {
    return localStorage.getItem(CHAVE) === '1';
  } catch {
    return true;
  }
}

function marcarVisto(): void {
  try {
    localStorage.setItem(CHAVE, '1');
  } catch {
    /* sem armazenamento: aparece de novo na próxima visita */
  }
}

const NOME_TEMA: Readonly<Record<Tema, string>> = { sistema: 'Sistema', claro: 'Claro', escuro: 'Escuro' };
const AMOSTRA: Readonly<Record<Acento, string>> = {
  vermelho: 'hsl(357 80% 47%)',
  laranja: 'hsl(17 88% 40%)',
  verde: 'hsl(142 72% 29%)',
  azul: 'hsl(221 83% 53%)',
  violeta: 'hsl(262 83% 58%)',
  rosa: 'hsl(336 78% 42%)',
};

/** Coração 9×8 em pontos, que acendem do centro para fora. */
const CORACAO = ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];

function CoracaoPontos() {
  return (
    <svg viewBox="0 0 90 80" className="h-24 w-24" aria-hidden="true">
      {CORACAO.flatMap((linha, y) =>
        [...linha].map((c, x) => (
          <circle
            key={`${x}-${y}`}
            cx={x * 10 + 5}
            cy={y * 10 + 5}
            r="3.6"
            fill={c === '#' ? 'hsl(var(--destaque))' : 'currentColor'}
            opacity={c === '#' ? 1 : 0.1}
            className={c === '#' ? 'animate-brotar' : undefined}
            style={c === '#' ? { animationDelay: `${(Math.abs(x - 4) + Math.abs(y - 3)) * 70}ms`, transformOrigin: `${x * 10 + 5}px ${y * 10 + 5}px` } : undefined}
          />
        )),
      )}
    </svg>
  );
}

const DESTAQUES: readonly (readonly [string, string])[] = [
  ['Hoje', 'Suas aulas com horário e “começa em 20 min”.'],
  ['Notas', 'Quanto falta para a média, já contando a recuperação.'],
  ['Faltas', 'Aula a aula, e quantas ainda dá para ter.'],
  ['Tarefas', 'Prazo em contagem regressiva e envio pelo celular.'],
  ['Avisos', 'Nota nova, aula daqui a 10 min e prazo chegando.'],
];

export function BoasVindas({ onFim }: { readonly onFim: () => void }) {
  const [passo, setPasso] = useState(0);
  const { prefs, alterar } = usarPreferencias();
  const ultimo = 2;

  const concluir = () => {
    marcarVisto();
    onFim();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Boas-vindas" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-10">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="font-dot text-2xl font-extrabold leading-none">sigaa</span>
            <span className="h-2 w-2 rounded-full bg-destaque" aria-hidden="true" />
          </span>
          {passo < ultimo && (
            <button type="button" onClick={concluir} className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
              Pular
            </button>
          )}
        </div>

        <div key={passo} className="flex flex-1 animate-tela flex-col justify-center gap-6 py-8">
          {passo === 0 && (
            <>
              <CoracaoPontos />
              <h1 className="font-dot text-5xl font-extrabold leading-[0.95]">obrigado!</h1>
              <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  Valeu por testar o <strong className="font-medium text-foreground">SIGAA Repaginado</strong>. É um projeto pessoal de um aluno que cansou de
                  apertar os olhos para usar o SIGAA no celular.
                </p>
                <p>
                  Ele usa o seu login e as mesmas páginas de sempre, só que redesenhadas. Nada passa por servidor nenhum: tudo fica no seu aparelho.
                </p>
              </div>
            </>
          )}

          {passo === 1 && (
            <>
              <h1 className="font-dot text-5xl font-extrabold leading-[0.95]">o que muda</h1>
              <ul className="cascata space-y-3">
                {DESTAQUES.map(([titulo, texto]) => (
                  <li key={titulo} className="flex gap-4 rounded-2xl border bg-card p-4">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destaque" aria-hidden="true" />
                    <span>
                      <span className="block font-medium">{titulo}</span>
                      <span className="block text-sm text-muted-foreground">{texto}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {passo === 2 && (
            <>
              <h1 className="font-dot text-5xl font-extrabold leading-[0.95]">do seu jeito</h1>
              <p className="text-[15px] text-muted-foreground">Dá para mudar depois na engrenagem, no topo da tela.</p>
              <div className="space-y-2">
                <p className="px-1 text-xs text-muted-foreground">Estilo</p>
                <SeletorEstilo />
              </div>
              <div className="space-y-2">
                <p className="px-1 text-xs text-muted-foreground">Modo</p>
                <div className="grid grid-cols-3 gap-1 rounded-full border p-1">
                  {TEMAS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={prefs.tema === t}
                      onClick={() => alterar({ tema: t })}
                      className={cn('min-h-11 rounded-full text-sm transition-colors', prefs.tema === t ? 'bg-foreground text-background' : 'hover:bg-accent')}
                    >
                      {NOME_TEMA[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="px-1 text-xs text-muted-foreground">Cor de destaque</p>
                <div className="grid grid-cols-6 gap-3">
                  {ACENTOS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-label={a}
                      aria-pressed={prefs.acento === a}
                      onClick={() => alterar({ acento: a })}
                      className={cn('aspect-square rounded-full ring-offset-2 ring-offset-background transition-transform active:scale-90', prefs.acento === a && 'scale-110 ring-2 ring-foreground')}
                      style={{ background: AMOSTRA[a] }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2" aria-label={`Passo ${passo + 1} de ${ultimo + 1}`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn('h-2 rounded-full transition-all duration-300', i === passo ? 'w-6 bg-destaque' : 'w-2 bg-foreground/20')} />
            ))}
          </div>
          <div className="flex gap-2">
            {passo > 0 && (
              <button type="button" onClick={() => setPasso((p) => p - 1)} className="min-h-12 rounded-full border px-5 text-sm hover:bg-accent">
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={() => (passo < ultimo ? setPasso((p) => p + 1) : concluir())}
              className="min-h-12 rounded-full bg-destaque px-6 text-sm font-medium text-white transition-transform active:scale-95"
            >
              {passo < ultimo ? 'Continuar' : 'Começar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
