---
  title: Como foi a Rails Rumble 2012
  layout: ideiame
---

# {{ page.title }}

Como postei [minhas ideias sobre rails rumble] a alguns dias atrás, agora realmente podemos falar do [churumelas], pois assim foi batizado. Após pouco tempo pensando no nome lembrei desta expressão que pra mim sempre tem um sotaque nordestino de ser.


## A preparação

Durante vários dias fiquei meio que durmindo / sonhando que estava programando no [rails rumble] as decisões que teria que tomar nas 48 horas do [evento][rails_rumble]. Me senti extremamente tentado a fazer os [codes][churumelas_github] antes de iniciar o desafio mas me senti totalmente cumplice de que queria fazer o code por inteiro e ficaram apenas para os sonhos.

No dia das crianças foi uma maravilha pois com o feriado eu consegui dormir bem e a tarde me concentrei em me ambientar e ler todas as regras e posts sobre o rais rumble. 

A tarde me encontrei com a [Eliége Jachini][eliege_jachini] e começamos a pensar sobre como organizaríamos os passos e as imagens que ela criaria para montar as fases e fazer o setup do jogo. 


Foi muito divertido e gratificante poder usar o Linode e os scripts mágicos para fazer o setup do ambiente. Foi realmente rápido. Executou, criou o banco, gerou as permissões e consegui dar o cap deploy na sequência com sucesso. 

## A produtividade

Pra mim a produtividade é sinônimo de foco + concentração. Quase sempre tento me desafiar a fazer uma coisa por vez. Apesar das palavras serem muito parecidas, para mim elas se complementam.

Não acredito que pessoas que conversam ou se envolvem simultâneamente com outras coisas enquanto intensionadas em resolver problemas de programação consigam realmente ter o foco no trabalho. Sabemos o quanto o stream da mídia flui e podemos ficar o dia todo passando por coisas improdutivas e conversando com pessoas assim.

No momento em que estive no desafio, tentei me concentrar em fazer uma tarefa por vez. 
Estava realmente ancioso em meio a tantas coisas para fazer e como programador solo tive que várias vezes alternar entre tarefas que não estavam dando certo para dar uma relaxada e cumprir mais alguns passos.


### trabalhar cansado vs efetividade

O que realmente vale pra mim neste evento é mostrar pra mim mesmo que sou capaz de produziar alguma ideia em um final de semana. Fazer uma equipe dormir apenas 4 ou 6 horas durante o período é pura perca de tempo.

Durante toda a competição fiz sessões de no máximo 7 horas com intervalos regulares e vários alongamentos. 

Primeira sessão foi das 21:00 até as 03:35 da manhã, e neste dia as minhas principais tarefas concluídas foram:

* Iniciar o sistema de desafios
* Criar um novo game e passar de desafio
* Criar 2 desafios iniciais
* Setup Linode
* Setup Capistrano

E sempre achei 7 horas de desenvolvimento contínuo algo realmente tenso. Paramos por aqui e demos sequência as 9:00 da manhã com um pouco de descanso merecido. 

### Experiências novas

Experiências são o nosso portfólio e é muito legal ver como as experiências positivas trazem confiança e produtividade. E esse rails rumble foi assim:

#### Coffeescript maravilha

Apesar de pouco explorado, consegui sem muitos erros implementar todo o funcionamento do javascript em coffeescript e foi muito divertido. 

A beleza do código está na maneira como pensamos e organizamos nossas ideias. O coffeescript nos dá uma liberdade de criar uma bela semântica. Realmente tive boas experiências com o coffeescript neste projeto. Não passaram de [10 linhas] mas valeu a pena por simplesmente ter funcionado. 

#### Cap deploy + Passenger

Usei o script fornecido na railsrumble e simplesmente funcionou. Tive apenas que alterar o hostname e as configurações do repositório.

### Bateria de testes

Outro aspecto que me deixou muito revoltado foi o fato de que sempre uso rSpec em meus aplicativos, mas desta vez decidi que iria seguir com Test Unit. 

Neste momento realmente entendi por que o Rails e tanta gente não migra os seus testes para specs com rSpec. O negócio é lento demais.

