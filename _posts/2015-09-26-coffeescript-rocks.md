---
layout: post
title: Coffeescript rocks
categories: ['pense', 'linguagem','coffeescript']
---

Eu sou um fã de CoffeeScript e gostaria de mostrar alguns exemplos que me fazem
lembrar que nunca mais vou escrever nenhuma linha de javascript puro.

Primeiramente eu não gosto de ficar repetindo as coisas e coffee é tudo de bom
pra fazer isso. No javascript tem um monte de parênteses e chaves
arbitrários porém acabam sendo mais chatos e deixam o código um pouco mais
denso.

Coffeescript é uma linguagem que idealiza várias ideias que me atraem.

- Simplicidade
- Confidência
- Minimalismo

Vou citar caso a caso as coisas que mais gosto. Todas elas são complementares e
ajudam a manter a facilidade. Coffeescript é javascript. Logo tudo que estou
fazendo é usar o transpilador para gerar o código final em js.

Se você curtir, vai copiando e colando os exemplos no [j2.coffee](http://js2.coffee/).

## Função

Em javascript teríamos:

<pre class="prettyprint javascript">
maisUm = function(n) { n + 1 }
</pre>

Em coffeescript temos:

## funções

Então não precisa de `function` nem `{}`:

<pre class="prettyprint coffeescript">
maisUm = (n) -> n + 1
</pre>

## Indentação inteligente

As chaves não são substituídas por um código indentado. Isso quer dizer que
você vai usar espaços ao invés de chaves para todos lados.

<pre class="prettyprint coffeescript">
maisUm = (n) ->
  n + 1
</pre>

Se a função for complexa a identação vai expandindo e fica fácil de entender o
contexto.

<pre class="prettyprint coffeescript">
parOuImpar = (n) ->
  if n % 2 is 0
    'par'
  else
    'impar'
</pre>

Também é possível fazer _inline_ com `then`.

<pre class="prettyprint coffeescript">
parOuImpar = (n) -> if n % 2 is 0 then 'par' else 'impar'
</pre>

Essas opções _inline_ são muito interessantes para explorar pois elas podem ser
combinadas e gerar um código bem compacto e com bastante significado.

Por exemplo, vamos combinar a função de par ou impar para iterar sobre um array:

<pre class="prettyprint coffeescript">
classificarParOuImpar = (array) ->
  for n in array
    if n % 2 is 0
      'par'
    else
      'impar'
</pre>

## Inline

A função acima, irá retornar um array de strings 'par' ou 'impar'. Se fosse
escrever inline seria:

<pre class="prettyprint coffeescript">
classificarParOuImpar = (array) -> if n % 2 is 0 then 'par' else 'impar' for n in array
</pre>

## Multiplas atribuições

As múltiplas atribuições já existem no javascript e não há nada de novo nisso.
No entando o coffeescript tem a sua própria maneira de fazer.

Isso é muito interessante o quão simples torna as atribuções. Exemplo de
atribuição sequencial:

<pre class="prettyprint coffeescript">
a = 1
b = 2
</pre>

Então em uma linha atribuindo múltiplas variáveis ao mesmo tempo:

<pre class="prettyprint coffeescript">
[a,b] = [1,2]
</pre>

## Multiplas atribuições de hashes

As atribuições também funcionam para hashes.

Esse é um dos meus preferidos, principalmente pela simplicidade de extrair
atributos. Imagina o seguinte código:

<pre class="prettyprint coffeescript">
peso = pessoa.peso
altura = pessoa.altura
idade = pessoa.idade
</pre>

Escrevendo em uma linha:

<pre class="prettyprint coffeescript">
{peso, altura, idade} = pessoa
</pre>

Agora, se você estiver super empolgado após usar as variáveis acima
e quiser retornar um hash modificado com as medidas normalmente iria fazer:

<pre class="prettyprint coffeescript">
{peso: peso, altura: altura, idade: idade}
</pre>

Mas você pode simplificar ainda mais usando a seguinte sintaxe:

<pre class="prettyprint coffeescript">
{peso, altura, idade}
</pre>

Eu acho interessante a ideia de ter apenas uma maneira de se escrever um código
mas gosto dessas variações que simplificam e minimizam a linguagem em si.

Acredito que as declarações como  `{a: a, b: b}` são repetitivas e
desnecessárias: Entendendo que `{a,b}` irá gerar exatamente isso, consigo
manter um código mais limpo e menos verboso. Eu sinceramente gosto muito disso.

### Parâmetros se transformando em atributo de acesso

Em um exemplo simples poderia escrever:

<pre class="prettyprint coffeescript">
class Pessoa
  constructor: (nome) ->
    @nome = nome
</pre>

Eu posso simplesmente usar `@` no parâmetro e funciona da mesma maneira,
criando o atributo interno do objeto.

<pre class="prettyprint coffeescript">
class Pessoa
  constructor: (@nome) ->
</pre>

E você não está limitado a usar apenas no `constructor`, pois pode usar onde
bem entender este tipo de método e pode ser extremamente útil.

<pre class="prettyprint coffeescript">
class Pessoa
  constructor: (@nome) ->
  indiceMassaCorporal: (@altura, @peso) ->
    @imc = @peso / (@altura * @altura)
</pre>

Desta maneira eliminamos uma série de códigos repetitivos e verbosos.

## `||=` atribuições condicionais

Uma possível melhoria para fazer no algorítmo acima, ainda seria evitar
recalcular o imc se já foi calculado, cacheando o imc, ou recalculando:

<pre class="prettyprint coffeescript">
class Pessoa
  constructor: (@nome) ->
  indiceMassaCorporal: (@altura, @peso) ->
    @imc ||= @peso / (@altura * @altura)
</pre>

O exemplo é tosco mas apenas seguindo a linha de usar cache para o cálculo e
evitar reprocessamento.

## Condicionais?

Estilo narrador do polishop:

- Transtornado com propriedades não definidas?
- Recebe um `undefined is not a function` a cada tentativa de rodar um novo código?

Seus problemas acabaram! O super poder das condicionais no coffeescript é muito
simples e fácil de usar! E se você comprar agora ainda pode levar inteiramente grátis
as opções de trabalhar com condicionais encadeadas!

Veja com seus próprios olhos essa beleza em funcionamento:

<pre class="prettyprint coffeescript">
if pessoa?
  pessoa.indiceMassaCorporal(190,112)
</pre>

Também pode ser condicional _inline_.

<pre class="prettyprint coffeescript">
pessoa?.indiceMassaCorporal(190,112)
</pre>

E encadeado. Por exemplo, verificar se existe a função `indiceMassaCorporal`
antes de executá-la:

<pre class="prettyprint coffeescript">
imc = pessoa?.indiceMassaCorporal?(190,112)
</pre>

No fim das contas detalhes como estes acabam poupando algumas linhas e o código
fica extremamente fácil de entender.

Além disso dá pra usar uma série de funções anônimas inline e outros detalhes
que realmente fazem o coffeescript ter seu brilho próprio.

Entre eles eu destaco: **Tudo** está sendo retornado no coffee. Então qualquer
expressão é inline e pode ser re-utilizada.

Cada for é um map e está retornando o array da expressão interna. Então, você
pode declarar um código como:

<pre class="prettyprint coffeescript">
imcsDeVariasPessoas = pessoa.imc for pessoa in pessoas
</pre>

# Detalhes difíceis e cruéis

Nem tudo são flores e você vai precisar pisar em ovos no coffee também. Uma das
maiores enrascadas do coffeescript está no `@` e a falta de sabedoria na hora
de usar ele.

Um bom conselho que posso dar é: mantenha-se sempre olhando o código javascript
gerado pois você está compilando javascript e no final não pode gerar
incompatibilidades da linguagem.

O `@` é o `this.` do coffeescript. Então, ao se referir a uma propriedade você
naturalmente usa `@`. Supomos o exemplo:

<pre class="prettyprint coffeescript">
euclidean = (p1, p2) ->
  [a, b] = [p1.x - p2.x, p1.y - p2.y]
  Math.sqrt Math.pow(a, 2) + Math.pow(b, 2)
class Pessoa
  distancia: (outro) -> euclidean(@,outro)
  amigosProximos: (raioEsperado = 50) ->
    proximos = []
    @relacionamentos.filter (pessoa) ->
      if @distancia(pessoa) < raioEsperado
         proximos.push pessoa.nome
    proximos
</pre>

Esse é o clássico algorítmo que não funciona e você fica puto da cara com isso.

Então é necessário entender o código gerado e você vai perceber que o
`@distancia` não existe naquele contexto. Nesse caso, não existe pois uma
função interna que faz o código do filter funcionar. Veja o código javascript gerado:

<pre class="prettyprint javascript">
var Pessoa, eu, euclidean;

euclidean = function(p1, p2) {
  var a, b, ref;
  ref = [p1.x - p2.x, p1.y - p2.y], a = ref[0], b = ref[1];
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
};

Pessoa = (function() {
  function Pessoa() {}

  Pessoa.prototype.distancia = function(outro) {
    return euclidean(this, outro);
  };

  Pessoa.prototype.amigosProximos = function(raioEsperado) {
    var proximos;
    if (raioEsperado == null) {
      raioEsperado = 50;
    }
    proximos = [];
    this.relacionamentos.filter(function(pessoa) {
      if (this.distancia(pessoa) < raioEsperado) {
        return proximos.push(pessoa.nome);
      }
    });
    return proximos;
  };

  return Pessoa;

})();
</pre>

### Criando a referência self

<pre class="prettyprint coffeescript">
class Pessoa
  distancia: (outro) -> euclidean(@,outro)
  amigosProximos: (raioEsperado = 50) ->
    proximos = []
    self = @
    @relacionamentos.filter (pessoa) ->
      if self.distancia(pessoa) < raioEsperado
         proximos.push pessoa.nome
    proximos
</pre>

Neste caso, o mais legal é usar a solução clássica de usar _list comprehensions_
que é uma maneira simples e padrão do que manter-se usando uma variável self.

Mas segue de exemplo com self acima e abaixo com _list comprehensions_.

<pre class="prettyprint coffeescript">
euclidean = (p1, p2) ->
  [a, b] = [p1.x - p2.x, p1.y - p2.y]
  Math.sqrt Math.pow(a, 2) + Math.pow(b, 2)
class Pessoa
  distancia: (outro) -> euclidean(@,outro)
  amigosProximos: (raioEsperado = 50) ->
    pessoa for pessoa in @relacionamentos when @distancia(pessoa) < raioEsperado
</pre>

Então observando o exemplo final e o código gerado, escrevemos 7 linhas de coffeescript que geraram mais de 30 em javascript.

Observe  o código final:

<pre class="prettyprint javascript">
var Pessoa, euclidean;

euclidean = function(p1, p2) {
  var a, b, ref;
  ref = [p1.x - p2.x, p1.y - p2.y], a = ref[0], b = ref[1];
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2)); };

