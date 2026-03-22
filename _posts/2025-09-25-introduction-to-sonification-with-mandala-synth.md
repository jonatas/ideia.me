---
title: "Introduction to Sonification with Mandala Synth"
layout: sonification
categories: ['sonification', 'technology', 'audio']
tags: ['javascript', 'web-audio', 'data-visualization', 'interactive', 'mandala', 'synthesizer']
description: "Explore the fascinating world of sonification through an interactive mandala synthesizer that transforms visual patterns into musical compositions using Web Audio API and color-to-sound mapping."
---

# Introduction to Sonification with Mandala Synth

Welcome to an exploration of **sonification** - the practice of using non-speech audio to convey information or perceptualize data. Today, I'm excited to share an interactive project that bridges the gap between visual art and auditory experience: the **Mandala Synth**.

This project represents a convergence of several passions: digital art, music synthesis, data visualization, and accessibility. By transforming the visual patterns of mandalas into musical compositions, we create a multi-sensory experience that demonstrates the fundamental principles of sonification.

## What is Sonification?

Sonification is the auditory equivalent of data visualization. While charts and graphs help us see patterns in data, sonification helps us *hear* them. This approach is particularly valuable for:

- **Accessibility**: Making visual information available to visually impaired users
- **Pattern Recognition**: Our auditory system excels at detecting patterns, rhythms, and anomalies
- **Multi-modal Analysis**: Combining visual and auditory channels for richer data exploration
- **Artistic Expression**: Creating aesthetic experiences from data and visual patterns

## The Mandala Synth Project

The Mandala Synth transforms circular mandala patterns into real-time musical compositions. Here's how it works:

### Core Concepts

1. **Color-to-Frequency Mapping**: Each color in the mandala corresponds to a specific musical frequency
2. **Spatial Navigation**: A magnifying lens scans across the image, sampling colors as it moves
3. **Real-time Synthesis**: Colors are instantly converted to musical notes using Web Audio API
4. **Interactive Control**: Users can control rotation speed, audio density, and instrument selection

### Technical Implementation

The system uses several key technologies:

