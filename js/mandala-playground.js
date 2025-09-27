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
    
    // Auto-select and load the first mandala after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.selectMandala(0);
    }, 100);
  }

  generateMandalaList() {
    const mandalas = [];
    // Normalized list of actually available mandala files (updated and verified)
    const mandalaFiles = [
      // Folder 1 mandalas (01-41, normalized)
      '01.png', '02.png', '03.png', '04.png', '05.png', '06.png', '07.png', '08.png', '09.png', '10.png',
      '11.png', '12.png', '13.png', '14.png', '15.png', '16.png', '17.png', '18.png', '19.png', '20.png',
      '21.png', '22.png', '23.png', '24.png', '25.png', '26.png', '28.png', '30.png', '31.png', '32.png',
      '33.png', '34.png', '35.png', '36.png', '37.png', '38.png', '39.png', '40.png', '41.png',
      
      // Folder 2 mandalas (curated selection)
      '201.png', '202.png', '204.png', '205.png', '206.png', '207.png', '208.png', '209.png', '210.png',
      '211.png', '212.png', '214.png', '215.png', '216.png', '217.png', '218.png', '219.png', '220.png',
      '221.png', '222.png', '223.png', '224.png', '225.png', '226.png', '227.png', '228.png', '229.png',
      '230.png', '231.png', '232.png', '233.png', '234.png', '235.png', '236.png',
      
      // Folder 3 mandalas (complete set)
      '301.png', '302.png', '303.png', '304.png', '305.png', '306.png', '307.png', '308.png', '309.png', '310.png',
      '311.png', '312.png', '313.png', '314.png', '315.png', '316.png', '317.png', '318.png', '319.png', '320.png',
      '321.png', '322.png', '323.png', '324.png', '325.png', '326.png', '327.png', '328.png', '329.png', '330.png', '331.png',
      
      // Folder 4 mandalas (curated selection)
      '401.png', '402.png', '403.png', '404.png', '405.png', '406.png', '408.png', '410.png', '412.png',
      '413.png', '414.png', '415.png', '416.png', '417.png', '419.png', '420.png', '422.png', '423.png',
      '425.png', '426.png', '429.png', '435.png', '441.png', '442.png', '444.png',
      
      // Folder 5 mandalas (curated selection)
      '501.png', '502.png', '503.png', '504.png', '506.png', '507.png', '508.png', '509.png', '510.png',
      '511.png', '512.png', '513.png', '514.png', '515.png', '516.png', '520.png', '521.png', '523.png', '524.png', '525.png',
      
      // Folder 6 mandalas (curated selection)
      '602.png', '603.png', '604.png', '605.png', '606.png', '607.png', '610.png', '612.png', '613.png',
      '614.png', '615.png', '616.png', '617.png', '618.png',
      
      // Folder 7 mandalas (curated selection)
      '701.png', '703.png', '704.png', '705.png', '706.png', '707.png', '708.png', '710.png', '711.png',
      '712.png', '713.png', '714.png', '716.png', '717.png', '718.png', '719.png', '720.png', '721.png',
      '722.png', '723.png', '724.png', '725.png', '726.png', '727.png', '728.png', '729.png',
      
      // Folder 8 mandala
      '801.png',
      
      // Folder 9 mandalas (curated selection)
      '901.png', '902.png', '903.png', '905.png', '906.png', '907.png', '908.png', '909.png'
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
      // Debug mode: Force iOS behavior for testing on desktop
      const forceIOSMode = window.location.search.includes('debug=ios');
      const actuallyIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOS = actuallyIOS || forceIOSMode;
      
      console.log('Initializing audio context...', {
        toneAvailable: !!window.Tone,
        contextState: window.Tone ? Tone.context.state : 'N/A',
        userAgent: navigator.userAgent,
        actuallyIOS: actuallyIOS,
        forceIOSMode: forceIOSMode,
        isIOS: isIOS
      });
      
      if (!window.Tone) {
        console.error('Tone.js is not loaded');
        return false;
      }
      
      // Enhanced iOS audio context initialization  
      // (isIOS already defined above with debug mode support)
      
      if (Tone.context.state !== 'running') {
        console.log('Starting Tone.js context...');
        await Tone.start();
        
        // For iOS, wait a bit longer to ensure context is fully initialized
        if (isIOS) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('Tone.js context state after start:', Tone.context.state);
      }
      
      // Ensure context is actually running before proceeding
      if (Tone.context.state !== 'running') {
        console.warn('Audio context is not in running state:', Tone.context.state);
        return false;
      }
      
      // Create synth with iOS-optimized settings
      if (!this.synth) {
        console.log('Creating synthesizer...');
        this.synth = new Tone.Synth({
          oscillator: { 
            type: "sine",
            // iOS optimization: simpler oscillator
            modulationFrequency: isIOS ? 0 : 0.5
          },
          envelope: { 
            attack: isIOS ? 0.01 : 0.02,  // Faster attack on iOS
            decay: isIOS ? 0.05 : 0.1,    // Shorter decay on iOS
            sustain: isIOS ? 0.2 : 0.3,   // Lower sustain on iOS
            release: isIOS ? 0.4 : 0.8    // Shorter release on iOS
          }
        }).toDestination();
        
        console.log('Synthesizer created successfully');
      }
      
      // Test the synth with a silent note for iOS compatibility
      if (isIOS && this.synth) {
        try {
          console.log('Testing audio with silent note...');
          this.synth.triggerAttackRelease(440, "32n", undefined, 0.001);
          await new Promise(resolve => setTimeout(resolve, 50));
          console.log('Silent test note completed');
        } catch (testError) {
          console.warn('Silent test note failed:', testError);
        }
      }
      
      this.audioEnabled = true;
      console.log('Audio context initialization successful');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      this.audioEnabled = false;
      return false;
    }
  }

  initializeElements() {
    this.elements = {
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
    
    // Detect if this is likely an iPhone/mobile device (with debug mode support)
    const forceIOSMode = window.location.search.includes('debug=ios');
    const actuallyIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIOS = actuallyIOS || forceIOSMode;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || forceIOSMode;
    
    // Enhanced message for iPhone users
    let message = '🔊 Click anywhere to enable audio for the mandala sonification';
    if (isIOS) {
      message = '🔊 TAP HERE to enable audio for iPhone/iPad - May require multiple taps';
    } else if (isMobile) {
      message = '🔊 TAP HERE to enable audio for mobile device';
    }
    
    notice.innerHTML = message;
    notice.style.cssText = `
      position: fixed;
      top: ${isIOS || isMobile ? '10px' : '70px'};
      ${isIOS || isMobile ? 'left: 50%; transform: translateX(-50%);' : 'right: 20px;'}
      background: rgba(26, 188, 156, 0.95);
      color: white;
      padding: ${isIOS || isMobile ? '20px 30px' : '15px 25px'};
      border-radius: 10px;
      font-weight: bold;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      transition: all 0.3s ease;
      font-family: inherit;
      font-size: ${isIOS || isMobile ? '16px' : '14px'};
      max-width: ${isIOS || isMobile ? '90vw' : '300px'};
      line-height: 1.4;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(5px);
      opacity: 1;
      visibility: visible;
      display: block;
      pointer-events: auto;
      text-align: center;
    `;
    
    // Enhanced interaction handlers for mobile
    const enableAudio = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Audio notice clicked/touched');
      
      try {
        // For iOS, try multiple approaches
        if (isIOS && window.Tone) {
          await Tone.start();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const success = await this.initializeAudioContext();
        console.log('Audio initialization result:', success);
        
        if (success) {
          notice.style.opacity = '0';
          notice.style.transform = 'scale(0.8)';
          setTimeout(() => {
            if (notice.parentElement) {
              notice.remove();
            }
          }, 300);
        } else if (isIOS) {
          // Show a different message for iOS if first attempt fails
          notice.innerHTML = '🔊 PLEASE TAP AGAIN - iPhone requires multiple interactions for audio';
          notice.style.background = 'rgba(231, 76, 60, 0.95)';
        }
      } catch (error) {
        console.error('Audio enable error:', error);
        if (isIOS) {
          notice.innerHTML = '🔊 TAP AGAIN - Audio setup in progress...';
          notice.style.background = 'rgba(243, 156, 18, 0.95)';
        }
      }
    };
    
    // Add multiple event listeners for better mobile compatibility
    notice.addEventListener('click', enableAudio);
    notice.addEventListener('touchstart', enableAudio, { passive: false });
    notice.addEventListener('touchend', enableAudio, { passive: false });
    
    // Add hover effect for desktop
    if (!isMobile) {
      notice.addEventListener('mouseenter', () => {
        notice.style.transform = 'scale(1.05)';
        notice.style.background = 'rgba(26, 188, 156, 1)';
      });
      
      notice.addEventListener('mouseleave', () => {
        notice.style.transform = 'scale(1)';
        notice.style.background = 'rgba(26, 188, 156, 0.95)';
      });
    }
    
    // Append to body and ensure it's visible
    document.body.appendChild(notice);
    
    // Force a reflow and ensure visibility
    setTimeout(() => {
      notice.style.opacity = '1';
      notice.style.visibility = 'visible';
      notice.style.display = 'block';
      console.log('Audio notice visibility set for device type:', { isIOS, isMobile });
    }, 100);
    
    console.log('Audio notice added to DOM');
  }

  // Create simple mandala grid - append directly to body
  createMandalaCarousel() {
    // Clear any existing mandalas first
    const existingMandalas = document.querySelectorAll('.banner-mandala');
    existingMandalas.forEach(el => el.remove());
    
    // Create a container div for all mandalas
    const mandalaContainer = document.createElement('div');
    mandalaContainer.className = 'mandala-grid-container';
    mandalaContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      margin: 0;
      padding: 0;
    `;
    
    // Append all mandalas to the container
    this.mandalas.forEach((mandala, index) => {
      const mandalaElement = document.createElement('img');
      mandalaElement.className = 'banner-mandala';
      mandalaElement.crossOrigin = 'anonymous';
      mandalaElement.src = `/images/mandalas/mini/${mandala.filename}`;
      mandalaElement.alt = `Mandala ${mandala.number}`;
      
      if (index === this.selectedMandalaIndex) {
        mandalaElement.classList.add('selected');
      }
      
      mandalaElement.addEventListener('click', () => {
        this.selectMandala(index);
      });
      
      mandalaElement.addEventListener('error', (error) => {
        console.error('Failed to load banner mandala:', mandala.path);
      });
      
      mandalaContainer.appendChild(mandalaElement);
    });
    
    // Insert at the very beginning of the body
    document.body.insertBefore(mandalaContainer, document.body.firstChild);
  }
  
  // Simple layout - no complex positioning needed
  
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
    // Update banner selection from dynamically created elements
    const bannerMandalas = document.querySelectorAll('.banner-mandala');
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
      // Enhanced audio checking for iPhone compatibility
      if (!this.audioEnabled || !this.synth || !window.Tone || Tone.context.state !== 'running') {
        console.log('Audio not ready, attempting to initialize...', {
          audioEnabled: this.audioEnabled,
          synthExists: !!this.synth,
          toneExists: !!window.Tone,
          contextState: window.Tone ? Tone.context.state : 'N/A'
        });
        
        const success = await this.initializeAudioContext();
        if (!success) {
          console.warn('Audio initialization failed, cannot play note');
          return;
        }
      }
      
      if (!this.synth) {
        console.warn('Audio synth not available after initialization');
        return;
      }
      
      const pentatonic = [0, 2, 4, 7, 9]; // C, D, E, G, A
      const baseFreq = 261.63; // C4
      const noteIndex = colorIndex % pentatonic.length;
      const semitones = pentatonic[noteIndex];
      const frequency = baseFreq * Math.pow(2, semitones / 12);
      
      console.log(`Playing note: colorIndex=${colorIndex}, frequency=${frequency.toFixed(2)}Hz`);
      
      // Enhanced note triggering for iPhone compatibility
      try {
        // Use Tone.now() to schedule notes properly and avoid timing conflicts
        const now = Tone.now();
        const forceIOSMode = window.location.search.includes('debug=ios');
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || forceIOSMode;
        const duration = isIOS ? "16n" : "8n"; // Shorter notes on iOS for better reliability
        
        this.synth.triggerAttackRelease(frequency, duration, now);
        console.log('Note triggered successfully');
        
      } catch (audioError) {
        console.error('Audio playback failed:', audioError);
        // Try to reinitialize audio context
        this.audioEnabled = false;
        this.synth = null;
        return;
      }
      
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
      // Reset audio state on error
      this.audioEnabled = false;
      this.synth = null;
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
    const bannerMandalas = document.querySelectorAll('.banner-mandala');
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
