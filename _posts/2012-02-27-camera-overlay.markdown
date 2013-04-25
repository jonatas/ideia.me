---
  layout: post
  title: Camera Overlay
  categories: ['android', 'camera-overlay', 'camera', 'app', 'image-filters']
---

 

![logo]

## A ideia

A ideia do [aplicativo][android-market-link] veio de que [tiro diversas fotos da sacada do meu apartamento/home-office][link-album-facebook] e nunca consigo tirar exatamente no mesmo lugar. Pensando em aplicativos para dispositivos móveis, me veio esta *necessidade* de tirar fotos do mesmo lugar reposicionando imagens. Pensando a respeito do assunto, lembrei de uma vez que vi um documentário sobre como as formigas conseguiam voltar pra casa e uma das hipóteses era que ela tinha uma camada de imagem como uma foto sobreposta, que encaixava a "lembrança" sobre a sua própria visão dando os pontos de referência para que voltasse pra casa.

Na época que tive a ideia (5/6/2011) enviei um email para alguns amigos programadores falando sobre o assunto, para desenvolvermos em conjunto um aplicativo que fizesse isso, como objeto de estudo do android e colocarmos um primeiro experimento no [android market][android-market-link]. O [Marlon][marlon] gostou da ideia e então iniciamos o desenvolvimento alguns dias atrás.

## Testando o app

Colocamos a ideia inicial para projetar uma imagem pré-definida e usamos uma foto das fotos tiradas por mim inicialmente do apartamento (veja a foto abaixo). A foto abaixo foi utilizada como base para reposicionar a camera pela primeira vez.

![foto-base]

Logo, alteramos  a foto para ficar transparente e transpusemos o preview da camera com a foto base. Este é um screenshot enquanto estava tentando posicionar a câmera pela primeira vez.

![primeira-sobreposicao]


Percebemos que a foto e a camera eram iguais, o que era óbvio, mas era muito mais confuso ao aproximar-se do momento ideal de tirar a foto, pois a camera e a imagem tornam-se uma e o cérebro confunde se está manipulando a camera ou a imagem. Mas conseguimos tirar boas fotos!


## Primeira Otimização - Negativo da imagem

Um dos maiores problemas de utilizar uma foto base parecida é confundir as cores entre a camera e a realidade, logo, se a foto for muito parecida criamos a opção para utilizar a cor inversa. Este foi o primeiro tratamento eficaz da foto base para ajudar no reposicionamento.

## Segunda Otimização - Quadriculados e com cortes verticais e horizontais

Passado uma noite de bom sono após toda empolgação do novo app, o Marlon chega com novas ideias para ajudar no reposicionamento. Criar cortes trasparentes entre a camera e a imagem de forma que seja possível reposicionar cortes da imagem.

## Resultado da ação em conjunto

Veja a foto do resultado combinado entre o negativo e um quadriculado bem grande.

![negativo]

Nas opções de corte adicionamos quadriculado, corte vertical e horizontal. O tamanho do corte pode ser ajustado alternando entre a transparência e os tipos de corte. Este é um exemplo de corte bem grande então é praticamente um divisor da imagem. Observe que a imagem dividida abaixo não está utilizando o efeito do negativo, logo já torna um pouco mais confuso a identificação nas imagens sobrepostas. 

![normal-cv]

Agora o mesmo caso sem negativo mas utilizando um quadriculado menor também dá para identificar bons pontos de referência.

![quadriculado-pequeno]

## A história do vaso

Resolvemos então escolher outro cenário e tirar uma foto inicial de um vaso de tomates que plantei dias atrás aqui no apartamento para testarmos as características de uma foto com proximidade mínima. Os resultados foram totalmente diferentes e a confusão também foi diferente :D.

### Experiência com foto noturna

Esta é a foto noturna legal e sem fundo, tirada quando chegamos após viagem e o tomateiro estava murcho.

![vaso1]

Duas horas depois de regado...

![vaso2]

Funcionou sem problemas, mas a sobreposição já não ficou boa. O caso é que o vaso é próximo da camera e como falei anteriormente, quanto mais próximo o objeto estiver da camera mais difícil se torna a sobreposição perfeita. Tem alguma coisa a ver com o [erro de paralaxe][erro-paralaxe] do observador ;)

### Experiência com foto a luz do dia

As cores intensas da árvore do fundo e as folhas da planta confundem ainda mais ao tentar a sobreposição.

![vaso3]

### O formato e a cor do objeto de referência

