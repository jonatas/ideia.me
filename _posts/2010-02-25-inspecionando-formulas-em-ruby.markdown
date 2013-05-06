---
  layout: post
  title: Inspecionando fórmulas em ruby
  categories: ['ruby', 'regexp', 'gerencia de projetos']

---

# Inspecionando fórmulas no ruby

Em 2009, criei um projeto no github com as [fórmulas basicas][github-sl-for-gp] de "gerência de projetos", o qual condecorei com o nome [Sopa de Letrinhas para gerência de projetos][github-sl-for-gp]. O objetivo deste [repositório][github-sl-for-gp] era reunir as fórmulas que me atormentavam ao serem cálculadas manualmente.

Durante o desenvolvimento, encarei muitas dificuldades na inspeção das fórmulas. Como não estava escrevendo testes, então encontrei uma maneira de visualizar o desenvolvimento das fórmulas. O objetivo deste post, é exibir a facilidade de inspecionar um código simples. Os exemplos aqui, são apenas fragmentos do [projeto original][bac] aonde possui a [explicação][bac] de cada uma das variáveis.

O exemplo abaixo aborda apenas a especificação dos valores necessários para o uso de cada fórmula. 

<div><pre class="prettyprint">
percentual = 30/100.0
bac = 100_000_000
ac  = 35_000
pv  = 25_000 
</pre></div>

A variável **percentual**, refere-se ao percentual realizado do projeto.
Já o **bac** refere-se ao total orçado para o projeto. O **ac** refere-se ao custo gasto até o momento, e **pv** refere-se ao valor planejado.


As fórmulas a seguir, referêm-se aos variáveis acima atribuídas.

<div><pre class="prettyprint">
formulas = [
  "ev = (bac*percentual)",
  "cv = ev - ac",
  "cpi = ev / ac",
  "spi = ev / pv",
  "sv = ev - pv",
  "eac = bac / cpi",
  "etc = bac - ev"
]
</pre></div>

A declaração acima, trata cada fórmula como uma string. O objetivo agora é substituir a string pelas variáveis reais. Para isso é necessário iterar sobre as fórmulas e executá-las através do comando **eval**, que é capaz de executar um código ruby, apartir de uma string.

Como o objetivo aqui é inspecionar as fórmulas, após a execução da fórmula, será impresso a expressão da fórmula, substituindo a variável pelo seu valor.

<div><pre class="prettyprint">
for formula in formulas 
  eval formula
  puts "#{formula}: #{formula.gsub(/\w+/){|r|eval(r).to_s}}"
end
</pre></div>

Quando as três partes de código acima descritas são executadas, nesta mesma sequência, o seguinte resultado é exibido:

<div><pre class="prettyprint">
ev = (bac*percentual): 30000000.0 = (100000000*0.3)
cv = ev - ac: 29965000.0 = 30000000.0 - 35000
cpi = ev / ac: 857.142857142857 = 30000000.0 / 35000
spi = ev / pv: 1200.0 = 30000000.0 / 25000
sv = ev - pv: 29975000.0 = 30000000.0 - 25000
eac = bac / cpi: 116666.666666667 = 100000000 / 857.142857142857
etc = bac - ev: 70000000.0 = 100000000 - 30000000.0
</pre></div>

Pronto! A parte em que realmente faz a inspeção da fórmula não passa de: 

<div><pre class="prettyprint">
  formula.gsub(/\w+/){|r|eval(r).to_s}
</pre></div>

Ou seja, cada variável é capturada da fórmula usando **\w+** e resgatado o seu valor através do eval, e substituído na fórmula, mantendo apenas os operadores. 

Da mesma forma como o **gsub** permite usar capturar o valor de [cada casamento usando **\\&amp;**][regex-sinatra], também pode ser tratado como string, quando declarado um bloco de código como segundo parâmetro do gsub. 

Abaixo segue o help que gerei pensando em informar o objetivo de cada variável:

<div><pre class="prettyprint">
help = {
  "PV – Planned Value" => 
     "É o valor estimado do trabalho planejado a realizar até uma data determinada.
      Por exemplo, se um projeto tem um orçamento de R$ 100.000,00
      para realizar em um prazo de 12 meses, então o mês 6 representará o 50% do trabalho do projeto, 
      portanto, o PV para o mês 6 será de R$ 50.000,00",

  "EV - Earned Value" => 
      "É o valor planejado do trabalho realmente completado até uma data determinada.
       Por exemplo, se um projeto tem um orçamento de R$ 100.000,00 
       e o trabalho completado em uma data determinada representa o 25% do projeto completo, 
       o EV será de R$ 25.000",

  "AC - Actual Cost" =>
      "É o gasto real incorrido para o trabalho realmente completado 
       Por exemplo, se um projeto tem um orçamento de R$ 100.000,00 
       e o gasto real até uma determinada data foi de R$ 35.000,00 
       o AC do projeto é de R$ 35.000,00",
        
  "BAC - Budget at Completion" => "Orçamento total do projeto",

  "ETC - Estimate to completion" => "Estimativa para terminar",

  "EAC - Estimate at complete" => "Quanto espero gastar ao final do projeto. 
       Ou seja, baseado na experiência do projeto qual será o custo final. 
       Há várias formulas diferentes para calcular o EAC",

  "SV - Scheduled Variation" => "Variação do Cronograma/Prazos
       SV é a diferença, em termos de custos, entre o Valor Agregado (EV) 
       e a agenda da linha de base (PV). Se SV for positiva, estará adiantado;
       Se SV for negativa, estará atrasado;",

   "SPI - Scheduled Performance Index" => "Índice de Performance do Cronograma/Prazos
    SPI: é a divisão entre o Valor Agregado (EV) e o valor planejado na linha de base (PV).
    Mostra a taxa de conversão do valor previsto em valor agregado. Se SPI for maior que 1,
    o projeto está sendo realizado a uma taxa de conversão maior do que a prevista, ou seja, adiantado; 
    Se SPI for menor que 1, o projeto está sendo realizado a uma taxa de conversão menor do que a prevista, 
    ou seja, atrasado;"
}
</pre></div>

ps: Não sou fãn desta método de gerência de projetos, o objetivo aqui é puramente exibir as funcionalidades do **eval** e **gsub** em **Ruby**.

[github-sl-for-gp]: http://github.com/jonatas/SL-FOR-GP
[bac]: http://github.com/jonatas/SL-FOR-GP/blob/master/bac.rb
[regex-sinatra]: /regexp/ruby/sinatra/2010/02/16/inspecionando-regexp-com-sinatra.html
