---
layout: post
title: "Illuminating the Dark Proteome: Discovering Telomerase Homologues in Archaea using pg_bio"
date: 2026-09-25 10:00:00 -0300
categories: bioinformatics postgresql ai structural-biology
mermaid: true
---

There is a vast, uncharted universe inside biological databases known as the **Dark Proteome**—millions of proteins that have been sequenced but never characterized. We don't know what they look like, and we don't know what they do.

Historically, scientists used tools like BLAST to find proteins that look similar based on their amino acid sequence (letters). But what happens when evolution diverges so far that two proteins share only 18% of their sequence, yet still fold into the exact same 3D shape and perform the same job? Sequence alignment fails us; this is known as the **Twilight Zone** of homology.

Today, we'll explore how we used our custom PostgreSQL extension, **`pg_bio`**, coupled with Deep Learning vector embeddings (ESM-2), to search the Dark Proteome by *structure* rather than *sequence*.

## The Mission: Telomerase
We set out to find hidden homologues of **Telomerase**—the enzyme responsible for maintaining the ends of chromosomes. Using `pg_bio`, we loaded the 3D embedding vectors of known Telomerase proteins and performed a massive HNSW (Hierarchical Navigable Small World) index scan against uncharacterized proteins.

The results were instant, and startling.

We discovered an uncharacterized orphan protein in a species of Archaea (*Methanofollis formosanus*, UniProt ID `A0A8G1A137`) that sat remarkably close to the mouse Telomerase Component 1 (`TEP1`, UniProt ID `P97499`) in the high-dimensional latent space.

Let's do a sequence alignment to see if we could have found this the old-fashioned way:

```bash
Bait Length: 2629 aa | Orphan Length: 2227 aa
Global Alignment Score: -71.5
Sequence Identity: 18.49%
Warning: Sequence identity is < 20%. This is in the 'twilight zone' of sequence homology.
```

At **18.49% sequence identity**, traditional sequence alignment like BLAST would likely miss this connection entirely or flag it as noise. But `pg_bio` found it in seconds.

## Visualizing the Architecture (3Dmol.js)

Why did the AI embeddings link them? We couldn't find an AlphaFold model for the new Archaeal orphan because it's so obscure it hasn't been modeled publicly yet! However, analyzing the known bait (TEP1) reveals the secret. 

TEP1 is composed of **WD40 repeats**—massive, all-beta strand structural motifs that fold into circular "beta-propellers". InterPro database predictions confirm our newly discovered Archaea orphan is built of **Parallel beta-helix repeats** (Pectin lyase-like folds). Both are large, repetitive, all-beta solenoids used for macromolecular scaffolding! The neural network successfully clustered their 3D global topologies together.

Let's look at the incredible 3D structure of the Mouse TEP1 Telomerase component. 

### Interactive Structural Breakdown

The beauty of 3D visualization is that we can dissect this massive 2600-amino-acid engine into its core functional parts. `pg_bio` matched this protein to the Archaea orphan specifically because they share **repetitive scaffolding folds**.

Use the interactive controls below to explore the architecture of TEP1 and understand exactly what the AI found:

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
  <button onclick="resetView()" style="padding: 8px 12px; background: #334155; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset View</button>
  <button onclick="highlightBeta()" style="padding: 8px 12px; background: #fbbf24; color: black; border: none; border-radius: 4px; cursor: pointer;">Show Beta Strands (Scaffolding)</button>
  <button onclick="highlightHelices()" style="padding: 8px 12px; background: #38bdf8; color: black; border: none; border-radius: 4px; cursor: pointer;">Show Alpha Helices</button>
  <button onclick="highlightWD40()" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Zoom to WD40 Beta-Propeller</button>
</div>

<div id="tep1-viewer" style="height: 600px; width: 100%; position: relative; border: 1px solid #ccc; border-radius: 8px;"></div>
<script src="https://3Dmol.org/build/3Dmol-min.js"></script>
<script>
  let glviewer = null;

  document.addEventListener("DOMContentLoaded", function() {
    let element = document.querySelector('#tep1-viewer');
    let config = { backgroundColor: '#1e293b' }; // dark background
    glviewer = $3Dmol.createViewer( element, config );
    
    fetch('/assets/AF-P97499-F1-model_v6.cif')
      .then(response => response.text())
      .then(data => {
        glviewer.addModel(data, "cif");
        resetView();
        glviewer.spin("y", 0.2); // Gentle continuous rotation
      });
  });

  // Default coloring: Yellow Beta Strands, Cyan Helices, Gray Loops
  function resetView() {
    glviewer.setStyle({}, {cartoon: {
        colorfunc: function(atom) {
            if(atom.ss === 's') return '#fbbf24'; // Yellow
            if(atom.ss === 'h') return '#38bdf8'; // Cyan
            return '#475569'; // Dark Gray
        }
    }});
    glviewer.spin("y", 0.2); // Resume spin
    glviewer.zoomTo();
    glviewer.zoom(1.2);
    glviewer.render();
  }

  // Highlight only the Beta Strands (The structural scaffolding)
  function highlightBeta() {
    glviewer.setStyle({}, {cartoon: {color: '#334155'}}); // Dim everything
    glviewer.setStyle({ss: 's'}, {cartoon: {color: '#fbbf24'}}); // Emphasize beta strands
    glviewer.spin(false);
    glviewer.render();
  }

  // Highlight only the Alpha Helices
  function highlightHelices() {
    glviewer.setStyle({}, {cartoon: {color: '#334155'}});
    glviewer.setStyle({ss: 'h'}, {cartoon: {color: '#38bdf8'}});
    glviewer.spin(false);
    glviewer.render();
  }

  // Zoom into the massive C-terminal WD40 Beta-Propeller
  function highlightWD40() {
    let wd40_sel = {resi: "2000-2629"};
    let rest_sel = {not: {resi: "2000-2629"}};
    
    glviewer.setStyle(rest_sel, {cartoon: {color: '#334155', opacity: 0.5}});
    glviewer.setStyle(wd40_sel, {cartoon: {color: '#ef4444'}});
    
    glviewer.spin(false);
    glviewer.zoomTo(wd40_sel);
    glviewer.render();
  }
</script>

#### What do these colors mean?
* **<span style="color: #fbbf24; font-weight: bold;">Yellow (Beta-Strands)</span>:** These are flat, sheet-like structures. In TEP1, they arrange themselves into massive circular repeating patterns (Beta-propellers). This is the exact architectural "scaffolding" feature that `pg_bio` detected and linked to the Archaea orphan!
* **<span style="color: #38bdf8; font-weight: bold;">Cyan (Alpha-Helices)</span>:** These coiled, spring-like structures often form the active sites or flexible hinge regions of the protein. 
* **<span style="color: #ef4444; font-weight: bold;">Red (WD40 Propeller)</span>:** When you click "Zoom to WD40", you are isolating the C-terminus of TEP1. This massive ring of beta-strands acts as a docking station for other proteins in the Telomerase complex. This shape is universally used in biology for structural assembly.

## The Power of PostgreSQL + Vectors
By converting protein sequences into structural vectors, `pg_bio` allows scientists to bypass the sequence "twilight zone". We aren't just searching text; we are querying the physical reality of the molecules directly inside the database using optimized `<=>` cosine distance operations.

This workflow guarantees we can:
1. **Find** structural homologues instantly.
2. **Filter** by biological constraints (e.g., sequence length bounds to prevent matching fragments against massive chains).
3. **Validate** through domain architecture (InterPro) and 3D visualization.

The Dark Proteome is no longer dark. With AI embeddings and Postgres, we have a flashlight!
