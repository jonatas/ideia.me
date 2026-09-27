---
layout: post
title: "Analyzing 3D Genomic Architecture and Hi-C Contact Maps with SQL"
date: 2026-09-29 10:00:00 -0300
categories: genomics postgresql data-engineering deep-learning
---

The human genome is not a flat, 2D string of letters. Inside the nucleus, DNA twists, folds, and loops back on itself in complex 3D topological structures. This architecture is critical: a piece of DNA (an Enhancer) can physically loop backward in 3D space to touch a gene (a Promoter) located millions of base pairs away, turning that gene on or off.

To study this, geneticists use **Hi-C Sequencing** or deep learning prediction models like **ORCA**, which output massive "Contact Maps". 

### The $N \times N$ Matrix Problem

A Hi-C Contact Map is a giant $N \times N$ matrix tracking the physical distance between every single base pair in a chromosome. For large genomes, these matrices are gigabytes in size. Most of the matrix is empty (zeros), because most base pairs never touch each other.

Loading `.hic` or `.cool` files into R or Python to find specific enhancer-promoter loops requires massive amounts of RAM. 

### Enter `pg_bio`: Relational Topologies

Instead of treating the genome as a flat file, we can treat it as a relational graph using [pg_bio]({% post_url 2026-09-23-pg-bio-intro %}). 

`pg_bio` introduces the `SparseAttentionMap` PostgreSQL type. Under the hood, this uses a **Compressed Sparse Row (CSR)** structure natively in Rust. It entirely discards the empty space (the zeros) and only stores the exact base pairs that are physically interacting.

### Mining for Genomic Loops in SQL

By storing the genomic architecture in PostgreSQL, finding complex 3D DNA loops becomes a trivial SQL query. 

If we want to ask the database: *"Which base pairs are physically wrapping around and touching the Promoter located at base pair 25?"*, we can use the `get_top_interacting_residues` function:

```sql
SELECT 
    sequence_name,
    get_top_interacting_residues(orca_hic_map, 25, 5) as closest_physical_dna_contacts
FROM genomic_predictions
WHERE sequence_name = 'Synthetic_Plasmid_Construct';
```

**Output:**
```text
       sequence_name       | closest_physical_dna_contacts 
---------------------------+-------------------------------
 Synthetic_Plasmid_Construct | {1300, 1301, 1302, 26, 24}
```

In a fraction of a second, the database proves that base pair 1300 is physically touching base pair 25. 

By pushing 3D genomic matrices into a highly optimized PostgreSQL extension, computational biologists can instantly join topological data against their existing gene annotation tables, mapping the regulatory network of the cell using nothing but standard SQL.
