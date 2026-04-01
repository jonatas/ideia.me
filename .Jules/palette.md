## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-03-31 - [Custom Interactive Animation Accessibility]
**Learning:** Custom interactive elements (like breathing widgets built with SVGs or DIVs) must explicitly receive `tabindex="0"`, `role="button"`, and keyboard event listeners (`Enter`/`Space`) to be accessible. Furthermore, `aria-live` is crucial for announcing state/phase changes within the animation loop to screen readers.
**Action:** Always add keyboard interaction logic and `aria-live` regions when creating custom visual animations that require user input or communicate state visually.
