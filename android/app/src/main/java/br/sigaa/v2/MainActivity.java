package br.sigaa.v2;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends Activity {

    private static final String HOST_SIGAA = "sigaa.unifei.edu.br";
    private static final String ORIGEM_SIGAA = "https://" + HOST_SIGAA;
    // A caixa postal do SIGAA fica no SIG administrativo, aberta com um passaporte de sessão.
    private static final String HOST_CAIXA_POSTAL = "sigadmin.unifei.edu.br";
    private static final String INICIO = ORIGEM_SIGAA + "/sigaa/verTelaLogin.do";
    private static final int PRETO = Color.BLACK;
    private static final int CINZA_CLARO = Color.rgb(0xED, 0xED, 0xED);

    private WebView webView;
    private FrameLayout raiz;
    private String script;
    private static final int ESCOLHER_ARQUIVO = 7;
    private android.webkit.ValueCallback<Uri[]> arquivosPendentes;
    private Bloqueio bloqueio;
    private Abertura abertura;
    private Atualizador atualizador;

    Bloqueio bloqueio() {
        return bloqueio;
    }

    Atualizador atualizador() {
        return atualizador;
    }

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        boolean compat = modoCompatibilidade(getIntent());
        // Em compatibilidade usa a interface do APK: se a baixada for a culpada, ela fica de fora.
        script = compat ? lerAsset("sigaa.js") : Ota.script(this, lerAsset("sigaa.js"));
        Ota.buscar(getApplicationContext());

        raiz = new FrameLayout(this);
        webView = new WebView(this);
        // Desenho por software não depende da GPU: escapatória para aparelhos onde a tela fica preta.
        if (compat) webView.setLayerType(android.view.View.LAYER_TYPE_SOFTWARE, null);
        raiz.addView(webView);
        setContentView(raiz);
        if (estado == null) {
            abertura = new Abertura(this, getPreferences(MODE_PRIVATE).getBoolean("escuro", sistemaEscuro()),
                    getPreferences(MODE_PRIVATE).getString("abertura", null));
            raiz.addView(abertura);
        }
        bloqueio = new Bloqueio(this, webView);
        if (BuildConfig.DIAGNOSTICO && estado == null) Diagnostico.agendar(this, webView);
        atualizador = new Atualizador(this);
        if (getIntent().getBooleanExtra(Atualizador.EXTRA_INSTALAR, false)) atualizador.verificar(true);
        else if (estado == null) atualizador.verificarEmSegundoPlano();

        aplicarMargensDoSistema();
        aplicarTema(sistemaEscuro());
        configurarWebView();

        if (estado == null || webView.restoreState(estado) == null) {
            webView.loadUrl(INICIO);
            vigiarCarregamento();
        }
    }

    private static final long PRAZO_CARREGAMENTO_MS = 25_000;

    // Se a rede segura a conexão sem responder, o WebView fica em about:blank sem erro nenhum.
    private void vigiarCarregamento() {
        webView.postDelayed(() -> {
            String url = webView.getUrl();
            if (url != null && !url.equals("about:blank") && webView.getProgress() > 10) return;
            if (BuildConfig.DIAGNOSTICO) Diagnostico.registrar("SIGAA não respondeu em 25 s (progresso " + webView.getProgress() + "%)");
            webView.stopLoading();
            mostrarFalha(webView, INICIO, "O SIGAA não respondeu. Pode ser a rede: tente trocar entre Wi-Fi e dados móveis.");
        }, PRAZO_CARREGAMENTO_MS);
    }

    private void mostrarFalha(WebView view, String url, String motivo) {
        if (abertura != null) fimAbertura();
        String destino = android.text.Html.escapeHtml(url != null && url.startsWith(ORIGEM_SIGAA) ? url : INICIO);
        boolean escuro = getPreferences(MODE_PRIVATE).getBoolean("escuro", sistemaEscuro());
        String html = "<!doctype html><html><head><meta name=viewport content=\"width=device-width\"></head>"
                + "<body style=\"font-family:sans-serif;padding:32px 24px;line-height:1.5;"
                + (escuro ? "background:#000;color:#eee" : "background:#fff;color:#111") + "\">"
                + "<h2 style=\"margin:0 0 12px\">Não deu para abrir o SIGAA</h2>"
                + "<p>" + android.text.Html.escapeHtml(motivo) + "</p>"
                + "<p><a href=\"" + destino + "\" style=\"display:inline-block;margin-top:12px;padding:12px 20px;border-radius:999px;background:#d7191f;color:#fff;text-decoration:none\">Tentar de novo</a></p>"
                + "</body></html>";
        view.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configurarWebView() {
        WebSettings ajustes = webView.getSettings();
        ajustes.setJavaScriptEnabled(true);
        ajustes.setDomStorageEnabled(true);
        ajustes.setBuiltInZoomControls(true);
        ajustes.setDisplayZoomControls(false);
        ajustes.setUseWideViewPort(true);
        ajustes.setLoadWithOverviewMode(true);
        // O SIGAA redireciona navegadores móveis para uma versão reduzida; a interface nova depende da versão completa.
        ajustes.setUserAgentString(agenteDesktop(ajustes.getUserAgentString()));

        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        CookieManager.getInstance().setAcceptCookie(true);
        webView.addJavascriptInterface(new Ponte(this), "AndroidSigaa");

        boolean injetaNoInicio = WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT);
        if (injetaNoInicio) {
            WebViewCompat.addDocumentStartJavaScript(webView, script,
                    new java.util.HashSet<>(java.util.Arrays.asList(ORIGEM_SIGAA, "https://" + HOST_CAIXA_POSTAL)));
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest pedido) {
                Uri uri = pedido.getUrl();
                if (HOST_SIGAA.equals(uri.getHost()) || HOST_CAIXA_POSTAL.equals(uri.getHost())) return false;
                abrirFora(uri);
                return true;
            }

            @Override
            public void onReceivedSslError(WebView view, android.webkit.SslErrorHandler tratador, android.net.http.SslError erro) {
                // Nunca prossegue com certificado inválido; mas mostra o motivo em vez de deixar a tela vazia.
                tratador.cancel();
                if (BuildConfig.DIAGNOSTICO) Diagnostico.registrar("erro de certificado: " + erro.getPrimaryError() + " em " + erro.getUrl());
                String motivo = erro.getPrimaryError() == android.net.http.SslError.SSL_DATE_INVALID || erro.getPrimaryError() == android.net.http.SslError.SSL_EXPIRED
                        || erro.getPrimaryError() == android.net.http.SslError.SSL_NOTYETVALID
                        ? "A data e a hora do celular parecem erradas. Ajuste em Configurações › Data e hora (automática) e tente de novo."
                        : "Não foi possível verificar a conexão segura com o SIGAA nesta rede. Tente pelos dados móveis ou outro Wi-Fi.";
                mostrarFalha(view, erro.getUrl(), motivo);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (BuildConfig.DIAGNOSTICO) Diagnostico.registrar("página carregada: " + Uri.parse(url).getPath());
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest pedido, android.webkit.WebResourceError erro) {
                if (!pedido.isForMainFrame()) return;
                if (BuildConfig.DIAGNOSTICO) Diagnostico.registrar("erro de rede " + erro.getErrorCode() + ": " + erro.getDescription());
                String falhou = pedido.getUrl().toString();
                String destino = android.text.Html.escapeHtml(falhou.startsWith(ORIGEM_SIGAA) ? falhou : INICIO);
                String html = "<!doctype html><html><head><meta name=viewport content=\"width=device-width\"></head>"
                        + "<body style=\"font-family:sans-serif;padding:24px\">"
                        + "<div id=\"sigaa-offline\" data-url=\"" + destino + "\">"
                        + "Sem conexão com o SIGAA. <a href=\"" + destino + "\">Tentar de novo</a>"
                        + "</div></body></html>";
                // Mesma origem do SIGAA: a interface injetada reconhece a página e mostra os dados salvos.
                view.loadDataWithBaseURL(ORIGEM_SIGAA + "/sigaa/offline", html, "text/html", "utf-8", null);
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap icone) {
                if (BuildConfig.DIAGNOSTICO) Diagnostico.registrar("página: " + Uri.parse(url).getPath());
                if (!injetaNoInicio && url.startsWith(ORIGEM_SIGAA)) view.evaluateJavascript(script, null);
            }

            @Override
            public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detalhe) {
                if (!BuildConfig.DIAGNOSTICO) return super.onRenderProcessGone(view, detalhe);
                Diagnostico.registrar("processo de render morreu (travou: " + detalhe.didCrash() + ")");
                return true;
            }
        });
        if (BuildConfig.DIAGNOSTICO) Diagnostico.registrar("injeção no início: " + injetaNoInicio + " · tamanho do script: " + script.length() / 1024 + " KB");

        webView.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage m) {
                if (BuildConfig.DIAGNOSTICO && m.messageLevel() != android.webkit.ConsoleMessage.MessageLevel.LOG
                        && m.messageLevel() != android.webkit.ConsoleMessage.MessageLevel.DEBUG) {
                    Diagnostico.registrar(m.messageLevel() + ": " + m.message() + " @" + m.lineNumber());
                }
                return false;
            }

            @Override
            public boolean onShowFileChooser(WebView view, android.webkit.ValueCallback<Uri[]> retorno, FileChooserParams params) {
                if (arquivosPendentes != null) arquivosPendentes.onReceiveValue(null);
                arquivosPendentes = retorno;
                try {
                    startActivityForResult(params.createIntent(), ESCOLHER_ARQUIVO);
                } catch (android.content.ActivityNotFoundException e) {
                    arquivosPendentes = null;
                    return false;
                }
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String mensagem, android.webkit.JsResult resultado) {
                new android.app.AlertDialog.Builder(MainActivity.this)
                        .setMessage(mensagem)
                        .setPositiveButton("Sim", (d, w) -> resultado.confirm())
                        .setNegativeButton("Não", (d, w) -> resultado.cancel())
                        .setOnCancelListener(d -> resultado.cancel())
                        .show();
                return true;
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String mensagem, android.webkit.JsResult resultado) {
                new android.app.AlertDialog.Builder(MainActivity.this)
                        .setMessage(mensagem)
                        .setPositiveButton("OK", (d, w) -> resultado.confirm())
                        .setOnCancelListener(d -> resultado.confirm())
                        .show();
                return true;
            }
        });

        webView.setDownloadListener((url, agente, disposicao, mime, tamanho) -> baixar(url, agente, disposicao, mime));
    }

    private void baixar(String url, String agente, String disposicao, String mime) {
        String nome = URLUtil.guessFileName(url, disposicao, mime);
        DownloadManager.Request pedido = new DownloadManager.Request(Uri.parse(url))
                .addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url))
                .addRequestHeader("User-Agent", agente)
                .setMimeType(mime)
                .setTitle(nome)
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, nome);
        DownloadManager gerenciador = getSystemService(DownloadManager.class);
        if (gerenciador != null) gerenciador.enqueue(pedido);
        Toast.makeText(this, "Baixando " + nome, Toast.LENGTH_SHORT).show();
    }

    /** Entrega as credenciais só ao frame principal, e só se ele estiver no SIGAA. */
    void preencherLogin(String usuario, String senha) {
        Uri atual = Uri.parse(String.valueOf(webView.getUrl()));
        if (!HOST_SIGAA.equals(atual.getHost())) return;
        String js = "window.__sigaaPreencherLogin && window.__sigaaPreencherLogin("
                + org.json.JSONObject.quote(usuario) + "," + org.json.JSONObject.quote(senha) + ")";
        webView.evaluateJavascript(js, null);
    }

    void avisarFalhaLogin(String mensagem) {
        String js = "window.dispatchEvent(new CustomEvent('sigaa:login-falhou',{detail:"
                + org.json.JSONObject.quote(mensagem) + "}))";
        webView.evaluateJavascript(js, null);
    }

    void abrirFora(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (android.content.ActivityNotFoundException e) {
            Toast.makeText(this, "Nenhum app abre este link", Toast.LENGTH_SHORT).show();
        }
    }

    void aplicarTema(boolean escuro) {
        int cor = escuro ? PRETO : CINZA_CLARO;
        raiz.setBackgroundColor(cor);
        webView.setBackgroundColor(cor);
        getWindow().setStatusBarColor(cor);
        getWindow().setNavigationBarColor(cor);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controle = getWindow().getInsetsController();
            if (controle != null) {
                int claras = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                controle.setSystemBarsAppearance(escuro ? 0 : claras, claras);
            }
        } else {
            int flags = escuro ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }
    }

    private void aplicarMargensDoSistema() {
        raiz.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                int tipos = WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout();
                android.graphics.Insets margens = insets.getInsets(tipos);
                view.setPadding(margens.left, margens.top, margens.right, margens.bottom);
                return WindowInsets.CONSUMED;
            }
            return view.onApplyWindowInsets(insets);
        });
    }

    private boolean sistemaEscuro() {
        int modo = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return modo == Configuration.UI_MODE_NIGHT_YES;
    }

    private static String agenteDesktop(String agenteOriginal) {
        Matcher versao = Pattern.compile("Chrome/([\\d.]+)").matcher(agenteOriginal);
        String chrome = versao.find() ? versao.group(1) : "130.0.0.0";
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/"
                + chrome + " Safari/537.36";
    }

    private String lerAsset(String nome) {
        try (InputStream entrada = getAssets().open(nome)) {
            return new String(entrada.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Asset ausente: " + nome + ". Rode npm run build:android.", e);
        }
    }

    private boolean modoCompatibilidade(Intent intent) {
        android.content.SharedPreferences p = getPreferences(MODE_PRIVATE);
        if ("alternar".equals(intent.getStringExtra("compatibilidade"))) {
            boolean ligado = !p.getBoolean("compatibilidade", false);
            p.edit().putBoolean("compatibilidade", ligado).apply();
            Toast.makeText(this, ligado
                    ? "Modo de compatibilidade ligado. Use o mesmo atalho para desligar."
                    : "Modo de compatibilidade desligado.", Toast.LENGTH_LONG).show();
            // Sem isso, recriar a tela (girar, tema) alternaria de novo.
            intent.removeExtra("compatibilidade");
        }
        return p.getBoolean("compatibilidade", false);
    }

    void fimAbertura() {
        if (BuildConfig.DIAGNOSTICO) Diagnostico.registrar("interface avisou que montou");
        Ota.confirmar(this);
        if (abertura != null) abertura.sair();
        abertura = null;
    }

    void pedirPermissaoNotificacao() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED
                && !getPreferences(MODE_PRIVATE).getBoolean("pediuNotificacao", false)) {
            getPreferences(MODE_PRIVATE).edit().putBoolean("pediuNotificacao", true).apply();
            requestPermissions(new String[] {android.Manifest.permission.POST_NOTIFICATIONS}, 1);
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // A interface pode ter uma tela sobreposta (configurações) que o voltar deve fechar primeiro.
        webView.evaluateJavascript("window.__sigaaVoltar && window.__sigaaVoltar() ? 1 : 0", fechou -> {
            if ("1".equals(fechou)) return;
            if (webView.canGoBack()) webView.goBack();
            else finish();
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle estado) {
        super.onSaveInstanceState(estado);
        webView.saveState(estado);
    }

    @Override
    protected void onActivityResult(int codigo, int resultado, Intent dados) {
        super.onActivityResult(codigo, resultado, dados);
        if (codigo != ESCOLHER_ARQUIVO || arquivosPendentes == null) return;
        arquivosPendentes.onReceiveValue(android.webkit.WebChromeClient.FileChooserParams.parseResult(resultado, dados));
        arquivosPendentes = null;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent.getBooleanExtra(Atualizador.EXTRA_INSTALAR, false)) atualizador.verificar(true);
        if (intent.hasExtra("compatibilidade")) {
            modoCompatibilidade(intent);
            setIntent(intent);
            recreate();
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        bloqueio.aoVoltar();
    }

    @Override
    protected void onStop() {
        super.onStop();
        bloqueio.aoSair();
    }

    private android.hardware.SensorManager sensores;
    private long ultimoSacolejo;
    private long primeiroSacolejo;
    private final android.hardware.SensorEventListener sacolejo = new android.hardware.SensorEventListener() {
        @Override
        public void onSensorChanged(android.hardware.SensorEvent e) {
            float g = (float) Math.sqrt(e.values[0] * e.values[0] + e.values[1] * e.values[1] + e.values[2] * e.values[2])
                    / android.hardware.SensorManager.GRAVITY_EARTH;
            if (g < 2.6f) return;
            long agora = System.currentTimeMillis();
            // Dois trancos em menos de 700 ms; um só acontece ao guardar o celular no bolso.
            if (agora - primeiroSacolejo > 700) {
                primeiroSacolejo = agora;
                return;
            }
            if (agora - ultimoSacolejo < 3000) return;
            ultimoSacolejo = agora;
            webView.evaluateJavascript("window.__sigaaRelatar && window.__sigaaRelatar()", null);
        }

        @Override
        public void onAccuracyChanged(android.hardware.Sensor s, int precisao) {}
    };

    @Override
    protected void onResume() {
        super.onResume();
        if (sensores == null) sensores = getSystemService(android.hardware.SensorManager.class);
        android.hardware.Sensor acel = sensores == null ? null : sensores.getDefaultSensor(android.hardware.Sensor.TYPE_ACCELEROMETER);
        if (acel != null) sensores.registerListener(sacolejo, acel, android.hardware.SensorManager.SENSOR_DELAY_UI);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (sensores != null) sensores.unregisterListener(sacolejo);
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }
}
