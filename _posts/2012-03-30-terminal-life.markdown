---
  layout: ideiame
  title: Recursos úteis para desenvolvimento na linha de comando
---

# {{ page.title }}

Existe uma gama de comandos muito forte para se tornar mais ágil no linux e também no msysgit e eu me sinto feliz em compartilhar aqui meus preferidos:

##  $!

Sempre uso este atalho para fazer mil coisas. O comando $! retorna o último parâmetro da última função utilizada. Por exemplo, eu crio e depois adiciono um determinado arquivo no meu projeto logo eu digito.

<pre>
touch /my/dir/file
git add /my/dir/file
</pre>

Com a variável posso fazer:

<pre>
touch /my/dir/file
git add !$
</pre>

## locate

Localiza arquivos do HD rápidamente. Se o arquivo foi criado recentemente talvez você tenha que usar o comando `sudo updatedb` para encontrar o arquivo.

<pre>
jonatas@jonatax:~/ideia.me$ locate rubygems.rb
/home/jonatas/.rvm/gems/jruby-1.6.5.1/gems/rubygems-update-1.8.15/lib/gauntlet\_rubygems.rb
/home/jonatas/.rvm/gems/jruby-1.6.5.1/gems/rubygems-update-1.8.15/lib/rubygems.rb
/home/jonatas/.rvm/repos/rbx/lib/rubygems.rb
/home/jonatas/.rvm/rubies/jruby-1.6.5.1/lib/ruby/site\_ruby/1.8/gauntlet\_rubygems.rb
/home/jonatas/.rvm/rubies/jruby-1.6.5.1/lib/ruby/site\_ruby/1.8/rubygems.rb
/home/jonatas/.rvm/rubies/ruby-1.8.7-p357/lib/ruby/site\_ruby/1.8/gauntlet\_rubygems.rb
/home/jonatas/.rvm/rubies/ruby-1.8.7-p357/lib/ruby/site\_ruby/1.8/rubygems.rb
/home/jonatas/.rvm/rubies/ruby-1.9.2-p290/lib/ruby/1.9.1/rubygems.rb
/home/jonatas/.rvm/rubies/ruby-1.9.2-p290/lib/ruby/site\_ruby/1.9.1/gauntlet\_rubygems.rb
/home/jonatas/.rvm/rubies/ruby-1.9.2-p290/lib/ruby/site\_ruby/1.9.1/rubygems.rb
/home/jonatas/.rvm/rubies/ruby-1.9.2-rc2/lib/ruby/1.9.1/rubygems.rb
/home/jonatas/.rvm/rubies/ruby-1.9.2-rc2/lib/ruby/site\_ruby/1.9.1/gauntlet\_rubygems.rb
/home/jonatas/.rvm/rubies/ruby-1.9.2-rc2/lib/ruby/site\_ruby/1.9.1/rubygems.rb
/home/jonatas/.rvm/src/jruby-1.6.5.1/lib/ruby/site\_ruby/1.8/gauntlet\_rubygems.rb
/home/jonatas/.rvm/src/jruby-1.6.5.1/lib/ruby/site\_ruby/1.8/rubygems.rb
/home/jonatas/.rvm/src/rbx-head/lib/rubygems.rb
/home/jonatas/.rvm/src/ruby-1.9.2-p290/lib/rubygems.rb
/home/jonatas/.rvm/src/ruby-1.9.2-rc2/lib/rubygems.rb
/home/jonatas/.rvm/src/rubygems-1.8.15/lib/gauntlet\_rubygems.rb
/home/jonatas/.rvm/src/rubygems-1.8.15/lib/rubygems.rb
/usr/lib/jruby/lib/ruby/gems/1.8/gems/rubygems-update-1.8.15/lib/gauntlet\_rubygems.rb
/usr/lib/jruby/lib/ruby/gems/1.8/gems/rubygems-update-1.8.15/lib/rubygems.rb
/usr/lib/jruby/lib/ruby/site\_ruby/1.8/gauntlet\_rubygems.rb
/usr/lib/jruby/lib/ruby/site\_ruby/1.8/rubygems.rb
/usr/lib/ruby/1.8/gauntlet\_rubygems.rb
/usr/lib/ruby/1.8/rubygems.rb
/usr/lib/ruby/1.9.1/rubygems.rb
jonatas@jonatax:~/ideia.me$ 
</pre>


## grep

Filtra por uma [expressão regular][regexp] de diversas formas, eu geral uso [comando][grep] `grep -r` e `| grep` para duas situações distintas.
O exemplo abaixo usa o mesmo exemplo do locate acima, mas e filtrando novamente apenas por "jruby".