- **Web Audio API** via [Tone.js](https://tonejs.github.io/) for real-time audio synthesis
- **Color Thief** for extracting dominant colors from mandala images
- **Canvas API** for pixel sampling and visual effects
- **HSV Color Space** for intuitive color-to-pitch mapping

## Interactive Demo: Spiral Sound Algorithm

This minimal demo demonstrates the core concepts from my 2012 audio experiments during art therapy studies:

<div id="mandala-demo" class="minimal-demo">
  <!-- Simple demo will be loaded here -->
</div>

## Core Concepts from 2012 Experiments

This minimal demo teaches three fundamental concepts I explored during my art therapy studies:

### 1. Simple Spiral Algorithm

The spiral moves through the mandala in a mathematical pattern, visiting different color regions in sequence. This creates a predictable yet organic path through the visual space:

```javascript
// Basic spiral movement
spiralAngle += 0.02 * speed;
for (let i = 0; i < 8; i++) {
  const angle = (i * Math.PI * 2) / 8 + spiralAngle;
  const x = centerX + Math.cos(angle) * radius * 0.7;
  const y = centerY + Math.sin(angle) * radius * 0.7;
}
```

See how it works in practice:

<canvas id="spiral-demo" width="420" height="150" style="border: 1px solid #1abc9c; border-radius: 8px; background: #2c3e50; display: block; margin: 10px auto;"></canvas>

<script>
// Simple spiral algorithm demonstration
document.addEventListener('DOMContentLoaded', function() {
  const spiralCanvas = document.getElementById('spiral-demo');
  if (!spiralCanvas) return;
  
  const spiralCtx = spiralCanvas.getContext('2d');
  let spiralTime = 0;
  
  function drawSpiral() {
    spiralCtx.clearRect(0, 0, 420, 150);
    
    // Draw the spiral path
    spiralCtx.strokeStyle = '#1abc9c';
    spiralCtx.lineWidth = 2;
    spiralCtx.beginPath();
    
    const centerX = 75;
    const centerY = 75;
    const maxRadius = 60;
    
    for (let angle = 0; angle <= spiralTime; angle += 0.1) {
      const radius = (angle / (Math.PI * 4)) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (angle === 0) {
        spiralCtx.moveTo(x, y);
      } else {
        spiralCtx.lineTo(x, y);
      }
    }
    spiralCtx.stroke();
    
    // Draw current position
    if (spiralTime > 0) {
      const currentRadius = (spiralTime / (Math.PI * 4)) * maxRadius;
      const currentX = centerX + currentRadius * Math.cos(spiralTime);
      const currentY = centerY + currentRadius * Math.sin(spiralTime);
      
      spiralCtx.fillStyle = '#e74c3c';
      spiralCtx.beginPath();
      spiralCtx.arc(currentX, currentY, 4, 0, Math.PI * 2);
      spiralCtx.fill();
    }
    
    // Show the mathematical formula
    spiralCtx.fillStyle = '#ecf0f1';
    spiralCtx.font = '12px monospace';
    spiralCtx.fillText('r = (θ / 4π) × maxRadius', 160, 30);
    spiralCtx.fillText('x = centerX + r × cos(θ)', 160, 50);
    spiralCtx.fillText('y = centerY + r × sin(θ)', 160, 70);
    spiralCtx.fillText(`θ = ${spiralTime.toFixed(2)} rad`, 160, 100);
    spiralCtx.fillText(`r = ${((spiralTime / (Math.PI * 4)) * maxRadius).toFixed(1)}px`, 160, 120);
    
    spiralTime += 0.05;
    if (spiralTime > Math.PI * 4) spiralTime = 0;
    
    setTimeout(() => requestAnimationFrame(drawSpiral), 100);
  }
  
  drawSpiral();
});
</script>

### 2. Sound-to-Note Theory

Colors map to musical frequencies using established harmonic relationships. Each color ring corresponds to different notes in the selected scale:

- **Pentatonic**: Traditional 5-note scale (C-D-E-G-A)
- **Major**: Happy, bright 7-note scale
- **Minor**: Melancholic, deeper 7-note scale  
- **Chromatic**: All 12 semitones for complex harmonies

### 3. Mandala Harmonic Patterns

The alternating colors in concentric rings create natural harmonic progressions. As the spiral moves through different color combinations, it generates musical relationships that mirror the visual symmetry of the mandala.

### 4. Distributed Scale Interpolation

Each mandala example uses **scale progression** - different musical scales are applied to different rings as the angle moves outward:

```javascript
// Example: Cosmic mandala progression
scaleProgression: ['chromatic', 'pentatonic', 'minor']

// Inner rings (0-33%) use chromatic (complex, all 12 notes)
// Middle rings (33-66%) use pentatonic (harmonious, 5 notes)  
// Outer rings (66-100%) use minor (melancholic, 7 notes)
```

This creates evolving harmonic textures as the spiral moves through different radial zones, mimicking how mandalas often have different symbolic meanings from center to edge.

## Mathematical Foundations of Music

Understanding the math behind the harmony helps appreciate why certain combinations sound pleasing:

### Frequency Relationships

Musical notes are based on **frequency ratios**. Each octave doubles the frequency:

```javascript
// Mathematical relationship: f₂ = f₁ × 2^(n/12)
// Where n = number of semitones
const frequency = baseFreq * Math.pow(2, semitones / 12);

// Examples:
// C4 = 261.63 Hz
// C5 = 261.63 × 2¹ = 523.26 Hz (one octave higher)
// G4 = 261.63 × 2^(7/12) = 392.00 Hz (perfect fifth)
```

### Scale Mathematics

Different scales use specific interval patterns (measured in semitones):

- **Pentatonic**: `[0, 2, 4, 7, 9]` - avoids dissonant half-steps
- **Major**: `[0, 2, 4, 5, 7, 9, 11]` - follows whole-whole-half pattern  
- **Minor**: `[0, 2, 3, 5, 7, 8, 10]` - lowered 3rd, 6th, and 7th degrees
- **Chromatic**: `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]` - all semitones

### Harmonic Ratios

Pleasant-sounding intervals have simple mathematical ratios:
- **Octave**: 2:1 ratio
- **Perfect Fifth**: 3:2 ratio  
- **Perfect Fourth**: 4:3 ratio
- **Major Third**: 5:4 ratio

### Rotation & Phase Mathematics

The mandala rotation creates **phase relationships** between visual and auditory patterns:

```javascript
// Rotation creates circular motion
x = centerX + radius × cos(angle + spiralAngle)
y = centerY + radius × sin(angle + spiralAngle)

// Where spiralAngle increases linearly with time
spiralAngle += angularVelocity × deltaTime
```

## How to Use the Mathematical Demo

1. **Enable Audio**: Click the audio notice to activate Web Audio
2. **Select Mandala Themes**: Click thumbnails to explore different mathematical progressions:
   - **🔷 Geometric**: Bright colors • pentatonic → major → pentatonic
   - **🌿 Natural**: Earth tones • minor → major → chromatic  
   - **🌌 Cosmic**: Cool blues • chromatic → pentatonic → minor
   - **🔥 Fire**: Warm colors • major → chromatic → major
3. **Understanding Rotation**: Adjust the **Rotation Speed** slider to see mathematical rotation in action
   - Watch how `cos(θ)` and `sin(θ)` create circular motion
   - RPM (Rotations Per Minute) controls angular velocity
4. **Color Mathematics**: Click the extracted color circles to hear frequency calculations
5. **Spiral Algorithm**: Control **Spiral Speed** to see how patterns traverse the mandala
6. **Combined Motion**: Start the spiral to hear both rotation and spiral mathematics working together

## The Magic of Color-Sound Relationships

The demo uses a simple but effective mapping:
- **Color position** determines the base note
- **Ring position** adds harmonic intervals
- **Combined patterns** create the musical phrases you hear

This approach mirrors how mandalas work visually - simple elements combining to create complex, harmonious patterns.

## Spiral Mandala Builder

Watch how the spiral algorithm can "steal" colors from the original mandala to create a new spiral representation:

<div style="display: flex; gap: 20px; justify-content: center; align-items: center; margin: 20px 0; flex-wrap: wrap;">
  <div style="text-align: center;">
    <div style="color: #1abc9c; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Original Mandala</div>
    <canvas id="source-mandala" width="200" height="200" style="border: 2px solid #1abc9c; border-radius: 50%; background: #2c3e50;"></canvas>
  </div>
  <div style="text-align: center;">
    <div style="color: #e74c3c; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Spiral Reconstruction</div>
    <canvas id="spiral-mandala" width="200" height="200" style="border: 2px solid #e74c3c; border-radius: 50%; background: #2c3e50;"></canvas>
  </div>
</div>

<div style="text-align: center; margin: 15px 0;">
  <button id="build-spiral" style="background: #1abc9c; border: none; border-radius: 4px; color: white; padding: 8px 16px; cursor: pointer; font-family: inherit; margin: 0 5px;">Build Spiral</button>
  <button id="clear-spiral" style="background: #e74c3c; border: none; border-radius: 4px; color: white; padding: 8px 16px; cursor: pointer; font-family: inherit; margin: 0 5px;">Clear</button>
  <button id="auto-build" style="background: #f39c12; border: none; border-radius: 4px; color: white; padding: 8px 16px; cursor: pointer; font-family: inherit; margin: 0 5px;">Auto Build</button>
</div>

<div id="spiral-info" style="text-align: center; color: #1abc9c; font-size: 14px; margin: 10px 0;">
  Click "Build Spiral" to see the algorithm in action
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const sourceCanvas = document.getElementById('source-mandala');
  const spiralCanvas = document.getElementById('spiral-mandala');
  const buildBtn = document.getElementById('build-spiral');
  const clearBtn = document.getElementById('clear-spiral');
  const autoBtn = document.getElementById('auto-build');
  const spiralInfo = document.getElementById('spiral-info');
  
  if (!sourceCanvas || !spiralCanvas) return;
  
  const sourceCtx = sourceCanvas.getContext('2d');
  const spiralCtx = spiralCanvas.getContext('2d');
  
  let isBuilding = false;
  let autoBuildInterval = null;
  let spiralPoints = [];
  
  // Create a reference mandala to sample from
  function createSourceMandala() {
    const centerX = 100;
    const centerY = 100;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    
    sourceCtx.clearRect(0, 0, 200, 200);
    
    // Draw concentric rings
    for (let ring = 0; ring < 6; ring++) {
      const radius = 15 + ring * 13;
      sourceCtx.fillStyle = colors[ring];
      sourceCtx.beginPath();
      sourceCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      sourceCtx.fill();
      
      // Add pattern elements
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const x = centerX + Math.cos(angle) * radius * 0.7;
        const y = centerY + Math.sin(angle) * radius * 0.7;
        
        sourceCtx.fillStyle = colors[(ring + i + 2) % colors.length];
        sourceCtx.beginPath();
        sourceCtx.arc(x, y, 3, 0, Math.PI * 2);
        sourceCtx.fill();
      }
    }
  }
  
  // Sample color from source mandala at given coordinates
  function sampleColor(x, y) {
    try {
      const imageData = sourceCtx.getImageData(x, y, 1, 1);
      const data = imageData.data;
      return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
    } catch (error) {
      return '#1abc9c'; // Fallback color
    }
  }
  
  // Build spiral mandala by sampling colors
  function buildSpiralMandala() {
    if (isBuilding) return;
    
    isBuilding = true;
    spiralPoints = [];
    spiralCtx.clearRect(0, 0, 200, 200);
    
    const centerX = 100;
    const centerY = 100;
    const maxRadius = 85;
    const totalSteps = 300;
    let currentStep = 0;
    
    function drawNextPoint() {
      if (currentStep >= totalSteps) {
        isBuilding = false;
        spiralInfo.textContent = `Spiral complete! ${totalSteps} pixels sampled and painted.`;
        return;
      }
      
      // Calculate spiral position
      const progress = currentStep / totalSteps;
      const angle = progress * Math.PI * 6; // 3 full rotations
      const radius = progress * maxRadius;
      
      // Position on source mandala
      const sourceX = 100 + radius * Math.cos(angle);
      const sourceY = 100 + radius * Math.sin(angle);
      
      // Position on spiral mandala
      const spiralX = centerX + radius * Math.cos(angle);
      const spiralY = centerY + radius * Math.sin(angle);
      
      // Sample color from source
      const color = sampleColor(Math.floor(sourceX), Math.floor(sourceY));
      
      // Paint point on spiral
      spiralCtx.fillStyle = color;
      spiralCtx.beginPath();
      spiralCtx.arc(spiralX, spiralY, 2, 0, Math.PI * 2);
      spiralCtx.fill();
      
      spiralPoints.push({ x: spiralX, y: spiralY, color, angle, radius });
      
      currentStep++;
      spiralInfo.textContent = `Building spiral... ${currentStep}/${totalSteps} points (${(progress * 100).toFixed(1)}%)`;
      
      // Continue building
      setTimeout(drawNextPoint, 20);
    }
    
    spiralInfo.textContent = 'Starting spiral construction...';
    drawNextPoint();
  }
  
  // Auto build with animation
  function startAutoBuild() {
    if (autoBuildInterval) {
      clearInterval(autoBuildInterval);
      autoBuildInterval = null;
      autoBtn.textContent = 'Auto Build';
      spiralInfo.textContent = 'Auto build stopped';
      return;
    }
    
    autoBtn.textContent = 'Stop Auto';
    autoBuildInterval = setInterval(() => {
      clearSpiral();
      setTimeout(buildSpiralMandala, 500);
    }, 4000);
    
    // Start first build
    buildSpiralMandala();
  }
  
  // Clear spiral canvas
  function clearSpiral() {
    spiralCtx.clearRect(0, 0, 200, 200);
    spiralPoints = [];
    spiralInfo.textContent = 'Spiral cleared. Ready to build new one.';
  }
  
  // Event listeners
  buildBtn.addEventListener('click', buildSpiralMandala);
  clearBtn.addEventListener('click', clearSpiral);
  autoBtn.addEventListener('click', startAutoBuild);
  
  // Initialize source mandala
  createSourceMandala();
  spiralInfo.textContent = 'Source mandala ready. Click "Build Spiral" to see the algorithm extract colors.';
});
</script>

### How the Spiral Builder Works

The spiral builder demonstrates a key concept in **algorithmic art** - how simple mathematical patterns can transform and reinterpret visual information:

```javascript
// 1. Calculate spiral position (Archimedean spiral)
const progress = currentStep / totalSteps;
const angle = progress * Math.PI * 6;        // 3 full rotations
const radius = progress * maxRadius;          // Linear radius growth

// 2. Sample color from source mandala
const sourceX = centerX + radius * Math.cos(angle);
const sourceY = centerY + radius * Math.sin(angle);
const color = sampleColor(sourceX, sourceY);

// 3. Paint sampled color at spiral position
const spiralX = centerX + radius * Math.cos(angle);
const spiralY = centerY + radius * Math.sin(angle);
spiralCtx.fillStyle = color;
spiralCtx.arc(spiralX, spiralY, 2, 0, Math.PI * 2);
```

**Key Concepts:**
- **Pixel Sampling**: Using `getImageData()` to read color values from canvas
- **Coordinate Transformation**: Converting polar (r, θ) to cartesian (x, y) coordinates  
- **Algorithmic Reconstruction**: Rebuilding images using mathematical patterns
- **Progressive Animation**: Building spirals step-by-step to show the process

This technique forms the foundation of many **generative art** and **data visualization** approaches, where algorithms traverse and reinterpret existing visual data.

## Advanced Aspiral Mandala Algorithm

Let's explore a more sophisticated algorithm that creates an **aspiral** (Archimedean spiral) trace through a real mandala image, sampling and inheriting the original pixel colors:

<div style="display: flex; gap: 20px; justify-content: center; align-items: center; margin: 30px 0; flex-wrap: wrap;">
  <div style="text-align: center;">
    <div style="color: #1abc9c; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Source Mandala</div>
    <canvas id="aspiral-source" width="250" height="250" style="border: 2px solid #1abc9c; border-radius: 50%; background: #2c3e50;"></canvas>
  </div>
  <div style="text-align: center;">
    <div style="color: #e74c3c; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Aspiral Reconstruction</div>
    <canvas id="aspiral-reconstruction" width="250" height="250" style="border: 2px solid #e74c3c; border-radius: 50%; background: #2c3e50;"></canvas>
  </div>
