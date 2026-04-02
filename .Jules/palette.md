## 2026-03-28 - [Interactive State Simulator Accessibility]
**Learning:** For interactive simulators (like range sliders or action buttons changing visual states), relying solely on visual updates excludes screen reader users. Simply announcing the raw input value is often insufficient to convey the meaning of the change.
**Action:** Always ensure custom interactive widgets explicitly update an `aria-live` region with the *contextual impact* of the action (e.g., "Level 2 selected. Fully expanded code, 0% tokens saved." instead of just "2"), so screen readers are fully informed of the resulting state.

## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.
