/**
 * Interactive Waimiri Atroari Weaving Playground Controller (/waimiri-atroari-patterns/)
 * Follows AGENTS.md & Modern Web Guidance (safe DOM creation, roving tabindex spatial navigation,
 * native <dialog>, centralized aria-live announcer, offline localStorage persistence).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'ideia_waimiri_patterns_v1';

  const state = {
    selectedPatternIndex: 0,
    activeTab: 'steps', // 'steps' | 'shuttle' | 'playground' | 'unroll'
    renderMode: 'kinja', // 'kinja' | 'basket' | 'blueprint'
    palette: 'natural', // 'natural' | 'urucum' | 'high-contrast'
    activeStepIndex: 4, // 0..4 (default shows complete pattern on initial load, or step through)
    activeShuttleRow: 0,
    selectedPrimitiveIndex: 0,
    symmetryMode: '4q', // 'none' | 'h' | '4q' | 'tile'
    invertStamp: false,
    showReferencePhoto: true,
    showDiffHighlight: true,
    soundEnabled: false,
    autoPlayTimer: null,
    // Unroll & Expansion Playground state
    unrollMode: 'seamless', // 'seamless' | 'mirror' | 'concentric' | 'framed'
    repeatsX: 3,
    repeatsY: 2,
    unrollZoom: 100,
    unrollCylinderPct: 100, // 100 = 2D flat unrolled tapestry, 0 = 3D cylindrical basket
    showTileBounds: true,
    unrollAnimTimer: null,
    lastExpandedMeta: null,
    lastRenderGeom: null,
    cursorR: 9,
    cursorC: 16,
    hoverR: -1,
    hoverC: -1,
    isPointerDown: false,
    userGrid: null,
    prevStepGrid: null,
    customSavedPatterns: []
  };

  let audioCtx = null;
  let offscreenCanvas = null;

  function playShuttleClick(isUnder) {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isUnder ? 240 : 390, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isUnder ? 110 : 190, audioCtx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (_) {
      // Ignore audio errors when blocked by autoplay policy
    }
  }

  let announceTimer = null;
  function announce(msg) {
    const el = document.getElementById('loom-announcer');
    if (!el) return;
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(function () {
      el.textContent = msg;
    }, 60);
  }

  function clearChildren(el) {
    while (el && el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function getActivePattern() {
    return window.WeavingPatterns.CATALOG[state.selectedPatternIndex] || window.WeavingPatterns.CATALOG[0];
  }

  function getBaseTileGrid() {
    const pat = getActivePattern();
    if (state.userGrid) return state.userGrid;
    return pat.grid;
  }

  function getExpandedResult() {
    const pat = getActivePattern();
    const baseGrid = getBaseTileGrid();
    return window.WeavingPatterns.generateExpandedGrid(baseGrid, {
      repeatsX: state.repeatsX,
      repeatsY: state.repeatsY,
      unrollMode: state.unrollMode,
      tilePeriod: pat.tilePeriod,
      patternId: pat.id
    });
  }

  function getDisplayGrid() {
    const pat = getActivePattern();
    if (state.activeTab === 'unroll') {
      const exp = getExpandedResult();
      state.lastExpandedMeta = exp;
      return exp.grid;
    }
    if (state.activeTab === 'playground' && state.userGrid) {
      return state.userGrid;
    }
    if (state.activeTab === 'steps') {
      const stepObj = pat.steps[state.activeStepIndex] || pat.steps[pat.steps.length - 1];
      return stepObj.grid;
    }
    return pat.grid;
  }

  function getPrevStepGrid() {
    const pat = getActivePattern();
    if (state.activeTab === 'steps' && state.activeStepIndex > 0) {
      return pat.steps[state.activeStepIndex - 1].grid;
    }
    return null;
  }

  /**
   * Spatial Navigation (Edge-based visual candidate selection per modern-web-guidance)
   */
  function attachSpatialNavigation(container, itemSelector, onActivate) {
    if (!container) return;
    container.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.composedPath ? e.composedPath()[0] : e.target;
      if (!target || typeof target.matches !== 'function') return;
      if (target.matches(':read-write, select, input[type="range"], [role="slider"]')) return;

      const allItems = Array.prototype.slice.call(container.querySelectorAll(itemSelector));
      const candidates = allItems.filter(function (el) {
        return typeof el.checkVisibility === 'function' ? el.checkVisibility() : el.offsetParent !== null;
      });
      if (candidates.indexOf(target) === -1) return;

      const dirMap = {
        ArrowRight: 'right',
        ArrowLeft: 'left',
        ArrowDown: 'down',
        ArrowUp: 'up'
      };
      const dir = dirMap[e.key];
      if (!dir) return;

      const currentRect = target.getBoundingClientRect();
      const tolerance = 2;
      const aligned = [];
      const fallback = [];

      for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        if (cand === target) continue;
        const rect = cand.getBoundingClientRect();
        let inDir = false;
        let gap = 0;
        let overlapsPerp = false;
        let perpOffset = 0;

        if (dir === 'right') {
          inDir = rect.left >= currentRect.right - tolerance;
          gap = Math.max(0, rect.left - currentRect.right);
          overlapsPerp = rect.bottom > currentRect.top + tolerance && rect.top < currentRect.bottom - tolerance;
          perpOffset = Math.abs((rect.top + rect.bottom) / 2 - (currentRect.top + currentRect.bottom) / 2);
        } else if (dir === 'left') {
          inDir = rect.right <= currentRect.left + tolerance;
          gap = Math.max(0, currentRect.left - rect.right);
          overlapsPerp = rect.bottom > currentRect.top + tolerance && rect.top < currentRect.bottom - tolerance;
          perpOffset = Math.abs((rect.top + rect.bottom) / 2 - (currentRect.top + currentRect.bottom) / 2);
        } else if (dir === 'down') {
          inDir = rect.top >= currentRect.bottom - tolerance;
          gap = Math.max(0, rect.top - currentRect.bottom);
          overlapsPerp = rect.right > currentRect.left + tolerance && rect.left < currentRect.right - tolerance;
          perpOffset = Math.abs((rect.left + rect.right) / 2 - (currentRect.left + currentRect.right) / 2);
        } else if (dir === 'up') {
          inDir = rect.bottom <= currentRect.top + tolerance;
          gap = Math.max(0, currentRect.top - rect.bottom);
          overlapsPerp = rect.right > currentRect.left + tolerance && rect.left < currentRect.right - tolerance;
          perpOffset = Math.abs((rect.left + rect.right) / 2 - (currentRect.left + currentRect.right) / 2);
        }

        if (!inDir) continue;
        if (overlapsPerp) {
          aligned.push({ el: cand, gap: gap, perpOffset: perpOffset });
        } else {
          fallback.push({ el: cand, score: gap + 2.5 * perpOffset });
        }
      }

      let best = null;
      if (aligned.length > 0) {
        aligned.sort(function (a, b) {
          return (a.gap - b.gap) || (a.perpOffset - b.perpOffset);
        });
        best = aligned[0].el;
      } else if (fallback.length > 0) {
        fallback.sort(function (a, b) {
          return a.score - b.score;
        });
        best = fallback[0].el;
      }

      if (best) {
        e.preventDefault();
        allItems.forEach(function (item) {
          item.setAttribute('tabindex', item === best ? '0' : '-1');
        });
        best.focus();
        best.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        if (typeof onActivate === 'function') {
          onActivate(best);
        }
      }
    });
  }

  /**
   * Draw mini thumbnail of a pattern or primitive onto a small canvas
   */
  function drawMiniGrid(canvas, grid) {
    if (!canvas || !grid || !grid.length) return;
    const ctx = canvas.getContext('2d');
    const R = grid.length;
    const C = grid[0].length;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#e5dec9';
    ctx.fillRect(0, 0, W, H);
    const cellW = W / C;
    const cellH = H / R;
    ctx.fillStyle = '#16171a';
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (grid[r][c] === 1) {
          ctx.fillRect(
            Math.floor(c * cellW),
            Math.floor(r * cellH),
            Math.ceil(cellW),
            Math.ceil(cellH)
          );
        }
      }
    }
  }

  /**
   * Render the interactive Mini Base-Tile Editor inside the Unroll sidebar tab
   */
  function renderMiniTileEditor() {
    const miniCanvas = document.getElementById('mini-tile-canvas');
    if (!miniCanvas) return;
    const baseGrid = getBaseTileGrid();
    drawMiniGrid(miniCanvas, baseGrid);

    // Draw subtle grid lines on mini editor
    const ctx = miniCanvas.getContext('2d');
    const R = baseGrid.length;
    const C = baseGrid[0].length;
    const cellW = miniCanvas.width / C;
    const cellH = miniCanvas.height / R;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.22)';
    ctx.lineWidth = 0.5;
    for (let r = 1; r < R; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(miniCanvas.width, r * cellH);
      ctx.stroke();
    }
    for (let c = 1; c < C; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, miniCanvas.height);
      ctx.stroke();
    }
  }

  /**
   * Apply 3D Cylindrical Basket-to-Flat Tapestry Unroll projection
   * when state.unrollCylinderPct < 100
   */
  function renderCylinderProjection(destCtx, srcCanvas, totalW, totalH, cylinderPct) {
    destCtx.fillStyle = '#070a10';
    destCtx.fillRect(0, 0, totalW, totalH);

    // u = 0 is 100% flat; u = 1 is wrapped around a 3D cylindrical basket
    const u = Math.max(0.01, Math.min(1, (100 - cylinderPct) / 100));
    const maxAngle = u * Math.PI * 1.65; // wraps around back at u = 1
    const halfAngle = maxAngle * 0.5;
    const sinHalf = Math.sin(Math.min(Math.PI * 0.5, halfAngle)) || 0.01;
    const centerX = totalW * 0.5;
    const usableW = (totalW - 36) * (1 - u * 0.26);
    const archAmplitude = u * 24; // elliptical top/bottom rim perspective

    // First pass: draw back-facing strips (cos(theta) < 0) darkly at the top rim so the basket looks hollow!
    const stripStep = 2;
    if (halfAngle > Math.PI * 0.52) {
      for (let sx = 0; sx < totalW; sx += stripStep) {
        const normS = (sx / totalW) - 0.5; // -0.5 .. +0.5
        const theta = normS * maxAngle;
        const cosT = Math.cos(theta);
        if (cosT >= 0) continue;
        const projNorm = Math.sin(theta) / sinHalf;
        const dx = centerX + projNorm * (usableW * 0.5);
        const yOffset = -archAmplitude * Math.abs(cosT) * 0.85;
        destCtx.save();
        destCtx.globalAlpha = 0.28;
        destCtx.drawImage(
          srcCanvas,
          sx, 0, stripStep, totalH,
          dx, 14 + yOffset, stripStep + 0.5, totalH - 28
        );
        destCtx.fillStyle = 'rgba(5, 8, 15, 0.72)';
        destCtx.fillRect(dx, 14 + yOffset, stripStep + 0.5, totalH - 28);
        destCtx.restore();
      }
    }

    // Second pass: draw front-facing cylinder strips (cos(theta) >= 0) with 3D Lambertian + rim shading
    for (let sx = 0; sx < totalW; sx += stripStep) {
      const normS = (sx / totalW) - 0.5;
      const theta = normS * maxAngle;
      const cosT = Math.cos(theta);
      if (cosT < -0.02) continue;

      const projNorm = halfAngle > 0.02 ? (Math.sin(theta) / Math.max(0.35, Math.min(1, Math.sin(halfAngle)))) : (normS * 2);
      const nextTheta = ((sx + stripStep) / totalW - 0.5) * maxAngle;
      const nextProjNorm = halfAngle > 0.02 ? (Math.sin(nextTheta) / Math.max(0.35, Math.min(1, Math.sin(halfAngle)))) : (((sx + stripStep) / totalW - 0.5) * 2);

      const dx = centerX + projNorm * (usableW * 0.5);
      const dw = Math.max(1.2, Math.abs((nextProjNorm - projNorm) * (usableW * 0.5)) + 0.8);
      const yCurve = archAmplitude * (1 - cosT);

      destCtx.drawImage(
        srcCanvas,
        sx, 0, stripStep, totalH,
        dx, yCurve * 0.6, dw, totalH - yCurve * 0.9
      );

      // Cylindrical shadow near left/right edges & subtle highlight near center-left
      const light = Math.pow(Math.max(0, Math.cos(theta + 0.18)), 0.85);
      if (light < 0.88) {
        destCtx.fillStyle = 'rgba(6, 9, 15, ' + ((1 - light) * 0.68 * u).toFixed(3) + ')';
        destCtx.fillRect(dx, yCurve * 0.6, dw, totalH - yCurve * 0.9);
      } else if (u > 0.15) {
        destCtx.fillStyle = 'rgba(255, 248, 225, ' + ((light - 0.88) * 0.55 * u).toFixed(3) + ')';
        destCtx.fillRect(dx, yCurve * 0.6, dw, totalH - yCurve * 0.9);
      }
    }

    // Overlay badge indicating 3D Cylinder Unroll %
    destCtx.save();
    destCtx.fillStyle = 'rgba(15, 23, 42, 0.86)';
    destCtx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    destCtx.lineWidth = 1;
    destCtx.beginPath();
    destCtx.roundRect(12, 12, 235, 28, 6);
    destCtx.fill();
    destCtx.stroke();
    destCtx.fillStyle = '#38bdf8';
    destCtx.font = '700 11px "JetBrains Mono", monospace';
    destCtx.textAlign = 'left';
    destCtx.textBaseline = 'middle';
    destCtx.fillText('Cesto 3D → Tapete 2D: ' + cylinderPct + '% aberto', 22, 26);
    destCtx.restore();
  }

  /**
   * Render main interactive loom canvas in 3 switchable lenses:
   *   1. 'kinja'     - Waimiri Atroari Serrated Sawtooth Card graphic style
   *   2. 'basket'    - 3D Interlaced Arumã & Urucum physical basket splints
   *   3. 'blueprint' - Technical grid with coordinates, step diffs, and symmetry axes
   * Plus full support for Expanded Repeating Tapestries & 3D Cylindrical Unrolling!
   */
  function renderMainLoom() {
    const canvas = document.getElementById('loom-canvas');
    if (!canvas) return;
    const pat = getActivePattern();
    const grid = getDisplayGrid();
    const prevGrid = getPrevStepGrid();
    const R = grid.length;
    const C = grid[0].length;
    const isUnroll = state.activeTab === 'unroll';

    let cellW = 20;
    let cellH = 26;
    if (isUnroll) {
      // Scale cell dimensions so expanded tapestries render crisply and support zoom
      const baseFit = Math.min(1.15, Math.min(820 / (C * 16), 500 / (R * 20)));
      const zoomMult = (state.unrollZoom || 100) / 100;
      cellW = Math.max(5, Math.round(16 * baseFit * zoomMult));
      cellH = Math.max(6, Math.round(20 * baseFit * zoomMult));
      if (state.unrollZoom > 105) {
        canvas.style.maxWidth = 'none';
        canvas.style.maxHeight = 'none';
      } else {
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '54vh';
      }
    } else {
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '54vh';
    }

    const padLeft = state.renderMode === 'blueprint' ? 34 : 18;
    const padTop = state.renderMode === 'blueprint' ? 28 : 18;
    const padRight = 18;
    const padBottom = 18;

    const totalW = padLeft + C * cellW + padRight;
    const totalH = padTop + R * cellH + padBottom;
    if (canvas.width !== totalW || canvas.height !== totalH) {
      canvas.width = totalW;
      canvas.height = totalH;
    }

    state.lastRenderGeom = {
      cellW: cellW,
      cellH: cellH,
      padLeft: padLeft,
      padTop: padTop,
      R: R,
      C: C
    };

    const useCylinder = isUnroll && state.unrollCylinderPct < 100;
    let ctx = canvas.getContext('2d');
    if (useCylinder) {
      if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
      }
      if (offscreenCanvas.width !== totalW || offscreenCanvas.height !== totalH) {
        offscreenCanvas.width = totalW;
        offscreenCanvas.height = totalH;
      }
      ctx = offscreenCanvas.getContext('2d');
    }

    // Palette colors
    let paperColor = '#e4dfd3';
    let darkColor = '#17181b';
    let urucumColor = '#c86d44';
    if (state.palette === 'high-contrast') {
      paperColor = '#f8fafc';
      darkColor = '#090a0f';
      urucumColor = '#ea580c';
    }

    function getWeftColorForRow(r) {
      if (state.palette === 'urucum' && r >= 4 && r <= R - 5) {
        return urucumColor;
      }
      return paperColor;
    }

    ctx.clearRect(0, 0, totalW, totalH);

    if (state.renderMode === 'kinja') {
      // 1. Waimiri Atroari Serrated Graphic Card Mode
      ctx.fillStyle = paperColor;
      ctx.fillRect(0, 0, totalW, totalH);

      // Subtle paper fiber grain
      ctx.fillStyle = 'rgba(120, 110, 90, 0.06)';
      for (let i = 0; i < R * C; i += 3) {
        const gx = (i * 73) % totalW;
        const gy = (i * 41) % totalH;
        ctx.fillRect(gx, gy, 3, 1);
      }

      // If Urucum palette is active, tint middle band background subtly
      if (state.palette === 'urucum') {
        ctx.fillStyle = 'rgba(200, 109, 68, 0.32)';
        ctx.fillRect(padLeft, padTop + 4 * cellH, C * cellW, Math.max(0, (R - 8) * cellH));
      }

      // Draw black cells + iconic 45-degree serrated sawtooth teeth along every black/white boundary!
      ctx.fillStyle = darkColor;
      const toothW = cellW * 0.5;
      const toothDepthY = Math.min(5.2, cellH * 0.24);
      const toothDepthX = Math.min(4.8, cellW * 0.24);

      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          if (grid[r][c] !== 1) continue;
          const x = padLeft + c * cellW;
          const y = padTop + r * cellH;
          ctx.fillRect(x, y, cellW + 0.4, cellH + 0.4);

          if (r === 0 || grid[r - 1][c] === 0) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + toothW * 0.5, y - toothDepthY);
            ctx.lineTo(x + toothW, y);
            ctx.lineTo(x + toothW * 1.5, y - toothDepthY);
            ctx.lineTo(x + cellW, y);
            ctx.closePath();
            ctx.fill();
          }
          if (r === R - 1 || grid[r + 1][c] === 0) {
            ctx.beginPath();
            ctx.moveTo(x, y + cellH);
            ctx.lineTo(x + toothW * 0.5, y + cellH + toothDepthY);
            ctx.lineTo(x + toothW, y + cellH);
            ctx.lineTo(x + toothW * 1.5, y + cellH + toothDepthY);
            ctx.lineTo(x + cellW, y + cellH);
            ctx.closePath();
            ctx.fill();
          }
          if (c > 0 && grid[r][c - 1] === 0) {
            ctx.beginPath();
            ctx.moveTo(x, y + cellH * 0.15);
            ctx.lineTo(x - toothDepthX, y + cellH * 0.5);
            ctx.lineTo(x, y + cellH * 0.85);
            ctx.closePath();
            ctx.fill();
          }
          if (c < C - 1 && grid[r][c + 1] === 0) {
            ctx.beginPath();
            ctx.moveTo(x + cellW, y + cellH * 0.15);
            ctx.lineTo(x + cellW + toothDepthX, y + cellH * 0.5);
            ctx.lineTo(x + cellW, y + cellH * 0.85);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    } else if (state.renderMode === 'basket') {
      // 2. Physical 3D Interlaced Arumã Basket Weave Mode (matching Photos 11 & 12!)
      ctx.fillStyle = '#090b10';
      ctx.fillRect(0, 0, totalW, totalH);

      // Step A: Draw continuous vertical black warp splints (base layer)
      const insetX = Math.max(0.8, Math.min(1.5, cellW * 0.08));
      for (let c = 0; c < C; c++) {
        const x = padLeft + c * cellW + insetX;
        const w = Math.max(2, cellW - insetX * 2);
        const grad = ctx.createLinearGradient(x, 0, x + w, 0);
        grad.addColorStop(0, '#101216');
        grad.addColorStop(0.5, '#262a33');
        grad.addColorStop(1, '#0e1014');
        ctx.fillStyle = grad;
        ctx.fillRect(x, padTop, w, R * cellH);
      }

      // Step B: For each row, draw horizontal weft floats (Over runs) and vertical warp caps (Under cells)
      const insetY = Math.max(1, Math.min(2, cellH * 0.08));
      for (let r = 0; r < R; r++) {
        const y = padTop + r * cellH;
        const runs = window.WeavingPatterns.encodeRowRuns(grid[r]);
        const weftBase = getWeftColorForRow(r);
        const isUrucum = (weftBase === urucumColor);

        for (let i = 0; i < runs.length; i++) {
          const run = runs[i];
          if (run.type === 'over') {
            const rx = padLeft + run.startCol * cellW + 0.5;
            const rw = Math.max(2, run.count * cellW - 1);
            const ry = y + insetY;
            const rh = Math.max(2, cellH - insetY * 2);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(rx - 0.8, ry + 1, rw + 1.6, rh + 1);

            const hGrad = ctx.createLinearGradient(rx, ry, rx + rw, ry);
            if (isUrucum) {
              hGrad.addColorStop(0, '#9e4c28');
              hGrad.addColorStop(0.12, '#ce7146');
              hGrad.addColorStop(0.5, '#df855b');
              hGrad.addColorStop(0.88, '#ce7146');
              hGrad.addColorStop(1, '#9e4c28');
            } else {
              hGrad.addColorStop(0, '#b8a786');
              hGrad.addColorStop(0.12, '#e4d5b7');
              hGrad.addColorStop(0.5, '#f3e7ce');
              hGrad.addColorStop(0.88, '#e4d5b7');
              hGrad.addColorStop(1, '#b8a786');
            }
            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.roundRect(rx, ry, rw, rh, Math.min(3, rh * 0.25));
            ctx.fill();

            if (cellH >= 12) {
              ctx.strokeStyle = isUrucum ? 'rgba(90, 35, 12, 0.25)' : 'rgba(130, 110, 75, 0.25)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(rx + 2, ry + rh * 0.36);
              ctx.lineTo(rx + rw - 2, ry + rh * 0.36);
              ctx.moveTo(rx + 2, ry + rh * 0.68);
              ctx.lineTo(rx + rw - 2, ry + rh * 0.68);
              ctx.stroke();
            }
          } else {
            for (let c = run.startCol; c <= run.endCol; c++) {
              const vx = padLeft + c * cellW + insetX;
              const vw = Math.max(2, cellW - insetX * 2);
              ctx.fillStyle = isUrucum ? 'rgba(158, 76, 40, 0.35)' : 'rgba(184, 167, 134, 0.35)';
              ctx.fillRect(padLeft + c * cellW, y + insetY + 1, cellW, Math.max(1, cellH - (insetY + 1) * 2));

              ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
              ctx.fillRect(vx - 0.8, y, vw + 1.6, cellH);

              const vGrad = ctx.createLinearGradient(vx, y, vx + vw, y);
              vGrad.addColorStop(0, '#12141a');
              vGrad.addColorStop(0.45, '#2d323d');
              vGrad.addColorStop(1, '#101217');
              ctx.fillStyle = vGrad;
              ctx.fillRect(vx, y, vw, cellH);

              ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
              ctx.fillRect(vx + vw * 0.35, y, Math.max(0.8, vw * 0.1), cellH);
            }
          }
        }
      }
    } else {
      // 3. Technical Blueprint Matrix Mode
      ctx.fillStyle = '#0d121c';
      ctx.fillRect(0, 0, totalW, totalH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const colStep = C > 60 ? 4 : 2;
      for (let c = 0; c < C; c += colStep) {
        ctx.fillText(String(c), padLeft + (c + 0.5) * cellW, padTop * 0.5);
      }
      const rowStep = R > 40 ? 2 : 1;
      for (let r = 0; r < R; r += rowStep) {
        ctx.fillText(String(r), padLeft * 0.5, padTop + (r + 0.5) * cellH);
      }

      for (let r = 0; r < R; r++) {
        const weftColor = getWeftColorForRow(r);
        for (let c = 0; c < C; c++) {
          const x = padLeft + c * cellW;
          const y = padTop + r * cellH;
          const isUnder = grid[r][c] === 1;
          ctx.fillStyle = isUnder ? '#1e2433' : weftColor;
          ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);

          if (cellW >= 11) {
            ctx.fillStyle = isUnder ? '#64748b' : '#475569';
            ctx.font = '700 8px "JetBrains Mono", monospace';
            ctx.fillText(isUnder ? '▼' : '▲', x + cellW * 0.5, y + cellH * 0.5);
          }
        }
      }

      // Draw symmetry axes
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      if (state.symmetryMode === 'h' || state.symmetryMode === '4q') {
        const midX = padLeft + (C * cellW) / 2;
        ctx.beginPath();
        ctx.moveTo(midX, padTop);
        ctx.lineTo(midX, padTop + R * cellH);
        ctx.stroke();
      }
      if (state.symmetryMode === '4q') {
        const midY = padTop + (R * cellH) / 2;
        ctx.beginPath();
        ctx.moveTo(padLeft, midY);
        ctx.lineTo(padLeft + C * cellW, midY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Tile Boundaries in Unroll Mode when enabled
    if (isUnroll && state.showTileBounds && state.lastExpandedMeta && state.lastExpandedMeta.tileBounds) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.82)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      const bounds = state.lastExpandedMeta.tileBounds;
      for (let i = 0; i < bounds.length; i++) {
        const b = bounds[i];
        const bx = padLeft + b.c0 * cellW;
        const by = padTop + b.r0 * cellH;
        const bw = (b.c1 - b.c0 + 1) * cellW;
        const bh = (b.r1 - b.r0 + 1) * cellH;
        ctx.strokeRect(bx, by, bw, bh);

        // Tile badge label in top-left corner of each repeating module
        const label = 'Módulo (' + (b.ty + 1) + '×' + (b.tx + 1) + ')';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.fillRect(bx + 3, by + 3, 76, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + 7, by + 11);
      }
      ctx.restore();
    }

    // Highlight newly added/changed cells in Step-by-Step mode (on intermediate steps 1..3)
    if (state.activeTab === 'steps' && state.showDiffHighlight && prevGrid && state.activeStepIndex < pat.steps.length - 1) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          if (grid[r][c] !== prevGrid[r][c]) {
            ctx.strokeRect(
              padLeft + c * cellW + 1,
              padTop + r * cellH + 1,
              cellW - 2,
              cellH - 2
            );
          }
        }
      }
      ctx.restore();
    }

    // Highlight Active Shuttle Row in Row-by-Row Shuttle mode
    if (state.activeTab === 'shuttle') {
      const sr = Math.min(R - 1, Math.max(0, state.activeShuttleRow));
      if (sr < R - 1) {
        ctx.fillStyle = 'rgba(11, 14, 20, 0.52)';
        ctx.fillRect(padLeft, padTop + (sr + 1) * cellH, C * cellW, (R - 1 - sr) * cellH);
      }
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(padLeft - 2, padTop + sr * cellH - 1, C * cellW + 4, cellH + 2);
      ctx.restore();
    }

    // Draw Keyboard / Pointer Cursor Highlight in Playground or Unroll Mode
    const focusR = state.hoverR >= 0 ? state.hoverR : state.cursorR;
    const focusC = state.hoverC >= 0 ? state.hoverC : state.cursorC;
    if ((state.activeTab === 'playground' || state.activeTab === 'unroll') && focusR >= 0 && focusR < R && focusC >= 0 && focusC < C) {
      const prim = window.WeavingPatterns.PRIMITIVES[state.selectedPrimitiveIndex];
      const pR = prim.matrix.length;
      const pC = prim.matrix[0].length;
      const startR = focusR - Math.floor(pR / 2);
      const startC = focusC - Math.floor(pC / 2);
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(
        padLeft + startC * cellW,
        padTop + startR * cellH,
        pC * cellW,
        pR * cellH
      );
      ctx.restore();
    }

    // If 3D Cylindrical Basket Unrolling is active (< 100%), project offscreenCanvas onto main canvas
    if (useCylinder) {
      const mainCtx = canvas.getContext('2d');
      renderCylinderProjection(mainCtx, offscreenCanvas, totalW, totalH, state.unrollCylinderPct);
    }

    // Sync Expanded Dimensions Badge
    const dimsBadge = document.getElementById('expanded-dims-badge');
    if (dimsBadge) {
      dimsBadge.textContent = R + '×' + C + ' talas (' + state.repeatsX + '×' + state.repeatsY + ')';
    }
  }

  /**
   * Convert canvas pointer coordinates to grid (r, c)
   */
  function getGridCoordsFromEvent(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const geom = state.lastRenderGeom;
    if (!geom) return null;

    const c = Math.floor((px - geom.padLeft) / geom.cellW);
    const r = Math.floor((py - geom.padTop) / geom.cellH);
    if (r < 0 || r >= geom.R || c < 0 || c >= geom.C) return null;
    return { r: r, c: c };
  }

  /**
   * Map a coordinate (expR, expC) from the Expanded Tapestry back to its Base Tile coordinate (baseR, baseC)
   */
  function mapExpandedToBaseCoords(expR, expC) {
    const pat = getActivePattern();
    const baseGrid = getBaseTileGrid();
    const bR = baseGrid.length;
    const bC = baseGrid[0].length;
    const strideR = Math.max(1, bR - 1);
    const strideC = Math.max(1, bC - 1);

    let r = expR;
    let c = expC;
    if (state.unrollMode === 'framed') {
      r = Math.max(0, expR - 4);
      c = Math.max(0, expC - 2);
    }
    const ty = Math.floor(r / strideR);
    const tx = Math.floor(c / strideC);
    let localR = r % strideR;
    let localC = c % strideC;

    if (state.unrollMode === 'mirror') {
      if (ty % 2 === 1) localR = (bR - 1) - localR;
      if (tx % 2 === 1) localC = (bC - 1) - localC;
    }
    return {
      r: Math.min(bR - 1, Math.max(0, localR)),
      c: Math.min(bC - 1, Math.max(0, localC))
    };
  }

  /**
   * Stamp the active primitive at (r, c) in Playground or Unroll mode
   */
  function applyStampAt(r, c, isDirectBaseCoords) {
    const pat = getActivePattern();
    if (state.activeTab !== 'playground' && state.activeTab !== 'unroll') {
      state.userGrid = window.WeavingPatterns.cloneGrid(getDisplayGrid());
      switchTab('playground');
    }
    if (!state.userGrid) {
      state.userGrid = window.WeavingPatterns.cloneGrid(pat.grid);
    }

    let targetR = r;
    let targetC = c;
    if (state.activeTab === 'unroll' && !isDirectBaseCoords) {
      const mapped = mapExpandedToBaseCoords(r, c);
      targetR = mapped.r;
      targetC = mapped.c;
    }

    const prim = window.WeavingPatterns.PRIMITIVES[state.selectedPrimitiveIndex];
    let invertVal = state.invertStamp;
    if (prim.matrix.length === 1 && prim.matrix[0].length === 1) {
      invertVal = state.userGrid[targetR][targetC] === 1 ? 0 : 1;
    }
    state.userGrid = window.WeavingPatterns.applyPrimitiveWithSymmetry(
      state.userGrid,
      prim.matrix,
      targetR,
      targetC,
      state.symmetryMode,
      invertVal,
      pat.tilePeriod
    );
    playShuttleClick(state.userGrid[targetR][targetC] === 1);
    renderMainLoom();
    renderMiniTileEditor();
    updateMatchMeter();
    saveStateToStorage();
  }

  function updateMatchMeter() {
    const pat = getActivePattern();
    const current = getBaseTileGrid();
    const metrics = window.WeavingPatterns.computeGridMatch(current, pat.grid);
    const pctEl = document.getElementById('match-pct-val');
    const barEl = document.getElementById('match-progress-bar');
    if (pctEl) pctEl.textContent = metrics.percentage + '% (' + metrics.matchingCells + '/' + metrics.totalCells + ')';
    if (barEl) barEl.style.width = metrics.percentage + '%';
  }

  /**
   * Render the Callout & Run-Length Recipe below the Loom Canvas
   */
  function updateLiveCallout() {
    const pat = getActivePattern();
    const grid = getDisplayGrid();
    const titleEl = document.getElementById('callout-title');
    const descEl = document.getElementById('callout-desc');
    const pillsContainer = document.getElementById('run-pills-container');

    if (!titleEl || !descEl || !pillsContainer) return;
    clearChildren(pillsContainer);

    let targetRow = state.activeShuttleRow;
    if (state.activeTab === 'unroll') {
      const modeNames = {
        seamless: 'Sarja Contínua Sem Costura (Fase [▲1 ▼3] preservada)',
        mirror: 'Espelhamento Caleidoscópico 4-Quadrantes',
        concentric: 'Irradiação Concêntrica Infinita (Ondas a partir do centro)',
        framed: 'Painel Arquitetônico em Moldura Única'
      };
      titleEl.textContent = 'Tapete Expandido (' + state.repeatsX + '×' + state.repeatsY + ' módulos = ' + grid.length + '×' + grid[0].length + ' talas) — ' + (modeNames[state.unrollMode] || '');
      descEl.textContent = 'Clique em qualquer ponto do tapete expandido (ou na Mini-Matriz ao lado) para editar a célula-base e ver a mudança se propagar em tempo real por toda a esteira!';
      const badge1 = document.createElement('span');
      badge1.className = 'run-pill run-pill-over';
      badge1.textContent = 'Módulo Base: ' + pat.rows + '×' + pat.cols;
      const badge2 = document.createElement('span');
      badge2.className = 'run-pill run-pill-under';
      badge2.textContent = 'Tapete Total: ' + grid.length + '×' + grid[0].length + ' (' + (grid.length * grid[0].length) + ' cruzamentos)';
      pillsContainer.appendChild(badge1);
      pillsContainer.appendChild(badge2);
      return;
    } else if (state.activeTab === 'steps') {
      const stepObj = pat.steps[state.activeStepIndex] || pat.steps[pat.steps.length - 1];
      titleEl.textContent = pat.kinjaName + ' — ' + stepObj.title;
      descEl.textContent = stepObj.description;
      const fBadge = document.createElement('span');
      fBadge.className = 'run-pill run-pill-over';
      fBadge.textContent = 'Fórmula: ' + stepObj.formula;
      pillsContainer.appendChild(fBadge);
      return;
    } else if (state.activeTab === 'playground') {
      const prim = window.WeavingPatterns.PRIMITIVES[state.selectedPrimitiveIndex];
      titleEl.textContent = 'Modo Construtor Livre — Primitiva: ' + prim.name;
      descEl.textContent = 'Clique no tear (ou use as setas + Espaço/Enter) para carimbar "' + prim.kinjaName + '" com simetria ' + state.symmetryMode.toUpperCase() + '.';
      targetRow = state.cursorR;
    } else {
      titleEl.textContent = 'Linha ' + targetRow + ' de ' + (grid.length - 1) + ' — Receita da Tala Horizontal (Trama)';
      descEl.textContent = 'Passe a tala horizontal de arumã da esquerda para a direita seguindo a sequência ▼ Por Baixo (urdidura preta visível) e ▲ Por Cima (trama clara visível):';
    }

    const rowArr = grid[Math.min(grid.length - 1, Math.max(0, targetRow))];
    const runs = window.WeavingPatterns.encodeRowRuns(rowArr);
    runs.forEach(function (run) {
      const pill = document.createElement('span');
      pill.className = 'run-pill ' + (run.type === 'under' ? 'run-pill-under' : 'run-pill-over');
      pill.textContent = (run.type === 'under' ? '▼' : '▲') + run.count;
      pill.title = (run.type === 'under' ? 'Por baixo de ' : 'Por cima de ') + run.count + ' tala(s) (cols ' + run.startCol + '–' + run.endCol + ')';
      pillsContainer.appendChild(pill);
    });
  }

  /**
   * Render the Left Sidebar Pattern Catalog (12 patterns)
   */
  function renderCatalogSidebar() {
    const listEl = document.getElementById('pattern-catalog-list');
    if (!listEl) return;
    clearChildren(listEl);

    window.WeavingPatterns.CATALOG.forEach(function (pat, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pattern-card-item';
      btn.setAttribute('role', 'option');
      const isSelected = idx === state.selectedPatternIndex;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      btn.setAttribute('tabindex', isSelected ? '0' : '-1');
      btn.dataset.index = String(idx);

      const thumb = document.createElement('canvas');
      thumb.className = 'pattern-thumb-canvas';
      thumb.width = 66;
      thumb.height = 66;
      thumb.setAttribute('aria-hidden', 'true');
      drawMiniGrid(thumb, pat.grid);

      const meta = document.createElement('div');
      meta.className = 'pattern-card-meta';

      const kTitle = document.createElement('div');
      kTitle.className = 'pattern-card-kinja';
      kTitle.textContent = pat.kinjaName;

      const ptTitle = document.createElement('div');
      ptTitle.className = 'pattern-card-pt';
      ptTitle.textContent = pat.ptName;

      const enTitle = document.createElement('div');
      enTitle.className = 'pattern-card-en';
      const enSpan = document.createElement('span');
      enSpan.textContent = pat.enName;
      const dimSpan = document.createElement('span');
      dimSpan.textContent = pat.rows + '×' + pat.cols;
      enTitle.appendChild(enSpan);
      enTitle.appendChild(dimSpan);

      meta.appendChild(kTitle);
      meta.appendChild(ptTitle);
      meta.appendChild(enTitle);

      btn.appendChild(thumb);
      btn.appendChild(meta);

      btn.addEventListener('click', function () {
        selectPattern(idx);
      });

      listEl.appendChild(btn);
    });
  }

  /**
   * Render the Step-by-Step Timeline in Tab 1
   */
  function renderStepsTimeline() {
    const container = document.getElementById('steps-timeline');
    if (!container) return;
    clearChildren(container);

    const pat = getActivePattern();
    pat.steps.forEach(function (st, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'step-card-btn';
      if (idx === state.activeStepIndex) {
        btn.setAttribute('aria-current', 'step');
      }

      const title = document.createElement('div');
      title.className = 'step-card-title';
      title.textContent = st.title;

      const desc = document.createElement('div');
      desc.className = 'step-card-desc';
      desc.textContent = st.description;

      const form = document.createElement('div');
      form.className = 'step-card-formula';
      form.textContent = st.formula;

      btn.appendChild(title);
      btn.appendChild(desc);
      btn.appendChild(form);

      btn.addEventListener('click', function () {
        stopAutoPlay();
        state.activeStepIndex = idx;
        if (state.activeTab !== 'steps') {
          switchTab('steps');
        } else {
          renderStepsTimeline();
          renderMainLoom();
          updateLiveCallout();
        }
        announce(st.title + '. ' + st.description);
      });

      container.appendChild(btn);
    });
  }

  /**
   * Render the Primitive Stamps Palette in Tab 3
   */
  function renderPrimitivesPalette() {
    const container = document.getElementById('primitives-grid');
    if (!container) return;
    clearChildren(container);

    window.WeavingPatterns.PRIMITIVES.forEach(function (prim, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'primitive-stamp-btn';
      btn.setAttribute('role', 'option');
      const isSelected = idx === state.selectedPrimitiveIndex;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      btn.setAttribute('tabindex', isSelected ? '0' : '-1');

      const mini = document.createElement('canvas');
      mini.className = 'primitive-mini-canvas';
      mini.width = 42;
      mini.height = 42;
      mini.setAttribute('aria-hidden', 'true');
      const previewGrid = prim.matrix.map(function (r) {
        return r.map(function (v) { return v === 1 ? 1 : 0; });
      });
      drawMiniGrid(mini, previewGrid);

      const info = document.createElement('div');
      info.className = 'primitive-stamp-info';

      const t = document.createElement('span');
      t.className = 'primitive-stamp-title';
      t.textContent = prim.kinjaName;

      const sub = document.createElement('span');
      sub.className = 'primitive-stamp-sub';
      sub.textContent = prim.category + ' (' + prim.matrix.length + '×' + prim.matrix[0].length + ')';

      info.appendChild(t);
      info.appendChild(sub);

      btn.appendChild(mini);
      btn.appendChild(info);

      btn.addEventListener('click', function () {
        state.selectedPrimitiveIndex = idx;
        renderPrimitivesPalette();
        const descEl = document.getElementById('selected-primitive-desc');
        if (descEl) descEl.textContent = prim.description;
        updateLiveCallout();
        renderMainLoom();
        announce('Primitiva selecionada: ' + prim.name);
      });

      container.appendChild(btn);
    });
  }

  function updateReferenceCard() {
    const pat = getActivePattern();
    const card = document.getElementById('reference-photo-card');
    const img = document.getElementById('reference-photo-img');
    const cap = document.getElementById('reference-photo-caption');
    const culturalEl = document.getElementById('cultural-note-text');
    const headerTitle = document.getElementById('active-pattern-heading');

    if (headerTitle) {
      headerTitle.textContent = pat.kinjaName + ' — ' + pat.ptName + ' (' + pat.enName + ')';
    }
    if (culturalEl) {
      culturalEl.textContent = pat.culturalNote;
    }
    if (card) {
      card.hidden = !state.showReferencePhoto || (state.activeTab === 'unroll' && state.repeatsX >= 3);
    }
    if (img) {
      img.src = pat.image;
      img.alt = pat.kinjaName + ' - ' + pat.ptName + ' (' + pat.enName + ')';
    }
    if (cap) {
      cap.textContent = pat.kinjaName + ' • ' + pat.ptName + ' (' + pat.rows + '×' + pat.cols + ')';
    }
  }

  function syncToolbarButtons() {
    document.querySelectorAll('[data-render-mode]').forEach(function (btn) {
      const active = btn.dataset.renderMode === state.renderMode;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-palette]').forEach(function (btn) {
      const active = btn.dataset.palette === state.palette;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-symmetry]').forEach(function (btn) {
      const active = btn.dataset.symmetry === state.symmetryMode;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-unroll-mode]').forEach(function (btn) {
      const active = btn.dataset.unrollMode === state.unrollMode;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.querySelectorAll('.unroll-preset-btn').forEach(function (btn) {
      const rx = parseInt(btn.dataset.rx || '0', 10);
      const ry = parseInt(btn.dataset.ry || '0', 10);
      const active = (state.activeTab === 'unroll' && rx === state.repeatsX && ry === state.repeatsY) ||
                     (state.activeTab !== 'unroll' && rx === 1 && ry === 1);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const quickUnrollBtn = document.getElementById('btn-quick-unroll');
    if (quickUnrollBtn) {
      quickUnrollBtn.setAttribute('aria-pressed', state.activeTab === 'unroll' ? 'true' : 'false');
    }
    const unrollBar = document.getElementById('unroll-stage-bar');
    if (unrollBar) {
      unrollBar.hidden = state.activeTab !== 'unroll';
    }

    const rxSlider = document.getElementById('unroll-rx-slider');
    const rxLabel = document.getElementById('unroll-rx-label');
    if (rxSlider) rxSlider.value = String(state.repeatsX);
    if (rxLabel) rxLabel.textContent = state.repeatsX + '× (' + state.repeatsX + ' módulo' + (state.repeatsX > 1 ? 's' : '') + ')';

    const rySlider = document.getElementById('unroll-ry-slider');
    const ryLabel = document.getElementById('unroll-ry-label');
    if (rySlider) rySlider.value = String(state.repeatsY);
    if (ryLabel) ryLabel.textContent = state.repeatsY + '× (' + state.repeatsY + ' faixa' + (state.repeatsY > 1 ? 's' : '') + ')';

    const zoomSlider = document.getElementById('unroll-zoom-slider');
    const zoomLabel = document.getElementById('unroll-zoom-label');
    if (zoomSlider) zoomSlider.value = String(state.unrollZoom);
    if (zoomLabel) zoomLabel.textContent = state.unrollZoom + '%';

    const cylSlider = document.getElementById('unroll-cylinder-slider');
    const cylVal = document.getElementById('unroll-cylinder-val');
    if (cylSlider) cylSlider.value = String(state.unrollCylinderPct);
    if (cylVal) cylVal.textContent = state.unrollCylinderPct + '%';

    const boundsBtn = document.getElementById('btn-toggle-tile-bounds');
    if (boundsBtn) {
      boundsBtn.setAttribute('aria-pressed', state.showTileBounds ? 'true' : 'false');
    }

    const refBtn = document.getElementById('btn-toggle-ref');
    if (refBtn) {
      refBtn.setAttribute('aria-pressed', state.showReferencePhoto ? 'true' : 'false');
    }
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');
    }
    const shuttleSlider = document.getElementById('shuttle-row-slider');
    const shuttleLabel = document.getElementById('shuttle-row-label');
    const pat = getActivePattern();
    if (shuttleSlider) {
      shuttleSlider.max = String(pat.rows - 1);
      shuttleSlider.value = String(state.activeShuttleRow);
    }
    if (shuttleLabel) {
      shuttleLabel.textContent = 'Linha ' + state.activeShuttleRow + ' / ' + (pat.rows - 1);
    }
  }

  function switchTab(tabId) {
    stopAutoPlay();
    state.activeTab = tabId;
    document.querySelectorAll('[data-tab-target]').forEach(function (btn) {
      const active = btn.dataset.tabTarget === tabId;
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.tab-panel-content').forEach(function (panel) {
      panel.hidden = panel.id !== 'panel-' + tabId;
    });
    const pat = getActivePattern();
    if ((tabId === 'playground' || tabId === 'unroll') && !state.userGrid) {
      state.userGrid = window.WeavingPatterns.cloneGrid(pat.grid);
    }
    updateReferenceCard();
    syncToolbarButtons();
    renderMainLoom();
    renderMiniTileEditor();
    updateLiveCallout();
    updateMatchMeter();
  }

  function selectPattern(idx) {
    stopAutoPlay();
    state.selectedPatternIndex = idx;
    const pat = getActivePattern();
    state.renderMode = pat.defaultRenderMode || 'kinja';
    state.palette = pat.palette || 'natural';
    state.symmetryMode = pat.symmetry || '4q';
    state.activeStepIndex = pat.steps.length - 1;
    state.activeShuttleRow = 0;
    state.cursorR = Math.floor(pat.rows / 2);
    state.cursorC = Math.floor(pat.cols / 2);
    state.userGrid = window.WeavingPatterns.cloneGrid(pat.grid);

    renderCatalogSidebar();
    renderStepsTimeline();
    updateReferenceCard();
    syncToolbarButtons();
    renderMainLoom();
    renderMiniTileEditor();
    updateLiveCallout();
    updateMatchMeter();
    announce('Padrão selecionado: ' + pat.kinjaName + ', ' + pat.ptName);
  }

  function stopAutoPlay() {
    if (state.autoPlayTimer) {
      clearInterval(state.autoPlayTimer);
      state.autoPlayTimer = null;
    }
    if (state.unrollAnimTimer) {
      clearInterval(state.unrollAnimTimer);
      state.unrollAnimTimer = null;
    }
    const playStepsBtn = document.getElementById('btn-play-steps');
    if (playStepsBtn) {
      playStepsBtn.textContent = '▶ Animar Primitivas';
      playStepsBtn.setAttribute('aria-pressed', 'false');
    }
    const playShuttleBtn = document.getElementById('btn-play-shuttle');
    if (playShuttleBtn) {
      playShuttleBtn.textContent = '▶ Tecer Linha a Linha';
      playShuttleBtn.setAttribute('aria-pressed', 'false');
    }
  }

  function toggleAnimateUnroll3D() {
    if (state.unrollAnimTimer) {
      stopAutoPlay();
      return;
    }
    if (state.activeTab !== 'unroll') {
      switchTab('unroll');
    }
    state.unrollCylinderPct = 0;
    syncToolbarButtons();
    renderMainLoom();
    announce('Iniciando animação de desenrolar cesto 3D para tapete 2D.');

    state.unrollAnimTimer = setInterval(function () {
      if (state.unrollCylinderPct < 100) {
        state.unrollCylinderPct = Math.min(100, state.unrollCylinderPct + 4);
        syncToolbarButtons();
        renderMainLoom();
      } else {
        stopAutoPlay();
        announce('Tapete totalmente desenrolado em 2D.');
      }
    }, 45);
  }

  function togglePlaySteps() {
    if (state.autoPlayTimer) {
      stopAutoPlay();
      return;
    }
    const pat = getActivePattern();
    if (state.activeTab !== 'steps') switchTab('steps');
    state.activeStepIndex = 0;
    renderStepsTimeline();
    renderMainLoom();
    updateLiveCallout();

    const btn = document.getElementById('btn-play-steps');
    if (btn) {
      btn.textContent = '⏸ Pausar';
      btn.setAttribute('aria-pressed', 'true');
    }

    state.autoPlayTimer = setInterval(function () {
      if (state.activeStepIndex < pat.steps.length - 1) {
        state.activeStepIndex++;
        playShuttleClick(true);
        renderStepsTimeline();
        renderMainLoom();
        updateLiveCallout();
        announce(pat.steps[state.activeStepIndex].title);
      } else {
        stopAutoPlay();
      }
    }, 1100);
  }

  function togglePlayShuttle() {
    if (state.autoPlayTimer) {
      stopAutoPlay();
      return;
    }
    const pat = getActivePattern();
    if (state.activeTab !== 'shuttle') switchTab('shuttle');
    if (state.activeShuttleRow >= pat.rows - 1) {
      state.activeShuttleRow = 0;
    }
    syncToolbarButtons();
    renderMainLoom();
    updateLiveCallout();

    const btn = document.getElementById('btn-play-shuttle');
    if (btn) {
      btn.textContent = '⏸ Pausar Tear';
      btn.setAttribute('aria-pressed', 'true');
    }

    state.autoPlayTimer = setInterval(function () {
      if (state.activeShuttleRow < pat.rows - 1) {
        state.activeShuttleRow++;
        playShuttleClick(state.activeShuttleRow % 2 === 0);
        syncToolbarButtons();
        renderMainLoom();
        updateLiveCallout();
      } else {
        stopAutoPlay();
        announce('Tecelagem concluída: ' + pat.kinjaName);
      }
    }, 420);
  }

  function saveStateToStorage() {
    try {
      const payload = {
        selectedPatternIndex: state.selectedPatternIndex,
        renderMode: state.renderMode,
        palette: state.palette,
        symmetryMode: state.symmetryMode,
        unrollMode: state.unrollMode,
        repeatsX: state.repeatsX,
        repeatsY: state.repeatsY,
        userGrid: state.userGrid
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
      // Ignore quota errors
    }
  }

  function exportPatternJSON() {
    const pat = getActivePattern();
    const grid = getDisplayGrid();
    const data = {
      version: 1,
      kinjaName: pat.kinjaName,
      ptName: pat.ptName,
      enName: pat.enName,
      mode: state.activeTab,
      unrollMode: state.unrollMode,
      repeatsX: state.repeatsX,
      repeatsY: state.repeatsY,
      rows: grid.length,
      cols: grid[0].length,
      palette: state.palette,
      symmetry: state.symmetryMode,
      grid: grid
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pat.id + (state.activeTab === 'unroll' ? '-expanded-' + state.repeatsX + 'x' + state.repeatsY : '') + '-weaving.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    announce('Padrão exportado em JSON.');
  }

  function exportTapestryPNG() {
    const canvas = document.getElementById('loom-canvas');
    if (!canvas) return;
    const pat = getActivePattern();
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    const suffix = state.activeTab === 'unroll' ? '-tapete-' + state.repeatsX + 'x' + state.repeatsY : '-card';
    a.download = pat.id + suffix + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    announce('Imagem PNG exportada com sucesso.');
  }

  function importPatternJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const parsed = JSON.parse(String(ev.target.result));
        if (Array.isArray(parsed.grid) && parsed.grid.length > 0 && Array.isArray(parsed.grid[0])) {
          state.userGrid = parsed.grid.map(function (row) {
            return row.map(function (cell) { return cell ? 1 : 0; });
          });
          if (parsed.palette) state.palette = parsed.palette;
          switchTab('playground');
          syncToolbarButtons();
          renderMainLoom();
          updateLiveCallout();
          updateMatchMeter();
          announce('Padrão importado com sucesso.');
        }
      } catch (_) {
        announce('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  }

  function initEvents() {
    // Spatial navigation on listbox containers
    attachSpatialNavigation(
      document.getElementById('pattern-catalog-list'),
      '.pattern-card-item',
      function (el) {
        const idx = parseInt(el.dataset.index || '0', 10);
        selectPattern(idx);
      }
    );
    attachSpatialNavigation(
      document.getElementById('primitives-grid'),
      '.primitive-stamp-btn',
      function (el) {
        el.click();
      }
    );

    // Render mode buttons
    document.querySelectorAll('[data-render-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.renderMode = btn.dataset.renderMode;
        syncToolbarButtons();
        renderMainLoom();
        announce('Modo de visualização: ' + btn.textContent.trim());
      });
    });

    // Palette buttons
    document.querySelectorAll('[data-palette]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.palette = btn.dataset.palette;
        syncToolbarButtons();
        renderMainLoom();
        announce('Paleta de cores: ' + btn.textContent.trim());
      });
    });

    // Symmetry buttons
    document.querySelectorAll('[data-symmetry]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.symmetryMode = btn.dataset.symmetry;
        syncToolbarButtons();
        renderMainLoom();
        updateLiveCallout();
        announce('Simetria: ' + btn.textContent.trim());
      });
    });

    // Mode tabs
    document.querySelectorAll('[data-tab-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.dataset.tabTarget);
      });
    });

    // Quick Unroll header button
    const quickUnrollBtn = document.getElementById('btn-quick-unroll');
    if (quickUnrollBtn) {
      quickUnrollBtn.addEventListener('click', function () {
        if (state.activeTab === 'unroll') {
          switchTab('steps');
          announce('Modo peça única 1x1 ativado.');
        } else {
          switchTab('unroll');
          announce('Modo Tapete Expandido ativado: ' + state.repeatsX + ' por ' + state.repeatsY + ' módulos.');
        }
      });
    }

    // Scale preset buttons in Unroll Stage Bar
    document.querySelectorAll('.unroll-preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const rx = parseInt(btn.dataset.rx || '1', 10);
        const ry = parseInt(btn.dataset.ry || '1', 10);
        if (rx === 1 && ry === 1) {
          switchTab('steps');
          announce('Visualizando peça única 1 por 1.');
          return;
        }
        state.repeatsX = rx;
        state.repeatsY = ry;
        if (state.activeTab !== 'unroll') {
          switchTab('unroll');
        } else {
          updateReferenceCard();
          syncToolbarButtons();
          renderMainLoom();
          updateLiveCallout();
        }
        announce('Tapete expandido para ' + rx + ' por ' + ry + ' módulos.');
      });
    });

    // Unroll topology mode buttons
    document.querySelectorAll('[data-unroll-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.unrollMode = btn.dataset.unrollMode;
        if (state.activeTab !== 'unroll') switchTab('unroll');
        syncToolbarButtons();
        renderMainLoom();
        updateLiveCallout();
        announce('Topologia de expansão: ' + btn.textContent.trim());
      });
    });

    // Unroll sliders (repeatsX, repeatsY, zoom, 3D cylinder)
    const rxSlider = document.getElementById('unroll-rx-slider');
    if (rxSlider) {
      rxSlider.addEventListener('input', function () {
        state.repeatsX = parseInt(rxSlider.value, 10) || 1;
        updateReferenceCard();
        syncToolbarButtons();
        renderMainLoom();
        updateLiveCallout();
      });
    }
    const rySlider = document.getElementById('unroll-ry-slider');
    if (rySlider) {
      rySlider.addEventListener('input', function () {
        state.repeatsY = parseInt(rySlider.value, 10) || 1;
        syncToolbarButtons();
        renderMainLoom();
        updateLiveCallout();
      });
    }
    const zoomSlider = document.getElementById('unroll-zoom-slider');
    if (zoomSlider) {
      zoomSlider.addEventListener('input', function () {
        state.unrollZoom = parseInt(zoomSlider.value, 10) || 100;
        syncToolbarButtons();
        renderMainLoom();
      });
    }
    const cylSlider = document.getElementById('unroll-cylinder-slider');
    if (cylSlider) {
      cylSlider.addEventListener('input', function () {
        stopAutoPlay();
        state.unrollCylinderPct = parseInt(cylSlider.value, 10);
        syncToolbarButtons();
        renderMainLoom();
      });
    }

    const animUnrollBtn1 = document.getElementById('btn-animate-unroll');
    if (animUnrollBtn1) {
      animUnrollBtn1.addEventListener('click', toggleAnimateUnroll3D);
    }
    const animUnrollBtn2 = document.getElementById('btn-animate-unroll-side');
    if (animUnrollBtn2) {
      animUnrollBtn2.addEventListener('click', toggleAnimateUnroll3D);
    }

    const boundsBtn = document.getElementById('btn-toggle-tile-bounds');
    if (boundsBtn) {
      boundsBtn.addEventListener('click', function () {
        state.showTileBounds = !state.showTileBounds;
        syncToolbarButtons();
        renderMainLoom();
      });
    }

    // Mini Base-Tile Editor pointer interaction
    const miniCanvas = document.getElementById('mini-tile-canvas');
    if (miniCanvas) {
      miniCanvas.addEventListener('pointerdown', function (e) {
        const rect = miniCanvas.getBoundingClientRect();
        const baseGrid = getBaseTileGrid();
        const bR = baseGrid.length;
        const bC = baseGrid[0].length;
        const c = Math.floor(((e.clientX - rect.left) / rect.width) * bC);
        const r = Math.floor(((e.clientY - rect.top) / rect.height) * bR);
        if (r >= 0 && r < bR && c >= 0 && c < bC) {
          applyStampAt(r, c, true);
        }
      });
    }

    // Reference photo toggle
    const refBtn = document.getElementById('btn-toggle-ref');
    if (refBtn) {
      refBtn.addEventListener('click', function () {
        state.showReferencePhoto = !state.showReferencePhoto;
        updateReferenceCard();
        syncToolbarButtons();
      });
    }

    // Sound toggle
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        state.soundEnabled = !state.soundEnabled;
        syncToolbarButtons();
        if (state.soundEnabled) playShuttleClick(true);
      });
    }

    // Step navigation controls
    const prevStepBtn = document.getElementById('btn-prev-step');
    if (prevStepBtn) {
      prevStepBtn.addEventListener('click', function () {
        stopAutoPlay();
        if (state.activeStepIndex > 0) {
          state.activeStepIndex--;
          renderStepsTimeline();
          renderMainLoom();
          updateLiveCallout();
        }
      });
    }
    const nextStepBtn = document.getElementById('btn-next-step');
    if (nextStepBtn) {
      nextStepBtn.addEventListener('click', function () {
        stopAutoPlay();
        const pat = getActivePattern();
        if (state.activeStepIndex < pat.steps.length - 1) {
          state.activeStepIndex++;
          renderStepsTimeline();
          renderMainLoom();
          updateLiveCallout();
        }
      });
    }
    const playStepsBtn = document.getElementById('btn-play-steps');
    if (playStepsBtn) {
      playStepsBtn.addEventListener('click', togglePlaySteps);
    }

    // Shuttle controls
    const shuttleSlider = document.getElementById('shuttle-row-slider');
    if (shuttleSlider) {
      shuttleSlider.addEventListener('input', function () {
        stopAutoPlay();
        state.activeShuttleRow = parseInt(shuttleSlider.value, 10) || 0;
        syncToolbarButtons();
        renderMainLoom();
        updateLiveCallout();
      });
    }
    const prevRowBtn = document.getElementById('btn-prev-row');
    if (prevRowBtn) {
      prevRowBtn.addEventListener('click', function () {
        stopAutoPlay();
        if (state.activeShuttleRow > 0) {
          state.activeShuttleRow--;
          syncToolbarButtons();
          renderMainLoom();
          updateLiveCallout();
        }
      });
    }
    const nextRowBtn = document.getElementById('btn-next-row');
    if (nextRowBtn) {
      nextRowBtn.addEventListener('click', function () {
        stopAutoPlay();
        const pat = getActivePattern();
        if (state.activeShuttleRow < pat.rows - 1) {
          state.activeShuttleRow++;
          syncToolbarButtons();
          renderMainLoom();
          updateLiveCallout();
        }
      });
    }
    const playShuttleBtn = document.getElementById('btn-play-shuttle');
    if (playShuttleBtn) {
      playShuttleBtn.addEventListener('click', togglePlayShuttle);
    }

    // Playground actions (Clear to Frame, Load Twill Base, Reset to Original)
    const clearBtn = document.getElementById('btn-clear-loom');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        const pat = getActivePattern();
        state.userGrid = window.WeavingPatterns.cloneGrid(pat.steps[0].grid);
        switchTab('playground');
        renderMainLoom();
        updateMatchMeter();
        announce('Tear limpo para a moldura inicial.');
      });
    }
    const twillBaseBtn = document.getElementById('btn-load-twill');
    if (twillBaseBtn) {
      twillBaseBtn.addEventListener('click', function () {
        const pat = getActivePattern();
        state.userGrid = window.WeavingPatterns.cloneGrid(pat.steps[1].grid);
        switchTab('playground');
        renderMainLoom();
        updateMatchMeter();
        announce('Base de sarja carregada no tear.');
      });
    }
    const resetBtn = document.getElementById('btn-reset-pattern');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        const pat = getActivePattern();
        state.userGrid = window.WeavingPatterns.cloneGrid(pat.grid);
        renderMainLoom();
        renderMiniTileEditor();
        updateMatchMeter();
        announce('Padrão original restaurado.');
      });
    }

    // Canvas pointer & keyboard interactions
    const canvas = document.getElementById('loom-canvas');
    if (canvas) {
      canvas.addEventListener('pointerdown', function (e) {
        const coords = getGridCoordsFromEvent(canvas, e);
        if (!coords) return;
        state.isPointerDown = true;
        state.cursorR = coords.r;
        state.cursorC = coords.c;
        applyStampAt(coords.r, coords.c, false);
      });
      canvas.addEventListener('pointermove', function (e) {
        const coords = getGridCoordsFromEvent(canvas, e);
        if (!coords) {
          state.hoverR = -1;
          state.hoverC = -1;
          renderMainLoom();
          return;
        }
        if (state.hoverR !== coords.r || state.hoverC !== coords.c) {
          state.hoverR = coords.r;
          state.hoverC = coords.c;
          if (state.isPointerDown && state.selectedPrimitiveIndex === 0) {
            applyStampAt(coords.r, coords.c, false);
          } else {
            renderMainLoom();
          }
        }
      });
      window.addEventListener('pointerup', function () {
        state.isPointerDown = false;
      });
      canvas.addEventListener('pointerleave', function () {
        state.hoverR = -1;
        state.hoverC = -1;
        renderMainLoom();
      });

      // Keyboard accessibility on canvas (Arrow keys to move cursor, Enter on keydown, Space on keyup)
      canvas.addEventListener('keydown', function (e) {
        const grid = getDisplayGrid();
        const R = grid.length;
        const C = grid[0].length;
        if (e.key === 'ArrowUp' && state.cursorR > 0) {
          e.preventDefault();
          state.cursorR--;
          renderMainLoom();
        } else if (e.key === 'ArrowDown' && state.cursorR < R - 1) {
          e.preventDefault();
          state.cursorR++;
          renderMainLoom();
        } else if (e.key === 'ArrowLeft' && state.cursorC > 0) {
          e.preventDefault();
          state.cursorC--;
          renderMainLoom();
        } else if (e.key === 'ArrowRight' && state.cursorC < C - 1) {
          e.preventDefault();
          state.cursorC++;
          renderMainLoom();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          applyStampAt(state.cursorR, state.cursorC, false);
        } else if (e.key === ' ') {
          e.preventDefault();
        }
      });
      canvas.addEventListener('keyup', function (e) {
        if (e.key === ' ') {
          e.preventDefault();
          applyStampAt(state.cursorR, state.cursorC, false);
        }
      });
    }

    // Export / Import JSON & PNG
    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportPatternJSON);
    }
    const exportPngBtn = document.getElementById('btn-export-png');
    if (exportPngBtn) {
      exportPngBtn.addEventListener('click', exportTapestryPNG);
    }
    const importBtn = document.getElementById('btn-import-json');
    const importInput = document.getElementById('input-import-json');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', function () {
        importInput.click();
      });
      importInput.addEventListener('change', function () {
        if (importInput.files && importInput.files[0]) {
          importPatternJSON(importInput.files[0]);
          importInput.value = '';
        }
      });
    }

    // Native <dialog> modal for Reference Gallery Inspection
    const openGalleryBtn = document.getElementById('btn-open-gallery-dialog');
    const galleryDialog = document.getElementById('gallery-dialog');
    const closeGalleryBtn = document.getElementById('btn-close-gallery-dialog');
    if (openGalleryBtn && galleryDialog) {
      openGalleryBtn.addEventListener('click', function () {
        if (typeof galleryDialog.showModal === 'function') {
          galleryDialog.showModal();
        }
      });
    }
    if (closeGalleryBtn && galleryDialog) {
      closeGalleryBtn.addEventListener('click', function () {
        galleryDialog.close();
      });
    }
  }

  function populateGalleryDialog() {
    const gridEl = document.getElementById('dialog-gallery-grid');
    const dialog = document.getElementById('gallery-dialog');
    if (!gridEl) return;
    clearChildren(gridEl);

    window.WeavingPatterns.CATALOG.forEach(function (pat, idx) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'pattern-card-item';
      card.style.gridTemplateColumns = '90px 1fr';

      const img = document.createElement('img');
      img.src = pat.image;
      img.alt = pat.kinjaName + ' - ' + pat.ptName;
      img.style.width = '90px';
      img.style.height = '68px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '6px';

      const meta = document.createElement('div');
      meta.className = 'pattern-card-meta';

      const k = document.createElement('div');
      k.className = 'pattern-card-kinja';
      k.textContent = pat.kinjaName;

      const p = document.createElement('div');
      p.className = 'pattern-card-pt';
      p.textContent = pat.ptName + ' • ' + pat.enName;

      const note = document.createElement('div');
      note.className = 'pattern-card-en';
      note.style.whiteSpace = 'normal';
      note.textContent = pat.culturalNote;

      meta.appendChild(k);
      meta.appendChild(p);
      meta.appendChild(note);

      card.appendChild(img);
      card.appendChild(meta);

      card.addEventListener('click', function () {
        selectPattern(idx);
        if (dialog && typeof dialog.close === 'function') {
          dialog.close();
        }
      });

      gridEl.appendChild(card);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.WeavingPatterns) return;
    renderCatalogSidebar();
    renderPrimitivesPalette();
    populateGalleryDialog();
    initEvents();
    selectPattern(0);
  });
})();
