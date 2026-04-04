## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.
## 2026-03-29 - [Custom Interactive Widgets Accessibility]
**Learning:** Custom UI elements like DIVs acting as interactive buttons require explicit `keydown` event handlers for 'Enter' and 'Space' keys, along with `tabindex="0"`, `role="button"`, and visible focus states, to ensure full keyboard accessibility. Using inline event handlers in Markdown JS widgets also creates scope and maintainability issues.
**Action:** When building interactive JS widgets directly inside Markdown posts, avoid inline event handlers (e.g., `onclick`). Encapsulate logic in an IIFE and attach event listeners via `addEventListener` within a `DOMContentLoaded` block. Always implement explicit keydown handlers for any custom elements acting as buttons.
