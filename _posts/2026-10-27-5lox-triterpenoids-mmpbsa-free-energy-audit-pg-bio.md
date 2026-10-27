---
layout: post
title: "Auditing 500 ns Molecular Dynamics in SQL: Triterpenoids, 5-Lipoxygenase, and Cryptic Allosteric Pockets with pg_bio"
date: 2026-10-26 22:00:00 -0400
categories: [bioinformatics, postgresql, rust, molecular-dynamics, drug-discovery]
tags: [pg_bio, 5-lox, alox5, triterpenoids, mmpbsa, mmgbsa, amazonia, ufam, structural-biology, sql]
description: "How we turned 4.5 microseconds of UFAM/COARACI 5-lipoxygenase triterpenoid molecular dynamics (Zenodo 23565306) into an in-database thermodynamic ledger and CSR call-graph profiler using PostgreSQL 18 and Rust."
---

When an Amazonian medicinal tree bleeds resin—whether *Protium* Pitch (*breu-branco*) rich in **$\alpha$-amyrin** and **$\beta$-amyrin**, or *Boswellia* frankincense rich in **3-O-acetyl-11-keto-$\beta$-boswellic acid (AKBA)**—it deploys a class of rigid, pentacyclic $C_{30}$ scaffolds called **triterpenoids**. For decades, ethnopharmacologists and medicinal chemists have known that these natural products calm runaway inflammation by targeting **human 5-lipoxygenase (5-LOX / `ALOX5`, UniProt `P09917`, ChEMBL `CHEMBL215`)**, the rate-limiting enzyme in leukotriene biosynthesis.

