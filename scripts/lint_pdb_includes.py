#!/usr/bin/env python3
import os
import glob
import re
import sys

def check_posts():
    posts = glob.glob("_posts/*.md")
    errors = 0
    
    # Regex to extract bait_pdb and discovery_pdb_prefix from the structural_alignment include
    pattern = re.compile(r'{%\s*include\s+structural_alignment\.html.*?bait_pdb="([^"]+)".*?discovery_pdb_prefix="([^"]+)".*?%}')
    
    for post in posts:
        with open(post, 'r') as f:
            content = f.read()
            
        matches = pattern.finditer(content)
        for match in matches:
            bait_pdb = match.group(1).lstrip('/')
            discovery_prefix = match.group(2).lstrip('/')
            
            # Check bait
            if not os.path.exists(bait_pdb):
                print(f"❌ ERROR in {post}: Bait PDB not found -> {bait_pdb}")
                errors += 1
                
            # Check discovery morph steps (0 to 3)
            for step in range(4):
                step_file = f"{discovery_prefix}-morph_step{step}.pdb"
                if not os.path.exists(step_file):
                    print(f"❌ ERROR in {post}: Morph step not found -> {step_file}")
                    errors += 1
                    
    if errors == 0:
        print("✅ All PDB references in Jekyll includes are valid!")
        return 0
    else:
        print(f"\nFailed with {errors} missing file(s).")
        return 1

if __name__ == "__main__":
    sys.exit(check_posts())
