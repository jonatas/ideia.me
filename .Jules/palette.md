## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-03-30 - [Visual State Change Accessibility]
**Learning:** Visual state changes alone (like collapsing/expanding code snippets or changing colors) are inaccessible. Screen readers need explicit textual context.
**Action:** Accompany visual state changes with corresponding `aria-live` announcements or explicit text updates to communicate the current state to screen reader users.
