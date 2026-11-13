---
layout: post
title: "The Woven Language of the Waimiri Atroari (Kinja): Ethnomathematics, Radical Lucidity, and Resistance Against the Flood"
date: 2026-11-11 16:00:00 -0300
categories: [ethnomathematics, indigenous-knowledge, amazonia, generative-art, algorithms, interactive]
tags: [waimiri-atroari, kinja, benry, aruma, basketry, balbina-dam, weaving-patterns, ethnomathematics, indigenous-resistance]
image: images/patterns/waraki-banner-3x1.png
description: "How the Waimiri Atroari (Kinja) encode their unwritten language, ecological memory, and ethic of total lucidity into binary arumã basketry matrices—and an interactive playground to weave and unroll all 12 Benry patterns."
mermaid: true
math: true
---

The **Waimiri Atroari**—who call themselves **Kinja** (*"The True People"*)—did not record their history in ink or stone. Speaking an oral Cariban language (*Kinja Iara*), they encoded their cosmology, their riverine taxonomy, and their clan memory into the binary geometry of split **arumã** cane (*Ischnosiphon arouma*). Every sieve (*urupema*), burden basket (*jamaxi*), and lidded *balainho* is a primary text: dark vertical warp splints dyed black with **jenipapo** (*Genipa americana*) and carbon soot intersecting light horizontal weft splints of natural cream *arumã* or terracotta **urucum** (*Bixa orellana*).

As you scroll through this essay, look closely at the background behind these words: **the page itself is a living Kinja loom**. As each chapter enters view, the background tapestry dynamically interpolates cell-by-cell through the traditional **Benry** (*design/writing*) matrices—morphing from **Tebaka Benry** (*The Jaguar's Eye*) to **Xirminja Benry** (*The Flooded River Currents*), **Weri Nahpy Benry** (*The Ancestral Anaconda's Ribs*), and **Dja Benry** (*The Saved Seed*).

Today we are launching the [**Waimiri Atroari Weaving Patterns Playground (`/waimiri-atroari-patterns/`)**](/waimiri-atroari-patterns/)—an offline-first, interactive ethnomathematical loom where you can learn how to weave all **12 traditional Benry patterns** step-by-step from their simplest primitives, inspect their run-length row equations, and **unroll** single motifs into giant repeating tapestries and 3D cylindrical baskets. And right inside this post, you can weave and unroll those patterns live while exploring the history of a people whose survival is one of the fiercest stories of resistance in the Amazon.

<!--more-->

<style>
  /* Woven Scroll Progress Indicator (Modern Web Guidance: animation-timeline: scroll() with @supports & prefers-reduced-motion) */
  #kinja-scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    z-index: 9999;
    background: repeating-linear-gradient(
      90deg,
      #f59e0b 0px,
      #f59e0b 12px,
      #16171a 12px,
      #16171a 16px,
      #d97745 16px,
      #d97745 28px,
      #16171a 28px,
      #16171a 32px
    );
    transform-origin: 0 50%;
    transform: scaleX(0);
    box-shadow: 0 2px 10px rgba(245, 158, 11, 0.45);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: scroll()) {
      @keyframes kinja-grow-progress {
        from { transform: scaleX(0); }
        to { transform: scaleX(1); }
      }
      #kinja-scroll-progress {
        animation: kinja-grow-progress auto linear;
        animation-timeline: scroll(root block);
      }
    }
  }

  /* Living Background Interpolating Tapestry Canvas */
  #kinja-ambient-bg-canvas {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    pointer-events: none;
    opacity: 0.14;
    transition: opacity 0.35s ease;
  }

  /* Elevate article content cleanly above the interpolating background loom */
  .article-wrapper {
    position: relative;
    z-index: 2;
  }

  /* Ensure the top cover banner fits 100% complete without any vertical cropping */
  .article-cover {
    background-color: #e4dfd3 !important;
    border: 1px solid rgba(245, 158, 11, 0.45) !important;
    border-radius: 14px !important;
    padding: 0.35rem !important;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
  }

  .article-cover img {
    width: 100% !important;
    height: auto !important;
    max-height: none !important;
    object-fit: contain !important;
    border-radius: 10px !important;
    display: block !important;
  }

  #talk-content {
    background-color: rgba(11, 14, 20, 0.88) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(245, 158, 11, 0.22);
    border-radius: 18px;
    padding: 2rem 2.25rem;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
  }

  @media (max-width: 768px) {
    #talk-content {
      padding: 1.25rem 1rem;
    }
  }

  /* Floating Scrollspy & Background Interpolation HUD */
  .kinja-chapter-hud {
    position: sticky;
    top: 10px;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    background-color: #0d121c !important;
    border: 1px solid rgba(245, 158, 11, 0.45);
    border-radius: 12px;
    padding: 0.55rem 0.9rem;
    margin: 1.25rem 0 2rem 0;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.85);
  }

  .kinja-scrollspy-nav {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    scroll-target-group: auto;
  }

  .kinja-spy-link {
    font-size: 0.74rem;
    font-weight: 600;
    color: #94a3b8;
    text-decoration: none;
    padding: 0.3rem 0.6rem;
    border-radius: 7px;
    border: 1px solid transparent;
    transition: all 0.15s ease;
  }

  .kinja-spy-link:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.05);
  }

  .kinja-spy-link:is(:target-current, .target-current) {
    color: #0b0e14;
    background: #f59e0b;
    border-color: #f59e0b;
    font-weight: 700;
  }

  .kinja-bg-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: #fcd34d;
    background: rgba(245, 158, 11, 0.14);
    border: 1px solid rgba(245, 158, 11, 0.35);
    padding: 0.28rem 0.65rem;
    border-radius: 999px;
  }

  /* Embedded Interactive Loom Studio Card */
  .post-loom-studio {
    background-color: #0e131d !important;
    border: 1px solid rgba(245, 158, 11, 0.35);
    border-radius: 16px;
    padding: 1.25rem;
    margin: 2rem 0;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  }

  .post-loom-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    flex-wrap: wrap;
    padding-bottom: 0.85rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #263044;
  }

  .post-loom-btn-group {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .post-loom-btn {
    min-block-size: 34px;
    padding: 0.35rem 0.7rem;
    font-size: 0.76rem;
    font-weight: 600;
    color: #e2e8f0;
    background: #1a2232;
    border: 1px solid #2e3a52;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .post-loom-btn:hover {
    border-color: #f59e0b;
    color: #ffffff;
  }

  .post-loom-btn[aria-pressed="true"],
  .post-loom-btn.active {
    background: #f59e0b;
    color: #0b0e14;
    border-color: #f59e0b;
    font-weight: 700;
  }

  .post-loom-grid-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 1.15rem;
    align-items: start;
  }

  @media (max-width: 992px) {
    .post-loom-grid-layout {
      grid-template-columns: 1fr;
    }
  }

  .post-loom-canvas-stage {
    background-color: #080b10 !important;
    border: 1px solid #263044;
    border-radius: 12px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
  }

  #post-interactive-canvas {
    max-width: 100%;
    max-height: 440px;
    width: auto;
    height: auto;
    border-radius: 6px;
    cursor: crosshair;
  }

  .post-loom-sidebar {
    background-color: #151c28 !important;
    border: 1px solid #263044;
    border-radius: 12px;
    padding: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .post-step-btn {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    text-align: left;
    padding: 0.5rem 0.65rem;
    border-radius: 8px;
    background: #1c2536;
    border: 1px solid #2c3850;
    color: #e2e8f0;
    cursor: pointer;
    font-size: 0.75rem;
  }

  .post-step-btn[aria-current="step"] {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.14);
  }

  /* Ethnomathematics Story Cards */
  .kinja-story-callout {
    background: linear-gradient(90deg, rgba(217, 119, 69, 0.12) 0%, rgba(19, 24, 34, 0.85) 100%);
    border-left: 4px solid #d97745;
    border-radius: 0 12px 12px 0;
    padding: 1.1rem 1.35rem;
    margin: 1.5rem 0;
  }

  .kinja-lucidity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .kinja-pillar-card {
    background-color: #141a26 !important;
    border: 1px solid #28334a;
    border-radius: 12px;
    padding: 1rem 1.15rem;
  }

  .kinja-pillar-card h4 {
    color: #f59e0b;
    font-size: 0.95rem;
    margin-top: 0;
    margin-bottom: 0.45rem;
  }

  /* Literature Reading Cards */
  .kinja-lit-card {
    background-color: #131824 !important;
    border: 1px solid #29344c;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 0.85rem;
    transition: border-color 0.2s;
  }

  .kinja-lit-card:hover {
    border-color: #38bdf8;
  }
