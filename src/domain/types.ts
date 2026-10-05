export interface Turma {
  readonly codigo: string;
  readonly nome: string;
  readonly local: string;
  readonly horario: string;
  readonly acessar: () => void;
}

export interface CamposLogin {
  readonly preencherEEntrar: (usuario: string, senha: string) => void;
  readonly linkRecuperarSenha: string | null;
  readonly mensagens: readonly string[];
}

export interface Par {
  readonly rotulo: string;
  readonly valor: string;
  readonly descricao?: string;
}

export interface Atualizacao {
  readonly data: string;
  readonly turma: string;
  readonly descricao: string;
  readonly abrir: (() => void) | null;
}

export interface Atividade {
  readonly data: string;
  readonly turma: string;
  readonly tipo: string;
  readonly descricao: string;
  readonly status: 'semana' | 'mes' | 'passada' | 'futura';
  readonly abrir: (() => void) | null;
}

export interface Atalho {
  readonly rotulo: string;
  readonly abrir: () => void;
}

export interface ItemMenu {
  readonly rotulo: string;
  readonly separador: boolean;
  readonly filhos: readonly ItemMenu[];
  readonly abrir: (() => void) | null;
}

export interface PortalDiscente {
  readonly nome: string;
  readonly foto: string | null;
  readonly semestre: string;
  readonly turmas: readonly Turma[];
  readonly dados: readonly Par[];
  readonly indices: readonly Par[];
  readonly integralizacao: readonly Par[];
  readonly percentualIntegralizado: number | null;
  readonly atualizacoes: readonly Atualizacao[];
  readonly atividades: readonly Atividade[];
  readonly atalhos: readonly Atalho[];
  readonly menu: readonly ItemMenu[];
  /** Busca o relatório "Minhas Notas" sem sair da página; null se o menu não tiver a ação. */
  readonly buscarNotas: (() => Promise<readonly Bloco[]>) | null;
}

export interface Material {
  readonly nome: string;
  readonly tipo: 'pdf' | 'zip' | 'tarefa' | 'arquivo';
  readonly descricao: string;
  readonly abrir: (() => void) | null;
}

export interface Topico {
  readonly titulo: string;
  readonly periodo: string;
  readonly paragrafos: readonly string[];
  readonly materiais: readonly Material[];
}

export interface Noticia {
  readonly titulo: string;
  readonly paragrafos: readonly string[];
  readonly autor: string;
}

export interface SecaoMenuTurma {
  readonly titulo: string;
  readonly itens: readonly Atalho[];
}

export interface LinhaTabela {
  readonly celulas: readonly string[];
  readonly nota: string;
  readonly abrir: (() => void) | null;
}

export interface Tabela {
  readonly colunas: readonly string[];
  readonly linhas: readonly LinhaTabela[];
}

export interface Pessoa {
  readonly nome: string;
  readonly foto: string | null;
  readonly detalhes: readonly string[];
}

export type Bloco =
  | { readonly tipo: 'tabela'; readonly titulo: string; readonly tabela: Tabela }
  | { readonly tipo: 'pares'; readonly titulo: string; readonly pares: readonly Par[] }
  | { readonly tipo: 'texto'; readonly titulo: string; readonly paragrafos: readonly string[] }
  | { readonly tipo: 'vazio'; readonly titulo: string; readonly mensagem: string }
  | { readonly tipo: 'pessoas'; readonly titulo: string; readonly pessoas: readonly Pessoa[] }
  | { readonly tipo: 'imagem'; readonly titulo: string; readonly src: string };

export interface Tarefa {
  readonly titulo: string;
  /** "dd/mm/aaaa hh:mm" */
  readonly inicio: string;
  readonly fim: string;
  readonly possuiNota: boolean;
  readonly enviada: boolean;
  readonly corrigida: boolean;
  readonly paragrafos: readonly string[];
  readonly enviar: (() => void) | null;
  readonly visualizar: (() => void) | null;
}

export interface EnvioTarefa {
  readonly titulo: string;
  readonly periodo: string;
  readonly paragrafos: readonly string[];
  readonly textos: readonly { readonly id: string; readonly rotulo: string; readonly obrigatorio: boolean }[];
  readonly arquivos: readonly { readonly id: string; readonly rotulo: string }[];
  readonly enviar: (textos: Readonly<Record<string, string>>, arquivos: Readonly<Record<string, File>>) => void;
  readonly cancelar: (() => void) | null;
}

export type ConteudoTurma =
  | { readonly tipo: 'principal'; readonly noticia: Noticia | null; readonly topicos: readonly Topico[] }
  | { readonly tipo: 'tarefas'; readonly tarefas: readonly Tarefa[] }
  | { readonly tipo: 'enviar-tarefa'; readonly envio: EnvioTarefa }
  | { readonly tipo: 'secao'; readonly blocos: readonly Bloco[] };

export interface PaginaTurma {
  readonly codigo: string;
  readonly nome: string;
  readonly info: string;
  readonly avisos: readonly string[];
  readonly secaoAtual: string;
  readonly conteudo: ConteudoTurma;
  readonly menu: readonly SecaoMenuTurma[];
  readonly voltarPortal: (() => void) | null;
}

export interface Relatorio {
  readonly titulo: string;
  readonly avisos: readonly string[];
  readonly blocos: readonly Bloco[];
  readonly voltar: (() => void) | null;
}

export interface ResumoMensagem {
  readonly assunto: string;
  readonly remetente: string;
  readonly data: string;
  readonly lida: boolean;
  readonly anexo: boolean;
  readonly abrir: (() => void) | null;
}

export interface CaixaPostal {
  readonly pasta: string;
  readonly mensagens: readonly ResumoMensagem[];
  readonly pastas: readonly Atalho[];
  readonly marcarTodasLidas: (() => void) | null;
  readonly escrever: (() => void) | null;
  readonly voltarSigaa: (() => void) | null;
}

export interface LeituraMensagem {
  readonly assunto: string;
  readonly remetente: string;
  readonly unidade: string;
  readonly data: string;
  readonly automatica: boolean;
  readonly paragrafos: readonly string[];
  readonly anexos: readonly Atalho[];
  readonly voltar: (() => void) | null;
  readonly anterior: (() => void) | null;
  readonly proxima: (() => void) | null;
  readonly responder: (() => void) | null;
}

export interface CompositorMensagem {
  readonly destinatarios: readonly string[];
  readonly assunto: string;
  /** Pede sugestões de destinatário ao SIGAA e devolve os nomes encontrados. */
  readonly sugerir: (termo: string) => Promise<readonly string[]>;
  readonly adicionar: (nome: string) => Promise<readonly string[]>;
  readonly enviar: (assunto: string, texto: string) => void;
  readonly cancelar: (() => void) | null;
}

export interface ErroPagina {
  readonly tipo: 'offline' | 'sessao' | 'indisponivel';
  readonly mensagem: string;
  readonly tentar: () => void;
}

export type Pagina =
  | { readonly tipo: 'login'; readonly login: CamposLogin }
  | { readonly tipo: 'portal-discente'; readonly portal: PortalDiscente }
  | { readonly tipo: 'turma'; readonly turma: PaginaTurma }
  | { readonly tipo: 'relatorio'; readonly relatorio: Relatorio }
  | { readonly tipo: 'erro'; readonly erro: ErroPagina }
  | { readonly tipo: 'caixa-postal'; readonly caixa: CaixaPostal }
  | { readonly tipo: 'mensagem'; readonly mensagem: LeituraMensagem }
  | { readonly tipo: 'compor-mensagem'; readonly compositor: CompositorMensagem }
  | { readonly tipo: 'desconhecida' };
