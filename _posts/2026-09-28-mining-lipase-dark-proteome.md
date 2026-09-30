---
layout: post
title: "Unearthing Lipase: Exploring the Dark Proteome of Extreme Ecosystems"
date: 2026-09-28 11:17:16
categories: [biology, multiomics, synthetic-biology, pgbio]
---

As the `pg_bio` autonomous night pipeline continues its sweep of the dark proteome, we set our sights on **Lipase**. 

Our native PostgreSQL multiomics engine scanned millions of vectors and found a high-confidence structural match that bridges two completely different biological worlds. 

## The Discovery

Using our newly built UniProt SQL Foreign Data Wrapper (`bio_search_uniprot`), we dynamically enriched the raw vector search directly inside the database:

| Category | Known Bait | Orphan Discovery |
| :--- | :--- | :--- |
| **UniProt ID** | `A0A075LRU3` | `A0A133VEI6` |
| **Organism** | *Palaeococcus pacificus DY20341* | *candidate division MSBL1 archaeon SCGC-AAA382A13* |
| **Status** | Characterized | Uncharacterized |
| **Cosine Distance** | - | **0.0713** |

<div style="display: flex; justify-content: space-between; gap: 20px;">
  <div style="flex: 1;">
    <h4>Bait: A0A075LRU3</h4>
    <div style="height: 400px; width: 100%; position: relative;" class="viewer_3Dmoljs" data-href="/assets/models/AF-A0A075LRU3-F1-model_v4.pdb" data-backgroundcolor="0xffffff" data-style="cartoon:color=cyan"></div>
  </div>
  <div style="flex: 1;">
    <h4>Discovery: A0A133VEI6</h4>
    <div style="height: 400px; width: 100%; position: relative;" class="viewer_3Dmoljs" data-href="/assets/models/AF-A0A133VEI6-F1-model_v4.pdb" data-backgroundcolor="0xffffff" data-style="cartoon:color=magenta"></div>
  </div>
</div>

### The SQL Pipeline

This discovery was completely automated natively in PostgreSQL using our custom Z-Order indexing and the new UniProt SRF:

```sql
WITH closest AS (
    SELECT uniprot_id, name, embedding,
           (embedding <=> (SELECT embedding FROM proteins WHERE uniprot_id = 'A0A075LRU3')) as dist
    FROM proteins
    WHERE name ILIKE '%uncharacterized%'
    ORDER BY dist ASC LIMIT 1
)
SELECT c.uniprot_id, c.dist, u.organism
FROM closest c
CROSS JOIN LATERAL bio_search_uniprot('accession:' || c.uniprot_id) u;
```

{% include pg_bio_promo.md %}
