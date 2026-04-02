## 2026-03-27 - [Interactive Checklist Accessibility]
**Learning:** Using aria-live='polite' for dynamic content updates helps screen reader users track form progress natively.
**Action:** Apply aria-live regions whenever converting static lists to interactive progress-based widgets.

## 2026-03-29 - [Interactive State Toggles]
**Learning:** For interactive UI elements that toggle state without navigating (like "Full Source" vs "Folded Skeleton"), visual changes alone are insufficient for accessibility. The `aria-pressed` attribute provides the semantic state of the toggle buttons, but it doesn't automatically announce the resulting content change to screen readers.
**Action:** Always combine `aria-pressed` on the buttons with an explicit `aria-live='polite'` region that announces the impact of the state change (e.g., "Folded Skeleton active. View updated to show 130 lines, achieving 83 percent token savings.") to provide full context to assistive technologies.
