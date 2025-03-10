---
title: "PGConf Brasil"
layout: post
categories: ['terminal', 'shell', 'unix', 'opensource', 'postgresql']
description: "Na minha palestra da PGConf Brasil 2022 falei sobre a \"Vida Zen no Terminal\". Então resolvi compartilhar aqui um pouco dos aprendizados que compartilhei poi..."
---
Na minha palestra da [PGConf Brasil 2022](https://www.pgconf.com.br/2022/).
falei sobre a "Vida Zen no Terminal". Então resolvi compartilhar aqui um pouco
dos aprendizados que compartilhei pois são dicas práticas que podem ser úteis
para quem adora o terminal, ou gostaria de iniciar.

Aqui vai a gravação da palestra:

{% youtube MzV6S_72E2g %}

Bom, eu trabalho com programação desde que meus 17 anos de idade.

Quando eu comecei, tudo que eu tinha era o terminal! Então de alguma forma, a
vida sem interface gráfica parecia muito mais fácil e focada do que nos dias
atuais.

O terminal é aquela tela sem graça que não faz nada que você não peça. Ela não
interage com você se você não interagir. Ela não te notifica. Ela não te distrai.
Então, essa é a parte Zen do terminal. Você é o monge da montanha encantada e só
depende de você para meditar e concentrar naquilo que precisa fazer.

Eu gosto muito da ideia de concentrar e no fim isso me leva a trabalhar menos.

Menos horas na frente do computador e mais liberdade pra estudar e evoluir.
Por isso é importante aprender a viver longe do ambiente de distrações ou pelo
menos criar um espaço sem distrações para o foco total em programar.

Sou muito feliz ter usado sistemas baseados em unix desde o início da minha
carreira e de fato nunca consegui literalmente me livrar do terminal.

Resolvi organizar esse material para mostrar as coisas que percebi durante anos
pareando e ajudando pessoas a se distraírem menos no terminal :D

Meu objetivo aqui é mostrar dicas relacionadas a usar o terminal e ferramentas
que podem te ajudar a ser feliz por aqui.

O foco central dessa sessão é mostrar o psql, mas também iremos ir e voltar
em várias outras ferramentas.

## Terminal intro

Vamos começar com um breve introdução ao terminal. Eu não vou ficar fazendo um
tutorial de cada detalhe do terminal nem contando a história dele mas gostaria de
mostrar algumas coisas que vão te fazer entender melhor o fluxo de trabalho.

Então, a primeira coisa, é entender o cursor. Quando você entra, você tem que
sempre localizar onde ele está. Geralmente ele está piscando.
E seu foco se move juntamente com o cursor. O cursor sempre é a última informação
da tela, aparecendo mais a baixo e o que vem depois dele é sempre o espaço restante da tela.

O terminal também é conhecido como **linha de comando** pois é ali que você
interage com o computador da maneira mais rudimentar. A linha de comando nada
mais é que um REPL -> Read, Eval e Print Line, ou seja, ele lê a informação que
você digita quando você digita um comando e dá um enter, então valida e compila,
e imprime de volta o resultado do comando.

Então vamos começar descobrindo quem sou eu com o `whoami` que é o primeiro
comando que vocês irão aprender :D

Então, `whoami` retornou esse nome aí pra mim, dizendo meu nome. Agora, já
complicando um pouco mais, vou introduzir aqui um comando echo que é um comando
que basicamente imprime o que eu estou pedindo:

```fish
echo (whoami) você está no seu (hostname)
jonatasdp você está no seu MacBook-Pro
```

Como vocês podem ver, eu usei essa sintaxe entre parenteses e basicamente ela
executou uma linha de comando aninhada e o returno foi injetado no código.

Aí, nesse momento, você deve já usa o terminal deve estar pensando, esse cara
está maluco, já confundindo a cabeça das pessoas navegando entre multiplos
shells. Então como vocês podem ver no topo do meu terminal, eu troquei meu
terminal pra usar o fish ao invés do bash. Bash é o terminal padrão, mas ele é
muito rudimentar e eu acabo usando mais o fish.

Para não complicar muito essa palestra, irei usar o bash e facilitar a vida de
vocês, mas se você nao adotou ainda um, eu gosto muito do fish, quando alguma
coisa não dá certo, eu entro dentro do shell novamente.

Lembrando que o terminal é uma matrix, então você pode ter várias inceptions
aqui. Você pode abrir um [fish shell](https://fishshell.com),
e dentro dele abrir um bash e aí abrir um outro bash ou fish dentro 
da sessão que você já está rodando.

Você pode até acabar em outro computador executando coisas em uma cloud se você
não perceber onde está e tudo isso torna as coisas mais difíceis se você não
prestar atenção.

Existem várias ferramentas que permitem alterar esse comportamento e também
existem aplicativos no terminal que permitem você navegar com o cursor para
lugares diferentes. A variável `PS1` pode te ajudar caso queira alterar esse
comportamento.

### Ergonomia dos comandos

Um comando geralmente é uma instrução que o terminal irá processar. Geralmente
trata-se de outro software que pode ser chamado pela linha de comando.

O comando geralmente tem a seguinte sintaxe:

```
<comando> <*argumentos>
```

Cada comando ocupa uma linha e se você quiser fazer vários comandos na mesma
linha, é possível com `;` para dividir eles. Ou seja:

```bash
echo "olá mundo."
echo "seja bem vindo."
```
é o mesmo que:

```bash
echo "olá mundo."; echo "seja bem vindo."
```

Os comandos podem também conter argumentos especiais, que geralmente começam com
um traço ou o sinal de menos `-` seguido de uma letra, ou dois traços e uma
palavra.

Então, se eu quisesse unir as linhas anteriores, pensaria, hmm, só preciso usar
o `\n` ali e consigo usar uma única linha no echo.

```bash
echo "olá mundo.\nseja bem vindo."
```

Mas infelizmente o comando não irá quebrar linha naturalmente. Nesse caso é
necessário que o `echo` tenha um parâmetro especial `-e`:

```bash
echo -e "olá mundo.\nseja bem vindo."
```

No bash, também é possível reusar informações através do uso de variáveis.

```bash
nome='fulano'
echo "bem vindo $nome"
```
E também é possível calcular expressões matemáticas com o comando `expr`:

```bash
A=1; B=2; echo A + B = $(expr $A + $B)
```

O comando também pode conversar com outros comandos através dos operadores. Por
exemplo, o `>` permite enviar os dados para uma saída diferente da saída da tela.

O `echo` imprime para tela, então no exemplo abaixo estou enviando o conteúdo do
resultado para o arquivo **ola.txt**.

```bash
echo 'olá mundo' > ola.txt
```

O `>>` permite adicionar mais dados no mesmo arquivo enquanto o `>` sempre
recria o arquivo, mesmo que ele exista.

```bash
echo 'bem vindo' >> ola.txt
```

Agora, o arquivo tem duas linhas:

```bash
echo 'bem vindo' >> ola.txt
```

Ou pode receber informações de outros comandos com o `|`:

```bash
cat ola.txt | grep vindo
```

O comando irá filtrar apenas as linhas do resultado do `cat` que contenham a
palavra `vindo`.

### Atalhos importantes

Pra você sobreviver na linha de comando é necessário aprender atalhos para
ganhar tempo. Isso não quer dizer que você não consiga viver sem, mas eles vão
te dar mais liberdade e fluidez para seguir uma vida mais sana.

### Terminal readline

Esse programa que roda quando você digita no terminal, geralmente é o
[readline](https://tiswww.case.edu/php/chet/readline/rltop.html) e ele suporta
uma série de atalhos que podem ajudar a editar os comandos mais rápidos.

Atalhos de navegação:

* `ctrl-a` - move cursor para o começo da linha
* `ctrl-e` - move cursor para o fim da linha
* `ctrl-b` - move cursor para trás
* `ctrl-f` - move cursor  para frente
* `ctrl ←` ou `esc-b` -  volta uma palavra
* `ctrl →` ou `esc-f` ou `esc-l` - avança uma palavra

Atalhos de edição:

* `ctrl-r` - Usa o histórico de forma reversa
* `ctrl-d` - remove uma letra
* `ctrl-w` - remove uma palavra
* `esc-backspace` - apaga palavra

Também existem muitas variáveis úteis que se tornam atalhos importantes para
navegar e resolver problemas mais rápidos na linha de comando:

* `!$` último argumento da linha anterior
* `!!` último comando
* `$OLDPWD` último diretorio
* `$PATH` diretórios oficiais para buscar comandos
* `$USER` nome do usuário
* `$HOME` caminho para o diretório do usuário

## Process matrix

* `ctrl-z` envia processo para background
* `fg` resgata processo em background
* `echo $0` verifica qual shell está usando

## history

O history é muito legal para encontrar comandos que você digitou no passado e
também re-executar eles com facilidade.

history | grep psql

```
!<numero-do-comando>
```

Ou usar o `<ctrl-r>` e buscar pelo comando.

### man

man é o manual de tudo na linha de comando. Então se você precisa entender a
especificação de um determinado comando é a forma mais rápida de aprender e
verificar como ele funciona.

### tldr

Eu gosto muito do tldr pq eu geralmente não lembro dos comandos e eu só preciso
de um exemplo pra seguir fazendo o que eu preciso, então, o TLDR que é um
acronimo para Too Long Don't Read, é super útil para me dar o exemplo certo na
hora certa.

Exemplo buscando por exemplos do `sed`:

```bash
 tldr sed

sed

Edit text in a scriptable manner.
More information: <https://ss64.com/osx/sed.html>.

- Replace the first occurrence of a string in a file, and print the result:
    sed 's/find/replace/' filename

- Replace all occurrences of an extended regular expression in a file:
    sed -E 's/regular_expression/replace/g' filename

- Replace all occurrences of a string [i]n a file, overwriting the file (i.e. in-place):
    sed -i '' 's/find/replace/g' filename

- Replace only on lines matching the line pattern:
    sed '/line_pattern/s/find/replace/' filename

- Print only text between n-th line till the next empty line:
    sed -n 'line_number,/^$/p' filename

- Apply multiple find-replace expressions to a file:
    sed -e 's/find/replace/' -e 's/find/replace/' filename

- Replace separator `/` by any other character not used in the find or replace patterns, e.g. `#`:
    sed 's#find#replace#' filename

- [d]elete the line at the specific line number [i]n a file, overwriting the file:
    sed -i '' 'line_numberd' filename
```

Bem mais objetivo que ler o [manual do sed](https://linux.die.net/man/1/sed).

## `\gexec` pra rodar comandos a partir da query anterior

Para reutilizar comandos sql gerados pelo próprio sql então vamos começar
gerando uns dados só pra se divertir.

Imagina que eu posso digitar:

```sql
select 1;
```
Mas também posso digitar uma string com sql dentro do select.

```sql
select 'SELECT 1';
```
Agora, se eu quiser fazer algo mais dinâmico, posso gerar várias linhas:


```sql
select a from generate_series(1,10) a;
```

E gerar comandos SQLs a partir dessa sequência:

```sql
select 'select '||a from generate_series(1,10) a;
```

Pra pegar esse último output e executar como SQL é só usar o `\gexec`.
Exemplo completo:

```sql
db=# select 'select '||a from generate_series(1,10) a;
┌───────────┐
│ ?column?  │
├───────────┤
│ select 1  │
│ select 2  │
│ select 3  │
│ select 4  │
│ select 5  │
│ select 6  │
│ select 7  │
│ select 8  │
│ select 9  │
│ select 10 │
└───────────┘
(10 rows)

db=# \gexec
┌──────────┐
│ ?column? │
├──────────┤
│        1 │
└──────────┘
(1 row)

┌──────────┐
│ ?column? │
├──────────┤
│        2 │
└──────────┘
(1 row)

.... várias linhas aqui...
┌──────────┐
│ ?column? │
├──────────┤
│        9 │
└──────────┘
(1 row)

┌──────────┐
│ ?column? │
├──────────┤
│       10 │
└──────────┘
(1 row)

```

## Output

Se você quiser salvar os resultados da query em um arquivo ao invés de exibir no
terminal pode usar as seguintes opções:

1. `\g <arquivo>` envia ultima query para um arquivo.
2. `\o <arquivo>` concatena os resultados para um arquivo.

Uma dica para quem está gostando de se aprofundar nos comandos é dar uma olhada no site 
https://psql-tips.org que contém uma série de exemplos de como evoluir nos
comandos.

## Explicar consultas

Eu gosto muito do `psql -E` que ajuda você a entender os comandos com a barra
invertida. Por exemplo `\dt` vai listar as tabelas, e com o `-E` você pode entender
que query o psql usou para mostrar os resultados.

Exemplo:

```sql
 \dt
********* QUERY **********
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' WHEN 'i' THEN 'index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 't' THEN 'TOAST table' WHEN 'f' THEN 'foreign table' WHEN 'p' THEN 'partitioned table' WHEN 'I' THEN 'partitioned index' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     LEFT JOIN pg_catalog.pg_am am ON am.oid = c.relam
WHERE c.relkind IN ('r','p','')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname !~ '^pg_toast'
      AND n.nspname <> 'information_schema'
  AND pg_catalog.pg_table_is_visible(c.oid)
ORDER BY 1,2;
**************************

                List of relations
┌────────┬──────────────────┬───────┬───────────┐
│ Schema │       Name       │ Type  │   Owner   │
├────────┼──────────────────┼───────┼───────────┤
│ public │ example          │ table │ jonatasdp │
│ public │ another_table    │ table │ jonatasdp │
└────────┴──────────────────┴───────┴───────────┘
(2 rows)
```

Lembrando que o -E vai funcionar apenas para comandos que envolvem queries.

## Transformando linhas em colunas 

No caso de linhas muito longas, será difícil de visualizar no terminal, então
vale a pena usar o `\x on` para trocar o formato do output.

Exemplo o `\x`. Observe o output:

```sql
table pings limit 1;
┌─[ RECORD 1 ]──────────────────────┐
│ t    │ 2022-08-05 14:23:21.439023 │
│ ms   │ 0.0031                     │
│ host │ google.com                 │
└──────┴────────────────────────────┘
```

O `\x` serve para trocar o modo de visualização de tabelas em linhas ou colunas,
de forma expandida ou não. Se você não usar argumentos o psql alterna o
parâmetro entre `on` e `off` automaticamente.

```sql
db=# \x
Expanded display is off.
db=# table pings limit 1;
┌────────────────────────────┬────────┬────────────┐
│             t              │   ms   │    host    │
├────────────────────────────┼────────┼────────────┤
│ 2022-08-05 14:23:21.439023 │ 0.0031 │ google.com │
└────────────────────────────┴────────┴────────────┘
(1 row)
```

Também é possível usar o `\x auto` que irá mudar a visão automaticamente para
mostrar colunas em linhas caso o conteúdo tenha muitas colunas ou valores muito
longos que quebrem o layout da tela.

### psql comandos com `\`

O psql tem vários comandos que começam com a barra invertida e eles se tornam
extremamente úteis para não ter que lembrar de todos os comandos. Então é só
lembrar do `?` para listar esse help com todos os comandos com barra invertida.

```
\?
```

Aqui você pode relembrar sempre que precisar de um atalho rápido. Um detalhe
importante quando você ver esse `:` na última linha da explicação, isso
significa que o pager está em ação. O more é um utilitário de pager assim como o `less`.

Então vamos aprender um pouco sobre estes dois amiguinhos agora.

Esse comando vai listar todos os comandos com uma explicação.

Segue a lista de saída:

```sql
db=# \?
General
  \copyright             show PostgreSQL usage and distribution terms
  \crosstabview [COLUMNS] execute query and display results in crosstab
  \errverbose            show most recent error message at maximum verbosity
  \g [(OPTIONS)] [FILE]  execute query (and send results to file or |pipe);
                         \g with no arguments is equivalent to a semicolon
  \gdesc                 describe result of query, without executing it
  \gexec                 execute query, then execute each value in its result
  \gset [PREFIX]         execute query and store results in psql variables
  \gx [(OPTIONS)] [FILE] as \g, but forces expanded output mode
  \q                     quit psql
  \watch [SEC]           execute query every SEC seconds

Help
  \? [commands]          show help on backslash commands
  \? options             show help on psql command-line options
  \? variables           show help on special variables
  \h [NAME]              help on syntax of SQL commands, * for all commands

Query Buffer
  \e [FILE] [LINE]       edit the query buffer (or file) with external editor
  \ef [FUNCNAME [LINE]]  edit function definition with external editor
  \ev [VIEWNAME [LINE]]  edit view definition with external editor
  \p                     show the contents of the query buffer
  \r                     reset (clear) the query buffer
  \s [FILE]              display history or save it to file
  \w FILE                write query buffer to file

Input/Output
  \copy ...              perform SQL COPY with data stream to the client host
  \echo [-n] [STRING]    write string to standard output (-n for no newline)
  \i FILE                execute commands from file
  \ir FILE               as \i, but relative to location of current script
  \o [FILE]              send all query results to file or |pipe
  \qecho [-n] [STRING]   write string to \o output stream (-n for no newline)
  \warn [-n] [STRING]    write string to standard error (-n for no newline)

Conditional
  \if EXPR               begin conditional block
  \elif EXPR             alternative within current conditional block
  \else                  final alternative within current conditional block
  \endif                 end conditional block

Informational
  (options: S = show system objects, + = additional detail)
  \d[S+]                 list tables, views, and sequences
  \d[S+]  NAME           describe table, view, sequence, or index
  \da[S]  [PATTERN]      list aggregates
  \dA[+]  [PATTERN]      list access methods
  \dAc[+] [AMPTRN [TYPEPTRN]]  list operator classes
  \dAf[+] [AMPTRN [TYPEPTRN]]  list operator families
  \dAo[+] [AMPTRN [OPFPTRN]]   list operators of operator families
  \dAp[+] [AMPTRN [OPFPTRN]]   list support functions of operator families
  \db[+]  [PATTERN]      list tablespaces
  \dc[S+] [PATTERN]      list conversions
  \dC[+]  [PATTERN]      list casts
  \dd[S]  [PATTERN]      show object descriptions not displayed elsewhere
  \dD[S+] [PATTERN]      list domains
  \ddp    [PATTERN]      list default privileges
  \dE[S+] [PATTERN]      list foreign tables
  \des[+] [PATTERN]      list foreign servers
  \det[+] [PATTERN]      list foreign tables
  \deu[+] [PATTERN]      list user mappings
  \dew[+] [PATTERN]      list foreign-data wrappers
  \df[anptw][S+] [FUNCPTRN [TYPEPTRN ...]]
                         list [only agg/normal/procedure/trigger/window] functions
  \dF[+]  [PATTERN]      list text search configurations
  \dFd[+] [PATTERN]      list text search dictionaries
  \dFp[+] [PATTERN]      list text search parsers
  \dFt[+] [PATTERN]      list text search templates
  \dg[S+] [PATTERN]      list roles
  \di[S+] [PATTERN]      list indexes
  \dl                    list large objects, same as \lo_list
  \dL[S+] [PATTERN]      list procedural languages
  \dm[S+] [PATTERN]      list materialized views
  \dn[S+] [PATTERN]      list schemas
  \do[S+] [OPPTRN [TYPEPTRN [TYPEPTRN]]]
                         list operators
  \dO[S+] [PATTERN]      list collations
  \dp     [PATTERN]      list table, view, and sequence access privileges
  \dP[itn+] [PATTERN]    list [only index/table] partitioned relations [n=nested]
  \drds [ROLEPTRN [DBPTRN]] list per-database role settings
  \dRp[+] [PATTERN]      list replication publications
  \dRs[+] [PATTERN]      list replication subscriptions
  \ds[S+] [PATTERN]      list sequences
  \dt[S+] [PATTERN]      list tables
  \dT[S+] [PATTERN]      list data types
  \du[S+] [PATTERN]      list roles
  \dv[S+] [PATTERN]      list views
  \dx[+]  [PATTERN]      list extensions
  \dX     [PATTERN]      list extended statistics
  \dy[+]  [PATTERN]      list event triggers
  \l[+]   [PATTERN]      list databases
  \sf[+]  FUNCNAME       show a function's definition
  \sv[+]  VIEWNAME       show a view's definition
  \z      [PATTERN]      same as \dp

Formatting
  \a                     toggle between unaligned and aligned output mode
  \C [STRING]            set table title, or unset if none
  \f [STRING]            show or set field separator for unaligned query output
  \H                     toggle HTML output mode (currently off)
  \pset [NAME [VALUE]]   set table output option
                         (border|columns|csv_fieldsep|expanded|fieldsep|
                         fieldsep_zero|footer|format|linestyle|null|
                         numericlocale|pager|pager_min_lines|recordsep|
                         recordsep_zero|tableattr|title|tuples_only|
                         unicode_border_linestyle|unicode_column_linestyle|
                         unicode_header_linestyle)
  \t [on|off]            show only rows (currently off)
  \T [STRING]            set HTML <table> tag attributes, or unset if none
  \x [on|off|auto]       toggle expanded output (currently auto)

Connection
  \c[onnect] {[DBNAME|- USER|- HOST|- PORT|-] | conninfo}
                         connect to new database (currently "playground")
  \conninfo              display information about current connection
  \encoding [ENCODING]   show or set client encoding
  \password [USERNAME]   securely change the password for a user

Operating System
  \cd [DIR]              change the current working directory
  \setenv NAME [VALUE]   set or unset environment variable
  \timing [on|off]       toggle timing of commands (currently off)
  \! [COMMAND]           execute command in shell or start interactive shell

Variables
  \prompt [TEXT] NAME    prompt user to set internal variable
  \set [NAME [VALUE]]    set internal variable, or list all if no parameters
  \unset NAME            unset (delete) internal variable

Large Objects
  \lo_export LOBOID FILE
  \lo_import FILE [COMMENT]
  \lo_list
  \lo_unlink LOBOID      large object operations
```

São muitas opções mesmo! apenas comandos internos do psql e são super úteis para
navegar em qualquer detalhe do banco de dados sem ter que abrir o pgadmin 🤐



## Configurações

```sql
\pset numericlocale # Locale-adjusted numeric output is on.
\set io_timing_track # useful to explain queries
```

## Print set com `\pset`

O pset ou printset é muito parecido com o `\set` que funciona para qualquer
cliente do postgresql mas é focado em print. Ou seja, ele vai te ajudar a
formatar a saída de dados do formato que você espera.

Um exemplo da comunidade que adorei e nunca tinha usado é o override para
valores nulos.
Por exemplo, se você usar:

```sql
select null;
?column?
```

então fica difícil de entender que a linha em branco quer dizer nulo:

Aí você pode reconfigurar o null para exibir algo de sua preferência:

```
\pset null '<nulo>'
Null display is "<nulo>".
db=# select null;
?column?
<nulo>
```

Lembrando que é unicode também, e você pode ter os seus próprios emojis
pra tornar tudo mais divertido:

```sql
 \pset null '🙈'
Null display is "🙈".
```

Adoro esse macaquinho, bora testar ;)

```sql
select null;
?column?
🙈
```

## `\watch` para assistir queries

O comando `\watch` é  incrível pra evitar você ficar repetindo o mesmo comando e
permite vc criar um mini-dashboard, literalmente assistindo uma determinada
query.

Então se você executou uma query como:

```sql
select * from tabela order by id desc limit 10;
```

Este comando irá mostrar os últimos dez registros da tabela.

Muitas vezes você quer ficar assistindo o comando e vendo novos registros, então
fica freneticamente acessando o histórico e reexecutando a consulta.

Você pode usar o `\gexec` para fazer o mesmo e evitar redigitar a query ou
acessar o histórico.

## Aprenda mais

O site [psql-tips.org](https://psql-tips.org) é muito bom para aprender mais
sobre psql. A Lætitia Avrot tem uma palestra muito boa chamada
[`psql` is awesome!](https://www.youtube.com/watch?v=2oFbnJDlwIw) com várias
dicas práticas para aprender mais.
Se você estiver com dúvidas como instalar o psql, pode ver esse tutorial da
timescale [how to install psql](https://docs.timescale.com/timescaledb/latest/how-to-guides/connecting/psql/#install-psql-on-macos)
que contém detalhes sobre como instalar nos principais sistemas operacionais.

Gostou do conteúdo, faltou algum comando essencial?
Me chama no [twitter](https://twitter.com/jonatasdp) ou [linkedin](https://br.linkedin.com/in/jonatasdp).

O conteúdo da minha palestra também foi publicado no github. Você pode ver no
repositório [pgconfbr2022-talk](https://github.com/jonatas/pgconfbr2022-talk).
