---
title: Jekyll e Twitter Bootstrap
layout: post
---

Sempre usei o jekyll para construir o site, mas resolvi migrar o estilo do site para o [twitter bootstrap][tb] pois estava um pouco cansado daquele leiaute que eu fiz. Acabei usando o [jekyll bootstrap][jb] para acelerar a  migração. A organização do code é um tanto quanto melhor que a minha e então tive que substituir alguns detalhes em todos os posts ao mesmo tempo. Para não passar arquivo por arquivo, utilizei uma expressão regular com perl:

### Para trocar o nome do leiaute

<pre class="prettyprint sh">
ls *.markdown | xargs perl -pi -e 's/layout: ideiame/layout: post/g'
</pre>

Também removi o título e foi simples interno de cada post pois está sendo injetado pela nova template:

### Para remover a linha do titulo de cada post

<pre class="prettyprint sh">
ls *.markdown | xargs perl -pi -e 's/# \\{\\{.page.title.}}//g'
</pre>

### Temas para o bootstrap

A estrutura do [twitter bootstrap][tb] é simples e linda. E também permite usar temas de forma muito simples. Estou usando o tema [cyborg] do site [bootswatch], e também adicionei um menu onde é possível trocar o tema. Agora só falta colocar um cookie para manter o mesmo tema do último acesso.

E aí gostaram do novo leiaute?

[tb]: http://twitter.github.io/bootstrap/
[jb]: http://jekyllbootstrap.com/
[bootswatch]: http://bootswatch.com/
[cyborg]: http://bootswatch.com/cyborg/
