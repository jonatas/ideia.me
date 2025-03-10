---
title: "Adventures on automated code replacement"
layout: post
tags: ['ruby', 'ast', 'fast']
description: "A few months ago I started working on fast.
The tool is a kind of mini-language focused in find code by abstract syntax tree representation."
---
A few months ago I started working on [fast](https://github.com/jonatas/fast).
The tool is a kind of mini-language focused in find code by abstract syntax tree representation.

After I put it to work, I decide to use the [parser rewritter](http://www.rubydoc.info/github/whitequark/parser/Parser/Rewriter)
to work with the nodes that Fast can [match](https://github.com/jonatas/fast#how-it-works) and then [replace](https://github.com/jonatas/fast#fastreplace)
expressions.


So, a few days ago I decided to write my first automated prototype to improve a
few lines of code without use my favourite editor: VIM ;)

My first experiment is [here](https://gist.github.com/jonatas/836eb9bff1c4fa20cfee1b58ac4ee27b) and it does the following steps:

1. search for specs that use [FactoryGirl](https://github.com/thoughtbot/factory_girl) calls to the method `create`.
2. create an experimental spec file replacing the current method call from `create` to `build_stubbed`
3. run the experimental spec
4. move the experiment file to the original if it works otherwise remove it

So, my script was very simple and the experiment is here:

<script src="https://gist.github.com/jonatas/836eb9bff1c4fa20cfee1b58ac4ee27b.js"></script>

The process worked sequentially, modifying one by one as a human and running
the experimental spec again.

The process spend like 6 hours to analyse around 600 files and got 90 files successfully improved without human intervention 8-)

Running all improved specs, it speeds up the 30% in average on those files.

The cool part is that the tedious manual replacement come into an interesting
the way of being checking and validating real code with strict and custom rules.

I'll be probably sugar part of this scaffold to the tool and allow to create
small experiments like this and check different things mechanically.

I think this tests can allow developers to create smarter codes and build checkers that don't need human intervention.

As RuboCop auto-correct mode is reliable and use the same API that fast gem
uses the same rewriter behind the scenes.

I know I could do the most of it using `sed` and combine a few scripts in shell, but I'm
comfortable with Ruby and the replace is sensitive and strict to the right syntax.

I hope `fast` can be used in the future to help other developers to automate
their code base migrations. e.g. when you need to migrate syntax to a new
Rails version, it brings new incompatibilities in the syntax and better API's.

Today in general, those kind of needs are still be done manually by developers.
I hope more developers get involved on this kind of cause. It's the next step
before everything turns into deep learning :D


