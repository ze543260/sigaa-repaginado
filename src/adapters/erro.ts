import type { ErroPagina } from '../domain/types';

// O cabeçalho de toda página traz "Tempo de Sessão"; só o aviso de expiração conta.
const SESSAO = /sess[aã]o\s+(expirou|expirada|encerrada)/i;
const INDISPONIVEL = /(indispon[ií]vel|manuten[cç][aã]o|erro interno|ocorreu um erro|error 50\d|service unavailable|comportamento inesperado)/i;

/** Reconhece a página de erro offline do app e as páginas curtas de erro/sessão do SIGAA. */
export function extrairErro(url: URL, doc: Document): ErroPagina | null {
  const janela = doc.defaultView;
  const recarregar = () => janela?.location.reload();
  const login = () => janela?.location.assign(`${url.origin}/sigaa/verTelaLogin.do`);

  const offline = doc.getElementById('sigaa-offline');
  if (offline) {
    const destino = offline.getAttribute('data-url') || `${url.origin}/sigaa/verTelaLogin.do`;
    return { tipo: 'offline', mensagem: offline.textContent?.trim() ?? '', tentar: () => janela?.location.assign(destino) };
  }

  const texto = doc.body?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (texto.length > 3000 || doc.querySelector('#conteudo table.listagem')) return null;
  if (/expirada|expirou/i.test(url.pathname) || SESSAO.test(texto)) {
    return { tipo: 'sessao', mensagem: 'Sua sessão no SIGAA terminou.', tentar: login };
  }
  if (INDISPONIVEL.test(texto) || doc.title.match(/erro|error/i)) {
    return { tipo: 'indisponivel', mensagem: texto.slice(0, 240), tentar: recarregar };
  }
  return null;
}
