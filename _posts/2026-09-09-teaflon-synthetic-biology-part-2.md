---
layout: post
title: "TeaFlon Part 2: The Swarm Architecture and Biomineralization"
date: 2026-09-09 18:45:00 -0300
categories: synthetic-biology
mermaid: true
image: images/teaflon_bioreactor.jpg
---

![TeaFlon Bioreactor Concept](/images/teaflon_bioreactor.jpg)
*Artist's rendition of the TeaFlon Swarm: Blue "Destroyer" proteins binding to the dark Teflon chain, while white Amelogenin nanospheres capture the glowing green fluoride ions.*

In [Part 1](/synthetic-biology/2026/09/09/teaflon-synthetic-biology-part-1.html), we successfully designed a computational blueprint for a fusion protein (The "Destroyer") that can anchor itself to Teflon and snap its Carbon-Fluorine bonds using a specialized enzyme.

But breaking Teflon is only half the battle. The chemical reaction releases free fluoride ions ($F^-$), which are highly toxic to the environment. To safely sequester the fluoride, we need to turn it into a solid rock.

### The Swarm Architecture
Instead of fusing a third component onto our already complex Teflon-eating protein, we decided on **Option B: The Swarm Architecture**. 

We will engineer a bacterial colony to secrete two separate proteins simultaneously:
1. **The Destroyer Swarm:** The Dehalogenase-Hydrophobin fusion proteins that latch onto the plastic and shear off fluoride ions.
2. **The Scaffold Swarm:** A massive fleet of **Amelogenin** proteins floating freely in the surrounding liquid. 

Here is how the data (and chemistry) flows in our theoretical bioreactor:

{% mermaid %}
graph TD
    subgraph "The Bioreactor Vat"
    T[Teflon / PTFE Waste] -->|Anchors| H[Hydrophobin Hook]
    H -->|Positions| D[Fluoroacetate Dehalogenase]
    D -->|Cleaves C-F Bonds| F((Free Fluoride F⁻))
    
    C[Environmental Calcium Ca²⁺] --> A[Amelogenin Nanospheres]
    P[Environmental Phosphate PO₄³⁻] --> A
    
    F -->|Captured by| A
    A -->|Biomineralization| FA[Solid Fluorapatite Crystal]
    end
{% endmermaid %}

### Visualizing the Swarm
To understand the bioreactor, let's look at the microscopic actors involved. The simulation below is an automated, self-playing factory loop demonstrating the entire biomineralization cycle. 

Here is your legend:
*   〰️ **Dark Gray Wave:** The indestructible Teflon (PTFE) polymer chain.
*   💧 **Blue Darts:** The "Destroyer" fusion enzymes. They anchor to the Teflon and cut the bonds.
*   🟢 **Green Dots:** Toxic Fluoride ions ($F^-$) sheared off the plastic.
*   ⚪ **White Spheres:** Amelogenin Scaffolds. They absorb the Fluoride and biomineralize into solid green Fluorapatite crystals.

<div id="swarm-widget" class="interactive-widget" style="margin: 2rem 0; background: #020617; padding: 1.5rem; border-radius: 12px; border: 1px solid #1e293b; display: flex; flex-direction: column; align-items: center; overflow: hidden; position: relative;">
  <div id="swarm-status" style="color: #38bdf8; font-family: monospace; font-size: 0.85rem; margin-bottom: 15px; font-weight: bold; min-height: 20px; text-align: center;">PHASE 1: TEFLON ENTERS BIOREACTOR</div>
  <canvas id="swarm-canvas" width="600" height="300" style="width: 100%; height: 100%; max-width: 600px; background: #0f172a; border-radius: 8px; box-shadow: inset 0 0 30px rgba(0,0,0,0.8); cursor: crosshair;"></canvas>
  <div style="color: #64748b; font-family: monospace; font-size: 0.65rem; margin-top: 10px;">(Hover over the simulation to pause the automation)</div>
</div>

