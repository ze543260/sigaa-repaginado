// Roda no documento do SIGAA (document_start). A interface roda num iframe próprio porque o
// SIGAA carrega Prototype.js, que reescreve Array.prototype.reduce, Array.from etc. no realm da página.
import { domPronto, ocultarOriginal } from '../entrypoints/content/anti-flash';
import type { PonteAndroid, PonteInterface } from './ponte';

declare const __APP__: string;

declare global {
  interface Window {
    AndroidSigaa?: PonteAndroid;
    __sigaaV2?: PonteInterface;
    __sigaaPreencherLogin?: (usuario: string, senha: string) => void;
  }
}

// Chamado pelo app nativo após a biometria; as credenciais não passam pela interface do iframe.
function receberLoginNativo(): void {
  window.__sigaaPreencherLogin = (usuario, senha) => {
    const campoUsuario = document.querySelector<HTMLInputElement>('input[name="user.login"]');
    const campoSenha = document.querySelector<HTMLInputElement>('input[name="user.senha"]');
    if (!campoUsuario?.form || !campoSenha) return;
    window.dispatchEvent(new Event('sigaa:entrando'));
    campoUsuario.value = usuario;
    campoSenha.value = senha;
    campoUsuario.form.requestSubmit();
  };
}

const ID_QUADRO = 'sigaa-v2';

function nomeDoArquivo(disposicao: string): string {
  const utf8 = disposicao.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) return decodeURIComponent(utf8);
  return disposicao.match(/filename="?([^";]+)"?/i)?.[1]?.trim() || 'arquivo';
}

function lerBase64(blob: Blob): Promise<string> {
  return new Promise((ok, erro) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(String(leitor.result).split(',')[1] ?? '');
    leitor.onerror = () => erro(leitor.error);
    leitor.readAsDataURL(blob);
  });
}

// O WebView não baixa respostas de POST; o envio marcado vira fetch e o arquivo vai para o app nativo.
function interceptarDownloads(ponte: PonteAndroid, estado: { baixar: boolean }): void {
  const enviarOriginal = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function (this: HTMLFormElement) {
    if (!estado.baixar) return enviarOriginal.call(this);
    estado.baixar = false;
    const form = this;
    const corpo = new URLSearchParams();
    for (const [chave, valor] of new FormData(form)) corpo.append(chave, String(valor));

    fetch(form.action, { method: 'POST', body: corpo, credentials: 'include' })
      .then(async (resposta) => {
        const disposicao = resposta.headers.get('content-disposition') ?? '';
        if (!/attachment|filename/i.test(disposicao)) return enviarOriginal.call(form);
        const blob = await resposta.blob();
        ponte.salvar(nomeDoArquivo(disposicao), blob.type || 'application/octet-stream', await lerBase64(blob));
      })
      .catch(() => enviarOriginal.call(form));
  };
}

// O SIGAA escondido tem tabelas de ~980px; sem isso o WebView reduz o zoom para caber a página inteira.
function ajustarViewport(): () => void {
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover';
  const travar = document.createElement('style');
  travar.textContent = 'html, body { overflow: hidden !important; max-width: 100vw !important; }';
  (document.head ?? document.documentElement).prepend(meta, travar);
  return () => {
    meta.remove();
    travar.remove();
  };
}

async function iniciar(): Promise<void> {
  if (window.__sigaaV2 || window.top !== window || !/^\/(sigaa|cxpostal)\//.test(location.pathname)) return;

  const mostrarOriginal = ocultarOriginal(`iframe#${ID_QUADRO}`);
  const estado = { baixar: false };
  const ponteAndroid = window.AndroidSigaa ?? null;
  if (ponteAndroid) {
    interceptarDownloads(ponteAndroid, estado);
    receberLoginNativo();
  }

  await domPronto();

  const quadro = document.createElement('iframe');
  quadro.id = ID_QUADRO;
  quadro.title = 'Sigaa';
  quadro.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483647;background:transparent;';

  let liberarViewport = () => {};
  window.__sigaaV2 = {
    android: ponteAndroid,
    prepararDownload: () => {
      estado.baixar = true;
    },
    reconhecida: () => {
      liberarViewport = ajustarViewport();
    },
    mostrarOriginal: () => {
      quadro.remove();
      liberarViewport();
      mostrarOriginal();
    },
  };

  document.body.append(quadro);
  const doc = quadro.contentDocument;
  if (!doc) {
    window.__sigaaV2.mostrarOriginal();
    return;
  }
  doc.open();
  doc.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head><body></body></html>');
  doc.close();
  const script = doc.createElement('script');
  script.textContent = __APP__;
  doc.head.append(script);
}

void iniciar();
