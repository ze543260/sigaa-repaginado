import { useEffect, useRef, useState } from 'react';
import { cn } from '../cn';

interface BarraProps {
  readonly valor: number;
  readonly total?: number;
  readonly pontos?: number;
  readonly rotulo: string;
  readonly alerta?: boolean;
}

export function BarraPontos({ valor, total = 100, pontos = 32, rotulo, alerta = false }: BarraProps) {
  const proporcao = total > 0 ? Math.max(0, Math.min(1, valor / total)) : 0;
  const acesos = Math.round(proporcao * pontos);

  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={valor}
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${pontos}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: pontos }, (_, i) => (
        <span
          key={i}
          style={i < acesos ? { animationDelay: `${200 + i * 40}ms` } : undefined}
          className={cn(
            'aspect-square rounded-full',
            i < acesos && 'animate-acender',
            i < acesos ? (alerta ? 'bg-destaque' : 'bg-foreground') : 'bg-foreground/15',
          )}
        />
      ))}
    </div>
  );
}

interface NumeroProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function NumeroPontos({ children, className }: NumeroProps) {
  return <span className={cn('font-dot font-extrabold leading-none tracking-tight', className)}>{children}</span>;
}

export function Sinal({ ativo = true, rotulo }: { readonly ativo?: boolean; readonly rotulo?: string }) {
  return (
    <span
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', ativo ? 'pulso bg-destaque' : 'bg-foreground/30')}
    />
  );
}

const DURACAO_CONTAGEM_MS = 900;

/** Conta de 0 até o valor (ex.: "5.77", "6%") preservando casas decimais e sufixo. */
export function ContagemPontos({ valor, className }: { readonly valor: string; readonly className?: string }) {
  const partes = valor.match(/^(\d+)(?:[.,](\d+))?(.*)$/);
  const alvo = partes ? Number(`${partes[1]}.${partes[2] ?? '0'}`) : NaN;
  const casas = partes?.[2]?.length ?? 0;
  const separador = valor.includes(',') ? ',' : '.';
  const sufixo = partes?.[3] ?? '';
  const [atual, setAtual] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (Number.isNaN(alvo)) return;
    const semMovimento =
      matchMedia('(prefers-reduced-motion: reduce)').matches || ref.current?.closest('.sem-animacao') !== null;
    if (semMovimento) {
      setAtual(alvo);
      return;
    }
    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / DURACAO_CONTAGEM_MS);
      setAtual(alvo * (1 - (1 - t) ** 3));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo]);

  if (Number.isNaN(alvo)) return <NumeroPontos className={className}>{valor}</NumeroPontos>;
  return (
    <NumeroPontos className={className}>
      <span ref={ref} aria-hidden="true">
        {atual.toFixed(casas).replace('.', separador)}
        {sufixo}
      </span>
      <span className="sr-only">{valor}</span>
    </NumeroPontos>
  );
}
