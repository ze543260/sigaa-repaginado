import { useEffect, useMemo, useRef, useState } from 'react';
import { definicao, type Contexto } from './estilos';
import { usarPreferencias } from './tema';

export type { Contexto };

function sortear<T>(lista: readonly T[], semente: number): T | undefined {
  return lista[Math.abs(semente) % lista.length];
}

/** Uma das piadas do estilo atual para o contexto; muda uma vez por dia para não cansar. */
export function usePiada(contexto: Contexto): string | null {
  const { prefs } = usarPreferencias();
  return useMemo(() => {
    const lista = definicao(prefs.estilo).piadas[contexto];
    if (!lista || lista.length === 0) return null;
    const dia = Math.floor(Date.now() / 86_400_000);
    return sortear(lista, dia + contexto.length) ?? null;
  }, [prefs.estilo, contexto]);
}

/** Linha que se digita sozinha, com cursor no fim. */
export function Digitando({ texto, className }: { readonly texto: string; readonly className?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setN(n);
      if (n >= texto.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [texto]);
  return (
    <span className={className} aria-label={texto}>
      <span aria-hidden="true">{texto.slice(0, n)}</span>
      <span aria-hidden="true" className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-current opacity-70" />
    </span>
  );
}

export function PiadaDoContexto({ contexto, className }: { readonly contexto: Contexto; readonly className?: string }) {
  const piada = usePiada(contexto);
  if (!piada) return null;
  return <Digitando texto={piada} className={className} />;
}

/** Log de "compilação" no lugar do esqueleto, só no estilo Terminal. */
export function LogCompilacao({ linhas }: { readonly linhas: readonly string[] }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    const id = window.setInterval(() => setN((v) => Math.min(v + 1, linhas.length)), 380);
    return () => window.clearInterval(id);
  }, [linhas.length]);
  const progresso = Math.round((n / linhas.length) * 20);
  return (
    <div className="space-y-1 font-mono text-sm" role="status" aria-label="Carregando">
      {linhas.slice(0, n).map((l, i) => (
        <p key={l} className={i === n - 1 ? 'text-foreground' : 'text-muted-foreground'}>
          <span className="text-destaque-texto">[{i < n - 1 ? ' ok ' : ' .. '}]</span> {l}
        </p>
      ))}
      <p className="pt-2 text-destaque-texto">[{'#'.repeat(progresso)}{'.'.repeat(20 - progresso)}] {progresso * 5}%</p>
    </div>
  );
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** Konami no teclado ou 7 toques seguidos no logo disparam a surpresa do estilo. */
export function useSegredo(): { readonly ativo: boolean; readonly tocarLogo: () => void; readonly fechar: () => void } {
  const [ativo, setAtivo] = useState(false);
  const toques = useRef<number[]>([]);
  const teclas = useRef<string[]>([]);

  useEffect(() => {
    const ouvir = (e: KeyboardEvent) => {
      teclas.current = [...teclas.current, e.key].slice(-KONAMI.length);
      if (teclas.current.join() === KONAMI.join()) setAtivo(true);
    };
    window.addEventListener('keydown', ouvir);
    return () => window.removeEventListener('keydown', ouvir);
  }, []);

  return {
    ativo,
    tocarLogo: () => {
      const agora = Date.now();
      toques.current = [...toques.current.filter((t) => agora - t < 2500), agora];
      if (toques.current.length >= 7) {
        toques.current = [];
        setAtivo(true);
      }
    },
    fechar: () => setAtivo(false),
  };
}

const MATRIZ = 'アイウエオカキクケコサシスセソ01ECO{}<>;=+*SIGAA';

function ChuvaMatriz({ cor }: { readonly cor: string }) {
  const tela = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = tela.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const escala = window.devicePixelRatio || 1;
    canvas.width = innerWidth * escala;
    canvas.height = innerHeight * escala;
    ctx.scale(escala, escala);
    const tamanho = 16;
    const gotas = Array.from({ length: Math.ceil(innerWidth / tamanho) }, () => Math.random() * -40);
    let quadro = 0;
    const desenhar = () => {
      ctx.fillStyle = 'rgba(0, 8, 4, 0.12)';
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.font = `${tamanho}px "Space Mono", monospace`;
      gotas.forEach((y, i) => {
        const letra = MATRIZ[Math.floor(Math.random() * MATRIZ.length)] ?? '0';
        ctx.fillStyle = Math.random() > 0.96 ? '#fff' : cor;
        ctx.fillText(letra, i * tamanho, y * tamanho);
        gotas[i] = y * tamanho > innerHeight && Math.random() > 0.975 ? 0 : y + 1;
      });
      quadro = requestAnimationFrame(desenhar);
    };
    desenhar();
    return () => cancelAnimationFrame(quadro);
  }, [cor]);
  return <canvas ref={tela} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

