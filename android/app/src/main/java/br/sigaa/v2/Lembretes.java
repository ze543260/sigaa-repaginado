package br.sigaa.v2;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Agenda e exibe os lembretes de aula e prazo enviados pela interface. */
public final class Lembretes extends BroadcastReceiver {

    private static final String CANAL = "lembretes";
    private static final String PREFS = "lembretes";
    private static final String QTD = "quantidade";
    private static final int MAX = 60;

    static void agendar(Context ctx, String json) {
        AlarmManager alarmes = ctx.getSystemService(AlarmManager.class);
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        for (int i = 0; i < prefs.getInt(QTD, 0); i++) alarmes.cancel(intencao(ctx, i, null, null));

        int n = 0;
        JSONArray aulas = new JSONArray();
        try {
            JSONArray lista = new JSONArray(json);
            for (int i = 0; i < lista.length(); i++) {
                JSONObject aula = lista.getJSONObject(i).optJSONObject("aula");
                if (aula != null) aulas.put(aula);
            }
            long agora = System.currentTimeMillis();
            for (int i = 0; i < lista.length() && n < MAX; i++) {
                JSONObject l = lista.getJSONObject(i);
                long quando = l.getLong("quando");
                if (quando <= agora) continue;
                // Inexato de propósito: dispensa a permissão de alarme exato e alguns minutos não importam aqui.
                alarmes.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, quando,
                        intencao(ctx, n++, l.optString("titulo"), l.optString("texto")));
            }
        } catch (JSONException e) {
            // Lista inválida: fica sem lembretes até a próxima abertura do portal.
        }
        prefs.edit().putInt(QTD, n).apply();
        JSONObject prazo = null;
        try {
            JSONArray lista = new JSONArray(json);
            long agoraPrazo = System.currentTimeMillis();
            for (int i = 0; i < lista.length(); i++) {
                JSONObject l = lista.getJSONObject(i);
                long fim = l.optLong("prazo");
                if (fim <= agoraPrazo) continue;
                if (prazo == null || fim < prazo.optLong("prazo")) prazo = l;
            }
        } catch (JSONException e) {
            prazo = null;
        }
        WidgetProximaAula.salvarAulas(ctx, aulas, prazo);
    }

    private static PendingIntent intencao(Context ctx, int codigo, String titulo, String texto) {
        Intent i = new Intent(ctx, Lembretes.class).putExtra("titulo", titulo).putExtra("texto", texto);
        return PendingIntent.getBroadcast(ctx, codigo, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        mostrar(ctx, intent.getStringExtra("titulo"), intent.getStringExtra("texto"));
    }

    static void mostrar(Context ctx, String titulo, String texto) {
        if (Build.VERSION.SDK_INT >= 33
                && ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;

        NotificationManager gerente = ctx.getSystemService(NotificationManager.class);
        gerente.createNotificationChannel(new NotificationChannel(CANAL, "Aulas e prazos", NotificationManager.IMPORTANCE_DEFAULT));

        PendingIntent abrir = PendingIntent.getActivity(ctx, 0,
                new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(ctx, CANAL)
                .setSmallIcon(R.drawable.ic_sigaa)
                .setContentTitle(titulo)
                .setContentText(texto)
                .setStyle(new Notification.BigTextStyle().bigText(texto))
                .setContentIntent(abrir)
                .setAutoCancel(true)
                .build();
        gerente.notify((int) (System.currentTimeMillis() & 0x7fffffff), n);
    }
}
