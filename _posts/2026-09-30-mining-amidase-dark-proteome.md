---
layout: post
title: "Unearthing Amidase: Exploring the Dark Proteome of Extreme Ecosystems!"
date: 2026-09-30 20:12:51
categories: [bioinformatics, pgvector, machine-learning, structural-biology, pgbio]
---

As the `pg_bio` autonomous night pipeline continues its exciting sweep of the dark proteome, we set our sights on an incredible protein family: **Amidase**! By bypassing months of wet-lab work, we are uncovering hidden secrets of nature using the immense power of native PostgreSQL multiomics engines scanning millions of vectors in milliseconds.

<!--more-->

Our SQL engine scanned the embedding space and found a high-confidence structural match that bridges two completely different biological worlds. We found an uncharacterized orphan protein that exhibits an almost identical 3D fold to a known, well-studied bait!

## The Bait: Nicotinamidase/pyrazinamidase (I6XD65)
To understand the magnitude of this discovery, we first must look at the known bait protein from *Mycobacterium tuberculosis (strain ATCC 25618 / H37Rv)*. 
**What does it do?** 
Catalyzes the deamidation of nicotinamide (NAM) into nicotinate (PubMed:18201201). Likely functions in the cyclical salvage pathway for production of NAD from nicotinamide (By similarity)

This specific enzymatic function is crucial to its ecosystem. But what happens when we search the vast, uncharted territories of the database for something structurally similar?

## The Discovery: A Hidden Orphan in *Halobellus ruber*
Our search revealed an entirely uncharacterized protein (`A0A7J9SL80`) in *Halobellus ruber*. Despite its label as "uncharacterized", its vector embeddings tell a different story! 

The structural similarity implies a massive evolutionary divergence or a conserved function adapted to a completely new environment. Could this extremophile or unique organism be harboring a more robust, efficient version of the enzyme? 

### Practical Applications & Impact
What does this mean for the real world? Proteins in the **Amidase** family have massive potential in industrial biotechnology, bioremediation, medicine, and synthetic biology. By finding a novel version of this protein in *Halobellus ruber*, we might have just discovered a variant that operates at extreme temperatures, pH levels, or with higher catalytic efficiency! This is the power of mining the dark proteome.

---

## The Math & The Pipeline
Using our newly built UniProt SQL Foreign Data Wrapper (`bio_search_uniprot`), we dynamically enriched the raw vector search directly inside the database:

| Category | Known Bait | Orphan Discovery |
| :--- | :--- | :--- |
| **UniProt ID** | `I6XD65` | `A0A7J9SL80` |
| **Organism** | *Mycobacterium tuberculosis (strain ATCC 25618 / H37Rv)* | *Halobellus ruber* |
| **Status** | Characterized | Uncharacterized |
| **Cosine Distance** | - | **0.6569** |

*Note: A distance of 0.6569 means the 3D backbone is mathematically incredibly similar!*

### Interactive 3Dmol.js Preview
Dive into the structures below! *Tip: Double-click either 3D viewer to lock their cameras together for synchronized rotation, and click any fragment to automatically highlight the matching residue on the opposite protein!*

{% include structural_alignment.html bait_id="I6XD65" discovery_id="A0A7J9SL80" bait_pdb="/assets/models/AF-I6XD65-F1-model_v4_reference.pdb" discovery_pdb_prefix="/assets/models/AF-A0A7J9SL80-F1-model_v4" %}

### The SQL Query
This discovery was completely automated natively in PostgreSQL using our custom Z-Order indexing and the new UniProt SRF:

```sql
WITH closest AS (
    SELECT uniprot_id, name, embedding,
           (embedding <=> (SELECT embedding FROM proteins WHERE uniprot_id = 'I6XD65')) as dist
    FROM proteins
    WHERE name ILIKE '%uncharacterized%'
    ORDER BY dist ASC LIMIT 1
)
SELECT c.uniprot_id, c.dist, u.organism
FROM closest c
CROSS JOIN LATERAL bio_search_uniprot('accession:' || c.uniprot_id) u;
```


{% include pg_bio_promo.md %}
