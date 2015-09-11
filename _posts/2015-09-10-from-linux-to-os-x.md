---
  layout: post
  title: Migrando do linux para o Mac OS X
  categories: ['mac','linux']
---

Ontem o [Wellington Mitrut](http://wmitrut.com) veio super empolgado para mim
pedindo dicas do que instalar e o que vai mudar agora que ele vai comprar um Mac.

Então aqui vai algumas dicas para quem vive no Linux e vai migrar para o OS X da Apple:

# brew = apt-get

O Home Brew ou [brew](http://brew.sh) funciona como o `apt-get` do linux. Vale a pena pois
tem muitos pacotes, bibliotecas e facilidades nas receitas da comunidade.

    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

Com o brew instalado é possível instalar as bibliotecas e coisas básicas a lá `apt-get`.

    brew install go redis postgresql

Também vale a pena instalar o brew-cask que permite instalar apps do mac mesmo
não só bibliotecas.

    brew install caskroom/cask/brew-cask

Com o brew cask você instala coisas como:

    brew cask install google-chrome firefox skype telegram slack openscad

# Terminal -> iTerm2

No OS X por default vem o `Terminal.app`. Porém aconselho a dar uma olhada no
[iTerm2](https://iterm2.com).

    brew cask install iterm2

O iTerm2 é um terminal muito bom e têm uma série de pequenas melhorias que só para quem usa
bastante o terminal vai sentir a diferença. Entre elas posso citar:

Integração com tmux default:

* `cmd-d` divide a tela horizontalmente em duas sessões do tmux.
* `cmd-shift-d` divide verticalmente
* `cmd-alt-<arrows>` navega entre sub-janelas da sessão

# { Shell | Zsh | Fish } wtf?

Outra questão é a decisão pela linguagem do terminal. Eu gosto muito do
[oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) que torna o terminal
mais colorido, interativo e inteligente.

Neste momento estou testando o [fish](http://fishshell.com/) e é uma linguagem
muito receptiva, interativa, umas sugestões bem mais elaboradas que o shell
convencional. Estou gostando da experiência :)

O shell em si é muito bom e uso o tempo todo. Um comando que substitui a pouco
tempo é o [silver light searcher](http://geoff.greer.fm/ag/) aka `ag`. O `ag` é
um `grep` mais humanizado. Vale a pena dar uma testada!

    brew install ag

O ag é um mecanismo de busca então você pode encontrar facilmente arquivos no
terminal. Então é muito semelhante a um `grep -rni <minha busca> <onde>`

    ag <minha busca> <onde>

# PrintScreen || ScreenShot

Sou viciado em printscreen então tiro fotos e registro meu trabalho e detalhes
do que estou fazendo o tempo todo. Para capturar uma foto da tela em um
determinado momento é muito fácil.

## `cmd+shift+3`

Sim, esse atalho é super escroto mas depois de um tempo você se acostumar,
alguns atalhos do mac parece que você tá tocando piano mesmo. `cmd+shift+3`
é o atalho para tirar uma foto da tela toda.

## `cmd+shift+4`

O Cmd + Shift + 4 também tira foto mas abre um momento para você selecionar um
pedaço da tela que quer tirar o printscreen. Isso é muito útil, é só selecionar
um pedaço da tela com o mouse, quando solta o mouse, ele tira uma foto da parte
selecionada.

### `cmd+shift+4+space`

Outra dica importante deste comando é, se você ao invés de usar o mouse para selecionar o pedaço
da tela, usar a barra de espaço uma vez, aí vai abrir uma seleção para tirar o
printscreen permitindo selecionar a janela que deseja ser fotografada.

## `| pbcopy`

O pbcopy permite você copiar um determinado output no terminal para o `cmd+v` ou `ctrl+v` antigo do linux.

    cat arquivo.txt | pbcopy

Com o arquivo acima, ele vai copiar o conteúdo do arquivo.txt para a área de
transferência. Agora basta dar um `cmd+v` para colar. Uso muito este comando
quando estou realizando consultas complexas no servidor então em vez de
trabalhar diretamente no console uso o vim normalmente e uso `<esc>:!cat % | pbcopy`
para copiar todo o conteúdo que estou editando para colar no ambiente que estou trabalhando.

## Só funciona no linux não funciona no mac?

Sem problemas! Maquinas virtuais são muito eficazes para não manter a máquina
pesada.

    brew install vagrant
    brew cask install virtualbox

Dessa forma, se você vai instalar um projeto que usa: postgres, redis e
n serviços, pode subir uma maquina virtual linux com todos eles e mapear as
portas para consumir em localhost. Esse processo é muito interessante e pode
também ser aplicado no linux. Ajuda a manter o ambiente distinto e livre de
pequenos ruidos de incompatibilidades entre versões que podem aparecer ao longo
do tempo.
mac. Uma maneira bem simples de não poluir o ambiente inicializando muitos
serviços, bancos de dados e outras aplicações no amb

## `cmd+space` -> spotlight = busca rápida

O spotlight é uma ferramenta fantástica de acesso a qualquer coisa do Mac. Você
pode pesquisar no dicionário, no google, nos seus arquivos, na agenda ou
calculadora através desta engine de busca. Ela é eficiente e rápida.

Eu gosto muito de usar a integração do spotlight com o dicionário. Você pode
instalar dicionários específicos dentro do spotlight e acessar documentações e
outros documentos estáticos com rapidez.

Fora o dicionário nativo em inglês, minhas extensões de dicionários customizados são 
as documentações do ruby e do rails.

Apesar de pouco atualizado são bem úteis. Você pode encontrar detalhes [aqui](http://prii.it/blog/rails4-and-ruby2-dictionaries).

# E aí? Mac ou Linux?

E você, usa mac e migrou do linux? Não gosta de mac, só de linux? não deixe de
colocar sua contribuição e opinião.

Para mim não existe exatamente nada de tão apaixonante que faça eu escolher
usar o mac no meu dia a dia. Apenas um conjunto de ferramentas mais estáveis.
Um hardware de qualidade. Um sistema operacional estável e totalmente compatível com o hardware.
Mas é um unix. Funciona da mesma maneira que o linux.

Se você está pensando em comprar apenas para mostrar pros coleguinhas, por favor NÃO FAÇA ISSO.

Tenha outros objetivos por que a máquina é boa, o sistema operacional é bom e
basta saber usá-lo. No entanto não vai te fazer programar melhor, ser mais ágil
ou mesmo ter mais sucesso na vida. A maior diferença é que você começa a pagar
pelo software e antes só pagava pelo hardware.

Não deixe de contribuir com outras ferramentas importantes que fazem parte do seu workflow de
desenvovimento!