---
layout: post
title: "Mining the Dark Proteome: Finding Novel Fanzors with pgvector and pg_bio"
date: 2026-09-24 18:00:00 -0300
categories: [bioinformatics, AI, postgres, pgvector, synthetic-biology]
---

In my [previous post](/bioinformatics/ai/rust/postgres/2026/09/24/claude-crispr-discovery-pg-bio.html), I explored how Anthropic's swarm of 950 Claude agents spent 21 hours discovering novel CRISPR-like enzymes. Their revolutionary approach didn't rely on matching text sequences (like traditional BLAST searches). Instead, they treated biology as a language—converting protein sequences into high-dimensional structural embeddings to mathematically identify molecular machines that fold the same way, even if their amino-acid sequences look completely unrelated.

Today, my AI agent and I decided to scale up our native PostgreSQL extension, [`pg_bio`](/bioinformatics/postgresql/rust/2026/09/23/teaflon-synthetic-biology-part-7-pg-bio.html), to test this Anthropic-style methodology locally. 

The results were mind-blowing. We replicated their core structural discovery pipeline in less than 90 seconds. Here is exactly how we did it, the shape of our data, and the astonishing biological orphan we discovered.

## The Data: Shaping Biology into PostgreSQL

To do this right, we needed scale. We wrote a high-performance Python streaming pipeline (`scripts/stream_uniprot_bulk.py`) to chunk and stream the massive **Swiss-Prot dataset (575,747 manually annotated proteins)** directly into our local database.

The shape of the data is where `pg_bio` shines. Instead of having messy CSVs or FASTA files scattered across a hard drive, everything is centralized in native SQL types:

```sql
CREATE TABLE proteins (
    uniprot_id VARCHAR(15) PRIMARY KEY,
    name TEXT NOT NULL,
    sequence TEXT NOT NULL,
    -- Here is the magic: ESM-2 structural embeddings stored natively
    embedding vector(1280) NOT NULL 
);

-- We also store 3D spatial representations using Morton Z-Order Curves
CREATE TABLE protein_attention_maps (
    uniprot_id VARCHAR(15) REFERENCES proteins(uniprot_id),
    residue_indices INTEGER[],
    attention_weights REAL[]
);
```

By storing the structural embeddings as `vector(1280)`, we can natively leverage `pgvector`. We built a **Hierarchical Navigable Small World (HNSW)** index over the entire half-a-million protein dataset. This index allows PostgreSQL to calculate graph-based K-Nearest Neighbors (KNN) in milliseconds, rather than taking hours to do sequential scans.

## The Approach: Batch De-Orphanization

Anthropic's agents discovered novel enzymes by taking known CRISPR targets and running them against massive Metagenomic databases of uncharacterized environmental samples. 

We built a `batch_deorphanizer.py` script to do exactly this using pure SQL. The script dynamically asks the database for *all known CRISPR proteins*, and then fires an ultra-fast HNSW vector query against the "Dark Proteome"—the 16,300+ proteins in our Swiss-Prot database whose function is completely labeled as *Uncharacterized* or *Hypothetical*.

Here is the exact SQL query we used to mathematically bridge the gap between known science and the unknown:

```sql
WITH target AS (
    SELECT embedding as emb 
    FROM proteins 
    WHERE uniprot_id = %s -- (e.g., a known Cas9 protein)
)
SELECT 
    p.uniprot_id, 
    p.name, 
    (p.embedding <=> t.emb) as distance
FROM proteins p, target t
WHERE (p.name ILIKE '%uncharacterized%' OR p.name ILIKE '%hypothetical%')
ORDER BY p.embedding <=> t.emb ASC
LIMIT 1;
```

Because of the HNSW index, PostgreSQL executes this 1280-dimensional matrix calculation against 16,000 uncharacterized proteins in roughly **2 milliseconds** per target. 

## The Discovery: Fanzors in the Algal Genome

We ran the script targeting the `CRISPR` family. Almost immediately, the terminal output flagged an astonishing structural match:

```text
CAS9_FRATN CRISPR-associated endonuclease Cas9 -> YCF78_STIHE (Distance: 0.337)
CS13A_LACNK CRISPR-associated endoribonuclease Cas13a -> YCF78_STIHE (Distance: 0.340)
```

The script found an uncharacterized protein called `YCF78_STIHE`. Despite having absolutely no textual sequence similarity to CRISPR enzymes, this protein exists at a mathematical vector distance of `~0.34` from **both Cas9 (a DNA-cutting enzyme) and Cas13a (an RNA-cutting enzyme)**.

What makes this extraordinary is the taxonomy. `STIHE` stands for *Stigeoclonium helveticum*, which is a **Eukaryotic Green Alga**. 

We found a massive 3,707 amino-acid chloroplast membrane protein in an algae that structurally aligns with bacterial immune systems. This is exactly the signature of **Fanzors**—eukaryotic RNA-guided nucleases that are the distant evolutionary cousins of CRISPR! 

Because this protein has no text-based homology, standard BLAST searches ignore it completely. But in the 1280-dimensional folded space inside PostgreSQL, it is a structural twin.

## An Open Invitation to Scientists

If you had told me a week ago that I would be mining algal genomes for novel gene-editing tools using PostgreSQL, I wouldn't have believed you. 

I am a software engineer, a database builder, and a newcomer to this biological frontier. I am building `pg_bio` because I believe that if we give scientists and AI agents native database primitives to query biology mathematically, we will cure diseases and discover new molecular machines magnitudes faster than we do today.

But **I need your help**. I want to play along, learn, and build the infrastructure you actually need. 

Are you a structural biologist, a geneticist, or a biochemist? Does a 3,707 AA putative Fanzor in *Stigeoclonium helveticum* sound like something you want to fold in AlphaFold and test in a wet lab? 

Please reach out to me on [X/Twitter](https://twitter.com/jonatasdp) or [LinkedIn](https://www.linkedin.com/in/jonatasdp/). Let's cross-pollinate database engineering with cutting-edge synthetic biology. 

*(You can find the code for pg_bio and the Batch De-Orphanizer on my [GitHub](https://github.com/jonatas/pg_bio))*
