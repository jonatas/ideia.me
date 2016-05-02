---
layout: page
title:  Ideia-me!
tagline: estou aqui!
---
{% include JB/setup %}

Olá, meu nome é Jônatas Davi Paganini e esse é meu blog. Sou programador, tenho alguns projetos no [github](https://github.com/jonatas) e escrevo
livremente [aqui no ideia.me](/) e também escrevo posts mais técnicos no [Ship It](http://shipit.resultadosdigitais.com.br)!

- Sou [ciclista](https://www.strava.com/athletes/12104550) e levo uma [vida de bike](/vida-de-bike) indo e voltando pro meu trabalho na [Resultados Digitais](http://resultadosdigitais.com.br).
- Tenho um [podcast com meu filho de 4 anos](http://lorenzo.ideia.me) e também organizo um [podcast técnico](http://soundcloud.com/rdshipit) na [RD](http://resultadosdigitais.com.br).
- Meu twitter e gmail é o mesmo: [@jonatasdp](https://twitter.com/jonatasdp).
- Encontre-me em algum [meetup](http://www.meetup.com/members/185190193/) em Floripa! ou conecte-se via [linkedin](https://br.linkedin.com/in/jonatasdp)/[instagram](https://instagram.com/jonatasdp)/[facebook](https://fb.com/jonatas.paganini)/[soundcloud](http://soundcloud.com/jonatasdp).

--------------

{% for post in site.posts limit: 3 %}
   <h1 class="post"><a class="post" href="{{ post.url }}"> {{ post.title }}</a></h1>
 {{ post.content }}
 <hr />
 <hr />
{% endfor %}
<ul class="posts">
 {% for post in site.posts offset: 10 %}
  <li><span class="post_date">{{ post.date | date_to_string }}</span> &raquo;<a class="post" href="{{ post.url }}">{{ post.title }}</a></li>
 {% endfor %}
</ul>
