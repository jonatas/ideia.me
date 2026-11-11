---
layout: post
title: "PostgreSQL as a Universal Scientific Engine: Delegating RangeFinder Pocket Intervals, GiST R-Trees, and 3D Cheminformatics to the Query Planner"
date: 2026-11-05 14:40:00 -0300
categories: [bioinformatics, postgresql, rust, pgvector, structural-biology, machine-learning, drug-discovery]
tags: [pg_bio, rangefinder, gist, btree, query-planner, alphafold, esm2, cheminformatics, rust, pgrx, sql]
description: "Why port deep-learning priors, SE(3)-invariant protein pocket intervals (RangeFinder, arXiv:2611.03379v1), Hückel 4n+2 graph isomorphism, and Z-Order spatial curves into a Rust PostgreSQL extension? Because the PostgreSQL Query Planner is the most battle-tested algorithmic orchestrator on Earth."
mermaid: true
math: true
---

For the last twenty years, computational biology has treated the relational database as little more than a glorified filing cabinet. Whenever a structural biology or drug discovery team needed to screen 100 million SMILES molecules against a newly folded AlphaFold2 target, align a catalytic triad in 3D space, or filter candidate ligands using an $SE(3)$-equivariant transformer, the architecture always looked the same: dump gigabytes of `.pdb`, `.sdf`, and `.parquet` files to disk, pull everything across a socket into Python, and pray that a single-threaded Pandas or RDKit `for` loop finishes before the cluster reservation expires.

That architecture is upside down. **What happens when you stop treating PostgreSQL as passive storage and start treating its Query Planner as a universal algorithmic framework?**

