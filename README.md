# SIGAA Repaginado

> **Projeto pessoal de um aluno. Não é oficial** e não tem vínculo com a UNIFEI, com a DTI nem com a UFRN, que desenvolve o SIGAA.

O SIGAA funciona, mas usar no dia a dia é cansativo. As telas foram feitas para monitores de 2008, ficam minúsculas no celular, cada clique pisca a página inteira e as informações importantes ficam espalhadas por menus.

Este projeto é uma prova de que dá para ter uma interface decente **em cima do mesmo sistema**, sem mudar nada no servidor. Ele lê as páginas que o SIGAA já entrega e as redesenha. Os dados continuam vindo do SIGAA, e nada sai do seu aparelho.

<p align="center">
  <img src="docs/capturas/celular-inicio.png" width="200" alt="Tela inicial no celular">
  <img src="docs/capturas/celular-turma.png" width="200" alt="Página da turma">
  <img src="docs/capturas/celular-notas.png" width="200" alt="Notas com gráfico e previsão">
  <img src="docs/capturas/celular-mensagens.png" width="200" alt="Caixa postal">
</p>

<p align="center">
  <img src="docs/capturas/desktop-portal.png" width="820" alt="Portal no computador, tema escuro">
</p>

<sub>As capturas usam dados fictícios.</sub>

## O que muda

**Dia a dia**
- **Início** mostra as aulas de hoje numa linha do tempo, com horário real e "começa em 25 min".
- **Grade semanal** com as aulas em calendário, e exportação para Google Agenda (`.ics`).
- **Atividades e prazos**, com a opção de marcar como feita.
- **Novidades das turmas** desde a última visita.
- **Busca** em todo o menu do SIGAA (`Ctrl K`), com favoritos.
- **Documentos** a um toque: atestado, histórico, declaração de vínculo e comprovante.

**Notas e frequência**
- **Notas do semestre** com previsão pela regra da UNIFEI: o resultado é a média das unidades, e a recuperação substitui a menor nota. Mostra quanto falta para a média 6.
- **Gráfico de média por semestre** e simulador de média.
- **Faltas por disciplina**, com medidor na página de frequência.
- **Aviso quando sai nota nova**: o app busca as notas sozinho e notifica.

**Turmas e mensagens**
- **Aulas** em cartões, com o botão "baixar todos os materiais".
- **Caixa postal** legível, com etiquetas e indicação de não lidas.
- **Conflitos de horário** destacados em tabelas de matrícula e comprovante.

**Interface**
- **Temas** claro e escuro, seis cores de destaque e três tamanhos de texto. O contraste segue o WCAG AA.
- **Visual inspirado no Nothing OS**: fonte em matriz de pontos, animações curtas e nada de página piscando.
- **Telas pensadas para o celular**, com navegação inferior, menus em gaveta e tabelas viradas cartões.
- **Tela própria** quando o SIGAA cai ou a internet falha, mostrando a última versão salva.

**Só no app Android**
- **Login com digital**: a senha fica no Keystore do aparelho, protegida por biometria.
- **Sessão renovada** enquanto o app está em uso. O SIGAA desloga com 25 minutos parado.
- **Lembretes** 10 minutos antes da aula e na véspera de prazos.
- **Widget** "próxima aula" na tela inicial.
- **Bloqueio do app** com digital, opcional.
- **Atualização automática sem reinstalar**: mudanças de interface chegam como um pacote assinado, aplicado na próxima abertura, sem instalador, sem Play Protect e sem verificação do fabricante. Só mudanças na parte nativa pedem um APK novo, avisado por notificação.

## Em desenvolvimento

**Novos temas, cada um com a sua filosofia de design.** Não é só trocar cor: cada tema muda a tipografia, as formas, as animações e o "jeito" da interface.

