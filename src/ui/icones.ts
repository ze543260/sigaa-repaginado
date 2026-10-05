import type { Estilo } from './estilos';
import { usarPreferencias } from './tema';

export const ICONES = {
  inicio: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  buscar: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm9 3l-4.3-4.3',
  turmas: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  atividades: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  voltar: 'M15 5l-7 7 7 7',
  mais: 'M5 12h.01M12 12h.01M19 12h.01',
  menu: 'M4 7h16M4 12h16M4 17h10',
  notas: 'M5 19V9M10 19V5M15 19v-7M20 19v-4',
  frequencia: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm4 9l2 2 4-4',
} as const;

export type NomeIcone = keyof typeof ICONES;

const POR_ESTILO: Partial<Record<Estilo, Partial<Record<NomeIcone, string>>>> = {
  terminal: {
    inicio: 'M4 7l5 5-5 5M12 18h8',
    turmas: 'M3 6h6l2 2h10v11H3z',
    atividades: 'M8 5H4v14h4M16 5h4v14h-4M9.5 12l2 2 3.5-4',
    menu: 'M4 6h16M4 12h16M4 18h16',
  },
  eletrica: {
    inicio: 'M13 3L5 14h6l-1 7 8-11h-6z',
    turmas: 'M2 12h4l2-5 3 10 3-10 3 10 2-5h3',
    atividades: 'M3 5h18v14H3zM5 12c1.5-4 3-4 4.5 0s3 4 4.5 0 3-4 4.5 0',
  },
  mecanica: {
    inicio: 'M12 2v6M12 16v6M2 12h6M16 12h6M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
    turmas: 'M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2',
    atividades: 'M15 4a5 5 0 0 0 5 6l-9 9a2.1 2.1 0 0 1-3-3l9-9a5 5 0 0 0-2-3z',
  },
  civil: {
    inicio: 'M5 21V4h13M5 4l6 6M18 4v4M16 8h4v3h-4zM2 21h20',
    turmas: 'M3 6h18v12H3zM3 12h18M9 6v6M15 12v6',
    atividades: 'M4 16a8 8 0 0 1 16 0M2 16h20v3H2zM12 8v4',
  },
  producao: {
    inicio: 'M4 4h16v16H4zM9.5 4v16M14.5 4v16',
    turmas: 'M5 4h14v10l-6 6H5zM13 20v-6h6',
    atividades: 'M4 6h8M8 12h11M6 18h6',
  },
  lousa: {
    inicio: 'M3 4h18v12H3zM8 20l4-4 4 4M7 9h5M7 12h8',
    turmas: 'M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM4 17a2 2 0 0 1 2-2h12',
    atividades: 'M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3',
  },
  controle: {
    inicio: 'M12 3v8M7 6.5a7 7 0 1 0 10 0',
    turmas: 'M4 3v18M20 3v18M4 9h4M16 9h4M8 7v4M16 7v4M4 16h16',
    atividades: 'M7 8h10a4 4 0 0 1 0 8H7a4 4 0 0 1 0-8zM16 12h.01',
  },
  ambiental: {
    inicio: 'M5 19c0-9 6-14 15-14 0 9-5 15-14 15zM5 19l8-8',
    turmas: 'M12 21v-5M6 16h12L12 4z',
    atividades: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z',
  },
  materiais: {
    inicio: 'M12 2l8.5 5v10L12 22l-8.5-5V7z',
    turmas: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
    atividades: 'M6 4h12l3 5-9 11L3 9zM3 9h18',
  },
  retro: {
    inicio: 'M3 21V11h3V8h3V5h6v3h3v3h3v10h-7v-5h-4v5z',
    turmas: 'M4 4h13l3 3v13H4zM8 4v5h8V4M8 20v-6h8v6',
    atividades: 'M5 12h4M7 10v4M15 11h.01M18 13h.01M3 7h18v10H3z',
    mais: 'M4 11h2v2H4zM11 11h2v2h-2zM18 11h2v2h-2z',
  },
  energia: {
    inicio: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    turmas: 'M3 7h16v10H3zM21 10v4M6 10v4M9 10v4M12 10v4',
    atividades: 'M13 3L5 14h6l-1 7 8-11h-6z',
  },
  quimica: {
    inicio: 'M9 3h6M10 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-10V3M7 15h10',
    turmas: 'M7 3v14a2 2 0 0 0 4 0V3M13 3v14a2 2 0 0 0 4 0V3M6 3h6M12 3h6',
    atividades: 'M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9zM12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
  },
  admin: {
    inicio: 'M3 4h18v16H3zM3 9h18M3 14h18M9 4v16',
    turmas: 'M3 7h18v13H3zM8 7V4h8v3M3 12h18',
    atividades: 'M4 20V10M10 20V4M16 20v-8M3 20h18',
  },
};

export function iconesDo(estilo: Estilo): Record<NomeIcone, string> {
  return { ...ICONES, ...POR_ESTILO[estilo] };
}

export const useIcones = () => iconesDo(usarPreferencias().prefs.estilo);
