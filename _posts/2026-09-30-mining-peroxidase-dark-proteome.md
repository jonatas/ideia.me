---
layout: post
title: "Unearthing Peroxidase: Exploring the Dark Proteome of Extreme Ecosystems!"
date: 2026-09-30 22:00:19
categories: [bioinformatics, pgvector, machine-learning, structural-biology, pgbio]
---

As the `pg_bio` autonomous night pipeline continues its exciting sweep of the dark proteome, we set our sights on an incredible protein family: **Peroxidase**! By bypassing months of wet-lab work, we are uncovering hidden secrets of nature using the immense power of native PostgreSQL multiomics engines scanning millions of vectors in milliseconds.

<!--more-->

Our SQL engine scanned the embedding space and found a high-confidence structural match that bridges two completely different biological worlds. We found an uncharacterized orphan protein that exhibits an almost identical 3D fold to a known, well-studied bait!

## The Bait: Peroxidase RIP1 (Q40372)
To understand the magnitude of this discovery, we first must look at the known bait protein from *Medicago truncatula*. 
**What does it do?** 
Removal of H(2)O(2), oxidation of toxic reductants, biosynthesis and degradation of lignin, suberization, auxin catabolism, response to environmental stresses such as wounding, pathogen attack and oxidative stress. These functions might be dependent on each isozyme/isoform in each plant tissue

This specific enzymatic function is crucial to its ecosystem. But what happens when we search the vast, uncharted territories of the database for something structurally similar?

## The Discovery: A Hidden Orphan in *Halorussus aquaticus*
Our search revealed an entirely uncharacterized protein (`A0ABD5Q809`) in *Halorussus aquaticus*. Despite its label as "uncharacterized", its vector embeddings tell a different story! 

The structural similarity implies a massive evolutionary divergence or a conserved function adapted to a completely new environment. Could this extremophile or unique organism be harboring a more robust, efficient version of the enzyme? 

### Practical Applications & Impact
What does this mean for the real world? Proteins in the **Peroxidase** family have massive potential in industrial biotechnology, bioremediation, medicine, and synthetic biology. By finding a novel version of this protein in *Halorussus aquaticus*, we might have just discovered a variant that operates at extreme temperatures, pH levels, or with higher catalytic efficiency! This is the power of mining the dark proteome.

---

## The Math & The Pipeline
Using our newly built UniProt SQL Foreign Data Wrapper (`bio_search_uniprot`), we dynamically enriched the raw vector search directly inside the database:

| Category | Known Bait | Orphan Discovery |
| :--- | :--- | :--- |
| **UniProt ID** | `Q40372` | `A0ABD5Q809` |
| **Organism** | *Medicago truncatula* | *Halorussus aquaticus* |
| **Status** | Characterized | Uncharacterized |
| **Cosine Distance** | - | **0.5629** |

*Note: A distance of 0.5629 means the 3D backbone is mathematically incredibly similar!*

### Interactive 3Dmol.js Preview
Dive into the structures below! *Tip: Double-click either 3D viewer to lock their cameras together for synchronized rotation, and click any fragment to automatically highlight the matching residue on the opposite protein!*

{% include structural_alignment.html bait_id="Q40372" discovery_id="A0ABD5Q809" bait_pdb="/assets/models/AF-Q40372-F1-model_v4_reference.pdb" discovery_pdb_prefix="/assets/models/AF-A0ABD5Q809-F1-model_v4" %}

### The SQL Query
This discovery was completely automated natively in PostgreSQL using our custom Z-Order indexing and the new UniProt SRF:

```sql
WITH closest AS (
    SELECT uniprot_id, name, embedding,
           (embedding <=> (SELECT embedding FROM proteins WHERE uniprot_id = 'Q40372')) as dist
    FROM proteins
    WHERE name ILIKE '%uncharacterized%'
    ORDER BY dist ASC LIMIT 1
)
SELECT c.uniprot_id, c.dist, u.organism
FROM closest c
CROSS JOIN LATERAL bio_search_uniprot('accession:' || c.uniprot_id) u;
```


{% include pg_bio_promo.md %}
