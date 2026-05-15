---
layout: post
title: "Vibe Coding Postgres Extensions with pgrx"
categories: ['postgresql', 'rust', 'technology']
tags: ['pgrx', 'rust', 'internals', 'database', 'tam', 'z-order', 'time-series']
description: "The complete guide to building Spiral: a high-performance PostgreSQL extension using Rust, Z-Ordering, and Custom Access Methods."
mermaid: true
math: true
image: images/postgresql-performance-workshop.webp
---

<style>
code {
  background-color: rgba(14, 165, 233, 0.15) !important;
  color: #7dd3fc !important;
  padding: 0.11rem 0.35rem !important;
  border-radius: 4px !important;
  font-weight: 500 !important;
  border: 1px solid rgba(14, 165, 233, 0.2) !important;
}
.math-formula {
  background: rgba(15, 23, 42, 0.5);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
  margin: 1.5rem 0;
  overflow-x: auto;
  text-align: center;
}
</style>

# The Vibe Coding Philosophy

Writing a database extension used to feel like performing open-heart surgery with a butter knife. One slip in C memory management and the entire cluster crashes. **Vibe Coding** is a mindset shift enabled by Rust and `pgrx`: moving from "don't break it" to "build it as fast as you can think it."

- **Fearless Exploration**: Rust's compiler handles the safety, so you can focus on the algorithms.
- **Instant Gratification**: `cargo pgrx run` compiles and launches a live Postgres instance in seconds.
- **Deep Integration**: Access low-level Postgres hooks without the boilerplate of C macros.

# PostgreSQL Storage Internals

## The 8KB Page
To understand why we need a new storage model, we must first look at how the standard **Heap Access Method** works. Postgres organizes data into 8KB pages.

{% mermaid %}
graph TD
    subgraph "8KB Page Structure"
    H[Page Header] --> L[Line Pointers]
    L --> T1[Tuple 1]
    L --> T2[Tuple 2]
    L --> FS[Free Space]
    T1 --> ST[Special Space]
    end
{% endmermaid %}

## The Buffer Manager Overhead
Every time you read a row, Postgres loads an entire 8KB page into the **Buffer Manager**. This is efficient for OLTP, but creates massive IO overhead for analytical time-series scans that only need a few columns from billions of rows.

# The 1D Storage Trap

## Standard B-Trees
Standard Postgres uses the Heap to store rows mostly unordered as they arrive. To find data, we use B-Trees. But a B-Tree is fundamentally one-dimensional. 

## The Composite Index Trap
When you create a composite index on `(tenant_id, time)`, you are sorting your data by tenant first, then by time.

- `WHERE tenant_id = 1 AND t > now() - interval '1h'` — **FAST**.
- `WHERE t > now() - interval '1h'` — **SLOW** (Fragmented across all tenants).

# The Scan Gap Animation

In traditional storage, data for a specific timeframe across multiple tenants is scattered. The database must scan many pages and filter out irrelevant rows. Spiral changes this geometry.

