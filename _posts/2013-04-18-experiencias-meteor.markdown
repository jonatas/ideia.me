---
  title: Experiências com o Meteor js
  layout: post
---



Este mês conhecemos o [Meteor] e desenvolvemos o [Pixel]. Tudo começou muito bem e até que não tinhamos mais de mil pixels na tela ainda era possível entrar no [Pixel]. Conforme o desenho ia crescendo demorava mais e mais pra entrar na página e dava muito a impressão de que nunca mais ia carregar. Então foi um tanto quanto desmotivador ver o sistema travando logo nas primeiras super aquecidas com ele.

## Melhoria das templates

Logo começei a busca sobre como melhorar isso e encontrei o [Meteor.renderList] ao invés de usar o #each dentro da template. Com esta mudança simples tive ganhos significativos de performance.

Removi este code:

<pre class="prettyprint javascript">
 { { #each draws }}
  { {> draw }}
 { {/each}}
</pre>

E adicionei este no Meteor.startup:

<pre class="prettyprint javascript">
var frag = Meteor.renderList(
  Pixel.find(),
    function(pixel) {
      return Template.draw(pixel);
    }
);
document.body.appendChild(frag);
</pre>

Outra mudança importante foi que adicionei a tag #constant para a template não dar o bind do objeto toda vez:

<pre class="prettyprint html">
 &lt;template name="draw"&gt;
{ {#constant}}
 &lt;div style="{ { style}}" /&gt;
{ {/constant}}
 &lt;/template&gt;
</pre>

## Migrando para o Heroku

Depois de dias dando o deploy na nossa cloud, percebi que o processo do meteor caia sem sentido. Não consegui realmente identificar o motivo de não parar de pé o processo, e mesmo sem usuários acessando o meteor sempre acabava _Killed_.

Iniciei tentando fazer uma migração através do bundle usando [este tutorial] e não obtive sucesso tentando configurar tudo manualmente. Hoje acessei o tutorial e foi atualizado para usar o [meteor buildpack]: simples, fácil e funcional. Estamos com o [Pixel] rodando no [Heroku] faz uma semana e sem mais problemas.

Gostei muito do sistema [anti erosivo] do [Heroku] e parece mesmo manter os [dynos] no ar!

Para colocar no domínio pixel.ideia.me tive que adicionar os comandos:

<pre class="prettyprint sh">
heroku domains:add pixel.ideia.me
heroku config:set ROOT_URL=pixel.ideia.me
</pre>

E também configurar no meu domínio um registro CNAME apontando para o endereço do [Heroku].



[Pixel]: http://pixel.ideia.me
[Meteor]: http://meteor.com
[meteor_buildpack]: https://github.com/jordansissel/heroku-buildpack-meteor
[este_tutorial]: http://bytesofpi.com/post/20898722298/pushing-your-meteor-project-to-heroku
[anti_erosivo]: https://devcenter.heroku.com/articles/erosion-resistance
[dynos]: https://devcenter.heroku.com/articles/dynos
[meteorrenderlist]: http://docs.meteor.com/#meteor_renderlist
[Heroku]: http://heroku.com
