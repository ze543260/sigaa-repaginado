package br.sigaa.v2;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.PathInterpolator;

/**
 * Abertura em matriz de pontos: "sigaa" se acende em onda diagonal, o ponto vermelho pulsa
 * e um brilho percorre as letras até a interface avisar que está pronta; então os pontos se espalham.
 */
final class Abertura extends View {

    private static final String[][] LETRAS = {
            {".####", "#....", "#....", ".###.", "....#", "....#", "####."},
            {"..#..", ".....", ".##..", "..#..", "..#..", "..#..", ".###."},
            {".####", "#...#", "#...#", ".####", "....#", "#...#", ".###."},
            {".....", ".###.", "....#", ".####", "#...#", "#..##", ".##.#"},
            {".....", ".###.", "....#", ".####", "#...#", "#..##", ".##.#"},
    };
    private static final int COLUNAS = LETRAS.length * 6 - 1;
    private static final int LINHAS = 7;
    private static final long ENTRADA_MS = 900;
    private static final long MINIMO_MS = 1900;
    private static final long LIMITE_MS = 9000;
    private static final int VERMELHO = Color.rgb(0xD7, 0x19, 0x1F);

    private final Paint tinta = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final PathInterpolator suave = new PathInterpolator(0.2f, 0.8f, 0.2f, 1f);
    private final long inicio = SystemClock.uptimeMillis();
    private final int frente;
    private final int fundo;
    private float saida = 0f;
    private boolean saindo;

    Abertura(Context ctx, boolean escuro) {
        super(ctx);
        frente = escuro ? Color.WHITE : Color.BLACK;
        fundo = escuro ? Color.BLACK : Color.rgb(0xED, 0xED, 0xED);
        setBackgroundColor(fundo);
        setClickable(true);
        setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);
        postDelayed(this::sair, LIMITE_MS);
    }

    private boolean aceso(int coluna, int linha) {
        int letra = coluna / 6;
        int x = coluna % 6;
        return x < 5 && LETRAS[letra][linha].charAt(x) == '#';
    }

    /** Chamado quando a interface terminou de montar; respeita um tempo mínimo para a animação não piscar. */
    void sair() {
        if (saindo) return;
        long passado = SystemClock.uptimeMillis() - inicio;
        if (passado < MINIMO_MS) {
            postDelayed(this::sair, MINIMO_MS - passado);
            return;
        }
        saindo = true;
        ValueAnimator animador = ValueAnimator.ofFloat(0f, 1f).setDuration(520);
        animador.setInterpolator(new PathInterpolator(0.6f, 0f, 0.4f, 1f));
        animador.addUpdateListener(a -> {
            saida = (float) a.getAnimatedValue();
            setAlpha(1f - Math.max(0f, (saida - 0.35f) / 0.65f));
            invalidate();
        });
        animador.addListener(new android.animation.AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(android.animation.Animator a) {
                if (getParent() instanceof ViewGroup) ((ViewGroup) getParent()).removeView(Abertura.this);
            }
        });
        animador.start();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float t = SystemClock.uptimeMillis() - inicio;
        float passo = Math.min(getWidth() * 0.78f / COLUNAS, getResources().getDisplayMetrics().density * 13f);
        float raio = passo * 0.36f;
        float x0 = (getWidth() - (COLUNAS - 1) * passo) / 2f;
        float y0 = getHeight() * 0.46f - (LINHAS - 1) * passo / 2f;

        desenharGrade(canvas, passo, t);

        for (int c = 0; c < COLUNAS; c++) {
            for (int l = 0; l < LINHAS; l++) {
                float atraso = (c + l) * 22f;
                float entrada = suave.getInterpolation(clamp((t - atraso) / 380f));
                boolean ligado = aceso(c, l);
                float cx = x0 + c * passo;
                float cy = y0 + l * passo;

                if (saindo) {
                    // Cada ponto foge do centro com velocidade própria.
                    float dx = cx - getWidth() / 2f;
                    float dy = cy - getHeight() * 0.46f;
                    float forca = saida * saida * (1.6f + ((c * 7 + l * 13) % 5) * 0.25f);
                    cx += dx * forca;
                    cy += dy * forca;
                }

                if (ligado) {
                    float brilho = 0f;
                    if (t > ENTRADA_MS) {
                        float onda = ((t - ENTRADA_MS) / 1400f) % 1f * (COLUNAS + 14) - 7;
                        brilho = Math.max(0f, 1f - Math.abs(c + l * 0.5f - onda) / 3f);
                    }
                    tinta.setColor(frente);
                    tinta.setAlpha((int) (255 * entrada * (0.82f + 0.18f * brilho)));
                    canvas.drawCircle(cx, cy, raio * (0.4f + 0.6f * entrada) * (1f + 0.25f * brilho), tinta);
                } else {
                    tinta.setColor(frente);
                    tinta.setAlpha((int) (22 * entrada));
                    canvas.drawCircle(cx, cy, raio * 0.7f, tinta);
                }
            }
        }

        float pulso = t < ENTRADA_MS ? suave.getInterpolation(clamp((t - 600f) / 300f))
                : 1f + 0.18f * (float) Math.sin((t - ENTRADA_MS) / 260f);
        tinta.setColor(VERMELHO);
        tinta.setAlpha((int) (255 * clamp(pulso) * (1f - saida)));
        canvas.drawCircle(x0 + (COLUNAS + 1.2f) * passo, y0 + passo * 0.6f, raio * 1.25f * Math.max(0f, pulso), tinta);

        if (getParent() != null) postInvalidateOnAnimation();
    }

    /** Grade de fundo, a mesma textura pontilhada da interface, aparecendo do centro para fora. */
    private void desenharGrade(Canvas canvas, float passo, float t) {
        float espaco = passo * 1.6f;
        float raio = Math.max(1f, passo * 0.07f);
        float cx = getWidth() / 2f;
        float cy = getHeight() * 0.46f;
        float alcance = clamp(t / 1100f) * (float) Math.hypot(cx, getHeight());
        tinta.setColor(frente);
        for (float x = espaco / 2; x < getWidth(); x += espaco) {
            for (float y = espaco / 2; y < getHeight(); y += espaco) {
                float d = (float) Math.hypot(x - cx, y - cy);
                if (d > alcance) continue;
                tinta.setAlpha((int) (28 * (1f - saida)));
                canvas.drawCircle(x, y, raio, tinta);
            }
        }
    }

    private static float clamp(float v) {
        return Math.max(0f, Math.min(1f, v));
    }
}
