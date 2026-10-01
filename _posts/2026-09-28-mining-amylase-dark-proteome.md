---
layout: post
title: "Unearthing Amylase: Exploring the Dark Proteome of Extreme Ecosystems"
date: 2026-09-28 10:31:18
categories: [biology, multiomics, synthetic-biology, pgbio]
---

As the `pg_bio` autonomous night pipeline continues its sweep of the dark proteome, we set our sights on **Amylase**. 

Our native PostgreSQL multiomics engine scanned millions of vectors and found a high-confidence structural match that bridges two completely different biological worlds. 

## The Discovery

Using our newly built UniProt SQL Foreign Data Wrapper (`bio_search_uniprot`), we dynamically enriched the raw vector search directly inside the database:

| Category | Known Bait | Orphan Discovery |
| :--- | :--- | :--- |
| **UniProt ID** | `Q8H4L8` | `A0AAX4NIZ0` |
| **Organism** | *Oryza sativa subsp. japonica* | *Oxyplasma meridianum* |
| **Status** | Characterized | Uncharacterized |
| **Cosine Distance** | - | **0.6688** |

{% include structural_alignment.html bait_id="Q8H4L8" discovery_id="A0AAX4NIZ0" bait_pdb="/assets/models/AF-Q8H4L8-F1-model_v4_reference.pdb" discovery_pdb_prefix="/assets/models/AF-A0AAX4NIZ0-F1-model_v4" %}

### The SQL Pipeline

This discovery was completely automated natively in PostgreSQL using our custom Z-Order indexing and the new UniProt SRF:

```sql
WITH closest AS (
    SELECT uniprot_id, name, embedding,
           (embedding <=> (SELECT embedding FROM proteins WHERE uniprot_id = 'Q8H4L8')) as dist
    FROM proteins
    WHERE name ILIKE '%uncharacterized%'
    ORDER BY dist ASC LIMIT 1
)
SELECT c.uniprot_id, c.dist, u.organism
FROM closest c
CROSS JOIN LATERAL bio_search_uniprot('accession:' || c.uniprot_id) u;
```

{% include pg_bio_promo.md %}