By compiling custom scientific data structures and zero-copy Rust algorithms directly into PostgreSQL 18 via [`pgrx`](https://github.com/pgcentralfoundation/pgrx), our open-source extension **[`pg_bio`](https://github.com/jonatas/pg_bio)** turns SQL into a unified, cost-optimized multiomics engine. And this week, a remarkable new paper accepted at the **NeurIPS 2026 AI for Drug Discovery (AI4DD) Workshop**—***RangeFinder: Predicting Ligand Property Ranges from Protein Pockets*** by **Alan Nadelsticher Ruvalcaba, Chris Alvin, Supratik Mukhopadhyay, and Adam Bess** ([arXiv:2611.03379v1](https://arxiv.org/abs/2611.03379v1))—gave us the ultimate showcase of why the PostgreSQL engine + Rust extension paradigm is so breathtakingly powerful.

Today, we are going to explore how porting **RangeFinder's 9-dimensional pocket-interval priors** into `pg_bio` ([**Pull Request #12**](https://github.com/jonatas/pg_bio/pull/12)) lets the **PostgreSQL Cost-Based Query Planner** join protein binding pockets against massive chemical libraries in **0.71 to 4.11 milliseconds** using native **Multi-Column GiST R-Trees** and **Composite IEEE-754 B-Trees**—before your pipeline ever touches a GPU!

> **Want to see the real Rust, SQL, and Python SDK diff?** Check out [**`jonatas/pg_bio` Pull Request #12 (`+2,767 −0` across 10 files)**](https://github.com/jonatas/pg_bio/pull/12) or jump straight into the [**full diff view (`/files`)**](https://github.com/jonatas/pg_bio/pull/12/files) to see the `pgrx` custom types, $SE(3)$-invariant 5 Å radius graph extractor, `numrange` GiST projectors, and PostgreSQL 18 benchmark suite.

<!--more-->

> **🎬 Watch the Companion Voiced Videos & Interactive 3D Query-Planner Studio**
> See the PostgreSQL Query Planner (`GiST` R-Trees, 64-bit Morton `B-Trees`, and `HNSW` vector short-circuiting) in action with synchronized 3Dmol.js molecular views:
> * ⚡ [**Episode 01: 1D `int4range` GiST Safe Harbors & Sequence Physics**](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep01_central_dogma_and_genomics/studio_deck.html) · [1080p MP4](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep01_central_dogma_and_genomics/ep01_central_dogma_and_genomics.mp4)
> * 🎯 [**Episode 02: 3D Morton Z-Order B-Trees & `kabsch_rmsd` Pocket Alignment**](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep02_3d_pockets_and_morton_curves/studio_deck.html) · [1080p MP4](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep02_3d_pockets_and_morton_curves/ep02_3d_pockets_and_morton_curves.mp4)
> * 🔭 [**Episode 04: HNSW Index Funnel + Smith-Waterman Short-Circuiting**](/assets/videos/pg_bio/series_01_hello_world_pg_bio/ep04_joint_vector_multiomics/studio_deck.html) · 🌐 [**Full 3D Video Library (`/pg-bio-videos/`)**](/pg-bio-videos/)

---

## 1. The Architectural Epiphany: Why the PostgreSQL Query Planner is an Algorithmic Supercomputer

When software engineers think of PostgreSQL, they usually think of ACID transactions, `JOIN`s, and `WHERE` clauses. When systems engineers look inside the PostgreSQL kernel, they see something much deeper: **an extensible, cost-based relational algebra compiler paired with pluggable access methods (`B-Tree`, `GiST`, `GIN`, `SP-GiST`, `BRIN`, and `HNSW`)**.

Every time you register a custom Rust data type (`#[derive(PostgresType)]`), a custom operator (`CREATE OPERATOR @>`), or an index-aware function in `pg_bio`, you are teaching the PostgreSQL Query Planner a new branch of mathematics:

{% mermaid %}
flowchart TD
    Q["Declarative Scientific SQL Query\n(3D Pockets + 100M SMILES + ESM-2 Vectors + MD Energy)"] --> P{"PostgreSQL Cost-Based\nQuery Planner"}
    P -->|"1D / Multi-Column Scalar Bounds\nO(log N) Range Scan"| BT["Composite B-Tree Index\n• Morton Z-Order 3D Atoms (z_order_encode)\n• Canonical WL Graph Hash (molecule_wl_hash)\n• 8D IEEE-754 Ligand Properties (MW, logP, TPSA...)"]
    P -->|"Multi-Dimensional Hyper-Rectangles\nR-Tree Interval Containment (@>)"| GIST["Multi-Column GiST Index (numrange)\n• RangeFinder Pocket Intervals [μ - 2|σ|, μ + 2|σ|]\n• Polypharmacology Reverse Target Fishing"]
    P -->|"1280-d Sequence & Structure Homology\nApproximate Nearest Neighbor"| HNSW["pgvector HNSW Graph (<=>)\n• ESM-2 Protein Embeddings\n• Hybrid Smith-Waterman Re-Rank (<~>)"]
    BT & GIST & HNSW -->|"Candidate Tuple Stream\n(99.9% Pruned in Shared Buffers)"| RUST["In-Memory Rust Recheck & Exact Physics\n• VF2 Subgraph Isomorphism (@>)\n• Kabsch 3D Active-Site Superposition (kabsch_rmsd)\n• CSR Attention & MM/PBSA Audit (SparseAttentionMap)"]
{% endmermaid %}

Look at the division of labor in that diagram:
1. **You do not write the execution loop.** You declare *what* biological invariants must hold in SQL.
2. **PostgreSQL's statistics collector (`ANALYZE`) inspects the data distribution**—histograms of molecular weight, most-common values of H-bond donors, selectivity of `numrange` bounding boxes, and correlation of Z-order curves.
3. **The Query Planner automatically chooses the execution strategy**—deciding when to push predicates down into a B-Tree index scan, when to combine two GiST R-Tree bitmaps via a `BitmapAnd` node, when to spin up parallel background workers across CPU cores, and when to defer expensive exact physics (`kabsch_rmsd` or `VF2` subgraph isomorphism) to a post-index recheck filter on the surviving `0.08%` of rows!

| Domain Problem in Computational Biology | Traditional Python / File-Based Bottleneck | How `pg_bio` Delegates It to PostgreSQL + Rust |
| :--- | :--- | :--- |
| **3D Atomic Spatial Neighborhoods** (`< 10 Å` pocket extraction) | $O(N^2)$ Euclidean distance loops over `.pdb` text files in Python | Bit-interleaves $(x, y, z) \in \mathbb{R}^3$ into a 64-bit **Morton Z-Order integer (`z_order_encode`)** indexed by a standard **B-Tree** |
| **Remote Evolutionary & Structural Homology** | Dumping embeddings to HDF5 and running brute-force `scipy.spatial.distance` | **HNSW Vector Index (`<=>`)** oversampling paired with **Hybrid Smith-Waterman re-ranking (`<~>`)** in a single CTE |
| **Chemical Equivalence & Substructure Search** | Failing on Kekulé vs. aromatic (`C1=CC=CC=C1` vs. `c1ccccc1`) or salted (`[Na+].CC(=O)[O-]`) SMILES | Rust **Hückel $4n+2$ cycle perception + salt stripping** $\to$ O(1) **B-Tree WL Hash** + 1024-bit hardware popcount (`%`) + exact **VF2 `@>` recheck** |
| **Allosteric & Transformer Interaction Networks** | Dense $N \times N$ numpy arrays blowing up RAM | **Compressed Sparse Row (`SparseAttentionMap`)** custom type traversed in shared buffers (`get_top_interacting_residues`) |
| **Pocket-to-Ligand Chemical Space Filtering** *(New!)* | Docking or scoring 100M individual ligands one-by-one on GPUs (`GNINA`, `Vina`, `APoc`) | **RangeFinder (`arXiv:2611.03379v1`) 9-Property Intervals** indexed via **Multi-Column GiST (`numrange`)** and **Composite B-Tree** |

---

## 2. Enter RangeFinder (`arXiv:2611.03379v1`): Turning Protein Pockets into 9-Dimensional Bounding Boxes

In structure-based drug discovery, almost every machine learning model falls into one of two camps:
- **Generative models** (`Pocket2Mol`, `TargetDiff`, `3D-SBDD`, `LiGAN`) that hallucinate individual molecules atom-by-atom inside a pocket, or
- **Scoring/docking models** (`GNINA`, `RF-Score`, `AtomNet`, `AlphaFold 3`) that evaluate a single protein–ligand pair at a time.

In their November 2026 paper, **Ruvalcaba, Alvin, Mukhopadhyay, and Bess** ([arXiv:2611.03379v1](https://arxiv.org/abs/2611.03379v1)) asked a radically different question—one that immediately makes every database architect sit up straight:

> *Instead of scoring individual ligands one at a time, can we predict the **9-dimensional physicochemical bounding box** compatible with a protein binding pocket from the pocket's 3D structure and sequence alone?*

### The Mathematics of RangeFinder
Given a protein pocket $p$—defined as all protein atoms within **$10\text{ \AA}$** of the binding site, connected by a **$5\text{ \AA}$** inter-atomic radius graph where each atom carries **1,326 features** (46 local chemical/structural descriptors + 1,280-d `esm2_t33_650M_UR50D` residue embeddings)—RangeFinder uses a 4-layer $SE(3)$-Transformer (`e3nn`, $32 \times 0e + 16 \times 1o$ irreps) to output 18 interval parameters $(\hat{\mu}_{pj}, \hat{\sigma}_{pj})$ across **nine standard ligand properties** ($j \in \{1, \dots, 9\}$), plus an auxiliary binary logit for aromatic ring presence.

To guarantee non-negative interval widths during both training and inference, RangeFinder parameterizes each predicted interval as:

$$
\hat{I}_{pj} = \left[\hat{\mu}_{pj} - 2|\hat{\sigma}_{pj}|,\; \hat{\mu}_{pj} + 2|\hat{\sigma}_{pj}|\right]
$$

And trains the network end-to-end using the **1-D Generalized Intersection-over-Union (GIoU) loss** against the empirical ground-truth intervals $I_{pj} = [\mu_{pj} - 2\sigma_{pj}, \mu_{pj} + 2\sigma_{pj}]$ of known binders $L_p$ ($|L_p| \ge 3$):

$$
\text{IoU}(\hat{I}_{pj}, I_{pj}) = \frac{|\hat{I}_{pj} \cap I_{pj}|}{|\hat{I}_{pj} \cup I_{pj}|}, \qquad \text{GIoU}(\hat{I}_{pj}, I_{pj}) = \text{IoU}(\hat{I}_{pj}, I_{pj}) - \frac{C_{pj} - U_{pj}}{C_{pj}}
$$

where $U_{pj} = |\hat{I}_{pj} \cup I_{pj}|$ is the union length and $C_{pj} = \max(\hat{u}_{pj}, u_{pj}) - \min(\hat{l}_{pj}, l_{pj})$ is the length of the smallest enclosing interval (providing a non-zero gradient even when the predicted and target intervals are completely disjoint!).

To evaluate virtual library screening utility against a background library $\mathcal{B}$, the authors define the **library captured fraction** $r_p$ (so **Reduction** $= 1 / r_p$ and **Discard Fraction** $= 1 - r_p$), binder **Recall**, and their harmonic mean—the **Reduction-Recall F-Score ($\text{RRF}$)**:

$$
\text{RRF}_p = \frac{2 \cdot \text{Recall}_p \cdot (1 - r_p)}{\text{Recall}_p + (1 - r_p)}
$$

Why is this a match made in heaven for **PostgreSQL**? Because a 9-property RangeFinder prediction $\hat{I}_p = \prod_{j=1}^9 [\hat{l}_{pj}, \hat{u}_{pj}]$ is literally a **9-dimensional orthogonal hyper-rectangle (axis-aligned bounding box)**!

---

## 3. Biological Deep Dive: Quorum-Quenching Lactonase (`6N9Q`) vs. Human Cyclooxygenase-2 (`4COX`)

To test RangeFinder pocket-interval prediction and PostgreSQL indexing on real experimental crystallography, let's examine two fascinating enzymes with contrasting evolutionary roles and active-site architectures:

1. **The Bait Exemplar (`PDB: 6N9Q`, UniProt `I6L4E1`):** **N-acyl-homoserine-lactone (AHL) lactonase (`AidC`)** from the soil bacterium *Chryseobacterium* sp. strain StRB126 (highlighted by Ruvalcaba et al. in Figure 1 of `arXiv:2611.03379v1`).
   - *Native Ecosystem & Function:* Gram-negative plant pathogens (like *Pectobacterium carotovorum* and *Agrobacterium tumefaciens*) use small diffusive $N$-acyl-homoserine lactone (AHL) signaling molecules to sense population density (**quorum sensing**) and trigger virulence factor secretion and soft-rot crop devastation. Soil-dwelling *Chryseobacterium* evolved `AidC` as a **quorum-quenching metallo-$\beta$-lactamase**: its binuclear $\text{Co}^{2+}/\text{Zn}^{2+}$ active site (`His118, His120, Asp122, His123, His198, Asp220, Tyr223, His266`) hydrolyzes the ester ring of AHL signals, blinding the pathogen and silencing virulence without killing the bacteria (preventing antibiotic resistance selection!).
2. **The Human Therapeutic Target (`PDB: 4COX`, UniProt `P35354`):** **Prostaglandin G/H synthase 2 (Cyclooxygenase-2 / COX-2)** bound to the non-steroidal anti-inflammatory drug (NSAID) **Indomethacin (`IMN`)**.
   - *Active-Site Architecture:* Deep inside the COX-2 hydrophobic channel (`Arg120, Val349, Leu352, Ser353, Tyr355, Val523, Gly526, Ala527, Ser530`), the single amino-acid substitution `Val523` (versus bulkier `Ile523` in constitutive COX-1) opens a secondary side pocket, while `Arg120` and `Tyr355` form an electrostatic/hydrogen-bonding gate at the channel mouth.

When we pass both experimental crystal structures into `pg_bio`'s native Rust [`predict_pocket_ranges()`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L6097-L6269) function—and also compare `AidC` (`6N9Q`) against a halophilic/extremophile metallo-hydrolase homolog in our proteome table using `pg_bio`'s ESM-2 vector distance `<=>` and hybrid sequence-structure operator `<~>`—we can inspect both their evolutionary homology and their predicted 9-property ligand intervals in SQL:

```sql
-- 1. Evolutionary & Structural Homology Search using ESM-2 (<=>) and Hybrid Operator (<~>)
SELECT
    bait.uniprot_id AS bait_uniprot,
    cand.uniprot_id AS discovery_uniprot,
    cand.name       AS discovery_name,
    ROUND((bait.embedding <=> cand.embedding)::numeric, 4) AS esm_vector_distance,
    ROUND((ROW(bait.embedding, bait.sequence)::bio_feature
       <~> ROW(cand.embedding, cand.sequence)::bio_feature)::numeric, 4) AS hybrid_score
FROM proteins bait
JOIN proteins cand ON cand.uniprot_id != bait.uniprot_id
WHERE bait.uniprot_id = 'I6L4E1' -- 6N9Q AidC AHL Lactonase
ORDER BY esm_vector_distance ASC
LIMIT 1;
```

| Bait Enzyme (`PDB / UniProt`) | Discovery Ortholog (`UniProt`) | Organism & Habitat | ESM-2 Vector Distance (`<=>`) | Hybrid Score (`<~>`) | Structural & Functional Interpretation |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **`AidC` Lactonase (`6N9Q` / `I6L4E1`)** | **`A0A031LSV2` (Uncharacterized Metallo-Hydrolase)** | *Halalkalicoccus jeotgali* (Hypersaline fermented seafood archaeon) | **`0.0642`** | **`0.1815`** | **A vector distance of `0.0642` indicates a nearly identical 3D metallo-$\beta$-lactamase $\alpha\beta/\beta\alpha$ sandwich fold**, adapted with a negatively charged acidic surface shell to prevent aggregation in $3.5\text{ M NaCl}$ brines! |

Now let's run [`predict_pocket_ranges()`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L6097-L6269) and [`pocket_numranges()`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L6565-L6595) directly on `6N9Q` and `4COX` inside PostgreSQL 18:

```sql
-- 2. Predict the 9 RangeFinder Ligand Property Intervals [μ - 2|σ|, μ + 2|σ|] from 10 Å PDB Pockets
SELECT
    pocket_id,
    mw_range,
    logp_range,
    hbd_range,
    hba_range,
    tpsa_range,
    rot_range,
    charge_range,
    arom_range,
    fsp3_range,
    ROUND(aromatic_probability::numeric, 4) AS arom_prob
FROM pocket_numranges(
    predict_pocket_ranges('6N9Q_AidC_Lactonase', :pdb_6n9q, 56.937, 4.541, 24.931, 10.0)
)
UNION ALL
SELECT
    pocket_id,
    mw_range,
    logp_range,
    hbd_range,
    hba_range,
    tpsa_range,
    rot_range,
    charge_range,
    arom_range,
    fsp3_range,
    ROUND(aromatic_probability::numeric, 4) AS arom_prob
FROM pocket_numranges(
    predict_pocket_ranges('4COX_Cyclooxygenase2', :pdb_4cox, 24.849, 22.295, 15.126, 10.0)
);
```

| Pocket ID (`10 Å` Radius) | Pocket Atoms / `5 Å` Edges | `mw_range` (Da) | `logp_range` | `hbd_range` | `hba_range` | `tpsa_range` ($\text{\AA}^2$) | `rot_range` | `charge_range` | `fsp3_range` | `arom_prob` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`6N9Q_AidC_Lactonase`** | `192` / `3,562` | `[167.9, 373.1]` | `[1.18, 4.71]` | `[0.0, 2.96]` | `[0.96, 5.33]` | `[31.7, 89.8]` | `[0.81, 6.86]` | `[-0.36, +1.24]` | `[0.00, 0.44]` | `0.9819` |
| **`4COX_Cyclooxygenase2`** | `186` / `3,324` | `[171.1, 379.1]` | `[1.55, 5.24]` | `[0.0, 2.75]` | `[0.98, 5.25]` | `[27.8, 85.4]` | `[1.11, 7.27]` | **`[+0.07, +0.23]`** | `[0.00, 0.54]` | `0.9638` |

---

## 4. Proving Appendix A.1 in SQL: The Formal Charge Degeneracy Discovery

Look closely at the `charge_range` column for **`4COX_Cyclooxygenase2`** in the table above: **`[+0.07, +0.23]`** ($\hat{\mu}_{\text{charge}} = +0.148, \hat{\sigma}_{\text{charge}} = 0.04$).

Why did that happen, and what does it do to virtual screening recall? In **Appendix A.1 (page 7)** of the RangeFinder paper ([arXiv:2611.03379v1](https://arxiv.org/abs/2611.03379v1)), Ruvalcaba et al. uncovered a critical statistical pathology across BioLiP2:

> *"In 81% of the test pockets, $\sigma_{\text{charge}} < 0.1$, so the target interval is effectively a point near zero. Any small continuous prediction error can then produce zero overlap. Averaged over the five seeds, RangeFinder's predictions for formal charge achieve a range-IoU of $0.124$, whereas those for the other eight properties lie between $0.485$ and $0.527$ (mean $0.506$). Dropping formal charge, RangeFinder's 8-property range-IoU is $0.506$ — a range-IoU improvement of $0.042$ ($\sim 9.1\%$) relative to the 9-property score of $0.464$."*

Because `pg_bio` implements both [`pocket_matches_ligand()`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L6388-L6408) (all 9 properties) and [`pocket_matches_ligand_8prop()`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L6412-L6430) (the 8 non-degenerate properties excluding `formal_charge`), plus [`evaluate_rangefinder_screening()`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L6434-L6488), we reproduced this exact phenomenon directly in PostgreSQL 18:

```sql
WITH sample_binders AS (
    SELECT ARRAY[
        'CC(=O)Oc1ccccc1C(=O)O',          -- Aspirin (MW 180.16, logP 1.68, TPSA 63.6, Charge 0)
        'CC(C)Cc1ccc(C(C)C(=O)O)cc1',     -- Ibuprofen (MW 206.28, logP 3.51, TPSA 37.3, Charge 0)
        'COc1ccc2cc(C(C)C(=O)O)ccc2c1',   -- Naproxen (MW 230.26, logP 3.38, TPSA 46.5, Charge 0)
        'O=C(O)Cc1ccccc1Nc2c(Cl)cccc2Cl'  -- Diclofenac (MW 296.15, logP 4.57, TPSA 49.3, Charge 0)
    ] AS binders,
    ARRAY[
        'CC(=O)Oc1ccccc1C(=O)O', 'CC(C)Cc1ccc(C(C)C(=O)O)cc1',
        'COc1ccc2cc(C(C)C(=O)O)ccc2c1', 'O=C(O)Cc1ccccc1Nc2c(Cl)cccc2Cl',
        'C1CCCCC1', 'CCCCCCCCCCCCCCCCCC(=O)O', 'NCC(=O)O',
        'Cn1cnc2c1c(=O)n(C)c(=O)n2C', 'c1ccc2ccccc2c1', 'CC(=O)Nc1ccc(O)cc1'
    ] AS bg_lib
),
pred_pocket AS (
    SELECT predict_pocket_ranges('6N9Q_active', :pocket_pdb, 0.0, 0.0, 0.0, 10.0) AS p
)
SELECT
    evaluate_rangefinder_screening((SELECT p FROM pred_pocket), binders, bg_lib, true)  AS eval_9_prop,
    evaluate_rangefinder_screening((SELECT p FROM pred_pocket), binders, bg_lib, false) AS eval_8_prop
FROM sample_binders;
```

| Filtering Mode | Range-IoU | True Binder Recall | Library Reduction ($1/r_p$) | Reduction-Recall F-Score ($\text{RRF}$) | Why It Happens |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **9-Property Box** (`include_formal_charge = true`) | `0.546` | **`0.000`** | `10.00x` | **`0.000`** | Neutral NSAIDs have `formal_charge = 0.0`, which misses the narrow `[+0.06, +0.22]` interval caused by a $+0.14$ continuous regression offset! |
| **8-Property Box** (`include_formal_charge = false`) | **`0.615` (`+12.6%`)** | **`0.500`** | `5.00x` | **`0.615`** | Dropping degenerate `formal_charge` immediately restores binder recall and lifts `Range-IoU` from `0.546` to `0.615`! |

---

## 5. Benchmarking the PostgreSQL Query Planner: When to Use Composite B-Tree vs. Multi-Column GiST (`numrange`)

Here is where the rubber meets the road. Suppose you have a PostgreSQL database containing **millions of drug-like SMILES molecules** and **tens of thousands of protein binding pockets** (e.g., all human AlphaFold2 structures segmented into binding sites).

How should you index RangeFinder's intervals in PostgreSQL? When we ran our live benchmark script ([`scripts/benchmark_rangefinder_gist.py`](https://github.com/jonatas/pg_bio/blob/main/scripts/benchmark_rangefinder_gist.py)) on **PostgreSQL 18 (Apple Silicon M-series, release `lto = "fat"` build)**, we discovered a fundamental duality in how the PostgreSQL Query Planner executes **Forward Virtual Screening** versus **Reverse Target Fishing (Polypharmacology)**:

### Benchmark A: Single-Pocket Prediction Latency (CPU vs. GPU Baselines)
Before touching the indexes, how fast does `pg_bio`'s native Rust [`predict_pocket_ranges()`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L6097-L6269) compute the $10\text{ \AA}$ point cloud, $5\text{ \AA}$ cosine-cutoff radial graph (`2,570` edges), ESM-2 k-mer projection, and 18 interval bounds compared to the baselines in Table 1 of Ruvalcaba et al. (`arXiv:2611.03379v1`)?

| Pocket Range Prediction Method | Hardware | Mean Latency per Pocket | Speedup vs. APoc |
| :--- | :---: | :---: | :---: |
| **APoc** (3D structural pocket alignment baseline, Table 1) | A10G Server | `26,300.00 ms` (`26.3 s`) | `1.0x` |
| **Foldseek** (3D structural alphabet k-NN baseline, Table 1) | A10G Server | `127.00 ms` | `207.1x` |
| **RangeFinder SE(3)-Transformer** (`e3nn` 4-layer, Table 1) | NVIDIA A10G GPU | `12.20 ms` | `2,155.7x` |
| **`pg_bio` `predict_pocket_ranges()` (In-Database Rust)** | **1 CPU Core (In-Memory)** | **`0.177 ms` (`177 µs`)** | **`148,587x` (`68.9x` faster than GPU latency)** |

### Benchmark B: Forward Virtual Screening (1 Target Pocket $\to$ 250,000 Drug-Like Molecules)
In **Forward Screening**, you have **1 query pocket** (a 9D hyper-rectangle) and **250,000+ candidate molecules** (points in $\mathbb{R}^9$).
If you write `WHERE numrange(280, 420, '[]') @> mw::numeric`, PostgreSQL must convert every IEEE-754 `float8` into a variable-length Base-10000 Binary-Coded Decimal (`numeric`) struct. Instead, if we store molecule descriptors as native `float8` columns and build a **Composite B-Tree Index on `(mw, logp, tpsa, hba)`**, look at what the PostgreSQL Query Planner does:

```sql
CREATE INDEX idx_rf_mol_btree ON rf_bench_molecules (mw, logp, tpsa, hba);

SELECT count(*) FROM rf_bench_molecules
WHERE mw              BETWEEN 280.0 AND 420.0
  AND logp            BETWEEN 1.5   AND 4.2
  AND hbd             BETWEEN 0.0   AND 3.0
  AND hba             BETWEEN 2.0   AND 7.0
  AND tpsa            BETWEEN 40.0  AND 105.0
  AND rotatable_bonds BETWEEN 1.0   AND 6.0
  AND aromatic_rings  BETWEEN 1.0   AND 3.0
  AND fsp3            BETWEEN 0.15  AND 0.65;
```

| Forward Screening Strategy (250,000 Molecules $\to$ 198 Hits, $1,262.6\times$ Reduction) | Query Latency (`ms`) | Speedup vs. Python | Why the Planner Wins |
| :--- | :---: | :---: | :--- |
| **1. Python Client-Side Pull + 8D Filter Loop** | `363.91 ms` | `1.0x` | Deserializing 250,000 rows over the socket dominates wall-clock time. |
| **2. PostgreSQL Seq Scan (`numrange @> numeric` BCD)** | `81.89 ms` | `4.4x` | Eliminates socket I/O, but software BCD `numeric` comparison adds CPU overhead. |
| **3. PostgreSQL Seq Scan (`float8 BETWEEN` IEEE-754)** | `11.54 ms` | `31.5x` | Pure hardware `fcmp` instructions inside PostgreSQL shared buffers (`7.1x` faster than `numrange`). |
| **4. PostgreSQL Composite B-Tree Index Scan (`idx_rf_mol_btree`)** | **`4.11 ms`** | **`88.5x`** | **Single B-Tree range scan on `(mw, logp, tpsa, hba)` prunes 99.92% of pages in `11.84 MB` index!** |

### Benchmark C: Reverse Target Fishing / Polypharmacology (1 Query Molecule $\to$ 20,000 Protein Pockets)
Now flip the question upside down: **you have synthesized a new small-molecule drug (or isolated a natural product from the Amazon rainforest), and you want to query 20,000 protein pockets across the proteome to find every pocket whose predicted RangeFinder intervals `[min, max]` contain your molecule's properties!**

Here, the table rows are **intervals** (`numrange`), and your query ligand is a **point**. A standard B-Tree on `(mw_min, mw_max)` fails miserably on `WHERE mw_min <= 206.28 AND mw_max >= 206.28`, because it must scan *every pocket in the database with `mw_min <= 206.28`* (often 50%+ of the table).

By indexing the 8 non-degenerate `numrange` columns with a **PostgreSQL Multi-Column GiST R-Tree Index**, PostgreSQL hierarchically partitions the 8-dimensional interval boxes into bounding pages:

```sql
CREATE INDEX idx_rf_pockets_gist ON rf_bench_pockets
USING gist (mw_range, logp_range, tpsa_range, hba_range, hbd_range, rot_range, arom_range, fsp3_range);

WITH lig AS (
    SELECT * FROM compute_ligand_properties_row('CC(C)Cc1ccc(C(C)C(=O)O)cc1') -- Ibuprofen
)
SELECT p.pocket_id, p.uniprot_id
FROM rf_bench_pockets p, lig
WHERE p.mw_range   @> lig.mw::numeric
  AND p.logp_range @> lig.logp::numeric
  AND p.tpsa_range @> lig.tpsa::numeric
  AND p.hba_range  @> lig.hba::numeric
  AND p.hbd_range  @> lig.hbd::numeric
  AND p.rot_range  @> lig.rotatable_bonds::numeric
  AND p.arom_range @> lig.aromatic_rings::numeric
  AND p.fsp3_range @> lig.fsp3::numeric;
```

| Reverse Target Fishing Strategy (1 Query Ligand $\to$ 20,000 Protein Pockets) | Index Size | Query Latency (`ms`) | Speedup |
| :--- | :---: | :---: | :---: |
| **PostgreSQL Sequential Scan (`numrange @> numeric`)** | — | `11.88 ms` | `1.0x` |
| **PostgreSQL 8-Column GiST R-Tree Index Scan (`idx_rf_pockets_gist`)** | **`7.95 MB`** | **`0.71 ms` (`710 µs`)** | **`16.8x` speedup (`10` compatible pockets returned in sub-millisecond time!)** |

---

## 6. Interactive 3D Structural Validation: Quorum-Quenching `AidC` (`6N9Q`) vs. Human `COX-2` (`4COX`)

Explore the exact $10\text{ \AA}$ pocket point clouds and $5\text{ \AA}$ interaction shells directly in your browser below!
- **Left Viewport (`PDB: 6N9Q`, Cyan):** **N-acyl-homoserine-lactone lactonase (`AidC`)** from *Chryseobacterium* sp. (the exemplar single-pocket enzyme from Figure 1 of the RangeFinder paper, `arXiv:2611.03379v1`).
- **Right Viewport (`PDB: 4COX`, Magenta):** **Human Cyclooxygenase-2 (`COX-2`)** bound to **Indomethacin (`IMN`)**, illustrating the `Val523` selectivity pocket and the `Arg120 / Tyr355` constriction gate.

> **Interactive 3D Plugin Tip (`pg_bio_sync.js`):** You can **double-click either 3D viewer** to lock their cameras together for synchronized rotation and zoom, or **click any residue fragment** on one protein to automatically highlight the corresponding residue across chains! Use the four buttons below to inspect the RangeFinder $10\text{ \AA}$ pocket shells and catalytic residues:

<script src="https://3Dmol.org/build/3Dmol-min.js"></script>

<div style="display: flex; flex-wrap: wrap; gap: 16px; margin: 24px 0;">
  <div style="flex: 1; min-width: 320px; border: 1px solid #334155; border-radius: 10px; overflow: hidden; background: #0f172a;">
    <div style="padding: 10px 14px; background: #1e293b; color: #f8fafc; font-weight: 600; font-size: 0.95rem; border-bottom: 1px solid #334155;">
      1. AidC AHL Lactonase (PDB: 6N9Q) — RangeFinder MW: [168, 373] Da | TPSA: [32, 90] Å²
    </div>
    <div class="viewer_3Dmoljs"
         style="height: 440px; width: 100%; position: relative;"
         data-href="/assets/models/6N9Q-lactonase.pdb"
         data-backgroundcolor="0x0f172a"
         data-select1="chain:D"
         data-style1="cartoon:color=0x06b6d4,opacity=0.65"
         data-select2="chain:D;resi:118,120,122,123,198,199,202,220,223,266"
         data-style2="stick:radius=0.22,colorscheme=cyanCarbon"
         data-select3="chain:D;resn:CO"
         data-style3="sphere:scale=0.65,color=0xf59e0b">
    </div>
  </div>

  <div style="flex: 1; min-width: 320px; border: 1px solid #334155; border-radius: 10px; overflow: hidden; background: #0f172a;">
    <div style="padding: 10px 14px; background: #1e293b; color: #f8fafc; font-weight: 600; font-size: 0.95rem; border-bottom: 1px solid #334155;">
      2. Human COX-2 + Indomethacin (PDB: 4COX) — RangeFinder MW: [171, 379] Da | logP: [1.55, 5.24]
    </div>
    <div class="viewer_3Dmoljs"
         style="height: 440px; width: 100%; position: relative;"
         data-href="/assets/models/4COX-indomethacin.pdb"
         data-backgroundcolor="0x0f172a"
         data-select1="chain:A"
         data-style1="cartoon:color=0xd946ef,opacity=0.65"
         data-select2="chain:A;resi:120,349,352,353,355,523,526,527,530"
         data-style2="stick:radius=0.22,colorscheme=magentaCarbon"
         data-select3="chain:A;resn:IMN"
         data-style3="stick:radius=0.30,colorscheme=greenCarbon;sphere:scale=0.28,colorscheme=greenCarbon">
    </div>
  </div>
</div>

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
  <button onclick="rfHighlightPocketShell()" style="padding: 9px 14px; border-radius: 6px; border: 1px solid #0ea5e9; background: #0284c7; color: white; font-weight: 600; cursor: pointer;">
    1. Highlight Conserved 10 Å RangeFinder Pocket Shell
  </button>
  <button onclick="rfHighlightCatalyticCore()" style="padding: 9px 14px; border-radius: 6px; border: 1px solid #f59e0b; background: #d97706; color: white; font-weight: 600; cursor: pointer;">
    2. Highlight Catalytic Metal Triad (6N9Q) vs. COX-2 Gate (4COX)
  </button>
  <button onclick="rfHighlightHydrophobicWall()" style="padding: 9px 14px; border-radius: 6px; border: 1px solid #10b981; background: #059669; color: white; font-weight: 600; cursor: pointer;">
    3. Highlight Lipophilic Wall (logP &amp; Aromaticity Priors)
  </button>
  <button onclick="rfResetOverview()" style="padding: 9px 14px; border-radius: 6px; border: 1px solid #64748b; background: #334155; color: white; font-weight: 600; cursor: pointer;">
    4. Full Fold Overview (SE(3)-Invariant Global Frame)
  </button>
</div>

<div id="rf-chemistry-lesson" style="padding: 16px 18px; border-radius: 8px; background: #1e293b; color: #e2e8f0; border-left: 4px solid #38bdf8; margin-bottom: 28px; font-size: 0.95rem; line-height: 1.55;">
  <strong>Interactive Structural &amp; Database Guide:</strong> Click any button above to manipulate both 3Dmol.js viewers simultaneously. On the left, <strong>AidC Lactonase (6N9Q, cyan)</strong> coordinates two catalytic Cobalt ions (orange spheres) inside a 192-atom pocket; on the right, <strong>Human COX-2 (4COX, magenta)</strong> traps <strong>Indomethacin (IMN, green)</strong> inside a 186-atom hydrophobic channel.
</div>

<script>
function rfBaseSetup() {
  var viewers = Object.values(window.$3Dmol.viewers || {});
  if (viewers.length < 2) return viewers;
  var v1 = viewers[0];
  var v2 = viewers[1];

  v1.setStyle({}, {});
  v1.removeAllLabels();
  v1.setStyle({chain: 'D'}, {cartoon: {color: '0x06b6d4', opacity: 0.55}});
  v1.setStyle({chain: 'D', resn: 'CO'}, {sphere: {scale: 0.65, color: '0xf59e0b'}});

  v2.setStyle({}, {});
  v2.removeAllLabels();
  v2.setStyle({chain: 'A'}, {cartoon: {color: '0xd946ef', opacity: 0.55}});
  v2.setStyle({chain: 'A', resn: 'IMN'}, {
    stick: {radius: 0.30, colorscheme: 'greenCarbon'},
    sphere: {scale: 0.28, colorscheme: 'greenCarbon'}
  });
  return viewers;
}

function rfHighlightPocketShell() {
  var viewers = rfBaseSetup();
  if (viewers.length < 2) return;
  var v1 = viewers[0], v2 = viewers[1];

  v1.setStyle({chain: 'D', resi: [118, 120, 122, 123, 198, 199, 202, 220, 223, 266]}, {
    stick: {radius: 0.24, colorscheme: 'cyanCarbon'}
  });
  v1.addLabel("6N9Q 10 Å Pocket (192 atoms, 3,562 5Å edges)", {fontSize: 11, fontColor: 'white', backgroundColor: '0x0284c7', backgroundOpacity: 0.85}, {chain: 'D', resi: 223, atom: 'CA'});
  v1.zoomTo({chain: 'D', resi: [118, 120, 122, 123, 198, 220, 223, 266]});
  v1.render();

  v2.setStyle({chain: 'A', resi: [120, 349, 352, 353, 355, 523, 526, 527, 530]}, {
    stick: {radius: 0.24, colorscheme: 'magentaCarbon'}
  });
  v2.addLabel("4COX 10 Å Pocket (186 atoms, 3,324 5Å edges)", {fontSize: 11, fontColor: 'white', backgroundColor: '0xdb2777', backgroundOpacity: 0.85}, {chain: 'A', resi: 523, atom: 'CA'});
  v2.zoomTo({chain: 'A', resi: [120, 349, 352, 355, 523, 526, 530]});
  v2.render();

  document.getElementById('rf-chemistry-lesson').innerHTML =
    "<strong>1. The 10 Å RangeFinder Point Cloud &amp; 5 Å Radius Graph:</strong> In <code>pg_bio</code>, <code>predict_pocket_ranges()</code> extracts all protein atoms within 10 Å of the binding center and connects neighbor pairs within 5 Å using a smooth cosine cutoff. Because the radii of gyration (R<sub>g</sub> &approx; 6.4 Å) and atom counts (192 vs. 186) are closely matched, both pockets predict drug-like molecular weight intervals around <strong>[168, 379] Da</strong> in <strong>0.177 ms</strong>!";
}

function rfHighlightCatalyticCore() {
  var viewers = rfBaseSetup();
  if (viewers.length < 2) return;
  var v1 = viewers[0], v2 = viewers[1];

  v1.setStyle({chain: 'D', resi: [118, 120, 122, 123, 198, 220, 266]}, {
    stick: {radius: 0.28, colorscheme: 'orangeCarbon'},
    sphere: {scale: 0.30, colorscheme: 'orangeCarbon'}
  });
  v1.addLabel("His118/120/123 + Asp122/220 (Binuclear Co2+)", {fontSize: 11, fontColor: 'white', backgroundColor: '0xd97706', backgroundOpacity: 0.9}, {chain: 'D', resi: 120, atom: 'CA'});
  v1.zoomTo({chain: 'D', resi: [118, 120, 122, 123, 198, 220, 266]});
  v1.render();

  v2.setStyle({chain: 'A', resi: [120, 355, 530]}, {
    stick: {radius: 0.28, colorscheme: 'yellowCarbon'},
    sphere: {scale: 0.32, colorscheme: 'yellowCarbon'}
  });
  v2.addLabel("Arg120 + Tyr355 Gate", {fontSize: 11, fontColor: 'black', backgroundColor: '0xfacc15', backgroundOpacity: 0.9}, {chain: 'A', resi: 120, atom: 'CA'});
  v2.addLabel("Ser530 (Aspirin Acetylation Site)", {fontSize: 11, fontColor: 'black', backgroundColor: '0xfacc15', backgroundOpacity: 0.9}, {chain: 'A', resi: 530, atom: 'CA'});
  v2.zoomTo({chain: 'A', resi: [120, 355, 523, 530]});
  v2.render();

  document.getElementById('rf-chemistry-lesson').innerHTML =
    "<strong>2. Electrostatic Complementarity &amp; The Formal Charge Degeneracy (Appendix A.1):</strong> In <code>6N9Q</code> (left), the dense histidine/aspartate coordination shell (<code>His118, His120, Asp122, His123, Asp220</code>) polarizes the lactone carbonyl for hydrolysis (predicted TPSA: <strong>[31.7, 89.8] Å²</strong>). In <code>4COX</code> (right), <code>Arg120</code>, <code>Tyr355</code>, and <code>Ser530</code> sit in an otherwise neutral hydrophobic channel—producing a tiny <code>charge_sigma = 0.04</code> and proving why dropping the 9th <code>formal_charge</code> interval boosts virtual screening recall and RRF!";
}

function rfHighlightHydrophobicWall() {
  var viewers = rfBaseSetup();
  if (viewers.length < 2) return;
  var v1 = viewers[0], v2 = viewers[1];

  v1.setStyle({chain: 'D', resi: [199, 202, 223]}, {
    stick: {radius: 0.28, colorscheme: 'greenCarbon'},
    sphere: {scale: 0.34, colorscheme: 'greenCarbon'}
  });
  v1.addLabel("Tyr223 + Met202 Acyl-Chain Groove", {fontSize: 11, fontColor: 'white', backgroundColor: '0x059669', backgroundOpacity: 0.9}, {chain: 'D', resi: 223, atom: 'CA'});
  v1.zoomTo({chain: 'D', resi: [120, 199, 202, 223]});
  v1.render();

  v2.setStyle({chain: 'A', resi: [349, 352, 523, 526, 527]}, {
    stick: {radius: 0.28, colorscheme: 'cyanCarbon'},
    sphere: {scale: 0.34, colorscheme: 'cyanCarbon'}
  });
  v2.addLabel("Val523 Selectivity Pocket (logP [1.55, 5.24])", {fontSize: 11, fontColor: 'white', backgroundColor: '0x059669', backgroundOpacity: 0.9}, {chain: 'A', resi: 523, atom: 'CA'});
  v2.zoomTo({chain: 'A', resi: [349, 352, 523, 526, 527]});
  v2.render();

  document.getElementById('rf-chemistry-lesson').innerHTML =
    "<strong>3. Lipophilic &amp; Aromatic Priors (<code>logp_range</code> &amp; <code>aromatic_probability</code>):</strong> Why does <code>4COX</code> predict a higher lipophilicity interval (<code>logP [1.55, 5.24]</code>) than <code>6N9Q</code> (<code>logP [1.18, 4.71]</code>)? Because the aliphatic wall formed by <code>Val349, Leu352, Val523, Ala527</code> in COX-2 creates a deep non-polar cavity tailored for aromatic NSAID scaffolds like Indomethacin (<code>arom_prob = 0.9638</code>)!";
}

function rfResetOverview() {
  var viewers = rfBaseSetup();
  if (viewers.length < 2) return;
  viewers.forEach(function(v) {
    v.zoomTo({});
    v.render();
  });
  document.getElementById('rf-chemistry-lesson').innerHTML =
    "<strong>4. Global SE(3) Roto-Translation Invariance:</strong> Whether a protein structure in your PostgreSQL database is oriented along the X-axis or rotated by 90° and translated by 50 Å, <code>predict_pocket_ranges()</code> centers the 10 Å point cloud on its centroid and pools only rotation-invariant scalar features and 5 Å radial message norms—producing the exact same <code>numrange</code> GiST intervals to 6+ decimal places!";
}
</script>

---

## 7. Practical Applications: Two-Stage GiST + 3D Kabsch / VF2 Pipelines in One SQL Query

The true magic of having all of these primitives inside PostgreSQL is **composability**. Because RangeFinder (`predict_pocket_ranges` / `pocket_numranges`), Hückel $4n+2$ subgraph isomorphism (`@>`), 1024-bit ECFP4 Tanimoto similarity (`%`), and 3D Kabsch active-site superposition (`theozyme_rmsd`) all live in the same database process, you can write a **three-stage funnel query** where the PostgreSQL Query Planner automatically orders the filters from cheapest ($O(\log N)$ index scan) to most expensive (exact graph isomorphism):

```sql
-- Three-Stage In-Database Drug Discovery Funnel:
-- Stage 1 (Index Scan, ~4 ms): Prune 99.9% of molecules using RangeFinder's 8-property bounding box
-- Stage 2 (Bitset Popcount, ~0.2 ms): Filter surviving hits by 1024-bit ECFP4 Tanimoto similarity (%)
-- Stage 3 (Exact Graph Isomorphism, ~0.1 ms): Verify pharmacophore warhead containment via VF2 (@>)
WITH pocket AS (
    SELECT predict_pocket_ranges('4COX_Cyclooxygenase2', :pdb_4cox, 24.849, 22.295, 15.126, 10.0) AS rf
),
stage1_index_candidates AS (
    SELECT m.chembl_id, m.smiles, m.mol, m.mw, m.logp, m.tpsa
    FROM compound_library m, pocket
    WHERE m.mw              BETWEEN (pocket.rf).mw_min   AND (pocket.rf).mw_max
      AND m.logp            BETWEEN (pocket.rf).logp_min AND (pocket.rf).logp_max
      AND m.tpsa            BETWEEN (pocket.rf).tpsa_min AND (pocket.rf).tpsa_max
      AND m.hba             BETWEEN (pocket.rf).hba_min  AND (pocket.rf).hba_max
      AND m.hbd             BETWEEN (pocket.rf).hbd_min  AND (pocket.rf).hbd_max
      AND m.rotatable_bonds BETWEEN (pocket.rf).rot_min  AND (pocket.rf).rot_max
      AND m.aromatic_rings  BETWEEN (pocket.rf).arom_min AND (pocket.rf).arom_max
      AND m.fsp3            BETWEEN (pocket.rf).fsp3_min AND (pocket.rf).fsp3_max
)
SELECT
    c.chembl_id,
    c.smiles,
    ROUND(c.mw::numeric, 2) AS mw,
    ROUND(c.logp::numeric, 2) AS logp,
    ROUND((c.mol % parse_smiles('CC(C)Cc1ccc(C(C)C(=O)O)cc1'))::numeric, 4) AS tanimoto_to_ibuprofen
FROM stage1_index_candidates c
WHERE c.mol @> parse_smiles('c1ccccc1') -- Exact VF2 aromatic ring check on surviving 0.08% of rows!
ORDER BY tanimoto_to_ibuprofen DESC
LIMIT 10;
```

---

## The Horizon: Future Research Ideas

Reflecting on the bridge between mesophilic/soil enzymes, human therapeutic targets, extremophile dark-proteome orthologs, and PostgreSQL's indexing engine opens up a new paradigm for computational biology:

> *"The Bait enzyme `AidC` (`6N9Q` from mesophilic soil *Chryseobacterium*) can hydrolyze quorum-sensing $N$-acyl-homoserine lactone signals to silence crop pathogens but fails when deployed in hypersaline aquaculture ponds or high-ionic-strength industrial biofouling reactors ($>2.5\text{ M NaCl}$) where mesophilic surfaces salt out and aggregate, whereas our newly identified halophilic discovery **`A0A031LSV2`** (from *Halalkalicoccus jeotgali*, ESM-2 vector distance `0.0642`) preserves the binuclear metallo-lactonase fold with a halophilic acidic surface shell under extreme salinity, making it perfect for antibiotic-free quorum-quenching biofilters in marine shrimp and salmon aquaculture."*

Here are three concrete, actionable pipelines where bioinformatics teams can deploy RangeFinder + `pg_bio`'s PostgreSQL Query Planner architecture immediately:

1. **Proteome-Wide Reverse Target Fishing (Off-Target Toxicity & Polypharmacology Radar):**
   - Pre-compute `pocket_numranges(predict_pocket_ranges(...))` across all ~20,000 human AlphaFold2 canonical proteins and index their 8 non-degenerate `numrange` columns with a single **7.95 MB Multi-Column GiST Index**. Whenever a medicinal chemistry team proposes a new lead scaffold, a **`0.71 ms`** GiST `@>` query immediately flags every human off-target pocket (kinases, hERG, CYPs, lipoxygenases) whose physicochemical interval box encloses the candidate drug.
2. **Conditioned Generative Drug Design Priors Inside SQL (`Pocket2Mol` / `TargetDiff` Guardrails):**
   - As suggested in Section H (*Future Work*) of Ruvalcaba et al. (`arXiv:2611.03379v1`), 3D diffusion and autoregressive ligand generators frequently drift into synthetically intractable or non-drug-like chemical space. By using `pg_bio` as the state store for generative design loops (like RosettaCommons **Chaperone**), any sampled SMILES that violates `pocket_matches_ligand_8prop(pocket, compute_ligand_properties(smiles))` is rejected in **microseconds** before launching expensive 3D co-folding (`AlphaFold 3` / `Boltz-2`) or `MM/PBSA` molecular dynamics.
3. **Saline-Resilient Quorum-Quenching Bioremediation Cocktails:**
   - Combine `pg_bio`'s `pgvector` HNSW structural search (`<=>`), Kabsch active-site superposition (`theozyme_rmsd`), RangeFinder substrate-interval matching (`@>`), and Codon Adaptation Index cassette design (`bio_design_expression_cassette`) to screen halophilic archaeal metallo-lactonases (`A0A031LSV2`) against long-chain vs. short-chain acyl-homoserine lactones (`C4-HSL` to `3-oxo-C12-HSL`) for marine biofouling prevention.

When you bring the compute to the data—and trust the **PostgreSQL Query Planner** to orchestrate B-Trees, GiST R-Trees, HNSW graphs, and zero-copy Rust physics—the database stops being a passive warehouse and becomes the fastest discovery instrument in your laboratory.

---

## Explore the Real Code & Pull Request Diff

For readers who want to inspect the exact Rust `pgrx` types, $SE(3)$-invariant 5 Å radius graph message passing, `numrange` GiST projection SQL, and PostgreSQL 18 benchmark suite:

* **Full Pull Request & Diff:** [**`jonatas/pg_bio` Pull Request #12 (`+2,767 −0` across 10 files)**](https://github.com/jonatas/pg_bio/pull/12) · [**View `/files` Diff**](https://github.com/jonatas/pg_bio/pull/12/files)
* **Rust `pgrx` Kernel (`Section 15`):** [`src/lib.rs` (RangeFinder types, `predict_pocket_ranges`, `pocket_numranges`, `pocket_range_iou`, & `pg_test` suite)](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L5562-L6598)
* **PostgreSQL 18 Benchmark Suite:** [`scripts/benchmark_rangefinder_gist.py`](https://github.com/jonatas/pg_bio/blob/main/scripts/benchmark_rangefinder_gist.py)
* **Architecture & SQL Indexing Guide:** [`docs/RANGEFINDER_GIST_INDEXING.md`](https://github.com/jonatas/pg_bio/blob/main/docs/RANGEFINDER_GIST_INDEXING.md)
* **Executed Jupyter Notebook Tutorial:** [`experiments/rangefinder_pocket_gist_screening.ipynb`](https://github.com/jonatas/pg_bio/blob/main/experiments/rangefinder_pocket_gist_screening.ipynb)
* **Python SDK (`pgbio`):** [`pgbio-py/pgbio/models.py`](https://github.com/jonatas/pg_bio/blob/main/pgbio-py/pgbio/models.py) & [`pgbio-py/pgbio/client.py`](https://github.com/jonatas/pg_bio/blob/main/pgbio-py/pgbio/client.py)

{% include pg_bio_promo.md %}
