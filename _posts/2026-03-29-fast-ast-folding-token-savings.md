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

{% mermaid %}
flowchart LR
    A[Full File<br>~23k chars] -->|Noise & Details| B[LLM Context Limit]
    A -->|Fast AST Folding| C[AST Folded<br>~4.3k chars]
    C -->|Core Architecture| D[Efficient Context]

    style A fill:#1e293b,stroke:#cbd5e1,color:#f8fafc
    style B fill:#7f1d1d,stroke:#fca5a5,color:#f8fafc
    style C fill:#0f766e,stroke:#5eead4,color:#f8fafc
    style D fill:#15803d,stroke:#86efac,color:#f8fafc
{% endmermaid %}

<div class="interactive-widget" style="background: rgba(0, 0, 0, 0.2); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
    <h4 style="margin: 0;">Context Simulator</h4>
    <button id="toggle-folding" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Toggle Folded View</button>
  </div>
  <div aria-live="polite" id="token-status" style="font-weight: bold; margin-bottom: 10px; color: #5eead4;">Currently viewing: Folded Context (~4.3k chars, 80% saved)</div>
  <div id="code-container" style="background: #1e293b; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 0.9em; overflow-x: auto; max-height: 300px; overflow-y: auto;">
<pre id="code-content" style="margin: 0; color: #e2e8f0;">class Talk < ApplicationRecord

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
end</pre>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-folding');
    const statusText = document.getElementById('token-status');
    const codeContent = document.getElementById('code-content');

    let isFolded = true;

    const foldedCode = `class Talk < ApplicationRecord\n\n  WATCHABLE_PROVIDERS = [...]\n  KIND_LABELS = {...}\n\n  include Rollupable\n  # ... (6 includes)\n\n  belongs_to :event, optional: true, counter_cache: :talks_count, touch: true\n  has_many :child_talks, class_name: "Talk", foreign_key: :parent_talk_id, dependent: :destroy\n  # ... (30+ associations cleanly grouped)\n\n  Scopes:\n    without_raw_transcript\n    with_raw_transcript\n    for_topic(topic_slug)\n    # ...\n\n  Hooks: before_validation :set_kind, if: -> { !kind_changed? }\n\n  Validations:\n    :title, presence: true\n    :date, presence: true\n\n  Macros:\n    configure_slug(attribute: :title, auto_suffix_on_collision: true)\n    # ...\n\n  def published?\n  def video_available?\n  def thumbnail_url(size:, request:)\n  # ... (40+ method signatures without their bodies)\nend`;

    const fullCode = `class Talk < ApplicationRecord\n\n  WATCHABLE_PROVIDERS = [\n    'youtube',\n    'vimeo',\n    'twitch'\n  ]\n  KIND_LABELS = {\n    regular: 'Regular Talk',\n    lightning: 'Lightning Talk',\n    keynote: 'Keynote'\n  }\n\n  include Rollupable\n  include Sluggable\n  include Viewable\n  include Searchable\n  include Shareable\n  include Trackable\n\n  belongs_to :event, optional: true, counter_cache: :talks_count, touch: true\n  has_many :child_talks, class_name: "Talk", foreign_key: :parent_talk_id, dependent: :destroy\n  belongs_to :speaker, class_name: "User"\n  has_many :comments, dependent: :destroy\n  has_many :likes, as: :likeable\n  has_many :bookmarks, as: :bookmarkable\n  # ... (Many more lines of detailed setup)\n\n  scope :without_raw_transcript, -> { where(raw_transcript: nil) }\n  scope :with_raw_transcript, -> { where.not(raw_transcript: nil) }\n  scope :for_topic, ->(topic_slug) { joins(:topics).where(topics: { slug: topic_slug }) }\n  \n  before_validation :set_kind, if: -> { !kind_changed? }\n  \n  validates :title, presence: true, length: { maximum: 255 }\n  validates :date, presence: true\n  validates :description, presence: true\n\n  configure_slug(attribute: :title, auto_suffix_on_collision: true)\n\n  def published?\n    status == 'published' && published_at <= Time.current\n  end\n\n  def video_available?\n    video_url.present? && video_provider.in?(WATCHABLE_PROVIDERS)\n  end\n\n  def thumbnail_url(size: :medium, request: nil)\n    if custom_thumbnail.attached?\n      Rails.application.routes.url_helpers.rails_representation_url(custom_thumbnail.variant(resize_to_limit: [800, 600]), host: request&.host)\n    else\n      default_thumbnail_url\n    end\n  end\n\n  # ... (700 more lines of implementations)\nend`;

    toggleBtn.addEventListener('click', () => {
        isFolded = !isFolded;
        if (isFolded) {
            codeContent.textContent = foldedCode;
            statusText.textContent = "Currently viewing: Folded Context (~4.3k chars, 80% saved)";
            statusText.style.color = "#5eead4";
            toggleBtn.textContent = "Show Full Context";
            toggleBtn.style.background = "#0d9488";
        } else {
            codeContent.textContent = fullCode;
            statusText.textContent = "Currently viewing: Full Context (~23k chars, high token cost)";
            statusText.style.color = "#fca5a5";
            toggleBtn.textContent = "Show Folded Context";
            toggleBtn.style.background = "#b91c1c";
        }
    });
});
</script>

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

### MCP: Inline Experiments and Refactoring

To truly scale LLM-driven coding on huge Ruby projects, token savings aren't enough; we need seamless interaction. That's why I've repurposed `fast`'s core into an **MCP (Model Context Protocol)** server tool. 

By exposing the `.summary`, `.scan`, and direct node-pattern queries to the LLM via MCP, we establish an interactive playground:
1. **Navigating Big Codebases:** Instead of `cat`ing huge files, the agent uses `.scan` across `lib` or `app/models`.
2. **Inline Experiments:** The AI uses `fast` patterns to test assumptions against the live AST.
3. **Refactoring Confirmation:** When the LLM proposes a structural mutation, it uses the MCP loop to confirm structurally what it will change. Because `fast` understands the AST, the agent can dry-run a rewrite and verify the updated output—applying precise, safe updates recursively without context bloat or syntax hallucination.

I see more and more that the bottleneck for AI isn't capability; it's the quality of the context we feed it. By trimming the fat with AST folding and exposing a dependency-free core through MCP, `fast` is turning out to be one of the best sidekicks an AI agent could ask for.

If you are exploring agents and working with Ruby, give it a try and feel free to reach out. I'm having a blast building this foundation.

Happy hacking!