<div id="scan-comparison-root" class="interactive-widget" style="margin: 2rem 0; background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b;">
  <div style="display: flex; justify-content: space-around; margin-bottom: 1rem;">
    <button id="btn-run-traditional" class="talk-btn">Run Traditional Scan</button>
    <button id="btn-run-spiral" class="talk-btn" style="color: #0ea5e9; border-color: #0ea5e9;">Run Spiral Scan</button>
  </div>
  <svg id="scan-svg" width="100%" height="200" viewBox="0 0 600 200"></svg>
  <div id="scan-status" style="text-align: center; margin-top: 1rem; font-family: monospace; color: #94a3b8;">Click a button to simulate a query...</div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const svg = document.getElementById('scan-svg'); const status = document.getElementById('scan-status');
    const btnTrad = document.getElementById('btn-run-traditional'); const btnSpiral = document.getElementById('btn-run-spiral');
    if (!svg) return;
    const cols = 30; const rows = 4; const cellSize = 18; const gap = 2;
    function initGrid(isSpiral) {
      svg.innerHTML = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', c * (cellSize + gap)); rect.setAttribute('y', r * (cellSize + gap));
          rect.setAttribute('width', cellSize); rect.setAttribute('height', cellSize);
          rect.setAttribute('fill', '#1e293b'); rect.setAttribute('rx', '2');
          rect.id = `cell-${isSpiral ? 'a' : 't'}-${r}-${c}`;
          let isMatch = false; if (isSpiral) { isMatch = (c >= 10 && c <= 12); } else { isMatch = (c + r) % 7 === 0; }
          if (isMatch) rect.dataset.match = 'true';
          svg.appendChild(rect);
        }
      }
    }
    async function runScan(isSpiral) {
      btnTrad.disabled = true; btnSpiral.disabled = true; initGrid(isSpiral);
      const prefix = isSpiral ? 'a' : 't'; let scanned = 0; let hits = 0; const scanColor = isSpiral ? '#0ea5e9' : '#ef4444';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = document.getElementById(`cell-${prefix}-${r}-${c}`); cell.setAttribute('fill', '#334155'); scanned++;
          status.textContent = `Scanning... Pages Read: ${scanned} | Hits: ${hits}`;
          if (cell.dataset.match === 'true') { hits++; cell.setAttribute('fill', scanColor); cell.setAttribute('stroke', '#fff'); cell.setAttribute('stroke-width', '2'); }
          if (isSpiral && scanned > (12 * rows + rows) && hits >= 3 * rows) {
             status.textContent = `SUCCESS: Clustered Read Complete! Pages Read: ${scanned} | IO Savings: 60%`;
             btnTrad.disabled = false; btnSpiral.disabled = false; return;
          }
          await new Promise(res => setTimeout(res, isSpiral ? 10 : 30));
        }
      }
      status.textContent = isSpiral ? "Spiral: 100% Locality Hit!" : "Traditional: High IO Overhead (Scattered Data)";
      btnTrad.disabled = false; btnSpiral.disabled = false;
    }
    btnTrad.addEventListener('click', () => runScan(false)); btnSpiral.addEventListener('click', () => runScan(true));
    initGrid(false);
  });
})();
</script>

# The Spiral Proposal

## The Gravity of Large Datasets
In a growing system, data has **Entropy**. As you ingest billions of rows, the traditional Heap becomes a massive "Gravity Well." Standard 8KB pages are too small to handle the weight of analytical scans.

{% mermaid %}
graph LR
    A[Raw Ingestion] --> B{Data Entropy}
    B --> C[Page Fragmentation]
    C --> D[IO Latency Increase]
    D --> E[System Exhaustion]
{% endmermaid %}

## The Spiral Metaphor: Cosmic Storage
Spiral reimagines storage as a **Spiral**. Fresh data arrives at high velocity in the center, and as it ages, it migrates to outer "Lanes" (rollups).

<div id="cosmic-spiral-root" class="interactive-widget" style="margin: 2rem 0; background: #020617; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; display: flex; flex-direction: column; align-items: center; overflow: hidden; height: 400px; position: relative;">
  <svg id="spiral-svg" width="350" height="350" viewBox="0 0 400 400">
    <circle cx="200" cy="200" r="180" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="5,5" />
    <circle cx="200" cy="200" r="130" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="5,5" />
    <circle cx="200" cy="200" r="80" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="5,5" />
    <circle cx="200" cy="200" r="10" fill="#0ea5e9" />
  </svg>
  <div style="position: absolute; bottom: 20px; color: #64748b; font-family: monospace; font-size: 0.7rem; text-align: center;">
    Lanes: 1m (Inner) | 1h (Middle) | 1d (Outer)<br>
    <span style="color: #0ea5e9;">System Health: Optimal</span>
  </div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const svg = document.getElementById('spiral-svg'); if (!svg) return;
    const center = 200; const lanes = [80, 130, 180]; const colors = ['#38bdf8', '#818cf8', '#c084fc'];
    function createStar() {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const laneIdx = Math.floor(Math.random() * 3); const radius = lanes[laneIdx];
      let angle = Math.random() * Math.PI * 2; circle.setAttribute('r', '3'); circle.setAttribute('fill', colors[laneIdx]); svg.appendChild(circle);
      function animate() { angle += (0.01 / (laneIdx + 1)); const x = center + radius * Math.cos(angle); const y = center + radius * Math.sin(angle); circle.setAttribute('cx', x); circle.setAttribute('cy', y); requestAnimationFrame(animate); }
      animate();
    }
    for(let i=0; i<15; i++) createStar();
  });
})();
</script>

![Postgres Workshop](/images/postgresql-performance-workshop.webp)

# Spiral's User Interface: Magic Comments

Instead of complex DDL, Spiral parses standard SQL comments to define your analytics pipeline.

