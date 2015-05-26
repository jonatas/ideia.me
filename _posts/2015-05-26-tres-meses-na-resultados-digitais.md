---
  layout: post
  title: Três meses na Resultados Digitais
---

Dia 23 completei três meses na Resultados Digitais.

Três meses que moro em floripa. Três meses que aprendi a adorar o clima litorâneo.

Estou muito feliz por estar aqui. A vida na praia tem um clima diferente. Incrivelmente me sinto mais livre aqui.

O trabalho também está sendo muito legal, e este post é mais uma reflexão sobre como está sendo minha vida na Resultados Digitais.

## Team A

Faço parte de um [Team "A"](http://shipit.resultadosdigitais.com.br/time/) e estou aprendendo muito com eles. Estou gostando de fazer parte de uma equipe maior, estamos em mais de 30 pessoas em 6 equipes. Então sempre é possível aprender mais e ver uma ótica diferente de outros programadores.

Dentro dos times, faço parte de uma equipe que fica mais focada nos problemas de performance e escalabilidade do produto. Está sendo uma experiência incrível para mim, pois estou tendo desafios bem diferentes dos que tive antes em outras aplicações. Até escrevi no blog do [shipit](http://shipit.resultadosdigitais.com.br) sobre algumas [dicas para migrações eficientes com ActiveRecord](http://shipit.resultadosdigitais.com.br/blog/dicas-para-migracoes-eficientes-com-active-record/).

## Out teach

Outra coisa muito massa aqui na RD é o incentivo para aprender e ensinar. [Out teach](http://www.slideshare.net/resultadosdigitais/culture-code-resultados-digitais/43) é um valor do [código de cultura da RD](http://resultadosdigitais.com.br/blog/culture-code-rd/), e isso possibilita estar sempre aprendendo em workshops e palestras internas.

Também somos muito incentivados a participar de eventos e compartilhar nossos conhecimentos publicamente. Eu tive o prazer de palestrar com o [@andrehjr](https://twitter.com/andrehjr) no [TDC aqui em floripa](http://www.thedevelopersconference.com.br/tdc/2015/florianopolis/trilha-cloud-computing). Foi muito legal, pois, além de nós, os [RDevs](http://shipit.resultadosdigitais.com.br/time/) deram [7 palestras em 5 trilhas](http://shipit.resultadosdigitais.com.br/blog/resultados-digitais-no-tdc-floripa-2015/) além de participar do evento.


## Code Review

Falando em ótica diferente, estou apaixonado pela prática do code review. Code review pra mim é **uma consultoria particular especializada para me fazer um programador melhor**.

Cada vez que recebo um feedback num pull request aprendo a ser um programador melhor.

Cada vez que encontro um problema ou tenho uma ideia para dar no código dos outros devs dou um feedback.

Esse processo se torna muito legal pois você aprende e ensina diariamente. Além de poder expor ideias ou mesmo alertar sobre possíveis falhas e inconsistências.

O code review tem valor se for feito com muita atenção e alto nível de criticidade. Existem muitos detalhes ou complexidades do código que podem tornar a revisão difícil e demorada. Porém uma revisão eficiente pode melhorar o algorítmo e o programador em vários níveis _e o produto também, que tal?_.

Esses dias achei muito legal que em um feedback de release escutei o [@joaohornburg](https://twitter.com/joaohornburg) falando: "vamos começar desconfiar de pull requests que forem revisados e não encontrarem nenhum problema". Em outras palavras, sempre é possível melhorar.

Pra mim o code review tem sido uma das experiências mais valiosas e interessantes tanto para a minha melhora contínua quanto para maior qualidade nas entregas. Esse é o recado: **Pratique code review ;)"**

## __Pair programming__

__Pair programming__ é a prática de programar em par, usando um computador para dois programadores. Eu gosto muito deste formato de interação para construção de código pois sempre sai um código melhor. Sempre é possível planejar e executar ideias melhores em dois do que sozinho.

Fazendo uma correlação com o tópico anterior, observei que mesmo fazendo __pair programming__, que já ajuda muito para construir um código melhor, o code review tem um papel diferente e que muitas vezes pode trazer novidades e melhorias que os 2 devs não enxerguem.

Estou pareando bastante nos últimos dias. Isso me deixa muito feliz pois gosto muito de conversar e trabalhar em conjunto nas ideias. Além de poder passar e receber mais conhecimento. Sempre aprendemos tricks que agilizam o flow com as ferramentas dos coleguinhas.

Dentre as principais mudanças que aconteceram no meu flow de desenvolvimento depois que entrei na RD, as mais legais que aprendi com a galera da empresa ou fui inspirado por eles foram:

* Me adaptar a usar [tmux](http://tmux.sourceforge.net/)
* Migrar definitivamente para o [iTerm](https://www.iterm2.com/)
* Sair do [screen](http://linux.die.net/man/1/screen) e ir pro [byobu](http://byobu.co/)
* Abandonar de vez o [sh](http://www.gnu.org/software/bash/) e só usar [zsh](http://www.zsh.org/) para terminal shell
* Organizar VM's com [vagrant](https://vagrantup.com)
* Usar uns [plugins mais decentes pro VIM](https://github.com/astrails/dotvim)
* Migrar pro vim com [janus](https://github.com/carlhuda/janus)
* Usar [boxen](https://boxen.github.com/) / [vagrant](https://www.vagrantup.com/) ao invés de gambiarrar a máquina

## BDD e CI

O desenvolvimento orientado a testes ou __Behaviour Driven Development__ (BDD) é uma das técnicas de programação que mais tranquilizam os finais de semana e as noites de sono de um programador. Na [Resultados Digitais](http://resultadosdigitais.com.br) fiquei muito feliz com o capricho e a seriedade que é levado o branch master no git do [rdstation](http://rdstation.com.br) _que tal um exemplo do que seria "levar o master a sério?". Acho que pra quem não trabalha aqui, isso pode não ficar claro -- talvez finalizar o próximo parágrafo dizendo: "e só com os testes passando é que mergeamos com o branch master. Isso é levá-lo a sério"_. Também temos [integração contínua](http://en.wikipedia.org/wiki/Continuous_integration) (CI) e isso significa que várias pessoas compartilham o mesmo código e diariamente criam e compartilham novas funcionalidades e alterações.

Dessa forma, para compartilhar essas funcionalidades e progredir com segurança, existe uma bateria de testes que verifica se o funcionamento está conforme o esperado em cada parte do código até a funcionalidade como um todo. Quando uma nova parte é integrada, todos os testes são verificados e se nenhum código quebrou ou teste falhou, podemos saber que o código que está sendo criado está consistente e não corrompe as funcionalidades atuais.

Parece fácil, mas não é. Na prática essa é a primeira equipe que eu trabalho que consegue levar o processo contínuo de forma integrada.

Isso tudo é muito inspirador e só tenho a dizer muito obrigado :)
