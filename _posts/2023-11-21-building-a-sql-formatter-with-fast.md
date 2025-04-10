---
title: "Building a SQL formatter with Fast"
layout: post
categories: ['programming', 'technology']
tags: ['sql', 'ruby', 'automation', 'tutorials']
description: "Now that fast supports SQL, I will share a few of my exploring toys."
---
Now that [fast supports SQL](/fast-supports-sql), I will share a few of my exploring toys.

The first is a SQL formatter where you can get some keywords upcased.

My idea is that when I input:

```sql
select name from weather_data order by 1 asc
```

it will output

```sql
SELECT name FROM weather_data ORDER BY 1 ASC
```

Let's start understanding every part of the challenge and how to make a generic code that can work with any SQL :)

## Getting into AST tokens

PgQuery is very powerful and can also give you a list of scanned tokens, which contains the classification of each AST node.

As Fast translates the nodes to another class, the scanned tokens stay in the root of the AST inside the source_buffer.

You can access it using the following process:

```ruby
ast = Fast.parse_sql("select name from weather_data order by 1 asc")
ast.loc.expression.source_buffer.tokens
# => [
#      <PgQuery::ScanToken: start: 0, end: 6, token: :SELECT, keyword_kind: :RESERVED_KEYWORD>,
#      <PgQuery::ScanToken: start: 7, end: 11, token: :NAME_P, keyword_kind: :UNRESERVED_KEYWORD>,
#      <PgQuery::ScanToken: start: 12, end: 16, token: :FROM, keyword_kind: :RESERVED_KEYWORD>,
#      <PgQuery::ScanToken: start: 17, end: 29, token: :IDENT, keyword_kind: :NO_KEYWORD>,
#      <PgQuery::ScanToken: start: 30, end: 35, token: :ORDER, keyword_kind: :RESERVED_KEYWORD>,
#      <PgQuery::ScanToken: start: 36, end: 38, token: :BY, keyword_kind: :UNRESERVED_KEYWORD>,
#      <PgQuery::ScanToken: start: 39, end: 40, token: :ICONST, keyword_kind: :NO_KEYWORD>,
#      <PgQuery::ScanToken: start: 41, end: 44, token: :ASC, keyword_kind: :RESERVED_KEYWORD>
#  ]
```

Then, you can note the `:RESERVED_KEYWORD` which represents some of the words.
We also see that `:BY` is a proper candidate to keep upcased.

Now, let's build a shortcut that can allow you to do it.

You can create a `Fastfile` that will be automatically loaded by fast in the
command line.

```ruby
# Format SQL
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

Using the [shortcuts](https://jonatas.github.io/fast/shortcuts/) you can easily
organize your prototyping scripts.

I'm also documenting it in the [sql support page](https://jonatas.github.io/fast/sql-support/#format-sql).

I also created a video showing how I implemented  this and walking you through
more details.

{% youtube o0FkOvJqKgs %}

This is a small toy, not a production case. But, it's made to have fun.

It can help you prototype a search for your custom case or allow you to experiment with that!

You don't need to use fast for any of this, but if you use the lib for anything and want to share, feel free to reach out!

This is my personal playground for automated refactoring and code analysis. I see an excellent opportunity to expand/integrate the Ruby + SQL community, as Postgresql is also the default choice for too many Ruby developers. I'm happy to be organizing some conveniences for the Ruby+SQL ecosystem, and I'm so grateful to see too many great people already improving the toolings around this corner, too :)

I am happy to connect via [linkedin][lkdn] or open an issue on [fast][fast].

Happy coding!

[lkdn]: https://www.linkedin.com/in/jonatasdp
[fast]: https://github.com/jonatas/fast
[docs]: https://jonatas.github.io/fast/sql-support/
