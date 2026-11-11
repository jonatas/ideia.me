---
marp: true
theme: gaia
class: invert
paginate: true
backgroundColor: #0f1117
color: #ccd6f6
footer: "🌐 https://ideia.me  |  🧬 pg_bio Multiomics Engine  |  🐙 https://github.com/jonatas/pg_bio"
style: |
  section {
    font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Consolas, monospace;
    padding: 44px;
    background-color: #0f1117;
    color: #ccd6f6;
  }
  h1, h2 {
    color: #5c9eff;
  }
  code {
    background: #1a1f2e;
    color: #ccd6f6;
  }
  .bridge-box {
    border: 1px solid #5c9eff;
    border-radius: 12px;
    padding: 18px;
    background: #161b27;
  }
  footer {
    color: #8892b0;
    font-size: 0.75rem;
  }
---

# 🧬 The Protein as a Modular State Machine
### `Dock -> Linker -> Cut -> Transform` in PostgreSQL (`pg_bio`)
**Bridging Database Internals & Structural Enzyme Mechanics**

* **Benchmark:** `94.9x to 1,513x faster in-database multi-stage screening`
* **Engine:** Native Rust (`pgrx`) inside PostgreSQL 18

---

## 1. How Science Maps Protein Sub-Modules

<div class="bridge-box">

Evolution builds enzymes by snapping together 4 distinct mechanical segments:
1. **DOCK (`Pfam CBM / Hydrophobin`):** High-$\text{GRAVY}$ anchor that boosts local substrate concentration.
2. **LINKER (`IDR / Hinge`):** High-entropy flexible spring & CSR allosteric H-bond wire.
3. **CUT (`M-CSA Theozyme / EC 3.*`):** 3–6 residue 3D active site executing nucleophilic attack at $107^\circ$.
4. **TRANSFORM (`Sink / Mineralizer`):** Sequesters product to prevent feedback inhibition ($K_i$).

</div>

---

## 2. The 4-Step Catalytic State Machine in `src/lib.rs`

| State Machine Step | Wet-Lab Physical Requirement | `pg_bio` Rust Function (`src/lib.rs`) |
| :--- | :--- | :--- |
| **Step 1: DOCK** | Pocket fit + $\beta$-strand backbone register ($2.4\text{–}3.6\text{ Å}$) | `predict_pocket_ranges()` + `strand_pairing_check()` |
| **Step 2: ARM** | $\text{Zn}^{2+}$ + `GLU` polarize catalytic water ($\le 2.4\text{ Å}$) | `has_coordinated_water_shell()` + `z_order_encode()` |
| **Step 3: CUT** | Triad RMSD $\le 0.9\text{ Å}$ + Bürgi–Dunitz $100^\circ\text{–}115^\circ$ | `theozyme_rmsd()` (Horn SVD) + `bio_angle()` |
| **Step 4: TRANSFORM** | CSR H-bond wire + RK4 product sink kinetics | `bio_hbond_network()` + `simulate_cascade_kinetics()` |

---

## 3. Declarative SQL State-Machine Pipeline

```sql
SELECT
    pareto_score_domain_pair(gravy_score(dock_seq), sequence_entropy(dock_seq),
        molecular_weight(cut_seq)/1000.0, isoelectric_point(cut_seq),
        sequence_entropy(cut_seq), 7.4)                             AS step1_dock_score,
    strand_pairing_check(guide_strand_ca, substrate_ca)             AS step1_registered,
    has_coordinated_water_shell(theozyme_atoms, 'ZN', 2.4)          AS step2_water_armed,
    theozyme_rmsd(theozyme_atoms, '4qhp_zn_pentad')                 AS step3_triad_rmsd,
    bio_angle(water_o, scissile_c, oxyanion_o)                      AS step3_attack_deg
FROM modular_chimera_candidates;
```
