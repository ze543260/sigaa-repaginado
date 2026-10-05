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
        script = lerAsset("sigaa.js");

        raiz = new FrameLayout(this);
        webView = new WebView(this);
        raiz.addView(webView);
        setContentView(raiz);
        if (estado == null) {
            abertura = new Abertura(this, getPreferences(MODE_PRIVATE).getBoolean("escuro", sistemaEscuro()));
            raiz.addView(abertura);
        }
        bloqueio = new Bloqueio(this, webView);
        atualizador = new Atualizador(this);
        if (estado == null) atualizador.verificar(false);

        aplicarMargensDoSistema();
        aplicarTema(sistemaEscuro());
        configurarWebView();

        if (estado == null || webView.restoreState(estado) == null) {
            webView.loadUrl(INICIO);
        }
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
            public void onReceivedError(WebView view, WebResourceRequest pedido, android.webkit.WebResourceError erro) {
                if (!pedido.isForMainFrame()) return;
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
                if (!injetaNoInicio && url.startsWith(ORIGEM_SIGAA)) view.evaluateJavascript(script, null);
            }
        });

        webView.setWebChromeClient(new android.webkit.WebChromeClient() {
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

    void fimAbertura() {
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
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
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
    protected void onStart() {
        super.onStart();
        bloqueio.aoVoltar();
    }

    @Override
    protected void onStop() {
        super.onStop();
        bloqueio.aoSair();
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }
}
