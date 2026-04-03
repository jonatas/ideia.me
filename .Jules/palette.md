## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-03-29 - [Toggle State Accessibility]
**Learning:** Toggle buttons and interactive state simulators lack native screen reader context for visual state changes unless specifically announced.
**Action:** Always use `aria-pressed` on toggle buttons and accompany visual state changes with explicit text updates in an `aria-live='polite'` region.
