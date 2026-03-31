---
layout: post
title: "Saving LLM Tokens with Fast: AST Folding & Dependency Free"
categories: ['ruby', 'ast', 'programming', 'technology']
tags: ['fast', 'llm', 'agents', 'refactoring', 'prism']
description: "How removing the parser gem dependency and introducing AST folding in the Fast gem helps LLM agents navigate huge codebases efficiently while saving massive amounts of tokens."
mermaid: true
---
If you've been following my progress with the [Fast gem](https://github.com/jonatas/fast), you probably know I'm a big fan  of exploring code with Abstract Syntax Trees (ASTs) and using them to search and refactor code like a boss. But lately, I've had a new challenge on my plate: making `fast` a first-class citizen for AI agents.

When you're building an LLM agent to interact with a massive Rails codebase, giving it full file contents can quickly devour your token limits. A 2000-line model file isn't just hard for humans to read; it's expensive and noisy for an AI.

I wanted a way for LLMs to easily grab the "skeleton" of a file—just the class definitions, methods, validations, and associations—without reading every inner block of logic. And as I started building this, I realized it was also the perfect time to pay off some long-standing technical debt.

### Dropping the `parser` Gem Dependency

For years, `fast` was married to the `parser` gem. It's an incredible piece of software, but it has some downsides. It's an external dependency that frequently needs to catch up with new Ruby syntaxes.

Recently, Codex, Claude and Gemini helped me to made a massive architectural shift: I removed the `parser` gem dependency entirely in favor of [Prism](https://github.com/ruby/prism) (and Ruby's native syntax parser). 

This refactoring wasn't just about reducing the dependency graph. It was about making `fast` leaner and deeply integrated with modern Ruby internals. 

{% mermaid %}
flowchart TD
    subgraph Before["Before (parser gem)"]
        A[Ruby Code] --> B[parser]
        B --> C[parser AST nodes]
        C --> D[fast search API]
    end

    subgraph After["After (Prism)"]
        E[Ruby Code] --> F[Prism (Ruby native)]
        F --> G[Prism AST nodes]
        G -->|Adaptation Layer| H[fast search API]
    end

    style Before fill:#f1f5f9,stroke:#cbd5e1,color:#334155
    style After fill:#f0fdf4,stroke:#86efac,color:#166534
{% endmermaid %}

The best part? I managed to do this while keeping the core `fast` search API fully backward-compatible. All the node patterns you're used to—things like `(send (int _) :+ (int _))` or `{int float}`—continue to work effortlessly because `fast` elegantly adapts the Prism AST output back into the familiar `parser`-like node structures. Every single tutorial and script I've written over the years still works!

### AST Folding: The LLM Token Saver

With the dependencies cleaned up, I focused on the LLM challenge: token efficiency. I introduced an **AST folding** feature (`--level N`) into the CLI. 

To see it in action, let's use [RubyEvents](https://github.com/rubyvideo/rubyevents) as a playground and benchmark. Take the `Talk` model (`app/models/talk.rb`), which handles a lot of business logic. The regular file is massive:
- **723 lines of code**
- **~23,000 characters**

Dumping that straight into an LLM context is expensive and mostly noise. The AI doesn't need the inner workings of `def video_available?` immediately—it just needs the class signature to understand the architecture.

When we use the `.summary` shortcut built into my local `Fastfile` (which leverages AST folding), we can generate a perfectly condensed skeleton of the class:

```bash
$ fast .summary ../rubyevents/app/models/talk.rb
```

Instead of thousands of lines, the agent receives a beautifully clean architectural map:

```ruby
class Talk < ApplicationRecord

  WATCHABLE_PROVIDERS = [...]
  KIND_LABELS = {...}

  include Rollupable
  # ... (6 includes)

  belongs_to :event, optional: true, counter_cache: :talks_count, touch: true
  has_many :child_talks, class_name: "Talk", foreign_key: :parent_talk_id, dependent: :destroy
  # ... (30+ associations cleanly grouped)

  Scopes:
    without_raw_transcript
    with_raw_transcript
    for_topic(topic_slug)
    # ...

  Hooks: before_validation :set_kind, if: -> { !kind_changed? }

  Validations:
    :title, presence: true
    :date, presence: true

  Macros:
    configure_slug(attribute: :title, auto_suffix_on_collision: true)
    # ...

  def published?
  def video_available?
  def thumbnail_url(size:, request:)
  # ... (40+ method signatures without their bodies)
end
```

What just happened? Setting the proper folding levels provides extreme token savings for large language models:
1. **No comments:** We strip out comment clutter automatically. The LLM gets raw architectural design.
2. **No deep details, only on-demand unfolding:** All method implementations are suppressed, leaving only signatures. 

The payload shrinks down to barely **130 lines (~4,300 chars)**. We get over an **80% reduction in tokens** while retaining 100% of the class's structure. If the agent decides it needs the deep details of `video_available?`, it can query for that method's specific body rather than paying for the entire 700-line file.

<div class="interactive-widget" style="margin: 20px 0; padding: 20px; border-radius: 8px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255,255,255,0.1);">
  <h3 style="margin-top: 0; font-size: 1.2rem;">Interactive AST Folding Simulator</h3>
  <p style="font-size: 0.9rem; margin-bottom: 15px;">Adjust the folding level to see how code density and tokens change for a typical Ruby file.</p>

  <div style="margin-bottom: 15px;">
    <label for="folding-slider" style="display: block; margin-bottom: 8px; font-weight: bold;">Folding Level: <span id="folding-level-display">0 (Raw Source)</span></label>
    <input type="range" id="folding-slider" min="0" max="3" value="0" style="width: 100%; cursor: pointer;" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0" aria-valuetext="Level 0: Raw Source">
  </div>

  <div style="display: flex; justify-content: space-between; gap: 15px;">
    <div style="flex: 1; padding: 15px; background: #0f172a; border-radius: 6px; text-align: center;">
      <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">Lines of Code</div>
      <div id="sim-lines" style="font-size: 2rem; font-weight: bold; color: #38bdf8;">723</div>
    </div>
    <div style="flex: 1; padding: 15px; background: #0f172a; border-radius: 6px; text-align: center;">
      <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">Estimated Tokens</div>
      <div id="sim-tokens" style="font-size: 2rem; font-weight: bold; color: #10b981;">~6,200</div>
    </div>
    <div style="flex: 1; padding: 15px; background: #0f172a; border-radius: 6px; text-align: center;">
      <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">Token Savings</div>
      <div id="sim-savings" style="font-size: 2rem; font-weight: bold; color: #fbbf24;">0%</div>
    </div>
  </div>

  <div id="sim-live-region" aria-live="polite" class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;">Level 0 selected. 723 lines. Approximately 6200 tokens. 0% savings.</div>

  <div id="sim-code-preview" style="margin-top: 15px; background: #1e1e1e; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; color: #d4d4d4; white-space: pre-wrap; overflow-x: auto; max-height: 250px;">class Talk < ApplicationRecord
  # Lots of comments here
  # describing the class logic

  def published?
    status == 'published' &&
    published_at <= Time.current
  end

  # ... (700 more lines)
end</div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('folding-slider');
  const display = document.getElementById('folding-level-display');
  const linesEl = document.getElementById('sim-lines');
  const tokensEl = document.getElementById('sim-tokens');
  const savingsEl = document.getElementById('sim-savings');
  const codePreview = document.getElementById('sim-code-preview');
  const liveRegion = document.getElementById('sim-live-region');

  const states = [
    {
      level: 0,
      name: "Level 0 (Raw Source)",
      lines: 723,
      tokens: 6200,
      savings: "0%",
      code: "class Talk < ApplicationRecord\n  # Lots of comments here\n  # describing the class logic\n  \n  def published?\n    status == 'published' &&\n    published_at <= Time.current\n  end\n  \n  # ... (700 more lines)\nend"
    },
    {
      level: 1,
      name: "Level 1 (Remove Comments)",
      lines: 610,
      tokens: 4900,
      savings: "21%",
      code: "class Talk < ApplicationRecord\n  def published?\n    status == 'published' &&\n    published_at <= Time.current\n  end\n  \n  # ... (600 more lines)\nend"
    },
    {
      level: 2,
      name: "Level 2 (Fold Private Methods)",
      lines: 480,
      tokens: 3800,
      savings: "38%",
      code: "class Talk < ApplicationRecord\n  def published?\n    status == 'published' &&\n    published_at <= Time.current\n  end\n  \n  private\n  # private methods folded...\nend"
    },
    {
      level: 3,
      name: "Level 3 (Signatures Only)",
      lines: 130,
      tokens: 1100,
      savings: "82%",
      code: "class Talk < ApplicationRecord\n  WATCHABLE_PROVIDERS = [...]\n  \n  belongs_to :event\n  \n  def published?\n  def video_available?\n  def thumbnail_url(size:, request:)\nend"
    }
  ];

  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    const state = states[val];

    display.textContent = state.name;
    linesEl.textContent = state.lines;
    tokensEl.textContent = "~" + state.tokens.toLocaleString();
    savingsEl.textContent = state.savings;
    codePreview.textContent = state.code;

    slider.setAttribute('aria-valuenow', val);
    slider.setAttribute('aria-valuetext', state.name);

    liveRegion.textContent = `${state.name} selected. ${state.lines} lines. Approximately ${state.tokens} tokens. ${state.savings} savings.`;
  });
});
</script>

