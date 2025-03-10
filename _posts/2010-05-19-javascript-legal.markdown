---
title: "Javascript Ninja Legal"
layout: post
categories: ['javascript', 'ideiame']
description: "Hoje estou aprendendo algumas coisas bacanas com o [John Resig] e logo percebi uma falha no meu Javascript que animava o link do [Feed-me]. Observe o código ..."
---
# Javascript Ninja Legal

Hoje estou aprendendo algumas coisas bacanas com o [John Resig] e logo percebi uma falha no meu Javascript que animava o link do [Feed-me]. Observe o código antigo que anima o link do [Feed-me] é feito assim:

<div><pre class="prettyprint diff">
function payAttentionForFeedMe(){
   var link = document.getElementById("feedme");
   setTimeout(function(){ link.style.color = 'red'},    500);
   setTimeout(function(){ link.style.color = 'green'}, 1000);
   setTimeout(function(){ link.style.color = 'blue'},  1500);
   setTimeout(function(){ link.style.color = 'yellow'},2000);
   setTimeout(function(){ link.style.color = 'white'}, 2500);
   setTimeout(function(){ link.style.color = "orange"},3000);
}
</pre></div>

E esta é realmente uma forma bruta de realizar a tarefa! Agora por que não fiz um for?

<div><pre class="prettyprint diff">
function payAttentionForFeedMe(){
   var link = document.getElementById("feedme");
   var colors = ['red','green','blue','yellow','white','orange'];

   for ( var i = 0; i &lt; colors.length; i++ ){
     setTimeout(function(){ link.style.color = colors[i]}, i * 1000); 
   }  
}
</pre></div>

Desta forma com o for tradicional não funciona. Então hoje descobri uma [forma ninja][este_exemplo] de se fazer com uma função anônima no loop.

<div><pre class="prettyprint diff">
function payAttentionForFeedMe(){
   var link = document.getElementById("feedme");
   var colors = ['red','green','blue','yellow','white','orange'];

   for ( var i = 0; i &lt; colors.length; i++ ) (function(i){
     setTimeout(function(){ 
        link.style.color = colors[i] 
     }, i * 1000)}
   )(i);
}
</pre></div>

Aprendi com [este exemplo].

[john_resig]: http://ejohn.org/
[este_exemplo]: http://ejohn.org/apps/learn/#63
[feedme]: /atom.xml
