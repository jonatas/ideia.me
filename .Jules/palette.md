## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-03-29 - [Dynamic UI State Announcements]
**Learning:** Visual-only state changes (like code expanding/collapsing in a widget) exclude screen reader users from understanding the interaction outcome.
**Action:** Use temporarily injected visually-hidden `span` elements with explicit text inside an `aria-live` region to announce dynamic state changes that lack native semantic updates.
