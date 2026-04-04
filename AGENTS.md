# AGENTS.md

## Project Context: ideia.me/yoga
This is a free, open-source, offline-first yoga sequence builder. It is designed specifically for yoga teachers to create and manage classes without the need for an account, internet connection, or data tracking.
This repository contains multiple web applications and interactive learning pages (e.g., Yoga App, Mandala Playground, Semantic Learn, etc.).
**All apps should follow same as the Yoga App.**

## Core Principles
- **Zero Backend**: No signups, no databases (external), and no APIs. All data must live in the user's browser.
- **Performance First**: Minimal dependencies. Prioritize Vanilla JS, CSS Grid/Flexbox, and native Web APIs and no new frameworks.
- **Privacy by Design**: No telemetry or third-party scripts.
- **Terminal Compatibility**: The project should be easily navigable and buildable via standard Linux/Bash tools.

## Technical Stack & Constraints
- **Persistence**: Use localStorage for simple settings and IndexedDB for complex class data/sequences.
- **Connectivity**: Must be a fully functional PWA (Progressive Web App) with a Service Worker that caches all assets (SVGs, scripts, styles) for 100% offline use.
- **Data Portability**: Provide "Import/Export" functionality using JSON files so teachers can backup or share their flows manually.
- **Code Style**:
  - Functional approach over complex OOP.
  - Clean, documented SQL-like logic for data filtering within JS.
  - Mobile-responsive "studio-mode" (high contrast, large touch targets).

## Jules Execution Guidelines
- **Refactoring**: When asked to improve a feature, always check for "dependency creep." If a native browser API can do it, do not suggest an NPM package.
- **Daily Evolution**: Look for ways to recursively optimize the rendering of SVG yoga poses.
- **Offline Verification**: Every new feature must include logic to ensure it functions when `navigator.onLine` is false.
- **Frontend / Visual Verification**: Any frontend UI changes (HTML/CSS/JS) MUST be visually verified by starting a local server, writing a temporary Playwright script (`playwright.sync_api` via python3, as the node module is not installed) to capture a screenshot, and confirming it looks correct before finalizing. Run local server using `cd _site && python3 -m http.server 8000 &> /dev/null &`. When running python server, ensure Playwright scripts navigate to explicit `.html` file paths (e.g., `http://127.0.0.1:8000/post-title.html`). Verify exact paths using `find _site -name '*.html'` beforehand.
- **Exploration & Groundedness**: When generating execution plans, avoid violations by explicitly confirming the existence and exact location of target code using `read_file` (with offsets) or `grep` before proposing modifications to it.
- **Accessibility Directive (a11y)**:
  - Accessibility is mandatory. Interactive UI elements must support keyboard navigation (e.g., `tabindex="0"`, `focus`/`blur` event listeners, custom elements acting as buttons must explicitly implement `keydown` for Enter/Space keys) and provide appropriate context for screen readers (ARIA labels, roles).
  - When converting static lists or forms to interactive progress-based widgets, use `aria-live='polite'` regions to help screen reader users natively track form progress.
  - To guarantee full accessibility in interactive state simulators (like toggle views), always use `aria-pressed` on toggle buttons and accompany visual state changes with corresponding explicit text updates in an `aria-live='polite'` region. Do not rely purely on visual transitions.
- **Journaling Directive**: Log critical UX and accessibility insights in `.Jules/palette.md` using the format:
  ```markdown
  ## YYYY-MM-DD - [Title]
  **Learning:** [Insight]
  **Action:** [Application]
  ```
  Do not log routine development work or simple fixes.