Pessoa = (function() {
  function Pessoa() {}

  Pessoa.prototype.distancia = function(outro) {
    return euclidean(this, outro);
  };

  Pessoa.prototype.amigosProximos = function(raioEsperado) {
    var i, len, pessoa, ref, results;
    if (raioEsperado == null) {
      raioEsperado = 50;
    }
    ref = this.relacionamentos;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      pessoa = ref[i];
      if (self.distancia(pessoa) < raioEsperado) {
        results.push(pessoa);
      }
    }
    return results;
  };

  return Pessoa;

})();
</pre>

E aí gostou? <a href=http://js2.coffee/#coffee/try:euclidean%20%3D%20(p1%2C%20p2)%20-%3E%0A%20%20%5Ba%2C%20b%5D%20%3D%20%5Bp1.x%20-%20p2.x%2C%20p1.y%20-%20p2.y%5D%0A%20%20Math.sqrt%20Math.pow(a%2C%202)%20%2B%20Math.pow(b%2C%202)%0Aclass%20Pessoa%0A%20%20distancia%3A%20(outro)%20-%3E%20euclidean(%40%2Coutro)%0A%20%20amigosProximos%3A%20(raioEsperado%20%3D%2050)%20-%3E%0A%20%20%20%20pessoa.nome%20for%20pessoa%20in%20%40relacionamentos%20when%20%40distancia(pessoa)%20%3C%20raioEsperado%0Aeu%20%3D%20new%20Pessoa()%0Aeu.x%20%3D%2010%0Aeu.y%20%3D%2020%0Aeu.relacionamentos%20%3D%20%5B%0A%20%20%7B%20nome%3A%20%22maria%22%2C%20x%3A%205%2C%20y%3A%2010%20%20%20%20%7D%0A%20%20%7B%20nome%3A%20%22joao%22%2C%20%20x%3A%2020%2C%20y%3A%2040%20%20%20%7D%0A%20%20%7B%20nome%3A%20%22z%C3%A9zin%22%2C%20x%3A%20200%2C%20y%3A%20500%20%7D%0A%5D%0Aconsole.log%20eu.amigosProximos()">Tenta rodar na prática</a> esse exemplo e não deixe de comentar!

Quais são suas principais dificuldades com coffeescript?

Confesso que apanhei e também sofri muito pois foi a primeira vez que trabalhei com uma linguagem
que obriga a seguir uma indentação, mas no final têm sido ótimo, valendo muito a pena.

Sabemos que o javascript pode sofrer alterações drásticas, e a comunidade vai manter a compatibilidade.

Então de certa forma é até mais confortável usar coffeescript do que manter adaptando e readaptando
o código para rodar na especificação mais recente e retro-compatibilizado.

Pense nisso! o/