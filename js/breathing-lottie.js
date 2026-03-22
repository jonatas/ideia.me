document.addEventListener('DOMContentLoaded', () => {
  // Brand Colors
  const colors = {
    yellow: '#FBBF24',
    lightBlue: '#0EA5E9',
    darkBlue: '#1E3A8A',
    red: '#EF4444'
  };

  const easeInOut = { o: {x: 0.4, y: 0}, i: {x: 0.2, y: 1} };
  const easeOut = { o: {x: 0, y: 0}, i: {x: 0.2, y: 1} };

  // Find all breathing exercise containers
  const containers = document.querySelectorAll('.breathing-exercise');
  
  containers.forEach(container => {
    // Read parameters
    const inhale = parseFloat(container.dataset.inhale) || 4;
    const holdIn = parseFloat(container.dataset.holdIn) || 0;
    const exhale = parseFloat(container.dataset.exhale) || 4;
    const holdOut = parseFloat(container.dataset.holdOut) || 0;
    
    // Calculate frames based on 60fps
    const fps = 60;
    const tStart = 0;
    const tInhale = inhale * fps;
    const tHoldIn = tInhale + (holdIn * fps);
    const tExhale = tHoldIn + (exhale * fps);
    const tEnd = tExhale + (holdOut * fps);
    const totalFrames = tEnd;
    
    // Create the builder
    const builder = new LottieBuilder(500, 500, fps, totalFrames);
    
    // Define the breathing scale keyframes dynamically
    const breathingScale = [
      { t: tStart, s: 80, ease: easeInOut },               // Start (empty)
      { t: tInhale, s: 120, ease: easeInOut },             // Inhale peak
    ];
    
    if (holdIn > 0) {
      breathingScale.push({ t: tHoldIn, s: 120, ease: easeInOut }); // Hold in
    }
    
    breathingScale.push({ t: tExhale, s: 80, ease: easeInOut });   // Exhale bottom
    
    if (holdOut > 0) {
      breathingScale.push({ t: tEnd, s: 80, ease: easeInOut });     // Hold out
    } else if (tEnd === tExhale) {
        // Ensure final frame is present
        // breathingScale.push({ t: tEnd, s: 80, ease: easeInOut });
    }

    // Define rotation
    const rotSpin = [
      { t: 0, s: 0, ease: easeOut },
      { t: totalFrames, s: 90, ease: easeOut }
    ];

    // Build the scene
    builder.addCircle({
      x: 250, y: 250, size: 420,
      color: [colors.darkBlue, colors.lightBlue],
      scaleKeyframes: breathingScale,
      rotationKeyframes: rotSpin
    });

    builder.addCircle({
      x: 250, y: 250, size: 300,
      color: [colors.lightBlue, colors.yellow],
      scaleKeyframes: breathingScale,
      rotationKeyframes: rotSpin
    });

    builder.addCircle({
      x: 250, y: 250, size: 190,
      color: [colors.yellow, colors.red],
      scaleKeyframes: breathingScale,
      rotationKeyframes: rotSpin
    });

    // Inner meditator body pulsating with the breath
    // Opacity fades out slightly on exhale, brightens on inhale
    const opacityKeyframes = [
        { t: tStart, s: 50, ease: easeInOut },
        { t: tInhale, s: 100, ease: easeInOut }
    ];
    if (holdIn > 0) opacityKeyframes.push({ t: tHoldIn, s: 100, ease: easeInOut });
    opacityKeyframes.push({ t: tExhale, s: 50, ease: easeInOut });
    if (holdOut > 0) opacityKeyframes.push({ t: tEnd, s: 50, ease: easeInOut });

    builder.addMeditator({
      x: 250, y: 250, color: "#ffffff",
      scaleKeyframes: breathingScale,
      opacityKeyframes: opacityKeyframes
    });

    const animationJSON = builder.toJSON();
    
    // Create the lottie-player element
    const player = document.createElement('lottie-player');
    player.setAttribute('autoplay', '');
    player.setAttribute('loop', '');
    player.setAttribute('mode', 'normal');
    player.style.width = '100%';
    player.style.height = '100%';
    
    // Load the animation data
    player.load(animationJSON);
    
    // Append to container
    container.appendChild(player);
  });
});
