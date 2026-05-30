---
layout: post
title: "Spiral: An Experiment in Geometry-Aware Storage for PostgreSQL"
date: 2026-05-24
categories: ['postgresql', 'rust', 'engineering']
tags: ['spiral', 'research', 'database-internals', 'z-order', 'time-series']
description: "A look into Spiral: my research project on multidimensional storage engines, built as a way to learn PostgreSQL internals through Rust."
permalink: /spiral-intro
mermaid: true
math: true
image: images/postgresql-performance-workshop.webp
---

<style>
.math-formula {
  background: rgba(15, 23, 42, 0.5);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
  margin: 1.5rem 0;
  overflow-x: auto;
  text-align: center;
}
.interactive-widget {
  box-shadow: 0 20px 50px rgba(0,0,0,0.4);
}
</style>

# A Personal Journey into Database Internals

I should start with a confession: I am not a math expert, nor am I a core PostgreSQL developer. I am a curious engineer who loves to experiment. **Spiral** is the result of letting my creative side take the wheel—a research project born from a simple desire to understand how databases work at the bit-level and to see if I could implement some of my own "crazy" ideas.

Everything you see here is a **prototype**. It is an exploration of what becomes possible when we use Rust to extend the heart of the database. I'm sharing this as a research outcome, hoping to find other curious minds who might want to contribute or challenge these concepts.

# Try It in Five Minutes

Spiral targets PostgreSQL 16–18. Install via Homebrew on macOS:

```bash
brew install postgresql@18
brew install --build-from-source ./Formula/spiral.rb
```

Or build from source with `cargo-pgrx`:

```bash
cargo install cargo-pgrx
cargo pgrx init
cargo pgrx run pg18   # drops into a psql session with spiral loaded
```

Add to `postgresql.conf` so the planner hook and background worker start at boot:

```ini
shared_preload_libraries = 'spiral'
```

Then try the short walkthrough:

```bash
cargo pgrx run pg18 < examples/short_walkthrough.sql
```

Or paste this into any psql session:

```sql
CREATE EXTENSION spiral;
SET spiral.kickoff_date = '2026-01-01';

CREATE TABLE ticks (
    t         timestamptz NOT NULL,
    symbol_id int         NOT NULL,
    price     double precision, -- Spiral: ohlcv
    vol       int               -- Spiral: sum
) WITH (spiral.frames = '1m,1h', spiral.tenant = 'symbol_id');

-- Insert some data — background worker auto-refreshes rollups
INSERT INTO ticks SELECT
    now() - (random() * interval '2 hours'),
    (random() * 10)::int,
    100 + random() * 50,
    (random() * 1000)::int
FROM generate_series(1, 100000);

-- Manually refresh (or just wait for the bgworker)
SELECT spiral_refresh('ticks');

-- Query the 1-minute rollup
SELECT t, symbol_id, price_ohlcv_h, price_ohlcv_l, vol
FROM ticks_1m ORDER BY t DESC LIMIT 10;
```

The source is at [github.com/jonatas/spiral](https://github.com/jonatas/spiral).

# The "Spiral" Concept: A Metaphor for Data Flow

The central idea behind this project is to stop thinking of data as a flat, linear history. As datasets grow to billions of rows, the traditional model faces what I call **Data Gravity**—where the weight of the data makes every operation exponentially harder.

In my experiments, I started imagining storage as a **Spiral**. 

<div id="cosmic-spiral-root" class="interactive-widget" style="margin: 2rem 0; background: #020617; padding: 3rem 2rem; border-radius: 12px; border: 1px solid #1e293b; display: flex; flex-direction: column; align-items: center; overflow: hidden; height: 450px; position: relative;">
  <svg id="spiral-svg" width="350" height="350" viewBox="0 0 400 400">
    <circle cx="200" cy="200" r="180" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="5,5" />
    <circle cx="200" cy="200" r="130" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="5,5" />
    <circle cx="200" cy="200" r="80" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="5,5" />
    <circle cx="200" cy="200" r="10" fill="#0ea5e9" />
  </svg>
  <div style="position: absolute; bottom: 30px; color: #64748b; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; text-align: center; line-height: 1.5;">
    <strong style="color: #fff;">THE SPIRAL METAPHOR</strong><br>
    Inner Core: High-velocity raw ticks<br>
    Outer Lanes: Hierarchical rollups
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
    for(let i=0; i<20; i++) createStar();
  });
})();
</script>

In this model, fresh data arrives at high velocity in the center. As it "cools" and ages, it migrates to outer orbits where it's aggregated into stable, dense structures.

# Multi-Tenancy: The Lane System

In a multi-tenant environment, the "Data Gravity" problem is multiplied. If we store everyone's data in the same linear file, noisy neighbors can drown out everyone else. 

Spiral solves this by assigning each tenant their own **Lane** within the spiral. Imagine a cosmic highway where each tenant has their own orbital path. This preserves locality not just in time, but in tenant identity. You can explore this concept in depth at the [Spiral Interactive Lab](../spiral).

<div id="multi-tenant-spiral-root" class="interactive-widget" style="margin: 2rem 0; background: #020617; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; display: flex; flex-direction: column; align-items: center; overflow: hidden; height: 550px; position: relative;">
  <canvas id="multi-tenant-canvas" width="600" height="450" style="width: 100%; height: 100%; max-width: 600px;"></canvas>
  
  <div style="position: absolute; top: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px;">
    <button id="add-tenant-btn" style="background: #0ea5e9; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-weight: bold; box-shadow: 0 0 15px rgba(14, 165, 233, 0.4);">+ ADD TENANT</button>
  </div>

  <div id="spiral-slides" style="position: absolute; bottom: 20px; left: 20px; right: 20px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 1.2rem; border-radius: 10px; border: 1px solid #1e3a8a; color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; line-height: 1.5; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div class="spiral-slide" data-step="0">
      <strong style="color: #4ade80;">[01] THE SINGLE TENANT FLOW</strong><br>
      Data originates at the high-velocity center (Hot Storage). As it ages, the algorithm pushes it outward, creating a natural temporal gradient.
    </div>
    <div class="spiral-slide" data-step="1" style="display: none;">
      <strong style="color: #60a5fa;">[02] OPENING THE LANES</strong><br>
      The space is mathematically partitioned into lanes. Each lane represents a different aggregation level (Raw -> 1m -> 1h -> 1d).
    </div>
    <div class="spiral-slide" data-step="2" style="display: none;">
      <strong style="color: #c084fc;">[03] SCALABLE MULTI-TENANCY</strong><br>
      By shifting the orbital phase, we stack multiple tenants into the same table. They share the same physical "lane" boundaries but never collide in bit-space.
    </div>
  </div>
  
  <div style="position: absolute; bottom: 25px; right: 30px; display: flex; gap: 8px;">
    <button id="prev-slide" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">&lt;</button>
    <button id="next-slide" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">&gt;</button>
  </div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('multi-tenant-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const addBtn = document.getElementById('add-tenant-btn');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const slides = document.querySelectorAll('.spiral-slide');
    
    let currentStep = 0;
    let time = 0;
    let tenants = [
      { id: 0, color: '#0ea5e9', phase: 0, points: [] }
    ];

    function updateSlides() {
      slides.forEach((s, i) => {
        s.style.display = i === currentStep ? 'block' : 'none';
        s.style.animation = 'fadeIn 0.5s ease-out';
      });
    }

    nextBtn.onclick = () => { currentStep = (currentStep + 1) % slides.length; updateSlides(); };
    prevBtn.onclick = () => { currentStep = (currentStep - 1 + slides.length) % slides.length; updateSlides(); };

    addBtn.onclick = () => {
      const colors = ['#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316'];
      const newPhase = (tenants.length * Math.PI * 2) / Math.max(5, tenants.length + 1);
      tenants.push({
        id: tenants.length,
        color: colors[tenants.length % colors.length],
        phase: newPhase,
        points: []
      });
      if (currentStep < 2) { currentStep = 2; updateSlides(); }
    };

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const centerX = w / 2;
      const centerY = h / 2;
      
      time += 0.01;
      const globalRotation = time * 0.15;
      const zoom = 1.1 + Math.sin(time * 0.4) * 0.1;

      // Draw background grid/stars
      ctx.fillStyle = 'rgba(30, 41, 59, 0.2)';
      for(let i=0; i<50; i++) {
        const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * w;
        const y = (Math.cos(i * 543.21) * 0.5 + 0.5) * h;
        ctx.fillRect(x, y, 1, 1);
      }

      // Draw background lanes
      if (currentStep >= 1) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let r = 50; r < 250; r += 40) {
          const animatedR = r * zoom;
          ctx.beginPath();
          ctx.setLineDash([10, 15]);
          ctx.arc(centerX, centerY, animatedR, 0, Math.PI * 2);
          ctx.stroke();
          
          // Lane Labels
          if (time % 2 < 0.1) {
            ctx.fillStyle = '#1e3a8a';
            ctx.font = '8px monospace';
            ctx.fillText(r < 100 ? 'RAW' : (r < 180 ? 'HOURLY' : 'DAILY'), centerX + animatedR + 5, centerY);
          }
        }
        ctx.setLineDash([]);
      }

      tenants.forEach((t, tIdx) => {
        // Add points
        if (Math.random() > 0.7) {
          t.points.push({ age: 0, initialAngle: (Math.random() - 0.5) * 0.15, size: 2 + Math.random() * 2 });
        }

        ctx.fillStyle = t.color;
        ctx.strokeStyle = t.color;
        t.points = t.points.filter(p => p.age < 6);
        t.points.forEach(p => {
          p.age += 0.012;
          // Radius grows over time, creating the spiral effect
          const r = (15 + p.age * 45) * zoom;
          // Spiral angle: time-based growth + tenant phase + global rotation
          const angle = p.age * 2.5 + t.phase + globalRotation + p.initialAngle;
          
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          
          const currentSize = Math.max(0.5, p.size - p.age * 0.4);
          ctx.beginPath();
          ctx.arc(x, y, currentSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Connect to previous position for trailing effect
          if (p.age > 0.05) {
            ctx.globalAlpha = Math.max(0, 0.4 - p.age * 0.06);
            ctx.beginPath();
            ctx.lineWidth = currentSize;
            ctx.moveTo(x, y);
            const prevR = (15 + (p.age - 0.05) * 45) * zoom;
            const prevAngle = (p.age - 0.05) * 2.5 + t.phase + globalRotation + p.initialAngle;
            ctx.lineTo(centerX + Math.cos(prevAngle) * prevR, centerY + Math.sin(prevAngle) * prevR);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        });
      });

      requestAnimationFrame(draw);
    }
    
    // Simple fadeIn animation for slides
    const style = document.createElement('style');
    style.textContent = '@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }';
    document.head.appendChild(style);
    
    draw();
  });
})();
</script>

# The Geometry of Packing: Massively Multi-Tenant Scale

To understand how Spiral achieves constant-time seeks across billions of rows, we have to look at the **Packing Geometry**. By using an Archimedean spiral, we can map a 1D sequence (time) into a 2D plane where distance from the center represents "age" and the rotation phase represents "tenant identity."

In this advanced simulator, you can push the system to **100 concurrent tenants**. Watch how the **Temporal Resolution (Step)** and **Packing Density** configs mirror the internal `bundle_size` and `frame_seconds` parameters.

