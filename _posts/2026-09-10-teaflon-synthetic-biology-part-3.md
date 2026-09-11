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

To verify this, we run our sequence through an AI physics simulator (like ESMFold or AlphaFold).

### In-Silico Verification

Instead of waiting weeks for a lab, we can compile the protein *in-silico* in seconds. I wrote a quick PyMOL script to visualize the predicted 3D structure of our fusion protein, highlighting the two separate domains.

![TeaFlon Fusion Protein Concept](/images/teaflon_fusion_concept.png)

*The Destroyer (Dehalogenase) is shown in red, while the Hook (Hydrophobin) is shown in blue. The dashed line represents the flexible `GGGGS` linker keeping them separated.*

As you can see, the architecture holds up! The linker provides enough distance (up to ~35 Ångstroms) for both domains to fold independently. The active site of the Dehalogenase remains completely exposed to the water, ready to hunt down Teflon molecules, while the Hydrophobin is free to anchor itself to our bioceramic matrix.

### Next Steps: The Bootable USB Drive

Now that we know the protein compiles successfully in simulation, we are ready to move from software to hardware. 

We have our genetic payload. Next, we need to wrap it in a plasmid with the right promoters—the biological equivalent of formatting a bootable USB drive—so we can inject it into a living bacterial cell and hit "run".
