---
layout: post
title: "Saving LLM Tokens with Fast: AST Folding & Dependency Free"
categories: ['ruby', 'ast', 'programming', 'technology']
tags: ['fast', 'llm', 'agents', 'refactoring', 'prism']
description: "How removing the parser gem dependency and introducing AST folding in the Fast gem helps LLM agents navigate huge codebases efficiently while saving massive amounts of tokens."
---
If you've been following my progress with the [Fast gem](https://github.com/jonatas/fast), you probably know I'm slightly obsessed with Abstract Syntax Trees (ASTs) and using them to search and refactor code like a boss. But lately, I've had a new challenge on my plate: making `fast` a first-class citizen for AI agents.

When you're building an LLM agent to interact with a massive Rails codebase, giving it full file contents can quickly devour your token limits. A 2000-line model file isn't just hard for humans to read; it's expensive and noisy for an AI.

I wanted a way for LLMs to easily grab the "skeleton" of a file—just the class definitions, methods, validations, and associations—without reading every inner block of logic. And as I started building this, I realized it was also the perfect time to pay off some long-standing technical debt.

### Dropping the `parser` Gem Dependency

For years, `fast` was married to the `parser` gem (and `rubocop-ast` in its earliest days). It's an incredible piece of software, but it has some downsides. It's an external dependency that frequently needs to catch up with new Ruby syntaxes.

Recently, I made a massive architectural shift: I removed the `parser` gem dependency entirely in favor of [Prism](https://github.com/ruby/prism) (and Ruby's native syntax parser). 

This refactoring wasn't just about reducing the dependency graph. It was about making `fast` leaner and deeply integrated with modern Ruby internals. 

The best part? I managed to do this while keeping the core `fast` search API fully backward-compatible. All the node patterns you're used to—things like `(send (int _) :+ (int _))` or `{int float}`—continue to work effortlessly because `fast` elegantly adapts the Prism AST output back into the familiar `parser`-like node structures. Every single tutorial and script I've written over the years still works!

### AST Folding: The LLM Token Saver

With the dependencies cleaned up, I focused on the LLM challenge: token efficiency. 

I introduced an **AST folding** feature (`--level N`) into the CLI. Here's the core idea: when an LLM asks for a file, `fast` can fold the AST at a specific depth level. When it hits the depth limit, it simply replaces the deep nested blocks and method bodies with `# ...`.

```bash
$ fast .resume app/models/user.rb
```

Instead of dumping thousands of lines, the agent gets something like this:

```ruby
class User < ApplicationRecord
  has_many :posts
  validates :email, presence: true

  def active?
    # ...
  end

  def promote_to_admin!
    # ...
  end
end
```

### The Impact on AI Workflows

By collapsing the internal block implementations, we're doing a few incredibly powerful things:
1. **Drastic Token Reduction:** We can shrink a 10,000-token file down to 500 tokens.
2. **Reduced Context Noise:** The LLM's attention span is hyper-focused on the architecture, preventing it from getting distracted by loop internals or specific algorithmic implementations unless it explicitly asks for them.
3. **Faster Experimentation:** Agents can quickly scan an entire app's architecture and iterate on hypotheses much faster.

We essentially treat Ruby code like a perfectly organized, dynamic table of contents. I've even set up a `.resume` shortcut in the `Fastfile` specifically mapped to highlight Rails relationships, attributes, hooks, and scopes, producing a beautifully condensed context payload.

I see more and more that the bottleneck for AI isn't capability; it's the quality of the context we feed it. By trimming the fat with AST folding and a dependency-free core, `fast` is turning out to be one of the best sidekicks an AI agent could ask for.

If you are exploring agents and working with Ruby, give it a try and feel free to reach out. I'm having a blast building this foundation.

Happy hacking!
