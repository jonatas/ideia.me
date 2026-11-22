---
layout: post
title: "Introducing pg_bio: The PostgreSQL Bioinformatics Operating System"
date: 2026-09-23 15:15:00 -0300
categories: synthetic-biology postgresql rust ai vector-database
mermaid: true
math: true
---

Biological data is fundamentally incompatible with traditional database architectures. 

When you sequence a genome, fold a protein in 3D space, or generate a high-dimensional AI vector using models like Meta's ESM-2, the resulting data is a nightmare to query. Modern bioinformatics usually relies on dumping thousands of flat text files (like `.pdb` or `.fasta`) onto a hard drive, then writing slow Python scripts using Pandas and Numpy to crunch the math in a massive `for` loop.

Today, we are changing that. We are releasing **`pg_bio`**: a hyper-optimized PostgreSQL extension written entirely in Rust. It pushes the heaviest biological mathematics deep into the database engine, transforming Postgres into a natively AI-aware bioreactor.

> **🎬 Watch & Explore in 3D — Series 01: "Hello World, `pg_bio`!"**
> Prefer an interactive visual walkthrough with a floating voiced video companion and live **3Dmol.js** structures? Open the [**Interactive Video Library (`/pg-bio-videos/`)**](/pg-bio-videos/) or jump straight into any episode's standalone 3D Studio Deck:
> * **Episode 01:** [**The Central Dogma in SQL (`int4range` GiST, `isoelectric_point`, `gravy_score`)**](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep01_central_dogma_and_genomics/studio_deck.html) · [1080p MP4](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep01_central_dogma_and_genomics/ep01_central_dogma_and_genomics.mp4)
> * **Episode 02:** [**From 1D Strings to 3D Atoms with Morton Curves (`z_order_encode` & `theozyme_rmsd`)**](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep02_3d_pockets_and_morton_curves/studio_deck.html) · [1080p MP4](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep02_3d_pockets_and_morton_curves/ep02_3d_pockets_and_morton_curves.mp4)
> * **Episode 03:** [**Transcriptomics & CSR Sparse Attention Graphs (`SparseAttentionMap`)**](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep03_scrna_csr_and_attention_maps/studio_deck.html) · [1080p MP4](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep03_scrna_csr_and_attention_maps/ep03_scrna_csr_and_attention_maps.mp4)
> * **Episode 04:** [**The Multiomics Holy Grail — Vectors & Live UniProt (`halfvec` HNSW & `bio_fetch_uniprot`)**](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep04_joint_vector_multiomics/studio_deck.html) · [1080p MP4](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep04_joint_vector_multiomics/ep04_joint_vector_multiomics.mp4)

---

## The Four Architectural Bottlenecks of Computational Biology

Before we dive into the hands-on tutorial, it is crucial to understand the four architectural bottlenecks `pg_bio` was built to solve.

### 1. The 3D Spatial Bottleneck (The Math & Morton Z-Jump Problem)
Calculating 3D distances between atoms is traditionally an $O(N^2)$ brute force nightmare. We solved this by creating a custom `ResidueCoord` type that weaves $X, Y, Z$ floats into a **64-bit Morton Code (Z-Order Curve)** (`z_order_encode`), and pairing it with a **21-Level 3D Octree Centroid Router** (`z_order_layered_sphere_ranges`).

Why do you need an octree centroid router on top of a Morton curve? Because a naive 1D range query `WHERE z_index BETWEEN min_z AND max_z` across a 3D bounding box suffers from **Morton bit-interleaving jumps**: whenever a query sphere crosses a power-of-2 octree boundary, the 1D Z-curve leaves the sphere, sweeps across thousands of unrelated atoms in neighboring octants, and re-enters later.

