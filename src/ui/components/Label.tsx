import type { LabelHTMLAttributes } from 'react';
import { cn } from '../cn';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('grid gap-2 px-1 text-sm font-medium leading-none', className)} {...props} />;
}
