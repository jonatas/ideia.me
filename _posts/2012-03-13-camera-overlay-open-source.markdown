---
  layout: ideiame
  title: Câmera Overlay Open Source
---

# {{ page.title }}

Hoje, eu e o Marlon nos sentimos aptos para abrir a [primeira versão][github] do [Camera Overlay][link-google-play] com o objetivo de seguirmos nossa filosofia [openess] de se ver a vida. Então agora, após algumas boas refatorações no [código][github] liberamos o acesso a versão em andamento.

## Nossos planos

O objetivo é manter uma [biblioteca][github_photo_effects] interessante de efeitos prontos em um sistema que já funciona. Estamos trabalhando de freelancer e essa é uma boa forma de ver nosso trabalho integralmente. O [código][github] está no [github] e a versão real está no [Google Play][link-google-play]. Um link leva ao outro e programadores irão ver o código e acabar baixando o app e curiosos até irão dar uma olhada no código e ver como funciona :D

### Somos empreendedores

Este é um de nossos empreendimentos pessoais que está em pleno vigor assim que nos bate uma folga. Estamos pensando em criar mais uma série de efeitos bacanas e então lançar uma versão PRO que permita faturarmos com o projeto. Enquanto não criarmos esta versão PRO, vamos continuar mantendo todo o código aberto no [github].

Minha vontade é de manter até a versão PRO de certa maneira "aberta".  Estou pensando em como vamos fazer isso de forma consiga faturar... Se você tem uma ideia? por favor deixe seu recado após o sinal!

### Estamos conectados

A cada novo projeto open source no [github], estamos criando mais referências sobre nosso trabalho. Quando eu crio um novo post no meu site ou compartilho algo no facebook/twitter de certa forma estou sempre aumentando meu page-rank. Quando consigo postar coisas que ajudo as pessoas, tenho certeza que de certa forma isso tornao meu trabalho uma *referência positiva* para ela.

### Viva ao open-source

Todos os últimos trabalhos que desenvolvi estão fortemente embasados em opensource. Utilizamos muito mais código alheio e aberto do que construímos e tudo isso foi para faturar nosso próprio dinheiro. Desenvolvemos poucas centenas de linhas e reaproveitamos milhares a cada projeto. 

### Queremos novas ideias

Estamos em busca de construir algo aberto e melhor. Fiquei muito feliz quando soube que o facebook havia aberto sua arquitetura de banco de dados e [tantos outros projetos][github-facebook] que acredito que custaram caro para se construir mas agora podem ser facilmente embutidos em seu sistema com custo zero. 

Percebi claramente que meu objetivo não é comercializar códigos e sim construir projetos de *valor* e com *eficiência*. Observe quantas pessoas contribuiram para o Linux e como hoje conseguimos viver livres de qualquer licensa e sem sistemas da Microsoft ou Apple. Tudo isso foi possível por que pessoas já tinham se desapegado deste interesse em manter tudo fechado.

O próprio [Camera Overlay][link-google-play] só foi [aberto][github] por que encontramos outros exemplos e tutorias de pessoas com interesses em comum e compartilhando informações.

## Abrimos para fazer menos e fazer melhor

A melhor maneira de fazer as coisas acontecer fazendo menos, é conseguir ajuda de outras pessoas. Conheço uma série de bons desenvolvedores que não poderia pagar suas caríssimas horas mas que talvez possa contribuir para um projeto open-source e fazer o meu produto melhor e o dele também. Apesar de não estarmos falando neste caso de um framework open source, um caso que muito me inspira é o Rails e a 37Signals.

Se o DHH não tivesse aberto o Rails como open source, eles teriam um maravilhoso framework ágil na 37signals, e talvez até vendessem como um produto, mas que estaria parado lá na versão 1.2.3 ou menos. Abriram para comunidade e hoje 13 mil expectadores e mais de 2 mil forks. Eu também tenho certeza absoluta que estes 13 mil [expectadores]  também são grandes consumidores dos produtos da 37signals.

E também tenho certeza absoluta que custaria muito caro para 37signals construir o Rails 4 e criar as centenas de plugins que existem abertos.
 
Eu mesmo pago Basecamp a mais de um ano, comprei e li o [rework], mas o despertar de tudo foi quando [baixei gratuitamente][getting_real_pt] e li a [versão traduzida][getting_real_pt] do [Getting Real][getting_real] e *realmente* caí na real, valeu *muito* a pena. Muito obrigado a todos os tradutores, e pessoas que dedicaram suas horas em volta de um conteúdo que trouxe uma qualidade para o desenvolvimento web nacional. 

Li muitos posts no [blog][svn] deles e também me influenciaram a comprar meu primeiro mac ;D e colocaram muitas outras coisas boas na minha forma de pensar. No fim das contas, sou um entre os milhões de consumidores felizes e satisfeitos com os produtos da 37signals. Pago com gosto por um software tão simples e que tem centenas de concorrentes grátis e que prometem funcionalidades muito semelhantes e até mais "completas" ou "robustas".

## Arquitetura Android

Neste [projeto][github], criamos uma [atividade principal] aonde todos os fluxos de controle do aplicativo acontecem. Isolamos apenas os [efeitos][github_photo_effects] que podem ser muito úteis se você está criando um aplicativo que trabalha com tratamento de imagens. Nossa classe de efeitos foi construída para [android][link-google-play] mas são vários exemplos de tratamento de imagem via código.

Logo estaremos criando alguns exemplos específicos sobre tratamento de imagem com as bibliotecas do Android.

## Nos ajude com a tradução do aplicativo

Traduzimos para inglês com nossas próprias experiências com a linguagem, mas para [espanhol] acabamos contando com a ajuda do google :D. Então se você é desenvolvedor e sabe espanhol (ou está morando na argentina :D), chinês ou outra linguagem e quiser contribuir ou sugerir melhorias, envie seu [pull request] pelo [github].

[openess]: http://en.wikipedia.org/wiki/Openness
[link-google-play]: https://play.google.com/store/apps/details?id=me.ideia.cameraoverlay&feature=search_result#?t=W251bGwsMSwxLDEsIm1lLmlkZWlhLmNhbWVyYW92ZXJsYXkiXQ..
[github]: https://github.com/jonatas/CameraOverlay
[github-facebook]: https://github.com/facebook
[post]: /2012/03/07/pequenas-decisoes-grandes-mudancas.html
[github_photo_effects]: https://github.com/jonatas/CameraOverlay/blob/master/src/me/ideia/cameraoverlay/PhotoEffects.java
[svn]: http://37signals.com/svn
[rework]: http://37signals.com/rework/
[getting_real]: https://gettingreal.37signals.com/ 
[getting_real_pt]: http://gettingreal.37signals.com/GR_por.php
[expectadores]: https://github.com/rails/rails/watchers
[atividade_principal]:https://github.com/jonatas/CameraOverlay/blob/master/src/me/ideia/cameraoverlay/CameraOverlayActivity.java 
[espanhol]: https://github.com/jonatas/CameraOverlay/blob/master/res/values-es/strings.xml
[pull_request]: https://github.com/jonatas/CameraOverlay/pull/new/master