<pre>
jonatas@jonatax:~/ideia.me$ locate rubygems.rb | grep jruby
/home/jonatas/.rvm/gems/jruby-1.6.5.1/gems/rubygems-update-1.8.15/lib/gauntlet\_rubygems.rb
/home/jonatas/.rvm/gems/jruby-1.6.5.1/gems/rubygems-update-1.8.15/lib/rubygems.rb
/home/jonatas/.rvm/rubies/jruby-1.6.5.1/lib/ruby/site\_ruby/1.8/gauntlet\_rubygems.rb
/home/jonatas/.rvm/rubies/jruby-1.6.5.1/lib/ruby/site\_ruby/1.8/rubygems.rb
/home/jonatas/.rvm/src/jruby-1.6.5.1/lib/ruby/site\_ruby/1.8/gauntlet\_rubygems.rb
/home/jonatas/.rvm/src/jruby-1.6.5.1/lib/ruby/site\_ruby/1.8/rubygems.rb
/usr/lib/jruby/lib/ruby/gems/1.8/gems/rubygems-update-1.8.15/lib/gauntlet\_rubygems.rb
/usr/lib/jruby/lib/ruby/gems/1.8/gems/rubygems-update-1.8.15/lib/rubygems.rb
/usr/lib/jruby/lib/ruby/site\_ruby/1.8/gauntlet\_rubygems.rb
/usr/lib/jruby/lib/ruby/site\_ruby/1.8/rubygems.rb
</pre>

## Buscando 
Outra maneira que utilizo bastante é para procurar por texto dentro de arquivos. Por exemplo, digamos que estou procurando pela palavra "éia" que vem de ideia e assembleia e que agora perdeu o acento nas novas normas. Como quero corrigir meu site preciso pesquisar por esta expressão:

<pre>
jonatas@jonatax:~/ideia.me$ grep éia _posts/*
_posts/2010-02-01-portfolio.markdown:O meu portfólio, está ligado a todos os trabalhos que venho realizando e gostei muito da idéia de compartilhar e mante-lo aqui.
_posts/2010-02-14-estorias-bonitas-vs-testes-unitarios.markdown:Após ter saído da Leosoft, dia 11 voltei lá pela primeira vez, e foi para se reunir com o pessoal e fazermos um [coding dojo][coding-dojo] sobre TDD e BDD. Seguindo a idéia da [url anterior][coding-dojo], como exemplo para o evento, usamos um problema que implica em converter uma sintaxe de sql do Access para o padrão do Postgresql.
_posts/2010-02-23-regexp-maravilha.markdown:Nesta idéia, foi simples de converter todos os códigos Oracle que havia diferença de sintaxe usando um Hash de casos:
</pre>

## tail

Exibe o final de um arquivo e é muito interessante para inspecionar logs. Gosto do tail pois é possível observar mais de um arquivo no mesmo comando, por exemplo, as vezes estou testando algo e utilizo o thin como servidor. Logo o standard output ($stdout) está configurado para receber o arquivo thin.log e estou em observação de mais de um arquivo. 

## alias

Sempre esqueço todos os atalhos que tenho no terminal, então o alias é um ótimo comando para retornar todos os atalhos que você tem. Eu gostaria de saber como faz pra retornar o nome das funções que criamos, se alguém souber  :D

<pre>
jonatas@jonatax:~/$ alias
alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'
alias java\_change='sudo update-alternatives --config java'
alias l='ls -CF'
alias la='ls -A'
alias ll='ls -alF'
alias ls='ls --color=auto'
alias rvm-restart='rvm\_reload\_flag=1 source '\''/home/jonatas/.rvm/scripts/rvm'\'''
alias trab='cd ~/photon/workspace/ActiveScripts/'
</pre>

## \` \` ou $()

Já tinha escrito outro [post][regexp] com este comando mas é muito bacana e aqui segue a ideia. Quando preciso fazer uma combinação de comandos e preciso usar o resultado em outra expressão, logo é possível concatenar os resultados com $(). Por exemplo fiz um locate e agora quero buscar apenas dentro do meu diretório. Para pegar o diretório atual, é necessário utilizar o comando pwd, mas naturalmente utilizado após o grep ele se torna a palavra, logo um sub-terminal resolve o problema.

<pre>
locate myFile | grep $(pwd)
</pre>
ou
<pre>
locate myFile | grep `pwd`
</pre>


## Conclusões

A vida no terminal é muito mais que um canivete suiço e você só consegue ter agilidade quando se acostumar com as opções e optar por utilizá-las ao invés de pegar o mouse e partir para uma ferramenta mais visuais. 

Escrevo este post inspirado em um freelancer que estamos desenvolvendo na [Leosoft], em que estamos codificando tudo diretamente em um Ubuntu Server sem interface gráfica lá da [Leosoft], e simplesmente, não senti falta de nada. Conseguimos realizar o desenvolvimento de todas as funcionalidades sem intervenção de uma interface gráfica e estamos apenas usando ssh e usando o [VIM][vim] como editor.


[Leosoft]: www.leosoft.com.br "veja os produtos da Leosoft"
[vim]: /shell/regexp/unix/grep/rails/migrations/vim/2010/03/01/regexp-com-grep.html "post sobre o grep"
[grep]: /ruby/regexp/2010/02/23/regexp-maravilha.html "eu gosto mesmo de expressões regulares"
[regexp]: /ruby/sinatra/regexp/2010/02/16/inspecionando-regexp-com-sinatra.html "post super legal sobre expressões regulares"
[regexp_maravilha]: /ruby/regexp/2010/02/23/regexp-maravilha.html "veja uma aplicabilidade bacana para expressões regulares"

