---
  title: Observando a memória no ruby
  layout: post
---



Hoje fiz vários testes de gerência de memória e achei interessante como cada ganho de byte pode ser interessante conforme a quantidade de dados que se tem para manusear. Apesar da memória ser barata, tratando-se de performance e escalabilidade o barato sai caro muitas vezes.

Então olhando para os gargalos do sistema observei um hash muito utilizado em um determinado sistema e então resolvi montar esta comparação.

A brincadeira começa com uma simples array de 1000\_000 registros e populamos ela das seguintes formas:

## Hash - memory\_a.rb
<pre class="prettyprint">
a = []
sum = 0
100000.times do |i|
   sum += 1
   a &lt;&lt; {:i => i,
         :sum => sum}

end
</pre>

## Struct - memory\_b.rb
<pre class="prettyprint">
a = []
B = Struct.new :i, :sum
sum = 0
100000.times do |i|
    sum += 1
    a &lt;&lt; B.new(i,sum)
end
</pre>

## Array - memory\_c.rb
<pre class="prettyprint">
i = []
sums = []
sum = 0
100000.times do |i|
    sum += 1
    i &lt;&lt; i
    sums &lt;&lt; sum
end
</pre>

## Class com métodos - memory\_d.rb
<pre class="prettyprint">
a = []
class B
  def initialize i, sum
    @i = i
    @sum = sum
  end
  def i
    @i
  end
  def sum
    @sum
  end
end
sum = 0
100000.times do |i|
  sum += 1
   a &lt;&lt; B.new(i,sum)
end
</pre>

## Class com accessors - memory\_e.rb
<pre class="prettyprint">
a = []
sum = 0
class B
  attr_accessor :i, :sum
  def initialize i, sum
    @i = i
    @sum = sum
  end
end
100000.times do |i|
  sum += 1
  a &lt;&lt; B.new(i,sum)
end
</pre>

## Class sem métodos - memory\_f.rb

<pre class="prettyprint">
class B
  instance_methods.each { |m| undef_method m unless m =~ /^__|object_id/ }
  attr_accessor :i, :sum
  def initialize i, sum
    @i = i
    @sum = sum
  end
end

a = []
sum = 0
100000.times do |i|
  sum += 1
  a &lt;&lt; B.new(i,sum)
end
</pre>

Observando os resultados com jruby-1.7.3 temos os seguintes tamanhos de memória em bytes:

 arquivo      |    memória
--------------|------------
 memory\_a.rb |  106409984
 memory\_b.rb |   94859264
 memory\_c.rb |   95125504
 memory\_d.rb |   95064064
 memory\_e.rb |   94691328
 memory\_f.rb |   94236672

No meu caso o modelo __memory\_f__ parece ser o mais adequado em vista do consumo de memória e a implementação também é relativamente simples. O interessante destes objetos em branco é por que de certa forma eles não podem ser clonados, mas para casos específicos podem ajudar muito, neste caso têm uma significância de aproximadamente 12%.

Baixe e teste o [code] você mesmo!

Assim que sobrar um tempo vou evoluir os modelos para comparar entre tipos de númericos. Hoje estamos usando o java.math.BigDecimal para cálculos precisos mas este é um dos mais lentos e grandes para trabalhar com números.

[code]: https://github.com/jonatas/ruby-memory-comparison
