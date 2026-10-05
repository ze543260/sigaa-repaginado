import type { CamposLogin } from '../domain/types';

export const SELETORES_LOGIN = {
  usuario: 'input[name="user.login"]',
  senha: 'input[name="user.senha"]',
  recuperarSenha: 'a[href*="recuperar"], a[href*="Senha"]',
} as const;

const MENSAGEM_LOGIN = /inv[aá]lid|incorret|expir|bloquead|tente novamente|n[aã]o encontrad/i;

function mensagensDaTela(doc: Document): string[] {
  const folhas = [...doc.body.querySelectorAll('li, p, span, div, center, td, b, font')].filter(
    (el) => el.children.length === 0 && MENSAGEM_LOGIN.test(el.textContent ?? ''),
  );
  return [...new Set(folhas.map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()))].filter(Boolean).slice(0, 3);
}

export function extrairLogin(doc: Document): CamposLogin | null {
  const usuario = doc.querySelector<HTMLInputElement>(SELETORES_LOGIN.usuario);
  const senha = doc.querySelector<HTMLInputElement>(SELETORES_LOGIN.senha);
  const form = usuario?.form;
  if (!usuario || !senha || !form) return null;

  return {
    preencherEEntrar: (u, s) => {
      usuario.value = u;
      senha.value = s;
      form.requestSubmit();
    },
    linkRecuperarSenha:
      doc.querySelector<HTMLAnchorElement>(SELETORES_LOGIN.recuperarSenha)?.href ?? null,
    mensagens: mensagensDaTela(doc),
  };
}