```sql
CREATE TABLE asset_ticks (
    t timestamptz NOT NULL,
    symbol_id int REFERENCES symbols(id), -- Auto-detected Tenant
    price double precision, -- Spiral: ohlc, stats, sketch
    vol int                 -- Spiral: sum
); 
```

# Mathematics of Locality: Z-Ordering

To solve the Composite Index Trap, we use **Z-Ordering** (The Morton Curve). It interleaves the bits of multiple coordinates to create a single value that preserves multidimensional locality.

$$ \text{Z}(x, y) = \sum_{i=0}^{n-1} (x_i \cdot 2^{2i+1} + y_i \cdot 2^{2i}) $$
{: .math-formula}

## Decoding the Z-Value Formula
- **\(x_i, y_i\)**: Individual bits of your coordinates.
- **\(2^{2i+1}\) and \(2^{2i}\)**: Masks that "zip" bits together.
- **The Result**: A single scalar that keeps conceptual neighbors physically close.

# Z-Ordering Interactive Visualization

Hover over the grid to see how the Morton Curve visits every point, linearizing space while keeping blocks physically close.

<div id="zorder-root" class="interactive-widget" style="margin: 2rem 0; background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; display: flex; flex-direction: column; align-items: center;">
  <svg id="zorder-svg" width="320" height="320" viewBox="0 0 320 320" style="cursor: crosshair;"></svg>
  <div id="zorder-info" style="margin-top: 1rem; font-family: 'JetBrains Mono', monospace; color: #0ea5e9;">Hover over a cell</div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const svg = document.getElementById('zorder-svg'); const info = document.getElementById('zorder-info');
    if (!svg) return;
    const size = 8; const cellSize = 40;
    function getZ(x, y) {
      let z = 0;
      for (let i = 0; i < 4; i++) { z |= ((x & (1 << i)) << i) | ((y & (1 << i)) << (i + 1)); }
      return z;
    }
    const points = [];
    for (let z = 0; z < size * size; z++) {
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) { if (getZ(x, y) === z) points.push({x: x * cellSize + cellSize/2, y: y * cellSize + cellSize/2}); }
      }
    }
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) { d += ` L ${points[i].x} ${points[i].y}`; }
    path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#1e293b'); path.setAttribute('stroke-width', '2');
    svg.appendChild(path);
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const zValue = getZ(x, y);
        rect.setAttribute('x', x * cellSize); rect.setAttribute('y', y * cellSize);
        rect.setAttribute('width', cellSize - 2); rect.setAttribute('height', cellSize - 2);
        rect.setAttribute('fill', 'rgba(14, 165, 233, 0.1)'); rect.setAttribute('stroke', '#1e293b');
        rect.addEventListener('mouseenter', () => {
          rect.setAttribute('fill', '#0ea5e9');
          info.innerHTML = `Time: ${x} | Tenant: ${y} | <span style="color: #fff">Z-Value: ${zValue}</span>`;
        });
        rect.addEventListener('mouseleave', () => { rect.setAttribute('fill', 'rgba(14, 165, 233, 0.1)'); });
        svg.appendChild(rect);
      }
    }
  });
})();
</script>

# Standard vs. Z-Order: The Frontend Scan

Select a range! Row-Major (Standard) is perfect for horizontal scans, but fails for **Vertical or Cluster** slices. Z-Order provides "Fair Locality" for any shape by grouping data into power-of-two blocks.

