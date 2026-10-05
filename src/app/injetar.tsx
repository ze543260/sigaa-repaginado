// Roda dentro do iframe criado pelo bootstrap, num realm limpo; lê o SIGAA pelo documento pai.
import ReactDOM from 'react-dom/client';
import { detectarPagina } from '../adapters/detectar-pagina';
import { injetarEstiloDocumento, type ArquivoFonte } from '../entrypoints/content/estilo-documento';
import { plataforma, type LoginSalvo } from '../plataforma';
import { App } from '../ui/App';
import { ProtecaoErro } from '../ui/ProtecaoErro';
import type { PonteAndroid, PonteInterface } from './ponte';

declare const __CSS__: string;
declare const __FONTES__: Readonly<Record<ArquivoFonte, string>>;

function sincronizarTema(ponte: PonteAndroid): void {
  const escuroSistema = matchMedia('(prefers-color-scheme: dark)');
  const avisar = () => {
    const tema = document.querySelector<HTMLElement>('.tema')?.dataset.tema;
    ponte.tema(tema ? tema === 'escuro' : escuroSistema.matches);
  };
  new MutationObserver(avisar).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-tema'] });
  escuroSistema.addEventListener('change', avisar);
  avisar();
}

function loginSalvo(android: PonteAndroid, pai: Window): LoginSalvo {
  let info = { disponivel: false, salvo: false };
  try {
    info = { ...info, ...(JSON.parse(android.loginInfo()) as Partial<typeof info>) };
  } catch {
    /* sem biometria: o recurso fica indisponível */
  }
  return {
    ...info,
    entrar: () => android.entrarComLoginSalvo(),
    salvar: (usuario, senha) => android.salvarLogin(usuario, senha),
    esquecer: () => android.esquecerLogin(),
    aoFalhar: (callback) => {
      const ouvir = (e: Event) => callback(String((e as CustomEvent<string>).detail ?? ''));
      pai.addEventListener('sigaa:login-falhou', ouvir);
      return () => pai.removeEventListener('sigaa:login-falhou', ouvir);
    },
  };
}

// Em blocos: espalhar milhares de bytes em String.fromCharCode estoura a pilha.
function base64(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
}

const PRAZO_MONTAGEM_MS = 8000;

function iniciar(): void {
  const pai = window.parent as Window & { __sigaaV2?: PonteInterface };
  const ponte = pai.__sigaaV2;
  if (!ponte) return;

  let montou = false;
  const desistir = (erro?: unknown) => {
    if (erro) console.error('[sigaa] interface falhou', erro);
    if (!montou) ponte.mostrarOriginal();
  };
  // Rede de segurança: se a interface não montar a tempo, o SIGAA original volta a aparecer.
  const vigia = window.setTimeout(() => desistir(new Error('montagem demorou demais')), PRAZO_MONTAGEM_MS);

  let pagina;
  try {
    pagina = detectarPagina(new URL(pai.location.href), pai.document);
  } catch (erro) {
    window.clearTimeout(vigia);
    desistir(erro);
    return;
  }
  if (pagina.tipo === 'desconhecida') {
    window.clearTimeout(vigia);
    ponte.mostrarOriginal();
    return;
  }
  ponte.reconhecida();
  plataforma.origem = pai.location.origin;
  plataforma.prepararDownload = ponte.prepararDownload;
  const android = ponte.android;
  if (android) {
    plataforma.login = loginSalvo(android, pai);
    plataforma.salvarArquivo = (nome, mime, texto) => android.salvar(nome, mime, base64(texto));
    plataforma.agendarLembretes = (lembretes) => android.agendarLembretes(JSON.stringify(lembretes));
    plataforma.notificar = (titulo, texto) => android.notificar(titulo, texto);
    plataforma.bloqueio = { ativo: () => android.bloqueioAtivo(), definir: (ligado) => android.definirBloqueio(ligado) };
    plataforma.verificarAtualizacao = () => android.verificarAtualizacao();
    plataforma.coresAbertura = (json) => android.coresAbertura?.(json);
    plataforma.infoApp = () => {
      try {
        return android.infoApp ? JSON.parse(android.infoApp()) : null;
      } catch {
        return null;
      }
    };
  }

  const estilo = document.createElement('style');
  estilo.textContent = __CSS__;
  document.head.append(estilo);
  injetarEstiloDocumento((arquivo) => __FONTES__[arquivo]);

  const container = document.createElement('div');
  document.body.append(container);
  const montada = () => {
    if (montou) return;
    montou = true;
    window.clearTimeout(vigia);
    // Dois quadros: o primeiro pinta a interface, o segundo garante que ela já está na tela antes da abertura sair.
    requestAnimationFrame(() => requestAnimationFrame(() => ponte.android?.pronto?.()));
  };
  const falhou = (erro: unknown) => {
    window.clearTimeout(vigia);
    montou = false;
    desistir(erro);
  };
  ReactDOM.createRoot(container).render(
    <ProtecaoErro aoFalhar={falhou}>
      <App pagina={pagina} onVerOriginal={ponte.mostrarOriginal} aoMontar={montada} />
    </ProtecaoErro>,
  );

  if (ponte.android) sincronizarTema(ponte.android);
}

iniciar();