<div id="packing-geometry-root" class="interactive-widget" style="margin: 2rem 0; background: #020617; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; display: flex; flex-direction: column; align-items: center; min-height: 700px; position: relative;">
  <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 20px;">
    <div style="flex: 1; min-width: 300px;">
      <canvas id="packing-canvas" width="600" height="600" style="width: 100%; height: auto; background: #010409; border-radius: 8px; border: 1px solid #30363d; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);"></canvas>
    </div>
    
    <div style="flex: 0 0 300px; background: #010409; padding: 1.5rem; border-radius: 10px; border: 1px solid #1e3a8a; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
      <div style="color: #60a5fa; margin-bottom: 15px; font-weight: bold; border-bottom: 1px solid #1e3a8a; padding-bottom: 5px; letter-spacing: 1px; font-size: 0.65rem;">POSTGRESQL_DDL.SQL</div>
      
      <div style="color: #818cf8; margin-bottom: 10px;">ALTER TABLE <span style="color: #fff;">sensor_data</span> SET (</div>
      
      <div style="margin: 0 0 15px 15px;">
        <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-size: 0.65rem;">spiral.tenant = <span style="color: #fbbf24;">'sensor_id'</span>,</label>
        <div style="color: #64748b; font-size: 0.6rem; margin-bottom: 5px;">-- Scale: <span id="val-tenants" style="color: #fff;">50</span> tenants</div>
        <input type="range" id="cfg-tenants" min="1" max="100" value="50" style="width: 100%;">
      </div>

      <div style="margin: 0 0 15px 15px;">
        <label style="color: #475569; display: block; margin-bottom: 5px; font-size: 0.65rem;">-- bundle_size: <span id="val-dist" style="color: #94a3b8;">100</span> pts/block (internal — not a DDL option)</label>
        <input type="range" id="cfg-dist" min="50" max="1000" step="50" value="100" style="width: 100%;">
      </div>
      
      <div style="margin: 0 0 15px 15px;">
        <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-size: 0.65rem;">spiral.frames = <span style="color: #fbbf24;">'1m,1h,1d'</span></label>
        <div style="color: #64748b; font-size: 0.6rem; margin-bottom: 5px;">-- visual lane width: <span id="val-width" style="color: #94a3b8;">20</span> (simulation)</div>
        <input type="range" id="cfg-width" min="10" max="50" value="20" style="width: 100%;">
      </div>

      <div style="color: #818cf8; margin-bottom: 20px;">);</div>

      <div style="color: #4ade80; margin-bottom: 15px; font-weight: bold; border-bottom: 1px solid #1e3a8a; padding-bottom: 5px; letter-spacing: 1px; font-size: 0.65rem;">QUERY_ENGINE</div>
      
      <div style="margin-bottom: 15px;">
        <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-size: 0.65rem;">WHERE t >= <span id="val-tstart" style="color: #4ade80;">20%</span></label>
        <input type="range" id="cfg-tstart" min="0" max="100" value="20" style="width: 100%;">
      </div>
      
      <div>
        <label style="color: #94a3b8; display: block; margin-bottom: 5px; font-size: 0.65rem;">AND t < <span id="val-tend" style="color: #4ade80;">50%</span></label>
        <input type="range" id="cfg-tend" min="0" max="100" value="50" style="width: 100%;">
      </div>
    </div>
  </div>

  <div style="width: 100%; background: #010409; border: 1px solid #1e3a8a; padding: 12px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: #475569; display: flex; justify-content: space-between; align-items: center;">
    <div><span style="color: #4ade80;">[RUNNING]</span> <span id="packing-stats">Calculating offsets...</span></div>
    <div style="color: #1e3a8a;">ARCHIMEDEAN_V2.0_MORTON_OPT</div>
  </div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('packing-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const cfgDist = document.getElementById('cfg-dist');
    const cfgWidth = document.getElementById('cfg-width');
    const cfgTenants = document.getElementById('cfg-tenants');
    const cfgTStart = document.getElementById('cfg-tstart');
    const cfgTEnd = document.getElementById('cfg-tend');
    
    const valDist = document.getElementById('val-dist');
    const valWidth = document.getElementById('val-width');
    const valTenants = document.getElementById('val-tenants');
    const valTStart = document.getElementById('val-tstart');
    const valTEnd = document.getElementById('val-tend');
    const stats = document.getElementById('packing-stats');

    let time = 0;
    const colors = [];
    for(let i=0; i<100; i++) {
      colors.push(`hsl(${(i * 137.5) % 360}, 70%, 60%)`);
    }

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;
      
      ctx.clearRect(0, 0, w, h);
      time += 0.003;

      const resolution = parseInt(cfgDist.value); 
      const laneWidth = parseInt(cfgWidth.value);
      const tenantCount = parseInt(cfgTenants.value);
      const tStart = parseInt(cfgTStart.value) / 100;
      const tEnd = parseInt(cfgTEnd.value) / 100;

      valDist.textContent = resolution;
      valWidth.textContent = laneWidth;
      valTenants.textContent = tenantCount;
      valTStart.textContent = (tStart * 100).toFixed(0) + '%';
      valTEnd.textContent = (tEnd * 100).toFixed(0) + '%';

      // Draw TRUE Archimedean Spiral Grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2 * 10; a += 0.1) {
        const age = a / (Math.PI * 2 * 10);
        const r = (30 + age * (laneWidth * 8));
        const theta = a + time * 0.5;
        const x = centerX + Math.cos(theta) * r;
        const y = centerY + Math.sin(theta) * r;
        if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      let highlightedPoints = 0;
      let totalPoints = 0;

      for (let t = 0; t < tenantCount; t++) {
        const color = colors[t];
        const phase = (t * Math.PI * 2) / tenantCount;
        
        // Ensure step is small enough to show a continuous spiral line
        const step = 1 / Math.max(200, resolution / 2);
        
        for (let age = 0; age < 1; age += step) {
          totalPoints++;
          const isInWindow = age >= tStart && age <= tEnd;
          
          const r = (30 + age * (laneWidth * 8));
          // Multiply age by 12 * Math.PI to ensure multiple rotations
          const theta = age * Math.PI * 6 + phase + time;
          
          const x = centerX + Math.cos(theta) * r;
          const y = centerY + Math.sin(theta) * r;
          
          if (isInWindow) {
            highlightedPoints++;
            ctx.fillStyle = color;
            if (tenantCount < 20) {
              ctx.shadowBlur = 5;
              ctx.shadowColor = color;
            }
          } else {
            ctx.fillStyle = 'rgba(30, 41, 59, 0.2)';
            ctx.shadowBlur = 0;
          }
          
          ctx.beginPath();
          const pSize = isInWindow ? (tenantCount > 50 ? 1.5 : 2.5) : (tenantCount > 50 ? 0.5 : 1);
          ctx.arc(x, y, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      ctx.shadowBlur = 0;
      stats.innerHTML = `SCANNING [N=${tenantCount}] | BUNDLE_SIZE: ${resolution} | HITS: ${highlightedPoints} | TOTAL_OFFSETS: ${totalPoints}`;

      requestAnimationFrame(draw);
    }
    
    draw();
  });
})();
</script>

# The Engineering Problem: Entropy and Page Overhead

PostgreSQL organizes data into fixed-size **8KB Pages**. For analytical queries on massive time-series data, this creates a significant "IO Tax."

{% mermaid %}
graph TD
    subgraph "Spiral 8KB Page — src/storage.rs"
    H["PageHeaderData · 24 bytes"] --> DA
    DA["Data Area · 1018 × 8-byte slots<br/>(8192 − 24 − 24) / 8 = 1018 f64 values"] --> OP
    OP["SpiralPageOpaque · 24 bytes<br/>window_start_t · window_end_t<br/>tenant_scale · magic 0x50495241"]
    end
    subgraph "Standard Heap 8KB Page"
    PH["PageHeaderData · 24 bytes"] --> LP
    LP["Line Pointers array"] --> T1
    LP --> T2
    T1["Tuple 1 (header + columns)"] --> FS
    T2["Tuple 2"] --> FS
    FS["Free Space (variable)"]
    end
{% endmermaid %}

# The B-Tree Trap in Multidimensional Queries

B-Trees are the workhorse of Postgres, but they are fundamentally one-dimensional. When you create a composite index on `(tenant_id, time)`, you are prioritizing one dimension over the other.

- **Query A** (`WHERE tenant_id = 1 AND t > ...`): **Fast**.
- **Query B** (`WHERE t > ...` across multiple tenants): **Slow**.

# How Spiral Differs from Existing Solutions

Several mature tools address time-series at scale. Spiral explores a different set of trade-offs.

| | TimescaleDB | pg_partman | Spiral |
| :--- | :--- | :--- | :--- |
| **Storage** | Hypertable chunks | Native partitions | Custom TAM + standard heap |
| **Rollups** | Continuous aggregates (explicit) | None | Auto-derived from magic comments |
| **Query rewrite** | Manual view queries | None | Transparent planner hook |
| **Dirty-aware slicing** | No | No | Yes — clean → rollup, dirty → raw |
| **Mergeable stats** | Limited | None | Welford moments + sketch/tdigest |
| **Multi-tenant isolation** | Schema-per-tenant or manual | Manual | Built-in `spiral.tenant` lane |
| **Background maintenance** | Yes (jobs) | Yes (cron) | Yes (autonomous bgworker, 1s tick) |
| **Extension type** | C + custom storage | Pure SQL | Rust (pgrx) + TAM + planner hook |

The key architectural difference: **you never change your query**. TimescaleDB continuous aggregates are separate views that you must remember to query. Spiral intercepts the original query and routes it transparently — the application code never changes when a new rollup tier is added or a bucket becomes dirty.

# Geometry-Aware Indexing with Z-Order

B-Trees excel at single-dimension queries, but fall apart when you filter on `tenant_id` **and** `t` together. Z-ordering maps both dimensions into one number so that rows close in both dimensions stay close in storage — turning expensive multi-column scans into tight range scans.

**Try it:** sort by Color, Size, or Z-Order, then run a query and watch how many pages load:

<div id="toybox-demo" class="interactive-widget" style="margin: 1.5rem 0; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem;">
  <div style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:#94a3b8;margin-bottom:0.75rem;letter-spacing:1px;">TOY BOX SORTER · 12 shapes · 4 pages · circle=red  square=blue  diamond=green  triangle=orange</div>
  <canvas id="tb-canvas" width="576" height="200" style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;display:block;margin-bottom:0.75rem;max-width:100%;"></canvas>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
    <span style="font-size:0.6rem;color:#64748b;font-family:monospace;min-width:55px;">SORT:</span>
    <button id="tb-shuffle" style="background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;padding:4px 10px;border-radius:4px;font-size:0.65rem;cursor:pointer;font-family:monospace;font-weight:700;">⇄ SHUFFLE</button>
    <button id="tb-color"   style="background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5;padding:4px 10px;border-radius:4px;font-size:0.65rem;cursor:pointer;font-family:monospace;font-weight:700;">BY COLOR</button>
    <button id="tb-size"    style="background:#eff6ff;color:#1d4ed8;border:1px solid #93c5fd;padding:4px 10px;border-radius:4px;font-size:0.65rem;cursor:pointer;font-family:monospace;font-weight:700;">BY SIZE</button>
    <button id="tb-zorder"  style="background:#f0fdf4;color:#15803d;border:1px solid #86efac;padding:4px 10px;border-radius:4px;font-size:0.65rem;cursor:pointer;font-family:monospace;font-weight:700;">⚡ Z-ORDER</button>
  </div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">
    <span style="font-size:0.6rem;color:#64748b;font-family:monospace;min-width:55px;">QUERY:</span>
    <button id="tb-q-small" style="background:#fafafa;color:#374151;border:1px solid #d1d5db;padding:4px 10px;border-radius:4px;font-size:0.65rem;cursor:pointer;font-family:monospace;">FIND SMALL</button>
    <button id="tb-q-red"   style="background:#fafafa;color:#374151;border:1px solid #d1d5db;padding:4px 10px;border-radius:4px;font-size:0.65rem;cursor:pointer;font-family:monospace;">FIND RED</button>
    <button id="tb-q-both"  style="background:#fafafa;color:#374151;border:1px solid #d1d5db;padding:4px 10px;border-radius:4px;font-size:0.65rem;cursor:pointer;font-family:monospace;">FIND SMALL+RED</button>
    <button id="tb-q-clear" style="background:#fafafa;color:#94a3b8;border:1px solid #e2e8f0;padding:4px 10px;border-radius:4px;font-size:0.65rem;cursor:pointer;font-family:monospace;">CLEAR</button>
  </div>
  <div id="tb-info" style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:#374151;background:#f1f5f9;padding:8px 12px;border-radius:6px;border-left:3px solid #94a3b8;min-height:2rem;line-height:1.5;"></div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('tb-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var W = 576, H = 200;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    canvas.style.maxWidth = '100%';
    ctx.scale(dpr, dpr);
    var N = 12, PAGE_SIZE = 3, NUM_PAGES = N / PAGE_SIZE;
    var SLOT = W / N;
    var SY = Math.floor(H * 0.42);

    var COLORS = ['#ef4444','#3b82f6','#22c55e','#f97316'];
    var SIZE_PX = [10, 17, 25];

    // 4 colors × 3 sizes = 12 shapes
    var shapes = [];
    for (var c = 0; c < 4; c++)
      for (var s = 0; s < 3; s++)
        shapes.push({ color: c, size: s });

    function morton(x, y) {
      var z = 0;
      for (var i = 0; i < 4; i++)
        z |= ((x & (1 << i)) << i) | ((y & (1 << i)) << (i + 1));
      return z;
    }

    var positions = shapes.map(function(_, i) { return i; });
    var targets   = positions.slice();
    var raf = null, highlightFn = null, activeSort = '', activeQuery = '';

    function drawShape(cx, cy, colorHex, sizeIdx, type, alpha) {
      var r = SIZE_PX[sizeIdx];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colorHex;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      if (type === 0) {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (type === 1) {
        var s = r * 1.35;
        ctx.fillRect(cx-s, cy-s, s*2, s*2); ctx.strokeRect(cx-s, cy-s, s*2, s*2);
      } else if (type === 2) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - r*1.4); ctx.lineTo(cx + r*1.15, cy);
        ctx.lineTo(cx, cy + r*1.4); ctx.lineTo(cx - r*1.15, cy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(cx, cy - r*1.3);
        ctx.lineTo(cx + r*1.2, cy + r*0.95);
        ctx.lineTo(cx - r*1.2, cy + r*0.95);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }

    function render() {
      ctx.clearRect(0, 0, W, H);
      var loadedPages = new Set();
      if (highlightFn)
        shapes.forEach(function(sh, i) {
          if (highlightFn(sh)) loadedPages.add(Math.floor(Math.round(positions[i]) / PAGE_SIZE));
        });

      for (var p = 0; p < NUM_PAGES; p++) {
        var px = p * SLOT * PAGE_SIZE, pw = SLOT * PAGE_SIZE;
        var hit = loadedPages.has(p);
        ctx.fillStyle = hit ? 'rgba(251,191,36,0.18)' : (p % 2 === 0 ? '#f8fafc' : '#f1f5f9');
        ctx.fillRect(px, 0, pw, H - 28);
        if (hit) {
          ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
          ctx.strokeRect(px+1, 1, pw-2, H-30);
        }
        ctx.fillStyle = hit ? '#d97706' : '#94a3b8';
        ctx.font = (hit ? 'bold ' : '') + '10px monospace';
        ctx.fillText('pg' + p, px + 5, H - 10);
      }
      // dividers
      for (var d = 1; d < NUM_PAGES; d++) {
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
        ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(d*SLOT*PAGE_SIZE, 0); ctx.lineTo(d*SLOT*PAGE_SIZE, H-28); ctx.stroke();
        ctx.setLineDash([]);
      }
      // shapes
      shapes.forEach(function(sh, i) {
        var x = (positions[i] + 0.5) * SLOT;
        var alpha = highlightFn ? (highlightFn(sh) ? 1.0 : 0.08) : 1.0;
        drawShape(x, SY, COLORS[sh.color], sh.size, sh.color, alpha);
      });
      // page-load counter
      if (highlightFn && loadedPages.size > 0) {
        var n = loadedPages.size;
        ctx.fillStyle = n <= 1 ? '#15803d' : n <= 2 ? '#d97706' : '#dc2626';
        ctx.font = 'bold 12px monospace';
        var txt = 'Pages loaded: ' + n + ' / ' + NUM_PAGES;
        ctx.fillText(txt, W - ctx.measureText(txt).width - 8, H - 10);
      }
    }

    function tick() {
      var done = true;
      shapes.forEach(function(_, i) {
        var d = targets[i] - positions[i];
        if (Math.abs(d) > 0.005) { positions[i] += d * 0.18; done = false; }
        else positions[i] = targets[i];
      });
      render();
      raf = done ? null : requestAnimationFrame(tick);
    }

    function startAnim() { if (!raf) raf = requestAnimationFrame(tick); }

    function applySort(cmpFn) {
      var arr = shapes.map(function(s, i) { return Object.assign({}, s, {_i: i}); }).sort(cmpFn);
      arr.forEach(function(s, pos) { targets[s._i] = pos; });
      startAnim();
    }

    function shuffleIt() {
      var arr = shapes.map(function(_, i) { return i; });
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      shapes.forEach(function(_, i) { targets[i] = arr[i]; });
      startAnim();
    }

    var MSGS = {
      shuffle: 'Shuffled — data arrives in random order (real INSERT stream). Any query scans all 4 pages.',
      color:   'Sorted by COLOR (≈ tenant_id). "Find RED" = 1 page. "Find SMALL" must visit every color group — 4 pages.',
      size:    'Sorted by SIZE (≈ time bucket). "Find SMALL" = 1 page. "Find RED" must visit every size group — 4 pages.',
      zorder:  'Z-Order — no single dimension is fully contiguous, but shapes near in BOTH color+size land in the same page. "Find SMALL+RED" = 1 page.'
    };

    function updateInfo() {
      var el = document.getElementById('tb-info');
      if (!el) return;
      var msg = MSGS[activeSort] || '';
      if (highlightFn && activeSort) {
        var lp = new Set();
        shapes.forEach(function(sh, i) {
          if (highlightFn(sh)) lp.add(Math.floor(Math.round(targets[i]) / PAGE_SIZE));
        });
        var qname = activeQuery === 'small' ? 'FIND SMALL' : activeQuery === 'red' ? 'FIND RED' : 'FIND SMALL+RED';
        msg += '  →  [' + qname + '] loads ' + lp.size + '/' + NUM_PAGES + ' pages.';
      }
      el.textContent = msg;
    }

    function wire(id, sortKey, fn) {
      var el = document.getElementById(id); if (!el) return;
      el.onclick = function() { activeSort = sortKey; fn(); updateInfo(); };
    }
    function qwire(id, key, fn) {
      var el = document.getElementById(id); if (!el) return;
      el.onclick = function() { activeQuery = key; highlightFn = fn; startAnim(); updateInfo(); };
    }

    wire('tb-shuffle', 'shuffle', shuffleIt);
    wire('tb-color',   'color',   function() { applySort(function(a,b){ return a.color-b.color || a.size-b.size; }); });
    wire('tb-size',    'size',    function() { applySort(function(a,b){ return a.size-b.size   || a.color-b.color; }); });
    wire('tb-zorder',  'zorder',  function() { applySort(function(a,b){ return morton(a.color,a.size)-morton(b.color,b.size); }); });

    qwire('tb-q-small', 'small', function(s){ return s.size===0; });
    qwire('tb-q-red',   'red',   function(s){ return s.color===0; });
    qwire('tb-q-both',  'small+red', function(s){ return s.color===0 && s.size===0; });

    var clearBtn = document.getElementById('tb-q-clear');
    if (clearBtn) clearBtn.onclick = function() { highlightFn=null; activeQuery=''; render(); updateInfo(); };

    // start sorted by color
    activeSort = 'color';
    applySort(function(a,b){ return a.color-b.color || a.size-b.size; });
    updateInfo();
  });
})();
</script>

That is exactly what `spiral_zorder` does in SQL. It encodes both dimensions into a single number so that values close in **both** tenant and time land close together on the number line — enabling a single `BETWEEN lo AND hi` index scan to retrieve a 2D rectangle without touching unrelated rows.

```sql
-- Create a z-order index on the rollup view
CREATE INDEX ON sensor_data_1m USING btree (
    spiral_zorder(spiral(t), ARRAY['sensor_id'])
);

-- Spiral injects this automatically for tenant-scoped queries:
-- WHERE spiral_zorder(spiral(t), ARRAY['sensor_id']) BETWEEN <lo> AND <hi>
```

`spiral_zorder` uses FNV-1a hashing — stable and deterministic across restarts, so index values written today still match values computed at query time tomorrow.

# Interactive Proof of Locality

Compare how **Standard Row-Major** and **Z-Order Morton** handle memory access. Select a range and watch the **Page Loads** metric.

