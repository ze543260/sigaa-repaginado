import { twMerge } from 'tailwind-merge';

export const cn = (...classes: ReadonlyArray<string | false | null | undefined>): string =>
  twMerge(classes.filter(Boolean).join(' '));