### MCP: Inline Experiments and Refactoring

To truly scale LLM-driven coding on huge Ruby projects, token savings aren't enough; we need seamless interaction. That's why I've repurposed `fast`'s core into an **MCP (Model Context Protocol)** server tool. 

By exposing the `.summary`, `.scan`, and direct node-pattern queries to the LLM via MCP, we establish an interactive playground:

{% mermaid %}
sequenceDiagram
    participant LLM as AI Agent
    participant MCP as Fast MCP Server
    participant Code as Codebase (AST)

    LLM->>MCP: Request class structure (.summary)
    MCP->>Code: Parse & Fold AST
    Code-->>MCP: Lean AST skeleton
    MCP-->>LLM: Return 130 lines (vs 723)

    LLM->>MCP: Query specific method body (.scan)
    MCP->>Code: Extract specific node
    Code-->>MCP: Method implementation
    MCP-->>LLM: Return targeted 10 lines

    LLM->>MCP: Propose structural refactor
    MCP->>Code: Dry-run AST mutation
    Code-->>MCP: AST verification result
    MCP-->>LLM: Confirm safe rewrite
{% endmermaid %}

1. **Navigating Big Codebases:** Instead of `cat`ing huge files, the agent uses `.scan` across `lib` or `app/models`.
2. **Inline Experiments:** The AI uses `fast` patterns to test assumptions against the live AST.
3. **Refactoring Confirmation:** When the LLM proposes a structural mutation, it uses the MCP loop to confirm structurally what it will change. Because `fast` understands the AST, the agent can dry-run a rewrite and verify the updated output—applying precise, safe updates recursively without context bloat or syntax hallucination.

I see more and more that the bottleneck for AI isn't capability; it's the quality of the context we feed it. By trimming the fat with AST folding and exposing a dependency-free core through MCP, `fast` is turning out to be one of the best sidekicks an AI agent could ask for.

If you are exploring agents and working with Ruby, give it a try and feel free to reach out. I'm having a blast building this foundation.

Happy hacking!
