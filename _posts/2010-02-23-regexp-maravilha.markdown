---
  layout: ideiame
  title: Expressões Regulares + Ruby = \*maravilhas 
  categories: ['ruby', 'regexp']
  dirbase: /../../..
---

# {{ page.title }}

Sempre falo, que depois que conheci as expressões regulares, minha vida mudou! Semana passada, tive que converter um backup de um banco de dados do Oracle para o PostgreSql, então, reparei algumas diferenças na sintaxe.

A ideia para solucionar a diferença, foi criar uma método simples que conseguia manipular o código sql do Oracle e transformar no código PostgreSql. Cada um dos casos acima não passa de:

<div><pre class="prettyprint">
{ /diferenca do oracle/ =&gt; "para postgresql" }
</pre></div>

Ou diferenças envolvendo variáveis do contexto como:

<div><pre class="prettyprint">
{ /diferenca do (\w+)/ = &gt; lambda do |nome_do_sgbd|
      "para #{nome_do_sgbd}"
  end }
</pre></div>

Nesta idéia, foi simples de converter todos os códigos Oracle que havia diferença de sintaxe usando um Hash de casos:

<div><pre class="prettyprint">
CASES = { 
     /(ALTER TABLE .*) MODIFY +\((.*) NOT NULL ENABLE\);/im =&gt; lambda do |alter, column|
       "#{alter} ALTER COLUMN #{column} SET NOT NULL;"
     end,

     /ALTER TABLE "(.*)" 
       ADD PRIMARY KEY \((.*)\) ENABLE/im =&gt; lambda do |table_name, primary_keys| 
          "ALTER TABLE \"#{table_name}\" 
            ADD CONSTRAINT #{table_name}_PKEY 
            PRIMARY KEY (#{primary_keys});"
     end,

     /(.*) BIGINT\((.*)\)(,)?/im =&gt; lambda do |column_name, range, comma|
         "#{column_name} NUMERIC(#{range})#{comma}"
     end,
     / NUMBER/im         =&gt; lambda { " BIGINT" },
     /DEFAULT SYSDATE/im =&gt; lambda { "DEFAULT now()" },
     /VARCHAR2/im        =&gt; lambda { "VARCHAR" }
}
</pre></div>

Desta forma, cada caso, já está mapeado com a sua devida solução, sendo apenas necessário criar o código que manipula o arquivo do Oracle de entrada, e gera o arquivo PostgreSql de saída.

Um exemplo simples de utilização dos casos acima, por sinal muito inspirado no **cucumber**, seria criar uma método que avalie os **casos**, e em cada **expressão regular**, verificaque a probabilidade de **substituição** pela nova sintaxe (no caso Oracle para PostgreSql).

<div><pre class="prettyprint">
def convert(sql)
  CASES.each do |regexp, replacer|
    while match = sql.match(regexp)
      if match.captures.empty?
        sql.gsub!(regexp, replacer.call)
      else
        sql = replacer.call *match.captures
      end
    end
  end
  sql
end
</pre></div>
O método acima, avalia cada caso de expressão regular nova, e propõe uma solução apenas em string, ou faz **capturas** de resultados relevantes em meio a cada caso. Quando alguma captura é efetuada, é invocado um bloco de código (**esperado**) que manipule e devolva a nova sintaxe, manipulando os resultados.

Este exemplo, é muito semelhante as estórias usadas no Cucumber, as quais também lançam os parâmetros capturados como variáveis do bloco. Este é um exemplo muito simples, e que pode colaborar na formulação de muitas novas sintaxes e linguagens de domínio específicos.

Desta forma, o Hash, sempre demonstra ser a:

<div><pre class="prettyprint">
  { :chave => valor }
</pre></div>

Neste caso, o exemplo aborda: 

<div><pre class="prettyprint">
  { :sintaxe_antiga => nova_sintaxe }
</pre></div>

E o mais divertido, é esta possibilidade de apontar qualquer tipo de objeto, para qualquer tipo de valor. Sem especificar o tipo, é possível esperar algo, de forma simples e objetiva, ou seja, sem muitas formalidades.

Para ler um arquivo do **Oracle** e criar um novo arquivo do **PostgreSql**, é simples como o exemplo abaixo:

<div><pre class="prettyprint">
File.open("PostgreSqlBkp.sql", "w+") do |postgresql_file|
  File.readlines("OracleBkp.sql").each do |line|
    postgresql_file.puts convert(line)
  end
end
</pre></div>

O código acima, supõe que o nome do arquivo de bkp do banco Postgresql é **PostgreSqlBkp.sql**, e irá criar um novo arquivo **OracleBkp.sql**. A opção **w+** sobrescreve o arquivo se já existente.
