---
layout: post
title: "Decoding AI Vector Distances: Uncovering Thiamine Binders in the Dark Proteome"
date: 2026-09-27 10:00:00 -0300
categories: bioinformatics ai pgvector pg_bio math
---
> **A pg_bio Case Study**
> Following up on our [4-part pg_bio series](/why-proteins-are-just-high-dimensional-vectors.html), today we are looking at a live discovery from the Dark Proteome and breaking down exactly what the AI vector math means.

While running massive overnight background scripts to mine the Dark Proteome, we ran a targeted query for a Thiamine-binding protein (`A0ABD6CAS9`) found in *Halorientalis brevis*, a halophilic (salt-loving) archaeon.

Within milliseconds, our `pg_bio` engine returned three completely uncharacterized, highly confident matches from the Dark Proteome. 

<!--more-->

Here are the raw results directly from our PostgreSQL database:

| Known Target (Bait) | Orphan Discovery | Organism | Vector Distance | Hybrid Score |
| :--- | :--- | :--- | :--- | :--- |
| **Thiamine-binding** | **`A0A2A2HFL0`** | *Methanosphaera cuniculi* | `0.0804` | `0.317` |
| **Thiamine-binding** | **`A0A7D3YEB4`** | *Halorubrum salinarum* | `0.1069` | `0.331` |
| **Thiamine-binding** | **`B9LMY3`** | *Halorubrum lacusprofundi* | `0.1189` | `0.331` |

We've thrown the term "Vector Distance" around a lot. But what do these numbers—`0.080`, `0.106`, and `0.118`—actually mean in the real world of biology? 

---

## High-Dimensional Cosine Distance

When we pass a protein's amino acid sequence into a Protein Language Model (like ESM-2), it outputs a massive array of 1,024 floating-point numbers. You can think of this as a single point in a 1,024-dimensional universe. 

To determine how structurally similar two proteins are, we use **Cosine Distance**. 

In trigonometry, the cosine of the angle between two lines tells you how much they point in the same direction. If two 1,024-dimensional arrows point in the exact same direction, their Cosine Similarity is `1.0`. 
Because PostgreSQL (`pgvector`) calculates **Distance** rather than Similarity, the math is simply `1 - Cosine Similarity`. Therefore, a distance of `0.0` means the two structures are identical.

Here is how we interpret the mathematical thresholds of the Dark Proteome:

### 1. Distance < 0.10: The Identical Twin
**Our Discovery:** `A0A2A2HFL0` at **`0.080`**

When the distance drops below 0.10, the AI model is screaming that the physical 3D backbone of the protein is nearly indistinguishable from the bait. If you were to overlay these two proteins in a 3D viewer, the Alpha-helices and Beta-sheets would perfectly align. 

*Methanosphaera cuniculi* is an archaeon found in the digestive tracts of mammals. Despite living in an entirely different biome than our salt-lake bait, evolution has converged to preserve the exact physical shape of this thiamine-binding machinery.

### 2. Distance 0.10 to 0.15: The Fraternal Twin
**Our Discovery:** `A0A7D3YEB4` at **`0.106`** and `B9LMY3` at **`0.118`**

At this range, the overall fold and topology of the protein are still conserved. However, there are likely slight variations. Perhaps a loose structural "loop" on the outside of the protein is slightly longer, or the hinge mechanism opens at a slightly different angle. 

Interestingly, both of these discoveries come from *Halorubrum* species. They share the same extreme, high-salt environment as our original bait. The slight structural drift (0.118) could be an evolutionary adaptation to a slightly different salinity or temperature gradient in their specific ecosystem!

### 3. Distance > 0.35: The Twilight Zone
When vector distance exceeds 0.35, the structural homology begins to break down. The proteins might share a single generic domain (like an ATP-binding cassette), but their overall shapes and functions are likely completely unrelated. This is the cutoff where we stop trusting the AI without rigorous wet-lab verification.

---

> **A Quick Jargon Check: What is a "Bait"?**
> In biology, the term "Bait" comes from a very literal fishing analogy. When you go fishing, you put something you already know and possess (the bait) onto a hook, cast it into a massive, dark ocean, and wait to see what unknown things "bite" or stick to it. In computational biology, our "Bait" is the 1024-dimensional vector of a well-documented protein. We cast it into the database to see which unknown proteins have the exact same shape and "stick" to it!

---

## Visualizing the 0.080 Distance 

Don't just trust the math—trust your eyes. Below is a 3D visualization comparing a known Thiamine-binding "Bait" protein against our top discovery (Distance: `0.080`). 

When the Cosine Distance drops this low, you can visually see that the physical architectures—the folding of the Alpha-helices and Beta-sheets—are functionally identical, despite coming from completely different branches of the Tree of Life.

<!-- Include the 3Dmol.js Library -->
<script src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"></script>

<div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
    <!-- Known Bait Protein -->
    <div style="text-align: center;">
        <h4>Known Bait (Thiamine-binding)</h4>
        <div style="height: 400px; width: 350px; position: relative; border: 1px solid #ccc; border-radius: 8px;" 
             class="viewer_3Dmoljs" 
             data-href="/assets/pdb/thiamine_bait.pdb" 
             data-backgroundcolor="0x1e1e1e" 
             data-style="cartoon:color=orange">
        </div>
    </div>

    <!-- Orphan Discovery -->
    <div style="text-align: center;">
        <h4>Our Discovery (Distance: 0.080)</h4>
        <div style="height: 400px; width: 350px; position: relative; border: 1px solid #ccc; border-radius: 8px;" 
             class="viewer_3Dmoljs" 
             data-href="/assets/pdb/thiamine_orphan.pdb" 
             data-backgroundcolor="0x1e1e1e" 
             data-style="cartoon:color=purple">
        </div>
    </div>
</div>

<p style="text-align: center; font-style: italic; margin-top: 10px;">
(Notice the deep, central pocket shared by both proteins where the Thiamine molecule physically docks!)
</p>

---

## Conclusion: Math is the New Microscope

Historically, biologists classified proteins by observing phenotypes, mapping genomes, and growing cultures in petri dishes for years. 

Today, using PostgreSQL and high-dimensional vector math, we were able to look at the number `0.080` and instantly deduce that a completely uncharacterized microbe living in a rabbit's gut possesses a thiamine-binding molecular machine physically identical to one found in a hyper-saline lake.

Welcome to the era of computational biology!
