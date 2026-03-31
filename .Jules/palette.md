## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.
## 2026-03-31 - Dynamic State Announcements in Interactive Simulators
**Learning:** When building interactive state simulators (like an AST folding range slider), visual updates to DOM text aren't automatically announced to screen readers. Relying purely on DOM text changes creates an inaccessible experience for visually impaired users who cannot see the visual density change.
**Action:** Always include an `aria-live="polite"` sr-only region that gets updated via JavaScript alongside visual changes to explicitly announce structural or data changes to assistive technologies.
