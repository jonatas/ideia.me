# /// script
# requires-python = ">=3.10, <3.13"
# dependencies = [
#     "pymol-open-source-whl",
# ]
# ///

import os
import sys
import argparse

# Set environment variable for headless rendering
os.environ["PYOPENGL_PLATFORM"] = "osmesa"

import pymol # pytype: disable=import-error
pymol.pymol_argv = ["pymol", "-cq"]
pymol.finish_launching()

from pymol import cmd # pytype: disable=import-error

def main():
    parser = argparse.ArgumentParser(description="Align a discovery PDB to a bait PDB for static blog visualization.")
    parser.add_argument("--bait", required=True, help="Path to the Bait PDB file")
    parser.add_argument("--discovery", required=True, help="Path to the Discovery PDB file")
    parser.add_argument("--outdir", default="assets/models", help="Output directory for aligned files")
    args = parser.parse_args()

    bait_name = os.path.splitext(os.path.basename(args.bait))[0]
    discovery_name = os.path.splitext(os.path.basename(args.discovery))[0]

    out_discovery = os.path.join(args.outdir, f"{discovery_name}_aligned.pdb")
    out_bait = os.path.join(args.outdir, f"{bait_name}_reference.pdb")

    # Load structures
    cmd.load(args.bait, "bait_obj")
    cmd.load(args.discovery, "discovery_obj")

    if cmd.count_atoms("bait_obj") == 0 or cmd.count_atoms("discovery_obj") == 0:
        print("Error: Could not load one or both PDB files.", file=sys.stderr)
        cmd.quit()
        sys.exit(1)

    # Perform Combinatorial Extension alignment (robust for structural homologs)
    cealign_result = cmd.cealign("bait_obj", "discovery_obj")
    
    print(f"✅ Alignment Successful!")
    print(f"   RMSD: {cealign_result['RMSD']:.2f} Å over {cealign_result['alignment_length']} residues")

    # Save aligned structures
    os.makedirs(args.outdir, exist_ok=True)
    cmd.save(out_discovery, "discovery_obj")
    cmd.save(out_bait, "bait_obj")

    print(f"💾 Saved aligned discovery to: {out_discovery}")
    print(f"💾 Saved bait reference to: {out_bait}")

    # Generate HTML snippet
    snippet = f"""
---
📋 Copy and paste this into your Jekyll Markdown post:
---

{{% include structural_alignment.html bait_id="{bait_name}" discovery_id="{discovery_name}" bait_pdb="/{out_bait}" discovery_pdb_prefix="/assets/models/{discovery_name}" %}}
"""
    print(snippet)
    cmd.quit()

if __name__ == "__main__":
    main()
