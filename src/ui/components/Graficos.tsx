import { useId } from 'react';
import { cn } from '../cn';

type ComVariavel = React.CSSProperties & Record<'--comprimento', number>;

/** Anel de progresso 0–100 com o valor no centro. */
export function AnelProgresso({ valor, rotulo, tamanho = 112, className }: {
  readonly valor: number;
  readonly rotulo: string;
  readonly tamanho?: number;
  readonly className?: string;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, valor));
  const estilo: ComVariavel = { '--comprimento': c };
  return (
    <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} role="img" aria-label={`${rotulo}: ${v}%`} className={className}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--destaque))" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${(v / 100) * c} ${c}`} transform="rotate(-90 50 50)"
        className="desenhar" style={estilo}
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-current font-dot text-[22px] font-extrabold">
        {Math.round(v)}%
      </text>
    </svg>
  );
}

export interface Barra {
  readonly rotulo: string;
  readonly valor: number;
  readonly detalhe?: string;
  readonly destaque?: boolean;
}

function BarraUnica({ barra, maximo, limite, atraso, apagada }: {
  readonly barra: Barra;
  readonly maximo: number;
  readonly limite?: number;
  readonly atraso: number;
  readonly apagada: boolean;
}) {
  const largura = (Math.max(0, Math.min(barra.valor, maximo)) / maximo) * 100;
  const abaixo = apagada || (limite !== undefined && barra.valor < limite);
  return (
    <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="h-3 w-full overflow-visible" aria-hidden="true">
      <rect x="0" y="0" width="100" height="12" rx="6" fill="currentColor" fillOpacity="0.08" />
      <rect
        x="0" y="0" width={largura} height="12" rx="6"
        fill={abaixo ? 'currentColor' : 'hsl(var(--destaque))'} fillOpacity={abaixo ? 0.45 : 1}
        className="crescer" style={{ animationDelay: `${atraso}ms` }}
      />
      {limite !== undefined && (
        <line
          x1={(limite / maximo) * 100} x2={(limite / maximo) * 100} y1="-3" y2="15"
          stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

/** Barras horizontais com rótulo e valor em texto (o SVG desenha só a barra; o texto fica nítido). */
export function GraficoBarras({ barras, maximo, unidade = '', limite, rotulo }: {
  readonly barras: readonly Barra[];
  readonly maximo?: number;
  readonly unidade?: string;
  /** Linha de referência, ex.: média para aprovação. */
  readonly limite?: number;
  readonly rotulo: string;
}) {
  const topo = maximo ?? Math.max(1, ...barras.map((b) => b.valor));
  return (
    <div
      role="img"
      aria-label={`${rotulo}: ${barras.map((b) => `${b.rotulo} ${b.detalhe ?? b.valor + unidade}`).join(', ')}`}
      className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-x-3 gap-y-2 text-xs sm:grid-cols-[minmax(0,11rem)_1fr_auto]"
    >
      {barras.map((b, i) => (
        <div key={b.rotulo + i} className="contents">
          <span className={cn('truncate', b.destaque ? 'font-medium text-foreground' : 'text-muted-foreground')} title={b.rotulo}>
            {b.rotulo}
          </span>
          <BarraUnica barra={b} maximo={topo} limite={limite} atraso={i * 60} apagada={barras.some((x) => x.destaque) && !b.destaque} />
          <span className="text-right font-mono tabular-nums">{b.detalhe ?? `${b.valor}${unidade}`}</span>
        </div>
      ))}
    </div>
  );
}

/** Medidor semicircular, ex.: faltas usadas do limite. */
export function Medidor({ valor, maximo, rotulo }: { readonly valor: number; readonly maximo: number; readonly rotulo: string }) {
  const fracao = Math.max(0, Math.min(1, maximo > 0 ? valor / maximo : 0));
  const c = Math.PI * 40;
  const perigo = fracao >= 0.75;
  const estilo: ComVariavel = { '--comprimento': c };
  return (
    <svg viewBox="0 0 100 60" className="w-full max-w-[13rem]" role="img" aria-label={`${rotulo}: ${valor} de ${maximo}`}>
      <path d="M10 52 A40 40 0 0 1 90 52" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="9" strokeLinecap="round" />
      <path
        d="M10 52 A40 40 0 0 1 90 52" fill="none" strokeWidth="9" strokeLinecap="round"
        stroke={perigo ? 'hsl(var(--destaque))' : 'currentColor'}
        strokeDasharray={`${fracao * c} ${c}`} className="desenhar" style={estilo}
      />
      <text x="50" y="46" textAnchor="middle" className="fill-current font-dot text-[22px] font-extrabold">{valor}</text>
      <text x="50" y="58" textAnchor="middle" className="fill-current text-[7px] opacity-60">de {maximo}</text>
    </svg>
  );
}

const BLOCOS_ESQUELETO: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 32, 5], [0, 10, 64, 14],
  [0, 34, 100, 30], [0, 72, 100, 20], [0, 100, 48, 36], [52, 100, 48, 36], [0, 144, 100, 20], [0, 172, 100, 20],
];

/** Esqueleto da página com brilho deslizante. */
export function Esqueleto({ className }: { readonly className?: string }) {
  const id = `brilho-${useId().replace(/\W/g, '')}`;
  return (
    <svg viewBox="0 0 100 192" preserveAspectRatio="xMidYMin meet" className={cn('w-full text-foreground', className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 0)">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.06" />
          <stop offset="0.5" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.06" />
          <animateTransform attributeName="gradientTransform" type="translate" values="-100 0;100 0" dur="1.3s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      {BLOCOS_ESQUELETO.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="3.5" fill={`url(#${id})`} />
      ))}
    </svg>
  );
}

