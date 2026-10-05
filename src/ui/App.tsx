import { LogCompilacao, Surpresa, useSegredo } from './Surpresas';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { ehSecaoAtual } from '../domain/secao';
import type { ItemMenu, Pagina, PaginaTurma } from '../domain/types';
import { cn } from './cn';
import { abrirBusca, BuscaComandos } from './BuscaComandos';
import { Button } from './components/Button';
import { BarraLateral, GavetaMenu } from './MenuLateral';
import { Icone, ICONES, NavegacaoMovel, type AcaoNavegacao } from './NavegacaoMovel';
import { DadosPessoais, Portal, type AbaPortal } from './Portal';
import { RelatorioUI } from './RelatorioUI';
import { TelaLogin } from './TelaLogin';
import { TelaErro } from './TelaErro';
import { CaixaPostalUI, CompositorUI, MensagemUI } from './CaixaPostalUI';
import { Esqueleto } from './components/Graficos';
import { plataforma } from '../plataforma';
import { BoasVindas, jaViuBoasVindas } from './BoasVindas';
import { TelaConfiguracoes } from './TelaConfiguracoes';
import { useManterSessao } from './sessao';
import { ContextoPreferencias, usePreferencias, ZOOM, type Tema } from './tema';
import { Turma } from './Turma';

interface Props {
  readonly pagina: Exclude<Pagina, { tipo: 'desconhecida' }>;
  readonly onVerOriginal: () => void;
}

// Downloads disparam beforeunload sem trocar de página; libera a tela depois disso.
const DOWNLOAD_MS = 4000;

const NOME_TEMA: Readonly<Record<Tema, string>> = {
  sistema: 'Tema do sistema',
  claro: 'Tema claro',
  escuro: 'Tema escuro',
};

function IconeTema({ tema }: { readonly tema: Tema }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {tema !== 'claro' && <path d={tema === 'escuro' ? 'M8 2a6 6 0 0 0 0 12z' : 'M8 2a6 6 0 0 1 0 12z'} fill="currentColor" />}
    </svg>
  );
}

const ABAS_TURMA: readonly { readonly item: string; readonly rotulo: string; readonly icone: AcaoNavegacao['icone'] }[] = [
  { item: 'Principal', rotulo: 'Aulas', icone: 'turmas' },
  { item: 'Tarefas', rotulo: 'Tarefas', icone: 'atividades' },
  { item: 'Frequência', rotulo: 'Frequência', icone: 'frequencia' },
];

function acoesDaTurma(turma: PaginaTurma): AcaoNavegacao[] {
  const itens = turma.menu.flatMap((secao) => secao.itens);
  const abas = ABAS_TURMA.flatMap((aba) => {
    const item = itens.find((i) => i.rotulo === aba.item);
    return item
      ? [{ id: aba.item, rotulo: aba.rotulo, icone: aba.icone, ativo: ehSecaoAtual(aba.item, turma.secaoAtual), onClick: item.abrir }]
      : [];
  });
  return turma.voltarPortal ? [{ id: 'portal', rotulo: 'Portal', icone: 'voltar', onClick: turma.voltarPortal }, ...abas] : abas;
}

