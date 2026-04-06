## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-04-06 - [Range Slider Context for Screen Readers]
**Learning:** When using input[type="range"] (like for code folding simulators), binding an `aria-live` element to the slider allows the screen reader to natively narrate state and metric changes dynamically without losing focus on the slider itself.
**Action:** Always pair interactive range sliders that change visual metrics with `aria-live='polite'` regions that textually announce those changing metrics to assistive technologies.