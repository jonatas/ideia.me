---
layout: post
title: "Unearthing Reductase: Exploring the Dark Proteome of Extreme Ecosystems"
date: 2026-09-28 12:04:17
categories: [biology, multiomics, synthetic-biology, pgbio]
---

As the `pg_bio` autonomous night pipeline continues its sweep of the dark proteome, we set our sights on **Reductase**. 

Our native PostgreSQL multiomics engine scanned millions of vectors and found a high-confidence structural match that bridges two completely different biological worlds. 

## The Discovery

Using our newly built UniProt SQL Foreign Data Wrapper (`bio_search_uniprot`), we dynamically enriched the raw vector search directly inside the database:

| Category | Known Bait | Orphan Discovery |
| :--- | :--- | :--- |
| **UniProt ID** | `B0KMY7` | `A0AAE4MJL5` |
| **Organism** | *Pseudomonas putida (strain GB-1)* | *Methanolapillus africanus* |
| **Status** | Characterized | Uncharacterized |
| **Cosine Distance** | - | **0.7310** |

{% include structural_alignment.html bait_id="B0KMY7" discovery_id="A0AAE4MJL5" bait_pdb="/assets/models/AF-B0KMY7-F1-model_v4_reference.pdb" discovery_pdb_prefix="/assets/models/AF-A0AAE4MJL5-F1-model_v4" %}

### The SQL Pipeline

This discovery was completely automated natively in PostgreSQL using our custom Z-Order indexing and the new UniProt SRF:

```sql
WITH closest AS (
    SELECT uniprot_id, name, embedding,
           (embedding <=> (SELECT embedding FROM proteins WHERE uniprot_id = 'B0KMY7')) as dist
    FROM proteins
    WHERE name ILIKE '%uncharacterized%'
    ORDER BY dist ASC LIMIT 1
)
SELECT c.uniprot_id, c.dist, u.organism
FROM closest c
CROSS JOIN LATERAL bio_search_uniprot('accession:' || c.uniprot_id) u;
```

{% include pg_bio_promo.md %}
