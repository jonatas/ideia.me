---
  layout: ideiame
  title: Chave Dicotômica
---

# {{ page.title }}

Hoje, inspirado pelo [post de ontem][pequenas-decisoes] decidi começar a [abrir alguns exemplos][github] que venho produzindo. Este primeiro trata-se de um aplicativo que estou criando com minha namorada Tânia que é bióloga para identificação de espécies de árvores. Estamos criando uma árvore de navegação apartir de um mecanismo árduo de leitura traduzido no livro que ela usava como base. O nome do mecanismo é [Chave Dicotômica][wikipedia]. A necessidade surgiu que o trabalho de procurar e navegar no livro é chato e lento, pois é necessário entender as especificações técnicas de cada parte da árvore e saber o que é cada particularidade de cada parte do contexto. Além de folhar várias vezes pra frente e pra trás. Veja meia página das menores chaves do livro.

![fotolivro]

Estive alguns dias na floresta com ela e foi muito divertido aprender um pouco de cada detalhe para identificação de uma espécie. Tivemos poucas evoluções no código, mas já criei a parte da navegação que é o pior trabalho com o livro.

O livro que ela usa tem 156 páginas de espécies divididas em 7 chaves principais. Já estamos na chave 4. Neste exemplo irei apenas utilizar a Chave 1 e 2 que são as mesmas da foto anterior.

## O desafio da linguagem natural

Para chegar ao texto acima foi um caso muito pensado. Após a Tânia me explicar a ideia de como funcionava a chave, fiquei em dúvida sobre como ela iria alimentar o sistema com estas informações. Criar um cadastro de chaves? De espécies? Ou de termos? Tudo passava pela cabeça pois os conteúdos estavam a disposição e quem iria inserir os conteúdos não era eu.

Decidi então por copiar o texto na integra e iria criar um parser com expressões regulares para criar a chave dicotômica em formato de árvore mesmo. Analisei a chave e consegui absorver todo o conteúdo nas seguintes regras:

1. Definições de novas chaves, estão em letra maiúscula
2. Definições de items iniciam com números que serão seus id's
3. Items terminados com .... mais um número conectam a outro item com o mesmo id
4. Espécies iniciam com 4 espaços

## Exemplo do livro

Esta foi a linguagem natural mais próxima ao exemplo da foto anterior.

<div><pre>
CHAVE 1 - PLANTAS DESPROVIDAS DE FOLHAS
1. Ramos suculentos, colunares, sucados longitudinalmente, com tufos de acúleos, sem espinhos terminais
    14.1 Cereus hildmannianus
1. Ramos não suculentos, comprimidos lateralmente, com espinho terminal, decussados, ocasionalmente de formato triangular
    61.1 Colletia paradoxa
CHAVE 2 - PALMEIRAS
1. Plantas com acúleos
    9.1 Acrocomia aculeata
1. Plantas sem acúleos .... 2
2. Lâminas em forma de leque, tão largas quanto compridas
    9.9 Trithrinax brasiliensis
2. Lâminas não em forma de leque, mais compridas que largas .... 3
3. Base dos pecíolos permanecendo ao longo do caule
    9.2 Butiaca pitata
    9.3 Butia eriospatha
    9.4 Butia yatay
3. Base dos pecíolos não permanecendo nos caules .... 4
4. Segmentos da folha dispostos em mais dois planos
    9.8 Syagros romanzoffiana
4. Segmentos da folha dispostos em dois planos .... 5
5. Base dos pecíolos de cor acinzentada
    9.5 Butyagros x nabuannandii
5. Base dos pecíolos de cor verde .... 6
6. Bainhas foliares envolvendo completamente a porção apical do caule
    9.6 Euterpe edulis
6. Bainhas foliares não envolvendo completamente a porção apical do caule
    9.7 Geonoma schottiana
</pre></div>

## Expressões regulares - diversão pra noite toda

Agora chegamos as expressões. Absorvendo caso a caso vamos criar as expressões regulares separadas.

### 1. Definições de novas chaves, estão em letra maiúscula

Essa foi fácil, sempre *inicia* com a palavra CHAVE, tém um número sequencial e um traço que divide da descrição.
<div><pre class="prettyprint">
CHAVE = /^CHAVE (.*) - (.*)/
</pre></div>

### 2. Definições de items iniciam com números que serão seus id's

Os items como "1. Plantas com acúleos" ou que apontam para outros como  "5. Base dos pecíolos de cor verde .... 6" casam nesta expressão regular. Inicia(^) com número(\d+) seguido de ponto (\\.) com barra invertida pois "." é um caractér especial nas expressões regulares. 
Neste caso a expressão está apenas buscando genéricamente por qualquer final, sem distinção de ter ou não o link.

<div><pre class="prettyprint">
ITEM = /^(\d+)\.\s(.*)$/
</pre></div>

