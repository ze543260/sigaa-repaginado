import { useEffect, useState } from 'react';

const EVENTO = 'sigaa:memoria';

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto === null ? padrao : (JSON.parse(bruto) as T);
  } catch {
    return padrao;
  }
}

/** Estado persistido no aparelho e sincronizado entre os componentes que usam a mesma chave. */
export function useMemoria<T>(chave: string, padrao: T): [T, (novo: T) => void] {
  const [valor, setValor] = useState<T>(() => ler(chave, padrao));

  useEffect(() => {
    const atualizar = (e: Event) => {
      if ((e as CustomEvent<string>).detail === chave) setValor(ler(chave, padrao));
    };
    window.addEventListener(EVENTO, atualizar);
    return () => window.removeEventListener(EVENTO, atualizar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const gravar = (novo: T) => {
    setValor(novo);
    try {
      localStorage.setItem(chave, JSON.stringify(novo));
    } catch {
      /* sem armazenamento: vale só nesta página */
    }
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: chave }));
  };

  return [valor, gravar];
}

export const CHAVE_FEITAS = 'sigaa-v2:feitas';
export const CHAVE_FAVORITOS = 'sigaa-v2:favoritos';

/** Alterna a presença de `item` numa lista persistida. */
export function useConjunto(chave: string): [ReadonlySet<string>, (item: string) => void] {
  const [lista, gravar] = useMemoria<string[]>(chave, []);
  const conjunto = new Set(lista);
  return [conjunto, (item) => gravar(conjunto.has(item) ? lista.filter((x) => x !== item) : [...lista, item].slice(-300))];
}
