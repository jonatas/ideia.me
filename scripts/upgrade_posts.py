# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pymol-open-source-whl",
# ]
# ///

import os
import sys
import glob
import re
import subprocess

def upgrade_post(md_file):
    with open(md_file, 'r') as f:
        content = f.read()

    # Find the HTML block with viewer_3Dmoljs
    pattern = re.compile(
        r'<div style="display: flex; justify-content: space-between; gap: 20px;">\s*<div style="flex: 1;">\s*<h4>Bait: ([^<]+)</h4>\s*<div[^>]*data-href="(/assets/models/[^"]+)"[^>]*></div>\s*</div>\s*<div style="flex: 1;">\s*<h4>Discovery: ([^<]+)</h4>\s*<div[^>]*data-href="(/assets/models/[^"]+)"[^>]*></div>\s*</div>\s*</div>',
        re.MULTILINE
    )
    
    match = pattern.search(content)
    if not match:
        print(f"Skipping {md_file}: No generic viewer widget found.")
        return

    bait_title, bait_pdb_path, discovery_title, discovery_pdb_path = match.groups()
    
    # Extract clean IDs
    bait_id = bait_title.split(' ')[0].strip()
    discovery_id = discovery_title.split(' ')[0].strip()
    
    # Local paths
    bait_file = bait_pdb_path.lstrip('/')
    discovery_file = discovery_pdb_path.lstrip('/')
    
    bait_name = os.path.splitext(os.path.basename(bait_file))[0]
    discovery_name = os.path.splitext(os.path.basename(discovery_file))[0]

    out_discovery = f"assets/models/{discovery_name}_aligned.pdb"
    out_bait = f"assets/models/{bait_name}_reference.pdb"
    morph_prefix = f"assets/models/{discovery_name}-morph"

    print(f"Upgrading {md_file}...")
    
    # 1. Align
    print(f"  -> Aligning {bait_file} and {discovery_file}...")
    try:
        subprocess.run(["uv", "run", "scripts/align_discovery.py", "--bait", bait_file, "--discovery", discovery_file], check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed to align: {e.stderr.decode()}")
        return
        
    # 2. Morph
    print(f"  -> Generating morph steps...")
    try:
        subprocess.run(["uv", "run", "scripts/generate_morph_steps.py", discovery_file, out_discovery, morph_prefix], check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed to morph: {e.stderr.decode()}")
        return
        
    # 3. Replace in markdown
    replacement = f'{{% include structural_alignment.html bait_id="{bait_id}" discovery_id="{discovery_id}" bait_pdb="/{out_bait}" discovery_pdb_prefix="/{morph_prefix}" %}}'
    
    new_content = content[:match.start()] + replacement + content[match.end():]
    with open(md_file, 'w') as f:
        f.write(new_content)
        
    print(f"  ✅ Done.")

def main():
    posts = glob.glob("_posts/*-dark-proteome.md")
    for post in posts:
        upgrade_post(post)

if __name__ == "__main__":
    main()
