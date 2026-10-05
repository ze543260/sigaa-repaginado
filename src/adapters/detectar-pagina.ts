import type { Pagina } from '../domain/types';
import { extrairCaixaPostal, extrairCompositor, extrairMensagem } from './caixa-postal';
import { extrairErro } from './erro';
import { extrairLogin } from './login';
import { extrairPortal } from './portal-discente';
import { extrairPaginaGenerica, extrairRelatorio } from './relatorio';
import { extrairTurma } from './turma';

export function detectarPagina(url: URL, doc: Document): Pagina {
  if (doc.getElementById('sigaa-offline')) {
    const erro = extrairErro(url, doc);
    if (erro) return { tipo: 'erro', erro };
  }
  if (url.pathname.startsWith('/cxpostal/')) {
    const compositor = extrairCompositor(doc);
    if (compositor) return { tipo: 'compor-mensagem', compositor };
    const mensagem = extrairMensagem(doc);
    if (mensagem) return { tipo: 'mensagem', mensagem };
    const caixa = extrairCaixaPostal(doc);
    return caixa ? { tipo: 'caixa-postal', caixa } : { tipo: 'desconhecida' };
  }

  const login = extrairLogin(doc);
  if (login) return { tipo: 'login', login };

  const relatorio = extrairRelatorio(doc);
  if (relatorio) return { tipo: 'relatorio', relatorio };

  const turma = extrairTurma(doc);
  if (turma) return { tipo: 'turma', turma };

  // Outras telas também ficam em /portais/discente/ (ex.: turmas anteriores); o portal se reconhece pelos seus blocos.
  if (url.pathname.includes('/portais/discente/') && doc.querySelector('#agenda-docente, #avaliacao-portal, #turmas-portal')) {
    return { tipo: 'portal-discente', portal: extrairPortal(doc) };
  }

  const erro = extrairErro(url, doc);
  if (erro) return { tipo: 'erro', erro };

  const generica = extrairPaginaGenerica(doc);
  if (generica) return { tipo: 'relatorio', relatorio: generica };

  return { tipo: 'desconhecida' };
}
