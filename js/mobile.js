/**
 * Mobile-specific functionality for Mandala Playground
 * Handles touch events, mobile optimizations, and responsive behavior
 */

class MobileMandalaPlayground {
  constructor(playgroundApp) {
    this.playgroundApp = playgroundApp;
    this.isMobile = this.detectMobile();
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.isScrolling = false;
    this.lastTouchTime = 0;
    
    if (this.isMobile) {
      this.init();
    }
  }
  
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }
  
  init() {
    console.log('Initializing mobile functionality');
    this.setupTouchEvents();
    this.setupMobileOptimizations();
    this.setupMobileKeyboard();
    this.setupMobileAudio();
    this.setupMobileGestures();
  }
  
  setupTouchEvents() {
    // Add touch events for mandala selection
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Prevent default touch behaviors on specific elements
    const playground = document.getElementById('playground-container');
    if (playground) {
      playground.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('banner-mandala') || 
            e.target.classList.contains('color-note') ||
            e.target.classList.contains('aspiral-button')) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }
  
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.lastTouchTime = Date.now();
    this.isScrolling = false;
  }
  
  handleTouchMove(e) {
    if (!this.isScrolling) {
      const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
      const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);
      
      // Determine if user is scrolling
      if (deltaY > deltaX && deltaY > 10) {
        this.isScrolling = true;
      }
    }
  }
  
  handleTouchEnd(e) {
    this.touchEndX = e.changedTouches[0].clientX;
    this.touchEndY = e.changedTouches[0].clientY;
    
    const touchDuration = Date.now() - this.lastTouchTime;
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    
    // Handle swipe gestures for mandala navigation
    if (!this.isScrolling && touchDuration < 500 && Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
      if (deltaX > 0) {
        this.swipeRight();
      } else {
        this.swipeLeft();
      }
    }
  }
  
  swipeLeft() {
    // Navigate to next mandala
    const nextIndex = (this.playgroundApp.selectedMandalaIndex + 1) % this.playgroundApp.mandalas.length;
    this.playgroundApp.selectMandala(nextIndex);
    this.hapticFeedback();
  }
  
  swipeRight() {
    // Navigate to previous mandala
    const prevIndex = (this.playgroundApp.selectedMandalaIndex - 1 + this.playgroundApp.mandalas.length) % this.playgroundApp.mandalas.length;
    this.playgroundApp.selectMandala(prevIndex);
    this.hapticFeedback();
  }
  
  setupMobileOptimizations() {
    // Add mobile-specific CSS classes
    document.body.classList.add('mobile-device');
    
    // Optimize viewport settings
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    // Add mobile-specific styles
    this.addMobileStyles();
  }
  
  addMobileStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .mobile-device .banner-mandala {
        -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
        tap-highlight-color: rgba(59, 130, 246, 0.3);
      }
      
      .mobile-device .color-note {
        -webkit-tap-highlight-color: transparent;
        tap-highlight-color: transparent;
        min-height: 60px;
        min-width: 60px;
      }
      
      .mobile-device .aspiral-button {
        min-height: 50px;
        min-width: 120px;
        -webkit-tap-highlight-color: transparent;
      }
      
      .mobile-device .speed-slider {
        height: 25px;
      }
      
      .mobile-device .speed-slider::-webkit-slider-thumb {
        width: 35px;
        height: 35px;
      }
      
      /* Prevent zoom on form inputs */
      .mobile-device input[type="range"] {
        font-size: 16px;
      }
      
      /* Mobile-specific scroll behavior */
      .mobile-device .banner-slide {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      /* Touch-friendly mandala sizing */
      @media (max-width: 768px) {
        .mobile-device .banner-mandala {
          min-width: 90px;
          min-height: 90px;
        }
        
        .mobile-device .main-mandala-container {
          width: min(350px, 90vw);
          height: min(350px, 90vw);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  setupMobileKeyboard() {
    // Handle virtual keyboard appearance
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        this.handleKeyboardResize();
      });
    }
  }
  
  handleKeyboardResize() {
    const playground = document.getElementById('playground-container');
    if (playground) {
      const keyboardHeight = window.innerHeight - window.visualViewport.height;
      if (keyboardHeight > 150) {
        // Keyboard is visible
        playground.style.paddingBottom = `${keyboardHeight}px`;
      } else {
        // Keyboard is hidden
        playground.style.paddingBottom = '0';
      }
    }
  }
  
  setupMobileAudio() {
    // Mobile browsers require user interaction for audio
    const enableAudioOnFirstTouch = () => {
      if (this.playgroundApp && this.playgroundApp.initializeAudioContext) {
        this.playgroundApp.initializeAudioContext().then(() => {
          console.log('Mobile audio context initialized');
        });
      }
      document.removeEventListener('touchstart', enableAudioOnFirstTouch);
    };
    
    document.addEventListener('touchstart', enableAudioOnFirstTouch, { once: true });
  }
  
  setupMobileGestures() {
    // Add double-tap to zoom for aspiral canvas
    let lastTouchTime = 0;
    const aspiralCanvas = document.getElementById('aspiral-canvas');
    
    if (aspiralCanvas) {
      aspiralCanvas.addEventListener('touchend', (e) => {
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTouchTime;
        
        if (timeDiff < 300 && timeDiff > 0) {
          // Double tap detected
          this.handleAspiralDoubleTap(e);
        }
        
        lastTouchTime = currentTime;
      });
    }
  }
  
  handleAspiralDoubleTap(e) {
    // Toggle aspiral playback on double tap
    if (this.playgroundApp && this.playgroundApp.playAspiralAnimation) {
      this.playgroundApp.playAspiralAnimation();
      this.hapticFeedback();
    }
  }
  
  hapticFeedback() {
    // Provide haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }
  
  // Mobile-specific color note interaction
  enhanceColorNoteInteraction() {
    const colorNotes = document.querySelectorAll('.color-note');
    colorNotes.forEach((note, index) => {
      // Add long press for sustained notes
      let pressTimer;
      
      note.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          this.playLongNote(index);
        }, 500);
      });
      
      note.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
      });
      
      note.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
      });
    });
  }
  
  playLongNote(colorIndex) {
    if (this.playgroundApp && this.playgroundApp.playColorNote) {
      // Play a longer sustained note
      this.playgroundApp.playColorNote(colorIndex);
      this.hapticFeedback();
    }
  }
  
  // Optimize mandala carousel for mobile
  optimizeMandalaCarousel() {
    const carousel = document.getElementById('mandala-banner');
    if (carousel && this.isMobile) {
      // Add scroll snap for better mobile scrolling
      carousel.style.scrollSnapType = 'x mandatory';
      
      const mandalas = carousel.querySelectorAll('.banner-mandala');
      mandalas.forEach(mandala => {
        mandala.style.scrollSnapAlign = 'center';
      });
    }
  }
  
  // Handle orientation changes
  handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (this.playgroundApp && this.playgroundApp.createMandalaCarousel) {
          this.playgroundApp.createMandalaCarousel();
        }
      }, 500);
    });
  }
}

// Auto-initialize mobile functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for the main playground app to initialize
  setTimeout(() => {
    if (window.playgroundApp) {
      window.mobilePlayground = new MobileMandalaPlayground(window.playgroundApp);
    }
  }, 1000);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileMandalaPlayground;
}
