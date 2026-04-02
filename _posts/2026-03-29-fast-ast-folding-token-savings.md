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

<div class="ast-simulator-widget" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; background: var(--bg-secondary, #f8fafc);">
  <h3 style="margin-top: 0; font-size: 1.25rem;">Interactive AST Folding Simulator</h3>
  <p style="margin-bottom: 1rem; font-size: 0.95rem;">Toggle the folding level to see the difference in tokens sent to the LLM context.</p>

  <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
    <button id="btn-fold-full" style="flex: 1; padding: 0.75rem; border: 2px solid var(--text-color, #333); background: transparent; border-radius: 6px; font-weight: bold; cursor: pointer;">Full File</button>
    <button id="btn-fold-folded" style="flex: 1; padding: 0.75rem; border: 2px solid #0d9488; background: #0d9488; color: white; border-radius: 6px; font-weight: bold; cursor: pointer;">Folded Skeleton</button>
  </div>

  <div id="fold-stats" aria-live="polite" style="display: flex; justify-content: space-between; font-family: monospace; font-size: 0.9rem; margin-bottom: 1rem; background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px;">
    <span>Lines: <strong id="fold-lines">130</strong> / 723</span>
    <span>Chars: <strong id="fold-chars">~4,300</strong> / ~23,000</span>
    <span>Token Savings: <strong id="fold-savings" style="color: #059669;">81%</strong></span>
  </div>

  <pre id="fold-code" style="max-height: 300px; overflow-y: auto; margin: 0; font-size: 0.85rem; border-radius: 6px;"><code>class Talk < ApplicationRecord
  WATCHABLE_PROVIDERS = [...]
  KIND_LABELS = {...}

  belongs_to :event
  has_many :child_talks
  # ... (30+ associations)

  def published?
  def video_available?
  def thumbnail_url(size:, request:)
  # ... (40+ methods without bodies)
end</code></pre>
</div>

<script>
document.addEventListener("DOMContentLoaded", function() {
  const btnFull = document.getElementById("btn-fold-full");
  const btnFolded = document.getElementById("btn-fold-folded");
  const linesEl = document.getElementById("fold-lines");
  const charsEl = document.getElementById("fold-chars");
  const savingsEl = document.getElementById("fold-savings");
  const codeEl = document.getElementById("fold-code").querySelector("code");
  const foldStats = document.getElementById("fold-stats");

  const fullCode = `class Talk < ApplicationRecord
  WATCHABLE_PROVIDERS = ['youtube', 'vimeo']
  KIND_LABELS = { lightning: 'Lightning', standard: 'Standard' }

  belongs_to :event
  has_many :child_talks, class_name: "Talk", foreign_key: :parent_talk_id, dependent: :destroy

  def published?
    status == 'published' && date <= Time.current
  end

  def video_available?
    video_url.present? && !raw_transcript.nil?
  end

  def thumbnail_url(size:, request:)
    # complex logic generating urls...
    "https://example.com/thumb/#{id}"
  end
  # ... (hundreds of lines of implementation)
end`;

  const foldedCode = `class Talk < ApplicationRecord
  WATCHABLE_PROVIDERS = [...]
  KIND_LABELS = {...}

  belongs_to :event
  has_many :child_talks
  # ... (30+ associations)

  def published?
  def video_available?
  def thumbnail_url(size:, request:)
  # ... (40+ methods without bodies)
end`;

  function setFolded(isFolded) {
    if (isFolded) {
      btnFolded.style.background = "#0d9488";
      btnFolded.style.color = "white";
      btnFull.style.background = "transparent";
      btnFull.style.color = "var(--text-color, #333)";
      linesEl.textContent = "130";
      charsEl.textContent = "~4,300";
      savingsEl.textContent = "81%";
      savingsEl.style.color = "#059669";
      codeEl.textContent = foldedCode;

      const srText = "Code folded to 130 lines, saving 81% tokens.";
      const srSpan = document.createElement('span');
      srSpan.style.position = 'absolute';
      srSpan.style.width = '1px';
      srSpan.style.height = '1px';
      srSpan.style.padding = '0';
      srSpan.style.margin = '-1px';
      srSpan.style.overflow = 'hidden';
      srSpan.style.clip = 'rect(0, 0, 0, 0)';
      srSpan.style.whiteSpace = 'nowrap';
      srSpan.style.borderWidth = '0';
      srSpan.textContent = srText;
      foldStats.appendChild(srSpan);
      setTimeout(() => srSpan.remove(), 2000);
    } else {
      btnFull.style.background = "var(--text-color, #333)";
      btnFull.style.color = "var(--bg-color, white)";
      btnFolded.style.background = "transparent";
      btnFolded.style.color = "#0d9488";
      linesEl.textContent = "723";
      charsEl.textContent = "~23,000";
      savingsEl.textContent = "0%";
      savingsEl.style.color = "#dc2626";
      codeEl.textContent = fullCode;

      const srText = "Code expanded to 723 lines. 0% token savings.";
      const srSpan = document.createElement('span');
      srSpan.style.position = 'absolute';
      srSpan.style.width = '1px';
      srSpan.style.height = '1px';
      srSpan.style.padding = '0';
      srSpan.style.margin = '-1px';
      srSpan.style.overflow = 'hidden';
      srSpan.style.clip = 'rect(0, 0, 0, 0)';
      srSpan.style.whiteSpace = 'nowrap';
      srSpan.style.borderWidth = '0';
      srSpan.textContent = srText;
      foldStats.appendChild(srSpan);
      setTimeout(() => srSpan.remove(), 2000);
    }
  }

  btnFull.addEventListener("click", () => setFolded(false));
  btnFolded.addEventListener("click", () => setFolded(true));
});
</script>

### MCP: Inline Experiments and Refactoring

To truly scale LLM-driven coding on huge Ruby projects, token savings aren't enough; we need seamless interaction. That's why I've repurposed `fast`'s core into an **MCP (Model Context Protocol)** server tool. 

By exposing the `.summary`, `.scan`, and direct node-pattern queries to the LLM via MCP, we establish an interactive playground:
1. **Navigating Big Codebases:** Instead of `cat`ing huge files, the agent uses `.scan` across `lib` or `app/models`.
2. **Inline Experiments:** The AI uses `fast` patterns to test assumptions against the live AST.
3. **Refactoring Confirmation:** When the LLM proposes a structural mutation, it uses the MCP loop to confirm structurally what it will change. Because `fast` understands the AST, the agent can dry-run a rewrite and verify the updated output—applying precise, safe updates recursively without context bloat or syntax hallucination.

{% mermaid %}
sequenceDiagram
    participant LLM as AI Agent
    participant MCP as Fast MCP Server
    participant Prism as Prism Parser
    participant Code as Ruby Codebase

    LLM->>MCP: Request class summary (fast .summary app/models/talk.rb)
    MCP->>Code: Read full file contents
    Code-->>MCP: Raw Ruby source (23,000 chars)
    MCP->>Prism: Parse to Abstract Syntax Tree
    Prism-->>MCP: Full AST structure
    MCP->>MCP: Fold AST (strip comments, method bodies)
    MCP-->>LLM: Folded skeleton (4,300 chars)
    LLM->>MCP: Query specific method (fast .scan 'def video_available?')
    MCP->>Prism: Match node pattern
    Prism-->>MCP: Extracted method node
    MCP-->>LLM: Detailed method implementation
{% endmermaid %}

I see more and more that the bottleneck for AI isn't capability; it's the quality of the context we feed it. By trimming the fat with AST folding and exposing a dependency-free core through MCP, `fast` is turning out to be one of the best sidekicks an AI agent could ask for.

If you are exploring agents and working with Ruby, give it a try and feel free to reach out. I'm having a blast building this foundation.

Happy hacking!
