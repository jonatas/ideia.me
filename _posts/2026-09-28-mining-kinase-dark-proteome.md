---
layout: post
title: "Unearthing Kinase: Exploring the Dark Proteome of Extreme Ecosystems"
date: 2026-09-28 12:19:27
categories: [biology, multiomics, synthetic-biology, pgbio]
---

As the `pg_bio` autonomous night pipeline continues its sweep of the dark proteome, we set our sights on **Kinase**. 

Our native PostgreSQL multiomics engine scanned millions of vectors and found a high-confidence structural match that bridges two completely different biological worlds. 

## The Discovery

Using our newly built UniProt SQL Foreign Data Wrapper (`bio_search_uniprot`), we dynamically enriched the raw vector search directly inside the database:

| Category | Known Bait | Orphan Discovery |
| :--- | :--- | :--- |
| **UniProt ID** | `Q63DL7` | `A0A8E7EHV3` |
| **Organism** | *Bacillus cereus (strain ZK / E33L)* | *Methanospirillum purgamenti* |
| **Status** | Characterized | Uncharacterized |
| **Cosine Distance** | - | **0.6632** |

{% include structural_alignment.html bait_id="Q63DL7" discovery_id="A0A8E7EHV3" bait_pdb="/assets/models/AF-Q63DL7-F1-model_v4_reference.pdb" discovery_pdb_prefix="/assets/models/AF-A0A8E7EHV3-F1-model_v4" %}

### The SQL Pipeline

This discovery was completely automated natively in PostgreSQL using our custom Z-Order indexing and the new UniProt SRF:

```sql
WITH closest AS (
    SELECT uniprot_id, name, embedding,
           (embedding <=> (SELECT embedding FROM proteins WHERE uniprot_id = 'Q63DL7')) as dist
    FROM proteins
    WHERE name ILIKE '%uncharacterized%'
    ORDER BY dist ASC LIMIT 1
)
SELECT c.uniprot_id, c.dist, u.organism
FROM closest c
CROSS JOIN LATERAL bio_search_uniprot('accession:' || c.uniprot_id) u;
```

{% include pg_bio_promo.md %}
