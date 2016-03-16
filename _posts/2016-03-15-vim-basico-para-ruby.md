---
  layout: post
  title: Vim básico para trabalhar com Ruby
  categories: ['vim','unix']
---

Estou usando o vim a 10 anos e não consigo migrar deste editor.

Durante os últimos anos parece que nada mudou e minha produtividade parece
estável em termos de editor, mas sempre estou encontrando plugins legais e vou compartilhar meu setup básico com VIM.

Neste tópico não vou falar sobre como fazer o setup do editor e usar as
funcionalidaes básicas. Vou apenas expor algumas das coisas que gosto pra
caramba no meu setup e workflow do dia a dia.

Eu tenho um [fork](https://github.com/jonatas/dotvim) do [dotvim do astrails](https://github.com/astrails/dotvim) que tem vários atalhos inspiradores que estou sempre tentando incluir no meu workflow.
Esse set de plugins que fiz o fork foi uma dica do
[@nandosouzafr](https://twitter.com/nandosouzafr) que me apresentou logo que comecei a trabalhar na [Resultados Digitais](http://resultadosdigitais.com.br).

## `,` como mapleader

No vim têm esse conceito de [map keys](http://vim.wikia.com/wiki/Mapping_keys_in_Vim_-_Tutorial_\(\)) com __leader__.

O leader funciona como um tecla mágica que têm um timeout esperando a próxima
tecla, se não acontecer ela é invalidada. Então se você digitar `<esc>leader` e
não seguir com o comando, logo seu `<leader>` é esquecido.

Lembrando que mapleader é uma variável do vim e por padrão é a a barra
invertida: `\\`.

Nesse caso ele usa `,` como leader. Então quando eu um mapeamento no vim:

    map <Leader>f :call <SID>JumpToFile()<CR>
 
Isso quer dizer que quando eu estiver usando o editor e usar `<esc>,f` ele
vai chamar a função `JumpToFile()` que deve estar em algum plugin ou faz parte do vim.

Então se eu fizer um mapeamento:

    map <Leader>rr :!ruby %<CR>

Quer dizer que quero rodar um script ruby com o arquivo atual que é
compilado em tempo real através da variável `%`.

<script type="text/javascript" src="https://asciinema.org/a/39560.js"
id="asciicast-39560" async></script>

## Splits, multijanela

No final do vídeo anterior faço um split da tela horizontal e existem várias
maneiras de fazer isso.

A gerência de janelas é data por `<ctrl-w><disposition>` onde `<disposition>`
pode ser `s` ou `n` para horizontal ou `v` para vertical. Use `<ctrl>ww`
para navegar entre as janelas do split. Também é possível clicar para focar em uma janela específica.

Eu me sinto muito confortável trabalhar e acompanhar o contexto de múltiplos arquivos de interesse.

No vídeo abaixo exploro algumas navegabilidades basicas entre arquivos em um projeto rails.

* `<esc>:Rmodel` vai para os modelos
* `<esc>:Runittest` vai para os testes do modelo
* `<esc>gf` go file: vai para arquivo/definição contextos diversos - até mesmo nas gems
* `<esc>bf` back file: volta para contexto anterior
* `<esc>,f` busca palavra sobre o cursor dentro do diretório
* `<esc>A` alterna entre model e teste
* `<esc>AS` divide a tela horizontalmente entre model e teste
* `<esc>AV` divide a tela verticalmente entre model e teste

<script type="text/javascript" src="https://asciinema.org/a/39561.js"
id="asciicast-39561" async></script>

E aí já pensou em dar uma chance para o VIM no seu workflow com Ruby e Rails?

Quais são os atalhos e conveniências que você vê nos outros editores que são parecidos com estes?

Você é um amante do sublime, atom, textmate? Deixe seu feedback!

Eu acredito que os editores são ferramentas chave para ter proudutividade no ambiente de desenvolvimento.

Eu uso o VIM para toda e qualquer edição que exige concentração e produtividade. Não apenas para programar :)

Abaixo fiz um live coding com ruby puro observando meus vícios de linguagem no
blog:

<script type="text/javascript" src="https://asciinema.org/a/39562.js" id="asciicast-39562" async></script>
