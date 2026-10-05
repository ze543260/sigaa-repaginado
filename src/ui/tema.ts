import { createContext, useContext, useEffect, useState } from 'react';

export type Tema = 'sistema' | 'claro' | 'escuro';
export type Acento = 'vermelho' | 'laranja' | 'verde' | 'azul' | 'violeta' | 'rosa';

export interface Preferencias {
  readonly tema: Tema;
  readonly acento: Acento;
  readonly pontos: boolean;
  readonly animacoes: boolean;
  readonly lembretes: boolean;
  readonly escala: Escala;
  readonly estilo: Estilo;
}

import { ESTILOS, type Estilo } from './estilos';

export type { Estilo };

export type Escala = 'compacta' | 'normal' | 'grande';
export const ESCALAS: readonly Escala[] = ['compacta', 'normal', 'grande'];
export const ZOOM: Readonly<Record<Escala, number>> = { compacta: 0.9, normal: 1, grande: 1.12 };

export const TEMAS: readonly Tema[] = ['sistema', 'claro', 'escuro'];
export const ACENTOS: readonly Acento[] = ['vermelho', 'laranja', 'verde', 'azul', 'violeta', 'rosa'];

const PADRAO: Preferencias = { tema: 'sistema', acento: 'vermelho', pontos: true, animacoes: true, lembretes: true, escala: 'normal', estilo: 'minimalista' };

// O tema tem chave própria porque o anti-flash o lê antes da interface existir.
const CHAVE_TEMA = 'sigaa-v2:tema';
const CHAVE_PREFS = 'sigaa-v2:prefs';

function ler(): Preferencias {
  try {
    const tema = TEMAS.find((t) => t === localStorage.getItem(CHAVE_TEMA)) ?? PADRAO.tema;
    const salvas = JSON.parse(localStorage.getItem(CHAVE_PREFS) ?? '{}') as Partial<Preferencias>;
    return {
      tema,
      acento: ACENTOS.find((a) => a === salvas.acento) ?? PADRAO.acento,
      pontos: typeof salvas.pontos === 'boolean' ? salvas.pontos : PADRAO.pontos,
      animacoes: typeof salvas.animacoes === 'boolean' ? salvas.animacoes : PADRAO.animacoes,
      lembretes: typeof salvas.lembretes === 'boolean' ? salvas.lembretes : PADRAO.lembretes,
      escala: ESCALAS.find((e) => e === salvas.escala) ?? PADRAO.escala,
      estilo: ESTILOS.find((e) => e === salvas.estilo) ?? PADRAO.estilo,
    };
  } catch {
    return PADRAO;
  }
}

export interface ControlePreferencias {
  readonly prefs: Preferencias;
  readonly alterar: (mudanca: Partial<Preferencias>) => void;
  readonly alternarTema: () => void;
}

export function usePreferencias(): ControlePreferencias {
  const [prefs, setPrefs] = useState<Preferencias>(ler);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_TEMA, prefs.tema);
      const { tema: _tema, ...resto } = prefs;
      localStorage.setItem(CHAVE_PREFS, JSON.stringify(resto));
    } catch {
      /* armazenamento indisponível: as preferências valem só para esta página */
    }
  }, [prefs]);

  return {
    prefs,
    alterar: (mudanca) => setPrefs((atual) => ({ ...atual, ...mudanca })),
    alternarTema: () =>
      setPrefs((atual) => ({ ...atual, tema: TEMAS[(TEMAS.indexOf(atual.tema) + 1) % TEMAS.length] ?? 'sistema' })),
  };
}

export const ContextoPreferencias = createContext<ControlePreferencias | null>(null);

export function usarPreferencias(): ControlePreferencias {
  const contexto = useContext(ContextoPreferencias);
  if (!contexto) throw new Error('usarPreferencias fora de ContextoPreferencias');
  return contexto;
}