Após usar intensamente o test case do rails decidi que abandonarei o rspec para rails. Simplesmente a integração destes frameworks parece que ainda está com algum tipo de problema.

Fiz várias tentativas com o spork e também com o guard-rspec, mas percebi que efetivamente não funcionava. Qualquer hello world do rspec com rails demora 5 segundos ou mais. Enquanto no test unit a velocidade foi muito gratificante mesmo.

Trabalhar com testes definitivamente exige que o framework e o setup seja ágil. Segui várias indicações para rodar os specs de maneira rápida mas realmente não funcionou. Estou literalmente voltando para o Test Unit e meu motivo foi simplesmente experimentar o velho de novo :D

### Sprint.ly

O rails rumble este ano teve uma série de patrocinadores legais e um eles era o sprint.ly. Decidi usar desde o início e foi bacana. Eu e a [Eliége][eliege_jachini] integramos todas nossas tarefas com o github e o [sprint.ly].

#### Integração entre o Sprint.ly e o GitHub não funcionou

A única coisa que fiquei decepcionado foi conectar ambas e não conseguir criar a correlação automática de tarefas. Para mim era uma questão automática mas não funcionou. A [Eliége] seguiu fielmente relacionando praticamente todos os [commits]  mas a ferramenta não correspondeu :(. Mesmo assim tentamos manter sempre atualizando as tarefas que estavamos trabalhando.

## As fases

Antes de iniciar o projeto, imaginava que iria conseguir desenvolver no mínimo uns 25 ou 30 desafios. No final das contas acabei me enrolando com alguns detalhes e ficaram apenas 6. Durante o período que pensei nas [fases] estive certo que iria conseguir criar coisas simples e objetivas mas acabei passando um bom tempo [refatorando] para que fosse fácil adicionar novas. 

Inicialmente planejei, resposta exata: string contra string. Depois expressão regular, e depois validação de códigos reais.

No fim decidi que o modelo [mais simples][game-challenge] e que cobriria todos os outros era o terceiro, pois só precisava direcionar as fases para simplesmente levantar excessões e poder consultar então o andamento do jogo.


## O sistema de pontuação

O sistema de pontuação a única parte que planejei e pensei muito e na hora da pressão não consegui identificar o motivo pelo qual os pontos não funcionaram como eu esperava. Meus testes ficaram mal planejados pois nos testes a pontuação funcionou realmente. Mas acabei deixando esta funcionalidade por último de medo de que não conseguisse criar um painel de score legal a tempo. 

### E agora?

Conforme meu hackzinho abaixo gostaria de agradecer especialmente ao: 

![hack-1]

Conforme vocês podem ver, eu, meu primo Lucao, o Marlon meu compa{rsa,dre} de programação, meu irmão  e alguns outros desconhecidos fizeram o desafio alterando seu nome até a fase final. Realmente sendo coerente e utilizando os desafios.

Se você cumpriu os desafios do [churumelas] e ainda der tempo [vote] no site e deixe seu comentário /(des)?construtivo/, estou aguardando por isso!


[minhas_ideias_sobre_rails_rumble]: /2012/10/01/rails-rumble-ideias.html
[churumelas_github]: https://github.com/railsrumble/r12-team-370/ 
[churumelas]: http://churumelas.r12.railsrumble.com/
[vote]: http://railsrumble.com/entries/370-churumelas-small-challenges
[rails_rumble]: http://railsrumble.com/
[hack-1]: /../../../images/hack-1.png
[eliege_jachini]: http://eliegejachini.blogspot.com/ 
[elige]: http://twitter.com/eliegejachini
[commits]: https://github.com/railsrumble/r12-team-370/commits/master
[fases]: https://github.com/railsrumble/r12-team-370/tree/master/app/challenges
[refatorando]: https://github.com/railsrumble/r12-team-370/commit/7722fbea2a884d26ef8bc75bdb1744a94ab8109e
[gamechallenge]: https://github.com/railsrumble/r12-team-370/blob/master/app/models/game_challenge.rb
[sprintly]:http://sprint.ly
[10_linhas]: https://github.com/railsrumble/r12-team-370/blob/master/app/assets/javascripts/game.js.coffee
