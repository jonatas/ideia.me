---
title: "Buscando com silver searcher"
layout: post
categories: ['terminal', 'unix', 'grep']
description: "Sempre fui viciadão em fazer buscas com o grep."
---
Sempre fui viciadão em fazer buscas com o grep.

Porém um dia o [@brodock](https://twitter.com/brodock) me mostrou o `ag`.

## `ag` -> The Silver Searcher

Ele funciona como o `grep` porém é um pouco mais humanizado.

Para instalar no mac use:

    brew install the_silver_searcher

ou no linux:

    apt-get install silversearcher-ag


Ele também tem integração com o vim: meu editor favorito. Então é só adicionar
o [NeoBundle](https://github.com/Shougo/neobundle.vim)

    NeoBundle 'rking/ag.vim'

## Diferenças para o grep

Na real não existem grandes diferenças. Ele apenas é mais amigável e por padrão
já vem mais configurado.

Eu busco `ag busca` é muito semelhante a usar `grep --color -nri busca ./*`. 

Só não preciso lembrar do que quer dizer `-nri` onde:

* `--color` usar cores
* `n` mostra o número
* `r` busca recursiva nos sub diretórios
* `i` ignore case sensitive

Abaixo exemplo fazendo buscas com grep vs ag.

<script type="text/javascript" src="https://asciinema.org/a/39465.js"
id="asciicast-39465" async></script>

No vim também tenho um keybind `<esc>,f` que uso para buscar com foco na
palavra sobre o cursor. Muito útil fazer esse link para ganhar produtividade.

