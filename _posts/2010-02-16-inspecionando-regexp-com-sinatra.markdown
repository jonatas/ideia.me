---
  layout: post 
  title: Inspecionando expressões regulares com Sinatra! 

  categories: ['ruby', 'sinatra', 'regexp']
---

# Inspecionando expressões regulares com Sinatra

Expressões regulares, muitas vezes são difíceis de compreender e também de testar. Uma boa alternativa, é inspecionar os resultados enquanto estiver construindo a expressão.

Ispirado no [regexp syntax highligth][link-regex] feito para usar no terminal, resolvi criar uma aplicação em Sinatra que fizesse  a mesma coisa. 

![img-printscreen]

O "segredo" básico deste aplicativo, está na forma como a expressão casa com a string. Supomos o mesmo exemplo da imagem acima, mas ao invés de trocar a cor de fundo, colocassemos os resultados casados entre parenteses. Então, seria o seguinte código.

<div><pre class="prettyprint">
"jonatas".gsub(/[a]+/,"(\\&amp;)")  
</pre></div>

O resultado da substituição anterior, resulta na seguinte string:

<div><pre class="prettyprint">
"jon(a)t(a)s"
</pre></div>

Desta forma, o que é importante aprender com esta expressão regular, é que neste código, quando usando o gsub, cada expressão regular que casar com algum elemento, é possível capturar o valor do elemento através da expressão:

<div><pre class="prettyprint">
"\\&amp;"
</pre></div>

Sendo este, o código acima, o próprio caracter encontrado na expressão pesquisada. Para implementar a mesma situação na web, o que resta fazer agora, é trocar a string que casou, adicionando uma propriedade que troque as cores padrões.

A abordagem será criar uma tag span com a propriedade **class** nomeada **match**. Esta classe irá trocar a cor da fonte e do fundo para tornar ao contrário os elementos que casaram com a string. Para usar a expressão no novo formato, apenas substitui usando a tag span.

A regra span com o class match tem as seguintes propriedades:

<div><pre class="prettyprint">
span.match {
  color: white;
  background: black;
}
</pre></div>

A expressão regular pode ser substituída por esta, que coloca a tag span:

<div><pre class="prettyprint">
"jonatas".gsub(/[a]+/,"&lt;span class='match'&gt;\\&amp;&lt;/span&gt;")
</pre></div>

Testando a expressão acima, esta deve retornar a seguinte expressão:

<div><pre class="prettyprint">
"jon&lt;span class='match'&gt;a&lt;/span&gt;t&lt;span..."
</pre></div>

Colocando "tudo isso" em um servidor sinatra temos:

<div><pre class="prettyprint">
require 'rubygems'
require 'sinatra'

get "/" do 
  erb :index
end
post "/match" do 
  regex = Regexp.new(params[:pattern])
  replace =  "&lt;span class='match'&gt;\\&amp;&lt;/span&gt;"
  @match = params[:string].gsub(regex,replace)
  erb :index
end
</pre></div>

E na view views/index.erb temos: 

<div><pre class="prettyprint">
&lt;html&gt;
  &lt;head&gt;
    &lt;meta http-equiv="Content-type" 
              content="text/html; charset=utf-8" /&gt;
    &lt;style type="text/css" media="screen"&gt;
      span.match {
        color: white;
        background: black;
      }
    &lt;/style&gt;
    &lt;title&gt;Teste sua expressão regular&lt;/title&gt;
  &lt;/head&gt;
  &lt;body&gt; 
    &lt;form action="match" method="post"&gt;
      String: 
      &lt;input type="text" name="string" value="jonatas" /&gt;&lt;br&gt;
      Casa com: 
      &lt;input type="text" name="pattern" value="[a]+"/&gt;
      &lt;p&gt;&lt;input type="submit" value="Testar" /&gt;&lt;/p&gt;
    &lt;/form&gt;
    &lt;%= @match %&gt;
  &lt;/body&gt;
&lt;/html&gt;
</pre></div>

E acabou! é só isso, extremamente simples e funcional!

ps: Visite também <http://rubular.com> para usufruir desta mesma funcionalidade.

[link-regex]: http://www.rubyist.net/~slagell/ruby/regexp.html
[img-printscreen]: /images/regex-test-sinatra.jpg
