---
  layout: post
  title: Git Post Receive
  categories: [git, jekyll, sh]
---

Hoje estive querendo transformar a [página de categorias][categories] para ficar mais estilo 'tag cloud' com cada categoria com um tamanho diferente dependendo do número de posts que houvesse. Então tive uma série de problemas para adaptar um tamanho legal via css e resolvi procurar por um [plugin para o jekyll][plugin]. Após encontrar um plugin para o liquid templates, descobri que o jekyll do github está em modo safe e não aceita plugin algum, então como gostei da nova forma resolvi migrar meu site do github para minha VPS. E aí precisava automatizar o processo de deploy do site a cada novo post.

## Como funciona

Nos repositórios do git, é possível usufruir dos métodos [hook], que nada mais são do que possíveis eventos em torno do repositório git. Dessa forma é possível mapear os eventos em torno do git. Neste exemplo usei o [post-receive].

Fui até o meu servidor e executei os seguintes comandos:

<pre class="prettycode sh">
  ssh jonatas@ideia.me
  mkdir ~/ideia.me
  cd ~/ideia.me
  git init --bare .
</pre>

No código acima criei um repositório git que receberá os commits de minha máquina sendo este o servidor.

Em meu repositório local adicionei:

<pre class="prettycode sh">
jonatasdp@~/Code/ideia.me$ git remote add deploy jonatas@ideia.me:~/ideia.me
</pre>

Neste caso estou apontando diretamente para o repositório criado anteriormente com o meu usuário. Assim tive apenas que ripar o [post-receive] do wiki do jekyll e configurar o nginx.

## Post receive

No post receive, nada mais faz do que clonar o repositório locamente e executar o jekyll para gerar o website estático novamente na versão mais atualizada:

<pre class="prettycode sh">
jonatas@ideia.me:~$ cat ideia.me/hooks/post-receive 
GIT_REPO=$HOME/ideia.me
TMP_GIT_CLONE=$HOME/tmp/ideia.me
PUBLIC_WWW=/var/www/sites/ideia.me
git clone $GIT_REPO $TMP_GIT_CLONE
cd $TMP_GIT_CLONE
jekyll --no-auto $TMP_GIT_CLONE $PUBLIC_WWW
cd $HOME
rm -Rf $TMP_GIT_CLONE
</pre>


Com este post-receive o jekyll irá regerar meu site cada vez que envio um novo post.

<pre class="prettycode sh">
git push deploy master
</pre>

O jekyll é uma engine muito boa e valeu muito a pena desde o início. Agora estou totalmente livre do sistema de páginas do github e posso dar o deploy em minha VPS como bem entender :)

## Configuração do nginx

Para configurar o Nginx criei o arquivo ```/etc/nginx/sites-enabled/ideiame``` com o seguinte conteúdo:

<pre class="prettycode sh">
server {
  root /var/www/sites/ideia.me;
  index index.html;
  server_name ideia.me;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
</pre>

Valeu GIT!

    Demorou um pouco para o site ficar 100% pois o DNS demora um tempo para migrar e na nostalgia ainda cheguei a ver uma primeira versão do meu site onlne durante o período da migração.

[post-receive]: https://github.com/mojombo/jekyll/wiki/Deployment
[categories]: /categories.html
[hook]: http://git-scm.com/book/en/Customizing-Git-Git-Hooks
[plugin]: https://gist.github.com/yeban/2290195