</style>

<!-- Decorative Woven Scroll Progress Bar -->
<div id="kinja-scroll-progress" aria-hidden="true"></div>

<!-- Full-Viewport Interpolating Arumã Tapestry Canvas -->
<canvas id="kinja-ambient-bg-canvas" aria-hidden="true"></canvas>

---

<section id="chapter-unwritten-code" markdown="1" tabindex="-1" data-chapter-pattern="1">

## 1. An Unwritten Language Woven in Binary Twill (*Benry*)

For centuries along the basins of the **Alalaú**, **Camanaú**, **Curiaú**, and **Uatumã** rivers in the central-northern Amazon (spanning southern Roraima and northern Amazonas), the **Kinja** passed down their entire civilization without a written alphabet. Yet to say the Waimiri Atroari had no writing is to misunderstand what writing is.

When a Kinja master weaver splits the outer stem of the **arumã** herb (*Ischnosiphon arouma*), scrapes the pith, dyes the vertical warp splints (*urdidura*) jet-black with fermented **jenipapo** juice and charcoal soot, and interlaces horizontal weft splints (*trama*) dyed crimson-ochre with **urucum**, they are executing a strict mathematical grammar called **Benry** (*graphic pattern / inscription*).

{% mermaid %}
flowchart LR
    A["Arumã Cane\n(Ischnosiphon arouma)"] --> B["Vertical Warp (Urdidura)\nDyed Black with Jenipapo + Soot\nBit = 1 (Weft UNDER ▼)"]
    A --> C["Horizontal Weft (Trama)\nNatural Cream or Urucum Red\nBit = 0 (Weft OVER ▲)"]
    B & C --> D["Even Rows (2, 4, 6...)\nStructural [▲1 ▼3] Twill Cadence\nPhase A (0 mod 4) / Phase B (2 mod 4)"]
    B & C --> E["Odd Rows (3, 5, 7...)\nSymbolic Float Pickups (▼1)\nEyes, Ribs, Seeds & River Frets"]
    D & E --> F["Kinja Benry Matrix\n4-Quadrant Dihedral Symmetry\nOral Cosmology & Clan Memory"]
{% endmermaid %}

By digitizing and analyzing 12 traditional Waimiri Atroari pattern cards and physical baskets in [`assets/js/weaving-patterns.js`](/assets/js/weaving-patterns.js), a remarkable structural law emerges across every single pattern:

