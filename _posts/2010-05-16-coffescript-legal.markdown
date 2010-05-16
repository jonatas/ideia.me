---
  layout: ideiame
  title: Coffescript Legal
  categories: coffescript ruby javascript linguagem
  dirbase: /../../..
---

# {{ page.title }}

Comecei a olhar para mais uma linguagem que está mudando a minha forma de pensar. Coffescript é uma pequena linguagem que compila para javascript e é muito simples para usar. Você pode compilar o código para javascript ou incluir o javascript do compilador coffescript na sua página. Por enquanto estou apenas fazendo isso no meu local, por isso este serviço ainda não está disponível em meu site. 

Um exemplo muito bacana que inicia a explicação do coffescript é a criação de uma função que eleva ao quadrado (em inglês square):

<div><pre class="prettyprint">
square: (x) -> x * x
</pre></div>

E para usufruir dos métodos: 

<div><pre class="prettyprint">
square(5)
</pre></div>

Os métodos também não precisam de parênteses obrigatóriamente:

<div><pre class="prettyprint">
square 5
</pre></div>

Lembrando do [exemplo da moeda][moeda], em coffescript posso declarar da seguinte forma:

<div><pre class="prettyprint">
rand: (x) -&gt; Math.round(Math.random() * x)

moeda: {
 faces: [ 'cara', 'coroa' ]
 sortear: -&gt; puts this.faces[rand(1)]
}

vezes: 10

moeda.sortear() while vezes -= 1
</pre></div>


Esta é realmente uma das linguagens mais bonitas que eu já vi! Também é possível resgatar o código em js com o parâmetro -p:

<div><pre class="prettyprint">
$ coffee -p moeda.coffee 
</pre></div>

Que imprime o seguinte Javascript gerado:

<div><pre class="prettyprint">
(function(){
  var moeda, rand, vezes;
  rand = function(x) {
    return Math.round(Math.random() * x);
  };
  moeda = {
    faces: ['cara', 'coroa'],
    sortear: function() {
      return puts(this.faces[rand(1)]);
    }
  };
  vezes = 10;
  while (vezes -= 1) {
    moeda.sortear();
  }
})();
</pre></div>

Existem diversas oportunidades para explorar estas linguagens. Javascript deixou de ser apenas uma linguagem para browsers e está se tornando uma potência após o lançamento da engine v8 do google a qual é a base do Google Chrome.

Também é possível compilar e visualizar no terminal.
<pre>
[jonatas] ~/projetos/coffee-script
$ coffee moeda.coffee 
coroa
coroa
coroa
coroa
cara
coroa
cara
cara
coroa
</pre>

Outra coisa legal do Coffescript é utilizar o comparador **is** ao invés de utilizar o comparador de igualdade **==**.

<div><pre class="prettyprint">
coffescript: "awesome"
print "nice" if coffescript is "awesome"
</pre></div>

[moeda]: /2010/05/03/ruby-legal.html
