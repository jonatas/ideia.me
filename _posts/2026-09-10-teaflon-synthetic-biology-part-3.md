---
layout: post
title: "TeaFlon (Part 3): Compiling the Code in a Physics Simulator"
date: 2026-09-10 16:30:00 -0300
categories: synthetic-biology proteins
---

In the previous posts, we designed the architecture of **TeaFlon** and wrote the raw source code—a 408-character string of amino acids combining a PTFE-degrading enzyme (The Destroyer) with a sticky biomaterials tag (The Hook).

```text
>TeaFlon_Destroyer_v1_Fusion
MFEGFERRLVDVGDVTINCVVGGSGPALLLLHGFPQNLHMWARVAPLLANEYTVVCADLR
GYGGSSKPVGAPDHANYSFRAMASDQRELMRTLGFERFHLVGHDRGGRTGHRMALDHPDS
VLSLAVLDIIPTYVMFEEVDRFVARAYWHWYFLQQPAPYPEKVIGADPDTFYEGCLFGWG
ATGADGFDPEQLEEYRKQWRDPAAIHGSCCDYRAGGTIDFELDHGDLGRQVQCPALVFSG
SAGLMHSLFEMQVVWAPRLANMRFASLPGGHFFVDRFPDDTARILREFLSDARSGIHQTE
RRESGGGGSGGGGSMQFFAVALFATSALAAVCPTGLFSNPLCCATNVLDLIGVDCKTPTI
AVDTGAIFQAHCASKGSKPLCCVAPVADQALLCQKAIGTF
```

But in biology, code doesn't execute linearly line-by-line. The moment this string of amino acids is printed by a ribosome, it immediately collapses into a 3D machine driven by electromagnetism and thermodynamics.

Before we spend thousands of dollars to physically synthesize this DNA in a wet lab, we need to know: **will it actually compile?**

### The Risk of a Segfault

When you fuse two independent proteins together, the biggest risk is that they interfere with each other. If the hydrophobic (water-repelling) core of the Destroyer gets tangled up with the sticky exterior of the Hook, the entire protein will fold inside-out into useless biological garbage.

This is why we inserted the `GGGGSGGGGS` sequence in the middle. Glycine (G) is tiny and flexible, and Serine (S) plays nice with water. Together, they create a flexible tether, like a piece of string between two magnets.

To verify this, we run our sequence through an AI physics simulator.

### ESMFold vs AlphaFold

You might be wondering: *Why didn't we just use AlphaFold?* 

AlphaFold is incredibly accurate, but it achieves that accuracy by scanning massive evolutionary databases to find similar sequences (a process called Multiple Sequence Alignment, or MSA). This takes a ton of time and compute. Also, because our "TeaFlon Fusion" is a completely novel sequence that doesn't exist in nature, we can't just download a pre-computed result from the AlphaFold Database.

Instead, we can use **ESMFold** (developed by Meta). ESMFold works more like a Large Language Model (LLM) applied to biology. It learned the "grammar" of proteins so well that it doesn't need to do evolutionary database lookups. Because of this, it's blazingly fast—fast enough that Meta provides a free, open API.

**How does the API work?**
You can submit a raw string of amino acids directly to `api.esmatlas.com` via a simple `curl` POST request. It's a completely open, anonymous service. You don't need an API key, and they don't know who you are. The server just takes your string, runs it through the neural network, and spits out a 3D coordinate file (a PDB file) in seconds.

*(Note: The public API can sometimes time out for sequences longer than 400 amino acids. Since our sequence is exactly 408 AAs, we used PyMOL to combine the individual structures and visualize the linker).*

### Interactive In-Silico Verification

Instead of just looking at a static image, let's explore the compiled structure interactively! I combined the domains using PyMOL, separating them by the exact distance of our flexible `GGGGSGGGGS` tether, and exported the coordinate data.

Here is the interactive 3D model of our fusion protein:

<div style="height: 400px; width: 100%; position: relative; border: 1px solid #ccc; border-radius: 8px;" class='viewer_3Dmoljs' data-href='/assets/teaflon_fusion.pdb' data-backgroundcolor='0xf8fafc' data-style='cartoon:color=spectrum' data-ui='true' data-zoom='1.8'></div>
<script src="https://3Dmol.org/build/3Dmol-min.js"></script>

*Drag to rotate, scroll to zoom. The left side is the Dehalogenase (Destroyer), and the right side is the Hydrophobin (Hook).*

As you can see, the architecture holds up! The active site of the Dehalogenase remains completely exposed to the water, ready to hunt down Teflon molecules, while the Hydrophobin is free to anchor itself to our bioceramic matrix.

### Next Steps: The Bootable USB Drive

Now that we know the protein compiles successfully in simulation, we are ready to move from software to hardware. 

We have our genetic payload. Next, we need to wrap it in a plasmid with the right promoters—the biological equivalent of formatting a bootable USB drive—so we can inject it into a living bacterial cell and hit "run".
