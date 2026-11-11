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
    padding: 48px;
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
    padding: 20px;
    background: #161b27;
  }
  footer {
    color: #8892b0;
    font-size: 0.75rem;
  }
---

# 🧬 Ep 1: Hello World, pg_bio! The Central Dogma in SQL
### Layers 1 & 6: Genomics (int4range GiST) & Sequence Physics
**Bridging PostgreSQL Systems Engineering & Computational Biology**

* **Benchmark:** `200x faster than BioPython (~200 ns/protein in Rust)`
* **Engine:** Native Rust (`pgrx`) inside PostgreSQL 18

---

## 1. The Wet-Lab Biology Problem
<div class="bridge-box">

**Why Biologists Care:**  
Biology's Central Dogma compiles 4 DNA bases (A, T, G, C) into 20 amino acids. When inserting synthetic genes via CRISPR, you must find a Safe Harbor near a tissue promoter without intersecting tumor suppressor genes, then verify the protein's charge (pI) and hydropathy.

</div>

* Traditional pipelines export gigabytes of sequences, coordinates, or trajectories over TCP sockets to Python.
* Network serialization + $O(N^2)$ interpreter loops turn millisecond questions into multi-hour batch jobs.

---

## 2. The Systems-to-Biotech Bridge (`src/lib.rs`)

| Systems Engineer Mental Model | Structural Biology Reality |
| :--- | :--- |
| `PostgreSQL 1D int4range GiST overlap (&&) and distance (<->) operators scan billions of base pairs, while single-pass Rust byte slices compute bio_translate_dna(), isoelectric_point(), and gravy_score() in 200 ns.` | `Biology's Central Dogma compiles 4 DNA bases (A, T, G, C) into 20 amino acids. When inserting synthetic genes via CRISPR, you must find a Safe Harbor near a tissue promoter without intersecting tumor suppressor genes, then verify the protein's charge (pI) and hydropathy.` |
| Zero-IPC Shared-Buffer Pointers (`pgrx`) | Scan millions of molecules/residues in L1/L2 cache |
| `CROSS JOIN LATERAL` Index Short-Circuiting | Prune 99.9% of decoys before running 3D physics |

---

## 3. Declarative SQL Discovery Pipeline

```sql
-- Push multi-constraint biological physics directly to the data:
SELECT design_id,
       round(isoelectric_point(sequence)::numeric, 2) AS pI,
       round(gravy_score(sequence)::numeric, 3) AS gravy
FROM candidate_proteins
WHERE prosite_match(sequence, '[LIVM]-x(2)-H-x-H') = TRUE;
```

**Result:** `200x faster than BioPython (~200 ns/protein in Rust)`
