---
title: "Ruby Legal"
layout: post
description: "Hoje fiquei vendo um exercício de probabilidade na aula de estatística, o exercício dizia o seguinte:"
---
Hoje fiquei vendo um exercício de probabilidade na aula de estatística, o exercício dizia o seguinte:

    Uma moeda é lançada 10 vezes. Qual a probabilidade de:
    a) Sair 5 vezes a face "cara".
    b) Sair no máximo 9 vezes a face "cara".

Logo imaginei uma forma de descrever esta situação para o computador. Escrevi a seguinte frase: 

<pre class="prettyprint">
objeto moeda
  possui faces(cara, coroa)
  quando jogar
    sortear faces

sortear moeda
</pre>

Pensando nesta declaração, codifiquei a seguinte declaração em ruby:

<pre class="prettyprint">
objeto "moeda"
possui :faces =&gt; ["cara", "coroa"]
quando "jogar" {
  sortear :faces
}
</pre>

Apartir do código acima, é possível executar o seguinte código:

<pre class="prettyprint">
moeda.jogar
</pre>

Agora pensei, falta implementar o método, então vamos lá! Primeiro é necessário criar um método que permita eu declarar um objeto como:

<pre class="prettyprint">
objeto "moeda"
</pre>

E logo que eu declarar o objeto, logo posso utiliza-lo livremente em ruby. Sem um toque de metaprogramação podemos verificar a seguinte situação:

<pre class="prettyprint">
[jonatas] ~ $ irb
>> def objeto(nome) ; nome ; end
=> nil
>> objeto 'moeda'
=> "moeda"
>> moeda
NameError: undefined local variable or method 'moeda' for main:Object
</pre>

Não encontrou a variável local? E agora, como nascerá este método! Inicialmente criaremos um objeto anônimo a cada declaração de objetos. E manteremos uma lista dos objetos específicos.

Primeiro, iremos declarar uma váriavel que conterá todos os objetos que serão descritos.


<pre class="prettyprint">
$objetos = {}
class Object
 def objeto(nome)
   $objeto = $objetos[nome] = Object.new 
 end
end
</pre>

Após este passo, é necessário implementar o método "method\_missing" que é responsável por saber a respeito das chamadas do sistema.

Este método é invocado, quando o método não é encontrado na classe, e recebe como parâmetros, um símbolo representando o nome do método, os parâmetros e um possível bloco. 

O objetivo de implementar este método, é lidar com situações inesperadas como esta, que está buscando um método que não existe. Neste caso, iremos flexibilizar o uso da linguagem ruby, implementando uma mini-linguagem para descrever um objeto.

<pre class="prettyprint">
$objetos = {}
class Object
 def objeto(nome)
   $objeto = $objetos[nome] = Object.new 
 end
 def method_missing(nome, *args, &amp;block)
   $objetos[nome.to_s] || super
 end
end
</pre>

Agora já é possível digitar:

<pre class="prettyprint">
objeto "moeda"
moeda
moeda.jogar # NoMethodError: undefined method 'jogar' 
</pre>

Para descrever o método jogar, é necessário implementar a sintaxe que cria novos atributos ao objeto descrito anteriormente.

<pre class="prettyprint">
def possui(atributos)
  atributos.each do |nome, valor|
    $objeto.instance_variable_set("@#{nome}",valor)
  end
end
</pre>

Depois que este elemento foi declarado é possivel declarar atributos para o objeto. 

Dado que os atributos foram declarados, é necessário poder acessá-los também. Para tornar o acesso público, é necessário alterar a implementação do método  "method\_missing" para ler os atributos do objeto também.

<pre class="prettyprint">
def method_missing(nome, *args, &amp;block)
  $objetos[nome.to_s] ||
   $objeto.instance_variable_get("@#{nome}") ||
    super
end
</pre>

O método acima, primeiramente verifica se existe um objeto com o nome, se não tenta buscar uma variável de instância para o objeto a seguir. Caso não encontre a variável então lança a excessão novamente.

<pre class="prettyprint">
 objeto 'carro' 
 possui 'portas' =&gt; 4
 possui 'airbag' => 'duplo'
 carro.portas # => 4
 carro.dirigir # NoMethodError: undefined method 'dirigir'
</pre>

Agora é necessário tomar as ações para que possa "aprender" a dirigir o carro ou "jogar" a moeda. O próximo objetivo então é implementar o método **quando** determinada ação acontecer, então faça... 

A deste método consiste em:

<pre class="prettyprint">
def quando(acao, &amp;block)
  $objeto.class.send(:define_method, acao, &amp;block)
end
</pre>

Agora, já é possível criar os métodos dinâmicamente para cada objeto. E através da sintaxe:

<pre class="prettyprint">
quando "jogar" {
  sortear :faces
}
</pre>

Desta forma já é possível utilizar a tão desejada sintaxe:

<pre class="prettyprint">
moeda.jogar
</pre>

Abaixo segue o exemplo completo do código rodando:

<pre class="prettyprint">
$objetos = {}
class Object
 def objeto(nome)
   $objeto = $objetos[nome] = Object.new 
 end
 def method_missing(nome, *args, &amp;block)
   $objetos[nome.to_s] ||
    $objeto.instance_variable_get("@#{nome}") ||
     super
 end
 def possui(atributos)
   atributos.each do |nome, valor|
     $objeto.instance_variable_set("@#{nome}",valor)
   end
 end
 def quando(acao, &amp;block)
   $objeto.class.send(:define_method, acao, &amp;block)
 end
 def sortear(atributo)
   atributo = $objeto.instance_variable_get("@#{atributo}")
   p atributo[rand(atributo.size)]
 end
end

objeto "moeda"
possui :faces =&gt; ["cara", "coroa"]
quando("jogar") {
  sortear(:faces)
}

10.times { moeda.jogar }
</pre>

Ruby é excepcional para trabalhar com DSL. O domínio específico da linguagem torna as tarefas mais simples e diretas. Isto se trata de expressividade, de melhorar a linguagem para estabelecer uma conversa mais direta e compreensiva. No lado da metaprogramação, torna-se simples de implementar as ideias propostas. A codificação e montagem deste post foi feito em paralelo e em um tempo satisfatório.

ps: se você se interessa por este assunto, leia também meu artigo sobre expressividade da linguagem em <http://github.com/jonatas/artigo_elep>.