- **Minimalista**, o atual: inspirado no Nothing OS, com matriz de pontos, monocromático e um único acento.
- **Temas por curso, já disponíveis** (engrenagem › Estilo):
  - **Terminal**, de Engenharia de Computação: fósforo verde e prompt.
  - **Osciloscópio**, de Engenharia Elétrica: grade de divisões e traço ciano.
  - **Prancha técnica**, de Engenharia Mecânica: papel azul de projeto e cotas.
  - **Canteiro**, de Engenharia Civil: concreto e faixa de obra.
  - **Kanban**, de Engenharia de Produção: post-its e caneta.
  - **Lousa**, de Física e Matemática: giz e quadro branco.
  - **Painel CLP**, de Controle e Automação: diagrama ladder e LED.
  - **Curvas de nível**, de Engenharia Ambiental e Hídrica: mapa topográfico.
  - **Cristal**, de Engenharia de Materiais: rede hexagonal.
  - **8-bit**, de Ciência da Computação e Sistemas de Informação: fliperama.
  - **Solar**, de Engenharia de Energia: raios de sol.
  - **Tabela periódica**, de Química: elementos.
  - **Planilha**, de Administração: células e fórmulas.
  - **Clássico**: as cores do SIGAA de sempre, só que com espaçamento, contraste e fonte legível. Uma cutucada carinhosa.
- **Piadas e segredos de cada área**: cada tema tem o seu comando do dia, textos para telas vazias, log de carregamento e um segredo escondido. Dica: insista no logo.
- **Outras linhas**: brutalista, retrô (anos 90 e pixel art), editorial (como revista), alto contraste e AMOLED (preto puro, que poupa bateria em telas OLED).
- **Mais cores de destaque**, inclusive uma cor por disciplina na grade semanal.

Quer ver o seu curso ou um estilo aqui? Abra uma [sugestão](../../issues/new?template=sugestao.yml). Quem quiser desenhar um tema também é bem-vindo: um estilo é um bloco de tokens (cores, fontes, cantos e padrão de fundo) em `src/entrypoints/content/style.css`, mais algumas regras próprias. O Terminal serve de exemplo.

## Como usar

### App Android
Baixe o `.apk` da [última release](../../releases/latest) e instale. Talvez seja preciso permitir a instalação de fontes desconhecidas. As próximas versões chegam pelo próprio app.

### Extensão (Chrome, Edge, Vivaldi, Brave)
1. Baixe o `sigaa-repaginado-*-chrome.zip` da [última release](../../releases/latest) e descompacte.
2. Abra `chrome://extensions`, ligue o **Modo do desenvolvedor** e clique em **Carregar sem compactação**.
3. Selecione a pasta descompactada e abra o SIGAA.

### Firefox (computador e Android)
Use o `sigaa-repaginado-*-firefox.zip`. No computador, carregue-o pelo `about:debugging`, em "Carregar extensão temporária".

Se algo não aparecer, o botão **Ver original** volta para o SIGAA de sempre.

## Como funciona

```
SIGAA (HTML do servidor) ──► adaptadores ──► dados tipados ──► interface React
        ▲                    src/adapters     src/domain        src/ui
        └──── cliques e formulários continuam sendo os do próprio SIGAA
```

- **Sem servidor próprio e sem API.** O SIGAA é JSF: cada ação é um `POST` com estado de tela. Em vez de reimplementar isso, a interface nova chama os mesmos links e formulários da página original, que fica escondida por baixo.
- **Detecção por DOM.** A mesma URL serve páginas diferentes, então cada adaptador reconhece a sua página pelo conteúdo (`#relatorio-cabecalho`, `#linkNomeTurma` etc.).
- **Isolamento.** O SIGAA carrega Prototype.js, que reescreve `Array.prototype.reduce` e `Array.from`. Por isso a interface roda num `iframe` com um realm de JavaScript limpo e lê o documento do SIGAA de fora.
- **Sem piscar.** Um script em `document_start` esconde o SIGAA original e pinta a cor do tema antes do primeiro quadro.
- **App Android.** É um WebView nativo em Java, sem Capacitor e sem framework, que injeta o mesmo pacote de JavaScript da extensão.

## Por que não está na Play Store

É uma escolha, não um descuido:

