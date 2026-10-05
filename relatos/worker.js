// Recebe relatos do app e abre issue no GitHub; o token (GITHUB_TOKEN) só existe como segredo do Worker.
const ORIGENS = ['https://sigaa.unifei.edu.br', 'https://sigadmin.unifei.edu.br'];
const MAX_TEXTO = 4000;

function cors(origem) {
  return {
    'Access-Control-Allow-Origin': ORIGENS.includes(origem) || origem?.startsWith('chrome-extension://') || origem?.startsWith('moz-extension://') ? origem : ORIGENS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

const responder = (corpo, status, origem) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json', ...cors(origem) } });

// Evita que o texto marque pessoas ou feche issues por referência.
const neutro = (s) => String(s ?? '').replace(/@/g, '@​').replace(/#(\d)/g, '#​$1');
const linha = (s, max = 120) => neutro(s).replace(/\s+/g, ' ').trim().slice(0, max);

export default {
  async fetch(req, env) {
    const origem = req.headers.get('Origin');
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origem) });
    if (req.method !== 'POST') return responder({ erro: 'método' }, 405, origem);

    const ip = req.headers.get('CF-Connecting-IP') ?? 'anon';
    const { success } = await env.LIMITE.limit({ key: ip });
    if (!success) return responder({ erro: 'Muitos relatos seguidos. Tente de novo em um minuto.' }, 429, origem);

    let d;
    try {
      d = await req.json();
    } catch {
      return responder({ erro: 'json' }, 400, origem);
    }
    const texto = String(d.texto ?? '').trim();
    if (texto.length < 10 || texto.length > MAX_TEXTO) return responder({ erro: 'Descreva o problema em 10 a 4000 caracteres.' }, 400, origem);

    const erros = (Array.isArray(d.erros) ? d.erros : []).slice(0, 10).map((e) => `- \`${linha(e, 300).replace(/`/g, "'")}\``);
    const corpo = [
      neutro(texto),
      '',
      '---',
      '| | |',
      '|---|---|',
      `| Versão | ${linha(d.versao, 40)} |`,
      `| Interface | ${linha(d.interface, 40)} |`,
      `| Plataforma | ${linha(d.plataforma)} |`,
      `| Tela | ${linha(d.tela, 40)} |`,
      `| Estilo | ${linha(d.estilo, 40)} |`,
      d.contato ? `| Contato | ${linha(d.contato, 80)} |` : '',
      erros.length ? `\n<details><summary>Erros recentes</summary>\n\n${erros.join('\n')}\n</details>` : '',
      '',
      '_Enviado pelo app._',
    ].filter((l) => l !== '').join('\n');

    const titulo = `[app] ${linha(texto, 70)}`;
    const r = await fetch(`https://api.github.com/repos/${env.REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'sigaa-relatos',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: titulo, body: corpo, labels: ['relato-app'] }),
    });
    if (!r.ok) return responder({ erro: 'Não foi possível registrar agora.' }, 502, origem);
    const issue = await r.json();
    return responder({ numero: issue.number, url: issue.html_url }, 201, origem);
  },
};