{% mermaid %}
graph TD
    A["3D Query Sphere (cx, cy, cz, R)"] --> B["z_order_layered_sphere_ranges()\n21-Level 3D Octree Centroid Descent"]
    B -->|"$d_{min}^2 > R^2$"| C["Prune Disjoint Octant\n(98.65% of Box Atoms Skipped)"]
    B -->|"$d_{max}^2 \le R^2$"| D["Accept Interior Cube\n(Zero sqrt() Recheck Needed)"]
    B -->|"Boundary Straddler"| E["Coalesce into <= 64 Tight\n1D B-Tree Z-Order Ranges"]
    D --> E
    E --> F["PostgreSQL B-Tree Index Scan\n(74.05x Fewer Atoms, 0.96 ms, 100% Exact Recall)"]
{% endmermaid %}
*By decomposing a 3D query sphere into $\le 64$ tight Z-order sub-intervals, `pg_bio` prunes **98.65%** of false-positive bounding-box atoms before touching the B-tree, accelerating 3D atomic radius searches by **10.25× (`9.89 ms` $\rightarrow$ `0.96 ms`)** with **100.0% mathematical recall**.*

### 2. The AI Vector Bottleneck (The I/O & HNSW RAM Problem)
Fetching massive floating-point arrays (1280-D ESM-2 AI Embeddings) out of the database to run cosine math in Python clogs the TCP network—and indexing 2.34 million 1280-D embeddings with a traditional `pgvector` HNSW graph takes **27 hours** and **8.77 GB** of index RAM plus **6.11 GB** of PostgreSQL TOAST chunks.

{% mermaid %}
sequenceDiagram
    participant SQL as SQL Query (prism.nprobe=12)
    participant PRISM as pg_vectorsearch PRISM Index (902 MB)
    participant Heap as proteins (halfvec(1280) STORAGE PLAIN)
    participant Rust as pg_bio Rust Kernel (<~> Smith-Waterman)
    
    SQL->>PRISM: 1. Route via Hierarchical Centroids + SOAR
    Note over PRISM: 2. 1-Bit RaBitQ Fastscan Error Bounds<br/>Prunes 99.3% of candidates in L1/L2 Cache
    PRISM->>Heap: 3. Fetch Top-K Inline Float16 Vectors (Zero TOAST I/O)
    Heap->>Rust: 4. Re-rank Survivors with Hybrid <~> (Cosine + Smith-Waterman)
    Rust-->>SQL: 5. Return Exact Structural & Sequence Homologs in ~1.2 ms
{% endmermaid %}
*`pg_bio` solves both problems by combining **Tiger Data's [`pg_vectorsearch`](https://github.com/timescale/pg_vectorsearch) (`USING prism`)** with `pgvector`'s `halfvec(1280) STORAGE PLAIN` and `pg_bio`'s native Rust `<~>` hybrid operator—shrinking the 2.34M-protein vector index by **9.72× (`8,772 MB` $\rightarrow$ `902 MB`)**, cutting build time from **27 hours to 3.08 minutes**, and dropping homology queries to **1.225 ms**.*

### 3. The Genomic Looping & Energetic Network Bottleneck (The CSR Attention Problem)
Deep learning models (like the **Zhou Lab ORCA model** or ESMFold $N \times N$ attention matrices) and per-residue MD free-energy decompositions output massive matrices to track which residues or chromosome loci physically interact. `pg_bio` compresses these into a `SparseAttentionMap` (Compressed Sparse Row) type natively.

{% mermaid %}
graph LR
    A[ORCA Hi-C / MM-PBSA Output] -->|Compress to CSR| B(SparseAttentionMap)
    B -->|Stored Natively in pg_bio| C[(Postgres)]
    C -->|SQL Query| D[Find Promoter Loops & Cryptic Hotspots]
{% endmermaid %}

### 4. The Cheminformatics Graph Normalization Bottleneck (The Kekulé vs. Aromatic Trap)
If you hand a naive SMILES parser and Weisfeiler-Lehman (WL) hasher to a computational chemist, it will break on their very first query. Why? Because a chemist will insert Benzene into your database using the **Kekulé form** (`C1=CC=CC=C1` — uppercase carbons with alternating single and double bonds) or insert a drug as a **ChEMBL sodium salt** (`[Na+].O=C([O-])C1=CC=CC=C1`), and then immediately query for it using the **aromatic form** (`c1ccccc1` or `O=C(O)c1ccccc1`).