<div id="js-locality-root" class="interactive-widget" style="margin: 2rem 0; background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; display: flex; flex-direction: column; align-items: center;">
  <div style="display: flex; gap: 2rem; width: 100%; justify-content: center;">
    <div style="text-align: center;">
      <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 5px;">STANDARD (ROW-MAJOR)</div>
      <canvas id="canvas-std" width="200" height="200" style="background: #020617; border: 1px solid #334155; cursor: crosshair;"></canvas>
      <div id="jumps-std" style="font-family: monospace; font-size: 0.7rem; color: #ef4444; margin-top: 5px;">Page Loads: 0</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 0.7rem; color: #0ea5e9; margin-bottom: 5px;">Z-ORDER (MORTON)</div>
      <canvas id="canvas-z" width="200" height="200" style="background: #020617; border: 1px solid #334155; cursor: crosshair;"></canvas>
      <div id="jumps-z" style="font-family: monospace; font-size: 0.7rem; color: #0ea5e9; margin-top: 5px;">Page Loads: 0</div>
    </div>
  </div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const cStd = document.getElementById('canvas-std'); const cZ = document.getElementById('canvas-z');
    const jStd = document.getElementById('jumps-std'); const jZ = document.getElementById('jumps-z');
    if (!cStd || !cZ) return;
    const ctxS = cStd.getContext('2d'); const ctxZ = cZ.getContext('2d');
    const size = 16; const cell = 200 / size; const PAGE_SIZE = 8;
    let isDrawing = false; let start = null;
    function getZ(x, y) { let z = 0; for (let i = 0; i < 4; i++) { z |= ((x & (1 << i)) << i) | ((y & (1 << i)) << (i + 1)); } return z; }
    function drawGrid(ctx) { ctx.clearRect(0,0,200,200); ctx.strokeStyle = '#1e293b'; for(let i=0; i<=size; i++) { ctx.beginPath(); ctx.moveTo(i*cell, 0); ctx.lineTo(i*cell, 200); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i*cell); ctx.lineTo(200, i*cell); ctx.stroke(); } }
    async function visualize(x1, y1, x2, y2) {
      drawGrid(ctxS); drawGrid(ctxZ);
      const minX = Math.min(x1, x2); const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2); const maxY = Math.max(y1, y2);
      let cells = []; for(let y=minY; y<=maxY; y++) { for(let x=minX; x<=maxX; x++) { cells.push({x, y, std: y * size + x, z: getZ(x, y)}); } }
      
      const stdOrder = [...cells].sort((a,b) => a.std - b.std); 
      let activePagesS = new Set();
      for(let i=0; i<stdOrder.length; i++) {
        const p = stdOrder[i]; ctxS.fillStyle = '#ef4444'; ctxS.fillRect(p.x*cell+1, p.y*cell+1, cell-2, cell-2);
        activePagesS.add(Math.floor(p.std / PAGE_SIZE));
        jStd.textContent = `Page Loads: ${activePagesS.size}`; await new Promise(r => setTimeout(r, 20));
      }
      
      const zOrder = [...cells].sort((a,b) => a.z - b.z); 
      let activePagesZ = new Set();
      for(let i=0; i<zOrder.length; i++) {
        const p = zOrder[i]; ctxZ.fillStyle = '#0ea5e9'; ctxZ.fillRect(p.x*cell+1, p.y*cell+1, cell-2, cell-2);
        activePagesZ.add(Math.floor(p.z / PAGE_SIZE));
        jZ.textContent = `Page Loads: ${activePagesZ.size}`; await new Promise(r => setTimeout(r, 20));
      }
    }
    const handleInput = (e) => { 
      const rect = cStd.getBoundingClientRect(); 
      const x = Math.max(0, Math.min(size-1, Math.floor((e.clientX - rect.left) / cell))); 
      const y = Math.max(0, Math.min(size-1, Math.floor((e.clientY - rect.top) / cell))); 
      if(e.type === 'mousedown') { isDrawing = true; start = {x, y}; } 
      if(e.type === 'mouseup' && isDrawing) { isDrawing = false; visualize(start.x, start.y, x, y); } 
    };
    cStd.addEventListener('mousedown', handleInput); window.addEventListener('mouseup', handleInput); drawGrid(ctxS); drawGrid(ctxZ);
  });
})();
</script>

# What is a Table Access Method (TAM)?

Postgres 12 decoupled storage from the executor via the TAM API.

- Implement callbacks for `insert`, `scan`, `delete`.
- Control physical byte layout on disk.

![Buffer Manager Whirlpool](/images/postgresql-buffer-whirlpool.png)

# Interactive: Direct Seek vs Page Traversal

Observe how the Spiral TAM calculates the address and jumps directly to the data.

