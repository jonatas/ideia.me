## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-03-29 - [State Simulator Accessibility]
**Learning:** Visual state changes (like expanding or collapsing code snippets) must be accompanied by explicit text changes inside `aria-live` regions to ensure screen readers track state accurately.
**Action:** When building interactive state simulators, explicitly announce state changes and their effects via `aria-live` rather than relying on visual transitions.