### 3. Items terminados com .... mais um número conectam a outro item com o mesmo id

Os items terminados com link para outros items são o segredo que mata o trabalho árduo de pesquisar no livro. A conecção está ligada com logo em seguida. Estes itens serão conectados a outros itens em um futuro próximo.

<div><pre class="prettyprint">
LINK = /\s\.{4}\s(\d+)$/
</pre></div>

### 4. Espécies iniciam com 4 espaços

\s identifica um espaço e isso torna mais claro do que construir uma expressão como `/ {4}/`, e as chaves permitem adicionar o número de ocorrências.

<div><pre class="prettyprint">
SPECIE = /^\s{4}(.*)/
</pre></div>

## Chave completa

Então unindo todas estas expressões sobre o arquivo anterior, devemos criar uma árvore com nodos. Reusufruindo do mundo opensource, vamos extender a classe Tree::TreeNode da biblioteca ruby-tree.

Para instalar a biblioteca digite:

<div><pre>gem install ruby-tree</pre></div>

A biblioteca tem uma classe principal chamada TreeNode, ela tem os attributos nome e conteúdo, sendo o nome de cada nodo único. A classe Dicotomica representa a raiz de todas as chaves dicotômicas, logo irá adicionar todas as chaves a raiz e cada item dentro de cada chave conforme as regras comentadas anteriormente.

<div><pre class="prettyprint">
require "rubygems"
require "tree"
class Dicotomica &lt; Tree::TreeNode
  attr_reader :last_node, :last_root
  def initialize name = "Chave Dicotômica", content = nil, load_from = "dicotomica.txt"
    @pending_replace = {}
    super name,content

     if load_from
       File.readlines(load_from).each do |instruction|
         know(instruction.chomp)
       end
     end
  end

  CHAVE = /^CHAVE (.*) - (.*)/
  ITEM = /^(\d+)\.\s(.*)$/
  LINK = /\s\.{4}\s(\d+)$/
  SPECIE = /^\s{4}(.*)/
  
  def know(string)
    if string
      case string
      when CHAVE 
        add_root  [$1,$2].join(" - ")
      when ITEM
        if replace_node = @pending_replace[$1]
           @last_node = replace_node &lt;&lt; Tree::TreeNode.new(string)
        else
           add_node string
        end
        if string =~ LINK
           @pending_replace[$1] = @last_node
        end
      when SPECIE
         add_specie $1
      end
    end
   end
   def add_root name
      @last_root = self &lt;&lt; Tree::TreeNode.new(name, 'root')
   end
   def add_node name
      @last_node = @last_root &lt;&lt; Tree::TreeNode.new(name, 'node')
   end
   def add_specie name
      @last_node &lt;&lt; Tree::TreeNode.new(name, "specie")
   end
end
</pre></div>

Rodando o arquivo texto com o algorítmo acima temos uma nova árvore pronta para ser desfrutada:

O bacana de trabalhar com ruby é poder utilizar cada parte do código independente. Observe a utilização desta árvore dentro do [fonte][github].

<div><pre>
jonatas@jonatax:~/chave-dicotomica-android/src$ irb -r dicotomica.rb 
irb(main):001:0&gt; Dicotomica.new.print_tree;nil
* Chave Dicotômica
|---+ 1 - PLANTAS DESPROVIDAS DE FOLHAS
|    |---+ 1. Ramos suculentos, colunares, sucados longitudinalmente, com tufos de acúleos, sem espinhos terminais
|        +---&gt; 14.1 Cereus hildmannianus
|    +---+ 1. Ramos não suculentos, comprimidos lateralmente, com espinho terminal, decussados, ocasionalmente de formato triangular
        +--- \\&gt; 61.1 Colletia paradoxa
+---+ 2 - PALMEIRAS
    |---+ 1. Plantas com acúleos
|        +---&gt; 9.1 Acrocomia aculeata
    +---+ 1. Plantas sem acúleos .... 2
        |---+ 2. Lâminas em forma de leque, tão largas quanto compridas
|            +---&gt; 9.9 Trithrinax brasiliensis
        +---+ 2. Lâminas não em forma de leque, mais compridas que largas .... 3
            |---+ 3. Base dos pecíolos permanecendo ao longo do caule
|                |---&gt; 9.2 Butiaca pitata
|                |---&gt; 9.3 Butia eriospatha
|                +---&gt; 9.4 Butia yatay
            +---+ 3. Base dos pecíolos não permanecendo nos caules .... 4
                |---+ 4. Segmentos da folha dispostos em mais dois planos
|                    +---&gt; 9.8 Syagros romanzoffiana
                +---+ 4. Segmentos da folha dispostos em dois planos .... 5
                    |---+ 5. Base dos pecíolos de cor acinzentada
