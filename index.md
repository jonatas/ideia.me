---
layout: page
title:  Ideia-me!
tagline: estou aqui!
---
{% include JB/setup %}
{% include about_me.md %}

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
