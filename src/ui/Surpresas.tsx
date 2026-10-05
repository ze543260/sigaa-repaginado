import { useEffect, useMemo, useRef, useState } from 'react';
import { usarPreferencias, type Estilo } from './tema';

export type Contexto = 'saudacao' | 'sem-aulas' | 'sem-atividades' | 'sem-tarefas' | 'erro' | 'carregando';

const PIADAS: Readonly<Record<Estilo, Partial<Record<Contexto, readonly string[]>>>> = {
  terminal: {
    saudacao: [
      '$ sudo passar-em-calculo → Permission denied',
      '$ git commit -m "agora vai" && git commit -m "agora vai mesmo"',
      '$ ./estudar --amanha → Segmentation fault (core dumped)',
      '$ cat motivacao.txt → No such file or directory',
      '$ npm install cafe → added 1 package, 0 vulnerabilities',
      '$ make prova → make: *** No rule to make target "prova"',
      '$ ping professor → Request timed out',
      '$ git blame codigo.c → você, 3 da manhã',
      '$ while true; do estudar; done → ^C',
      '$ echo $SONO → undefined',
      '$ rm -rf /procrastinacao → Device or resource busy',
      '$ python3 -c "import antigravity" → funciona, já o TFG...',
    ],
    'sem-aulas': ['while (!aula) { dormir(); }', 'aulas.filter(hoje) → []  // aproveita o garbage collection'],
    'sem-atividades': ['$ ls tarefas/ → (vazio). git push --force no descanso.', 'Nenhuma tarefa. Isso é um bug ou uma feature?'],
    'sem-tarefas': ['$ ls tarefas/ → (vazio)', 'return null; // por enquanto'],
    erro: ['Kernel panic: o SIGAA não respondeu ao ping.', 'Exception in thread "main": SigaaForaDoArException'],
    carregando: ['compilando portal.c...', 'linkando turmas.o...', 'resolvendo dependências do JSF...', 'aguardando o servidor (timeout 25 min)...', 'otimizando com -O3...'],
  },
  minimalista: {
    'sem-aulas': ['Sem aulas hoje. Respira.'],
    'sem-atividades': ['Nada pendente. Silêncio bom.'],
  },
};

function sortear<T>(lista: readonly T[], semente: number): T | undefined {
  return lista[Math.abs(semente) % lista.length];
}

/** Uma das piadas do estilo atual para o contexto; muda uma vez por dia para não cansar. */
export function usePiada(contexto: Contexto): string | null {
  const { prefs } = usarPreferencias();
  return useMemo(() => {
    const lista = PIADAS[prefs.estilo][contexto];
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
    const id = window.setInterval(() => setN((v) => (v >= texto.length ? v : v + 1)), 28);
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
export function LogCompilacao() {
  const linhas = PIADAS.terminal.carregando ?? [];
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

const MENSAGEM: Readonly<Record<Estilo, { readonly titulo: string; readonly texto: string }>> = {
  terminal: { titulo: 'acesso root concedido', texto: 'Você achou o modo desenvolvedor. Nada mudou, mas agora você sabe que dá.' },
  minimalista: { titulo: 'você achou', texto: 'Menos é mais. Mas um pouco de festa não faz mal.' },
};

export function Surpresa({ onFechar }: { readonly onFechar: () => void }) {
  const { prefs } = usarPreferencias();
  const cor = getComputedStyle(document.documentElement).getPropertyValue('--destaque') ? 'hsl(var(--destaque))' : '#d7191f';
  useEffect(() => {
    const id = window.setTimeout(onFechar, 6000);
    return () => window.clearTimeout(id);
  }, [onFechar]);
  const msg = MENSAGEM[prefs.estilo];
  return (
    <button
      type="button"
      onClick={onFechar}
      aria-label="Fechar surpresa"
      className="fixed inset-0 z-[60] overflow-hidden bg-background/90 text-foreground animate-entrar"
    >
      {prefs.estilo === 'terminal' ? <ChuvaMatriz cor="#3ddc84" /> : <FogosPontos cor={cor} />}
      <span className="relative z-10 grid h-full place-items-center p-8 text-center">
        <span className="space-y-3 rounded-3xl border bg-card/90 p-6">
          <span className="block font-dot text-3xl font-extrabold">{msg.titulo}</span>
          <span className="block text-sm text-muted-foreground">{msg.texto}</span>
        </span>
      </span>
    </button>
  );
}
