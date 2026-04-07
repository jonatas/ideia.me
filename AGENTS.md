# AGENTS.md

## Project Context: ideia.me/yoga
This is a free, open-source, offline-first yoga sequence builder. It is designed specifically for yoga teachers to create and manage classes without the need for an account, internet connection, or data tracking.

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
- **Offline Verification**: Every new feature must include logic to ensure it functions when navigator.onLine is false.

## Other Learnings & App Guidelines
### Security / XSS Prevention
To prevent Cross-Site Scripting (XSS) vulnerabilities, avoid using `innerHTML` with dynamic or external data (e.g., from `data-*` attributes or JSON fields). Always use `document.createElement()`, `textContent`, and `appendChild()` for safe DOM manipulation. Pull requests for security vulnerabilities should follow the title format `🔒 [security fix description]` and include a description detailing 'What' (vulnerability), 'Risk' (potential impact), and 'Solution' (how it's fixed).

### Performance (JavaScript)
Cache DOM NodeList results (e.g., from `querySelectorAll`) outside of event listeners to avoid redundant and expensive DOM queries.

### JavaScript Structure & Testing
- Source files are located in both `assets/js/` and `js/` directories.
- JavaScript files in `assets/js/` (e.g., `category-standardizer.js`) use conditional `module.exports` to enable compatibility with Node.js testing while remaining usable in the browser.
- When building interactive JS widgets directly inside Markdown posts, avoid inline event handlers (e.g., `onclick`). Instead, encapsulate logic in an IIFE and attach event listeners via `addEventListener` within a `DOMContentLoaded` block to prevent scope and reference issues. Ensure backticks are not escaped (e.g., avoid `\``) to prevent browser syntax errors; use standard backticks (`` ` ``).
- `assets/js/link-validator.js`: The `fixLinks` function requires the `fixes` array to be sorted by `link.index` in reverse order before iteration to prevent string replacement offset issues; this logic is verified in `tests/js/link-validator.test.js`.
- **No `package.json`**: The development environment lacks external network access for npm and rubygems.org. Testing should rely on built-in Node.js modules or manual mocks rather than new third-party dependencies.
- **JavaScript Tests**: JavaScript tests are stored in the `tests/js/` directory and can be executed with `node --test tests/js/<filename>.test.js`. Testing uses the built-in Node.js `node:test` runner and `node:assert` module. Verify the existence of the `tests/js/` directory before planning test-dependent workflows.
- **Execution Command**: To verify the syntax of Node.js-compatible scripts (e.g., in `assets/js/`) without execution, use `node -c <filepath>`.

### Additional Jules Guidelines
- **Exploration & Groundedness**: Avoid 'Exploration Rule' and 'Groundedness Rule' violations by explicitly confirming the existence and exact location of target code using `read_file` (with offsets) or `grep` before proposing modifications to it.
- **Pre-commit Plan Step**: The pre-commit plan step must use the exact wording: 'Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.'
- **Frontend / Visual Verification**: Any frontend UI changes (HTML/CSS/JS) MUST be visually verified by starting a local server, writing a temporary Playwright script to capture a screenshot, and confirming it looks correct before finalizing.
  - The local environment does not have the Playwright Node module installed. Use Python's `playwright.sync_api` (via `python3`).
  - Run a local Python HTTP server in the built `_site` directory using the command: `cd _site && python3 -m http.server 8000 &> /dev/null &`.
  - Ensure Playwright scripts navigate to explicit `.html` file paths (e.g., `http://127.0.0.1:8000/post-title.html`). Verify the exact generated path using `find _site -name '*.html'` beforehand.
  - Before finalizing commits or requesting code review, strictly ensure all temporary frontend verification artifacts (such as Python Playwright scripts and generated screenshot images) are deleted and removed from the git index.
- **Accessibility Directive (a11y)**:
  - Accessibility is mandatory. Interactive UI elements must support keyboard navigation (e.g., `tabindex="0"`, `focus`/`blur` event listeners) and provide appropriate context for screen readers (ARIA labels, roles).
  - Custom interactive elements (like SVGs or DIVs) acting as buttons must explicitly implement `keydown` event listeners for the 'Enter' and 'Space' keys.
  - When converting static lists or forms to interactive progress-based widgets, use `aria-live='polite'` regions to help screen reader users natively track form progress.
  - To guarantee full accessibility in interactive state simulators (like toggle views), always use `aria-pressed` on toggle buttons and accompany visual state changes with explicit text updates in an `aria-live='polite'` region to communicate context changes to screen readers.
- **Journaling Directive**: Log critical UX and accessibility insights in `.Jules/palette.md` using the format:
  ```markdown
  ## YYYY-MM-DD - [Title]
  **Learning:** [Insight]
  **Action:** [Application]
  ```
  Do not log routine development work or simple fixes.

### Content Enhancement Directive ('THE W' Agent)
- Strictly limit modifications to blog posts published within the 'last few days'. Editing older posts is out of scope and violates user directives.
- Always look for opportunities to add banner images to plain text, use Mermaid diagrams for technical topics, and introduce interactive HTML/JS mini-games/challenges for learning modes (academic content).
- **Restrictions**: Always ensure strict a11y. Ask first before making major multi-page changes, adding content on the user's behalf, or changing core layouts. NEVER alter personal experiences, redesign pages, change backend/performance code, use npm/yarn (only pnpm if strictly required and allowed), introduce new UI dependencies, or add untrusted foreign JS.
- **Mermaid Diagrams**: To successfully render Mermaid diagrams in Jekyll blog posts, the markdown file's YAML frontmatter must include `mermaid: true`.
- **Image References**: When adding image references to Jekyll post frontmatter, use relative paths without a leading slash (e.g., `image: images/filename.png` instead of `image: /images/filename.png`) to prevent broken image links on the live site.

### Specific App Contexts
- **Yoga App Specifics (`yoga.html`)**:
  - Poses are configured in a `POSES` JavaScript array.
  - They use CSS custom properties to control `#stickman` (side view) and `#stickman-front` (front view) SVG elements via `vars` and `varsFront`. They also accept a `details` object for anatomical overlays.
  - Designs should utilize existing `--primary-color` and `--teal-color` tokens.
  - SVG interactive hotspots within `<defs>` require explicit CSS (`fill: transparent !important`, `stroke: transparent !important`, `stroke-width: 0 !important`, `pointer-events: all`) to override parent group stroke styles and remain invisible until hovered.
  - Content Creation: When adding a new yoga pose to `yoga.html`, always create a corresponding Jekyll markdown blog post in the `_posts/` directory that discusses the pose's ancient usage and suggests a sequence, maintaining a progression from beginner to advanced poses.
- **Semantic Learning (`js/semantic-learn.js` & `js/semantic-games.js`)**:
  - Interactive learning features are distributed across `js/semantic-learn.js` (navigation, vocabulary transformation maps, word insights) and `js/semantic-games.js` (chapter-specific mini-games like Word Web Builder and Emotion Need Matcher).
- **Mandala Playground (`js/mandala-playground.js`)**:
  - Supports a `debug=ios` URL query parameter to force/simulate iOS-specific audio initialization logic on desktop browsers.

### Environment & Build Guidelines
- **CLAUDE.md**: The repository contains a `CLAUDE.md` file providing project overview, stack details, and local development instructions (e.g., `bundle exec jekyll serve`).
- **Jekyll Setup**: The project is a Jekyll-based personal blog using Ruby 3.3.8 (specified in `.ruby-version`). Stack includes kramdown, Rouge, Bootstrap 5.3.2 (with dark mode), and specific Jekyll plugins (jekyll-feed, jekyll-seo-tag, jekyll-sitemap, jekyll-paginate).
- **Dependencies**: To correctly setup dependencies and build the Jekyll site without version conflicts, use the command sequence: `bundle config set --local path vendor/bundle && bundle install && bundle exec jekyll build`.
- **Git Ignore**: When installing Ruby gems locally (e.g., via `bundle config set --local path`) or node packages via pnpm, ensure that `.bundle/`, `vendor/`, and `node_modules/` directories are added to `.gitignore` to prevent tracking massive dependency diffs.