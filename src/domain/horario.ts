const DIAS: Readonly<Record<string, string>> = {
  '1': 'Dom', '2': 'Seg', '3': 'Ter', '4': 'Qua', '5': 'Qui', '6': 'Sex', '7': 'Sáb',
};
const TURNOS: Readonly<Record<string, string>> = { M: 'Manhã', T: 'Tarde', N: 'Noite' };

export interface Encontro {
  readonly dia: string;
  readonly turno: string;
}

export function decodificarHorario(codigo: string): Encontro[] {
  return [...codigo.matchAll(/(\d+)([MTN])(\d+)/g)].flatMap(([, dias = '', turno = '']) =>
    [...dias].flatMap((d) => (DIAS[d] ? [{ dia: DIAS[d], turno: TURNOS[turno] ?? turno }] : [])),
  );
}

export function resumirHorario(codigo: string): string {
  const encontros = decodificarHorario(codigo);
  if (encontros.length === 0) return codigo;
  return encontros.map((e) => `${e.dia} ${e.turno.toLowerCase()}`).join(', ');
}

const ORDEM_TURNO: Readonly<Record<string, number>> = { M: 0, T: 1, N: 2 };

export const diaSigaaHoje = (agora: Date = new Date()): number => agora.getDay() + 1;

export type Turno = 'M' | 'T' | 'N';

export interface Horario {
  readonly dia: number;
  readonly turno: Turno;
  readonly aula: number;
}

export const NOME_DIA_CURTO: Readonly<Record<number, string>> = DIAS_POR_NUMERO();

function DIAS_POR_NUMERO(): Record<number, string> {
  return Object.fromEntries(Object.entries(DIAS).map(([n, nome]) => [Number(n), nome]));
}

/** "2M23 4M45" → [{dia:2,turno:'M',aula:2}, {dia:2,turno:'M',aula:3}, …] */
export function horariosDoCodigo(codigo: string): Horario[] {
  return [...codigo.matchAll(/(\d+)([MTN])(\d+)/g)].flatMap(([, dias = '', turno = '', aulas = '']) =>
    [...dias].flatMap((d) =>
      [...aulas].map((a) => ({ dia: Number(d), turno: turno as Turno, aula: Number(a) })),
    ),
  );
}

export const ordemHorario = (h: Pick<Horario, 'turno' | 'aula'>): number => (ORDEM_TURNO[h.turno] ?? 3) * 10 + h.aula;

const PALAVRAS_MENORES = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'à', 'o', 'para', 'em', 'com']);

/** "Introdução à Eletrônica Digital" → "IED"; "Física Experimental I" → "FEI". */
export function siglaDisciplina(nome: string): string {
  const palavras = nome.split(/[\s-]+/).filter((p) => p && !PALAVRAS_MENORES.has(p.toLowerCase()));
  const sigla = palavras.map((p) => (/^[IVX]+$/.test(p) ? p : p[0] ?? '')).join('').toUpperCase();
  return sigla.slice(0, 5) || nome.slice(0, 3).toUpperCase();
}

// M2–M5 e T1–T4 conferidos na tabela de horários do SIGAA; M1, T5 e noite são estimados.
const FAIXAS: Readonly<Record<string, readonly [string, string]>> = {
  M1: ['07:00', '07:55'], M2: ['07:55', '08:50'], M3: ['08:50', '09:45'], M4: ['10:10', '11:05'], M5: ['11:05', '12:00'],
  T1: ['13:30', '14:25'], T2: ['14:25', '15:20'], T3: ['15:45', '16:40'], T4: ['16:40', '17:35'], T5: ['17:35', '18:30'],
  N1: ['19:00', '19:50'], N2: ['19:50', '20:40'], N3: ['21:00', '21:50'], N4: ['21:50', '22:40'],
};

export const faixaHoraria = (h: Pick<Horario, 'turno' | 'aula'>): readonly [string, string] | null =>
  FAIXAS[`${h.turno}${h.aula}`] ?? null;

const CONFIRMADOS = new Set(['M2', 'M3', 'M4', 'M5', 'T1', 'T2', 'T3', 'T4']);

export const horaConfirmada = (h: Pick<Horario, 'turno' | 'aula'>): boolean => CONFIRMADOS.has(`${h.turno}${h.aula}`);

/** Data local com a hora "HH:MM" aplicada. */
export function naHora(dia: Date, hhmm: string): Date {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const d = new Date(dia);
  d.setHours(h, m, 0, 0);
  return d;
}

export interface AulaNoTempo {
  readonly inicio: Date;
  readonly fim: Date;
}

/** Intervalo de um bloco de aulas consecutivas num dia. */
export function intervaloDoBloco(dia: Date, primeira: Horario, ultima: Horario): AulaNoTempo | null {
  const a = faixaHoraria(primeira);
  const b = faixaHoraria(ultima);
  return a && b ? { inicio: naHora(dia, a[0]), fim: naHora(dia, b[1]) } : null;
}

/** "23/10/2026" ou "23/10/2026 14:00" → Date (fim do dia quando sem hora). */
export function lerData(texto: string): Date | null {
  const m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\D+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const [, d, mes, a, h, min] = m;
  return h ? new Date(+a!, +mes! - 1, +d!, +h, +min!) : new Date(+a!, +mes! - 1, +d!, 23, 59);
}

export function relativo(alvo: Date, agora: Date = new Date()): string {
  const min = Math.round((alvo.getTime() - agora.getTime()) / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `em ${min} min`;
  const h = Math.floor(min / 60);
  return min % 60 && h < 3 ? `em ${h}h${String(min % 60).padStart(2, '0')}` : `em ${h}h`;
}
