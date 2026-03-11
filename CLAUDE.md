# ideia.me — Claude Guidelines

## Project Overview

Personal Jekyll blog by Jônatas Davi Paganini. Ruby-based static site with 183+ posts covering programming, career, philosophy, and personal life. Posts are in English and Portuguese.

## Stack

- **Jekyll** with kramdown + Rouge
- **Ruby** 3.3.8 (see `.ruby-version`)
- **Bootstrap** 5.3.2 with dark mode
- **Plugins:** jekyll-feed, jekyll-seo-tag, jekyll-sitemap, jekyll-paginate

## Local Development

```bash
bundle exec jekyll serve        # Serve locally at http://localhost:4000
bundle exec jekyll build        # Build static site
bundle install                  # Install dependencies
```

## Creating Blog Posts

### File Location & Naming

Posts go in `_posts/` with the format: `YYYY-MM-DD-slug.md`

### Frontmatter

```yaml
---
layout: post
title: "Post Title"
categories: ['category1', 'category2']
tags: ['tag1', 'tag2']
description: "Brief description for SEO/social."
image: /images/post-image.jpeg   # optional
mermaid: true                    # optional, enable Mermaid diagrams
---
```

Minimal viable frontmatter:
```yaml
---
layout: post
categories: [category]
title: Post Title
---
```

### Common Categories

`career`, `personal`, `programming`, `ruby`, `postgresql`, `technology`, `philosophy`, `productivity`, `community`

## Custom Plugins

### Callouts (`_plugins/callouts.rb`)

```
{% callout info "Title" %}
Content here
{% endcallout %}
```

Types: `note`, `info`, `tip`, `warning`, `danger`, `success`, `error`

### Mermaid Diagrams

Add `mermaid: true` to frontmatter, then use fenced code blocks:

````
```mermaid
graph TD
  A --> B
```
````

### Embeds

```
{% youtube video_id %}
{% instagram post_id %}
{% facebook url %}
```

## Writing Style

- Personal, reflective voice — first-person storytelling
- Technical depth with practical examples
- Mix of narrative sections and structured headers (##, ###)
- Code blocks with language specified
- Link to other posts on the blog with relative paths like `/post-slug`
- Posts end naturally — no forced "conclusion" sections needed
- Keep it honest and direct; share real impressions