- **Não é oficial.** As lojas exigem que um app que usa o nome de uma instituição seja publicado por ela ou com autorização dela. Este projeto existe justamente para mostrar à UNIFEI o que é possível; a publicação oficial, se acontecer, cabe a ela.
- **Atualiza mais rápido fora da loja.** O app já recebe atualizações da interface sozinho (veja abaixo), sem esperar revisão de loja a cada correção.
- **Custo e burocracia.** Conta de desenvolvedor paga, verificação de identidade e revisão a cada versão não fazem sentido para um projeto pessoal e gratuito.

Por isso o Android pede para "permitir fontes desconhecidas" e o Play Protect pode mostrar um aviso na primeira instalação. Esse aviso aparece para qualquer app instalado fora da loja, não só para este.

## É seguro?

Nenhum software tem risco zero, mas dá para conferir tudo o que este faz:

- **Código aberto.** Tudo o que roda no seu aparelho está neste repositório. O APK e as extensões das [releases](../../releases) são gerados a partir dele.
- **Seus dados vão só para o SIGAA.** O app abre apenas `sigaa.unifei.edu.br` e `sigadmin.unifei.edu.br` (caixa postal). Seu login e suas páginas vão direto para o SIGAA, como no navegador; nada passa por servidor do projeto. Fora isso, ele só consulta as releases deste repositório no GitHub para saber se há versão nova.
- **Permissões mínimas.** Internet, notificações (lembretes de aula e prazo), biometria (bloqueio opcional) e instalar atualizações. Não acessa contatos, arquivos, localização, câmera nem microfone.
- **Senha só se você pedir.** Fica cifrada no Android Keystore, só é liberada pela sua biometria e só é usada para preencher o login do próprio SIGAA.
- **Atualizações assinadas.** Cada APK é assinado com a mesma chave; o Android recusa instalar por cima uma versão assinada por outra pessoa. As atualizações da interface que chegam sem APK também são assinadas, e o app confere a assinatura e o hash antes de usar. Se o pacote não bater, ele é descartado.
- **Sempre dá para voltar.** O botão **Ver original** mostra o SIGAA de sempre, e desinstalar o app não mexe em nada na sua conta.

Se encontrar algo estranho, use **Relatar problema** dentro do app ou abra uma [issue](../../issues).

## Privacidade

- O projeto não coleta dados e não usa analytics.
- A única exceção é o **Relatar problema**: só quando você toca em enviar, o texto que você escreveu vai, junto com versão, tela e tema, para um pequeno serviço (`relatos/`) que o transforma em issue pública aqui no GitHub. Nada é enviado sem você pedir, e não vai nome, matrícula nem nota.
- Notas, favoritos e preferências ficam no `localStorage` do seu aparelho.
- No app, a senha só é salva se você pedir. Ela fica cifrada no Android Keystore e só é liberada pela sua biometria.

## Desenvolvimento

Requisitos: Node 20+. Para o app, também JDK 17 e Android SDK.

```bash
npm install
npm run dev              # extensão com recarga automática (Chrome)
npm run build            # extensão para Chrome
npm run build:firefox    # extensão para Firefox
node scripts/build-android.mjs
cd android && ./gradlew assembleRelease
```

```
src/
  adapters/   leitura do HTML do SIGAA → dados
  domain/     tipos e regras (horários, notas, calendário .ics)
  ui/         interface React + Tailwind
  app/        ponte entre a página do SIGAA, o iframe e o Android
  entrypoints/content/   script da extensão, CSS e anti-flash
android/      app Android (WebView, biometria, lembretes, widget)
```

## Limitações

- Feito e testado com o SIGAA da **UNIFEI**. Outras instituições que usam SIGAA podem funcionar em parte.
- Se o SIGAA mudar o HTML, algum adaptador pode quebrar. Nesse caso, a página cai para o visual original.
- Os horários M2–M5 e T1–T4 vêm da tabela do SIGAA. M1, T5 e os da noite ainda são estimados.

## Licença

[MIT](LICENSE). Use, copie e adapte à vontade.
