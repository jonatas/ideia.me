---
  layout: post
  title: Raspberry PI sem mouse
  categories: [raspberry pi, linux, debian, interface]
---

Durante os últimos dias venho me desafiando a não comprar um mouse para utilizar no raspberry pi. Está rodando o raspibian original mas acabo utilizando a interface gráfica poucas vezes. No entanto precisei aprender um pouco sobre esta interface e principalmente sem mouse acabei me batendo um pouco no começo.


Por padrão, o comando é ``startx`` para iniciar a interface gráfica.

 
## ALT+F2 = Rodar comando

No ambiente gráfico. O primeiro atalho interessante é o ``ALT+F2``. Com este comando é possível rodar um comando em ambiente gráfico. Experimente ``lxterminal`` no imput que aparecer.

## CTRL+ALT+F1 = volta para o terminal

 Se tudo travar ou algo der errado e você não conseguir mais manipular a interface gráfica sem o mouse, só lhe resta um ``CTRL+ALT+F1`` para voltar para a tela do terminal. Lá você pode dar um ``CTRL-C`` caso queira interromper o processo da interface gráfica, ou mesmo navegar nas outras tty do terminal usando ``ALT+F2`` para tty2 e ``ALT+F3`` para tty3 e assim por diante.

## Simulando o mouse com keynav

No descontentamento de não encontrar uma forma de manipular o mouse em si, fui dar um ``apt-cache search mouse | grep keyboard`` e acabei encontrando o keynav.

O [keynav](http://man.cx/keynav "keynav") é uma ferramenta simples e criativa que permite navegar com o mouse de maneira fractal. O processo é bem simples e interessante. Basicamente o mouse se posiciona ao centro da tela, e com as teclas ``H,J,K e L`` é possível manipular o mouse com precisão e velocidade.

Para instalar use:

    sudo apt-get install keynav

Depois no ambiente gráfico digite: ``ALT+F2`` para rodar um comando e depois digite keynav.

Para ativar o keynav use ``CTRL+;``.

Se você usa o VIM como eu não irá ter problemas em se adaptar com a navegação através das letras, caso contrário o mouse será útil :)

## Outros comandos úteis para interface gráfica no Raspibian

* ``lxtask`` visualiza os processos em tempo real no ambiente visual
* ``pcmanfm [diretorio]`` gerenciador de arquivos
* ``gpicview [arquivo]`` visualizador de imagem
* ``wpa_gui`` configure the wifi via interface gráfica
* ``midori [url]`` navegador web