<div id="js-locality-root" class="interactive-widget" style="margin: 2rem 0; background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; display: flex; flex-direction: column; align-items: center;">
  <div style="display: flex; gap: 2rem; width: 100%; justify-content: center; flex-wrap: wrap;">
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
      const stdOrder = [...cells].sort((a,b) => a.std - b.std); let activePagesS = new Set();
      for(let i=0; i<stdOrder.length; i++) {
        const p = stdOrder[i]; ctxS.fillStyle = '#ef4444'; ctxS.fillRect(p.x*cell+1, p.y*cell+1, cell-2, cell-2);
        activePagesS.add(Math.floor(p.std / PAGE_SIZE)); jStd.textContent = `Page Loads: ${activePagesS.size}`; await new Promise(r => setTimeout(r, 20));
      }
      const zOrder = [...cells].sort((a,b) => a.z - b.z); let activePagesZ = new Set();
      for(let i=0; i<zOrder.length; i++) {
        const p = zOrder[i]; ctxZ.fillStyle = '#0ea5e9'; ctxZ.fillRect(p.x*cell+1, p.y*cell+1, cell-2, cell-2);
        activePagesZ.add(Math.floor(p.z / PAGE_SIZE)); jZ.textContent = `Page Loads: ${activePagesZ.size}`; await new Promise(r => setTimeout(r, 20));
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
# Prototyping a Custom Table Access Method (TAM)

PostgreSQL 12 decoupled the internal storage from the executor through the **Table Access Method (TAM)** API. This is where the research got practical. Using **Rust and `pgrx`**, I implemented a prototype handler that bypasses the standard Heap.

```rust
// src/tam.rs — TAM registration
pub unsafe fn spiral_tam_handler(_fcinfo: pg_sys::FunctionCallInfo) -> pgrx::datum::Internal {
    let routine = PgMemoryContexts::TopMemoryContext.palloc_struct::<pg_sys::TableAmRoutine>();
    (*routine).type_ = pg_sys::NodeTag::T_TableAmRoutine;

    // Scan path — fully implemented
    (*routine).scan_begin       = Some(spiral_scan_begin);
    (*routine).scan_getnextslot = Some(spiral_scan_getnextslot);
    (*routine).scan_end         = Some(spiral_scan_end);

    // Insert path — registered but body is an empty stub; TAM insert is not yet
    // implemented. Live writes reach Spiral via standard heap + track_changes_stmt trigger.
    (*routine).tuple_insert = Some(spiral_slot_insert);

    pgrx::datum::Internal::from(Some(pg_sys::Datum::from(routine as usize)))
}
```

# Binary Packing & Direct Seeks: The Real Implementation

Spiral uses **PostgreSQL's own buffer manager** — not flat files. The innovation is computing an exact `(block_number, byte_offset)` for any `(t, tenant_id)` pair in O(1), bypassing B-Tree traversal entirely.

Two core `#[repr(C)]` structures from `src/storage.rs`:

```rust
#[repr(C)]
struct CompressedBlock {
    first_val: f64,       // 8 bytes — anchor point
    data: [u8; 120],      // 60 × 2-byte XOR deltas (Gorilla encoding)
}                         // 128 bytes total → stores 64 time-series points

#[repr(C)]
pub struct SpiralPageOpaque {
    pub window_start_t: i64,  // time window covered by this page
    pub window_end_t:   i64,
    pub tenant_scale:   i32,  // number of tenant lanes
    pub magic:          u32,  // 0x50495241 = 'SPRA'
}
```

The address formula (mode 1 — direct `f64`, single value column):

$$ \text{logical\_offset} = (t_{\text{rel}} \times \text{tenant\_scale} \times 8) + (\text{tenant\_id} \times 8) $$
{: .math-formula}

Where `t_rel = spiral(t) - kickoff_epoch` normalizes any `timestamptz` to a dense integer. The offset then maps to a page via:

```rust
// src/storage.rs — exact implementation
const DATA_PER_PAGE: usize = (8192 - 24 - 24) / 8; // = 1018 f64 values per page

pub fn logical_to_physical_offset(logical_offset: i64) -> (u32, u32) {
    let index          = logical_offset / 8;
    let blkno          = (index / DATA_PER_PAGE as i64) as u32;
    let offset_in_page = (24 + (index % DATA_PER_PAGE as i64) * 8) as u32;
    (blkno, offset_in_page)
}
```

`tenant_scale` comes from a one-character cardinality hint: `'d'`→10, `'h'`→100, `'k'`→1,000, `'M'`→1,000,000, `'B'`→1,000,000,000, `'T'`→1,000,000,000,000.

# Three Storage Modes: Matching Structure to Workload

Spiral ships three packing functions, each trading precision for density. The page map below shows exactly how each fills an 8KB page — and what the savings look like compared to a standard PostgreSQL heap table.

**How to read the page map:** Each small square = one 8-byte slot. A full page has 1024 slots arranged in a 32×32 grid.

| Cell color | Meaning |
| :--- | :--- |
| Gray (top-left 3 cells) | 24-byte `PageHeaderData` — PostgreSQL page header |
| Dark blue (bottom-right 3 cells) | 24-byte `SpiralPageOpaque` — Spiral metadata (time window, tenant scale, magic) |
| **Rainbow / colored** | Data slot occupied by a tenant. Each hue = one tenant lane. With many tenants the hues cycle, producing the rainbow gradient |
| Near-black | Empty or wasted slot (visible in Compact mode where every other slot is overhead) |

The three pages shown side-by-side let you see how the tenant pattern repeats as data fills successive 8KB blocks.

<div id="storage-carousel" class="interactive-widget" style="margin: 2rem 0; background: #020617; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden;">
  <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1.25rem;border-bottom:1px solid #1e293b;background:#010409;">
    <span style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:#64748b;letter-spacing:1px;">STORAGE MODE EXPLORER · src/storage.rs</span>
    <div style="display:flex;align-items:center;gap:10px;">
      <div id="sc-dots" style="display:flex;gap:6px;"></div>
      <button id="sc-prev" style="background:#1e293b;color:#94a3b8;border:1px solid #334155;width:26px;height:26px;border-radius:4px;cursor:pointer;font-size:0.75rem;line-height:1;">&lt;</button>
      <button id="sc-next" style="background:#1e293b;color:#94a3b8;border:1px solid #334155;width:26px;height:26px;border-radius:4px;cursor:pointer;font-size:0.75rem;line-height:1;">&gt;</button>
    </div>
  </div>
  <div id="sc-content" style="padding:1.25rem;min-height:420px;"></div>
</div>

<script>
(function() {
  // ── Constants from src/storage.rs (exact match) ───────────────
  var BLCKSZ        = 8192;
  var HDR           = 24;   // sizeof(PageHeaderData)
  var SPECIAL       = 24;   // sizeof(SpiralPageOpaque)
  var DATA_PER_PAGE = Math.floor((BLCKSZ - HDR - SPECIAL) / 8); // 1018
  var BLOCK_SIZE    = 128;  // sizeof(CompressedBlock)
  var PPB           = 64;   // POINTS_PER_BLOCK

  var EXAMPLES = [
    {
      id: 0, title: 'IoT Sensor Network', subtitle: 'Direct f64 · 8 bytes per slot',
      accent: '#0ea5e9', mode: 'direct', S: 10, C: 1, T: 10000,
      card: "'d' → 10 sensors",
      ddl: 'CREATE TABLE sensor_data (\n  t           timestamptz NOT NULL,\n  sensor_id   int4        NOT NULL,\n  temperature float8\n) WITH (\n  spiral.tenant      = \'sensor_id\',\n  spiral.cardinality = \'d\'  -- 10 lanes\n);'
    },
    {
      id: 1, title: 'Financial Tick Data', subtitle: 'Compact u32+f32 · 16 bytes per slot',
      accent: '#818cf8', mode: 'compact', S: 1000, C: 1, T: 10000,
      card: "'k' → 1 000 symbols",
      ddl: 'CREATE TABLE asset_ticks (\n  t         timestamptz NOT NULL,\n  symbol_id int4        NOT NULL,\n  price     float8\n) WITH (\n  spiral.tenant      = \'symbol_id\',\n  spiral.cardinality = \'k\'  -- 1 000 lanes\n);'
    },
    {
      id: 2, title: 'Multi-Sensor Environmental', subtitle: 'XOR Delta Blocks · 128 bytes / 64 points',
      accent: '#10b981', mode: 'blocks', S: 100, C: 3, T: 10000,
      card: "'h' → 100 devices · 3 cols",
      ddl: 'CREATE TABLE env_sensors (\n  t           timestamptz NOT NULL,\n  device_id   int4        NOT NULL,\n  temperature float8,      -- Spiral: ohlcv\n  humidity    float8,      -- Spiral: stats\n  co2_ppm     float8       -- Spiral: sum\n) WITH (\n  spiral.tenant      = \'device_id\',\n  spiral.cardinality = \'h\'  -- 100 lanes\n);'
    },
    {
      id: 3, title: 'Custom Configuration', subtitle: 'tune all parameters live',
      accent: '#f59e0b', mode: null
    }
  ];

  function spiralPages(mode, S, T, C) {
    if (mode === 'direct')  return Math.ceil(T * S * C / DATA_PER_PAGE);
    if (mode === 'compact') return Math.ceil(T * S * C / Math.floor(DATA_PER_PAGE / 2));
    if (mode === 'blocks') {
      var bpp = Math.floor(DATA_PER_PAGE / 16); // 63 blocks per page
      return Math.ceil(Math.ceil(T / PPB) * S * C / bpp);
    }
    return 0;
  }

  function heapPages(S, T, C) {
    var rowSize = 24 + 8 + 4 + 4 + C * 8; // header + t + tenant_id + pad + cols
    var rpp = Math.floor((BLCKSZ - HDR) / (rowSize + 4));
    return Math.ceil(T * S / rpp);
  }

  function fmt(n) {
    if (n >= 1073741824) return (n/1073741824).toFixed(1)+' GB';
    if (n >= 1048576)    return (n/1048576).toFixed(1)+' MB';
    if (n >= 1024)       return (n/1024).toFixed(1)+' KB';
    return n+' B';
  }
  function fmtN(n) {
    if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
    if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
    if (n >= 1e3) return (n/1e3).toFixed(0)+'K';
    return n;
  }

  function drawPageMap(canvas, mode, S, T, C, accent) {
    if (!canvas) return;
    var dpr  = window.devicePixelRatio || 1;
    var W    = canvas.offsetWidth  || 330;
    var H    = canvas.offsetHeight || Math.round(W * 220 / 330);
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // ── Color palette: max 16 evenly-spaced hues ───────────────
    // Cap at 16 so the audience sees clear, named lanes — not noise.
    // With S > 16 we show "tenant_id % 16" and note groups in legend.
    var DCAP = Math.min(S, 16);
    function laneHue(lane) { return (lane * (360 / DCAP)) % 360; }
    function laneColor(lane, lightness) {
      return 'hsl('+laneHue(lane % DCAP)+',70%,'+(lightness||55)+'%)';
    }

    // ── Layout ─────────────────────────────────────────────────
    var LEGEND_H = 30;
    var gridH = H - LEGEND_H;
    var PAGES = 3, gap = 4;
    var pageW = Math.floor((W - gap*(PAGES-1)) / PAGES);
    var COLS = 32, ROWS = 32;
    var cs = Math.floor(Math.min(pageW/COLS, gridH/ROWS));

    ctx.fillStyle = '#010409';
    ctx.fillRect(0, 0, W, H);

    for (var p = 0; p < PAGES; p++) {
      var ox = p * (pageW + gap);

      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1;
      ctx.strokeRect(ox+0.5, 0.5, pageW-1, gridH-1);

      for (var i = 0; i < 1024; i++) {
        var col = i % COLS;
        var row = Math.floor(i / COLS);
        var x = ox + col * cs;
        var y = row * cs;
        var sz = Math.max(cs-1, 1);

        // Header = gray, SpiralPageOpaque = dark blue
        if (i < 3)    { ctx.fillStyle = '#475569'; ctx.fillRect(x,y,sz,sz); continue; }
        if (i >= 1021) { ctx.fillStyle = '#1e3a8a'; ctx.fillRect(x,y,sz,sz); continue; }

        var di       = i - 3;
        var globalDi = p * DATA_PER_PAGE + di;
        var color    = '#0a1020';

        if (mode === 'direct') {
          // Each slot = one (t, tenant_id) point. Lane cycles with period S.
          color = laneColor(globalDi % S);
        } else if (mode === 'compact') {
          // Every other slot is wasted (16B logical, but only 8B used per entry).
          if (di % 2 === 0) {
            var eid = p * Math.floor(DATA_PER_PAGE/2) + Math.floor(di/2);
            color = laneColor(eid % S);
          } else {
            color = '#12202e'; // wasted — darker, shows overhead
          }
        } else if (mode === 'blocks') {
          // 16 slots = one 128B CompressedBlock (64 pts). Anchor brighter.
          var slotGlobal = p * DATA_PER_PAGE + di;
          var blkIdx    = Math.floor(slotGlobal / 16);
          var posInBlk  = slotGlobal % 16;
          var lane      = blkIdx % S;
          color = laneColor(lane, posInBlk === 0 ? 60 : 30);
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, sz, sz);
      }

      // Page number label at bottom-left of each page
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('pg '+p, ox+3, gridH-4);
    }

    // ── Legend strip ───────────────────────────────────────────
    var ly = gridH + 6;
    ctx.font = '8px monospace';

    // Header swatch
    ctx.fillStyle = '#475569';
    ctx.fillRect(2, ly, 8, 8);
    ctx.fillStyle = '#64748b';
    ctx.fillText('Hdr', 13, ly+8);

    // SpiralPageOpaque swatch
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(38, ly, 8, 8);
    ctx.fillStyle = '#64748b';
    ctx.fillText('Opaque', 49, ly+8);

    // Total pages counter — updates with T and C
    var totalPgs = (T && C) ? spiralPages(mode, S, T, C) : null;
    if (totalPgs) {
      ctx.fillStyle = '#64748b';
      ctx.fillText('showing 3 of '+fmtN(totalPgs)+' pages'+(C>1?' × '+C+'col':''), 100, ly+8);
    }

    // Tenant lane swatches (up to 16) — right side
    var swX = W - DCAP * 11 - 2;
    for (var t = 0; t < DCAP; t++) {
      ctx.fillStyle = laneColor(t);
      ctx.fillRect(swX + t*11, ly, 10, 8);
    }
    ctx.fillStyle = S > DCAP ? '#f59e0b' : '#64748b';
    ctx.font = '7px monospace';
    ctx.fillText(S > DCAP ? 'lane groups ('+S+' total)' : S+' tenant lanes', swX - 4 - (S > DCAP ? 90 : 70), ly+8);
  }

  function statsHtml(mode, S, T, C, accent) {
    var sp = spiralPages(mode, S, T, C);
    var hp = heapPages(S, T, C);
    var reduction = Math.round((1 - (sp / hp)) * 100);
    var rowSize = 24 + 8 + 4 + 4 + C * 8;
    var modeSlotBytes = mode==='direct'?8 : mode==='compact'?16 : 128;
    var modePointsPer = mode==='blocks'?PPB:1;

    return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">'
      +'<div style="background:#0f172a;padding:10px;border-radius:6px;border-left:3px solid '+accent+';">'
        +'<div style="font-size:0.55rem;color:#64748b;font-family:monospace;">SPIRAL PAGES</div>'
        +'<div style="font-size:1.3rem;color:#fff;font-weight:700;">'+fmtN(sp)+'</div>'
        +'<div style="font-size:0.5rem;color:#64748b;">'+fmt(sp*BLCKSZ)+'</div></div>'
      +'<div style="background:#0f172a;padding:10px;border-radius:6px;border-left:3px solid #ef4444;">'
        +'<div style="font-size:0.55rem;color:#64748b;font-family:monospace;">HEAP PAGES</div>'
        +'<div style="font-size:1.3rem;color:#fff;font-weight:700;">'+fmtN(hp)+'</div>'
        +'<div style="font-size:0.5rem;color:#64748b;">'+fmt(hp*BLCKSZ)+'</div></div>'
      +'<div style="background:#0f172a;padding:10px;border-radius:6px;border-left:3px solid #4ade80;">'
        +'<div style="font-size:0.55rem;color:#64748b;font-family:monospace;">REDUCTION</div>'
        +'<div style="font-size:1.3rem;color:'+(reduction>0?'#4ade80':'#f87171')+';font-weight:700;">'+reduction+'%</div>'
        +'<div style="font-size:0.5rem;color:#64748b;">'+(hp/Math.max(sp,1)).toFixed(1)+'× fewer pages</div></div>'
      +'</div>'
      +'<div style="font-size:0.6rem;color:#475569;font-family:monospace;border-top:1px solid #1e293b;padding-top:8px;">'
        +'slot = '+modeSlotBytes+'B'+(modePointsPer>1?' / '+modePointsPer+' pts':'')+' · '
        +'heap row = '+rowSize+'B · '
        +fmtN(T*S)+' data points total'
      +'</div>';
  }

  function renderSlide(ex) {
    var sp = spiralPages(ex.mode, ex.S, ex.T, ex.C);
    var hp = heapPages(ex.S, ex.T, ex.C);
    document.getElementById('sc-content').innerHTML =
      '<div style="display:flex;gap:1.25rem;flex-wrap:wrap;">'
        +'<div style="flex:1;min-width:240px;">'
          +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:0.65rem;color:'+ex.accent+';margin-bottom:6px;font-weight:700;letter-spacing:1px;">'+ex.title.toUpperCase()+'</div>'
          +'<div style="font-size:0.7rem;color:#64748b;margin-bottom:10px;">'+ex.subtitle+'</div>'
          +'<pre style="background:#010409;border:1px solid #1e3a8a;border-radius:6px;padding:10px;font-size:0.6rem;color:#94a3b8;overflow-x:auto;margin:0 0 10px 0;white-space:pre;">'+ex.ddl+'</pre>'
          +'<div style="font-size:0.6rem;color:#475569;font-family:monospace;">cardinality: <span style="color:#fbbf24;">'+ex.card+'</span></div>'
        +'</div>'
        +'<div style="flex:1;min-width:240px;">'
          +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:0.6rem;color:#64748b;margin-bottom:6px;letter-spacing:1px;">PAGE MAP — 3 × 8 KB</div>'
          +'<canvas id="sc-canvas" width="330" height="220" style="width:100%;background:#010409;border:1px solid #1e293b;border-radius:4px;display:block;"></canvas>'
          +'<div style="font-size:0.55rem;color:#64748b;font-family:monospace;margin-top:4px;">each cell = 8B · 32×32 grid = 1 page · '+(ex.mode==='compact'?'dark cells = wasted slots':'')+'</div>'
        +'</div>'
        +'<div style="flex:0 0 100%;background:#010409;border:1px solid #1e293b;border-radius:8px;padding:1rem;font-family:\'JetBrains Mono\',monospace;">'
          +'<div style="font-size:0.6rem;color:#64748b;margin-bottom:10px;letter-spacing:1px;">STORAGE COMPARISON · '+fmtN(ex.T)+'t × '+ex.S+'s × '+ex.C+'c</div>'
          +statsHtml(ex.mode, ex.S, ex.T, ex.C, ex.accent)
        +'</div>'
      +'</div>';
    drawPageMap(document.getElementById('sc-canvas'), ex.mode, ex.S, ex.T, ex.C, ex.accent);
  }

  function renderCustom() {
    var SCALES = [10, 100, 1000, 1000000];
    var SKEYS  = ["'d'", "'h'", "'k'", "'M'"];
    var SDESC  = ['10 tenants', '100 tenants', '1 000 tenants', '1 M tenants'];
    var TIMES  = [1000, 10000, 100000, 1000000];
    var TLABELS = ['1K', '10K', '100K', '1M'];

    function cardOpt(idx, checked) {
      return '<label style="flex:1;min-width:60px;cursor:pointer;">'
        +'<input type="radio" name="cc-s" value="'+idx+'"'+(checked?' checked':'')+' style="display:none;">'
        +'<div id="cc-card-'+idx+'" style="border:1px solid '+(checked?'#f59e0b':'#334155')+';border-radius:6px;padding:8px 4px;text-align:center;background:'+(checked?'#1c1407':'#0f172a')+';transition:border 0.15s,background 0.15s;font-family:monospace;">'
          +'<div style="font-size:1rem;color:#fbbf24;font-weight:700;">'+SKEYS[idx]+'</div>'
          +'<div style="font-size:0.5rem;color:#64748b;margin-top:2px;">'+SDESC[idx]+'</div>'
        +'</div>'
      +'</label>';
    }

    document.getElementById('sc-content').innerHTML =
      '<div>'
        +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:0.65rem;color:#f59e0b;margin-bottom:12px;font-weight:700;letter-spacing:1px;">CUSTOM CONFIGURATION</div>'

        +'<div style="margin-bottom:1rem;">'
          +'<div style="font-size:0.6rem;color:#94a3b8;font-family:monospace;margin-bottom:6px;">spiral.cardinality</div>'
          +'<div style="display:flex;gap:6px;">'
            +cardOpt(0,false)+cardOpt(1,true)+cardOpt(2,false)+cardOpt(3,false)
          +'</div>'
        +'</div>'

        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">'
          +'<div><label style="font-size:0.6rem;color:#94a3b8;font-family:monospace;display:block;margin-bottom:4px;">time_slots: <span id="cc-tv" style="color:#fbbf24;">10K</span></label><input type="range" id="cc-t" min="0" max="3" value="1" style="width:100%;"></div>'
          +'<div><label style="font-size:0.6rem;color:#94a3b8;font-family:monospace;display:block;margin-bottom:4px;">columns: <span id="cc-cv" style="color:#fbbf24;">1</span></label><input type="range" id="cc-c" min="1" max="8" value="1" style="width:100%;"></div>'
          +'<div style="grid-column:1/-1;"><label style="font-size:0.6rem;color:#94a3b8;font-family:monospace;display:block;margin-bottom:4px;">mode</label>'
            +'<select id="cc-m" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:4px 6px;border-radius:4px;font-family:monospace;font-size:0.65rem;width:100%;">'
              +'<option value="direct">Direct f64 — 8B/slot · 1018 slots/page</option>'
              +'<option value="compact">Compact u32+f32 — 16B/slot · 509 slots/page</option>'
              +'<option value="blocks">XOR Delta Blocks — 128B/block · 63 blocks/page · 64 pts/block</option>'
            +'</select></div>'
        +'</div>'

        +'<canvas id="cc-canvas" width="330" height="110" style="width:100%;background:#010409;border:1px solid #1e293b;border-radius:4px;display:block;margin-bottom:1rem;"></canvas>'
        +'<div id="cc-stats" style="background:#010409;border:1px solid #1e293b;border-radius:8px;padding:1rem;font-family:\'JetBrains Mono\',monospace;"></div>'
      +'</div>';

    function getScaleIdx() {
      var r = document.querySelector('input[name="cc-s"]:checked');
      return r ? +r.value : 1;
    }

    function syncCardStyles(si) {
      for (var i = 0; i < 4; i++) {
        var el = document.getElementById('cc-card-'+i);
        if (!el) continue;
        el.style.border = i === si ? '1px solid #f59e0b' : '1px solid #334155';
        el.style.background = i === si ? '#1c1407' : '#0f172a';
      }
    }

    function update() {
      var si   = getScaleIdx();
      var ti   = +document.getElementById('cc-t').value;
      var C    = +document.getElementById('cc-c').value;
      var mode = document.getElementById('cc-m').value;
      var S = SCALES[si], T = TIMES[ti];
      syncCardStyles(si);
      document.getElementById('cc-tv').textContent = TLABELS[ti];
      document.getElementById('cc-cv').textContent = C;
      document.getElementById('cc-stats').innerHTML = statsHtml(mode, S, T, C, '#f59e0b');
      drawPageMap(document.getElementById('cc-canvas'), mode, S, T, C, '#f59e0b');
    }

    document.querySelectorAll('input[name="cc-s"]').forEach(function(r) {
      r.addEventListener('change', update);
    });
    ['cc-t','cc-c','cc-m'].forEach(function(id) {
      document.getElementById(id).addEventListener('input', update);
    });
    update();
  }

  document.addEventListener('DOMContentLoaded', function() {
    var dots    = document.getElementById('sc-dots');
    var prevBtn = document.getElementById('sc-prev');
    var nextBtn = document.getElementById('sc-next');
    if (!dots) return;
    var current = 0;
    var N = EXAMPLES.length;

    for (var i = 0; i < N; i++) {
      (function(idx) {
        var d = document.createElement('div');
        d.style.cssText = 'width:6px;height:6px;border-radius:50%;cursor:pointer;transition:background 0.2s;background:#334155;';
        d.onclick = function() { go(idx); };
        dots.appendChild(d);
      })(i);
    }

    function go(n) {
      current = ((n % N) + N) % N;
      var dotEls = dots.childNodes;
      for (var i = 0; i < dotEls.length; i++) {
        dotEls[i].style.background = i === current ? (EXAMPLES[i].accent || '#f59e0b') : '#334155';
      }
      var ex = EXAMPLES[current];
      if (ex.mode) { renderSlide(ex); } else { renderCustom(); }
    }

    prevBtn.onclick = function() { go(current - 1); };
    nextBtn.onclick = function() { go(current + 1); };
    go(0);
  });
})();
</script>

# Automating the Pipeline: Hierarchical Rollups

To make the system usable, I wanted to automate the creation of hierarchies. In Spiral, a single table definition with magic comments can generate an entire analytical pipeline:

```sql
CREATE TABLE asset_ticks (
    t timestamptz NOT NULL,
    price double precision, -- Spiral: ohlc, stats, sketch
    vol int                 -- Spiral: sum
);
```

# Manual Control: Custom Hierarchies

While "Magic Comments" are great, power users can manually define rollups using standard Postgres `MATERIALIZED VIEW` syntax with Spiral options:

```sql
CREATE MATERIALIZED VIEW asset_ohlcv_1m 
WITH (
    spiral.frames = '5m,1h,1d',
    spiral.tenant = 'symbol_id'
) AS SELECT ... FROM ticks GROUP BY 1, 2;
```

# Calendar-Aligned Rollup Tiers

Beyond fixed-second intervals, Spiral supports **calendar-aligned** tiers that snap to month, quarter, and year boundaries — essential for financial and business reporting where "monthly" means January 1st, not "30 days ago."

```sql
CREATE TABLE asset_ticks (
    t         timestamptz NOT NULL,
    symbol_id int         NOT NULL,
    price     double precision, -- Spiral: ohlcv
    vol       bigint            -- Spiral: sum
) WITH (
    spiral.frames = '1h,1d,1mon,1qtr,1year',
    spiral.tenant = 'symbol_id'
);
```

Valid calendar suffixes:

| Suffix | Meaning | Snaps to |
| :--- | :--- | :--- |
| `1mon` / `1month` | Calendar month | 1st of each month |
| `1qtr` / `1quarter` | Calendar quarter | Jan 1, Apr 1, Jul 1, Oct 1 |
| `1year` / `1Y` | Calendar year | Jan 1 |

Under the hood, calendar tiers use `date_trunc('month', t)` (or `quarter`/`year`) in the rollup `GROUP BY`, so they respect timezone-aware truncation. Fixed-second tiers (like `1h`, `1d`) use epoch arithmetic and are always UTC-aligned.

# The Anatomy of a Rollup (Aggregation Inheritance)

How does Spiral know how to roll up your data? It uses deterministic rules for column inheritance:

| Column Suffix | Child Aggregate | Reason |
| :--- | :--- | :--- |
| `_h` / `_max` | `max()` | Peak is peak. |
| `_l` / `_min` | `min()` | Low is low. |
| `_sum` / `_count` | `sum()` | Accumulate totals. |
| `_sketch` | `merge()` | Mathematically unified sketches. |
| any `timestamptz` offset col | `range_max_end()` | Keeps the running max of a time range endpoint — used for open/close windows. |

# Incremental Maintenance: Tracking Changes via Changelog

Standard materialized views require a full rebuild. Spiral explores **Incremental View Maintenance (IVM)** using a transactional changelog. Every update flags a specific time bucket as "dirty."

{% mermaid %}
graph LR
    A[INSERT/UPDATE] --> B[Trigger]
    B --> C[(spiral.changelog)]
    C --> D[Background Worker]
    D --> E[Surgical Patch]
{% endmermaid %}

A background worker written in Rust monitors this log and performs surgical updates—healing the "orbits" of the spiral without rebuilding the world.

```rust
// In src/worker.rs - The Healing Loop
pub fn perform_healing() -> Result<(), pgrx::spi::Error> {
    let dirty_buckets = Spi::connect(|client| {
        client.select(
            "SELECT start_t, end_t FROM spiral.changelog WHERE processed = false",
            None, None
        )?.map(|row| (row[1].value::<i64>(), row[2].value::<i64>())).collect::<Vec<_>>()
    });

    for (start, end) in dirty_buckets {
        // Surgical rollup for this specific bucket
        rollup_bucket(start, end)?;
        
        Spi::run_with_args(
            "UPDATE spiral.changelog SET processed = true WHERE start_t = $1 AND end_t = $2",
            Some(vec![
                (PgBuiltInOids::INT8OID.oid(), start.into_datum()),
                (PgBuiltInOids::INT8OID.oid(), end.into_datum())
            ])
        )?;
    }
    Ok(())
}
```

# The Adaptive Query Slicer

One of the most complex parts of this research was exploring the **PostgreSQL Planner Hook**. The idea is to query the raw table and have the system automatically "slice" the query between different storage tiers based on data freshness and availability.

Select a time range on the timeline below, showing the last 7 days from past to present. Watch how Spiral would theoretically "slice" your query across storage tiers: **Daily**, **Hourly**, and **Minutely** rollups, with an automatic fallback to **Raw Data** for segments marked as "dirty" in the changelog. You can also simulate real-time traffic and see the background worker 'healing' the orbits.

<div id="query-slicer-root" class="interactive-widget" style="margin: 2rem 0; background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; min-height: 500px;">
  <div style="margin-bottom: 2rem;">
    <div id="timeline-labels" style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.7rem; color: #64748b; font-family: monospace; font-weight: bold;">
      <!-- Labels will be injected here -->
    </div>
    <div id="timeline-bg" style="height: 60px; background: #020617; border: 1px solid #334155; border-radius: 4px; position: relative; cursor: crosshair; overflow: hidden;">
       <div id="timeline-select" style="position: absolute; height: 100%; background: rgba(14, 165, 233, 0.2); border-left: 2px solid #0ea5e9; border-right: 2px solid #0ea5e9; pointer-events: none; left: 10%; width: 70%; z-index: 5;"></div>
       <div id="dirty-container" style="position: absolute; inset: 0; pointer-events: none;"></div>
       <div id="hour-markers" style="position: absolute; inset: 0; pointer-events: none; display: flex; justify-content: space-between;">
         <!-- Hour markers injected here -->
       </div>
    </div>
  </div>

  <div style="display: flex; gap: 10px; margin-bottom: 2rem; flex-wrap: wrap;">
    <button id="btn-realtime" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 5px 12px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; font-family: monospace;">+ INCOMING DATA</button>
    <button id="btn-backfill" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 5px 12px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; font-family: monospace;">⚡ RUN WORKER (BACKFILL)</button>
    <div id="sim-status" style="font-size: 0.6rem; color: #64748b; align-self: center; font-family: monospace;">STATUS: IDLE</div>
  </div>

  <div id="slice-report" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;"></div>

  <div style="margin-top: 2rem; padding: 1rem; background: #020617; border-radius: 6px; border: 1px solid #1e3a8a; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;">
    <div style="color: #64748b; border-bottom: 1px solid #1e3a8a; padding-bottom: 5px; margin-bottom: 10px; font-weight: bold;">PLANNER REWRITE: HIERARCHICAL UNION ALL</div>
    <div id="union-sql" style="color: #4ade80; line-height: 1.4;"></div>
  </div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const bg = document.getElementById('timeline-bg'); 
    const select = document.getElementById('timeline-select'); 
    const dirtyContainer = document.getElementById('dirty-container');
    const labelsRow = document.getElementById('timeline-labels');
    const hourMarkers = document.getElementById('hour-markers');
    const report = document.getElementById('slice-report'); 
    const sql = document.getElementById('union-sql');
    const btnRealtime = document.getElementById('btn-realtime');
    const btnBackfill = document.getElementById('btn-backfill');
    const simStatus = document.getElementById('sim-status');

    if (!bg) return;

    let isDragging = false; 
    let startX = 10; 
    let currentSelect = { left: 10, width: 70 };
    let dirtyRanges = [{s: 30, e: 32}, {s: 85, e: 93}]; 
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

    const formatDate = (d) => d.toISOString().split('T')[0];
    const formatFull = (d) => d.toISOString().replace('T', ' ').split('.')[0];

    // Initialize Labels — one per day for 7 days
    labelsRow.innerHTML = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      return `<span>${formatDate(d)}</span>`;
    }).join('');
    
    // Initialize Hour Markers & Rule — every 12h over 168h (7 days)
    for (let i = 0; i <= 168; i += 6) {
      const marker = document.createElement('div');
      marker.style.width = '1px';
      marker.style.height = i % 24 === 0 ? '100%' : '25%';
      marker.style.background = i % 24 === 0 ? '#334155' : '#1e293b';
      marker.style.position = 'relative';
      
      if (i % 24 === 0 && i < 168) {
        const hLabel = document.createElement('span');
        hLabel.textContent = (i / 24) + 'd';
        hLabel.style.position = 'absolute';
        hLabel.style.top = '100%';
        hLabel.style.left = '0';
        hLabel.style.fontSize = '0.5rem';
        hLabel.style.color = '#475569';
        hLabel.style.transform = 'translateX(-50%)';
        marker.appendChild(hLabel);
      }
      hourMarkers.appendChild(marker);
    }

    function renderDirty() {
      dirtyContainer.innerHTML = '';
      dirtyRanges.forEach(range => {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.height = '100%';
        div.style.left = range.s + '%';
        div.style.width = (range.e - range.s) + '%';
        div.style.background = 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(239, 68, 68, 0.3) 5px, rgba(239, 68, 68, 0.3) 10px)';
        div.style.borderLeft = '1px solid #ef4444';
        div.style.borderRight = '1px solid #ef4444';
        dirtyContainer.appendChild(div);
      });
    }

    function updateSlices() {
      const { left, width } = currentSelect;
      const startP = left; const endP = left + width; 
      report.innerHTML = '';
      let sqlParts = [];

      const totalMs = 7 * 24 * 60 * 60 * 1000;
      const globalStart = startDate.getTime();
      const queryStart = globalStart + (startP / 100) * totalMs;
      const queryEnd = globalStart + (endP / 100) * totalMs;

      if (width <= 0.01) {
        sql.innerHTML = '-- No range selected';
        return;
      }

      const TIERS = [
        { name: 'DAILY ROLLUP', table: 'ticks_1d', ms: 24 * 60 * 60 * 1000, color: '#10b981' },
        { name: 'HOURLY ROLLUP', table: 'ticks_1h', ms: 60 * 60 * 1000, color: '#0ea5e9' },
        { name: 'MINUTELY ROLLUP', table: 'ticks_1m', ms: 60 * 1000, color: '#818cf8' },
        { name: 'RAW DATA', table: 'raw_ticks', ms: 1000, color: '#ef4444' }
      ];

      let segments = [];
      let current = queryStart;

      while (current < queryEnd - 500) {
        let bestTier = TIERS[3]; // Default to Raw
        let sliceEnd = queryEnd;

        const currentP = ((current - globalStart) / totalMs) * 100;
        let dirtyIdx = dirtyRanges.findIndex(d => currentP < d.e && (currentP + 0.1) > d.s);
        
        if (dirtyIdx !== -1) {
          bestTier = TIERS[3];
          const dirtyEndMs = globalStart + (dirtyRanges[dirtyIdx].e / 100) * totalMs;
          sliceEnd = Math.min(queryEnd, dirtyEndMs);
        } else {
          for (let tier of TIERS) {
            const isAligned = Math.floor(current / tier.ms) * tier.ms === current;
            const nextAlignment = (Math.floor(current / tier.ms) + 1) * tier.ms;
            
            if (isAligned && nextAlignment <= queryEnd) {
              const nextP = ((nextAlignment - globalStart) / totalMs) * 100;
              const hasDirty = dirtyRanges.some(d => d.s < nextP && d.e > currentP);
              if (!hasDirty) {
                bestTier = tier;
                sliceEnd = nextAlignment;
                break;
              }
            }
          }
          if (bestTier.table === 'raw_ticks') {
            const nextMin = (Math.floor(current / 60000) + 1) * 60000;
            const nextDirty = dirtyRanges.find(d => d.s > currentP);
            const nextDirtyMs = nextDirty ? globalStart + (nextDirty.s / 100) * totalMs : queryEnd;
            sliceEnd = Math.min(queryEnd, nextMin, nextDirtyMs);
          }
        }
        segments.push({ tier: bestTier, start: current, end: sliceEnd });
        current = sliceEnd;
      }

      // Normalize: Merge contiguous segments of the same tier
      let normalized = [];
      if (segments.length > 0) {
        let last = segments[0];
        for (let i = 1; i < segments.length; i++) {
          if (segments[i].tier.table === last.tier.table) {
            last.end = segments[i].end;
          } else {
            normalized.push(last);
            last = segments[i];
          }
        }
        normalized.push(last);
      }

      // Group normalized ranges by tier and sort Daily -> Raw (climb and descend)
      const groups = TIERS.map(t => ({
        tier: t,
        ranges: normalized.filter(s => s.tier.table === t.table)
      }))
      .filter(g => g.ranges.length > 0)
      .sort((a, b) => b.tier.ms - a.tier.ms);

      let cteParts = [];
      groups.forEach((group, idx) => {
        const div = document.createElement('div'); 
        div.style.borderLeft = `4px solid ${group.tier.color}`; 
        div.style.background = 'rgba(255,255,255,0.03)'; 
        div.style.padding = '8px';
        div.innerHTML = `<div style="font-family: monospace; font-size: 0.6rem; color: #94a3b8;">LEVEL: ${group.tier.name}</div>
                         <div style="font-family: monospace; font-size: 0.7rem; color: #fff;">MULTIRANGE ACCELERATION: ${group.ranges.length} BIN(S)</div>`;
        report.appendChild(div);

        const scanName = group.tier.table + '_scan';
        const sortedRanges = group.ranges.slice().sort((a, b) => a.start - b.start);
        const multirange = '{' + sortedRanges.map(r => 
          `[${formatFull(new Date(r.start))}, ${formatFull(new Date(r.end))})`
        ).join(',\n     ') + '}';

        cteParts.push(`<span style="color: #64748b;">  ${scanName} AS (</span><br>    SELECT * FROM ${group.tier.table} <br>    WHERE t <span style="color: #818cf8;"><@</span> <span style="color: #fbbf24;">'${multirange}'</span>::tstzmultirange<br><span style="color: #64748b;">  )</span>`);
      });

      if (cteParts.length > 0) {
        let finalSql = `<span style="color: #64748b;">-- Optimized Hierarchical Query Plan</span><br><span style="color: #818cf8;">WITH</span><br>${cteParts.join(',<br>')}<br>`;
        finalSql += groups.map(g => `<span style="color: #818cf8;">SELECT</span> * <span style="color: #818cf8;">FROM</span> ${g.tier.table}_scan`).join('<br><span style="color: #334155; font-weight: bold;">UNION ALL</span><br>');
        finalSql += `<br><span style="color: #818cf8;">ORDER BY</span> t; <span style="color: #64748b;">-- Ensure chronological consistency</span>`;
        sql.innerHTML = finalSql;
      }
    }

    bg.addEventListener('mousedown', (e) => { 
      isDragging = true; 
      const rect = bg.getBoundingClientRect();
      startX = ((e.clientX - rect.left) / rect.width) * 100; 
      currentSelect = { left: startX, width: 0 };
      select.style.left = startX + '%';
      select.style.width = '0%'; 
    });

    window.addEventListener('mousemove', (e) => { 
      if (!isDragging) return; 
      const rect = bg.getBoundingClientRect();
      let cur = ((e.clientX - rect.left) / rect.width) * 100; 
      cur = Math.max(0, Math.min(100, cur)); 
      const left = Math.min(startX, cur); 
      const width = Math.abs(cur - startX); 
      currentSelect = { left, width };
      select.style.left = left + '%'; 
      select.style.width = width + '%'; 
      updateSlices(); 
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    btnRealtime.addEventListener('click', () => {
      simStatus.textContent = 'STATUS: RECEIVING TRAFFIC...';
      const last = dirtyRanges[dirtyRanges.length-1];
      if (last && last.e > 95) {
        last.e = 100;
      } else {
        dirtyRanges.push({s: 98, e: 100});
      }
      renderDirty();
      updateSlices();
      setTimeout(() => simStatus.textContent = 'STATUS: IDLE', 1000);
    });

    btnBackfill.addEventListener('click', () => {
      if (dirtyRanges.length === 0) return;
      simStatus.textContent = 'STATUS: WORKER PROCESSING...';
      
      const interval = setInterval(() => {
        let changed = false;
        dirtyRanges = dirtyRanges.map(r => {
          if (r.e - r.s > 1) {
            changed = true;
            return { s: r.s + 1, e: r.e };
          }
          return null;
        }).filter(Boolean);

        renderDirty();
        updateSlices();

        if (!changed || dirtyRanges.length === 0) {
          clearInterval(interval);
          simStatus.textContent = 'STATUS: ALL ORBITS HEALED';
          setTimeout(() => simStatus.textContent = 'STATUS: IDLE', 2000);
        }
      }, 100);
    });

    renderDirty();
    updateSlices();
  });
})();
</script>