Recently, **Fábio J. N. Ferreira, Rhanna V. A. da Silva, Tallita M. Machado, and Fernanda Guilhon-Simplicio** at the **Federal University of Amazonas (UFAM)** published an extraordinary, open-science molecular dynamics benchmark on Zenodo ([DOI: 10.5281/zenodo.23565306](https://doi.org/10.5281/zenodo.23565306), version `r22-1.0.2`, computed on the COARACI Supercomputer). They simulated **nine pentacyclic triterpenoids** inside the interdomain allosteric cleft of Stable-5-LOX (`PDB: 6NCF`, chain B) across **$9 \times 500\text{ ns} = 4.5\text{ }\mu\text{s}$** of explicit-solvent molecular dynamics, paired with full **676-residue MM/GBSA and MM/PBSA free-energy decompositions** (`12,186` residue-level energetic rows and `45,000` time-resolved pocket decomposition frames).

There is just one catch when you open a dataset of this caliber: **why does $\alpha$-amyrin score $-35.47\text{ kcal/mol}$ in MM/GBSA, yet jump to $-3.48\text{ kcal/mol}$ in MM/PBSA—while AKBA shifts from $-33.36\text{ kcal/mol}$ to $+0.76\text{ kcal/mol}$?** And if you only inspect the 9 pre-selected operational pocket residues (`Arg68–Thr137`), what stabilizing contacts across the other 667 residues of 5-LOX are silently escaping your radar?

Today, we are going to load all 82,000+ thermodynamic, structural, and chemical records of Zenodo `23565306` directly into **PostgreSQL 18** and introduce five new Rust primitives in [`pg_bio`](https://github.com/jonatas/pg_bio) that turn SQL into a **Double-Entry Thermodynamic Auditor** and **Compressed Sparse Row (CSR) Allosteric Hotspot Profiler**—running **31.14x faster** than Python pandas/NumPy pipelines!

<!--more-->

---

## Computer Science Analogies for Molecular Dynamics & Free-Energy Decomposition

If you come from distributed systems, database kernels, or performance engineering, biophysical terminology like *end-state continuum solvation*, *apolar cavity dispersion*, or *allosteric preorganization* can feel opaque. Before writing our first line of SQL, let's map the physics of Zenodo `23565306` onto three exact Computer Science mental models:

| Biophysical Concept | Computer Science Analogy | What `pg_bio` Computes Inside PostgreSQL |
| :--- | :--- | :--- |
| **MM/GBSA vs. MM/PBSA Decomposition Closure** | **Double-Entry Financial Ledger Auditing** | Every microservice (each of the `676` protein residues + `1` ligand) reports its local resource bill ($\Delta G_{\text{int}}, \Delta G_{\text{vdW}}, \Delta G_{\text{elec}}, \Delta G_{\text{polar}}$). When you sum all 677 line items, does it reconcile with the global invoice (`DELTA TOTAL`)? `audit_mmpbsa_decomposition()` proves that gas-phase (`GGAS`) and polar solvation (`EGB`/`EPB`) close to $\le 0.0026\text{ kcal/mol}$, while exposing an **unallocated infrastructure tax**: in MM/PBSA, per-residue nonpolar terms report `0.00 kcal/mol`, whereas the global solver bills a **`+20.72` to `+26.05 kcal/mol` cavity + dispersion tax (`ENPOLAR + EDISPER`)** (`solvent_shift_penalty()`). |
| **676-Residue Energetic Network (`SparseAttentionMap`)** | **FlameGraph / Call-Graph Profiling for Cryptic Bottlenecks** | Inspecting only a fixed 9-residue pocket (`Arg68–Thr137`) is like monitoring 9 hardcoded endpoints in Grafana while ignoring 667 other services in your cluster. `build_energy_hotspot_map()` compiles the 676-residue decomposition into a **Compressed Sparse Row (CSR) bipartite graph**, and `discover_cryptic_hotspots()` diffs the live energetic call graph against the hardcoded watchlist—automatically discovering **`Ile126`**, **`Val29`**, and **`Leu66`** as an unannotated hydrophobic cradle! |
| **500 ns Time-Resolved Pocket Trajectories (`PreorganizationProfile`)** | **Prometheus Latency Histograms & SLA Uptime Windows** | Average binding energy is like average HTTP latency—it hides tail spikes and bimodal regime switches. By casting 500-frame per-residue time series into `PreorganizationProfile` and querying `ensemble_fraction_between()`, we measure the exact **SLA Uptime** of individual salt-bridge locks (such as `AKBA` holding `Glu134` below $-1.0\text{ kcal/mol}$ for **64.8% of the 500 ns trajectory**). |

---

## 1. The Chemical & Bioactivity Ground Truth: Morgan Fingerprints Meets ChEMBL & PubChem

The UFAM dataset evaluates **9 pentacyclic triterpenoids** spanning three classical triterpene skeletons (**ursane**, **oleanane**, and **lupane**) plus four oxidized/esterified derivatives. Using `pg_bio`'s native Rust SMILES parser (`parse_smiles`), 2048-bit Morgan ECFP4 generator (`smiles_to_fingerprint`), and overloaded `%` Tanimoto operator, we cross-validated the nine ligands against **ChEMBL v36 (`CHEMBL215`)**, **PubChem PUG-REST**, and **RCSB PDB (`P09917`)**:

```sql
SELECT
    t.system_id,
    t.ligand_label,
    t.formula,
    ROUND(t.mw::numeric, 2) AS mw_da,
    t.hbd,
    t.hba,
    ROUND(t.tpsa::numeric, 1) AS tpsa_a2,
    ROUND((t.morgan_fp % ref.morgan_fp)::numeric, 4) AS pg_bio_tanimoto_to_alpha_amyrin,
    ROUND(r.rdkit_tanimoto_2048::numeric, 4) AS rdkit_tanimoto_ref
FROM lox5_triterpenoids t
CROSS JOIN (
    SELECT morgan_fp FROM lox5_triterpenoids WHERE system_id = '1-alfa-amirina'
) ref
LEFT JOIN lox5_rdkit_tanimoto_pairs r
  ON r.system_1 = '1-alfa-amirina' AND r.system_2 = t.system_id
ORDER BY pg_bio_tanimoto_to_alpha_amyrin DESC;
```

| System ID | Ligand | Skeleton / Class | Formula | HBD / HBA | TPSA ($\text{\AA}^2$) | `pg_bio` Tanimoto (vs $\alpha$-Amyrin) | Official Cross-Validation (PubChem / ChEMBL `CHEMBL215`) |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **`1-alfa-amirina`** | **$\alpha$-Amyrin** | Ursane alcohol | $\text{C}_{30}\text{H}_{50}\text{O}$ | 1 / 1 | `20.2` | `1.0000` | PubChem `CID 73170` · `CHEMBL455098` |
| **`2-beta-amirina`** | **$\beta$-Amyrin** | Oleanane alcohol | $\text{C}_{30}\text{H}_{50}\text{O}$ | 1 / 1 | `20.2` | `0.8182` | Constitutional isomer of $\alpha$-Amyrin (E-ring gem-dimethyl shift) |
| **`4-alfa-amirina-acetato`** | **$\alpha$-Amyrin acetate** | Ursane C3-ester | $\text{C}_{32}\text{H}_{52}\text{O}_2$ | 0 / 2 | `26.3` | `0.7857` | C3-acetylated ursane (`0` H-bond donors) |
| **`5-beta-amirina-acetato`** | **$\beta$-Amyrin acetate** | Oleanane C3-ester | $\text{C}_{32}\text{H}_{52}\text{O}_2$ | 0 / 2 | `26.3` | `0.6444` | C3-acetylated oleanane (`0` H-bond donors) |
| **`3-lupeol`** | **Lupeol** | Lupane alcohol | $\text{C}_{30}\text{H}_{50}\text{O}$ | 1 / 1 | `20.2` | `0.6279` | PubChem `CID 259846` · `CHEMBL289191` (5-membered E-ring + isopropenyl) |
| **`8-101663382`** | **PubChem 101663382** | Oxidized ursane diol-one | $\text{C}_{30}\text{H}_{48}\text{O}_3$ | 2 / 3 | `57.5` | `0.5833` | PubChem `CID 101663382` |
| **`6-af7-6ncf`** | **AKBA (`AF7`)** | Boswellic acid (ursane) | $\text{C}_{32}\text{H}_{48}\text{O}_5$ | 1 / 5 | `80.7` | `0.4561` | Crystallographic co-ligand in `PDB: 6NCF` · `CHEMBL267225` / `CHEMBL437964` (`ALOX5 IC50 = 15.0 uM`) |
| **`7-10598443`** | **Epigermanidiol (`10598443`)** | Oleanane diol | $\text{C}_{30}\text{H}_{50}\text{O}_2$ | 2 / 2 | `40.5` | `0.4000` | PubChem `CID 10598443` |
| **`9-101685610`** | **PubChem 101685610** | Hopane-like keto-alcohol | $\text{C}_{30}\text{H}_{48}\text{O}_2$ | 1 / 2 | `37.3` | `0.3830` | PubChem `CID 101685610` |

Notice how **AKBA (`6-af7-6ncf`)** stands out chemically: with a polar surface area of **$80.7\text{ \AA}^2$** and **5 hydrogen-bond acceptors** (a C3-acetyl group, a C11-ketone, and a C24-carboxylic acid), it is a polar/ionic outlier among hydrophobic triterpene hydrocarbons ($\text{TPSA} = 20.2\text{--}26.3\text{ \AA}^2$). And in `PDB: 6NCF` (Gilbert et al., *Nature Chemical Biology* 2020), AKBA is the exact co-crystallized allosteric modulator bound at the C2-like PLAT / catalytic interface of human 5-LOX!

---

## 2. Double-Entry Thermodynamic Ledger Auditing (`audit_mmpbsa_decomposition`)

When we aggregate the 677 per-residue energetic rows (`676` protein residues + `1` ligand) for each of the 9 systems across both `gb` (Generalized Born) and `pb` (Poisson-Boltzmann) models, we want to know whether the local per-residue decomposition closes mathematically against the global thermodynamic cycle (`GGAS`, `GSOLV`, `DELTA TOTAL`).

In `pg_bio`, we implemented [`audit_mmpbsa_decomposition()`](file:///Users/jonatas/code/pg_bio/src/lib.rs) and [`solvent_shift_penalty()`](file:///Users/jonatas/code/pg_bio/src/lib.rs) in Rust to perform this exact double-entry audit inside PostgreSQL:

```sql
WITH decomp_arrays AS (
    SELECT
        d.system_id,
        d.model,
        array_agg(d.internal_kcal ORDER BY d.side, d.simulation_resid) AS internal_arr,
        array_agg(d.vdw_kcal ORDER BY d.side, d.simulation_resid) AS vdw_arr,
        array_agg(d.electrostatic_kcal ORDER BY d.side, d.simulation_resid) AS eel_arr,
        array_agg(d.polar_solv_kcal ORDER BY d.side, d.simulation_resid) AS polar_arr,
        array_agg(d.nonpolar_solv_kcal ORDER BY d.side, d.simulation_resid) AS nonpolar_arr,
        array_agg(d.total_kcal ORDER BY d.side, d.simulation_resid) AS total_arr
    FROM lox5_residue_decomposition d
    GROUP BY d.system_id, d.model
),
pivoted_global AS (
    SELECT
        system_id, model,
        MAX(CASE WHEN component = 'GGAS' THEN mean_kcal END) AS ggas,
        MAX(CASE WHEN component IN ('EGB', 'EPB') THEN mean_kcal END) AS polar,
        MAX(CASE WHEN component = 'ESURF' THEN mean_kcal ELSE 0.0 END)
          + MAX(CASE WHEN component = 'ENPOLAR' THEN mean_kcal ELSE 0.0 END)
          + MAX(CASE WHEN component = 'EDISPER' THEN mean_kcal ELSE 0.0 END) AS nonpolar,
        MAX(CASE WHEN component = 'DELTA TOTAL' THEN mean_kcal END) AS delta_total
    FROM lox5_energy_components
    GROUP BY system_id, model
)
SELECT
    a.system_id,
    a.model,
    ROUND(g.delta_total::numeric, 2) AS global_total_kcal,
    ROUND(((audit_obj::text::jsonb)->>'sum_mm_plus_polar')::numeric, 2) AS decomp_mm_polar_kcal,
    ROUND(((audit_obj::text::jsonb)->>'gas_closure_error')::numeric, 4) AS gas_err,
    ROUND(((audit_obj::text::jsonb)->>'polar_closure_error')::numeric, 4) AS polar_err,
    ROUND(((audit_obj::text::jsonb)->>'nonpolar_closure_error')::numeric, 2) AS nonpolar_gap_kcal,
    ((audit_obj::text::jsonb)->>'gas_polar_closed')::boolean AS gas_polar_closed,
    ((audit_obj::text::jsonb)->>'nonpolar_closed')::boolean AS nonpolar_closed
FROM decomp_arrays a
JOIN pivoted_global g USING (system_id, model)
CROSS JOIN LATERAL (
    SELECT audit_mmpbsa_decomposition(
        a.internal_arr, a.vdw_arr, a.eel_arr, a.polar_arr, a.nonpolar_arr, a.total_arr,
        g.ggas, g.polar, g.nonpolar, g.delta_total, 0.05
    ) AS audit_obj
) aud
WHERE a.system_id IN ('1-alfa-amirina', '2-beta-amirina', '3-lupeol', '6-af7-6ncf', '4-alfa-amirina-acetato')
ORDER BY a.system_id, a.model;
```

### Output: The Double-Entry Thermodynamic Audit Ledger

| System ID | Model | Global `DELTA TOTAL` ($\text{kcal/mol}$) | Decomposed $\sum \Delta G_{\text{MM+polar}}$ | Gas Closure Error | Polar Closure Error | Nonpolar Ledger Gap ($\text{kcal/mol}$) | `gas_polar_closed` | `nonpolar_closed` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`1-alfa-amirina`** | `gb` | **`-35.47`** | `-30.53` | `0.0022` | `0.0014` | `-1.01` | `true` | `false` |
| **`1-alfa-amirina`** | `pb` | **`-3.48`** | **`-27.71`** | `0.0022` | `0.0005` | **`+24.22`** | `true` | `false` |
| **`2-beta-amirina`** | `gb` | **`-36.96`** | `-31.83` | `0.0002` | `0.0014` | `-1.07` | `true` | `false` |
| **`2-beta-amirina`** | `pb` | **`-2.32`** | **`-27.54`** | `0.0002` | `0.0004` | **`+25.22`** | `true` | `false` |
| **`3-lupeol`** | `gb` | **`-32.72`** | `-28.18` | `0.0011` | `0.0003` | `-0.85` | `true` | `false` |
| **`3-lupeol`** | `pb` | **`-1.74`** | **`-23.90`** | `0.0011` | `0.0017` | **`+22.17`** | `true` | `false` |
| **`4-alfa-amirina-acetato`** | `gb` | **`-28.06`** | `-23.95` | `0.0001` | `0.0008` | `-0.80` | `true` | `false` |
| **`4-alfa-amirina-acetato`** | `pb` | **`-2.55`** | **`-23.28`** | `0.0001` | `0.0020` | **`+20.72`** | `true` | `false` |
| **`6-af7-6ncf` (AKBA)** | `gb` | **`-33.36`** | `-28.60` | `0.0010` | `0.0002` | `-0.98` | `true` | `false` |
| **`6-af7-6ncf` (AKBA)** | `pb` | **`+0.76`** | **`-23.82`** | `0.0010` | `0.0026` | **`+24.58`** | `true` | `false` |

Look at what `audit_mmpbsa_decomposition()` immediately proves across all 18 `(system, model)` pairs:
1. **Exact Gas + Polar Closure (`gas_polar_closed = true`):** Every single residue's `MM_plus_polar` identity closes to `0.0000 kcal/mol` internally, and the 677-entity sum reconciles with global `GGAS` ($\le 0.0022\text{ kcal/mol}$) and `EGB`/`EPB` ($\le 0.0026\text{ kcal/mol}$).
2. **The Nonpolar Solvation Ledger Gap (`nonpolar_closed = false`):** In `MMTools.py` / `sander` (`idecomp=1,2`), per-residue PB decomposition sets `nonpolar_solv = 0.00 kcal/mol` because the repulsive dispersion (`ENPOLAR`, $+58\text{ to }+67\text{ kcal/mol}$) and attractive cavity (`EDISPER`, $-37\text{ to }-41\text{ kcal/mol}$) integrals are non-pairwise-additive over molecular volume!
3. **Why PB Totals Look Near-Zero (`-3.48` to `+0.76 kcal/mol`):** When you evaluate only the pairwise-decomposable molecular mechanics + polar solvation (`sum_mm_plus_polar`), **MM/PBSA is strongly favorable (`-23.28` to `-27.71 kcal/mol`)** and tracks MM/GBSA (`-23.95` to `-31.83 kcal/mol`) closely! The apparent $+32\text{ to }+35\text{ kcal/mol}$ shift between global GB and global PB is driven almost entirely (`85–89%`) by the non-decomposed global nonpolar solvation shift (`solvent_shift_penalty()` = **`+25.66` to `+31.02 kcal/mol`**).

---

## 3. CSR Call-Graph Profiling: Discovering Cryptic Sub-Pocket Hotspots (`discover_cryptic_hotspots`)

In the original UFAM study, 9 residues lining the 5-LOX interdomain cleft (`Arg68, Glu108, Val109, Val110, Gln129, His130, Lys133, Glu134, Thr137`) were defined as the **operational pocket**.

What happens if we encode all `676` protein residues' `MM_plus_polar` binding contributions into a `pg_bio` **`SparseAttentionMap`** via [`build_energy_hotspot_map()`](file:///Users/jonatas/code/pg_bio/src/lib.rs) and call [`discover_cryptic_hotspots()`](file:///Users/jonatas/code/pg_bio/src/lib.rs) to search the remaining **667 non-pocket residues** for high-affinity energetic anchors?

```sql
WITH maps AS (
    SELECT
        system_id,
        model,
        build_energy_hotspot_map(
            677,
            array_agg(simulation_resid ORDER BY simulation_resid),
            array_agg(mm_plus_polar_kcal ORDER BY simulation_resid),
            677,
            -0.15
        ) AS csr_map
    FROM lox5_residue_decomposition
    WHERE side = 'protein'
    GROUP BY system_id, model
),
cryptic_hits AS (
    SELECT
        m.system_id,
        m.model,
        unnest(discover_cryptic_hotspots(
            m.csr_map,
            677,
            ARRAY[68, 108, 109, 110, 129, 130, 133, 134, 137],
            0.35,
            5
        )) AS resid
    FROM maps m
)
SELECT
    c.resid AS simulation_resid,
    rc.resname,
    rc.uniprot_resid AS uniprot_p09917_pos,
    rc.operational_pocket,
    COUNT(*) FILTER (WHERE c.model = 'gb') AS gb_systems_hit,
    COUNT(*) FILTER (WHERE c.model = 'pb') AS pb_systems_hit,
    ROUND(AVG(d.mm_plus_polar_kcal) FILTER (WHERE d.model = 'gb')::numeric, 3) AS mean_gb_kcal,
    ROUND(AVG(d.mm_plus_polar_kcal) FILTER (WHERE d.model = 'pb')::numeric, 3) AS mean_pb_kcal,
    ROUND(MIN(d.mm_plus_polar_kcal)::numeric, 3) AS peak_stabilization_kcal
FROM (SELECT DISTINCT resid, system_id, model FROM cryptic_hits) c
JOIN lox5_residue_correspondence rc ON rc.simulation_resid = c.resid
JOIN lox5_residue_decomposition d
  ON d.simulation_resid = c.resid AND d.side = 'protein' AND d.system_id = c.system_id AND d.model = c.model
GROUP BY c.resid, rc.resname, rc.uniprot_resid, rc.operational_pocket
ORDER BY mean_gb_kcal ASC;
```

### Output: Three Cryptic Hydrophobic Anchors Outside the Operational Pocket!

| Residue (`simulation_resid`) | UniProt `P09917` | In Operational Pocket? | GB Systems Hit (of 9) | PB Systems Hit (of 9) | Mean GB $\Delta G_{\text{MM+polar}}$ ($\text{kcal/mol}$) | Mean PB $\Delta G_{\text{MM+polar}}$ ($\text{kcal/mol}$) | Peak Stabilization ($\text{kcal/mol}$) | Structural Role Discovered by `pg_bio` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`Ile126` (`ILE 126`)** | `Ile127` | `false` | **9 / 9** | **8 / 9** | **`-1.045`** | `-0.600` | **`-1.454`** (`5-beta-amirina-acetato`) | **#4 strongest stabilizing residue across all 676 residues of 5-LOX!** Flanks the `Gln129–His130` helix turn and clamps the triterpenoid A/B rings. |
| **`Val29` (`VAL 29`)** | `Val30` | `false` | **8 / 9** | **8 / 9** | **`-0.852`** | **`-0.754`** | **`-1.264`** (`2-beta-amirina`) | **#2 strongest stabilizing residue in MM/PBSA across the entire enzyme** (second only to `Val110` at `-0.838 kcal/mol`)! |
| **`Leu66` (`LEU 66`)** | `Leu67` | `false` | **8 / 9** | **6 / 9** | **`-0.698`** | `-0.525` | **`-1.035`** (`3-lupeol`) | N-terminal PLAT $\beta$-barrel cap immediately upstream of `Arg68`, sealing the upper hydrophobic rim. |

This is a textbook demonstration of why encoding full-protein energetic decompositions as CSR graphs (`SparseAttentionMap`) inside PostgreSQL matters for structural biologists:
- Together, **`Ile126` (`-1.045 kcal/mol`)**, **`Val29` (`-0.852 kcal/mol`)**, and **`Leu66` (`-0.698 kcal/mol`)** contribute **$-2.60\text{ kcal/mol}$ in MM/GBSA** and **$-1.88\text{ kcal/mol}$ in MM/PBSA**—nearly matching the core operational pocket residues `Val110` (`-1.693 kcal/mol` GB) and `His130` (`-1.630 kcal/mol` GB)!
- Even more remarkably, in MM/PBSA, **`Val29` (`-0.754 kcal/mol`) outranks 8 of the 9 official operational pocket residues**, because its aliphatic sidechain locks against the triterpenoid core without paying the electrostatic desolvation penalty (`EPB`) that weakens polar pocket residues (`Arg68`, `Gln129`, `Lys133`).

---

## 4. Hydrophobic Clamps vs. Polar Salt-Bridge Switches (`allosteric_mechanism_index`)

Why do $\alpha$-amyrin, $\beta$-amyrin, and lupeol bind 5-LOX with `0.00%` direct hydrogen-bond occupancy, whereas **AKBA (`6-af7-6ncf`)** maintains **`66.01%` H-bond occupancy**?

We implemented [`allosteric_mechanism_index()`](file:///Users/jonatas/code/pg_bio/src/lib.rs) in Rust (`pg_bio`) to compute the normalized balance between polar/ionic switch stabilization (`Arg68, Glu108, Gln129, Lys133, Glu134, Thr137`) and hydrophobic clamp stabilization (`Val29, Leu66, Val109, Val110, Ile126, His130`), and combined it with `ensemble_fraction_between()` on the 500-frame time series (`lox5_pocket_decomp_frames`):

$$
\text{AMI} = \frac{|E_{\text{polar/ionic}}| - |E_{\text{hydrophobic}}|}{|E_{\text{polar/ionic}}| + |E_{\text{hydrophobic}}|} \in [-1, +1]
$$

```sql
WITH maps AS (
    SELECT
        system_id,
        model,
        build_energy_hotspot_map(
            677,
            array_agg(simulation_resid ORDER BY simulation_resid),
            array_agg(mm_plus_polar_kcal ORDER BY simulation_resid),
            677,
            0.0
        ) AS csr_map
    FROM lox5_residue_decomposition
    WHERE side = 'protein'
    GROUP BY system_id, model
)
SELECT
    t.system_id,
    t.ligand_label,
    ROUND(t.hbond_occupancy_pct::numeric, 1) AS hbond_occ_pct,
    ROUND((t.deep_burial_frac * 100.0)::numeric, 1) AS deep_burial_pct,
    ROUND(allosteric_mechanism_index(
        m_gb.csr_map, 677,
        ARRAY[29, 66, 109, 110, 126, 130],
        ARRAY[68, 108, 129, 133, 134, 137]
    )::numeric, 4) AS ami_gb,
    ROUND(allosteric_mechanism_index(
        m_pb.csr_map, 677,
        ARRAY[29, 66, 109, 110, 126, 130],
        ARRAY[68, 108, 129, 133, 134, 137]
    )::numeric, 4) AS ami_pb,
    ROUND((ensemble_fraction_between(f110.total_profile, -20.0, -1.0) * 100.0)::numeric, 1) AS val110_lock_pct,
    ROUND((ensemble_fraction_between(f134.total_profile, -20.0, -1.0) * 100.0)::numeric, 1) AS glu134_lock_pct
FROM lox5_triterpenoids t
JOIN maps m_gb ON m_gb.system_id = t.system_id AND m_gb.model = 'gb'
JOIN maps m_pb ON m_pb.system_id = t.system_id AND m_pb.model = 'pb'
JOIN lox5_pocket_decomp_frames f110 ON f110.system_id = t.system_id AND f110.simulation_resid = 110
JOIN lox5_pocket_decomp_frames f134 ON f134.system_id = t.system_id AND f134.simulation_resid = 134
ORDER BY ami_pb DESC;
```

### Output: Two Distinct Allosteric Modulation Regimes in Human 5-LOX

| System ID | Ligand | Direct H-Bond Occupancy (%) | Deep SASA Burial (%) | `AMI (GB)` | `AMI (PB)` | `Val110` SLA Uptime $< -1.0\text{ kcal/mol}$ (%) | `Glu134` SLA Uptime $< -1.0\text{ kcal/mol}$ (%) | Dominant Allosteric Mechanism |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`6-af7-6ncf`** | **AKBA (`AF7`)** | **`66.0%`** | `51.8%` | **`+0.0643`** | **`+0.3139`** | `59.2%` | **`64.8%`** | **Polar / Ionic Salt-Bridge Switch (`Glu134` + `Lys133` + `Arg68`)** |
| **`8-101663382`** | **PubChem 101663382** | `38.6%` | `20.2%` | `-0.1194` | `-0.1072` | `77.6%` | `20.8%` | **Hybrid Polar / Hydrophobic** |
| **`2-beta-amirina`** | **$\beta$-Amyrin** | `0.0%` | **`88.7%`** | `-0.2033` | `-0.3514` | **`82.0%`** | `0.4%` | **Deep Hydrophobic Clamp (`Val110` + `Ile126` + `Val29`)** |
| **`5-beta-amirina-acetato`** | **$\beta$-Amyrin acetate** | `23.6%` | `73.7%` | `-0.3266` | `-0.3822` | `67.4%` | `0.0%` | **Hydrophobic Wedge + `Arg68` Ester Anchor** |
| **`3-lupeol`** | **Lupeol** | `0.0%` | `83.2%` | `-0.3392` | `-0.4082` | `78.6%` | `0.8%` | **Deep Hydrophobic Clamp (`His130` + `Val110` + `Leu66`)** |
| **`7-10598443`** | **Epigermanidiol** | `15.7%` | `59.4%` | `-0.1430` | `-0.4227` | `57.2%` | `15.6%` | **Solvent-Switched Amphiphile** |
| **`4-alfa-amirina-acetato`** | **$\alpha$-Amyrin acetate** | `0.2%` | `47.5%` | `-0.3198` | `-0.4310` | `54.8%` | `0.0%` | **Hydrophobic Wedge** |
| **`1-alfa-amirina`** | **$\alpha$-Amyrin** | `0.0%` | **`87.9%`** | `-0.2400` | **`-0.4689`** | **`77.2%`** | `0.4%` | **Purest PB Hydrophobic Clamp (`#1` in Global PB `-3.48 kcal/mol`)** |
| **`9-101685610`** | **PubChem 101685610** | `5.8%` | `84.7%` | `-0.3910` | **`-0.5561`** | **`94.8%`** | `0.2%` | **Extreme `Val110` Hydrophobic Clamp** |

Look at the biophysical story that emerges from a single SQL query:
- **`AKBA (6-af7-6ncf)` is the ONLY ligand in the entire 9-triterpenoid series with a positive Allosteric Mechanism Index (`+0.0643` in GB, `+0.3139` in PB)!** Instead of burying deep into the non-polar core (`51.8%` deep burial), AKBA uses its C3-acetyl and carboxyl oxygens to lock **`Glu134` (`-1.49 kcal/mol` GB, `< -1.0 kcal/mol` for `64.8%` of the 500 ns trajectory)** and **`Lys133` (`-1.45 kcal/mol` GB)** across the interdomain salt-bridge network.
- Conversely, **$\alpha$-Amyrin (`1-alfa-amirina`)** and **$\beta$-Amyrin (`2-beta-amirina`)** act as **pure hydrophobic wedges** (`AMI = -0.4689` and `-0.3514` in PB). They achieve **`87.9%` and `88.7%` deep SASA burial** with **`0.0%` direct H-bonds**, clamping `Val110` below $-1.0\text{ kcal/mol}$ for **`77.2%` to `82.0%` of the 500 ns simulation** while avoiding the fierce PB polar desolvation penalty that penalizes AKBA!

---

## 5. Interactive 3D Structural Comparison: $\alpha$-Amyrin vs. AKBA Inside the 5-LOX Allosteric Pocket

Explore the 500 ns representative structures from Zenodo `23565306` directly in your browser below! On the left is **$\alpha$-Amyrin (`1-alfa-amirina`, the #1 MM/PBSA Hydrophobic Clamp at $-3.48\text{ kcal/mol}$)**; on the right is **AKBA (`6-af7-6ncf`, the Polar/Ionic Salt-Bridge Switch at $\text{AMI} = +0.3139$)**.

Use the four interactive buttons below to inspect the **9-residue operational pocket**, the **3 newly discovered cryptic hydrophobic hotspots (`Ile126, Val29, Leu66`)**, and the **36–44 Å allosteric distance to the catalytic non-heme iron triad (`His367, His372, His550, Ile673`)**:

<script src="https://3Dmol.org/build/3Dmol-min.js"></script>

<div style="display: flex; flex-wrap: wrap; gap: 16px; margin: 24px 0;">
  <div style="flex: 1; min-width: 320px; border: 1px solid #334155; border-radius: 10px; overflow: hidden; background: #0f172a;">
    <div style="padding: 10px 14px; background: #1e293b; color: #f8fafc; font-weight: 600; font-size: 0.95rem; border-bottom: 1px solid #334155;">
      1. α-Amyrin (500 ns) — Hydrophobic Clamp (PB: -3.48 kcal/mol | AMI: -0.4689)
    </div>
    <div class="viewer_3Dmoljs"
         style="height: 440px; width: 100%; position: relative;"
         data-href="/assets/models/5LOX-alpha-amyrin-500ns.pdb"
         data-backgroundcolor="0x0f172a"
         data-select1="chain:B"
         data-style1="cartoon:color=0x475569,opacity=0.65"
         data-select2="resi:68,108,109,110,129,130,133,134,137"
         data-style2="stick:radius=0.18,colorscheme=cyanCarbon"
         data-select3="resi:29,66,126"
         data-style3="stick:radius=0.22,colorscheme=orangeCarbon"
         data-select4="resn:AMY"
         data-style4="stick:radius=0.30,colorscheme=greenCarbon;sphere:scale=0.28,colorscheme=greenCarbon">
    </div>
  </div>

  <div style="flex: 1; min-width: 320px; border: 1px solid #334155; border-radius: 10px; overflow: hidden; background: #0f172a;">
    <div style="padding: 10px 14px; background: #1e293b; color: #f8fafc; font-weight: 600; font-size: 0.95rem; border-bottom: 1px solid #334155;">
      2. AKBA / AF7 (500 ns) — Polar/Ionic Switch (H-Bond: 66.0% | AMI: +0.3139)
    </div>
    <div class="viewer_3Dmoljs"
         style="height: 440px; width: 100%; position: relative;"
         data-href="/assets/models/5LOX-akba-af7-500ns.pdb"
         data-backgroundcolor="0x0f172a"
         data-select1="chain:B"
         data-style1="cartoon:color=0x475569,opacity=0.65"
         data-select2="resi:68,108,109,110,129,130,133,134,137"
         data-style2="stick:radius=0.18,colorscheme=cyanCarbon"
         data-select3="resi:29,66,126"
         data-style3="stick:radius=0.22,colorscheme=orangeCarbon"
         data-select4="resn:AKB"
         data-style4="stick:radius=0.30,colorscheme=magentaCarbon;sphere:scale=0.28,colorscheme=magentaCarbon">
    </div>
  </div>
</div>

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
  <button onclick="focusOperationalPocket()" style="padding: 9px 14px; border-radius: 6px; border: 1px solid #0ea5e9; background: #0284c7; color: white; font-weight: 600; cursor: pointer;">
    1. Operational Pocket (Val110, His130, Lys133, Glu134)
  </button>
  <button onclick="focusCrypticHotspots()" style="padding: 9px 14px; border-radius: 6px; border: 1px solid #f59e0b; background: #d97706; color: white; font-weight: 600; cursor: pointer;">
    2. Cryptic Hydrophobic Cradle (Ile126, Val29, Leu66)
  </button>
  <button onclick="focusPolarSwitch()" style="padding: 9px 14px; border-radius: 6px; border: 1px solid #ec4899; background: #db2777; color: white; font-weight: 600; cursor: pointer;">
    3. AKBA Polar Salt-Bridge Switch (Glu134 &amp; Lys133)
  </button>
  <button onclick="focusAllostericBridge()" style="padding: 9px 14px; border-radius: 6px; border: 1px solid #10b981; background: #059669; color: white; font-weight: 600; cursor: pointer;">
    4. 39 Å Allosteric Bridge to Catalytic Iron Triad (His367/372/550)
  </button>
</div>

<div id="chemistry-lesson" style="padding: 16px 18px; border-radius: 8px; background: #1e293b; color: #e2e8f0; border-left: 4px solid #38bdf8; margin-bottom: 28px; font-size: 0.95rem; line-height: 1.55;">
  <strong>Interactive Biophysical Guide:</strong> Click any button above to synchronize both 500 ns 3Dmol.js viewports. Currently showing the full Stable-5-LOX interdomain cleft with <strong>α-Amyrin (green)</strong> and <strong>AKBA (magenta)</strong> surrounded by the 9-residue operational pocket (cyan sticks) and the 3 cryptic hydrophobic hotspots discovered by <code>pg_bio</code> (orange spheres/sticks).
</div>

<script>
function applyBaseStyles(v) {
  v.setStyle({}, {});
  v.removeAllLabels();
  v.setStyle({chain: 'B'}, {cartoon: {color: '0x475569', opacity: 0.55}});
  v.setStyle({resn: ['AMY', 'AKB']}, {
    stick: {radius: 0.30, colorscheme: 'greenCarbon'},
    sphere: {scale: 0.28, colorscheme: 'greenCarbon'}
  });
  v.setStyle({resn: 'AKB'}, {
    stick: {radius: 0.30, colorscheme: 'magentaCarbon'},
    sphere: {scale: 0.28, colorscheme: 'magentaCarbon'}
  });
}

function focusOperationalPocket() {
  var viewers = Object.values(window.$3Dmol.viewers || {});
  viewers.forEach(function(v) {
    applyBaseStyles(v);
    v.setStyle({resi: [68, 108, 109, 110, 129, 130, 133, 134, 137]}, {
      stick: {radius: 0.22, colorscheme: 'cyanCarbon'}
    });
    [68, 110, 130, 133, 134].forEach(function(r) {
      v.addLabel("Res " + r, {fontSize: 11, fontColor: 'white', backgroundColor: '0x0284c7', backgroundOpacity: 0.8}, {resi: r, atom: 'CA'});
    });
    v.zoomTo({resi: [68, 108, 109, 110, 129, 130, 133, 134, 137, 677]});
    v.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<strong>1. The 9-Residue Operational Pocket (Arg68–Thr137, Cyan):</strong> In both α-Amyrin (left) and AKBA (right), <code>Val110</code> (-1.69 kcal/mol GB) and <code>His130</code> (-1.63 kcal/mol GB) form the central floor of the interdomain cleft between the N-terminal C2-like PLAT beta-barrel and the catalytic domain.";
}

function focusCrypticHotspots() {
  var viewers = Object.values(window.$3Dmol.viewers || {});
  viewers.forEach(function(v) {
    applyBaseStyles(v);
    v.setStyle({resi: [68, 108, 109, 110, 129, 130, 133, 134, 137]}, {
      stick: {radius: 0.14, color: '0x64748b', opacity: 0.6}
    });
    v.setStyle({resi: [29, 66, 126]}, {
      stick: {radius: 0.28, colorscheme: 'orangeCarbon'},
      sphere: {scale: 0.35, colorscheme: 'orangeCarbon'}
    });
    v.addLabel("Ile126 (-1.05 kcal/mol GB)", {fontSize: 12, fontColor: 'white', backgroundColor: '0xd97706', backgroundOpacity: 0.9}, {resi: 126, atom: 'CA'});
    v.addLabel("Val29 (#2 in PB: -0.75 kcal/mol)", {fontSize: 12, fontColor: 'white', backgroundColor: '0xd97706', backgroundOpacity: 0.9}, {resi: 29, atom: 'CA'});
    v.addLabel("Leu66 (-0.70 kcal/mol GB)", {fontSize: 12, fontColor: 'white', backgroundColor: '0xd97706', backgroundOpacity: 0.9}, {resi: 66, atom: 'CA'});
    v.zoomTo({resi: [29, 66, 110, 126, 130, 677]});
    v.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<strong>2. Cryptic Hydrophobic Cradle Discovered by <code>discover_cryptic_hotspots()</code> (Orange Spheres):</strong> Outside the 9 operational pocket residues, <code>pg_bio</code> scanned the 676-residue CSR energetic graph and uncovered <strong>Ile126</strong> (#4 strongest residue in 5-LOX), <strong>Val29</strong> (#2 strongest residue in MM/PBSA), and <strong>Leu66</strong> sealing the upper hydrophobic rim around the pentacyclic triterpenoid core!";
}

function focusPolarSwitch() {
  var viewers = Object.values(window.$3Dmol.viewers || {});
  viewers.forEach(function(v) {
    applyBaseStyles(v);
    v.setStyle({resi: [110, 126, 29]}, {
      stick: {radius: 0.18, colorscheme: 'cyanCarbon'}
    });
    v.setStyle({resi: [68, 129, 133, 134]}, {
      stick: {radius: 0.28, colorscheme: 'yellowCarbon'},
      sphere: {scale: 0.32, colorscheme: 'yellowCarbon'}
    });
    v.addLabel("Glu134 (AKBA: -1.49 kcal/mol, 64.8% SLA)", {fontSize: 12, fontColor: 'black', backgroundColor: '0xfacc15', backgroundOpacity: 0.9}, {resi: 134, atom: 'CA'});
    v.addLabel("Lys133 (AKBA: -1.45 kcal/mol)", {fontSize: 12, fontColor: 'black', backgroundColor: '0xfacc15', backgroundOpacity: 0.9}, {resi: 133, atom: 'CA'});
    v.addLabel("Arg68", {fontSize: 11, fontColor: 'black', backgroundColor: '0xfacc15', backgroundOpacity: 0.9}, {resi: 68, atom: 'CA'});
    v.zoomTo({resi: [68, 110, 133, 134, 677]});
    v.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<strong>3. Hydrophobic Clamp vs. Polar Salt-Bridge Switch (<code>allosteric_mechanism_index</code>):</strong> Compare the bottom-right residues (<code>Lys133</code> &amp; <code>Glu134</code>, yellow): <strong>α-Amyrin (left)</strong> sits high in the hydrophobic cradle (<code>Val110/Ile126/Val29</code>) with <strong>0.0% H-bonds</strong> and <code>0.4%</code> Glu134 uptime. <strong>AKBA (right)</strong> extends its C3-acetyl and carboxyl oxygens directly into <code>Glu134</code> (-1.49 kcal/mol) and <code>Lys133</code> (-1.45 kcal/mol), maintaining <strong>66.01% H-bond occupancy</strong> and a positive Allosteric Mechanism Index (<code>+0.3139</code> in PB)!";
}

function focusAllostericBridge() {
  var viewers = Object.values(window.$3Dmol.viewers || {});
  viewers.forEach(function(v) {
    applyBaseStyles(v);
    v.setStyle({resi: [29, 66, 68, 110, 126, 130, 133, 134]}, {
      stick: {radius: 0.20, colorscheme: 'cyanCarbon'}
    });
    v.setStyle({resi: [367, 372, 550, 673]}, {
      stick: {radius: 0.32, colorscheme: 'redCarbon'},
      sphere: {scale: 0.42, colorscheme: 'redCarbon'}
    });
    v.addLabel("Allosteric Triterpenoid Pocket", {fontSize: 12, fontColor: 'white', backgroundColor: '0x0284c7', backgroundOpacity: 0.9}, {resi: 110, atom: 'CA'});
    v.addLabel("Catalytic Fe2+ Triad (His367/His372/His550/Ile673) ~39.3 A away", {fontSize: 12, fontColor: 'white', backgroundColor: '0xdc2626', backgroundOpacity: 0.9}, {resi: 372, atom: 'CA'});
    v.zoomTo({});
    v.render();
  });
  document.getElementById('chemistry-lesson').innerHTML =
    "<strong>4. Long-Range Allosteric Modulation (36–44 Å from the Catalytic Non-Heme Iron):</strong> Using <code>pg_bio</code>'s 3D Z-Order spatial index (<code>z_order_encode</code> &amp; <code>atom_distance</code>), we verified that all 9 triterpenoids bind <strong>36.3 to 44.3 Å away</strong> from the catalytic non-heme iron coordination triad (<code>His367, His372, His550</code> and C-terminal <code>Ile673</code>, red spheres). Rather than competing directly at the arachidonic acid active site, triterpenoids wedge the PLAT/catalytic domain interface to allosterically remodel 5-LOX catalysis!";
}
</script>

---

## 6. Performance Benchmark: Rust `pg_bio` In-Database Execution vs. Python Pandas/NumPy

To ensure these new primitives make life genuinely better for computational chemists and bioinformaticians screening large MD cohorts, we benchmarked our Rust `pg_bio` SQL functions against an equivalent Python + `psycopg` + NumPy/SciPy client pipeline over a **180-system (`121,860`-residue)** synthetic screening table (`scripts/benchmark_5lox_mmpbsa_audit.py`):

| Benchmark Task | Dataset Scale | Python + NumPy Client (`ms`) | `pg_bio` In-Database Rust SQL (`ms`) | Speedup | Why `pg_bio` Wins |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **1. Double-Entry Thermodynamic Audit (`audit_mmpbsa_decomposition`)** | 18 systems (`12,186` residue rows) | `24.83 ms` | **`9.54 ms`** | **2.60x** | Zero row-level serialization overhead; single-pass SIMD-friendly slice reduction inside PostgreSQL memory. |
| **2. CSR Cryptic Hotspot Discovery + Mechanism Index (`discover_cryptic_hotspots` + `allosteric_mechanism_index`)** | **180 systems (`121,860` residue rows)** | `248.28 ms` | **`7.97 ms`** | **31.14x** | Pre-compressed `SparseAttentionMap` CSR vectors live in shared buffers; Rust evaluates only non-zero edges (`12–18` per protein) instead of scanning all 676 residues over the wire. |
| **3. 3D Z-Order Pocket Contact Search (`z_order_encode` + `atom_distance`)** | `5,490` protein atoms $\times$ `9` ligands | `3.75 ms` | **`1.65 ms`** | **2.27x** | B-tree Morton range pruning (`idx_lox5_prot_z`) eliminates $>86\%$ of distant catalytic-domain atoms before computing Euclidean distances. |

---

## The Horizon: Future Research Ideas

By turning molecular dynamics trajectories and MM/GBSA–MM/PBSA free-energy decompositions into relational, auditable `pg_bio` tables, several exciting research directions open up immediately:

1. **Automated Nonpolar Cavity Correction Models Inside SQL:**
   - *The Question:* Can we bridge the $+20.7\text{ to }+26.1\text{ kcal/mol}$ gap between pairwise per-residue decomposition (`sum_mm_plus_polar`) and global Poisson-Boltzmann `ENPOLAR + EDISPER` using per-residue Solvent Accessible Surface Area ($\Delta\text{SASA}_i$) and atomic burial depth?
   - *How to test with `pg_bio`:* Combine `lox5_triterpenoids.deep_burial_frac` with 3D Z-Order neighbor density around each residue (`z_order_encode`) to fit an in-database linear/non-linear cavity dispersion estimator directly in SQL.
2. **Site-Directed Mutagenesis Design for the Cryptic Cradle (`I126A`, `V29A`, `L66A`):**
   - *The Question:* How much triterpenoid binding affinity is lost when the cryptic hydrophobic cradle discovered by `discover_cryptic_hotspots()` (`Ile126, Val29, Leu66`) is mutated to alanine, versus mutating the polar salt-bridge switch (`K133A`, `E134A`)?
   - *Prediction:* Our `allosteric_mechanism_index()` predicts that `I126A / V29A` will selectively abolish $\alpha$-amyrin, $\beta$-amyrin, and lupeol binding (`AMI < -0.35`), whereas `K133A / E134A` will selectively disrupt AKBA (`AMI = +0.3139`) while sparing the neutral amyrin alcohols!
3. **Cross-Isoform Selectivity Across Human Lipoxygenases (`ALOX5` vs. `ALOX15` / `ALOX12`):**
   - *The Question:* Using `pg_bio`'s `get_esm_embedding()` and `embedding_cosine_distance()`, we found that while the full-length Stable-5-LOX sequence (`PDB: 6NCF`, 14 stabilizing mutations) is $99.65\%$ identical in ESM embedding space to wild-type human `P09917` (`cosine distance = 0.003537`), the local allosteric cleft (`Arg68–Thr137`) has an embedding cosine distance of `0.068087` (`Lys133–Glu134` in Stable-5-LOX vs. `Trp133–Leu134` in canonical `P09917`). Extending this CSR hotspot + ESM comparison across `ALOX12` and `ALOX15` could guide isoform-selective anti-inflammatory triterpenoid derivatives from Amazonian biodiversity.

{% include pg_bio_promo.md %}
