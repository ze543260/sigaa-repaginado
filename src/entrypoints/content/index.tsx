import ReactDOM from 'react-dom/client';
import { detectarPagina } from '../../adapters/detectar-pagina';
import { App } from '../../ui/App';
import { domPronto, ocultarOriginal } from './anti-flash';
import { injetarEstiloDocumento } from './estilo-documento';
import './style.css';

const HOST = 'sigaa-v2';


export default defineContentScript({
  matches: ['*://sigaa.unifei.edu.br/sigaa/*', '*://sigadmin.unifei.edu.br/cxpostal/*'],
  cssInjectionMode: 'ui',
  runAt: 'document_start',

  async main(ctx) {
    const mostrarOriginal = ocultarOriginal(HOST);
    await domPronto();

    const pagina = detectarPagina(new URL(location.href), document);
    if (pagina.tipo === 'desconhecida') {
      mostrarOriginal();
      return;
    }
    injetarEstiloDocumento((arquivo) => browser.runtime.getURL(`/fonts/${arquivo}`));

    const ui = await createShadowRootUi(ctx, {
      name: HOST,
      position: 'overlay',
      zIndex: 2147483647,
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<App pagina={pagina} onVerOriginal={() => ui.remove()} />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
        mostrarOriginal();
      },
    });

    ui.mount();
  },
});
