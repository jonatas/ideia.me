---
name: lottie-animation
description: Use this skill when the user asks to "add a lottie animation", "use an animation", "add an icon animation", "create a talk slide with animation", "animate a section", "build a presentation slide", "add lottie", or wants to embed animated icons or decorative animations in HTML pages for talks or the blog.
version: 1.0.0
---

# Lottie Animation Skill

Helps embed and compose Lottie animations for ideia.me talks, slides, and pages — always matching the site's dark-mode color palette.

## Site Color Palette

Always use these variables (defined in `css/semantic-learn.css` and `css/main.css`):

```css
/* Logo colors */
--logo-golden-yellow: #FBBF24
--logo-vibrant-light-blue: #0EA5E9
--logo-reddish-orange: #EF4444
--logo-deep-purple-blue: #1E3A8A

/* Dark UI base */
--bg-color: #0f1117
--card-bg: #161b27
--text-color: #ccd6f6
--text-muted: #8892b0
--border-color: rgba(255,255,255,0.07)

/* Primary accents */
--primary-blue: #2563eb
--primary-purple: #7c3aed
--primary-teal: #0d9488
--primary-light-blue: #0ea5e9
```

When writing inline styles or new CSS, use `background: #0f1117`, `color: #ccd6f6`, borders `rgba(255,255,255,0.07)`.

## Lottie Player Setup

The `@lottiefiles/lottie-player` script is already loaded in `_layouts/default.html`. For standalone HTML files (talks), add:

```html
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
```

## `<lottie-player>` Syntax

```html
<lottie-player
  src="/images/icons/<category>/<name>.json"
  background="transparent"
  speed="1"
  style="width: 80px; height: 80px;"
  loop
  autoplay>
</lottie-player>
```

Key attributes:
- `loop` — repeat continuously
- `autoplay` — start immediately
- `hover` — play only on mouse hover (good for cards/buttons)
- `speed="0.5"` — slow down; `speed="2"` — speed up
- `count="3"` — play N times then stop (no `loop`)

## Available Animations

All files live in `/images/icons/`. Use these exact paths:

### Brain / Physics
- `/images/icons/brain/physics.json` — abstract physics/brain concept

### Emotions
- `/images/icons/emotions/anger.json`
- `/images/icons/emotions/emotion.json`
- `/images/icons/emotions/emotional-control.json`
- `/images/icons/emotions/emotional-intelligence.json`
- `/images/icons/emotions/emotional-intelligence-2.json`
- `/images/icons/emotions/emotional-intelligence-3.json`
- `/images/icons/emotions/emotional-intelligence-4.json`
- `/images/icons/emotions/fear.json` / `fear-2.json` / `fear-3.json`
- `/images/icons/emotions/flirty.json`
- `/images/icons/emotions/joy.json`
- `/images/icons/emotions/moody.json`
- `/images/icons/emotions/sadness.json`
- `/images/icons/emotions/self-control.json` / `self-control-2.json`
- `/images/icons/emotions/surprise.json`
- `/images/icons/emotions/swear.json`

### General Concepts (great for talks)
- `/images/icons/general/barrier.json`
- `/images/icons/general/confidence.json`
- `/images/icons/general/connection.json`
- `/images/icons/general/folders.json`
- `/images/icons/general/goal.json`
- `/images/icons/general/growth.json`
- `/images/icons/general/idea.json`
- `/images/icons/general/love.json`
- `/images/icons/general/mentoring.json`
- `/images/icons/general/notebook.json`
- `/images/icons/general/options.json`
- `/images/icons/general/puzzle.json`
- `/images/icons/general/share.json`
- `/images/icons/general/support.json`
- `/images/icons/general/truck.json`
- `/images/icons/general/warehouse.json`

### Communication
- `/images/icons/communication/communication.json`
- `/images/icons/communication/empathy.json`
- `/images/icons/communication/listening.json`

### Ocean (layered ecosystem — surface/mid/deep/floor)
- Surface: `seagull.json`, `buoy.json`, `crane.json`
- Mid: `fish.json`, `fish-2.json`, `squid.json`, `cancer.json`, `scorpio.json`, `pisces.json`
- Deep: `anglerfish.json`
- Floor: `coral.json`, `coral-2.json`, `shell.json`, `seaweed.json`, `seaweed-2.json`

