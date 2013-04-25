---
  layout: post 
  title: Google Api
  dirbase: /../../..
---

# Integrando Google Api no Ideia.me

Hoje encarei a necessidade de uma busca específica para o meu site. Então mapeei o google para fazer buscas. Foi extremamente simples de encontrar as informações e usando os métodos específicos, refinar para busca refletir apenas nos conteúdos postados aqui.

![googleapi]

Como a api do google já está disponível no <http://ideia.me>, para criar um sistema de busca foi necessário adicionar um serviço de busca:

<pre class="prettyprint">
var webSearch = new google.search.WebSearch();
</pre>

Após isso, declarei a restrição de buscar apenas dados da url <http://ideia.me>:

<pre class="prettyprint">
webSearch.setSiteRestriction('ideia.me');
</pre>

Também é necessário adicionar um serviço do controle das buscas que irá receber a pesquisa da web:

<pre class="prettyprint">
var searchControl = new google.search.SearchControl();
searchControl.addSearcher(webSearch);
</pre>

Após isso é necessário apenas adicionar o controlador de pesquisas ao html:

<pre class="prettyprint">
searchControl.draw(document.getElementById("google_search"));
</pre>

Se você quiser implementar alguma ideia diferente na busca dos resultados, é possível adicionar uma função de callback para o controlador de pesquisas:

<pre class="prettyprint">
searchControl.setSearchCompleteCallback(this, onCompleteSearch);
</pre>

[googleapi]: /images/googlesearch.jpg
