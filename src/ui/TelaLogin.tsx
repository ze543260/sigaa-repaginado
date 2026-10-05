import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { CamposLogin } from '../domain/types';
import { plataforma } from '../plataforma';
import { Button } from './components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/Card';
import { Input } from './components/Input';
import { Label } from './components/Label';
import { CarregadorPontos } from './components/Graficos';

export const CHAVE_ENTRANDO = 'sigaa-v2:entrando';

/** Avisa a próxima página (anti-flash) que ela é a continuação de um login em andamento. */
function marcarEntrando(): void {
  try {
    sessionStorage.setItem(CHAVE_ENTRANDO, String(Date.now()));
  } catch {
    /* sem armazenamento: só perde o carregador entre páginas */
  }
}

interface Props {
  readonly login: CamposLogin;
}

const CHAVE_TENTATIVA = 'sigaa-v2:login-automatico';
const INTERVALO_MIN_MS = 90_000;
const ESPERA_BIOMETRIA_MS = 500;

// Evita laço: se a última tentativa automática foi há pouco, ela provavelmente falhou.
function podeTentarSozinho(): boolean {
  try {
    const ultima = Number(sessionStorage.getItem(CHAVE_TENTATIVA) ?? 0);
    return Date.now() - ultima > INTERVALO_MIN_MS;
  } catch {
    return false;
  }
}

function marcarTentativa(): void {
  try {
    sessionStorage.setItem(CHAVE_TENTATIVA, String(Date.now()));
  } catch {
    /* sem armazenamento: o login automático só não se protege contra repetição */
  }
}

export function TelaLogin({ login }: Props) {
  const cofre = plataforma.login;
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [salvo, setSalvo] = useState(cofre?.salvo ?? false);
  const [falha, setFalha] = useState<string | null>(null);
  const tentou = useRef(false);

  const entrarComDigital = () => {
    if (!cofre) return;
    marcarTentativa();
    setFalha(null);
    cofre.entrar();
  };

  useEffect(() => {
    if (!cofre) return;
    const pai = window.parent;
    const aoEntrar = () => {
      marcarEntrando();
      setEnviando(true);
    };
    pai.addEventListener('sigaa:entrando', aoEntrar);
    const parar = cofre.aoFalhar((mensagem) => {
      setEnviando(false);
      setFalha(mensagem || null);
      if (/digitais|Nenhum login/.test(mensagem)) setSalvo(false);
    });
    // Espera o app estar visível e assentado; um pedido de biometria disparado durante a abertura é cancelado.
    let espera = 0;
    const tentar = () => {
      if (document.visibilityState !== 'visible' || tentou.current) return;
      tentou.current = true;
      espera = window.setTimeout(entrarComDigital, ESPERA_BIOMETRIA_MS);
    };
    if (cofre.salvo && login.mensagens.length === 0 && podeTentarSozinho()) {
      tentar();
      document.addEventListener('visibilitychange', tentar);
    }
    return () => {
      pai.removeEventListener('sigaa:entrando', aoEntrar);
      parar();
      window.clearTimeout(espera);
      document.removeEventListener('visibilitychange', tentar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrar = (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    marcarEntrando();
    if (lembrar && cofre) cofre.salvar(usuario, senha);
    login.preencherEEntrar(usuario, senha);
  };

  const esquecer = () => {
    cofre?.esquecer();
    setSalvo(false);
  };

  if (enviando) {
    return (
      <div className="fixed inset-0 z-40 grid animate-entrar place-items-center bg-background" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-6 text-center">
          <CarregadorPontos className="h-20 w-20" />
          <div className="space-y-1">
            <p className="font-dot text-4xl font-extrabold">entrando</p>
            <p className="text-sm text-muted-foreground">Conectando ao SIGAA…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100%-4rem)] place-items-center p-4">
      <Card className="w-full max-w-sm p-2">
        <CardHeader>
          <CardTitle className="font-dot text-5xl font-extrabold">entrar</CardTitle>
          <CardDescription>Use seu usuário institucional.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(login.mensagens.length > 0 || falha) && (
            <div role="alert" className="rounded-2xl border border-destaque/50 px-4 py-3 text-sm">
              {[...login.mensagens, ...(falha ? [falha] : [])].map((m) => (
                <p key={m}>{m}</p>
              ))}
            </div>
          )}

          {cofre?.disponivel && salvo && (
            <div className="space-y-2">
              <Button type="button" variant="destaque" size="lg" className="w-full" onClick={entrarComDigital}>
                Entrar com digital
              </Button>
              <button
                type="button"
                onClick={esquecer}
                className="w-full py-2 text-center text-xs text-muted-foreground underline underline-offset-4"
              >
                Esquecer login salvo
              </button>
              <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                ou digite
                <span className="h-px flex-1 bg-border" />
              </div>
            </div>
          )}

          <form onSubmit={entrar} className="grid gap-4">
            <Label>
              Usuário
              <Input
                autoFocus={!salvo}
                required
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </Label>
            <Label>
              <span className="flex items-center justify-between">
                Senha
                {login.linkRecuperarSenha && (
                  <a
                    href={login.linkRecuperarSenha}
                    target="_top"
                    className="text-xs font-normal text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Esqueceu?
                  </a>
                )}
              </span>
              <Input
                required
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </Label>
            {cofre?.disponivel && (
              <label className="flex min-h-11 cursor-pointer items-center gap-3 px-1 text-sm">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="h-5 w-5 accent-[hsl(var(--destaque))]"
                />
                {salvo ? 'Atualizar login salvo com digital' : 'Lembrar login com digital'}
              </label>
            )}
            <Button
              type="submit"
              variant={salvo ? 'outline' : 'destaque'}
              size="lg"
              className="mt-2 w-full"
              disabled={enviando}
            >
              {enviando ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