# Live Demo: The Modern Spiral Setup

Let's see this in action using PostgreSQL's native `WITH` syntax.

```sql
DROP EXTENSION IF EXISTS spiral CASCADE;
CREATE EXTENSION spiral;

-- The WITH clause tells Spiral to track this table,
-- set up specific rollups, and isolate data by 'sensor_id'.
CREATE TABLE sensor_data (
    t timestamptz NOT NULL,
    sensor_id int NOT NULL,
    temperature double precision, -- Spiral: ohlcv
    humidity double precision,    -- Spiral: sum
    power_usage double precision  -- Spiral: stats
) WITH (
    spiral.frames = '1m,1h',
    spiral.tenant = 'sensor_id'
);
```

# Behind the Scenes: Auto-created Views

Spiral immediately registers the table and creates the hierarchical views.

```sql
SELECT view_name, parent_view, frame_seconds, scope_columns 
FROM spiral.metadata ORDER BY frame_seconds;
```

```text
   view_name    |  parent_view   | frame_seconds | scope_columns 
----------------+----------------+---------------+---------------
 sensor_data    | BASE           |             0 | {sensor_id}
 sensor_data_1m | sensor_data    |            60 | {sensor_id}
 sensor_data_1h | sensor_data_1m |          3600 | {sensor_id}
(3 rows)
```

