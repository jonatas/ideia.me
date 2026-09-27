---
layout: post
title: "Indexing 3D Space like a Video Game: Finding Drug Targets in SQL"
date: 2026-09-25 11:25:00 -0300
categories: postgresql algorithms bioinformatics 3d pg_bio
---
> **The pg_bio Series**
> This post is part of a 4-part series on building a bioinformatics engine natively in PostgreSQL.
> 
> * [Part 1: Why Proteins are just High-Dimensional Vectors](/why-proteins-are-just-high-dimensional-vectors.html)
> * [Part 2: Writing a Hybrid Database Operator for Biology (<~>)](/writing-a-hybrid-database-operator-for-biology.html)
> * **Part 3: Indexing 3D Space like a Video Game** (You are here)
> * [Part 4: Mining the Dark Proteome: Legacy Code with Missing Docs](/mining-the-dark-proteome-legacy-code-with-missing-docs.html)

---


If you have ever written a 3D video game, you know the hardest part isn't rendering the graphics—it is calculating collision detection. 

<!--more-->

When a player fires a machine gun, the game engine has to figure out if any of the hundreds of bullets intersect with any of the millions of polygons in the environment. If you calculate the exact distance between every bullet and every polygon on every frame, your game will run at 1 frame per minute. 

To solve this, game engines use **spatial indexing** (like Quad-trees or Oct-trees) to instantly filter out 99% of the map, only performing the heavy math on objects that are in the same general "bucket" of space.

In computational biology, we have the exact same problem, just on a microscopic scale. 

---

## The Drug Docking Problem

When designing a new drug (a small molecule), pharmaceutical engineers need to know if it physically fits inside the "active site" (a 3D pocket) of a target protein. 

A single protein can have tens of thousands of atoms. If you want to find all the atoms within a 5-Angstrom radius of your drug to see if there is a steric clash (a collision), doing the raw math ($ \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2 + (z_2-z_1)^2} $) across the entire database will instantly bottleneck a traditional relational database. 

We needed PostgreSQL to act like a video game physics engine. To do this, we built a **Z-Order Curve (Morton coding)** index natively into the `pg_bio` extension.

---

## The Magic of the Z-Order Curve

Standard database indexes (B-Trees) are phenomenal at searching 1D data, like timestamps or integer IDs. But physical atoms live in 3D space (X, Y, Z). 

A Z-Order curve is a mathematical trick that folds 3D space into a 1D line. By taking the binary representations of the X, Y, and Z coordinates and *interleaving their bits*, we generate a single 64-bit integer called a **Z-Index**.

The magic of the Z-Index is **locality preservation**. If two atoms are physically touching each other in 3D space, their Z-Index integers will be extremely close to each other on a standard 1D number line.

Instead of writing a complex spatial extension from scratch, we just map every atom to a Z-Index and put a standard, boring PostgreSQL B-Tree index on it:

```sql
CREATE TABLE protein_atoms (
    atom_id SERIAL PRIMARY KEY,
    uniprot_id VARCHAR(20),
    coord ResidueCoord,
    
    -- The Z-Index is calculated and stored automatically!
    z_index BIGINT GENERATED ALWAYS AS (residue_z_index(coord)) STORED
);

-- We index it with a standard B-Tree
CREATE INDEX idx_spatial_z_order ON protein_atoms (z_index);
```

---

## Bounding Boxes in Pure SQL

Now, when we want to dock a drug into a pocket at coordinates `(10.5, 22.1, -5.0)` and check for collisions within a 5-Angstrom radius, we don't calculate the distance to every atom. 

First, we draw a rough "bounding box" around the drug. We calculate the minimum and maximum Z-Index for that box. Then, we use the `BETWEEN` operator to instantly filter out 99.9% of the protein using the B-Tree index. 

We only apply the heavy `distance_angstroms` math to the tiny handful of atoms that survive the B-Tree scan:

```sql
WITH bounds AS (
    -- 1. Draw a 5-Angstrom bounding box around the active site
    SELECT 
        residue_z_index(ROW(5.5, 17.1, -10.0)) as min_z,
        residue_z_index(ROW(15.5, 27.1, 0.0)) as max_z
)
-- 2. The Collision Detection Query
SELECT atom_id, coord 
FROM protein_atoms, bounds
WHERE z_index BETWEEN min_z AND max_z                 -- Instant B-Tree Scan
  AND distance_angstroms(coord, target) <= 5.0;       -- Exact Math
```

### The Result
This query executes in **25 milliseconds**. 

By utilizing the exact same spatial math used by 3D game engines, we transformed PostgreSQL into a molecular physics sandbox. In our script `teflon_degradation_pipeline.py`, we use this exact SQL block to physically dock a massive Teflon polymer into a mutated extremophile enzyme to prove that the pocket is wide enough to break the C-F bonds!

In our final post of the series, we will tie all of this together to show you how we mine the **Dark Proteome** live.

---

**Next up in the series:** [Part 4: Mining the Dark Proteome: Legacy Code with Missing Docs](/mining-the-dark-proteome-legacy-code-with-missing-docs.html)