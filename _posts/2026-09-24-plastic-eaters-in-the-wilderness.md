---
layout: post
title: "Plastic Eaters in the Wilderness: Discovering Novel Cutinases with pg_bio"
date: 2026-09-24 21:50:00 -0300
categories: [bioinformatics, AI, postgres, pgvector, synthetic-biology, bioremediation]
---

In my [previous post](/bioinformatics/ai/postgres/pgvector/synthetic-biology/2026/09/24/fanzors-in-the-dark-proteome.html), we used our local native PostgreSQL extension, `pg_bio`, and Anthropic-style structural embeddings to discover novel Fanzors (eukaryotic CRISPR cousins) hiding in the genome of green algae. Today, the mining script struck gold again—this time, targeting one of the biggest environmental crises on Earth.

We ran our `batch_deorphanizer.py` script to mine the dark proteome for **Cutinases**. 

Cutinases are an incredibly important family of enzymes. While they evolved to break down cutin (the waxy polymer covering plant leaves), scientists recently discovered they have an extraordinary superpower: they are uniquely capable of degrading **PET plastic**. These molecular machines are currently at the absolute forefront of synthetic biology and bioremediation research, as bioengineers race to optimize them to eat our plastic waste.

## The Discovery: An Orphan Yeast Protein

When we queried the database for the structural embedding of known cutinases, we found a staggering match:

```text
CUTI2_ASPFN Probable cutinase 2 -> YEN1_SCHPO (Distance: 0.3371)
```

The script mathematically bridged `CUTI2_ASPFN` (a known cutinase) to an uncharacterized orphan protein: `YEN1_SCHPO` (*Uncharacterized serine-rich protein C11G7.01*). 

What makes this so exciting? `YEN1_SCHPO` is found in *Schizosaccharomyces pombe*, a species of fission yeast. Finding an entirely uncharacterized yeast protein that structurally maps to a known plastic-eating enzyme family at a vector distance of `0.3371` is huge. Because yeasts are extraordinarily well-understood and easy to culture industrially, discovering a native yeast protein with cutinase-like folding could open massive new doors for scalable bioremediation.

## Venturing into the True Wilderness

This discovery is thrilling, but it comes with a major caveat: we found `YEN1_SCHPO` inside **Swiss-Prot**. 

Swiss-Prot contains roughly 575,000 proteins. In the grand scheme of biology, this is the "clean, well-lit street." Every protein in Swiss-Prot is manually annotated and reviewed by human curators. It's safe, structured, and manageable. 

But biology doesn't live on the well-lit street. It lives in the wild.

Our next major milestone for `pg_bio` is to scale beyond Swiss-Prot and venture into the **True Wilderness**: the **TrEMBL database**. 

TrEMBL contains over **250 million** unreviewed, automatically translated proteins. This is where the real magic hides. Out there in the mathematical dark, embedded within those 250 million vectors, are thousands of glowing proteins waiting to be discovered: novel plastic-eaters from extremophiles, exotic enzymes from deep-sea organisms, and biological circuits we can't even dream of yet.

By leveraging `pgvector` and HNSW indexes at the hundreds-of-millions scale, we are building the database infrastructure needed to map this wilderness. The search for the ultimate plastic-eating enzyme is just getting started.

If you are a structural biologist or bioremediation researcher interested in testing `YEN1_SCHPO`, reach out! Let's clean up the world with PostgreSQL.
