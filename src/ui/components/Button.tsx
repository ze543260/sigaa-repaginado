import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../cn';

const VARIANTES = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/85',
  destaque: 'bg-destaque text-white hover:bg-destaque/90',
  outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

const TAMANHOS = {
  default: 'h-10 px-5',
  sm: 'h-8 px-3.5 text-xs',
  lg: 'h-12 px-8 text-base',
} as const;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: keyof typeof VARIANTES;
  readonly size?: keyof typeof TAMANHOS;
}

export function Button({ variant = 'default', size = 'default', className, ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
        VARIANTES[variant],
        TAMANHOS[size],
        className,
      )}
      {...props}
    />
  );
}
