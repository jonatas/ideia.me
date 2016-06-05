---
layout: page
title:  Ideia-me!
---
{% include JB/setup %}
{% include about_me.html %}

<hr />
{% for post in site.posts limit: 1 %}
   <h1 class="post"><a class="post" href="{{ post.url }}"> {{ post.title }}</a></h1>
 {{ post.content }}
{% endfor %}
<hr />
<ul class="posts">
 {% for post in site.posts %}
  <li><span class="post_date">{{ post.date | date_to_string }}</span> &raquo;<a class="post" href="{{ post.url }}">{{ post.title }}</a></li>
 {% endfor %}
</ul>
