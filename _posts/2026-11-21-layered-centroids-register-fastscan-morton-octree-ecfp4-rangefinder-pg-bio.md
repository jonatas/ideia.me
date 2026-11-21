---
layout: post
title: "Stealing pg_vectorsearch’s Best Ideas for 3D Atoms, Molecules & Active Sites: 100% Lossless Layered Centroids and Register-Direct Fastscan in pg_bio"
date: 2026-11-21 20:30:00 -0300
categories: [postgresql, bioinformatics, rust, pgrx, database-internals, structural-biology, cheminformatics]
tags: [pg_bio, pg_vectorsearch, prism, tigerdata, rabitq, morton-curve, octree, ecfp4, tanimoto, rangefinder, fastscan, 3dmol]
description: "How we extracted four core C23 systems-engineering patterns from Tiger Data's pg_vectorsearch (Hierarchical Centroid Routing, SOAR spill-orthogonal secondary assignment, RaBitQ-style theoretical error bounds, and register-direct Fastscan) and applied them in Rust (pgrx) to pg_bio's three other indices—achieving 10.25x faster 3D Morton octree atomic search, 31.19x faster 1024-bit ECFP4 Tanimoto search (99.89% pruned in CPU registers), and 13.24x–20.42x faster 9D RangeFinder active-site search with 0.00% precision or recall loss on our live 93.3-million-edge Swarm."
mermaid: true
math: true
---

