package br.sigaa.v2;

import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyPermanentlyInvalidatedException;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Guarda usuário e senha cifrados com uma chave do Android Keystore que só pode ser usada
 * depois de autenticação biométrica forte. O texto puro só existe em memória durante o uso.
 */
final class CofreLogin {

    interface AoObter {
        void credenciais(String usuario, String senha);
    }

    interface AoTerminar {
        void resultado(boolean ok, String mensagem);
    }

    private static final String KEYSTORE = "AndroidKeyStore";
    private static final String APELIDO = "sigaa-v2-login";
    private static final String TRANSFORMACAO = "AES/GCM/NoPadding";
    private static final String PREFS = "cofre";
    private static final String CHAVE_IV = "iv";
    private static final String CHAVE_DADOS = "dados";

    private final Context contexto;
    private final SharedPreferences prefs;

    CofreLogin(Context contexto) {
        this.contexto = contexto;
        this.prefs = contexto.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    boolean disponivel() {
        BiometricManager gerenciador = contexto.getSystemService(BiometricManager.class);
        if (gerenciador == null) return false;
        try {
            int estado = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    ? gerenciador.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                    : gerenciador.canAuthenticate();
            return estado == BiometricManager.BIOMETRIC_SUCCESS;
        } catch (SecurityException e) {
            return false;
        }
    }

    boolean temSalvo() {
        return prefs.contains(CHAVE_DADOS) && prefs.contains(CHAVE_IV);
    }

    void esquecer() {
        prefs.edit().clear().apply();
        try {
            KeyStore ks = KeyStore.getInstance(KEYSTORE);
            ks.load(null);
            ks.deleteEntry(APELIDO);
        } catch (GeneralSecurityException | java.io.IOException ignorado) {
            // Sem entrada para apagar.
        }
    }

    void salvar(MainActivity atividade, String usuario, String senha, AoTerminar fim) {
        try {
            Cipher cifra = Cipher.getInstance(TRANSFORMACAO);
            cifra.init(Cipher.ENCRYPT_MODE, chave(true));
            autenticar(atividade, "Salvar login do SIGAA", cifra, autenticada -> {
                try {
                    JSONObject json = new JSONObject().put("u", usuario).put("s", senha);
                    byte[] dados = autenticada.doFinal(json.toString().getBytes(StandardCharsets.UTF_8));
                    prefs.edit()
                            .putString(CHAVE_IV, Base64.encodeToString(autenticada.getIV(), Base64.NO_WRAP))
                            .putString(CHAVE_DADOS, Base64.encodeToString(dados, Base64.NO_WRAP))
                            .apply();
                    fim.resultado(true, "Login salvo");
                } catch (GeneralSecurityException | JSONException e) {
                    fim.resultado(false, "Não foi possível salvar o login");
                }
            }, fim);
        } catch (GeneralSecurityException e) {
            fim.resultado(false, "Não foi possível salvar o login");
        }
    }

    void obter(MainActivity atividade, AoObter aoObter, AoTerminar fim) {
        if (!temSalvo()) {
            fim.resultado(false, "Nenhum login salvo");
            return;
        }
        try {
            byte[] iv = Base64.decode(prefs.getString(CHAVE_IV, ""), Base64.NO_WRAP);
            Cipher cifra = Cipher.getInstance(TRANSFORMACAO);
            cifra.init(Cipher.DECRYPT_MODE, chave(false), new GCMParameterSpec(128, iv));
            autenticar(atividade, "Entrar no SIGAA", cifra, autenticada -> {
                try {
                    byte[] dados = Base64.decode(prefs.getString(CHAVE_DADOS, ""), Base64.NO_WRAP);
                    JSONObject json = new JSONObject(new String(autenticada.doFinal(dados), StandardCharsets.UTF_8));
                    aoObter.credenciais(json.getString("u"), json.getString("s"));
                    fim.resultado(true, "");
                } catch (GeneralSecurityException | JSONException e) {
                    fim.resultado(false, "Não foi possível ler o login salvo");
                }
            }, fim);
        } catch (KeyPermanentlyInvalidatedException e) {
            esquecer();
            fim.resultado(false, "As digitais do aparelho mudaram. Entre de novo para salvar o login.");
        } catch (GeneralSecurityException e) {
            fim.resultado(false, "Não foi possível ler o login salvo");
        }
    }

    private interface AoAutenticar {
        void cifra(Cipher cifra);
    }

    private void autenticar(MainActivity atividade, String titulo, Cipher cifra, AoAutenticar ok, AoTerminar fim) {
        atividade.runOnUiThread(() -> {
            BiometricPrompt.Builder construtor = new BiometricPrompt.Builder(atividade)
                    .setTitle(titulo)
                    .setNegativeButton("Cancelar", atividade.getMainExecutor(), (dialogo, qual) -> fim.resultado(false, ""));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                construtor.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG);
            }
            construtor.build().authenticate(
                    new BiometricPrompt.CryptoObject(cifra),
                    new CancellationSignal(),
                    atividade.getMainExecutor(),
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult resultado) {
                            Cipher autenticada = resultado.getCryptoObject().getCipher();
                            if (autenticada == null) fim.resultado(false, "Falha na autenticação");
                            else ok.cifra(autenticada);
                        }

                        @Override
                        public void onAuthenticationError(int codigo, CharSequence mensagem) {
                            fim.resultado(false, "");
                        }
                    });
        });
    }

    private SecretKey chave(boolean criarSeFaltar) throws GeneralSecurityException {
        try {
            KeyStore ks = KeyStore.getInstance(KEYSTORE);
            ks.load(null);
            if (ks.containsAlias(APELIDO)) return (SecretKey) ks.getKey(APELIDO, null);
        } catch (java.io.IOException e) {
            throw new GeneralSecurityException(e);
        }
        if (!criarSeFaltar) throw new KeyPermanentlyInvalidatedException();

        KeyGenParameterSpec.Builder spec = new KeyGenParameterSpec.Builder(
                APELIDO, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setUserAuthenticationRequired(true)
                .setInvalidatedByBiometricEnrollment(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            spec.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG);
        }
        KeyGenerator gerador = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE);
        gerador.init(spec.build());
        return gerador.generateKey();
    }
}
