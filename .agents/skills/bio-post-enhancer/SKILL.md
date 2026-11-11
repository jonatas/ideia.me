---
name: bio-post-enhancer
description: >-
  Use this skill when asked to improve, enrich, or enhance bio or dark proteome blog posts. It provides the exact workflow for combining extremophile biology with PostgreSQL storage internals, Rust (pgrx) C-kernel interoperability, interactive 3D alignments, and academic cross-linking.
---

# Bio & Systems Post Enhancer (`pg_bio`)

This skill outlines the standard operating procedure for upgrading "Dark Proteome" and computational biology blog posts into rich **Systems Research + Structural Biology** working papers suitable for both **Database Systems Engineers / PIs** and **Computational Biology Researchers**.

## Core Positioning Principle
Every discovery on `ideia.me` is proof of a core systems thesis: **pushing sequence alignment, 3D structural superposition, molecular graph hashing, and space-filling curves directly into PostgreSQL's shared buffer manager via Rust (`pgrx`) eliminates external serialization bottlenecks and turns the PostgreSQL Query Planner into a scientific supercomputer.**

* **Independent Home-Lab Attribution Rule:** All discoveries and benchmarks are independent in-database computational experiments run on open scientific datasets (UniProt, PDB, Zenodo, ChEMBL, arXiv). Never claim formal institutional collaboration with external universities or wet-labs (such as UFAL or UFAM)—always frame external papers and datasets as open benchmarks evaluated or reproduced in `pg_bio`.
* Never let a post read like a biology-only article; always showcase the **PostgreSQL + Rust (`pgrx`) database engine mechanics** that made the discovery possible.

---

## Workflow Steps

When tasked with improving or authoring bio discovery posts in `_posts/`, follow this loop for each target markdown file:

### 1. Frontmatter & Metadata Standards
* Ensure `categories` always includes **`postgresql`** and **`rust`** alongside domain tags (e.g., `[bioinformatics, postgresql, rust, pgvector, structural-biology]`).
* Include `mermaid: true` whenever adding query-plan or memory-layout diagrams, and `math: true` whenever LaTeX equations ($\text{RMSD}$, $\text{TM-score}$, cosine distance, Big-$O$ cost) are used.
* Ensure `image:` paths (if present) are relative without a leading slash (`images/...`).

### 2. Research the Organisms & Biophysical Context
* Extract the **Bait** and **Discovery** UniProt IDs and organism names from the post.
* Identify:
  * Where these organisms live (e.g., hypersaline lakes, deep-sea hydrothermal vents, anoxic sediments, acid mine drainage).
  * Unique evolutionary adaptations (e.g., acidic surface shells in halophiles, disulfide clamps, cofactor cages).
  * Why sequence-only BLAST/HMM methods fail in the **Twilight Zone** ($<30\%$ sequence identity) while 3D structure and vector embeddings succeed.

### 3. Enforce the 5-Step "Systems + Biology Monograph Rhythm"
To engage both database systems architects and structural biologists, follow this 5-part structure:

1. **The Systems & Biological Hook (Narrative + Metrics):**
   * Open with the algorithmic or graph-traversal breakthrough (e.g., HNSW connected-component seeding, sub-millisecond in-buffer screening, domain chunking) paired with the extremophile discovery and exact metrics ($\text{C}\alpha\text{ RMSD}$, $\text{TM-score}$, cosine distance `<=>`, `twilight_score`).
2. **The Biophysical Problem (Domain Context):**
   * Explain the environmental survival challenge the organism faces and why this enzyme/domain (`DUF`, catalytic triad, chaperone fold) matters for industrial biocatalysis, bioremediation, or therapeutics.
3. **The Interactive 3D Anchor (Active Exploration):**
   * Preserve the `{% include structural_alignment.html ... %}` tag or interactive 3Dmol.js workbench intact.
   * Explicitly guide the reader to interact with the 3D coordinates (e.g., *"Double-click the 3D viewer below to synchronize cameras or scrub the morphing trajectory..."*).
4. **The Structural & Evolutionary Science (Theory):**
   * Clearly explain the structural invariants preserved across evolution (e.g., secondary structure topology, RosettaCommons Chaperone relative solvent accessibility `bio_rasa`, buried unsatisfied hydrogen bonds, or active-site geometry).
5. **The PostgreSQL + Rust (`pgrx`) Execution Engine (Database Internals):**
   * Show the exact SQL query and explain **how PostgreSQL and Rust executed it under the hood**:
     * **Access Methods & Query Planner:** How `pgvector` HNSW (`<=>`), Morton Z-Order B-Trees (`z_order_encode`), or Multi-Column GiST (`numrange`) pruned 99.9% of rows in shared buffers before exact physics ran.
     * **C ↔ Rust FFI Interop (`pgrx`):** Highlight how compiled Rust functions (`smith_waterman_score`, `kabsch_rmsd`, `bio_rasa`, `evaluate_chaperone_block`, or custom operator `<~>`) are marked `#[pg_extern(immutable, parallel_safe)]`, allowing PostgreSQL parallel background workers to execute zero-copy linear algebra directly over `varlena` tuples in shared memory without Python IPC serialization.

### 4. Academic & Systems Cross-Linking
At the bottom of the post (or in a "Related Systems Research & Discoveries" section), include:
* **1–2 related biological discovery posts** (e.g., similar extremophile or enzyme family).
* **1–2 core PostgreSQL / Systems Architecture monographs**, such as:
  * [PostgreSQL as a Universal Scientific Engine: Query Planner, GiST R-Trees & RangeFinder](/postgresql-query-planner-rangefinder-gist-bioinformatics-engine)
  * [Introducing `pg_bio`: The PostgreSQL Bioinformatics Operating System](/pg-bio-intro)
  * [Writing a Hybrid Database Operator in Rust (`<~>`)](/writing-a-hybrid-database-operator-for-biology)
  * [Indexing 3D Space Like a Video Game (Morton Z-Order B-Trees)](/indexing-3d-space-like-a-video-game)
  * [The 27-Hour Index: HNSW Memory Spilling & Maintenance Work Mem](/the-27-hour-index)
  * [Spiral: Geometry-Aware Multidimensional Storage for PostgreSQL](/spiral-intro)
* Keep or include `{% include pg_bio_promo.md %}` at the footer.

### 5. Validate & Commit
* Run `./scripts/lint_pdb_includes.py` to guarantee no PDB file paths were broken.
* If running in an automated batch loop, commit each enhanced post with a descriptive commit message before moving to the next file.
