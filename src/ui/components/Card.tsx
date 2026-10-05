import type { HTMLAttributes } from 'react';
import { cn } from '../cn';

type DivProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...p }: DivProps) => (
  <div className={cn('casca-card rounded-3xl border bg-card text-card-foreground', className)} {...p} />
);
export const CardHeader = ({ className, ...p }: DivProps) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...p} />
);
export const CardTitle = ({ className, ...p }: DivProps) => (
  <div className={cn('font-medium leading-tight', className)} {...p} />
);
export const CardDescription = ({ className, ...p }: DivProps) => (
  <div className={cn('text-sm text-muted-foreground', className)} {...p} />
);
export const CardContent = ({ className, ...p }: DivProps) => (
  <div className={cn('p-6 pt-0', className)} {...p} />
);
