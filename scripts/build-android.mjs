import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const destino = join(raiz, 'android/app/src/main/assets');
const cssTemp = join(raiz, '.output/android.css');

mkdirSync(destino, { recursive: true });
mkdirSync(join(raiz, '.output'), { recursive: true });

execFileSync(
  process.execPath,
  [join(raiz, 'node_modules/tailwindcss/lib/cli.js'), '-i', 'src/entrypoints/content/style.css', '-o', cssTemp, '--minify'],
  { cwd: raiz, stdio: 'inherit' },
);

// As fontes vão no APK e o app as serve sob demanda (MainActivity.FONTES): embutidas em base64 eram
// ~930 kB de script compilado a cada página, para usar 3 ou 4 fontes de 36.
const pastaFontes = join(raiz, 'src/public/fonts');
const destinoFontes = join(destino, 'fonts');
mkdirSync(destinoFontes, { recursive: true });
const fontes = Object.fromEntries(
  readdirSync(pastaFontes).map((arquivo) => {
    copyFileSync(join(pastaFontes, arquivo), join(destinoFontes, arquivo));
    return [arquivo, `https://sigaa.unifei.edu.br/__sigaa-v2/fonts/${arquivo}`];
  }),
);

const comum = { bundle: true, minify: true, format: 'iife', target: 'chrome100', jsx: 'automatic', write: false };

const interfaceApp = await build({
  ...comum,
  entryPoints: [join(raiz, 'src/app/injetar.tsx')],
  define: {
    'process.env.NODE_ENV': '"production"',
    __CSS__: JSON.stringify(readFileSync(cssTemp, 'utf8')),
    __FONTES__: JSON.stringify(fontes),
  },
});

const resultado = await build({
  ...comum,
  entryPoints: [join(raiz, 'src/app/bootstrap.ts')],
  define: { __APP__: JSON.stringify(interfaceApp.outputFiles[0].text) },
});

const js = resultado.outputFiles[0].text;
writeFileSync(join(destino, 'sigaa.js'), js);
console.log(`android/app/src/main/assets/sigaa.js — ${(js.length / 1024).toFixed(0)} kB`);
