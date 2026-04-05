## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-03-29 - [Dynamic Math Communication via Slider & ARIA]
**Learning:** When creating visual interactive calculators (like range sliders updating numbers), screen readers may only announce the slider value change but miss the *meaning* or *result* of the calculation. Coupling sliders with a dedicated `aria-live='polite'` output region successfully communicates dynamic conceptual estimations to assistive technologies.
**Action:** Always combine interactive input sliders with an `aria-live` region to communicate the resulting output changes non-visually.
