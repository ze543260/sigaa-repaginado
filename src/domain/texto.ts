const MINUSCULAS = new Set(['a', 'à', 'ao', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'no', 'o', 'os', 'ou', 'para', 'por']);
const ROMANO = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i;

/** "CÁLCULO II" → "Cálculo II"; "INTRODUÇÃO À ELETRÔNICA" → "Introdução à Eletrônica". */
export function tituloBr(texto: string): string {
  return texto
    .toLowerCase()
    .split(/(\s+|[-/()])/)
    .map((p, i) => {
      if (ROMANO.test(p)) return p.toUpperCase();
      if (i > 0 && MINUSCULAS.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join('');
}
