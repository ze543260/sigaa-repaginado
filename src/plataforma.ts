// Pontos de extensão que mudam entre a extensão do navegador e o app Android.
export interface LoginSalvo {
  readonly disponivel: boolean;
  readonly salvo: boolean;
  readonly entrar: () => void;
  readonly salvar: (usuario: string, senha: string) => void;
  readonly esquecer: () => void;
  readonly aoFalhar: (callback: (mensagem: string) => void) => () => void;
}

export interface Lembrete {
  readonly id: string;
  readonly titulo: string;
  readonly texto: string;
  /** Epoch em ms. */
  readonly quando: number;
  /** Só em aulas: alimenta o widget de próxima aula. */
  readonly aula?: { readonly nome: string; readonly local: string; readonly inicio: number; readonly fim: number };
}

export interface Plataforma {
  /** Origem do SIGAA; no app a interface roda num iframe about:blank e não pode usar location. */
  origem: string;
  prepararDownload: () => void;
  /** Momento do último clique em arquivo: o beforeunload seguinte é download, não navegação. */
  ultimoDownload: number;
  login: LoginSalvo | null;
  salvarArquivo: (nome: string, mime: string, texto: string) => void;
  /** null quando a plataforma não sabe notificar. */
  agendarLembretes: ((lembretes: readonly Lembrete[]) => void) | null;
  notificar: ((titulo: string, texto: string) => void) | null;
  /** Bloqueio do app com biometria ao voltar de segundo plano; null fora do Android. */
  bloqueio: { readonly ativo: () => boolean; readonly definir: (ligado: boolean) => void } | null;
  /** Procura versão nova do app; null fora do Android. */
  verificarAtualizacao: (() => void) | null;
}

export const plataforma: Plataforma = {
  origem: typeof location === 'undefined' ? '' : location.origin,
  prepararDownload: () => {},
  ultimoDownload: 0,
  login: null,
  salvarArquivo: (nome, mime, texto) => {
    const url = URL.createObjectURL(new Blob([texto], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
  agendarLembretes: null,
  notificar: null,
  bloqueio: null,
  verificarAtualizacao: null,
};
