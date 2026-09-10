---
layout: post
title: "Learning to Let Go: Leveraging PostgreSQL's Autovacuum for IVM"
date: 2026-09-10 11:30:00 -0300
categories: postgresql architecture
---

When building an extension for a massive, decades-old database like PostgreSQL, the first instinct of many modern developers is to try and outsmart the system. We want to bring our own schedulers, our own background workers, and our own event loops. 

I recently fell into this exact trap while building [Spiral](https://github.com/jonatas/spiral), an engine for Incremental View Maintenance (IVM). But PR [#106](https://github.com/jonatas/spiral/pull/106) taught me a valuable lesson: **always go with the grain of the database.**

### A Quick Backstory: PGConf BR and Timescale Lessons

Last week, I had the amazing opportunity to present Spiral at **PGConf Brasil**. 

While there, I got to catch up and share the extension with my former Timescale colleague, [Fabrízio Mello](https://www.linkedin.com/in/fabriziomello/). Fabrízio was instrumental in developing hierarchical continuous aggregates at Timescale, and most of Spiral's core architecture is heavily inspired by the lessons I learned from him while tackling this hardcore data problem. 

The conversations at PGConf got me thinking deeply about how Spiral was interacting with Postgres. Here is the story of how deleting hundreds of lines of custom Rust code and leaning into PostgreSQL's native garbage collection made the entire system infinitely better.

### The Problem: Re-inventing the Wheel

To make Incremental View Maintenance work, Spiral needs to know exactly which time buckets have received new inserts or updates. It does this by recording modified "dirty" segments into a transactional changelog (`spiral.changelog`).

But how do you process that changelog? 

My initial design was what you'd expect from a typical backend service: a dedicated background worker written in Rust. It requested a slot from PostgreSQL, spawned an OS process, and ran an infinite loop:
1. Wake up every 1 second.
2. Query `spiral.changelog` to see if there is work.
3. If yes, refresh the dirty views.
4. Go back to sleep.

It worked perfectly in tests. But it was an architectural dead end.

### The Limits of Custom Background Workers

PostgreSQL is fiercely protective of its background workers. There is a hard limit (`max_worker_processes`, which defaults to just 8). If Spiral takes up 4 of those slots just to poll an empty changelog every second, it steals resources from parallel query execution and logical replication.

Furthermore, polling is incredibly wasteful. Waking up a process every second, taking advisory locks, and querying a table that hasn't changed creates unnecessary CPU churn and latency. I even had to invent custom configuration flags (GUCs) like `spiral.worker_enabled` and `spiral.max_workers` just to let users tame the beast.

There had to be a better way to run background tasks *only* when a table was actually being modified.

### The "Aha!" Moment: Autovacuum

I was reading through PostgreSQL's Table Access Method (TAM) API when it hit me. 

PostgreSQL *already* has a highly optimized, autonomous daemon that tracks exactly how many rows are inserted, updated, or deleted in every single table. When a table reaches a certain threshold of churn, this daemon wakes up and performs maintenance on that specific table.

It's called **Autovacuum**.

Instead of trying to beat Autovacuum, what if Spiral just hitched a ride on it?

### Hooking into the Table Access Method (TAM)

When you write a custom Table Access Method in PostgreSQL, you get to define what happens when the system calls `VACUUM` on your table. 

In PR #106, I completely deleted `src/bgworker.rs`. I removed all the polling loops, the advisory locks, and the custom GUCs. 

Instead, I went into `src/tam.rs` and added a few lines of code to the `spiral_relation_vacuum` function. Now, the logic looks like this:

```rust
// Inside our custom VACUUM implementation
pub unsafe extern "C-unwind" fn spiral_relation_vacuum(...) {
    // 1. Let Postgres do its normal garbage collection...
    
    // 2. Read the changelog specifically for this table
    let scopes = fetch_dirty_scopes(rel_name);
    
    if !scopes.is_empty() {
        info!("Spiral: VACUUM refreshing {} scopes for '{}'", scopes.len(), rel_name);
        // 3. Trigger the Incremental View Maintenance!
        trigger_refresh(rel_name, scopes);
    }
}
```

### Why This is a Massive Win

By piggybacking on Autovacuum, the architecture improved overnight:

1. **Zero Wasted Cycles:** There is no 1-second polling loop anymore. The views are only refreshed exactly when PostgreSQL determines the table has seen enough churn to warrant maintenance.
2. **Infinite Scaling:** We are no longer limited by `max_worker_processes`. Autovacuum already knows how to schedule itself dynamically across thousands of tables.
3. **Native Toggles:** Remember how I had to build a custom `SELECT spiral.stop_bg_workers()` function for users who wanted to pause refreshes during massive batch data migrations? That's gone. Users can now use the native PostgreSQL command: `ALTER TABLE my_table SET (autovacuum_enabled = false);`. 

### The Takeaway

When extending a mature platform like PostgreSQL, your first question shouldn't be *"How do I build a system to do X?"* 

Your first question should be: ***"Does PostgreSQL already do X, and can I hook into it?"***

By replacing our custom background worker with a native Table Access Method hook into Autovacuum, we got scheduling, scaling, and pausing completely for free. We deleted hundreds of lines of code, and the engine became faster and more deeply integrated with the database it lives in.
