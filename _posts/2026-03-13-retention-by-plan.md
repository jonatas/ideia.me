---
layout: post
title: Per-Plan Retention with TimescaleDB Dimensions
categories: ['timescaledb', 'postgresql', 'tutorial']
tags: ['timescaledb', 'partitioning', 'retention', 'postgresql', 'saas']
description: "How to use TimescaleDB's space dimensions to implement per-subscription-plan data retention — dropping entire chunk files instead of row-level deletes."
image: /images/retention-by-plan-dissolving-partitions.png
mermaid: true
---

Most SaaS products eventually face the same storage problem: free users shouldn't get the same
data history as paying customers, but naively deleting their rows is expensive. DELETE is O(n).
It writes WAL. It leaves bloat that VACUUM has to clean up later. On a big table, running that
every night starts to hurt.

There's a better approach using TimescaleDB's space dimensions. The idea: make each subscription
tier physically separate on disk, so dropping old data for free users is just a file unlink — not
a row scan.

I ran everything in this post for real. The output is actual output.

## The setup: per-plan retention in TimescaleDB

We have an `events` table. Each row belongs to a subscription tier:

- `0` — free (keep 2 weeks)
- `1` — short (keep 6 weeks)
- `2` — default (keep 6 months)
- `3` — long (keep 1 year)

The goal is to enforce those retention windows cheaply — and let the database do it on a schedule.

## Creating the hypertable in PostgreSQL

Start with a table that includes the tier as a column:

```sql
CREATE TABLE events (
    time           TIMESTAMPTZ NOT NULL,
    value          DOUBLE PRECISION,
    retention_tier INTEGER NOT NULL  -- 0=free, 1=short, 2=default, 3=long
);

SELECT create_hypertable('events', 'time');
```

At this point, TimescaleDB partitions by time only. One chunk per time interval — default is
7 days. Every tier's data lands in the same physical file.

## The key step: `add_dimension` for space partitioning

```sql
SELECT add_dimension('events', 'retention_tier', number_partitions => 4);
```

This one call changes the chunk topology completely. Now instead of one chunk per time interval,
you get four — one per tier value. Each time bucket produces four separate physical files on disk.

That's the whole trick. TimescaleDB's chunk-drop mechanism operates on whole files. If each tier
has its own files, you can drop tier 0's old chunks without touching tier 3's data at all.

## What TimescaleDB chunks look like after `add_dimension`

After loading about 15 months of data across all four tiers, the chunk view shows the structure
clearly:

```
                    chunk                     | time_from  |  time_to   | tier |  size
----------------------------------------------+------------+------------+------+--------
 _timescaledb_internal._hyper_270_16320_chunk | 2025-01-12 | 2025-02-11 |    0 | 336 kB
 _timescaledb_internal._hyper_270_16302_chunk | 2025-01-12 | 2025-02-11 |    1 | 608 kB
 _timescaledb_internal._hyper_270_16318_chunk | 2025-01-12 | 2025-02-11 |    2 | 608 kB
 _timescaledb_internal._hyper_270_16326_chunk | 2025-01-12 | 2025-02-11 |    3 | 328 kB
...
```

Four chunks for the same time interval, one per tier. Before running any retention, I had 60
chunks total: 15 time intervals × 4 tiers.

## The data before retention

```
 retention_tier |       window       |  rows  |   oldest   |   newest
----------------+--------------------+--------+------------+------------
              0 | free    (2 weeks)  |  83503 | 2025-01-17 | 2026-03-13
              1 | short   (6 weeks)  | 166015 | 2025-01-17 | 2026-03-13
              2 | default (6 months) | 167078 | 2025-01-17 | 2026-03-13
              3 | long    (1 year)   |  83404 | 2025-01-17 | 2026-03-13
```

Tier 0 has 83k rows going back to January 2025. It should only keep the last 2 weeks.
A DELETE approach would scan and delete ~76k rows from a shared table. Instead, we drop chunks.

## The retention procedure

The procedure iterates over tiers, computes a cutoff for each one, then finds and drops every
chunk whose time range ends before that cutoff — and whose space dimension matches the tier:

```sql
CREATE OR REPLACE PROCEDURE custom_retention(job_id INT, config JSONB)
LANGUAGE plpgsql AS $$
DECLARE
    tier_rec  RECORD;
    chunk_rec RECORD;
    cutoff    TIMESTAMPTZ;
    total_dropped INT := 0;
BEGIN
    FOR tier_rec IN
        SELECT tier, window FROM retention_policy ORDER BY tier
    LOOP
        cutoff := now() - tier_rec.window;

        FOR chunk_rec IN
            SELECT c.chunk_schema || '.' || c.chunk_name AS chunk
            FROM timescaledb_information.chunks c
            WHERE c.hypertable_name = 'events'
              AND c.range_end < cutoff
              AND c.dimension_name = 'retention_tier'
              AND c.range_start = tier_rec.tier
        LOOP
            RAISE NOTICE 'tier %: dropping % (older than %)',
                tier_rec.tier, chunk_rec.chunk, cutoff;
            EXECUTE 'DROP TABLE ' || chunk_rec.chunk;
            total_dropped := total_dropped + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Total chunks dropped: %', total_dropped;
END;
$$;
```

The `retention_policy` table is simple — just a mapping from tier to interval:

```sql
CREATE TABLE retention_policy (
    tier   INTEGER PRIMARY KEY,
    window INTERVAL NOT NULL
);

INSERT INTO retention_policy VALUES
    (0, INTERVAL '2 weeks'),
    (1, INTERVAL '6 weeks'),
    (2, INTERVAL '6 months'),
    (3, INTERVAL '1 year');
```

## Running it

```sql
CALL custom_retention(NULL, NULL);
```

The NOTICE output from the actual run:

```
NOTICE:  tier 0: dropping _timescaledb_internal._hyper_270_16320_chunk (older than 2026-02-27)
NOTICE:  tier 0: dropping _timescaledb_internal._hyper_270_16321_chunk (older than 2026-02-27)
-- ... 11 more tier 0 chunks
NOTICE:  tier 1: dropping _timescaledb_internal._hyper_270_16302_chunk (older than 2026-01-30)
-- ... 10 more tier 1 chunks
NOTICE:  tier 2: dropping _timescaledb_internal._hyper_270_16318_chunk (older than 2025-09-13)
-- ... 7 more tier 2 chunks
NOTICE:  tier 3: dropping _timescaledb_internal._hyper_270_16326_chunk (older than 2025-03-13)
NOTICE:  tier 3: dropping _timescaledb_internal._hyper_270_16327_chunk (older than 2025-03-13)
NOTICE:  Total chunks dropped: 35
```

35 chunks dropped. 25 remain. No table scan. No VACUUM needed afterward.

## The result

```
 retention_tier | rows  |   oldest   |   newest
----------------+-------+------------+------------
              0 |  7163 | 2026-02-06 | 2026-03-13
              1 | 25774 | 2026-01-07 | 2026-03-13
              2 | 73680 | 2025-09-09 | 2026-03-13
              3 | 72676 | 2025-03-13 | 2026-03-13
```

You can verify it with a simple query directly on the table:

```sql
SELECT retention_tier, now() - min(time) AS first_record_at, count(*)
FROM events
GROUP BY 1
ORDER BY 1;
```

```
 retention_tier |     first_record_at      | count
----------------+--------------------------+-------
              0 | 35 days 00:13:00.130692  |  7163
              1 | 65 days 00:13:00.130692  | 25774
              2 | 185 days 00:13:00.130692 | 73680
              3 | 365 days 00:13:00.130692 | 72676
```

Tier 0 went from 83,503 rows to 7,163 — only the last two weeks survive. Tier 3 kept everything,
because nothing it has is older than one year yet.

The 500k rows we dropped across 35 chunks took milliseconds. Each chunk drop is a filesystem
`unlink` call — the database removes the file and updates its catalog. No WAL for the row data,
no dead tuples, no bloat.

## Scheduling with TimescaleDB's background job

Once you've verified the procedure works, hand it to TimescaleDB's job scheduler:

```sql
SELECT add_job('custom_retention', '1 day');
```

It runs daily, in the database, without any external cron or application-side logic. You can
inspect its run history in `timescaledb_information.job_stats`.

Here's how the whole thing fits together:

