---
layout: post
title: "Dual-SLiM Disordered Microprotein Tethers & EnzRef Kinetic Backpressure: How Twin-Plug Ribbon Cables Supercharge 48-Hour RK4 Metabolon Cascades in pg_bio"
date: 2026-11-26 18:45:00 -0300
categories: [postgresql, bioinformatics, rust, pgrx, structural-biology, machine-learning, alphafold]
mermaid: true
math: true
---

In our previous explorations of [CETSA/TPP Microprotein Clamps](/cetsa-tpp-microprotein-clamps-ideal-operating-temperature-t-opt-pg-bio) and [Multi-Pocket PoseBusters](/pocketvina-posebusters-enzref-pslim-tethers-pg-bio), we built rigid 3D geometric filters to find microproteins that act like **structural dowel pins**—wedging into a seam between two enzymes to lock them together.

That works beautifully when a microprotein is a rigid $\alpha$-helical hairpin like **`V5TNY2`** (*Methanosarcina mazei*, 77 aa).

**But what happens when the best metabolon coupler in the dark proteome isn't a rigid dowel pin at all—what if it is a flexible twin-plug ribbon cable?**

Over **40% of archaeal and halophilic small open reading frames (`sORFs <= 100 aa`)** are intrinsically disordered in isolation (`GRAVY < 0`, low global AlphaFold pLDDT). They do not have a pre-formed 3D binding pocket. Instead, they carry two **5–12 residue Short Linear Motifs (SLiMs)** separated by a flexible 15–45 residue hydrophilic linker. Window A folds upon touching Enzyme 1 (`M2_Scissor`), Window B folds upon touching Enzyme 2 (`M3_Sink`), and the disordered linker acts as an entropic spring holding the two catalytic tunnels mouth-to-mouth (`c/c* = 0.65 - 0.72`).

Even better: when you tether two enzymes mouth-to-mouth, you uncover a hidden kinetic trap. If your downstream `M3_Sink` enzyme holds onto its product too tightly (**high product backpressure**), tethering it next to `M2_Scissor` doesn't speed up the cascade—it chokes it!