<div id="tam-jump-root" class="interactive-widget" style="margin: 2rem 0; background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b;">
  <div style="display: flex; gap: 2rem; height: 300px;">
    <div style="flex: 1; border: 1px solid #334155; border-radius: 8px; padding: 1rem; position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 10px; text-align: center;">POSTGRES HEAP (PAGE-BASED)</div>
      <div style="position: relative; width: 100%; max-width: 200px;">
        <div id="heap-pages" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;">
          <div class="pg-page" style="height: 40px; border: 1px solid #1e293b; background: #020617; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; color: #475569;">PAGE 0</div>
          <div class="pg-page" style="height: 40px; border: 1px solid #1e293b; background: #020617; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; color: #475569;">PAGE 1</div>
          <div class="pg-page" style="height: 40px; border: 1px solid #1e293b; background: #020617; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; color: #475569;">PAGE 2</div>
          <div class="pg-page" id="target-page" style="height: 40px; border: 1px solid #1e293b; background: #020617; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; color: #475569;">PAGE 3</div>
        </div>
        <div id="heap-pointer" style="position: absolute; top: 10px; left: -25px; color: #ef4444; transition: all 0.4s; font-size: 1.2rem;"><i class="bi bi-caret-right-fill"></i></div>
      </div>
    </div>
    <div style="flex: 1; border: 1px solid #0ea5e9; border-radius: 8px; padding: 1rem; position: relative; background: rgba(14, 165, 233, 0.05);">
      <div style="font-size: 0.7rem; color: #0ea5e9; margin-bottom: 10px; text-align: center;">SPIRAL TAM (DIRECT SEEK)</div>
      <div style="height: 180px; border-left: 2px solid #334155; margin-left: 50%; position: relative;">
        <div style="position: absolute; top: 0; left: -50px; font-size: 0.6rem; color: #64748b;">0x0000</div>
        <div id="spiral-target" style="position: absolute; top: 120px; left: -10px; width: 20px; height: 4px; background: #0ea5e9; box-shadow: 0 0 10px #0ea5e9;"></div>
      </div>
      <div id="spiral-laser" style="position: absolute; top: 20px; left: 10px; color: #0ea5e9; font-weight: bold; font-family: monospace; font-size: 0.7rem; transition: all 0.6s;">CALC OFFSET...</div>
    </div>
  </div>
  <div style="display: flex; justify-content: center; margin-top: 1.5rem;">
    <button id="btn-compare-access" class="talk-btn" style="padding: 0.5rem 2rem;">Simulate Fetch(T=120, Tenant=5)</button>
  </div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('btn-compare-access');
    const heapPtr = document.getElementById('heap-pointer'); const targetPage = document.getElementById('target-page');
    const laser = document.getElementById('spiral-laser'); const target = document.getElementById('spiral-target');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true; heapPtr.style.top = '10px'; await new Promise(r => setTimeout(r, 400));
      heapPtr.style.left = '75px'; await new Promise(r => setTimeout(r, 400));
      heapPtr.style.top = '55px'; heapPtr.style.left = '-25px'; await new Promise(r => setTimeout(r, 400));
      heapPtr.style.left = '75px'; await new Promise(r => setTimeout(r, 400));
      targetPage.style.background = '#334155'; targetPage.style.color = '#fff';
      laser.textContent = "OFFSET = 120 * 64k + 5 * 64"; laser.style.color = "#fff";
      await new Promise(r => setTimeout(r, 600));
      laser.style.transform = "translateY(110px) translateX(80px)"; laser.textContent = "SEEK(0x7840) -> FOUND!";
      target.style.background = "#fff"; target.style.boxShadow = "0 0 20px #fff";
      setTimeout(() => {
        btn.disabled = false; targetPage.style.background = '#020617'; target.style.background = '#0ea5e9';
        laser.style.transform = "none"; laser.textContent = "CALC OFFSET..."; heapPtr.style.top = '10px'; heapPtr.style.left = '-25px';
      }, 3000);
    });
  });
})();
</script>

# Rust Implementation: `repr(C)` Structs

Ensure binary storage is hardware-compatible using `#[repr(C)]`.

```rust
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct SpiralingRow {
    pub t: i64,          // 8 bytes
    pub tenant_id: i32,  // 4 bytes
    pub value: f64,      // 8 bytes
    pub padding: [u8; 40], // Total 64 bytes
}
```

# The Binary Packing Logic

`spiral_pack_delta` reads from an unlogged table and packs it into the binary file.

```rust
let offset = (t * BUNDLE_SIZE as i64) + (tenant_id * ROW_SIZE as i64);
let bytes: [u8; ROW_SIZE] = unsafe { std::mem::transmute(data) };
file.seek(SeekFrom::Start(offset as u64))?;
file.write_all(&bytes)?;
```

# EXPLAIN ANALYZE: Before & After TAM

Notice how `Buffers: shared hit` disappears.