O meu vaso de tomates é de alumínio (na verdade era um balde de gelo :D) e foi muito difícil de utilizar o vaso como referência. As dificuldades de tirar fotos deste balde também tratam-se do ângulo da camera versus a projeção da circunferência do vaso. O alumínio é muito difícil de interpretar e a borda externa para borda interna do ponto de referência e também não dava para saber qual era a camera e qual era a foto base. O negativo não foi o suficiente para o alumínio e então resolvemos criar outros artefatos para suprir este caso.

![vaso4]

Observando as duas fotos, aí está o vaso quadriculado com negativo.

![vasodiaquadriculado]

### O ângulo do ponto de referência


### As cores e a intensidade das cores no entrelaçamento

O difícil para os olhos é encontrar um ponto de referência fácil de idêntificar a imagem de fundo e se esta está ou não totalmente encaixada sobre a camera. Existem duas imagens com 2 fundos distintos, estamos usando transparência e a imagem pode ser até mutável, no meu caso o pé de tomate está em pleno vigor.



### A distância do ponto de referência


Tirar uma foto da paisagem é realmente fácil. As fotos que você tira já tem um reposicionamento mental do lugar onde estava para tirar a foto, então é só ajustar o angulo, a altura e talvez um pouco da distância. Quando o ponto de referência está fotógrafo a precisão do movimento é muito maior, o que significa que centímetros de diferença podem causar um grande deslocamento comparando a original. Concluindo, é necessário você encaixar perfeitamente pra ficar bom.


## Retirando as cores

Observando o caso do vaso de flores, o Marlon deu outra ideia de tirarmos uma das cores bases da foto e assim poderíamos transpor a camera em uma foto sem transparência total, apenas seria transparente nas cores selecionadas. Ficou muito interessante o efeito e também trouxe benefícios para tirar a foto.

### Sem cor vermelho com negativo

![semvermelhonegativo]


## Outras funcionalidades

Além dos efeitos acima mostrados, também criamos opções com alto-contraste, preto e branco, extração de bordas e mudança de cor (matiz). O efeito abaixo é com borda e transparência.

![combordastransparente]

## Outras ideias e futuro

* Quando tirar foto, visualiza fotos mergindo rapidamente alternando sequência de todas fotos tiradas na ordem de data.
* Permite continuar filmagem e selecionar última cena um vídeo.
* Permite escolher configurações avançadas da camera, alteranar cameras.
* Qualificar e selecionar sequência de fotos para gera vídeo
* Gerar vídeo de sequência de fotos

## O futuro

O futuro depende de [quantos aplicativos][android-market-link] iremos vender e qual o feedback recebido dos usuários. Tenho sido um usuário ativo do meu aplicativo e preciso descobrir que não sou o único que irei usá-lo :)


[link-album-facebook]: http://www.facebook.com/media/set/?set=a.1691903151672.87739.1660567052&type=3&l=6db59445b9
[foto-base]: /../../../images/camera-overlay-foto-base.jpg
[primeira-sobreposicao]: /../../../images/camera-overlay-primeira-sobreposicao.png
[negativo]: /../../../images/camera-overlay-negativo.png
[normal-cv]: /../../../images/camera-overlay-normal-corte-vertical.png
[quadriculado-pequeno]: /../../../images/camera-overlay-quadriculado-pequeno.png
[vaso1]: /../../../images/camera-overlay-vaso-1.jpg
[vaso2]: /../../../images/camera-overlay-vaso-2.jpg
[vaso3]: /../../../images/camera-overlay-vaso-dia-1.jpg
[vaso4]: /../../../images/camera-overlay-vaso-dia-2.jpg
[logo]: /../../../images/camera-overlay-logo64.png
[semverde]: /../../../images/camera-overlay-sem-verde.png
[combordastransparente]: /../../../images/camera-overlay-com-bordas-transparente.png
[semvermelhonegativo]: /../../../images/camera-overlay-sem-vermelho-negativo.png
[vasodiaquadriculado]: /../../../images/camera-overlay-vaso-dia-quadriculado.png
[android-market-link]: https://play.google.com/store/apps/details?id=me.ideia.cameraoverlay&feature=search_result#?t=W251bGwsMSwxLDEsIm1lLmlkZWlhLmNhbWVyYW92ZXJsYXkiXQ..
[marlon]: mailto:marlonscalabrin@gmail.com
[link-primeira-sequencia-boa]: http://www.facebook.com/media/set/?set=a.1691903151672.87739.1660567052&type=3&l=6db59445b9
[erro-paralaxe]: http://pt.wikipedia.org/wiki/Erro_de_paralaxe
