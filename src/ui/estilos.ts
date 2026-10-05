import type { Acento } from './tema';

export type Contexto = 'saudacao' | 'sem-aulas' | 'sem-atividades' | 'sem-tarefas' | 'erro' | 'carregando';

export interface DefinicaoEstilo {
  readonly nome: string;
  /** Curso que inspirou o estilo; vazio nos estilos gerais. */
  readonly curso: string;
  readonly descricao: string;
  readonly acento: Acento;
  /** Formato dos pontos na abertura do app e nos carregadores. */
  readonly forma: 'redondo' | 'quadrado';
  readonly amostra: { readonly fundo: string; readonly texto: string; readonly fonte: string; readonly titulo: string };
  readonly piadas: Partial<Record<Contexto, readonly string[]>>;
  readonly segredo: {
    readonly titulo: string;
    readonly texto: string;
    readonly efeito: 'matriz' | 'fogos' | 'onda' | 'chuva';
    /** Símbolos que caem no efeito "chuva". */
    readonly simbolos?: string;
  };
}

// Cada estilo aqui precisa de um bloco [data-estilo='…'] em style.css com as cores e formas.
export const DEFINICOES = {
  minimalista: {
    nome: 'Minimalista',
    curso: '',
    descricao: 'Matriz de pontos e um acento só. Inspirado no Nothing OS.',
    acento: 'vermelho',
    forma: 'redondo',
    amostra: { fundo: '#000', texto: '#f5f5f5', fonte: 'Doto, monospace', titulo: 'sigaa' },
    piadas: {
      'sem-aulas': ['Sem aulas hoje. Respira.'],
      'sem-atividades': ['Nada pendente. Silêncio bom.'],
    },
    segredo: { titulo: 'você achou', texto: 'Menos é mais. Mas um pouco de festa não faz mal.', efeito: 'fogos' },
  },
  terminal: {
    nome: 'Terminal',
    curso: 'Engenharia de Computação',
    descricao: 'Fósforo verde, monoespaçada e grade de circuito.',
    acento: 'verde',
    forma: 'quadrado',
    amostra: { fundo: '#050b07', texto: '#c6f5c2', fonte: "'Space Mono', monospace", titulo: '> sigaa_' },
    piadas: {
      saudacao: [
        '$ sudo passar-em-calculo → Permission denied',
        '$ git commit -m "agora vai" && git commit -m "agora vai mesmo"',
        '$ ./estudar --amanha → Segmentation fault (core dumped)',
        '$ cat motivacao.txt → No such file or directory',
        '$ npm install cafe → added 1 package, 0 vulnerabilities',
        '$ make prova → make: *** No rule to make target "prova"',
        '$ ping professor → Request timed out',
        '$ git blame codigo.c → você, 3 da manhã',
        '$ while true; do estudar; done → ^C',
        '$ echo $SONO → undefined',
        '$ rm -rf /procrastinacao → Device or resource busy',
        '$ python3 -c "import antigravity" → funciona, já o TFG...',
      ],
      'sem-aulas': ['while (!aula) { dormir(); }', 'aulas.filter(hoje) → []  // aproveita o garbage collection'],
      'sem-atividades': ['$ ls tarefas/ → (vazio). git push --force no descanso.', 'Nenhuma tarefa. Isso é um bug ou uma feature?'],
      'sem-tarefas': ['$ ls tarefas/ → (vazio)', 'return null; // por enquanto'],
      erro: ['Kernel panic: o SIGAA não respondeu ao ping.', 'Exception in thread "main": SigaaForaDoArException'],
      carregando: ['compilando portal.c...', 'linkando turmas.o...', 'resolvendo dependências do JSF...', 'aguardando o servidor (timeout 25 min)...', 'otimizando com -O3...'],
    },
    segredo: { titulo: 'acesso root concedido', texto: 'Você achou o modo desenvolvedor. Nada mudou, mas agora você sabe que dá.', efeito: 'matriz' },
  },
  eletrica: {
    nome: 'Osciloscópio',
    curso: 'Engenharia Elétrica',
    descricao: 'Tela de osciloscópio: grade de divisões, traço ciano e títulos com onda.',
    acento: 'azul',
    forma: 'redondo',
    amostra: { fundo: '#07101c', texto: '#bff3f7', fonte: "'Space Mono', monospace", titulo: 'sigaa ∿' },
    piadas: {
      saudacao: [
        'V = R·I → Vontade = Resistência × Insistência.',
        'Ohm sweet ohm.',
        'Corrente alternada: um dia estuda, no outro não.',
        'Diferença de potencial entre você e a média: 2 pontos.',
        'Fator de potência do seu sono: 0,3 indutivo.',
        'Kirchhoff garante: toda matéria que entra tem que sair na prova.',
        'Seu cérebro entrou em curto. Fusível recomendado: café.',
        'Aterrando as expectativas desde o primeiro período.',
        'Resistor de 10 kΩ: a sua resistência a acordar cedo.',
        'Tensão nominal: semana de provas.',
      ],
      'sem-aulas': ['Circuito aberto: nenhuma corrente de aulas hoje.', 'Sinal DC hoje: nada oscilando na agenda.'],
      'sem-atividades': ['Tensão zero. Aproveite o estado estacionário.'],
      'sem-tarefas': ['Nenhuma carga conectada.'],
      erro: ['O disjuntor do SIGAA desarmou.', 'Queda de tensão no servidor. Rearme em instantes.'],
      carregando: ['carregando capacitores...', 'ajustando base de tempo: 25 min/div...', 'sincronizando trigger com o servidor...', 'medindo a impedância do JSF...'],
    },
    segredo: { titulo: 'alta tensão', texto: 'Você achou o gerador de funções. Não encoste no ponto de destaque.', efeito: 'onda' },
  },
  mecanica: {
    nome: "Prancha técnica",
    curso: "Engenharia Mecânica",
    acento: "laranja",
    forma: "redondo",
    descricao: "Papel azul de projeto, cotas, linhas tracejadas e tudo em caixa alta.",
    amostra: {
      fundo: "#0c2a5c",
      texto: "#eef3fb",
      fonte: "'Space Mono', monospace",
      titulo: "⌀ SIGAA",
    },
    piadas: {
      saudacao: ["F = m·a: força pra levantar = massa do cobertor × aceleração da preguiça.", "Seu rendimento está abaixo do ciclo de Carnot.", "Tolerância da sua paciência com o SIGAA: ±0,01 mm.", "Torque necessário pra abrir o portal: alto.", "Entropia do seu quarto: sempre aumentando.", "Coeficiente de atrito estático com a cama: altíssimo.", "Ciclo Otto da semana: admissão, compressão, explosão, entrega atrasada.", "Engrenagem do cérebro sem lubrificação. Aplicar café."],
      'sem-aulas': ["Máquina parada para manutenção preventiva."],
      'sem-atividades': ["Nenhuma carga aplicada. Estrutura em repouso."],
      'sem-tarefas': ["Sem esforço solicitante."],
      erro: ["Falha por fadiga no servidor do SIGAA."],
      carregando: ["usinando portal...", "calculando tensões de Von Mises...", "aplicando tolerância ISO 2768...", "lubrificando engrenagens do JSF..."],
    },
    segredo: {
      titulo: "engrenou",
      texto: "Você achou a caixa de câmbio. Engata a primeira e vai.",
      efeito: "chuva",
      simbolos: "⚙⚙⚙⛭✦",
    },
  },
  civil: {
    nome: "Canteiro",
    curso: "Engenharia Civil",
    acento: "laranja",
    forma: "quadrado",
    descricao: "Concreto aparente, faixa de obra no topo e títulos pesados.",
    amostra: {
      fundo: "#1d1c1b",
      texto: "#f1ece2",
      fonte: "'Archivo Black', sans-serif",
      titulo: "SIGAA",
    },
    piadas: {
      saudacao: ["Tá tudo no prumo. Menos a média.", "Obra parada? Não, é só o JSF carregando.", "Seu cronograma tem mais atraso que obra pública.", "Cálculo estrutural da semana: muita carga, pouco apoio.", "Fator de segurança da prova: 1,0. Sem margem.", "Concreto leva 28 dias pra curar. Você, as férias.", "Sapata, viga, pilar e muito café.", "Recalque diferencial na autoestima detectado."],
      'sem-aulas': ["Canteiro fechado hoje. Capacete no cabide."],
      'sem-atividades': ["Nenhuma obra em andamento. Raridade."],
      'sem-tarefas': ["Sem medição pendente."],
      erro: ["O SIGAA desabou. Chamem o perito."],
      carregando: ["concretando portal...", "esperando a cura (28 dias, brincadeira)...", "conferindo o prumo...", "descarregando o caminhão de dados..."],
    },
    segredo: {
      titulo: "obra entregue",
      texto: "No prazo e no orçamento. Isso sim é um easter egg.",
      efeito: "chuva",
      simbolos: "🧱🧱⛏🏗🦺",
    },
  },
} as const satisfies Record<string, DefinicaoEstilo>;

export type Estilo = keyof typeof DEFINICOES;
export const ESTILOS = Object.keys(DEFINICOES) as Estilo[];
export const definicao = (e: Estilo): DefinicaoEstilo => DEFINICOES[e];
