import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Estilo } from './estilos';
import { cn } from './cn';
import { usarPreferencias } from './tema';

const D = 'hsl(var(--destaque))';
const F = 'hsl(var(--foreground))';
const M = 'hsl(var(--muted-foreground))';
const B = 'hsl(var(--border))';

const atraso = (s: number) => ({ animationDelay: `${s}s` });

function engrenagem(cx: number, cy: number, r: number, dentes: number): string {
  const pontos: string[] = [];
  for (let i = 0; i < dentes * 2; i++) {
    const raio = i % 2 ? r : r + 6;
    for (const k of [-0.28, 0.28]) {
      const a = ((i + 0.5 + k) / (dentes * 2)) * Math.PI * 2;
      pontos.push(`${(cx + raio * Math.cos(a)).toFixed(1)},${(cy + raio * Math.sin(a)).toFixed(1)}`);
    }
  }
  return `M${pontos.join('L')}Z`;
}

const CENAS: Record<Estilo, () => ReactNode> = {
  minimalista: () => (
    <g>
      {Array.from({ length: 21 }, (_, x) => (
        <g key={x} className="ilu-ponto" style={atraso(x * 0.08)}>
          {Array.from({ length: 7 }, (_, y) => (
            <circle key={y} cx={20 + x * 8} cy={36 + y * 8} r="2.4" fill={x === 10 && y === 3 ? D : F} />
          ))}
        </g>
      ))}
    </g>
  ),
  terminal: () => (
    <g fontFamily="var(--fonte-mono)" fontSize="10">
      <rect x="20" y="18" width="160" height="84" rx="3" fill="none" stroke={B} />
      <rect x="20" y="18" width="160" height="12" fill={B} />
      {[0, 1, 2].map((i) => <circle key={i} cx={28 + i * 9} cy="24" r="2" fill={i ? M : D} />)}
      <text x="28" y="46" fill={M}>$ ssh aluno@sigaa</text>
      <text x="28" y="62" fill={F} className="ilu-digitar" style={atraso(0.4)}>autenticando...</text>
      <text x="28" y="78" fill={D} className="ilu-digitar" style={atraso(1.6)}>acesso concedido</text>
      <rect x="28" y="84" width="6" height="10" fill={D} className="ilu-piscar" />
    </g>
  ),
  eletrica: () => (
    <g>
      {[0, 1, 2, 3, 4].map((i) => <line key={`v${i}`} x1={20 + i * 40} x2={20 + i * 40} y1="20" y2="100" stroke={B} />)}
      {[0, 1, 2, 3, 4].map((i) => <line key={`h${i}`} x1="20" x2="180" y1={20 + i * 20} y2={20 + i * 20} stroke={B} />)}
      <clipPath id="ilu-tela"><rect x="20" y="20" width="160" height="80" /></clipPath>
      <g clipPath="url(#ilu-tela)">
        <path
          className="ilu-rolar"
          d={`M-140 60 ${Array.from({ length: 16 }, (_, i) => `q10 ${i % 2 ? 60 : -60} 20 0`).join(' ')}`}
          transform="translate(0 0)"
          fill="none"
          stroke={D}
          strokeWidth="2.2"
          style={{ filter: `drop-shadow(0 0 3px ${D})` }}
        />
      </g>
    </g>
  ),
  mecanica: () => (
    <g fill="none" stroke={F} strokeWidth="1.6">
      <g className="ilu-girar"><path d={engrenagem(80, 60, 30, 12)} /><circle cx="80" cy="60" r="8" /></g>
      <g className="ilu-girar-inverso"><path d={engrenagem(130, 60, 18, 8)} stroke={D} /><circle cx="130" cy="60" r="5" stroke={D} /></g>
      <line x1="20" x2="180" y1="108" y2="108" stroke={M} strokeDasharray="6 3 1 3" />
    </g>
  ),
  civil: () => (
    <g stroke={F} strokeWidth="2" fill="none">
      <path d="M40 110V20h110M40 20l20 20M60 20v-8l70 8M150 20v6" />
      <path d="M40 40h20M40 60h20M40 80h20M40 100h20M40 40l20 20M60 40L40 60M40 60l20 20M60 60L40 80M40 80l20 20M60 80L40 100" strokeWidth="1" stroke={M} />
      <g className="ilu-icar">
        <line x1="130" x2="130" y1="22" y2="66" strokeWidth="1" />
        <rect x="104" y="66" width="52" height="8" fill="#f2b705" stroke="#161616" />
      </g>
      <line x1="10" x2="190" y1="110" y2="110" />
    </g>
  ),
  producao: () => (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={20 + i * 56} y="20" width="48" height="84" rx="4" fill={B} opacity="0.5" />
          <rect x={26 + i * 56} y="26" width="24" height="3" rx="1.5" fill={M} />
        </g>
      ))}
      <rect x="26" y="70" width="36" height="24" fill="#bae6fd" />
      <rect x="138" y="38" width="36" height="24" fill="#bbf7d0" />
      <g className="ilu-mover-cartao"><rect x="26" y="38" width="36" height="24" fill="#fde68a" /><path d="M31 46h20M31 52h14" stroke="#1c1917" strokeWidth="2" /></g>
    </g>
  ),
  lousa: () => (
    <g>
      <rect x="14" y="16" width="172" height="88" rx="2" fill="none" stroke="#7a4a24" strokeWidth="6" />
      <text x="100" y="70" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="30" fill="none" stroke={F} strokeWidth="1" className="ilu-giz">a² + b² = c²</text>
    </g>
  ),
  controle: () => (
    <g fill="none" stroke={F} strokeWidth="2">
      <line x1="20" x2="20" y1="20" y2="100" strokeWidth="3" />
      <line x1="180" x2="180" y1="20" y2="100" strokeWidth="3" />
      <path d="M20 60h30M50 48v24M64 48v24M64 60h60M150 60h30" />
      <circle cx="137" cy="60" r="13" />
      <path d="M20 60h30M64 60h60" stroke={D} strokeDasharray="4 6" className="ilu-fluxo" />
      <circle cx="137" cy="60" r="9" fill={D} stroke="none" className="ilu-led" />
      <text x="57" y="40" textAnchor="middle" fontSize="9" fontFamily="var(--fonte-mono)" fill={M} stroke="none">I0.0</text>
      <text x="137" y="40" textAnchor="middle" fontSize="9" fontFamily="var(--fonte-mono)" fill={M} stroke="none">Q0.0</text>
    </g>
  ),
  ambiental: () => (
    <g fill="none" strokeWidth="1.4">
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${100 - 20 - i * 14} 62c0-${12 + i * 7} ${30 + i * 14}-${16 + i * 8} ${40 + i * 28} -${4 + i * 3}s${6 + i * 4} ${20 + i * 9}-${16 + i * 8} ${22 + i * 10}-${26 + i * 13} -${2 + i * 2}-${24 + i * 14}-${16 + i * 6}z`}
          stroke={i % 2 ? M : D}
          className="ilu-respirar"
          style={atraso(i * 0.3)}
        />
      ))}
      <path d="M100 12c4 6 7 10 7 14a7 7 0 0 1-14 0c0-4 3-8 7-14z" fill={D} stroke="none" className="ilu-gota" />
    </g>
  ),
  materiais: () => (
    <g>
      {Array.from({ length: 5 * 4 }, (_, i) => {
        const c = i % 5;
        const linha = Math.floor(i / 5);
        const x = 40 + c * 30 + (linha % 2) * 15;
        const y = 30 + linha * 22;
        return (
          <g key={i}>
            {c < 4 && <line x1={x} y1={y} x2={x + 30} y2={y} stroke={B} />}
            {linha < 3 && <line x1={x} y1={y} x2={x + (linha % 2 ? -15 : 15)} y2={y + 22} stroke={B} />}
            <circle cx={x} cy={y} r="5" fill={(c + linha) % 3 ? F : D} className="ilu-vibrar" style={atraso(((c * 7 + linha * 3) % 10) * 0.12)} />
          </g>
        );
      })}
    </g>
  ),
  retro: () => (
    <g shapeRendering="crispEdges">
      <rect x="0" y="100" width="200" height="20" fill={F} opacity="0.25" />
      <rect x="120" y="76" width="24" height="24" fill={D} />
      <rect x="126" y="82" width="12" height="4" fill="hsl(var(--background))" />
      <g className="ilu-pular">
        <rect x="60" y="76" width="16" height="16" fill={F} />
        <rect x="64" y="80" width="4" height="4" fill="hsl(var(--background))" />
        <rect x="62" y="92" width="4" height="8" fill={F} />
        <rect x="70" y="92" width="4" height="8" fill={F} />
      </g>
      <rect x="128" y="44" width="8" height="8" fill="#f2b705" className="ilu-moeda" />
    </g>
  ),
  energia: () => (
    <g>
      <g className="ilu-girar" style={{ transformBox: 'view-box', transformOrigin: '60px 46px' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="60" y1="18" x2="60" y2="26" stroke={D} strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * 30} 60 46)`} />
        ))}
      </g>
      <circle cx="60" cy="46" r="14" fill={D} />
      <path d="M110 100l20-40h56l-20 40z" fill="none" stroke={F} strokeWidth="2" />
      <path d="M124 80h56M139 60l-10 40M157 60l-10 40" stroke={F} strokeWidth="1" />
      <path d="M78 56l36 18" stroke={D} strokeWidth="2" strokeDasharray="3 5" className="ilu-fluxo" />
    </g>
  ),
  quimica: () => (
    <g>
      <path d="M86 18h28M90 18v30L66 100a3 3 0 0 0 3 4h62a3 3 0 0 0 3-4L110 48V18" fill="none" stroke={F} strokeWidth="2" />
      <path d="M78 76h44l12 24a3 3 0 0 1-3 4H69a3 3 0 0 1-3-4z" fill={D} opacity="0.35" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={88 + i * 8} cy="96" r={2 + (i % 2)} fill={D} className="ilu-bolha" style={atraso(i * 0.45)} />
      ))}
    </g>
  ),
  classico: () => (
    <g fontFamily="Inter, sans-serif">
      <rect x="20" y="16" width="160" height="92" rx="4" fill="hsl(var(--card))" stroke={B} />
      <rect x="20" y="16" width="160" height="16" rx="4" fill="#2a4274" />
      <rect x="20" y="30" width="160" height="2" fill="#f29b12" />
      <text x="28" y="27" fontSize="7" fill="#fff" fontWeight="600" letterSpacing="0.5">SIGAA</text>
      <text x="172" y="27" fontSize="6" fill="#fff" textAnchor="end" opacity="0.85">sessão</text>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="30" y={42 + i * 12} width="140" height="8" rx="1.5" fill={i % 2 ? 'hsl(var(--accent))' : 'hsl(var(--secondary))'} className="ilu-ponto" style={atraso(i * 0.25)} />
      ))}
      <rect x="30" y="94" width="140" height="4" rx="2" fill={B} />
      <rect x="30" y="94" width="140" height="4" rx="2" fill="#f29b12" className="ilu-sessao" />
    </g>
  ),
  admin: () => (
    <g>
      <line x1="20" x2="180" y1="104" y2="104" stroke={F} />
      {[34, 52, 44, 70, 62, 84].map((h, i) => (
        <rect key={i} x={30 + i * 25} y={104 - h} width="16" height={h} fill={i === 5 ? D : M} className="ilu-barra" style={atraso(i * 0.12)} />
      ))}
      <path d="M38 66L63 50L88 58L113 32L138 40L163 18" fill="none" stroke={D} strokeWidth="2" className="ilu-traco" pathLength={1} />
    </g>
  ),
};

export function IlustracaoLogin({ className, estilo: fixo }: { readonly className?: string; readonly estilo?: Estilo }) {
  const atual = usarPreferencias().prefs.estilo;
  const estilo = fixo ?? atual;
  const ref = useRef<SVGSVGElement>(null);
  const [visivel, setVisivel] = useState(true);

  // Fora da tela a cena congela: no seletor são 15 ao mesmo tempo.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([e]) => setVisivel(!!e?.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 200 120" className={cn('ilustracao-login w-full', !visivel && 'ilu-pausada', className)} aria-hidden="true">
      {CENAS[estilo]()}
    </svg>
  );
}

/** Estado vazio com a cena do estilo em tamanho pequeno. */
export function EstadoVazio({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 p-6 text-center text-sm text-muted-foreground', className)}>
      <IlustracaoLogin className="max-w-[10rem] opacity-90" />
      <div>{children}</div>
    </div>
  );
}