export function App({ pagina, onVerOriginal }: Props) {
  const controlePrefs = usePreferencias();
  const { prefs, alternarTema } = controlePrefs;
  const tema = prefs.tema;
  const [configAberta, setConfigAberta] = useState(false);
  const segredo = useSegredo();

  // Guarda as cores reais do estilo para o anti-flash da próxima página pintar o esqueleto certo.
  useEffect(() => {
    const quadro = requestAnimationFrame(() => {
      const el = raiz.current;
      if (!el) return;
      const css = getComputedStyle(el);
      const cor = (v: string) => `hsl(${css.getPropertyValue(v).trim().replace(/\s+/g, ' ')})`;
      try {
        const salvas = JSON.parse(localStorage.getItem('sigaa-v2:cores') ?? '{}') as Record<string, unknown>;
        const cores = { fundo: cor('--background'), card: cor('--card'), borda: cor('--border'), texto: cor('--foreground'), destaque: cor('--destaque') };
        salvas[css.colorScheme === 'dark' ? 'escuro' : 'claro'] = cores;
        localStorage.setItem('sigaa-v2:cores', JSON.stringify(salvas));
        // O Android desenha a abertura antes de qualquer página: precisa das cores já resolvidas em RGB.
        const rgb = (c: string) => {
          const sonda = document.createElement('i');
          sonda.style.color = c;
          el.append(sonda);
          const valor = getComputedStyle(sonda).color;
          sonda.remove();
          return valor;
        };
        plataforma.coresAbertura?.(JSON.stringify({ fundo: rgb(cores.fundo), texto: rgb(cores.texto), destaque: rgb(cores.destaque), estilo: prefs.estilo }));
      } catch {
        /* sem armazenamento: o anti-flash usa as cores padrão */
      }
    });
    return () => cancelAnimationFrame(quadro);
  }, [prefs]);
  const [boasVindas, setBoasVindas] = useState(() => !jaViuBoasVindas());
  const [navegando, setNavegando] = useState(false);
  const [aba, setAba] = useState<AbaPortal>('inicio');
  const [gavetaAberta, setGavetaAberta] = useState(false);
  useManterSessao(pagina.tipo !== 'login' && pagina.tipo !== 'caixa-postal' && pagina.tipo !== 'mensagem' && pagina.tipo !== 'compor-mensagem');
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.removeItem('sigaa-v2:entrando');
    } catch {
      /* nada a limpar */
    }
  }, []);

  useEffect(() => {
    let espera = 0;
    const sair = () => {
      if (Date.now() - plataforma.ultimoDownload < 1500) return;
      setNavegando(true);
      window.clearTimeout(espera);
      espera = window.setTimeout(() => setNavegando(false), DOWNLOAD_MS);
    };
    const voltar = (e: PageTransitionEvent) => e.persisted && setNavegando(false);
    window.addEventListener('beforeunload', sair);
    window.addEventListener('pageshow', voltar);
    return () => {
      window.clearTimeout(espera);
      window.removeEventListener('beforeunload', sair);
      window.removeEventListener('pageshow', voltar);
    };
  }, []);

  useEffect(() => {
    const pai = window.parent as Window & { __sigaaVoltar?: () => boolean };
    pai.__sigaaVoltar = () => {
      if (configAberta) {
        setConfigAberta(false);
        return true;
      }
      return false;
    };
    return () => {
      delete pai.__sigaaVoltar;
    };
  }, [configAberta]);

  const trocarTema = (e: MouseEvent<HTMLButtonElement>) => {
    const aplicar = () => {
      raiz.current?.classList.add('trocando-tema');
      flushSync(alternarTema);
      raiz.current?.classList.remove('trocando-tema');
    };
    const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || semMovimento) return aplicar();

    const { clientX: x, clientY: y } = e;
    const raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const html = document.documentElement.style;
    html.setProperty('--sigaa-x', `${x}px`);
    html.setProperty('--sigaa-y', `${y}px`);
    html.setProperty('--sigaa-r', `${raio}px`);
    document.startViewTransition(aplicar);
  };

  const menu = pagina.tipo === 'portal-discente' ? pagina.portal.menu : [];
  const menuMovel: readonly ItemMenu[] =
    pagina.tipo === 'portal-discente'
      ? menu
      : pagina.tipo === 'turma'
        ? pagina.turma.menu.map((secao) => ({
            rotulo: secao.titulo,
            separador: false,
            abrir: null,
            filhos: secao.itens.map((i) => ({ rotulo: i.rotulo, separador: false, abrir: i.abrir, filhos: [] })),
          }))
        : [];
  const irParaAba = (nova: AbaPortal) => {
    if (nova === aba) {
      raiz.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setAba(nova);
    raiz.current?.scrollTo({ top: 0 });
  };

  const acoes: readonly AcaoNavegacao[] =
    pagina.tipo === 'portal-discente'
      ? [
          { id: 'inicio', rotulo: 'Início', icone: 'inicio', ativo: aba === 'inicio', onClick: () => irParaAba('inicio') },
          { id: 'turmas', rotulo: 'Turmas', icone: 'turmas', ativo: aba === 'turmas', onClick: () => irParaAba('turmas') },
          { id: 'atividades', rotulo: 'Atividades', icone: 'atividades', ativo: aba === 'atividades', onClick: () => irParaAba('atividades') },
        ]
      : pagina.tipo === 'turma'
        ? acoesDaTurma(pagina.turma)
        : pagina.tipo === 'caixa-postal' && pagina.caixa.voltarSigaa
          ? [{ id: 'voltar', rotulo: 'SIGAA', icone: 'voltar', onClick: pagina.caixa.voltarSigaa }]
          : pagina.tipo === 'mensagem' && pagina.mensagem.voltar
            ? [{ id: 'voltar', rotulo: 'Mensagens', icone: 'voltar', onClick: pagina.mensagem.voltar }]
        : pagina.tipo === 'relatorio' && pagina.relatorio.voltar
          ? [{ id: 'voltar', rotulo: 'Voltar', icone: 'voltar', onClick: pagina.relatorio.voltar }]
          : [];

  return (
    <ContextoPreferencias.Provider value={controlePrefs}>
    <div
      ref={raiz}
      className={cn(
        'tema fixed inset-0 overflow-auto font-sans text-foreground antialiased',
        !prefs.pontos && 'sem-pontos',
        !prefs.animacoes && 'sem-animacao',
      )}
      data-tema={tema === 'sistema' ? undefined : tema}
      data-acento={prefs.acento}
      data-estilo={prefs.estilo}
      style={prefs.escala === 'normal' ? undefined : { zoom: ZOOM[prefs.escala] }}
      aria-busy={navegando}
    >
      <div
        aria-hidden="true"
        className={cn(
          'carregando fixed inset-x-0 top-0 z-50 h-1 animate-marchar transition-opacity duration-150',
          navegando ? 'opacity-100' : 'opacity-0',
        )}
      />
      <header className="sticky top-0 z-10 border-b bg-background/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-1">
          {menuMovel.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGavetaAberta(true)}
              aria-label={pagina.tipo === 'turma' ? 'Abrir menu da turma' : 'Abrir menu do SIGAA'}
              aria-expanded={gavetaAberta}
              className="-ml-2 w-10 px-0 lg:hidden"
            >
              <Icone d={ICONES.menu} />
            </Button>
          )}
          <span className="flex select-none items-center gap-2" aria-label="Sigaa" onClick={segredo.tocarLogo}>
            <span className="font-dot text-2xl font-extrabold leading-none" aria-hidden="true">
              sigaa
            </span>
            <span className="h-2 w-2 rounded-full bg-destaque" aria-hidden="true" />
          </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {menu.length > 0 && <BuscaComandos itens={menu} />}
            {menu.length > 0 && (
              <Button variant="ghost" size="sm" onClick={abrirBusca} aria-label="Buscar no SIGAA" className="w-10 px-0 md:hidden">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path d={ICONES.buscar} strokeLinecap="round" />
                </svg>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={trocarTema}
              aria-label={`${NOME_TEMA[tema]}. Trocar tema`}
              title={NOME_TEMA[tema]}
              className="w-10 px-0 md:w-8"
            >
              <IconeTema tema={tema} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfigAberta(true)}
              aria-label="Configurações"
              title="Configurações"
              className="w-10 px-0 md:w-8"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-4 md:w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                </svg>
            </Button>
            <Button variant="outline" size="sm" onClick={onVerOriginal} className={pagina.tipo === 'login' ? '' : 'hidden md:inline-flex'}>
              Ver original
            </Button>
          </div>
        </div>
      </header>
      <div className="flex">
      {menu.length > 0 && <BarraLateral titulo="Menu do SIGAA" itens={menu} />}
      <div
        className={cn(
          'min-w-0 flex-1 animate-entrar transition-[opacity,filter] duration-200',
          pagina.tipo !== 'login' && 'pb-24 md:pb-0',
        )}
      >
        {navegando && pagina.tipo !== 'login' && (
          <div className="mx-auto max-w-3xl animate-entrar px-4 py-6 sm:px-6 sm:py-10" role="status" aria-label="Carregando">
            {prefs.estilo === 'terminal' ? <LogCompilacao /> : <Esqueleto />}
          </div>
        )}
        <div className={cn(navegando && pagina.tipo !== 'login' && 'hidden')}>
        {pagina.tipo === 'login' && <TelaLogin login={pagina.login} />}
        {pagina.tipo === 'portal-discente' && (
          <div key={aba} className="animate-entrar">
            <Portal portal={pagina.portal} aba={aba} onAba={irParaAba} />
          </div>
        )}
        {pagina.tipo === 'turma' && <Turma turma={pagina.turma} />}
        {pagina.tipo === 'relatorio' && <RelatorioUI relatorio={pagina.relatorio} />}
        {pagina.tipo === 'erro' && <TelaErro erro={pagina.erro} />}
        {pagina.tipo === 'caixa-postal' && <CaixaPostalUI caixa={pagina.caixa} />}
        {pagina.tipo === 'mensagem' && <MensagemUI mensagem={pagina.mensagem} />}
        {pagina.tipo === 'compor-mensagem' && <CompositorUI compositor={pagina.compositor} />}
        </div>
      </div>
      </div>
      {configAberta && (
        <TelaConfiguracoes
          pagina={pagina}
          onFechar={() => setConfigAberta(false)}
          onVerOriginal={onVerOriginal}
          onRever={() => {
            setConfigAberta(false);
            setBoasVindas(true);
          }}
        />
      )}
      {boasVindas && <BoasVindas onFim={() => setBoasVindas(false)} />}
      {segredo.ativo && <Surpresa onFechar={segredo.fechar} />}
      <GavetaMenu
        titulo={pagina.tipo === 'turma' ? 'Menu da turma' : 'Menu do SIGAA'}
        itens={menuMovel}
        aberta={gavetaAberta}
        onFechar={() => setGavetaAberta(false)}
        onVerOriginal={onVerOriginal}
      />
      {pagina.tipo !== 'login' && (
        <NavegacaoMovel
          acoes={acoes}
          conteudoMais={
            <>
              <button
                type="button"
                onClick={() => setConfigAberta(true)}
                className="flex min-h-12 w-full items-center justify-between rounded-3xl border px-5 text-sm font-medium"
              >
                Configurações e sobre
                <svg viewBox="0 0 16 16" className="h-4 w-4 opacity-50" aria-hidden="true">
                  <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              {pagina.tipo === 'portal-discente' && <DadosPessoais portal={pagina.portal} />}
              <button type="button" onClick={onVerOriginal} className="min-h-12 w-full rounded-full border text-sm">
                Ver SIGAA original
              </button>
            </>
          }
        />
      )}
    </div>
    </ContextoPreferencias.Provider>
  );
}
