# 🎬 Video Talk Track: Ep 4: The Multiomics Holy Grail — Vectors & Live UniProt
**Layer:** Layers 4 & 5: Joint Vector Spaces (halfvec HNSW) & Live UniProt FDW  
**Date:** 2026-11-11  
**Benchmark Headline:** Scans 2.34M proteins in 0.4 ms + Zero external ETL scripts  
**Blog:** [https://ideia.me](https://ideia.me) | **Repository:** [https://github.com/jonatas/pg_bio](https://github.com/jonatas/pg_bio)

---

## Act I (`0:00–0:45`) — The Molecular Hook (Why Biotech Cares)
* **Visual:** Open `studio_deck.html` (Slide 1 & 3Dmol.js Stage) or the Mol* Sidecar Viewer.
* **Talking Point (Biotech Context):**
  > "99% of microbial proteins in extreme environments (deep-sea vents, salt flats, acid lakes) are uncharacterized 'Dark Proteome' orphans. Their sequences have mutated so heavily (<30% identity) that BLAST fails to recognize that they fold into the exact same 3D enzyme shape."
* **What to point out on screen:**
  * Rotate the 3D structure so the viewer sees the physical binding pocket / catalytic motif.
  * Explain why a naive sequence match fails in the wet lab and why atomic-level or multi-constraint physics is mandatory.

---

## Act II (`0:45–1:30`) — Why Duct-Tape Python Pipelines Choke
* **Visual:** Play `manim_scene.py` (`FeatureScene` Part 1) or Act II of `ep04_joint_vector_multiomics.mp4`.
* **Talking Point (Systems Bottleneck):**
  > "In a traditional bioinformatics stack, you pull hundreds of thousands of rows over a TCP socket into Python, deserialize strings into objects, and run $O(N^2)$ loops in user space. 99% of your wall-clock time is spent moving bytes across the wire instead of doing science."

---

## Act III (`1:30–2:45`) — The Systems-to-Biotech Bridge in Rust (`src/lib.rs`)
* **Visual:** Split screen between [`src/lib.rs`](../../src/lib.rs) and `studio_deck.html` (toggle the **Engineer $\leftrightarrow$ Biologist Rosetta Switch**).
* **Talking Point (The CS Insight):**
  > "1280-D halfvec HNSW cosine distance (<=>) narrows 2.34M proteins down to 15 candidates in 0.4 ms, short-circuiting into O(N) two-row Smith-Waterman DP and enriching winners live via bio_fetch_uniprot()."
* **Key Translation for Engineers:**
  * **Systems View:** `1280-D halfvec HNSW cosine distance (<=>) narrows 2.34M proteins down to 15 candidates in 0.4 ms, short-circuiting into O(N) two-row Smith-Waterman DP and enriching winners live via bio_fetch_uniprot().`
  * **Biological View:** `99% of microbial proteins in extreme environments (deep-sea vents, salt flats, acid lakes) are uncharacterized 'Dark Proteome' orphans. Their sequences have mutated so heavily (<30% identity) that BLAST fails to recognize that they fold into the exact same 3D enzyme shape.`

---

## Act IV (`2:45–4:00`) — Live SQL Progress & Benchmark (`live_demo.sql`)
* **Visual:** Terminal running `psql` connected to `pg_bio` (`\i videos/ep04_joint_vector_multiomics/live_demo.sql`).
* **Talking Point (The SQL Proof):**
  1. Run **Stage 1 (The Atomic Primitive)** to show the clean SQL signature.
  2. Run **Stage 2 (The Multi-Constraint Discovery Pipeline)** using `CROSS JOIN LATERAL` so index filtering prunes the search space before heavy physics runs.
  3. Run **Stage 3 (`EXPLAIN (ANALYZE, BUFFERS)`)** and highlight the execution time: **Scans 2.34M proteins in 0.4 ms + Zero external ETL scripts**.

---

## Act V (`4:00–5:00`) — 3D Structural Proof & Call to Action
* **Visual:** Return to `studio_deck.html` (Interactive 3Dmol.js Teaching Stage + Footer).
* **Action:** Click the **"1. Highlight Catalytic Triad / Metal"** and **"2. Show 3D Morton Bounding Pocket"** buttons and read the dynamic chemistry callout.
* **Closing Hook:**
  > "Explore all interactive 3D discoveries at https://ideia.me and star or contribute to the engine at https://github.com/jonatas/pg_bio."
