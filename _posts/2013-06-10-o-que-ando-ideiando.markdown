---
  layout: post 
  title: O que ando fazendo nos últimos dias
  categories: [javascript, bliss, code, pense, editor]
---

Estou em uma maratona de estudos e pesquisa muito legal. Este mês estive pegando forte em 
várias coisas que gostaria de fazer e começei a realiza-las.

A primeira delas foi o projeto [bliss] que estou empenhado em algumas noites e madrugadas
tentando criar um game de cognitividade voltado para o aprendizado da linguagem bliss.

Fiz uma série de alterações e melhorias mas acabei por travando em alguns bugs na minha
interface e por fim decidi tomar [outros rumos][milestone] no game. Estive repensando sobre a interface
e decidi migrar o formato do funcionamento para algo mais simples e fácil de alimentar.

### O problema da interface de edição do game

Estive criando uma interface dividindo e classificando o conhecimento de cada nível do jogo da seguinte forma:

Veja o código [aqui][levels].
<pre class="prettyprint">
var levels = [
  {
     title: "Places",
     learn: {
       symbols: [ 'house', 'money', 'God', 'feeling','medicine'],
       combinations : [
        'house and money equal bank',
        'house and God equal church',
        'house and feeling equal home'
       ]
     },
     answer: {
       question: 'house and medicine equal question',
       answer: 'hospital',
       alternatives: ['home', 'church', 'hospital', 'restaurant']
     }
  },...
</pre>

### Soluções temporárias custam caro

Iniciei o desenvolvimento da interface que alimentava cada detalhe do hash de forma que 
ficasse funcional mas não consegui cobrir o conceito e idealizar os componentes
da melhor forma então resolvi mudar. 

Obtive sucesso mas parece que a interface ainda estava com muitas coisas fora do lugar. Não consegui me 
adaptar e aceitar o modelo que estava criando e então decidi usar outro modelo.
Dessa maneira vou perder o trabalho que realizei mas ganhei umas boas  experiências com 
o meteor e jquery.

Agora estou decidido que usarei um framework de testes para me ajudar desde o
início a  criar cada passo da minha aplicação com o Meteor também.

### Não existem soluções definitivas

Sinto que cada experiência decepcionante enquanto aprender errando e também 
um bom caminho para um aprendizado saudável, aprender tentando, o que 
 muitas vezes não é o mais fácil. 
 
Valeu o aprendizado de pensar mais antes de iniciar uma implementação e de
aceitar que muitas vezes o melhor caminho é mudar. Simples assim.

A coisa mais certa deste planeta é que a tecnologia não para, e teremos que nos
adaptar a todo momento a ela. E querer mudar e mudar para melhor. Abraçar a
mudança é uma virtude no ambiente de desenvolvimento, mas deve ser usada
sabiamente.

### Pensando diferente

Estive conversando com o presidente da comunidade mundial bliss symbolics, o 
qual me cedeu as imagens de todos os 5047 símbolos e também está acompanhando e apoiando
as ideias no desenvolvimento do projeto. Seu feedback foi sobre inserir
diferentes conteúdos com temas diferentes então pensei que tinha tudo a ver com
criar um formato mais extensível para o jogo.
Estive extremamente desconfortável como o fato do conteúdo ser estático e penso 
o quão aberto pode ser o software que produzimos se trabalharmos em um modelo
bem elaborado de linguagem.

Dessa forma [criei][issue9] a issue descrevendo como prentendo fazer esta
implementação e mudanças.

### Meus planos com bliss symbolics

Com esta implementação acontecendo estarei criando a primeira introdução ao
bliss symbolics em português esta semana. Pretendo criar uma introdução que mostre
o poder da linguagem cognitiva e lógica e também sempre tentar trazer a questão
participativa pois como o jogo será interativo, então podemos utilizar
de slides interativos e também um guia de busca dos símbolos a qualquer momento.

Para aproveitar tudo que têm de pronto no opensource estou pensando em unir o 
trabalho do [showoff] ou algo inspirado nele. E para edição estou pensando em
usar o [aceeditor] ou o [code mirror].

Existe uma gama de ferramentas excelentes para utilizar e enfim não vale a pena
fazer muita coisa no braço e sem teste. O ideal é fazer boas pesquisas e testar
bem os componentes para usar aqueles que realmente vão fazer a diferença no seu
aplicativo.

# Outras coisas que estou fazendo

Além do bliss, tenho estudado muito outras ferramentas e frameworks. Este mês
também estudei uma nova linguagem: Elixir. Muito legal as ideias e filosofias,
estive realmente empolgado em ver mais uma vez a linguagem mudando minha maneira
de pensar em programação.

## Meteor

Continuo gostando muito do meteor. Este mês até fizemos um [dojo] com o objetivo
de estudar o angular js mas acabamos usando o meteor. Foi muito legal e todos
que não conheciam gostaram da ferramenta.

A coisa mais legal do Meteor pra mim é a velocidade de prototipação. Eu
sinceramente já usei uma série de frameworks mas este framework é muito legal.
Se eu pudesse migrava vários projetos existentes para o modelo meteor. Os
sistemas de publicação de código e a realidade de não precisar MAIS de refresh no browser são
exemplos clássicos de decisões simples que mudam mesmo a produtividade do
programador.

## AngularJS 

Assisti uma série de vídeos sobre o angular js no canal deles no youtube e este
framework é fantástico. Estou usando o meteor js e sinto muitas vezes que as
templates são desenhadas de forma diferente do angular js e muitas vezes o que
eu queria fazer parecia que era mais fácil codificar com angular. Enfim, o
angular js é uma ferramenta promissora que só vai crescer. Acredito no meteor
mas a abrangência do angular é muito mais simples para se implantar em um
projeto enquanto o meteor é mais conveniente para criar projetos novos.

## Peepcode

Este mês reativei minha anuidade do peepcode e assisti uma série de screencasts.

Realmente assistí vários screencasts e tirei os atrasos da série play by play. A
minha série preferida dos screencasts deles.

Uma coisa que gostei muito foi o primeiro screencast com pair programming.
Realmente programadores que fazem pair programming sabem o quão importante é
falar e conversar sobre o código que está sendo produzido.
Sem contar na objetividade do diálogo sobre o domínio de negócio e
desenvolvimento orientado a testes o tempo todo.

## Elixir

Essa linguagem realmente mecheu comigo. Estou disposto a investir um bom tempo
aprendendo [elixir] nos próximos dias. Parece ser muito interessante para uma
série de coisas e estou inteiramente interessado em entrar no mundo das macros e
criar uma DSL com elixir.

Me sinto muito orgulhoso também em saber que a linguagem foi criada por um
brasileiro e isso é muito positivo.

Existe 2 vídeos do Dave Thomas no youtube e uma outra apresentação do próprio
José Valim falando sobre a linguagem no [site][elixir] da linguagem. Vale a pena conferir!


[levels]: https://github.com/jonatas/trybliss/blob/master/server/levels.js
[bliss]: http://github.com/jonatas/trybliss
[issue9]:https://github.com/jonatas/trybliss/issues/9
[milestone]: https://github.com/jonatas/trybliss/issues?milestone=1&state=open
[showoff]: https://github.com/schacon/showoff
[aceeditor]: http://ace.ajax.org
[code_mirror]: http://codemirror.net/
[dojo]: https://github.com/jonatas/dojo-meteor
[elixir]: http://elixir-lang.org
