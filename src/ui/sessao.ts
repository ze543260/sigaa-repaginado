import { useEffect } from 'react';
import { plataforma } from '../plataforma';

const INTERVALO_MS = 10 * 60_000;
const OCIOSIDADE_MAX_MS = 2 * 60 * 60_000;
const CAMINHO_RENOVACAO = '/sigaa/portais/discente/discente.jsf';

/**
 * Renova a sessão do SIGAA (que expira após 25 min sem requisições) enquanto houver uso recente.
 * Para após 2 h sem interação: nem a sessão fica aberta indefinidamente num aparelho esquecido,
 * nem os GETs repetidos chegam a descartar o estado JSF da página atual (~20 visões por sessão).
 */
export function useManterSessao(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return;
    let ultimaInteracao = Date.now();
    const registrar = () => {
      ultimaInteracao = Date.now();
    };

    const renovar = () => {
      if (Date.now() - ultimaInteracao > OCIOSIDADE_MAX_MS) return;
      fetch(new URL(CAMINHO_RENOVACAO, plataforma.origem), { credentials: 'include', cache: 'no-store' }).catch(() => {
        /* sem rede: a próxima tentativa cobre */
      });
    };

    const eventos = ['pointerdown', 'keydown', 'scroll'] as const;
    eventos.forEach((e) => window.addEventListener(e, registrar, { passive: true, capture: true }));
    const intervalo = window.setInterval(renovar, INTERVALO_MS);
    return () => {
      window.clearInterval(intervalo);
      eventos.forEach((e) => window.removeEventListener(e, registrar, { capture: true }));
    };
  }, [ativo]);
}
