---
name: feedback_image_naming
description: Image files must follow the pattern <blog-slug>-<short-description>.ext
type: feedback
---

Always name generated blog images as `<blog-slug>-<short-description>.ext`.

**Why:** Timestamped/generic names like `post-image-option-2-20260313.png` are not meaningful. Slug-based names are readable, searchable, and self-documenting.

**How to apply:** After generating images and the user picks one, rename the file before (or as part of) updating the frontmatter. The slug comes from the post filename (e.g. `2026-03-11-claude-worktrees.md` → slug is `claude-worktrees`). The short description is 1-3 words describing the image concept (e.g. `containment-dome`, `parallel-branches`). Full example: `claude-worktrees-containment-dome.png`.
