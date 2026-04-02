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

<div class="interactive-widget token-saver-widget" style="background: var(--bg-secondary, #0f172a); padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(255,255,255,0.1);">
  <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.2rem; color: var(--text-color, #e2e8f0);">AST Folding Simulator</h3>
  <div style="display: flex; gap: 20px; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 300px;">
      <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 10px;">Select Folding Level:</p>
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
         <button id="btn-full" class="folding-btn active" style="padding: 8px 16px; background: #334155; color: white; border: 1px solid #475569; border-radius: 6px; cursor: pointer;">Full Code</button>
         <button id="btn-folded" class="folding-btn" style="padding: 8px 16px; background: transparent; color: #94a3b8; border: 1px solid #334155; border-radius: 6px; cursor: pointer;">Folded (Level 1)</button>
      </div>
      <div style="background: #1e293b; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; color: #cbd5e1; height: 180px; overflow-y: auto;">
        <pre id="code-display" style="margin: 0; white-space: pre-wrap;"><span style="color:#c678dd;">class</span> <span style="color:#e5c07b;">Talk</span> <span style="color:#56b6c2;">&lt;</span> <span style="color:#e5c07b;">ApplicationRecord</span>
  <span style="color:#c678dd;">def</span> <span style="color:#61afef;">video_available?</span>
    <span style="color:#c678dd;">if</span> status <span style="color:#56b6c2;">==</span> <span style="color:#98c379;">'published'</span> <span style="color:#56b6c2;">&&</span> video_url.present?
      <span style="color:#e5c07b;">HTTParty</span>.get(video_url).success?
    <span style="color:#c678dd;">else</span>
      <span style="color:#d19a66;">false</span>
    <span style="color:#c678dd;">end</span>
  <span style="color:#c678dd;">end</span>
<span style="color:#c678dd;">end</span></pre>
      </div>
    </div>
    <div style="flex: 1; min-width: 250px; display: flex; flex-direction: column; justify-content: center;">
       <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 0.9rem; color: #94a3b8;">Estimated Tokens Used</p>
          <div id="token-count" style="font-size: 3rem; font-weight: bold; color: #ef4444; margin-bottom: 10px;">84</div>
          <div id="token-savings" style="font-size: 0.9rem; color: #10b981; min-height: 1.5em;"></div>
       </div>
    </div>
  </div>
  <div id="folding-live-region" aria-live="polite" class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;">Currently viewing Full Code using 84 tokens.</div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const btnFull = document.getElementById('btn-full');
    const btnFolded = document.getElementById('btn-folded');
    const codeDisplay = document.getElementById('code-display');
    const tokenCount = document.getElementById('token-count');
    const tokenSavings = document.getElementById('token-savings');
    const liveRegion = document.getElementById('folding-live-region');

    const fullCodeHTML = '<span style="color:#c678dd;">class</span> <span style="color:#e5c07b;">Talk</span> <span style="color:#56b6c2;">&lt;</span> <span style="color:#e5c07b;">ApplicationRecord</span>\n  <span style="color:#c678dd;">def</span> <span style="color:#61afef;">video_available?</span>\n    <span style="color:#c678dd;">if</span> status <span style="color:#56b6c2;">==</span> <span style="color:#98c379;">\'published\'</span> <span style="color:#56b6c2;">&&</span> video_url.present?\n      <span style="color:#e5c07b;">HTTParty</span>.get(video_url).success?\n    <span style="color:#c678dd;">else</span>\n      <span style="color:#d19a66;">false</span>\n    <span style="color:#c678dd;">end</span>\n  <span style="color:#c678dd;">end</span>\n<span style="color:#c678dd;">end</span>';

    const foldedCodeHTML = '<span style="color:#c678dd;">class</span> <span style="color:#e5c07b;">Talk</span> <span style="color:#56b6c2;">&lt;</span> <span style="color:#e5c07b;">ApplicationRecord</span>\n  <span style="color:#c678dd;">def</span> <span style="color:#61afef;">video_available?</span>\n<span style="color:#c678dd;">end</span>';

    function setFolded(isFolded) {
        if (isFolded) {
            btnFolded.style.background = '#334155';
            btnFolded.style.color = 'white';
            btnFolded.style.borderColor = '#475569';
            btnFolded.setAttribute('aria-pressed', 'true');
            btnFolded.classList.add('active');

            btnFull.style.background = 'transparent';
            btnFull.style.color = '#94a3b8';
            btnFull.style.borderColor = '#334155';
            btnFull.setAttribute('aria-pressed', 'false');
            btnFull.classList.remove('active');

            codeDisplay.innerHTML = foldedCodeHTML;
            tokenCount.textContent = '12';
            tokenCount.style.color = '#10b981';
            tokenSavings.textContent = 'Saved 72 tokens (85% reduction)';
            liveRegion.textContent = 'Currently viewing Folded Code using 12 tokens. Saved 72 tokens.';
        } else {
            btnFull.style.background = '#334155';
            btnFull.style.color = 'white';
            btnFull.style.borderColor = '#475569';
            btnFull.setAttribute('aria-pressed', 'true');
            btnFull.classList.add('active');

            btnFolded.style.background = 'transparent';
            btnFolded.style.color = '#94a3b8';
            btnFolded.style.borderColor = '#334155';
            btnFolded.setAttribute('aria-pressed', 'false');
            btnFolded.classList.remove('active');

            codeDisplay.innerHTML = fullCodeHTML;
            tokenCount.textContent = '84';
            tokenCount.style.color = '#ef4444';
            tokenSavings.textContent = '';
            liveRegion.textContent = 'Currently viewing Full Code using 84 tokens.';
        }
    }

    btnFull.addEventListener('click', () => setFolded(false));
    btnFolded.addEventListener('click', () => setFolded(true));
});
</script>

{% mermaid %}
graph TD
    classDef folded fill:#f97316,stroke:#ea580c,stroke-width:2px,color:#fff;
    classDef default fill:#1e293b,stroke:#334155,color:#fff;

    subgraph "Full AST (Token Heavy)"
        A1[class Talk] --> B1[def video_available?]
        B1 --> C1[if status == 'published']
        C1 --> D1[return video_url]
        C1 --> E1[else]
        E1 --> F1[return nil]
    end

    subgraph "Folded AST (Token Efficient)"
        A2[class Talk] --> B2[def video_available? ... ]:::folded
    end
{% endmermaid %}

### MCP: Inline Experiments and Refactoring

To truly scale LLM-driven coding on huge Ruby projects, token savings aren't enough; we need seamless interaction. That's why I've repurposed `fast`'s core into an **MCP (Model Context Protocol)** server tool. 

By exposing the `.summary`, `.scan`, and direct node-pattern queries to the LLM via MCP, we establish an interactive playground:
1. **Navigating Big Codebases:** Instead of `cat`ing huge files, the agent uses `.scan` across `lib` or `app/models`.
2. **Inline Experiments:** The AI uses `fast` patterns to test assumptions against the live AST.
3. **Refactoring Confirmation:** When the LLM proposes a structural mutation, it uses the MCP loop to confirm structurally what it will change. Because `fast` understands the AST, the agent can dry-run a rewrite and verify the updated output—applying precise, safe updates recursively without context bloat or syntax hallucination.

I see more and more that the bottleneck for AI isn't capability; it's the quality of the context we feed it. By trimming the fat with AST folding and exposing a dependency-free core through MCP, `fast` is turning out to be one of the best sidekicks an AI agent could ask for.

If you are exploring agents and working with Ruby, give it a try and feel free to reach out. I'm having a blast building this foundation.

Happy hacking!