## Common Patterns

### Hero animation (centered, large)
```html
<div style="text-align:center; margin-bottom: 24px;">
  <lottie-player src="/images/icons/general/idea.json"
    background="transparent" speed="1"
    style="width: 140px; height: 140px; margin: 0 auto 16px;"
    loop autoplay>
  </lottie-player>
  <h2 style="color: #ccd6f6;">Your Slide Title</h2>
</div>
```

### Card with hover animation
```html
<div style="background: #161b27; border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px; padding: 24px; text-align: center;
            transition: transform 0.2s; cursor: pointer;"
     onmouseenter="this.style.transform='translateY(-4px)'"
     onmouseleave="this.style.transform='translateY(0)'">
  <lottie-player src="/images/icons/general/growth.json"
    background="transparent" speed="1"
    style="width: 80px; height: 80px; margin: 0 auto 12px;"
    loop hover>
  </lottie-player>
  <p style="color: #ccd6f6; margin: 0;">Growth</p>
</div>
```

### Row of small icons
```html
<div style="display: flex; gap: 24px; justify-content: center; flex-wrap: wrap;">
  <lottie-player src="/images/icons/emotions/joy.json"
    background="transparent" speed="1"
    style="width: 60px; height: 60px;" loop hover>
  </lottie-player>
  <lottie-player src="/images/icons/emotions/anger.json"
    background="transparent" speed="1"
    style="width: 60px; height: 60px;" loop hover>
  </lottie-player>
  <lottie-player src="/images/icons/emotions/sadness.json"
    background="transparent" speed="1"
    style="width: 60px; height: 60px;" loop hover>
  </lottie-player>
</div>
```

### Full slide section (talk slide style)
```html
<section style="background: #0f1117; min-height: 100vh; display: flex;
                align-items: center; justify-content: center; padding: 40px;">
  <div style="max-width: 900px; width: 100%; text-align: center;">
    <lottie-player src="/images/icons/brain/physics.json"
      background="transparent" speed="1"
      style="width: 160px; height: 160px; margin: 0 auto 32px;"
      loop autoplay>
    </lottie-player>
    <h1 style="color: #FBBF24; font-size: 3rem; margin-bottom: 16px;">Slide Title</h1>
    <p style="color: #8892b0; font-size: 1.25rem;">Supporting description here.</p>
  </div>
</section>
```

### Two-column with animation
```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
            align-items: center; max-width: 900px; margin: 0 auto;">
  <div>
    <h2 style="color: #0EA5E9;">Topic</h2>
    <p style="color: #8892b0;">Your explanation here.</p>
  </div>
  <div style="text-align: center;">
    <lottie-player src="/images/icons/general/connection.json"
      background="transparent" speed="1"
      style="width: 200px; height: 200px; margin: 0 auto;"
      loop autoplay>
    </lottie-player>
  </div>
</div>
```

## CSS Animations (no JSON needed)

Use these for text, borders, and highlights in talk slides:

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.05); }
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 20px rgba(251,191,36,0.3); }
  50%       { text-shadow: 0 0 40px rgba(251,191,36,0.8); }
}
```

Apply with:
```html
<h1 style="animation: titleGlow 3s infinite; color: #FBBF24;">Title</h1>
<div style="animation: fadeInUp 0.6s ease-out both;">Content</div>
```

## Choosing the Right Animation

| Context | Recommended icon |
|---|---|
| Opening / intro | `idea.json`, `brain/physics.json` |
| Learning / growth | `growth.json`, `notebook.json` |
| Teamwork / community | `connection.json`, `support.json`, `mentoring.json` |
| Emotions / EQ talk | any in `emotions/` |
| Problem / barrier | `barrier.json`, `puzzle.json` |
| Communication | `communication.json`, `empathy.json`, `listening.json` |
| Ocean metaphor | combine surface + mid + floor icons |
| Goal / achievement | `goal.json`, `confidence.json` |

## Size Guidelines

| Use case | Size |
|---|---|
| Hero / slide center | 140–200px |
| Section header | 100–120px |
| Card icon | 60–80px |
| Inline / row | 40–60px |
