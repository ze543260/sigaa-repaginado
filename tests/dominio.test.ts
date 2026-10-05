import { describe, expect, it } from 'vitest';
import { horariosDoCodigo, lerData, resumirHorario, siglaDisciplina } from '../src/domain/horario';
import { gerarIcs } from '../src/domain/ics';
import { tituloBr } from '../src/domain/texto';

describe('horários', () => {
  it('expande o código do SIGAA em aulas', () => {
    expect(horariosDoCodigo('24M23')).toEqual([
      { dia: 2, turno: 'M', aula: 2 },
      { dia: 2, turno: 'M', aula: 3 },
      { dia: 4, turno: 'M', aula: 2 },
      { dia: 4, turno: 'M', aula: 3 },
    ]);
  });

  it('resume para leitura', () => {
    expect(resumirHorario('3M23 5T12')).toBe('Ter manhã, Qui tarde');
  });

  it('gera siglas mantendo numerais romanos', () => {
    expect(siglaDisciplina('Física Experimental I')).toBe('FEI');
    expect(siglaDisciplina('Introdução à Eletrônica Digital')).toBe('IED');
  });

  it('lê datas com e sem hora', () => {
    expect(lerData('11/10/2026 23:59')?.getHours()).toBe(23);
    expect(lerData('06/10/2026 (2 dias)')?.getDate()).toBe(6);
    expect(lerData('sem data')).toBeNull();
  });
});

describe('títulos', () => {
  it('capitaliza respeitando preposições e numerais romanos', () => {
    expect(tituloBr('CÁLCULO II')).toBe('Cálculo II');
    expect(tituloBr('INTRODUÇÃO À ELETRÔNICA DIGITAL')).toBe('Introdução à Eletrônica Digital');
    expect(tituloBr('LÓGICA PARA ENGENHARIA')).toBe('Lógica para Engenharia');
  });
});

describe('calendário .ics', () => {
  it('cria evento semanal por bloco de aulas e evento de prazo', () => {
    const ics = gerarIcs(
      [{ codigo: 'X1', nome: 'CÁLCULO II', local: 'Sala 1', horario: '2M23', acessar: () => {} }],
      [{ data: '20/12/2099 23:59', turma: 'CÁLCULO II', tipo: 'Tarefa', descricao: 'Lista', status: 'futura', abrir: null }],
      new Date(2099, 11, 31),
    );
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO');
    expect(ics).toContain('SUMMARY:Tarefa: Lista');
  });
});

describe('títulos com unidade', () => {
  it('mantém a sigla depois da barra', () => {
    expect(tituloBr('ENGENHARIA DE COMPUTAÇÃO/IESTI')).toBe('Engenharia de Computação/IESTI');
  });
});

import { maisNova } from '../src/ui/AvisoVersaoNova';

describe('Comparação de versões', () => {
  it('compara numericamente, não como texto', () => {
    expect(maisNova('0.6.10', '0.6.9')).toBe(true);
    expect(maisNova('0.6.9', '0.6.10')).toBe(false);
    expect(maisNova('0.7', '0.6.12')).toBe(true);
    expect(maisNova('0.6.12', '0.6.12')).toBe(false);
  });
});
