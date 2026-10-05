package br.sigaa.v2;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;

/**
 * Atualização da interface sem APK: baixa o sigaa.js publicado nas Releases, confere a assinatura
 * e passa a usá-lo na próxima abertura. Se falhar duas aberturas seguidas, volta ao embutido.
 */
final class Ota {

    // Chave pública do par cuja privada só existe no segredo OTA_CHAVE_PRIVADA do GitHub.
    private static final String CHAVE_PUBLICA =
            "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEHoY1AtoVRhEyTvuI86Z8vCQKVBlD4u4ZyWNk5G0087nTBdO14pnJnC0OJvVFBJ4XXKUpfvkJrCQ4wLFT3ejWwg==";
    private static final long INTERVALO_MS = 4L * 60 * 60 * 1000;
    private static final int FALHAS_MAX = 2;

    private Ota() {}

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences("ota", Context.MODE_PRIVATE);
    }

    private static File pasta(Context ctx) {
        return new File(ctx.getFilesDir(), "ota");
    }

    /** Script a injetar: o baixado, se for mais novo e saudável; senão o que veio no APK. */
    static String script(Context ctx, String embutido) {
        SharedPreferences p = prefs(ctx);
        String versao = p.getString("versao", null);
        File arquivo = new File(pasta(ctx), "sigaa.js");
        if (versao == null || !arquivo.exists()
                || Atualizador.comparar(versao, BuildConfig.VERSION_NAME) <= 0
                || p.getInt("minNativo", Integer.MAX_VALUE) > BuildConfig.VERSION_CODE) {
            return embutido;
        }
        int falhas = p.getInt("falhas", 0);
        if (falhas >= FALHAS_MAX) {
            descartar(ctx);
            return embutido;
        }
        try {
            String js = new String(Files.readAllBytes(arquivo.toPath()), StandardCharsets.UTF_8);
            // Conta como falha até a interface avisar que montou (confirmar()).
            p.edit().putInt("falhas", falhas + 1).apply();
            return js;
        } catch (Exception e) {
            descartar(ctx);
            return embutido;
        }
    }

    /** A interface baixada montou: zera o contador de falhas. */
    static void confirmar(Context ctx) {
        prefs(ctx).edit().putInt("falhas", 0).apply();
    }

    private static void descartar(Context ctx) {
        new File(pasta(ctx), "sigaa.js").delete();
        prefs(ctx).edit().remove("versao").remove("minNativo").putInt("falhas", 0).apply();
    }

    /** Procura em segundo plano, no máximo a cada 4 h, e guarda para a próxima abertura. */
    static void buscar(Context ctx) {
        SharedPreferences p = prefs(ctx);
        long agora = System.currentTimeMillis();
        if (agora - p.getLong("ultimaBusca", 0) < INTERVALO_MS) return;
        p.edit().putLong("ultimaBusca", agora).apply();
        buscarAgora(ctx);
    }

    static void buscarAgora(Context ctx) {
        String repo = BuildConfig.REPO_ATUALIZACAO;
        SharedPreferences p = prefs(ctx);
        if (repo.isEmpty()) return;

        new Thread(() -> {
            try {
                String base = "https://github.com/" + repo + "/releases/latest/download/";
                JSONObject manifesto = new JSONObject(new String(baixar(base + "sigaa-ota.json"), StandardCharsets.UTF_8));
                String versao = manifesto.getString("versao");
                int minNativo = manifesto.getInt("minNativo");
                String atual = p.getString("versao", BuildConfig.VERSION_NAME);
                if (Atualizador.comparar(versao, atual) <= 0 || Atualizador.comparar(versao, BuildConfig.VERSION_NAME) <= 0) return;
                if (minNativo > BuildConfig.VERSION_CODE) return;

                byte[] js = baixar(base + "sigaa-ota.js");
                String sha = hex(MessageDigest.getInstance("SHA-256").digest(js));
                if (!sha.equals(manifesto.getString("sha256"))) return;
                String assinado = versao + "\n" + minNativo + "\n" + sha;
                if (!verificar(assinado, manifesto.getString("assinatura"))) return;

                File dir = pasta(ctx);
                if (!dir.exists() && !dir.mkdirs()) return;
                File temp = new File(dir, "sigaa.js.tmp");
                try (FileOutputStream saida = new FileOutputStream(temp)) {
                    saida.write(js);
                }
                if (!temp.renameTo(new File(dir, "sigaa.js"))) return;
                p.edit().putString("versao", versao).putInt("minNativo", minNativo).putInt("falhas", 0).apply();
            } catch (Exception e) {
                // Sem rede ou release sem pacote: tenta de novo na próxima janela.
            }
        }).start();
    }

    private static boolean verificar(String dados, String assinaturaBase64) throws Exception {
        PublicKey chave = KeyFactory.getInstance("EC")
                .generatePublic(new X509EncodedKeySpec(Base64.decode(CHAVE_PUBLICA, Base64.DEFAULT)));
        Signature s = Signature.getInstance("SHA256withECDSA");
        s.initVerify(chave);
        s.update(dados.getBytes(StandardCharsets.UTF_8));
        return s.verify(Base64.decode(assinaturaBase64, Base64.DEFAULT));
    }

    private static byte[] baixar(String endereco) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(endereco).openConnection();
        c.setConnectTimeout(10_000);
        c.setReadTimeout(20_000);
        c.setInstanceFollowRedirects(true);
        try (InputStream entrada = c.getInputStream(); ByteArrayOutputStream saida = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[16384];
            for (int n; (n = entrada.read(buffer)) > 0; ) saida.write(buffer, 0, n);
            return saida.toByteArray();
        } finally {
            c.disconnect();
        }
    }

    private static String hex(byte[] bytes) {
        StringBuilder s = new StringBuilder();
        for (byte b : bytes) s.append(String.format("%02x", b));
        return s.toString();
    }
}
