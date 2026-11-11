# 🎬 Video Talk Track: Ep 3: Transcriptomics & CSR Sparse Attention Graphs
**Layer:** Layers 3 & 9: Single-Cell CSR Arrays, Neural Attention & Allostery  
**Date:** 2026-11-11  
**Benchmark Headline:** 31.1x faster than Python/NumPy & 90% less RAM footprint  
**Blog:** [https://ideia.me](https://ideia.me) | **Repository:** [https://github.com/jonatas/pg_bio](https://github.com/jonatas/pg_bio)

---

## Act I (`0:00–0:45`) — The Molecular Hook (Why Biotech Cares)
* **Visual:** Open `studio_deck.html` (Slide 1 & 3Dmol.js Stage) or the Mol* Sidecar Viewer.
* **Talking Point (Biotech Context):**
  > "Every cell in your body shares the exact same DNA, yet a neuron and a T-cell behave completely differently because of which genes they express (Transcriptomics). Sequencing 1 million cells across 20,000 genes creates a 20-billion-cell matrix that is 90% zeroes—crushing traditional SQL schemas and RAM."
* **What to point out on screen:**
  * Rotate the 3D structure so the viewer sees the physical binding pocket / catalytic motif.
  * Explain why a naive sequence match fails in the wet lab and why atomic-level or multi-constraint physics is mandatory.

---

## Act II (`0:45–1:30`) — Why Duct-Tape Python Pipelines Choke
* **Visual:** Play `manim_scene.py` (`FeatureScene` Part 1) or Act II of `ep03_scrna_csr_and_attention_maps.mp4`.
* **Talking Point (Systems Bottleneck):**
  > "In a traditional bioinformatics stack, you pull hundreds of thousands of rows over a TCP socket into Python, deserialize strings into objects, and run $O(N^2)$ loops in user space. 99% of your wall-clock time is spent moving bytes across the wire instead of doing science."

---

## Act III (`1:30–2:45`) — The Systems-to-Biotech Bridge in Rust (`src/lib.rs`)
* **Visual:** Split screen between [`src/lib.rs`](../../src/lib.rs) and `studio_deck.html` (toggle the **Engineer $\leftrightarrow$ Biologist Rosetta Switch**).
* **Talking Point (The CS Insight):**
  > "Compressed Sparse Row (CSR) storage (SparseAttentionMap, create_sparse_map, build_energy_hotspot_map) stores only non-zero contacts and expression counts, reducing O(L^2) dense scans to O(nnz) nanosecond slice lookups."
* **Key Translation for Engineers:**
  * **Systems View:** `Compressed Sparse Row (CSR) storage (SparseAttentionMap, create_sparse_map, build_energy_hotspot_map) stores only non-zero contacts and expression counts, reducing O(L^2) dense scans to O(nnz) nanosecond slice lookups.`
  * **Biological View:** `Every cell in your body shares the exact same DNA, yet a neuron and a T-cell behave completely differently because of which genes they express (Transcriptomics). Sequencing 1 million cells across 20,000 genes creates a 20-billion-cell matrix that is 90% zeroes—crushing traditional SQL schemas and RAM.`

---

## Act IV (`2:45–4:00`) — Live SQL Progress & Benchmark (`live_demo.sql`)
* **Visual:** Terminal running `psql` connected to `pg_bio` (`\i videos/ep03_scrna_csr_and_attention_maps/live_demo.sql`).
* **Talking Point (The SQL Proof):**
  1. Run **Stage 1 (The Atomic Primitive)** to show the clean SQL signature.
  2. Run **Stage 2 (The Multi-Constraint Discovery Pipeline)** using `CROSS JOIN LATERAL` so index filtering prunes the search space before heavy physics runs.
  3. Run **Stage 3 (`EXPLAIN (ANALYZE, BUFFERS)`)** and highlight the execution time: **31.1x faster than Python/NumPy & 90% less RAM footprint**.

---

## Act V (`4:00–5:00`) — 3D Structural Proof & Call to Action
* **Visual:** Return to `studio_deck.html` (Interactive 3Dmol.js Teaching Stage + Footer).
* **Action:** Click the **"1. Highlight Catalytic Triad / Metal"** and **"2. Show 3D Morton Bounding Pocket"** buttons and read the dynamic chemistry callout.
* **Closing Hook:**
  > "Explore all interactive 3D discoveries at https://ideia.me and star or contribute to the engine at https://github.com/jonatas/pg_bio."