</div>

<div style="text-align: center; margin: 20px 0;">
  <button id="start-aspiral" style="background: #1abc9c; border: none; border-radius: 4px; color: white; padding: 10px 20px; cursor: pointer; font-family: inherit; margin: 0 5px;">Start Aspiral</button>
  <button id="clear-aspiral" style="background: #e74c3c; border: none; border-radius: 4px; color: white; padding: 10px 20px; cursor: pointer; font-family: inherit; margin: 0 5px;">Clear</button>
  <button id="auto-aspiral" style="background: #f39c12; border: none; border-radius: 4px; color: white; padding: 10px 20px; cursor: pointer; font-family: inherit; margin: 0 5px;">Auto Mode</button>
</div>

<div style="text-align: center; margin: 15px 0;">
  <label style="color: #1abc9c; margin-right: 10px;">Speed:</label>
  <input type="range" id="aspiral-speed" min="1" max="10" value="5" style="width: 150px; margin-right: 15px;">
  <label style="color: #1abc9c; margin-right: 10px;">Density:</label>
  <input type="range" id="aspiral-density" min="1" max="5" value="4" style="width: 150px;">
</div>

<div id="aspiral-info" style="text-align: center; color: #1abc9c; font-size: 14px; margin: 15px 0;">
  Click "Start Aspiral" to see the algorithm trace the mandala pixels
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const aspiralSource = document.getElementById('aspiral-source');
  const aspiralReconstruction = document.getElementById('aspiral-reconstruction');
  const startBtn = document.getElementById('start-aspiral');
  const clearBtn = document.getElementById('clear-aspiral');
  const autoBtn = document.getElementById('auto-aspiral');
  const speedSlider = document.getElementById('aspiral-speed');
  const densitySlider = document.getElementById('aspiral-density');
  const aspiralInfo = document.getElementById('aspiral-info');
  
  if (!aspiralSource || !aspiralReconstruction) return;
  
  const sourceCtx = aspiralSource.getContext('2d');
  const reconstructionCtx = aspiralReconstruction.getContext('2d');
  
  let isTracing = false;
  let autoMode = false;
  let autoInterval = null;
  let sourceImageData = null;
  
  // Load and draw the first mandala image
  function loadMandalaImage() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      // Clear and draw scaled image to fit canvas
      sourceCtx.clearRect(0, 0, 250, 250);
      
      // Calculate scaling to fit in circle while maintaining aspect ratio
      const size = Math.min(img.width, img.height);
      const scale = 200 / size; // Leave some padding
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (250 - scaledWidth) / 2;
      const offsetY = (250 - scaledHeight) / 2;
      
      sourceCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Store image data for pixel sampling
      sourceImageData = sourceCtx.getImageData(0, 0, 250, 250);
      
      aspiralInfo.textContent = 'Mandala loaded! Ready to trace aspiral pattern.';
    };
    img.onerror = function() {
      aspiralInfo.textContent = 'Error loading mandala image. Please check the image path.';
    };
    // Try loading the first mandala image
    img.src = '/images/mandalas/01b.png';
  }
  
  
  // Sample pixel color from source image
  function samplePixel(x, y) {
    if (!sourceImageData || x < 0 || x >= 250 || y < 0 || y >= 250) {
      return [0, 0, 0, 0]; // Transparent black
    }
    
    const index = (Math.floor(y) * 250 + Math.floor(x)) * 4;
    return [
      sourceImageData.data[index],     // R
      sourceImageData.data[index + 1], // G
      sourceImageData.data[index + 2], // B
      sourceImageData.data[index + 3]  // A
    ];
  }
  
  // Create aspiral trace
  function createAspiralTrace() {
    if (isTracing) return;
    
    isTracing = true;
    reconstructionCtx.clearRect(0, 0, 250, 250);
    
    const centerX = 125;
    const centerY = 125;
    const maxRadius = 110;
    const totalSteps = 5000; // Increased for 50 laps
    const speed = parseInt(speedSlider.value);
    const density = Math.max(1, parseInt(densitySlider.value));
    const stepDelay = Math.max(1, 15000 / totalSteps); // 15 seconds total duration
    
    let currentStep = 0;
    let sampledPixels = [];
    
    function traceNextPoint() {
      if (!isTracing || currentStep >= totalSteps) {
        isTracing = false;
        aspiralInfo.textContent = `Aspiral complete! ${sampledPixels.length} pixels traced and painted.`;
        return;
      }
      
      // Calculate aspiral position (Archimedean spiral: r = a + b*θ)
      const progress = currentStep / totalSteps;
      const theta = progress * Math.PI * 100; // 50 full rotations (50 laps)
      const radius = progress * maxRadius;
      
      // Position on source mandala
      const sourceX = centerX + radius * Math.cos(theta);
      const sourceY = centerY + radius * Math.sin(theta);
      
      // Sample color from source
      const [r, g, b, a] = samplePixel(sourceX, sourceY);
      
      // Only draw if pixel has some opacity
      if (a > 50) {
        // Draw on reconstruction canvas
        const spiralX = centerX + radius * Math.cos(theta);
        const spiralY = centerY + radius * Math.sin(theta);
        
        reconstructionCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        reconstructionCtx.beginPath();
        reconstructionCtx.arc(spiralX, spiralY, 1, 0, Math.PI * 2); // Always 1 pixel dot
        reconstructionCtx.fill();
        
        sampledPixels.push({ x: spiralX, y: spiralY, color: [r, g, b, a], theta, radius });
      }
      
      currentStep++;
      aspiralInfo.textContent = `Tracing aspiral... ${currentStep}/${totalSteps} points (${(progress * 100).toFixed(1)}%)`;
      
      // Continue tracing
      setTimeout(traceNextPoint, stepDelay);
    }
    
    aspiralInfo.textContent = 'Starting aspiral trace...';
    traceNextPoint();
  }
  
  // Clear reconstruction
  function clearReconstruction() {
    reconstructionCtx.clearRect(0, 0, 250, 250);
    aspiralInfo.textContent = 'Aspiral cleared. Ready for new trace.';
    isTracing = false;
  }
  
  // Auto mode
  function toggleAutoMode() {
    autoMode = !autoMode;
    
    if (autoMode) {
      autoBtn.textContent = 'Stop Auto';
      autoBtn.style.background = '#e74c3c';
      autoInterval = setInterval(() => {
        if (!isTracing) {
          clearReconstruction();
          setTimeout(createAspiralTrace, 500);
        }
      }, 8000);
      
      // Start first trace
      createAspiralTrace();
    } else {
      autoBtn.textContent = 'Auto Mode';
      autoBtn.style.background = '#f39c12';
      if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
      }
    }
  }
  
  // Event listeners
  startBtn.addEventListener('click', createAspiralTrace);
  clearBtn.addEventListener('click', clearReconstruction);
  autoBtn.addEventListener('click', toggleAutoMode);
  
  // Initialize
  loadMandalaImage();
});
</script>

### Mathematical Foundation of Aspiral Algorithm

The **aspiral** (Archimedean spiral) follows the mathematical formula:

```javascript
// Archimedean spiral: r = a + b*θ
const theta = progress * Math.PI * 100; // 50 full rotations (laps)
const radius = progress * maxRadius;    // Linear radius growth

// Polar to Cartesian conversion
const x = centerX + radius * Math.cos(theta);
const y = centerY + radius * Math.sin(theta);

// High-density sampling with 1-pixel precision
reconstructionCtx.arc(x, y, 1, 0, Math.PI * 2); // 1-pixel dots
```

**Key Algorithmic Concepts:**

1. **High-Density Progressive Sampling**: 5000 steps trace through 50 complete spiral laps
2. **Pixel-Perfect Color Inheritance**: Each pixel's RGBA values are preserved at 1-pixel precision
3. **Temporal Optimization**: Complete trace runs in exactly 15 seconds for optimal viewing
4. **Mathematical Precision**: 50 rotations provide comprehensive mandala coverage

**Applications:**
- **Image Analysis**: Understanding pixel distribution patterns
- **Data Visualization**: Converting 2D images to 1D sequential data
- **Artistic Reconstruction**: Creating new interpretations of existing images
- **Compression Studies**: Analyzing how much visual information is preserved

## Color Extraction and Musical Scales

Let's start by extracting a 12-color palette from the mandala and understanding how colors map to musical scales:

