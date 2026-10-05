// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extrairBlocos } from '../src/adapters/blocos';
import { extrairCaixaPostal } from '../src/adapters/caixa-postal';
import { detectarPagina } from '../src/adapters/detectar-pagina';
import { extrairTarefas } from '../src/adapters/tarefas';
import { analisarFaltas, prever, registrosDeFrequencia, semestresDeNotas } from '../src/domain/desempenho';

function abrir(arquivo: string): Document {
  const html = readFileSync(join(__dirname, 'fixtures', arquivo), 'utf8');
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('Minhas notas', () => {
  const doc = abrir('minhas-notas.html');
  const semestres = semestresDeNotas(extrairBlocos(doc.querySelector('#relatorio')!));

  it('separa um semestre por tabela, em ordem', () => {
    expect(semestres.map((s) => s.periodo)).toEqual(['2026.1', '2026.2']);
    expect(semestres[1]?.emCurso).toBe(true);
  });

  it('conta aprovadas e reprovadas', () => {
    expect(semestres[0]).toMatchObject({ aprovadas: 1, reprovadas: 1 });
  });

  it('lê faltas e notas com vírgula', () => {
    const calculo = semestres[1]?.linhas[0];
    expect(calculo?.faltas).toBe(4);
    expect(calculo?.avaliacoes.map((a) => a.nota)).toEqual([4.5, null]);
  });

  it('prevê a nota da unidade restante', () => {
    expect(prever(semestres[1]!.linhas[0]!)).toEqual({ tipo: 'precisa', nota: 7.5, faltantes: 1 });
  });

  it('considera a recuperação quando a média é inalcançável só com as unidades', () => {
    expect(prever(semestres[1]!.linhas[1]!)).toEqual({ tipo: 'com-recuperacao', nota: 6, faltantes: 1 });
  });

  it('não sugere nota quando nada foi lançado', () => {
    expect(prever(semestres[1]!.linhas[2]!).tipo).toBe('sem-notas');
  });

  it('respeita a situação oficial das disciplinas encerradas', () => {
    expect(prever(semestres[0]!.linhas[0]!)).toEqual({ tipo: 'encerrada', media: 6.5, aprovado: true });
    expect(prever(semestres[0]!.linhas[1]!)).toMatchObject({ tipo: 'encerrada', aprovado: false });
  });

  it('é reconhecida como relatório', () => {
    expect(detectarPagina(new URL('https://sigaa.exemplo/sigaa/portais/discente/discente.jsf'), doc).tipo).toBe('relatorio');
  });
});

describe('Frequência', () => {
  const doc = abrir('frequencia.html');
  const pagina = detectarPagina(new URL('https://sigaa.exemplo/sigaa/ava/index.jsf'), doc);
  const blocos = pagina.tipo === 'turma' && pagina.turma.conteudo.tipo === 'secao' ? pagina.turma.conteudo.blocos : [];

  it('lê cada aula', () => {
    expect(registrosDeFrequencia(blocos).map((r) => r.faltas)).toEqual([2, 0, 2, null]);
  });

  it('soma as faltas e calcula o limite pela CH', () => {
    expect(analisarFaltas(blocos)).toEqual({ faltas: 4, maximo: 8 });
  });
});

describe('Tarefas', () => {
  const tarefas = extrairTarefas(abrir('tarefas.html')) ?? [];

  it('junta título, período e enunciado de cada tarefa', () => {
    expect(tarefas).toHaveLength(2);
    expect(tarefas[0]).toMatchObject({ titulo: 'Lista 1', inicio: '14/08/2026 18:08', fim: '19/08/2026 23:59', possuiNota: false, enviada: true });
    expect(tarefas[0]?.paragrafos).toEqual(['Resolver os exercícios.', 'Peso 1.']);
  });

  it('sabe quando ainda dá para enviar', () => {
    expect(tarefas[1]?.enviada).toBe(false);
    expect(tarefas[1]?.enviar).toBeTypeOf('function');
  });
});

describe('Caixa postal', () => {
  const caixa = extrairCaixaPostal(abrir('caixa-postal.html'));

  it('lista mensagens com estado de leitura e anexo', () => {
    expect(caixa?.mensagens).toHaveLength(2);
    expect(caixa?.mensagens[0]).toMatchObject({ lida: false, anexo: true, data: '24/06/2026 14:30' });
    expect(caixa?.mensagens[1]).toMatchObject({ lida: true, anexo: false });
  });

  it('oferece as pastas e o botão de escrever', () => {
    expect(caixa?.pastas.map((p) => p.rotulo)).toEqual(['Entrada', 'Enviadas', 'Lixeira']);
    expect(caixa?.escrever).toBeTypeOf('function');
  });
});

describe('Telas fora do portal no mesmo caminho', () => {
  it('turmas anteriores viram página genérica, não o portal', () => {
    const doc = new DOMParser().parseFromString(
      `<html><head><title>SIGAA - Turmas</title></head><body><div id="conteudo"><h2>Turmas anteriores</h2>
      <table class="listing"><thead><tr><th>Componente Curricular</th><th>Período</th></tr></thead>
      <tbody><tr><td><a href="#">CÁLCULO A</a></td><td>2026.1</td></tr></tbody></table></div></body></html>`,
      'text/html',
    );
    const pagina = detectarPagina(new URL('https://sigaa.exemplo/sigaa/portais/discente/turmas.jsf'), doc);
    expect(pagina.tipo).toBe('relatorio');
    if (pagina.tipo === 'relatorio') {
      expect(pagina.relatorio.titulo).toBe('Turmas anteriores');
      const tabela = pagina.relatorio.blocos.find((b) => b.tipo === 'tabela');
      expect(tabela?.tipo === 'tabela' && tabela.tabela.linhas[0]?.abrir).toBeTypeOf('function');
    }
  });

  it('todas as turmas viram um relatório por semestre, mesmo com "Tempo de Sessão" no topo', () => {
    const doc = new DOMParser().parseFromString(
      `<html><body><div id="painel">Tempo de Sessão: 00:25</div><div id="conteudo"><h2><a href="#">Portal do Discente</a> &gt; Todas as Turmas</h2>
      <table class="listagem"><thead><tr><th>Disciplina</th><th>Turma</th><th>CH Total</th><th>Horário</th><th> </th></tr></thead>
      <tbody><tr><td class="periodo" colspan="6">2026.2</td></tr>
      <tr><td>MAT01 - CÁLCULO B</td><td>06</td><td>64h</td><td>2M23 4M45</td><td><a href="#" onclick="return false">ir</a></td></tr>
      <tr><td class="periodo" colspan="6">2026.1</td></tr>
      <tr><td>MAT00 - CÁLCULO A</td><td>08</td><td>64h</td><td>2T34 4T12</td><td><a href="#" onclick="return false">ir</a></td></tr></tbody></table></div></body></html>`,
      'text/html',
    );
    const pagina = detectarPagina(new URL('https://sigaa.exemplo/sigaa/portais/discente/turmas.jsf'), doc);
    expect(pagina.tipo).toBe('relatorio');
    if (pagina.tipo === 'relatorio') {
      expect(pagina.relatorio.titulo).toBe('Todas as Turmas');
      expect(pagina.relatorio.blocos.map((b) => b.titulo)).toEqual(['2026.2', '2026.1']);
      const primeiro = pagina.relatorio.blocos[0];
      expect(primeiro?.tipo === 'tabela' && primeiro.tabela.linhas[0]?.abrir).toBeTypeOf('function');
    }
  });
});