## Other Learnings & Guidelines
- **Security / XSS Prevention**: To prevent Cross-Site Scripting (XSS) vulnerabilities, avoid using `innerHTML` with dynamic or external data (e.g., from `data-*` attributes or JSON fields). Always use `document.createElement()`, `textContent`, and `appendChild()` for safe DOM manipulation.
- **Performance (JavaScript)**: Cache DOM NodeList results (e.g., from `querySelectorAll`) outside of event listeners to avoid redundant and expensive DOM queries.
- **JavaScript Structure**:
  - Source files are located in both `assets/js/` and `js/` directories.
  - JavaScript files in `assets/js/` (e.g., `category-standardizer.js`) use conditional `module.exports` to enable compatibility with Node.js testing while remaining usable in the browser.
  - When building interactive JS widgets directly inside Markdown posts, avoid inline event handlers (e.g., `onclick`). Instead, encapsulate logic in an IIFE and attach event listeners via `addEventListener` within a `DOMContentLoaded` block to prevent scope and reference issues. When embedding inline JS, ensure backticks are not escaped (use standard backticks).

## Testing Guidelines
- **No `package.json`**: The development environment lacks external network access for npm. Testing should rely on built-in Node.js modules or manual mocks rather than new third-party dependencies.
- **JavaScript Tests**: JavaScript tests are stored in the `tests/js/` directory and can be executed with `node --test tests/js/<filename>.test.js`. Testing uses the built-in Node.js `node:test` runner and `node:assert` module.
- **Execution Command**: To verify the syntax of Node.js-compatible scripts (e.g., in `assets/js/`) without execution, use `node -c <filepath>`.

## Content Enhancement Directive ('THE W' Agent)
- Always look for opportunities to add banner images to plain text, use Mermaid diagrams for technical topics, and introduce interactive HTML/JS mini-games/challenges for learning modes (academic content).
- **Restrictions**: Never alter personal experiences, redesign pages, change backend/performance code, use npm/yarn (only pnpm if strictly required and allowed), introduce new UI dependencies, add untrusted foreign JS, or make controversial design changes without mockups. Ensure strict a11y. Ask first before making major multi-page changes or changing core layouts.
- **Mermaid Diagrams**: To successfully render Mermaid diagrams in Jekyll blog posts, the markdown file's YAML frontmatter must include `mermaid: true`.

## Domain-Specific Guidelines
- **Yoga Poses**: Poses in `yoga.html` are configured in a `POSES` JavaScript array. They use CSS custom properties (`vars` and `varsFront`) to control `#stickman` (side view) and `#stickman-front` (front view) SVG elements. They also accept a `details` object for anatomical overlays. Designs should utilize existing `--primary-color` and `--teal-color` tokens.
- **SVG Interactions**: In `yoga.html`, SVG interactive hotspots within `<defs>` require explicit CSS (`fill: transparent !important`, `stroke: transparent !important`, `stroke-width: 0 !important`, `pointer-events: all`) to override parent group stroke styles and remain invisible until hovered.
- **Content Creation**: When adding a new yoga pose to `yoga.html`, always create a corresponding Jekyll markdown blog post in the `_posts/` directory that discusses the pose's ancient usage and suggests a sequence, maintaining a progression from beginner to advanced poses.
- **Semantic Learning**: Interactive learning features are distributed across `js/semantic-learn.js` (navigation, vocabulary transformation maps, word insights) and `js/semantic-games.js` (chapter-specific mini-games like Word Web Builder and Emotion Need Matcher).

## Environment & Build Guidelines
- **CLAUDE.md**: The repository contains a `CLAUDE.md` file providing project overview, stack details, and local development instructions (e.g., `bundle exec jekyll serve`).
- **Jekyll Setup**: The project is a Jekyll-based personal blog using Ruby 3.3.8 (specified in `.ruby-version`). Stack includes kramdown, Rouge, Bootstrap 5.3.2 (with dark mode), and specific Jekyll plugins (jekyll-feed, jekyll-seo-tag, jekyll-sitemap, jekyll-paginate).
- **Dependencies**: To correctly setup dependencies and build the Jekyll site without version conflicts, use the command sequence: `bundle config set --local path vendor/bundle && bundle install && bundle exec jekyll build`. When installing Ruby gems locally or node packages via pnpm, ensure that `.bundle/`, `vendor/`, and `node_modules/` directories are added to `.gitignore` to prevent tracking massive dependency diffs.
- **Debug Features**: Note that specific apps might have debug flags (e.g., `js/mandala-playground.js` supports `debug=ios` URL query parameter to force/simulate iOS-specific audio initialization logic on desktop browsers).