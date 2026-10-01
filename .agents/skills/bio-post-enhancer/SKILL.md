---
name: bio-post-enhancer
description: >-
  Use this skill when asked to improve, enrich, or enhance bio or dark proteome blog posts overnight. It provides the exact workflow for adding organism details, cross-linking, and educational content for adults.
---

# Bio Post Enhancer

This skill outlines the standard operating procedure for upgrading raw "Dark Proteome" bioinformatics blog posts into rich, engaging, adult-learning educational content. 

## Workflow Steps

When tasked with improving bio posts, follow this loop for each target markdown file in `_posts/`:

### 1. Research the Organisms
* Extract the "Bait" and "Discovery" UniProt IDs and organism names from the post.
* Use your available web/research tools (like NCBI, UniProt, or Wikipedia) to find:
  * Where these organisms live (e.g., extreme environments, hydrothermal vents, acidic lakes).
  * Unique biological quirks or survival mechanisms.
  * What the protein package/family specifically does in that environment.

### 2. Rewrite for Adult Education
* Elevate the writing style to be engaging for adults diving into new scientific areas.
* Explicitly define and introduce complex biological terms (e.g., "synteny", "homolog", "orphan protein", "catalytic efficiency").
* Add a "Curiosities" or "Did You Know?" section about the organism or the environment.

### 3. Maintain Interactive Features
* **CRITICAL:** Do NOT break or remove the `{% include structural_alignment.html ... %}` tags. 
* Mention the interactive features in the text (e.g., "Double-click the 3D viewer below to start the morphing sequence...").

### 4. Cross-Linking
* Read the frontmatter and content of *other* recent `*-dark-proteome.md` posts.
* Find at least one related post (e.g., if writing about a hydrolase, link to another hydrolase or a similar extremophile organism).
* Inject a "Related Discoveries" section at the bottom of the post with a markdown link to the other post.

### 5. Validate & Commit
* Run `./scripts/lint_pdb_includes.py` to guarantee no file paths were broken.
* Commit the enhanced post to git with a descriptive message before moving to the next file.

## Execution
If the user asks you to "loop it overnight", process the files sequentially one-by-one. Commit your work after each file so progress is saved. If you encounter errors, document them and continue to the next file.
