---
layout: post
title: "Accelerating Claude's CRISPR Discovery: Equipping AI Agents with Native Bio-Databases"
date: 2026-09-24 10:00:00 -0300
categories: [bioinformatics, AI, rust, postgres]
---

Yesterday, Anthropic made waves by announcing they set up an autonomous molecular biology lab. Their flagship achievement is truly inspiring: a swarm of **950 Claude AI agents spent 21 hours** searching through a massive database of DNA sequences, eventually discovering a previously uncharacterized CRISPR-like enzyme via tandem repeat arrays.

This is a massive milestone for AI-driven science. As a software engineer and bioinformatics builder, I was thrilled by the news. It also got me thinking about the immense data engineering challenges those agents had to overcome, and how we can provide them with even better infrastructure for their next discovery.

## The Infrastructure Challenge
When AI agents (or human scientists) search biological databases today, they are usually forced to interact with files. They write ad-hoc Python scripts, download heavy FASTA or PDB files, parse them into memory using libraries like Pandas or BioPython, and loop through sequences.

This creates a severe "Cold Start Problem". The agents, and the CPUs they run on, spend the vast majority of their time just unzipping files, parsing text, and moving data into RAM before any actual discovery can begin.

## Empowering Agents with pg_bio
To help accelerate these workflows, I've been building **`pg_bio`**—a native PostgreSQL bioinformatics engine. 

Because Large Language Models are inherently excellent at writing SQL, `pg_bio` aims to give them a declarative interface to biology. By moving complex biological algorithms (sequence motif matching, 3D spatial intersections, and Vector embeddings) directly into the database engine via Rust (`pgrx`), the data never has to leave the disk until it's perfectly filtered.

To explore how this could complement Anthropic's workflow, I ran a miniature version of a CRISPR discovery search locally.

## The Experiment: Deep Mining for CRISPR-like Enzymes
CRISPR enzymes (like Cas9) are massive proteins (often > 100kDa) that contain specific domains. Let's imagine an agent writing a SQL query to find unknown proteins that:
1. Have a molecular weight over 100,000 Daltons.
2. Contain a specific catalytic triad motif proxy: `[DE]-x(2)-[DE]` or `[KRH]-x(3)-[DE]`.

Here is the Python script simulating how an agent would use `pg_bio`:

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
        print(f"Time taken: {elapsed:.4f} seconds")
        for c in candidates[:3]:
            print(f" - {c[0]} | Mass: {c[2]:.2f} Da")
```

### The Results
When I executed this against my local AlphaFold/PDB populated database, here is what happened:

```text
Scanning local DB...
Time taken: 0.0672 seconds
Found 95 potential CRISPR-like enzyme candidates > 100kDa.
 - 10AD | Mass: 125211.80 Da
 - 10AY | Mass: 196171.23 Da
 - 10BE | Mass: 100982.83 Da
```

**0.0672 seconds.** 

By executing native Rust regex directly inside Postgres via `prosite_match`, the query runs instantly. Even scaled up to the 220 million proteins in the AlphaFold database, parallel Postgres workers could sweep the entire known universe of proteins incredibly fast.

## Building the Future of Bio-Agents Together
Anthropic has proven that AI agents possess the reasoning capabilities to discover novel biology. Our next step as an engineering community is to give them the database infrastructure that matches their intelligence. 

By eliminating the need to write Python parser scripts, we can free up Claude to spend 100% of its compute on actual scientific reasoning. 

I would love to collaborate with scientists and AI researchers pushing these boundaries. If you're building autonomous labs or bio-agents, check out the [pg_bio repository](https://github.com/jonatas/pg_bio) to see how we use Rust to build spatial indexing and cheminformatics natively in Postgres!
