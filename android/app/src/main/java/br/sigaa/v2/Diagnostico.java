package br.sigaa.v2;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.StatFs;
import android.view.PixelCopy;
import android.view.View;
import android.webkit.WebView;

import androidx.webkit.WebViewCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Só no APK de diagnóstico: junta o que acontece na abertura e oferece para compartilhar. */
final class Diagnostico {

    private static final long ESPERA_MS = 15_000;
    private static final StringBuilder log = new StringBuilder();
    private static final long inicio = System.currentTimeMillis();

    private Diagnostico() {}

    static synchronized void registrar(String linha) {
        if (log.length() > 12_000) return;
        log.append('+').append((System.currentTimeMillis() - inicio) / 100 / 10.0).append("s ").append(linha).append('\n');
    }

    static void agendar(MainActivity atividade, WebView webView) {
        registrar("abertura do app");
        new Handler(Looper.getMainLooper()).postDelayed(() -> coletar(atividade, webView), ESPERA_MS);
    }

    private static void coletar(MainActivity atividade, WebView webView) {
        String js = "(function(){var r={url:location.pathname};"
                + "try{var f=document.getElementById('sigaa-v2');r.iframe=!!f;"
                + "var d=f&&f.contentDocument;var t=d&&d.querySelector('.tema');r.interface=!!t;"
                + "r.textoInterface=d&&d.body?d.body.textContent.length:0;"
                + "r.originalVisivel=getComputedStyle(document.getElementById('container')||document.body).visibility;"
                + "if(t){r.tema=t.getAttribute('data-tema');r.estilo=t.getAttribute('data-estilo');}}catch(e){r.erroLeitura=String(e);}"
                + "try{var c=document.createElement('canvas').getContext('webgl');var x=c&&c.getExtension('WEBGL_debug_renderer_info');"
                + "r.gpu=x?c.getParameter(x.UNMASKED_RENDERER_WEBGL):(c?'webgl sem info':'sem webgl');}catch(e){r.gpu='erro '+e;}"
                + "r.tela=innerWidth+'x'+innerHeight+' dpr '+devicePixelRatio;"
                + "return JSON.stringify(r);})()";
        webView.evaluateJavascript(js, estado -> medirTela(atividade, webView, estado));
    }

    private static void medirTela(MainActivity atividade, WebView webView, String estado) {
        Bitmap bmp = Bitmap.createBitmap(Math.max(1, webView.getWidth()), Math.max(1, webView.getHeight()), Bitmap.Config.ARGB_8888);
        int[] pos = new int[2];
        webView.getLocationInWindow(pos);
        android.graphics.Rect area = new android.graphics.Rect(pos[0], pos[1], pos[0] + bmp.getWidth(), pos[1] + bmp.getHeight());
        try {
            PixelCopy.request(atividade.getWindow(), area, bmp, resultado -> {
                String tela = resultado == PixelCopy.SUCCESS ? proporcaoEscura(bmp) : "captura falhou (" + resultado + ")";
                enviar(atividade, estado, tela);
            }, new Handler(Looper.getMainLooper()));
        } catch (Exception e) {
            enviar(atividade, estado, "captura indisponível: " + e);
        }
    }

    private static String proporcaoEscura(Bitmap bmp) {
        int escuros = 0;
        int total = 0;
        for (int y = 0; y < bmp.getHeight(); y += 24) {
            for (int x = 0; x < bmp.getWidth(); x += 24) {
                int p = bmp.getPixel(x, y);
                int luz = ((p >> 16) & 0xff) + ((p >> 8) & 0xff) + (p & 0xff);
                if (luz < 30) escuros++;
                total++;
            }
        }
        return Math.round(100.0 * escuros / Math.max(1, total)) + "% da tela quase preta";
    }

    private static void enviar(MainActivity atividade, String estado, String tela) {
        String webview = "?";
        PackageInfo pacote = WebViewCompat.getCurrentWebViewPackage(atividade);
        if (pacote != null) webview = pacote.packageName + " " + pacote.versionName;
        StatFs disco = new StatFs(Environment.getDataDirectory().getPath());

        String relatorio = "Diagnóstico SIGAA Repaginado " + BuildConfig.VERSION_NAME + "\n"
                + new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.ROOT).format(new Date()) + "\n"
                + "Aparelho: " + Build.MANUFACTURER + " " + Build.MODEL + " · Android " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")\n"
                + "WebView: " + webview + "\n"
                + "Espaço livre: " + disco.getAvailableBytes() / (1024 * 1024) + " MB\n"
                + "Interface: " + (Ota.usandoBaixada ? "baixada" : "embutida") + "\n"
                + "Tela após 15 s: " + tela + "\n"
                + "Estado: " + estado + "\n\n"
                + "Registro:\n" + log;

        android.util.Log.i("SigaaDiag", relatorio);
        Intent compartilhar = Intent.createChooser(new Intent(Intent.ACTION_SEND)
                .setType("text/plain")
                .putExtra(Intent.EXTRA_TEXT, relatorio), "Enviar diagnóstico");
        PendingIntent toque = PendingIntent.getActivity(atividade, 7, compartilhar,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationManager gerente = atividade.getSystemService(NotificationManager.class);
        gerente.createNotificationChannel(new NotificationChannel("diagnostico", "Diagnóstico", NotificationManager.IMPORTANCE_HIGH));
        gerente.notify(77, new Notification.Builder(atividade, "diagnostico")
                .setSmallIcon(R.drawable.ic_sigaa)
                .setContentTitle("Diagnóstico pronto")
                .setContentText("Toque para enviar (WhatsApp, e-mail…)")
                .setContentIntent(toque)
                .setAutoCancel(true)
                .build());
        atividade.pedirPermissaoNotificacao();
        if (atividade.getWindow().getDecorView().getVisibility() == View.VISIBLE) {
            android.widget.Toast.makeText(atividade, "Diagnóstico pronto: veja a notificação", android.widget.Toast.LENGTH_LONG).show();
        }
    }
}