<div style="display: flex; gap: 20px; justify-content: center; align-items: flex-start; margin: 30px 0; flex-wrap: wrap;">
  <div style="text-align: center;">
    <div style="color: #1abc9c; font-size: 14px; font-weight: bold; margin-bottom: 10px;">Source Mandala</div>
    <canvas id="color-source" width="200" height="200" style="border: 2px solid #1abc9c; border-radius: 50%; background: #2c3e50;"></canvas>
  </div>
  <div style="text-align: center;">
    <div style="color: #e74c3c; font-size: 14px; font-weight: bold; margin-bottom: 10px;">Extracted Color Palette</div>
    <div id="color-palette" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; width: 280px;">
      <!-- Color circles will be populated here -->
    </div>
    <div style="margin-top: 15px;">
      <label style="color: #1abc9c; font-size: 14px; margin-bottom: 10px; display: block;">Musical Scales:</label>
      <div id="scale-selector" style="display: flex; flex-direction: column; gap: 8px;">
        <!-- Scale options will be populated with color circles -->
      </div>
    </div>
  </div>
</div>


<div id="color-info" style="text-align: center; color: #1abc9c; font-size: 14px; margin: 20px 0; min-height: 30px;">
Automatically extracting 12 dominant colors from the mandala...
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const sourceCanvas = document.getElementById('color-source');
  const colorPalette = document.getElementById('color-palette');
  const scaleSelector = document.getElementById('scale-selector');
  const colorInfo = document.getElementById('color-info');
  
  if (!sourceCanvas || !colorPalette) return;
  
  const ctx = sourceCanvas.getContext('2d');
  let synth = null;
  let extractedColors = [];
  let sourceImageData = null;
  let selectedScale = 'pentatonic';
  
  // Musical scales
  const scales = {
    major: [0, 2, 4, 5, 7, 9, 11],        // C D E F G A B
    minor: [0, 2, 3, 5, 7, 8, 10],        // C D Eb F G Ab Bb
    pentatonic: [0, 2, 4, 7, 9],          // C D E G A
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] // All semitones
  };
  
  const scaleDescriptions = {
    major: 'Major (Happy)',
    minor: 'Minor (Melancholic)', 
    pentatonic: 'Pentatonic (Harmonious)',
    chromatic: 'Chromatic (Complex)'
  };
  
  // Initialize audio
  async function initAudio() {
    if (window.Tone && !synth) {
      await Tone.start();
      synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 }
      }).toDestination();
    }
  }
  
  // Load mandala image
  function loadMandalaImage() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      // Clear and draw scaled image to fit canvas
      ctx.clearRect(0, 0, 200, 200);
      
      // Calculate scaling to fit in circle while maintaining aspect ratio
      const size = Math.min(img.width, img.height);
      const scale = 180 / size; // Leave some padding
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (200 - scaledWidth) / 2;
      const offsetY = (200 - scaledHeight) / 2;
      
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Store image data for color extraction
      sourceImageData = ctx.getImageData(0, 0, 200, 200);
      
      // Automatically extract colors
      extractColors();
    };
    img.onerror = function() {
      colorInfo.textContent = 'Error loading mandala image. Please check the image path.';
    };
    img.src = '/images/mandalas/01b.png';
  }
  
  // Extract dominant colors from the loaded mandala
  function extractColors() {
    if (!sourceImageData) {
      colorInfo.textContent = 'Please wait for mandala to load.';
      return;
    }
    
    colorInfo.textContent = 'Extracting colors from mandala...';
    
    if (window.ColorThief) {
      // Use ColorThief for better color extraction
      const colorThief = new ColorThief();
      try {
        // Extract colors directly from the canvas
        extractedColors = colorThief.getPalette(sourceCanvas, 12);
        
        // Ensure we got valid colors
        if (extractedColors && extractedColors.length >= 12) {
          displayColorPalette();
          return;
        }
      } catch (error) {
        console.log('ColorThief extraction failed, trying manual extraction:', error);
      }
    }
    
    // Manual extraction from canvas data as fallback
    extractedColors = sortColorsByHue(extractColorsFromImageData(sourceImageData));
    displayColorPalette();
  }
  
  // Manual color extraction from image data
  function extractColorsFromImageData(imageData) {
    const data = imageData.data;
    const colorCounts = {};
    const step = 4; // Sample every pixel (RGBA = 4 values per pixel)
    
    // Sample colors from the image
    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Skip transparent or very dark pixels
      if (a < 80 || (r + g + b) < 30) continue;
      
      // Less aggressive quantization for better color fidelity
      const qr = Math.round(r / 16) * 16;
      const qg = Math.round(g / 16) * 16;
      const qb = Math.round(b / 16) * 16;
      
      const colorKey = `${qr},${qg},${qb}`;
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }
    
    // Sort colors by frequency and take top 12
    const sortedColors = Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 12)
      .map(([color]) => color.split(',').map(Number));
    
    // Ensure we have 12 colors
    while (sortedColors.length < 12) {
      const hue = (sortedColors.length * 30) % 360; // Spread hues evenly
      const [r, g, b] = hslToRgb(hue, 70, 60);
      sortedColors.push([r, g, b]);
    }
    
    return sortedColors;
  }
  
  // Convert HSL to RGB
  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  
  // Convert RGB to HSL for sorting
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }
  
  // Sort colors by hue, then saturation, then lightness
  function sortColorsByHue(colors) {
    return colors.map(color => ({
      rgb: color,
      hsl: rgbToHsl(color[0], color[1], color[2])
    }))
    .sort((a, b) => {
      // Primary sort by hue
      if (Math.abs(a.hsl[0] - b.hsl[0]) > 10) {
        return a.hsl[0] - b.hsl[0];
      }
      // Secondary sort by saturation
      if (Math.abs(a.hsl[1] - b.hsl[1]) > 10) {
        return b.hsl[1] - a.hsl[1]; // Higher saturation first
      }
      // Tertiary sort by lightness
      return a.hsl[2] - b.hsl[2];
    })
    .map(item => item.rgb);
  }
  
  // Display color palette
  function displayColorPalette() {
    colorPalette.innerHTML = '';
    
    // Sort colors by hue for better visual organization
    extractedColors = sortColorsByHue(extractedColors);
    
    extractedColors.forEach((color, index) => {
      const [r, g, b] = color;
      const circle = document.createElement('div');
      circle.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgb(${r}, ${g}, ${b}) !important;
        cursor: pointer;
        border: 3px solid rgba(255, 255, 255, 0.8);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${(r + g + b) / 3 > 128 ? '#000' : '#fff'};
        font-size: 12px;
        font-weight: bold;
        margin: 5px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      `;
      
      circle.textContent = index + 1;
      circle.title = `Color ${index + 1}: rgb(${r}, ${g}, ${b})`;
      
      circle.addEventListener('click', async () => {
        await initAudio();
        playColorNote(index);
        
        // Visual feedback
        circle.style.transform = 'scale(1.3)';
        setTimeout(() => circle.style.transform = 'scale(1)', 200);
      });
      
      circle.addEventListener('mouseenter', () => {
        circle.style.transform = 'scale(1.1)';
        circle.style.borderColor = '#1abc9c';
      });
      
      circle.addEventListener('mouseleave', () => {
        circle.style.transform = 'scale(1)';
        circle.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      });
      
      colorPalette.appendChild(circle);
    });
    
    colorInfo.innerHTML = `
      <div>🎨 Extracted ${extractedColors.length} colors from mandala</div>
      <div>Click color circles to hear their musical notes</div>
    `;
    
    // Create visual scale selector
    createScaleSelector();
  }
  
  // Create visual scale selector with color circles
  function createScaleSelector() {
    scaleSelector.innerHTML = '';
    
    Object.keys(scales).forEach(scaleName => {
      const scaleRow = document.createElement('div');
      scaleRow.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid ${selectedScale === scaleName ? '#1abc9c' : 'transparent'};
        background: ${selectedScale === scaleName ? 'rgba(26, 188, 156, 0.1)' : 'transparent'};
      `;
      
      // Scale name label
      const scaleLabel = document.createElement('div');
      scaleLabel.style.cssText = `
        color: #1abc9c;
        font-size: 12px;
        font-weight: bold;
        width: 120px;
        text-align: left;
      `;
      scaleLabel.textContent = scaleDescriptions[scaleName];
      
      // Color circles for this scale
      const circlesContainer = document.createElement('div');
      circlesContainer.style.cssText = `
        display: flex;
        gap: 5px;
        margin-left: 10px;
        align-items: center;
      `;
      
      const currentScale = scales[scaleName];
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const isActive = selectedScale === scaleName;
      
      // Color theory mapping for musical notes (based on Newton's color wheel)
      const noteColors = {
        'C': '#FF0000',   // Red
        'C#': '#FF4000',  // Red-Orange
        'D': '#FF8000',   // Orange
        'D#': '#FFC000',  // Yellow-Orange
        'E': '#FFFF00',   // Yellow
        'F': '#80FF00',   // Yellow-Green
        'F#': '#00FF00',  // Green
        'G': '#00FF80',   // Blue-Green
        'G#': '#00FFFF',  // Cyan
        'A': '#0080FF',   // Blue
        'A#': '#4000FF',  // Blue-Violet
        'B': '#8000FF'    // Violet
      };
      
      // Show all 12 chromatic notes, highlighting only those in the current scale
      noteNames.forEach((noteName, chromaticIndex) => {
        const scaleIndex = currentScale.indexOf(chromaticIndex);
        const isInScale = scaleIndex !== -1;
        
        // Debug logging for troubleshooting (commented out for cleaner console)
        // console.log(`${scaleName} scale - Note ${noteName} (${chromaticIndex}): isInScale=${isInScale}, scaleIndex=${scaleIndex}`);
        
        const circle = document.createElement('div');
        
        let bgColor, textColor, border, opacity, cursor;
        const noteColor = noteColors[noteName];
        
        if (isInScale) {
          // Use music theory color for notes in the scale
          const brightness = isActive ? 1 : 0.8;
          bgColor = noteColor;
          textColor = '#000'; // Black text for better readability on colorful backgrounds
          border = isActive ? '#1abc9c' : 'rgba(255, 255, 255, 0.9)';
          opacity = brightness;
          cursor = 'pointer';
        } else {
          // Subdued appearance for notes not in the scale
          bgColor = 'rgba(45, 45, 45, 0.9)';
          textColor = 'rgba(200, 200, 200, 1)';
          border = 'rgba(120, 120, 120, 0.6)';
          opacity = 0.5;
          cursor = 'default';
        }
        circle.style.cssText = `
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: ${bgColor};
          border: 2px solid ${border};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${textColor};
          font-size: 12px;
          font-weight: bold;
          cursor: ${cursor};
          transition: all 0.2s ease;
          opacity: ${opacity};
        `;
        
        // Ensure the note name is always set
        circle.textContent = noteName;
        circle.setAttribute('data-note', noteName);
        circle.title = isInScale ? 
          `${noteName} - Note ${scaleIndex + 1} in ${scaleDescriptions[scaleName]} scale` : 
          `${noteName} - Not in ${scaleDescriptions[scaleName]} scale`;
        
        // Ensure text content is properly set
        if (!circle.textContent || circle.textContent === '') {
          circle.textContent = noteName; // Fallback to ensure note name is always displayed
        }
        
        // Click individual note (only if in scale)
        if (isInScale) {
          circle.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent scale selection
            await initAudio();
            playColorNote(scaleIndex);
            
            // Visual feedback
            circle.style.transform = 'scale(1.3)';
            setTimeout(() => circle.style.transform = 'scale(1)', 150);
          });
        }
        
        circlesContainer.appendChild(circle);
      });
      
      scaleRow.appendChild(scaleLabel);
      scaleRow.appendChild(circlesContainer);
      
      // Click handler to select and play scale
      scaleRow.addEventListener('click', async () => {
        selectedScale = scaleName;
        createScaleSelector(); // Refresh to show selection
        
        // Automatically play the specific scale
        await initAudio();
        await playSpecificScale(scaleName);
      });
      
      // Hover effects
      scaleRow.addEventListener('mouseenter', () => {
        if (selectedScale !== scaleName) {
          scaleRow.style.background = 'rgba(26, 188, 156, 0.05)';
          scaleRow.style.borderColor = 'rgba(26, 188, 156, 0.3)';
        }
      });
      
      scaleRow.addEventListener('mouseleave', () => {
        if (selectedScale !== scaleName) {
          scaleRow.style.background = 'transparent';
          scaleRow.style.borderColor = 'transparent';
        }
      });
      
      scaleSelector.appendChild(scaleRow);
    });
  }
  
  // Convert color index to frequency based on selected scale
  function colorToFrequency(colorIndex) {
    const currentScale = scales[selectedScale];
    const baseFreq = 261.63; // C4
    
    // Map color index to scale note
    const noteIndex = colorIndex % currentScale.length;
    const semitones = currentScale[noteIndex];
    
    return baseFreq * Math.pow(2, semitones / 12);
  }
  
  // Play note for specific color
  function playColorNote(colorIndex) {
    if (!synth) return;
    
    const frequency = colorToFrequency(colorIndex);
    synth.triggerAttackRelease(frequency, "4n");
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const currentScale = scales[selectedScale];
    const noteIndex = colorIndex % currentScale.length;
    const noteName = noteNames[currentScale[noteIndex]];
    
    colorInfo.innerHTML = `
      <div>🎵 Playing Color ${colorIndex + 1}: ${noteName}4 (${Math.round(frequency)}Hz)</div>
      <div>Scale: ${scaleDescriptions[selectedScale]}</div>
    `;
  }
  
  // Play entire scale (legacy function)
  async function playScale() {
    await playSpecificScale(selectedScale);
  }
  
  // Play specific scale by name
  async function playSpecificScale(scaleName) {
    await initAudio();
    if (!synth) return;
    
    const currentScale = scales[scaleName];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Playing scale: currentScale.map(note => noteNames[note]).join(' - ')
    
    colorInfo.innerHTML = `
      <div>🎵 Playing ${scaleDescriptions[scaleName]} scale...</div>
      <div>${currentScale.map(note => noteNames[note]).join(' - ')}</div>
    `;
    
    // Play each note in the scale with visual feedback
    currentScale.forEach((semitone, index) => {
      setTimeout(() => {
        const frequency = 261.63 * Math.pow(2, semitone / 12);
        const noteName = noteNames[semitone];
        synth.triggerAttackRelease(frequency, "4n");
        
        // Highlight the corresponding note circle in the scale selector
        const scaleRows = scaleSelector.querySelectorAll('div[style*="display: flex"]');
        scaleRows.forEach(row => {
          const label = row.querySelector('div');
          if (label && label.textContent === scaleDescriptions[scaleName]) {
            const circles = row.querySelectorAll('div[style*="border-radius: 50%"]');
            // Find the circle that corresponds to this semitone (not index)
            const targetCircle = circles[semitone]; // semitone is the chromatic position
            if (targetCircle) {
              targetCircle.style.transform = 'scale(1.3)';
              targetCircle.style.boxShadow = '0 0 15px rgba(26, 188, 156, 0.8)';
              setTimeout(() => {
                targetCircle.style.transform = 'scale(1)';
                targetCircle.style.boxShadow = selectedScale === scaleName ? '0 0 8px rgba(26, 188, 156, 0.4)' : 'none';
              }, 350);
            }
          }
        });
        
        // Highlight the corresponding color in the main palette
        // Each note in the scale corresponds to a color in the palette
        const circles = colorPalette.querySelectorAll('div');
        const colorIndex = index % extractedColors.length; // Map scale position to color
        if (circles[colorIndex]) {
          const [r, g, b] = extractedColors[colorIndex];
          circles[colorIndex].style.transform = 'scale(1.4)';
          circles[colorIndex].style.borderColor = '#1abc9c';
          circles[colorIndex].style.boxShadow = '0 0 20px rgba(26, 188, 156, 1)';
          circles[colorIndex].style.borderWidth = '4px';
          
          setTimeout(() => {
            circles[colorIndex].style.transform = 'scale(1)';
            circles[colorIndex].style.borderColor = 'rgba(255, 255, 255, 0.8)';
            circles[colorIndex].style.boxShadow = 'none';
            circles[colorIndex].style.borderWidth = '3px';
          }, 400);
        }
        
        // Also update the info to show which color is playing
        const [r, g, b] = extractedColors[colorIndex];
        colorInfo.innerHTML = `
          <div>🎵 Playing ${scaleDescriptions[scaleName]} scale...</div>
          <div>Note ${index + 1}/${currentScale.length}: ${noteName} → Color ${colorIndex + 1} (rgb(${r}, ${g}, ${b}))</div>
        `;
      }, index * 450); // Slightly slower timing for better clarity
    });
    
    // Reset info after scale completes
    setTimeout(() => {
      colorInfo.innerHTML = `
        <div>🎵 ${scaleDescriptions[scaleName]} scale complete!</div>
        <div>Click other scales to compare or click individual notes</div>
      `;
    }, currentScale.length * 450 + 500);
  }
  
  // No button event listeners needed - everything is automatic now
  
  // Initialize
  loadMandalaImage();
});
</script>

