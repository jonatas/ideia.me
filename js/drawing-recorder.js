// ─── Minimal APNG encoder (self-contained) ──────────────────────────────────
// Encodes an array of ImageData frames into an APNG binary (ArrayBuffer).
// Based on standard PNG chunks + APNG extension chunks.
(function(global){
  function crc32(buf, start, len) {
    let c = 0xFFFFFFFF;
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let v = i;
      for (let j = 0; j < 8; j++) v = (v & 1) ? (0xEDB88320 ^ (v >>> 1)) : (v >>> 1);
      t[i] = v;
    }
    for (let i = start; i < start + len; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function adler32(data) {
    let s1 = 1, s2 = 0;
    for (let i = 0; i < data.length; i++) {
      s1 = (s1 + data[i]) % 65521;
      s2 = (s2 + s1) % 65521;
    }
    return (s2 << 16) | s1;
  }

  function deflateRaw(data) {
    // Simple uncompressed deflate (BTYPE=00)
    const CHUNK = 65535;
    const blocks = [];
    let offset = 0;
    while (offset < data.length) {
      const end = Math.min(offset + CHUNK, data.length);
      const chunk = data.subarray(offset, end);
      const last = end >= data.length ? 1 : 0;
      const header = new Uint8Array(5);
      header[0] = last;
      header[1] = chunk.length & 0xFF;
      header[2] = (chunk.length >> 8) & 0xFF;
      header[3] = ~chunk.length & 0xFF;
      header[4] = (~chunk.length >> 8) & 0xFF;
      blocks.push(header, chunk);
      offset = end;
    }
    const zlib = new Uint8Array(2 + blocks.reduce((a,b) => a + b.length, 0) + 4);
    zlib[0] = 0x78; zlib[1] = 0x01;
    let pos = 2;
    for (const b of blocks) { zlib.set(b, pos); pos += b.length; }
    const a = adler32(data);
    zlib[pos]   = (a >> 24) & 0xFF;
    zlib[pos+1] = (a >> 16) & 0xFF;
    zlib[pos+2] = (a >>  8) & 0xFF;
    zlib[pos+3] =  a        & 0xFF;
    return zlib;
  }

  function u32be(n) {
    return [(n >> 24) & 0xFF, (n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
  }

  function makeChunk(type, data) {
    const t = type.split('').map(c => c.charCodeAt(0));
    const buf = new Uint8Array(4 + 4 + data.length + 4);
    buf.set(u32be(data.length), 0);
    buf.set(t, 4);
    buf.set(data, 8);
    const crc = crc32(buf, 4, 4 + data.length);
    buf.set(u32be(crc), 8 + data.length);
    return buf;
  }

  function encodeFrame(imgData) {
    const { width, height, data } = imgData;
    const raw = new Uint8Array((width * 4 + 1) * height);
    for (let y = 0; y < height; y++) {
      raw[y * (width * 4 + 1)] = 0; // filter none
      for (let x = 0; x < width; x++) {
        const si = (y * width + x) * 4;
        const di = y * (width * 4 + 1) + 1 + x * 4;
        raw[di]   = data[si];
        raw[di+1] = data[si+1];
        raw[di+2] = data[si+2];
        raw[di+3] = data[si+3];
      }
    }
    return deflateRaw(raw);
  }

  global.encodeAPNG = function(frames, delayNum, delayDen) {
    if (!frames.length) return null;
    const w = frames[0].width, h = frames[0].height;
    const numFrames = frames.length;
    let seq = 0;

    const sig = new Uint8Array([137,80,78,71,13,10,26,10]);

    // IHDR
    const ihdr = new Uint8Array(13);
    const dv = new DataView(ihdr.buffer);
    dv.setUint32(0, w); dv.setUint32(4, h);
    ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
    const IHDR = makeChunk('IHDR', ihdr);

    // acTL
    const actl = new Uint8Array(8);
    const adv = new DataView(actl.buffer);
    adv.setUint32(0, numFrames); adv.setUint32(4, 0); // loop forever
    const acTL = makeChunk('acTL', actl);

    const chunks = [sig, IHDR, acTL];

    for (let f = 0; f < numFrames; f++) {
      const compressed = encodeFrame(frames[f]);

      // fcTL
      const fctl = new Uint8Array(26);
      const fdv = new DataView(fctl.buffer);
      fdv.setUint32(0, seq++);
      fdv.setUint32(4, w); fdv.setUint32(8, h);
      fdv.setUint32(12, 0); fdv.setUint32(16, 0); // x,y offset
      fdv.setUint16(20, delayNum); fdv.setUint16(22, delayDen);
      fctl[24] = 0; fctl[25] = 0; // dispose=NONE, blend=SOURCE
      chunks.push(makeChunk('fcTL', fctl));

      if (f === 0) {
        chunks.push(makeChunk('IDAT', compressed));
      } else {
        const fdAT = new Uint8Array(4 + compressed.length);
        const sdv = new DataView(fdAT.buffer);
        sdv.setUint32(0, seq++);
        fdAT.set(compressed, 4);
        chunks.push(makeChunk('fdAT', fdAT));
      }
    }

    chunks.push(makeChunk('IEND', new Uint8Array(0)));

    const total = chunks.reduce((a, c) => a + c.length, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    for (const c of chunks) { out.set(c, pos); pos += c.length; }
    return out.buffer;
  };
})(window);


// ─── App ────────────────────────────────────────────────────────────────────
// All init deferred to DOMContentLoaded so elements exist and have layout

let drawCanvas, ctx, wrap, previewCanvas, pctx;
let W = 800, H = 600;
let paths = [];
let currentPath = null;
let isDrawing = false;
let mode = 'draw';
let strokeColor = '#ccd6f6';
let strokeWidth = 3;
let strokeOpacity = 1;
let fpsSlider, durSlider, lwSlider;
let previewAnim = null;
let previewFrameIdx = 0;
let previewFrames = [];

function resize() {
  const newW = wrap.clientWidth;
  const newH = wrap.clientHeight;
  if (newW === 0 || newH === 0) return;
  // Scale existing paths when canvas resizes
  if (W > 0 && H > 0 && paths.length) {
    const sx = newW / W, sy = newH / H;
    for (const p of paths) {
      p.pts = p.pts.map(pt => ({ x: pt.x * sx, y: pt.y * sy }));
    }
  }
  W = newW; H = newH;
  drawCanvas.width = W; drawCanvas.height = H;
  redrawAll();
}

// ─── Canvas drawing ────────────────────────────────────────────────────────
function redrawAll() {
  ctx.clearRect(0, 0, W, H);
  for (const p of paths) drawPath(ctx, p);
}

function drawPath(c, p) {
  if (p.pts.length < 2) return;
  c.save();
  c.globalAlpha = p.opacity;
  c.strokeStyle = p.color;
  c.lineWidth = p.width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(p.pts[0].x, p.pts[0].y);
  for (let i = 1; i < p.pts.length; i++) {
    const prev = p.pts[i-1], curr = p.pts[i];
    const mx = (prev.x + curr.x) / 2, my = (prev.y + curr.y) / 2;
    c.quadraticCurveTo(prev.x, prev.y, mx, my);
  }
  c.stroke();
  c.restore();
}

// ─── Mouse / Touch events ──────────────────────────────────────────────────
function getPos(e) {
  const r = drawCanvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return { x: src.clientX - r.left, y: src.clientY - r.top };
}

function setupCanvasEvents() {
  drawCanvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    drawCanvas.setPointerCapture(e.pointerId);
    const pos = getPos(e);
    if (mode === 'erase') { eraseAt(pos); return; }
    isDrawing = true;
    currentPath = { pts: [pos], color: strokeColor, width: strokeWidth, opacity: strokeOpacity };
    setStatus('RECORDING', true);
  });

  drawCanvas.addEventListener('pointermove', e => {
    e.preventDefault();
    const pos = getPos(e);
    updateCoords(pos);
    if (!isDrawing || mode === 'erase') return;
    currentPath.pts.push(pos);
    redrawAll();
    drawPath(ctx, currentPath);
  });

  const finishDraw = () => {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentPath && currentPath.pts.length > 1) {
      paths.push(currentPath);
      updatePathList();
      updateExportButtons();
      updatePreview();
    }
    currentPath = null;
    setStatus('READY', false);
  };

  drawCanvas.addEventListener('pointerup', finishDraw);
  drawCanvas.addEventListener('pointercancel', finishDraw);
}

function eraseAt(pos) {
  const R = 20;
  const before = paths.length;
  paths = paths.filter(p => !p.pts.some(pt => Math.hypot(pt.x - pos.x, pt.y - pos.y) < R));
  if (paths.length !== before) { redrawAll(); updatePathList(); updateExportButtons(); updatePreview(); }
}

// ─── UI Controls ───────────────────────────────────────────────────────────
function setupControls() {
  document.getElementById('btn-draw').addEventListener('click', () => {
    mode = 'draw';
    document.getElementById('btn-draw').classList.add('active');
    document.getElementById('btn-erase').classList.remove('active');
  });

  document.getElementById('btn-erase').addEventListener('click', () => {
    mode = 'erase';
    document.getElementById('btn-erase').classList.add('active');
    document.getElementById('btn-draw').classList.remove('active');
  });

  document.getElementById('btn-undo').addEventListener('click', () => {
    if (paths.length) { paths.pop(); redrawAll(); updatePathList(); updateExportButtons(); updatePreview(); }
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    paths = []; redrawAll(); updatePathList(); updateExportButtons(); updatePreview();
  });

  const swSlider = document.getElementById('stroke-width');
  swSlider.addEventListener('input', () => {
    strokeWidth = +swSlider.value;
    document.getElementById('sw-val').textContent = strokeWidth;
  });

  const soSlider = document.getElementById('stroke-opacity');
  soSlider.addEventListener('input', () => {
    strokeOpacity = soSlider.value / 100;
    document.getElementById('so-val').textContent = soSlider.value;
  });

  document.querySelectorAll('.swatch').forEach(s => {
    s.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      strokeColor = s.dataset.color;
      document.getElementById('custom-color').value = strokeColor;
    });
  });

  document.getElementById('custom-color').addEventListener('input', e => {
    strokeColor = e.target.value;
    document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
  });

  fpsSlider = document.getElementById('anim-fps');
  fpsSlider.addEventListener('input', () => { document.getElementById('fps-val').textContent = fpsSlider.value; updatePreview(); });
  durSlider = document.getElementById('anim-dur');
  durSlider.addEventListener('input', () => { document.getElementById('dur-val').textContent = durSlider.value + 's'; updatePreview(); });
  lwSlider = document.getElementById('anim-lw');
  lwSlider.addEventListener('input', () => { document.getElementById('lw-val').textContent = lwSlider.value; });
}

