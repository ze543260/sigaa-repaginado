import type { Atividade, Turma } from './types';
import { faixaHoraria, horariosDoCodigo, lerData, naHora, type Horario } from './horario';

const fmt = (d: Date): string =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;

const esc = (s: string): string => s.replace(/[\;,]/g, (c) => `\${c}`).replace(/\n/g, '\n');
const RRULE_DIA = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function blocos(horarios: Horario[]): [Horario, Horario][] {
  const ordenados = [...horarios].sort((a, b) => a.dia - b.dia || a.turno.localeCompare(b.turno) || a.aula - b.aula);
  const res: [Horario, Horario][] = [];
  for (const h of ordenados) {
    const ultimo = res[res.length - 1];
    if (ultimo && ultimo[1].dia === h.dia && ultimo[1].turno === h.turno && ultimo[1].aula === h.aula - 1) ultimo[1] = h;
    else res.push([h, h]);
  }
  return res;
}

/** Calendário com as aulas semanais até `ate` e os prazos das atividades. */
export function gerarIcs(turmas: readonly Turma[], atividades: readonly Atividade[], ate: Date): string {
  const hoje = new Date();
  const eventos: string[] = [];
  const carimbo = fmt(hoje);

  for (const t of turmas) {
    for (const [p, u] of blocos(horariosDoCodigo(t.horario))) {
      const a = faixaHoraria(p);
      const b = faixaHoraria(u);
      if (!a || !b) continue;
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() + ((p.dia - 1 - hoje.getDay() + 7) % 7));
      eventos.push([
        'BEGIN:VEVENT',
        `UID:${t.codigo || t.nome}-${p.dia}${p.turno}${p.aula}@sigaa-v2`,
        `DTSTAMP:${carimbo}`,
        `DTSTART:${fmt(naHora(dia, a[0]))}`,
        `DTEND:${fmt(naHora(dia, b[1]))}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${RRULE_DIA[p.dia - 1]};UNTIL=${fmt(ate)}`,
        `SUMMARY:${esc(t.nome)}`,
        `LOCATION:${esc(t.local)}`,
        'END:VEVENT',
      ].join('\r\n'));
    }
  }

  atividades.forEach((at, i) => {
    const quando = lerData(at.data);
    if (!quando || at.status === 'passada') return;
    const inicio = new Date(quando.getTime() - 60 * 60_000);
    eventos.push([
      'BEGIN:VEVENT',
      `UID:atividade-${i}-${fmt(quando)}@sigaa-v2`,
      `DTSTAMP:${carimbo}`,
      `DTSTART:${fmt(inicio)}`,
      `DTEND:${fmt(quando)}`,
      `SUMMARY:${esc(`${at.tipo}: ${at.descricao}`)}`,
      `DESCRIPTION:${esc(at.turma)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY', `DESCRIPTION:${esc(at.descricao)}`, 'END:VALARM',
      'END:VEVENT',
    ].join('\r\n'));
  });

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//sigaa-v2//PT-BR', 'CALSCALE:GREGORIAN', ...eventos, 'END:VCALENDAR'].join('\r\n');
}