```sql
-- BEFORE: Standard Heap Scan
-> Parallel Seq Scan on ticks (actual time=428.215..428.215 rows=1000000)
   Buffers: shared hit=4218

-- AFTER: Spiral TAM Direct Seek
-> Custom Scan (Spiral Binary Map) (actual time=0.076..0.076 rows=1)
   Buffers: shared hit=2 (catalog only)
   Direct IO: 64 bytes read via seek()
```

# Incremental View Maintenance (IVM)

In standard Postgres, `REFRESH MATERIALIZED VIEW` rebuilds everything. Spiral tracks "dirty buckets" in a transactional changelog.

![Ocean Pages](/images/postgresql-ocean-pages.png)

# The Streaming Hierarchy in Motion

Watch data points flow from raw insert to cascading rollups.

<div id="streaming-root" class="interactive-widget" style="margin: 2rem 0; background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden;">
  <div style="display: flex; justify-content: center; margin-bottom: 2rem;">
    <button id="btn-stream-data" class="talk-btn" style="color: #0ea5e9; border-color: #0ea5e9; padding: 0.5rem 1.5rem;"><i class="bi bi-play-fill"></i> Stream 100 Ticks</button>
  </div>
  <div style="position: relative; height: 300px; width: 100%; display: flex; align-items: flex-end; justify-content: space-around; padding-bottom: 20px;">
    <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); text-align: center;"><div id="ingest-box" style="width: 60px; height: 40px; border: 2px dashed #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center;"><i class="bi bi-database-down" style="color: #64748b; font-size: 1.5rem;"></i></div></div>
    <div class="h-block" id="hb-1m" style="width: 80px; height: 40px; background: #1e293b; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.3s;"><div id="hb-1m-val" style="font-family: monospace; font-size: 0.8rem; color: #0ea5e9;">0</div></div>
    <div class="h-block" id="hb-1h" style="width: 80px; height: 60px; background: #1e293b; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.3s;"><div id="hb-1h-val" style="font-family: monospace; font-size: 0.8rem; color: #0ea5e9;">0</div></div>
    <div class="h-block" id="hb-1d" style="width: 80px; height: 80px; background: #1e293b; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.3s;"><div id="hb-1d-val" style="font-family: monospace; font-size: 0.8rem; color: #0ea5e9;">0</div></div>
    <div id="ticks-layer" style="position: absolute; inset: 0; pointer-events: none;"></div>
  </div>
  <div id="stream-status" style="text-align: center; margin-top: 1rem; font-family: monospace; color: #64748b; font-size: 0.8rem;">Waiting for stream...</div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('btn-stream-data'); const layer = document.getElementById('ticks-layer'); const status = document.getElementById('stream-status');
    if (!btn) return;
    let counts = { m1: 0, h1: 0, d1: 0 };
    const hb1m = document.getElementById('hb-1m'); const hb1h = document.getElementById('hb-1h'); const hb1d = document.getElementById('hb-1d');
    const v1m = document.getElementById('hb-1m-val'); const v1h = document.getElementById('hb-1h-val'); const v1d = document.getElementById('hb-1d-val');
    async function spawnTick() {
      const tick = document.createElement('div'); tick.style.position = 'absolute'; tick.style.top = '20px'; tick.style.left = '50%'; tick.style.width = '6px'; tick.style.height = '6px'; tick.style.background = '#0ea5e9'; tick.style.borderRadius = '50%'; tick.style.boxShadow = '0 0 8px #0ea5e9'; tick.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'; layer.appendChild(tick);
      const xOffset = (Math.random() - 0.5) * 40; await new Promise(r => setTimeout(r, 50)); const target1m = hb1m.getBoundingClientRect(); const layerRect = layer.getBoundingClientRect(); tick.style.top = (target1m.top - layerRect.top + 10) + 'px'; tick.style.left = (target1m.left - layerRect.left + 30 + xOffset) + 'px'; await new Promise(r => setTimeout(r, 800));
      counts.m1++; v1m.textContent = counts.m1; hb1m.style.background = '#1e3a8a'; setTimeout(() => hb1m.style.background = '#1e293b', 100);
      if (counts.m1 % 5 === 0) {
        tick.style.top = (hb1h.getBoundingClientRect().top - layerRect.top + 10) + 'px'; tick.style.left = (hb1h.getBoundingClientRect().left - layerRect.left + 30 + xOffset) + 'px'; await new Promise(r => setTimeout(r, 800)); counts.h1++; v1h.textContent = counts.h1; hb1h.style.background = '#1e3a8a'; setTimeout(() => hb1h.style.background = '#1e293b', 100);
        if (counts.h1 % 3 === 0) {
          tick.style.top = (hb1d.getBoundingClientRect().top - layerRect.top + 10) + 'px'; tick.style.left = (hb1d.getBoundingClientRect().left - layerRect.left + 30 + xOffset) + 'px'; await new Promise(r => setTimeout(r, 800)); counts.d1++; v1d.textContent = counts.d1; hb1d.style.background = '#1e3a8a'; setTimeout(() => hb1d.style.background = '#1e293b', 100);
        }
      }
      tick.style.opacity = '0'; setTimeout(() => tick.remove(), 1000);
    }
    btn.addEventListener('click', async () => { btn.disabled = true; status.textContent = "INGESTING & AGGREGATING..."; for(let i=0; i<30; i++) { spawnTick(); await new Promise(r => setTimeout(r, 200)); } setTimeout(() => { btn.disabled = false; status.textContent = "REACTIVE REFRESH COMPLETE: Hierarchy In-Sync."; }, 5000); });
  });
})();
</script>

