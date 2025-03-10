---
title: "Fish shell"
layout: post
categories: ['fish', 'shell', 'unix', 'terminal']
description: "O fish shell é uma linha de comando como shell ou zsh."
---
O [fish shell](https://fishshell.com) é uma linha de comando como [shell](https://pt.wikipedia.org/wiki/Shell_script) ou [zsh](http://www.zsh.org/).

A um tempo conheci e estou gostando bastante da experiência. Finalmente um
terminal que traz um pouco mais de experiência com o usuário.

Você pode usar o `apt-get install fish` ou `brew install fish` para instalar no
seu sistema operacional preferido.

Para rodar é só digitar `fish`.

Fish é como um shell convencional. Têm poucas diferenças de sintaxe e também é
um pouco mais inteligente em alguns aspectos de sugestões e auto completar.

O [Tutorial](https://fishshell.com/docs/current/tutorial.html) original é muito
bom e vou mostrar as coisas que mais gostei até agora:

## Auto sugestões

As sugestões quando está digitando podem ser aplicadas com `TAB` + `ENTER` ou `CTRL-F` para atacar a primeira. Com tab você pode navegar nas sugestões.

<script type="text/javascript" src="https://asciinema.org/a/39349.js"
id="asciicast-39349" async></script>


## Variáveis

Ao invés de usar `export` para variáveis de ambiente, no fish usa-se `set <opcoes> nome_variavel valor_variavel`

    set -U EDITOR vim

* `-U` de universal
* `-g` para ser global da sessão
* `-l` local do contexto

    set -gx GOPATH $HOME/Code/go

## Cadê o `.bashrc`?

As funções auto-carregáveis ficam no diretório `~/.config/fish/config.fish`.

Então lá você pode fazer aquela alteração marota do seu PATH para adicionar
outros diretórios com seus binários favoritos :)

    set PATH $PATH:$GOPATH/bin

Ou carregar outros arquivos fish que sejam interessantes:

    . $fish_path/oh-my-fish.fish

Ou seu tema favorito:

    Theme 'robbyrussell'

Ou plugins do fish:

    Plugin 'theme'

## Funções

As funções são altamente utilizadas no fish. Tanto que até existem alias mas é
fortemente aconselhado usar funções ao invés de alias.

Por exemplo, em fish não existe a variável `$PS1` que é utilizada para exportar
a linha default do prompt. Para isso implementa uma função chamada `fish_prompt`.

Veja no asciicast abaixo eu substituindo a linha padrão do terminal:

<script type="text/javascript" src="https://asciinema.org/a/39350.js"
id="asciicast-39350" async></script>

## Fisherman

Eu estou curtindo muito usar o [fisherman.sh](http://fisherman.sh/). Um
gerenciador de pacotes fish, permite você instalar plugins para o fish e criar
seus próprios.

    curl -sL get.fisherman.sh | fish

Com o fisherman você terá um comando `fisher` que permite instalar coisas
legais :)

    fisher install flash

<script type="text/javascript" src="https://asciinema.org/a/39353.js"
id="asciicast-39353" async></script>


Têm varios plugins legais para instalar e para usar seus próprios plugins é só
passar sua URL do git onde está o code ou o arquivo local e o `fisher` também
instala.

Veja o projeto [fisherman no github](https://github.com/fisherman/fisherman).

## `fish_config`

Essa é uma das partes mais "mágicas" do fish by default.

O fish cria um servidor web para você customizar a interface dele.

Digite `fish_config` em um terminal fish e ele vai abrir o browser pra você
configurar os detalhes do seu terminal.