Notice it registered the base table and used the magic comments to build the 1m and 1h schema dynamically!

# What You Get: SQL From Day One

Once the table is created and the first `spiral_refresh` runs, you get three things without writing any extra code:

**1. Pre-aggregated views at every declared tier:**
```sql
-- Raw sub-minute ticks
SELECT * FROM sensor_data WHERE sensor_id = 1 AND t >= now() - interval '5m';

-- 1-minute rollup — columns auto-derived from magic comments
SELECT t, sensor_id, temperature_ohlcv_o, temperature_ohlcv_h,
       temperature_ohlcv_l, temperature_ohlcv_c, humidity, power_usage_stats
FROM sensor_data_1m
WHERE sensor_id = 1 AND t >= now() - interval '1h';

-- 1-hour rollup for dashboards
SELECT t, sensor_id, temperature_ohlcv_h AS max_temp, humidity
FROM sensor_data_1h
WHERE t >= now() - interval '7d';
```

**2. Transparent query routing** — queries against `sensor_data` automatically rewrite to the right rollup tier.

**3. Dirty-aware fallback** — during a backfill or late-arriving data window, Spiral serves rollup for clean buckets and raw data for dirty buckets. Zero stale reads, zero full-table scans.

```sql
-- This is all you need to keep rollups fresh:
SELECT spiral_refresh('sensor_data');

-- Or scope to one tenant after a targeted backfill:
SELECT spiral_refresh('sensor_data', 'sensor_id = 3');
```

# Data Ingestion spanning Timeframes

Let's insert some raw data.

```sql
INSERT INTO sensor_data (t, sensor_id, temperature, humidity, power_usage) VALUES
('2026-05-03 20:15:00'::timestamptz, 1, 22.5, 45.0, 100.5),
('2026-05-03 20:15:00'::timestamptz, 1, 22.7, 45.2, 101.0),
('2026-05-03 20:15:00'::timestamptz, 2, 19.5, 50.0, 80.0),
('2026-05-03 20:16:00'::timestamptz, 1, 23.0, 44.0, 105.0),
('2026-05-03 20:16:00'::timestamptz, 2, 19.8, 51.0, 82.0),
('2026-05-03 21:15:00'::timestamptz, 1, 25.0, 40.0, 110.0);
```

# Incremental Cascading Refresh

Refreshing the 1-minute rollup incrementally processes the new raw data.

```sql
SELECT spiral_refresh('sensor_data');
```

The column names are dynamically derived from the magic comments:

```sql
SELECT t, sensor_id, 
       temperature_ohlcv_o, temperature_ohlcv_h, 
       temperature_ohlcv_l, temperature_ohlcv_c,
       humidity, power_usage_stats
FROM sensor_data_1m ORDER BY t, sensor_id;
```

