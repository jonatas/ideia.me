---
name: feedback_no_sleep
description: Never use sleep in scripts or polling loops
type: feedback
---

Never use sleep in scripts. Avoid polling loops that sleep between retries.

**Why:** User explicitly does not want sleep delays in any scripts.

**How to apply:** If an API requires polling, use webhooks or synchronous wait options instead. If a library or API supports a `wait`/`prefer: wait` option (like Replicate's `Prefer: wait` header), use that. Never add `sleep N` as a workaround.
