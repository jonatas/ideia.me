# 🎬 Video Talk Track: Ep 2: From 1D Strings to 3D Atoms with Morton Curves
**Layer:** Layers 2, 6 & 8: 3D Spatial Z-Order Curves & Structural Superposition  
**Date:** 2026-11-11  
**Benchmark Headline:** 120x faster 3D pocket extraction (Zero KD-Tree build time)  
**Blog:** [https://ideia.me](https://ideia.me) | **Repository:** [https://github.com/jonatas/pg_bio](https://github.com/jonatas/pg_bio)

---

## Act I (`0:00–0:45`) — The Molecular Hook (Why Biotech Cares)
* **Visual:** Open `studio_deck.html` (Slide 1 & 3Dmol.js Stage) or the Mol* Sidecar Viewer.
* **Talking Point (Biotech Context):**
  > "Once translated, a 1D amino acid string folds into a 3D atomic cloud measured in Angstroms. Catalysis happens inside a tiny 3.5 to 5.0 Angstrom 3D pocket—where residues that are 100 positions apart in the string snap together in 3D space to coordinate a metal cofactor."
* **What to point out on screen:**
  * Rotate the 3D structure so the viewer sees the physical binding pocket / catalytic motif.
  * Explain why a naive sequence match fails in the wet lab and why atomic-level or multi-constraint physics is mandatory.

---

## Act II (`0:45–1:30`) — Why Duct-Tape Python Pipelines Choke
* **Visual:** Play `manim_scene.py` (`FeatureScene` Part 1) or Act II of `ep02_3d_pockets_and_morton_curves.mp4`.
* **Talking Point (Systems Bottleneck):**
  > "In a traditional bioinformatics stack, you pull hundreds of thousands of rows over a TCP socket into Python, deserialize strings into objects, and run $O(N^2)$ loops in user space. 99% of your wall-clock time is spent moving bytes across the wire instead of doing science."

---

## Act III (`1:30–2:45`) — The Systems-to-Biotech Bridge in Rust (`src/lib.rs`)
* **Visual:** Split screen between [`src/lib.rs`](../../src/lib.rs) and `studio_deck.html` (toggle the **Engineer $\leftrightarrow$ Biologist Rosetta Switch**).
* **Talking Point (The CS Insight):**
  > "z_order_encode(x, y, z) bit-interleaves 21-bit 3D Cartesian floats into a single 64-bit BIGINT B-Tree key, while kabsch_rmsd() and theozyme_rmsd() run stack-allocated 3x3 Jacobi SVD to align 3D pockets in microseconds."
* **Key Translation for Engineers:**
  * **Systems View:** `z_order_encode(x, y, z) bit-interleaves 21-bit 3D Cartesian floats into a single 64-bit BIGINT B-Tree key, while kabsch_rmsd() and theozyme_rmsd() run stack-allocated 3x3 Jacobi SVD to align 3D pockets in microseconds.`
  * **Biological View:** `Once translated, a 1D amino acid string folds into a 3D atomic cloud measured in Angstroms. Catalysis happens inside a tiny 3.5 to 5.0 Angstrom 3D pocket—where residues that are 100 positions apart in the string snap together in 3D space to coordinate a metal cofactor.`

---

## Act IV (`2:45–4:00`) — Live SQL Progress & Benchmark (`live_demo.sql`)
* **Visual:** Terminal running `psql` connected to `pg_bio` (`\i videos/ep02_3d_pockets_and_morton_curves/live_demo.sql`).
* **Talking Point (The SQL Proof):**
  1. Run **Stage 1 (The Atomic Primitive)** to show the clean SQL signature.
  2. Run **Stage 2 (The Multi-Constraint Discovery Pipeline)** using `CROSS JOIN LATERAL` so index filtering prunes the search space before heavy physics runs.
  3. Run **Stage 3 (`EXPLAIN (ANALYZE, BUFFERS)`)** and highlight the execution time: **120x faster 3D pocket extraction (Zero KD-Tree build time)**.

---

## Act V (`4:00–5:00`) — 3D Structural Proof & Call to Action
* **Visual:** Return to `studio_deck.html` (Interactive 3Dmol.js Teaching Stage + Footer).
* **Action:** Click the **"1. Highlight Catalytic Triad / Metal"** and **"2. Show 3D Morton Bounding Pocket"** buttons and read the dynamic chemistry callout.
* **Closing Hook:**
  > "Explore all interactive 3D discoveries at https://ideia.me and star or contribute to the engine at https://github.com/jonatas/pg_bio."