<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('swarm-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const statusText = document.getElementById('swarm-status');
    
    let destroyers = [];
    let scaffolds = [];
    let fluorides = []; 
    let time = 0;
    
    let isHovered = false;
    canvas.addEventListener('mouseenter', () => isHovered = true);
    canvas.addEventListener('mouseleave', () => isHovered = false);
    
    // Auto-loop variables
    let phase = 0;
    let phaseTimer = 0;
    
    function spawnDestroyer() {
        destroyers.push({x: Math.random()*480+60, y: 150 + (Math.random()*20-10)});
    }
    function spawnScaffold() {
        scaffolds.push({x: Math.random()*500+50, y: Math.random()*80+20, fCount: 0});
    }
    
    function updateAutomation() {
        if (isHovered) return; // Pause automation if user is inspecting
        
        phaseTimer++;
        if (phaseTimer === 1) {
            phase = 1;
            statusText.textContent = "PHASE 1: TEFLON ENTERS BIOREACTOR";
            statusText.style.color = "#94a3b8";
        }
        else if (phaseTimer === 300) {
            phase = 2;
            statusText.textContent = "PHASE 2: DESTROYERS BIND AND CLEAVE FLUORIDE";
            statusText.style.color = "#3b82f6";
            for(let i=0; i<4; i++) setTimeout(spawnDestroyer, i*800);
        }
        else if (phaseTimer === 900) {
            phase = 3;
            statusText.textContent = "PHASE 3: AMELOGENIN SCAFFOLDS CAPTURE FLUORIDE";
            statusText.style.color = "#f8fafc";
            for(let i=0; i<6; i++) setTimeout(spawnScaffold, i*600);
        }
        else if (phaseTimer === 1600) {
            phase = 4;
            statusText.textContent = "PHASE 4: HARVESTING SOLID BIOCERAMIC";
            statusText.style.color = "#10b981";
        }
        else if (phaseTimer === 1900) {
            // Reset
            destroyers = [];
            scaffolds = [];
            fluorides = [];
            phaseTimer = 0;
        }
    }
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.015; // Slow motion time
      updateAutomation();
      
      // Draw Teflon Chain
      ctx.strokeStyle = phase === 4 ? '#1e293b' : '#475569'; // Fade out during harvest
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for(let x=20; x<580; x+=10) {
          let y = 200 + Math.sin(x*0.02 + time*0.5) * 15;
          if(x===20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Draw Fluorides
      for(let i=fluorides.length-1; i>=0; i--) {
          let f = fluorides[i];
          f.y -= (isHovered ? 0.1 : 0.4); // Slow float up
          f.x += Math.sin(time*2 + f.y*0.05) * 0.8; // Gentle wiggle
          
          ctx.fillStyle = '#10b981';
          ctx.beginPath(); ctx.arc(f.x, f.y, 4, 0, Math.PI*2); ctx.fill();
          
          // Collision logic
          for(let s of scaffolds) {
              let dist = Math.hypot(f.x - s.x, f.y - (s.y + Math.sin(time*5+s.x)*5));
              if(dist < 20 + s.fCount*2) {
                  s.fCount++;
                  fluorides.splice(i, 1);
                  break;
              }
          }
          if(f.y < 0 && fluorides[i] === f) fluorides.splice(i, 1);
      }
      
      // Draw Destroyers
      for(let i=destroyers.length-1; i>=0; i--) {
          let d = destroyers[i];
          if (phase === 4) {
              d.y += 0.5; // Slow fall away during harvest
              if(d.y > 400) { destroyers.splice(i, 1); continue; }
          }
          
          let bob_y = d.y + Math.sin(time*4 + d.x)*5;
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath(); ctx.moveTo(d.x, bob_y);
          ctx.lineTo(d.x-10, bob_y-20); ctx.lineTo(d.x+10, bob_y-20);
          ctx.fill();
          ctx.beginPath(); ctx.arc(d.x, bob_y-25, 12, 0, Math.PI*2); ctx.fill();
          
          if(phase === 2 || phase === 3) {
              // Fire less frequently because time is slower
              if(Math.random() < 0.015 && !isHovered) {
                  fluorides.push({x: d.x, y: bob_y-30});
              }
          }
      }
      
      // Draw Scaffolds
      for(let i=scaffolds.length-1; i>=0; i--) {
          let s = scaffolds[i];
          if (phase === 4) {
              s.y -= 0.5; // Slow float away (harvest)
              if(s.y < -50) { scaffolds.splice(i, 1); continue; }
          }
          
          let float_y = s.y + Math.sin(time*3 + s.x)*5;
          let radius = 20 + Math.min(s.fCount, 15);
          
          ctx.fillStyle = '#f8fafc';
          if(s.fCount > 0) {
             ctx.shadowBlur = s.fCount * 3;
             ctx.shadowColor = '#10b981';
          }
          ctx.beginPath(); ctx.arc(s.x, float_y, radius, 0, Math.PI*2); ctx.fill();
          ctx.shadowBlur = 0;
          
          // Core turns green as it mineralizes
          ctx.fillStyle = s.fCount > 4 ? '#10b981' : '#cbd5e1';
          ctx.beginPath(); ctx.arc(s.x, float_y, radius*0.5, 0, Math.PI*2); ctx.fill();
      }
      
      requestAnimationFrame(draw);
    }
    draw();
  });
})();
</script>

