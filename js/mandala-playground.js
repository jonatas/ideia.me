/**
 * Mandala Playground - Interactive Sonification
 * Full-featured mandala sonification playground with real mandala images and advanced audio synthesis capabilities
 */

let playgroundApp = null;

// Auto-initialize playground when page loads
document.addEventListener('DOMContentLoaded', function() {
  if (!playgroundApp) {
    playgroundApp = new MandalaPlayground();
  }
});

class MandalaPlayground {
  constructor() {
    this.mandalas = this.generateMandalaList();
    this.colorThief = new ColorThief();
    this.extractedColors = [];
    this.selectedMandalaIndex = 0;
    this.bannerSpeed = 1; // Default to 1 for 1.0x speed (matches HTML default)
    this.isAspiralPlaying = false;
    this.aspiralDots = [];
    this.aspiralPlayIndex = 0;
    this.aspiralAnimationSpeed = 2;
    this.sourceImageData = null;
    this.audioEnabled = false;
    this.synth = null;
    
    this.setupAudio();
    this.initializeElements();
    this.bindEvents();
    this.createMandalaCarousel();
    this.addAudioNotice();
    this.setupResizeListener();
    
    // Initialize speed display and selected mandala number
    this.updateSpeedDisplay();
    this.updateSelectedMandalaNumber();
    
    // Auto-select and load the first mandala
    this.selectMandala(0);
  }

  generateMandalaList() {
    const mandalas = [];
    // Generate list of actually available mandala files
    const mandalaFiles = [
      '01b.png', '02b.png', '03b.png', '04b.png', '05b.png', '06b.png', '07b.png', '08b.png', '09b.png',
      '010b.png', '011b.png', '012b.png', '013b.png', '014b.png', '015b.png', '016b.png', '017b.png',
      '018b.png', '019b.png', '020b.png', '021b.png', '022b.png', '023b.png', '024b.png', '025b.png', '026b.png'
    ];
    
    mandalaFiles.forEach((filename, index) => {
      mandalas.push({
        number: index + 1,
        filename: filename,
        path: `/images/mandalas/${filename}`
      });
    });
    
    return mandalas;
  }

  async setupAudio() {
    try {
      // Wait for user interaction before setting up audio
      this.audioEnabled = false;
      this.synth = null;
      
      // Initialize audio context properly
      await this.initializeAudioContext();
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  }

  async initializeAudioContext() {
    try {
      if (window.Tone && Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Audio context started');
      }
      
      // Create synth after audio context is running
      this.synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 }
      }).toDestination();
      
