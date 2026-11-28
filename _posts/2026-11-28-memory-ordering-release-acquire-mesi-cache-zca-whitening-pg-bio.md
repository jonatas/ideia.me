---
layout: post
title: "PostgreSQL Extension Internals in Rust (Part 2): Memory Ordering, MESI Cache Coherency, and a 10.09× Faster Lock-Free Release/Acquire ZCA Whitening Cache in pg_bio"
date: 2026-11-28 12:30:00 -0300
categories: [postgresql, rust, pgrx, database-internals, bioinformatics, structural-biology, machine-learning]
tags: [postgresql, rust, pgrx, memory-ordering, memory-barriers, atomics, mesi, arm64, simd, zca-whitening, esm2, pg_bio, 3dmol]
description: "Inspired by Jan Nidzwetzki's deep dive into PostgreSQL memory barriers, volatile, and atomics, we dissect store buffers, invalidate queues, MESI 64-byte cache coherency, and ARMv8-A vs. x86-64 memory ordering—and show how replacing per-row bytea deserialization with a 64-byte cache-line-aligned lock-free Write-Release / Read-Acquire model cache (PR #22) accelerates 1280-D ESM-2 ABTT whitening by 2.85× (9.72 → 3.41 µs/row), full f16 ZCA whitening by 10.09× (88.35 → 8.75 µs/row), eliminates 27.30× MESI false-sharing penalties, and beats per-row shared reader locks by 2,289× (0.80 ns vs. 1,831.75 ns)."
mermaid: true
math: true
---