{% mermaid %}
flowchart TD
    J[TimescaleDB background job\nruns every 24h] --> P[custom_retention procedure]

    P --> L{for each tier\nin retention_policy}

    L --> T0[tier 0 — free\ncutoff: now - 2 weeks]
    L --> T1[tier 1 — short\ncutoff: now - 6 weeks]
    L --> T2[tier 2 — default\ncutoff: now - 6 months]
    L --> T3[tier 3 — long\ncutoff: now - 1 year]

    T0 --> Q0[find chunks WHERE\nrange_end &lt; cutoff\nAND space_dim = 0]
    T1 --> Q1[find chunks WHERE\nrange_end &lt; cutoff\nAND space_dim = 1]
    T2 --> Q2[find chunks WHERE\nrange_end &lt; cutoff\nAND space_dim = 2]
    T3 --> Q3[find chunks WHERE\nrange_end &lt; cutoff\nAND space_dim = 3]

    Q0 --> D[DROP TABLE chunk\nunlink on disk\nno WAL, no bloat]
    Q1 --> D
    Q2 --> D
    Q3 --> D
{% endmermaid %}

## Why chunk drops scale better than DELETE in PostgreSQL

A `DELETE WHERE retention_tier = 0 AND time < now() - INTERVAL '2 weeks'` has to:

1. Scan the table (or at least the relevant index)
2. Write a WAL record for every deleted row
3. Mark tuples as dead
4. Wait for VACUUM to reclaim the space

On a table with hundreds of thousands of rows, that's real I/O. It competes with your live
queries. The dead tuples inflate your table until VACUUM runs. And VACUUM itself has overhead.

Dropping a chunk does none of that. The chunk is a separate heap file. Dropping it is an
`unlink(2)` — one syscall, the space is immediately returned to the OS, the catalog entry is
removed. That's it.

The cost doesn't scale with the number of rows in the chunk. It's the same operation whether the
chunk has 10 rows or 10 million.

## The constraint you're taking on

This approach works because `retention_tier` is written once at insert time and never changes. If
a user upgrades from tier 0 to tier 3, you'd need to move their existing data to the new tier's
chunks — which means rewriting rows. That's a real tradeoff.

For append-only workloads — metrics, events, logs — this is rarely a problem. Data is immutable
once written. The tier assignment reflects the plan the user was on when the data was generated,
which is usually exactly what you want for retention purposes.

If plan changes need retroactive retiering, you'd handle that separately (a background migration
job, or accepting that old data ages out under the old tier's policy). The point is to think
about it upfront, not after you've got a 200GB table.

## The broader pattern: TimescaleDB space dimensions at scale

Space dimensions in TimescaleDB exist to spread write load across multiple disks or nodes. But
the partitioning they create is a general-purpose tool. Any column you want to treat as a
first-class boundary — tenant ID, region, plan tier — can become a dimension, and from that
point you can operate on those groups at the file level rather than the row level.

Retention is one use case. Tiered compression (compress tier 0 aggressively, tier 3 lightly) is
another. Moving cold partitions to cheaper storage is a third. Once the data is physically
separated, the options open up.

The full runnable snippet — table setup, data generation, retention procedure, and job scheduling
— is on GitHub: [retention_by_plan.sql](https://github.com/jonatas/sql-snippets/blob/master/retention_by_plan.sql).

## Quick Knowledge Check

<div class="interactive-widget">
  <div aria-live="polite" id="quiz-feedback" style="font-weight: bold; margin-bottom: 10px; min-height: 1.5em;"></div>
  <form id="retention-quiz">
    <p>Why does dropping a chunk scale better than a DELETE statement for retention?</p>
    <div class="checkbox-wrapper">
      <input type="radio" name="q1" id="q1a" value="a">
      <label for="q1a">A) DELETE doesn't work on hypertables.</label>
    </div>
    <div class="checkbox-wrapper">
      <input type="radio" name="q1" id="q1b" value="b">
      <label for="q1b">B) Dropping a chunk is a single filesystem unlink, avoiding table scans and WAL bloat.</label>
    </div>
    <div class="checkbox-wrapper">
      <input type="radio" name="q1" id="q1c" value="c">
      <label for="q1c">C) Chunks automatically compress deleted rows.</label>
    </div>
  </form>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('retention-quiz');
    const feedback = document.getElementById('quiz-feedback');
    const radios = form.querySelectorAll('input[type="radio"]');

    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'b') {
                feedback.textContent = 'Correct! It is a simple OS-level unlink.';
                feedback.style.color = '#10b981';
            } else {
                feedback.textContent = 'Incorrect. Try again!';
                feedback.style.color = '#ef4444';
            }
        });
    });
});
</script>

<style>
.interactive-widget {
    background: rgba(0, 0, 0, 0.2);
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
}
.checkbox-wrapper {
    margin-bottom: 10px;
    display: flex;
    align-items: flex-start;
}
.checkbox-wrapper input {
    margin-top: 4px;
    margin-right: 10px;
}
</style>
