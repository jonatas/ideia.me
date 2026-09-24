---
layout: post
title: "Mining the Dark Proteome: Finding Novel Fanzors with pgvector and pg_bio"
date: 2026-09-24 18:00:00 -0300
categories: [bioinformatics, AI, postgres, pgvector]
---

In my [previous post](/bioinformatics/ai/rust/postgres/2026/09/24/claude-crispr-discovery-pg-bio.html), I explored how Anthropic's 950 Claude agents spent 21 hours discovering novel CRISPR-like enzymes. The core of their methodology—and modern AI structural biology—relies on ignoring text-based sequence similarities (like BLAST) and instead looking at how proteins *fold* in 3D vector space.

Today, my AI agent and I decided to scale up our native PostgreSQL extension, [`pg_bio`](/bioinformatics/postgresql/rust/2026/09/23/teaflon-synthetic-biology-part-7-pg-bio.html), and test this Anthropic-style vector methodology locally. The results were mind-blowing.

## The Experiment: Batch De-Orphanization

We streamed the massive 575,000+ protein Swiss-Prot dataset into our local PostgreSQL database. To mimic Anthropic's search, we embedded all of them into a 1280-dimensional structural space (using ESM representations) and stored them natively as `vector(1280)`.

We then built a **Hierarchical Navigable Small World (HNSW)** index over the entire dataset.

Instead of guessing targets one by one, we built a `batch_deorphanizer.py` script. The script asks the database for *all known CRISPR proteins*, and then fires an ultra-fast K-Nearest Neighbors (KNN) query against the "Dark Proteome" (the 16,300+ proteins in the database whose function is completely *Uncharacterized* or *Hypothetical*).

Because of `pgvector`'s HNSW index, these massive matrix calculations executed in roughly **2 milliseconds per target**.

## The Discovery: YCF78_STIHE

Almost immediately, the script flagged an astonishing structural match:

```text
CAS9_FRATN CRISPR-associated endonuclease Cas9 -> YCF78_STIHE
CS13A_LACNK CRISPR-associated endoribonuclease Cas13a -> YCF78_STIHE
```

It found an uncharacterized protein called `YCF78_STIHE`. Despite having absolutely no textual sequence similarity to CRISPR enzymes, this protein exists at a mathematical vector distance of `0.34` from **both Cas9 (a DNA cutter) and Cas13a (an RNA cutter)**. 

What makes this extraordinary is the taxonomy: `STIHE` stands for *Stigeoclonium helveticum*, which is a **eukaryotic green alga**. 

We found a massive 3,707 amino-acid chloroplast membrane protein in an algae that structurally aligns with bacterial immune systems. This is exactly the signature of **Fanzors**—eukaryotic RNA-guided nucleases that are the distant evolutionary cousins of CRISPR! Because this protein has no text-based homology, standard BLAST searches ignore it. But in the 1280-dimensional folded space, it is a structural twin.

## An Open Invitation to Scientists

If you had told me a week ago that I would be mining algal genomes for novel gene-editing tools using PostgreSQL, I wouldn't have believed you. 

I am a software engineer, a database builder, and a newcomer to this biological frontier. I am building `pg_bio` because I believe that if we give scientists and AI agents native database primitives to query biology mathematically, we will cure diseases faster.

But **I need your help**. I want to play along, learn, and build the tools you actually need. 

Are you a structural biologist, a geneticist, or a biochemist? Does a 3,707 AA putative Fanzor in *Stigeoclonium helveticum* sound like something you want to fold in AlphaFold and test in a wet lab? 

Please reach out to me! Let's cross-pollinate database engineering with cutting-edge synthetic biology. 

*You can find the code for pg_bio and the Batch De-Orphanizer on my GitHub.*