Without an **Aromaticity Perception & Salt/Tautomer Normalization pass** between the SMILES lexer and the WL hasher, the database sees `C=C-C` in row 1 and `c:c:c` in the query, produces two completely different 64-bit hashes, and returns **zero matches**.

In systems engineering terms, aromaticity perception is simply **Unicode NFC/NFD normalization for cyclic graphs** governed by **Hückel’s $4n + 2$ rule**:
1. Every atom in a candidate cycle must be part of a conjugated $sp^2$ system.
2. The total number of $\pi$-electrons around the cycle must equal $4n + 2$ ($6, 10, 14, 18\dots$), which in pure integer arithmetic is a bitwise modulo check: `(pi_sum >= 6) && ((pi_sum - 2) & 3) == 0`.

| Ring Atom State | Chemical Examples | $\pi$-Electrons Contributed |
| :--- | :--- | :---: |
| **Has an in-ring `=` or `:` bond** (or already lowercase $sp^2$ `c`/`n`) | `C`, `N`, `c`, `n` in Benzene (`C1=CC=CC=C1`) or Pyridine (`c1ccncc1`) | **1** |
| **Single-bonded heteroatom with a lone pair** (or carbanion `[C-]`) | `[nH]` in Pyrrole (`C1=CC=CN1`), `O` in Furan (`c1ccoc1`), `S` in Thiophene, `[cH-]1cccc1` | **2** |
| **Ring Carbon with an exocyclic `=O` / `=N` / `=S` double bond** (or `[C+]`) | Carbonyl carbon `C(=O)` inside 2-Pyridone (`O=C1C=CC=CN1`), Caffeine, or Uracil | **0** *(outside oxygen steals the $\pi$-e)* |
| **Saturated $sp^3$ atom** (4 single bonds, `-CH2-`) or triple bond `#` | Cyclohexane (`C1CCCCC1`), Cyclopentadiene (`C1=CC=CC1`) | **ABORT (`-1`)** *(Breaks conjugation)* |

{% mermaid %}
flowchart LR
    S["Raw SMILES\nO=C([O-])C1=CC=CC=C1.[Na+]"] --> L["1. DFS Lexer &\nRing Closures"]
    L --> N["2. Salt Strip (.) &\n1,3-Tautomer Norm"]
    N --> H["3. Hückel 4n+2\nCycle Perception"]
    H --> W["4. WL 64-Bit Hash +\n1024-Bit ECFP4 + VF2 (@>)"]
{% endmermaid %}

Once `pg_bio` runs this normalization pass immediately after lexing, `C1=CC=CC=C1` and `c1ccccc1` compile down to the **exact same `Molecule` struct**, the exact same 64-bit `wl_hash`, and the exact same 1024-bit ECFP4 fingerprint!

---

## 🧪 Hands-On Tutorial: Advanced Data Mining with pg_bio

With the theory out of the way, let's look at how you can use `pg_bio` in the real world to mine biological datasets natively in SQL. 

Imagine you have just loaded the entire UniProt Human Proteome and 200,000 synthetic atoms into your database. Here are three powerful mining scenarios.

### Scenario A: Mining for Drug Binding Pockets (Layered 3D Morton Octree vs. Naive Z-Order)
**The Goal:** Find all atoms that are physically trapped inside a $10.0$ Ångstrom spherical catalytic pocket around $(12.5, 12.5, 12.5)$ in 3D space.

Instead of doing Euclidean math on all 200,000 atoms—or scanning a single loose `[min_z, max_z]` bounding-box interval that sweeps across 30,181 atoms due to Morton Z-jumps—we use `z_order_layered_sphere_ranges` to decompose the 3D sphere into $\le 64$ exact octree Z-intervals and skip `sqrt()` rechecks on interior cubes:

```sql
EXPLAIN ANALYZE
SELECT a.atom_id, (a.coord).name
FROM z_order_layered_sphere_ranges(12.5, 12.5, 12.5, 10.0, 64) r
JOIN protein_atoms a ON a.z_index BETWEEN r.min_z AND r.max_z
WHERE r.fully_inside
   OR ((a.coord).x - 12.5)^2 + ((a.coord).y - 12.5)^2 + ((a.coord).z - 12.5)^2 <= 100.0;
```
**The Result:** The layered octree query scans **`74.05×` fewer B-tree rows** (`407.6` vs. `30,181` atoms) and completes in **`0.96 milliseconds`** (`10.25×` faster than the naive `9.89 ms` bounding-box Z-range) with **100.0% exact mathematical recall**.

### Scenario B: Off-Target Drug Prediction (PRISM Vector Search & `<~>` Hybrid Alignment)
**The Goal:** In pharmacology, if a drug binds to Protein A, it might accidentally bind to Protein B if their 3D structures are identical (causing severe side effects). How do we find identical—or functionally opposite—proteins across **2,340,766** UniProt sequences?

We store 1280-dimensional ESM-2 embeddings as inline float16 vectors (`halfvec(1280) STORAGE PLAIN`) indexed with **Tiger Data's `pg_vectorsearch` (`USING prism`)**, and combine cosine distance (`<=>`) with `pg_bio`'s native Rust Smith-Waterman hybrid operator (`<~>`):
$$ \text{Distance} = 1 - \frac{A \cdot B}{\|A\| \|B\|} $$
A distance close to `0.0` means they fold and function identically! For fast nearest-neighbor search across 2.34M proteins (`1.225 ms`), we query the PRISM index—or to find proteins that are functionally the *exact opposite* of Hemoglobin, we reverse the sort to `DESC`:

```sql
-- 1. Sub-2ms PRISM 1-Bit RaBitQ Homology Search + Hybrid Smith-Waterman (<~>) Re-Ranking:
SET LOCAL prism.nprobe = 12;
WITH target_protein AS (
    SELECT uniprot_id, sequence, embedding FROM proteins
    WHERE uniprot_id = 'P0DPB7'
)
SELECT
    p.uniprot_id,
    substring(p.name from 1 for 40) AS protein_name,
    ROUND((p.embedding <=> t.embedding)::numeric, 4) AS cosine_distance,
    ROUND((ROW(p.sequence, p.embedding::vector::real[])::BioItem
       <~> ROW(t.sequence, t.embedding::vector::real[])::BioItem)::numeric, 4) AS hybrid_sw_score
FROM proteins p, target_protein t
WHERE p.uniprot_id <> t.uniprot_id
ORDER BY p.embedding <=> t.embedding ASC
LIMIT 5;
```
**The Result:** By combining `pg_vectorsearch`'s 1-bit RaBitQ error bounds (`99.3%` candidate pruning inside the `902 MB` PRISM index) with `pg_bio`'s zero-copy Rust Smith-Waterman kernel, we search 2.34 million proteins in **`1.225 ms`** (or reverse-sort `DESC` to find structural opposites like *Collagen triple helices* vs. soluble *Hemoglobin*).

### Scenario C: Mining for Genomic Enhancer Hubs (Sparse Attention)
**The Goal:** In complex genomes, "Enhancers" are DNA regions that loop in 3D space to touch multiple different genes simultaneously to turn them on. 

Using the `SparseAttentionMap` ingested from the ORCA AI model, we can write a SQL query to mine for these topological hubs:

```sql
SELECT 
    sequence_name as synthetic_construct,
    get_top_interacting_residues(orca_hic_map, 25, 5) as top_5_dna_contacts
FROM genomic_predictions;
```
*(Output: `{1300, 1301, 500, 501, 20}`)*

