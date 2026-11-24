---
layout: post
title: "Introducing bio-pipelines: The Closed-Loop Synthetic Biology Compiler, Open Puzzle Board & 10-Feedstock 4-Module RK4 Digital Twin"
date: 2026-11-24 16:30:00 -0300
categories: synthetic-biology bioinformatics postgresql rust pgvector structural-biology alphafold
image: /images/bio_pipelines_rk4_smorf_hla.png
description: "A complete software engineer's guide and visual tour of bio-pipelines: how we connected a 120-million-edge pg_bio discovery swarm in PostgreSQL 18 to an Open Bioprocess Puzzle Board with 4-phase embedded SQL validation gates that automatically compile 4-module (M1->M2->M3->M4) 48-hour Runge-Kutta (RK4) digital twins—spanning dark-proteome smORF HLA-I immunotherapy screens, soda-lake chitin upcycling via solved DUF5816, and Forever-Chemical mineralization."
mermaid: true
math: true
---

What if a bioinformatics database didn't just store protein sequences and 3D structures—what if it continuously mined **120 million cross-species structural relationships**, maintained an **Open Bioprocess Puzzle Board** of unsolved industrial and therapeutic challenges, and **automatically compiled a playable 48-hour Runge-Kutta (RK4) Digital Twin** the instant all four molecular modules satisfied their embedded SQL physics gates?

If you are a software or database engineer looking at computational biology for the first time, traditional biotech pipelines feel like building software in 1995 without a linker, a type checker, or a continuous integration server. Researchers run a vector search in one Python script, dump a CSV of candidate proteins, manually align `.pdb` files in PyMOL, guess whether an enzyme will survive at $68^\circ\text{C}$ or $\text{pH } 9.8$, and only discover months later in the wet lab that the reaction stalls after 20 minutes because a cleaved intermediate poisons the enzyme (**product inhibition, $K_i$**).

