---
  layout: post
  title: Expressões Regulares com grep
  categories: ['shell', 'regexp', 'unix', 'grep', 'rails', 'migrations', 'vim']
  dirbase: /../../..
---



Expressões regulares são úteis para muitas situações no coditiano linux. Hoje mesmo me deparei com a situação em que toda vez que altero uma migração, desejo refazer a migração do rails e para isso é necessário pegar a versão da migração. Encontrei um [exemplo no stackoverflow][stackoverflow] que caiu bem.

No caso, será usado um arquivo chamado:

<div><pre class="prettyprint">
"db/migrate/20100301193807_create_tickets.rb"
</pre></div>

Quando desejo refazer a migração executo o comando:

<div><pre class="prettyprint">
rake db:migrate:redo VERSION=20100301193807
</pre></div>

Mas toda vez preciso escrever manualmente **20100301193807** e isso se torna uma tarefa chata.

Como sou um fãn do editor **vim**, enquanto edito o arquivo tenho a possibilidade de acessar o nome do arquivo através de uma variável chamada "%". Através do comando "!" é possível executar um comando do shell. Desta forma é possível enviar algo para o shell e receber uma resposta.

Executando no modo de comando do **vim**, é possível executar o comando:

<div><pre class="prettyprint">
:!echo %
</pre></div>

Que irá retornar algo como:
<div><pre class="prettyprint">
20100301193807_create_tickets.rb
</pre></div>

Para pegar apenas os digitos da versão, é possível recuperar apenas os dígitos usandoo comando grep:

<div><pre class="prettyprint">
echo '20100301193807_create_tickets.rb' | grep -oEi '([0-9]+)'
</pre></div>
 
Que irá retornar apenas:

<div><pre class="prettyprint">
20100301193807
</pre></div>

Desta forma, é fácil de pegar a versão e colocar na área de transferência acrescentando **pbcopy** ao comando:

<div><pre class="prettyprint">
:! echo % | grep -oEi '([0-9]+)' | pbcopy
</pre></div>

Automatizando a tarefa rake é possível executar com o auxílio das aspas \` \`.

<div><pre class="prettyprint">
:!rake db:migrate:redo VERSION=`echo % | grep -oEi '([0-9]+)'` 
</pre></div>

O comando grep também pode ser útil para ajudar a encontrar arquivos buscando pelo seu conteúdo.

Por exemplo, se eu não sei o nome da migration que cria os tickets posso fazer uma busca usando:

<div><pre class="prettyprint">
$ grep -r tickets db/migrate
</pre></div>

Que irá retornar uma lista de ocorrências como:

<div><pre class="prettyprint">
db/migrate/20100301193807_create_tickets.rb:    create_table :tickets do |t|
db/migrate/20100301193807_create_tickets.rb:    drop_table :tickets
</pre></div>

ps: aprendi essa do "**grep -r**" com o [@leandroh][parazito]

Para ficar mais parecido com o rak é bom adicionar a opção **n** para exibir o número da linha:

<div><pre class="prettyprint">
$ grep -nr tickets db/migrate
</pre></div>

Que exibirá:

<div><pre class="prettyprint">
db/migrate/20100301193807_create_tickets.rb:3:    create_table :tickets do |t|
db/migrate/20100301193807_create_tickets.rb:15:    drop_table :tickets
</pre></div>

Conclusão: divirta-se concatenando comandos!

[stackoverflow]: http://stackoverflow.com/questions/1891797/capturing-groups-from-a-grep-regex
[parazito]: http://parasitando.com