// ─── Path list UI ──────────────────────────────────────────────────────────
function updatePathList() {
  const list = document.getElementById('path-list');
  document.getElementById('path-count').textContent = paths.length;
  const total = paths.reduce((a,p) => a + p.pts.length, 0);
  document.getElementById('status-paths').textContent = `${paths.length} paths · ${total} pts`;

  if (!paths.length) {
    list.innerHTML = '<div class="empty-hint">Draw to record paths...</div>';
    return;
  }
  list.innerHTML = paths.map((p, i) => `
    <div class="path-item" data-i="${i}">
      <div class="path-dot" style="background:${p.color}"></div>
      <span class="path-name">path_${String(i+1).padStart(2,'0')}</span>
      <span class="path-pts">${p.pts.length}pt</span>
      <button class="path-del" data-i="${i}" title="Delete">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('.path-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      paths.splice(+btn.dataset.i, 1);
      redrawAll(); updatePathList(); updateExportButtons(); updatePreview();
    });
  });
}

function updateExportButtons() {
  const has = paths.length > 0;
  document.getElementById('btn-preview').disabled = !has;
  document.getElementById('btn-export-svg').disabled = !has;
  document.getElementById('btn-export-apng').disabled = !has;
}

// ─── SVG Export ────────────────────────────────────────────────────────────
function setupExports() {
  document.getElementById('btn-preview').addEventListener('click', updatePreview);

  document.getElementById('btn-export-svg').addEventListener('click', () => {
    const dur = +durSlider.value;
    const svgPaths = paths.map((p, pi) => {
      const d = p.pts.map((pt, i) => `${i===0?'M':'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
      const totalLen = p.pts.reduce((acc, pt, i) => {
        if (i === 0) return 0;
        return acc + Math.hypot(pt.x - p.pts[i-1].x, pt.y - p.pts[i-1].y);
      }, 0).toFixed(1);
      const delay = (pi / Math.max(1, paths.length) * dur).toFixed(2);
      const pathDur = (dur / Math.max(1, paths.length)).toFixed(2);
      return `<path d="${d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${p.opacity}"
    stroke-dasharray="${totalLen}" stroke-dashoffset="${totalLen}">
    <animate attributeName="stroke-dashoffset" from="${totalLen}" to="0" dur="${pathDur}s" begin="${delay}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.6 1" keyTimes="0;1"/>
  </path>`;
    }).join('\n  ');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${svgPaths}
</svg>`;
    download('drawing-animation.svg', 'image/svg+xml', svg);
    setStatus('SVG EXPORTED', false);
  });

  // ─── APNG Export ─────────────────────────────────────────────────────────
  document.getElementById('btn-export-apng').addEventListener('click', async () => {
    setStatus('BUILDING APNG…', true);
    document.getElementById('btn-export-apng').disabled = true;
    const progress = document.getElementById('export-progress');

    const exportW = Math.min(W, 800);
    const exportH = Math.max(1, Math.round(exportW * H / W));
    const fps = +fpsSlider.value;

    // yield to browser so status text renders
    await new Promise(r => setTimeout(r, 50));
    const frames = buildFrames(exportW, exportH);
    progress.style.width = '60%';
    await new Promise(r => setTimeout(r, 30));

    const apng = window.encodeAPNG(frames, 1, fps);
    progress.style.width = '100%';

    if (apng) {
      downloadBinary('drawing-animation.png', 'image/png', apng);
      setStatus('APNG EXPORTED', false);
    } else {
      setStatus('EXPORT FAILED', false);
    }

    setTimeout(() => { progress.style.width = '0%'; }, 800);
    updateExportButtons();
  });
}

// ─── Download helpers ──────────────────────────────────────────────────────
function download(name, mime, text) {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}
function downloadBinary(name, mime, buffer) {
  const blob = new Blob([buffer], { type: mime });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}

// ─── Status helpers ────────────────────────────────────────────────────────
function setStatus(text, active) {
  document.getElementById('status-text').textContent = text;
  document.getElementById('status-dot').className = 'status-dot' + (active ? ' recording' : '');
}
function updateCoords(pos) {
  document.getElementById('status-coords').textContent = `x:${Math.round(pos.x)} y:${Math.round(pos.y)}`;
}

// ─── Bootstrap — wait for DOM + layout ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  drawCanvas   = document.getElementById('draw');
  ctx          = drawCanvas.getContext('2d');
  wrap         = document.getElementById('canvas-wrap');
  previewCanvas = document.getElementById('preview-canvas');
  pctx         = previewCanvas.getContext('2d');

  // Use requestAnimationFrame so the browser has done its first layout pass
  requestAnimationFrame(() => {
    resize();
    window.addEventListener('resize', resize);
    setupCanvasEvents();
    setupControls();
    setupExports();
    updatePathList();
    updateExportButtons();
    setStatus('READY', false);
  });
});

function buildFrames(targetW, targetH) {
  const fps = +fpsSlider.value;
  const dur = +durSlider.value;
  const lw = +lwSlider.value;
  const totalFrames = Math.max(2, Math.round(fps * dur));

  // Collect all segments in draw order
  const allSegments = [];
  for (const p of paths) {
    for (let i = 1; i < p.pts.length; i++) {
      allSegments.push({
        x1: p.pts[i-1].x, y1: p.pts[i-1].y,
        x2: p.pts[i].x,   y2: p.pts[i].y,
        color: p.color, opacity: p.opacity, width: lw
      });
    }
  }
  if (!allSegments.length) return [];

  const scaleX = targetW / W;
  const scaleY = targetH / H;

  const offscreen = document.createElement('canvas');
  offscreen.width = targetW; offscreen.height = targetH;
  const oc = offscreen.getContext('2d');

  const frames = [];
  for (let f = 0; f < totalFrames; f++) {
    oc.clearRect(0, 0, targetW, targetH);
    oc.fillStyle = 'transparent';
    oc.clearRect(0, 0, targetW, targetH);

    // progress goes 0 → 1, segProgress is a float index into allSegments
    const progress = f / (totalFrames - 1);
    const segProgress = progress * allSegments.length;

    for (let s = 0; s < allSegments.length; s++) {
      if (s > segProgress) break;          // haven't reached this segment yet
      const seg = allSegments[s];
      // how much of this segment to draw (0..1); segments before are fully drawn
      const frac = Math.min(1, segProgress - s);
      if (frac <= 0) break;

      oc.save();
      oc.globalAlpha = seg.opacity;
      oc.strokeStyle = seg.color;
      oc.lineWidth = seg.width;
      oc.lineCap = 'round';
      oc.lineJoin = 'round';
      oc.beginPath();
      oc.moveTo(seg.x1 * scaleX, seg.y1 * scaleY);
      oc.lineTo(
        (seg.x1 + (seg.x2 - seg.x1) * frac) * scaleX,
        (seg.y1 + (seg.y2 - seg.y1) * frac) * scaleY
      );
      oc.stroke();
      oc.restore();
    }

    frames.push(oc.getImageData(0, 0, targetW, targetH));
  }
  return frames;
}

function updatePreview() {
  if (!paths.length) {
    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    return;
  }
  // offsetWidth may be 0 before first paint — fall back to a reasonable size
  const pw = previewCanvas.offsetWidth || 240;
  const ph = Math.max(1, Math.round(pw * H / W));
  previewCanvas.width = pw; previewCanvas.height = ph;

  previewFrames = buildFrames(pw, ph);
  previewFrameIdx = 0;

  if (previewAnim) cancelAnimationFrame(previewAnim);
  const fps = +fpsSlider.value;
  let last = 0;
  const interval = 1000 / fps;

  function step(ts) {
    if (ts - last >= interval) {
      last = ts;
      if (previewFrames.length) {
        pctx.putImageData(previewFrames[previewFrameIdx], 0, 0);
        previewFrameIdx = (previewFrameIdx + 1) % previewFrames.length;
      }
    }
    previewAnim = requestAnimationFrame(step);
  }
  previewAnim = requestAnimationFrame(step);
}