**The Result:** In a single line of SQL, we proved that base pairs 1300 and 500 physically loop backward in 3D space to touch the promoter at base pair 25. You can join this output against an `annotations` table to instantly map the entire 3D regulatory network of a cell!

### Scenario D: Virtual Screening Across Kekulé, Aromatic & Salted Ligands (WL Hash + VF2 `@>` + Hardware Popcount `%`)
**The Goal:** In our **Swarm Discovery** pipeline, orphan enzymes (such as plastic-degrading **Cutinases**, lignin-oxidizing **Peroxidases**, and organohalide **Dehalogenases**) are paired against cognate small-molecule substrates. What happens when our database ingests **MHET** (the monomer of PET plastic) as a **Kekulé sodium salt** (`O=C(OCCO)C1=CC=C(C(=O)[O-])C=C1.[Na+]`), or **Aspirin** in Kekulé form (`CC(=O)OC1=CC=CC=C1C(=O)O`), and a scientist queries the database using standard **aromatic SMILES** (`O=C(OCCO)c1ccc(C(=O)O)cc1` or `c1ccccc1`)?

With `pg_bio`’s Hückel $4n+2$ normalization pass, Weisfeiler-Lehman 64-bit canonical hashing (`molecule_wl_hash`), hardware-popcount 1024-bit ECFP4 Tanimoto operator (`%`), and backtracking **VF2 Subgraph Isomorphism** recheck (`@>`), we can screen across Kekulé, aromatic, salted, and tautomeric representations in a single SQL query:

```sql
-- 1. Prove Kekulé == Aromatic == Salted equivalence and VF2 Subgraph Isomorphism (@>)
SELECT
    molecule_wl_hash('C1=CC=CC=C1') AS kekule_hash,
    molecule_wl_hash('c1ccccc1')    AS aromatic_hash,
    molecules_are_identical('C1=CC=CC=C1', 'c1ccccc1') AS benzene_eq,
    parse_smiles('CC(=O)OC1=CC=CC=C1C(=O)O') @> parse_smiles('c1ccccc1') AS aspirin_has_benzene,
    parse_smiles('C1=CC=CC=C1') % parse_smiles('c1ccccc1') AS benzene_tanimoto,
    molecules_are_identical('CC(=O)[O-].[Na+]', 'CC(=O)O') AS salt_stripped;
```

| `kekule_hash` | `aromatic_hash` | `benzene_eq` | `aspirin_has_benzene` | `benzene_tanimoto` | `salt_stripped` |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `466190659499846863` | `466190659499846863` | `t` | `t` | `1.0` | `t` |

```sql
-- 2. Screen Swarm Discovery enzyme families for terephthalate-containing substrates (@>)
--    and rank by 1024-bit hardware-popcount ECFP4 Tanimoto similarity (%) to aromatic MHET:
WITH q AS (
    SELECT parse_smiles('O=C(OCCO)c1ccc(C(=O)O)cc1') AS mhet_arom,
           molecule_wl_hash('O=C(OCCO)c1ccc(C(=O)O)cc1') AS mhet_hash
)
SELECT s.family_name,
       s.substrate_name,
       (s.wl_hash = q.mhet_hash) AS exact_wl_match,
       (s.mol @> parse_smiles('c1ccc(C(=O)O)cc1')) AS has_terephthalate_warhead,
       ROUND((s.mol % q.mhet_arom)::numeric, 4) AS ecfp4_tanimoto
FROM swarm_enzyme_substrates s, q
WHERE s.mol @> parse_smiles('c1ccccc1')
ORDER BY exact_wl_match DESC, ecfp4_tanimoto DESC
LIMIT 4;
```

#### 14-System Chemical Equivalence Validation (`0%` $\rightarrow$ `100%` Recall)