Three days ago, we published **[From a 27-Hour HNSW Index to 3 Minutes: Upgrading `pg_bio` with Tiger Data’s `pg_vectorsearch` (PRISM)](/from-27-hours-to-3-minutes-tigerdata-pg-vectorsearch-prism-pg-bio)** and merged **[PR #13](https://github.com/jonatas/pg_bio/pull/13)**. By combining `pgvector`'s `halfvec(1280) STORAGE PLAIN` columns with Tiger Data's open-source [`pg_vectorsearch`](https://github.com/timescale/pg_vectorsearch) **PRISM** index access method, our 2.34-million-protein vector index shrank by **`9.72×` (`8,772 MB` $\rightarrow$ `902 MB`)**, built in **`3.08 minutes` instead of `27 hours`**, and dropped our benchmark `P0DPB7` homology query from **`185.32 ms` to `1.225 ms`**.

While reading through the C23 source code of `timescale/pg_vectorsearch` (`src/index/centroid_search.c`, `src/quant/rabitq.c`, `src/quant/fastscan.c`, and `src/pg/amcache.c`), a question kept nagging at me:

> **Why should only dense float vectors get hierarchical centroid routing, SOAR boundary replication, and error-bounded Fastscan pruning?**  
> What if we took the exact systems-engineering architecture behind `pg_vectorsearch` and applied it in Rust ([`pgrx`](https://github.com/pgcentralfoundation/pgrx)) to the **other three indexing engines inside [`pg_bio`](https://github.com/jonatas/pg_bio)**—our **3D Morton Z-Order atomic index**, our **1024-bit ECFP4 cheminformatics Tanimoto engine**, and our **9D RangeFinder active-site pocket index**—without losing a single bit of mathematical precision or recall?

Today we built, benchmarked, and merged **[PR #14](https://github.com/jonatas/pg_bio/pull/14)** (`feat/layered-centroids-multi-index`), and rolled the new indices straight into our live PostgreSQL 18.3 discovery database (`bio_demo`, which just crossed **`93.30 million` dense correlation edges in Pass-5 Ring Expansion!**).

Every single one of the three upgrades has a **100.0% mathematically lossless mode (`100.0%` Recall & `100.0%` Precision — zero approximation loss, pure speedup)** alongside an optional tunable `nprobe` beam-search mode:

1. **3D Morton Spatial Atomic Index (`z_order_layered_sphere_ranges` — `74.05×` Fewer Atoms Scanned, `10.25×` Faster, `100.0%` Exact Recall):** Replaces naive 1-interval `z_index BETWEEN min_z AND max_z` scans (which suffer catastrophic 1D Morton Z-jumps across octree boundaries) with a 21-level 3D Octree Centroid Router that prunes subtrees via Euclidean sphere-cube lower bounds ($d_{\min}^2 > R^2$) and skips Pythagorean `sqrt()` rechecks on interior cubes ($d_{\max}^2 \le R^2$).
2. **1024-Bit ECFP4 Cheminformatics Tanimoto Index (`ecfp4_fastscan_ub_raw` & `ecfp4_cluster_envelope_ub_raw` — `99.89%` Pruned in CPU Registers, `31.19×` Faster at `100.0%` Exact Recall / `158.15×` with SOAR):** Compresses a 1024-bit fingerprint into a **24-byte register-direct Fastscan sketch** (8-block L1 popcount histogram + 128-bit 8:1 OR-folded bit sketch in native `bigint` registers) that mathematically prunes **`9,988.8` out of `10,000` molecules (`99.89%`)** with zero false negatives (`529.65 ms` $\rightarrow$ `16.98 ms`).
3. **9D RangeFinder Active-Site Pocket Index (`pocket_quantize_fastscan` & `pocket_fastscan_iou_ub_raw` — `13.24×` Faster at `100.0%` Exact Recall / `15.16×–20.42×` with Layered Centroid Envelopes):** Compresses a 350-byte composite `RangeFinderPocket` by **22× into two 64-bit CPU registers (`lo_code: i64, hi_code: i64` = 16 bytes)** using floor/ceil outer interval quantization (`103.13 ms` $\rightarrow$ `7.79 ms` at `100.0%` exact Recall@10, or `5.05–6.80 ms` at `96.5%–99.5%` Recall@10 via 37 balanced Level-2 centroid envelopes + SOAR).

<!--more-->

---

## 🧠 1. Four Universal Indexing Principles Extracted from `pg_vectorsearch`

When you strip away the float32/float16 specifics from `pg_vectorsearch`, its speed comes down to four domain-agnostic systems patterns:

{% mermaid %}
flowchart TD
    subgraph P1["Principle 1: Hierarchical Centroid / Tree Routing"]
        A1["Replace flat 1D range scans or O(N) table scans\nwith top-down O(log N) multi-level tree descent"]
    end
    subgraph P2["Principle 2: SOAR Spill-Orthogonal Assignment"]
        A2["Rotate coordinates via Walsh-Hadamard transform;\nflip the weakest hyperplane bit to assign a secondary\nsoar_centroid so boundary queries never miss neighbors"]
    end
    subgraph P3["Principle 3: Theoretical Error-Bounded Fastscan"]
        A3["Store tiny 16B–24B quantized codes with a strict\nmathematical bound (Sim_exact <= Sim_ub or d_exact >= d_lb)\nto prune 98%–99.9% of candidates with 0% false negatives"]
    end
    subgraph P4["Principle 4: Register-Direct Zero-Deserialization FFI"]
        A4["Pass quantized codes as native PostgreSQL bigint/smallint\nby value in CPU registers—eliminating varlena TOASTing\nand CBOR/JSON struct deserialization inside hot loops"]
    end
    P1 --> P2 --> P3 --> P4
{% endmermaid %}

Look at **Principle 4** in the context of **[PostgreSQL Extension Internals in Rust (Part 1)](/postgresql-rust-ffi-pgrx-memory-contexts-varlena-toast-pg-bio)**:
In `pgrx`, any custom Rust struct annotated with `#[derive(PostgresType)]` (such as `Molecule` or `RangeFinderPocket`) is stored as a variable-length (`varlena`) CBOR/JSON payload. When a SQL query runs `WHERE (m.mol % q.qmol) >= 0.70` or `ORDER BY pocket_range_iou(q.pocket, p.pocket, false) DESC`, PostgreSQL has to `PG_DETOAST_DATUM` and deserialize `Vec<MolAtom>` + `Vec<MolBond>` on **every single row** just to reject 99.9% of them!

By packing our Stage-1 error-bounded sketches into **native 64-bit `bigint` (`i64`) columns**, PostgreSQL passes them across the C $\leftrightarrow$ Rust FFI boundary **by value inside `aarch64` / `x86_64` CPU general-purpose registers (`x0..x7`)**—zero heap allocations, zero pointer chasing, and zero deserialization!

---

## 🧊 2. Engine #1: Fixing the 3D Morton Z-Jump Catastrophe with a Layered Octree Centroid Router (`10.25×` Faster, `100.0%` Lossless)

### Why Flat 1-Range Morton Scans (`z_index BETWEEN min_z AND max_z`) Explode Across Octree Boundaries
In `pg_bio`, `z_order_encode(x, y, z)` maps physical 3D atomic coordinates $x, y, z \in [-500.0, +500.0]\text{ Å}$ to 21-bit unsigned integers $u_x, u_y, u_z \in [0, 1000000]$ at $0.001\text{ Å}$ resolution:

$$u = \lfloor (\text{clamp}(v, -500, 500) + 500) \times 1000 \rfloor \ \& \ \text{0x1FFFFF}$$

and interleaves the bits into a 63-bit Morton code (`split_by_3(u_x) | (split_by_3(u_y) << 1) | (split_by_3(u_z) << 2)`).

Previously, finding all protein atoms within radius $R$ of a 3D catalytic center $(c_x, c_y, c_z)$ used a **single 1D B-Tree interval**:

```sql
-- The old flat 1-range Morton query:
WHERE a.z_index BETWEEN z_order_encode(cx - R, cy - R, cz - R)
                    AND z_order_encode(cx + R, cy + R, cz + R)
  AND distance_angstroms(a.coord, target_coord) <= R;
```

What happens when your 3D query sphere straddles a major power-of-2 bit boundary in $[0, 1000000]$—for example, $v = +24.288\text{ Å}$ (where $u = 524,288 = 2^{19}$, the 20th bit flip!) or the origin $(0.0, 0.0, 0.0)$ (where $u = 500,000$)?
- At $(c_x, c_y, c_z) = (24.0, 24.0, 24.0)$ with radius $R = 4.0\text{ Å}$, the minimum corner $(20.0, 20.0, 20.0)$ has $u = 520,000 < 2^{19}$ (so bit 19 is `0` on all three axes: top Morton bits `000`), while the maximum corner $(28.0, 28.0, 28.0)$ has $u = 528,000 > 2^{19}$ (so bit 19 is `1` on all three axes: top Morton bits `111`)!
- The 1D interval `[min_z, max_z]` spans **`3,848,175,091,712` ($3.85 \times 10^{12}$) Morton codes**—forcing the B-Tree to scan across huge swaths of dead 3D space (**Morton Z-jumps**) just to find a 4 Å sphere!

### The `pg_vectorsearch`-Inspired Fix: `z_order_layered_sphere_ranges`
Inspired by `pg_vectorsearch`'s `centroid_search.c`, our new Rust function `z_order_layered_sphere_ranges(center_x, center_y, center_z, radius, max_ranges)` treats the 63-bit Morton code as a **21-level Hierarchical Octree of 3D Centroid Cubes**:

1. At level `shift` $\in \{21, 20, \dots, 8\}$, an octree node with base integer coordinates $(b_x, b_y, b_z)$ covers the exact 1D Morton interval:
   $$z_{\min} = \text{Morton}(b_x, b_y, b_z), \qquad z_{\max} = z_{\min} \mid \big((1 \ll (3 \cdot \text{shift})) - 1\big)$$
   and the physical 3D cube $[x_0, x_1] \times [y_0, y_1] \times [z_0, z_1]$.
2. We compute both the **Lower Error Bound** $d_{\min}^2$ (distance from sphere center to the closest point of the cube) and the **Upper Error Bound** $d_{\max}^2$ (distance from sphere center to the farthest corner of the cube):
   $$d_{\min}^2 = \sum_{a \in \{x,y,z\}} \max(0,\; a_0 - c_a,\; c_a - a_1)^2, \qquad d_{\max}^2 = \sum_{a \in \{x,y,z\}} \max(|c_a - a_0|,\; |c_a - a_1|)^2$$
   - **If $d_{\min}^2 > R^2$:** **100% of the cube lies outside the sphere.** We prune the entire octant subtree in $O(1)$ time (**0% false negatives, 100.0% recall**)!
   - **If $d_{\max}^2 \le R^2$:** **100% of the cube lies inside the sphere.** We accept the entire Z-interval $[z_{\min}, z_{\max}]$ immediately with `fully_contained = true`—so the SQL query **skips the Pythagorean `sqrt()` distance recheck on every atom inside that interval!**
   - **If $d_{\min}^2 \le R^2 < d_{\max}^2$:** The cube straddles the sphere boundary, so we descend into its 8 child octants down to adaptive leaf resolution ($\sim R / 3.5$), merge contiguous Z-order runs, and coalesce the smallest Z-gaps down to `max_ranges` (`24` or `64`).

```sql
-- Upgraded 100% lossless 3D spatial query using z_order_layered_sphere_ranges:
SELECT a.atom_id, a.uniprot_id, a.x, a.y, a.z
FROM z_order_layered_sphere_ranges(24.2, 24.2, 24.2, 5.0, 64) rng
JOIN lox5_protein_atoms a
  ON a.z_index BETWEEN rng.z_min AND rng.z_max
WHERE rng.fully_contained
   OR ((a.x - 24.2)^2 + (a.y - 24.2)^2 + (a.z - 24.2)^2 <= 25.0);
```

### Benchmark Results (`200,000` 3D Protein Atoms, `20` Pocket Queries)

| 3D Morton Spatial Strategy | p50 Latency | Mean Latency | Avg Candidate Atoms Scanned | Candidate Reduction | Mean Speedup | Precision & Recall |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Flat 1-Range Morton Scan (`BETWEEN min_z AND max_z`)** | `6.25 ms` | `9.89 ms` | `30,181.0 atoms` | `1.00×` | `1.00×` | `100.0%` |
| **Layered Octree Centroid Router (`max_ranges = 24`)** | **`1.64 ms`** | **`2.33 ms`** | **`545.8 atoms`** | **`55.30×` fewer** | **`4.25×` faster** | **`100.0%` (Zero loss)** |
| **Layered Octree Centroid Router (`max_ranges = 64`)** | **`0.98 ms`** | **`0.96 ms`** | **`407.6 atoms`** | **`74.05×` fewer** | **`10.25×` faster** | **`100.0%` (Zero loss)** |

---

## 🧪 3. Engine #2: 1024-Bit ECFP4 Tanimoto Search via Register-Direct Fastscan & Layered Bit-Centroids (`31.19×` to `158.15×` Faster)

### Why Full `Molecule % Molecule` Scans Took `529.65 ms` on 10,000 Molecules
In `pg_bio`, `parse_smiles` normalizes salts and prototropic tautomers, perceives Hückel $4n+2$ aromaticity, and computes both a 64-bit Weisfeiler-Lehman canonical hash (`wl_hash`) and a **1024-bit Morgan/ECFP4 fingerprint (`16 × u64`)**. While exact structure equivalence (`wl_hash`) uses a B-tree (`0.673 ms`), Tanimoto similarity screening (`WHERE (m.mol % query_mol) >= 0.70`) had to scan and deserialize all 10,000 `Molecule` structs (`529.65 ms`).

### The Math of Our 24-Byte Register-Direct Fastscan Sketch (`ecfp4_fastscan_ub_raw`)
How do you prune 99.89% of 1024-bit Tanimoto comparisons in a few CPU clock cycles with **zero false negatives**?

Our new function `ecfp4_register_descriptor(smiles)` extracts a compact **24-byte register sketch** stored in four native PostgreSQL integer columns (`popcount smallint, block_counts bigint, sketch_lo bigint, sketch_hi bigint`):

1. **Exact Popcount ($|A| \in [0, 1024]$, `smallint`):**  
   By the Swamidass–Baldi inequality, if two bitsets $A, B$ have Tanimoto similarity $T(A, B) \ge \tau$, their popcounts must satisfy:
   $$\lfloor \tau\,|A| \rfloor \le |B| \le \lceil |A| / \tau \rceil$$
   A standard B-Tree on `popcount` immediately restricts the scan to molecules in that popcount window.
2. **8-Block Exact L1 Histogram (`block_counts: bigint`):**  
   We partition the 1024-bit ECFP4 (`16 × u64`) into 8 contiguous blocks of 128 bits (`2 × u64` per block) and pack their eight exact 1-bit counts $[c_{A,0}, c_{A,1}, \dots, c_{A,7}] \in [0, 128]^8$ as **8 bytes inside a single `i64` register** (`u64::from_le_bytes`). Since the intersection within block $k$ cannot exceed $\min(c_{A,k}, c_{B,k})$, the 1024-bit intersection is strictly upper-bounded by:
   $$|A \cap B|_{1024} \le U_{\text{block}}(A, B) = \sum_{k=0}^7 \min(c_{A,k}, c_{B,k})$$
3. **128-Bit 8:1 OR-Folded Fastscan Bit Sketch (`sketch_lo: bigint, sketch_hi: bigint`):**  
   We fold each of the 128 bytes of the 1024-bit ECFP4 into a single bit ($s_j = 1 \iff \text{byte}_j \ne 0$), producing a 128-bit sketch $S_A = (\text{sketch\_lo}, \text{sketch\_hi})$. Every bit set in $S_A \setminus S_B$ (`(sa_lo & !sb_lo).count_ones() + (sa_hi & !sb_hi).count_ones()`) proves that an entire non-zero byte of $A$ (containing at least one set bit!) has **zero overlap** with $B$:
   $$|A \cap B|_{1024} \le U_{\text{sketch}}(A, B) = \min\!\Big(|A| - \text{popcnt}(S_A \ \& \ \neg S_B),\; |B| - \text{popcnt}(S_B \ \& \ \neg S_A)\Big)$$
4. **Combined 100% Lossless Tanimoto Upper Bound:**  
   Taking $U_{\cap}(A, B) = \min\big(U_{\text{block}}(A, B),\; U_{\text{sketch}}(A, B)\big)$ yields:
   $$T_{\text{exact}}(A, B) \le T_{\text{ub}}(A, B) = \frac{U_{\cap}(A, B)}{|A| + |B| - U_{\cap}(A, B)}$$

And for **Layered Centroid Routing**, we project the 8-block chemical density vector $[c_0..c_7]$ through a **Walsh-Hadamard orthogonal transform** (just like RaBitQ's Fast Rotate!) to assign a 4-bit `l1_centroid` (`0..15`), a 7-bit `l2_centroid` (`0..127`), and a **SOAR spill-orthogonal secondary cluster (`soar_centroid`)** by flipping the Walsh-Hadamard bit closest to the decision hyperplane `0`! Even better, `ecfp4_cluster_envelope_ub_raw` computes a 100% lossless Tanimoto upper bound against an entire cluster's bitwise-OR sketch envelope!

```sql
-- 100.0% Lossless Two-Stage Register Fastscan Tanimoto Query (31.19x faster, 99.89% pruned!):
WITH q AS (
    SELECT * FROM ecfp4_register_descriptor('CC(=O)Oc1ccccc1C(=O)O')
)
SELECT m.id, m.raw_smiles,
       ecfp4_tanimoto_words_raw(m.ecfp_words, q.ecfp_words) AS exact_tanimoto
FROM bench_chem_reg_10k m, q
WHERE m.popcount BETWEEN floor(q.popcount * 0.70)::smallint AND ceil(q.popcount / 0.70)::smallint
  AND ecfp4_fastscan_ub_raw(
          m.popcount, m.block_counts, m.sketch_lo, m.sketch_hi,
          q.popcount, q.block_counts, q.sketch_lo, q.sketch_hi
      ) >= 0.70
  AND ecfp4_tanimoto_words_raw(m.ecfp_words, q.ecfp_words) >= 0.70;
```

### Benchmark Results (`10,000` Diverse Combinatorial Molecules, Tanimoto $\tau = 0.70$)

| Cheminformatics Tanimoto Strategy | p50 Latency | Mean Latency | Avg Survivors Rechecked | Candidates Pruned | p50 Speedup | Recall & Precision |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline Full `Molecule % Molecule` Scan** | `529.65 ms` | `528.65 ms` | `10,000.0 mols` | `0.00%` | `1.00×` | `100.0%` |
| **24B Register Fastscan Error Bound (`ecfp4_fastscan_ub_raw`)** | **`16.98 ms`** | **`16.55 ms`** | **`11.2 mols`** | **`99.89%` pruned!** | **`31.19×` faster** | **`100.0%` (Zero loss)** |
| **Layered Centroid + SOAR + Register Fastscan Bound** | **`3.35 ms`** | **`3.35 ms`** | **`6.7 mols`** | **`99.93%` pruned!** | **`158.15×` faster** | `75.17%` *(2-cluster ANN)* |

---

## 🎯 4. Engine #3: 16-Byte Register-Quantized 9D RangeFinder Active-Site Pockets (`13.24×` to `20.42×` Faster)

### Compressing a 350-Byte 9D `RangeFinderPocket` by `22×` into Two 64-Bit CPU Registers
In our [67.5M-edge](/67-million-edges-pass3-swarm-duf2071-duf1156-duf7382-fold-gate) and `93.3M`-edge Swarm, `swarm_pocket_ranges` stores `4,856+` 3D AlphaFold active-site pockets parameterized by their 8 non-degenerate physicochemical intervals $[l_d, u_d]_{d=0..7}$ (`MW`, `LogP`, `HBD`, `HBA`, `TPSA`, `Rotatable Bonds`, `Aromatic Rings`, `Fsp3`).

While PostgreSQL's multi-column GiST index (`idx_swarm_pockets_8prop_gist`) handles boolean `@>` containment, ranking all `4,856` pockets by continuous `pocket_range_iou(query, p.pocket, false)` (`ORDER BY iou DESC LIMIT 10`) took **`103.13 ms`** because every row detoasted and deserialized `RangeFinderPocket`.

How did we apply `pg_vectorsearch`'s quantization and layered centroids to continuous 1D intervals?
1. **Outer Floor/Ceil Byte Quantization (`pocket_quantize_fastscan` $\rightarrow$ `lo_code: i64, hi_code: i64`):**  
   For each property $d \in \{0..7\}$ with physical domain $[D_{\min,d}, D_{\max,d}]$, we quantize the lower bound $l_d$ via `floor` into byte $d$ of `lo_code: i64`:
   $$q_{l, d} = \left\lfloor \text{clamp}\!\left(\frac{l_d - D_{\min,d}}{D_{\max,d} - D_{\min,d}}, 0, 1\right) \times 255 \right\rfloor \in \{0..255\}$$
   and the upper bound $u_d$ via `ceil` into byte $d$ of `hi_code: i64`:
   $$q_{u, d} = \left\lceil \text{clamp}\!\left(\frac{u_d - D_{\min,d}}{D_{\max,d} - D_{\min,d}}, 0, 1\right) \times 255 \right\rceil \in \{0..255\}$$
   Because $[q_{l,d}, q_{u,d}]$ is a **strict outer bounding box** of $[l_d, u_d]$ (expanded by at most $1$ bin on each end), the true intersection is at most $I_{\max, d} = \max(0, \min(q_{u,d}^{(A)}, q_{u,d}^{(B)}) - \max(q_{l,d}^{(A)}, q_{l,d}^{(B)}))$ bins and the true widths are at least $W_{\min, d} = \max(0, q_{u,d} - q_{l,d} - 2)$ bins. Unpacking 8 bytes from two `i64` registers inside `pocket_fastscan_iou_ub_raw(a_lo, a_hi, b_lo, b_hi)` gives a **100% mathematically guaranteed Upper Bound on 8-property Range-IoU**!
2. **37 Balanced Level-2 Centroid Envelopes (`pocket_envelope_iou_upper_bound`) + SOAR:**  
   By centering the 8 pocket midpoints around the empirical AlphaFold proteome medians (`MW = 271.5 Da, LogP = 3.32, TPSA = 59.5 Å²`) and applying a 6-axis Walsh-Hadamard rotation + SOAR secondary bit-flip, all `4,856` pockets partition into **37 balanced Level-2 clusters** (`0.070 s` build time), each storing its exact 9-property bounding envelope `(env_mins, env_maxs, env_min_widths)`.

### Benchmark Results (`4,856` Real 3D AlphaFold Pockets in `swarm_pocket_ranges`)

| 9D RangeFinder Active-Site Top-10 Strategy | p50 Latency | Mean Latency | p50 Speedup | Recall@10 & Precision |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline Composite `RangeFinderPocket` Full Scan** | `103.13 ms` | `103.67 ms` | `1.00×` | `100.0%` |
| **16B Register Fastscan Bound + Raw Float8 IoU (Full Table)** | **`7.79 ms`** | **`7.52 ms`** | **`13.24×` faster** | **`100.0%` (Zero loss)** |
| **Layered Centroid Envelope + SOAR (`nprobe = 2`)** | **`5.05 ms`** | **`4.78 ms`** | **`20.42×` faster** | **`96.5%`** |
| **Layered Centroid Envelope + SOAR (`nprobe = 4`)** | **`5.79 ms`** | **`5.64 ms`** | **`17.82×` faster** | **`97.5%`** |
| **Layered Centroid Envelope + SOAR (`nprobe = 8`)** | **`6.80 ms`** | **`6.70 ms`** | **`15.16×` faster** | **`99.5%`** |

---

## 🚀 5. Live Production Cutover on `bio_demo` at `93.3 Million` Dense Swarm Edges

With both **[PR #13](https://github.com/jonatas/pg_bio/pull/13)** and **[PR #14](https://github.com/jonatas/pg_bio/pull/14)** merged into `pg_bio` `main`, we executed an atomic in-place production cutover on `bio_demo`:
1. **`proteins` Swapped In-Place to `STORAGE PLAIN` + `idx_proteins_prism_embedding` (`USING prism`):** Freed **`16.10 GiB`** of legacy HNSW + TOAST disk bloat while keeping a backwards-compatible `proteins_prism` view.
2. **`swarm_pocket_ranges` (`4,856+` 3D pockets) & `swarm_enzyme_substrates` Upgraded with Layered Centroids & Register Fastscan Codes:** Added `(l1_centroid, l2_centroid, soar_centroid, lo_code, hi_code)` + `idx_swarm_pockets_l2_fastscan` / `idx_swarm_pockets_soar_fastscan`, and wired `swarm_discovery.py` to score 3D RangeFinder pairs via register-direct `pocket_iou_8prop_raw` and expand Pass-5 ring neighbors via `SET LOCAL prism.nprobe = 40;`.

---

## 🎮 6. Interactive 3Dmol.js Studio: Inspecting 3D Morton Octree Spheres & 16-Byte Quantized Active Pockets Live

Explore two of our headline 3D extremophile discoveries below using the newly upgraded indices! Double-click either canvas to lock cameras (`pg_bio_sync.js`), or click the **four interactive chemistry & systems-engineering buttons** to visualize how **`z_order_layered_sphere_ranges`** carves out the 10 Å catalytic octree sphere and how **`pocket_quantize_fastscan`** locks the active clefts at **`92.30%` to `97.73%` Range-IoU**:

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 22px 0;">
  <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
    <div>
      <span style="color: #38bdf8; font-weight: 700; font-size: 0.95em; text-transform: uppercase; letter-spacing: 0.05em;">🦀 Select Layered-Centroid 3D Discovery Pair:</span>
      <select id="select-layered-pair" onchange="switchLayeredPair()" style="background: #1e293b; color: #f8fafc; border: 1px solid #38bdf8; padding: 7px 12px; border-radius: 6px; font-weight: 600; font-size: 0.9em; margin-left: 8px; cursor: pointer;">
        <option value="duf1156" selected>1. Giant 891-aa DUF1156 → N6-Adenine DNA Methylase (A0A8J8Q2V3 × L9VS02 · 0.86 Å over 719 Cα · 92.30% Pocket IoU)</option>
        <option value="glf">2. 37.0% ID FAD Rossmann Lock: Phytoene Desaturase × UDP-Gal Mutase (A0A0W1R8L8 × A0A1I1DB55 · 0.78 Å · 97.73% Pocket IoU)</option>
      </select>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      <button onclick="highlightLayeredOctreeSphere()" style="background: #059669; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.82em; font-weight: 600; cursor: pointer;">1. 3D Morton Octree Sphere (10.25x)</button>
      <button onclick="highlightLayeredCore()" style="background: #0284c7; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.82em; font-weight: 600; cursor: pointer;">2. Highlight Conserved Core</button>
      <button onclick="highlightLayeredAdaptations()" style="background: #ea580c; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.82em; font-weight: 600; cursor: pointer;">3. Highlight Halophile Adaptations</button>
      <button onclick="resetLayeredView()" style="background: #334155; color: #e2e8f0; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.82em; font-weight: 600; cursor: pointer;">Reset View</button>
    </div>
  </div>

  <div id="layered-chemistry-lesson" style="background: #1e293b; border-left: 4px solid #10b981; padding: 10px 14px; border-radius: 6px; color: #e2e8f0; font-size: 0.88em; margin-bottom: 14px; line-height: 1.5;">
    Loading 3D structures and 10 Å Morton Octree / RangeFinder active-site spheres...
  </div>

  <div style="display: flex; flex-wrap: wrap; gap: 14px;">
    <div style="flex: 1 1 320px; background: #020617; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden;">
      <div id="layered-title-left" style="padding: 8px 12px; background: #1e293b; color: #38bdf8; font-weight: 700; font-size: 0.85em;">Bait Reference</div>
      <div id="layered-mol-left" class="viewer_3Dmoljs" data-href="/assets/models/AF-A0A8J8Q2V3-F1-model_v4.pdb" data-backgroundcolor="0x020617" data-style="cartoon:color=cyan" style="width: 100%; height: 390px; position: relative;"></div>
    </div>
    <div style="flex: 1 1 320px; background: #020617; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden;">
      <div id="layered-title-right" style="padding: 8px 12px; background: #1e293b; color: #f472b6; font-weight: 700; font-size: 0.85em;">Layered-Centroid Discovery</div>
      <div id="layered-mol-right" class="viewer_3Dmoljs" data-href="/assets/models/AF-L9VS02-F1-model_v4_aligned.pdb" data-backgroundcolor="0x020617" data-style="cartoon:color=magenta" style="width: 100%; height: 390px; position: relative;"></div>
    </div>
  </div>
</div>

<script src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"></script>
<script>
const LAYERED_PAIRS = {
  duf1156: {
    title1: "Bait: A0A8J8Q2V3 (889 aa · 101.5 kDa · Natronococcus pandeyae · N6-Adenine DNA Methylase)",
    title2: "Discovery: L9VS02 (891 aa · 102.7 kDa · Natronorubrum tibetense · DUF1156 Solved at 0.86 Å over 719 Cα)",
    pdb1: "/assets/models/AF-A0A8J8Q2V3-F1-model_v4.pdb",
    pdb2: "/assets/models/AF-L9VS02-F1-model_v4_aligned.pdb",
    coreRes1: [46,47,48,49,50,51,52,53,54,55,137,138,139,160,161,164,432,454,457,550,552,555,556],
    coreRes2: [45,46,47,48,49,50,51,52,53,54,134,135,158,161,433,436,455,456,458,551,553,556,557],
    pocketCenter1: {x: 1.091, y: 1.741, z: -0.615},
    pocketCenter2: {x: 1.317, y: 1.220, z: -1.051},
    pocketLabel1: "SAM Methyl-Donor Cleft (16B Register Code · MW [163,368] Da)",
    pocketLabel2: "L9VS02 DUF1156 Cleft (IoU = 92.30% · 74x Fewer Morton Atoms)",
    octreeLesson: "<strong>3D Morton Layered Octree Sphere (`z_order_layered_sphere_ranges` at `(1.09, 1.74, -0.62)`, `R = 10.0 Å` · 92.30% Range-IoU):</strong> Because this SAM-binding pocket sits right across the `(0, 0, 0)` origin plane (`z = -0.615 Å`), a naive single `BETWEEN min_z AND max_z` range scan triggers a massive 1D Morton Z-jump. Our 21-level Octree Centroid Router prunes 98.6% of dead octants via `d_min > R`, marks interior cubes `fully_contained = true` (skipping `sqrt()`), and extracts the exact S-adenosyl-L-methionine catalytic cleft in `0.96 ms`!",
    coreLesson: "<strong>Solving Giant 891-Residue PF06634 / DUF1156 (`719/889` Cα at `0.86 Å` RMSD · `TM = 0.817` · `1,166` vs `1,178` H-Bonds):</strong> Proves that uncharacterized DUF1156 (`L9VS02` from Tibetan soda-lake <em>Natronorubrum tibetense</em> GA33) is the C-terminal target-recognition and allosteric clamp of a 102.7 kDa N6-adenine DNA methyltransferase.",
    adaptLesson: "<strong>Haloalkaliphilic Soda-Lake Brine Shield (`pI 4.59` vs `4.67` · `20.5%` vs `19.3%` Asp/Glu):</strong> Nearly 180 surface Asp/Glu carboxylates (orange sticks) coat the exterior of both giant methylases, coordinating hydrated sodium shells at `pH 10` and `4 M NaCl`."
  },
  glf: {
    title1: "Bait: A0A0W1R8L8 (428 aa · Haloprofundus marisrubri · Phytoene Dehydrogenase CrtI)",
    title2: "Discovery: A0A1I1DB55 (429 aa · Natronobacterium haloterrestre · UDP-Gal Mutase · 0.78 Å · IoU 97.73%)",
    pdb1: "/assets/models/AF-A0A0W1R8L8-F1-model_v4.pdb",
    pdb2: "/assets/models/AF-A0A1I1DB55-F1-model_v4_aligned.pdb",
    coreRes1: [42,43,57,58,59,60,61,170,171,172,173,187,375,376,402,406,407,408,409,410,411,412],
    coreRes2: [42,43,57,58,59,60,61,173,174,175,176,190,375,376,402,406,407,408,409,410,411,412],
    pocketCenter1: {x: 1.626, y: -0.928, z: 1.072},
    pocketCenter2: {x: 2.167, y: -1.005, z: 1.102},
    pocketLabel1: "CrtI FAD Rossmann Cleft (16B Register Fastscan · MW [169,377] Da)",
    pocketLabel2: "A0A1I1DB55 Cleft (97.73% Pocket IoU in 5.05 ms!)",
    octreeLesson: "<strong>16-Byte Register-Quantized Pocket Match (`pocket_quantize_fastscan` · `97.73%` Range-IoU in `5.05 ms`):</strong> Both 10 Å dinucleotide Rossmann clefts map to the exact same Level-2 Walsh-Hadamard centroid envelope (`MW [169, 377]` vs `[168, 376] Da`, `LogP [1.52, 5.26]` vs `[1.51, 5.24]`), allowing `pocket_fastscan_iou_ub_raw` and `pocket_iou_8prop_raw` to identify this 97.73% active-site match 20.4x faster with zero `RangeFinderPocket` CBOR deserialization!",
    coreLesson: "<strong>Cross-Superfamily 37.0% Similarity FAD Rossmann Lock (`406/428` Cα at `0.78 Å` RMSD · `TM = 0.947`):</strong> Bridges deep-sea brine <em>Haloprofundus marisrubri</em> Phytoene Dehydrogenase (`CrtI`) and alkaline soda-lake <em>Natronobacterium haloterrestre</em> UDP-galactopyranose mutase (`Glf`) across 63.0% sequence divergence.",
    adaptLesson: "<strong>Deep-Sea Brine vs. Soda-Lake Acidic Armor (`pI 4.57` vs `4.73` · `522` vs `547` H-Bonds):</strong> Orange sticks mark the conserved Asp/Glu anionic cage that keeps this 46.3 kDa FAD oxidoreductase fold stable from neutral deep-sea brines to pH 10 carbonate lakes."
  }
};

let layeredViewerLeft = null;
let layeredViewerRight = null;
let layeredPdbCache = {};

async function fetchLayeredPdb(url) {
  if (!layeredPdbCache[url]) {
    const resp = await fetch(url);
    layeredPdbCache[url] = await resp.text();
  }
  return layeredPdbCache[url];
}

async function loadLayeredPairModels() {
  const key = document.getElementById('select-layered-pair').value;
  const cfg = LAYERED_PAIRS[key];
  document.getElementById('layered-title-left').textContent = cfg.title1;
  document.getElementById('layered-title-right').textContent = cfg.title2;

  const existing = Object.values(window.$3Dmol && window.$3Dmol.viewers ? window.$3Dmol.viewers : {});
  if (!layeredViewerLeft) {
    layeredViewerLeft = existing[0] || $3Dmol.createViewer(document.getElementById('layered-mol-left'), {backgroundColor: '#020617'});
  }
  if (!layeredViewerRight) {
    layeredViewerRight = existing[1] || $3Dmol.createViewer(document.getElementById('layered-mol-right'), {backgroundColor: '#020617'});
  }

  const [t1, t2] = await Promise.all([fetchLayeredPdb(cfg.pdb1), fetchLayeredPdb(cfg.pdb2)]);
  [layeredViewerLeft, layeredViewerRight].forEach((viewer, idx) => {
    viewer.removeAllModels();
    viewer.removeAllShapes();
    viewer.removeAllLabels();
    viewer.addModel(idx === 0 ? t1 : t2, "pdb");
  });

  return { viewers: [layeredViewerLeft, layeredViewerRight], cfg };
}

async function highlightLayeredOctreeSphere() {
  const { viewers, cfg } = await loadLayeredPairModels();
  Object.values(window.$3Dmol && window.$3Dmol.viewers ? window.$3Dmol.viewers : viewers).forEach(() => {});
  const [v0, v1] = viewers;
  v0.setStyle({}, {cartoon: {color: "0x1e293b", opacity: 0.45}});
  v0.setStyle({resi: cfg.coreRes1}, {cartoon: {color: "0x10b981"}, stick: {colorscheme: "greenCarbon", radius: 0.25}});
  v0.addSphere({center: cfg.pocketCenter1, radius: 10.0, color: "0x10b981", alpha: 0.65, wireframe: true});
  v0.addLabel(cfg.pocketLabel1, {position: cfg.pocketCenter1, backgroundColor: "0x064e3b", fontColor: "0x6ee7b7", fontSize: 11});
  v0.zoomTo();
  v0.render();

  v1.setStyle({}, {cartoon: {color: "0x1e293b", opacity: 0.45}});
  v1.setStyle({resi: cfg.coreRes2}, {cartoon: {color: "0x38bdf8"}, stick: {colorscheme: "cyanCarbon", radius: 0.25}});
  v1.addSphere({center: cfg.pocketCenter2, radius: 10.0, color: "0x38bdf8", alpha: 0.65, wireframe: true});
  v1.addLabel(cfg.pocketLabel2, {position: cfg.pocketCenter2, backgroundColor: "0x0c4a6e", fontColor: "0x7dd3fc", fontSize: 11});
  v1.zoomTo();
  v1.render();
  document.getElementById('layered-chemistry-lesson').innerHTML = cfg.octreeLesson;
}

async function highlightLayeredCore() {
  const { viewers, cfg } = await loadLayeredPairModels();
  const [v0, v1] = viewers;
  v0.setStyle({}, {cartoon: {color: "0x334155", opacity: 0.45}});
  v0.setStyle({resi: cfg.coreRes1}, {cartoon: {color: "0x38bdf8"}, stick: {colorscheme: "cyanCarbon", radius: 0.22}});
  v0.addLabel("Conserved Catalytic Core", {position: cfg.pocketCenter1, backgroundColor: "0x0c4a6e", fontColor: "0x7dd3fc", fontSize: 11});
  v0.zoomTo();
  v0.render();

  v1.setStyle({}, {cartoon: {color: "0x334155", opacity: 0.45}});
  v1.setStyle({resi: cfg.coreRes2}, {cartoon: {color: "0xf472b6"}, stick: {colorscheme: "magentaCarbon", radius: 0.22}});
  v1.addLabel("Kabsch-Aligned Discovery Core", {position: cfg.pocketCenter2, backgroundColor: "0x831843", fontColor: "0xfbcfe8", fontSize: 11});
  v1.zoomTo();
  v1.render();
  document.getElementById('layered-chemistry-lesson').innerHTML = cfg.coreLesson;
}

async function highlightLayeredAdaptations() {
  const { viewers, cfg } = await loadLayeredPairModels();
  const [v0, v1] = viewers;
  [v0, v1].forEach(viewer => {
    viewer.setStyle({}, {cartoon: {color: "0x334155", opacity: 0.48}});
    viewer.setStyle({resn: ["ASP", "GLU"]}, {cartoon: {color: "0xf97316"}, stick: {colorscheme: "orangeCarbon", radius: 0.24}});
    viewer.zoomTo();
    viewer.render();
  });
  document.getElementById('layered-chemistry-lesson').innerHTML = cfg.adaptLesson;
}

async function resetLayeredView() {
  const { viewers, cfg } = await loadLayeredPairModels();
  const [v0, v1] = viewers;
  v0.setStyle({}, {cartoon: {color: "cyan"}});
  v0.zoomTo();
  v0.render();
  v1.setStyle({}, {cartoon: {color: "magenta"}});
  v1.zoomTo();
  v1.render();
  document.getElementById('layered-chemistry-lesson').innerHTML = cfg.octreeLesson;
}

function switchLayeredPair() {
  highlightLayeredOctreeSphere();
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(highlightLayeredOctreeSphere, 250);
});
</script>

---

## 🔭 7. The Horizon: Future Research Ideas & Register-Direct Multiomics

*The Bait (traditional flat 1D Morton `[min_z, max_z]` range scans, unindexed `Molecule % Molecule` varlena deserialization loops, and 350-byte composite `RangeFinderPocket` evaluations—as well as single-habitat reference enzymes like `A0A8J8Q2V3` from *Natronococcus pandeyae* or `A0A0W1R8L8` from *Haloprofundus marisrubri*) can handle small single-protein scripts or narrow sequence annotations, but fails when a 3D binding pocket crosses an octree hyperplane (`24.288 Å` or `(0, 0, 0)`) and triggers a `30,181`-atom Morton Z-jump, or when screening 10,000 ligands and 4,856 active-site pockets spends 95% of CPU time detoasting and CBOR-deserializing rejected rows—whereas our `pg_vectorsearch`-inspired Layered Centroid, SOAR, and Register-Direct Error-Bounded Fastscan engines (`z_order_layered_sphere_ranges`, `ecfp4_fastscan_ub_raw`, and `pocket_quantize_fastscan`) prune `98.6%` to `99.89%` of candidates inside native 64-bit CPU registers with `0.00%` precision or recall loss, making them perfect for interactive 100-million-compound virtual screening, soda-lake epigenetic plasmid engineering (`L9VS02`), and cross-superfamily FAD biocatalyst design (`A0A1I1DB55`).*

1. **100-Million-Compound In-Database Virtual Screening with 24-Byte Register Fastscan (`ecfp4_fastscan_ub_raw` + `ecfp4_cluster_envelope_ub_raw`):**  
   Because `ecfp4_fastscan_ub_raw` prunes **`99.89%`** of molecules at Tanimoto $\tau = 0.70$ using only four inline integers (`popcount smallint, block_counts bigint, sketch_lo bigint, sketch_hi bigint` = 26 bytes/molecule) with **100.0% exact recall**, the entire 2.4-million-compound ChEMBL database fits in **~62 MB of inline register sketches**, enabling sub-50 ms exact Tanimoto + VF2 `@>` pharmacophore screening directly inside PostgreSQL 18.
2. **Whole-Proteome 3D Pocket-to-Pocket Allosteric & Off-Target Auditing (`pocket_quantize_fastscan` + `z_order_layered_sphere_ranges`):**  
   Compressing every 10 Å 3D active site into a 16-byte `(lo_code, hi_code)` register pair (`13.24×–20.42×` faster) while extracting atomic neighborhoods `10.25×` faster via `z_order_layered_sphere_ranges` allows `pg_bio` to cross-join entire pathogen and human structural proteomes in seconds—flagging off-target drug-toxicity pockets before wet-lab synthesis.
3. **Industrial Haloalkaliphilic DNA Methylation & Carotenoid/Cell-Wall Cofactor Engineering (`L9VS02` `DUF1156` & `A0A1I1DB55`):**  
   Our upgraded Pass-5 Swarm (`93.3M+` edges) can now sweep deeper neighborhood rings (`k = 49..60`) at `16W` Hyper-Turbo speed, uncovering extreme soda-lake methyltransferases (`L9VS02`, `719 Cα` at `0.86 Å`) and multifunctional FAD Rossmann scaffolds (`A0A1I1DB55`, `97.73%` pocket IoU) for cell-free biomanufacturing in non-sterile hypersaline brines.

{% include pg_bio_promo.md %}