      this.audioEnabled = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }

  initializeElements() {
    this.elements = {
      mandalaCarousel: document.getElementById('mandala-banner'),
      selectedMandala: document.getElementById('selected-mandala'),
      colorGrid: document.getElementById('color-grid'),
      aspiralCanvas: document.getElementById('aspiral-canvas'),
      bannerSpeedSlider: document.getElementById('banner-speed'),
      speedDisplay: document.getElementById('speed-display'),
      selectedNumber: document.getElementById('selected-number'),
      aspiralPlayBtn: document.getElementById('aspiral-play-btn'),
      aspiralSpeedSlider: document.getElementById('aspiral-speed'),
      aspiralSpeedLabel: document.querySelector('label[for="aspiral-speed"]')
    };
  }

  // Setup window resize listener for responsive layout
  setupResizeListener() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.createMandalaCarousel();
        this.updateMandalaRotations();
      }, 250);
    });
  }

  // Add audio notice for user interaction
  addAudioNotice() {
    // Only show if audio is not already enabled
    if (this.audioEnabled) return;
    
    const container = document.getElementById('playground-container');
    if (!container) return;
    
    const notice = document.createElement('div');
    notice.className = 'audio-notice';
    notice.innerHTML = '🔊 Click anywhere to enable audio for the mandala sonification';
    notice.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      background: rgba(26, 188, 156, 0.95);
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      font-weight: bold;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      transition: all 0.3s ease;
      font-family: inherit;
      font-size: 14px;
      max-width: 300px;
      line-height: 1.4;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(5px);
      opacity: 1;
      visibility: visible;
      display: block;
      pointer-events: auto;
    `;
    
    // Add hover effect
    notice.addEventListener('mouseenter', () => {
      notice.style.transform = 'scale(1.05)';
      notice.style.background = 'rgba(26, 188, 156, 1)';
    });
    
    notice.addEventListener('mouseleave', () => {
      notice.style.transform = 'scale(1)';
      notice.style.background = 'rgba(26, 188, 156, 0.95)';
    });
    
    notice.addEventListener('click', async () => {
      const success = await this.initializeAudioContext();
      if (success) {
        notice.style.opacity = '0';
        notice.style.transform = 'scale(0.8)';
        setTimeout(() => {
          if (notice.parentElement) {
            notice.remove();
          }
        }, 300);
      }
    });
    
    // Append to body and ensure it's visible
    document.body.appendChild(notice);
    
    // Force a reflow and ensure visibility
    setTimeout(() => {
      notice.style.opacity = '1';
      notice.style.visibility = 'visible';
      notice.style.display = 'block';
      console.log('Audio notice visibility set');
      console.log('Notice element:', notice);
      console.log('Notice computed styles:', window.getComputedStyle(notice));
      console.log('Notice bounding rect:', notice.getBoundingClientRect());
    }, 100);
    
    console.log('Audio notice added to DOM');
    console.log('Notice parent:', notice.parentElement);
    console.log('Body children count:', document.body.children.length);
  }

  // Create overlapping mandala grid panel for the banner
  createMandalaCarousel() {
    const panel = this.elements.mandalaCarousel;
    panel.innerHTML = '';
    
    // Calculate positions for overlapping grid
    const positions = this.calculateOverlappingPositions();
    
    // Create grid of all mandalas with calculated positions
    this.mandalas.forEach((mandala, index) => {
      const mandalaElement = document.createElement('img');
      mandalaElement.className = 'banner-mandala';
      mandalaElement.crossOrigin = 'anonymous';
      mandalaElement.src = mandala.path;
      mandalaElement.alt = `Mandala ${mandala.number}`;
      
      // Position the mandala
      if (positions[index]) {
        mandalaElement.style.left = positions[index].x + 'px';
        mandalaElement.style.top = positions[index].y + 'px';
        
        // Add offset class for overlapping mandalas
        if (positions[index].offset) {
          mandalaElement.classList.add('offset');
        }
      }
      
      if (index === this.selectedMandalaIndex) {
        mandalaElement.classList.add('selected');
      }
      
      mandalaElement.addEventListener('click', () => {
        this.selectMandala(index);
      });
      
      mandalaElement.addEventListener('error', (error) => {
        console.error('Failed to load banner mandala:', mandala.path);
      });
      
      panel.appendChild(mandalaElement);
    });
    
    // Height is now controlled by CSS - no dynamic height setting needed
    // panel.style.height is managed by CSS calc(50vh - 120px)
  }
  
  // Calculate positions for overlapping grid layout
  calculateOverlappingPositions() {
    const positions = [];
    
    // Responsive sizing based on screen width - use more available space
    const screenWidth = window.innerWidth;
    let containerWidth, containerHeight, mandalaSize, spacing;
    
    // Use the actual available height from CSS calc(50vh - 120px)
    const availableHeight = window.innerHeight * 0.5 - 120 - 20; // 20px for padding
    
    if (screenWidth <= 480) {
      containerWidth = screenWidth - 10; // Use almost full screen width with 5px margin each side
      containerHeight = availableHeight;
      mandalaSize = 70; // Smaller for mobile
      spacing = 60;
    } else if (screenWidth <= 768) {
      containerWidth = screenWidth - 20; // Use almost full screen width with 10px margin each side
      containerHeight = availableHeight;
      mandalaSize = 90; // Smaller to fit better
      spacing = 75;
    } else if (screenWidth <= 1200) {
      containerWidth = screenWidth - 30; // Use almost full screen width with 15px margin each side
      containerHeight = availableHeight;
      mandalaSize = 110; // Smaller to fit better
      spacing = 95;
    } else {
      containerWidth = screenWidth - 40; // Use almost full screen width with 20px margin each side
      containerHeight = availableHeight;
      mandalaSize = 120; // Smaller to fit better
      spacing = 105;
    }
    
    // Calculate how many mandalas fit per row with better spacing
    const effectiveSpacing = Math.max(spacing, mandalaSize + 20); // Ensure minimum gap of 20px
    const mandalsPerRow = Math.floor((containerWidth - mandalaSize) / effectiveSpacing) + 1;
    const rows = Math.ceil(this.mandalas.length / mandalsPerRow);
    
    // Adjust container height based on actual rows needed
    const actualContainerHeight = Math.max(containerHeight, rows * effectiveSpacing * 0.8 + mandalaSize);
    
    let mandalaIndex = 0;
    
    for (let row = 0; row < rows && mandalaIndex < this.mandalas.length; row++) {
      const isOffsetRow = row % 2 === 1;
      const rowY = row * (effectiveSpacing * 0.75); // Better vertical spacing
      
      // Calculate starting X position for centering with improved logic
      const mandalsInThisRow = Math.min(mandalsPerRow, this.mandalas.length - mandalaIndex);
      const actualRowWidth = (mandalsInThisRow - 1) * effectiveSpacing + mandalaSize;
      const startX = Math.max(0, (containerWidth - actualRowWidth) / 2);
      
      for (let col = 0; col < mandalsPerRow && mandalaIndex < this.mandalas.length; col++) {
        let x = startX + col * effectiveSpacing;
        let y = rowY;
        
        // Offset every other row horizontally for honeycomb effect
        if (isOffsetRow) {
          x += effectiveSpacing / 2;
        }
        
        // Ensure mandalas stay within bounds with better margin
        if (x + mandalaSize > containerWidth - 10) break;
        if (y + mandalaSize > actualContainerHeight - 10) break;
        
        positions[mandalaIndex] = {
          x: Math.max(10, x), // Minimum 10px margin from edge
          y: Math.max(10, y),
          offset: isOffsetRow
        };
        
        mandalaIndex++;
      }
    }
    
    return positions;
  }
  
  // Select a mandala and update all reactive components
  selectMandala(index) {
    this.selectedMandalaIndex = index;
    this.updateMandalaSelection();
    this.updateSelectedMandalaNumber();
    this.loadSelectedMandala();
    // Aspiral reconstruction will be called after color extraction in createColorPalette
  }
  
  // Update the selected mandala number display
  updateSelectedMandalaNumber() {
    if (this.elements.selectedNumber) {
      this.elements.selectedNumber.textContent = this.selectedMandalaIndex + 1;
    }
  }

  // Get normalized speed value for consistent calculations
  getNormalizedSpeed() {
    // Convert slider value to meaningful speed
    // Current range is -30 to 30, so we can use it directly
    return this.bannerSpeed;
  }

  // Update speed display with RPM calculation
  updateSpeedDisplay() {
    const normalizedSpeed = this.getNormalizedSpeed();
    const direction = normalizedSpeed >= 0 ? '→' : '←';
    const absSpeed = Math.abs(normalizedSpeed);
    
    // Calculate RPM (1.0x = 6 RPM, which is 1 rotation per 10 seconds)
    const currentRPM = 6 * absSpeed;
    
    if (absSpeed === 0) {
      this.elements.speedDisplay.textContent = `Speed: Stopped`;
    } else {
      this.elements.speedDisplay.textContent = `Speed: ${direction} ${absSpeed.toFixed(1)}x (${currentRPM.toFixed(1)} RPM)`;
    }
    
    // Update selected mandala rotation
    this.updateSelectedMandalaRotation();
  }

  // Update selected mandala rotation
  updateSelectedMandalaRotation() {
    const selectedMandala = this.elements.selectedMandala;
    if (!selectedMandala) return;

    // Always clear existing animations first
    selectedMandala.classList.remove('rotating', 'rotating-reverse');
    selectedMandala.style.animation = 'none';
    selectedMandala.style.animationDuration = '';
    selectedMandala.style.transform = '';
    
    // Force a reflow to ensure animation is cleared
    selectedMandala.offsetHeight;

    const normalizedSpeed = this.getNormalizedSpeed();
    
    if (Math.abs(normalizedSpeed) > 0) {
      const duration = Math.abs(10 / normalizedSpeed); // 10 seconds for 1.0x speed
      const animationName = normalizedSpeed >= 0 ? 'rotate-mandala' : 'rotate-mandala-reverse';
      
      // Set the complete animation via JavaScript
      const animationString = `${animationName} ${duration}s linear infinite`;
      selectedMandala.style.animation = animationString;
      selectedMandala.style.transition = 'none';
      
      console.log('Applied rotation animation:', animationString, 'Speed:', normalizedSpeed);
    } else {
      // Reset transition when not animating
      selectedMandala.style.transition = '';
    }
  }
  
  // Update visual selection across all components
  updateMandalaSelection() {
    // Update banner selection
    const bannerMandalas = this.elements.mandalaCarousel.querySelectorAll('.banner-mandala');
    bannerMandalas.forEach((mandala, index) => {
      mandala.classList.toggle('selected', index === this.selectedMandalaIndex);
    });
  }
  
  // Load and display selected mandala with color extraction
  loadSelectedMandala() {
    const selectedMandala = this.mandalas[this.selectedMandalaIndex];
    const mandalaImg = this.elements.selectedMandala;
    
    console.log('Loading mandala:', selectedMandala.path);
    
    // Clear any existing rotation immediately when switching mandalas
    mandalaImg.classList.remove('rotating', 'rotating-reverse');
    mandalaImg.style.animation = 'none';
    mandalaImg.style.animationDuration = '';
    
    mandalaImg.onload = () => {
      console.log('Mandala loaded successfully');
      // Apply rotation after a small delay to ensure the image is fully rendered
      setTimeout(() => {
        this.updateSelectedMandalaRotation();
      }, 10);
      setTimeout(() => this.extractColors(), 50); // Small delay to ensure image is fully rendered
    };
    
    mandalaImg.onerror = (error) => {
      console.error('Failed to load mandala:', selectedMandala.path, error);
      // Use fallback colors if image fails to load
      this.extractColorsManually();
    };
    
    mandalaImg.crossOrigin = 'anonymous';
    mandalaImg.src = selectedMandala.path;
  }

  // Extract 12 dominant colors from selected mandala
  extractColors() {
    try {
      if (!this.elements.selectedMandala.complete || !this.elements.selectedMandala.naturalWidth) {
        console.log('Image not ready, retrying in 100ms...');
        setTimeout(() => this.extractColors(), 100);
        return;
      }
      
      // Use ColorThief to extract colors
      if (window.ColorThief && this.colorThief) {
        this.extractedColors = this.colorThief.getPalette(this.elements.selectedMandala, 12);
        console.log('ColorThief extracted colors:', this.extractedColors);
        
        if (this.extractedColors && this.extractedColors.length >= 6) {
          // Ensure we have 12 colors by duplicating if needed
          while (this.extractedColors.length < 12) {
            this.extractedColors.push(this.extractedColors[this.extractedColors.length % 6]);
          }
          this.extractedColors = this.extractedColors.slice(0, 12);
          this.createColorPalette();
          return;
        }
      }
      
      // Fallback to manual extraction if ColorThief fails
      this.extractColorsManually();
      
    } catch (error) {
      console.error('Error extracting colors:', error);
      this.extractColorsManually();
    }
  }
  
  // Manual color extraction fallback
  extractColorsManually() {
    try {
      console.log('Starting manual color extraction...');
      
      // Create canvas to sample colors
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = this.elements.selectedMandala;
      
      if (!img || !img.complete || !img.naturalWidth) {
        console.log('Image not ready for manual extraction, using fallback colors');
        this.useFallbackColors();
        return;
      }
      
      canvas.width = 200;
      canvas.height = 200;
      ctx.drawImage(img, 0, 0, 200, 200);
      
      const imageData = ctx.getImageData(0, 0, 200, 200);
      const data = imageData.data;
      const colorCounts = {};
      
      // Sample every 8th pixel to get more diverse colors
      for (let i = 0; i < data.length; i += 32) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a > 100 && (r + g + b) > 60) { // Skip transparent and very dark pixels
          // Less aggressive quantization for better color fidelity
          const key = `${Math.round(r/15)*15},${Math.round(g/15)*15},${Math.round(b/15)*15}`;
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }
      }
      
      // Get top 12 colors
      const sortedColors = Object.entries(colorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 12)
        .map(([color]) => color.split(',').map(Number));
      
      if (sortedColors.length > 0) {
        this.extractedColors = sortedColors;
        // Fill with generated colors if not enough
        while (this.extractedColors.length < 12) {
          const hue = (this.extractedColors.length * 30) % 360;
          const [r, g, b] = this.hslToRgb(hue, 70, 60);
          this.extractedColors.push([r, g, b]);
        }
        console.log('Manual extraction successful:', this.extractedColors);
      } else {
        console.log('No colors found, using fallback');
        this.useFallbackColors();
      }
      
      this.createColorPalette();
      
    } catch (error) {
      console.error('Manual extraction failed:', error);
      this.useFallbackColors();
    }
  }
  
  // Use fallback colors
  useFallbackColors() {
    this.extractedColors = [
      [255, 107, 107], [78, 205, 196], [69, 183, 209], [150, 206, 180],
      [254, 202, 87], [255, 159, 243], [84, 160, 255], [95, 39, 205],
      [0, 210, 211], [255, 159, 67], [16, 172, 132], [238, 90, 36]
    ];
    console.log('Using fallback colors:', this.extractedColors);
    this.createColorPalette();
  }
  
  // HSL to RGB helper
  hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  
  // Create interactive color palette
  createColorPalette() {
    const colorGrid = this.elements.colorGrid;
    colorGrid.innerHTML = '';
    
    console.log('Creating color palette with colors:', this.extractedColors);
    
    if (!this.extractedColors || this.extractedColors.length === 0) {
      console.error('No extracted colors available, using fallback');
      this.extractedColors = [
        [255, 107, 107], [78, 205, 196], [69, 183, 209], [150, 206, 180],
        [254, 202, 87], [255, 159, 243], [84, 160, 255], [95, 39, 205],
        [0, 210, 211], [255, 159, 67], [16, 172, 132], [238, 90, 36]
      ];
    }
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    this.extractedColors.forEach((color, index) => {
      const [r, g, b] = color;
      const noteName = noteNames[index];
      
      const colorNote = document.createElement('div');
      colorNote.className = 'color-note';
      
      // Force the background color with !important
      const colorStyle = `rgb(${r}, ${g}, ${b})`;
      colorNote.style.setProperty('background-color', colorStyle, 'important');
      colorNote.style.color = this.getContrastColor(r, g, b);
      colorNote.textContent = noteName;
      colorNote.title = `${noteName} - rgb(${r}, ${g}, ${b})`;
      
      console.log(`Color note ${index}: ${noteName} = rgb(${r}, ${g}, ${b}) -> ${colorStyle}`);
      
      colorNote.addEventListener('click', async () => {
        await this.playColorNote(index);
      });
      
      colorGrid.appendChild(colorNote);
    });
    
    console.log(`Color palette created with ${this.extractedColors.length} colors`);
    
    // Update banner mandala rotation with colors
    this.updateMandalaRotations();
    
    // Now that we have colors, generate aspiral reconstruction
    this.generateAspiralReconstruction();
  }
  
  // Generate aspiral reconstruction from selected mandala
  generateAspiralReconstruction() {
    const canvas = this.elements.aspiralCanvas;
    const ctx = canvas.getContext('2d');
    
    console.log('Starting aspiral reconstruction...');
    
    // Clear previous reconstruction
    ctx.clearRect(0, 0, 350, 350);
    this.aspiralDots = [];
    
    // Ensure we have extracted colors first
    if (!this.extractedColors || this.extractedColors.length === 0) {
      console.log('No extracted colors, waiting for color extraction...');
      setTimeout(() => this.generateAspiralReconstruction(), 500);
      return;
    }
    
    // Load mandala image data for aspiral algorithm
    this.loadMandalaImageData().then(() => {
      console.log('Mandala image data loaded, creating aspiral dots...');
      this.createAspiralDots();
    }).catch((error) => {
      console.error('Failed to load aspiral data:', error);
      // Create a simple fallback visualization
      this.createFallbackAspiral();
    });
  }
  
  // Load mandala image data for pixel sampling
  loadMandalaImageData() {
    return new Promise((resolve, reject) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 500;
      tempCanvas.height = 500;
      const tempCtx = tempCanvas.getContext('2d');
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          console.log('Aspiral mandala loaded:', img.src);
          // Scale and draw image
          const size = Math.min(img.width, img.height);
          const scale = 450 / size; // Leave some padding (50px total)
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const offsetX = (500 - scaledWidth) / 2;
          const offsetY = (500 - scaledHeight) / 2;
          
          tempCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
          this.sourceImageData = tempCtx.getImageData(0, 0, 500, 500);
          console.log('Aspiral image data ready');
          resolve();
        } catch (error) {
          console.error('Error processing aspiral image:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('Failed to load aspiral mandala:', this.mandalas[this.selectedMandalaIndex].path, error);
        reject(error);
      };
      
      const mandalaPath = this.mandalas[this.selectedMandalaIndex].path;
      console.log('Loading aspiral mandala:', mandalaPath);
      img.src = mandalaPath;
    });
  }

  // Create fallback aspiral if image loading fails
  createFallbackAspiral() {
    const canvas = this.elements.aspiralCanvas;
    const ctx = canvas.getContext('2d');
    
    console.log('Creating fallback aspiral with extracted colors');
    
    const centerX = 250;
    const centerY = 250;
    const maxRadius = 225;
    const totalSteps = 1500;
    
    this.aspiralDots = [];
    
    for (let step = 0; step < totalSteps; step++) {
      const progress = step / totalSteps;
      const theta = progress * Math.PI * 20; // 10 rotations
      const radius = progress * maxRadius;
      
      const x = centerX + radius * Math.cos(theta);
      const y = centerY + radius * Math.sin(theta);
      
      // Use extracted colors in sequence
      const colorIndex = step % this.extractedColors.length;
      const [r, g, b] = this.extractedColors[colorIndex];
      
      // Draw dot
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
      
      // Store dot info for interactive playback
      this.aspiralDots.push({
        x, y, r, g, b, step,
        colorIndex: colorIndex
      });
    }
    
    // Add hover listeners to canvas
    this.setupAspiralInteraction();
  }

  // Create aspiral dots from image data
  createAspiralDots() {
    const canvas = this.elements.aspiralCanvas;
    const ctx = canvas.getContext('2d');
    
    console.log('Creating aspiral dots from source image data');
    
    if (!this.sourceImageData) {
      console.error('No source image data available, using fallback');
      this.createFallbackAspiral();
      return;
    }
    
    const centerX = 250;
    const centerY = 250;
    const maxRadius = 225;
    const totalSteps = 5000;
    let validPixels = 0;
    
    for (let step = 0; step < totalSteps; step++) {
      const progress = step / totalSteps;
      const theta = progress * Math.PI * 60; // 30 rotations
      const radius = progress * maxRadius;
      
      const x = centerX + radius * Math.cos(theta);
      const y = centerY + radius * Math.sin(theta);
      
      // Sample pixel color
      const [r, g, b, a] = this.samplePixel(x, y);
      
      if (a > 50) {
        validPixels++;
        // Draw dot
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Store dot info for interactive playback
        this.aspiralDots.push({
          x, y, r, g, b, step,
          colorIndex: this.findClosestColorIndex(r, g, b)
        });
      }
    }
    
    console.log(`Aspiral created: ${validPixels} valid pixels out of ${totalSteps} steps`);
    
    // If very few valid pixels, use fallback
    if (validPixels < 100) {
      console.log('Too few valid pixels, using fallback aspiral');
      ctx.clearRect(0, 0, 350, 350);
      this.createFallbackAspiral();
      return;
    }
    
    // Add hover listeners to canvas
    this.setupAspiralInteraction();
  }
  
  // Sample pixel from source image data
  samplePixel(x, y) {
    if (!this.sourceImageData || x < 0 || x >= 500 || y < 0 || y >= 500) {
      return [0, 0, 0, 0];
    }
    
    const index = (Math.floor(y) * 500 + Math.floor(x)) * 4;
    return [
      this.sourceImageData.data[index],
      this.sourceImageData.data[index + 1],
      this.sourceImageData.data[index + 2],
      this.sourceImageData.data[index + 3]
    ];
  }
  
  // Find closest color in extracted palette
  findClosestColorIndex(r, g, b) {
    let minDistance = Infinity;
    let closestIndex = 0;
    
    this.extractedColors.forEach((color, index) => {
      const [pr, pg, pb] = color;
      const distance = Math.sqrt((r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }
  
  // Setup mouse interaction for aspiral canvas
  setupAspiralInteraction() {
    const canvas = this.elements.aspiralCanvas;
    let lastHighlightedDot = null;
    let throttleTimeout = null;
    
    canvas.addEventListener('mousemove', (e) => {
      // Throttle mouse events for better performance
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Find closest dot to mouse with smaller radius
        let closestDot = null;
        let minDistance = Infinity;
        
        this.aspiralDots.forEach(dot => {
          // Skip already highlighted dots
          if (dot.highlighted) return;
          
          const distance = Math.sqrt((mouseX - dot.x) ** 2 + (mouseY - dot.y) ** 2);
          if (distance < 5 && distance < minDistance) { // Reduced radius to 5px
            minDistance = distance;
            closestDot = dot;
          }
        });
        
        // Only interact with a new dot (prevent repeated interactions)
        if (closestDot && closestDot !== lastHighlightedDot) {
          this.playColorNote(closestDot.colorIndex);
          this.highlightDot(closestDot);
          lastHighlightedDot = closestDot;
        }
        
        throttleTimeout = null;
      }, 50); // 50ms throttle
    });
    
    // Reset last highlighted dot when mouse leaves canvas
    canvas.addEventListener('mouseleave', () => {
      lastHighlightedDot = null;
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
        throttleTimeout = null;
      }
    });
  }
  
  // Highlight a dot visually with scaling based on animation speed
  highlightDot(dot) {
    // Mark dot as highlighted
    dot.highlighted = true;
    dot.highlightTime = Date.now();
    
    // Calculate timing based on animation speed
    const baseDelay = 1000 / (this.aspiralAnimationSpeed * 20);
    const scaleDuration = Math.max(150, Math.min(600, baseDelay * 0.8)); // 80% of note duration
    const holdDuration = Math.max(50, Math.min(300, baseDelay * 0.3));   // 30% of note duration
    
    // Create a temporary visual element for scaling effect
    const canvas = this.elements.aspiralCanvas;
    const scaleDot = document.createElement('div');
    scaleDot.style.cssText = `
      position: absolute;
      left: ${dot.x - 3}px;
      top: ${dot.y - 3}px;
      width: 6px;
      height: 6px;
      background: rgb(${dot.r}, ${dot.g}, ${dot.b});
      border-radius: 50%;
      pointer-events: none;
      z-index: 10;
      transition: all ${scaleDuration}ms ease;
      transform: scale(3);
      box-shadow: 0 0 15px rgba(${dot.r}, ${dot.g}, ${dot.b}, 0.8);
      filter: brightness(1.5);
    `;
    
    canvas.parentElement.appendChild(scaleDot);
    
    // Remove the scaled dot after animation with timing based on speed
    setTimeout(() => {
      scaleDot.style.transform = 'scale(1)';
      scaleDot.style.filter = 'brightness(1)';
      scaleDot.style.boxShadow = 'none';
      setTimeout(() => {
        if (scaleDot.parentElement) {
          scaleDot.parentElement.removeChild(scaleDot);
        }
        if (dot.highlighted) {
          dot.highlighted = false;
        }
      }, scaleDuration);
    }, holdDuration);
  }
  
  
  // Play aspiral animation
  playAspiralAnimation() {
    if (this.isAspiralPlaying) {
      this.stopAspiralAnimation();
      return;
    }
    
    this.isAspiralPlaying = true;
    this.aspiralPlayIndex = 0;
    this.elements.aspiralPlayBtn.textContent = '⏹ Stop';
    this.elements.aspiralPlayBtn.classList.add('playing');
    
    this.animateAspiralDots();
  }
  
  // Animate through aspiral dots with proper timing
  animateAspiralDots() {
    if (!this.isAspiralPlaying || this.aspiralPlayIndex >= this.aspiralDots.length) {
      this.stopAspiralAnimation();
      return;
    }
    
    const dot = this.aspiralDots[this.aspiralPlayIndex];
    
    // Play note and highlight
    this.playColorNote(dot.colorIndex);
    this.highlightDot(dot);
    
    // Highlight corresponding color in palette with timing based on animation speed
    const colorNotes = this.elements.colorGrid.querySelectorAll('.color-note');
    if (colorNotes[dot.colorIndex]) {
      colorNotes[dot.colorIndex].classList.add('playing');
      
      // Calculate timeout based on animation speed - reduced duration for subtlety
      const notePlayDuration = Math.max(200, 600 / (this.aspiralAnimationSpeed * 2));
      setTimeout(() => {
        colorNotes[dot.colorIndex].classList.remove('playing');
      }, notePlayDuration);
    }
    
    this.aspiralPlayIndex++;
    
    // Continue animation with speed control using requestAnimationFrame for smoother performance
    const delay = Math.max(50, 1000 / (this.aspiralAnimationSpeed * 20)); // Reduced frequency to prevent timing conflicts
    this.aspiralAnimationTimeout = setTimeout(() => {
      if (this.isAspiralPlaying) {
        requestAnimationFrame(() => this.animateAspiralDots());
      }
    }, delay);
  }
  
  // Stop aspiral animation
  stopAspiralAnimation() {
    this.isAspiralPlaying = false;
    if (this.aspiralAnimationTimeout) {
      clearTimeout(this.aspiralAnimationTimeout);
      this.aspiralAnimationTimeout = null;
    }
    this.elements.aspiralPlayBtn.textContent = '🎵 Play Aspiral';
    this.elements.aspiralPlayBtn.classList.remove('playing');
  }
  
  // Play color note with proper audio context handling
  async playColorNote(colorIndex) {
    try {
      // Ensure audio context is running
      if (!this.audioEnabled || !this.synth) {
        await this.initializeAudioContext();
      }
      
      if (!this.synth) {
        console.warn('Audio synth not available');
        return;
      }
      
      const pentatonic = [0, 2, 4, 7, 9]; // C, D, E, G, A
      const baseFreq = 261.63; // C4
      const noteIndex = colorIndex % pentatonic.length;
      const semitones = pentatonic[noteIndex];
      const frequency = baseFreq * Math.pow(2, semitones / 12);
      
      // Use Tone.now() to schedule notes properly and avoid timing conflicts
      const now = Tone.now();
      this.synth.triggerAttackRelease(frequency, "8n", now);
      
      // Visual feedback on color palette with moderate duration for manual clicks
      const colorNotes = this.elements.colorGrid.querySelectorAll('.color-note');
      if (colorNotes[colorIndex]) {
        colorNotes[colorIndex].classList.add('playing');
        setTimeout(() => {
          colorNotes[colorIndex].classList.remove('playing');
        }, 400); // Moderate duration for manual clicks
      }
    } catch (error) {
      console.error('Error playing color note:', error);
    }
  }

  // Get contrast color for text
  getContrastColor(r, g, b) {
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
  
  // Bind events for all interactive elements
  bindEvents() {
    // Banner speed control
    this.elements.bannerSpeedSlider.addEventListener('input', (e) => {
      this.bannerSpeed = parseFloat(e.target.value);
      this.updateSpeedDisplay();
      this.updateMandalaRotations();
      
      // Also ensure the main mandala rotation is updated
      setTimeout(() => {
        this.updateSelectedMandalaRotation();
      }, 10);
    });
    
    // Aspiral play button
    this.elements.aspiralPlayBtn.addEventListener('click', () => {
      this.playAspiralAnimation();
    });
    
    // Aspiral speed control
    this.elements.aspiralSpeedSlider.addEventListener('input', (e) => {
      this.aspiralAnimationSpeed = parseFloat(e.target.value);
      this.updateAspiralSpeedLabel();
    });
    
    // Initialize aspiral speed label
    this.updateAspiralSpeedLabel();
  }

  // Update aspiral speed label dynamically
  updateAspiralSpeedLabel() {
    if (this.elements.aspiralSpeedLabel) {
      this.elements.aspiralSpeedLabel.textContent = `Speed: ${this.aspiralAnimationSpeed.toFixed(2)}`;
    }
  }
  
  // Update individual mandala rotations in the panel
  updateMandalaRotations() {
    const bannerMandalas = this.elements.mandalaCarousel.querySelectorAll('.banner-mandala');
    const normalizedSpeed = this.getNormalizedSpeed();
    
    bannerMandalas.forEach((mandala, index) => {
      if (Math.abs(normalizedSpeed) > 0) {
        const duration = Math.abs(10 / normalizedSpeed); // 10 seconds for 1.0x speed
        const direction = normalizedSpeed >= 0 ? 'rotate-mandala' : 'rotate-mandala-reverse';
        
        mandala.style.animation = `${direction} ${duration}s linear infinite`;
      } else {
        mandala.style.animation = 'none';
      }
    });
  }
  
  // Stop all animations and cleanup
  stop() {
    this.stopAspiralAnimation();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (playgroundApp) {
    switch(e.key) {
      case ' ':
        e.preventDefault();
        playgroundApp.playAspiralAnimation();
        break;
      case 'ArrowLeft':
        const prevIndex = (playgroundApp.selectedMandalaIndex - 1 + playgroundApp.mandalas.length) % playgroundApp.mandalas.length;
        playgroundApp.selectMandala(prevIndex);
        break;
      case 'ArrowRight':
        const nextIndex = (playgroundApp.selectedMandalaIndex + 1) % playgroundApp.mandalas.length;
        playgroundApp.selectMandala(nextIndex);
        break;
      case 'r':
        const randomIndex = Math.floor(Math.random() * playgroundApp.mandalas.length);
        playgroundApp.selectMandala(randomIndex);
        break;
    }
  }
});
