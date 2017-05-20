---
  title: Search in Ruby AST
  categories: [ruby]
  layout: post
---

Some months ago I started coding some cops for
[RuboCop](https://github.com/bbatsov/rubocop).


I was amazed in my first contact with the Ruby [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
and what I can do with that.

After some time looking for other cops, I discovered the
[NodePattern](https://github.com/bbatsov/rubocop/blob/master/lib/rubocop/node_pattern.rb)
and it was an amazing experience. It reminds the mind blowing as when I learned
regular expressions, and now I got the same in the Abstract Syntax Tree.

To check how the AST works, please install the gem
[parser](https://github.com/whitequark/parser). It brings a helpful command `ruby-parse`
that can print the AST representation of some Ruby code.

Let's start looking for the AST and how it works. The following class
declaration:

```ruby
class SimpleClass
end
```

Looking the AST representation with the `ruby-parse` utility:

    $ ruby-parse simple_class.rb

```
(class
  (const nil :SimpleClass) nil nil)
```

I created a small project to help me understand and do experiments with Ruby AST
and test the node pattern. You can check out it and follow this step by step:


    $ git clone git@github.com:jonatas/rubocopular.git

Then basically it has a `bin/console` that allows you to play with to simple
methods `node` and `test`.

Lets check how it works:

    $ cd rubocopular
    $ bin/console

**node** is a method that can parse the AST representation of some Ruby as
string code.


```ruby
node('a = 1') # => s(:lvasgn, :a, s(:int, 1))
```
So, the output is pretty similar with `ruby-parse`. As it's using `pry` 
you can check that the method `s` is a simple wrap to a node:

```ruby
show-method s
# From: /Users/jonatasdp/.rbenv/versions/2.3.3/lib/ruby/gems/2.3.0/gems/rubocop-0.48.1/lib/rubocop/ast/sexp.rb @ line 11:
# Owner: RuboCop::AST::Sexp
# Visibility: public
# Number of lines: 3

def s(type, *children)
  Node.new(type, children)
end
```

And basically, the node is an object that has a `#type` and `#children`.
The children can be symbols or other nodes and so on.


```ruby
node('a = 1')          # => s(:lvasgn, :a, s(:int, 1))
node('a = 1').type     # => :lvasgn
node('a = 1').children # => [:a, s(:int, i)]
```

Let's check a few more examples:

```ruby
node('class A ; end')    # => s(:class, s(:const, nil, :A), nil, nil)
```

Extended class:

```ruby
node('class A < B; end') # => s(:class, s(:const, nil, :A), s(:const, nil, :B), nil)
```

Implementing a method:

```
node('class A < B; def method; end end')
# s(:class,
#   s(:const, nil, :A),
#   s(:const, nil, :B),
#   s(:def, :method,
#     s(:args), nil))
```

You can use puts to check the same result as `ruby-parse` outputs:

```ruby
puts node('class A < B; def method; end end')
```

The output should be:

```
(class
  (const nil :A)
  (const nil :B)
  (def :method
    (args) nil))
```

Then all are single nodes with a `#type` and possible `#children`.

A few examples with math:

```ruby
node('1 + 2 + 3') # s(:send, s(:send, s(:int, 1), :+, s(:int, 2)), :+, s(:int, 3))
```

Going deeply in some levels:

```ruby
node('1 + 2 + (3 / 5 * (6 ** 7))')
```

The output should be a tree a bit more complex:

```
s(:send,
  s(:send,
    s(:int, 1), :+,
    s(:int, 2)), :+,
  s(:begin,
    s(:send,
      s(:send,
        s(:int, 3), :/,
        s(:int, 5)), :*,
      s(:begin,
        s(:send,
          s(:int, 6), :**,
          s(:int, 7))))))
```

Other example with methods:

```ruby
puts node('a.b.c(d).e(f)')
```

AST output:

```
(send
  (send
    (send
      (send nil :a) :b) :c
    (send nil :d)) :e
  (send nil :f))
```

Cool yeah? Let's have fun with the Node Pattern 🕶


### RuboCop Node Pattern

The node pattern is a cool engine that allows you to match in some AST code
using the **node pattern**. It's pretty similar of use regular expressions for
me. Let's come back with our `a = 1` assignment example:

```ruby
node('a = 1') # => s(:lvasgn, :a, s(:int, 1))
```

Did you remember the [test](https://github.com/jonatas/rubocopular/blob/master/lib/rubocopular.rb#L14)
method I mentioned before?

```ruby
test('(...)', 'a = 1') # => true
```

Cool, it matches with "something with last children".

Now let's check if it's a `:lvasg` aka local variable assignment:


```ruby
test('(:lvasgn)','a = 1') # => nil
```

It does not match because the node has parameters. Lets specify that it comes
with something else using the `...` shortcut:

```ruby
test('(:lvasgn ...)','a = 1') # => true
```

#### Capturing

It's hard sometimes to just understand based on `true` and `false`. Let's use
`$` to capture and go deeply in the comprehension:

```ruby
test('(:lvasgn $...)','a = 1') # => [:a, s(:int, 1)]
```

Cool! It captures the children.

Let's ignore the variable name using `_` that for me represents "one thing",
I don't care the name or value for a while.

```ruby
test('(:lvasgn _ $...)','a = 1') # => [s(:int, 1)]
```

We can also capture only the value:

```ruby
test('(:lvasgn _ (int $_)','a = 1') # => 1
```

Or the assigned node:

```ruby
test('(:lvasgn _ $(int _))','a = 1') # => s(:int, 1)
```

Or capture multiple things independently:

```ruby
test('(:lvasgn _ ($int $_))','a = 1') # => [:int, 1]
```

That's cool no?

Let's imagine we want to restrict our search for float or int:

```ruby
test('(:lvasgn _ (int _))','a = 1') # => true
```

Testing the expression with a float will not work:

```ruby
test('(:lvasgn _ (int _))','a = 1.0') # => nil
```

Now let's introduce `{}` that we can union patterns:

```ruby
test('(:lvasgn _ ({int float} _))','a = 1.0') # => true
```

And we can capture the type of the field as well:

```ruby
test('(:lvasgn _ (${int float} _))','a = 1.0') # => :float
test('(:lvasgn _ (${int float} _))','a = 1') # => :int
```

This search thing was amazing for me, and I tried to encapsulate in a search 
command to allow me to search in code with this expression as I do with `grep` or `ag`.

The prototype is in [rubocopular](https://github.com/jonatas/rubocopular) project too. I created the `bin/search` for
it:

The search command syntax is pretty simple:

    bin/search 'pattern' *path-to-ruby-files

Let's try something:

```
$ bin/search '(const ... )' lib/*.rb                                                                                                                  11:58:01
lib/rubocopular.rb:5: Rubocopular
lib/rubocopular.rb:7: RuboCop::ProcessedSource
lib/rubocopular.rb:11: RuboCop::ProcessedSource
lib/rubocopular.rb:11: IO
lib/rubocopular.rb:15: RuboCop::AST::Node
lib/rubocopular.rb:16: RuboCop::NodePattern
lib/rubocopular.rb:20: RuboCop::NodePattern
```

Nice, we can filter a bit more and search only for things under `RuboCop`
scope:

```
bin/search '(const nil :RuboCop ... )' lib/*.rb                                                                                                     11:59:09
lib/rubocopular.rb:7: RuboCop
lib/rubocopular.rb:11: RuboCop
lib/rubocopular.rb:15: RuboCop
lib/rubocopular.rb:16: RuboCop
lib/rubocopular.rb:20: RuboCop
```

It's cool, but we can also do it with `grep`. The difference here is that we're
listing the nodes not only the code, than we can print some multiline nodes.

Let's print all check static methods defined in Rubocopular library:

```
$ bin/search '(defs ... )' lib/*.rb                                                                                                                   12:00:48
lib/rubocopular.rb:6: def self.node(code)
    RuboCop::ProcessedSource.new(code.to_s, 2.3).ast
  end
lib/rubocopular.rb:10: def self.parse_source(path)
    RuboCop::ProcessedSource.new(IO.read(path), 2.3, path)
  end
lib/rubocopular.rb:14: def self.test(pattern, code)
    code = node(code) unless code.is_a?(RuboCop::AST::Node)
    RuboCop::NodePattern.new(pattern).match(code)
  end
lib/rubocopular.rb:19: def self.inspect(pattern, code)
    RuboCop::NodePattern.new(pattern.gsub(/(\.{3}|_)/, '$\1')).match(node(code))
  end
```

Awesome, it works!

Thanks for reading until here. If you're interested in AST search, I'm working
in another library that is my "node pattern" implementation running without
RuboCop dependency. The idea is just starting: https://github.com/jonatas/fast

You can do similar things with plain ruby code and arrays to build the matcher:

```ruby
Fast.match?(s(:send, s(:send, nil, :a), :b), [:send, '...'])) # => true
```

Checkout the [current specs](https://github.com/jonatas/fast/blob/master/spec/fast_spec.rb#L48).

In the next step, I'm thinking about do a `f()` for find and `c()` to capture things. Not sure
exactly how to proceed but the idea is something like:

```ruby
Fast.match?(ast, f(:send, f(:send, f(:send, c(:send, nil, '_'), '_'), :c), '_'))) # => s(:send, nil, :a)
```

Any thoughts or ideas about how to be expressive in this search?
