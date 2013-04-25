---
layout: page
title:  Ideia-me!
tagline: estou aqui!
---
{% include JB/setup %}

Olá, eu sou o Jônatas e este é meu site pessoal. Através dele você pode acompanhar meus pensamentos sobre desenvolvimento de software/humano. Sou desenvolvedor desde 2004 e os conteúdos aqui descritos contam a respeito da minha vida/experiências trabalhando como programador e freelancer. Em 2007 conheci o Ruby e o [Rails][wwr] e sou muito apaixonado pelo meu trabalho.

Atualmente sou sócio da [invent.to] e também desenvolvo para [algumas][leosoft] [empresas][executive] de tecnologia como freelancer.

ps: Sinta-se livre para conversar comigo por email ou gtalk: <jonatasdp@gmail.com>.

[wwr]:http://www.workingwithrails.com/person/9816-j-natas-davi-paganini
[leosoft]: http://www.leosoft.com.br
[executive]: http://www.executive.com.br
[inventto]: http://invent.to

{% for post in site.posts limit: 3 %}
   <h1 class="post"><a class="post" href="{{ post.url }}"> {{ post.title }}</a></h1>
 {{ post.content }}
{% endfor %}
<ul class="posts">
 {% for post in site.posts offset: 3 %}
  <li><span class="post_date">{{ post.date | date_to_string }}</span> &raquo;<a class="post" href="{{ post.url }}">{{ post.title }}</a></li>
 {% endfor %}
</ul>