const PONTOS = Array.from({ length: 25 }, (_, i) => ({
  x: (i % 5) * 12 + 6,
  y: Math.floor(i / 5) * 12 + 6,
  atraso: ((i % 5) + Math.floor(i / 5)) * 0.09,
}));

/** Matriz 5×5 acendendo em onda diagonal. */
export function CarregadorPontos({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={cn('h-16 w-16', className)} aria-hidden="true">
      {PONTOS.map((p) => (
        <circle
          key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r="3.6" opacity="0.15"
          fill={p.x === 30 && p.y === 30 ? 'hsl(var(--destaque))' : 'currentColor'}
        >
          <animate attributeName="opacity" values="0.15;1;0.15" dur="1.1s" begin={`${p.atraso}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

export interface Ponto {
  readonly rotulo: string;
  readonly valor: number;
}

/** Linha com pontos (ex.: média por semestre) e referência tracejada. */
export function GraficoLinha({ pontos, maximo = 10, limite, rotulo }: {
  readonly pontos: readonly Ponto[];
  readonly maximo?: number;
  readonly limite?: number;
  readonly rotulo: string;
}) {
  const L = 300;
  const A = 120;
  const m = { x: 24, y: 14 };
  const x = (i: number) => m.x + (pontos.length === 1 ? (L - 2 * m.x) / 2 : (i * (L - 2 * m.x)) / (pontos.length - 1));
  const y = (v: number) => A - m.y - (v / maximo) * (A - 2 * m.y);
  const caminho = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.valor).toFixed(1)}`).join(' ');
  const comprimento = pontos.reduce((t, p, i) => (i ? t + Math.hypot(x(i) - x(i - 1), y(p.valor) - y(pontos[i - 1]?.valor ?? 0)) : 0), 0);
  const estilo: ComVariavel = { '--comprimento': comprimento };
  return (
    <svg viewBox={`0 0 ${L} ${A + 16}`} className="w-full" role="img" aria-label={`${rotulo}: ${pontos.map((p) => `${p.rotulo} ${p.valor.toFixed(1)}`).join(', ')}`}>
      {limite !== undefined && (
        <>
          <line x1={m.x} x2={L - m.x} y1={y(limite)} y2={y(limite)} stroke="currentColor" strokeOpacity="0.4" strokeDasharray="3 3" />
          <text x={L - m.x + 4} y={y(limite) + 3} className="fill-current text-[8px] opacity-60">{limite}</text>
        </>
      )}
      <path d={caminho} fill="none" stroke="hsl(var(--destaque))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="desenhar" style={estilo} />
      {pontos.map((p, i) => (
        <g key={p.rotulo}>
          <circle cx={x(i)} cy={y(p.valor)} r="4" fill="hsl(var(--background))" stroke="hsl(var(--destaque))" strokeWidth="2" />
          <text x={x(i)} y={y(p.valor) - 8} textAnchor="middle" className="fill-current font-mono text-[9px]">{p.valor.toFixed(1).replace('.', ',')}</text>
          <text x={x(i)} y={A + 10} textAnchor="middle" className="fill-current font-mono text-[8px] opacity-60">{p.rotulo}</text>
        </g>
      ))}
    </svg>
  );
}
