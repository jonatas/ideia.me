---
title: "Pessoas, códigos, comunicação"
layout: post
categories: ['pense']
description: "Estou muito feliz por aprender a usar a minha mente de programador para outras coisas que não são programar. Que a mesma clareza que preciso ter para program..."
---
Estou muito feliz por aprender a usar a minha mente de programador para outras coisas que não são programar. Que a mesma clareza que preciso ter para programar posso usar para compor um discurso ou ensinar as pessoas a compreender alguma coisa em específico.

Que com uma boa comunicação e boas analogias é possível trazer compreensão mesmo que superficial para as pessoas mais leigas sobre os assuntos mais complexos.

A linguagem de programação funciona da mesma maneira. Ela só abstrai para não escrevermos códigos de máquina. Então, por que não conseguimos compilar o mesmo código na cabeça de todas pessoas?

Essa semana apresentei um RDTalk intitulado ["Tech for non tech people"](http://www.slideshare.net/jonataspaganini/tech-for-non-techs). E a ideia era explicar um pouco dos termos técnicos do dia a dia dos desenvolvedores para outras áreas da Resultados Digitais, então pensei em praticar mais essas analogias que representassem bem cada cenário e como poderia contar histórias ao invés de simplesmente explicar os termos.

Está difícil de lembrar? Aponte para fatos mais marcantes que sua própria talk!

Pense em como o dia a dia das pessoas podem lembrar os problemas reais.

## O exemplo dos background workers:

Troughput é a medida de capacidade de um determinado recurso. Isso parece
simples e podemos comparar a vazão de um cano. Mas usando um contexto mais complexo de background workers aproveitei para mostrar também filas, workers, jobs e overhead.


Inicialmente fiz uma [evolução das imagens dos slides] para mostrar o exemplo via imagens para mostrar o que era throughput. Mas quando fiz uma piada usando o próprio elevador da RD, o exemplo se tornou realmente remarcante.

![tech-for-non-techs-77-638](/images/tech-for-non-techs-77-638.jpg)


Quando você consegue usar um exemplo de uma experiência já vivida, acredito que facilita muito a assimilação. Todos que estavam lá sofrem esperando todos os dias pela lentidão e limite de pessoas (throughput) de cada elevador. Então quando usei esse exemplo, senti que valeu mais do que toda aquela organização dos slides para mostrar o funcionamento.

Outro aspecto que ficou fácil de entender é o nível de acoplamento de determinados recursos na aplicação, enfim não é fácil de colocarmos um 'terceiro' elevador no edifício. Na aplicação a mesma coisa. Certos recursos acabam se engessando na construção e é mais complexo fazer a substituição ou melhorar significativamente sem grandes mudanças.

Também aproveitei para tentar mostrar um pouco dos principais desafios da
arquitetura enquanto escalando uma aplicação.

![tech-for-non-techs-83-638](/images/tech-for-non-techs-83-638.jpg)

## Exemplo deploy comparando a filme velocidade máxima

Falando do processo de deploy enquanto ensaiava minha apresentação em casa, a Tânia, me perguntou por que era tão perigoso esse processo de deploy?

Todos assistiram ao filme [velocidade máxima](https://pt.wikipedia.org/wiki/Speed_\(filme\)) e essa foi uma boa relação para explicar o processo de deploy.

![tech-for-non-techs-52-638](/images/tech-for-non-techs-52-638.jpg)

Digamos que o [RDStation](http://rdstation.com.br) é o ônibus que não pode
parar, e o deploy é: queremos trocar algumas peças desse ônibus. Então como fazemos para trocar com o ônibus andando?

Transferimos as pessoas de ônibus como no filme do velocidade máxima, sem parar o ônibus.

![tech-for-non-techs-53-638](/images/tech-for-non-techs-53-638.jpg)


## Exemplo do Rollout Gradual a lá deploy canário:

O deploy canário foi inspirado no uso de canários para medir a sensibilidade do ar dentro de espaços de mineração.


Basicamente se o canário morria os operários saiam para não morrer também. A sensibilidade dos pulmões do canário é maior então eles morrem mais facilmente intoxicados.

![tech-for-non-techs-55-638](/images/tech-for-non-techs-55-638.jpg)

Essa história foi um exemplo realmente marcante para mim. Sabia sobre o deploy canário mas acabei ouvindo a história que inspirou o nome apenas esses dias. Isso tornou o contexto ainda mais fácil de lembrar dos perigos e objetivos da história.

E você que tipo de artifícios usa para fazer suas talks? Não deixe de comentar!

