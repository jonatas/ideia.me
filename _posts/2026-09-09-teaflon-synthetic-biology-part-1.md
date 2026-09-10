---
layout: post
title: "TeaFlon Part 1: Designing a Synthetic Enzyme to Digest Teflon"
date: 2026-09-09 18:12:00 -0300
categories: synthetic-biology
---

*This is a live-log of my journey into synthetic biology, learning how to engineer novel proteins with AI.*

Teflon (Polytetrafluoroethylene, or PTFE) is one of the most indestructible plastics on Earth. It's a long chain of carbon atoms completely saturated by fluorine atoms. The Carbon-Fluorine (C-F) bond is the strongest single bond in organic chemistry, making Teflon almost entirely inert (if you want to know more about its wild history and the controversy surrounding its production, I highly recommend watching this [amazing deep dive by Veritasium](https://www.youtube.com/watch?v=SC2eSujzrUY)).

My goal? To build **TeaFlon**: a synthetic fusion protein designed to stick to Teflon, snap the C-F bonds, and capture the toxic fluoride ions to grow a microscopic bioceramic (like tooth enamel).

### A Quick Primer: Proteins and Amino Acids
If you are a software developer, think of a protein as a compiled, executable program. But instead of binary (1s and 0s), the source code is written in **DNA** (A, C, T, G). 

When the cell compiles this DNA, it translates it into a chain of **Amino Acids**. There are 20 different amino acids (the "Lego bricks" of biology), each with unique chemical properties—some are positively charged, some are negatively charged, and some repel water. 

When you string these amino acids together, they magnetically push and pull on each other, instantly folding into a highly complex, 3D nanomachinery. By changing the sequence of the amino acids, we can physically program the exact 3D shape and function of the machine.

Here is how we architected the TeaFlon system using AI and structural biology.

### Step 1: Finding Nature's Tools
Nature doesn't eat Teflon, but it does break C-F bonds. We turned to the UniProt database to find our templates:
1. **The "Fluorine Scissor":** Fluoroacetate Dehalogenase. This is an enzyme found in bacteria (like *Burkholderia sp.*) that naturally breaks single C-F bonds in toxic plants.
2. **The "Hook":** Class II Hydrophobin. Fungi use this tiny protein to aggressively stick to highly water-repellent (hydrophobic) surfaces. This is our anchor.

### Step 2: The Chemistry of the Scissor

How does the Dehalogenase actually cut the strongest bond in chemistry? It uses a mechanism called **$S_N2$ Nucleophilic Substitution**.

