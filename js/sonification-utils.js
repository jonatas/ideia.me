/**
 * Sonification Utilities
 * Common functions for audio-visual sonification projects
 * Requires Tone.js for Web Audio functionality
 */

window.SonificationUtils = (function() {
  'use strict';

  // Private variables
  let audioContext = null;
  let isAudioEnabled = false;

  // Color-to-frequency mapping constants
  const BASE_FREQUENCY = 261.63; // C4
  const SEMITONE_RATIO = Math.pow(2, 1/12);
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  /**
   * Initialize audio context and ensure it's running
   */
  async function enableAudioContext() {
    try {
      if (window.Tone && window.Tone.context.state !== 'running') {
        await window.Tone.start();
        audioContext = window.Tone.context;
        isAudioEnabled = true;
        console.log('Audio context enabled');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable audio context:', error);
      return false;
    }
  }

  /**
   * Convert RGB color values to musical frequency
   * Uses HSV color space for intuitive mapping
   * @param {Array} rgb - Array of [r, g, b] values (0-255)
   * @returns {number} Frequency in Hz
   */
  function colorToFrequency(rgb) {
    const [r, g, b] = rgb.map(val => Math.max(0, Math.min(255, val)));
    
    // Convert RGB to HSV
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let hue = 0;
    if (diff !== 0) {
      if (max === r) hue = ((g - b) / diff) % 6;
      else if (max === g) hue = (b - r) / diff + 2;
      else hue = (r - g) / diff + 4;
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
    
    const saturation = max === 0 ? 0 : diff / max;
    const value = max / 255;
    
    // Map hue to chromatic scale (0-360° -> 0-12 semitones)
    const noteOffset = Math.floor((hue / 360) * 12);
    
    // Map value (brightness) to octave (2 octaves range)
    const octaveOffset = Math.floor(value * 24);
    
    // Calculate final frequency
    const frequency = BASE_FREQUENCY * Math.pow(SEMITONE_RATIO, noteOffset + octaveOffset);
    
    // Clamp to audible range
    return Math.max(80, Math.min(2000, frequency));
  }

  /**
   * Convert frequency to musical note name
   * @param {number} frequency - Frequency in Hz
   * @returns {string} Note name (e.g., "C4", "A#3")
   */
  function frequencyToNote(frequency) {
    const A4 = 440;
    const semitones = Math.round(12 * Math.log2(frequency / A4)) + 69;
    const octave = Math.floor(semitones / 12) - 1;
    const note = NOTE_NAMES[((semitones % 12) + 12) % 12];
    return `${note}${octave}`;
  }

  /**
   * Extract dominant colors from an image element
   * @param {HTMLImageElement} imageElement - Image to analyze
   * @param {number} colorCount - Number of colors to extract (default: 8)
   * @returns {Array} Array of [r, g, b] color arrays
   */
  function extractImageColors(imageElement, colorCount = 8) {
    try {
      if (window.ColorThief) {
        const colorThief = new ColorThief();
        
        if (imageElement.complete) {
          return colorThief.getPalette(imageElement, colorCount);
        } else {
          console.warn('Image not loaded yet');
          return generateDefaultPalette(colorCount);
        }
      } else {
        console.warn('ColorThief library not available, using default palette');
        return generateDefaultPalette(colorCount);
      }
    } catch (error) {
      console.error('Error extracting colors:', error);
      return generateDefaultPalette(colorCount);
    }
  }

  /**
   * Generate a default color palette
   * @param {number} count - Number of colors to generate
   * @returns {Array} Array of [r, g, b] color arrays
   */
  function generateDefaultPalette(count = 8) {
    const colors = [];
    const hueStep = 360 / count;
    
    for (let i = 0; i < count; i++) {
      const hue = i * hueStep;
      const rgb = hslToRgb(hue / 360, 0.7, 0.6);
      colors.push(rgb);
    }
    
    return colors;
  }

  /**
   * Convert HSL to RGB
   * @param {number} h - Hue (0-1)
   * @param {number} s - Saturation (0-1)
   * @param {number} l - Lightness (0-1)
   * @returns {Array} [r, g, b] values (0-255)
   */
  function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  /**
   * Create a palette mapping colors to musical properties
   * @param {Array} colors - Array of [r, g, b] color arrays
   * @returns {Array} Array of palette objects with color, frequency, and note
   */
  function createMusicalPalette(colors) {
    return colors.map((color, index) => ({
      color: color,
      frequency: colorToFrequency(color),
      note: frequencyToNote(colorToFrequency(color)),
      index: index
    }));
  }

  /**
   * Apply color palette to piano keys
   * @param {Array} palette - Musical palette from createMusicalPalette
   * @param {NodeList} keyElements - Piano key DOM elements
   */
  function applyPaletteToKeys(palette, keyElements) {
    palette.forEach((item, index) => {
      if (index < keyElements.length) {
        const key = keyElements[index];
        const rgb = `rgb(${item.color.join(',')})`;
        
        // Apply gradient background
        key.style.background = `linear-gradient(145deg, ${rgb}, ${darkenColor(rgb, 0.2)})`;
        key.style.borderColor = darkenColor(rgb, 0.3);
        
        // Update note display
        const noteElement = key.querySelector('.key-note');
        if (noteElement) {
          noteElement.textContent = item.note;
          noteElement.style.color = getContrastColor(rgb);
        }
        
        // Store frequency for audio playback
        key.dataset.frequency = item.frequency;
        key.dataset.note = item.note;
      }
    });
  }

  /**
   * Get contrasting text color for a background color
   * @param {string} rgb - RGB color string
   * @returns {string} Contrasting color ('#000' or '#fff')
   */
  function getContrastColor(rgb) {
    const match = rgb.match(/\d+/g);
    if (!match) return '#2c3e50';
    
    const [r, g, b] = match.map(x => parseInt(x));
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '#2c3e50' : '#ecf0f1';
  }

  /**
   * Darken a color by a given factor
   * @param {string} rgb - RGB color string
   * @param {number} factor - Darkening factor (0-1)
   * @returns {string} Darkened RGB color string
   */
  function darkenColor(rgb, factor) {
    const match = rgb.match(/\d+/g);
    if (!match) return rgb;
    
    const [r, g, b] = match.map(x => parseInt(x));
    const newR = Math.floor(r * (1 - factor));
    const newG = Math.floor(g * (1 - factor));
    const newB = Math.floor(b * (1 - factor));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  }

  /**
   * Add audio enable notice to a container
   * @param {string} containerId - ID of container element
   */
  function addAudioNotice(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const notice = document.createElement('div');
    notice.className = 'audio-notice';
    notice.innerHTML = '🔊 Click anywhere to enable audio';
    notice.style.cursor = 'pointer';
    
    notice.addEventListener('click', async () => {
      const enabled = await enableAudioContext();
      if (enabled) {
        notice.style.display = 'none';
        // Dispatch custom event
        container.dispatchEvent(new CustomEvent('audioEnabled'));
      }
    });
    
    container.insertBefore(notice, container.firstChild);
    return notice;
  }

  /**
   * Create a simple synthesizer using Tone.js
   * @param {string} type - Synthesizer type ('sine', 'triangle', 'square', 'sawtooth')
   * @returns {Object} Tone.js synthesizer instance
   */
  function createSynth(type = 'sine') {
    if (!window.Tone) {
      console.error('Tone.js not available');
      return null;
    }
    
    const synthOptions = {
      sine: {
        oscillator: { type: "sine" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 2 }
      },
      triangle: {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.1, decay: 0.3, sustain: 0.3, release: 1 }
      },
      square: {
        oscillator: { type: "square" },
        envelope: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.1 }
      },
      sawtooth: {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1.5 }
      }
    };
    
    const options = synthOptions[type] || synthOptions.sine;
    return new window.Tone.PolySynth(window.Tone.Synth, options).toDestination();
  }

  /**
   * Play a note with a synthesizer
   * @param {Object} synth - Tone.js synthesizer instance
   * @param {number|string} note - Frequency in Hz or note name
   * @param {string} duration - Note duration (Tone.js format)
   * @param {number} velocity - Note velocity (0-1)
   */
  function playNote(synth, note, duration = "8n", velocity = 0.8) {
    if (!synth || !isAudioEnabled) return;
    
    try {
      synth.triggerAttackRelease(note, duration, undefined, velocity);
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }

  /**
   * Create a rotary knob controller
   * @param {HTMLElement} knobElement - Knob DOM element
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} initialValue - Initial value
   * @param {Function} callback - Callback function for value changes
   */
  function createKnobController(knobElement, min, max, initialValue, callback) {
    let isDragging = false;
    let startY = 0;
    let startValue = initialValue;

    const updateKnobRotation = (value) => {
      const percentage = (value - min) / (max - min);
      const rotation = percentage * 270 - 135; // -135 to +135 degrees
      knobElement.style.transform = `rotate(${rotation}deg)`;
    };

    // Initialize knob position
    updateKnobRotation(initialValue);

    knobElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.clientY;
      startValue = initialValue;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY; // Inverted for natural feel
      const sensitivity = (max - min) / 200; // Adjust sensitivity
      const newValue = Math.max(min, Math.min(max, startValue + deltaY * sensitivity));
      
      updateKnobRotation(newValue);
      if (callback) callback(Math.round(newValue));
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
      }
    });

    return {
      setValue: (value) => {
        initialValue = value;
        updateKnobRotation(value);
      },
      getValue: () => initialValue
    };
  }

  /**
   * Sample pixel color from a canvas at given coordinates
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Array} [r, g, b] color array or null if failed
   */
  function samplePixelColor(canvas, x, y) {
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(x, y, 1, 1);
      const data = imageData.data;
      return [data[0], data[1], data[2]];
    } catch (error) {
      console.error('Error sampling pixel color:', error);
      return null;
    }
  }

  /**
   * Create a responsive canvas that maintains aspect ratio
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} aspectRatio - Desired aspect ratio (width/height)
   */
  function makeCanvasResponsive(canvas, aspectRatio = 1) {
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      let canvasWidth, canvasHeight;
      
      if (containerWidth / containerHeight > aspectRatio) {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * aspectRatio;
      } else {
        canvasWidth = containerWidth;
        canvasHeight = canvasWidth / aspectRatio;
      }
      
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    return resizeCanvas;
  }

  /**
   * Debounce function to limit rapid function calls
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Log sonification events for debugging
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  function logSonificationEvent(event, data = {}) {
    if (console.groupCollapsed) {
      console.groupCollapsed(`🎵 Sonification: ${event}`);
      console.log('Event:', event);
      console.log('Data:', data);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    } else {
      console.log(`🎵 Sonification: ${event}`, data);
    }
  }

  // Public API
  return {
    // Audio management
    enableAudioContext,
    isAudioEnabled: () => isAudioEnabled,
    
    // Color-to-sound mapping
    colorToFrequency,
    frequencyToNote,
    extractImageColors,
    generateDefaultPalette,
    createMusicalPalette,
    
    // Visual utilities
    applyPaletteToKeys,
    getContrastColor,
    darkenColor,
    samplePixelColor,
    makeCanvasResponsive,
    
    // UI components
    addAudioNotice,
    createKnobController,
    
    // Audio synthesis
    createSynth,
    playNote,
    
    // Utilities
    debounce,
    logSonificationEvent,
    
    // Constants
    BASE_FREQUENCY,
    NOTE_NAMES
  };
})();

// Auto-enable audio context on first user interaction
document.addEventListener('DOMContentLoaded', function() {
  let audioEnabled = false;
  
  const enableAudio = async function() {
    if (!audioEnabled) {
      audioEnabled = await window.SonificationUtils.enableAudioContext();
      if (audioEnabled) {
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('keydown', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
      }
    }
  };
  
  // Listen for various interaction types
  document.addEventListener('click', enableAudio);
  document.addEventListener('keydown', enableAudio);
  document.addEventListener('touchstart', enableAudio);
});
