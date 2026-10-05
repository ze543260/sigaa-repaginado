export interface PonteAndroid {
  salvar(nome: string, mime: string, base64: string): void;
  tema(escuro: boolean): void;
  loginInfo(): string;
  salvarLogin(usuario: string, senha: string): void;
  entrarComLoginSalvo(): void;
  esquecerLogin(): void;
  agendarLembretes(json: string): void;
  notificar(titulo: string, texto: string): void;
  bloqueioAtivo(): boolean;
  definirBloqueio(ligado: boolean): void;
  verificarAtualizacao(): void;
  pronto(): void;
  coresAbertura(json: string): void;
}

/** Exposta pelo bootstrap em window.__sigaaV2 para a interface que roda no iframe. */
export interface PonteInterface {
  readonly android: PonteAndroid | null;
  readonly prepararDownload: () => void;
  readonly reconhecida: () => void;
  readonly mostrarOriginal: () => void;
}
