/* =============================================================================
   talk.js — Slide parsing, zoom engine, and navigation for layout: talk posts
   ============================================================================= */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var slides = [];
  var currentSlide = 0;
  var zoomLevel = 0;
  var isPresenting = false;

  var ZOOM_MAX = 5;

  // Human-readable label for what each level controls (levels 1-4)
  // Level 0 = full content, level 5 = headers only (fixed labels)
  var ZOOM_CONTENT = [
    null,                  // 0 — full content
    'long paragraphs',     // 1
    'paragraphs',          // 2
    'lists',               // 3
    'images & diagrams',   // 4
    null,                  // 5 — headers only
  ];

  function dotTitle(level) {
    if (level === 0) return 'Show everything';
    if (level === ZOOM_MAX) return 'Headers only';
    return zoomLevel >= level
      ? 'Show ' + ZOOM_CONTENT[level]
      : 'Hide ' + ZOOM_CONTENT[level];
  }

  // ---------------------------------------------------------------------------
  // DOM References (set after DOMContentLoaded)
  // ---------------------------------------------------------------------------
  var content, btnPresent, btnExit, btnPrev, btnNext, btnFullscreen;
  var slideCounter, zoomDots, btnZoomLess, btnZoomMore;

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    content       = document.getElementById('talk-content');
    btnPresent    = document.getElementById('btn-present');
    btnExit       = document.getElementById('btn-exit-present');
    btnPrev       = document.getElementById('btn-prev');
    btnNext       = document.getElementById('btn-next');
    btnFullscreen = document.getElementById('btn-fullscreen');
    slideCounter  = document.getElementById('talk-slide-counter');
    zoomDots      = document.getElementById('talk-zoom-dots');
    btnZoomLess   = document.getElementById('btn-zoom-less');
    btnZoomMore   = document.getElementById('btn-zoom-more');

    if (!content) return; // safety: only run on talk layout pages

    buildSlides();
    buildZoomDots();
    bindEvents();
    updateUI();
  });

  // ---------------------------------------------------------------------------
  // Slide Building — parse rendered HTML into logical chapters
  // ---------------------------------------------------------------------------
  function buildSlides() {
    // Collect all element children of #talk-content
    var children = Array.from(content.childNodes).filter(function (n) {
      return n.nodeType === Node.ELEMENT_NODE;
    });

    if (children.length === 0) return;

    var chapters = [];
    var currentChapter = null;

    var isBreaker = function (el) {
      return el.tagName === 'H1' || el.tagName === 'H2';
    };

    var hasHeadings = children.some(isBreaker);

    if (!hasHeadings) {
      // Entire content is one slide — mark as preamble so title gets injected
      var chapter = makeChapter();
      chapter.classList.add('talk-chapter-preamble');
      children.forEach(function (el) {
        chapter.appendChild(el);
      });
      chapters.push(chapter);
    } else {
      children.forEach(function (el) {
        if (isBreaker(el)) {
          if (currentChapter) chapters.push(currentChapter);
          currentChapter = makeChapter();
          currentChapter.appendChild(el);
        } else {
          if (!currentChapter) {
            // Content before first heading
            currentChapter = makeChapter();
            currentChapter.classList.add('talk-chapter-preamble');
          }
          currentChapter.appendChild(el);
        }
      });
      if (currentChapter) chapters.push(currentChapter);
    }

    // Classify elements within each chapter for zoom filtering
    chapters.forEach(function (chapter) {
      // Mark long paragraphs for zoom level 1
      chapter.querySelectorAll('p').forEach(function (p) {
        var words = p.textContent.trim().split(/\s+/).filter(Boolean).length;
        p.setAttribute('data-wordcount', words);
        if (words > 30) p.classList.add('zoom-long');
      });

      // Mark extra images (beyond first) for zoom level 4
      var images = chapter.querySelectorAll('img, figure');
      images.forEach(function (img, idx) {
        if (idx > 0) {
          img.classList.add('talk-extra-img');
          // If image is the sole child of a <p>, mark the <p> too
          var parent = img.parentElement;
          if (parent && parent.tagName === 'P' && parent.children.length === 1) {
            parent.classList.add('talk-extra-img');
          }
        }
      });
    });

    // If the first chapter is a preamble (no heading), prepend the page title as h1
    if (chapters.length > 0 && chapters[0].classList.contains('talk-chapter-preamble')) {
      var titleEl = document.createElement('h1');
      titleEl.textContent = document.title.replace(/\s*[|\-–]\s*.*$/, '').trim();
      chapters[0].insertBefore(titleEl, chapters[0].firstChild);
    }

    // Clear content, inject chapters
    content.innerHTML = '';
    chapters.forEach(function (ch) {
      content.appendChild(ch);
    });

    slides = Array.from(content.querySelectorAll('.talk-chapter'));
  }

  function makeChapter() {
    var div = document.createElement('div');
    // Add both classes: 'talk-chapter' for our CSS, 'chapter' for mermaid.html compat
    div.className = 'talk-chapter chapter';
    return div;
  }

  // ---------------------------------------------------------------------------
  // Zoom Dots UI
  // ---------------------------------------------------------------------------
  function buildZoomDots() {
    // Render from ZOOM_MAX → 0 (left = least detail, right = most detail)
    for (var i = ZOOM_MAX; i >= 0; i--) {
      var dot = document.createElement('span');
      dot.className = 'talk-zoom-dot';
      dot.setAttribute('data-level', i);
      (function (level) {
        dot.addEventListener('click', function () {
          // Clicking the active dot toggles back one level
          setZoom(zoomLevel === level ? level - 1 : level);
        });
      })(i);
      zoomDots.appendChild(dot);
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  function goToSlide(n) {
    if (n < 0 || n >= slides.length) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = n;
    slides[currentSlide].classList.add('active');
    updateUI();
    fitActiveSlideHeadings();
    // Re-render mermaid diagrams in the new active slide
    if (typeof window.renderVisibleMermaid === 'function') {
      window.renderVisibleMermaid();
    }
  }

  // ---------------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------------
  function setZoom(level) {
    zoomLevel = Math.max(0, Math.min(ZOOM_MAX, level));
    content.setAttribute('data-zoom', zoomLevel);
    updateUI();
  }

  // ---------------------------------------------------------------------------
  // Presentation Mode
  // ---------------------------------------------------------------------------
  function enterPresentation() {
    isPresenting = true;
    document.body.classList.add('talk-presenting');
    document.body.style.overflow = 'hidden';

    btnPresent.style.display = 'none';
    btnExit.style.display = '';

    var center = document.getElementById('talk-controls-center');
    if (center) center.style.display = 'flex';

    // Activate current slide
    slides.forEach(function (s, i) {
      s.classList.toggle('active', i === currentSlide);
    });

    updateUI();
    fitActiveSlideHeadings();

    if (typeof window.renderVisibleMermaid === 'function') {
      window.renderVisibleMermaid();
    }
  }

  function exitPresentation() {
    isPresenting = false;
    document.body.classList.remove('talk-presenting');
    document.body.style.overflow = '';

    btnPresent.style.display = '';
    btnExit.style.display = 'none';

    var center = document.getElementById('talk-controls-center');
    if (center) center.style.display = 'none';

    slides.forEach(function (s) {
      s.classList.remove('active');
    });

    // Reset heading font sizes
    document.querySelectorAll('.talk-chapter h1, .talk-chapter h2').forEach(function (h) {
      h.style.fontSize = '';
      h.style.whiteSpace = '';
    });

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    }

    updateUI();
  }

  // ---------------------------------------------------------------------------
  // Update UI State
  // ---------------------------------------------------------------------------
  function updateUI() {
    // Slide counter
    slideCounter.textContent = (currentSlide + 1) + ' / ' + slides.length;

    // Nav button state
    btnPrev.disabled = (currentSlide === 0);
    btnNext.disabled = (currentSlide === slides.length - 1);

    // Zoom button state: less = go deeper (higher level), more = go back (lower level)
    btnZoomLess.disabled = (zoomLevel === ZOOM_MAX);
    btnZoomMore.disabled = (zoomLevel === 0);

    // Zoom dots — update active state and dynamic tooltips
    var dots = zoomDots.querySelectorAll('.talk-zoom-dot');
    dots.forEach(function (dot) {
      var level = parseInt(dot.getAttribute('data-level'));
      dot.classList.toggle('active', level === zoomLevel);
      dot.title = dotTitle(level);
    });

    // Slide progress CSS variable (for the progress bar at bottom)
    var wrapper = document.getElementById('talk-wrapper');
    if (wrapper && slides.length > 1) {
      var progress = (currentSlide / (slides.length - 1)) * 100;
      wrapper.style.setProperty('--slide-progress', progress + '%');
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard Handler
  // ---------------------------------------------------------------------------
  function handleKeydown(e) {
    // Zoom works in both reading and presentation mode
    // + = more detail (lower level number), - = less detail (higher level number)
    if (e.key === '+') {
      e.preventDefault();
      setZoom(zoomLevel - 1);
      return;
    }
    if (e.key === '-') {
      e.preventDefault();
      setZoom(zoomLevel + 1);
      return;
    }

    // Navigation, fullscreen and exit only in presentation mode
    if (!isPresenting) return;

    switch (e.key) {
      case 'f':
      case 'F':
        toggleFullscreen();
        return;
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        goToSlide(currentSlide + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        goToSlide(currentSlide - 1);
        break;
      case 'Escape':
        exitPresentation();
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Heading Auto-fit
  // ---------------------------------------------------------------------------
  function fitHeading(h, availableWidth) {
    h.style.whiteSpace = 'nowrap';
    var lo = 16, hi = 140, best = lo;
    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2);
      h.style.fontSize = mid + 'px';
      if (h.scrollWidth <= availableWidth) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    h.style.fontSize = best + 'px';
  }

  function fitActiveSlideHeadings() {
    if (!isPresenting || currentSlide >= slides.length) return;
    var slide = slides[currentSlide];
    var cs = window.getComputedStyle(slide);
    var available = slide.clientWidth
      - parseFloat(cs.paddingLeft)
      - parseFloat(cs.paddingRight);
    slide.querySelectorAll('h1, h2').forEach(function (h) {
      fitHeading(h, available);
    });
  }

  // ---------------------------------------------------------------------------
  // Fullscreen Toggle
  // ---------------------------------------------------------------------------
  function toggleFullscreen() {
    var icon = document.getElementById('fullscreen-icon');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
      if (icon) { icon.className = 'bi bi-fullscreen-exit'; }
    } else {
      document.exitFullscreen().catch(function () {});
      if (icon) { icon.className = 'bi bi-fullscreen'; }
    }
  }

  // ---------------------------------------------------------------------------
  // Event Binding
  // ---------------------------------------------------------------------------
  function bindEvents() {
    btnPresent.addEventListener('click', enterPresentation);
    btnExit.addEventListener('click', exitPresentation);
    btnPrev.addEventListener('click', function () { goToSlide(currentSlide - 1); });
    btnNext.addEventListener('click', function () { goToSlide(currentSlide + 1); });
    if (btnFullscreen) { btnFullscreen.addEventListener('click', toggleFullscreen); }
    btnZoomLess.addEventListener('click', function () { setZoom(zoomLevel + 1); });
    btnZoomMore.addEventListener('click', function () { setZoom(zoomLevel - 1); });
    document.addEventListener('keydown', handleKeydown);

    window.addEventListener('resize', fitActiveSlideHeadings);

    // Sync fullscreen icon when browser exits fullscreen natively (e.g. Esc)
    document.addEventListener('fullscreenchange', function () {
      var icon = document.getElementById('fullscreen-icon');
      if (icon) {
        icon.className = document.fullscreenElement ? 'bi bi-fullscreen-exit' : 'bi bi-fullscreen';
      }
    });
  }

})();
