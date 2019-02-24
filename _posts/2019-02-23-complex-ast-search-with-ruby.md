---
layout: post
title: Complex AST search with Ruby
categories: [ruby, ast, fast]
---

I previously wrote a post about [search in ruby ast](/search-in-ruby-ast) and I
was showing the RuboCop node pattern in action.

Well, I take it as a personal challenge to write a small compiler and isolate
the node pattern language to learn about compilers and scratch my own itch.

RuboCop seems too much to what I'd like to do and I start discovering how to
build these functions along the way.

I started working on fast: https://github.com/jonatas/fast/.

Instead of keep piling tutorials and blog posts on my own domain, I decided to create one dedicated documentation to the library, and here we are:

https://jonatas.github.io/fast/

I created a few tutorials showing how to
[identify code similarity](https://jonatas.github.io/fast/similarity_tutorial/)
and [create dynamic experiments](https://jonatas.github.io/fast/experiments/)
that can replace code and keep running the test suite.

If the test passes, it tries a new refactor and keep refactoring.

I'm thrilled with all the work I dedicated here and during this week I
[implemented a new feature](https://github.com/jonatas/fast/pull/11)
that I'd like to show here.

Basically, the current function is able to use custom ruby methods to leverage
complexity in AST search.

With the new syntax, it's possible to use embedded methods in the middle of the
expressions that also matches nodes or inner elements.

Let's take a look in some code example:


```ruby
class Example
  def first_method
  end
  def second_method
  end
  def first_method # repeated
  end
end
```

How can we build a search to find the repeated method?

With a simple search of `def` we have the following results:

```bash
fast 'def ' example.rb                                                                                                                                                                                                                                                                                                                                                                                                                                    21:30:40
# example.rb:2
def first_method
  end
# example.rb:4
def second_method
  end
# example.rb:6
def first_method # repeated
  end
```

If I know the method name I can simply say it:

```bash
fast '(def first_method)' example.rb                                                                                                                                                                                                                                                                                                                                                                                                                       21:30:56
# example.rb:2
def first_method
  end
# example.rb:6
def first_method # repeated
  end
```
But how can I collect the method names to discover if they're repeated?

Using [Fast.capture](https://jonatas.github.io/fast/syntax/#is-for-capture-current-expression)
It can be easily found. Let's see how I could do it in the old way?

```ruby
Fast.capture(Fast.ast_from_file("example.rb"), "(def $_)")
# => [:first_method, :second_method, :first_method]
```

Great! But I'd like to pick only the third element that is the first duplicated.


How can I make it happen? How to ignore the `second_method` and the first
`first_method`?

We need to build a small method that can record the method name and collect unique methods. When it founds some method that is already registered. It can target this as a "match". Let's implement the method and use it inside our
expression:

```ruby
def duplicated(method_name)
  @methods ||= []
  already_exists = @methods.include?(method_name)
  @methods << method_name
  already_exists
end
```

The method simply receives a symbol and check if it was previously included in
the array. Now, we can use the method:

```ruby
duplicated :a
# => false
duplicated :a
# => true
duplicated :a
# => true
duplicated :b
# => false
duplicated :b
# => true
```

```ruby
puts Fast.search_file( '(def #duplicated)', 'example.rb')
# (def :first_method
#  (args) nil)
```

Keep in mind that if you rerun the same search, it will not work because we
need to reset the `@methods` variable.

The [MethodCall](https://github.com/jonatas/fast/blob/master/lib/fast.rb#L382)
will simply take the argument, no matter if it's a node or some inner element.
It will depend on where the function is placed in the DSL.

If we want to match with the node, it needs to be written and validating the `def` internally. Example:

```ruby
def duplicated_def node
  return false unless node.type == :def
  method_name, = node.children
  @methods ||= []
  already_exists = @methods.include?(method_name)
  @methods << method_name
  already_exists
end
```

We created a guard clause to avoid match other node types. As the method call
will receive the node inline with the expression, we can even remove the parens
from the expression:

```ruby
puts Fast.search_file( '#duplicated_def', 'example.rb')
(def :first_method
  (args) nil)
```

That's all I have for today! I'm a bit bored with my tool, and I'm also working
to [extract the node pattern from RuboCop to a separated library](https://github.com/rubocop-hq/rubocop/pull/6686).

