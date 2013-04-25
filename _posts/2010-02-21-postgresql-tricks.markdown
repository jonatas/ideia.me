---
 layout: post
 title: PostgreSql Tricks
 categories: postgresql
 dirbase: /../../..
---

# Quanto espaço seu banco PostgreSql usa?

Não sabe o tamanho dos seus bancos de dados no PostgreSql? Este BD opensource maravilhoso possuí uma série de tabelas informativas, que são reflexivas a situação atual SGBD. Em outras palavras, ele possuí tabelas que guardam informações sobre toda estrutura do próprio banco de dados. 

Estas tabelas estão dentro de um schema chamado pg\_catalog, que é automaticamente reconhecido com o schema **public**.


# O Sql

Para saber o tamanho de cada banco, execute o seguinte **select**:

<div><pre class="prettyprint">
SELECT pg_database.datname,
       pg_size_pretty(pg_database_size(pg_database.datname))
FROM pg_database
ORDER BY 1 DESC, 2 ASC; 
</pre></div>
<pre>
          datname          | pg_size_pretty 
---------------------------+----------------
 agecel                    | 2165 MB
 redmine                   | 23 MB
 sagui_dev                 | 11 MB
 guiamedico                | 6280 kB
 bordel                    | 4312 kB
 rails_example_development | 4296 kB
 xlsuite_development       | 4096 kB
</pre>

[Trabalho][portfolio] com **PostgreSql** à seis anos e gosto muito da forma simples de trabalhar com este SGBD. Assim como é possível ver o tamanho, também é possível resgatar qualquer tipo de informação reflexiva ao próprio DDL do BD.

[portfolio]: /portfolio/2010/02/01/portfolio.html "veja o meu portfólio"
