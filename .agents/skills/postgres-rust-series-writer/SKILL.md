---
name: postgres-rust-series-writer
description: >-
  Use this skill when writing or expanding blog posts in the "PostgreSQL Extension Internals in Rust (pgrx)" series based on pg_bio and spiral. Focuses on C-to-Rust FFI, PostgreSQL storage internals (8KB pages, varlena, TOAST, shared buffers), custom operators, Query Planner optimization, and multidimensional indexing (Z-Order B-Trees, GiST R-Trees, HNSW).
---

# PostgreSQL & Rust (`pgrx`) Systems Series Writer

Use this skill when authoring deep-dive **Database Systems Engineering** blog posts and working papers on `ideia.me`. The goal is to showcase **PostgreSQL kernel internals, C ↔ Rust (`pgrx`) interoperability, custom access patterns, and query planner orchestration** using real production code from `../pg_bio/src/lib.rs` and `spiral`.

## Target Audience
* **Database Engine Companies & Hiring Teams:** Staff/Principal Database Engineers, PostgreSQL hackers, and extension architects (e.g., Timescale, Supabase, Neon, ParadeDB, Tembo, Crunchy Data, AWS).
* **European Computer Science & Bioinformatics PIs:** Professors and research labs evaluating systems design, algorithmic rigor, reproducible benchmarks, and storage-engine innovation.

---

## Series Blueprint & Code Anchors (`../pg_bio/src/lib.rs`)

When asked to write the next installment (or a specific topic) in the PostgreSQL + Rust series, anchor the post in actual implementations from `/Users/jonatas/code/pg_bio/src/lib.rs`:

1. **Part 1: Crossing the C ↔ Rust Boundary in PostgreSQL (`pgrx`, `MemoryContext`, `varlena`, and TOAST)**
   * *Code Anchors:* Custom `#[derive(PostgresType, Serialize, Deserialize)]` types (`ResidueCoord` at `lib.rs:10`, `SparseAttentionMap` at `lib.rs:134`, `Molecule` at `lib.rs:351`, `RangeFinderPocket` at `lib.rs:5604`).
   * *Internals Focus:* How PostgreSQL's hierarchical C `MemoryContext` (`palloc`/`pfree`) interacts with Rust's ownership model; `varlena` headers (`4-byte` aligned vs `1-byte` short headers); when PostgreSQL triggers TOAST compression/out-of-line storage; why `#[pg_extern(immutable, parallel_safe)]` is essential for parallel query plans (`Gather` / `Gather Merge`).

2. **Part 2: Teaching the PostgreSQL Query Planner New Algebra (Custom Operators `@>`, `%`, `<~>` & Filter Pushdown)**
   * *Code Anchors:* `pgrx::extension_sql!` operator definitions (`%` and `@>` for `Molecule` at `lib.rs:1746-1775`, `<~>` hybrid distance at `lib.rs:1881-1905`, `@>` for `RangeFinderPocket` at `lib.rs:6581`).
   * *Internals Focus:* How `CREATE OPERATOR` binds Rust functions (`molecule_tanimoto`, `molecule_contains_molecule`, `pocket_matches_ligand`) into the planner; combining $O(\log N)$ B-Tree hash probes (`molecule_wl_hash`) with hardware `POPCNT` (`u64::count_ones()`) and exact backtracking VF2 subgraph isomorphism (`pgbio_vf2_is_subgraph`, `lib.rs:1437`) as a post-index recheck filter.

3. **Part 3: Zero-Copy Streaming & Set-Returning Functions (`TableIterator` & C `FuncCallContext`)**
   * *Code Anchors:* `generate_theoretical_fragments` (`lib.rs:2176`), `parse_mgf` (`lib.rs:2386`), `parse_vcf` (`lib.rs:2467`), `bio_parse_pdb` (`lib.rs:2591`), `chaperone_core_examples` (`lib.rs:5059`).
   * *Internals Focus:* How PostgreSQL executes Set-Returning Functions (SRFs) across `ValuePerCall` and `Materialize` (`tuplestore`) modes; how `pgrx::iter::TableIterator` turns Rust iterators into streaming SQL tables composable with `LATERAL JOIN` without blowing up backend `work_mem`.

4. **Part 4: Multidimensional Indexing Showdown — Bit-Interleaved Z-Order B-Trees vs. Multi-Column GiST R-Trees**
   * *Code Anchors:* Morton Z-Order 3D bit-interleaving (`split_by_3` & `z_order_encode` at `lib.rs:25-48`), `spiral_zorder` (FNV-1a + Gorilla XOR delta blocks in `spiral`), and 9D `RangeFinderPocket` intervals (`pocket_interval_bounds` at `lib.rs:6530`).
   * *Internals Focus:* Why standard composite B-Trees degrade on multi-attribute range predicates; mapping $\mathbb{R}^3 \to \mathbb{Z}_{64}$ via Morton codes so standard 8KB B-Tree pages preserve spatial locality; when to switch to Multi-Column GiST (`numrange`) R-Trees and how PostgreSQL combines index bitmaps via `BitmapAnd`.