<div id="sn2-widget" class="interactive-widget" style="margin: 2rem 0; background: #020617; padding: 1.5rem; border-radius: 12px; border: 1px solid #1e293b; display: flex; flex-direction: column; align-items: center; overflow: hidden; height: 350px; position: relative;">
  <div id="sn2-status" style="color: #94a3b8; font-family: monospace; font-size: 0.85rem; margin-bottom: 15px; font-weight: bold; min-height: 20px; text-align: center;">WAITING FOR ENZYME...</div>
  <canvas id="sn2-canvas" width="600" height="250" style="width: 100%; height: 100%; max-width: 600px; background: #0f172a; border-radius: 8px; box-shadow: inset 0 0 30px rgba(0,0,0,0.8); cursor: crosshair;"></canvas>
  <div style="color: #64748b; font-family: monospace; font-size: 0.65rem; margin-top: 10px;">(Hover over the simulation to pause the automation)</div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('sn2-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const statusText = document.getElementById('sn2-status');
    
    let state = 0; // 0=idle, 1=attack, 2=break, 3=reset
    let progress = 0;
    
    let isHovered = false;
    canvas.addEventListener('mouseenter', () => isHovered = true);
    canvas.addEventListener('mouseleave', () => isHovered = false);
    
    let autoTimer = 0;
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      if (!isHovered) {
          autoTimer++;
          if (state === 0 && autoTimer > 300) {
              state = 1; progress = 0;
              statusText.textContent = "1. NUCLEOPHILIC ATTACK (Asp104 approaches)";
              statusText.style.color = "#ef4444";
          }
          if (state === 2 && autoTimer > 600) {
              state = 3; progress = 0;
              statusText.textContent = "2. HYDROLYSIS (Water resets the active site)";
              statusText.style.color = "#3b82f6";
          }
      }
      
      // Carbon (center)
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.fillText('C', cx-7, cy+7);
      
      // Fluorine position
      let f_x = cx + 80 + (state === 2 ? progress * 100 : (state === 3 ? 100 : 0));
      
      // Aspartate position (Oxygen)
      let o_x = cx - 180 + (state >= 1 ? (state===1 ? progress * 100 : 100) : 0);
      
      // Water position
      let h2o_y = cy - 150 + (state === 3 ? progress * 150 : 0);
      
      // Draw bonds
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
      if (state < 2) {
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(f_x, cy); ctx.stroke();
      }
      if (state >= 1 && state < 3) {
          ctx.beginPath(); ctx.setLineDash([5, 5]); ctx.moveTo(o_x, cy); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
      }
      
      // Draw Fluorine
      ctx.fillStyle = '#10b981'; // Green
      ctx.beginPath(); ctx.arc(f_x, cy, 25, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('F', f_x-5, cy+7);
      
      // Draw Aspartate Nucleophile (Oxygen)
      if(state < 3) {
          ctx.fillStyle = '#ef4444'; // Red
          ctx.beginPath(); ctx.arc(o_x, cy, 25, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillText('O⁻', o_x-10, cy+7);
          ctx.font = '12px sans-serif'; ctx.fillText('Asp104', o_x-20, cy-35);
      }
      
      // Draw Water
      if(state === 3) {
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath(); ctx.arc(cx, h2o_y, 25, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillText('H₂O', cx-15, h2o_y+5);
      }
      
      // Update logic (Extremely Slow Motion)
      if (!isHovered) {
          if(state === 1) {
              progress += 0.003; // Ultra slow attack
              if(progress >= 1) { 
                  state = 2; progress = 0; autoTimer = 0; 
                  statusText.textContent = "BOND BROKEN: Fluoride ion released!";
                  statusText.style.color = "#10b981";
              }
          } else if(state === 2) {
              progress += 0.002; // Ultra slow drift
              if(progress > 1) progress = 1;
          } else if(state === 3) {
              progress += 0.004; // Ultra slow reset
              if(progress >= 1) { 
                  state = 0; progress = 0; autoTimer = 0; 
                  statusText.textContent = "WAITING FOR ENZYME...";
                  statusText.style.color = "#94a3b8";
              }
          }
      }
      
      requestAnimationFrame(draw);
    }
    draw();
  });
})();
</script>

Inside the protein is a microscopic pocket called the *Active Site*, powered by a "Catalytic Triad" of amino acids. 
1. **The Attack:** An Aspartate amino acid (which has a negative charge) acts as a nucleophile. It rams into the back of the Teflon's carbon atom.
2. **The Release:** This physical force knocks the highly electronegative Fluorine atom right off the carbon, releasing it as a free fluoride ion ($F^-$).
3. **The Reset:** A water molecule swoops in to reset the protein so it can fire again.

The challenge? This enzyme evolved to eat tiny, single-fluorine molecules, not a giant solid plastic. We need a way to hold the solid plastic against the enzyme. That's where the Hydrophobin comes in.

### Step 3: AlphaFold and Fusion Blueprinting
We downloaded the 3D structures for both proteins from DeepMind's AlphaFold database.

By rendering the structures in PyMOL, we proved that the Hydrophobin has a highly rigid core but incredibly flexible "tails" on its ends. These tails are nature's perfect attachment points.

We ran a Python script to measure the physical geometry of the Dehalogenase and found that its starting end (N-terminus) is dangerously close to the active site (22.3 Å). If we attached our hook there, we would block the chemical blades! Instead, its end tail (C-terminus) is 33.8 Å away—the perfect safe zone.

**The Final Blueprint:**
`[Fluoroacetate Dehalogenase] -- (Glycine Linker) -- [Hydrophobin]`

We just computationally designed a fusion protein topology. Next up: we take this to the computer for simulated docking!
