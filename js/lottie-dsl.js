/**
 * LottieBuilder - A lightweight DSL to programmatically generate Lottie Bodymovin JSON animations.
 */
class LottieBuilder {
  constructor(width = 500, height = 500, fps = 60, totalFrames = 180) {
    this.animation = {
      v: "5.5.2",
      fr: fps,
      ip: 0,
      op: totalFrames,
      w: width,
      h: height,
      nm: "Generated Animation",
      ddd: 0,
      assets: [],
      layers: []
    };
    this.layerCount = 0;
  }

  /**
   * Helper to convert Hex to Lottie normalized RGBA array
   */
  hexToRgba(hex, opacity = 1) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex.split("").map(x => x + x).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return [r, g, b, opacity];
  }

  /**
   * Format keyframes for bodymovin
   */
  formatKeyframes(keyframes, defaultValue) {
    if (!keyframes || keyframes.length === 0) return defaultValue;
    const isMultiDimensional = Array.isArray(defaultValue);
    
    return keyframes.map((k, i) => {
      const isLast = i === keyframes.length - 1;
      const ease = k.ease || { o: {x: 0.167, y: 0.167}, i: {x: 0.833, y: 0.833} }; // default ease-in-out
      
      const formatVal = (val) => {
        if (Array.isArray(val)) return val;
        // Scale normally requires 3 dimensions [x, y, 100], Rot/Op requires 1 [val]
        if (isMultiDimensional) {
            const zDim = defaultValue.length > 2 ? defaultValue[2] : 100;
            return [val, val, zDim];
        } else {
            return [val];
        }
      };

      const kf = {
        t: k.t,
        s: formatVal(k.s)
      };

      // Bodymovin fails if the last keyframe has unresolved curves or `e` (end) values
      if (!isLast) {
          // Bodymovin requires multidimensional easings to use arrays in 5.5+
          kf.o = isMultiDimensional && typeof ease.o.x === 'number' 
              ? { x: [ease.o.x], y: [ease.o.y] } 
              : ease.o;
          kf.i = isMultiDimensional && typeof ease.i.x === 'number' 
              ? { x: [ease.i.x], y: [ease.i.y] } 
              : ease.i;
          kf.e = formatVal(keyframes[i + 1].s);
      }
      
      return kf;
    });
  }

  /**
   * Adds an animated circle layer, supporting solid colors or gradients.
   * @param {Object} options Options for the circle
   * @param {string | string[]} options.color Hex color or array of 2 hex colors for gradient
   * @param {Array} options.scaleKeyframes Array of keyframes for scaling
   * @param {Array} options.rotationKeyframes Array of keyframes for Z-rotation
   */
  addCircle(options) {
    const { x = 250, y = 250, size = 100, color = "#000000", scaleKeyframes = [], rotationKeyframes = [] } = options;

    const scaleKf = this.formatKeyframes(scaleKeyframes, [100, 100, 100]);
    const rotKf = this.formatKeyframes(rotationKeyframes, 0);
    
    const isGradient = Array.isArray(color) && color.length >= 2;

    let fillContents;
    if (isGradient) {
      // 2-color Linear Gradient Structure
      const color1 = this.hexToRgba(color[0]);
      const color2 = this.hexToRgba(color[1]);
      fillContents = {
        ty: "gf", // Gradient Fill
        o: { a: 0, k: 100, ix: 5 },
        r: 1, // 1 = Linear, 2 = Radial
        g: {
          p: 2, // 2 colors
          // [pos1, r1, g1, b1, pos2, r2, g2, b2]
          k: { a: 0, k: [0, color1[0], color1[1], color1[2], 1, color2[0], color2[1], color2[2]], ix: 9 }
        },
        // Mapped bounds relative to the shape center
        s: { a: 0, k: [-size/2, -size/2], ix: 5 }, // Start point (top-left)
        e: { a: 0, k: [size/2, size/2], ix: 6 }, // End point (bottom-right)
        t: 1,
        nm: "Gradient Fill",
        hd: false
      };
    } else {
      fillContents = {
        ty: "fl", // Solid Fill
        c: { a: 0, k: this.hexToRgba(color), ix: 4 },
        o: { a: 0, k: 100, ix: 5 },
        r: 1,
        bm: 0,
        nm: "Fill",
        hd: false
      };
    }

    const layer = {
      ddd: 0,
      ind: ++this.layerCount,
      ty: 4, // Shape layer
      nm: `Circle Layer ${this.layerCount}`,
      sr: 1,
      ks: {
        o: { a: 0, k: 100, ix: 11 },
        r: { a: rotationKeyframes.length > 0 ? 1 : 0, k: rotKf, ix: 10 },
        // x,y position translates the whole layer directly to coordinate center
        p: { a: 0, k: [x, y, 0], ix: 2 },
        a: { a: 0, k: [0, 0, 0], ix: 1 }, // No local layer offset needed
        s: { a: scaleKeyframes.length > 0 ? 1 : 0, k: scaleKf, ix: 6 }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el", // Ellipse
              s: { a: 0, k: [size, size], ix: 2 },
              p: { a: 0, k: [0, 0], ix: 3 }, // Path drawn exactly ON the layer origin
              nm: "Ellipse Path",
              hd: false
            },
            fillContents,
            {
              ty: "tr", // Transform for the shape group
              p: { a: 0, k: [0, 0], ix: 2 },
              a: { a: 0, k: [0, 0], ix: 1 },
              s: { a: 0, k: [100, 100], ix: 3 },
              r: { a: 0, k: 0, ix: 6 },
              o: { a: 0, k: 100, ix: 7 },
              sk: { a: 0, k: 0, ix: 4 },
              sa: { a: 0, k: 0, ix: 5 },
              nm: "Transform"
            }
          ],
          nm: "Ellipse Group",
          np: 3,
          cix: 2,
          bm: 0,
          hd: false
        }
      ],
      ip: 0,
      op: this.animation.op,
      st: 0,
      bm: 0
    };

    this.animation.layers.unshift(layer);
    return this;
  }

  /**
   * Adds a stylized meditator shape (Head + Body)
   */
  addMeditator(options) {
    const { x = 250, y = 250, scaleKeyframes = [], opacityKeyframes = [], color = "#ffffff" } = options;

    const scaleKf = this.formatKeyframes(scaleKeyframes, [100, 100, 100]);
    const opKf = this.formatKeyframes(opacityKeyframes, 100);
    const rgba = this.hexToRgba(color);

    const layer = {
      ddd: 0,
      ind: ++this.layerCount,
      ty: 4,
      nm: `Meditator Body`,
      sr: 1,
      ks: {
        o: { a: opacityKeyframes.length > 0 ? 1 : 0, k: opKf, ix: 11 },
        r: { a: 0, k: 0, ix: 10 },
        p: { a: 0, k: [x, y, 0], ix: 2 }, // Center position on canvas
        a: { a: 0, k: [0, 0, 0], ix: 1 }, // No local offset
        s: { a: scaleKeyframes.length > 0 ? 1 : 0, k: scaleKf, ix: 6 }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            // Head
            {
              d: 1, ty: "el", s: { a: 0, k: [25, 25], ix: 2 }, p: { a: 0, k: [0, -30], ix: 3 },
              nm: "Head", hd: false
            },
            // Body 
            {
              d: 1, ty: "el", s: { a: 0, k: [70, 45], ix: 2 }, p: { a: 0, k: [0, 15], ix: 3 },
              nm: "Body", hd: false
            },
            {
              ty: "fl",
              c: { a: 0, k: rgba, ix: 4 },
              o: { a: 0, k: 100, ix: 5 },
              r: 1, bm: 0, nm: "Fill", hd: false
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0], ix: 2 }, a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 },
              r: { a: 0, k: 0, ix: 6 }, o: { a: 0, k: 100, ix: 7 }, sk: { a: 0, k: 0, ix: 4 }, sa: { a: 0, k: 0, ix: 5 },
              nm: "Transform"
            }
          ],
          nm: "Meditator Group",
          np: 3, cix: 2, bm: 0, hd: false
        }
      ],
      ip: 0,
      op: this.animation.op,
      st: 0,
      bm: 0
    };

    this.animation.layers.push(layer); // Meditator on top
    return this;
  }

  toJSON() {
    return this.animation;
  }
}

// Export if in module environment, or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LottieBuilder;
} else if (typeof window !== 'undefined') {
  window.LottieBuilder = LottieBuilder;
}
