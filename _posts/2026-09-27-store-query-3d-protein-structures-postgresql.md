---
layout: post
title: "How to Store and Query 3D Protein Structures in PostgreSQL (Moving Beyond PDB Files)"
date: 2026-09-27 10:00:00 -0300
categories: bioinformatics postgresql rust data-engineering
---

For decades, computational biologists have relied on the `.pdb` (Protein Data Bank) file format to store 3D biological structures. While PDB files are standard, querying them at scale is a well-known bottleneck. 

If you want to find all atoms within a 5-Ångstrom radius of a specific drug-binding pocket across 10,000 proteins, you typically have to write a Python script using libraries like `BioPython` or `MDAnalysis`. The script loads each flat file into memory, extracts the coordinates, and calculates the Euclidean distance across millions of atoms. Because this Euclidean calculation scales at $O(N^2)$ complexity, it is notoriously slow.

What if you could ditch the flat files and query 3D biological space natively in SQL? 

In this tutorial, we will explore how the [pg_bio](https://github.com/jonatas/pg_bio) PostgreSQL extension—written in Rust—allows you to store, index, and query 3D biological space natively.

---

## 1. The Math: Solving the Spatial Bottleneck with Z-Order Curves

Calculating the 3D distance $ \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2} $ for millions of rows on every single query is too heavy for a standard database. 

To solve this, `pg_bio` utilizes **Morton Coding (Z-Order curves)**.

When you insert an atom into the database, `pg_bio` takes the 3D floating-point coordinates (X, Y, Z) and interleaves their binary bits into a single 63-bit integer (`z_index`). 

**The Formula Concept:**
If $X = 101_2$, $Y = 011_2$, and $Z = 100_2$, the Morton Code interleaves them bit-by-bit: $Z_1 Y_1 X_1 Z_2 Y_2 X_2 Z_3 Y_3 X_3$.
This mathematically compresses 3D space into a 1D line while preserving spatial locality. Atoms that are physically close in 3D space receive integer values that are mathematically close to each other.

Because the data is now a 1D integer, PostgreSQL can index it using a standard, lightning-fast B-Tree.

---

## 2. Table Creation and Schema

Let's look at how we structure the database to support this. `pg_bio` introduces a custom data type called `residuecoord` to safely encapsulate atomic coordinates and their metadata.

Here is the exact Data Definition Language (DDL) we use to create our `protein_atoms` table:

```sql
CREATE TABLE protein_atoms (
    atom_id SERIAL PRIMARY KEY,
    uniprot_id VARCHAR(20) REFERENCES proteins(uniprot_id),
    coord residuecoord,
    -- We automatically generate the Z-Order Morton Code upon insertion
    z_index BIGINT GENERATED ALWAYS AS (residue_z_index(coord)) STORED
);

-- We then create a lightning-fast B-Tree index on the 1D integer
CREATE INDEX idx_spatial_z_order ON protein_atoms(z_index);
```

By leveraging PostgreSQL's `GENERATED ALWAYS AS` feature, the 3D-to-1D conversion happens invisibly in the background every time new data arrives.

---

## 3. Populating the Data

To insert data into this table, we use the custom `create_residue_coord` constructor provided by the `pg_bio` extension. This function takes the X, Y, and Z floats, plus the atom name (like 'CA' for Carbon Alpha).

```sql
INSERT INTO protein_atoms (uniprot_id, coord)
VALUES (
    'P53_HUMAN', 
    create_residue_coord(10.5, 12.0, 8.1, 'CA')
);
```

As soon as this `INSERT` executes, the Rust backend intercepts the `residuecoord` and calculates the `z_index` automatically. 

---

## 4. Basic Querying & Comprehension

Let's query the database to see what actually got saved. 

```sql
SELECT 
    uniprot_id, 
    coord, 
    z_index 
FROM protein_atoms 
LIMIT 1;
```

**The Output:**
```text
 uniprot_id |                  coord                  |      z_index      
------------+-----------------------------------------+--------------------
 P53_HUMAN  | {"x":10.5,"y":12.0,"z":8.1,"name":"CA"} | 144110936201920832
```

Notice how `pg_bio` neatly serializes the `residuecoord` into a readable JSON-like structure. But the real magic is the `z_index`. That massive integer (`144110936201920832`) is the specific 3D physical sector in space where this atom lives, calculated down to the bit!

---

## 5. Advanced Exploration: Mining a 3D Binding Pocket

Now for the real power of `pg_bio`. Imagine you are designing a drug, and you need to find all atoms physically located inside a 5x5x5 Ångstrom cubic bounding pocket around coordinates $(10, 10, 10)$ to $(15, 15, 15)$.

Instead of doing Euclidean math, we ask the B-Tree to find integers that fall between our two physical extremes!

```sql
SELECT atom_id, coord
FROM protein_atoms
WHERE z_index BETWEEN residue_z_index(create_residue_coord(10, 10, 10, '')) 
                  AND residue_z_index(create_residue_coord(15, 15, 15, ''))
LIMIT 5;
```

**The Output:**
```text
 atom_id |                      coord                      
---------+-------------------------------------------------
 3598256 | {"x":10.147,"y":10.016,"z":10.068,"name":"HZ3"}
 2116645 | {"x":10.380,"y":10.770,"z":10.353,"name":"N"}
 3607774 | {"x":10.213,"y":10.445,"z":10.823,"name":"HG2"}
 2273489 | {"x":10.801,"y":10.222,"z":10.819,"name":"CB"}
 2423006 | {"x":9.975, "y":10.710,"z":10.835,"name":"N"}
```

Because the B-Tree index instantly jumps to the correct physical sector using standard integer logic, this query executes in **~7 milliseconds** on a dataset of millions of atoms. 

### Exploring Further
We encourage you to go further! Try building complex topological queries. What if you `JOIN` this `protein_atoms` table against a gene annotations table? You could instantly find all "Cancer-associated mutations" that occur within 3 Ångstroms of a drug target, across the entire human proteome. The possibilities are endless when you move biology into SQL.

**Want to try it yourself?** Check out the open-source extension and dive into the Rust implementation here: 
👉 **[pg_bio on GitHub](https://github.com/jonatas/pg_bio)**

{% include pg_bio_promo.md %}
