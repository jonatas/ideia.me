---
layout: page
title:  Ideia-me!
tagline: estou aqui!
---
{% include JB/setup %}

Olá, eu sou o Jônatas, sou sócio da [invent.to][inventto] e sou [dev rails][wwr] na [Resultados Digitais][rd].

ps: Sinta-se livre para conversar comigo por email ou gtalk: <jonatasdp@gmail.com>.

[wwr]:http://www.workingwithrails.com/person/9816-j-natas-davi-paganini
[rd]: http://resultadosdigitais.com.br
[inventto]: http://invent.to

{% for post in site.posts limit: 3 %}
   <h1 class="post"><a class="post" href="{{ post.url }}"> {{ post.title }}</a></h1>
 {{ post.content }}
 <hr />
 <hr />
{% endfor %}
<ul class="posts">
 {% for post in site.posts offset: 3 %}
  <li><span class="post_date">{{ post.date | date_to_string }}</span> &raquo;<a class="post" href="{{ post.url }}">{{ post.title }}</a></li>
 {% endfor %}
</ul>
