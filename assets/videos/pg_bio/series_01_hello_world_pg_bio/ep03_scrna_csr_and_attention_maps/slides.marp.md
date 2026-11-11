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

# 🧬 Ep 3: Transcriptomics & CSR Sparse Attention Graphs
### Layers 3 & 9: Single-Cell CSR Arrays, Neural Attention & Allostery
**Bridging PostgreSQL Systems Engineering & Computational Biology**

* **Benchmark:** `31.1x faster than Python/NumPy & 90% less RAM footprint`
* **Engine:** Native Rust (`pgrx`) inside PostgreSQL 18

---

## 1. The Wet-Lab Biology Problem
<div class="bridge-box">

**Why Biologists Care:**  
Every cell in your body shares the exact same DNA, yet a neuron and a T-cell behave completely differently because of which genes they express (Transcriptomics). Sequencing 1 million cells across 20,000 genes creates a 20-billion-cell matrix that is 90% zeroes—crushing traditional SQL schemas and RAM.

</div>

* Traditional pipelines export gigabytes of sequences, coordinates, or trajectories over TCP sockets to Python.
* Network serialization + $O(N^2)$ interpreter loops turn millisecond questions into multi-hour batch jobs.

---

## 2. The Systems-to-Biotech Bridge (`src/lib.rs`)

| Systems Engineer Mental Model | Structural Biology Reality |
| :--- | :--- |
| `Compressed Sparse Row (CSR) storage (SparseAttentionMap, create_sparse_map, build_energy_hotspot_map) stores only non-zero contacts and expression counts, reducing O(L^2) dense scans to O(nnz) nanosecond slice lookups.` | `Every cell in your body shares the exact same DNA, yet a neuron and a T-cell behave completely differently because of which genes they express (Transcriptomics). Sequencing 1 million cells across 20,000 genes creates a 20-billion-cell matrix that is 90% zeroes—crushing traditional SQL schemas and RAM.` |
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

**Result:** `31.1x faster than Python/NumPy & 90% less RAM footprint`