function FogosPontos({ cor }: { readonly cor: string }) {
  const pontos = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => {
        const angulo = (i / 90) * Math.PI * 2 * 3;
        const distancia = 60 + (i % 9) * 22;
        return { dx: Math.cos(angulo) * distancia, dy: Math.sin(angulo) * distancia, atraso: (i % 9) * 40, vermelho: i % 7 === 0 };
      }),
    [],
  );
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
      {pontos.map((p, i) => (
        <span
          key={i}
          className="absolute h-2.5 w-2.5 rounded-full"
          style={{
            background: p.vermelho ? cor : 'currentColor',
            animation: `fogos 1400ms cubic-bezier(0.2, 0.8, 0.2, 1) ${p.atraso}ms infinite`,
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
}

function ChuvaSimbolos({ simbolos }: { readonly simbolos: string }) {
  const lista = [...simbolos];
  const gotas = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        simbolo: lista[i % lista.length] ?? '•',
        esquerda: (i * 37) % 100,
        duracao: 2.4 + ((i * 13) % 20) / 10,
        atraso: -((i * 7) % 30) / 10,
        tamanho: 18 + ((i * 11) % 26),
        destaque: i % 5 === 0,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [simbolos],
  );
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {gotas.map((g, i) => (
        <span
          key={i}
          className={g.destaque ? 'absolute text-destaque-texto' : 'absolute opacity-70'}
          style={{ left: `${g.esquerda}%`, top: '-10%', fontSize: g.tamanho, animation: `cair ${g.duracao}s linear ${g.atraso}s infinite` }}
        >
          {g.simbolo}
        </span>
      ))}
    </div>
  );
}

function OndaSenoidal() {
  const caminho = (amplitude: number, periodo: number) =>
    Array.from({ length: 121 }, (_, i) => `${i ? 'L' : 'M'}${i * 10} ${50 + amplitude * Math.sin((i * 10 * 2 * Math.PI) / periodo)}`).join(' ');
  return (
    <svg viewBox="0 0 600 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {[
        { a: 30, p: 200, cor: 'hsl(var(--destaque))', dur: '1.6s' },
        { a: 18, p: 120, cor: 'currentColor', dur: '1.1s' },
        { a: 42, p: 300, cor: 'hsl(var(--destaque-texto))', dur: '2.4s' },
      ].map((o) => (
        <path key={o.p} d={caminho(o.a, o.p)} fill="none" stroke={o.cor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" opacity="0.8">
          <animateTransform attributeName="transform" type="translate" from="0 0" to={`${-o.p} 0`} dur={o.dur} repeatCount="indefinite" />
        </path>
      ))}
    </svg>
  );
}

export function Surpresa({ onFechar }: { readonly onFechar: () => void }) {
  const { prefs } = usarPreferencias();
  const cor = getComputedStyle(document.documentElement).getPropertyValue('--destaque') ? 'hsl(var(--destaque))' : '#d7191f';
  useEffect(() => {
    const id = window.setTimeout(onFechar, 6000);
    return () => window.clearTimeout(id);
  }, [onFechar]);
  const msg = definicao(prefs.estilo).segredo;
  return (
    <button
      type="button"
      onClick={onFechar}
      aria-label="Fechar surpresa"
      className="fixed inset-0 z-[60] overflow-hidden bg-background/90 text-foreground animate-entrar"
    >
      {msg.efeito === 'matriz' ? (
        <ChuvaMatriz cor="#3ddc84" />
      ) : msg.efeito === 'onda' ? (
        <OndaSenoidal />
      ) : msg.efeito === 'chuva' ? (
        <ChuvaSimbolos simbolos={msg.simbolos ?? '•'} />
      ) : (
        <FogosPontos cor={cor} />
      )}
      <span className="relative z-10 grid h-full place-items-center p-8 text-center">
        <span className="space-y-3 rounded-3xl border bg-card/90 p-6">
          <span className="block font-dot text-3xl font-extrabold">{msg.titulo}</span>
          <span className="block text-sm text-muted-foreground">{msg.texto}</span>
        </span>
      </span>
    </button>
  );
}
