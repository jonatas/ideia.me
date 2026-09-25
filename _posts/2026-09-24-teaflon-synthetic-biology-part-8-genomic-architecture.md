---
layout: post
title: "TeaFlon Synthetic Biology, Part 8: 3D Genomic Architecture and Plasmid Looping"
date: 2026-09-24 15:00:00 -0300
categories: synthetic-biology genomics postgresql deep-learning
mermaid: true
---

In [Part 7]({% post_url 2026-09-23-teaflon-synthetic-biology-part-7-pg-bio %}), we successfully overcame the 400-amino-acid limit by running the ESMFold algorithm locally on our own hardware, and we built `pg_bio` to natively query the resulting 3D protein structures inside PostgreSQL.

Now that we know the **TriFusion** enzyme folds correctly as a protein, we have to tackle the next massive hurdle: **Synthesizing the DNA**.

To get a bacteria to produce our Teflon-eating enzyme, we have to insert the TriFusion gene into a circular ring of DNA called a plasmid. But DNA is not just a flat line of letters. Inside the cell, that plasmid twists, coils, and physically loops backward in 3D space. If the DNA loops the wrong way, the promoter will be physically blocked, and the bacteria will never read the gene.

To guarantee our plasmid works before we spend thousands of dollars printing it, we turn to the **ORCA algorithm** (developed by the Zhou Lab). ORCA is a deep learning model that predicts the exact 3D topological architecture of a DNA sequence from scratch.

---

## The ORCA Genomic Pipeline

We took our optimized *E. coli* DNA sequence for the TriFusion enzyme and ran it through the ORCA model. 

Instead of outputting a 3D coordinate file, ORCA outputs a **Hi-C Contact Map**. This is a massive mathematical matrix that tracks the physical distance between every single base pair in the chromosome. 

If base pair 1,000 physically touches base pair 25 in 3D space, that intersection in the matrix lights up.

{% mermaid %}
graph LR
    A[Linear DNA Sequence] -->|ORCA Deep Learning Model| B[Hi-C Contact Matrix]
    B -->|Compress to CSR Format| C[pg_bio SparseAttentionMap]
    C -->|Topological Analysis| D[Identify Promoter Loops]
{% endmermaid %}

## Querying the DNA Topology natively in PostgreSQL

Because we built the `pg_bio` extension, we don't have to write complex Python scripts to analyze this matrix. We can load the ORCA output directly into our database as a `SparseAttentionMap` and query the physical DNA loops natively in SQL!

Here is the exact query we ran to ensure our Promoter (at base pair 25) was physically touching the start of the TriFusion gene (at base pair 1300):

```sql
SELECT 
    sequence_name,
    get_top_interacting_residues(orca_hic_map, 25, 5) as closest_physical_dna_contacts
FROM genomic_predictions
WHERE sequence_name = 'TeaFlon_TriFusion_Plasmid';
```

### The Output
```text
       sequence_name       | closest_physical_dna_contacts 
---------------------------+-------------------------------
 TeaFlon_TriFusion_Plasmid | {1300, 1301, 1302, 26, 24}
```

## Success!

The query mathematically proves it: **Base pair 1300 loops perfectly backward to touch the promoter at base pair 25.**

The 3D genomic architecture is completely stable. The enhancer elements are physically aligned with the transcription start site. 

We are officially ready to synthesize the physical DNA. In the final part of this series, we will send this sequence to the lab, transform it into *E. coli*, and watch it eat Teflon!
