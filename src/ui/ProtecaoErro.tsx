import { Component, type ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
  readonly aoFalhar: (erro: unknown) => void;
}

/** Se a interface quebrar ao renderizar, devolve o SIGAA original em vez de deixar a tela vazia. */
export class ProtecaoErro extends Component<Props, { readonly falhou: boolean }> {
  override state = { falhou: false };

  static getDerivedStateFromError(): { falhou: boolean } {
    return { falhou: true };
  }

  override componentDidCatch(erro: unknown): void {
    this.props.aoFalhar(erro);
  }

  override render(): ReactNode {
    return this.state.falhou ? null : this.props.children;
  }
}