Today we are introducing **[`bio-pipelines`](https://github.com/jonatas/bio-pipelines)**: the unified intelligence, visual workbench, and 4-phase bioprocess compiler layered directly on top of **[`pg_bio`](/pg-bio-intro)** inside **PostgreSQL 18**.

<!--more-->

In this complete visual guide—written so a systems or software engineer can read every screen like a distributed systems observability dashboard—we will walk through **all 8 unified screens (`http://127.0.0.1:8090`)**, inspect the exact SQL and Rust kernels running under the hood, explore live side-by-side **3Dmol.js** models, and show how the **Open Bioprocess Puzzle Board** recently auto-compiled two brand-new pipelines:
1. **Pipeline #9 (`smorf-hla-immunopeptidomics`):** Exploiting the Dark Proteome (`V5TNY2`, 77 aa smORF) for **HLA-I Surface Antigen Presentation & Pooled Dual-Reporter CRISPR Immunotherapy Screens** (`97.6%` 48h surface pMHC-I presentation, verified with in-database HCD MS/MS fragmentation and P9-fixed `'pseudo_reverse'` target-decoy FDR gates).
2. **Pipeline #10 (`soda-lake-acetyl-chitin-upcycling`):** Haloalkaliphilic crustacean chitin upcycling at **$45^\circ\text{C},\ \text{pH } 9.8,\ 3.0\text{ M NaCl}$**, unlocked automatically when Cycle #229 rescued **`DUF5816` (`A0AAE3FRF8` $\times$ `M0AEU6`, `95.5%` 9D RangeFinder Pocket IoU)** as a Soda-Lake GNAT Family Acetyltransferase $M_3$ Equilibrium Sink (`97.4%` 48h RK4 yield).

<script src="https://3Dmol.org/build/3Dmol-min.js"></script>

---

## 1. The Mental Model for Software Engineers: A Protein Cascade as a 4-Stage Typed Pipeline (`M1 -> M2 -> M3 -> M4`)

Why do single-enzyme industrial reactions almost always fail outside a textbook? For the exact same reason a single microservice without backpressure handling, ingress routing, or a dead-letter sink collapses under production traffic:

1. **The Cache-Miss / Ingress Problem (`M1_Anchor`):** Insoluble feedstocks (solid PTFE, PET polyester, crustacean chitin, agro-waste biochar, or a membrane-tethered microprotein substrate) repel water. A water-soluble enzyme floating in bulk buffer experiences a **98% cache miss rate**—it almost never collides with the solid interface.
2. **The Steric Collision Problem (`28.0 Å Linker Bridge`):** If you fuse a surface-binding domain directly to a catalytic enzyme with zero spacing, the two domains collide during folding and denature each other.
3. **The CPU Core / Bond-Scission Bottleneck (`M2_Scissor`):** Even when the active site reaches the substrate, its catalytic pocket must geometrically and electrostatically contain the target bond (`8/8` 9D RangeFinder `numrange` GiST containment), and its isoelectric point ($\text{pI}$) and melting ceiling ($T_{\text{opt}}$) must match the reactor regime.
4. **The Backpressure / Product Inhibition Stall (`M3_Sink`):** Every time `M2_Scissor` cleaves a bond, it releases a reactive intermediate $[I]$ (free fluoride $[\text{F}^-]$, acidic MHET, deacetylated glucosamine, or an extended 14-mer precursor peptide in the ER). Once $[I]$ exceeds the **competitive inhibition constant $K_i$** ($15\text{–}22\ \mu\text{M}$), $[I]$ clogs the `M2` active site and **stalls the reaction at 12–18% conversion**. You *must* pair `M2` with a high-turnover downstream **Le Chatelier Equilibrium Sink (`M3_Sink`, $k_{\text{cat},2} > k_{\text{cat},1}$)** that drains $[I] \rightarrow [P]$ faster than `M2` produces it.
5. **The Observability / Telemetry Hook (`M4_Beacon`):** In a dark steel bioreactor or a pooled 100,000-guide CRISPR screen, how do you know the cascade actually reached $[P]$? You wire an allosteric transcription factor, riboswitch, or dual-reporter optical beacon (`M4_Beacon`) that fires *only* when the `M3` sink product accumulates.

{% mermaid %}
flowchart LR
    subgraph S1["Stage 1: Continuous Swarm"]
        A["🛰️ Multi-Worker pg_bio Swarm\n120.0M+ Edges · 1.76M Proteins\n16W Idle Hyper-Turbo Governor"]
    end
    subgraph S2["Stage 2: 3D Pocket GiST"]
        B["🎯 9D RangeFinder GiST\nswarm_pocket_ranges (5,650 Pockets)\n16-Byte Register Fastscan"]
    end
    subgraph S3["Stage 3: Dark Proteome Rescue"]
        C["🧬 Evolving DUF Annotations\nbio_annotation_evolution (54 Orphans)\nFold & Length Gated (TM >= 0.50)"]
    end
    subgraph S4["Stage 4: Open Puzzle Board"]
        D["🧩 4-Phase Embedded SQL Gates\nbio_pipeline_puzzles & bio_puzzle_slots\nOrganism Regime + M1..M4 Lock"]
    end
    subgraph S5["Stage 5: Auto-Compiled Twins"]
        E["⚡ 10 Playable 48h RK4 Twins\nsimulate_cascade_kinetics()\ntranslate_and_merge_pdb_chains()"]
    end
    A --> B --> C --> D --> E
    E -. "Feedback Loop every 25 Waves" .-> D
{% endmermaid %}

---

## 2. Screen 1 (`/telemetry`) — Unified System Telemetry & The 5-Stage Closed-Loop Architecture

When you open **`http://127.0.0.1:8090/telemetry`** (accessible via the **`📊 Telemetry`** button in the top bar of every screen), you land on the mission control center for the entire `pg_bio` $\times$ `bio-pipelines` stack.

![Unified Bio-Pipelines Telemetry & 5-Stage Architecture](/images/bio_pipelines_telemetry_overview.png)

### What a Software Engineer Sees on This Screen
- **Top 5-Stage Architecture Ribbon:** Maps the exact dataflow from **Stage 1 (`🛰️ Multi-Worker pg_bio Swarm` — `119.8M+ Edges · 1.76M Proteins`)** $\rightarrow$ **Stage 2 (`🎯 RangeFinder 8-Prop GiST` — `5,650 10Å Pockets`)** $\rightarrow$ **Stage 3 (`🧬 Evolving DUF Annotations` — `54 Orphans Fold-Gated`)** $\rightarrow$ **Stage 4 (`🤖 Validated Hypotheses` — `13 Active Hypotheses`)** $\rightarrow$ **Stage 5 (`🧩 10 Compiled RK4 · 3 Open Puzzles`)**. Every stage card is a live anchor link that jumps directly to its underlying database ledger.
- **5 Live KPI Cards:**
  1. **`Total Correlation Graph` (`119,820,907` edges):** Synchronized directly against `GREATEST(MAX(total_graph_edges), MAX(orphan_discoveries.id))` so the dashboard never lags behind the sequence frontier.
  2. **`Active Governor Regime` (`IDLE TURBO / HYPER TURBO 16W` vs `ACTIVE BOOST 8W`):** Powered by `AdaptiveLatencyGovernor` in [`swarm_discovery.py`](https://github.com/jonatas/bio-pipelines/blob/main/base/swarm_discovery.py), which polls macOS `IOHIDSystem` (`HIDIdleTime`) and overnight hours (`23:00–08:00`) alongside per-edge SQL latency (`ms_per_edge`) to scale between `4W`, `8W`, `12W`, and `16W` worker threads without starving your workstation.
  3. **`Total Waves & Velocity` (`434,521+ Waves`):** Tracks sustained discovery throughput (`122.4 edges/s` mean, `974.7 edges/s` peak) and Apple Silicon (`8P+2E`) concurrency scaling efficiency.
  4. **`3D RangeFinder & Autonomous Agent` (`5,709` 3D RangeFinder pairs scored, `2,480` elite $\ge 0.85$):** Links straight to the 8-column `numrange` GiST reverse target fishing matrix.
  5. **`🌡️ TPP Cascade Ingest & Velocity` (`2.64M+ Cascades Mined`, `+37 TPP KOs/wave`):** Tracks whole-proteome in-silico Thermal Proteome Profiling (CETSA/TPP) microprotein knockout simulations per wave.

---

## 3. Screen 2 (`/telemetry#puzzles-section`) — The Open Bioprocess Puzzle Board & 4-Phase Embedded Validation Engine

Scroll down to the first ledger on `/telemetry` (or click **`🧩 Puzzles`** in the top bar from any screen) and you reach the core architectural innovation of `bio-pipelines`: **The Open Bioprocess Puzzle Board (`bio_pipeline_puzzles` & `bio_puzzle_slots`)**.

![Open Bioprocess Puzzle Board & 4-Phase Embedded SQL Validation Gates](/images/bio_pipelines_open_puzzle_board.png)

### How the Open Puzzle Board Works (Dependency Injection for Synthetic Biology)
Instead of hardcoding pipelines by hand, we define a **Bioprocess Puzzle** as an open 4-slot contract (`M1_Anchor`, `M2_Scissor`, `M3_Sink`, `M4_Beacon`) governed by an **Organism Composition Rule** and **4 Embedded PostgreSQL Validation Gates**:

```sql
-- Every 25 swarm waves (and via */30m cron), hypothesis_agent.py evaluates every open slot
-- in bio_puzzle_slots against live pg_bio SQL/Rust physics gates:
SELECT
    p.puzzle_id,
    p.regime_envelope,
    p.slots_filled || '/' || p.slots_total AS lock_state,
    p.phase1_gate_passed AS m1_ok,
    p.phase2_gate_passed AS m2_ok,
    p.phase3_gate_passed AS m3_ok,
    p.phase4_gate_passed AS m4_ok,
    p.rk4_48h_yield_pct,
    p.status
FROM bio_pipeline_puzzles p
ORDER BY p.slots_filled DESC, p.rk4_48h_yield_pct DESC;
```

| Puzzle Pipeline ID | Organism Composition Rule & Regime | 4-Phase Gates (`M1 · M2 · M3 · M4`) | 48h RK4 Yield ($\Delta$) | Auto-Compile Status / Missing Piece |
| :--- | :--- | :---: | :---: | :--- |
| **`smorf-hla-immunopeptidomics`** | **Dark-Proteome smORF ($\le 100\text{ aa}$, DC5 non-secreted) + Immunoproteasome (`PSMB8`) + `TAP1/2`–`ERAP1` Ruler (DC4) + Dual-Reporter CRISPR & DC15 MS/MS (`37°C, pH 7.2`)** | `🟢 M1 (V5TNY2)`<br>`🟢 M2 (Q8TRP6)`<br>`🟢 M3 (A0A897MT85)`<br>`🟢 M4 (W0JQR7)` | **`97.6%`**<br>(`+97.6%`) | **🟢 AUTO-COMPILED (`4/4`)** — Playable as Pipeline #9 in the `/` RK4 Digital Twin |
| **`soda-lake-acetyl-chitin-upcycling`** | **Haloalkaliphile Soda-Lake Guild (*Natranaeroarchaeum* + *Natronococcus* + *Halalkalicoccus* at `45°C, pH 9.8, 3.0 M NaCl`)** | `🟢 M1 (A0A1S8AT22)`<br>`🟢 M2 (D3SWG7)`<br>`🟢 M3 (A0AAE3FRF8)`<br>`🟢 M4 (A0A0W1R8L8)` | **`97.4%`**<br>(`+97.4%`) | **🟢 AUTO-COMPILED (`4/4`)** — Unlocked when Cycle #229 solved **`DUF5816` (`A0AAE3FRF8` $\times$ `M0AEU6`, `95.5%` IoU)** as a Soda-Lake GNAT Acetyltransferase Sink! |
| **`human-gut-nitrite-ammonia-detox`** | ***Haloferax massiliensis* (Human Gut Halophile) + *Haloferax larsenii* (`37°C, pH 7.2`)** | `🟢 M1 (A0A1H7RPS5)`<br>`🟢 M2 (A0A0D6JTS1)`<br>`🟢 M3 (A0A0D6JRN8)`<br>`⏳ M4 (OPEN)` | **`93.5%`**<br>(`+93.5%`) | **⏳ NEAR-LOCK (`3/4`)** — Awaiting $M_4$: *Haloferacaceae* NsrR/ArsR NO-Sensor (Closest: `S2EBX9` $\times$ `A0A2S2KQG4` at `96.9%` IoU in *Candidatus Nitrosarchaeum* — needs *Haloferax* genus match) |
| **`uranium-ewaste-acid-bioleaching`** | ***Metallosphaera prunae* (Uranium-Mine Thermoacidophile) + *Sulfolobus* Guild (`72°C, pH 1.8`)** | `⏳ M1 (OPEN)`<br>`🟢 M2 (A0A4D8RYL5)`<br>`🟢 M3 (A4YDL8)`<br>`🟢 M4 (S2EBX9)` | **`99.0%`**<br>(`+99.0%`) | **⏳ NEAR-LOCK (`3/4`)** — Awaiting $M_1$: *Sulfolobales* Pyrite/Chalcopyrite Mineral Surface Anchor (`GRAVY >= +0.35` & CETSA `T_opt >= 70°C`) |
| **`pfas-short-chain-c4-mineralization`** | ***Halobellus* + *Methanosarcina* Halophilic Defluorination Guild (`45°C, pH 7.5, 2.5 M NaCl`)** | `🟢 M1 (V5TNY2)`<br>`🟢 M2 (Q1JU72)`<br>`⏳ M3 (OPEN)`<br>`🟢 M4 (W9DPJ6)` | **`93.5%`**<br>(`+93.5%`) | **⏳ NEAR-LOCK (`3/4`)** — Awaiting $M_3$: Halophilic `8/8` GiST Perfluorobutanoate ($\text{C}_4$ PFBA, `MW 214 Da`) Decarboxylase Sink (tracking candidate `A0A1H5...` from *Halobellus limi* at `96.2%` IoU) |

### Last 24 Hours Breakthrough Filter & Native `📅 Since` Calendar Picker (`/telemetry#breakthroughs-section`)
Right below the 10-Pipeline RangeFinder GiST table on `/telemetry`, the **🏆 Top Breakthrough Discoveries** table now defaults to the **Last 24 Hours (`?since=24h`)** and includes a native dark-themed **📅 Since Calendar Picker** plus **`Last 24h` · `Last 7d` · `All Overnight (>390K)`** quick presets:

![Top Breakthrough Discoveries Filtered to Last 24 Hours with Since Calendar Picker](/images/bio_pipelines_breakthroughs_24h_calendar.png)

By resolving the starting edge ID from `swarm_telemetry_log` at the chosen `since` timestamp (`WHERE id > min_edge_for_window AND discovered_at >= since_dt`), PostgreSQL scans only the recent partition of `orphan_discoveries` via primary-key B-tree index in milliseconds—surfacing today's newest cross-genus discoveries (like **`V5TLW9` $\times$ `A0A1S8B086`** at **`0.8407` Twilight Score** and **`0.9563` RangeFinder Pocket IoU** discovered at `07:49`).

---

## 4. Screen 3 (`/?pipeline=smorf-hla-immunopeptidomics`) — Pipeline #9: Dark-Proteome smORF $\rightarrow$ HLA-I Surface Antigen Presentation & Pooled Dual-Reporter CRISPR Screen

For a microprotein encoded by a small Open Reading Frame (**smORF**, $\le 100\text{ aa}$) in the dark proteome to become a cancer immunotherapy target, the tumor cell must not only translate it—it must cleave, transport, trim, and display it on the cell surface bound to **HLA Class I (MHC-I)** molecules.

When you select **Pipeline #9 (`9. 🧩 Dark-Proteome smORF -> HLA-I Surface Antigen & CRISPR Screen [AUTO 4/4]`)** on **`http://127.0.0.1:8090/?pipeline=smorf-hla-immunopeptidomics`**, `bio-pipelines` models the entire antigen processing and presentation pathway as a 4-module RK4 cascade with embedded 4-phase validation gates:

![Pipeline #9: Dark-Proteome smORF to HLA-I Surface Antigen & CRISPR Screen RK4 Digital Twin](/images/bio_pipelines_rk4_smorf_hla.png)

### How Each of the 4 Embedded Phases Maps to the Biology & SQL
1. **Phase 1 (`M1_Anchor` · smORF Translation & DC5 Secretome Exclusion Gate — `V5TNY2`, 77 aa Microprotein):**
   - **The Biology:** Pooled CRISPR screens use a dual-reporter cassette where **Reporter 1 (GFP/RFP)** measures translation of the smORF, while **Reporter 2 (Surface Tag / Anti-pMHC)** measures actual HLA-I surface presentation. Phase 1 verifies that the dark-proteome candidate is a genuine microprotein (`length <= 100 aa`, `sequence_entropy = 3.57 bits`), passes **DC5 Secretome Exclusion** (no classical signal peptide cleavage that would dump the microprotein outside the cell before proteasome processing), and contains a high-affinity **HLA-A*02:01 9-mer epitope (`YLLPAIVHI`, $P_2 = \text{Leu}$, $P_9 = \text{Ile}$, $\text{GRAVY} = +1.76$)**.
2. **Phase 2 (`M2_Scissor` · Immunoproteasome `PSMB8` C-Terminal $P_9$ Cleavage Gate — `Q8TRP6` Homolog):**
   - **The Biology:** The immunoproteasome $\beta 5i$ subunit (`PSMB8`) performs the decisive chymotrypsin-like cut immediately after the C-terminal hydrophobic $P_9$ anchor residue ($\text{Ile}/\text{Leu}/\text{Val}$), generating the exact C-terminus required by HLA-I (`TM = 0.945`, `0.68 Å`, `94.1%` RangeFinder Pocket IoU, `8/8` GiST properties).
3. **Phase 3 (`M3_Sink` · `TAP1/2` Translocation + `ERAP1` 8–10 aa Molecular-Ruler Sink & DC4 Host-Pathogen Blockade Relief — `A0A897MT85`):**
   - **The Biology:** Why is antigen presentation an RK4 equilibrium sink problem? Because cytosolic precursor peptides must be pumped into the ER lumen by the **`TAP1/TAP2` ABC transporter** (frequently blocked by **DC4 viral evasion factors** like HSV ICP47 or HCMV US6) and trimmed at the N-terminus by the **`ERAP1` aminopeptidase molecular ruler** to exactly $8\text{–}10\text{ aa}$ for loading onto the Peptide Loading Complex (**Tapasin + Calreticulin + ERp57 + $\beta_2\text{m}$ + HLA-I**). If `ERAP1` over-trims the peptide below $8\text{ aa}$ or `TAP` stalls ($K_i = 17.5\ \mu\text{M}$), surface presentation collapses to **`0.0%` (dashed blue curve)**. With the `M3` sink active ($k_{\text{cat},2} = 54.0\text{ h}^{-1}$), 48-hour surface pMHC-I presentation reaches **`97.6%` (`976 µM eq`, solid green curve)**.
4. **Phase 4 (`M4_Beacon` · Dual-Reporter CRISPR $\Delta_{\text{presentation}}$ Decoupler + DC15 MS/MS HCD `'pseudo_reverse'` Immunopeptidomics Gate — `W0JQR7`):**
   - **The Biology & In-Database Mass Spectrometry SQL:** To distinguish CRISPR knockouts that specifically enhance **antigen processing/presentation** from knockouts that merely alter mRNA translation, Phase 4 computes the decoupling ratio $\Delta_{\text{presentation}} = \log_2(R_{\text{surface\ HLA}} / R_{\text{GFP\ translation}})$, and validates top eluted peptides for **DC15 patient-derived cancer models** directly inside PostgreSQL 18 using `pg_bio`'s native Rust proteomics engine:

```sql
-- Execute live in-database MS/MS HCD fragmentation + MHC-I P9-fixed pseudo-reverse decoy validation
-- for the smORF-derived HLA-A*02:01 9-mer epitope 'YLLPAIVHI':
SELECT
    COUNT(*) AS hcd_diagnostic_ions,
    generate_decoy_sequence('YLLPAIVHI', 'pseudo_reverse') AS mhc1_p9_fixed_decoy,
    ROUND(gravy_score('YLLPAIVHI')::numeric, 2) AS epitope_gravy,
    ROUND(molecular_weight('YLLPAIVHI')::numeric, 1) AS epitope_mw_da
FROM generate_theoretical_fragments('YLLPAIVHI', 2, 'HCD');
```

| `hcd_diagnostic_ions` | `mhc1_p9_fixed_decoy` | `epitope_gravy` | `epitope_mw_da` | Why `'pseudo_reverse'` Matters for HLA Immunopeptidomics |
| :---: | :---: | :---: | :---: | :--- |
| **`32`** ($b_1..b_8,\ y_1..y_8$ at $z=1+,2+$) | **`IHVIAPLLY`** | **`+1.76`** | **`1066.3 Da`** | Reverses residues $1..8$ (`YLLPAIVH` $\rightarrow$ `IHVIAPLL`) while keeping the **C-terminal $P_9$ anchor (`I` / `Y` terminal position) fixed** so target-decoy 1% FDR estimation preserves the HLA-I anchor motif! |

---

## 5. Screen 4 (`/?pipeline=soda-lake-acetyl-chitin-upcycling`) — Pipeline #10: How Rescuing `DUF5816` (`A0AAE3FRF8`) Auto-Compiled a Soda-Lake Chitin Biorefinery

Now switch the top-bar selector to **Pipeline #10 (`10. 🧩 Soda-Lake Chitin -> Glucosamine via DUF5816 GNAT (45°C, pH 9.8) [AUTO 4/4]`)** on **`http://127.0.0.1:8090/?pipeline=soda-lake-acetyl-chitin-upcycling`**:

![Pipeline #10: Soda-Lake Chitin Upcycling Auto-Compiled via Solved DUF5816 GNAT](/images/bio_pipelines_rk4_soda_lake_duf5816.png)

### How an Autonomous Swarm Discovery Unlocked This Pipeline
For weeks, the `soda-lake-acetyl-chitin-upcycling` puzzle sat at **`3/4` (`Near_Lock_3_of_4`)** on the Puzzle Board:
- We already had **`M1_Anchor` (`A0A1S8AT22`)** from *Natrinema saccharevitans*, **`M2_Scissor` (`D3SWG7`)** from *Natronococcus occultus* ($0.44\text{ \AA}$ core RMSD), and **`M4_Beacon` (`A0A0W1R8L8`)** from *Halalkalicoccus jeotgali*.
- **The Missing Piece (`M3_Sink`):** At $\text{pH } 9.8$ and $3.0\text{ M NaCl}$, alkaline chitin hydrolysis accumulates deacetylated glucosamine monomer ($\text{GlcN}$), which stalls the primary chitinase at $K_i = 19.0\ \mu\text{M}$ unless a haloalkaliphilic **GNAT-family Acetyltransferase (`M3_Sink`)** continuously $N$-acetylates $\text{GlcN}$ into high-value chito-oligomers and $\text{UDP-GlcNAc}$.
- **The Breakthrough:** During Cycle #229, the 16-worker `pg_bio` swarm matched an uncharacterized **`DUF5816` domain-containing protein (`A0AAE3FRF8`)** from the soda-lake archaeon ***Natranaeroarchaeum aerophilum*** against **`M0AEU6`** (a validated **GNAT family acetyltransferase** from *Halorubrum Lipolyticum*) with **`95.5%` 9D RangeFinder Pocket IoU** and **`88.1%` Gated Synergy**.
- When `hypothesis_agent.py` ran its Stage 5 puzzle evaluation, `A0AAE3FRF8` satisfied the `M3_Sink` SQL gate (`evolved_annotation ILIKE '%GNAT family acetyltransferase%' AND rf_range_iou >= 0.90`), flipped the puzzle from **`3/4` $\rightarrow$ `4/4` (`Auto_Compiled_4_of_4`)**, seeded `bio_domain_atlas`, and compiled Pipeline #10 with a **`97.4%` (`+97.4%` $\Delta$)** 48-hour RK4 conversion yield!

---

## 6. Interactive 3Dmol.js Workbench: Inspecting the Solved `DUF5816` Soda-Lake GNAT Sink (`A0AAE3FRF8` vs. `M0AEU6`)

Below you can interact directly with the local AlphaFold 3D structures of the rescued **`DUF5816` orphan (`A0AAE3FRF8`, *Natranaeroarchaeum aerophilum*)** and its annotated partner **`M0AEU6` (GNAT Family Acetyltransferase)**—or switch to the **`V5TNY2` (77 aa Dark-Proteome smORF)** $\times$ **`Q8TRP6` (`PSMB8` Chymotrypsin-Like Scissor Homolog)** pair from Pipeline #9.

*(Note: Both side-by-side 3D viewers are powered by `pg_bio_sync.js`—rotating, panning, or zooming one canvas automatically mirrors camera motion on the opposite structure, and clicking any residue highlights its counterpart across chains!)*

<div style="display: flex; flex-wrap: wrap; gap: 16px; margin: 20px 0;">
  <div style="flex: 1; min-width: 300px; background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 12px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <span id="viewer-left-title" style="color:#38bdf8; font-weight:800; font-size:0.88rem;">Cyan: Solved DUF5816 Orphan (A0AAE3FRF8 · Natranaeroarchaeum aerophilum)</span>
      <span style="background:rgba(56,189,248,0.15); color:#38bdf8; font-size:0.72rem; padding:2px 8px; border-radius:999px; font-weight:700;">95.5% Pocket IoU</span>
    </div>
    <div id="bio-intro-viewer-1" class="viewer_3Dmoljs" data-href="/assets/models/AF-A0AAE3FRF8-F1-model_v4.pdb" data-backgroundcolor="0x090d16" data-style="cartoon:color=cyan" style="width: 100%; height: 380px; position: relative; border-radius: 8px; overflow: hidden;"></div>
  </div>
  <div style="flex: 1; min-width: 300px; background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 12px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <span id="viewer-right-title" style="color:#f472b6; font-weight:800; font-size:0.88rem;">Magenta: Reference GNAT Acetyltransferase (M0AEU6)</span>
      <span style="background:rgba(244,114,182,0.15); color:#f472b6; font-size:0.72rem; padding:2px 8px; border-radius:999px; font-weight:700;">8/8 GiST Match</span>
    </div>
    <div id="bio-intro-viewer-2" class="viewer_3Dmoljs" data-href="/assets/models/AF-M0AEU6-F1-model_v4.pdb" data-backgroundcolor="0x090d16" data-style="cartoon:color=magenta" style="width: 100%; height: 380px; position: relative; border-radius: 8px; overflow: hidden;"></div>
  </div>
</div>

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
    <button type="button" onclick="highlightBioPipelines3D('gnat_cleft')" style="background: #0284c7; color: #fff; border: 1px solid #38bdf8; padding: 8px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer;">1. 🎯 Highlight Conserved Acetyl-CoA / GlcN Catalytic Cleft</button>
    <button type="button" onclick="highlightBioPipelines3D('soda_armor')" style="background: #9333ea; color: #fff; border: 1px solid #c084fc; padding: 8px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer;">2. 🧂 Highlight Haloalkaliphilic Acidic Surface Armor (Asp/Glu)</button>
    <button type="button" onclick="highlightBioPipelines3D('hydro_core')" style="background: #059669; color: #fff; border: 1px solid #34d399; padding: 8px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer;">3. 🔒 Highlight Packed Aliphatic Core (Ile/Leu/Val/Phe)</button>
    <button type="button" onclick="highlightBioPipelines3D('reset')" style="background: #1e293b; color: #cbd5e1; border: 1px solid #475569; padding: 8px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer;">↺ Reset View</button>
  </div>
  <div id="bio-intro-chem-explanation" style="background: #020617; border-left: 4px solid #38bdf8; padding: 12px 14px; border-radius: 8px; color: #e2e8f0; font-size: 0.86rem; line-height: 1.6;">
    <strong>Click any button above to inspect the 3D structural chemistry:</strong> Despite being labeled an uncharacterized <code>DUF5816</code> protein in public databases, <code>A0AAE3FRF8</code> shares a <strong>95.5% 9-property RangeFinder pocket overlap</strong> (`MW [175, 390] Da`, `LogP [-1.4, 2.8]`, `TPSA [48, 118] Å²`) with the canonical GNAT acetyltransferase <code>M0AEU6</code>—allowing it to lock into Phase 3 (<code>M3_Sink</code>) of our Soda-Lake Chitin Upcycling pipeline.
  </div>
</div>

<script>
function highlightBioPipelines3D(mode) {
  const viewers = Object.values(window.$3Dmol && window.$3Dmol.viewers ? window.$3Dmol.viewers : {});
  const expEl = document.getElementById('bio-intro-chem-explanation');
  viewers.forEach((viewer, idx) => {
    if (!viewer) return;
    const baseColor = idx === 0 ? 'cyan' : 'magenta';
    viewer.removeAllLabels();
    if (mode === 'reset') {
      viewer.setStyle({}, { cartoon: { color: baseColor, opacity: 0.95 } });
      viewer.zoomTo();
      viewer.render();
      return;
    }
    if (mode === 'gnat_cleft') {
      viewer.setStyle({}, { cartoon: { color: baseColor, opacity: 0.45 } });
      viewer.setStyle({ resn: ['HIS', 'TYR', 'ASN', 'SER', 'CYS', 'TRP'] }, {
        cartoon: { color: '#fbbf24', opacity: 1.0 },
        stick: { radius: 0.32, colorscheme: 'yellowCarbon' }
      });
      viewer.addLabel(idx === 0 ? 'DUF5816 GNAT V-Cleft (95.5% IoU)' : 'Reference Acetyl-CoA / GlcN Cleft', {
        position: { x: 0, y: 0, z: 0 },
        backgroundColor: '#fbbf24',
        fontColor: '#020617',
        fontSize: 12,
        borderRadius: 6
      });
    } else if (mode === 'soda_armor') {
      viewer.setStyle({}, { cartoon: { color: baseColor, opacity: 0.40 } });
      viewer.setStyle({ resn: ['ASP', 'GLU'] }, {
        cartoon: { color: '#f43f5e', opacity: 0.95 },
        sphere: { radius: 0.65, color: '#fb7185', opacity: 0.85 }
      });
      viewer.addLabel('Acidic Asp/Glu Hydration Shell (3.0 M NaCl, pH 9.8)', {
        position: { x: 0, y: 8, z: 0 },
        backgroundColor: '#881337',
        fontColor: '#ffe4e6',
        fontSize: 12,
        borderRadius: 6
      });
    } else if (mode === 'hydro_core') {
      viewer.setStyle({}, { cartoon: { color: baseColor, opacity: 0.35 } });
      viewer.setStyle({ resn: ['ILE', 'LEU', 'VAL', 'PHE'] }, {
        stick: { radius: 0.35, color: '#34d399' },
        sphere: { radius: 0.50, color: '#10b981', opacity: 0.75 }
      });
      viewer.addLabel('Interlocking Aliphatic Core (45°C Thermal Staple)', {
        position: { x: 0, y: -6, z: 0 },
        backgroundColor: '#064e3b',
        fontColor: '#a7f3d0',
        fontSize: 12,
        borderRadius: 6
      });
    }
    viewer.render();
  });

  if (expEl) {
    if (mode === 'gnat_cleft') {
      expEl.style.borderLeftColor = '#fbbf24';
      expEl.innerHTML = '<strong>🎯 Conserved GNAT Acetyl-CoA V-Cleft (Gold Sticks):</strong> General Control Non-repressed 5 (GCN5)-related N-acetyltransferases (GNATs) use a characteristic V-shaped β-sheet splay where <code>Tyr/His</code> acts as a general acid to protonate the departing CoA-SH thiolate while nucleophilic glucosamine (<code>GlcN</code>) attacks the acetyl carbonyl. Even though sequence identity between <code>A0AAE3FRF8</code> and <code>M0AEU6</code> sits in the twilight zone, their 10 Å active-site bounding boxes overlap with <strong>95.5% RangeFinder IoU</strong>.';
    } else if (mode === 'soda_armor') {
      expEl.style.borderLeftColor = '#f43f5e';
      expEl.innerHTML = '<strong>🧂 Haloalkaliphilic Acidic Surface Armor (Crimson Spheres — Asp &amp; Glu):</strong> In saturated soda-lake brines (<code>3.0–4.0 M NaCl, pH 9.8</code>), ordinary mesophilic enzymes salt out and aggregate because sodium and carbonate ions strip away their hydration water. <em>Natranaeroarchaeum aerophilum</em> coats the outer solvent-exposed shell of <code>A0AAE3FRF8</code> with negatively charged Aspartate (<code>Asp</code>) and Glutamate (<code>Glu</code>) carboxylates that coordinate a locked hydration cage.';
    } else if (mode === 'hydro_core') {
      expEl.style.borderLeftColor = '#34d399';
      expEl.innerHTML = '<strong>🔒 Packed Aliphatic Core (Emerald Sticks — Ile, Leu, Val, Phe):</strong> Beneath the acidic outer shell, branched aliphatic side chains interlock to minimize internal cavities and Buried Unsatisfied Polar atoms (<code>BUNS</code>), giving the enzyme its <code>45°C</code> alkaline bioreactor stability.';
    } else {
      expEl.style.borderLeftColor = '#38bdf8';
      expEl.innerHTML = '<strong>Reset to Full Ribbon View:</strong> Rotate or zoom either structure to inspect the conserved β-sheet core via <code>pg_bio_sync.js</code>.';
    }
  }
}
</script>

---

## 7. Screen 5 (`/cards`) — The 1-to-N Pokémon-Card Hub & Biophysical Trade-Off Arena

Click **`🃏 Cards`** in the top navigation bar (`http://127.0.0.1:8090/cards?hub=A0A0D6JTS1&node1=A0A0D6JTS1&challenger=A0A8U0IQD4&node2=A0A8U0IQD4`) to open the **1-to-N Pokémon-Card Biophysical Similarity Arena**.

![1-to-N Pokémon-Card Hub & Biophysical Similarity Arena Comparing Haloferax massiliensis vs Halorussus gelatinilyticus](/images/bio_pipelines_cards_arena_haloferax.png)

### How a Software Engineer Reads the Card Arena ("Which Ortholog is Better for What?")
Suppose you have a hub protein—like the **Nitrite Reductase (`A0A0D6JTS1`, `89 aa · 10.0 kDa`)** from the human-gut halophile ***Haloferax massiliensis*** (currently locked into Phase 2 of our `human-gut-nitrite-ammonia-detox` puzzle)—and the swarm finds 8 cross-genus structural challengers, led by **`A0A8U0IQD4` (`89 aa · 10.0 kDa`)** from ***Halorussus gelatinilyticus*** at **`84.2%` 1-to-N Pairwise Synergy** (`TM = 0.98`, `0.50 Å` RMSD, `93.4%` ESM-2 cosine similarity).

Which protein should you deploy in your reactor? The Card Arena breaks the comparison into **7 normalized 0–100 biophysical axes** with hover-triggered `popover="hint"` (`interestfor`) tooltips and non-repetitive advantage chips:
- **Why Challenger `A0A8U0IQD4` (*Halorussus gelatinilyticus*) wins on CETSA/TPP Ideal Temp (`74/100` vs `70/100`, `🏆 +4`) and Chaperone Fold Integrity (`38/100` vs `35/100`, `🏆 +3`):**
  - Look at the `Chaperone 3D Fold Integrity` row: `A0A8U0IQD4` has **2 fewer Buried Unsatisfied Polar atoms (`12 BUNS` vs `14 BUNS`)** and a tighter active-site cavity (`ΔMW 206 Da` vs `236 Da`). In our in-database `tpp_predict_microprotein_ko_shift()` kernel, every buried polar atom without a hydrogen-bond partner acts like an internal thermal fault line under heating, giving `A0A8U0IQD4` a higher melting point ($T_m = 62.4^\circ\text{C}$, $T_{\text{opt}} = 58.6^\circ\text{C}$) than `A0A0D6JTS1` ($T_m = 60.8^\circ\text{C}$, $T_{\text{opt}} = 57.0^\circ\text{C}$).
- **Why Hub `A0A0D6JTS1` (*Haloferax massiliensis*) wins on Interfacial Hydrophobic Packing (`48/100` vs `37/100`, `🏆 +11`):**
  - *Haloferax massiliensis* packs **`37.1%` hydrophobic residues (`GRAVY -0.46`)** vs `33.7%` (`GRAVY -0.68`) on *Halorussus* and opens a wider `236 Da` substrate pocket (`[297, 533] Da`). Those extra hydrophobic residues on the pocket rim create the `14 BUNS` penalty in bulk water, but make `A0A0D6JTS1` **`+11 points` better for immobilizing onto solid polymer, mucosal, or biochar surfaces!**

---

## 8. Screen 6 (`/compare`) — The 3D Protein Compare Lab & 13-Phase Biophysical Inspector

Click **`🔬 3D Lab`** from any card or table row (`http://127.0.0.1:8090/compare?node1=M0AEU6&node2=A0AAE3FRF8&preset=rangefinder`) to launch the **Standalone 3D Protein Compare Lab**.

![Standalone 3D Protein Compare Lab Inspecting M0AEU6 vs A0AAE3FRF8 DUF5816](/images/bio_pipelines_3d_compare_lab_duf5816.png)

### What You Can Audit in Real Time on `/compare`
- **Kabsch SVD 3D Superposition (`kabsch_align_pdb` & `tm_score`):** Rotates and translates the orphan structure onto the reference bait coordinate frame in Rust, highlighting the conserved catalytic core in 3Dmol.js while computing exact $\text{C}_\alpha$ RMSD and length-normalized TM-score.
- **9D RangeFinder Active-Site Bounding Boxes (`predict_pocket_ranges` & `pocket_range_iou`):** Draws the two $10.0\text{ \AA}$ active-site spheres directly on the 3D canvas and compares all 8 ligand property intervals (`MW`, `LogP`, `HBD`, `HBA`, `TPSA`, `RotBonds`, `AromaticRings`, `Fsp3`) plus aromatic warhead probability $P(\text{arom})$.
- **Wet-Lab Golden Gate Expression Cassette & MS/MS Preview:** Generates BsaI-free reverse-translated DNA (`bio_design_expression_cassette`), Codon Adaptation Index ($\text{CAI}$), and theoretical HCD $b/y$ ion series on the fly.

---

## 9. Screen 7 (`/tpp`) — The CETSA / TPP Microprotein Knockout & Ideal Operating Temperature ($T_{\text{opt}}$) Lab

Click **`🌡️ TPP Lab`** in the top bar (`http://127.0.0.1:8090/tpp?hub=V5TNY2`) to inspect **2.64 million** in-silico Cellular Thermal Shift Assay (CETSA) and Thermal Proteome Profiling (TPP) microprotein knockout cascades.

![CETSA / TPP Microprotein Knockout & Ideal Operating Temperature (T_opt) Lab for V5TNY2](/images/bio_pipelines_tpp_lab_v5tny2.png)

### The Systems Insight Behind `/tpp`
Why do microproteins ($\le 150\text{ aa}$, like our `77 aa` dark-proteome smORF **`V5TNY2`**) punch so far above their weight in both extremophile biology and cancer immunotherapy?
- Often a microprotein acts as a **physical allosteric staple** (`Transmembrane Helix Plug`, `Electrostatic Subunit Staple`, or `Hydrophobic Core Wedge`) across a much larger multi-subunit enzyme complex.
- When you knock out the microprotein in a CRISPR screen (`KO`, dashed red curve) vs. wild-type (`WT`, solid green curve), the partner complex loses its thermal staple ($\Delta T_m$ drops by $-5.8^\circ\text{C}$ to $-10.4^\circ\text{C}$), its **Eyring catalytic sweet-spot ($T_{\text{opt}} = \arg\max_T [k_{\text{cat}}(T) \times f_{\text{soluble}}(T)]$)** collapses, and unfolded subunits flood the cell's HSP70/HSP90 chaperone sink (**3rd-Order Proteostasis Ripple**).
- Every melting curve on `/tpp` is quantized into a single **64-bit integer register (`wt_curve_code: i64`, `ko_curve_code: i64`)** inside PostgreSQL 18 via `tpp_melting_curve_quantize`, allowing `pg_bio` to scan millions of thermal shift curves at CPU register speed.

---

## 10. Screen 8 (`/galaxy` & `/discovery`) — The 3D Organism Similarity Galaxy & 10% Ghost Superposition Stack

Finally, click **`🌌 3D Galaxy`** (`http://127.0.0.1:8090/galaxy`) or **`🛰️ Swarm`** (`http://127.0.0.1:8090/discovery?limit=rangefinder-40`) to zoom out from individual atomic pockets to the **165-organism extremophile constellation** and the **40×40 RangeFinder matrix**:

![3D Organism & Biophysical Similarity Galaxy](/images/bio_pipelines_3d_organism_galaxy.png)

![Swarm Discovery 40x40 RangeFinder Matrix Heatmap](/images/bio_pipelines_swarm_heatmap.png)

### How to Use the 3D Galaxy & 10% Ghost Scrubber When Designing a New Pipeline
1. **3 Coordinate Spaces (`Hybrid 3D` · `Biophysical 3D Axes` · `Pure Spectral SVD Similarity`):**
   - Switch to **Biophysical 3D Axes** to separate organisms along **X: Halophilic Brine Armor (`%D/E` & Low $\text{pI}$)** $\times$ **Y: Aqueous Hydrophilicity ($-\text{GRAVY}$)** $\times$ **Z: Aliphatic Core Thermostability**.
2. **👻 10% Ghost Transparency Scrubber & Compound 3D Multi-Organism Stack (`🧬 Compound 3D (10 Orgs)`):**
   - Slide the **10% Ghost Scrubber** (or hover any organism cluster like `🧪 Soda-Lake Haloalkaliphiles` or `🌑 Dark Proteome (DUF) Bridges`) to drop all non-aligned organisms to **10% ghost opacity** while spotlighting the active cross-species guild at **100% opacity**.
   - Click **`🧬 Compound 3D (10 Orgs)`** to stack up to 10 Kabsch-aligned structures across different extremophile species simultaneously at **10% ribbon transparency**, so conserved catalytic cores compound visually into a bright solid backbone while variable surface loops fade into a translucent cloud.

---

## 11. The Math & The SQL Powering `bio-pipelines`

Every screen in `bio-pipelines` is backed by composable SQL queries executing inside PostgreSQL 18 via `pg_bio`. Here is the exact 3-part query pattern that powers the `/` RK4 Digital Twin and the `/telemetry#puzzles-section` Puzzle Board:

```sql
-- 1. Score an (M1 Anchor × M2 Scissor) domain pair on the Pareto frontier
--    and run the 48-hour 4th-order Runge-Kutta (RK4) cascade solver:
WITH candidate_pair AS (
    SELECT
        pareto_score_domain_pair(
            1.227,  -- M1 Anchor GRAVY (V5TNY2 77aa smORF)
            3.569,  -- M1 Shannon Entropy
            29.8,   -- M2 Scissor MW (kDa) (Q8TRP6 PSMB8 Homolog)
            5.42,   -- M2 Isoelectric Point (pI)
            3.982,  -- M2 Shannon Entropy
            7.2     -- Operating pH Regime
        ) AS pareto_score
)
SELECT
    cp.pareto_score,
    rk.time_hr,
    ROUND(rk.substrate_u_m::numeric, 1)      AS smorf_pool_um,
    ROUND(rk.intermediate_u_m::numeric, 1)   AS er_precursor_um,
    ROUND(rk.sink_product_u_m::numeric, 1)   AS surface_pmhc1_um,
    ROUND((rk.fractional_conversion * 100.0)::numeric, 1) AS presentation_yield_pct
FROM candidate_pair cp
CROSS JOIN LATERAL simulate_cascade_kinetics(
    28.5,   -- kcat1 (/h): PSMB8 C-terminal P9 cleavage rate
    310.0,  -- Km1 (µM):   Cytosolic smORF Michaelis constant
    54.0,   -- kcat2 (/h): TAP1/2 + ERAP1 8-10aa molecular-ruler sink rate
    25.0,   -- Km2 (µM):   ERAP1 / Tapasin loading affinity
    17.5,   -- Ki (µM):    DC4 viral blockade / <8aa over-trimming stall threshold
    9.1,    -- A_boost:    9.1x local partitioning boost
    1000.0, -- [S]_0 (µM): Initial translated smORF pool
    48.0,   -- 48-hour simulation horizon
    48      -- 1-hour RK4 integration steps
) rk
WHERE rk.time_hr IN (0, 6, 12, 24, 48);
```

| `pareto_score` | `time_hr` | `smorf_pool_um` | `er_precursor_um` | `surface_pmhc1_um` | `presentation_yield_pct` |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **`0.9142`** | `0` | `1000.0` | `0.0` | `0.0` | `0.0%` |
| **`0.9142`** | `6` | `512.4` | `5.8` | `481.8` | `48.2%` |
| **`0.9142`** | `12` | `238.1` | `4.9` | `757.0` | `75.7%` |
| **`0.9142`** | `24` | `54.6` | `2.1` | `943.3` | `94.3%` |
| **`0.9142`** | **`48`** | **`23.8`** | **`0.4`** | **`975.8`** | **`97.6%`** |

---

## 12. The Horizon: How the Open Puzzle Board Will Auto-Compile Our Next 3 Pipelines

By turning synthetic biology design into an open, continuously evaluated constraint-satisfaction board (`bio_pipeline_puzzles`), every new wave of the `pg_bio` discovery swarm has the potential to lock the final missing slot of an industrial or clinical pipeline:

- **1. *Haloferax massiliensis* Human-Gut Nitrite & Ammonia Detoxification (`human-gut-nitrite-ammonia-detox`, currently `3/4 Locked`):**
  - *The Contrast:* Conventional mesophilic gut probiotics (*Lactobacillus*, *E. coli* Nissle) lose nitrite reductase fold stability under inflammatory reactive nitrogen bursts, whereas our *Haloferax massiliensis* (`A0A0D6JTS1` Nitrite Reductase + `A0A0D6JRN8` PurE Mutase + *H. larsenii* `A0A1H7RPS5` `[2Fe-2S]` Ferredoxin) maintains a compact 89-aa fold with a $+9.11^\circ\text{C}$ electrostatic staple ceiling.
  - *What Will Auto-Compile It:* As soon as the swarm verifies a 3D Kabsch alignment ($\text{TM} \ge 0.85$) for a *Haloferacaceae* **NsrR/ArsR Nitric-Oxide Allosteric Sensor (`M4_Beacon`)**—bridging our current closest candidate `S2EBX9` (`96.9%` Pocket IoU in *Candidatus Nitrosarchaeum*) into the *Haloferax* genus—`hypothesis_agent.py` will automatically lock `4/4` and compile Pipeline #11.
- **2. *Metallosphaera prunae* Uranium-Mine & E-Waste Bioleaching (`uranium-ewaste-acid-bioleaching`, currently `3/4 Locked` at `72°C, pH 1.8`):**
  - *The Contrast:* Standard *Acidithiobacillus ferrooxidans* bioleaching stalls above $40^\circ\text{C}$ when exothermic sulfide oxidation heats the heap, whereas *Metallosphaera prunae* (`A0A4D8RYL5` rescued `DUF1947` RNA-repair clamp + `A4YDL8` PFL radical sink + `S2EBX9` ArsR heavy-metal sensor) thrives at $72^\circ\text{C}$ and $\text{pH } 1.8$.
  - *What Will Auto-Compile It:* Locking a *Sulfolobales* hydrophobic pyrite/chalcopyrite **`M1_Anchor`** with $\text{GRAVY} \ge +0.35$ and CETSA $T_{\text{opt}} \ge 70^\circ\text{C}$ (`99.0%` predicted 48h RK4 yield).
- **3. Short-Chain $\text{C}_4$ PFAS (`PFBA`/`PFBS`) Leachate Mineralization (`pfas-short-chain-c4-mineralization`, currently `3/4 Locked` at `45°C, 2.5 M NaCl`):**
  - *The Contrast:* Granular activated carbon (GAC) and reverse osmosis struggle to capture ultra-short $\text{C}_4$ perfluorobutanoate (`PFBA`, `MW 214.0 Da`), whereas our CETSA-clamped `V5TNY2` + `Q1JU72` defluorinase pair is already locked at $T_{\text{opt}} = 58.5^\circ\text{C}$.
  - *What Will Auto-Compile It:* Kabsch 3D verification of candidate **`A0A1H5...`** (a *Halobellus limi* Thiamine-PP decarboxylase currently sitting at **`96.2%` RangeFinder Pocket IoU**) to lock the **`M3_Sink`** slot (`4/4`).

{% include pg_bio_promo.md %}
