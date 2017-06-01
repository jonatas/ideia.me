---
  title: Parsing Ruby Code
  categories: [ruby]
  layout: post
---

After start my saga on [Ruby AST Search](./)
I built a [few](https://github.com/jonatas/rubocopular) [tools](https://github.com/jonatas/fast) to
help me to understand the AST and to inspect it.

After a few days around I discover everything I needed existed already built in and
I just need to learn about it.

## Ruby Ripper

[Ripper](http://ruby-doc.org/stdlib-2.0.0/libdoc/ripper/rdoc/Ripper.html)
provides a symbolic expression tree for your code.

As it's in the standard library, you can only start using it.

I love to use `ruby -e` to test some code inline. Then, let's start with
something to learn about the lexer:

### Ripper#tokenize

We can start with a simply tokenize. That will split your code into atoms to
compile each piece in the sequence.

$ ruby -r ripper -e 'p Ripper.tokenize("1 + 2")'

```ruby
["1", " ", "+", " ", "2"]
```

### Ripper#lex

The lexer will tag each tokenized piece and identify each part of the statement:

$ ruby -r ripper -e 'p Ripper.sexp("1+2")'

The output should be something like:

```ruby
[:program, [[:binary, [:@int, "1", [1, 0]], :+, [:@int, "2", [1, 2]]]]]
```

Checking one more example:

$ ruby -r ripper -r pp -e 'pp Ripper.lex("def a; end")'

```
[[[1, 0], :on_kw, "def"],
 [[1, 3], :on_sp, " "],
 [[1, 4], :on_ident, "a"],
 [[1, 5], :on_semicolon, ";"],
 [[1, 6], :on_sp, " "],
 [[1, 7], :on_kw, "end"]]
```

You can also call the `Ripper.sexp` to get the symbolic expression of your code:

Let's use `pp` to make it more easy to ready:

$ ruby -r ripper -r pp -e 'pp Ripper.sexp("1+2 + ( 3 * 4)") '

```ruby
[:program,
 [[:binary,
   [:binary, [:@int, "1", [1, 0]], :+, [:@int, "2", [1, 2]]],
   :+,
   [:paren, [[:binary, [:@int, "3", [1, 8]], :*, [:@int, "4", [1, 12]]]]]]]]
```

### Ripper#slice

This feature is cool and strange. I can't find a proper documentation, and I debug it by myself trying to understand better the strategy.
It's a kind of regular expression mixed with the lexer. Take a look at the example:

```ruby
Ripper.slice('(1 + 2.0 + 1.1)','int.*float.*float')
=> "1 + 2.0 + 1.1"
```

It's useful for grep for specific sequence of node types, for example, lets
check for a sequence of `int float float` in the operation:

```ruby
Ripper.slice('2.2 / 4.2 + (1 + 2.0+ 1.1) * 2','int.*float.*float')
=> "1 + 2.0+ 1.1"
```

Take a look at the [official example](http://ruby-doc.org/stdlib-2.0.0/libdoc/ripper/rdoc/Ripper.html#slice), and it's cooler than mine.

```ruby
Ripper.slice('def m(a) nil end', '[ident lparen rparen]+')  #=> "m(a)"
```


That's all for today! Thanks for reading o/
