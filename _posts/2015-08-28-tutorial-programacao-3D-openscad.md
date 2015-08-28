---
  layout: post
  title: "Programação 3D com OpenSCad"
---

Estou impressionado com o OpenScad. Conheci essa ferramenta na Trilha de
Impressão 3D no TDC de São Paulo esse ano. Com certeza posso dizer que foi um
presente para mim pois até agora não havia conseguido me apegar em nenhuma
ferramenta visual para criar objetos em 3D.

Já estou com meu syntax highlight rolando para programar em 3D no VIM e agora
posso desenvolver minhas ideias com uma ferramenta simples e intuitiva.

Meu site não é um agregador de tutoriais, mas estou apaixonado por essa
ferramenta então vou mostrar os primeiros passos para programar em 3D com ela.

## Download

Baixe o openscad de sua maneira favorita. A minha no Mac OSX é via `brew cask`.

    brew cask install openscad

Ou via linux

    sudo apt-get install openscad

Mas você pode entrar no www.openscad.org e baixar o zip também.

## Explorando as formas

Lembra das formas básicas da geometria? cubo, esfera, cilíndro. Elas estão fácilmente disponíveis no OpenScad para serem usadas de diversas maneiras para construir seu objeto.

Por exemplo. Para construir uma simples esfera, eu apenas preciso passar o
tamanho do raio:

```openscad
sphere(r=2)
```

O código acima cria uma esfera como a imagem abaixo exibe na prática rodando
dentro do openscad.

![Esfera com raio de 2 milímetros](/images/sphere2mm.png)

Observe nas reguas laterais estamos trabalhando com uma esfera de 1 milímetro.

Observe a escala de definição:

![Esfera com raio de 3 milímetros](/images/sphere3mm.png)

Ela não posssúi definição por isso é um objeto de poucas faces. Se aumentar o
raio do objeto, a resolução da esfera vai ter uma qualidade maior.

![Esfera com raio de 6 milímetros](/images/sphere6mm.png)


## Navegando no espaço

Legal, nada de muito novo criar uma esfera. Vamos explorar o espaço.
Se criarmos duas esferas, não poderemos ver elas pois estarão uma sobre a outra
então é necessário "transladar" para outro espaço.

A função `translate` recebe um array com `[x,y,z]` direções. No exemplo abaixo
vamos apenas transladar em x para fazer outra esfera menor ao lado.

![Transladando a segunda esfera com raio de de 3 milímetros](/images/sphere5translate5sphere3.png)

Uau! Agora imagina que você pode combinar movimentos, formas e tamanhos!?

Tudo isso é possível usando funções incrementais. O objeto vai sendo
transformado, transladado, escalado conforme as funções vão sendo chamadas em
sequência enquanto não encontrar o `;`.


## Usando repetição

A estrutura básica do `for` é bem semelhante as linguagens convencionais e aceita um range de valores como parâmetro, ou ainda um próprio array. A sintaxe é: `for (indice = [comeco:fim])` para usar com ranges. Veja como é simples de adicionar uma estrutura de repetição aqui:

```
for (i = [5:1]){
  translate([i*2,0,0])
    sphere(r=i);
}
```

![Criando 5 esferas e transladando com um for repetitivo](/images/sphere_for_1_5.png)

Uau, veja que a peça acima parece uma gota, mas também lembra um pião. Então
vamos tentar produzir um peão.

## Criando meu pião de brinquedo em 3D

Bom para terminar o peão apenas temos que aumentar o tamanho. Penso em fazer de
um tamanho parecido com da [moeda de 25
centavos](https://pt.wikipedia.org/wiki/Moeda_de_vinte_e_cinco_centavos_do_real),
, com 24 mm.

![Esfera transladando e 1 a 24 milímetros](/images/sphere_translated_24mm.png)

Adicionando um cilíndro na ponta para poder girar o pião na mão.

![Esfera transladando e 1 a 24 milímetros com cilíndro](/images/sphere_translated_24mm_2.png)

## Usando subtração de formas

Uma coisa extremamente explorada em desenho 3D é a subtração de fórmas, então
no meu caso eu quero abrir um furo para passar um prego e potencializar a ponta
do peão como é um peão de madeira. Imagina que vou usar um prego `17x27mm` então
vamos abrir um furo de `2.7mm` de diâmetro que atravesse o peão inteiro.

Esse furo nada mais é do que a remoção de um cilíndro de `2.7mm` de raio do
centro.

Então é só aplicar a função `difference` para obter o objeto com a diferença dos objetos em questão.

A função difference aceita múltiplos objetos, então é possível construir um objeto complexo e remover algo dentro dele. Apenas a última expressão é entendida como o objeto que será removido.

![Esfera com difference abrindo um espaço para passar o prego com cilíndro](/images/piao_final.png)

Bom, nosso primeiro objeto está disponível opensource. Baixe, altere, compartilhe, imprima! Crie e distribua!

Ficou curioso?

Acesse o [manual do usuário do OpenSCad](https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/) que tem exemplos muito mais ricos e fantásticos do que os apresentados aqui :)

