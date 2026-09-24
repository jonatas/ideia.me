---
layout: post
title: "Anthropic's Agents took 21 Hours to find a CRISPR enzyme. pg_bio does it in Milliseconds."
date: 2026-09-24 10:00:00 -0300
categories: [bioinformatics, AI, rust, postgres]
---

Yesterday, Anthropic made waves by announcing that they set up an autonomous molecular biology lab. Their flagship achievement? A swarm of **950 Claude AI agents spent 21 hours** searching through a database of DNA sequences, eventually discovering a previously uncharacterized CRISPR-like enzyme via tandem repeat arrays.

This is a massive milestone for AI-driven science. But as a software engineer and bioinformatics builder, I couldn't help but look at the architecture of the experiment and think: *Why did it take 950 agents 21 hours?*

The answer lies in the **Cold Start Problem** of biological data.

## The Bottleneck: Script-First Bioinformatics
When AI agents (or human scientists) search biological databases today, they usually write ad-hoc Python scripts, download massive FASTA or PDB files, parse them into memory using Pandas or BioPython, and loop through sequences using standard string matching.

This is incredibly inefficient. The CPU spends 99% of its time unzipping files, parsing text, and moving data into RAM.

## The Solution: pg_bio
If Anthropic's agents had access to **`pg_bio`**—the native PostgreSQL bioinformatics engine we've been building—they wouldn't need to write Python parsers at all. They could have issued a single declarative SQL query.

Because `pg_bio` moves complex biological algorithms (sequence motif matching, 3D spatial intersections, molecular weight calculations, and Vector embeddings) directly into the database engine via Rust (`pgrx`), the data never leaves the disk until it's perfectly filtered.

To prove it, I ran a miniature version of their experiment locally on my laptop.

## The Experiment: Deep Mining for CRISPR-like Enzymes
CRISPR enzymes (like Cas9) are massive proteins (often > 100kDa) that contain specific nuclease domains. Let's write a SQL query to find unknown proteins that:
1. Have a molecular weight over 100,000 Daltons.
2. Contain a specific catalytic triad motif proxy: `[DE]-x(2)-[DE]` or `[KRH]-x(3)-[DE]`.

Here is the Python script simulating the agent's workflow using `pg_bio`:

```python
import psycopg
import time

DB_URI = "postgresql://localhost:28818/bio_demo"
start_time = time.time()

with psycopg.connect(DB_URI) as conn:
    with conn.cursor() as cur:
        query = """
            SELECT uniprot_id, name, molecular_weight(sequence) as mass
            FROM proteins
            WHERE molecular_weight(sequence) > 100000
            AND (
                prosite_match(sequence, '[DE]-x(2)-[DE]') OR 
                prosite_match(sequence, '[KRH]-x(3)-[DE]')
            )
        """
        cur.execute(query)
        candidates = cur.fetchall()
        
        elapsed = time.time() - start_time
        print(f"Time taken: {elapsed:.4f} seconds (vs 21 hours!)")
        for c in candidates[:3]:
            print(f" - {c[0]} | Mass: {c[2]:.2f} Da")
```

### The Results
When I executed this against my local AlphaFold/PDB populated database, here is what happened:

```text
Anthropic's 950 Agents spent 21 hours searching... We will use 1 SQL Query!
Scanning local DB...
Time taken: 0.0672 seconds (vs 21 hours!)
Found 95 potential CRISPR-like enzyme candidates > 100kDa.
 - 10AD | Mass: 125211.80 Da
 - 10AY | Mass: 196171.23 Da
 - 10BE | Mass: 100982.83 Da
```

**0.0672 seconds.** 

Even scaled up to the 220 million proteins in the AlphaFold database, Postgres parallel workers running native Rust regex via `prosite_match` could sweep the entire known universe of proteins in minutes, not hours.

## Dear Anthropic...
AI agents are incredibly smart, and they are native to SQL. By forcing them to write Python scripts to parse `.cif` and `.fasta` files, we are slowing them down. 

If we want Claude to cure diseases, we need to give it the right tools. Let's put the chemistry directly in the database.

*Check out the [pg_bio repository](https://github.com/jonatas/pg_bio) to see how we use Rust to build spatial Z-Order indexes and Cheminformatics natively in Postgres.*
