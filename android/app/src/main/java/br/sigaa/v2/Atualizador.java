package br.sigaa.v2;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Environment;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** Procura a última versão nas Releases do GitHub e, se for mais nova, baixa e abre o instalador. */
final class Atualizador {

    private final MainActivity atividade;

    Atualizador(MainActivity atividade) {
        this.atividade = atividade;
    }

    static final String EXTRA_INSTALAR = "instalarAtualizacao";
    private static final long INTERVALO_MS = 24L * 60 * 60 * 1000;

    /** Busca automática: no máximo uma vez por dia, e só avisa por notificação. */
    void verificarEmSegundoPlano() {
        android.content.SharedPreferences prefs = atividade.getSharedPreferences("atualizacao", Context.MODE_PRIVATE);
        long agora = System.currentTimeMillis();
        if (agora - prefs.getLong("ultima", 0) < INTERVALO_MS) return;
        prefs.edit().putLong("ultima", agora).apply();
        verificar(false);
    }

    /** {@code manual}: veio do botão; instala na hora e avisa quando não há novidade. */
    void verificar(boolean manual) {
        boolean avisarSemNovidade = manual;
        String repo = BuildConfig.REPO_ATUALIZACAO;
        if (repo.isEmpty()) {
            if (avisarSemNovidade) avisar("Atualização automática ainda não configurada");
            return;
        }
        new Thread(() -> {
            try {
                JSONObject release = new JSONObject(ler("https://api.github.com/repos/" + repo + "/releases/latest"));
                String versao = release.optString("tag_name").replaceFirst("^v", "");
                if (comparar(versao, BuildConfig.VERSION_NAME) <= 0) {
                    if (avisarSemNovidade) avisar("Você já está na versão mais nova (" + BuildConfig.VERSION_NAME + ")");
                    return;
                }
                JSONArray anexos = release.optJSONArray("assets");
                for (int i = 0; anexos != null && i < anexos.length(); i++) {
                    JSONObject anexo = anexos.getJSONObject(i);
                    if (anexo.optString("name").endsWith(".apk")) {
                        String url = anexo.optString("browser_download_url");
                        if (manual) atividade.runOnUiThread(() -> baixar(url, versao));
                        else notificar(versao);
                        return;
                    }
                }
            } catch (Exception e) {
                if (avisarSemNovidade) avisar("Não foi possível verificar atualizações");
            }
        }).start();
    }

    // Cada APK novo passa pelo Play Protect e pela verificação do fabricante; por isso a instalação espera o toque.
    private void notificar(String versao) {
        Intent abrir = new Intent(atividade, MainActivity.class).putExtra(EXTRA_INSTALAR, true)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        android.app.PendingIntent toque = android.app.PendingIntent.getActivity(atividade, 1, abrir,
                android.app.PendingIntent.FLAG_IMMUTABLE | android.app.PendingIntent.FLAG_UPDATE_CURRENT);
        android.app.NotificationManager gerente = atividade.getSystemService(android.app.NotificationManager.class);
        gerente.createNotificationChannel(new android.app.NotificationChannel("atualizacoes", "Atualizações", android.app.NotificationManager.IMPORTANCE_LOW));
        gerente.notify(42, new android.app.Notification.Builder(atividade, "atualizacoes")
                .setSmallIcon(R.drawable.ic_sigaa)
                .setContentTitle("Versão " + versao + " disponível")
                .setContentText("Toque para atualizar quando quiser.")
                .setContentIntent(toque)
                .setAutoCancel(true)
                .build());
    }

    private void baixar(String url, String versao) {
        avisar("Baixando versão " + versao);
        DownloadManager gerente = atividade.getSystemService(DownloadManager.class);
        long id = gerente.enqueue(new DownloadManager.Request(Uri.parse(url))
                .setTitle("Sigaa " + versao)
                .setMimeType("application/vnd.android.package-archive")
                .setDestinationInExternalFilesDir(atividade, Environment.DIRECTORY_DOWNLOADS, "sigaa-" + versao + ".apk"));

        atividade.registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                if (intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1) != id) return;
                ctx.unregisterReceiver(this);
                Uri apk = gerente.getUriForDownloadedFile(id);
                if (apk == null) return;
                atividade.startActivity(new Intent(Intent.ACTION_VIEW)
                        .setDataAndType(apk, "application/vnd.android.package-archive")
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK));
            }
        }, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
    }

    private static String ler(String endereco) throws Exception {
        HttpURLConnection conexao = (HttpURLConnection) new URL(endereco).openConnection();
        conexao.setRequestProperty("Accept", "application/vnd.github+json");
        conexao.setConnectTimeout(10_000);
        conexao.setReadTimeout(10_000);
        try (InputStream entrada = conexao.getInputStream(); ByteArrayOutputStream saida = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            for (int n; (n = entrada.read(buffer)) > 0; ) saida.write(buffer, 0, n);
            return saida.toString(StandardCharsets.UTF_8.name());
        } finally {
            conexao.disconnect();
        }
    }

    /** Compara "1.2.10" com "1.2.9" numericamente. */
    static int comparar(String a, String b) {
        String[] x = a.split("\\.");
        String[] y = b.split("\\.");
        for (int i = 0; i < Math.max(x.length, y.length); i++) {
            int dx = i < x.length ? parse(x[i]) : 0;
            int dy = i < y.length ? parse(y[i]) : 0;
            if (dx != dy) return Integer.compare(dx, dy);
        }
        return 0;
    }

    private static int parse(String s) {
        try {
            return Integer.parseInt(s.replaceAll("\\D", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private void avisar(String mensagem) {
        atividade.runOnUiThread(() -> Toast.makeText(atividade, mensagem, Toast.LENGTH_SHORT).show());
    }
}