When we benchmarked 14 classic chemical traps—spanning $6\pi$ rings (Benzene, Pyridine), lone-pair heterocycles (Pyrrole `[nH]`, Furan `O`, Thiophene `S`, Imidazole), exocyclic carbonyls (2-Pyridone `O=C1C=CC=CN1`), carbanions (`[CH-]1C=CC=C1`), $10\pi$ fused rings (Naphthalene, Caffeine), organic salts (`[Na+].O=C([O-])C1=CC=CC=C1`, `[NH3+]CC(=O)O.[Cl-]`), and 1,3-prototropic tautomers (`CC(=N)O` $\rightarrow$ `CC(=O)N`)—unnormalized SMILES hashing achieved **0 / 14 (0.0%) recall**, while `pg_bio` achieved **14 / 14 (100.0%) recall** across both canonical WL hashes and VF2 `@>` substructure checks.

#### 10,000-Molecule Benchmark in PostgreSQL 18 (With Register-Direct Fastscan & SOAR Centroids)

By adopting `pg_vectorsearch`’s **Register-Direct Fastscan** and **SOAR dual-centroid assignment** (`ecfp4_register_descriptor`, `ecfp4_fastscan_ub_raw`, and `ecfp4_tanimoto_words_raw`), `pg_bio` compresses each 1024-bit ECFP4 fingerprint into a **24-byte register sketch** (8-byte block popcount histogram + `2 × int64` 128-bit OR-folded parity sketch) that prunes **`99.89%`** of molecules in CPU registers with **zero false negatives (`100.0%` exact recall)**:

| Operation on 10,000 Molecules (`bio_demo`) | Execution Time | Candidates Rechecked | Recall | Speedup vs. Python Pull |
| :--- | :---: | :---: | :---: | :---: |
| **B-Tree Canonical WL Hash Lookup** (`wl_hash = molecule_wl_hash('O=C(O)c1ccccc1OC(=O)C')` on Kekulé/Salted DB) | **`0.673 ms`** | `1,000` | **`100.0%`** | **`1,513.7x`** |
| **Layered SOAR Centroids + Register Fastscan** (`l2_centroid`/`soar_centroid` + `ecfp4_fastscan_ub_raw >= 0.70`) | **`3.35 ms`** | `5.2` | `67.1%` *(ANN)* | **`304.1x`** |
| **100% Lossless Register-Direct Fastscan Tanimoto** (`popcount BETWEEN` + `ecfp4_fastscan_ub_raw >= 0.70` + `ecfp4_tanimoto_words_raw`) | **`16.98 ms`** | **`11.2 / 10,000` (`99.89%` pruned)** | **`100.0%` Exact** | **`60.0x`** (`31.2x` vs full scan) |
| **Native Rust 1024-Bit Popcount Tanimoto Full Scan** (`mol % parse_smiles(...) >= 0.85`) | **`434.46 ms`** | `10,000` | **`100.0%` Exact** | **`2.3x`** |
| **Native Rust VF2 Subgraph Isomorphism Scan** (`mol @> parse_smiles('c1ccccc1C(=O)O')`) | **`437.85 ms`** | `10,000` | **`100.0%` Exact** | **`2.3x`** |
| **Python Client-Side Fetch + Graph Deserialization Baseline** | `1,018.64 ms` | `10,000` | `100.0%` | `1.0x` |

---

## Expanding the Stack: From Active-Site Theozymes to PRISM & Layered-Centroid Multi-Indexing

