---
title: "Grepping SQL Code like a boss"
layout: post
description: "Here's the outline of the content of my talk in Poland I presented at the
Lambda Days 2024."
---
Here's the outline of the content of my talk in Poland I presented at the
[Lambda Days 2024](https://lambdadays.com/2024).

{% youtube hGWXBg4Hkn0 %}

My talk is a research which I call "grepping SQL code like a boss".
Introducing a set of tooling that can not only search but also refactor SQL code like a boss.

This is most of the talk outline for those folks that want to learn more about the topic.

It will be a mix of Ruby and SQL code examples. I will show you how to use the
`fast` gem to build your own tools to search and refactor SQL code.

The `fast` gem is a tool that leverages ASTs to provide advanced search and
refactoring capabilities. It already supports Ruby and recently I introduced
support for SQL code.

My main intent is not "sell" my library but the idea behind it. You can easily
build something similar in your language or even to your SQL dialect.

## 2 decades in the terminal

Yes, not only the presentation was made in the terminal, but I build my entire
carreer in the terminal. IO is simple and easy. I can focus on the content and not the tools.

I'm already familiar with this toolset and I can build my own tools to help me
and enhance my productivity.

## Learn simple tools with single proposal

I love how unix tools are simple and have a single proposal. My favorite minimalist
examples from unix like `cat head wc sort uniq grep sed echo`.

Markdown is a great example of simplification. Look how easy it to navigate into
count the topics of talk in the terminal:

```bash
grep '^# ' talk-sql.md | wc -l # => 60
```

Now, going deep in regular expressions we can also count the examples of Ruby, SQL
and so on...

```bash
grep '```ruby' talk-sql.md | wc -l # => 29
grep '```sql' talk-sql.md | wc -l # => 5
grep '```bash' talk-sql.md | wc -l # => 9
```

Now, let me share a past project that encouraged me to follow and continue
investing on this idea.

## TODO: kill PR review checklist

I had a very extensive experience onboarding developers. I onboarded 300+
backend developers in 5 years.

One of the most boring things on onboarding is align the quality expectations,
and that's why the review process involves CI with lots of linters plus a huge
PR review checklist. You can expect things like:

* [ ] Check the code style
* [ ] Check the usage of the framework components
* [ ] Check the broken links in the documentation
* [ ] Check the performance
* [ ] Check the security
* [ ] Check the architecture
* [ ] Check the design
* [ ] Check the business logic
* [ ] Check the requirements

So, I was eager to reduce the friction of introducing newcomers by helping them
to have less things to get ready for the first Pull Request. The plan started
automating item by item, so the newcomer does not have to face "Don't use A
insted of B" while they're not even familiar with the codebase.

Introducing a set of custom linters related to the business domain was the way to
properly guide developers to use the right framework components.

### Automate the education

Pull Requests can have a insane bureaucracy during the review. From all CI to 
comments and reviews, more automation we add, less human interaction and no
developers taking into personal consideration the feedback.

It also allows the developers to have more interesting conversations during the
review instead of few drawn by the checklist and other bureaucracies.

## Build smart stuff with simple tools

AST brings the most primitive stage of compilers into scene. Tagging word by word
or token by token, it simply structures code into tree format.

You really don't need advanced tools to build smart stuff. You can build most of
it with simple tools.

## I'm a Rubyist

Yes, I'm a Rubyist. I love Ruby. I love the community. I love the language.
I started the fast gem to grep Ruby code like a boss. Recently, I extended it to
SQL.

You can check my previous talk on [youtube](https://youtube.com/watch?v=YczrZQC9aP8)
which I was grepping Ruby code like a boss. This was for Ruby Kaigi 2020 which I
couldn't come because of the lock down but I was able to record and participate
remotely.

I also maintain the timescaledb ruby gem which wraps all TimescaleDB SQL
features into simple macros: github.com/jonatas/timescaledb

## I'm becoming a Postgrist

I'm a Rubyist, I'm not sure this word exists, but I'm coining the term Postgrist.
I'm learning a lot about PostgreSQL and TimescaleDB.

I split my time between community management and developer advocacy.

## Adventures with fast

Now, several years after fast was born, I'm extending it to SQL. I'm building
a base prototype for SQL linters or refactoring tools.

* https://github.com/jonatas/fast
* https://rubygems.org/gems/ffast

    $ gem install ffast

You can just use exactly the same syntax for building node patterns both on sql
and Ruby. The trees are different but follow the same structure, so it's a
matter of learning the new node types and you're ready to go.

## The Value of Trying

I really believe in the value of trying. I'm a researcher, trying new things. I'm always
scratching my own itch.

> Experimenting = growth

> Growth only happens when you learn from your experiments.

I built a tool named fast to grep Ruby & SQL code like a boss.

* My journey with "compilers", ASTs, and code analysis
* My journey with SQL
* Advanced search and refactoring

## The Power of Regex

> Regular expressions are a powerful tool for searching and manipulating text.
> They are widely used in text editors, programming languages, and other tools.

```ruby
"1 + 2".scan(/\d+/) # => ["1", "2"]
```

## Regex operators

A few operators to remind how it works:

* `\d` - digit
* `+` - one or more
* `*` - zero or more
* `?` - zero or one
* `|` - or
* `()` - capture group
* `[]` - character class
* `{}` - quantifier

## Limitations of Regex

> Regex can be difficult to use for complex searches and refactoring tasks.

If you need to build a "search and fix" scenario, example, if you find the
target code, maybe it's in the wrong context. So, several times, the Regular
Expressions cannot be the silver bullet for targetting text.

Capturing and reusing previous information, ignoring other undesired scenarios.
Nested contexts and scenarios plays a big role on refactoring, several times
needing to capture groups of information.

Sometimes, regex is not enough to solve complex problems. If you're trying to
parse a programming language, you need to deal with nested structures.

Now, it's time to start exploring on how to build a micro-engine for a derived
Regular Expression language that can match elements directly from the AST.

## The AST Advantage

Abstract Syntax Trees are made for programming language internals. It provides a
more powerful and flexible way to search and manipulate code. In this example,
I'm using the `ffast` gem which uses `ruby-parser` to parse the Ruby code.

```ruby
Fast.ast("1").type # => :int
Fast.ast("1").children # => [1]
```

Every node in the AST has a type and children. The type is a symbol and the children.

## The AST in Ruby

There's an interesting way to represent the AST in Ruby. It's called S-Expression
AKA string expression. It's a simple way to represent the AST in a human-readable format.

```ruby
puts Fast.ast("1")
```

Output:

```bash
(int 1)
```

The S-Expression is the base inpiration for the node pattern we're going to use
to search and refactor the code.

Let's explore more examples to get familiar:

### AST of summing two numbers in Ruby

```ruby
puts Fast.ast("1 + 2")
```

Outputs the String Expression aka sexp in Ruby:

```bash
(send
  (int 1) :+
  (int 2))
```

## Search in the AST

The Abstract part of the Syntax Tree unifies the code syntax. It's a common way
to represent the code in a structured format.

```ruby
Fast.ast("1 + 2.0").search("int")        # => [s(:int, 1)]
Fast.ast("1 + 2.0").search("(float _)")  # => [s(:float, 2.0)]
```

Similar to the sexp output, oyou can build nested search for children using `()`
or combine with other operators.

Example of search combining **or** expressions with the `{}` operator.

```ruby
Fast.ast("1 + 2.0").search("{int float}")  # => [s(:int, 1), s(:float, 2.0)]
```
## Combining node patterns

Example matches integer or float, both should be positive values.

```ruby
Fast.ast("1 + 2.0").search("({int float} .positive?)")
# => [s(:int, 1), s(:float, 2.0)]
```

> Note that `.positive?` comes from the attempt to verify the method from the AST values.

## Fast - Like regex but for the AST

So, the node pattern expressions can be composed with:

- 'exp' which represents the full match with the content.
- '(type *children)'
- '_' for anything not nil
- '{ this or that }'
- '[ this and that ]'
- '_' and '...' for something or a node with children
_ '$' for captures
_ '!' to negate
_ '#method' to call a `method` with the node as param

> Try fast .finders

## SQL Support in 'fast'

Fast now can also [parse SQL](https://jonatas.github.io/fast/sql-support/)
from PostgreSQL. The AST conversion is very similar to what you have in the Ruby AST.

```ruby
Fast.parse_sql('select 1')
s(:select_stmt,
  s(:target_list,
    s(:res_target,
      s(:val,
        s(:a_const,
          s(:ival,
            s(:ival, 1)))))))
```

And the SQL parser is just forwarding the pg_query AST to converge into a format
that Fast is already familiar with.

In reality, the pg_query (PostgreSQL C bindings) do the heavy work and my
library allows to reuse all these AST metadata with node patterns and
refactoring methods.

Here's the full implementation of the parsing:

```ruby
# lib/fast/sql.rb:110
    def parse(statement, buffer_name: "(sql)")
      return [] if statement.nil?
      source_buffer = SQL::SourceBuffer.new(buffer_name, source: statement)
      tree = PgQuery.parse(statement).tree
      first, *, last = source_buffer.tokens
      stmts = tree.stmts.map do |stmt|
        from = stmt.stmt_location
        to = stmt.stmt_len.zero? ? last.end : from + stmt.stmt_len
        expression = Parser::Source::Range.new(source_buffer, from, to)
        source_map = Parser::Source::Map.new(expression)
        sql_tree_to_ast(clean_structure(stmt.stmt.to_h), source_buffer: source_buffer, source_map: source_map)
      end.flatten
      stmts.one? ? stmts.first : stmts
    end
```

The hard work I had was more on going in the most common queries and create a
good `clean_structure` for it to allow us to have a very easy to comprehend AST
to build simple node patterns.

## Fastfile

The `Fastfile` can help to organize the dictionary of patterns in shortcuts.

I built it thinking about having one per project and may load something cross
projects with my generic searches.

The previous Ruby snippet was brought to the example based on the following
shortcut:

```ruby
Fast.shortcut :sql_parser, "(def parse)", "lib/fast/sql.rb"
```
So, if I want to repeat such search, I just need to say `fast .sql_parser` and
it will reuse the shortcut name to output the matching results.

## Refactoring operations

The most complex part of the AST is rewriting it. Allowing you to refactor code
from the AST just with a simple method call.

Here's an example of a simple replace on a `relname` which is a node type.

```ruby
Fast
  .parse_sql("SELECT * FROM customers")
  .replace("relname", "other_table")
  # => "SELECT * FROM other_table"
```

The replace method can also receive a block and build a much more complex
scenario. The next example explores how to build a SQL formatter.

## Format SQL

I wrote a full blog post on [building a SQL formatter with fast](/building-a-sql-formatter-with-fast)
and the final shorcut looks like this:

```ruby
Fast.shortcut :format_sql do
  require 'fast/sql'
  file = ARGV.last
  method = File.exist?(file) ? :parse_sql_file : :parse_sql
  ast = Fast.public_send(method, file)
  ast = ast.first if ast.is_a? Array
  eligible_kw = [:RESERVED_KEYWORD]
  eligible_tokens = [:BY]

  output = Fast::SQL.replace('_', ast) do |root|
    sb = root.loc.expression.source_buffer
    sb.tokens.each do |token|
      if eligible_kw.include?(token.keyword_kind) || eligible_tokens.include?(token.token)
        range = Parser::Source::Range.new(sb, token.start, token.end)
        replace(range, range.source.upcase)
      end
    end
  end
  require 'fast/cli'
  puts Fast.highlight(output, sql: true)
end
```

## Anonymize SQL

Another cool example on manipulating SQL via AST is [anonymize it](/anonymizing-your-sql).

Here's a simple anonymizer that transform table names and references.

```ruby
Fast.shortcut :anonymize_sql do
  require 'fast/sql'
  file = ARGV.last
  method = File.exist?(file) ? :parse_sql_file : :parse_sql
  ast = Fast.public_send(method, file)
  memo = {}

  relnames = search("(relname $_)", ast).grep(String).uniq
  pattern = "{relname (sval {#{relnames.map(&:inspect).join(' ')}})}"
  puts "searching with #{pattern}"

  content = Fast::SQL.replace(pattern, ast) do |node|
    new_name = memo[node.source.tr(%|"'|, '')] ||= "x#{memo.size}"
    new_name = "'#{new_name}'" if node.type == :sval
    replace(node.loc.expression, new_name)
  end
  puts Fast.highlight(content, sql: true)
end
```

## My latest experiments with SQL AST

Now, let's talk about my latest exciting project that is about
[TimescaleDB](https://github.com/timescale/timescaledb)
and recognize framework standards and feature adoption.

Let's dive into a simple example that allows me to explain my intention.

I'm going to track temperatures of different locations but my database will be
massive, so I'm going to use the `hypertables` to automatically partition the
table by month.

```sql
CREATE TABLE temperatures
( time TIMESTAMP NOT NULL,
  location varchar,
  value decimal);

-- automatic partitioning by month
SELECT create_hypertable('temperatures',
  by_range('time', INTERVAL '1 month'));
```

The [create_hypertable](https://docs.timescale.com/api/latest/hypertable/create_hypertable/)
function will allow you to insert on the `temperatures` but behind the scenes
it's splitting and saving the data into a monthly chunk.

## Inserting data

The focus here is not on splitting the data either inserting, but I'm going to
put some examples to make the full scenario understanding:

```sql
INSERT INTO temperatures ( location, time, value)
VALUES
( 'kitchen',   '2000-01-01 12:20:00', 22.2),
( 'kitchen',   '2000-01-01 12:32:00', 22.8),
( 'bedroom',   '2000-01-01 12:22:00', 22.8),
( 'bedroom',   '2000-01-01 14:33:00', 24.2);
```
## Querying aggregated data

Here's the tricky part of using time series data. Most of it will be called by
statistics that aggregates the data in somehow. Let's get the average hourly
temperature:

```sql
SELECT time_bucket('1h', time) as time,
  location,
  avg(value) as value
  FROM temperatures
  GROUP BY 1,2;
```

The `time_bucket` is offered by the timescaledb extension and works like `date_trunc`
but a bit more advanced and prepared for Timescale features.

## Creating a materialized view

Now, you can imagine that putting the most frequent queries into materialized
views is a good idea, so you can make the values persistent and avoid
reprocessing.

```sql
CREATE MATERIALIZED VIEW  avg_temperature_by_hour
WITH (timescaledb.continuous) AS
SELECT time_bucket('1h', time) as time,
  location,
  avg(value) as value
  FROM temperatures
GROUP BY 1,2
WITH DATA;
```

## My experiment - a small linter

Now let's talk about the experiment, you can imagine a linter saying:

> Hey buddy, I see you're querying from the hypertable
> but you also have the materialized view.
> Let's use the materialized view instead.

### Learning the AST patterns

The first thing to build your pattern, is understand the AST. I build a
minimalistic expression that contains the fragment I'm looking for:

```ruby
puts Fast.parse_sql("SELECT time_bucket('1h', now())")
```

Outputs:

```bash
(select-stmt
  (target-list
    (res-target
      (val
        (func-call
          (funcname
            (string
              (sval "time_bucket")))
          (args
            (a-const
              (sval
                (sval "1h")))
            (func-call
              (funcname
                (string
                  (sval "now")))
              (funcformat :COERCE_EXPLICIT_CALL)))
          (funcformat :COERCE_EXPLICIT_CALL))))))
```

Now, I can also build a pattern for detecting select with time_bucket from
hypertable.

```ruby
Fast.shortcut :check_query do 
  pattern = <<~FAST
  (select_stmt
    (target_list #call_time_bucket)
    (from_clause #from_hypertable)
  FAST
  search_all pattern, # ...
end
```

Now, you can see I'm introducing `#method_match` to allow to build more readable 
patterns and delegate part of it to my favorite programming language. So, let's
specify the methods:

The `#call_time_bucket` pattern will just pick the first result of the
expression given:

```ruby
def call_time_bucket(node)
  node.first('(func_call (funcname (string (sval "time_bucket")')
end
```

And the `from_hypertable` pattern will collect and double check if the
`hypertables` array contains the name.

```ruby
def from_hypertable(node)
  if (relname = node.capture('(relname $_)')[0])
    hypertables.include?(relname)
  end
end
def hypertables
  @hypertables ||=
    Timescaledb.hypertables.map(&:hypertable_name)
end
```

Now, we can say, well, we have a query that matches. This query can be running
standalone or be the implementation of a materialized view. So, next step is
track what are the queries and what is the materialized views already available.

## Track `@query` and `@materialized`

```ruby
    # Previous pattern
    search_all pattern, ARGV.last, parallel: false, on_result: ->(file, results) do
      puts "#{file}: #{results.size}"
      results.each do |node|
        report node
        if node.parent.nil?
          @query[node.capture('(relname $_)')[0]] = node
        else
          root = node.ancestors.last
          # ... next slide
```

To map `@materialized` with the view name, we need to check if this is a `CREATE
MATERIALIZED VIEW` using `timescaledb.continuous` feature.

```ruby 
case root.type
when :create_table_as_stmt
  view_name = <<~FAST
    (create_table_as_stmt
      (query ... )
      (into
        (rel
          (relname $_)
          (inh true)
          (relpersistence "p"))
        (options
          (def_elem
            (defnamespace "timescaledb")
            (defname "continuous")
        FAST
if (name=root.capture(view_name)[0])
  @materialized[name] = node
end
```

The cool part of AST, is that if we just run this shortcut over the previous SQL
fragments, it will allow you to discover that:

```ruby
@query["temperatures"] == @materialized["avg_temperature_by_hour"] # => true
```

So, the AST has the same representation and we can build a recursive algorithm
to check what queries are elegible to be replaced by a materialized view.

```ruby
# ... previous context
      @query.each do |table_name, query_table|
        @materialized.each do |view_name, query_materialized|
          if query_table == query_materialized
            puts "The table #{table_name} is also tracked as a continuous aggregate of #{view_name}", ""
            report(query_table.source)
            puts "Query the data from the materialized view to get pre-computed results", ""
            report("SELECT * FROM #{view_name}")
          end
        end
```

### Demo

Running the demo with the previous sql fragments mapped in a `demo.sql`.

```bash
 fast .check_query demo.sql
The table temperatures is also tracked as a continuous aggregate of avg_temperature_by_hour

SELECT time_bucket('1h', time) as time,
  location,
  avg(value) as value
  FROM temperatures
  GROUP BY 1,2

Query the data from the materialized view to get pre-computed results

SELECT * FROM avg_temperature_by_hour
```

Yay! I got the final output as expected! I was able to create a linter that uses
database metadata combined with AST metadata to intercept and teach a developer
that needs a new direction.

I love building this type of primitive tools 🫶.

Playing with toys from compiler level is fun and very powerful!

## The future

My plan for the future is try to help the query planner in the ORM level.
Integrate with the [timescaledb gem](https://github.com/jonatas/timescaledb) to
replace queries before the query planner.

I can't see myself able to go to such implementation in the core level of postgresql
but I can build a small prototype that proves the concept.

## Sources

Here are a few sources if you want to go deeper:

* <https://github.com/jonatas/fast>
* <https://ideia.me/fast-supports-sql>
* <https://ideia.me/building-a-sql-formatter-with-fast>
* <https://ideia.me/anonymizing-your-sql>

I build this article as a way to document my talk "Grepping SQL like a boss"
at [Lambda Days 2024](https://www.lambdadays.org/lambdadays2024/jonatas-paganini)
and you can find the gist to all talk files and sources to run the example here:

<https://gist.github.com/jonatas/6ba56014185855b7f2efae74d6250016>