```text
           t            | sensor_id | temperature_ohlcv_o | temperature_ohlcv_h | temperature_ohlcv_l | temperature_ohlcv_c | humidity |                              power_usage_stats
------------------------+-----------+---------------------+---------------------+---------------------+---------------------+----------+--------------------------------------------------------------
 2026-05-03 20:15:00+00 |         1 |                22.5 |                22.7 |                22.5 |                22.7 |     90.2 | {"n": 2.0, "m1": 100.75, "m2": 0.125, "m3": 0.0, ...}
 2026-05-03 20:15:00+00 |         2 |                19.5 |                19.5 |                19.5 |                19.5 |       50 | {"n": 1.0, "m1": 80.0, "m2": 0.0, ...}
 2026-05-03 20:16:00+00 |         1 |                  23 |                  23 |                  23 |                  23 |       44 | {"n": 1.0, "m1": 105.0, "m2": 0.0, ...}
 2026-05-03 20:16:00+00 |         2 |                19.8 |                19.8 |                19.8 |                19.8 |       51 | {"n": 1.0, "m1": 82.0, "m2": 0.0, ...}
 2026-05-03 21:15:00+00 |         1 |                  25 |                  25 |                  25 |                  25 |       40 | {"n": 1.0, "m1": 110.0, "m2": 0.0, ...}
(5 rows)
```

`humidity` is summed per minute bucket. `power_usage_stats` stores the Welford moments as JSONB — mean (`m1`), variance accumulator (`m2`), etc. — ready to merge up to the hourly tier without raw data.

Refresh cascades to the 1-hour rollup automatically because Spiral knows the hierarchy!

# Partial Refresh by Tenant Scope

In high-cardinality deployments you often need to refresh only one tenant's data — e.g., after a backfill for `sensor_id = 3` without disturbing others. `spiral_refresh` accepts an optional `WHERE`-style scope predicate:

```sql
-- Refresh only sensor 3's dirty buckets
SELECT spiral_refresh('sensor_data', 'sensor_id = 3');
```

Spiral intersects that predicate with the changelog, processes only the matching dirty buckets, and leaves every other tenant's rollup untouched. The changelog entries for other tenants survive the partial refresh and are picked up on their own schedule.

# Transparent Query Acceleration

Spiral intercepts queries to the base table and rewrites them to use the pre-aggregated rollups seamlessly — no query changes needed.

```sql
-- You write this:
SELECT date_trunc('hour', t) AS hour, sensor_id, max(temperature)
FROM sensor_data
WHERE t >= '2026-05-03 19:00:00'::timestamptz 
  AND t < '2026-05-03 23:00:00'::timestamptz
GROUP BY 1, 2;

-- Spiral rewrites it to something like:
SELECT date_trunc('hour', t) AS hour, sensor_id, max(temperature_ohlcv_h)
FROM sensor_data_1h
WHERE t >= '2026-05-03 19:00:00'::timestamptz
  AND t < '2026-05-03 23:00:00'::timestamptz
GROUP BY 1, 2;
```

The rewrite selects the coarsest rollup tier whose granularity fits the query's `date_trunc(...)`. A 4-hour window that matches the 1h tier reads ~4 rows instead of potentially thousands of raw ticks — without any application-level change.

**Multi-dimension GROUP BY acceleration.** When the query groups by both a tenant column and `date_trunc(...)`, the planner handles both dimensions together — matching the best rollup tier for the granularity, scoped to that tenant.

**Z-order index push-down.** For tenant-scoped rollup sub-queries, Spiral auto-injects a `BETWEEN` predicate on the z-order index:

```sql
-- Spiral rewrites this internally:
WHERE spiral_zorder(spiral(t), ARRAY['sensor_id'])
      BETWEEN <lo> AND <hi>
```

Z-order is monotone in `t` for a fixed tenant hash, so the BETWEEN exactly covers that tenant's time range without scanning other tenants' rows. This turns full-rollup scans into tight index range scans.

# Multi-Table Acceleration: Join Constraint Propagation

The planner hook doesn't stop at single-table rewrites. When Spiral detects an equijoin on `t` between two tracked tables, it **propagates the time constraint** from the constrained side to the unconstrained side, accelerating both simultaneously.

```sql
-- Two independent time-series, joined by time
SELECT s.t, s.sensor_id, s.temperature_ohlcv_h,
       a.asset_id,       a.price_ohlcv_h
FROM sensor_data s
JOIN asset_ticks  a ON s.t = a.t
WHERE s.t >= '2026-05-03 19:00:00'::timestamptz
  AND s.t <  '2026-05-03 23:00:00'::timestamptz;
```

Without Spiral: `asset_ticks` has no time predicate — full scan.

With Spiral: the planner walks the JoinTree, detects `s.t = a.t`, propagates `WHERE t >= ... AND t < ...` to `asset_ticks`, then rewrites **both** sides to their respective rollup tiers:

```sql
-- Effective plan:
SELECT s.t, s.sensor_id, s.temperature_ohlcv_h,
       a.asset_id,       a.price_ohlcv_h
FROM   sensor_data_1h s          -- ← accelerated
JOIN   asset_ticks_1h  a ON s.t = a.t   -- ← also accelerated via propagation
WHERE  s.t >= '2026-05-03 19:00:00'::timestamptz
  AND  s.t <  '2026-05-03 23:00:00'::timestamptz;
```

Both tables independently benefit from dirty-aware slicing. A dirty bucket in `sensor_data` does not force a raw scan of `asset_ticks` — each side is sliced independently against its own changelog.

# Handling Late-Arriving Data

Let's insert an hour of randomized, late data for all tenants.

```sql
INSERT INTO sensor_data (t, sensor_id, temperature, humidity, power_usage)
SELECT 
    '2026-05-03 22:00:00'::timestamptz + (random() * 60 || ' minutes')::interval,
    id,
    20 + random() * 10,
    40 + random() * 20,
    90 + random() * 30
FROM generate_series(1, 2) AS id, generate_series(1, 60);
```

Spiral tracks exactly which time buckets and tenants are "dirty".

```sql
SELECT base_view, t_start, t_end, scope_values 
FROM spiral.changelog ORDER BY t_start;
```

```text
  base_view  |  t_start   |   t_end    |   scope_values
-------------+------------+------------+------------------
 sensor_data | 1777856400 | 1777856460 | {"sensor_id": 1}
 sensor_data | 1777856520 | 1777856580 | {"sensor_id": 2}
 sensor_data | 1777856760 | 1777856820 | {"sensor_id": 1}
 ...
(76 rows)
```

Each row is one 60-second bucket per tenant. Only the buckets that actually received new data are marked dirty — the rest stay clean and will continue serving from the rollup.

# Smart Query Slicing in Action

Spiral's planner intercepts the query, consults the changelog, and rewrites to a `UNION ALL` that:
- routes **clean** hour-aligned buckets to `sensor_data_1h` (pre-aggregated, fast)
- routes **dirty** sub-minute windows back to `sensor_data` (raw, accurate)

```sql
-- You write:
SELECT date_trunc('hour', t) AS hour, sensor_id, max(temperature)
FROM sensor_data
WHERE t >= '2026-05-03 19:00:00'::timestamptz 
  AND t < '2026-05-03 23:00:00'::timestamptz
GROUP BY 1, 2;
```

```sql
-- Spiral actually runs (conceptual rewrite):
SELECT date_trunc('hour', t) AS hour, sensor_id,
       max(temperature_ohlcv_h) AS max_temperature
FROM sensor_data_1h                       -- ← pre-aggregated tier
WHERE t >= '2026-05-03 19:00:00'::timestamptz
  AND t < '2026-05-03 22:00:00'::timestamptz  -- 3 clean hours
  AND spiral_zorder(spiral(t), ARRAY['sensor_id'])
      BETWEEN 1777843200000000 AND 1777857600999999
GROUP BY 1, 2

UNION ALL

SELECT date_trunc('hour', t) AS hour, sensor_id,
       max(temperature) AS max_temperature
FROM sensor_data                          -- ← raw tier (dirty window)
WHERE t >= '2026-05-03 22:00:00'::timestamptz
  AND t < '2026-05-03 23:00:00'::timestamptz  -- 1 dirty hour
GROUP BY 1, 2;
```

The key insight: **Spiral never re-aggregates clean data.** The 3 clean hours each contribute exactly 1 row from `sensor_data_1h`. Only the dirty hour scans raw rows. As dirty buckets are healed, they graduate back to the rollup tier automatically.

**Tier selection rules:**
- A bucket is eligible for a rollup tier if it is **aligned** to that tier's frame and **clean** in the changelog.
- The coarsest aligned tier wins (1h beats 1m, 1m beats raw).
- Adjacent segments from the same source are merged into one range scan to minimize plan nodes.

You can force `EXPLAIN` to show the rewrite:

```sql
EXPLAIN (VERBOSE)
SELECT date_trunc('hour', t) AS hour, sensor_id, max(temperature)
FROM sensor_data
WHERE t >= '2026-05-03 19:00:00'::timestamptz 
  AND t < '2026-05-03 23:00:00'::timestamptz
GROUP BY 1, 2;
```

The plan will show a `HashAggregate` over an `Append` (the UNION ALL) with separate `SeqScan` or `IndexScan` nodes — one per segment. After `spiral_refresh`, all four hours are clean and the plan collapses to a single scan of `sensor_data_1h`.

# Healing the Orbits & Handling Deletions

We heal the dirty buckets. It only processes the changes!

```sql
SELECT spiral_refresh('sensor_data');
```

The entire time range is now clean. The same query now generates a single-tier plan:

```sql
-- After refresh, Spiral rewrites to a single rollup scan:
SELECT date_trunc('hour', t) AS hour, sensor_id,
       max(temperature_ohlcv_h) AS max_temperature
FROM sensor_data_1h
WHERE t >= '2026-05-03 19:00:00'::timestamptz
  AND t < '2026-05-03 23:00:00'::timestamptz
  AND spiral_zorder(spiral(t), ARRAY['sensor_id'])
      BETWEEN 1777843200000000 AND 1777857600999999
GROUP BY 1, 2;
-- 4 rows read instead of thousands of raw ticks.
```

If we delete data, it isolates the dirty fallback to ONLY the affected tenant (`sensor_id = 1`) for that specific time bucket — other tenants' rollups stay pristine.

```sql
DELETE FROM sensor_data 
WHERE sensor_id = 1 
  AND t >= '2026-05-03 20:15:00'::timestamptz 
  AND t < '2026-05-03 20:25:00'::timestamptz;
```

```sql
SELECT base_view, t_start, t_end, scope_values 
FROM spiral.changelog ORDER BY t_start;
```

```text
  base_view  |  t_start   |   t_end    |   scope_values
-------------+------------+------------+------------------
 sensor_data | 1777850100 | 1777850160 | {"sensor_id": 1}
 sensor_data | 1777850160 | 1777850220 | {"sensor_id": 1}
(2 rows)
```

Only `sensor_id = 1` is dirty. `sensor_id = 2`’s rollups are completely untouched — a targeted dirty mark, not a full-table invalidation.

You can inspect the lag at any time:

```sql
SELECT * FROM spiral.status;
```

```text
  base_view  | tier_count | dirty_entries | dirty_scopes | dirty_seconds | oldest_dirty_ts        | newest_dirty_ts        | lag
-------------+------------+---------------+--------------+---------------+------------------------+------------------------+-------------------------
 sensor_data |          2 |             2 |            1 |           120 | 2026-05-03 20:15:00+00 | 2026-05-03 20:17:00+00 | 21 days 01:23:37
(1 row)
```

`lag` tells you how stale your oldest dirty bucket is.

In a multi-tenant deployment, `spiral.status` aggregates across all tenants. For per-tenant visibility, `spiral.scope_status` breaks it down:

```sql
SELECT * FROM spiral.scope_status ORDER BY lag DESC;
```

```text
  base_view  |    scope_values    | dirty_entries | dirty_seconds | oldest_dirty_ts        | lag
-------------+--------------------+---------------+---------------+------------------------+--------------------
 sensor_data | {"sensor_id": "1"} |            12 |           720 | 2026-05-03 20:15:00+00 | 21 days 01:23:37
 sensor_data | {"sensor_id": "2"} |             3 |           180 | 2026-05-03 22:10:00+00 | 20 days 23:05:12
(2 rows)
```

Sensor 1 has more dirty buckets than sensor 2 — a targeted `spiral_refresh(‘sensor_data’, ‘sensor_id = 1’)` heals only that tenant’s backlog without touching sensor 2.

For a single-number health check, `spiral_lag()` returns the lag as an `interval`:

```sql
SELECT spiral_lag(‘sensor_data’);
-- → 21 days 01:23:37   (NULL when fully current)
```

Pipe this into any monitoring system. `NULL` means clean; a growing interval means the worker is falling behind.

# Autonomous Background Worker

You don’t need to call `spiral_refresh` manually. When `spiral.frames` is set, Spiral registers a **background worker** that wakes every second, claims dirty `(base_view, scope)` pairs from the changelog, and heals them — automatically.

```sql
-- postgresql.conf (or SET for session)
spiral.worker_enabled   = on    -- default: on
spiral.max_workers      = 2     -- parallel workers per DB
spiral.worker_batch_size = 10   -- scopes refreshed per 1s tick
```

Workers use advisory locks to divide scopes without conflicts: worker A refreshes `sensor_id = 1`, worker B refreshes `sensor_id = 2` — no coordination overhead, no duplicate work.