|                        +---&gt; 9.5 Butyagros x nabuannandii
                    +---+ 5. Base dos pecíolos de cor verde .... 6
                        |---+ 6. Bainhas foliares envolvendo completamente a porção apical do caule
|                            +---&gt; 9.6 Euterpe edulis
                        +---+ 6. Bainhas foliares não envolvendo completamente a porção apical do caule
                            +---\\&gt; 9.7 Geonoma schottiana
=&gt; nil
irb(main):002:0&gt; 
</pre></div>

## Ruboto

Ruboto é uma gem muito legal que permite portar jruby e criar aplicativos para android usando jruby ao invés de java. É bem divertido e como sou apaixonado por ruby tive que experimentar.

<div><pre>
gem install ruboto
</pre></div>

Ruboto é estilo rails e tem seu próprio gerador de aplicativos e outras atividades. Para criar o aplicativo usei o seguinte comando:

<div><pre>
ruboto gen app --package=me.ideia --target 1 --name ChaveDicotomicaAndroid --path /diretorio/destino
</pre></div>

Use `ruboto gen app --help` para ver todas as opções. No site [ruboto] tem muitas coisas interessantes para se aprender e o melhor mesmo é baixar o projeto do ruboto-irb para testar no próprio aparelho.

E aqui está o código da aplicação que é apenas uma Activity principal:

<div><pre class="prettyprint">
require 'ruboto/activity'
require 'ruboto/widget'
require 'ruboto/menu'
require 'ruboto/util/toast'
require 'dicotomica'
ruboto_import_widgets :LinearLayout, :EditText, :TextView, :ListView, :Button
$activity.start_ruboto_activity "$dicotomica" do
  @dicotomica = Dicotomica.new
  def on_create(bundle)
    start_tree
  end
  def start_tree
      @node = @dicotomica
      go_to_list 
  end
  def go_to_list 
    items = @node.children.collect(&:name)
    setContentView(list_view :list =&gt; items, 
          :on_item_long_click_listener =&gt; proc{|av, v, pos, item_id| 
                @node = @node.children[pos]
                help_about
          },
          :on_item_click_listener =&gt; proc{|av, v, pos, item_id| 
                @node = @node.children[pos]
                if @node &amp;&amp; @node.hasChildren?
                  go_to_list
                else

                  toast("Espécie encontrada")
                end
         }
    )
  end
  def about_us
    setContentView(Ruboto::R::layout::about)
    true
  end
  def help_about
    toast("Help about: #{@node.name}")
  end
  handle_create_options_menu do |menu|
    add_menu("Chave Dicotômica") { start_tree }
    add_menu("Sobre nós") { about_us }
    add_menu("Exit") {finish}
    true
  end
end
</pre></div>

Se você tem um android [baixe aqui][apk] e instale no seu próprio aparelho esse exemplo.

Abaixo seguem os printscreens do aplicativo:

## Tela inicial

A tela inicial já começa com um list view, e é indicado pelo método on\_create do código anterior. O list view, por sua vez vem carregado com os filhos do primeiro nível da chave dicotômica, que neste caso são as chaves.

![inicial]

## Tela inicial com o menu

O menu foi criado no último bloco do arquivo anterior com handle\_create\_menu\_options

![inicialcommenu]

## Tela sobre

A tela de sobre é um caso diferente e que foi o mais difícil até encontrar a solução. Este caso está utilizando a interface de recursos gerados pelo android através do xml. Note que o resource *R* vem *dentro* do módulo *Ruboto*, sendo *Ruboto::R* ao invés do *R* convencional na programação android.

![sobre]

## Navegando entre nodos

Este print screen apenas pra mostrar que está funcionando a navegação entre nodos internos da árvore.

![navegando]

## Espécie encontrada

Exemplo do toast rodando :D

![encontrou]

## Conclusões

Aparentemente é muito simples trabalhar com jRuby no Android, no entanto ainda não parece ser tão viável pela demora do jRuby para inicializar. Estou contando que as próximas versões se superem pois atualmente demora 17 segundos para inicializar o jruby no meu aparelho (Sansung Galaxy Ace). A inicialização do app é muito rápida, quando roda sobre o irb, é muito fácil de perceber que a VM é que demora pra carregar, e tirando isso é excelente. 

[wikipedia]: http://pt.wikipedia.org/wiki/Chave_(biologia)
[github]: https://github.com/jonatas/chave-dicotomica-android
[ruboto]: http://ruboto.org
[apk]: https://github.com/jonatas/chave-dicotomica-android/raw/master/bin/Dicotomica.apk
[fotolivro]: ../../../images/foto-livro-chave-dicotomica.jpg
[inicial]: ../../../images/cda-tela-inicial.png
[inicialcommenu]: ../../../images/cda-com-menu.png
[sobre]: ../../../images/cda-about.png
[navegando]: ../../../images/cda-navegando.png
[encontrou]: ../../../images/cda-encontrou-especie.png