1. **The Structural Spine (Even Rows, `r = 2, 4, 6...`)**: Every even-numbered row inside the basket frame obeys an invariant **`[▲1 ▼3]` 1/3 twill cadence**—the horizontal weft passes **Over 1 (`0`)** and **Under 3 (`1, 1, 1`)** vertical warps, shifting phase by $2$ columns (`Phase A: c % 4 !== 0` vs. `Phase B: (c + 2) % 4 !== 0`) to lock the basket's mechanical tension.
2. **The Semantic Pickups (Odd Rows, `r = 1, 3, 5...`)**: Every odd-numbered row is a long light weft float (`▲ Over`) punctuated by deliberate single-warp **`▼1` pickups** at odd column coordinates. Those single-bit pickups bridge consecutive twill rows to form $45^\circ$ stepped ribs, diamond eyes (**Tebaka**), seed crosses (**Dja**), agouti knee hooks (**Axiwi Se'me**), and meandering river frets (**Xirminja**).
3. **Seamless Modularity ($C - 1 \equiv 0 \pmod 4$)**: Because a canonical pattern unit has $C = 33$, $37$, or $29$ columns, its horizontal repeating stride $C - 1 \in \{28, 32, 36\}$ is an exact multiple of $4$. When unrolled around a cylindrical basket (*paneiro*) or across a wide sleeping mat, the `[▲1 ▼3]` twill phase **never breaks at the seam**.

</section>

---

<section id="chapter-balbina-flood" markdown="1" tabindex="-1" data-chapter-pattern="9">

## 2. Pulled From Their Territory: Highway BR-174 and the Great Flood of Balbina

To look at **Xirminja Benry** (*Desenho da água* — the labyrinthine water pattern now morphing into the background of this page) is to confront the trauma that nearly ended the Kinja world in the late twentieth century.

For generations, the Waimiri Atroari defended their forest territory against rubber tappers, Brazil-nut extractors, and state intrusion. Then, under Brazil's military regime in the late 1960s and 1970s, two megaprojects tore directly through the heart of Kinja territory:

<div class="kinja-story-callout">
  <strong>1968–1977 — The Cutting of Highway BR-174:</strong> Sliced north-to-south through ancestral Kinja hunting and village grounds to connect Manaus to Boa Vista, the construction of BR-174 was accompanied by military pacification campaigns, disease outbreaks, and violent confrontations later investigated by Brazil's <em>Comissão Nacional da Verdade</em> (National Truth Commission). By <strong>1983</strong>, a people who had numbered in the thousands a century earlier were reduced to just <strong>332 survivors</strong>.
</div>

Before the survivors could recover, a second catastrophe arrived by water. In **October 1987**, the floodgates of the **Balbina Hydroelectric Dam (*Usina Hidrelétrica de Balbina*)** were closed on the **Uatumã River**.

* **A Forest Drowned for Minimal Power**: Built across flat Amazonian topography rather than a steep canyon, the Balbina reservoir inundated roughly **2,928 $\text{km}^2$ of primary rainforest** to generate an average output often below $115\text{ MW}$—one of the worst flooded-area-to-megawatt ratios in human history.
* **Forced Removal & 3,500 Dead Islands**: Entire Kinja communities—including the *aldeias* of **Taquari** and **Tapupunã** along the Uatumã and Santo Antônio do Abonari tributaries—were forcibly pulled out of their ancestral lands as the waters rose. Nearly **30,000 hectares** of officially demarcated Waimiri Atroari territory were submerged, and sacred rapids, burial sites, petroglyphs, and riverside *arumã* stands disappeared under a stagnant reservoir of over 3,500 isolated hill-islands.
* **The Acidic Deadwater (*Água Morta*)**: Because the military utility did not clear the forest before closing the dam, tens of millions of giant hardwood trees rotted underwater, turning the Uatumã—once the lifeblood painted in *Waraki Benry* (Aracu fish) and *Xirminja Benry* (Water currents)—into anoxic, hydrogen-sulfide-laden water that killed the fish downstream for decades.

</section>

---

<section id="chapter-lucidity-resistance" markdown="1" tabindex="-1" data-chapter-pattern="2">

## 3. An Ethic of Radical Lucidity: No Fermented Drinks, No Ayahuasca, No Sugar

How did **332 survivors** in 1983 resist total erasure, rebuild their villages, expel invaders, and grow into a thriving population of **over 2,600 Kinja** across more than 60 *aldeias* today?

Anthropologists, indigenists, and the Kinja themselves point to an extraordinary cultural ethic of **bodily discipline, sobriety, and cognitive lucidity** that sets the Waimiri Atroari apart from many neighboring Amazonian societies:

<div class="kinja-lucidity-grid">
  <div class="kinja-pillar-card">
    <h4>🚫 Zero Fermented Liquids or Alcohol</h4>
    <p class="small text-muted mb-0">
      While many lowland South American groups ferment manioc into alcoholic <em>caxiri</em> for festivals, the Kinja strictly prohibit fermentation and alcohol. Their traditional drinks—such as fresh fruit pulps (<em>bacaba</em>, <em>açaí</em>, <em>buriti</em>) and unfermented sweet manioc porridge (<em>kiskis</em>)—are consumed fresh before any fermentation can begin.
    </p>
  </div>
  <div class="kinja-pillar-card">
    <h4>🌿 No Ayahuasca or Hallucinogens</h4>
    <p class="small text-muted mb-0">
      The Kinja do not drink <em>ayahuasca</em> (<em>yagé</em>), do not inhale <em>paricá</em> snuffs, and do not use intoxicants. In Kinja philosophy, losing control of one's senses or speech is seen as a dangerous vulnerability—a state of spiritual and physical defenselessness.
    </p>
  </div>
  <div class="kinja-pillar-card">
    <h4>🍯 Rejection of Refined Sugar</h4>
    <p class="small text-muted mb-0">
      Traditionally, the Kinja reject industrial refined sugar, salt excesses, and processed foods—preserving physical endurance, dental and metabolic health, and an acute sensitivity to seasonal wild forest honeys and fruits.
    </p>
  </div>
  <div class="kinja-pillar-card">
    <h4>🧠 Mathematical Memory in the Loom</h4>
    <p class="small text-muted mb-0">
      Without paper diagrams or intoxicants, every adult weaver holds dozens of $21 \times 37$ binary matrices in working memory—counting <em>"Over 1, Under 3, Over 5, Under 1"</em> with total concentration while singing historical songs (<em>Maryba</em>).
    </p>
  </div>
</div>

When you weave a pattern like **Weri Nahpy Benry** (*Desenho da costela da cobra grande* — the ancestral anaconda whose markings taught humanity the art of basketry), a single miscounted splint on row 5 breaks the symmetry of row 15. For the Kinja, **sobriety and geometry are the same discipline**: keeping the mind clear so the pattern—and the people—never lose their center.

</section>

---

<section id="chapter-interactive-loom" markdown="1" tabindex="-1" data-chapter-pattern="6">

## 4. Interactive Embedded Loom: Weave & Unroll the 12 *Benry* Patterns Live

Below is a live embedded version of our [**Waimiri Atroari Weaving Patterns Studio (`/waimiri-atroari-patterns/`)**](/waimiri-atroari-patterns/). Choose any of the **12 documented patterns**, step through its **5 primitive construction stages**, switch between the **Serrated Kinja Card** and **3D Arumã & Urucum Basket Weave**, or click **Desenrolar Tapete (3×2)** and **Cesto 3D** to see how a single primitive cell unrolls across a larger surface! You can also **click directly on the canvas** to toggle or stamp splints with 4-quadrant symmetry.

<div class="post-loom-studio" role="region" aria-label="Embedded Interactive Waimiri Atroari Weaving Loom">
  <div class="post-loom-toolbar">
    <div class="post-loom-btn-group">
      <label for="post-pattern-select" class="small fw-bold text-warning me-1">Padrão Kinja:</label>
      <select id="post-pattern-select" class="post-loom-btn" style="background:#0f141e; color:#f8fafc; font-weight:700;"></select>
    </div>
    <div class="post-loom-btn-group" role="group" aria-label="Modo de visualização">
      <button type="button" class="post-loom-btn" data-post-lens="kinja" aria-pressed="true">✨ Grafismo Kinja</button>
      <button type="button" class="post-loom-btn" data-post-lens="basket" aria-pressed="false">▦ Cesto 3D (Arumã)</button>
      <button type="button" class="post-loom-btn" data-post-lens="blueprint" aria-pressed="false">📐 Matriz ▼/▲</button>
    </div>
    <div class="post-loom-btn-group" role="group" aria-label="Expansão e Desenrolar">
      <button type="button" class="post-loom-btn" data-post-scale="1x1" aria-pressed="true">Peça 1×1</button>
      <button type="button" class="post-loom-btn" data-post-scale="3x1" aria-pressed="false">Faixa 3×1</button>
      <button type="button" class="post-loom-btn" data-post-scale="3x2" aria-pressed="false">Tapete 3×2</button>
      <button type="button" class="post-loom-btn" data-post-scale="concentric" aria-pressed="false">Ondas 4×3</button>
      <button type="button" class="post-loom-btn" data-post-scale="cylinder" aria-pressed="false">🏺 Cesto Cilíndrico 3D</button>
    </div>
  </div>

  <div class="post-loom-grid-layout">
    <div class="post-loom-canvas-stage">
      <canvas id="post-interactive-canvas" width="700" height="510" tabindex="0" role="application" aria-label="Interactive Waimiri Atroari weaving canvas. Click to edit splints with 4-quadrant symmetry."></canvas>
      <div style="width:100%; margin-top:0.75rem; padding:0.65rem 0.85rem; background:#121824; border:1px solid #263147; border-radius:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <strong id="post-loom-caption-title" style="color:#f59e0b; font-size:0.86rem;">TEBAKA BENRY — Desenho com olho</strong>
          <span id="post-loom-dims-badge" style="font-family:monospace; font-size:0.74rem; color:#38bdf8;">19×33 talas</span>
        </div>
        <p id="post-loom-caption-desc" style="margin:0.3rem 0 0 0; font-size:0.78rem; color:#cbd5e1; line-height:1.45;"></p>
      </div>
    </div>

    <div class="post-loom-sidebar">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="small fw-bold text-uppercase" style="color:#94a3b8; letter-spacing:0.05em;">Construção Passo a Passo</span>
        <button type="button" class="post-loom-btn active" id="post-btn-animate-steps" aria-pressed="false">▶ Animar</button>
      </div>
      <div id="post-steps-list" style="display:flex; flex-direction:column; gap:0.4rem;"></div>
      <div style="border-top:1px solid #263147; padding-top:0.65rem; margin-top:0.2rem;">
        <div class="small fw-bold text-warning mb-1">Foto de Referência Original:</div>
        <img id="post-ref-img" src="/images/patterns/tebaka.jpg" alt="Waimiri Atroari reference card" style="width:100%; height:135px; object-fit:contain; background:#090c12; border-radius:8px; border:1px solid #283246;">
      </div>
      <a href="/waimiri-atroari-patterns/" class="post-loom-btn active" style="text-align:center; text-decoration:none; padding:0.55rem;">
        Abrir Playground Completo (/waimiri-atroari-patterns/) →
      </a>
    </div>
  </div>
</div>

### Emergent Complexity When Unrolling: The Indigenous Flag Woven in the Forest

What happens when a single $19 \times 33$ primitive matrix is unrolled concentrically across a $4 \times 3$ tapestry ($55 \times 129 = 7,095$ splint intersections)? Look at what emerges when we expand **3. Weri Nahpy Benry** (*Desenho feito pela mulher* / *Costela de cobra*) in **Ondas 4×3 (`concentric`)** mode:

<figure style="background-color:#0e131d !important; border:1px solid rgba(245, 158, 11, 0.45); border-radius:16px; padding:1.1rem; margin:1.75rem 0; box-shadow:0 20px 50px rgba(0,0,0,0.6);">
  <img src="/images/patterns/weri-nahpy-concentric-4x3.jpg" alt="Weri Nahpy Benry unrolled in 4x3 concentric wave mode (55x129 splints), forming a giant stepped diamond inside a rectangular frame around a central constellation of crosses, resembling an indigenous woven Brazilian flag" style="width:100%; height:auto; display:block; border-radius:10px; border:1px solid rgba(255,255,255,0.15);">
  <figcaption style="margin-top:0.85rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
    <div style="flex:1; min-width:260px; font-size:0.82rem; color:#cbd5e1; line-height:1.5;">
      <strong style="color:#f59e0b;">Weri Nahpy Benry — Expansão Concêntrica 4×3 (55×129 talas = 7.095 cruzamentos):</strong> A partir de uma única célula primitiva $4 \times 8$, as ondas diagonais de $45^\circ$ da sarja <code>[▲1 ▼3]</code> irradiam um imenso <strong>losango central dentro do retângulo</strong> abrigando um núcleo constelado de cruzes — uma geometria ancestral que lembra de forma impressionante a <strong>Bandeira do Brasil</strong>, tecida em arumã séculos antes do Estado moderno existir.
    </div>
    <button type="button" class="post-loom-btn active" id="btn-load-brazil-flag-preset" style="flex-shrink:0;">
      🇧🇷 Testar esta Configuração no Tear Acima
    </button>
  </figcaption>
</figure>

There is a profound visual and historical poetry in this emergent image:

* **From Local Rule to Global Flag**: The weaver never sketches a giant diamond in advance. By locking the central $19 \times 33$ core of *Weri Nahpy Benry* (with its constellation of four-armed crosses) and propagating the Manhattan distance wave `abs(r - r0) + abs(c - c0) (mod 4)` across the surrounding `[▲1 ▼3]` twill rows, the $45^\circ$ stepped diagonals automatically converge at the top, bottom, left, and right midpoints—inscribing a **giant diamond (*losango*) inside the outer rectangular selvedge frame** with a starry core at its center.
* **An Ancestral Mirror of the Brazilian Flag**: It is impossible to look at this $55 \times 129$ unrolled matrix without seeing the iconic silhouette of the **Brazilian Flag**—the outer rectangle, the radiating central diamond, and the inner constellation. Yet this geometry was not borrowed from positivist heraldry: it is the mathematical consequence of Amazonian 1/3 twill basketry practiced by the **Kinja** long before highways or hydroelectric dams cut through their forest.

### Quick Reference: All 12 Documented Patterns in the Catalog

| # | Kinja Name (*Benry*) | Portuguese Name | English Translation | Matrix Size | Core Mathematical Motif |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **1** | **Waraki Benry** | *Desenho do aracu* | Aracu fish design | `19 × 33` | Nested fish-scale diamond with twin lateral hooks |
| **2** | **Tebaka Benry** | *Desenho com olho* | Eye / Jaguar eye design | `17 × 29` | Concentric stepped eye with `1×1` pupil at `(8, 14)` and 4 corner eyes |
| **3** | **Weri Nahpy Benry** | *Desenho feito pela mulher* | Snake rib / Woman's design | `19 × 33` | Continuous translational `(8, 8)` cross lattice with paired double-row twill |
| **4** | **Dja Benry** | *Desenho da semente* | Seed design | `21 × 37` | Staggered cross lattice enclosing 30 white `X`-seeds in `6 × 5` chambers |
| **5** | **Manjiki Preny Benry** | *Desenho da aba do peixe* | Fish fin design | `17 × 29` | Three vertical dorsal spines (`c=6, 14, 22`) with 5-unit pectoral fin bars |
| **6** | **Axiwi Se'me Benry** | *Desenho do joelho da cutia* | Agouti's knee design | `19 × 33` | Bent-knee angular hooks (`L`-chevrons) around a central cross |
| **7** | **Weri Bixi Benry** | *Desenho da pele da mulher* | Coral snake / Woman's skin | `21 × 37` | Central 5-seed cross medallion with stepped chevrons and triple-seed corners |
| **8** | **Nana Bixi Benry** | *Desenho da casca do abacaxi* | Pineapple peel design | `21 × 37` | Staggered checkerboard of 5-`X` diamond scales across `21 × 37` splints |
| **9** | **Panapna Benry** | *Desenho da borboleta grande* | Great butterfly design | `23 × 31` | Five Morpho butterfly medallions with twin vertical white wing diamonds (`♦ ♦`) |
| **10** | **Xirminja Nahpy Benry** | *Desenho feito pela entidade mitológica da água* | Water mythologic entity design | `21 × 23` | Dual register split at Row 6: twin-eye fret boxes above, river vortex below |
| **11** | **Kinja Paneiro (Urucum)** | *Trama Física Tricolor* | Urucum & Arumã physical weave | `19 × 33` | Close-up 3D splint interlacing with terracotta *urucum* weft |
| **12** | **Kinja Paneiro (Natural)** | *Trama Física Natural* | Natural & Black Arumã weave | `17 × 29` | Physical orthogonal cane weave of *Manjiki Preny Benry* |

</section>

---

<section id="chapter-literature" markdown="1" tabindex="-1" data-chapter-pattern="3">

## 5. Essential Literature: Understanding the Waimiri Atroari (*Kinja*) Struggle

If you want to study the history, ethnomathematics, and territorial resistance of the Waimiri Atroari beyond the loom, this curated bibliography brings together indigenous-authored texts, anthropological monographs, ecological forensics of the Balbina Dam, and human-rights archives:

<div class="kinja-lit-card">
  <h4 style="margin:0 0 0.35rem 0; color:#fcd34d; font-size:0.96rem;">
    1. <em>Waimiri Atroari: História e Cultura Kinja</em> — Kinja Educators &amp; Programa Waimiri Atroari
  </h4>
  <p class="small text-muted mb-1">
    Authored with Kinja teachers and elders in bilingual schools along the Alalaú and Camanaú rivers. Documents oral histories of how the ancient people learned basketry from the markings of the great anaconda (<em>Weri</em>), alongside botanical knowledge of <em>arumã</em> harvesting, natural dyes, and the strict dietary ethic rejecting fermented drinks and sugar.
  </p>
</div>

<div class="kinja-lit-card">
  <h4 style="margin:0 0 0.35rem 0; color:#fcd34d; font-size:0.96rem;">
    2. Egydio Schwade &amp; Doroti Alice Schwade — <em>A Ditadura Militar e o Genocídio do Povo Waimiri-Atroari</em> / Arquivo Mawa
  </h4>
  <p class="small text-muted mb-1">
    Chronicles the impact of Highway BR-174 and the first literacy and memory exchanges in the village of <em>Yawará</em> (1985–1986), where young Kinja drew on paper for the first time the massacres and village displacements their elders had survived, alongside the geometric patterns that anchored their collective identity.
  </p>
</div>

<div class="kinja-lit-card">
  <h4 style="margin:0 0 0.35rem 0; color:#fcd34d; font-size:0.96rem;">
    3. Stephen Grant Baines — <em>É a FUNAI que sabe: A frente de atração Waimiri-Atroari</em> (UnB / Museu Goeldi)
  </h4>
  <p class="small text-muted mb-1">
    A foundational ethnographic monograph examining the forced attraction front, the demographic collapse to 332 people in 1983, the forced relocation of the <em>Taquari</em> and <em>Tapupunã</em> villages prior to the closing of the Balbina Hydroelectric Dam in 1987, and the subsequent demographic recovery of the Kinja.
  </p>
</div>

<div class="kinja-lit-card">
  <h4 style="margin:0 0 0.35rem 0; color:#fcd34d; font-size:0.96rem;">
    4. Philip M. Fearnside — <em>Brazil's Balbina Dam: Environment versus the Legacy of the Pharaohs in Amazonia</em> (Environmental Management, 1989)
  </h4>
  <p class="small text-muted mb-1">
    The definitive ecological and hydrological analysis of the Balbina Dam on the Uatumã River—quantifying how nearly $3,000\text{ km}^2$ of primary forest and indigenous territory were submerged into 3,500 islands of rotting biomass and methane emissions for a fraction of Manaus's electricity demand.
  </p>
</div>

<div class="kinja-lit-card">
  <h4 style="margin:0 0 0.35rem 0; color:#fcd34d; font-size:0.96rem;">
    5. Relatório Final da Comissão Nacional da Verdade (CNV, Vol. II, Texto 5, 2014) — <em>Violações de Direitos Humanos dos Povos Indígenas</em>
  </h4>
  <p class="small text-muted mb-1">
    Official Brazilian state investigation documenting the violence against the Waimiri Atroari during the opening of BR-174 and the flooding of their territory by Balbina, establishing historical recognition of Kinja resistance and territorial rights.
  </p>
</div>

---

### Launch the Full Interactive Loom & Tapestry Unroller

Ready to weave your own variations, test your accuracy against all 12 Kinja matrices, or unroll a 6×3 mural?

👉 **[Launch the Waimiri Atroari Weaving Patterns Playground (`/waimiri-atroari-patterns/`)](/waimiri-atroari-patterns/)**

</section>

<script src="/assets/js/weaving-patterns.js"></script>
<script>
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.WeavingPatterns) return;

    var CATALOG = window.WeavingPatterns.CATALOG;

    // 1. Progressive Enhancement Fallback for Scroll Progress Bar if animation-timeline: scroll() is unsupported
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && !CSS.supports('animation-timeline', 'scroll()')) {
      var progEl = document.getElementById('kinja-scroll-progress');
      if (progEl) {
        window.addEventListener('scroll', function () {
          var scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          var pct = Math.min(1, Math.max(0, window.scrollY / scrollable));
          progEl.style.transform = 'scaleX(' + pct.toFixed(4) + ')';
        }, { passive: true });
      }
    }

    // 2. Living Background Interpolating Tapestry Canvas
    var bgCanvas = document.getElementById('kinja-ambient-bg-canvas');
    var bgIndicator = document.getElementById('bg-pattern-indicator');
    var bgIntensityBtn = document.getElementById('btn-toggle-bg-intensity');
    var highIntensityBg = false;

    var currentBgIdx = 1; // Tebaka Benry default
    var prevBgIdx = 1;
    var morphProgress = 1; // 0..1 interpolation between prevBgIdx and currentBgIdx
    var morphAnimFrame = null;

    function triggerBgMorphTo(targetIdx) {
      if (targetIdx === currentBgIdx && morphProgress >= 1) return;
      prevBgIdx = currentBgIdx;
      currentBgIdx = targetIdx;
      morphProgress = 0;
      var pat = CATALOG[currentBgIdx] || CATALOG[0];
      if (bgIndicator) {
        bgIndicator.textContent = 'Fundo Vivo: ' + pat.kinjaName;
      }

      var startTime = performance.now();
      var duration = 680;
      if (morphAnimFrame) cancelAnimationFrame(morphAnimFrame);

      function stepMorph(now) {
        var t = Math.min(1, (now - startTime) / duration);
        // Smooth ease-in-out
        morphProgress = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        drawAmbientBackground();
        if (t < 1) {
          morphAnimFrame = requestAnimationFrame(stepMorph);
        }
      }
      morphAnimFrame = requestAnimationFrame(stepMorph);
    }

    function drawAmbientBackground() {
      if (!bgCanvas) return;
      var w = window.innerWidth || 1280;
      var h = window.innerHeight || 800;
      if (bgCanvas.width !== w || bgCanvas.height !== h) {
        bgCanvas.width = w;
        bgCanvas.height = h;
      }
      var ctx = bgCanvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      var patA = CATALOG[prevBgIdx] || CATALOG[0];
      var patB = CATALOG[currentBgIdx] || CATALOG[0];
      var gA = patA.grid;
      var gB = patB.grid;
      var rA = gA.length - 1;
      var cA = gA[0].length - 1;
      var rB = gB.length - 1;
      var cB = gB[0].length - 1;

      var cellW = 18;
      var cellH = 22;
      var cols = Math.ceil(w / cellW) + 1;
      var rows = Math.ceil(h / cellH) + 1;

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var vA = gA[r % rA][c % cA];
          var vB = gB[r % rB][c % cB];
          var blended = vA * (1 - morphProgress) + vB * morphProgress;
          if (blended > 0.05) {
            var x = c * cellW;
            var y = r * cellH;
            ctx.fillStyle = 'rgba(245, 158, 11, ' + (blended * 0.85).toFixed(3) + ')';
            var scale = 0.35 + 0.65 * blended;
            var cw = cellW * scale;
            var ch = cellH * scale;
            ctx.fillRect(x + (cellW - cw) * 0.5, y + (cellH - ch) * 0.5, cw, ch);
          }
        }
      }
    }

    window.addEventListener('resize', drawAmbientBackground);
    drawAmbientBackground();

    if (bgIntensityBtn && bgCanvas) {
      bgIntensityBtn.addEventListener('click', function () {
        highIntensityBg = !highIntensityBg;
        bgIntensityBtn.setAttribute('aria-pressed', highIntensityBg ? 'true' : 'false');
        bgCanvas.style.opacity = highIntensityBg ? '0.34' : '0.14';
      });
    }

    // 3. Scrollspy + Chapter-Triggered Background Pattern Interpolation
    var sections = document.querySelectorAll('section[data-chapter-pattern]');
    var spyLinks = document.querySelectorAll('.kinja-spy-link');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          var patIdx = parseInt(entry.target.getAttribute('data-chapter-pattern') || '1', 10);
          triggerBgMorphTo(patIdx);
          spyLinks.forEach(function (link) {
            var active = link.getAttribute('href') === '#' + id;
            link.classList.toggle('target-current', active);
            link.setAttribute('aria-current', active ? 'true' : 'false');
          });
        }
      });
    }, { rootMargin: '-35% 0px -45% 0px', threshold: 0 });

    sections.forEach(function (sec) {
      observer.observe(sec);
    });

    spyLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        var patIdx = parseInt(link.getAttribute('data-bg-pattern') || '1', 10);
        triggerBgMorphTo(patIdx);
      });
    });

    // 4. Embedded Interactive Loom Studio Controller
    var postState = {
      patternIdx: 1, // Tebaka Benry default
      stepIdx: 4,
      lens: 'kinja', // 'kinja' | 'basket' | 'blueprint'
      scaleMode: '1x1', // '1x1' | '3x2' | 'concentric' | 'cylinder'
      userGrid: null,
      animTimer: null
    };

    var selectEl = document.getElementById('post-pattern-select');
    var canvas = document.getElementById('post-interactive-canvas');
    var stepsListEl = document.getElementById('post-steps-list');
    var titleEl = document.getElementById('post-loom-caption-title');
    var descEl = document.getElementById('post-loom-caption-desc');
    var dimsEl = document.getElementById('post-loom-dims-badge');
    var refImg = document.getElementById('post-ref-img');
    var animBtn = document.getElementById('post-btn-animate-steps');
    var lastGeom = null;

    if (selectEl) {
      CATALOG.forEach(function (pat, idx) {
        var opt = document.createElement('option');
        opt.value = String(idx);
        opt.textContent = (idx + 1) + '. ' + pat.kinjaName + ' (' + pat.ptName + ')';
        if (idx === postState.patternIdx) opt.selected = true;
        selectEl.appendChild(opt);
      });
      selectEl.addEventListener('change', function () {
        stopPostAnim();
        postState.patternIdx = parseInt(selectEl.value, 10) || 0;
        postState.stepIdx = 4;
        postState.userGrid = null;
        triggerBgMorphTo(postState.patternIdx);
        renderPostStepsList();
        renderPostLoom();
      });
    }

    document.querySelectorAll('[data-post-lens]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        postState.lens = btn.getAttribute('data-post-lens');
        document.querySelectorAll('[data-post-lens]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        renderPostLoom();
      });
    });

    document.querySelectorAll('[data-post-scale]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        postState.scaleMode = btn.getAttribute('data-post-scale');
        document.querySelectorAll('[data-post-scale]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        renderPostLoom();
      });
    });

    var flagPresetBtn = document.getElementById('btn-load-brazil-flag-preset');
    if (flagPresetBtn) {
      flagPresetBtn.addEventListener('click', function () {
        stopPostAnim();
        postState.patternIdx = 2; // 3. WERI NAHPY BENRY
        postState.stepIdx = 4;
        postState.lens = 'kinja';
        postState.scaleMode = 'concentric';
        postState.userGrid = null;
        if (selectEl) selectEl.value = '2';
        document.querySelectorAll('[data-post-lens]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-post-lens') === 'kinja' ? 'true' : 'false');
        });
        document.querySelectorAll('[data-post-scale]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-post-scale') === 'concentric' ? 'true' : 'false');
        });
        triggerBgMorphTo(2);
        renderPostStepsList();
        renderPostLoom();
        if (canvas) canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    function stopPostAnim() {
      if (postState.animTimer) {
        clearInterval(postState.animTimer);
        postState.animTimer = null;
      }
      if (animBtn) {
        animBtn.textContent = '▶ Animar';
        animBtn.setAttribute('aria-pressed', 'false');
      }
    }

    if (animBtn) {
      animBtn.addEventListener('click', function () {
        if (postState.animTimer) {
          stopPostAnim();
          return;
        }
        postState.userGrid = null;
        postState.stepIdx = 0;
        postState.scaleMode = '1x1';
        document.querySelectorAll('[data-post-scale]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-post-scale') === '1x1' ? 'true' : 'false');
        });
        animBtn.textContent = '⏸ Pausar';
        animBtn.setAttribute('aria-pressed', 'true');
        renderPostStepsList();
        renderPostLoom();

        postState.animTimer = setInterval(function () {
          var pat = CATALOG[postState.patternIdx];
          if (postState.stepIdx < pat.steps.length - 1) {
            postState.stepIdx++;
            renderPostStepsList();
            renderPostLoom();
          } else {
            stopPostAnim();
          }
        }, 1050);
      });
    }

    function renderPostStepsList() {
      if (!stepsListEl) return;
      while (stepsListEl.firstChild) stepsListEl.removeChild(stepsListEl.firstChild);
      var pat = CATALOG[postState.patternIdx];
      pat.steps.forEach(function (st, sIdx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'post-step-btn';
        if (sIdx === postState.stepIdx) b.setAttribute('aria-current', 'step');
        var t = document.createElement('strong');
        t.style.color = '#fcd34d';
        t.textContent = st.title;
        var f = document.createElement('span');
        f.style.fontFamily = 'monospace';
        f.style.fontSize = '0.68rem';
        f.style.color = '#38bdf8';
        f.textContent = st.formula;
        b.appendChild(t);
        b.appendChild(f);
        b.addEventListener('click', function () {
          stopPostAnim();
          postState.userGrid = null;
          postState.stepIdx = sIdx;
          renderPostStepsList();
          renderPostLoom();
        });
        stepsListEl.appendChild(b);
      });
    }

    function getPostDisplayGrid() {
      var pat = CATALOG[postState.patternIdx];
      var base = postState.userGrid || pat.steps[postState.stepIdx].grid;
      if (postState.scaleMode === '3x1') {
        return window.WeavingPatterns.generateExpandedGrid(base, {
          repeatsX: 3,
          repeatsY: 1,
          unrollMode: 'seamless',
          tilePeriod: pat.tilePeriod,
          patternId: pat.id
        }).grid;
      }
      if (postState.scaleMode === '3x2' || postState.scaleMode === 'cylinder') {
        return window.WeavingPatterns.generateExpandedGrid(base, {
          repeatsX: 3,
          repeatsY: 2,
          unrollMode: 'seamless',
          tilePeriod: pat.tilePeriod,
          patternId: pat.id
        }).grid;
      }
      if (postState.scaleMode === 'concentric') {
        return window.WeavingPatterns.generateExpandedGrid(base, {
          repeatsX: 4,
          repeatsY: 3,
          unrollMode: 'concentric',
          tilePeriod: pat.tilePeriod,
          patternId: pat.id
        }).grid;
      }
      return base;
    }

    function renderPostLoom() {
      if (!canvas) return;
      var pat = CATALOG[postState.patternIdx];
      var grid = getPostDisplayGrid();
      var R = grid.length;
      var C = grid[0].length;

      var fit = Math.min(1, Math.min(680 / (C * 18), 420 / (R * 22)));
      var cellW = Math.max(6, Math.round(18 * fit));
      var cellH = Math.max(8, Math.round(22 * fit));
      var pad = 14;
      var totalW = pad * 2 + C * cellW;
      var totalH = pad * 2 + R * cellH;

      var off = document.createElement('canvas');
      off.width = totalW;
      off.height = totalH;
      var ctx = off.getContext('2d');

      lastGeom = { pad: pad, cellW: cellW, cellH: cellH, R: R, C: C };

      if (postState.lens === 'kinja') {
        var paperColor = '#e5dfd3';
        var darkColor = '#17181c';
        ctx.fillStyle = paperColor;
        ctx.fillRect(0, 0, totalW, totalH);
        ctx.fillStyle = darkColor;
        var toothY = Math.min(5.2, cellH * 0.24);
        var toothX = Math.min(4.8, cellW * 0.24);
        var notchX = Math.min(4.2, cellW * 0.22);
        var isPanapna = pat && pat.id === 'panapna';

        for (var r = 0; r < R; r++) {
          for (var c = 0; c < C; c++) {
            if (grid[r][c] !== 1) continue;
            var x = pad + c * cellW;
            var y = pad + r * cellH;
            ctx.fillRect(x, y, cellW + 0.45, cellH + 0.45);
            if (r === 0 || grid[r - 1][c] === 0) {
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + cellW * 0.5, y - toothY);
              ctx.lineTo(x + cellW, y);
              ctx.closePath();
              ctx.fill();
            }
            if (r === R - 1 || grid[r + 1][c] === 0) {
              ctx.beginPath();
              ctx.moveTo(x, y + cellH);
              ctx.lineTo(x + cellW * 0.5, y + cellH + toothY);
              ctx.lineTo(x + cellW, y + cellH);
              ctx.closePath();
              ctx.fill();
            }
            if (r % 2 === 1) {
              if (c === 0 || grid[r][c - 1] === 0) {
                ctx.beginPath();
                ctx.moveTo(x, y + cellH * 0.12);
                ctx.lineTo(x - toothX, y + cellH * 0.5);
                ctx.lineTo(x, y + cellH * 0.88);
                ctx.closePath();
                ctx.fill();
              }
              if (c === C - 1 || grid[r][c + 1] === 0) {
                ctx.beginPath();
                ctx.moveTo(x + cellW, y + cellH * 0.12);
                ctx.lineTo(x + cellW + toothX, y + cellH * 0.5);
                ctx.lineTo(x + cellW, y + cellH * 0.88);
                ctx.closePath();
                ctx.fill();
              }
            }
          }
        }

        // Even interior rows: inward V-notches on lateral edges
        ctx.fillStyle = paperColor;
        for (var re = 2; re < R - 1; re += 2) {
          for (var ce = 0; ce < C; ce++) {
            if (grid[re][ce] !== 1) continue;
            var xe = pad + ce * cellW;
            var ye = pad + re * cellH;
            if (ce === 0 || grid[re][ce - 1] === 0) {
              ctx.beginPath();
              ctx.moveTo(xe - 0.5, ye + cellH * 0.14);
              ctx.lineTo(xe + notchX, ye + cellH * 0.5);
              ctx.lineTo(xe - 0.5, ye + cellH * 0.86);
              ctx.closePath();
              ctx.fill();
            }
            if (ce === C - 1 || grid[re][ce + 1] === 0) {
              ctx.beginPath();
              ctx.moveTo(xe + cellW + 0.5, ye + cellH * 0.14);
              ctx.lineTo(xe + cellW - notchX, ye + cellH * 0.5);
              ctx.lineTo(xe + cellW + 0.5, ye + cellH * 0.86);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        // Isolated white seed cells (white X-seeds or Panapna twin vertical diamonds)
        for (var rs = 1; rs < R - 1; rs++) {
          for (var cs = 0; cs < C; cs++) {
            if (grid[rs][cs] !== 0) continue;
            if (rs % 2 === 0 && cs > 0 && cs < C - 1) continue;
            var encTB = (grid[rs - 1][cs] === 1 && grid[rs + 1][cs] === 1);
            var encL = (cs === 0) ? (grid[rs][cs + 1] === 1) : (grid[rs][cs - 1] === 1);
            var encR = (cs === C - 1) ? (grid[rs][cs - 1] === 1) : (grid[rs][cs + 1] === 1);
            if (!encTB || !encL || !encR) continue;
            var xs = pad + cs * cellW;
            var ys = pad + rs * cellH;
            if (isPanapna) {
              ctx.fillStyle = darkColor;
              ctx.fillRect(xs - 0.3, ys - 0.3, cellW + 0.6, cellH + 0.6);
              ctx.fillStyle = paperColor;
              var dHW = cellW * 0.185;
              var dHH = cellH * 0.39;
              [0.27, 0.73].forEach(function (cf) {
                var cx = xs + cellW * cf;
                var cy = ys + cellH * 0.5;
                ctx.beginPath();
                ctx.moveTo(cx, cy - dHH);
                ctx.lineTo(cx + dHW, cy);
                ctx.lineTo(cx, cy + dHH);
                ctx.lineTo(cx - dHW, cy);
                ctx.closePath();
                ctx.fill();
              });
            } else {
              ctx.fillStyle = darkColor;
              var pY = cellH * 0.36;
              var pX = cellW * 0.36;
              ctx.beginPath();
              ctx.moveTo(xs + cellW * 0.08, ys - 0.3);
              ctx.lineTo(xs + cellW * 0.5, ys + pY);
              ctx.lineTo(xs + cellW * 0.92, ys - 0.3);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(xs + cellW * 0.08, ys + cellH + 0.3);
              ctx.lineTo(xs + cellW * 0.5, ys + cellH - pY);
              ctx.lineTo(xs + cellW * 0.92, ys + cellH + 0.3);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(xs - 0.3, ys + cellH * 0.08);
              ctx.lineTo(xs + pX, ys + cellH * 0.5);
              ctx.lineTo(xs - 0.3, ys + cellH * 0.92);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(xs + cellW + 0.3, ys + cellH * 0.08);
              ctx.lineTo(xs + cellW - pX, ys + cellH * 0.5);
              ctx.lineTo(xs + cellW + 0.3, ys + cellH * 0.92);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
      } else if (postState.lens === 'basket') {
        ctx.fillStyle = '#090b10';
        ctx.fillRect(0, 0, totalW, totalH);
        for (var r2 = 0; r2 < R; r2++) {
          var y2 = pad + r2 * cellH;
          var runs = window.WeavingPatterns.encodeRowRuns(grid[r2]);
          var isUrucum = (pat.palette === 'urucum' && r2 >= 4 && r2 <= R - 5);
          for (var i = 0; i < runs.length; i++) {
            var run = runs[i];
            if (run.type === 'over') {
              ctx.fillStyle = isUrucum ? '#d2764a' : '#e6d8bc';
              ctx.fillRect(pad + run.startCol * cellW + 0.5, y2 + 1.5, run.count * cellW - 1, cellH - 3);
            } else {
              for (var k = run.startCol; k <= run.endCol; k++) {
                ctx.fillStyle = '#1f242d';
                ctx.fillRect(pad + k * cellW + 1.2, y2, cellW - 2.4, cellH);
              }
            }
          }
        }
      } else {
        ctx.fillStyle = '#0d121c';
        ctx.fillRect(0, 0, totalW, totalH);
        for (var r3 = 0; r3 < R; r3++) {
          for (var c3 = 0; c3 < C; c3++) {
            var u = grid[r3][c3] === 1;
            ctx.fillStyle = u ? '#1e2433' : '#e2d9c5';
            ctx.fillRect(pad + c3 * cellW + 0.5, pad + r3 * cellH + 0.5, cellW - 1, cellH - 1);
          }
        }
      }

      canvas.width = totalW;
      canvas.height = totalH;
      var dest = canvas.getContext('2d');

      if (postState.scaleMode === 'cylinder') {
        dest.fillStyle = '#070a10';
        dest.fillRect(0, 0, totalW, totalH);
        var maxAngle = Math.PI * 1.35;
        var halfAngle = maxAngle * 0.5;
        var sinHalf = Math.sin(halfAngle);
        var centerX = totalW * 0.5;
        var usableW = (totalW - 28) * 0.82;
        for (var sx = 0; sx < totalW; sx += 2) {
          var normS = (sx / totalW) - 0.5;
          var theta = normS * maxAngle;
          var cosT = Math.cos(theta);
          if (cosT < 0) continue;
          var proj = Math.sin(theta) / sinHalf;
          var nextProj = Math.sin(((sx + 2) / totalW - 0.5) * maxAngle) / sinHalf;
          var dx = centerX + proj * (usableW * 0.5);
          var dw = Math.max(1.5, Math.abs((nextProj - proj) * (usableW * 0.5)) + 0.8);
          var yCurve = 18 * (1 - cosT);
          dest.drawImage(off, sx, 0, 2, totalH, dx, yCurve * 0.6, dw, totalH - yCurve * 0.9);
          var shade = Math.pow(cosT, 0.85);
          if (shade < 0.88) {
            dest.fillStyle = 'rgba(6, 9, 15, ' + ((1 - shade) * 0.65).toFixed(3) + ')';
            dest.fillRect(dx, yCurve * 0.6, dw, totalH - yCurve * 0.9);
          }
        }
      } else {
        dest.drawImage(off, 0, 0);
      }

      var stObj = pat.steps[postState.stepIdx];
      if (titleEl) titleEl.textContent = pat.kinjaName + ' — ' + stObj.title;
      if (descEl) descEl.textContent = stObj.description + ' (' + pat.culturalNote + ')';
      if (dimsEl) dimsEl.textContent = R + '×' + C + ' talas (' + postState.scaleMode + ')';
      if (refImg) {
        refImg.src = pat.image;
        refImg.alt = pat.kinjaName + ' - ' + pat.ptName;
      }
    }

    if (canvas) {
      canvas.addEventListener('pointerdown', function (e) {
        if (!lastGeom) return;
        var rect = canvas.getBoundingClientRect();
        var px = (e.clientX - rect.left) * (canvas.width / rect.width);
        var py = (e.clientY - rect.top) * (canvas.height / rect.height);
        var c = Math.floor((px - lastGeom.pad) / lastGeom.cellW);
        var r = Math.floor((py - lastGeom.pad) / lastGeom.cellH);
        if (r < 0 || r >= lastGeom.R || c < 0 || c >= lastGeom.C) return;

        var pat = CATALOG[postState.patternIdx];
        if (!postState.userGrid) {
          postState.userGrid = window.WeavingPatterns.cloneGrid(pat.steps[postState.stepIdx].grid);
        }
        var bR = postState.userGrid.length;
        var bC = postState.userGrid[0].length;
        var targetR = r % Math.max(1, bR - 1);
        var targetC = c % Math.max(1, bC - 1);
        var invertVal = postState.userGrid[targetR][targetC] === 1 ? 0 : 1;
        postState.userGrid = window.WeavingPatterns.applyPrimitiveWithSymmetry(
          postState.userGrid,
          [[1]],
          targetR,
          targetC,
          '4q',
          invertVal,
          pat.tilePeriod
        );
        renderPostLoom();
      });
    }

    renderPostStepsList();
    renderPostLoom();
  });
})();
</script>