### Understanding Musical Scales in Sonification

Musical scales provide the harmonic foundation for our color-to-sound mapping:

```javascript
// Musical scales for color-to-note mapping
const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],        // Happy, bright sound
  minor: [0, 2, 3, 5, 7, 8, 10],        // Melancholic, deeper sound
  pentatonic: [0, 2, 4, 7, 9],          // Harmonious, no dissonance
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] // All semitones
};

// Convert color index to musical frequency
function colorToFrequency(colorIndex) {
  const currentScale = scales[selectedScale];
  const baseFreq = 261.63; // C4
  const noteIndex = colorIndex % currentScale.length;
  const semitones = currentScale[noteIndex];
  
  return baseFreq * Math.pow(2, semitones / 12);
}
```

**Key Concepts:**
- **Color Extraction**: Uses ColorThief library to find 7 dominant colors from mandala
- **Scale Mapping**: Each color maps to a note in the selected musical scale
- **Interactive Exploration**: Click colors to hear their corresponding notes
- **Scale Comparison**: Switch between different scales to hear harmonic variations

## Interactive Aspiral Reconstruction

Now let's combine the color extraction with aspiral reconstruction and real-time sonification:

<div style="text-align: center; margin: 30px 0;">
  <canvas id="aspiral-canvas" width="400" height="400" style="border: 3px solid #1abc9c; border-radius: 50%; background: #2c3e50; display: block; margin: 0 auto;"></canvas>
</div>