The planner hook is similarly tunable:

```sql
spiral.enable_planner_hook   = on    -- disable to compare plans
spiral.planner_max_segments  = 50    -- fall back to RAW if UNION ALL would exceed N parts
```

When `planner_max_segments` is exceeded (highly fragmented dirty ranges), Spiral falls back to a full raw scan and logs a notice — trading query rewrite overhead for a simpler plan.

# Mathematical Engine: Welford’s Algorithm

## The Problem with Standard `stddev()`

PostgreSQL’s built-in `stddev()` cannot be rolled up. Given two pre-aggregated hourly stddev values you cannot compute the combined stddev without the original rows. This breaks the rollup chain.

Spiral needs a **mergeable** statistical state — one where `rollup(rollup(raw → 1m) → 1h)` gives the same answer as `rollup(raw → 1h)`.

## The Solution: Store Moments, Not Final Values

Welford’s online algorithm accumulates four **central moments** `(n, m1, m2, m3, m4)` rather than a computed stddev. From those moments you can derive mean, variance, stddev, skewness, and kurtosis at any time. Crucially, two `StatsState` structs can be **merged exactly** using Chan et al.’s parallel algorithm — no raw data needed.

$$ \bar{x}_n = \bar{x}_{n-1} + \frac{x_n - \bar{x}_{n-1}}{n} $$
{: .math-formula}

$$ M_{2,n} = M_{2,n-1} + (x_n - \bar{x}_{n-1})(x_n - \bar{x}_n) $$
{: .math-formula}

## The Rust Implementation (`src/stats.rs`)

```rust
// src/stats.rs
#[derive(Serialize, Deserialize, Default, Clone, Copy)]
pub struct StatsState {
    pub n:  f64,   // count
    pub m1: f64,   // mean
    pub m2: f64,   // sum of squared deviations  (→ variance)
    pub m3: f64,   // sum of cubed deviations    (→ skewness)
    pub m4: f64,   // sum of quartic deviations  (→ kurtosis)
}

impl StatsState {
    pub fn add(&mut self, x: f64) {
        let n1 = self.n;
        self.n += 1.0;
        let delta   = x - self.m1;
        let delta_n = delta / self.n;
        let term1   = delta * delta_n * n1;
        self.m1 += delta_n;
        self.m2 += term1;
        // m3 and m4 updated similarly — O(1) per value, numerically stable
    }

    // Chan’s parallel algorithm: merge two independent StatsState structs
    // Used when rolling up 1m → 1h → 1d without re-scanning raw rows.
    pub fn merge(&mut self, other: &Self) {
        let combined_n = self.n + other.n;
        let delta  = other.m1 - self.m1;
        let delta2 = delta * delta;
        let m1 = (self.n * self.m1 + other.n * other.m1) / combined_n;
        let m2 = self.m2 + other.m2 + delta2 * self.n * other.n / combined_n;
        // m3, m4 follow the same pattern with higher-order delta terms
        self.n = combined_n; self.m1 = m1; self.m2 = m2; /* ... */
    }

    pub fn mean(&self)     -> f64 { self.m1 }
    pub fn variance(&self) -> f64 { self.m2 / (self.n - 1.0) }
    pub fn stddev(&self)   -> f64 { self.variance().sqrt() }
    pub fn skewness(&self) -> f64 { self.n.sqrt() * self.m3 / self.m2.powf(1.5) }
    pub fn kurtosis(&self) -> f64 { self.n * self.m4 / (self.m2 * self.m2) - 3.0 }
}
```

## How `pgrx` Hooks Connect Rust to PostgreSQL Aggregates

`pgrx` lets Rust functions register directly as PostgreSQL functions via the `#[pg_extern]` attribute. Spiral uses two functions to form a full PostgreSQL aggregate:

```rust
// Accumulation step — called once per raw row during spiral_refresh
#[pg_extern(immutable, parallel_safe)]
pub fn spiral_stats_accum(state: Option<pgrx::JsonB>, val: f64) -> pgrx::JsonB {
    let mut s = state
        .map(|j| serde_json::from_value::<StatsState>(j.0).unwrap())
        .unwrap_or_default();
    s.add(val);
    pgrx::JsonB(serde_json::to_value(s).unwrap())
}

// Combine step — called when merging two rollup tiers (1m → 1h)
// `parallel_safe` tells PostgreSQL this can run across parallel workers
#[pg_extern(immutable, parallel_safe)]
pub fn spiral_stats_combine(
    state1: Option<pgrx::JsonB>,
    state2: Option<pgrx::JsonB>,
) -> pgrx::JsonB {
    let mut s1 = state1.map(|j| serde_json::from_value::<StatsState>(j.0).unwrap())
        .unwrap_or_default();
    let s2     = state2.map(|j| serde_json::from_value::<StatsState>(j.0).unwrap())
        .unwrap_or_default();
    s1.merge(&s2);
    pgrx::JsonB(serde_json::to_value(s1).unwrap())
}
```

Why this fits the rollup architecture perfectly:

| Property | Why it matters |
| :--- | :--- |
| **Online** — processes one value at a time | Matches IVM: only new changelog rows need processing, not full re-scan |
| **Mergeable** — two states combine exactly | Enables `1m → 1h → 1d` rollup chains without raw data |
| **Numerically stable** — Welford avoids catastrophic cancellation | Large sensor datasets with tight value ranges stay accurate |
| **`parallel_safe`** — PostgreSQL can split across workers | Rollup refreshes parallelise automatically at no cost |
| **JSONB state** — opaque to PostgreSQL | Schema-free; adding m5 or percentiles needs no DDL change |

The `-- Spiral: stats` magic comment wires this up: when building a rollup view Spiral emits `spiral_stats_accum(col)` for the 1m layer and `spiral_stats_combine(col_stats)` for every higher tier.

# Approximate Quantiles: Sketch and T-Digest

Welford gives exact moments (mean, stddev, skewness). But `percentile_cont(0.95)` cannot be rolled up — there is no exact mergeable form. Spiral provides two mergeable approximate quantile sketches instead.

| Magic comment | Aggregate | Merge fn | Accuracy |
| :--- | :--- | :--- | :--- |
| `-- Spiral: sketch` | `spiral_sketch(col)` | `spiral_sketch_merge(col_sketch)` | DDSketch, relative error ≤ 1% |
| `-- Spiral: tdigest` | `spiral_tdigest(col)` | `spiral_tdigest_merge(col_tdigest)` | t-digest, better tail accuracy |

Like `stats`, both store a JSONB blob at the 1m tier and merge it exactly as it rolls up to 1h, 1d — no raw data needed.

```sql
CREATE TABLE api_requests (
    t          timestamptz NOT NULL,
    service_id int         NOT NULL,
    latency_ms double precision -- Spiral: tdigest
) WITH (
    spiral.frames = '1m,1h,1d',
    spiral.tenant = 'service_id'
);
```

After refresh, the rollup stores `latency_ms_tdigest` at every tier. Query approximate percentiles at any granularity:

```sql
-- p50, p95, p99 from the hourly rollup — no raw rows needed
SELECT t, service_id,
       spiral_tdigest_quantile(latency_ms_tdigest, 0.50) AS p50,
       spiral_tdigest_quantile(latency_ms_tdigest, 0.95) AS p95,
       spiral_tdigest_quantile(latency_ms_tdigest, 0.99) AS p99
FROM api_requests_1h
WHERE t >= now() - interval '24h'
ORDER BY t, service_id;
```

This is the key advantage over standard PostgreSQL: a 1h bucket carries a compact sketch (~1 KB) that can answer any quantile query, and two hourly sketches merge into a daily sketch in microseconds. No raw rows ever need to be re-read.

# Z-Order Indexing for Existing Tables

Spiral's `WITH (spiral.frames=...)` wires everything automatically for new tables. For an **existing** table without Spiral TAM, `cluster_table()` creates the z-order index in one call:

```sql
-- Add z-order index to any table:
SELECT cluster_table('sensor_data', 't', ARRAY['sensor_id']);
-- Creates: idx_z_sensor_data ON sensor_data
--   USING btree (spiral_zorder(spiral(t), ARRAY['sensor_id']))
```

The planner hook then uses this index for `BETWEEN` pushdown on any query that filters by both `t` and `sensor_id`. No data migration, no DDL changes to existing schemas.

The `spiral(t)` function used inside the index is an identity for `bigint` and extracts the microsecond epoch for `timestamptz`. It exists so the index expression is stable regardless of which type `t` carries:

```sql
SELECT spiral('2026-05-03 20:15:00'::timestamptz);
-- → 1746303300000000  (microseconds since Unix epoch)

SELECT to_timestamptz(1746303300000000);
-- → 2026-05-03 20:15:00+00
```

Round-tripping through `spiral()` / `to_timestamptz()` lets you embed raw epoch arithmetic in SQL when needed — for example, to manually verify a z-order range or debug a planner rewrite.

# Experimental Results: Prototype Benchmarks

In my local environment, with a **10 million row dataset**, I saw results that justified continuing this research.

| Phase | Ingest Rate | Duration |
| :--- | :--- | :--- |
| **Bulk Load** | 1,940,482 rows/s | 0.51s (1M sample) |
| **Backfill** | 302,413 rows/s | 3.30s (1M sample) |

# Building PostgreSQL Extensions in Rust: What I Learned

Spiral is built with [`pgrx`](https://github.com/pgcentralfoundation/pgrx) — a framework that lets you write PostgreSQL extensions entirely in Rust. If you have ever wanted to extend PostgreSQL but found C intimidating, pgrx is worth serious attention.

## The API Surface Spiral Uses

Every major PostgreSQL extension mechanism is available through pgrx:

| Mechanism | What it does | How Spiral uses it |
| :--- | :--- | :--- |
| `#[pg_extern]` | Export a Rust fn as a SQL function | `spiral_refresh`, `spiral_zorder`, `spiral_lag` |
| `extension_sql!` | Embed raw SQL in the extension | `spiral.changelog`, `spiral.status`, operators |
| `#[pg_aggregate]` / `CREATE AGGREGATE` | Custom aggregates | `spiral_stats_accum/combine`, sketch/tdigest |
| `TableAmRoutine` (TAM) | Custom storage engine | Binary-packed page layout, O(1) seeks |
| `planner_hook` | Intercept & rewrite query plans | UNION ALL rewrites, join propagation, z-order pushdown |
| `BackgroundWorker` | Autonomous server processes | 1-second changelog poller + scope-affinity refresh |
| `GucRegistry` | Custom `postgresql.conf` settings | `spiral.worker_enabled`, `spiral.max_workers`, etc. |
| `Spi` | Execute SQL from Rust | Changelog queries, metadata lookups, rollup SQL emission |

## What pgrx Makes Easy

**Zero-cost type mapping.** Rust `f64` maps to PostgreSQL `float8`, `i64` to `bigint`, `Vec<Option<String>>` to `text[]`. No manual `Datum` casting needed.

**Memory safety in unsafe territory.** PostgreSQL's C API is deeply unsafe — raw pointers to `pg_sys::Query`, `pg_sys::PlannedStmt`, page buffers. pgrx wraps enough to make the common paths safe, while letting you drop to `unsafe` where needed (TAM scan callbacks, page manipulation).

**Aggregate functions with combine support.** The `parallel_safe` attribute on `#[pg_extern]` tells PostgreSQL the function can run across parallel workers — enabling automatic parallelism for rollup refreshes at no extra code cost.

## What is Still Hard

**The planner hook is raw C.** `planner_hook_type` takes an `unsafe extern "C-unwind" fn`. Traversing `pg_sys::Query`, `pg_sys::RangeTblEntry`, and the JoinTree requires pointer arithmetic and intimate knowledge of PostgreSQL internals. pgrx does not abstract this — you read the PostgreSQL source to understand the node shapes.

**TAM callbacks must not panic.** Any Rust panic inside a TAM callback (`scan_getnextslot`, `tuple_insert`) crashes the backend. You must catch all errors before they unwind past the C ABI boundary.

**Testing requires a running PostgreSQL.** `#[pg_test]` spins up a real Postgres instance per test run. The setup is automatic with pgrx but CI times are longer than unit tests — integration is the only meaningful test boundary.

## Starting Point for Your Own Extension

If you want to build a PostgreSQL extension in Rust:

```bash
cargo install cargo-pgrx
cargo pgrx new my_extension
cargo pgrx run pg17   # drops into psql with your extension loaded
```

The [pgrx examples](https://github.com/pgcentralfoundation/pgrx/tree/develop/pgrx-examples) cover custom types, aggregates, operators, and background workers. Spiral's source is also heavily commented — the TAM implementation in `src/tam.rs` and the planner hook in `src/hooks.rs` are good starting points for those two harder topics.

The PostgreSQL extension ecosystem needs more Rust. The barrier is lower than it looks.

# Open for Collaboration

Building Spiral has been a rewarding learning experience. This is a **work in progress**. If you are a PostgreSQL internals expert, a Rustacean, or someone who loves high-performance storage, I invite you to contribute.

---
*Spiral is open source. [Check it out on GitHub](https://github.com/jonatas/spiral) and let's explore the future of storage together.*
