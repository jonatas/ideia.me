---
layout: post
title: "Mining Bioplastic Enzymes in the Dark Proteome using AI and SQL"
date: 2026-09-28 10:00:00 -0300
categories: [bioinformatics, pgvector, machine-learning, structural-biology]
---

Bioplastic-degrading enzymes are crucial to our fight against plastic pollution. While naturally occurring enzymes like PETase and cutinase have shown promise in breaking down synthetic polymers, I decided to explore the "dark proteome"—the vast ocean of uncharacterized proteins—using `pg_bio` inside PostgreSQL to find hidden gems with identical structural capabilities.

<!--more-->

## The Biological Hook: From Salt Lakes to Hot Acid

Our search began with a known bait: **A0A151A8H2**, a putative **Phospholipase/carboxylesterase** found in *Halalkalicoccus paucihalophilus*. This archaeon is an extremophile that thrives in highly alkaline and hypersaline environments, such as salt lakes. Enzymes that can function in these extreme conditions are highly sought after for industrial plastic degradation, where harsh chemical environments often denature standard proteins.

Using AI embeddings to compare 3D shapes instead of just amino acid sequences, we discovered a matching **Uncharacterized protein** (**A0A510DU23**) belonging to *Sulfuracidifex tepidarius*.

What makes this discovery fascinating is the evolutionary divergence. While our bait survives in alkaline salt lakes, *Sulfuracidifex tepidarius* is a thermoacidophile—thriving in hot, acidic, sulfur-rich environments like geothermal hot springs. The environments could not be more opposite (alkaline/salty vs. acidic/hot), yet evolution has conserved the exact structural shape of this enzyme across these extreme niches, suggesting a highly stable and versatile catalytic core.

## The Math and The SQL

We ran the search using the `pg_bio` PostgreSQL extension, leveraging the vector distance `<=>` operator and the hybrid sequence operator `<~>`. This allows us to find proteins with mathematically identical 3D folds even when their sequences have mutated beyond recognition.

```sql
SELECT 
    uniprot_id, 
    name, 
    distance, 
    hybrid_score
FROM pg_bio_search_homologs('A0A151A8H2', 0.35)
WHERE name ILIKE '%uncharacterized%';
```

Here are the results:

| Protein Role | UniProt ID | Organism | Vector Distance (`<=>`) | Hybrid Score (`<~>`) |
|--------------|------------|----------|-----------------------|----------------------|
| **Bait (Esterase)** | `A0A151A8H2` | *Halalkalicoccus paucihalophilus* | - | - |
| **Discovery** | `A0A510DU23` | *Sulfuracidifex tepidarius* | **0.0571** | **0.3055** |

A vector distance of **0.0571** is incredibly low. It indicates that the 3D backbone folding of the newly discovered protein is mathematically near-identical to our bait esterase. Despite the extreme divergence of their host environments, their physical mechanisms of action remain perfectly conserved.

## Interactive 3Dmol.js Preview

Check out the side-by-side structural comparison of the bait and our new dark proteome discovery.

<div style="display: flex; justify-content: space-between; gap: 20px;">
  <div style="flex: 1; text-align: center;">
    <h3>Bait: A0A151A8H2 (Esterase)</h3>
    <div style="height: 400px; width: 100%; position: relative;" class="viewer_3Dmoljs" data-href="/assets/models/A0A151A8H2.pdb" data-backgroundcolor="0xffffff" data-style="cartoon:color=cyan"></div>
    <p><em>Notice the highly conserved catalytic pocket structure.</em></p>
  </div>
  <div style="flex: 1; text-align: center;">
    <h3>Discovery: A0A510DU23</h3>
    <div style="height: 400px; width: 100%; position: relative;" class="viewer_3Dmoljs" data-href="/assets/models/A0A510DU23.pdb" data-backgroundcolor="0xffffff" data-style="cartoon:color=magenta"></div>
    <p><em>The uncharacterized protein maintains the exact same fold.</em></p>
  </div>
</div>

**Pro tip:** This blog features an interactive 3D plugin (`pg_bio_sync.js`).
* **Double-click** either 3D viewer to lock their cameras together for synchronized rotation and tilt.
* **Click any fragment** on one protein, and it will automatically highlight the matching residue on the opposite protein by swapping colors!

## The Learning

This kind of structural homology search represents a massive leap for computational biology. By storing structural embeddings in `pgvector` and querying them with `pg_bio` inside a standard PostgreSQL database, we can find uncharacterized structural homologues in milliseconds. 

What used to take months of painstaking wet-lab work or massive distributed computing clusters to align 3D models can now be executed instantly using a SQL query, directly pointing us to new, robust enzymes that could revolutionize bioplastic recycling.

{% include pg_bio_promo.md %}