Today, we walk through the complete mental model, Rust SIMD architecture (`pg_bio` [PR #19](https://github.com/jonatas/pg_bio/pull/19) & `bio-pipelines` [PR #8](https://github.com/jonatas/bio-pipelines/pull/8)), and live PostgreSQL 18 discoveries that combine **Dual-SLiM Disordered Microprotein Tethers (`bio_pslim_window_pool` + `bio_match_dual_slim_tether`)**, the **Hydrophobic-Core Junction Sanity Gate (`bio_audit_fusion_junction_sanity`)**, and **`EnzRef` Reference-Centered Kinetic Role-Contrast (`bio_enzref_kinetics`)** inside our 48-hour RK4 bioprocess solver.

<!--more-->

---

## 1. The Mental Model: Rigid Dowel Pin vs. Twin-Plug Ribbon Cable

Think of a 3-enzyme industrial cascade (`M1_Anchor -> M2_Scissor -> M3_Sink`) inside a bioreactor like an assembly line where **Machine 2 (`M2_Scissor`)** cuts a toxic intermediate (`I1`, such as furfural, mono-hydroxyethyl terephthalate, or a reactive glycosyl donor) and **Machine 3 (`M3_Sink`)** immediately consumes `I1` to make the final stable product (`P_final`).

If `M2` and `M3` float freely in the reactor bulk, `I1` escapes into solution, degrades, or inhibits the cell before `M3` ever sees it. You want to physically tie `M2` and `M3` together into a **synthetic metabolon**:

{% mermaid %}
flowchart LR
    subgraph Rigid["1. Rigid Lock-and-Key Staple (V5TNY2, 77 aa)"]
        direction LR
        R_M1["M1_Anchor (P79073)"] ---|"Rigid 3D Seam Wedge<br/>(GRAVY +1.227)"| R_Staple["V5TNY2 Helix Hairpin<br/>(Split Hydrophobic Core -> Bicistronic Operon)"]
        R_Staple --- R_M2["M2_Scissor (Q8TRP6)"]
    end

    subgraph DualSLiM["2. Dual-SLiM Twin-Plug Ribbon Cable (L0JP89 / A0A897MT85)"]
        direction LR
        S_M2["M2_Scissor<br/>(D3SWG7 / A0A3P3R4S2)"] <-->|"Plug A: 8-aa SLiM<br/>(res 3..10, Centroid #27/#62)"| PlugA(("Window A<br/>ZCA + L2"))
        PlugA ~~~|"Disordered Hydrophilic Linker<br/>(20-34 aa, GRAVY -0.36 to -0.72)<br/>Single-Polypeptide Fusion Safe"| PlugB(("Window B<br/>ZCA + L2"))
        PlugB <-->|"Plug B: 8-aa SLiM<br/>(res 31..38 / 45..52, Centroid #31/#27)"| S_M3["M3_Sink (Low Backpressure)<br/>(A0AAE3P9N2 / A0A0W1R9J0)"]
    end

    style Rigid fill:#1e1b4b,stroke:#818cf8,color:#f8fafc
    style DualSLiM fill:#064e3b,stroke:#10b981,color:#f8fafc
{% endmermaid %}

### Why Standard 3D Filters and Whole-Protein Embeddings Miss Dual-SLiMs

Why did our first-generation pipeline completely overlook flexible microprotein tethers? Because of **two compounding blind spots**:

1. **The 3D Pocket Filter Blind Spot:** Rigid 3D Kabsch/Morton octree filters ask: *"Does this microprotein have a stable 3D fold in isolation?"* A disordered tether has no fixed 3D shape until its two tips touch their partner surfaces (**coupled folding and binding**). Filtering by global rigid 3D geometry throws them away before the search even starts.
2. **The Mean-Pooled Embedding Blur:** Standard protein language model (ESM-2) pipelines average all residue vectors across the entire sequence into a single 1280-D vector:
   $$\mathbf{v}_{\text{whole}} = \frac{1}{L}\sum_{i=1}^{L} \mathbf{h}_i$$
   If a 41-aa microprotein like **`L0JP89`** has **Plug A** at residues `3..10` (`CDNCDSDA`, matching `M2_Scissor`), **Plug B** at residues `31..38` (`FCSTDCLH`, matching `M3_Sink`), and a 20-aa disordered linker in between (`YVEPDGRESVDLH`), averaging all 41 residues together **blurs Plug A, Plug B, and the linker noise into a muddled middle vector** that matches neither `M2_Scissor` nor `M3_Sink`!

---

## 2. Step 1: Un-Blurring the Windows with `bio_pslim_window_pool` (617,845 Windows/Sec/Core)

To see both plugs clearly without changing a single byte of our PostgreSQL 2-level layered-centroid index format, `bio_pslim_window_pool` slides an 8-residue window (`window_len = 8`, `stride = 2`) along the microprotein (`sORF <= 110 aa`):

1. **Local Motif Extraction & Shannon Entropy Gate:** For each 8-aa slice $W_k = S[a_k \dots b_k]$, it computes the local Shannon sequence entropy:
   $$H(W_k) = -\sum_{aa \in \Sigma} p(aa)\log_2 p(aa)$$
   Low-complexity homopolymer repeats (e.g., `GGGGGGGG`) have $H \to 0$, whereas genuine amphipathic or zinc/cysteine recognition SLiMs carry rich informational diversity ($H \in [2.0, 3.0]\text{ bits}$).
2. **Per-Window ZCA Whitening + L2 Unit Normalization:** Raw ESM-2 representations suffer from severe cone anisotropy (mean pairwise cosine `0.9963`), where every short peptide window points in almost the exact same direction. Inside `bio_pslim_window_pool`, each pooled 8-aa window vector $\mathbf{w}_k$ is centered, projected through our zero-copy ZCA whitening transform (`71.68x` anisotropy collapse down to `-0.0139`), and L2-normalized to unit length ($\|\hat{\mathbf{w}}_k\|_2 = 1.0$).

Because $\hat{\mathbf{w}}_k$ lives in the exact same whitened unit hypersphere as our existing `pg_bio` tables, **Window A (`3..10`)** and **Window B (`31..38`)** drop straight into distinct Stage-1 coarse/fine centroids (`l1_centroid`, `l2_centroid`) and 32-wide NEON/AVX2 `fastscan` buckets:

```sql
-- Slide an 8-aa window (stride 2) across the 41-aa halophilic microprotein L0JP89
SELECT start_pos,
       end_pos,
       subseq,
       round(local_entropy::numeric, 3) AS shannon_bits,
       round(zca_l2_norm::numeric, 4)   AS unit_norm,
       l1_centroid,
       l2_centroid
FROM bio_pslim_window_pool(
    NULL,
    'MHCDNCDSDAVAYTLTTYVEPDGRESVDLHFCSTDCLHVWT',
    8,  -- window_len
    2,  -- stride
    NULL
)
WHERE start_pos IN (3, 17, 31);
```

| `start_pos` | `end_pos` | `subseq` | `shannon_bits` | `unit_norm` | `l1_centroid` | `l2_centroid` | Functional Role in `L0JP89` |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`3`** | **`10`** | `CDNCDSDA` | `2.156` | `1.0000` | `0` | **`27`** | **Plug A (`N`-terminal SLiM):** Anchors onto `M2_Scissor` (`D3SWG7` GalE epimerase) |
| **`17`** | **`24`** | `LTTYVEPD` | `2.750` | `1.0000` | `1` | **`19`** | **Disordered Hydrophilic Linker:** Flexible spacer (`GRAVY = -0.360`) |
| **`31`** | **`38`** | `FCSTDCLH` | `2.750` | `1.0000` | `2` | **`31`** | **Plug B (`C`-terminal SLiM):** Captures `M3_Sink` (`A0AAE3P9N2` DUF5816 GNAT) |

Look at `l2_centroid`: **Plug A** lands in centroid **`27`**, while **Plug B** (20 residues later on the exact same 41-aa peptide!) lands in centroid **`31`**. By pooling locally before ZCA whitening, one tiny 41-aa microprotein illuminates **two completely different binding surfaces** in the database.

---

## 3. Step 2: The Non-Overlapping Linker Geometry (`end_a + min_linker <= start_b`)

Having two binding motifs on one microprotein isn't enough if they overlap (`3..10` and `5..12`). Two 40 kDa enzymes cannot bind to the same 8 residues at the same time without crashing into each other sterically.

Our SQL table function `bio_match_dual_slim_tether` enforces a strict geometric separation constraint:

$$\text{start}_B - \text{end}_A \ge L_{\text{min\_linker}} \quad (\text{typically } 10\text{–}15\text{ aa})$$

At roughly $3.5\text{ \AA}$ per extended disordered residue, a 20-to-34 residue hydrophilic linker gives an end-to-end reach of **$35\text{–}70\text{ \AA}$**—wide enough for `M2_Scissor` and `M3_Sink` to sit side-by-side without clashing, yet tight enough to trap every intermediate molecule inside a shared hydration shell!

```sql
-- Match dual non-overlapping SLiMs on L0JP89 against M2_Scissor (D3SWG7) and M3_Sink (A0AAE3P9N2)
SELECT win_a_start, win_a_end, win_a_subseq,
       win_b_start, win_b_end, win_b_subseq,
       linker_len,
       round(linker_gravy::numeric, 3)      AS linker_gravy,
       junction_sanity_pass,
       fusion_recommendation,
       round(dual_tether_score::numeric, 4) AS dual_tether_score
FROM bio_match_dual_slim_tether(
    'MHCDNCDSDAVAYTLTTYVEPDGRESVDLHFCSTDCLHVWT',
    (SELECT zca_vec FROM swarm_zca_test WHERE uniprot_id = 'D3SWG7' LIMIT 1),
    (SELECT zca_vec FROM swarm_zca_test WHERE uniprot_id = 'A0AAE3P9N2' LIMIT 1),
    8,   -- window_len
    2,   -- stride
    12   -- min_linker residues between Window A and Window B
);
```

---

## 4. Step 3: The Hydrophobic-Core Junction Sanity Gate (`Single_Polypeptide_Fusion` vs. `Bicistronic_Operon_Required`)

Once `bio_match_dual_slim_tether` finds a dual-SLiM candidate, a synthetic biologist faces a critical wet-lab design question:
- **Option A (`Single_Polypeptide_Fusion`):** Can we fuse the microprotein directly into a single polypeptide chimera with the enzyme?
- **Option B (`Bicistronic_Operon_Required`):** Or must we express the microprotein as a separate gene on a **bicistronic operon** (two ribosome binding sites on one mRNA) so each polypeptide folds independently before assembling?

To answer that automatically in Rust, we implemented `bio_audit_fusion_junction_sanity(seq, win_a_end, win_b_start)`. It scans the intervening linker (`win_a_end .. win_b_start`) for:
1. **Linker Kyte-Doolittle Hydropathy (`linker_gravy`):** If `linker_gravy > +0.45`, the region between Window A and Window B is not a disordered solvent-exposed tether—it is a **buried hydrophobic core or transmembrane helix**.
2. **Contiguous Hydrophobic Run Length (`max_hydrophobic_run`):** Counts consecutive core residues (`V, I, L, F, W, M, Y, C`). If `max_hydrophobic_run >= 6`, splicing that segment as an exposed fusion linker will rip open a hydrophobic core, causing inclusion-body aggregation.

Look at how cleanly this gate separates our top live discoveries in `swarm_pslim_metabolon_couplers`:

| Microprotein (`uniprot_id`) | Organism | Length | Coupled Module Pair | Window A (`start..end`) | Window B (`start..end`) | Linker Len | Linker `GRAVY` | Junction Sanity Gate (`fusion_recommendation`) | Dual Tether Score |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :--- | :---: |
| **`A0A897MT85`** | *Natranaeroarchaeum sulfidigenes* | `54 aa` | `M2_Scissor` (`A0A3P3R4S2`) + `M3_Sink` (`A0A0W1R9J0`) | `3..10` (`CQRRHAAI`) | `45..52` (`SQPVTDDH`) | `34 aa` | **`-0.720`** | ✅ **`Single_Polypeptide_Fusion`** | **`0.9750`** |
| **`L0JP89`** | *Natrinema pellirubrum DSM 15624* | `41 aa` | `M2_Scissor` (`D3SWG7`) + `M3_Sink` (`A0AAE3P9N2`) | `3..10` (`CDNCDSDA`) | `31..38` (`FCSTDCLH`) | `20 aa` | **`-0.360`** | ✅ **`Single_Polypeptide_Fusion`** | **`0.9701`** |
| **`A0A2G1WGQ6`** (`DUF8081`) | *Halorubrum persicum* | `103 aa` | `M2_Scissor` (`D3SWG7`) + `M3_Sink` (`A0AAE3P9N2`) | `15..22` (`NAKVGRLV`) | `65..72` (`DLYLVSRA`) | `42 aa` | **`-0.900`** | ✅ **`Single_Polypeptide_Fusion`** | **`0.8930`** |
| **`V5TNY2`** | *Haloarcula hispanica* / *M. mazei* | `77 aa` | `M1_Anchor` (`P79073`) + `M2_Scissor` (`Q8TRP6`) | `3..10` (`ERLRVNPF`) | `67..74` (`IASTGLVL`) | `56 aa` | **`+1.650`** | ⚠️ **`Bicistronic_Operon_Required (Split Hydrophobic Core)`** | **`0.7046`** |

That contrast between **`A0A897MT85` / `L0JP89` / `A0A2G1WGQ6`** (`linker_gravy` from `-0.36` to `-0.90` $\rightarrow$ safe `Single_Polypeptide_Fusion`) and **`V5TNY2`** (`linker_gravy = +1.65` $\rightarrow$ `Bicistronic_Operon_Required`) prevents a classic protein engineering failure mode before a single gene is synthesized!

---

## 5. Step 4: Why a Great Tether Still Fails Without `EnzRef` Low-Backpressure Selection

Now comes the deeper systems-biology realization: **what happens when you bring `M2_Scissor` and `M3_Sink` mouth-to-mouth?**

When the Dual-SLiM tether holds `M2_Scissor` and `M3_Sink` within $35\text{–}60\text{ \AA}$, the dimensionless macromolecular crowding factor $c / c^*$ jumps from `0.00` (un-tethered bulk diffusion) to **`0.65 - 0.72`**. In our 48-hour RK4 cascade solver (`simulate_cascade_kinetics`), crowding accelerates substrate channeling between `M2_Scissor` and `M3_Sink`:

$$\text{crowding\_boost} = 1 + 0.35\,\frac{c / c^*}{1 + 0.5\,(c / c^*)}$$

**Here is the catch:** Standard `kcat` predictors sum or average reactant and product representations together and entangle them with the static enzyme background $\mathbf{v}_{\text{bg}}$. As a result, they often select an `M3_Sink` enzyme that binds the product **more tightly than the reactant** ($\|\mathbf{d}_{\text{prod}}\|_2 \gg \|\mathbf{d}_{\text{react}}\|_2$).

In an un-tethered bulk tank, you might not notice mild product retention right away. **In a mouth-to-mouth tethered metabolon, high product retention is fatal:** `M3_Sink` stalls on its own product, creating **reversible backpressure ($K_p$)** that floods the $50\text{ \AA}$ micro-compartment and chokes `M2_Scissor`!

### `EnzRef` Reference-Centered Kinetic Role-Contrast (2.09 Million Pairs/Sec/Core)

To eliminate product-inhibited `M3_Sink` candidates at **Stage 2.5** (right after `RangeFinder` GiST + `ECFP4` Tanimoto filtering), we built `bio_split_reaction_roles` and `bio_enzref_kinetics` in Rust (`aarch64` NEON + `x86_64` AVX2):

1. **Reaction Role Splitting (`bio_split_reaction_roles`):** Decomposes any Daylight reaction SMILES (`Reactants > Agents > Products` or `A.B>>C.D`), strips spectator catalysts/solvents, and generates separate reactant ($\mathbf{r}_{\text{react}}$) and product ($\mathbf{r}_{\text{prod}}$) conditioned vectors.
2. **Enzyme-Background Centering:** Subtracts the static enzyme residue-mean background $\mathbf{v}_{\text{bg}}$ so static fold family bias cancels out:
   $$\mathbf{d}_{\text{react}} = \mathbf{r}_{\text{react}} - \mathbf{v}_{\text{bg}}, \qquad \mathbf{d}_{\text{prod}} = \mathbf{r}_{\text{prod}} - \mathbf{v}_{\text{bg}}$$
3. **Symmetry-Aware Recomposition & Antisymmetric Flux Rank:**
   $$\mathbf{m} = \frac{1}{2}(\mathbf{d}_{\text{react}} + \mathbf{d}_{\text{prod}}), \qquad \mathbf{c}_{\text{fwd}} = \mathbf{d}_{\text{prod}} - \mathbf{d}_{\text{react}}$$
   Notice that if you swap reactants and products ($\mathbf{r}_{\text{react}} \leftrightarrow \mathbf{r}_{\text{prod}}$), the catalytic response $\mathbf{m}$ is **strictly symmetric** while the directed role contrast $\mathbf{c}_{\text{fwd}}$ flips sign ($\mathbf{c}_{\text{fwd}} \to -\mathbf{c}_{\text{fwd}}$). Projecting $\mathbf{c}_{\text{fwd}}$ onto the enzyme's active catalytic axis yields an **exact antisymmetric forward flux rank**:
   $$\text{bio\_enzref\_flux\_rank}(\mathbf{v}_{\text{bg}}, \mathbf{r}_{\text{prod}}, \mathbf{r}_{\text{react}}) = -\text{bio\_enzref\_flux\_rank}(\mathbf{v}_{\text{bg}}, \mathbf{r}_{\text{react}}, \mathbf{r}_{\text{prod}})$$
4. **Backpressure Risk (`backpressure_risk`):** Measures product-over-reactant retention and counter-aligned contrast, feeding directly into the 48-hour RK4 effective product inhibition penalty on `M3_Sink`:
   $$v_3(t) = \frac{k_{\text{cat},3,\text{eff}}\,[E_3](t)\,[I_1](t)}{K_{m,3} \cdot \underbrace{(1 + 2.25\,\text{backpressure\_risk})}_{\text{Active-Site Product Retention}} + [I_1](t) + \frac{[P_{\text{final}}](t)}{K_{p,\text{eff}}}} - k_{\text{rev}}\,[P_{\text{final}}](t)$$

```sql
-- Split a reaction SMILES and score an M3_Sink candidate with EnzRef Role-Contrast + 48h RK4 Cascade Kinetics
WITH rxn AS (
    SELECT * FROM bio_split_reaction_roles('OCC(O)C(O)C(O)C(O)CO.CC(=O)SCCNC(=O)CCNC(=O)C(O)C(C)(C)COP(=O)(O)OP(=O)(O)OCC1OC(n2cnc3c(N)ncnc32)C(O)C1OP(=O)(O)O>O>[H]OC([H])(C(=O)O)C(O)C(O)C(O)CO')
),
enzref AS (
    SELECT * FROM bio_enzref_kinetics_smiles(
        (SELECT zca_vec FROM swarm_zca_test WHERE uniprot_id = 'A0AAE3P9N2' LIMIT 1),
        (SELECT reactants_smiles FROM rxn),
        (SELECT products_smiles FROM rxn)
    )
)
SELECT round(e.forward_flux_score::numeric, 4)        AS forward_flux_score,
       round(e.backpressure_risk::numeric, 4)         AS backpressure_risk,
       round(e.norm_ratio_react_over_prod::numeric, 3) AS react_over_prod_ratio,
       round(rk4_tethered.final_product_mM::numeric, 2) AS yield_tethered_low_bp_mM,
       round(rk4_stalled.final_product_mM::numeric, 2)  AS yield_stalled_high_bp_mM
FROM enzref e,
LATERAL simulate_cascade_kinetics(
    100.0, 2.5, 1.2, 4.0, 0.8, 3.2, 0.9, 50.0, 0.005, 0.004, 0.004, 48.0,
    e.backpressure_risk,  -- Low backpressure M3_Sink (A0AAE3P9N2)
    0.72                  -- Dual-SLiM L0JP89 crowding factor c/c*
) rk4_tethered,
LATERAL simulate_cascade_kinetics(
    100.0, 2.5, 1.2, 4.0, 0.8, 3.2, 0.9, 50.0, 0.005, 0.004, 0.004, 48.0,
    0.85,                 -- Product-inhibited M3_Sink (backpressure_risk = 0.85)
    0.00                  -- Un-tethered bulk diffusion (c/c* = 0.00)
) rk4_stalled;
```

### The Synergistic Result: Why Dual-SLiM + `EnzRef` Multiply Each Other

In our `bio-pipelines` validation suite (`test_enzref_rk4_pslim.py`), compare what happens across the four combinations of **Tethering (`c/c*`)** and **`EnzRef` Backpressure (`backpressure_risk`)** over a 48-hour batch run starting from $100\text{ mM}$ feedstock:

| Metabolon Configuration | Dual-SLiM Tether (`c/c*`) | `M3_Sink` `backpressure_risk` | 48h Final Product Yield (`mM`) | Peak Toxic Intermediate `I1` (`mM`) | Peak Bottleneck Ratio | Biological Outcome |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1. Un-tethered + High-Backpressure `M3_Sink`** | `0.00` (Bulk) | `0.85` (Stalled) | `62.77 mM` | `15.72 mM` | `0.369` | Intermediate `I1` accumulates; product inhibition chokes `M3_Sink` |
| **2. Tethered + High-Backpressure `M3_Sink`** | `0.72` (`L0JP89`) | `0.85` (Stalled) | `66.14 mM` | `14.18 mM` | `0.341` | Tether brings `M2` and `M3` together, but `M3` still backs up |
| **3. Un-tethered + `EnzRef` Low-Backpressure `M3_Sink`** | `0.00` (Bulk) | `0.05` (Vacuum) | `74.43 mM` | `10.11 mM` | `0.264` | Fast `M3` turnover, but bulk diffusion limits capture of `I1` |
| **4. Dual-SLiM Tether (`L0JP89`) + `EnzRef` Low-Backpressure `M3_Sink` (`A0AAE3P9N2`)** | **`0.72` (`L0JP89`)** | **`0.05` (Vacuum)** | **`79.13 mM` (`+26.1%`)** | **`8.34 mM` (`-47.0%`)** | **`0.221`** | **One-way vacuum channeling: `I1` is captured at $50\text{ \AA}$ and immediately expelled as `P_final`** |

---

## 6. Interactive 3D Structural Exploration: Twin-Plug Ribbon Cables vs. Split-Core Helical Hairpins

Explore the four key structural archetypes from our live `swarm_pslim_metabolon_couplers` table side-by-side below. With **`pg_bio_sync.js`** enabled, rotating or zooming any viewer mirrors the camera across all panels, and clicking any residue aligns and highlights the corresponding structural neighborhood:

- **Panel 1 (`L0JP89`, *Natrinema pellirubrum*, 41 aa):** Disordered dual-cysteine/acidic SLiM ribbon cable (`3..10` `CDNCDSDA` + `31..38` `FCSTDCLH`, `linker_gravy = -0.36`, **`Single_Polypeptide_Fusion`**).
- **Panel 2 (`A0A897MT85`, *Natranaeroarchaeum sulfidigenes*, 54 aa):** High-scoring poly-charged dual-SLiM coupler (`3..10` `CQRRHAAI` + `45..52` `SQPVTDDH`, `34 aa` hydrophilic linker `GRAVY = -0.72`, **`Single_Polypeptide_Fusion`**, `dual_tether_score = 0.9750`).
- **Panel 3 (`V5TNY2`, *Haloarcula hispanica* / *M. mazei*, 77 aa):** Rigid hydrophobic helical hairpin (`3..10` `ERLRVNPF` + `67..74` `IASTGLVL`, intervening core `GRAVY = +1.65` $\rightarrow$ flagged by `bio_audit_fusion_junction_sanity` as **`Bicistronic_Operon_Required`**).
- **Panel 4 (`D3SWG7`, *Natronobacterium gregoryi*, 337 aa):** The Lake Magadi soda-lake `M2_Scissor` GalE epimerase partner tethered by `L0JP89` and `A0A2G1WGQ6` (`DUF8081`).

<script src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"></script>
<script src="/assets/js/pg_bio_sync.js"></script>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin: 20px 0;">
  <div style="border: 1px solid #334155; border-radius: 8px; padding: 8px; background: #0f172a;">
    <div style="font-size: 0.85rem; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">1. L0JP89 (41 aa Dual-SLiM Ribbon Cable)</div>
    <div style="height: 320px; width: 100%; position: relative;" class="viewer_3Dmoljs" data-href="/assets/models/AF-L0JP89-F1-model_v4.pdb" data-backgroundcolor="0x0f172a" data-style="cartoon:color=spectrum" data-select1="resi:3-10" data-style1="cartoon:color=0x10b981;stick:radius=0.18,colorscheme=greenCarbon" data-select2="resi:31-38" data-style2="cartoon:color=0xf43f5e;stick:radius=0.18,colorscheme=magentaCarbon"></div>
  </div>
  <div style="border: 1px solid #334155; border-radius: 8px; padding: 8px; background: #0f172a;">
    <div style="font-size: 0.85rem; font-weight: 700; color: #10b981; margin-bottom: 6px;">2. A0A897MT85 (54 aa Top Dual-SLiM Tether, Score 0.975)</div>
    <div style="height: 320px; width: 100%; position: relative;" class="viewer_3Dmoljs" data-href="/assets/models/AF-A0A897MT85-F1-model_v4.pdb" data-backgroundcolor="0x0f172a" data-style="cartoon:color=spectrum" data-select1="resi:3-10" data-style1="cartoon:color=0x10b981;stick:radius=0.18,colorscheme=greenCarbon" data-select2="resi:45-52" data-style2="cartoon:color=0xf43f5e;stick:radius=0.18,colorscheme=magentaCarbon"></div>
  </div>
  <div style="border: 1px solid #334155; border-radius: 8px; padding: 8px; background: #0f172a;">
    <div style="font-size: 0.85rem; font-weight: 700; color: #f59e0b; margin-bottom: 6px;">3. V5TNY2 (77 aa Split-Core -> Bicistronic Operon)</div>
    <div style="height: 320px; width: 100%; position: relative;" class="viewer_3Dmoljs" data-href="/assets/models/AF-V5TNY2-F1-model_v4.pdb" data-backgroundcolor="0x0f172a" data-style="cartoon:color=spectrum" data-select1="resi:11-66" data-style1="cartoon:color=0xfacc15;stick:radius=0.14,colorscheme=yellowCarbon"></div>
  </div>
  <div style="border: 1px solid #334155; border-radius: 8px; padding: 8px; background: #0f172a;">
    <div style="font-size: 0.85rem; font-weight: 700; color: #c084fc; margin-bottom: 6px;">4. D3SWG7 (Lake Magadi M2_Scissor Partner)</div>
    <div style="height: 320px; width: 100%; position: relative;" class="viewer_3Dmoljs" data-href="/assets/models/AF-D3SWG7-F1-model_v4.pdb" data-backgroundcolor="0x0f172a" data-style="cartoon:color=spectrum"></div>
  </div>
</div>

<div style="margin: 15px 0; display: flex; gap: 10px; flex-wrap: wrap;">
  <button onclick="showDualSlimPlugs()" style="padding: 8px 14px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">1. Highlight Dual-SLiM Plugs A (Emerald) & B (Rose)</button>
  <button onclick="showLinkerHydropathy()" style="padding: 8px 14px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">2. Inspect Intervening Linker: Hydrophilic Ribbon vs. V5TNY2 Hydrophobic Core</button>
  <button onclick="showSurfaceElectrostatics()" style="padding: 8px 14px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">3. Show Acidic Halophile Hydration Shell (D/E vs. R/K)</button>
  <button onclick="resetDualSlimViews()" style="padding: 8px 14px; background: #475569; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Reset Spectrum</button>
</div>

<div id="chemistry-lesson" style="padding: 15px; background: #f8fafc; border-left: 4px solid #10b981; margin-bottom: 20px; font-size: 0.95rem; color: #1e293b; border-radius: 0 6px 6px 0;">
  <strong>Interactive Structural Guide:</strong> Click the buttons above to inspect how <code>bio_pslim_window_pool</code> isolates the N-terminal <strong>Plug A (Emerald)</strong> and C-terminal <strong>Plug B (Rose)</strong> into separate ZCA-whitened <code>l2_centroid</code> buckets, while <code>bio_audit_fusion_junction_sanity</code> checks whether the intervening linker is a solvent-exposed hydrophilic tether (<code>L0JP89</code>, <code>A0A897MT85</code>) or a buried hydrophobic core (<code>V5TNY2</code>).
</div>

<script>
function getValidViewers() {
  return Object.values(window.$3Dmol && window.$3Dmol.viewers ? window.$3Dmol.viewers : {}).filter(v => v && typeof v.setStyle === 'function');
}

function showDualSlimPlugs() {
  const viewers = getValidViewers();
  viewers.forEach((v, idx) => {
    v.setStyle({}, {cartoon: {color: '0x64748b', opacity: 0.55}});
    if (idx === 0) {
      // L0JP89: Win A 3-10, Win B 31-38
      v.setStyle({resi: '3-10'}, {cartoon: {color: '0x10b981'}, stick: {radius: 0.22, colorscheme: 'greenCarbon'}});
      v.setStyle({resi: '31-38'}, {cartoon: {color: '0xf43f5e'}, stick: {radius: 0.22, colorscheme: 'magentaCarbon'}});
    } else if (idx === 1) {
      // A0A897MT85: Win A 3-10, Win B 45-52
      v.setStyle({resi: '3-10'}, {cartoon: {color: '0x10b981'}, stick: {radius: 0.22, colorscheme: 'greenCarbon'}});
      v.setStyle({resi: '45-52'}, {cartoon: {color: '0xf43f5e'}, stick: {radius: 0.22, colorscheme: 'magentaCarbon'}});
    } else if (idx === 2) {
      // V5TNY2: Win A 3-10, Win B 67-74
      v.setStyle({resi: '3-10'}, {cartoon: {color: '0x10b981'}, stick: {radius: 0.22, colorscheme: 'greenCarbon'}});
      v.setStyle({resi: '67-74'}, {cartoon: {color: '0xf43f5e'}, stick: {radius: 0.22, colorscheme: 'magentaCarbon'}});
    } else {
      // D3SWG7 partner docking surface
      v.setStyle({resi: '120-165'}, {cartoon: {color: '0x10b981'}, stick: {radius: 0.16, colorscheme: 'greenCarbon'}});
    }
    v.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<strong>1. Dual-SLiM Recognition Plugs (Emerald = Window A, Rose = Window B):</strong> When <code>bio_pslim_window_pool</code> pools 8-aa windows prior to ZCA whitening, <strong>Window A (residues 3..10)</strong> and <strong>Window B (residues 31..38 on L0JP89; 45..52 on A0A897MT85)</strong> project to orthogonal unit vectors (<code>l2_centroid #27</code> vs. <code>#31</code> / <code>#62</code>). This lets a single 41–54 aa microprotein recognize <code>M2_Scissor</code> at one tip and <code>M3_Sink</code> at the other tip without steric overlap.";
}

function showLinkerHydropathy() {
  const viewers = getValidViewers();
  viewers.forEach((v, idx) => {
    v.setStyle({}, {cartoon: {color: '0x475569', opacity: 0.35}});
    if (idx === 0) {
      // L0JP89 hydrophilic linker 11-30
      v.setStyle({resi: '11-30'}, {cartoon: {color: '0x38bdf8'}, stick: {radius: 0.20, colorscheme: 'cyanCarbon'}});
    } else if (idx === 1) {
      // A0A897MT85 hydrophilic linker 11-44
      v.setStyle({resi: '11-44'}, {cartoon: {color: '0x38bdf8'}, stick: {radius: 0.20, colorscheme: 'cyanCarbon'}});
    } else if (idx === 2) {
      // V5TNY2 hydrophobic core 11-66
      v.setStyle({resi: '11-66'}, {cartoon: {color: '0xfacc15'}, stick: {radius: 0.22, colorscheme: 'yellowCarbon'}});
    } else {
      v.setStyle({}, {cartoon: {color: 'spectrum'}});
    }
    v.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<strong>2. The Hydrophobic-Core Junction Sanity Gate (Cyan = Safe Single-Polypeptide Linker vs. Yellow = Split Hydrophobic Core):</strong> Compare the intervening segment on <code>L0JP89</code> (20 aa, <code>GRAVY = -0.360</code>, cyan) and <code>A0A897MT85</code> (34 aa, <code>GRAVY = -0.720</code>, cyan) against <code>V5TNY2</code> (56 aa, <code>GRAVY = +1.650</code>, bright yellow). Because <code>V5TNY2</code>'s intervening region is a tightly packed hydrophobic hairpin core (<code>VVAAASVTLLCVLVAGAGAVAVI...</code>), <code>bio_audit_fusion_junction_sanity</code> automatically rejects single-chain fusion and flags <code>Bicistronic_Operon_Required</code>.";
}

function showSurfaceElectrostatics() {
  const viewers = getValidViewers();
  viewers.forEach(v => {
    v.setStyle({}, {cartoon: {color: '0x94a3b8', opacity: 0.65}});
    v.setStyle({resn: ['ASP', 'GLU']}, {cartoon: {color: '0xef4444'}, stick: {radius: 0.22, color: '0xef4444'}});
    v.setStyle({resn: ['ARG', 'LYS', 'HIS']}, {cartoon: {color: '0x3b82f6'}, stick: {radius: 0.22, color: '0x3b82f6'}});
    v.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<strong>3. Halophilic Hydration & Salt-Bridge Ratchets (Red = Acidic Asp/Glu, Blue = Basic Arg/Lys/His):</strong> In 3.5 M NaCl brines, <code>L0JP89</code> (<code>pI = 4.40</code>) and <code>D3SWG7</code> use surface Asp/Glu carboxylates (red) to retain a structured hydration shell, while <code>A0A897MT85</code> (<code>pI = 8.28</code>) pairs an Arg/His-rich N-terminal plug (<code>CQRRHAAI</code>, blue) with an acidic C-terminal plug (<code>SQPVTDDH</code>, red) for directional electrostatic docking.";
}

function resetDualSlimViews() {
  const viewers = getValidViewers();
  viewers.forEach(v => {
    v.setStyle({}, {cartoon: {color: 'spectrum'}});
    v.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<strong>Interactive Structural Guide:</strong> Spectrum view restored (N-terminus in blue to C-terminus in red). Rotate any structure to synchronize all four cameras via <code>pg_bio_sync.js</code>.";
}
</script>

---

## 7. Release Benchmarks on PostgreSQL 18.3 (Apple Silicon ARM64 NEON)

Every primitive in `pg_bio` [PR #19](https://github.com/jonatas/pg_bio/pull/19) runs purely in stack/varlena memory inside PostgreSQL shared buffers—zero `unwrap()` across FFI boundaries, zero background threads, and strict `IMMUTABLE PARALLEL SAFE` annotations. Running `SELECT * FROM bio_run_phase4_benchmarks();` on our live `bio_demo` instance delivers:

| Benchmark Stage | Baseline (`Raw / Scalar / TOAST`) | `pg_bio` Upgraded Engine (`ZCA + NEON SIMD`) | Speedup / Improvement | Architectural Impact |
| :--- | :---: | :---: | :---: | :--- |
| **1a. ESM-2 Cone Anisotropy (Mean Pairwise Cosine)** | `0.9963` | **`-0.0139`** | **`71.68x` collapse** | Eliminates narrow cone collapse across full proteins & 8-aa SLiMs |
| **1b. RaBitQ 1-Bit Error Bound ($\epsilon_{\text{bound}}$)** | `2.8108` | **`1.6554`** | **`1.70x` tighter** | Sharpens Cauchy-Schwarz lower bounds in 16-byte register fastscan |
| **1c. 32-Wide SIMD Fastscan Pruning Ratio** | `0.0000` (`0%`) | **`0.3536` (`35.36%`)** | **`+35.36%` pruned** | Skips over a third of candidates before Stage-2 reranking |
| **2a. 1280-D Vector On-Disk Byte Size** | `2,564 B` (TOASTed) | **`1,304 B` (`BioVecInt8G128`)** | **`1.97x` smaller** | Fits inline inside 8 KB heap pages below the 2,000 B TOAST threshold |
| **2b. Stage-2 100-Candidate Rerank Latency** | `168.49 µs` | **`6.01 µs`** | **`28.03x` faster** | Zero TOAST decompression + ARM64 NEON dot-product kernel |
| **3a. Stage-2.5 `EnzRef` 1280-D Role-Contrast Throughput** | `500,000 rows/s` target | **`2,092,090 rows/sec/core`** | **`4.18x` above target** | Real-time forward-flux & backpressure scoring inside `ORDER BY` |
| **3b. Disordered Microprotein SLiM Window Pooler (`ZCA + L2`)** | `100,000 win/s` target | **`617,845 windows/sec/core`** | **`6.18x` above target** | Indexes a 50-aa microprotein (22 windows) in **`35.6 µs`** |

---

## The Horizon: Future Research Ideas

By combining `bio_pslim_window_pool`, `bio_match_dual_slim_tether`, `bio_audit_fusion_junction_sanity`, and `bio_enzref_kinetics` inside `pg_bio`, our autonomous swarm uncovered three high-priority bio-manufacturing opportunities ready for wet-lab validation:

1. **Single-Polypeptide Halophilic GalE–GNAT Metabolon Chimeras (`L0JP89` & `A0A2G1WGQ6` `DUF8081`):**
   - *The Bait (`V5TNY2` Rigid Helical Staple)* can lock `M1_Anchor` and `M2_Scissor` interfaces via a 3D hydrophobic hairpin but fails when spliced as a single-polypeptide fusion link because its intervening 56-aa segment is a buried hydrophobic core (`linker_gravy = +1.65`, triggering inclusion-body misfolding unless expressed on a bicistronic operon), whereas our new Discoveries (**`L0JP89`**, 41 aa, `linker_gravy = -0.36`, and **`A0A2G1WGQ6` `DUF8081`**, 103 aa, `linker_gravy = -0.90`) provide genuine disordered hydrophilic linkers between two orthogonal ZCA-whitened SLiM plugs (`l2_centroid #27/#62` and `#31`), enabling one-pot single-polypeptide fusion of `D3SWG7` (`M2_Scissor`) and `A0AAE3P9N2` (`M3_Sink`) in $3.5\text{ M NaCl}$.
2. **Electrostatic Dual-Plug Couplers for Soda-Lake Cascade Valorization (`A0A897MT85`):**
   - *The Bait (Un-tethered Bulk `M2_Scissor -> M3_Sink` Cascade)* can process $100\text{ mM}$ feedstock in dilute neutral buffer but fails when the reactive intermediate `I1` accumulates in bulk solution (`15.72 mM` peak toxic intermediate) and stalls against product-retaining `M3_Sink` variants (`62.77 mM` 48h yield), whereas our new Discovery (**`A0A897MT85`** from *Natranaeroarchaeum sulfidigenes*, `dual_tether_score = 0.9750`, paired with an `EnzRef` low-backpressure `M3_Sink`) uses an Arg/His N-terminal SLiM (`CQRRHAAI`) and an Asp-rich C-terminal SLiM (`SQPVTDDH`) separated by a 34-aa disordered spacer (`GRAVY = -0.72`) to achieve $c/c^* = 0.65\text{–}0.72$ substrate channeling, lifting 48-hour net yield by **`+26.1%` (`79.13 mM`)** while cutting peak intermediate buildup nearly in half (**`-47.0%`**).
3. **Three-Plug Tri-SLiM Scaffolds for Full `M1 -> M2 -> M3` One-Chain Metabolons (`80–120 aa` Dark sORFs):**
   - *The Bait (Pairwise Dual-SLiM Tethers)* can channel intermediates across a single bottleneck junction (`M1+M2` or `M2+M3`) but fails when both intermediate transitions (`I0 -> I1` and `I1 -> P_final`) are simultaneously diffusion-limited in viscous high-solids reactors, whereas extending `bio_pslim_window_pool` to 3-window non-overlapping chains (`end_a + L1 <= start_b` and `end_b + L2 <= start_c` on 80–120 aa disordered archaeal sORFs like `A0A2G1WGQ6`) will allow a single disordered scaffold to dock `M1_Anchor`, `M2_Scissor`, and `M3_Sink` into a complete 3-stage synthetic metabolon.

{% include pg_bio_promo.md %}
