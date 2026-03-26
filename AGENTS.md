# AGENTS.md

## Project Context
This repository contains a Jekyll-based personal blog and several offline-first web applications (e.g., `ideia.me/yoga`). **All apps in this repository should follow the same core principles and technical constraints as the Yoga App.**

## Core Principles
- **Zero Backend**: No signups, no external databases, and no APIs. All data must live in the user's browser.
- **Performance First**: Minimal dependencies. Prioritize Vanilla JS, CSS Grid/Flexbox, and native Web APIs. Do not introduce new frameworks.
- **Privacy by Design**: No telemetry or third-party scripts.
- **Terminal Compatibility**: The project should be easily navigable and buildable via standard Linux/Bash tools.

## Technical Stack & Constraints
- **Persistence**: Use `LocalProfile` (via `js/profile.js` which wraps `localStorage`) for user engagement, simple settings, and favorites. Use `IndexedDB` for complex app data (e.g., classes, sequences).
- **Connectivity (Offline-First)**: Applications must be fully functional PWAs (Progressive Web Apps) with a Service Worker that caches all assets (SVGs, scripts, styles) for 100% offline use.
- **Data Portability**: Provide "Import/Export" functionality using JSON files so users can back up or share their data manually.
- **Code Style**:
  - Favor a functional approach over complex OOP.
  - Use clean, documented, SQL-like logic for data filtering within JavaScript.
  - Prioritize mobile-responsive "studio-mode" interfaces (high contrast, large touch targets).
- **Security / XSS Prevention**: To prevent Cross-Site Scripting (XSS) vulnerabilities, avoid using `innerHTML` with dynamic or external data (e.g., from `data-*` attributes or JSON fields). Always use `document.createElement()`, `textContent`, and `appendChild()` for safe DOM manipulation.
- **Performance (JavaScript)**: Cache DOM NodeList results (e.g., from `querySelectorAll`) outside of event listeners to avoid redundant and expensive DOM queries.
- **JavaScript Structure**:
  - Source files are located in both `assets/js/` and `js/` directories.
  - JavaScript files in `assets/js/` (e.g., `category-standardizer.js`) use conditional `module.exports` to enable compatibility with Node.js testing while remaining usable in the browser.

## Testing Guidelines
- **No `package.json`**: The development environment lacks external network access for npm. Testing should rely on built-in Node.js modules or manual mocks rather than new third-party dependencies.
- **Temporary Tests**: There is no dedicated testing folder. Any tests written are temporary to prove functionality and should be removed before pushing.
- **Demo Pages**: It is preferred to design a demo page that visually shows how a feature works rather than writing a unit test, unless the logic is highly complex and requires detailed specifications.

## Jules Execution Guidelines
- **Refactoring & Dependency Creep**: When asked to improve a feature, always check for "dependency creep." If a native browser API can do it, do not suggest or use an NPM package.
- **Offline Verification**: Every new feature must include logic to ensure it functions when `navigator.onLine` is false.
- **Frontend / Visual Verification**: Any frontend UI changes (HTML/CSS/JS) MUST be visually verified by starting a local server, writing a temporary Playwright script (`playwright.sync_api`) to capture a screenshot, and confirming it looks correct before finalizing.
- **Accessibility Directive (a11y)**: Accessibility is mandatory. Interactive UI elements must support keyboard navigation (e.g., `tabindex="0"`, `focus`/`blur` event listeners) and provide appropriate context for screen readers (ARIA labels, roles).
- **Daily Evolution**: Look for ways to recursively optimize rendering (e.g., rendering of SVG yoga poses).
- **Journaling Directive**: Log critical UX and accessibility insights in `.Jules/palette.md` using the format:
  ```markdown
  ## YYYY-MM-DD - [Title]
  **Learning:** [Insight]
  **Action:** [Application]
  ```
  Do not log routine development work or simple fixes.

## Content Enhancement Directive ('THE W' Agent)
- Always look for opportunities to add banner images to plain text, use Mermaid diagrams for technical topics, and introduce interactive HTML/JS mini-games/challenges for learning modes.
- **Never** alter personal experiences, change core layouts, use npm/yarn (only pnpm if strictly required and allowed), or introduce new UI dependencies or foreign JS.
- **Mermaid Diagrams**: To successfully render Mermaid diagrams in Jekyll blog posts, the markdown file's YAML frontmatter must include `mermaid: true`.

## Domain-Specific Guidelines (Yoga App & Similar)
- **Yoga Poses**: Poses in `yoga.html` are configured in a `POSES` JavaScript array. They use CSS custom properties (`vars` and `varsFront`) to control `#stickman` (side view) and `#stickman-front` (front view) SVG elements. Designs should utilize existing `--primary-color` and `--teal-color` tokens.
- **SVG Interactions**: In `yoga.html`, SVG interactive hotspots within `<defs>` require explicit CSS (`fill: transparent !important`, `stroke: transparent !important`, `stroke-width: 0 !important`, `pointer-events: all`) to override parent group stroke styles and remain invisible until hovered.
- **Content Creation**: When adding a new yoga pose to `yoga.html`, always create a corresponding Jekyll markdown blog post in the `_posts/` directory that discusses the pose's ancient usage and suggests a sequence, maintaining a progression from beginner to advanced poses.

## Environment & Build Guidelines
- **Jekyll Setup**: The project is a Jekyll-based personal blog using Ruby 3.3.8 (specified in `.ruby-version`).
- **Dependencies**: When installing Ruby gems locally (e.g., via `bundle config set --local path`), ensure that `.bundle/` and `vendor/` directories are added to `.gitignore` to prevent tracking massive dependency diffs.
- **Debug Features**: Note that specific apps might have debug flags (e.g., `js/mandala-playground.js` supports `debug=ios` URL query parameter to simulate iOS audio logic).