<div style="text-align: center; margin: 20px 0;">
  <button id="start-reconstruction" style="background: #1abc9c; border: none; border-radius: 8px; color: white; padding: 12px 24px; cursor: pointer; font-family: inherit; font-size: 14px; margin: 0 5px;">🎵 Start Aspiral</button>
  <button id="stop-reconstruction" style="background: #e74c3c; border: none; border-radius: 8px; color: white; padding: 12px 24px; cursor: pointer; font-family: inherit; font-size: 14px; margin: 0 5px;">⏹ Stop</button>
  <button id="clear-reconstruction" style="background: #95a5a6; border: none; border-radius: 8px; color: white; padding: 12px 24px; cursor: pointer; font-family: inherit; font-size: 14px; margin: 0 5px;">🗑 Clear</button>
</div>

<div style="text-align: center; margin: 15px 0;">
  <label style="color: #1abc9c; margin-right: 10px;">Speed:</label>
  <input type="range" id="reconstruction-speed" min="1" max="10" value="5" style="width: 150px; margin-right: 15px;">
  <label style="color: #1abc9c; margin-right: 10px;">Volume:</label>
  <input type="range" id="reconstruction-volume" min="0" max="100" value="30" style="width: 150px;">
</div>

<div id="reconstruction-info" style="text-align: center; color: #1abc9c; font-size: 14px; margin: 20px 0; min-height: 30px;">
  Click "Start Aspiral" to see and hear the mandala being reconstructed pixel by pixel
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('aspiral-canvas');
  const startBtn = document.getElementById('start-reconstruction');
  const stopBtn = document.getElementById('stop-reconstruction');
  const clearBtn = document.getElementById('clear-reconstruction');
  const speedSlider = document.getElementById('reconstruction-speed');
  const volumeSlider = document.getElementById('reconstruction-volume');
  const info = document.getElementById('reconstruction-info');
  
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let synth = null;
  let isPlaying = false;
  let sourceImageData = null;
  let animationFrame = null;
  let extractedPalette = [];
  
  // Initialize audio
  async function initAudio() {
    if (window.Tone && !synth) {
      await Tone.start();
      synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 }
      }).toDestination();
    }
  }
  
  // Load and process mandala image
  function loadMandalaForReconstruction() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      // Store original image data for pixel sampling
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 400;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Scale and draw image
      const size = Math.min(img.width, img.height);
      const scale = 350 / size;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (400 - scaledWidth) / 2;
      const offsetY = (400 - scaledHeight) / 2;
      
      tempCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      sourceImageData = tempCtx.getImageData(0, 0, 400, 400);
      
      // Extract color palette from the mandala
      if (window.ColorThief) {
        const colorThief = new ColorThief();
        try {
          extractedPalette = colorThief.getPalette(tempCanvas, 12);
          
          // Ensure we got valid colors
          if (!extractedPalette || extractedPalette.length < 12) {
            throw new Error('Insufficient colors extracted');
          }
          
          // Sort colors by hue for better organization
          extractedPalette = sortColorsByHue(extractedPalette);
        } catch (error) {
          console.log('ColorThief extraction failed, using manual extraction:', error);
          extractedPalette = sortColorsByHue(extractColorsFromImageData(sourceImageData));
        }
      } else {
        extractedPalette = sortColorsByHue(extractColorsFromImageData(sourceImageData));
      }
      
      info.textContent = 'Mandala loaded and palette extracted. Ready for aspiral reconstruction!';
    };
    img.src = '/images/mandalas/01b.png';
  }
  
  // Manual color extraction from image data (same as above)
  function extractColorsFromImageData(imageData) {
    const data = imageData.data;
    const colorCounts = {};
    const step = 4; // Sample every pixel
    
    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Skip transparent or very dark pixels
      if (a < 80 || (r + g + b) < 30) continue;
      
      // Less aggressive quantization for better color fidelity
      const qr = Math.round(r / 16) * 16;
      const qg = Math.round(g / 16) * 16;
      const qb = Math.round(b / 16) * 16;
      
      const colorKey = `${qr},${qg},${qb}`;
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }
    
    // Sort and take top 12
    const sortedColors = Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 12)
      .map(([color]) => color.split(',').map(Number));
    
    // Ensure 12 colors
    while (sortedColors.length < 12) {
      const hue = (sortedColors.length * 51) % 360;
      const [r, g, b] = hslToRgb(hue, 70, 60);
      sortedColors.push([r, g, b]);
    }
    
    return sortedColors;
  }
  
  // Convert HSL to RGB (same as above)
  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  
  // Convert RGB to HSL for sorting (same as above)
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }
  
  // Sort colors by hue (same as above)
  function sortColorsByHue(colors) {
    return colors.map(color => ({
      rgb: color,
      hsl: rgbToHsl(color[0], color[1], color[2])
    }))
    .sort((a, b) => {
      if (Math.abs(a.hsl[0] - b.hsl[0]) > 10) {
        return a.hsl[0] - b.hsl[0];
      }
      if (Math.abs(a.hsl[1] - b.hsl[1]) > 10) {
        return b.hsl[1] - a.hsl[1];
      }
      return a.hsl[2] - b.hsl[2];
    })
    .map(item => item.rgb);
  }
  
  // Sample pixel color from source
  function samplePixel(x, y) {
    if (!sourceImageData || x < 0 || x >= 400 || y < 0 || y >= 400) {
      return [0, 0, 0, 0];
    }
    
    const index = (Math.floor(y) * 400 + Math.floor(x)) * 4;
    return [
      sourceImageData.data[index],
      sourceImageData.data[index + 1],
      sourceImageData.data[index + 2],
      sourceImageData.data[index + 3]
    ];
  }
  
  // Find closest color in extracted palette
  function findClosestPaletteColor(r, g, b) {
    if (extractedPalette.length === 0) return 0;
    
    let minDistance = Infinity;
    let closestIndex = 0;
    
    extractedPalette.forEach((color, index) => {
      const [pr, pg, pb] = color;
      const distance = Math.sqrt(
        Math.pow(r - pr, 2) + Math.pow(g - pg, 2) + Math.pow(b - pb, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }
  
  // Convert palette index to frequency
  function paletteToFrequency(paletteIndex) {
    const pentatonic = [0, 2, 4, 7, 9]; // Harmonious scale
    const baseFreq = 261.63; // C4
    const noteIndex = paletteIndex % pentatonic.length;
    const semitones = pentatonic[noteIndex];
    
    return baseFreq * Math.pow(2, semitones / 12);
  }
  
  // Start aspiral reconstruction
  function startReconstruction() {
    if (isPlaying || !sourceImageData) return;
    
    isPlaying = true;
    startBtn.disabled = true;
    
    const centerX = 200;
    const centerY = 200;
    const maxRadius = 180;
    const totalSteps = 4000;
    const speed = parseInt(speedSlider.value);
    const stepDelay = Math.max(10, 100 - speed * 8); // Slower base speed with more range
    
    let currentStep = 0;
    let lastNoteTime = 0;
    
    function traceStep() {
      if (!isPlaying || currentStep >= totalSteps) {
        stopReconstruction();
        return;
      }
      
      // Calculate aspiral position (Archimedean spiral: r = a + b*θ)
      const progress = currentStep / totalSteps;
      const theta = progress * Math.PI * 60; // 30 rotations for comprehensive coverage
      const radius = progress * maxRadius;
      
      const x = centerX + radius * Math.cos(theta);
      const y = centerY + radius * Math.sin(theta);
      
      // Sample and reconstruct pixel
      const [r, g, b, a] = samplePixel(x, y);
      
      if (a > 50) {
        // Draw reconstructed pixel
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Play corresponding note
        const now = Date.now();
        const noteInterval = Math.max(50, stepDelay * 2); // Adapt note timing to speed
        if (synth && now - lastNoteTime > noteInterval) {
          const paletteIndex = findClosestPaletteColor(r, g, b);
          const frequency = paletteToFrequency(paletteIndex);
          const volume = parseInt(volumeSlider.value) / 100;
          synth.volume.value = -25 + (volume * 20);
          synth.triggerAttackRelease(frequency, "16n");
          lastNoteTime = now;
        }
      }
      
      currentStep++;
      const progressPercent = (progress * 100).toFixed(1);
      info.innerHTML = `
        <div>🎵 Reconstructing: ${progressPercent}% complete</div>
        <div>Step ${currentStep}/${totalSteps} • ${Math.round(theta / (2 * Math.PI))} rotations</div>
      `;
      
      animationFrame = setTimeout(traceStep, stepDelay);
    }
    
    info.textContent = 'Starting aspiral reconstruction with sonification...';
    traceStep();
  }
  
  // Stop reconstruction
  function stopReconstruction() {
    isPlaying = false;
    startBtn.disabled = false;
    
    if (animationFrame) {
      clearTimeout(animationFrame);
      animationFrame = null;
    }
    
    info.innerHTML = `
      <div>🎵 Reconstruction complete!</div>
      <div>Click "Start Aspiral" to replay or "Clear" to reset</div>
    `;
  }
  
  // Clear canvas
  function clearReconstruction() {
    ctx.clearRect(0, 0, 400, 400);
    info.textContent = 'Canvas cleared. Ready for new reconstruction.';
  }
  
  // Event listeners
  startBtn.addEventListener('click', async () => {
    await initAudio();
    startReconstruction();
  });
  
  stopBtn.addEventListener('click', stopReconstruction);
  clearBtn.addEventListener('click', clearReconstruction);
  
  // Initialize
  loadMandalaForReconstruction();
});
</script>

This **Interactive Aspiral Reconstruction** demonstrates the complete sonification pipeline:

1. **Color Extraction**: Analyzes mandala to create 12-color palette
2. **Pixel Sampling**: Traces through image using aspiral algorithm
3. **Color Matching**: Maps each pixel to closest palette color
4. **Musical Mapping**: Converts palette colors to pentatonic scale notes
5. **Real-time Synthesis**: Plays corresponding notes as pixels are drawn

The result is a **live musical interpretation** of the mandala's visual structure!

## Full Mandala Playground

Experience the complete sonification system with real mandala images from my art therapy collection:

<div style="text-align: center; margin: 30px 0;">
  <a href="/mandala-playground.html" style="
    display: inline-block;
    background: linear-gradient(45deg, #1abc9c, #16a085);
    border: none;
    border-radius: 12px;
    color: white;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    text-decoration: none;
    transition: transform 0.2s ease;
    box-shadow: 0 8px 25px rgba(26, 188, 156, 0.3);
  " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
    🎭 Open Full Mandala Playground
  </a>
</div>

The full playground includes:
- **Real mandala images** from my 2012 art therapy collection
- **Advanced synthesis controls** with multiple instruments
- **Full-screen immersive experience** 
- **Complete magnifier system** for pixel-level exploration
- **Professional audio controls** with knobs and real-time feedback
- **Keyboard shortcuts** for easy navigation

**Navigation:**
- `Space` - Play/Stop
- `←/→` - Navigate mandalas
- `R` - Random mandala
- `Esc` - Close playground

## From Art Therapy to Code

This project represents a personal journey combining:

- **Creative exploration** from my art therapy studies
- **Technical curiosity** about audio programming
- **Pattern recognition** in both visual and auditory domains

The beauty of mandalas lies in their mathematical harmony - the same principles that make them visually pleasing also create musical consonance when translated to sound.

## Evolution as Components

This minimal demo can progressively grow into:

1. **Advanced spiral algorithms** (fibonacci spirals, golden ratio patterns)
2. **Complex harmonic relationships** (just intonation, microtonal scales)
3. **Interactive drawing tools** (paint your own sonifying mandalas)
4. **Real-time collaboration** (shared mandala creation with live audio)

## Educational Applications

Perfect for teaching:
- **Mathematical patterns** in art and music
- **Cross-sensory experiences** for accessibility
- **Creative coding** fundamentals
- **Audio programming** concepts

The simple interface allows focus on the core concepts without overwhelming complexity.

## Conclusion

Sometimes the most profound explorations come from combining different passions. This sonification experiment bridges art therapy, mathematics, and music technology - showing how creative coding can be both educational and meditative.

> **Try it**: Start with the pentatonic scale for harmonic comfort, then explore chromatic for more complex relationships. Notice how the visual symmetry translates to musical patterns.

---

## Resources and Further Reading

- [Tone.js Documentation](https://tonejs.github.io/) - Web Audio framework used in this project
- [Color Thief](https://lokeshdhakar.com/projects/color-thief/) - Color extraction library
- [International Community for Auditory Display](https://icad.org/) - Academic sonification research
- [Web Audio API Specification](https://webaudio.github.io/web-audio-api/) - Browser audio capabilities
- [Sonification Design Guidelines](https://sonification.de/) - Best practices for audio data representation

---

*This project builds upon my previous work in sonification, including the [Data Synthesizer concept](/2023/05/28/sonification-device) and explores practical applications of audio-based data exploration.*

<!-- Required JavaScript libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js"></script>

<style>
.minimal-demo {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
}

.mandala-canvas {
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.3s ease;
  border: 2px solid #1abc9c;
}

.mandala-canvas:hover {
  transform: scale(1.05);
}

.mandala-canvas.spinning {
  animation: spin 4s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.controls {
  margin: 20px 0;
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.control label {
  color: #1abc9c;
  font-size: 12px;
  text-transform: uppercase;
}

.control input {
  background: #2c3e50;
  border: 1px solid #1abc9c;
  border-radius: 4px;
  color: #ecf0f1;
  padding: 5px;
  width: 60px;
  text-align: center;
}

.control input[type="range"] {
  -webkit-appearance: none;
  width: 120px;
  height: 6px;
  background: linear-gradient(90deg, #34495e 0%, #1abc9c 50%, #e74c3c 100%);
  outline: none;
  border-radius: 3px;
}

.control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #ecf0f1;
  border: 2px solid #1abc9c;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(26, 188, 156, 0.5);
}

.control input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #ecf0f1;
  border: 2px solid #1abc9c;
  border-radius: 50%;
  cursor: pointer;
}

.control-value {
  color: #1abc9c;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  margin-top: 3px;
}

.mandala-examples {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 15px 0;
  flex-wrap: wrap;
}

.mandala-option {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.mandala-option:hover {
  border-color: #1abc9c;
  transform: scale(1.1);
}

.mandala-option.active {
  border-color: #e74c3c;
  box-shadow: 0 0 15px rgba(231, 76, 60, 0.5);
}

.color-palette {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 15px 0;
  flex-wrap: wrap;
}

.color-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
  position: relative;
}

.color-circle:hover {
  transform: scale(1.2);
  border-color: #1abc9c;
  box-shadow: 0 0 15px rgba(26, 188, 156, 0.6);
}

.color-circle.playing {
  animation: pulse 0.5s ease-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.btn {
  background: #1abc9c;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 8px 16px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.3s ease;
}

.btn:hover {
  background: #16a085;
}

.info {
  color: #ecf0f1;
  font-size: 14px;
  margin: 10px 0;
  opacity: 0.8;
}

.audio-notice {
  background: rgba(26, 188, 156, 0.1);
  border: 1px solid #1abc9c;
  border-radius: 4px;
  color: #1abc9c;
  padding: 10px;
  margin: 10px 0;
  cursor: pointer;
}
</style>

<script>
// Minimal Mandala Sonification Demo
// Based on 2012 audio experiments during art therapy studies
document.addEventListener('DOMContentLoaded', function() {
  const demoContainer = document.getElementById('mandala-demo');
  if (!demoContainer) return;
  
  // Create minimal interface
  demoContainer.innerHTML = `
    <div class="audio-notice" id="audio-notice">🔊 Click to enable audio</div>
    
    <div class="mandala-examples" id="mandala-examples">
      <!-- Mandala options will be populated here -->
    </div>
    
    <canvas id="mandala-canvas" class="mandala-canvas" width="250" height="250"></canvas>
    
    <div class="color-palette" id="color-palette">
      <!-- Extracted colors will appear here as playable circles -->
    </div>
    
    <div class="controls">
      <div class="control">
        <label>Spiral Speed</label>
        <input type="range" id="speed" min="1" max="10" value="3">
        <div class="control-value" id="speed-value">3</div>
      </div>
      <div class="control">
        <label>Rotation Speed</label>
        <input type="range" id="rotation" min="0" max="5" value="0" step="0.1">
        <div class="control-value" id="rotation-value">0 RPM</div>
      </div>
    </div>
    <button class="btn" id="play-btn">Start Spiral</button>
    <div class="info" id="info">Click mandala examples, color circles, or start the spiral to hear harmonic patterns</div>
  `;
  
  // Initialize the minimal demo
  initMinimalDemo();
});

function initMinimalDemo() {
  // Core variables
  let synth = null;
  let isPlaying = false;
  let audioEnabled = false;
  let spiralAngle = 0;
  let rotationAngle = 0;
  let animationFrame = null;
  let currentMandala = 0;
  let extractedColors = [];
  let colorThief = null;
  
  // Get elements
  const canvas = document.getElementById('mandala-canvas');
  const ctx = canvas.getContext('2d');
  const playBtn = document.getElementById('play-btn');
  const speedSlider = document.getElementById('speed');
  const rotationSlider = document.getElementById('rotation');
  const speedValue = document.getElementById('speed-value');
  const rotationValue = document.getElementById('rotation-value');
  const audioNotice = document.getElementById('audio-notice');
  const info = document.getElementById('info');
  const mandalaExamples = document.getElementById('mandala-examples');
  const colorPalette = document.getElementById('color-palette');
  
  // Initialize ColorThief
  if (window.ColorThief) {
    colorThief = new ColorThief();
  }
  
  // Musical scales from 2012 experiments
  const scales = {
    pentatonic: [0, 2, 4, 7, 9], // C D E G A
    major: [0, 2, 4, 5, 7, 9, 11], // C D E F G A B
    minor: [0, 2, 3, 5, 7, 8, 10], // C D Eb F G Ab Bb
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] // All semitones
  };
  
  // Mandala examples with different characteristics
  const mandalas = [
    {
      name: 'Geometric',
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'],
      scaleProgression: ['pentatonic', 'major', 'pentatonic']
    },
    {
      name: 'Natural',
      colors: ['#2ECC71', '#27AE60', '#F39C12', '#E67E22', '#8E44AD', '#9B59B6'],
      scaleProgression: ['minor', 'major', 'chromatic']
    },
    {
      name: 'Cosmic',
      colors: ['#3F51B5', '#2196F3', '#00BCD4', '#009688', '#795548', '#607D8B'],
      scaleProgression: ['chromatic', 'pentatonic', 'minor']
    },
    {
      name: 'Fire',
      colors: ['#FF5722', '#FF9800', '#FFC107', '#FFEB3B', '#CDDC39', '#8BC34A'],
      scaleProgression: ['major', 'chromatic', 'major']
    }
  ];
  
  // Base frequency (C4)
  const baseFreq = 261.63;
  
  // Initialize audio context
  async function enableAudio() {
    if (!audioEnabled && window.Tone) {
      await Tone.start();
      synth = new Tone.Synth().toDestination();
      audioEnabled = true;
      audioNotice.style.display = 'none';
      info.textContent = 'Audio enabled! Try the controls.';
    }
  }
  
  // Create mandala example thumbnails
  function createMandalaExamples() {
    mandalaExamples.innerHTML = '';
    mandalas.forEach((mandala, index) => {
      const thumbnail = document.createElement('canvas');
      thumbnail.className = 'mandala-option';
      thumbnail.width = 50;
      thumbnail.height = 50;
      thumbnail.title = mandala.name;
      
      if (index === currentMandala) {
        thumbnail.classList.add('active');
      }
      
      // Draw thumbnail
      const thumbCtx = thumbnail.getContext('2d');
      drawMandalaOnCanvas(thumbCtx, 25, 25, 20, mandala.colors, 0);
      
      thumbnail.addEventListener('click', () => {
        currentMandala = index;
        updateActiveMandala();
        drawCurrentMandala();
        extractColorsFromCurrentMandala();
      });
      
      mandalaExamples.appendChild(thumbnail);
    });
  }
  
  // Draw mandala with scale interpolation and rotation
  function drawMandalaOnCanvas(context, centerX, centerY, maxRadius, colors, spiralAngle, rotationAngle = 0) {
    const mandala = mandalas[currentMandala];
    
    // Save context for rotation
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotationAngle);
    context.translate(-centerX, -centerY);
    
    for (let ring = 0; ring < 6; ring++) {
      const radius = (maxRadius / 6) * (ring + 1);
      const normalizedRadius = ring / 5; // 0 to 1
      
      // Interpolate between scales based on radius
      const scaleIndex = Math.floor(normalizedRadius * mandala.scaleProgression.length);
      const currentScale = mandala.scaleProgression[Math.min(scaleIndex, mandala.scaleProgression.length - 1)];
      
      context.fillStyle = colors[ring % colors.length];
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();
      
      // Add pattern elements with scale-based variations
      const elementsCount = scales[currentScale].length;
      for (let i = 0; i < elementsCount; i++) {
        const elementAngle = (i * Math.PI * 2) / elementsCount + spiralAngle;
        const x = centerX + Math.cos(elementAngle) * radius * 0.7;
        const y = centerY + Math.sin(elementAngle) * radius * 0.7;
        
        context.fillStyle = colors[(ring + i) % colors.length];
        context.beginPath();
        context.arc(x, y, Math.max(1, maxRadius / 25), 0, Math.PI * 2);
        context.fill();
      }
    }
    
    context.restore();
  }
  
  // Draw current mandala with spiral algorithm and rotation
  function drawCurrentMandala() {
    ctx.clearRect(0, 0, 250, 250);
    const mandala = mandalas[currentMandala];
    drawMandalaOnCanvas(ctx, 125, 125, 100, mandala.colors, spiralAngle, rotationAngle);
  }
  
  // Extract colors using ColorThief and create playable circles
  function extractColorsFromCurrentMandala() {
    const mandala = mandalas[currentMandala];
    const colors = mandala.colors;
    
    // Convert hex colors to RGB for frequency calculation
    extractedColors = colors.map(hex => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    });
    
    // Create color circles
    colorPalette.innerHTML = '';
    colors.forEach((color, index) => {
      const circle = document.createElement('div');
      circle.className = 'color-circle';
      circle.style.backgroundColor = color;
      circle.title = `Color ${index + 1}: ${color}`;
      
      circle.addEventListener('click', () => {
        if (!audioEnabled) {
          enableAudio();
          return;
        }
        
        const frequency = colorToNote(index, 0);
        synth.triggerAttackRelease(frequency, '4n');
        
        // Visual feedback
        circle.classList.add('playing');
        setTimeout(() => circle.classList.remove('playing'), 500);
        
        info.textContent = `Played color ${index + 1}: ${Math.round(frequency)}Hz`;
      });
      
      colorPalette.appendChild(circle);
    });
  }
  
  // Update active mandala visual state
  function updateActiveMandala() {
    const options = mandalaExamples.querySelectorAll('.mandala-option');
    options.forEach((option, index) => {
      option.classList.toggle('active', index === currentMandala);
    });
  }
  
  // Convert color to musical note using mandala's scale progression
  function colorToNote(colorIndex, ringIndex) {
    const mandala = mandalas[currentMandala];
    const normalizedRadius = ringIndex / 5;
    const scaleIndex = Math.floor(normalizedRadius * mandala.scaleProgression.length);
    const scaleName = mandala.scaleProgression[Math.min(scaleIndex, mandala.scaleProgression.length - 1)];
    const currentScale = scales[scaleName];
    const noteIndex = (colorIndex + ringIndex) % currentScale.length;
    const semitones = currentScale[noteIndex];
    return baseFreq * Math.pow(2, semitones / 12);
  }
  
  // Animation loop with scale interpolation and rotation
  function animate() {
    if (!isPlaying) return;
    
    // Update spiral and rotation angles
    spiralAngle += 0.02 * speedSlider.value;
    rotationAngle += 0.01 * rotationSlider.value * Math.PI / 180; // Convert to radians
    
    drawCurrentMandala();
    
    // Play notes based on spiral position with scale interpolation
    if (audioEnabled && Math.floor(spiralAngle * 10) % 12 === 0) {
      const mandala = mandalas[currentMandala];
      const colorIndex = Math.floor(spiralAngle * 2) % mandala.colors.length;
      const ringIndex = Math.floor(spiralAngle) % 6;
      
      const frequency = colorToNote(colorIndex, ringIndex);
      synth.triggerAttackRelease(frequency, '8n');
      
      // Highlight the corresponding color circle
      const circles = colorPalette.querySelectorAll('.color-circle');
      if (circles[colorIndex]) {
        circles[colorIndex].classList.add('playing');
        setTimeout(() => circles[colorIndex].classList.remove('playing'), 200);
      }
    }
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  // Event listeners
  audioNotice.addEventListener('click', enableAudio);
  
  // Slider event listeners with real-time feedback
  speedSlider.addEventListener('input', (e) => {
    speedValue.textContent = e.target.value;
  });
  
  rotationSlider.addEventListener('input', (e) => {
    const rpm = parseFloat(e.target.value);
    rotationValue.textContent = `${rpm.toFixed(1)} RPM`;
    
    // Update rotation angle for real-time feedback
    rotationAngle += 0.1 * rpm * Math.PI / 180;
    
    // Real-time rotation even when not playing
    if (!isPlaying) {
      drawCurrentMandala();
    }
  });
  
  playBtn.addEventListener('click', () => {
    if (!audioEnabled) {
      enableAudio();
      return;
    }
    
    isPlaying = !isPlaying;
    if (isPlaying) {
      playBtn.textContent = 'Stop Spiral';
      canvas.classList.add('spinning');
      animate();
    } else {
      playBtn.textContent = 'Start Spiral';
      canvas.classList.remove('spinning');
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    }
  });
  
  canvas.addEventListener('click', async () => {
    if (!audioEnabled) {
      await enableAudio();
      return;
    }
    
    // Play a random harmonic note from current mandala
    const mandala = mandalas[currentMandala];
    const randomColor = Math.floor(Math.random() * mandala.colors.length);
    const randomRing = Math.floor(Math.random() * 6);
    const frequency = colorToNote(randomColor, randomRing);
    synth.triggerAttackRelease(frequency, '4n');
    
    // Highlight the corresponding color circle
    const circles = colorPalette.querySelectorAll('.color-circle');
    if (circles[randomColor]) {
      circles[randomColor].classList.add('playing');
      setTimeout(() => circles[randomColor].classList.remove('playing'), 500);
    }
    
    info.textContent = `Played note: ${Math.round(frequency)}Hz from ${mandala.name} mandala`;
  });
  
  // Initialize everything
  createMandalaExamples();
  drawCurrentMandala();
  extractColorsFromCurrentMandala();
  
  // Update info text
  info.innerHTML = `
    <strong>Explore:</strong> Select mandala examples → Adjust rotation speed → Click color circles → Control spiral speed → Start animation<br>
    <small>Current: ${mandalas[currentMandala].name} mandala using ${mandalas[currentMandala].scaleProgression.join(' → ')} scale progression</small>
  `;
}
</script>