5. **Part 5: Write-Time Canonicalization & Sparse Matrices in Shared Buffers (`SparseAttentionMap` CSR & Hückel Graph Hashing)**
   * *Code Anchors:* SMILES DFS lexer (`pgbio_lex_smiles`, `lib.rs:537`), salt stripping & tautomer normalization (`lib.rs:876`), Hückel $4n+2$ cycle perception (`lib.rs:1134-1338`), Weisfeiler-Lehman 64-bit hash (`lib.rs:1339`), and `SparseAttentionMap` CSR (`lib.rs:135-175`).
   * *Internals Focus:* Moving graph canonicalization to the `INSERT` / generated-column path (the graph equivalent of Unicode `NFC` normalization) to turn NP-hard runtime isomorphism queries into $0.67\text{ ms}$ B-Tree index lookups; storing $N \times N$ matrices in Compressed Sparse Row format inside PostgreSQL shared buffers.

6. **Part 6: In-Database CPU Physics Kernels vs. External GPU Sidecars**
   * *Code Anchors:* Kabsch 3D quaternion superposition (`kabsch_rmsd`, `lib.rs:2823`), double-entry thermodynamic auditing (`audit_mmpbsa_decomposition`, `lib.rs:3385`), Shrake-Rupley SASA (`compute_atomic_sasa`, `lib.rs:4186`), vs. HTTP/GPU folding (`bio_fold_sequence`, `lib.rs:2116`).
   * *Internals Focus:* Why sub-millisecond deterministic linear algebra belongs inside PostgreSQL shared buffers (`36.9x` speedup over Python), while long-running GPU inference must be decoupled from PostgreSQL transaction locks and `SnapshotNow` horizons using domain chunking and asynchronous worker queues.

---

## Mandatory Post Structure & Style Guidelines

Every post written with this skill MUST include:

1. **YAML Frontmatter:**
   ```yaml
   ---
   layout: post
   title: "<Compelling Systems Title: PostgreSQL + Rust Internals + Real Benchmark>"
   date: YYYY-MM-DD HH:MM:SS -0300
   categories: [postgresql, rust, pgrx, database-internals, bioinformatics]
   tags: [postgresql, rust, pgrx, query-planner, btree, gist, pg_bio, internals]
   description: "<1-2 sentence high-signal summary with concrete metrics>"
   mermaid: true
   math: true
   ---
   ```
2. **Series Callout Box at the Top:**
   Link to the companion posts in the **PostgreSQL & Rust Systems Internals Series** (using extensionless permalinks like `/pg-bio-intro`, `/spiral-intro`, `/postgresql-query-planner-rangefinder-gist-bioinformatics-engine`, `/writing-a-hybrid-database-operator-for-biology`, `/indexing-3d-space-like-a-video-game`, `/the-27-hour-index`).
3. **Architecture Mermaid Diagram:**
   Include at least one `{% mermaid %}` diagram illustrating the memory layout (8KB page / `varlena` / CSR), FFI call boundary, or Query Planner execution tree (`Index Scan`, `BitmapAnd`, `Gather Merge`, `Recheck Cond`).
4. **Side-by-Side Rust (`pgrx`) + SQL + `EXPLAIN (ANALYZE, BUFFERS)`:**
   * Show the actual Rust implementation from `pg_bio/src/lib.rs` (explaining the `#[pg_extern]` / `#[derive(PostgresType)]` attributes and memory behavior).
   * Show the declarative SQL query and operator wiring.
   * Show the PostgreSQL execution plan or benchmark comparison table (Execution Time in `ms`, Shared Buffer Hits, Speedup vs. client-side baseline).
5. **Generalizable Takeaway for Any Database Domain:**
   Explicitly include a section explaining how the same pattern applies outside biology (e.g., financial tick-data, IoT telemetry, geospatial collision detection, e-commerce recommendation graphs, or multi-tenant SaaS analytics).
6. **Accessibility (a11y) & Interactive Widgets:**
   If including an interactive HTML/JS simulator (like an 8KB page inspector, Z-Order bit interleaver, or query plan comparator), wrap JS in an IIFE, avoid inline event handlers, support keyboard navigation (`tabindex="0"`, `Enter`/`Space`), and use `aria-live="polite"` for status updates per `AGENTS.md`.
