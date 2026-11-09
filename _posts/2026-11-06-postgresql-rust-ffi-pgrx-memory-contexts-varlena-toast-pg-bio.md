---
layout: post
title: "PostgreSQL Extension Internals in Rust (Part 1): Crossing the C ↔ Rust FFI Boundary, MemoryContexts, varlena Layout, and Parallel Workers in pg_bio"
date: 2026-11-06 10:30:00 -0300
categories: [postgresql, rust, pgrx, database-internals, bioinformatics]
tags: [postgresql, rust, pgrx, ffi, memory-context, varlena, toast, parallel-query, query-planner, pg_bio, spiral, internals]
description: "A deep-dive systems monograph on how PostgreSQL's C kernel (fmgr, CurrentMemoryContext, 8KB heap pages, varlena headers, and TOAST) interoperates with Rust via pgrx—backed by production code and 36.9x–1,513x benchmarks from pg_bio."
mermaid: true
math: true
---

> **📚 PostgreSQL & Rust (`pgrx`) Systems Internals Series**
> This monograph is part of an ongoing systems engineering series exploring how we turned PostgreSQL 18 into a high-performance scientific and multidimensional computing engine using Rust:
> * **Part 1: Crossing the C ↔ Rust FFI Boundary (`MemoryContext`, `varlena`, TOAST & Parallel Workers)** *(You are here)*
> * [Companion Systems Monograph: Delegating RangeFinder Pocket Intervals, GiST R-Trees & 3D Cheminformatics to the Query Planner](/postgresql-query-planner-rangefinder-gist-bioinformatics-engine)
> * [Part 2: Writing a Hybrid Database Operator in Rust (`<~>`)](/writing-a-hybrid-database-operator-for-biology)
> * [Part 3: Indexing 3D Space Like a Video Game (Morton Z-Order B-Trees)](/indexing-3d-space-like-a-video-game)
> * [Part 4: The 27-Hour Index — HNSW Memory Spilling & `maintenance_work_mem`](/the-27-hour-index)
> * [Storage Engine Monograph: Spiral — Geometry-Aware Multidimensional Storage & O(1) Page Seeks](/spiral-intro)

---

When a database query slows down from milliseconds to minutes, application engineers usually blame SQL and reach for an external microservice, a Redis cache, or a distributed Python worker pool. Systems engineers ask a different question: **how many bytes are we copying across the kernel socket just to throw 99.9% of them away?**

