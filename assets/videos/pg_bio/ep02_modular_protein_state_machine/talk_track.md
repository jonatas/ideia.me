# 🎬 Video Talk Track: The Protein as a Modular State Machine (`Dock -> Cut -> Transform`)
**Layer:** Layers 8, 10, 13 & 14: Domain Pairing, Theozyme Cutters, CSR Allostery & RK4 Cascades  
**Date:** 2026-11-10  
**Benchmark Headline:** 94.9x to 1,513x faster in-database multi-stage screening (0.67 ms vs 1,018 ms)  
**Blog:** [https://ideia.me](https://ideia.me) | **Repository:** [https://github.com/jonatas/pg_bio](https://github.com/jonatas/pg_bio)

---

## Act I (`0:00–0:45`) — The Molecular Hook: Proteins Are Composable Pipelines
* **Visual:** Open `studio_deck.html` — click through the **1D-to-3D Synchronized Segment Architecture Bar** (`Seg 1: DOCK` $\rightarrow$ `Seg 2: LINKER` $\rightarrow$ `Seg 3: CUT / THEOZYME` $\rightarrow$ `Seg 4: TRANSFORM SINK`).
* **Talking Point (Biotech Context):**
  > "Why do software engineers fall in love with synthetic biology the moment they see how proteins actually work? Because a protein is not a monolithic blob—it is a modular pipeline! Evolution snaps together reusable sub-modules: an Anchor domain that docks onto a target surface, a flexible Linker that acts as a mechanical spring and allosteric wire, a catalytic Theozyme core that cuts a chemical bond at a precise 107-degree angle, and a Sink module that transforms or mineralizes the product."
* **What to point out on screen:**
  * Click **Seg 1 (`DOCK`)** through **Seg 4 (`TRANSFORM SINK`)** on the horizontal segment tape to isolate each 3D module in `3Dmol.js`.

---

## Act II (`0:45–1:30`) — Why Monolithic Python Pipelines Miss Segment Mechanics
* **Visual:** Play Act II of `ep02_modular_protein_state_machine.mp4` or `manim_scene.py`.
* **Talking Point (Systems Bottleneck):**
  > "Traditional bioinformatics pipelines make two fatal mistakes. First, they pool an entire multi-domain protein into one average vector—blurring the Docker with the Cutter. Second, they pull gigabytes of 3D coordinates over a TCP socket into Python to check active-site geometry row by row. In `pg_bio`, every segment and every physical stage of the mechanism is a compiled Rust predicate running directly inside PostgreSQL shared buffers."

---

## Act III (`1:30–2:45`) — The 4-Step Catalytic State Machine in Rust (`src/lib.rs`)
* **Visual:** In `studio_deck.html`, scrub through the **4-Step Catalytic Mechanism State Machine** (`Step 1: Dock & Register` $\rightarrow$ `Step 2: Polarize & Arm` $\rightarrow$ `Step 3: 107.8° Bürgi–Dunitz Cut` $\rightarrow$ `Step 4: Allosteric Wire & Sink`).
* **Talking Point (The CS-to-Biotech Bridge):**
  * **Step 1 (`Dock & Register`):** `predict_pocket_ranges()` maps the $10\text{ Å}$ pocket into 9 `numrange` GiST intervals, while `strand_pairing_check()` verifies that the protease $\beta$-strand locks the substrate backbone within $2.4\text{ to }3.6\text{ Å}$ without steric clashes.
  * **Step 2 (`Polarize & Arm`):** `has_coordinated_water_shell(coords, 'ZN', 2.4)` uses 64-bit Morton [`z_order_encode`](../../src/lib.rs) bounding boxes to verify that $\text{Zn}^{2+}$ and general base `GLU16` arm the nucleophilic water molecule.
  * **Step 3 (`107.8° Bürgi–Dunitz Cut`):** `theozyme_rmsd()` runs $4\times 4$ Horn quaternion Jacobi SVD to verify $<0.9\text{ Å}$ superposition, while `bio_angle()` checks the exact $100^\circ\text{–}115^\circ$ orbital attack trajectory onto the scissile carbon.
  * **Step 4 (`Allosteric Wire & Sink Transform`):** `bio_hbond_network()` builds a Compressed Sparse Row (`SparseAttentionMap`) graph of the H-bond wire, and `simulate_cascade_kinetics()` runs a 4th-order Runge-Kutta ODE solver proving how the Sink domain relieves product inhibition ($K_i$).

---

## Act IV (`2:45–4:00`) — Live SQL Execution & Query Plan (`live_demo.sql`)
* **Visual:** Terminal running `psql` connected to `pg_bio` (`\i videos/ep02_modular_protein_state_machine/live_demo.sql`).
* **Talking Point (The SQL Proof):**
  1. Run **Stage 1** to inspect each segment's $\text{GRAVY}$ hydropathy, $\text{pI}$, Shannon entropy, and `PROSITE` catalytic signature.
  2. Run **Stage 2** to execute all 4 steps of the `Dock -> Arm -> Cut -> Transform` state machine in a single `CROSS JOIN LATERAL` query.
  3. Run **Stage 3 (`EXPLAIN (ANALYZE, BUFFERS)`)** across all 8 RosettaCommons Chaperone Core Examples in sub-millisecond time.

---

## Act V (`4:00–5:00`) — 3D Structural Proof & Next-Gen Segment Indices
* **Visual:** Click **"▶ Auto-Play State Machine"** in `studio_deck.html` and toggle between **⚙️ Systems Engineer** and **🧬 Structural Biologist** lenses.
* **Closing Hook:**
  > "When you treat a protein as a segmented state machine inside PostgreSQL, designing a new enzyme becomes a multi-constraint SQL join across modular hardware bricks. Explore all interactive 3D discoveries at https://ideia.me and star the repository at https://github.com/jonatas/pg_bio."
