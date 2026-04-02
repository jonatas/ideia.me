## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-03-29 - [State Simulator Accessibility]
**Learning:** Screen readers miss visual-only state changes (like code blocks collapsing). Interactive visual tools require explicit hidden text updates and aria-live regions.
**Action:** Always map complex visual widget states (like data visualizers or code folders) to explicit descriptive text changes in an aria-live region.