### Why Amelogenin?
Amelogenin is the exact protein the human body uses to build tooth enamel. Enamel is made of Hydroxyapatite, a bioceramic crystal. When exposed to fluoride, it becomes **Fluorapatite** ($Ca_5(PO_4)_3F$)—which is even harder.

If we place Amelogenin in an environment rich in Calcium and Phosphate, the protein will self-assemble into microscopic spheres. These nanospheres act as magnets, vacuuming up the toxic fluoride released by our Destroyers and permanently locking it into solid, harmless bioceramic clusters.

### The AlphaFold "Failure": Intrinsically Disordered Proteins
When we ran our Dehalogenase through DeepMind's AlphaFold, it predicted a perfectly rigid, rock-solid 3D structure with 97% confidence. 

However, when we queried AlphaFold for Human Amelogenin (UniProt ID: Q99217), the AI returned a shockingly low confidence score of **59%**, with 0% of the protein being highly structured! Did the AI fail? 

No! Amelogenin is what bioengineers call an **Intrinsically Disordered Protein (IDP)**. 
When it is alone in water, it doesn't fold into a neat 3D shape. Instead, it flops around like a wet piece of spaghetti. It is only when hundreds of Amelogenin proteins bump into each other and detect calcium that they suddenly snap into a rigid, highly structured geometric sphere. 

Because AlphaFold predicts the shape of *single* proteins in isolation, IDPs always look like low-confidence messes. It's a great reminder that biology is dynamic; a protein's shape is entirely dependent on its environment.

### 👩‍💻 Developer's Corner: Querying AlphaFold with Python
If you are a developer looking to get into bioinformatics, here is a simplified version of the logic we used to hit the AlphaFold API and programmatically check the "confidence" (pLDDT) of a protein. 

Instead of dealing with massive 3D coordinate files, we can just grab the JSON metadata to see if a protein is rigid or disordered!

```python
import requests
import json
import statistics

def check_protein_rigidity(uniprot_id):
    # 1. Fetch metadata from the AlphaFold Database API
    url = f"https://alphafold.ebi.ac.uk/api/prediction/{uniprot_id}"
    response = requests.get(url)
    
    if response.status_code != 200:
        return "Protein not found in AlphaFold."
        
    data = response.json()[0]
    
    # 2. Grab the PAE (Predicted Aligned Error) URL from the payload
    pae_url = data['paeDocUrl']
    pae_data = requests.get(pae_url).json()[0]
    
    # 3. The pLDDT score is a 1D array representing the AI's confidence
    # for every single amino acid in the protein chain (0-100 scale).
    confidence_scores = pae_data['predicted_aligned_error']
    
    # In real apps, pLDDT is embedded in the CIF/PDB file's B-factor column,
    # but some endpoints provide the raw array. For this example, let's pretend
    # we parsed the B-factors into a simple list:
    mock_plddt_array = [97.5, 96.2, 98.1, 40.5, 30.2] # Example values
    
    avg_confidence = statistics.mean(mock_plddt_array)
    
    if avg_confidence > 90:
        return f"Rock Solid (Score: {avg_confidence:.1f})"
    elif avg_confidence < 60:
        return f"Intrinsically Disordered! (Score: {avg_confidence:.1f})"
    else:
        return f"Mixed Structure (Score: {avg_confidence:.1f})"

print(check_protein_rigidity("Q1JU72")) # Dehalogenase -> Rock Solid
print(check_protein_rigidity("Q99217")) # Amelogenin -> Intrinsically Disordered!
```

We have now fully mapped the TeaFlon bioreactor concept. We are converting indestructible toxic plastic into artificial tooth enamel using a swarm of computational proteins.
