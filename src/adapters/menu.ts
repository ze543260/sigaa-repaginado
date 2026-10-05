import type { ItemMenu } from '../domain/types';

const SEPARADOR = Symbol('separador');

type Valor = string | null | typeof SEPARADOR | Valor[];
type Token = { readonly tipo: 'abre' } | { readonly tipo: 'fecha' } | { readonly tipo: 'valor'; readonly valor: Valor };

function* tokens(fonte: string): Generator<Token> {
  let i = 0;
  while (i < fonte.length) {
    const c = fonte[i];
    if (c === '[') {
      yield { tipo: 'abre' };
      i++;
    } else if (c === ']') {
      yield { tipo: 'fecha' };
      i++;
    } else if (c === "'") {
      let s = '';
      for (i++; i < fonte.length && fonte[i] !== "'"; i++) {
        if (fonte[i] === '\\') i++;
        s += fonte[i] ?? '';
      }
      i++;
      yield { tipo: 'valor', valor: s };
    } else if (fonte.startsWith('null', i)) {
      yield { tipo: 'valor', valor: null };
      i += 4;
    } else if (fonte.startsWith('_cmSplit', i)) {
      yield { tipo: 'valor', valor: SEPARADOR };
      i += 8;
    } else {
      i++;
    }
  }
}

function parsear(fonte: string): Valor[] {
  const pilha: Valor[][] = [[]];
  for (const t of tokens(fonte)) {
    const topo = pilha[pilha.length - 1];
    if (!topo) break;
    if (t.tipo === 'abre') {
      const novo: Valor[] = [];
      topo.push(novo);
      pilha.push(novo);
    } else if (t.tipo === 'fecha') {
      pilha.pop();
    } else {
      topo.push(t.valor);
    }
  }
  const raiz = pilha[0]?.[0];
  return Array.isArray(raiz) ? raiz : [];
}

const decodificar = (s: string): string => {
  const doc = new DOMParser().parseFromString(s, 'text/html');
  return doc.body.textContent?.trim() ?? '';
};

function executar(doc: Document, acao: string, formId: string): void {
  const form = doc.getElementById(formId) as HTMLFormElement | null;
  const campo = form?.querySelector<HTMLInputElement>('input[name="jscook_action"]');
  if (!form || !campo) return;
  campo.value = acao;
  form.submit();
}

function converter(doc: Document, no: Valor[]): ItemMenu | null {
  const [, rotulo, acao, form, , ...filhos] = no;
  if (typeof rotulo !== 'string') return null;
  const itens = filhos.flatMap((f): ItemMenu[] => {
    if (f === SEPARADOR) return [{ rotulo: '', separador: true, filhos: [], abrir: null }];
    if (!Array.isArray(f)) return [];
    const item = converter(doc, f);
    return item ? [item] : [];
  });
  return {
    rotulo: decodificar(rotulo),
    separador: false,
    filhos: itens,
    abrir: typeof acao === 'string' && typeof form === 'string' ? () => executar(doc, acao, form) : null,
  };
}

export function extrairMenu(doc: Document): ItemMenu[] {
  const script = [...doc.querySelectorAll('#menu-dropdown script')].find((s) =>
    /var\s+menu_\w+\s*=/.test(s.textContent ?? ''),
  );
  const fonte = script?.textContent?.split('=').slice(1).join('=') ?? '';
  return parsear(fonte).flatMap((no) => {
    const item = Array.isArray(no) ? converter(doc, no) : null;
    return item ? [item] : [];
  });
}
