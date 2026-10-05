// Gera o pacote de atualização da interface (sigaa-ota.js) e o manifesto assinado (sigaa-ota.json).
import { createHash, createPrivateKey, sign } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const chave = process.env.OTA_CHAVE_PRIVADA;
if (!chave) throw new Error('OTA_CHAVE_PRIVADA ausente');

const js = readFileSync('android/app/src/main/assets/sigaa.js');
const { version: versao } = JSON.parse(readFileSync('package.json', 'utf8'));
const { minNativo } = JSON.parse(readFileSync('ota.json', 'utf8'));
const sha256 = createHash('sha256').update(js).digest('hex');

// O app verifica exatamente estas três linhas; mudar o formato exige APK novo.
const assinado = `${versao}\n${minNativo}\n${sha256}`;
const assinatura = sign('sha256', Buffer.from(assinado), createPrivateKey(chave)).toString('base64');

mkdirSync('.output', { recursive: true });
copyFileSync('android/app/src/main/assets/sigaa.js', '.output/sigaa-ota.js');
writeFileSync('.output/sigaa-ota.json', JSON.stringify({ versao, minNativo, sha256, assinatura }, null, 2));
console.log(`OTA ${versao} (nativo ≥ ${minNativo}) ${sha256.slice(0, 12)}`);
