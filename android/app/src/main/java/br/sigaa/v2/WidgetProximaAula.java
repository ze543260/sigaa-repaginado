package br.sigaa.v2;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/** Widget da tela inicial com a aula em andamento ou a próxima, a partir das aulas enviadas pela interface. */
public final class WidgetProximaAula extends AppWidgetProvider {

    private static final String PREFS = "widget";
    private static final String AULAS = "aulas";
    private static final String PRAZO = "prazo";
    private static final Locale PT_BR = new Locale("pt", "BR");

    static void salvarAulas(Context ctx, JSONArray aulas, JSONObject prazo) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString(AULAS, aulas.toString())
                .putString(PRAZO, prazo == null ? "" : prazo.toString())
                .apply();
        AppWidgetManager gerente = AppWidgetManager.getInstance(ctx);
        int[] ids = gerente.getAppWidgetIds(new ComponentName(ctx, WidgetProximaAula.class));
        if (ids.length > 0) desenhar(ctx, gerente, ids);
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager gerente, int[] ids) {
        desenhar(ctx, gerente, ids);
    }

    private static void desenhar(Context ctx, AppWidgetManager gerente, int[] ids) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_proxima);
        PendingIntent abrir = PendingIntent.getActivity(ctx, 0, new Intent(ctx, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.raiz, abrir);

        JSONObject aula = proxima(ctx);
        if (aula == null) {
            v.setTextViewText(R.id.rotulo, "SEM AULAS");
            v.setTextViewText(R.id.quando, "");
            v.setTextViewText(R.id.nome, "Nenhuma aula nos próximos dias");
            v.setTextViewText(R.id.local, "Abra o app para atualizar");
        } else {
            boolean emAndamento = aula.optLong("inicio") <= System.currentTimeMillis();
            v.setTextViewText(R.id.rotulo, emAndamento ? "AGORA" : "PRÓXIMA AULA");
            v.setTextViewText(R.id.quando, emAndamento ? "até " + hora(aula.optLong("fim")) : quando(aula.optLong("inicio")));
            v.setTextViewText(R.id.nome, capitalizar(aula.optString("nome")));
            v.setTextViewText(R.id.local, aula.optString("local"));
        }
        JSONObject prazo = null;
        try {
            String bruto = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(PRAZO, "");
            if (!bruto.isEmpty()) prazo = new JSONObject(bruto);
        } catch (JSONException e) {
            prazo = null;
        }
        if (prazo == null || prazo.optLong("prazo") <= System.currentTimeMillis()) {
            v.setTextViewText(R.id.prazo, "Nenhum prazo pendente");
        } else {
            v.setTextViewText(R.id.prazo, quando(prazo.optLong("prazo")) + " · " + prazo.optString("texto"));
        }
        gerente.updateAppWidget(ids, v);
    }

    private static JSONObject proxima(Context ctx) {
        String bruto = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(AULAS, "[]");
        long agora = System.currentTimeMillis();
        JSONObject melhor = null;
        try {
            JSONArray lista = new JSONArray(bruto);
            for (int i = 0; i < lista.length(); i++) {
                JSONObject a = lista.getJSONObject(i);
                if (a.optLong("fim") <= agora) continue;
                if (melhor == null || a.optLong("inicio") < melhor.optLong("inicio")) melhor = a;
            }
        } catch (JSONException e) {
            return null;
        }
        return melhor;
    }

    private static String hora(long ms) {
        return new SimpleDateFormat("HH:mm", PT_BR).format(ms);
    }

    private static String quando(long ms) {
        Calendar hoje = Calendar.getInstance();
        Calendar alvo = Calendar.getInstance();
        alvo.setTimeInMillis(ms);
        boolean mesmoDia = hoje.get(Calendar.YEAR) == alvo.get(Calendar.YEAR)
                && hoje.get(Calendar.DAY_OF_YEAR) == alvo.get(Calendar.DAY_OF_YEAR);
        return mesmoDia ? hora(ms) : new SimpleDateFormat("EEE HH:mm", PT_BR).format(ms);
    }

    private static String capitalizar(String s) {
        if (s.isEmpty()) return s;
        String minusculo = s.toLowerCase(PT_BR);
        return Character.toUpperCase(minusculo.charAt(0)) + minusculo.substring(1);
    }
}