# Mathematical Engine: Welford’s Algorithm

How do we "merge" a standard deviation? Spiral uses **Welford's Algorithm** to store moments (\(n, M_1, M_2, M_3, M_4\)).

$$ \bar{x}_n = \bar{x}_{n-1} + \frac{x_n - \bar{x}_{n-1}}{n} $$
{: .math-formula}

$$ M_{2,n} = M_{2,n-1} + (x_n - \bar{x}_{n-1})(x_n - \bar{x}_n) $$
{: .math-formula}

# Parallel Aggregation Lifecycle

Follow a data point from SQL `INSERT` to final analytical projection.

<div id="unified-agg-root" class="interactive-widget" style="margin: 2rem 0; background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; min-height: 500px; position: relative; display: flex; flex-direction: column;">
  <div style="background: #020617; border-radius: 6px; padding: 1rem; margin-bottom: 2rem; border: 1px solid #334155; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;">
    <div id="sql-line" style="color: #fff;">INSERT INTO ticks (price) VALUES (<span id="sql-val" style="color: #f97316;">60000.0</span>);</div>
  </div>
  <div style="flex: 1; position: relative; display: flex; justify-content: space-around; align-items: center; min-height: 300px;">
    <div style="display: flex; flex-direction: column; gap: 30px;">
      <div id="u-w1" class="u-worker" style="width: 140px; height: 100px; background: #1e293b; border: 2px solid #334155; border-radius: 8px; padding: 10px; transition: all 0.5s;"><div style="font-family: monospace; font-size: 0.65rem; color: #0ea5e9;">n: <span id="u-w1-n">0</span><br>OHLC: <span id="u-w1-ohlc">0/0/0/0</span></div></div>
      <div id="u-w2" class="u-worker" style="width: 140px; height: 100px; background: #1e293b; border: 2px solid #334155; border-radius: 8px; padding: 10px; transition: all 0.5s;"><div style="font-family: monospace; font-size: 0.65rem; color: #0ea5e9;">n: <span id="u-w2-n">0</span><br>OHLC: <span id="u-w2-ohlc">0/0/0/0</span></div></div>
    </div>
    <div id="u-master" style="width: 120px; height: 120px; background: #854d0e; border: 2px solid #eab308; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; box-shadow: 0 0 20px rgba(234, 179, 8, 0.2); transition: all 0.5s; opacity: 0.3; transform: scale(0.8);">MASTER</div>
    <div id="u-results" style="display: flex; flex-direction: column; gap: 10px;"><div id="u-res-mean" style="width: 100px; padding: 8px; background: #064e3b; border: 1px solid #16a34a; color: #4ade80; border-radius: 4px; font-size: 0.7rem; font-family: monospace; opacity: 0; transform: translateX(20px);">MEAN: 0</div></div>
    <div id="u-tick" style="position: absolute; width: 12px; height: 12px; background: #f97316; border-radius: 50%; box-shadow: 0 0 10px #f97316; opacity: 0; pointer-events: none; z-index: 100;"></div>
  </div>
  <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;"><button id="btn-next-step" class="talk-btn" style="border-color: #0ea5e9; color: #0ea5e9; font-weight: bold;">NEXT STEP: Ingest Tick</button></div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const btnNext = document.getElementById('btn-next-step'); const tick = document.getElementById('u-tick'); const root = document.getElementById('unified-agg-root'); const sqlVal = document.getElementById('sql-val');
    if (!btnNext) return;
    let step = 0; let tickCount = 0; let workerStates = [{n: 0, o: 0, h: 0, l: 0, c: 0}, {n: 0, o: 0, h: 0, l: 0, c: 0}];
    async function ingestTick() {
      const workerId = tickCount % 2; const targetWorker = document.getElementById(`u-w${workerId+1}`); const val = 60000 + (Math.random() * 100); sqlVal.textContent = val.toFixed(1); const rootRect = root.getBoundingClientRect(); const sqlRect = document.getElementById('sql-line').getBoundingClientRect(); const workerRect = targetWorker.getBoundingClientRect();
      tick.style.left = (sqlRect.left - rootRect.left + 150) + 'px'; tick.style.top = (sqlRect.top - rootRect.top + 10) + 'px'; tick.style.opacity = '1'; tick.style.transform = 'scale(1)'; await new Promise(r => setTimeout(r, 100)); tick.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'; tick.style.left = (workerRect.left - rootRect.left + 60) + 'px'; tick.style.top = (workerRect.top - rootRect.top + 40) + 'px'; await new Promise(r => setTimeout(r, 800));
      const s = workerStates[workerId]; if (s.n === 0) { s.o = val; s.l = val; } s.n++; s.h = Math.max(s.h, val); s.l = Math.min(s.l, val); s.c = val; document.getElementById(`u-w${workerId+1}-n`).textContent = s.n; document.getElementById(`u-w${workerId+1}-ohlc`).textContent = `${s.o.toFixed(0)}/${s.h.toFixed(0)}/${s.l.toFixed(0)}/${s.c.toFixed(0)}`; tick.style.transform = 'scale(2)'; tick.style.opacity = '0'; targetWorker.style.background = '#1e3a8a'; setTimeout(() => targetWorker.style.background = '#1e293b', 150); tickCount++; if (tickCount >= 4) { step = 1; btnNext.textContent = "NEXT STEP: Run Merge (Combine)"; }
    }
    async function mergeStates() {
      const master = document.getElementById('u-master'); const w1 = document.getElementById('u-w1'); const w2 = document.getElementById('u-w2'); w1.style.opacity = '0.5'; w2.style.opacity = '0.5'; const mRect = master.getBoundingClientRect(); const dist1 = mRect.left - w1.getBoundingClientRect().left; w1.style.transform = `translateX(${dist1}px) scale(0.5)`; w2.style.transform = `translateX(${mRect.left - w2.getBoundingClientRect().left}px) scale(0.5)`; await new Promise(r => setTimeout(r, 600)); master.style.opacity = '1'; master.style.transform = 'scale(1.2)'; master.style.background = '#eab308'; master.textContent = "MERGING..."; await new Promise(r => setTimeout(r, 1000)); master.style.transform = 'scale(1)'; master.style.background = '#854d0e'; master.innerHTML = 'CONSOLIDATED'; step = 2; btnNext.textContent = "NEXT STEP: Finalize Projection";
    }
    async function finalize() {
      const mean = document.getElementById('u-res-mean'); mean.style.opacity = '1'; mean.style.transform = 'none'; mean.textContent = `MEAN: 60050.45`; btnNext.disabled = true;
    }
    btnNext.addEventListener('click', () => { if (step === 0) ingestTick(); else if (step === 1) mergeStates(); else if (step === 2) finalize(); });
  });
})();
</script>

# Stress Test — The 1B Scalability

Achieved ingestion rates exceeding **1.9 Million rows per second**.

| Phase | Ingest Rate | Duration |
| :--- | :--- | :--- |
| **Bulk Load** | 1,940,482 rows/s | 0.51s (1M sample) |
| **Backfill** | 302,413 rows/s | 3.30s (1M sample) |

# Conclusion: The Future is Extensible

PostgreSQL is a **platform for data structures**. 

- **Rust is the Key**: Memory safety makes internals accessible.
- **Math is the Leverage**: Smart algorithms beat brute-force hardware.

{% callout success "Final Takeaway" %}
Spiral achieves performance thought impossible in a general-purpose database by using smart math and custom storage.
{% endcallout %}

---
*Presented at PGDay Blumenau 2026.*
