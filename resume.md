---
layout: page
title: "Jônatas Davi Paganini — Systems Research & Curriculum Vitae"
permalink: /resume
description: "Systems Researcher — PostgreSQL Storage Internals, Multidimensional Indexing & Computational Biology"
---

# Jônatas Davi Paganini
**Systems Researcher — PostgreSQL Storage Internals, Multidimensional Indexing & Computational Biology**  
📍 Paraíso, SC, Brazil *(Willing to relocate to Europe)*  
✉️ [jonatasdp@gmail.com](mailto:jonatasdp@gmail.com) | 🐙 [github.com/jonatas](https://github.com/jonatas) | 🔗 [linkedin.com/in/jonatasdp](https://linkedin.com/in/jonatasdp) | 🌐 [ideia.me](https://ideia.me)

---

## Research Summary
Systems engineer and independent database researcher with 20+ years of production and R&D experience specializing in **PostgreSQL storage internals, Rust kernel extensions, multidimensional spatial indexing, and in-database computational biology**. Creator of **`pg_bio`** and **`spiral`**, demonstrating that pushing sequence alignment, 3D structural superposition, molecular graph hashing, and space-filling Z-order curves directly into PostgreSQL’s shared buffer manager eliminates external serialization bottlenecks and yields order-of-magnitude speedups (36.9x on multi-chain structural screening). Seeking a PhD or Research Software Engineer position in Database Systems or Computational Biology in Europe.

---

## Core Research Engines & Open-Source Artifacts

### 1. `pg_bio` — Native Structural Biology & Chemoinformatics Engine for PostgreSQL (`Rust`, `C`, `PostgreSQL`)
* **Architecture:** Executes local Smith-Waterman alignment (`smith_waterman_score`), 3D Kabsch backbone superposition (RMSD & TM-score), Weisfeiler-Lehman molecular graph hashing, SMILES chemoinformatics, and RosettaCommons Chaperone solvent-accessibility (`bio_rasa`, `evaluate_chaperone_block`) directly inside PostgreSQL shared memory buffers.
* **Benchmark Impact:** Evaluated 400 multi-chain complexes (144 heavy atoms each) in **209.04 ms (0.52 ms/complex)** vs. 7,709.11 ms in baseline pipelines (**36.9x speedup**, 100% precision/recall across 4 failure-mode archetypes) with zero external Python serialization.
* **Dark Proteome Discovery:** Deployed an autonomous 226,242-edge structural correlation swarm combining 1024-dimensional protein embeddings, domain chunking for >400 aa orthologs, and sub-angstrom Twilight-Zone discovery (identifying a 0.81 Å Cα RMSD lock across halophilic *DUF7861* orthologs).

### 2. `spiral` — Geometry-Aware Multidimensional Storage Engine for PostgreSQL (`Rust`, `PostgreSQL Buffer Manager`)
* **O(1) Physical Page Seeks:** Bypasses traditional B-Tree index traversal by mapping normalized `(timestamp, tenant_id)` coordinates directly to `(block_number, byte_offset)` inside PostgreSQL 8KB pages via custom `#[repr(C)]` page layouts (`SpiralPageOpaque`) and 128-byte Gorilla XOR delta-compressed blocks (`CompressedBlock`).
* **Deterministic Z-Order Indexing (`spiral_zorder`):** Encodes multi-attribute dimensions into a 1D space-filling curve using deterministic FNV-1a hashing, collapsing expensive multi-column analytical scans into tight contiguous range scans (`BETWEEN lo AND hi`) and automated hierarchical rollups.

### 3. `timescaledb` Ruby Ecosystem & `fast` AST Query/Code Tooling (`Ruby`, `SQL`, `AST`)
* Created the official Ruby ORM/hypertable abstractions for TimescaleDB and built `fast`, an Abstract Syntax Tree (AST) pattern-matching and refactoring engine for Ruby and SQL formatting.

---

## Selected Working Papers & Technical Monographs
* **[Working Paper / Technical Report, Nov 2026]** *"Announcing RosettaCommons Chaperone Support in `pg_bio` & Mining the Twilight Zone at 0.81 Å (DUF7861)"* — [ideia.me/twilight-zone-duf7861-halophile-chaperone-dark-proteome](https://ideia.me/twilight-zone-duf7861-halophile-chaperone-dark-proteome)
* **[Technical Report, Oct 2026]** *"Domain Chunking Massive Proteins & Heatmapping the Dark Proteome in `pg_bio`"* — [ideia.me/chunking-massive-proteins-pg-bio-swarm](https://ideia.me/chunking-massive-proteins-pg-bio-swarm)
* **[Systems Monograph, May 2026]** *"Spiral: An Experiment in Geometry-Aware Storage for PostgreSQL (O(1) Buffer Seeks & Z-Order Curves)"* — [ideia.me/spiral-intro](https://ideia.me/spiral-intro)
* **[Systems Monograph, Sep 2025]** *"PostgreSQL Internals Workshop: 8KB Pages, TOAST Compression Ratios, Index Overhead Math & Shared Buffer Caching"* — [ideia.me/postgresql-internals-workshop](https://ideia.me/postgresql-internals-workshop)
* **[Compiler & Parser Essay]** *"You're the Parser"* & *"Time Economics"* — [ideia.me](https://ideia.me)

---

## Professional & Research Experience

**Principal Systems Researcher & Founder** — **IDEIA.ME** *(Feb 2026 – Present)*
* Conducting full-time independent systems research on PostgreSQL storage extensions (`pg_bio`, `spiral`) and collaborating with academic bioprospecting and biocatalysis groups in Brazil (UFAM / AmazonZyme and UFAL / LAPRO) on enzyme discovery and structural benchmarking.

**Staff Software Engineer (Distributed Energy Telemetry)** — **BaxEnergy** *(Jun 2025 – Feb 2026)*
* Engineered high-throughput telemetry and real-time data processing pipelines for renewable energy power plants.

**Staff Developer Advocate & Database Systems Researcher** — **Timescale** *(Apr 2021 – 2025)*
* Worked within the PostgreSQL time-series architecture ecosystem (founded by Princeton CS Prof. Mike Freedman), researching query optimization, custom index access methods, compression ratios, and continuous aggregation.
* Delivered **30+ international conference lectures** and **15+ hands-on PostgreSQL internals workshops** across 12 countries reaching 5,000+ engineers.

**Senior Backend & Systems Architect** — **Toptal / Hubstaff / Independent** *(2006 – 2021)*
* 15+ years architecting high-scalability distributed backends, relational database optimizations, and open-source developer tooling.

---

## Education & Advanced Academic Standing

**Bachelor of Science in Information Systems (*Bacharelado em Sistemas de Informação*)** — Brazil
* **Bologna / European Equivalency:** 4-year full-time Brazilian *Bacharelado* degree (~3,000+ curriculum hours; equivalent to ~240 ECTS), which legally qualifies the holder for **Direct Doctorate (*Doutorado Direto*)** admission in Brazil without an intermediate Master's degree.
* **Accelerated Standing by Examination (*Exame de Suficiência*):** Entered university with 1.5 years of prior production software engineering experience and successfully bypassed multiple full-year core computing modules via comprehensive institutional proficiency examinations.

---

## Invited Talks & Workshops (Selected from 30+ International Presentations)
* **PostgreSQL Internals Workshop (4-Hour Deep Dive):** *8KB Pages, TOAST Storage, Index Math & Buffer Management* — Kraków, Poland & International (2025)
* **Lambda Days 2024 (Kraków, Poland):** *Grepping SQL Code Like a Boss (AST & Command-Line Query Analysis)*
* **Lambda Days 2023 (Kraków, Poland):** *Functional Programming in PostgreSQL*
* **PGConf Brazil 2022:** *Zen Life with `psql`*
* **RubyKaigi Takeout 2021:** *Grepping Ruby Code Like a Boss (AST Manipulation)*