While building **[`pg_bio`](https://github.com/jonatas/pg_bio)**—our 7,700-line Rust extension that executes 3D structural biology, molecular graph isomorphism, and thermodynamic auditing natively inside PostgreSQL 18—and **[`spiral`](https://github.com/jonatas/spiral)**, we repeatedly confronted the fundamental bottleneck of modern data-intensive architectures: **the Serialization and IPC Tax**.

In this first installment of the *PostgreSQL Extension Internals in Rust* series, we are going to open up the hood of PostgreSQL's C kernel and trace exactly what happens when a SQL query crosses the Foreign Function Interface (FFI) boundary into compiled Rust code via [`pgrx`](https://github.com/pgcentralfoundation/pgrx). We will dissect:
1. Why moving compute into PostgreSQL's **Shared Buffer Manager** yields **36.9x to 1,513.7x speedups** over client-side pipelines.
2. How PostgreSQL's C **Function Manager (`fmgr`)**, **`sigsetjmp`/`ereport` exception stack**, and hierarchical **`MemoryContext` arena allocator** interact with Rust's ownership and `Drop` semantics.
3. How custom Rust structs (`ResidueCoord`, `SparseAttentionMap`, `Molecule`) are laid out inside PostgreSQL **8KB Heap Pages**, **4-byte/1-byte `varlena` headers**, and **TOAST out-of-line tables**.
4. How `#[pg_extern(immutable, parallel_safe)]` teaches the **PostgreSQL Cost-Based Query Planner** to fan out Rust compute across parallel background workers over Dynamic Shared Memory (`DSM`).

<!--more-->

---

## 1. The Architectural Bottleneck: The IPC Serialization Tax vs. Shared Buffer Compute

Consider a standard analytical workload—whether you are screening 400 multi-chain protein complexes (144 heavy atoms each), evaluating 10,000 chemical graphs, or scanning 10 million financial order-book ticks.

In a traditional client-side architecture (Python + SQLAlchemy/psycopg3 + NumPy/RDKit), executing a domain algorithm over $N$ tuples requires five sequential data movements:

$$
T_{\text{total}} = \underbrace{T_{\text{buffer\_read}}}_{\text{8KB Page Pin}} + \underbrace{N \cdot (C_{\text{wire\_encode}} + C_{\text{tcp\_socket}} + C_{\text{python\_alloc}})}_{\text{The IPC & Serialization Tax (Dominates Wall-Clock Time)}} + \underbrace{N \cdot C_{\text{compute}}}_{\text{Actual Math}}
$$

1. **PostgreSQL Backend:** Pins the 8KB page in `shared_buffers`, extracts each tuple, formats it into PostgreSQL's wire protocol (`DataRow` messages), and copies it into the kernel socket buffer.
2. **OS Kernel / TCP Loopback:** Context-switches between the `postgres` backend process and the client process.
3. **Client Runtime (Python/Node/JVM):** Allocates heap objects, deserializes text or binary payloads into native structs, and finally runs the algorithm.

When we move that exact same algorithm into a compiled Rust extension inside the PostgreSQL backend process, the middle term vanishes completely:

| Workload Benchmark (`pg_bio` on PostgreSQL 18) | Client-Side Pipeline (Python Pull + Deserialization) | In-Database Rust (`pgrx` in Shared Buffers) | Measured Speedup |
| :--- | :---: | :---: | :---: |
| **Canonical Substructure & Hash Lookup** (`10,000` SMILES molecules) | `1,018.64 ms` | **`0.673 ms`** *(B-Tree on precomputed Rust `wl_hash`)* | **`1,513.7x`** |
| **Multi-Chain 3D Biophysical Audit** (`400` complexes $\times$ `144` heavy atoms, SASA + H-Bonds + Kabsch RMSD) | `7,709.11 ms` | **`209.04 ms`** *(`0.52 ms` / complex in shared memory)* | **`36.9x`** |
| **1024-Bit ECFP4 Tanimoto Similarity Scan** (`10,000` molecules, hardware `POPCNT`) | `1,018.64 ms` | **`434.46 ms`** *(Sequential scan over `varlena` tuples)* | **`2.3x`** |

Why is the in-database execution up to three orders of magnitude faster? Because the Rust function executes **inside the same OS process address space as the PostgreSQL Buffer Manager**.

---

## 2. Crossing the C ↔ Rust Boundary: `fmgr`, Unwind Safety, and `MemoryContext`

PostgreSQL is written in C (C99) and has evolved since 1986 around three core invariants that are completely foreign to standard Rust programs:
1. **The Version-1 Calling Convention (`FunctionCallInfo`):** Every SQL-callable C function receives a single pointer (`PG_FUNCTION_ARGS` $\rightarrow$ `FunctionCallInfo fcinfo`) containing an array of `NullableDatum` arguments and returns a 64-bit `Datum`.
2. **Arena-Based Memory Management (`MemoryContext`):** PostgreSQL rarely calls raw `malloc()` or `free()`. Instead, every allocation happens via `palloc()` inside a hierarchical `MemoryContext` (`TopTransactionContext` $\rightarrow$ `ExecutorState` $\rightarrow$ `ExprContext`). When a tuple or query finishes, PostgreSQL wipes the entire arena in $O(1)$ time with `MemoryContextReset()`.
3. **`sigsetjmp` / `siglongjmp` Error Handling:** When a PostgreSQL C function encounters an error (`ereport(ERROR, ...)`), it performs a non-local C jump (`siglongjmp`) all the way back to the top-level transaction loop—Which would immediately trigger **Undefined Behavior (UB)** and leak heap allocations if it jumped across an active Rust stack frame with pending `Drop` destructors!

Here is how `pgrx` bridges these two worlds safely every time a query invokes a function in `pg_bio`:

{% mermaid %}
sequenceDiagram
    autonumber
    participant Exec as PostgreSQL C Executor<br/>(ExecInterpExpr)
    participant Guard as pgrx #[pg_guard] Wrapper<br/>(C ABI / catch_unwind)
    participant Rust as pg_bio Rust Function<br/>(#[pg_extern])
    participant Mem as PostgreSQL MemoryContext<br/>(ExprContext / palloc)

    Exec->>Guard: Call fn_addr(fcinfo: FunctionCallInfo)
    Note over Guard: Enter std::panic::catch_unwind()<br/>Isolate C siglongjmp from Rust Drop frames
    Guard->>Mem: PG_DETOAST_DATUM() on varlena inputs
    Mem-->>Guard: Zero-copy slice or detoasted C buffer
    Guard->>Rust: Borrow &str / &[u8] or deserialize PostgresType
    Note over Rust: Execute pure Rust math<br/>(SIMD popcount, Kabsch SVD, Z-Order)
    Rust-->>Guard: Return Rust value (i64, f64, or PostgresType)
    Guard->>Mem: palloc() output Datum in Caller's MemoryContext
    Note over Guard: Drop temporary Rust Vec/String allocations cleanly
    Guard-->>Exec: Return Datum (or convert Panic -> ereport(ERROR))
    Note over Exec: Reset per-tuple ExprContext arena in O(1)
{% endmermaid %}

### How `#[pg_extern]` Compiles Down to Safe C FFI
Let's look at the very first functions in [`pg_bio/src/lib.rs`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L1-L57):

```rust
use pgrx::prelude::*;
use serde::{Deserialize, Serialize};

// Emits Pg_magic_func required by PostgreSQL's dynamic loader (dfmgr.c)
// to verify PG_VERSION_NUM, block size (8192), and ABI compatibility at LOAD time.
pgrx::pg_module_magic!();

#[derive(PostgresType, Serialize, Deserialize, Debug, Clone)]
pub struct ResidueCoord {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub name: String,
}

#[inline]
fn split_by_3(x: u64) -> u64 {
    let mut res = 0;
    for i in 0..21 {
        res |= ((x >> i) & 1) << (3 * i);
    }
    res
}

#[pg_extern(immutable, parallel_safe)]
pub fn z_order_encode(x: f64, y: f64, z: f64) -> i64 {
    let map = |v: f64| -> u64 {
        let v = v.clamp(-500.0, 500.0) + 500.0;
        let scaled = (v * 1000.0) as u64;
        scaled & 0x1FFFFF
    };
    let xx = split_by_3(map(x));
    let yy = split_by_3(map(y));
    let zz = split_by_3(map(z));
    (xx | (yy << 1) | (zz << 2)) as i64
}
```

When `cargo pgrx` compiles `z_order_encode(x: f64, y: f64, z: f64) -> i64`, it generates two things automatically:
1. **An extern `"C-unwind"` wrapper annotated with `#[pg_guard]`:**
   - It reads `fcinfo.args[0]`, `fcinfo.args[1]`, and `fcinfo.args[2]` directly as pass-by-value 64-bit `Datum` registers (zero heap allocations!).
   - It wraps the call in a panic/error boundary so that if Rust panics (e.g., index out of bounds), all Rust local variables are dropped *before* `pgrx` triggers PostgreSQL's C `ereport(ERROR)`. Conversely, if a PostgreSQL C call (`pg_sys::...`) raises a C `elog(ERROR)`, `pgrx` intercepts the `siglongjmp`, converts it into a Rust panic payload to unwind Rust destructors cleanly, and then resumes the PostgreSQL C jump!
2. **The SQL DDL catalog registration:**
   ```sql
   CREATE FUNCTION "z_order_encode"(
       "x" double precision,
       "y" double precision,
       "z" double precision
   ) RETURNS bigint
   IMMUTABLE STRICT PARALLEL SAFE
   LANGUAGE c AS 'MODULE_PATHNAME', 'z_order_encode_wrapper';
   ```

---

## 3. Inside the 8KB Page: Designing Custom `varlena` Types & Mastering TOAST

Pass-by-value scalar types like `i64` (`bigint`) and `f64` (`double precision`) fit inside a single 8-byte CPU register (`Datum`). Realistic domain objects—like a 3D atomic coordinate with an atom label (`ResidueCoord`), a Compressed Sparse Row attention matrix (`SparseAttentionMap`), or a normalized chemical graph (`Molecule`)—are variable-length structures.

In PostgreSQL's storage engine, all variable-length data types (`text`, `bytea`, `jsonb`, `vector`, and every `#[derive(PostgresType)]` struct in `pg_bio`) are stored as **`struct varlena`** inside **8KB (`8192`-byte) Heap Pages**.

{% mermaid %}
flowchart LR
    subgraph Page["PostgreSQL 8KB (8,192-Byte) Heap Page"]
        direction TB
        PH["PageHeaderData (24B)\npd_lsn, pd_lower, pd_upper"] --> LP["Line Pointers (ItemIdData, 4B each)\nlp_off, lp_flags, lp_len"]
        LP --> TUP["HeapTupleHeaderData (23B + null bitmap)\nt_xmin, t_xmax, t_cid, t_ctid, t_infomask"]
        TUP --> COL1["Col 1: uniprot_id\n(1B short varlena)"]
        TUP --> COL2["Col 2: z_index (i64)\n8B Pass-by-Value Datum"]
        TUP --> COL3["Col 3: #[derive(PostgresType)]\n4B va_header + CBOR/Binary Payload"]
    end

    COL3 -->|"Payload <= 2,000 Bytes\n(ResidueCoord / Molecule)"| INLINE["Inline Uncompressed or\n1-Byte Short Header (va_header_1b)"]
    COL3 -->|"Payload > 2,000 Bytes\n(SparseAttentionMap CSR)"| TOAST["TOAST Subsystem (tuptoaster.c)\n1. LZ4 / pglz Inline Compression\n2. Out-of-Line pg_toast_oid Chunks (~2KB)"]
{% endmermaid %}

### How `#[derive(PostgresType)]` Layouts Work in `pg_bio`
Let's compare three custom types from [`pg_bio/src/lib.rs`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L124-L364) and see how their physical byte size dictates their behavior inside PostgreSQL's TOAST (*The Oversized-Attribute Storage Technique*) subsystem:

```rust
// Type 1: Small 3D Coordinate (~32–48 bytes serialized)
// Always stays INLINE inside the 8KB heap tuple with a 1-byte short varlena header!
#[derive(PostgresType, Serialize, Deserialize, Debug, Clone)]
pub struct ResidueCoord {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub name: String,
}

// Type 2: Medium Normalized Chemical Graph (~250–600 bytes serialized)
// Embeds precomputed 64-bit WL hash & 1024-bit ECFP4 fingerprint (16 x u64 = 128 bytes)
#[derive(PostgresType, Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Molecule {
    pub smiles: String,
    pub is_valid: bool,
    #[serde(default)]
    pub wl_hash: i64,
    #[serde(default)]
    pub ecfp_bits: Vec<u64>,
    #[serde(default)]
    pub atoms: Vec<PgBioAtom>,
    #[serde(default)]
    pub bonds: Vec<PgBioBond>,
}

// Type 3: Large Compressed Sparse Row (CSR) Matrix (1 KB – 50 KB serialized)
// Automatically compressed in-place (LZ4/pglz) or sliced into pg_toast when > 2 KB!
#[derive(PostgresType, Serialize, Deserialize, Debug, Clone)]
pub struct SparseAttentionMap {
    pub sequence_length: i32,
    pub entries: Vec<AttentionEntry>,
}
```

### The Three Golden Rules of `varlena` Performance in Rust Extensions

When a SQL query reads a column of type `Molecule` or `ResidueCoord`, `pgrx` calls `PG_DETOAST_DATUM` and deserializes the payload into a Rust struct inside the current expression's `MemoryContext`. While infinitely faster than network I/O, **repeatedly detoasting and deserializing a `varlena` column inside an inner loop of 2.34 million rows still burns CPU cycles**.

In `pg_bio`, we apply three storage-engine patterns to eliminate unnecessary detoasting:

1. **Extract Hot Index Keys into Pass-by-Value Generated Columns (`8-Byte Datum`):**
   Never force a B-Tree index to call a `varlena` deserialization function during tree traversal. Instead, project the 64-bit invariant into a `BIGINT GENERATED ALWAYS AS (...) STORED` column:
   ```sql
   CREATE TABLE protein_atoms (
       atom_id SERIAL PRIMARY KEY,
       uniprot_id TEXT NOT NULL,
       coord ResidueCoord NOT NULL,
       -- Precomputed once at INSERT time; stored as a raw 8-byte pass-by-value int8!
       z_index BIGINT GENERATED ALWAYS AS (residue_z_index(coord)) STORED
   );

   CREATE INDEX idx_atoms_z_order ON protein_atoms USING btree (z_index);
   ```
   When executing a 3D bounding-box query (`WHERE z_index BETWEEN lo AND hi`), PostgreSQL traverses `idx_atoms_z_order` comparing raw 64-bit CPU integers at native memory bandwidth (`~7 ms` across 200,000 atoms), and only detoasts `coord` (`ResidueCoord`) for the tiny fraction of rows that survive the B-Tree range scan!

2. **Keep Compact Structs Under the `TOAST_TUPLE_THRESHOLD` (`2,000` Bytes):**
   PostgreSQL triggers the TOAST compressor (`tuptoaster.c`) when a tuple exceeds `TOAST_TUPLE_THRESHOLD` ($\approx 2\text{ KB}$). By encoding `PgBioAtom` (`5 bytes`) and `PgBioBond` (`6 bytes`) with compact `u8`/`u16` indices and packing the 1024-bit Morgan ECFP4 fingerprint into sixteen `u64` words (`128 bytes`), a drug-like `Molecule` fits in `~350 bytes`. It never spills to the out-of-line `pg_toast` table, avoiding secondary index lookups on `chunk_id`.

3. **Replace Dense $N \times N$ Arrays with Sparse CSR Custom Types (`SparseAttentionMap`):**
   A dense $1000 \times 1000$ `float4[]` contact map occupies `4 MB`—forcing PostgreSQL to slice it into **2,000 separate out-of-line TOAST chunks** across `pg_toast`. By storing only non-zero contacts in `SparseAttentionMap` (`entries: Vec<AttentionEntry>`), the payload shrinks by $>95\%$, staying inside inline compressed shared buffers.

---

## 4. Unlocking Parallel Query Workers: Why `#[pg_extern(immutable, parallel_safe)]` Matters

Look closely at the macro attributes on almost every pure compute function in [`pg_bio/src/lib.rs`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs):

```rust
#[pg_extern(immutable, parallel_safe)]
pub fn smith_waterman_score(seq1: &str, seq2: &str, match_score: i32, mismatch: i32, gap: i32) -> i32 { ... }
```

If you write `#[pg_extern]` *without* arguments, `pgrx` defaults to PostgreSQL's conservative defaults: **`VOLATILE`** and **`PARALLEL UNSAFE`**.

What happens to the PostgreSQL Query Planner when a function in your `SELECT` list or `WHERE` clause is `VOLATILE` and `PARALLEL UNSAFE`?
1. **No Index Usage or Constant Folding:** If you write `WHERE z_index >= z_order_encode(10.0, 10.0, 10.0)` and `z_order_encode` is `VOLATILE`, PostgreSQL assumes the function might return a different number on every row (like `random()`). It **refuses to use the B-Tree index** and falls back to a full Sequential Scan, re-evaluating the constant boundary 2.34 million times! Marking it `immutable` tells the planner to evaluate `z_order_encode(10.0, 10.0, 10.0)` **once during planning** (constant folding) and push the resulting 64-bit integer directly into an `Index Cond`.
2. **Parallel Query Serialization:** If any function in a query is `PARALLEL UNSAFE`, PostgreSQL disables parallel background workers (`max_parallel_workers_per_gather`). By marking our pure Rust functions `parallel_safe`, PostgreSQL's executor spins up parallel worker processes that attach to the leader's **Dynamic Shared Memory (`DSM`)** segment and divide the 8KB heap pages across all available CPU cores via an atomic `Parallel Block Table Scan`:

```sql
-- Parallelized In-Database Tanimoto + Smith-Waterman Screening
EXPLAIN (ANALYZE, BUFFERS)
SELECT uniprot_id,
       smith_waterman_score(sequence, 'MKTAYIAKQRQISFVKSHFSRQ', 2, -1, -2) AS sw_score
FROM proteins
WHERE smith_waterman_score(sequence, 'MKTAYIAKQRQISFVKSHFSRQ', 2, -1, -2) > 35;
```

```text
                                                       QUERY PLAN
-------------------------------------------------------------------------------------------------------------------------
 Gather  (cost=1000.00..84210.45 rows=412 width=18) (actual time=1.842..38.419 rows=19 loops=1)
   Workers Planned: 4
   Workers Launched: 4
   Buffers: shared hit=18420
   ->  Parallel Seq Scan on proteins  (cost=0.00..83169.25 rows=103 width=18) (actual time=0.912..34.105 rows=4 loops=5)
         Filter: (smith_waterman_score(sequence, 'MKTAYIAKQRQISFVKSHFSRQ'::text, 2, '-1'::integer, '-2'::integer) > 35)
         Rows Removed by Filter: 468006
         Buffers: shared hit=18420
 Planning Time: 0.142 ms
 Execution Time: 38.610 ms
```

Because `smith_waterman_score` is `parallel_safe` and allocates only two tiny $O(M)$ stack/heap vectors inside each worker's per-tuple `ExprContext`, 5 processes (1 Leader + 4 Parallel Workers) chew through **2.34 million sequences in shared buffers (`shared hit=18420`, zero disk reads) in 38.6 milliseconds**!

---

## 5. Interactive Simulator: Inside an 8KB PostgreSQL Page (`varlena`, TOAST & IPC Cost)

Use the interactive simulator below to inspect how different scientific and analytical data structures are packed into an **8KB (`8,192`-byte) PostgreSQL Heap Page**, when the **TOAST threshold (`2,000` bytes)** triggers inline compression or out-of-line slicing, and how **In-Database Rust (`pgrx`)** compares to a client-side Python pull over `10,000` rows:

<div id="pg-page-sim" style="background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%); border: 1px solid #334155; border-radius: 14px; padding: 22px; margin: 28px 0; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;">
  <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid #334155; padding-bottom: 14px; margin-bottom: 18px;">
    <div>
      <span style="background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Interactive Storage Engine Inspector</span>
      <h3 style="margin: 8px 0 2px 0; font-size: 1.25rem; color: #ffffff;">8KB Heap Page, varlena Header &amp; TOAST Layout Simulator</h3>
      <p style="margin: 0; font-size: 0.88rem; color: #94a3b8;">Select a data structure to inspect its physical tuple footprint inside PostgreSQL 18 shared buffers.</p>
    </div>
  </div>

  <!-- Preset Selector Buttons -->
  <div role="group" aria-label="Select PostgreSQL Data Type Preset" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 18px;">
    <button type="button" class="pg-sim-preset-btn" data-preset="coord" aria-pressed="true" style="background: #0284c7; color: #ffffff; border: 1px solid #38bdf8; border-radius: 10px; padding: 10px 12px; text-align: left; cursor: pointer; font-weight: 700; font-size: 0.85rem;">
      1. <code>ResidueCoord</code> + <code>z_index</code><br/>
      <span style="font-weight: 400; font-size: 0.76rem; color: #e0f2fe;">~42B Tuple • 1B Short varlena</span>
    </button>
    <button type="button" class="pg-sim-preset-btn" data-preset="molecule" aria-pressed="false" style="background: #0f172a; color: #cbd5e1; border: 1px solid #334155; border-radius: 10px; padding: 10px 12px; text-align: left; cursor: pointer; font-weight: 700; font-size: 0.85rem;">
      2. <code>Molecule</code> (Hückel + ECFP4)<br/>
      <span style="font-weight: 400; font-size: 0.76rem; color: #94a3b8;">~340B Tuple • 4B Inline varlena</span>
    </button>
    <button type="button" class="pg-sim-preset-btn" data-preset="sparse_csr" aria-pressed="false" style="background: #0f172a; color: #cbd5e1; border: 1px solid #334155; border-radius: 10px; padding: 10px 12px; text-align: left; cursor: pointer; font-weight: 700; font-size: 0.85rem;">
      3. <code>SparseAttentionMap</code> (CSR)<br/>
      <span style="font-weight: 400; font-size: 0.76rem; color: #94a3b8;">~2,400B • Inline LZ4 TOAST</span>
    </button>
    <button type="button" class="pg-sim-preset-btn" data-preset="dense_matrix" aria-pressed="false" style="background: #0f172a; color: #cbd5e1; border: 1px solid #334155; border-radius: 10px; padding: 10px 12px; text-align: left; cursor: pointer; font-weight: 700; font-size: 0.85rem;">
      4. Naive Dense 500×500 Matrix<br/>
      <span style="font-weight: 400; font-size: 0.76rem; color: #fca5a5;">1,000,000B • Out-of-Line TOAST Trap</span>
    </button>
  </div>

  <!-- Metrics Grid -->
  <div id="pg-sim-live-region" aria-live="polite" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 12px; margin-bottom: 18px;">
    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
      <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Physical Tuple Size</div>
      <div id="pg-sim-tuple-size" style="font-size: 1.35rem; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">69 Bytes</div>
      <div id="pg-sim-header-detail" style="font-size: 0.75rem; color: #cbd5e1; margin-top: 2px;">23B HeapHdr + 8B int8 + 38B varlena</div>
    </div>
    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
      <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Tuples per 8KB Page</div>
      <div id="pg-sim-tuples-page" style="font-size: 1.35rem; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">111 rows / page</div>
      <div id="pg-sim-fill-detail" style="font-size: 0.75rem; color: #cbd5e1; margin-top: 2px;">99.1% Page Density (4B ItemId/row)</div>
    </div>
    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
      <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">TOAST Storage State</div>
      <div id="pg-sim-toast-state" style="font-size: 1.1rem; font-weight: 800; color: #a7f3d0; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">INLINE (1B Short Hdr)</div>
      <div id="pg-sim-toast-detail" style="font-size: 0.75rem; color: #cbd5e1; margin-top: 2px;">0 pg_toast chunks • Zero decompression</div>
    </div>
    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
      <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">10k-Row Query Latency</div>
      <div id="pg-sim-latency" style="font-size: 1.25rem; font-weight: 800; color: #fbbf24; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">0.48 ms vs 410 ms</div>
      <div id="pg-sim-speedup" style="font-size: 0.75rem; color: #cbd5e1; margin-top: 2px;">pgrx Shared Buffers vs Python Pull</div>
    </div>
  </div>

  <!-- Visual 8KB Page Bar -->
  <div style="background: #090d16; border: 1px solid #334155; border-radius: 10px; padding: 14px; margin-bottom: 12px;">
    <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: #94a3b8; margin-bottom: 6px; font-family: 'JetBrains Mono', monospace;">
      <span>Byte 0: PageHeaderData (24B) + Line Pointers (pd_lower)</span>
      <span id="pg-sim-bar-label">8,192 Bytes Total (1 Block in shared_buffers)</span>
    </div>
    <div style="display: flex; width: 100%; height: 30px; border-radius: 6px; overflow: hidden; border: 1px solid #475569;">
      <div id="pg-bar-hdr" style="width: 6%; background: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #0f172a;" title="PageHeader + ItemId Line Pointers">Hdr</div>
      <div id="pg-bar-free" style="width: 4%; background: #1e293b; display: flex; align-items: center; justify-content: center; font-size: 0.68rem; color: #64748b;" title="Unallocated Free Space">Free</div>
      <div id="pg-bar-tuples" style="width: 90%; background: linear-gradient(90deg, #0284c7, #10b981); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #ffffff;" title="Heap Tuples Growing Upward from pd_upper">111 Inline Heap Tuples (Growing ← from byte 8192)</div>
    </div>
    <p id="pg-sim-explanation" style="margin: 12px 0 0 0; font-size: 0.86rem; color: #cbd5e1; line-height: 1.5;">
      <strong>Storage Kernel Verdict:</strong> Because <code>ResidueCoord</code> is under 127 bytes, PostgreSQL uses a <strong>1-byte short <code>varlena</code> header (<code>va_header_1b</code>)</strong> instead of a 4-byte header, packing <strong>111 atoms per 8KB page</strong>. Combined with the pass-by-value <code>z_index BIGINT</code> column, B-Tree index scans never even touch the <code>varlena</code> payload until the final 3D distance recheck!
    </p>
  </div>
</div>

<script>
(function() {
  function initPgPageSim() {
    var container = document.getElementById('pg-page-sim');
    if (!container) return;

    var presets = {
      coord: {
        tupleSize: '69 Bytes',
        headerDetail: '23B HeapHdr + 8B z_index + 38B varlena',
        tuplesPage: '111 rows / page',
        fillDetail: '90 pages for 10,000 atoms (720 KB)',
        toastState: 'INLINE (1B Short Hdr)',
        toastColor: '#34d399',
        toastDetail: '0 pg_toast chunks • Zero decompression',
        latency: '0.48 ms vs 410 ms',
        speedup: '854x faster (Z-Order B-Tree + shared_buffers)',
        hdrWidth: '7%',
        freeWidth: '2%',
        tuplesWidth: '91%',
        tuplesLabel: '111 Inline ResidueCoord Tuples (Zero TOAST)',
        tuplesBg: 'linear-gradient(90deg, #0284c7, #10b981)',
        explanation: 'Storage Kernel Verdict: Because ResidueCoord is under 127 bytes, PostgreSQL uses a 1-byte short varlena header (va_header_1b) instead of a 4-byte aligned header, packing 111 atoms per 8KB page. Combined with the pass-by-value z_index BIGINT column, B-Tree index scans never even touch the varlena payload until the final 3D distance recheck!'
      },
      molecule: {
        tupleSize: '367 Bytes',
        headerDetail: '23B HeapHdr + 8B wl_hash + 336B Molecule',
        tuplesPage: '21 rows / page',
        fillDetail: '476 pages for 10,000 molecules (3.8 MB)',
        toastState: 'INLINE (4B varlena)',
        toastColor: '#38bdf8',
        toastDetail: 'Below 2,000B TOAST threshold • Inline RAM',
        latency: '0.67 ms vs 1,018 ms',
        speedup: '1,513.7x faster (WL Hash B-Tree + VF2 @>)',
        hdrWidth: '3%',
        freeWidth: '4%',
        tuplesWidth: '93%',
        tuplesLabel: '21 Normalized Molecule Graphs + 1024-bit ECFP4 / Page',
        tuplesBg: 'linear-gradient(90deg, #2563eb, #06b6d4)',
        explanation: 'Storage Kernel Verdict: By packing PgBioAtom (5B), PgBioBond (6B), and the 1024-bit Morgan fingerprint (16 × u64 = 128B) inside Molecule, the entire normalized graph stays well below PostgreSQL\'s 2,000B TOAST threshold. Exact canonical lookups hit the 8-byte wl_hash B-Tree in 0.673 ms!'
      },
      sparse_csr: {
        tupleSize: '2,450 B → 780 B (LZ4)',
        headerDetail: 'Compressed in-place from 2.45 KB via TOAST',
        tuplesPage: '10 rows / page',
        fillDetail: '3.1x inline LZ4/pglz compression ratio',
        toastState: 'INLINE COMPRESSED',
        toastColor: '#fbbf24',
        toastDetail: 'va_tcinfo set • 0 out-of-line pg_toast seeks',
        latency: '3.2 ms vs 1,850 ms',
        speedup: '578x faster (CSR traversal in ExprContext)',
        hdrWidth: '2%',
        freeWidth: '6%',
        tuplesWidth: '92%',
        tuplesLabel: '10 Inline LZ4-Compressed SparseAttentionMap CSR Tuples',
        tuplesBg: 'linear-gradient(90deg, #d97706, #0284c7)',
        explanation: 'Storage Kernel Verdict: When a SparseAttentionMap exceeds TOAST_TUPLE_THRESHOLD (2 KB), PostgreSQL\'s tuptoaster.c first compresses the CSR vector in-place using LZ4/pglz. Because the compressed size (~780B) drops below TOAST_TUPLE_TARGET, it remains inline on the main 8KB heap page without extra index seeks into pg_toast!'
      },
      dense_matrix: {
        tupleSize: '1,000,000 B (18B Ptr)',
        headerDetail: '18-byte varattrib_1b_e TOAST pointer on heap',
        tuplesPage: '1 row = 500 TOAST chunks',
        fillDetail: 'Spills to pg_toast table (125 extra 8KB pages/row!)',
        toastState: 'OUT-OF-LINE TOAST TRAP',
        toastColor: '#f87171',
        toastDetail: '~500 B-Tree chunk lookups per matrix read!',
        latency: '640 ms vs 8,900 ms',
        speedup: 'Severe TOAST reassembly bottleneck — use CSR instead!',
        hdrWidth: '4%',
        freeWidth: '16%',
        tuplesWidth: '80%',
        tuplesLabel: '18B TOAST Pointers → Spilling to 500 Out-of-Line Chunks in pg_toast!',
        tuplesBg: 'linear-gradient(90deg, #dc2626, #991b1b)',
        explanation: 'Storage Kernel Verdict (Anti-Pattern): Storing a dense 500 × 500 float matrix (~1 MB) forces PostgreSQL to slice the datum into ~500 separate 2KB chunks in the secondary pg_toast table. Every row evaluation must traverse the TOAST B-Tree index and reassemble 125 pages before your function even starts—which is why pg_bio uses SparseAttentionMap (CSR)!'
      }
    };

    var buttons = container.querySelectorAll('.pg-sim-preset-btn');
    var elTupleSize = document.getElementById('pg-sim-tuple-size');
    var elHeaderDetail = document.getElementById('pg-sim-header-detail');
    var elTuplesPage = document.getElementById('pg-sim-tuples-page');
    var elFillDetail = document.getElementById('pg-sim-fill-detail');
    var elToastState = document.getElementById('pg-sim-toast-state');
    var elToastDetail = document.getElementById('pg-sim-toast-detail');
    var elLatency = document.getElementById('pg-sim-latency');
    var elSpeedup = document.getElementById('pg-sim-speedup');
    var elBarHdr = document.getElementById('pg-bar-hdr');
    var elBarFree = document.getElementById('pg-bar-free');
    var elBarTuples = document.getElementById('pg-bar-tuples');
    var elExplanation = document.getElementById('pg-sim-explanation');

    function selectPreset(key) {
      var data = presets[key];
      if (!data) return;

      buttons.forEach(function(btn) {
        var isSelected = btn.getAttribute('data-preset') === key;
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        btn.style.background = isSelected ? '#0284c7' : '#0f172a';
        btn.style.borderColor = isSelected ? '#38bdf8' : '#334155';
        btn.style.color = isSelected ? '#ffffff' : '#cbd5e1';
      });

      elTupleSize.textContent = data.tupleSize;
      elHeaderDetail.textContent = data.headerDetail;
      elTuplesPage.textContent = data.tuplesPage;
      elFillDetail.textContent = data.fillDetail;
      elToastState.textContent = data.toastState;
      elToastState.style.color = data.toastColor;
      elToastDetail.textContent = data.toastDetail;
      elLatency.textContent = data.latency;
      elSpeedup.textContent = data.speedup;

      elBarHdr.style.width = data.hdrWidth;
      elBarFree.style.width = data.freeWidth;
      elBarTuples.style.width = data.tuplesWidth;
      elBarTuples.style.background = data.tuplesBg;
      elBarTuples.textContent = data.tuplesLabel;
      elExplanation.textContent = data.explanation;
    }

    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        selectPreset(btn.getAttribute('data-preset'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPgPageSim);
  } else {
    initPgPageSim();
  }
})();
</script>

---

## 6. Beyond Bioinformatics: How These Patterns Apply to Any Database Domain

While `pg_bio` uses these storage-engine mechanics to mine 2.34 million extremophile proteins and screen molecular graphs, the exact same **PostgreSQL C-Kernel + Rust (`pgrx`)** architecture solves high-throughput bottlenecks across industry:

| Database Engineering Pattern in `pg_bio` | Bioinformatics Implementation (`pg_bio`) | General Systems / Industry Equivalent |
| :--- | :--- | :--- |
| **Pass-by-Value 64-Bit Spatial Projection (`GENERATED ALWAYS AS ... STORED`)** | `z_order_encode(x, y, z)` maps 3D atomic coordinates (`ResidueCoord`) into a 1D B-Tree integer (`i64`) | **Geospatial Fleet Routing & Game Telemetry:** Bit-interleaving `(lat, lon, timestamp)` for sub-millisecond B-Tree bounding-box queries (see [`spiral`](/spiral-intro)) |
| **Write-Time Graph Canonicalization + 64-Bit Hash** | Hückel $4n+2$ cycle normalization + `molecule_wl_hash` (`0.67 ms` lookup across 10k molecules) | **Fintech Fraud & Entity Resolution:** Normalizing transaction subgraphs or JSON schemas at `INSERT` time for $O(\log N)$ exact isomorphism checks |
| **Compact Inline `varlena` CSR Matrices (`SparseAttentionMap`)** | Compressing $N \times N$ ESMFold / Hi-C contact matrices to avoid out-of-line TOAST thrashing | **E-Commerce & AdTech Co-Occurrence Graphs:** Storing sparse user-item interaction vectors inside 8KB heap pages without external graph DBs |
| **`#[pg_extern(immutable, parallel_safe)]` Zero-Copy Kernels** | Parallel Smith-Waterman alignment (`smith_waterman_score`) & Kabsch 3D superposition (`kabsch_rmsd`) | **High-Frequency Financial Tick Analytics:** Running custom SIMD rolling-window pricing or order-book replay across PostgreSQL parallel workers |

---

## What's Next in Part 2

Now that we know how custom Rust structs live inside PostgreSQL 8KB pages and how `#[pg_extern(immutable, parallel_safe)]` crosses the C FFI boundary safely, how do we teach the **PostgreSQL Cost-Based Query Planner** to orchestrate custom operators like `@>` (VF2 Subgraph Isomorphism & RangeFinder Pocket Containment), `%` (1024-bit hardware `POPCNT` Tanimoto similarity), and `<~>` (Hybrid Vector + Smith-Waterman distance)?

In the next installment, we will dive into `pgrx::extension_sql!`, operator classes, commutator/negator planner hints, and multi-stage index recheck pipelines.

{% include pg_bio_promo.md %}
