package br.sigaa.v2;

import android.content.SharedPreferences;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import android.os.SystemClock;
import android.view.View;

/** Esconde o conteúdo e pede digital (ou PIN do aparelho) ao voltar ao app depois de um tempo fora. */
final class Bloqueio {

    private static final String CHAVE = "bloqueio";
    private static final long TOLERANCIA_MS = 2 * 60_000;

    private final MainActivity atividade;
    private final View conteudo;
    private final SharedPreferences prefs;
    private long saiuEm = -1;
    private boolean pedindo;

    Bloqueio(MainActivity atividade, View conteudo) {
        this.atividade = atividade;
        this.conteudo = conteudo;
        this.prefs = atividade.getSharedPreferences("seguranca", MainActivity.MODE_PRIVATE);
    }

    boolean ativo() {
        return prefs.getBoolean(CHAVE, false);
    }

    void definir(boolean ligado) {
        prefs.edit().putBoolean(CHAVE, ligado).apply();
    }

    void aoSair() {
        saiuEm = SystemClock.elapsedRealtime();
    }

    /** Chamado no onStart; numa abertura a frio (saiuEm < 0) também bloqueia. */
    void aoVoltar() {
        if (!ativo() || pedindo) return;
        if (saiuEm >= 0 && SystemClock.elapsedRealtime() - saiuEm < TOLERANCIA_MS) return;
        conteudo.setVisibility(View.INVISIBLE);
        pedir();
    }

    @SuppressWarnings("deprecation")
    private void pedir() {
        pedindo = true;
        BiometricPrompt.Builder construtor = new BiometricPrompt.Builder(atividade)
                .setTitle("Sigaa bloqueado")
                .setSubtitle("Confirme que é você");
        if (Build.VERSION.SDK_INT >= 30) {
            construtor.setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL);
        } else {
            construtor.setDeviceCredentialAllowed(true);
        }
        construtor.build().authenticate(new CancellationSignal(), atividade.getMainExecutor(),
                new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult resultado) {
                        pedindo = false;
                        conteudo.setVisibility(View.VISIBLE);
                    }

                    @Override
                    public void onAuthenticationError(int codigo, CharSequence mensagem) {
                        // Cancelado: o app sai de cena; ao voltar, pede de novo.
                        pedindo = false;
                        saiuEm = -1;
                        atividade.moveTaskToBack(true);
                    }
                });
    }
}
