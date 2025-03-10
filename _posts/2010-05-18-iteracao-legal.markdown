---
title: "Iteração legal"
layout: post
categories: balsamiq mockups prototipo xp usesms iteracao cucumber
description: "Estou muito satisfeito em meu novo projeto de freelancer.  Trata-se de um sistema de Envio de SMS direcionado para pequenas empresas do comércio e relacionam..."
---
Estou muito satisfeito em meu novo projeto de freelancer.  Trata-se de um sistema de Envio de SMS direcionado para pequenas empresas do comércio e relacionamento com o cliente. O sistema está com o background totalmente pronto, assim como API para integração com software de terceiros. Estou trabalhando apenas na interface e em algumas novas funcionalidades.

Estamos utilizando o Balsamiq Mockups para colaborar nas decisões da interface. Prototipamos várias telas do projeto e tivemos várias ideias interessantes. 
Falando em nós, estou falando do meu cliente Edson Lima que está sendo o POD (Product Owner and Developer) deste projeto.

As estórias foram aceitas e a iteração desta semana e começou com poucos ajustes técnicos. 

## Prototipando telas

Criar um protótipo das telas com o cliente torna-se muito interessante pois é possível visualizar a necessidade final do sistema antes mesmo dele existir. 

Conversando e escolhendo cada detalhe da interface trouxe um resultado significativo no final de nossa primeira iteração.

Estamos usando o Balsamiq Mockups para prototipar as telas e é altamente produtivo para criar protótipos e discutir as decisões de leiaute. Em alguns momentos nos pegamos ajeitando "detalhes" desnecessários e criando outras alternativas e utilização de componentes diversos.

![enviarsms]

Criar uma tela limpa, agradável e útil é uma tarefa extremamente difícil. Cada decisão a ser tomada pode corromper as "filosofias" da tela e trazer mais retrabalho. E este é mais um motivo forte para prototipar antes de programar.

Outro ponto importante é a evolução das telas durante a iteração. Por exemplo, nesta iteração decidimos o leiaute e alguns detalhes da interface. Observe a próxima tela. Ela é uma evolução da anterior com leiaute e no momento de busca no sistema:

![busca]

Este exemplo demonstra a evolução da primeira interface em relação a segunda com leiaute e a funcionalidade de busca.

## Utilizando estórias

Em conjunto a tela, vêm a descrição da estória que pretende sanar qualque dúvida quanto aos eventos:

<div><pre class="prettyprint">
# language: pt
Funcionalidade: Enviar mensagem SMS
 Como um cliente 
 Eu quero enviar mensagens SMS
 Para usufruir dos meus créditos

 Contexto:
  Dado que estou logado no sistema
  Então devo ver "Para"
  E devo ver "Texto"

 Cenário: Enviar SMS para um contato
  Dado que digito "4699117879" no "telefone_numero"
  E que digito "Olá do sms!!!" na "mensagem"
  Quando Eu pressionar "Enviar"
  Então devo ver "Mensagem enviada com sucesso"

 Cenário: Não envia SMS sem destinatário ou mensagem
  Dado que digito "4699117879" no "telefone_numero"
  Quando Eu pressionar "Enviar"
  Então devo ver "Erro"
  E devo ver "Mensagem não pode ficar em branco"
</pre></div>

Estes são apenas alguns exemplos da funcionalidade. Logo o UseSMS estará online e será muito parecido com o protótipo desenvolvido. Pelo menos a primeira versão. A evolução das telas e do sistema será feito durante as iterações.

Além das especificações com Cucumber, o sistema está totalmente coberto de specs o que garante a sua consistência. O Edson fez um ótimo trabalho neste projeto e está com um uma média de 2,5 linhas de teste por linha de código. 

Sei que este não é um número confiável, mas trás bastante confiança e muitos exemplos fáceis de se consultar. 

## Métodologia 

Quando vou trabalhar em qualquer funcionalidade já existente sigo os seguintes passos:

* Verifico os specs que compõem cada parte do contexto em que estou desenvolvendo
* Planejo alguns novos specs quando necessário para fazer o sistema falhar
* Implemento as novas modificações e invoco o rspec novamente para validar. 
* Quando os testes passam então rodo toda a bateria de testes para ver se a integridade está ok.
* Passado todos os testes sem erro já posso fazer um commit e reiniciar este ciclo

Embora pudesse usar o plugin "Integration" para automatizar este processo ainda não tenho com quem integrar então estou fazendo manual mesmo.

## Pomodoro 

Outra ferramenta importante para concentração no desenvolvimento têm sido o pomodoro. Tenho utilizado ele para fazer qualquer tarefa objetiva e têm muitos resultados positivos. 

Muitas vezes esqueço de sua existência e me desconcentro pela web, mas tenho procurado seguir a risca com a técnica e têm sido uma experiência válida.

A técnica pomodoro consiste em trabalhar por um determinado tempo com concentração total em atingir o objetivo. Estou usando um programinha que auxilia nesta tarefa, contabilizando os pomodoros que deram certo e errado, assim como os interrompidos.


## O feedback

Muito interessante trabalhar com feedback. Passei um tempo sem este feedback e é realmente desanimante. Nesta primeira iteração, consegui fazer tarefas significativas para o projeto. Isto foi possível por pensar na essência do sistema e priorizar as tarefas certas.

Estamos usando o Pivotal Tracker para controlar as estórias e o GitHub como repositório oficial. Assim tenho sempre qualquer notificação do Edson por email quando faz algum comentário ou adiciona novas informações ao projeto, ou seja: feedback automático.


[enviarsms]: /images/enviar-sms.png
[busca]: /images/busca.png
