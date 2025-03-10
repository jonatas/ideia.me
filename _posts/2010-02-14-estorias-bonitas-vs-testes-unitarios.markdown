---
title: "Estórias Bonitas vs Testes Unitários"
layout: post
categories: ['coding for fun', 'tdd', 'bdd']
description: "Após ter saído da Leosoft, dia 11 voltei lá pela primeira vez, e foi para se reunir com o pessoal e fazermos um [coding dojo][coding-dojo] sobre TDD e BDD. S..."
---
# Estórias Bonitas vs Testes Unitários

Após ter saído da Leosoft, dia 11 voltei lá pela primeira vez, e foi para se reunir com o pessoal e fazermos um [coding dojo][coding-dojo] sobre TDD e BDD. Seguindo a idéia da [url anterior][coding-dojo], como exemplo para o evento, usamos um problema que implica em converter uma sintaxe de sql do Access para o padrão do Postgresql.

## Test::Unit 

Após coletar alguns exemplos de casos de sql que haviam uma mudança na sintaxe, resolvemos codificar um exemplo. Primeiro, escrevemos um exemplo clássico usando __test unit__ do ruby.

<div><pre class="prettyprint lang-ruby">
require 'test/unit'
require 'resolver.rb'
class RegexTest &lt; Test::Unit::TestCase
  def test_deve_converter_para_yyyy_mm_dd
    sql_access = "select DateValue('12/02/2010')"
    sql_esperado = "select '2010-02-12'"
    assert_equal resolver(sql_access), sql_esperado
  end
end
</pre></div>


## Cucumber 

Quando executamos o código acima e o teste passou, então resolvemos escrever uma estória do [Cucumber][cucumber], para fazer uma comparação entre os frameworks de teste.

<div><pre class="prettyprint">
Funcionalidade: Alterar um sql de Access para Postgresql
  Como um programador preguiçoso
  Desejo criar um conversor de string
  Por que quero poupar o meu tempo
  Cenário: Uso de DateValue na consulta
  Dado a consulta "select DateValue('12/02/2010')"
  Quando eu converter
  Então não deve conter a função DateValue
  E a data com formato yyyy-mm-dd
  E a consulta como "select '2010-02-12'"

  Dado a consulta "select DateValue('12/02/2010') as data_1, 
                          DateValue('12/04/1995') as b"

  Quando eu converter
  Então não deve conter a função DateValue
</pre></div>

Na estória acima, o exemplo é autoexplicativo, a forma como ele se descreve, permitiria que não precisasse de muitas explicações sobre qual era o objetivo do programa. Foi mais simples de entender o código, observe os seguintes passos:

<div><pre class="prettyprint">
require 'resolver.rb'

Dado /^a consulta "([^\"]*)"$/ do |consulta|
  @consulta = consulta
end

Quando /^eu converter$/ do
  @resolvida =  resolver(@consulta)
end

Entao /^não deve conter a função (.*)$/ do |string|
  @resolvida.should_not include(string)
end

Entao /^a data com formato  yyyy\-mm\-dd$/ do
  @resolvida.should match(/\d{4}-\d{2}-\d{2}/)
end

Entao /^a consulta como "([^\"]*)"$/ do |esperado|
  @resolvida.should == esperado 
end
</pre></div>

Mesmo usando mais linhas para codificação dos testes, [Cucumber][cucumber] transforma os testes em uma métodologia de teste auto-documentada.

Estou usando o [Cucumber][cucumber] desde sua primeira versão e cada dia gosto mais de programar com ele. Usando simples passos para descrever uma tarefa, tem-se um comportamento. 

Esquecendo do resultado esperado, BDD aborda o que cada linha faz, e o teste é mais responsável por o que a linha faz e não o resultado que ela retorna.

O código **resolver.rb** que é o código que resolve os dois testes acima, segue abaixo:

<div><pre class="prettyprint">
HAS_DATE_VALUE = /(.*)DateValue\(['"]([^\1]+)\1\)(.*)/
</pre></div>

<div><pre class="prettyprint">
def resolver(str)
  while str =~ HAS_DATE_VALUE
    start, date, finish = $1, $2, $3
    date = "'" + date.split("/").reverse.join("-") + "'"
    str = [start, date, finish].join 
  end
  str
end
</pre></div>
Durante o treinamento, usamos apenas o meu mac ligado a uma projetor. O pessoal ficou um pouco reprimido com o VIM, mas gostaram do TextMate. Foi um exercício legal, pois a maioria dos programadores era do Delphi, e logo conseguiram entender a codificação em Ruby. 

Após o coding-dojo, fizemos uma rápida retrospectiva sobre o treinamento e levantamos alguns pontos de melhorias do coding, e o próximo treinamento vai ter um horário maior e uma rotatividade de linguagens e assuntos. 

No próximo dojo, já foi definido que será usado a linguagem PlPgsql juntamente com PGUnit para bateria de testes. Eu sou muito fã desta biblioteca e sempre me ajudou em tarefas extensas de BD.

Durante este treinamento, o exemplo acima só foi apresentado no final. Outros exemplos semelhantes foram discutidos. Achei engraçado pois o pessoal do Delphi não trabalha muito com expressões regulares e eu simplesmente não conseguia pensar em outra forma de resolver o problema.
 
[coding-dojo]: http://pet.inf.ufsc.br/dojo/o-que-eh-dojo/
[cucumber]: http://cukes.info