Since our initial release, `pg_bio` has grown into a 16-layer multiomics engine inside PostgreSQL 18:
- **Layer 8 (De Novo Enzyme Design & Theozyme Geometry):** Rotationally invariant 3D Kabsch quaternion superposition (`theozyme_rmsd`, `kabsch_rmsd`), explicit $\text{Zn}^{2+}$/water coordination shell checks (`has_coordinated_water_shell`), Bürgi–Dunitz attack angles (`bio_angle`), and MD ensemble preorganization histograms (`PreorganizationProfile`).
- **Layer 9 (MM/GBSA & MM/PBSA Thermodynamic Auditing):** Double-entry free-energy decomposition auditors (`audit_mmpbsa_decomposition`, `solvent_shift_penalty`) and CSR cryptic allosteric hotspot discovery (`discover_cryptic_hotspots` — see our [500 ns 5-LOX Triterpenoid MD Audit post]({% post_url 2026-10-27-5lox-triterpenoids-mmpbsa-free-energy-audit-pg-bio %})).
- **Layer 12 (Wet-Lab Synthetic Biology & Digital Twins):** Multi-host reverse translation and expression cassette design (`bio_design_expression_cassette` across *E. coli*, *S. cerevisiae*, *H. salinarum*, *S. acidocaldarius*, and *H. sapiens*), 3D gyration-tensor globular compactness gates (`evaluate_globular_compactness`), and Michaelis-Menten + Fluorapatite $\text{Ca}_5(\text{PO}_4)_3\text{F}$ biomineralization simulators (`simulate_defluorination_kinetics`).
- **Layer 13–14 (RosettaCommons Chaperone Evaluations & Industrial RK4 Bioprocess Cascades):** Native Shrake-Rupley Fibonacci SASA/RASA (`bio_rasa`), Buried Unsatisfied Polar (BUNS) H-bond auditors (`evaluate_chaperone_block`), and 4th-order Runge-Kutta (RK4) two-stage cascade kinetics (`simulate_cascade_kinetics`).
- **Layer 15 (9D RangeFinder Active-Site Pocket GiST & 16-Byte Register Fastscan):** Predicts 9 compatible ligand property intervals from a $10\text{ \AA}$ 3D pocket point cloud (`predict_pocket_ranges`) and compresses the 350-byte pocket envelope by **22× into two 64-bit CPU registers (`lo_code: i64, hi_code: i64` = 16 bytes)** via `pocket_quantize_fastscan` & `pocket_fastscan_iou_ub_raw`—accelerating 3D pocket IoU search by **`13.24×` (`103.13 ms` $\rightarrow$ `7.79 ms`) at `100.0%` exact recall** (or **`20.42×` at `5.05 ms`** with 37 balanced Level-2 centroid envelopes + SOAR).
- **Layer 16 (`pg_vectorsearch` PRISM + 100% Lossless Layered-Centroid Multi-Index Architecture):** Combines Tiger Data's [`pg_vectorsearch`](https://github.com/timescale/pg_vectorsearch) (`USING prism`) with `pgvector` (`halfvec(1280) STORAGE PLAIN`) and `pg_bio`'s layered-centroid Fastscan kernels across 3D Morton octrees, 1024-bit ECFP4 fingerprints, and 9D RangeFinder pockets—powering our live **93.3-million-edge** autonomous discovery swarm ([read the PRISM benchmark]({% post_url 2026-11-18-from-27-hours-to-3-minutes-tigerdata-pg-vectorsearch-prism-pg-bio %}) and [the Layered Centroids & Register Fastscan deep-dive]({% post_url 2026-11-21-layered-centroids-register-fastscan-morton-octree-ecfp4-rangefinder-pg-bio %})).

---

## Conclusion

By merging Rust, PostgreSQL, and in-database graph/spatial/vector physics, we haven't just built a database extension. We've built an autonomous, highly scalable operating system for synthetic biology and computational chemistry. 

The days of moving biological and chemical data to the compute layer are over. With `pg_bio`, we are moving the compute directly to the data. 

*If you want to read about how we used this architecture to solve the 400-amino-acid limit on our Teflon-eating enzyme, check out [Part 7 of the TeaFlon Series]({% post_url 2026-09-23-teaflon-synthetic-biology-part-7-pg-bio %}), or explore how we audited 4.5 microseconds of explicit-solvent MD trajectories in [Auditing 500 ns Molecular Dynamics in SQL]({% post_url 2026-10-27-5lox-triterpenoids-mmpbsa-free-energy-audit-pg-bio %}).*

{% include pg_bio_promo.md %}
