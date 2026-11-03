---
layout: post
title: "Announcing RosettaCommons Chaperone Support in pg_bio & Mining the Twilight Zone at 0.81 Å (DUF7861)"
date: 2026-11-02 22:45:00 -0300
categories: [bioinformatics, pgvector, structural-biology, alphafold, dark-proteome, postgresql, rust, protein-design]
tags: [pg_bio, chaperone, rosettacommons, rasa, buns, twilight-zone-homology, duf7861, natrinema-saccharevitans, halobellus-clavatus, 3dmol]
description: "Announcing Layer 13 in pg_bio: native Rust support for RosettaCommons Chaperone protein design workflows (Shrake-Rupley RASA, 3D H-bond CSR networks, BUNS auditing, and lineage tracking at 36.9x faster than Python), demonstrated on our #1 Twilight-Zone discovery (A0A1S8AT22 vs A0A1H3IA37, 0.81 Å RMSD)."
---

Today we are excited to announce a major new milestone in [`pg_bio`](https://github.com/jonatas/pg_bio): **Layer 13 — Native In-Database Support for [RosettaCommons Chaperone](https://rosettacommons.org/2026/10/19/introducing-chaperone-a-unified-framework-for-protein-design-workflows/) (`RosettaCommons/chaperone`) Protein Design Workflows**, alongside a new **Bell-Curve Twilight-Zone Homology Index** inside our Swarm Discovery engine! By compiling Shrake–Rupley Golden-Section Fibonacci-sphere **RASA (`bio_rasa`)**, 3D **Hydrogen-Bond CSR Networks (`bio_hbond_network`)**, **Buried Unsatisfied Polar Atom (`BUNS`) auditing (`audit_hydrogen_bonds`)**, and **`PipelineDataHandler` lineage hashing (`chaperone_lineage_hash`)** directly into PostgreSQL 18 via Rust (`pgrx`), `pg_bio` evaluates 400 multi-chain complexes in **`209.04 ms` (`0.52 ms`/complex — `36.9x` faster than Python)** and verifies all 8 official Chaperone Core Examples in **`~4.5 ms`**. Even better, when we unleashed the combined **Twilight-Zone + Chaperone RASA** engine on our 226,242-edge Swarm graph, the **#1 ranked hit (`id = 26734`, `twilight_score = 0.8640`)** revealed a stunning **`0.81 Å` C$\alpha$ RMSD** structural lock (`TM-score = 0.927`, per-residue RASA Pearson $r = 0.9509$) between two uncharacterized **`DUF7861` (`PF25260` / `IPR057183`)** proteins from an inland Xinjiang salt lake archaeon (*Natrinema saccharevitans*, `A0A1S8AT22`) and a Korean marine solar saltern archaeon (*Halobellus clavatus*, `A0A1H3IA37`).

<!--more-->

---

## 🚀 Announcing Layer 13 in `pg_bio`: Native RosettaCommons Chaperone Workflows in SQL

Modern *de novo* protein design pipelines—recently unified by [**RosettaCommons Chaperone**](https://rosettacommons.org/2026/10/19/introducing-chaperone-a-unified-framework-for-protein-design-workflows/)—chain generative backbone, inverse-folding, and structure-prediction blocks together through a `PipelineDataHandler`:

$$\text{RFdiffusion3 / RFD3NA (Backbone)} \longrightarrow \text{Foundry-MPNN / LigandMPNN (Sequence)} \longrightarrow \text{AlphaFold3 / Boltz-2 (Oracle)} \longrightarrow \text{Evaluation Blocks (RMSD, RASA, H-Bond)}$$

While GPU inference generates tens of thousands of candidate structures, **post-oracle biophysical evaluation** (`rmsd`, `rasa`, `hbond`) becomes a severe CPU and disk-I/O bottleneck when separate Python processes must parse loose PDB/mmCIF files to catch three classic wet-lab failure modes:
1. **Surface Hydrophobic Aggregation Traps (`rasa`):** Candidates that fold with high `pLDDT` *in silico* but aggregate in *E. coli* expression because too many bulky apolar side-chains (`Val, Ile, Leu, Met, Phe, Trp, Tyr`) remain exposed on the surface ($\text{RASA}_i \ge 0.25$).
2. **Buried Unsatisfied Polar Atoms (`hbond` / BUNS):** Burying a polar $\text{N}$ or $\text{O}$ atom inside a core or binding interface ($\text{SASA} < 0.5\text{–}1.0\text{ Å}^2$) without a hydrogen-bond partner costs $+3\text{ to }+5\text{ kcal/mol}$ in desolvation energy—silently killing binding affinity and fold stability.
3. **Multi-Cycle Lineage Fragmentation (`PipelineDataHandler`):** Iterative `MPNN <-> AF3/Boltz-2` refinement loops require deterministic parent–child lineage hashes so winning constructs trace cleanly back to their seed backbone.

### The 5-Stage `pg_bio` Chaperone Engine (36.9x Faster Than Python)

We built the entire Chaperone evaluation suite natively into [`src/lib.rs`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs):
* **Stage 1 — Voxel-Accelerated Shrake–Rupley SASA & Tien (2013) RASA ([`bio_rasa`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L4222-L4304)):** Evaluates 64 Golden-Ratio Fibonacci sphere points per heavy atom ($r_{\text{probe}} = 1.4\text{ Å}$) using $5\text{ Å}$ 3D spatial voxel hashing (reducing complexity from $O(N^2)$ to $O(N)$) and normalizes per-residue SASA by the **Tien et al. (2013)** empirical maximum ASA scale (plus DNA/RNA nucleotides) to return `total_sasa`, `polar_sasa`, `apolar_sasa`, `mean_rasa`, `core_buried_fraction` ($\text{RASA} < 0.20$), `surface_hydrophobic_fraction`, and `per_residue_rasa`.
* **Stage 2 — 3D Hydrogen-Bond CSR Network ([`bio_hbond_network`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L4366-L4480)) & BUNS Auditor ([`audit_hydrogen_bonds`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L4481-L4682)):** Identifies backbone, side-chain, nucleobase, and `HETATM` ligand donors/acceptors, enforces donor–acceptor distance ($2.20\text{ Å} \le d_{\text{DA}} \le 3.50\text{ Å}$) and antecedent angle ($\ge 100^\circ$), projects the 3D H-bond graph into a Compressed Sparse Row (`SparseAttentionMap`) matrix, and counts `cross_interface_hbonds` and **`buried_unsatisfied_polars` (BUNS)**.
* **Stage 3 — Fused Single-Pass Block Evaluator ([`evaluate_chaperone_block`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L4807-L4853)):** Shares the precomputed atomic SASA buffer with the Kabsch self-consistency $\text{scRMSD}$ aligner, interface $\Delta\text{SASA}$ calculator, BUNS auditor, and 3D gyration tensor globular gate (`is_globular`) in a single zero-copy Rust call.
* **Stage 4 — Content-Addressable Lineage Hashing ([`chaperone_lineage_hash`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L4854-L4875)):** Generates deterministic 64-bit MurmurHash3 (`fmix64`) lineage IDs (`chp_<stage>_c<cycle>_<hash16>`) across design cycles.
* **Stage 5 — All 8 Official Chaperone Core Examples Built Into SQL (`chaperone_core_examples`):** Verifies [`rosettacommons.github.io/chaperone/core-examples/`](https://rosettacommons.github.io/chaperone/core-examples/) (`nanoparticle-design`, `peptide-binder`, `cortisol-binder`, `dna-binder`, `enzyme-glycosidase`, `enzyme-protease`, `ribozyme-hammerhead`, and `multi-mpnn`) in **`~4.5 ms` total**:

| Benchmark Metric (PostgreSQL 18 on Apple Silicon) | Python Pull + Evaluation | `pg_bio` Native Rust Engine | Speedup / Result |
| :--- | :--- | :--- | :--- |
| **400 Multi-Chain Complexes (`144` Heavy Atoms Each)** | `7,709.11 ms` | **`209.04 ms`** (`0.52 ms`/complex) | **`36.9x` faster** |
| **4-Archetype Failure Mode Discrimination** (Pass vs. Drift/Hydro/BUNS) | Partial (no BUNS/RASA) | **`100 / 400` exact recall** | **100% precision** |
| **8 Official Chaperone Core Examples Suite** (`chaperone_core_examples`) | Manual multi-script setup | **`~4.5 ms` total (`8 / 8` verified)** | **Zero external scripts** |

* 📖 **Full Documentation:** [`docs/15_chaperone_protein_design_workflows.md`](https://github.com/jonatas/pg_bio/blob/main/docs/15_chaperone_protein_design_workflows.md)
* 📓 **Interactive Benchmark Notebook:** [`experiments/13_chaperone_protein_design_workflows.ipynb`](https://github.com/jonatas/pg_bio/blob/main/experiments/13_chaperone_protein_design_workflows.ipynb)

---

## The Mathematical Filter: Bell-Curve Twilight-Zone Scoring + Chaperone Auditing in SQL

When you rank 226,000 protein similarity edges purely by vector distance (`<=>`), two extremes crowd the top of the leaderboard: near-identical sequence clones (`100%` identity across sister strains) and short compositional k-mer collisions that share no global 3D fold. Why do traditional BLAST or k-mer pipelines struggle to rank twilight-zone discoveries? Look at the raw sequence numbers for **`A0A1S8AT22`** and **`A0A1H3IA37`**:
* Across their 81 residues, **32 positions have mutated** (`49 / 81` positional identity, or `60.5%`), and their 3-mer compositional cosine distance is a massive **`0.6896`**.
* Under a strict `pg_bio` local Smith-Waterman alignment (`match = +2, mismatch = -1, gap = -2`), their raw score is **`67`** out of a theoretical maximum of `162`—a normalized Smith-Waterman similarity of just **`s = 41.4%`**.

To make PostgreSQL automatically surface pairs with **tight 3D fold lock (`<=>`)** *and* **heavy sequence divergence (`s ≈ 35%–65%`)**, we paired our Chaperone evaluator with a **Bell-Curve Twilight-Zone Index**. Given vector cosine distance $d_{\cos}$, normalized Smith-Waterman similarity $s \in [0, 1]$, length ratio $L_{\text{ratio}} = \min(L_1, L_2)/\max(L_1, L_2)$, and Shannon sequence entropy $H$:

$$\text{Twilight Score} = (1 - d_{\cos})^2 \times \underbrace{\left[4 \cdot s \cdot (1 - s)\right]}_{\text{Bell curve peaking at } s = 0.50} \times L_{\text{ratio}}^2 \times \min\left(\frac{H}{4.0}, 1.0\right) \quad \text{for } s \in [0.10, 0.96]$$

Notice how $4s(1-s)$ acts as a natural biological bandpass filter:
1. **Identical Clones ($s = 1.0$):** $4(1)(0) = 0.0$ — trivial strain duplicates are zeroed out.
2. **Unrelated Noise ($s < 0.10$):** Zeroed out by the homology floor.
3. **The Evolutionary Sweet Spot ($s = 0.414$ for `A0A1S8AT22` vs. `A0A1H3IA37`):** $4(0.414)(0.586) = 0.9704$, propelling edge `id = 26734` to **`twilight_score = 0.8640`**—the single highest cross-genus Twilight-Zone score in the database!

```sql
-- 1. Audit all 8 Official RosettaCommons Chaperone Core Examples in ~4.5 ms
SELECT
    ex.example_name,
    ex.category,
    ROUND(audit.sc_rmsd::numeric, 3) AS sc_rmsd,
    ROUND(audit.interface_delta_sasa::numeric, 1) AS delta_sasa,
    audit.cross_interface_hbonds AS iface_hb,
    audit.buried_unsatisfied_polars AS buns,
    ROUND(audit.active_site_or_motif_rmsd::numeric, 3) AS motif_rmsd,
    audit.passes_example_gate AS pass_gate
FROM chaperone_core_examples() AS ex
CROSS JOIN LATERAL evaluate_chaperone_core_example_block(
    ex.example_name, ex.candidate_pdb, ex.reference_pdb, ex.ligand_smiles
) AS audit;

-- 2. Execute the full Twilight-Zone + RosettaCommons Chaperone RASA/H-Bond correlation on Edge #26734
SELECT
    od.id AS edge_id,
    p1.uniprot_id AS bait_id,
    p2.uniprot_id AS discovery_id,
    ROUND((p1.embedding <=> p2.embedding)::numeric, 4) AS esm2_cosine_dist,
    ROUND(
        (ROW(p1.embedding::vector, p1.sequence)::bio_feature
         <~> ROW(p2.embedding::vector, p2.sequence)::bio_feature)::numeric, 4
    ) AS hybrid_bio_dist,
    smith_waterman_score(p1.sequence, p2.sequence, 2, -1, -2) AS sw_score,
    od.seq_identity_pct AS sw_sim_pct,
    od.twilight_score,
    ROUND(ABS(isoelectric_point(p1.sequence) - isoelectric_point(p2.sequence))::numeric, 2) AS delta_pi,
    ROUND(ABS(gravy_score(p1.sequence) - gravy_score(p2.sequence))::numeric, 2) AS delta_gravy,
    ROUND(c1.mean_rasa::numeric, 3) AS bait_rasa,
    ROUND(c2.mean_rasa::numeric, 3) AS disc_rasa,
    ROUND((c2.core_buried_fraction * 100.0)::numeric, 1) AS buried_core_pct,
    c2.total_hbonds,
    c2.buried_unsatisfied_polars AS buns_count,
    chaperone_lineage_hash('SwarmCompare', p1.uniprot_id, p2.sequence, 1) AS lineage_id
FROM orphan_discoveries od
JOIN proteins p1 ON p1.uniprot_id = od.bait_id
JOIN proteins p2 ON p2.uniprot_id = od.orphan_id
CROSS JOIN LATERAL evaluate_chaperone_block(
    pg_read_file('/Users/jonatas/code/ideia.me/assets/models/AF-A0A1S8AT22.pdb'),
    pg_read_file('/Users/jonatas/code/ideia.me/assets/models/AF-A0A1S8AT22.pdb'),
    'A', 'B'
) c1
CROSS JOIN LATERAL evaluate_chaperone_block(
    pg_read_file('/Users/jonatas/code/ideia.me/assets/models/AF-A0A1H3IA37.pdb'),
    pg_read_file('/Users/jonatas/code/ideia.me/assets/models/AF-A0A1S8AT22.pdb'),
    'A', 'B'
) c2
WHERE od.id = 26734;
```

---

## Full Biophysical & Chaperone Comparison: `A0A1S8AT22` vs. `A0A1H3IA37`

| Biophysical & Structural Metric | Bait: `A0A1S8AT22` | Discovery: `A0A1H3IA37` | Biological & Structural Interpretation |
| :--- | :--- | :--- | :--- |
| **Organism & Taxon** | *Natrinema saccharevitans* (`OX=301967`, *Natrialbaceae*) | *Halobellus clavatus* (`OX=660517`, *Haloferacaceae*) | Cross-family divergence across *Halobacteriales* |
| **Native Habitat** | Inland hypersaline lake (Xinjiang, China; sugar-utilizing) | Marine solar saltern (Korea; coastal evaporative brine) | Continental sulfate/chloride lake vs. thalassohaline marine saltern |
| **Gene / Locus Tag** | `A6E15_02450` (Uncharacterized protein) | `SAMN04487946_10985` (Uncharacterized protein) | Both annotated as uncharacterized dark proteome |
| **Domain Architecture** | `IPR057183` / `PF25260` (`DUF7861`) | `IPR057183` / `PF25260` (`DUF7861`) | Domain of Unknown Function `DUF7861` (full chain) |
| **Sequence Length & Mass** | `81 aa` (`8.90 kDa`) | `81 aa` (`9.09 kDa`) | Zero indels; exact 81-residue chain length conservation |
| **Pairwise Sequence Divergence** | `49 / 81` identical (`60.5%`), `SW(2,-1,-2) = 67` (`41.4%`) | `32` amino acid substitutions (`3-mer dist = 0.6896`) | Heavy primary sequence remodeling across 32 positions |
| **ESM-2 Vector Distance (`<=>`)** | `0.0000` (Reference) | **`0.0563`** (`<~> = 0.1770`) | Deep transformer embedding recognizes identical 3D topology |
| **Twilight-Zone Homology Index** | Reference Bait | **`0.8640` (#1 Rank in Swarm DB)** | Highest bell-curve convergence-to-divergence ratio in 226k edges |
| **3D Kabsch Core RMSD & TM-Score** | Reference (`81 CA`) | **`0.81 Å` across `79 / 81` C$\alpha$ atoms (`TM = 0.927`)** | Sub-angstrom full-backbone lock across 97.5% of the chain |
| **AlphaFold Mean pLDDT** | **`90.2`** (Very High) | **`91.3`** (Very High) | Exceptionally rigid, high-confidence 3D fold in both species |
| **Secondary Structure (`81 aa`)** | `44 aa` $\beta$-sheet (`54.3%`), `15 aa` $\alpha$-helix (`18.5%`), `22 aa` loop | `45 aa` $\beta$-sheet (`55.6%`), `15 aa` $\alpha$-helix (`18.5%`), `21 aa` loop | 5-stranded antiparallel $\beta$-cradle capped by $\alpha$-helix `50–58` |
| **Isoelectric Point (`pI`) & Basic %** | **`pI = 6.95`** (`18.5%` Basic: `9 R, 1 K, 5 H`; `14.8%` Acidic) | **`pI = 7.56`** (`21.0%` Basic: `9 R, 3 K, 5 H`; `13.6%` Acidic) | **$\Delta\text{pI} = +0.61$**: Rare neutral-to-basic halophilic electrostatics |
| **Hydropathy (`GRAVY` & Apolar Surface)** | `GRAVY = -0.206` (`40.7%` hydrophobic, `18.2%` apolar surface) | `GRAVY = -0.479` (`34.6%` hydrophobic, `15.1%` apolar surface) | **$\Delta\text{GRAVY} = 0.273$**: *H. clavatus* sheds `3.1%` surface hydrophobicity |
| **Chaperone RASA & Core Burial** | `Mean RASA = 0.365` (**`28.4%` buried core**, `23` residues) | `Mean RASA = 0.367` (**`28.4%` buried core**, `23` residues) | **Per-residue RASA Pearson $r = 0.9509$** across all 81 residues |
| **H-Bond CSR Network & BUNS** | `63` H-bonds (`9` BUNS, $R_g = 11.91\text{ Å}$) | `64` H-bonds (`7` BUNS, $R_g = 11.81\text{ Å}$) | Passes RosettaCommons Chaperone Gate (`chp_swarmcompare_c1_ef19a0dd181befda`) |
| **Key Active & Redox Motifs** | `His3–Asp4–His32` dyad (`4.29 Å`), `0 Cys` (`Ala33`, `Val58`) | `His3–Asp4–His32` dyad (`4.99 Å`), **`2 Cys` (`Cys33`–`Cys58` at `7.11 Å`)** | Marine saltern ortholog adds a core-flanking `Cys33/Cys58` dithiol pair |

---

## Defying the Halophile Rule: Why Is a Salt-Loving Archaeal Protein Basic (`pI = 7.56`)?

If you have followed our previous discoveries in *Haloferax*, *Halogeometricum*, and *Haloprofundus*, you know the golden rule of halophilic protein evolution: to survive in $3\text{–}5\text{ M }\text{NaCl}$ or $\text{KCl}$ without salting out and aggregating, halophilic proteins coat their solvent-accessible surfaces with negatively charged Aspartate (`Asp`) and Glutamate (`Glu`) residues, driving their isoelectric points down to **`pI ≈ 4.0–4.5`**.

Why do both **`A0A1S8AT22` (`pI = 6.95`)** and **`A0A1H3IA37` (`pI = 7.56`)** break that rule?
1. **An Electropositive Arginine–Histidine Crown (`18.5%` to `21.0%` Basic Residues):**
   Both 81-residue chains pack **9 conserved Arginines (`Arg5, Arg9, Arg17, Arg29, Arg54, Arg59, Arg60, Arg73, Arg77`)** and **5 Histidines (`His3, His7, His13, His32` plus `His79` in *H. clavatus*)** onto a compact $\beta$-grasp/SH3-like cradle (`54–56%` $\beta$-sheet). In high-salt cytoplasm ($4\text{ M }\text{KCl}$), simple electrostatic attraction from Lysine ($\text{NH}_3^+$) to DNA/RNA is heavily screened by counter-ions. **Arginine’s planar guanidinium group**, however, forms directional, bidentate hydrogen bonds and cation–$\pi$ stacks with nucleic acid bases and phosphate backbones that remain stable even in saturated brine.
2. **The Buried `Trp18–Trp75–Tyr76` Aromatic Staple (`0.00–0.18` RASA):**
   When we ran `pg_bio`'s Fibonacci-sphere Shrake–Rupley [`bio_rasa`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L4222-L4304) engine on both structures, their per-residue solvent accessibility profiles correlated at **Pearson $r = 0.9509$** across all 81 residues. Both proteins lock their N-terminal and C-terminal $\beta$-strands together using an ultra-conserved C-terminal **`73-RVWYR-77` clamp** that packs against `Trp18` (`Trp18`–`Trp75` distance `9.87–10.71 Å`, `Trp18`–`Tyr76` `10.96–10.99 Å`), while `Val37`, `Leu47`, `Val49`, and `Val74` exhibit **`0.00` RASA** (100% solvent-excluded core).
3. **The `His3–Asp4–His32` Pocket (`4.29–4.99 Å`) & *Halobellus* `Cys33/Cys58` Dithiol Switch:**
   Although `His3` (`1-MAHDRIH-7`) and `His32` (`29-RDGH-32` / `29-RNGH-32`) are separated by 29 residues in sequence, the antiparallel $\beta$-sheet folds them directly face-to-face (`4.29 Å` in *Natrinema*, `4.99 Å` in *Halobellus*) next to `Asp4`. Even more intriguingly, while the inland desert-lake *Natrinema* protein contains **zero cysteines** (`Ala33` and `Val58`), the marine solar-saltern *Halobellus clavatus* ortholog substitutes **two cysteines (`Cys33` on $\beta$-strand 3 and `Cys58` at the C-terminus of the `50–58` $\alpha$-helix)** whose sulfur atoms ($\text{S}\gamma-\text{S}\gamma$) sit **`7.11 Å` apart**—a classic poised dithiol/metal-sensing switch for shallow sunlit salterns experiencing diurnal photo-oxidative stress.

---

## Interactive 3Dmol.js Structural Validation (`0.81 Å` Core RMSD)

Both AlphaFold structures below are loaded locally from pre-aligned coordinates (`/assets/models/AF-A0A1S8AT22.pdb` and `/assets/models/AF-A0A1H3IA37.pdb`). Thanks to our built-in `pg_bio_sync.js` controller:
* **Double-click either 3D canvas** to lock both cameras into synchronized 3D rotation and zoom.
* **Click any residue or atom** on one protein to automatically highlight the corresponding structural position on its partner.
* Use the **interactive chemistry buttons** below to inspect the `0.81 Å` superposition, the `His3–Asp4–His32` dyad and `Cys33/Cys58` switch, the Arginine–Aromatic nucleic-acid clamp, and the `r = 0.951` buried RASA core.

<script src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"></script>
<script src="/assets/js/pg_bio_sync.js"></script>

<div style="display: flex; gap: 16px; flex-wrap: wrap; margin: 20px 0;">
  <div style="flex: 1; min-width: 300px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px;">
    <div style="color: #22d3ee; font-weight: bold; margin-bottom: 6px; font-size: 0.95em;">
      Bait: A0A1S8AT22 (<i>Natrinema saccharevitans</i> — 81 aa, pLDDT 90.2, pI 6.95)
    </div>
    <div id="bait-viewer" class=" viewer_3Dmoljs"
         data-href="/assets/models/AF-A0A1S8AT22.pdb"
         data-backgroundcolor="0x0f172a"
         data-style="cartoon:color=cyan"
         style="width: 100%; height: 420px; position: relative; border-radius: 6px; overflow: hidden;">
    </div>
  </div>
  <div style="flex: 1; min-width: 300px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px;">
    <div style="color: #f472b6; font-weight: bold; margin-bottom: 6px; font-size: 0.95em;">
      Discovery: A0A1H3IA37 (<i>Halobellus clavatus</i> — 81 aa, pLDDT 91.3, pI 7.56)
    </div>
    <div id="disc-viewer" class=" viewer_3Dmoljs"
         data-href="/assets/models/AF-A0A1H3IA37.pdb"
         data-backgroundcolor="0x0f172a"
         data-style="cartoon:color=magenta"
         style="width: 100%; height: 420px; position: relative; border-radius: 6px; overflow: hidden;">
    </div>
  </div>
</div>

<div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0;">
  <button onclick="superposeTwilightCore()" style="background:#0284c7;color:#fff;border:none;padding:8px 13px;border-radius:6px;cursor:pointer;font-weight:600;">🧬 Superpose 0.81 Å Twilight-Zone Core (TM = 0.927)</button>
  <button onclick="highlightHisDyadAndCysSwitch()" style="background:#b45309;color:#fff;border:none;padding:8px 13px;border-radius:6px;cursor:pointer;font-weight:600;">⚡ Highlight His3–Asp4–His32 Dyad &amp; Cys33/Cys58 Switch</button>
  <button onclick="highlightArginineAromaticClamp()" style="background:#7c3aed;color:#fff;border:none;padding:8px 13px;border-radius:6px;cursor:pointer;font-weight:600;">🧲 Highlight Arginine–Aromatic Cation-π Crown</button>
  <button onclick="highlightBuriedRasaCore()" style="background:#059669;color:#fff;border:none;padding:8px 13px;border-radius:6px;cursor:pointer;font-weight:600;">🛡️ Highlight 28.4% Buried RASA Core (r = 0.951)</button>
  <button onclick="highlightPlddtConfidence()" style="background:#334155;color:#fff;border:none;padding:8px 13px;border-radius:6px;cursor:pointer;font-weight:600;">🎯 Color by AlphaFold pLDDT Confidence</button>
  <button onclick="resetTwilightViewers()" style="background:#dc2626;color:#fff;border:none;padding:8px 13px;border-radius:6px;cursor:pointer;font-weight:600;">🔄 Reset Split View</button>
</div>

<div id="chemistry-lesson" style="background: #1e293b; border-left: 4px solid #38bdf8; color: #e2e8f0; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; font-size: 0.95em; line-height: 1.55;">
  <b>Interactive Structure Explorer:</b> Click any button above to inspect how <code>A0A1S8AT22</code> (<i>Natrinema saccharevitans</i>, cyan) and <code>A0A1H3IA37</code> (<i>Halobellus clavatus</i>, magenta) preserve a <b>0.81 Å Cα RMSD</b> <code>DUF7861</code> β-cradle across 32 amino acid substitutions, a <code>His3–Asp4–His32</code> catalytic/metal dyad, and a 9-Arginine electropositive crown built for high-salt nucleic acid binding.
</div>

<script>
let cachedBait81 = null;
let cachedDisc81 = null;

async function ensureModelsLoaded81() {
  if (!cachedBait81) {
    cachedBait81 = await fetch('/assets/models/AF-A0A1S8AT22.pdb').then(r => r.text());
  }
  if (!cachedDisc81) {
    cachedDisc81 = await fetch('/assets/models/AF-A0A1H3IA37.pdb').then(r => r.text());
  }
}

async function superposeTwilightCore() {
  await ensureModelsLoaded81();
  const viewers = Object.values(window.$3Dmol.viewers);
  viewers.forEach((viewer, idx) => {
    viewer.removeAllModels();
    viewer.removeAllLabels();
    viewer.removeAllShapes();
    viewer.addModel(cachedBait81, "pdb");
    viewer.addModel(cachedDisc81, "pdb");
    viewer.setStyle({model: 0}, {cartoon: {color: "cyan", opacity: 0.92}});
    viewer.setStyle({model: 1}, {cartoon: {color: "magenta", opacity: 0.92}});
    viewer.addLabel("79/81 CA Aligned (0.81 Å RMSD, TM = 0.927)", {
      position: {resi: 52},
      backgroundColor: "#0f172a",
      fontColor: "#38bdf8",
      fontSize: 11
    });
    viewer.zoomTo();
    viewer.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<b>0.81 Å Twilight-Zone Superposition (79 / 81 Cα Atoms, TM-Score = 0.927):</b> Both models are now rendered together in the same 3D coordinate frame! Even though <b>32 of the 81 residues have mutated</b> between continental <i>Natrinema saccharevitans</i> (cyan) and marine-saltern <i>Halobellus clavatus</i> (magenta) (normalized Smith-Waterman similarity <code>41.4%</code>), the 5-stranded antiparallel β-cradle and the flanking α-helix (residues <code>50–58</code>) trace virtually identical atomic paths.";
}

async function highlightHisDyadAndCysSwitch() {
  await ensureModelsLoaded81();
  const viewers = Object.values(window.$3Dmol.viewers);
  viewers.forEach((viewer, idx) => {
    viewer.removeAllModels();
    viewer.removeAllLabels();
    viewer.removeAllShapes();
    viewer.addModel(idx === 0 ? cachedBait81 : cachedDisc81, "pdb");
    viewer.setStyle({}, {cartoon: {color: idx === 0 ? "cyan" : "magenta", opacity: 0.32}});
    // Conserved His3, Asp4, His7, His13, His32
    viewer.setStyle({resi: [3, 4, 7, 13, 32]}, {
      cartoon: {color: "#38bdf8", opacity: 0.9},
      stick: {radius: 0.24, colorscheme: "cyanCarbon"}
    });
    viewer.addLabel("His3–Asp4–His32 Dyad (" + (idx === 0 ? "4.29 Å" : "4.99 Å") + ")", {
      position: {resi: 32},
      backgroundColor: "#0369a1",
      fontColor: "white",
      fontSize: 11
    });
    if (idx === 0) {
      viewer.setStyle({resi: [33, 58]}, {stick: {radius: 0.22, colorscheme: "grayCarbon"}});
      viewer.addLabel("Ala33 / Val58 (0 Cys in Natrinema)", {
        position: {resi: 33},
        backgroundColor: "#334155",
        fontColor: "#e2e8f0",
        fontSize: 11
      });
    } else {
      viewer.setStyle({resi: [33, 58]}, {
        cartoon: {color: "#facc15", opacity: 1.0},
        stick: {radius: 0.28, colorscheme: "yellowCarbon"},
        sphere: {atoms: "SG", radius: 0.85, color: "#facc15"}
      });
      viewer.addLabel("Cys33–Cys58 Redox/Metal Pair (7.11 Å)", {
        position: {resi: 33},
        backgroundColor: "#b45309",
        fontColor: "white",
        fontSize: 11
      });
    }
    viewer.zoomTo({resi: [3, 4, 32, 33, 58]});
    viewer.zoom(0.8);
    viewer.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<b>Conserved <code>His3–Asp4–His32</code> Pocket &amp; Marine Saltern <code>Cys33/Cys58</code> Switch:</b> Folding of the antiparallel β-sheet brings N-terminal <code>His3</code> and <code>Asp4</code> directly against <code>His32</code> (<b>4.29 Å</b> in <i>Natrinema</i>, <b>4.99 Å</b> in <i>Halobellus</i>), forming a pre-organized divalent metal/proton relay. Look just behind <code>His32</code>: while inland <i>Natrinema</i> (left) packs aliphatic <code>Ala33</code> and <code>Val58</code>, coastal solar-saltern <i>Halobellus clavatus</i> (right) evolves two golden cysteines (<code>Cys33</code> and <code>Cys58</code>, <b>7.11 Å Sγ–Sγ</b>) bridging β-strand 3 and α-helix 1!";
}

async function highlightArginineAromaticClamp() {
  await ensureModelsLoaded81();
  const viewers = Object.values(window.$3Dmol.viewers);
  viewers.forEach((viewer, idx) => {
    viewer.removeAllModels();
    viewer.removeAllLabels();
    viewer.removeAllShapes();
    viewer.addModel(idx === 0 ? cachedBait81 : cachedDisc81, "pdb");
    viewer.setStyle({}, {cartoon: {color: "white", opacity: 0.28}});
    // 9 conserved Arginines + Lys10
    viewer.setStyle({resi: [5, 9, 10, 17, 29, 54, 59, 60, 73, 77]}, {
      cartoon: {color: "#60a5fa", opacity: 0.9},
      stick: {radius: 0.22, colorscheme: "blueCarbon"}
    });
    // Conserved Aromatic Clamp: Trp18, Trp75, Tyr76
    viewer.setStyle({resi: [18, 75, 76]}, {
      cartoon: {color: "#c084fc", opacity: 1.0},
      stick: {radius: 0.26, colorscheme: "magentaCarbon"}
    });
    viewer.addLabel("9-Arg Electropositive Crown (pI " + (idx === 0 ? "6.95" : "7.56") + ")", {
      position: {resi: 59},
      backgroundColor: "#1d4ed8",
      fontColor: "white",
      fontSize: 11
    });
    viewer.addLabel("Trp18–Trp75–Tyr76 Clamp (73-RVWYR-77)", {
      position: {resi: 75},
      backgroundColor: "#6d28d9",
      fontColor: "white",
      fontSize: 11
    });
    viewer.zoomTo();
    viewer.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<b>Why Basic Proteins Survive 4 M Salt — The 9-Arginine &amp; Aromatic Cation–π Crown:</b> Unlike typical acidic halophilic enzymes (<code>pI ~ 4.2</code>), both <code>DUF7861</code> proteins maintain a neutral-to-basic isoelectric point (<b>pI 6.95 → 7.56</b>) anchored by <b>9 invariant Arginines</b> (blue sticks: <code>Arg5, 9, 17, 29, 54, 59, 60, 73, 77</code>) and a buried <b>Trp18–Trp75–Tyr76 aromatic triad</b> (purple sticks, C-terminal motif <code>73-RVWYR-77</code>). In saturated brine, guanidinium side-chains form salt-resistant bidentate hydrogen bonds and cation–π stacks with nucleic acid backbones.";
}

async function highlightBuriedRasaCore() {
  await ensureModelsLoaded81();
  const buried1 = [4, 6, 8, 11, 18, 21, 23, 33, 34, 35, 37, 39, 47, 49, 54, 57, 61, 69, 72, 74, 75, 76, 77];
  const buried2 = [4, 6, 8, 11, 18, 21, 23, 33, 34, 35, 36, 37, 39, 45, 47, 49, 57, 61, 69, 74, 75, 76, 77];
  const viewers = Object.values(window.$3Dmol.viewers);
  viewers.forEach((viewer, idx) => {
    viewer.removeAllModels();
    viewer.removeAllLabels();
    viewer.removeAllShapes();
    viewer.addModel(idx === 0 ? cachedBait81 : cachedDisc81, "pdb");
    viewer.setStyle({}, {cartoon: {color: idx === 0 ? "cyan" : "magenta", opacity: 0.30}});
    const bList = idx === 0 ? buried1 : buried2;
    viewer.setStyle({resi: bList}, {
      cartoon: {color: "#10b981", opacity: 1.0},
      stick: {radius: 0.22, colorscheme: "greenCarbon"}
    });
    // Zero-RASA (0.00) ultra-buried quartet: Val37, Leu47, Val49, Val74
    viewer.setStyle({resi: [37, 47, 49, 74]}, {
      sphere: {radius: 0.75, color: "#f59e0b"}
    });
    viewer.addLabel("23 Buried Core Residues (28.4%, RASA r = 0.951)", {
      position: {resi: 47},
      backgroundColor: "#065f46",
      fontColor: "white",
      fontSize: 11
    });
    viewer.zoomTo();
    viewer.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<b>RosettaCommons Chaperone RASA Audit (28.4% Buried Core, Pearson <i>r</i> = 0.9509):</b> Using <code>pg_bio</code>'s native Rust <code>bio_rasa(pdb, 1.4)</code> Shrake–Rupley engine, both proteins bury <b>exactly 23 of 81 residues (28.4%)</b> below <code>RASA &lt; 0.20</code> (emerald green), with four hydrophobic core locks (<code>Val37, Leu47, Val49, Val74</code>, gold spheres) achieving <b>0.00 RASA</b> (100% water-excluded) while 63–64 intramolecular hydrogen bonds stabilize the globular fold (<i>R<sub>g</sub></i> = <code>11.81–11.91 Å</code>).";
}

async function highlightPlddtConfidence() {
  await ensureModelsLoaded81();
  const getColor = function(atom) {
    const b = atom.b <= 1.0 ? atom.b * 100.0 : atom.b;
    if (b > 90) return '#0053d6';
    if (b > 70) return '#65cbff';
    if (b > 50) return '#ffdb13';
    return '#ff7d45';
  };
  const viewers = Object.values(window.$3Dmol.viewers);
  viewers.forEach((viewer, idx) => {
    viewer.removeAllModels();
    viewer.removeAllLabels();
    viewer.removeAllShapes();
    viewer.addModel(idx === 0 ? cachedBait81 : cachedDisc81, "pdb");
    viewer.setStyle({}, {cartoon: {colorfunc: getColor}});
    viewer.addLabel(idx === 0 ? "Mean pLDDT: 90.2" : "Mean pLDDT: 91.3", {
      position: {resi: 49},
      backgroundColor: "#0053d6",
      fontColor: "white",
      fontSize: 11
    });
    viewer.zoomTo();
    viewer.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<b>AlphaFold pLDDT Confidence Assessment (90.2 vs. 91.3):</b> Nearly the entire 81-residue <code>DUF7861</code> domain in both <i>Natrinema saccharevitans</i> and <i>Halobellus clavatus</i> scores in the highest AlphaFold confidence band (<code>pLDDT &gt; 90</code>, deep blue), confirming that the 0.81 Å superposition reflects a rock-solid globular core rather than disordered loop coincidence.";
}

async function resetTwilightViewers() {
  await ensureModelsLoaded81();
  const viewers = Object.values(window.$3Dmol.viewers);
  viewers.forEach((viewer, idx) => {
    viewer.removeAllModels();
    viewer.removeAllLabels();
    viewer.removeAllShapes();
    viewer.addModel(idx === 0 ? cachedBait81 : cachedDisc81, "pdb");
    viewer.setStyle({}, {cartoon: {color: idx === 0 ? "cyan" : "magenta"}});
    viewer.zoomTo();
    viewer.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<b>Split Comparison View Restored:</b> Double-click either viewer to synchronize camera rotation, or click any residue on <code>A0A1S8AT22</code> (cyan) to highlight its structural counterpart on <code>A0A1H3IA37</code> (magenta).";
}
</script>

---

## The Horizon: Future Research Ideas

*The Bait (`A0A1S8AT22` from continental salt-lake *Natrinema saccharevitans*) can fold into a compact 81-residue `DUF7861` $\beta$-cradle with a 9-Arginine nucleic-acid-binding crown and a `His3–Asp4–His32` pocket in steady inland sulfate/chloride brines, but lacks a covalent or metal-bridging dithiol switch when exposed to fluctuating redox potentials and UV-driven oxidative stress, whereas our new Discovery (`A0A1H3IA37` from coastal solar-saltern *Halobellus clavatus*) executes the exact same 3D fold (`0.81 Å` RMSD, `TM = 0.927`) while installing a `Cys33–Cys58` dithiol pair (`7.11 Å`), shifting its isoelectric point to `pI = 7.56`, and reducing surface apolar area to `15.1%`, making it a prime scaffold for high-salt synthetic transcription factors, redox-gated RNA chaperones, and cell-free halophilic biosensors.*

Here are three concrete experimental and computational pipelines where `A0A1S8AT22` and `A0A1H3IA37` can be deployed immediately:

* **Salt-Proof Nucleic Acid Chaperones for High-Ionic-Strength Cell-Free Systems & Nanopore Buffers:** Standard mesophilic RNA/DNA-binding modules lose affinity above `0.3 M NaCl` because counter-ion condensation screens lysine–phosphate interactions. Because `A0A1H3IA37` maintains 9 invariant Arginines (`Arg5, 9, 17, 29, 54, 59, 60, 73, 77`) and a `Trp18–Trp75–Tyr76` cation–$\pi$ clamp on a hyper-compact `9.09 kDa` scaffold (`RASA buried core = 28.4%`) that is natively soluble in `3–4 M NaCl`, it can serve as an ultra-small recruitment domain for tethering polymerases or CRISPR effectors to nucleic acids inside high-salt nanopore sequencing buffers (`1 M KCl`).
* **Redox- & Metal-Gated Allosteric Switches via the `Cys33–Cys58` Bridge:** Comparing the natural `Ala33/Val58` pair in `A0A1S8AT22` against the `Cys33/Cys58` pair (`7.11 Å`) in `A0A1H3IA37` gives protein engineers a nature-validated blueprint for introducing a reversible disulfide or $\text{Zn}^{2+}/\text{Cd}^{2+}$ bridge between $\beta$-strand 3 and the `50–58` $\alpha$-helix without perturbing the `0.81 Å` backbone (`RASA Pearson r = 0.9509`).
* **Scaling Twilight-Zone + Chaperone RASA Screening Across the Remaining 124,000 Dark Proteins:** By executing `smith_waterman_score()`, `sequence_entropy()`, `bio_rasa()`, and `evaluate_chaperone_block()` directly inside PostgreSQL's shared memory buffers in Rust, `pg_bio` eliminates the Python serialization bottleneck—turning a 2.34-million-protein sequence database into a real-time structural discovery engine.
