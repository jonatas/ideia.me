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

  var ZOOM_MAX = 6;

  // Human-readable label for what each level controls (levels 1-5)
  // Level 0 = full content, level 6 = headers only (fixed labels)
  var ZOOM_CONTENT = [
    null,                     // 0 — full content
    'long paragraphs',        // 1
    'paragraphs',             // 2
    'list details',           // 3 — simplify complex lists to bold-only
    'lists, tables & quotes', // 4
    'images & diagrams',      // 5
    null,                     // 6 — headers only
  ];

  function dotTitle(level) {
    if (level === 0) return 'Show everything';
    if (level === ZOOM_MAX) return 'Headers only';
    if (level === 3) return zoomLevel >= level ? 'Show list details' : 'Simplify lists to bold-only';
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

    // Restore shareable URL state
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('present')) {
      var slideParam = parseInt(urlParams.get('slide') || '1', 10) - 1;
      currentSlide = Math.max(0, Math.min(slideParam, slides.length - 1));
      enterPresentation(); // calls updateUI + syncURL internally
    } else {
      updateUI();
    }
  });

  // ---------------------------------------------------------------------------
  // URL State — shareable links for presentation mode + slide position
  // ---------------------------------------------------------------------------
  function getSlideURL(slideIdx, presenting) {
    var base = window.location.origin + window.location.pathname;
    var params = new URLSearchParams();
    if (presenting) params.set('present', '1');
    if (slideIdx > 0) params.set('slide', slideIdx + 1); // 1-indexed for humans
    var qs = params.toString();
    return base + (qs ? '?' + qs : '');
  }

  function syncURL() {
    history.replaceState(null, '', getSlideURL(currentSlide, isPresenting));
  }

  // ---------------------------------------------------------------------------
  // Clipboard + Confetti
  // ---------------------------------------------------------------------------
  function copySlideLink(slideIdx) {
    var url = getSlideURL(slideIdx, true);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast('Thanks! Link copied');
        fireConfetti();
      }).catch(function () { fallbackCopy(url); });
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    showToast('Thanks! Link copied');
    fireConfetti();
  }

  function showToast(msg) {
    var toast = document.createElement('div');
    toast.className = 'talk-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('talk-toast-visible'); });
    });
    setTimeout(function () {
      toast.classList.remove('talk-toast-visible');
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
    }, 2500);
  }

  function fireConfetti() {
    if (typeof confetti !== 'undefined') {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
    }
  }

  // ---------------------------------------------------------------------------
  // Slug helper for chapter IDs
  // ---------------------------------------------------------------------------
  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

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
      children.forEach(function (el) { chapter.appendChild(el); });
      chapters.push(chapter);
    } else {
      children.forEach(function (el) {
        if (isBreaker(el)) {
          if (currentChapter) chapters.push(currentChapter);
          currentChapter = makeChapter();
          currentChapter.appendChild(el);
        } else {
          if (!currentChapter) {
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

      // Mark complex list items (bold + other content) for zoom level 3
      chapter.querySelectorAll('li').forEach(function (li) {
        processComplexListItem(li);
      });

      // Mark extra images (beyond first) for zoom level 5
      var images = chapter.querySelectorAll('img, figure');
      images.forEach(function (img, idx) {
        if (idx > 0) {
          img.classList.add('talk-extra-img');
          var parent = img.parentElement;
          if (parent && parent.tagName === 'P' && parent.children.length === 1) {
            parent.classList.add('talk-extra-img');
          }
        }
      });
    });

    // If the first chapter is a preamble, prepend the page title as h1
    if (chapters.length > 0 && chapters[0].classList.contains('talk-chapter-preamble')) {
      var titleEl = document.createElement('h1');
      titleEl.textContent = document.title.replace(/\s*[|–]\s*.*$/, '').trim();
      chapters[0].insertBefore(titleEl, chapters[0].firstChild);
    }

    // Inject QR code and author line into the first slide
    var qrContainer = null;
    var cleanURL = window.location.origin + window.location.pathname;

    if (chapters.length > 0) {
      var firstChapter = chapters[0];

      // QR block (floats right 30%): QR code + URL link below it
      var qrBlock = document.createElement('div');
      qrBlock.className = 'talk-slide-qr';

      var qrDiv = document.createElement('div');
      qrDiv.className = 'talk-slide-qr-code';
      qrBlock.appendChild(qrDiv);
      qrContainer = qrDiv;

      var authorName = content.getAttribute('data-author') || '';
      var qrLink = document.createElement('div');
      qrLink.className = 'talk-slide-qr-link';
      var link = document.createElement('a');
      link.href = cleanURL;
      link.textContent = cleanURL.replace(/^https?:\/\//, '');
      if (authorName) {
        qrLink.innerHTML = 'by <strong>' + authorName + '</strong><br>';
      }
      qrLink.appendChild(link);
      qrBlock.appendChild(qrLink);

      // Wrap all non-title content into a body div (needed for the grid layout)
      var bodyChildren = Array.from(firstChapter.childNodes).filter(function (n) {
        return n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'H1' && n.tagName !== 'H2';
      });
      var bodyWrapper = document.createElement('div');
      bodyWrapper.className = 'talk-slide-body';
      if (bodyChildren.length > 0) {
        firstChapter.insertBefore(bodyWrapper, bodyChildren[0]);
        bodyChildren.forEach(function (n) { bodyWrapper.appendChild(n); });
      }

      // Append QR block as a direct child of firstChapter (goes into grid col 2)
      firstChapter.appendChild(qrBlock);
    }

    // Clear content, inject chapters
    content.innerHTML = '';
    chapters.forEach(function (ch) { content.appendChild(ch); });

    // Generate QR code now that the container is in the DOM
    if (qrContainer && typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: cleanURL,
        width: 300,
        height: 300,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    slides = Array.from(content.querySelectorAll('.talk-chapter'));

    // Add chapter IDs and anchor link icons to each slide heading
    slides.forEach(function (slide, idx) {
      var heading = slide.querySelector('h1, h2');
      if (!heading) return;

      var slug = slugify(heading.textContent);
      slide.id = slug || ('slide-' + (idx + 1));

      var anchor = document.createElement('a');
      anchor.className = 'talk-chapter-anchor';
      anchor.href = '#';
      anchor.title = 'Copy link to this slide';
      anchor.setAttribute('aria-label', 'Copy link to this slide');
      anchor.innerHTML = '<i class="bi bi-link-45deg"></i>';
      (function (i) {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          copySlideLink(i);
        });
      })(idx);
      heading.appendChild(anchor);
    });
  }

  // Detect list items with "bold + other text" and wrap non-bold content
  // so zoom level 3 can hide it via CSS (.zoom-list-detail)
  function processComplexListItem(li) {
    var childNodes = Array.from(li.childNodes);

    var hasBold = childNodes.some(function (n) {
      return n.nodeName === 'STRONG' || n.nodeName === 'B';
    });
    if (!hasBold) return;

    var hasOtherContent = childNodes.some(function (n) {
      if (n.nodeName === 'STRONG' || n.nodeName === 'B') return false;
      if (n.nodeName === 'UL' || n.nodeName === 'OL') return false;
      if (n.nodeType === Node.TEXT_NODE) return n.textContent.trim().length > 0;
      return true;
    });
    if (!hasOtherContent) return;

    li.classList.add('zoom-list-complex');

    childNodes.forEach(function (n) {
      var isBold = n.nodeName === 'STRONG' || n.nodeName === 'B';
      var isSubList = n.nodeName === 'UL' || n.nodeName === 'OL';
      if (isBold || isSubList) return;
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim() === '') return;

      var span = document.createElement('span');
      span.className = 'zoom-list-detail';
      n.parentNode.insertBefore(span, n);
      span.appendChild(n);
    });
  }

  function makeChapter() {
    var div = document.createElement('div');
    div.className = 'talk-chapter chapter';
    return div;
  }

  // ---------------------------------------------------------------------------
  // Zoom Dots UI
  // ---------------------------------------------------------------------------
  function buildZoomDots() {
    for (var i = ZOOM_MAX; i >= 0; i--) {
      var dot = document.createElement('span');
      dot.className = 'talk-zoom-dot';
      dot.setAttribute('data-level', i);
      (function (level) {
        dot.addEventListener('click', function () {
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
    syncURL();
    trackEvent('slide_navigate', { slide_index: currentSlide + 1, total_slides: slides.length });
    updateUI();
    if (typeof window.renderVisibleMermaid === 'function') {
      window.renderVisibleMermaid();
    }
  }

  // ---------------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------------
  function setZoom(level) {
    var newLevel = Math.max(0, Math.min(ZOOM_MAX, level));
    if (newLevel === zoomLevel) return;
    zoomLevel = newLevel;
    trackEvent('zoom_change', { zoom_level: zoomLevel, zoom_label: ZOOM_CONTENT[zoomLevel] || (zoomLevel === 0 ? 'full' : 'headers_only') });
    content.setAttribute('data-zoom', zoomLevel);
    updateUI();
  }

  // ---------------------------------------------------------------------------
  // Presentation Mode
  // ---------------------------------------------------------------------------
  function trackEvent(action, params) {
    if (typeof gtag === 'function') {
      gtag('event', action, Object.assign({ page_path: window.location.pathname }, params));
    }
  }

  function enterPresentation() {
    isPresenting = true;
    syncURL();
    trackEvent('presentation_start', { total_slides: slides.length });
    document.body.classList.add('talk-presenting');
    document.body.style.overflow = 'hidden';

    btnPresent.style.display = 'none';
    btnExit.style.display = '';

    var center = document.getElementById('talk-controls-center');
    if (center) center.style.display = 'flex';

    slides.forEach(function (s, i) {
      s.classList.toggle('active', i === currentSlide);
    });

    updateUI();

    if (typeof window.renderVisibleMermaid === 'function') {
      window.renderVisibleMermaid();
    }
  }

  function exitPresentation() {
    isPresenting = false;
    syncURL();
    trackEvent('presentation_exit', { slide_reached: currentSlide + 1, total_slides: slides.length });
    document.body.classList.remove('talk-presenting');
    document.body.style.overflow = '';

    btnPresent.style.display = '';
    btnExit.style.display = 'none';

    var center = document.getElementById('talk-controls-center');
    if (center) center.style.display = 'none';

    slides.forEach(function (s) { s.classList.remove('active'); });

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    }

    updateUI();

    // Scroll the current slide into view in reading mode
    var slide = slides[currentSlide];
    if (slide) {
      setTimeout(function () { slide.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
    }
  }

  // ---------------------------------------------------------------------------
  // Update UI State
  // ---------------------------------------------------------------------------
  function updateUI() {
    slideCounter.textContent = (currentSlide + 1) + ' / ' + slides.length;

    btnPrev.disabled = (currentSlide === 0);
    btnNext.disabled = (currentSlide === slides.length - 1);

    btnZoomLess.disabled = (zoomLevel === ZOOM_MAX);
    btnZoomMore.disabled = (zoomLevel === 0);

    var dots = zoomDots.querySelectorAll('.talk-zoom-dot');
    dots.forEach(function (dot) {
      var level = parseInt(dot.getAttribute('data-level'));
      dot.classList.toggle('active', level === zoomLevel);
      dot.title = dotTitle(level);
    });

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
    if (!isPresenting) return;

    switch (e.key) {
      case 'f': case 'F': toggleFullscreen(); return;
      case 'ArrowRight': case ' ': e.preventDefault(); goToSlide(currentSlide + 1); break;
      case 'ArrowLeft':            e.preventDefault(); goToSlide(currentSlide - 1); break;
      case 'Escape': exitPresentation(); break;
    }
  }

  // ---------------------------------------------------------------------------
  // Heading Auto-fit (hide anchor icons during measurement to avoid bias)
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Fullscreen Toggle
  // ---------------------------------------------------------------------------
  function toggleFullscreen() {
    var icon = document.getElementById('fullscreen-icon');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
      if (icon) icon.className = 'bi bi-fullscreen-exit';
    } else {
      document.exitFullscreen().catch(function () {});
      if (icon) icon.className = 'bi bi-fullscreen';
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
    if (btnFullscreen) btnFullscreen.addEventListener('click', toggleFullscreen);
    btnZoomLess.addEventListener('click', function () { setZoom(zoomLevel + 1); });
    btnZoomMore.addEventListener('click', function () { setZoom(zoomLevel - 1); });
    document.addEventListener('keydown', handleKeydown);


    // Remove ?slide param from URL when user scrolls in reading mode
    window.addEventListener('scroll', function () {
      if (isPresenting) return;
      var params = new URLSearchParams(window.location.search);
      if (params.has('slide')) {
        params.delete('slide');
        var qs = params.toString();
        history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
      }
    }, { passive: true });

    document.addEventListener('fullscreenchange', function () {
      var icon = document.getElementById('fullscreen-icon');
      if (icon) icon.className = document.fullscreenElement ? 'bi bi-fullscreen-exit' : 'bi bi-fullscreen';
    });
  }

})();
