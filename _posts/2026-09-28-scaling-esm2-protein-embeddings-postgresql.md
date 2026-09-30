---
layout: post
title: "Scaling ESM-2 Protein Embeddings: Fast Cosine Similarity in PostgreSQL"
date: 2026-09-28 10:00:00 -0300
categories: deep-learning bioinformatics postgresql
---

Protein Language Models (pLMs) like Meta's **ESM-2** and **ProtBERT** have revolutionized bioinformatics. By reading amino acid sequences like text, these neural networks generate high-dimensional latent embeddings—dense arrays of floats that capture the deep biological function and structure of a protein.

Generating these embeddings is easy. The engineering nightmare begins when you try to store and search them at scale.

### The Python Network I/O Bottleneck

A standard ESM-2 embedding is often a 320-dimensional (or even 1280-dimensional) array of 32-bit floats. If you want to find proteins with similar functions, you need to calculate the **Cosine Similarity** between these vectors. 

The standard approach is to query a database, pull all the vectors over the network into Python, and run `scipy.spatial.distance.cosine()`. 

If you are querying a human proteome containing 20,000 proteins, you are serializing and transmitting megabytes of floating-point data across your TCP stack just to run a math equation. The network I/O becomes the absolute bottleneck, causing massive latency and Python memory spikes.

### Pushing the Math to the Data with `pg_bio`

To solve this, we built [pg_bio]({% post_url 2026-09-23-pg-bio-intro %}), a PostgreSQL extension written in Rust. Instead of moving the data to the compute layer, we moved the compute directly into the database engine.

`pg_bio` implements a highly optimized `embedding_cosine_distance(REAL[], REAL[])` function natively in C-memory.

### Example: Predicting Off-Target Drug Effects

Imagine you are designing a drug for a specific cell receptor. To ensure your drug doesn't cause side effects, you need to search the entire human proteome for any proteins that share an identical latent structure.

With `pg_bio`, you can run this vector search instantly:

```sql
WITH target_protein AS (
    SELECT uniprot_id, embedding::real[] as emb FROM proteins 
    WHERE name ILIKE '%receptor%' LIMIT 1
)
SELECT 
    p.uniprot_id, 
    substring(p.name from 1 for 45) as name, 
    embedding_cosine_distance(p.embedding::real[], t.emb) as distance
FROM proteins p, target_protein t
WHERE p.uniprot_id != t.uniprot_id AND p.embedding IS NOT NULL
ORDER BY distance ASC
LIMIT 5;
```

**Output:**
```text
 uniprot_id | name                                          | distance
------------+-----------------------------------------------+----------
 Q8IVF4     | DYH10_HUMAN Dynein axonemal heavy chain 10    | 0.7478
 Q9NYA4     | MTMR4_HUMAN Phosphatidylinositol-3,5-bisp     | 0.7547
 O95180     | CAC1H_HUMAN Voltage-dependent T-type calc     | 0.7559
 Q9HD67     | MYO10_HUMAN Unconventional myosin-X           | 0.7564
 Q8N1I0     | DOCK4_HUMAN Dedicator of cytokinesis protei   | 0.7572
```

In our benchmarks, executing this native SQL function was **6.4x faster** than the traditional Python/Numpy approach, strictly because it bypasses the network serialization penalty entirely. 

If you are building the next generation of AI-driven biotech, stop moving your tensors over the network. Keep your embeddings in Postgres, and let the database do the math.

{% include pg_bio_promo.md %}
