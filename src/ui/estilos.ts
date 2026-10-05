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
  producao: {
    nome: "Kanban",
    curso: "Engenharia de Produção",
    acento: "violeta",
    forma: "quadrado",
    descricao: "Quadro de post-its, título em caneta e foco no que está em andamento.",
    amostra: {
      fundo: "#fff3b0",
      texto: "#1e2235",
      fonte: "Caveat, cursive",
      titulo: "sigaa ✓",
    },
    piadas: {
      saudacao: ["Kaizen do dia: estudar 1% a mais que ontem.", "Gargalo identificado: o SIGAA.", "Just in time: entregar a tarefa às 23h59.", "Seu lead time de estudo está acima da meta.", "5S no quarto: seiri, seiton... depois eu termino.", "Diagrama de Ishikawa da reprovação: causa raiz = sono.", "WIP limit: 3 tarefas. Você: 11.", "Lean é cortar desperdício. Começa pelo Instagram."],
      'sem-aulas': ["Linha parada. Ótimo dia pra um kaizen pessoal."],
      'sem-atividades': ["Coluna \"a fazer\" vazia. Raro como um processo estável."],
      'sem-tarefas': ["Nenhum cartão no quadro."],
      erro: ["Andon aceso: o SIGAA parou a linha."],
      carregando: ["puxando cartões do backlog...", "medindo o takt time do servidor...", "eliminando desperdícios...", "rodando o PDCA..."],
    },
    segredo: {
      titulo: "lote entregue",
      texto: "Zero defeitos. Six Sigma ficaria orgulhoso.",
      efeito: "chuva",
      simbolos: "🟨🟪🟩✓✓",
    },
  },
  lousa: {
    nome: "Lousa",
    curso: "Física e Matemática",
    acento: "rosa",
    forma: "redondo",
    descricao: "Quadro verde com giz no escuro e quadro branco no claro, título escrito à mão.",
    amostra: {
      fundo: "#16261d",
      texto: "#eeeee2",
      fonte: "Caveat, cursive",
      titulo: "sigaa ∑",
    },
    piadas: {
      saudacao: ["Seja x a sua vontade de estudar. Então x → 0.", "Prova trivial, deixada como exercício ao leitor.", "Considere uma vaca esférica no vácuo...", "Δt de estudo × motivação = constante. Infelizmente.", "Lim (dias até a prova) → 0⁺", "Pelo teorema do confronto, você passa. Talvez.", "Entropia não diminui. Nem a pilha de listas.", "Schrödinger: até ver a nota, você passou e reprovou."],
      'sem-aulas': ["∅ aulas hoje. Conjunto vazio, coração cheio."],
      'sem-atividades': ["Não existe tarefa t tal que t esteja pendente. ∎"],
      'sem-tarefas': ["Nenhuma tarefa. Q.E.D."],
      erro: ["Divisão por zero no servidor do SIGAA."],
      carregando: ["apagando a lousa...", "derivando o portal...", "integrando por partes...", "aplicando a regra da cadeia..."],
    },
    segredo: {
      titulo: "q.e.d.",
      texto: "Demonstrado. Agora é só aplicar no exercício 47.",
      efeito: "chuva",
      simbolos: "∫∑π∞√∂∆λ",
    },
  },
  controle: {
    nome: "Painel CLP",
    curso: "Engenharia de Controle e Automação",
    acento: "verde",
    forma: "quadrado",
    descricao: "Painel de comando: trilhos de diagrama ladder, LED piscando e tudo em caixa alta.",
    amostra: {
      fundo: "#141a20",
      texto: "#e3edd9",
      fonte: "'Space Mono', monospace",
      titulo: "SIGAA ●",
    },
    piadas: {
      saudacao: ["Malha fechada: estudar, errar, estudar de novo.", "Seu PID está com ganho derivativo demais: ansiedade.", "Overshoot na semana de provas detectado.", "Erro em regime permanente: 0,5 ponto na média.", "Estado do sistema: estável, porém marginalmente.", "Saída do CLP: café = 1.", "Zieger-Nichols não sintoniza o seu sono.", "Planta não controlável: a agenda do semestre."],
      'sem-aulas': ["Sistema em repouso. Nenhuma entrada ativa."],
      'sem-atividades': ["Setpoint atingido. Erro zero."],
      'sem-tarefas': ["Nenhum degrau aplicado."],
      erro: ["Watchdog do SIGAA estourou."],
      carregando: ["varrendo entradas do CLP...", "executando o ladder...", "ajustando Kp, Ki e Kd...", "aguardando resposta ao degrau..."],
    },
    segredo: {
      titulo: "sistema estável",
      texto: "Polos no semiplano esquerdo. Pode relaxar.",
      efeito: "chuva",
      simbolos: "●○●⏻⚡",
    },
  },
  ambiental: {
    nome: "Curvas de nível",
    curso: "Engenharia Ambiental e Hídrica",
    acento: "azul",
    forma: "redondo",
    descricao: "Mapa topográfico: linhas de relevo no fundo, tons de terra e de água.",
    amostra: {
      fundo: "#0e1c18",
      texto: "#e6efd8",
      fonte: "'Space Grotesk', sans-serif",
      titulo: "sigaa △",
    },
    piadas: {
      saudacao: ["Sua bacia hidrográfica de tarefas está transbordando.", "Vazão de estudo: abaixo da mínima ecológica.", "Pegada de carbono do seu café: alta.", "Ciclo hidrológico: evapora a motivação, precipita na prova.", "Tempo de concentração da turma: 15 minutos.", "Licenciamento ambiental da sua procrastinação: negado.", "Curva-chave do semestre: quanto mais lista, mais choro.", "Reciclagem de conteúdo: a prova repete a lista. Ou não."],
      'sem-aulas': ["Dia de cheia nula: nenhuma aula no hidrograma."],
      'sem-atividades': ["Reservatório de tarefas vazio. Aproveite o estio."],
      'sem-tarefas': ["Nenhum afluente de tarefas."],
      erro: ["Enchente no servidor do SIGAA."],
      carregando: ["medindo a vazão do servidor...", "traçando curvas de nível...", "tratando o efluente do JSF...", "calculando o tempo de retorno..."],
    },
    segredo: {
      titulo: "chuva de projeto",
      texto: "Tempo de retorno: 100 anos. Você teve sorte.",
      efeito: "chuva",
      simbolos: "💧💧🌱🍃💧",
    },
  },
  materiais: {
    nome: "Cristal",
    curso: "Engenharia de Materiais",
    acento: "violeta",
    forma: "redondo",
    descricao: "Rede cristalina hexagonal no fundo, tons frios e um diamante girando.",
    amostra: {
      fundo: "#0f0b1d",
      texto: "#ebe8fb",
      fonte: "'Space Mono', monospace",
      titulo: "sigaa ◇",
    },
    piadas: {
      saudacao: ["Seu limite de escoamento foi atingido na semana de provas.", "Tratamento térmico: café quente, depois choque térmico na prova.", "Discordância na rede: você e o horário de acordar.", "Tenacidade à fratura da sua paciência: baixa.", "Fase metaestável: estudando sem entender.", "Diagrama Fe-C da semana: 100% cementita (duro e quebradiço).", "Fluência: deformação lenta sob carga constante. Tipo você no 3º período.", "Seu grão está grosso: precisa de refino."],
      'sem-aulas': ["Amostra em repouso. Sem ensaio hoje."],
      'sem-atividades': ["Nenhuma tensão aplicada. Rede perfeita."],
      'sem-tarefas': ["Nenhum corpo de prova na fila."],
      erro: ["Fratura frágil no servidor do SIGAA."],
      carregando: ["ensaiando à tração...", "medindo a dureza Vickers...", "resfriando lentamente...", "organizando a rede cristalina..."],
    },
    segredo: {
      titulo: "estrutura perfeita",
      texto: "Zero defeitos na rede. Isso não existe, mas você achou.",
      efeito: "chuva",
      simbolos: "◇⬡◆⬢✧",
    },
  },
} as const satisfies Record<string, DefinicaoEstilo>;

export type Estilo = keyof typeof DEFINICOES;
export const ESTILOS = Object.keys(DEFINICOES) as Estilo[];
export const definicao = (e: Estilo): DefinicaoEstilo => DEFINICOES[e];
