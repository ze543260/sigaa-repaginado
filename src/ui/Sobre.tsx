import { version } from '../../package.json';
import type { Pagina } from '../domain/types';
import { plataforma } from '../plataforma';
import { linkRelato, linkSugestao } from './relato';

const REPOSITORIO = 'https://github.com/ze543260/sigaa-repaginado';
const AUTOR = 'ze543260';

const Linha = ({ rotulo, valor }: { readonly rotulo: string; readonly valor: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-4 py-2">
    <dt className="text-muted-foreground">{rotulo}</dt>
    <dd className="text-right font-mono">{valor}</dd>
  </div>
);

const Botao = ({ href, children }: { readonly href: string; readonly children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="grid min-h-11 place-items-center rounded-full border px-3 text-center text-sm transition-colors hover:bg-accent">
    {children}
  </a>
);

export function Sobre({ pagina }: { readonly pagina: Pagina }) {
  const android = !!plataforma.agendarLembretes;
  return (
    <section className="space-y-4" aria-label="Sobre o app">
      <div className="flex items-center gap-3">
        <span className="font-dot text-3xl font-extrabold leading-none">sigaa</span>
        <span className="h-2 w-2 rounded-full bg-destaque" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">repaginado</span>
      </div>

      <dl className="divide-y text-sm">
        <Linha rotulo="Versão" valor={version} />
        <Linha rotulo="Plataforma" valor={android ? 'App Android' : 'Extensão'} />
        <Linha rotulo="Desenvolvedor" valor={<a href={`https://github.com/${AUTOR}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">@{AUTOR}</a>} />
        <Linha rotulo="Licença" valor={<a href={`${REPOSITORIO}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="underline underline-offset-4">MIT</a>} />
      </dl>

      <div className="grid grid-cols-2 gap-2">
        {plataforma.verificarAtualizacao && (
          <button
            type="button"
            onClick={plataforma.verificarAtualizacao}
            className="col-span-2 min-h-11 rounded-full bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Procurar atualização
          </button>
        )}
        <Botao href={linkRelato(pagina)}>Relatar problema</Botao>
        <Botao href={linkSugestao}>Sugerir tela</Botao>
        <div className="col-span-2">
          <Botao href={REPOSITORIO}>Código-fonte no GitHub</Botao>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl bg-secondary/60 p-4 text-xs leading-relaxed text-muted-foreground">
        <p>
          © 2026 @{AUTOR}. Projeto pessoal de um aluno, distribuído sob a licença MIT, sem garantia de qualquer tipo.
        </p>
        <p>
          <strong className="font-medium text-foreground">Não é oficial.</strong> Não tem vínculo com a UNIFEI, com a DTI nem com a
          UFRN, que desenvolve o SIGAA. Os nomes SIGAA e UNIFEI pertencem aos seus donos e aparecem aqui só para dizer com o que o app funciona.
        </p>
        <p>Seus dados não saem do aparelho: o app só conversa com o próprio SIGAA, sem servidor intermediário.</p>
      </div>
    </section>
  );
}
