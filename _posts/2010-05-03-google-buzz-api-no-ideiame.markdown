---
title: "Integrando API do Google Buzz no Ideia.me"
layout: post
description: "Após muito pensar em qual melhor forma de veicular minhas informações públicas no site, decidi por integrar com a [API do Google Buzz][gbuzz-api]. Me [divert..."
---
Após muito pensar em qual melhor forma de veicular minhas informações públicas no site, decidi por integrar com a [API do Google Buzz][gbuzz-api]. Me [divertindo no google playground][load-feed] decidi integrar meus últimos posts do google buzz através dos [feeds do gbuzz][meu-feed]. Usando o Google Playground para testar logo produzi um exemplo a partir do [Load Feed Oficial][load-feed]:

<pre class="prettyprint">
google.load("feeds", "1");

// Our callback function, for when a feed is loaded.
function feedLoaded(result) {
  if (!result.error) {
    // Grab the container we will put the results into
    var container = document.getElementById("content");
    container.innerHTML = '';
    for (var i = 0; i &lt; result.feed.entries.length; i++) {
      var entry = result.feed.entries[i];
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(entry.title));
      div.innerHTML += "&lt;BR&gt;"+entry.content;
      container.appendChild(div);
    }
  }
}

function OnLoad() {
   var url = "http://buzz.googleapis.com/feeds/jonatasdp/public/posted";
   var feed = new google.feeds.Feed(url)
  feed.load(feedLoaded);
}

google.setOnLoadCallback(OnLoad);
</pre>

Copiando e colando este código no [Google Playground][load-feed], se obtém um resultado parecido com este ao lado, com o feed correspondente. O interessante de usar o Google Buzz para mim, é trazer todas as minhas fontes de conteúdo agrupados em um só lugar. 

Para colocar este serviço rodando no site, me registrei no Google Apis e gerei um token para o meu site.

<pre class="prettyprint">
 &lt;script src="http://www.google.com/jsapi?key=ABQIAA..." type="text/javascript" &gt;&lt;/script&gt;
</pre>

Gostei muito de trabalhar com estas apis do Google. São simples e diretas ao assunto. Usando este tipo de serviço, estou garantindo que as minhas informações estejam aparecendo em todas as minhas fontes de contato. Em breve pretendo integrar outras apis do Google para teste.

[gbuzz-api]: http://buzz.googleapis.com/feeds/jonatasdp/public/posted
[load-feed]: http://code.google.com/apis/ajax/playground/#load_feed
[meu-feed]: http://buzz.googleapis.com/feeds/jonatasdp/public/posted