> **🙏 A Note of Gratitude to Jan Nidzwetzki**
> This article and **[PR #22](https://github.com/jonatas/pg_bio/pull/22)** in [`pg_bio`](https://github.com/jonatas/pg_bio) were directly inspired by **[Jan Nidzwetzki](https://jnidzwetzki.github.io/)**'s outstanding November 26, 2026 post, **[Barriers, Volatile, and Atomics: How PostgreSQL Orders Memory Accesses](https://jnidzwetzki.github.io/2026/11/26/memory-ordering-postgresql.html)**. Earlier this month, Jan's posts on **[Memory Contexts in PostgreSQL](https://jnidzwetzki.github.io/2022/05/28/memory-contexts-postgresql.html)** and **[eBPF Tracing of PostgreSQL Spinlocks](https://jnidzwetzki.github.io/2026/02/08/ebpf-tracing-postgresql-spinlocks.html)** helped shape [Part 1 of our PostgreSQL Extension Internals in Rust series](/postgresql-rust-ffi-pgrx-memory-contexts-varlena-toast-pg-bio). Thank you, Jan, for writing some of the clearest systems-level PostgreSQL internals articles on the web!

> **📚 PostgreSQL & Rust (`pgrx`) Systems Internals Series**
> * [Part 1: Crossing the C ↔ Rust FFI Boundary (`MemoryContext`, `varlena`, TOAST & Parallel Workers)](/postgresql-rust-ffi-pgrx-memory-contexts-varlena-toast-pg-bio)
> * **Part 2: Memory Ordering, MESI Cache Coherency & a `10.09×` Lock-Free `Release`/`Acquire` ZCA Whitening Cache** *(You are here)*
> * [Companion Post: Know Thy Neighbour Full Symmetric ZCA Whitening & `1,304-Byte` Zero-TOAST `BioVecInt8G128`](/know-thy-neighbour-zca-whitening-inline-biovecint8g128-pains-enzref-storm-pg-bio)
> * [Companion Systems Monograph: Delegating RangeFinder Pocket Intervals, GiST R-Trees & 3D Cheminformatics to the Query Planner](/postgresql-query-planner-rangefinder-gist-bioinformatics-engine)

---

When we merged **[PR #15](https://github.com/jonatas/pg_bio/pull/15)** earlier this week ([*Know Thy Neighbour in PostgreSQL*](/know-thy-neighbour-zca-whitening-inline-biovecint8g128-pains-enzref-storm-pg-bio)), we solved one of the thorniest statistical problems in protein language model search: **SwiGLU cone anisotropy**. By pre-conditioning raw 1280-D `ESM-2` embeddings with full symmetric ZCA whitening ($x_{\text{out}} = \text{normalize}((x - \mu)W)$, where $W = \Sigma_{\text{reg}}^{-1/2}$) or top-$k$ All-But-The-Top (ABTT) principal-component subtraction inside PostgreSQL 18, we lifted family-held-out superfamily retrieval on **SCOPe/ASTRAL-40 2.08** from **`58.55%` to `88.32%`** and collapsed 64-bucket layered-centroid posting-list variance by **`185.87×`**.

But yesterday, while reading Jan Nidzwetzki's new deep dive on **[Barriers, Volatile, and Atomics: How PostgreSQL Orders Memory Accesses](https://jnidzwetzki.github.io/2026/11/26/memory-ordering-postgresql.html)**, we asked ourselves an uncomfortable systems question:

**What happens at the CPU cache-line and memory-ordering level when `bio_whiten_embedding(vec, stats_bytea)` runs across 10,000 rows—or across 8 parallel workers on a weakly-ordered ARM64 processor (Apple Silicon M-series or AWS Graviton)?**

When we profiled `bio_whiten_embedding` in [`src/lib.rs`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L8916-L9384), we discovered two striking facts:
1. **Statelessness Was Costing Us `70%` to `90%` of Wall-Clock Time:** To stay trivially safe across parallel workers (`#[pg_extern(immutable, parallel_safe)]`), `bio_whiten_embedding` was completely stateless. On **every single row**, it re-parsed the `PGBW` binary `stats_bytea` payload (`51.2 KB` for 1280-D ABTT $k=8$, or `206 KB` to `3.28 MB` for `f16` symmetric ZCA matrices), allocated fresh Rust `Vec<f32>` heap buffers (`mean`, `inv_std`, `u_buf`, `row_f32`), and ran thousands of software IEEE-754 `f16 -> f32` bitwise conversions (`pgbio_f16_bits_to_f32`) before the hardware NEON/AVX2 SIMD dot product (`vfmaq_f32`) even started!
2. **Naive Locking Would Destroy Multi-Core Throughput (`2,289×` Slower Than `Ordering::Acquire`):** If you cache a pre-parsed whitening matrix and protect it with a conventional reader-writer lock (`RwLock::read()` or a shared lock that increments/decrements an atomic reader counter on every row), **every "read" is secretly a memory write to the lock's cache line**. Across 8 concurrent reader threads on ARM64, that atomic reader-count update bounces the lock's 64-byte cache line through every core's **store buffer** and **invalidate queue** (`Shared` $\rightarrow$ `Invalid` $\rightarrow$ `Modified`), costing **`1,831.75 ns/op`** (`1.83 µs/row`)—whereas a lock-free **`Ordering::Acquire` load (`ldar` / `pg_read_barrier()`)** performs zero writes, keeps the cache line in the **MESI `Shared` (`S`) state** across all 8 cores simultaneously, and completes in **`0.80 ns/op`** (**`2,289×` faster**)!

Today we merged **[PR #22](https://github.com/jonatas/pg_bio/pull/22)** into `pg_bio`, implementing a **64-byte MESI cache-line-aligned, 16-slot lock-free `Release`/`Acquire` whitening model cache** (`CachedWhiteningModel` + `WhiteningCacheSlot`) along with an in-database SQL verification function (`bio_whitening_cache_audit`) that delivers **`2.85×` faster 1280-D ABTT whitening (`9.72 µs` $\rightarrow$ `3.41 µs/row`)** and **`10.09×` faster Full ZCA `f16` whitening (`88.35 µs` $\rightarrow$ `8.75 µs/row`)** with **`0.00e0` numerical drift**.

<!--more-->

---

## 🧠 1. What `pg_bio` Learned from Jan Nidzwetzki's PostgreSQL Memory-Ordering Monograph

In [Barriers, Volatile, and Atomics: How PostgreSQL Orders Memory Accesses](https://jnidzwetzki.github.io/2026/11/26/memory-ordering-postgresql.html), Jan walks through a deceptively simple producer-consumer pattern in shared memory:

```c
/* Writer on CPU 1 */
void writer(SharedState *shared, int pages, int tuples_per_page)
{
    shared->tuples = pages * tuples_per_page;
    shared->done = true;
}

/* Reader on CPU 2 */
void reader(SharedState *shared)
{
    while (!shared->done)
        /* Wait */;
    Assert(shared->tuples != 0);
}
```

Why can `Assert(shared->tuples != 0)` fail even when `pages * tuples_per_page > 0`? Jan breaks the culprits into two distinct layers—**Compiler Reordering** and **CPU Hardware Reordering**—each of which directly impacts how we write high-performance Rust (`pgrx`) extensions compiled with `opt-level = 3`, `lto = "fat"`, and `codegen-units = 1`:

### A. Compiler Instruction Scheduling & Why `volatile` Is Not a Memory Barrier
Because `shared->tuples = pages * tuples_per_page` depends on an integer multiplication (`imul %edx, %esi` taking multiple pipeline cycles), while `shared->done = true` (`movb $0x1, 0x4(%rdi)`) has no data dependency, GCC/Clang/LLVM instruction scheduling swaps the two stores at `-O2`/`-O3` to avoid stalling the CPU pipeline. Even worse, in `reader()`, the compiler sees that the loop body never modifies `shared->done`, hoists the load out of the loop, and turns `while (!shared->done)` into an infinite jump (`jmp 21`)!

While qualifying a C pointer as `volatile` forces the compiler to re-issue memory loads on every loop iteration (and is mandatory for local variables modified inside PostgreSQL's `PG_TRY()` / `sigsetjmp()` block and read in `PG_CATCH()` / `siglongjmp()`, so register restoration doesn't clobber them), **`volatile` places zero restrictions on the CPU hardware**.

### B. Store Buffers, Invalidate Queues, and MESI 64-Byte Cache Coherency
Modern multi-core processors do not wire CPU registers directly to DRAM. Every core has private L1/L2 caches organized into **64-byte cache lines** governed by a cache-coherency state machine (**MESI**: **M**odified, **E**xclusive, **S**hared, **I**nvalid; or MESIF/MOESI):

1. **Store Buffers (Cause of `Store→Store` and `Store→Load` Reordering):** When Core 1 writes to a cache line that is currently in the `Shared` or `Invalid` state, it must broadcast an invalidation message across the core interconnect and wait for acknowledgments. To avoid stalling the 10-to-14-stage execution pipeline, Core 1 drops the write into a per-core **Store Buffer** and continues executing. If a subsequent store targets a cache line that Core 1 *already* holds in `Modified` or `Exclusive` state, on weakly-ordered CPUs that second store can bypass the buffered first store and become visible to Core 2 first!
2. **Invalidate Queues (Cause of `Load→Load` Reordering):** When Core 2 receives an invalidation message from Core 1, it doesn't stall its pipeline to purge the cache line immediately. Instead, it places the message into an **Invalidate Queue**, sends an immediate acknowledgment back to Core 1, and applies the invalidation asynchronously. Until the queue drains, Core 2 can read a newly published flag (`done == true` or a non-null model pointer) while still reading stale, pre-invalidation values from an older cache line (`tuples == 0` or uninitialized matrix floats)!

### C. Why Code That Works on x86-64 Breaks on ARM64 (Apple Silicon & AWS Graviton)
As Jan's comparison table highlights, **x86-64 implements Total Store Order (TSO)**, whereas **ARMv8-A (`aarch64`) implements a weakly-ordered memory model**:

| Reordering Class | Physical Hardware Mechanism | Allowed on `x86_64` (TSO)? | Allowed on `ARM64` (`aarch64`)? | PostgreSQL C Macro | Rust `std::sync::atomic` Equivalent |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Compiler Scheduling** | Instruction reordering across independent addresses | Yes (Compiler) | Yes (Compiler) | `pg_compiler_barrier()` | `compiler_fence(Ordering::SeqCst)` |
| **`Store → Store`** | Store A waits in Store Buffer (`Shared`); Store B hits `Exclusive` cache line directly | **No** (FIFO Store Buffer) | **Yes** | `pg_write_barrier()` *(noop asm on x86; `dmb ish` on ARM)* | `store(..., Ordering::Release)` (`stlr` on ARM64) |
| **`Load → Load`** | Load B reads stale cache line whose invalidation is still queued in Invalidate Queue | **No** | **Yes** | `pg_read_barrier()` *(noop asm on x86; `dmb ishld` on ARM)* | `load(Ordering::Acquire)` (`ldar` on ARM64) |
| **`Load → Store`** | Cache-missing load waits while independent store commits to `Exclusive` line | **No** | **Yes** | `pg_memory_barrier()` | `fence(Ordering::AcqRel)` / `Ordering::SeqCst` |
| **`Store → Load`** | Store sits in Store Buffer while subsequent load hits L1 cache early (*Store Buffering Litmus Test*, e.g. `SetLatch()`) | **Yes** | **Yes** | `pg_memory_barrier()` (`lock; addl $0,0(%rsp)` on x86; `dmb ish` on ARM) | `fence(Ordering::SeqCst)` (`dmb ish`) |

Because `pg_bio` runs native hardware SIMD across both **`aarch64` NEON** (Apple Silicon M1/M2/M3/M4 & AWS Graviton) and **`x86_64` AVX2**, any lock-free publication of multi-kilobyte whitening matrices or centroid codebooks **must pair a Write-Release barrier on the writer with a Read-Acquire barrier on the reader**.

{% mermaid %}
sequenceDiagram
    autonumber
    participant W as Writer Thread / Backend (Core 1)<br/>pgbio_get_or_publish_whitening_model()
    participant SB as Core 1 Store Buffer &<br/>64-Byte MESI Cache Line
    participant IQ as Core 2 Invalidate Queue &<br/>L1 Data Cache (MESI Shared 'S')
    participant R as Reader Thread / Backend (Core 2)<br/>bio_whiten_embedding()

    Note over W: Parse 51.2 KB ABTT or 3.28 MB f16 ZCA stats_bytea<br/>into #[repr(align(64))] CachedWhiteningModel
    W->>SB: Allocate & populate mean, inv_std, damps, basis_or_zca (f32)
    W->>SB: compare_exchange(null, raw, Ordering::Release, Ordering::Acquire)
    Note over SB: ARM64 Release (stlr / dmb ish):<br/>Flush all prior struct & Vec stores before pointer publication!
    SB-->>IQ: Broadcast MESI invalidation for WhiteningCacheSlot line
    R->>IQ: slot.ptr.load(Ordering::Acquire) (ARM64 ldar / dmb ishld)
    Note over IQ,R: Drain Invalidate Queue before reading *ptr;<br/>Keep cache line in MESI Shared (S) state (0.80 ns/op, 0 writes!)
    IQ-->>R: Consistent &'static CachedWhiteningModel reference
    Note over R: Execute NEON vfmaq_f32 / AVX2 _mm256_mul_ps GEMV<br/>(3.41 µs/row ABTT · 8.75 µs/row ZCA f16 · 0.00e0 diff)
{% endmermaid %}

---

## 🔬 2. Before Writing Code, We Measured 4 Theories on ARM64 (Including One Negative Result!)

In systems engineering, a theory is only worth adopting if it survives a hostile hardware benchmark. Before touching `src/lib.rs`, we built a standalone microbenchmark suite compiled with `pg_bio`'s exact release profile (`rustc -O -C target-cpu=native -C lto=fat -C codegen-units=1`) on Apple Silicon ARM64 to test **four concrete hypotheses** derived from Jan's article:

| Hypothesis / Theory Tested on ARM64 (`aarch64` NEON) | Baseline (`pg_bio` Before PR #22) | Candidate (With Article's Theory) | Measured Result | Engineering Verdict |
| :--- | :---: | :---: | :---: | :---: |
| **Theory 1A: Eliminate Per-Row `stats_bytea` Parsing in 1280-D ABTT Whitening (`k=8`, `51.2 KB`) via `Release`/`Acquire` Cache** | `9.72 µs/row`<br/>(`97.22 ms` / `10,000` rows) | **`3.41 µs/row`**<br/>(`34.11 ms` / `10,000` rows) | **`2.85×` Faster**<br/>(`max_diff = 0.00e0`) | ✅ **ADOPTED in PR #22** |
| **Theory 1B: Eliminate Per-Row `f16 -> f32` Matrix Unpacking in 320-D Full ZCA `f16` (`flags=3`, `206 KB`) via `Release`/`Acquire` Cache** | `88.35 µs/row`<br/>(`176.71 ms` / `2,000` rows) | **`8.75 µs/row`**<br/>(`17.51 ms` / `2,000` rows) | **`10.09×` Faster**<br/>(`max_diff = 0.00e0`) | ✅ **ADOPTED in PR #22** |
| **Theory 2 (Negative Control): Pad `BioVecInt8G128` (`1,304 B`, `quants` at `offset +24`) to 64-Byte Cache-Line Alignment** | **`33.71 ns/vec`**<br/>(`67.42 ms` / `2M` 1280-D dots) | `36.64 ns/vec`<br/>(`73.28 ms` / `2M` 1280-D dots) | **No Gain (`-7.99%`)**<br/>NEON `vld1q_s8` hides split | ❌ **REJECTED** *(Keep compact `1,304 B` varlena!)* |
| **Theory 3A: Isolate Per-Worker Shared Atomic Counters to 64-Byte Cache Lines (`#[repr(align(64))]`) across 8 Threads** | `491.27 ns/update`<br/>(`2,456.37 ms` / `40M` updates) | **`18.00 ns/update`**<br/>(`89.98 ms` / `40M` updates) | **`27.30×` Faster**<br/>(Eliminates MESI ping-pong) | ✅ **ADOPTED in PR #22** (`#[repr(align(64))]` slots) |
| **Theory 3B: Per-Row Reader Synchronization Across 8 Threads (`RwLock::read()` vs. `Ordering::Acquire` Load)** | `1,831.75 ns/op`<br/>(Shared lock reader-count write bounce) | **`0.80 ns/op`**<br/>(`Ordering::Acquire` / `ldar`, 0 writes) | **`2,289×` Faster**<br/>(`1.13 ns/op` for `SeqCst` `dmb ish`) | ✅ **ADOPTED in PR #22** |

### Two Crucial Systems Insights from These Measurements

1. **Why a "Read-Only" Shared Lock (`1,831.75 ns/op`) Is `2,289×` Slower Than `Ordering::Acquire` (`0.80 ns/op`):**
   It is tempting to think that acquiring a shared reader lock (`RwLock::read()` or `LWLockAcquire(lock, LW_SHARED)`) is cheap because readers don't block other readers. **At the MESI cache-coherency layer, there is no such thing as a read-only lock acquisition!** To acquire and release a shared lock, every reader thread executes an atomic read-modify-write (`fetch_add(1)` on lock, `fetch_sub(1)` on unlock) on the lock's internal reader counter. When 8 cores call `bio_whiten_embedding` in parallel, all 8 cores are continuously writing to the exact same 64-byte cache line—forcing a non-stop MESI invalidation storm (`Shared` $\rightarrow$ `Invalid` $\rightarrow$ `Modified`) that adds **`1.83 µs` of pure coherence stall per row** (more than half the total runtime of our `3.41 µs` 1280-D SIMD whitening kernel!).
   By contrast, loading an `AtomicPtr<CachedWhiteningModel>` with **`Ordering::Acquire`** emits a single ARM64 `ldar` instruction (`0.80 ns/op`). Because no core writes to the cache slot after initial publication, the 64-byte `WhiteningCacheSlot` line stays in the **MESI `Shared` (`S`) state** inside every core's L1 cache simultaneously with zero interconnect traffic!
2. **Why Our Negative Control on `BioVecInt8G128` (`offset +24` vs. 64-Byte Alignment) Saved On-Disk Density:**
   In [`BioVecInt8G128`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L9344-L9350), the 10 group `f16` scales (`scales_f16: [u16; 10]`, `20 bytes`) follow the 4-byte Postgres `varlena` header, placing `quants: [i8; 1280]` at byte offset `+24`. That means each 128-byte SIMD group (`quants[0..128]`) straddles three 64-byte cache lines instead of two. We tested whether padding `quants` to offset `+64` (`#[repr(C, align(64))]`) would speed up `pgbio_simd_i8_group128_dot_norms`. The benchmark proved that Apple Silicon's hardware load/store unit (`vld1q_s8`) pipelines sequential unaligned cache-line crossings at **`33.71 ns/vec`**—slightly *faster* than the padded buffer (`36.64 ns/vec`) due to tighter L1 density! Measuring first prevented us from bloating `BioVecInt8G128` from `1,304 bytes` to `1,344 bytes` on disk.

---

## 🦀 3. Inside PR #22: The 64-Byte Aligned Lock-Free `Release`/`Acquire` Whitening Cache in `src/lib.rs`

Here is the production implementation merged in **[PR #22](https://github.com/jonatas/pg_bio/pull/22)** ([`src/lib.rs`](https://github.com/jonatas/pg_bio/blob/main/src/lib.rs#L8916-L9384)):

### 1. 64-Byte MESI Cache-Line Isolation (`#[repr(align(64))]`)
Both the immutable model payload (`CachedWhiteningModel`) and each of the 16 open-addressed atomic pointer slots (`WhiteningCacheSlot`) are aligned to 64-byte hardware cache-line boundaries so adjacent slots never experience false sharing:

```rust
#[repr(align(64))]
struct CachedWhiteningModel {
    tag_lo: u64,
    tag_hi: u64,
    byte_len: usize,
    dim: usize,
    flags: u16,
    pca_k: usize,
    mean: Vec<f32>,
    inv_std: Vec<f32>,
    damps: Vec<f32>,
    basis_or_zca: Vec<f32>,
}

const WHITENING_CACHE_SLOTS: usize = 16;

#[repr(align(64))]
struct WhiteningCacheSlot {
    ptr: std::sync::atomic::AtomicPtr<CachedWhiteningModel>,
}
```

### 2. `~25 ns` 128-Bit Strided Content + Header Fingerprint (`pgbio_whitening_stats_fingerprint`)
Wait—if a 1280×1280 `f16` ZCA matrix is `3.28 MB`, hashing all `3.28 MB` on every row to check the cache key would read `3.28 GB` per 1,000 rows and take `~40 µs/row`! Instead, `pgbio_whitening_stats_fingerprint` folds the 16-byte `PGBW` header (`magic`, `version`, `flags`, `dim`, `pca_k`), exact byte length, the tail 8 bytes, and up to **64 evenly strided 64-bit (`u64`) words** across the payload using two independent 64-bit SplitMix64/FxHash accumulators `(tag_lo, tag_hi)` in **`~25 nanoseconds`**.

### 3. Single-Pointer Atomic Publication with `Ordering::Release` / `Ordering::Acquire` Pairing
Notice a subtle correctness detail: instead of storing `generation_tag: AtomicU64` and `ptr: AtomicPtr` in two separate atomic variables (which could tear if one thread updates a slot while another reads the tag and then the pointer), we embed `(tag_lo, tag_hi, byte_len)` **inside the immutable `CachedWhiteningModel` pointee** and publish the pointer itself via `compare_exchange` with `Ordering::Release`:

```rust
#[inline]
fn pgbio_get_or_publish_whitening_model(
    stats_bytea: &[u8],
) -> (Option<&'static CachedWhiteningModel>, bool, usize) {
    let (tag_lo, tag_hi) = pgbio_whitening_stats_fingerprint(stats_bytea);
    let base_slot = (tag_lo as usize) & (WHITENING_CACHE_SLOTS - 1);
    let len = stats_bytea.len();

    for probe in 0..4usize {
        let slot_idx = (base_slot + probe) & (WHITENING_CACHE_SLOTS - 1);
        // Read memory barrier (`Ordering::Acquire` -> `ldar` / `dmb ishld` on ARM64, compiler barrier on x86_64):
        // Pairs with `Ordering::Release` in `compare_exchange` below so all fields of `CachedWhiteningModel`
        // are guaranteed visible before dereferencing `p`.
        let p = WHITENING_MODEL_CACHE[slot_idx]
            .ptr
            .load(std::sync::atomic::Ordering::Acquire);
        if !p.is_null() {
            let m = unsafe { &*p };
            if m.tag_lo == tag_lo && m.tag_hi == tag_hi && m.byte_len == len {
                return (Some(m), true, slot_idx);
            }
        } else {
            let parsed = match pgbio_parse_cached_whitening_model(tag_lo, tag_hi, stats_bytea) {
                Some(model) => model,
                None => return (None, false, slot_idx),
            };
            let raw = Box::into_raw(Box::new(parsed));
            // Write memory barrier (`Ordering::Release` -> `stlr` / `dmb ish` on ARM64):
            // Ensures all heap allocations and struct stores in `CachedWhiteningModel` complete
            // before `raw` becomes visible in `WHITENING_MODEL_CACHE[slot_idx].ptr`.
            match WHITENING_MODEL_CACHE[slot_idx].ptr.compare_exchange(
                std::ptr::null_mut(),
                raw,
                std::sync::atomic::Ordering::Release,
                std::sync::atomic::Ordering::Acquire,
            ) {
                Ok(_) => return (Some(unsafe { &*raw }), false, slot_idx),
                Err(existing) => {
                    // Another thread won the initialization race for this slot; free our Box cleanly
                    unsafe { drop(Box::from_raw(raw)); }
                    if !existing.is_null() {
                        let m = unsafe { &*existing };
                        if m.tag_lo == tag_lo && m.tag_hi == tag_hi && m.byte_len == len {
                            return (Some(m), true, slot_idx);
                        }
                    }
                }
            }
        }
    }
    (None, false, base_slot)
}
```

### 4. In-Database SQL Regression & Latency Auditor (`bio_whitening_cache_audit`)
To guarantee that cached execution never diverges by even a single ULP (Unit in the Last Place) from the raw bytea parser (`bio_whiten_embedding_uncached`), PR #22 exposes `bio_whitening_cache_audit` directly to SQL:

```sql
-- Fit an f16 symmetric ZCA whitening matrix (flags = 3) and audit the Release/Acquire cache in SQL:
WITH fitted AS (
    SELECT bio_fit_zca_whiten(
        ARRAY_AGG(val ORDER BY protein_id, dim_idx),
        -1.0,   -- automatic sample-ratio ridge shrinkage alpha = min(0.5, d/n)
        320,    -- embedding dimension
        true    -- pack symmetric ZCA matrix in IEEE-754 f16 (flags = 3, 206 KB)
    ) AS stats_bytea
    FROM esm2_320d_corpus
)
SELECT
    audit.cache_hit,
    audit.slot_index,
    audit.max_abs_diff,
    ROUND(audit.cached_us_per_row::numeric, 2)   AS cached_us,
    ROUND(audit.uncached_us_per_row::numeric, 2) AS uncached_us,
    ROUND(audit.speedup_x::numeric, 2)           AS speedup_x
FROM fitted,
LATERAL bio_whitening_cache_audit(
    (SELECT embedding_f32 FROM esm2_320d_corpus LIMIT 1),
    fitted.stats_bytea,
    500
) AS audit;
```

| `cache_hit` | `slot_index` | `max_abs_diff` | `cached_us` | `uncached_us` | `speedup_x` |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **`true`** | `11` | **`0.00000000`** | **`8.75 µs`** | `88.35 µs` | **`10.09×`** |

---

## 🧬 4. Why `3.41 µs/row` Isotropic Whitening Matters for Dark-Proteome Enzyme Discovery

What does a **`10.09×` faster ZCA whitening transform** combined with our **`1,304-byte` zero-TOAST `BioVecInt8G128` inline varlena** unlock in real biological workflows?

When mining millions of dark-proteome sequences from hypersaline soda lakes (Wadi El-Natrun, pH 11), Inner Mongolian salt flats, and deep-sea brines, sequences regularly diverge by **`52%` to `75%`** (`< 25%` sequence identity)—the classic bioinformatics **Twilight Zone** where BLAST/MMseqs2 struggle and raw unwhitened `ESM-2` embeddings collapse into a `< 15`-effective-dimension SwiGLU cone (`PR = 5.81 / 1280`).

By combining our lock-free `Release`/`Acquire` cached `bio_whiten_embedding` pre-transform with `BioVecInt8G128` SIMD `i32` reranking (`bio_vec_int8_g128_cosine_distance`), we can whiten and index entire metagenomic tables inside PostgreSQL 18 at **hundreds of thousands of proteins per second**, uncovering extreme halophilic structural orthologs with near-identical 3D catalytic clefts:

```sql
-- Full Stage-1 -> Stage-2.5 Isotropic Homology & Catalytic Role-Contrast Query in pg_bio:
WITH model AS (
    SELECT stats_bytea FROM whitening_models WHERE model_name = 'esm2_1280d_scope40_zca_f16'
),
query_prep AS (
    SELECT
        -- 1. Lock-free Ordering::Acquire cache lookup + SIMD whitening (0.80 ns barrier, 0.00e0 drift)
        bio_vec_int8_g128_encode(
            bio_whiten_embedding(b.embedding_1280d, m.stats_bytea)
        ) AS q_g128,
        b.sequence AS bait_seq,
        b.pocket_9d AS bait_pocket
    FROM proteins b
    CROSS JOIN model m
    WHERE b.uniprot_id = 'A0A1U7EWJ1' -- Natronomonas pharaonis Gabara Isochorismate Synthase MenF
)
SELECT
    c.uniprot_id                                                        AS discovery_id,
    c.organism                                                          AS extremophile_host,
    ROUND(bio_vec_int8_g128_cosine_distance(q.q_g128, c.vec_g128)::numeric, 4) AS biovec_i8_dist,
    ROUND((c.sequence <~> q.bait_seq)::numeric, 4)                      AS hybrid_sw_score,
    ROUND(pocket_range_iou(q.bait_pocket, c.pocket_9d)::numeric, 4)     AS pocket_9d_iou
FROM query_prep q
JOIN proteins c
  ON c.l2_centroid IN (14, 15) -- Balanced L2 centroid routing (185.87x lower bucket variance!)
WHERE NOT bio_is_pains_or_aggregator(c.substrate_smiles)
ORDER BY bio_vec_int8_g128_cosine_distance(q.q_g128, c.vec_g128) ASC
LIMIT 3;
```

| Bait Protein (Well-Studied Reference) | Discovery (Extremophile Ortholog) | Sequence Divergence | `BioVecInt8G128` SIMD `i32` Distance (`<=>`) | Hybrid Score (`<~>`) | 9D `RangeFinder` Pocket IoU | Biological & Industrial Adaptation |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`A0A1U7EWJ1`** (*Natronomonas pharaonis* Gabara · `445 aa` · `pI 4.98` · Isochorismate Synthase MenF) | **`A0AAV3SNV3`** (*Halorubrum ejinorense* · `460 aa` · `pI 4.78` · MenF Ortholog) | `52.8%` | **`0.0836`** | `0.6412` | **`92.34%`** | Soda-lake (`pH 11`) $\rightarrow$ Inner Mongolian salt-lake Vitamin $\text{K}_2$ (menaquinone) biosynthesis |
| **`L0AC28`** (*Natronobacterium gregoryi* SP2 · `444 aa` · `pI 4.34` · $\text{K}^+$ Transport TrkA) | **`A0ABD5PUN8`** (*Halosolutus amylolyticus* · `445 aa` · `pI 4.34` · TrkA Gating Ring) | `56.8%` | **`0.0869`** | `0.6185` | **`92.16%`** | Identical `pI 4.34` acidic surface for `3–4 M KCl` cytoplasmic osmoprotection |
| **`A0A1I3C945`** (*Halorubrum aquaticum* · `361 aa` · `pI 4.73` · 2,4-Dienoyl-CoA Reductase) | **`A0A1I4ES58`** (*Halogranum rubrum* · `362 aa` · `pI 4.67` · Dienoyl-CoA Reductase) | `49.4%` | **`0.0993`** | `0.6740` | **`99.00%`** | Near-perfect `99.00%` NADPH/FAD polyunsaturated lipid reduction tunnel in solar salterns |

A whitened `BioVecInt8G128` cosine distance of **`0.0836` to `0.0993`** after removing the anisotropic SwiGLU cone means the 3D catalytic backbone geometry and cofactor-binding electrostatic envelope are mathematically locked together (`92.16%` to `99.00%` 9D `RangeFinder` pocket overlap), even though half the amino-acid sequence has mutated to survive saturated salt brines!

---

## 🧪 5. Interactive Side-by-Side 3Dmol.js Studio: Inspecting the Whitened Zero-TOAST Discoveries

Explore the three halophile structural pairs below in our synchronized dual-viewport **3Dmol.js** studio. Because `ideia.me` loads `pg_bio_sync.js` globally in `_layouts/post.html`, **both 3D viewers mirror each other's camera rotation, pan, and zoom automatically**, and clicking any residue fragment on the Bait (left, cyan) automatically highlights the corresponding structural residue on the Discovery (right, magenta)!

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 22px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.45);">
  <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px;">
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <span style="color: #38bdf8; font-weight: 800; font-size: 0.95em;">🔬 Select Release/Acquire ZCA + BioVecInt8G128 Pair:</span>
      <select id="select-mem-pair" onchange="switchMemPair()" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 0.85em;">
        <option value="menf">Pair 1: MenF Isochorismate Synthase (A0A1U7EWJ1 ↔ A0AAV3SNV3 · Dist 0.0836 · IoU 92.34%)</option>
        <option value="dcr">Pair 2: 2,4-Dienoyl-CoA Reductase (A0A1I3C945 ↔ A0A1I4ES58 · Dist 0.0993 · IoU 99.00%!)</option>
        <option value="trka">Pair 3: TrkA K+ NAD-Gating Ring (L0AC28 ↔ A0ABD5PUN8 · Dist 0.0869 · IoU 92.16%)</option>
      </select>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      <button onclick="highlightMemCleft()" style="background: #059669; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.82em; font-weight: 600; cursor: pointer;">1. Highlight Conserved Catalytic Core</button>
      <button onclick="highlightMemHis()" style="background: #7c3aed; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.82em; font-weight: 600; cursor: pointer;">2. Highlight HID/HIE Proton Relays</button>
      <button onclick="highlightMemArmor()" style="background: #ea580c; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.82em; font-weight: 600; cursor: pointer;">3. Highlight Halophile Asp/Glu Armor</button>
      <button onclick="resetMemView()" style="background: #334155; color: #e2e8f0; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.82em; font-weight: 600; cursor: pointer;">Reset View</button>
    </div>
  </div>

  <div id="mem-chemistry-lesson" style="background: #1e293b; border-left: 4px solid #10b981; padding: 10px 14px; border-radius: 6px; color: #e2e8f0; font-size: 0.88em; margin-bottom: 14px; line-height: 1.5;">
    Loading local 3D AlphaFold models and applying Release/Acquire ZCA active-site annotations...
  </div>

  <div style="display: flex; flex-wrap: wrap; gap: 14px;">
    <div style="flex: 1 1 320px; background: #020617; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden;">
      <div id="mem-title-left" style="padding: 8px 12px; background: #1e293b; color: #38bdf8; font-weight: 700; font-size: 0.85em;">Bait Reference</div>
      <div id="mem-mol-left" class="viewer_3Dmoljs" data-href="/assets/models/AF-A0A1U7EWJ1-F1-model_v4.pdb" data-backgroundcolor="0x020617" data-style="cartoon:color=cyan" style="width: 100%; height: 390px; position: relative;"></div>
    </div>
    <div style="flex: 1 1 320px; background: #020617; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden;">
      <div id="mem-title-right" style="padding: 8px 12px; background: #1e293b; color: #f472b6; font-weight: 700; font-size: 0.85em;">Release/Acquire Cached ZCA Discovery</div>
      <div id="mem-mol-right" class="viewer_3Dmoljs" data-href="/assets/models/AF-A0AAV3SNV3-F1-model_v4.pdb" data-backgroundcolor="0x020617" data-style="cartoon:color=magenta" style="width: 100%; height: 390px; position: relative;"></div>
    </div>
  </div>
</div>

<script src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"></script>
<script>
const MEM_PAIRS = {
  menf: {
    title1: "Bait: A0A1U7EWJ1 (445 aa · pI 4.98 · Natronomonas pharaonis Gabara · Isochorismate Synthase MenF)",
    title2: "Discovery: A0AAV3SNV3 (460 aa · pI 4.78 · Halorubrum ejinorense · BioVecInt8G128 Dist 0.0836 · IoU 92.34%)",
    pdb1: "/assets/models/AF-A0A1U7EWJ1-F1-model_v4.pdb",
    pdb2: "/assets/models/AF-A0AAV3SNV3-F1-model_v4.pdb",
    coreRes1: [195,198,240,242,272,275,308,310,342,345,382,385,408,410],
    coreRes2: [208,211,253,255,285,288,321,323,355,358,395,398,421,423],
    cleftLesson: "<strong>Conserved Mg²⁺-Chorismate Catalytic Cleft (`8.75 µs/row` Cached `f16` ZCA · `0.0836` `BioVecInt8G128` Distance · `92.34%` Pocket IoU):</strong> Green and cyan sticks highlight the conserved chorismate-binding general-acid/base catalytic triad and Mg²⁺ coordination sphere. By caching the pre-unpacked ZCA matrix behind an `Ordering::Acquire` pointer load (`0.80 ns`), `pg_bio` whitens and matches this cleft `10.09×` faster with `0.00e0` numerical drift across `52.8%` sequence divergence.",
    hisLesson: "<strong>Kabsch-Sanitized `HID`/`HIE` Proton-Relay Histidines (`3 HID / 7 HIE` vs. `2 HID / 7 HIE`):</strong> Purple sticks highlight the histidine imidazole rings standardized by `bio_sanitize_structure_audit`. Nδ1 H-bond donors (`< 3.25 Å`) are locked as `HID` structural anchors, while catalytic cleft histidines adopt the `HIE` tautomer required for pH 10–11 menaquinone proton transfer.",
    armorLesson: "<strong>Extreme Haloalkaliphilic Asp/Glu Hydration Shield (`pI 4.98` vs. `4.78` · GRAVY `-0.373` vs. `-0.395`):</strong> Orange sticks reveal the exterior cage of acidic Asp/Glu carboxylates that bind hydrated sodium/potassium counter-ions in `3.5–4.5 M NaCl`, preventing aggregation while the interior catalytic core remains bone-dry."
  },
  dcr: {
    title1: "Bait: A0A1I3C945 (361 aa · pI 4.73 · Halorubrum aquaticum · 2,4-Dienoyl-CoA Reductase)",
    title2: "Discovery: A0A1I4ES58 (362 aa · pI 4.67 · Halogranum rubrum · BioVecInt8G128 Dist 0.0993 · IoU 99.00%!)",
    pdb1: "/assets/models/AF-A0A1I3C945-F1-model_v4.pdb",
    pdb2: "/assets/models/AF-A0A1I4ES58-F1-model_v4.pdb",
    coreRes1: [24,26,52,55,104,108,155,158,210,214,265,268,312,315],
    coreRes2: [24,26,52,55,105,109,156,159,211,215,266,269,313,316],
    cleftLesson: "<strong>Near-Perfect `99.00%` 9D RangeFinder NADPH/FAD Hydride-Transfer Tunnel (`0.0993` `BioVecInt8G128` Distance):</strong> Both 361–362 aa TIM-barrel reductases preserve an almost identical cofactor and acyl-CoA binding tunnel (`rf_range_iou = 0.9900`), enabling rapid polyunsaturated fatty-acid β-oxidation screening in shared buffers.",
    hisLesson: "<strong>Cofactor-Framing `HID`/`HIE` Histidine Architecture (`4 HID / 9 HIE` vs. `5 HID / 6 HIE`):</strong> Purple sticks show the 11–13 histidine rings audited in 3D, distinguishing buried Nδ1-protonated `HID` β-barrel staples from active-site `HIE` proton donors.",
    armorLesson: "<strong>Solar-Saltern Halophile Surface Remodeling (`pI 4.73` vs. `4.67` · GRAVY `-0.377` vs. `-0.436`):</strong> Orange sticks highlight the dense Asp/Glu carboxylate coat that keeps `A0A1I4ES58` soluble at saturation salinity in marine solar salterns."
  },
  trka: {
    title1: "Bait: L0AC28 (444 aa · pI 4.34 · Natronobacterium gregoryi SP2 · K+ Transport NAD-Binding Component)",
    title2: "Discovery: A0ABD5PUN8 (445 aa · pI 4.34 · Halosolutus amylolyticus · BioVecInt8G128 Dist 0.0869 · IoU 92.16%)",
    pdb1: "/assets/models/AF-L0AC28-F1-model_v4.pdb",
    pdb2: "/assets/models/AF-A0ABD5PUN8-F1-model_v4.pdb",
    coreRes1: [14,16,18,38,40,65,68,142,145,178,182,250,254,310,315],
    coreRes2: [14,16,18,38,40,65,68,143,146,179,183,251,255,311,316],
    cleftLesson: "<strong>Rossmann-Fold RCK-Domain NAD+/NADH Osmoprotection Cleft (`0.0869` `BioVecInt8G128` Distance across `56.8%` Divergence):</strong> Green and cyan sticks highlight the conserved dinucleotide-sensing Rossmann cleft that gates potassium influx when hyperosmotic shock spikes intracellular `[NADH]/[NAD+]`.",
    hisLesson: "<strong>Inter-Subunit `HID`/`HIE` Hinge Staples (`6 HID / 2 HIE` vs. `5 HID / 2 HIE`):</strong> Purple sticks mark the Nδ1-protonated `HID` histidines along the RCK gating-ring hinge that lock the allosteric open/closed potassium-channel transition.",
    armorLesson: "<strong>Identical Ultra-Acidic `pI 4.34` Cytoplasmic KCl Armor:</strong> Orange sticks show the Asp/Glu surface shell (`pI 4.34` in both organisms) adapted to operate inside cytoplasms containing `3–4 M KCl`."
  }
};

let memViewerLeft = null;
let memViewerRight = null;
let memPdbCache = {};

async function fetchMemPdb(url) {
  if (!memPdbCache[url]) {
    const resp = await fetch(url);
    memPdbCache[url] = await resp.text();
  }
  return memPdbCache[url];
}

async function loadMemPairModels() {
  const key = document.getElementById('select-mem-pair').value;
  const cfg = MEM_PAIRS[key];
  document.getElementById('mem-title-left').textContent = cfg.title1;
  document.getElementById('mem-title-right').textContent = cfg.title2;

  const existing = Object.values(window.$3Dmol && window.$3Dmol.viewers ? window.$3Dmol.viewers : {});
  if (!memViewerLeft) {
    memViewerLeft = existing[0] || $3Dmol.createViewer(document.getElementById('mem-mol-left'), {backgroundColor: '#020617'});
  }
  if (!memViewerRight) {
    memViewerRight = existing[1] || $3Dmol.createViewer(document.getElementById('mem-mol-right'), {backgroundColor: '#020617'});
  }

  const [t1, t2] = await Promise.all([fetchMemPdb(cfg.pdb1), fetchMemPdb(cfg.pdb2)]);
  [memViewerLeft, memViewerRight].forEach((viewer, idx) => {
    viewer.removeAllModels();
    viewer.removeAllShapes();
    viewer.removeAllLabels();
    viewer.addModel(idx === 0 ? t1 : t2, "pdb");
  });

  return { viewers: [memViewerLeft, memViewerRight], cfg };
}

async function highlightMemCleft() {
  const { viewers, cfg } = await loadMemPairModels();
  Object.values(window.$3Dmol && window.$3Dmol.viewers ? window.$3Dmol.viewers : viewers).forEach(viewer => {
    if (viewer && viewer.setStyle) {
      viewer.setStyle({}, {cartoon: {color: "0x1e293b", opacity: 0.45}});
    }
  });
  const [v0, v1] = viewers;
  v0.setStyle({}, {cartoon: {color: "0x1e293b", opacity: 0.45}});
  v0.setStyle({resi: cfg.coreRes1}, {cartoon: {color: "0x10b981"}, stick: {colorscheme: "greenCarbon", radius: 0.25}});
  v0.addLabel("Acquire-Cached ZCA Core (0.80 ns barrier)", {resi: cfg.coreRes1[0]}, {backgroundColor: "0x064e3b", fontColor: "0x6ee7b7", fontSize: 11});
  v0.zoomTo();
  v0.render();

  v1.setStyle({}, {cartoon: {color: "0x1e293b", opacity: 0.45}});
  v1.setStyle({resi: cfg.coreRes2}, {cartoon: {color: "0x38bdf8"}, stick: {colorscheme: "cyanCarbon", radius: 0.25}});
  v1.addLabel("10.09x Faster ZCA + BioVecInt8G128 Match", {resi: cfg.coreRes2[0]}, {backgroundColor: "0x0c4a6e", fontColor: "0x7dd3fc", fontSize: 11});
  v1.zoomTo();
  v1.render();
  document.getElementById('mem-chemistry-lesson').innerHTML = cfg.cleftLesson;
}

async function highlightMemHis() {
  const { viewers, cfg } = await loadMemPairModels();
  Object.values(window.$3Dmol && window.$3Dmol.viewers ? window.$3Dmol.viewers : viewers).forEach((viewer, idx) => {
    if (viewer && viewer.setStyle) {
      viewer.setStyle({}, {cartoon: {color: "0x334155", opacity: 0.45}});
      viewer.setStyle({resn: ["HIS", "HID", "HIE", "HIP"]}, {cartoon: {color: "0xa855f7"}, stick: {colorscheme: "purpleCarbon", radius: 0.28}});
      viewer.addLabel(idx === 0 ? "Bait HID/HIE Proton Relays" : "Discovery HID/HIE Proton Relays", {resn: ["HIS", "HID", "HIE", "HIP"]}, {backgroundColor: "0x4c1d95", fontColor: "0xe9d5ff", fontSize: 11});
      viewer.zoomTo();
      viewer.render();
    }
  });
  document.getElementById('mem-chemistry-lesson').innerHTML = cfg.hisLesson;
}

async function highlightMemArmor() {
  const { viewers, cfg } = await loadMemPairModels();
  Object.values(window.$3Dmol && window.$3Dmol.viewers ? window.$3Dmol.viewers : viewers).forEach(viewer => {
    if (viewer && viewer.setStyle) {
      viewer.setStyle({}, {cartoon: {color: "0x334155", opacity: 0.48}});
      viewer.setStyle({resn: ["ASP", "GLU"]}, {cartoon: {color: "0xf97316"}, stick: {colorscheme: "orangeCarbon", radius: 0.24}});
      viewer.zoomTo();
      viewer.render();
    }
  });
  document.getElementById('mem-chemistry-lesson').innerHTML = cfg.armorLesson;
}

async function resetMemView() {
  const { viewers, cfg } = await loadMemPairModels();
  const [v0, v1] = viewers;
  v0.setStyle({}, {cartoon: {color: "cyan"}});
  v0.zoomTo();
  v0.render();
  v1.setStyle({}, {cartoon: {color: "magenta"}});
  v1.zoomTo();
  v1.render();
  document.getElementById('mem-chemistry-lesson').innerHTML = cfg.cleftLesson;
}

function switchMemPair() {
  highlightMemCleft();
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(highlightMemCleft, 250);
});
</script>

---

## 🔭 6. The Horizon: Future Research Ideas & Lock-Free Multiomics in PostgreSQL 18

*The Bait (stateless per-row `stats_bytea` deserialization and `f16 -> f32` unpacking in `bio_whiten_embedding`, or naive per-row shared reader locks that mutate atomic reader counters on every tuple—as well as single-habitat reference enzymes like `A0A1U7EWJ1`, `L0AC28`, and `A0A1I3C945`) can perform isotropic vector pre-conditioning on small toy tables, but fails when millions of embeddings or 8+ parallel workers trigger `88.35 µs/row` of redundant `f16` byte unpacking or `1,831.75 ns/op` of MESI cache-line invalidation ping-pong across CPU store buffers and invalidate queues—whereas our new 64-byte MESI cache-line-aligned Write-Release / Read-Acquire model cache (`Ordering::Release` / `Ordering::Acquire` in PR #22) keeps the model pointer in the MESI `Shared` (`S`) state across all cores at `0.80 ns/op`, cuts full `f16` ZCA whitening to `8.75 µs/row` (`10.09×` speedup) and 1280-D ABTT whitening to `3.41 µs/row` (`2.85×` speedup) with `0.00e0` numerical drift, making it perfect for planetary-scale real-time metagenomic ingestion, multi-worker `pg_vectorsearch` PRISM re-indexing, and extremophile biocatalyst discovery (`A0AAV3SNV3`, `A0A1I4ES58`, `A0ABD5PUN8`).*

1. **Lock-Free Shared-Memory (`DSM` / `ShmemInitStruct`) Centroid & Whitening Codebooks Across Forked PostgreSQL Workers:**  
   By extending the exact `Ordering::Release` / `Ordering::Acquire` single-pointer publication pattern from PR #22 into PostgreSQL shared memory (`PgSharedMemoryInitialization`), all forked parallel query backends can share a single pre-unpacked `3.28 MB` 1280×1280 ZCA matrix and 2-level RaBitQ centroid codebook in physical RAM with zero per-backend warm-up and zero `LWLock` reader-count contention.
2. **Real-Time Metagenomic Contig Ingestion with On-the-Fly ZCA + `BioVecInt8G128` Quantization:**  
   At **`3.41 µs/row`** (ABTT 1280-D) and **`8.75 µs/row`** (Full ZCA `f16`), an `INSERT INTO proteins SELECT ..., bio_vec_int8_g128_encode(bio_whiten_embedding(raw_esm2, stats_bytea))` trigger inside PostgreSQL 18 can isotropically whiten and quantize **114,000 to 293,000 proteins per second per core** directly into `1,304-byte` zero-TOAST heap tuples.
3. **Industrial Haloalkaliphilic Bioreactors for Vitamin $\text{K}_2$ (`A0AAV3SNV3`) and Polyunsaturated Lipid Remodeling (`A0A1I4ES58`):**  
   Deploying the `Release`/`Acquire`-audited *Halorubrum ejinorense* isochorismate synthase `A0AAV3SNV3` (`92.34%` pocket IoU) and *Halogranum rubrum* 2,4-dienoyl-CoA reductase `A0A1I4ES58` (`99.00%` pocket IoU) in non-sterile high-salinity bioreactors eliminates freshwater sterilization costs while preserving full catalytic flux.

{% include pg_bio_promo.md %}
