## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-03-29 - [Interactive State Changes]
**Learning:** Relying purely on color transitions (e.g., turning a progress bar green) to communicate state changes leaves visually impaired users without feedback.
**Action:** Always ensure that interactive state simulators accompany visual color updates with corresponding text changes (and `aria-live` announcements) to guarantee full accessibility.
