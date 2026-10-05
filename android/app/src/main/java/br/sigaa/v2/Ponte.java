package br.sigaa.v2;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import java.io.IOException;
import java.io.OutputStream;

/** Métodos chamados pelo script injetado como window.AndroidSigaa. */
final class Ponte {

    private final MainActivity atividade;
    private final CofreLogin cofre;

    Ponte(MainActivity atividade) {
        this.atividade = atividade;
        this.cofre = new CofreLogin(atividade);
    }

    /** {"disponivel": bool, "salvo": bool} */
    @JavascriptInterface
    public String loginInfo() {
        return "{\"disponivel\":" + cofre.disponivel() + ",\"salvo\":" + cofre.temSalvo() + "}";
    }

    @JavascriptInterface
    public void salvarLogin(String usuario, String senha) {
        if (usuario == null || usuario.isEmpty() || senha == null || senha.isEmpty()) return;
        cofre.salvar(atividade, usuario, senha, (ok, mensagem) -> {
            if (!mensagem.isEmpty()) avisar(mensagem);
        });
    }

    @JavascriptInterface
    public void entrarComLoginSalvo() {
        cofre.obter(
                atividade,
                (usuario, senha) -> atividade.runOnUiThread(() -> atividade.preencherLogin(usuario, senha)),
                (ok, mensagem) -> {
                    if (!ok) atividade.runOnUiThread(() -> atividade.avisarFalhaLogin(mensagem));
                });
    }

    @JavascriptInterface
    public void esquecerLogin() {
        cofre.esquecer();
        avisar("Login salvo apagado");
    }

    @JavascriptInterface
    public void agendarLembretes(String json) {
        atividade.runOnUiThread(atividade::pedirPermissaoNotificacao);
        Lembretes.agendar(atividade.getApplicationContext(), json);
    }

    @JavascriptInterface
    public void notificar(String titulo, String texto) {
        atividade.runOnUiThread(atividade::pedirPermissaoNotificacao);
        Lembretes.mostrar(atividade.getApplicationContext(), titulo, texto);
    }

    @JavascriptInterface
    public boolean bloqueioAtivo() {
        return atividade.bloqueio().ativo();
    }

    @JavascriptInterface
    public void definirBloqueio(boolean ligado) {
        atividade.bloqueio().definir(ligado);
    }

    @JavascriptInterface
    public void verificarAtualizacao() {
        atividade.atualizador().verificar(true);
    }

    @JavascriptInterface
    public void coresAbertura(String json) {
        atividade.getPreferences(android.content.Context.MODE_PRIVATE).edit().putString("abertura", json).apply();
    }

    @JavascriptInterface
    public void pronto() {
        atividade.runOnUiThread(atividade::fimAbertura);
    }

    @JavascriptInterface
    public void tema(boolean escuro) {
        atividade.getPreferences(android.content.Context.MODE_PRIVATE).edit().putBoolean("escuro", escuro).apply();
        atividade.runOnUiThread(() -> atividade.aplicarTema(escuro));
    }

    @JavascriptInterface
    public void salvar(String nome, String mime, String base64) {
        byte[] dados = Base64.decode(base64, Base64.DEFAULT);
        ContentResolver resolvedor = atividade.getContentResolver();
        ContentValues valores = new ContentValues();
        valores.put(MediaStore.Downloads.DISPLAY_NAME, nomeSeguro(nome));
        valores.put(MediaStore.Downloads.MIME_TYPE, mime);

        Uri destino = resolvedor.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, valores);
        if (destino == null) {
            avisar("Não foi possível salvar " + nome);
            return;
        }
        try (OutputStream saida = resolvedor.openOutputStream(destino)) {
            if (saida == null) throw new IOException("sem fluxo de saída");
            saida.write(dados);
        } catch (IOException e) {
            resolvedor.delete(destino, null, null);
            avisar("Não foi possível salvar " + nome);
            return;
        }

        avisar(nome + " salvo em Downloads");
        Intent abrir = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(destino, mime)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        atividade.runOnUiThread(() -> {
            try {
                atividade.startActivity(abrir);
            } catch (android.content.ActivityNotFoundException e) {
                // Sem app para o tipo: o arquivo continua disponível em Downloads.
            }
        });
    }

    private static String nomeSeguro(String nome) {
        String limpo = nome.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        return limpo.isEmpty() ? "arquivo" : limpo;
    }

    private void avisar(String mensagem) {
        atividade.runOnUiThread(() -> Toast.makeText(atividade, mensagem, Toast.LENGTH_SHORT).show());
    }
}
