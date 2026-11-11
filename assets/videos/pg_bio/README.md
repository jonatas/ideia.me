# 🎬 `pg_bio` Video Library & Interactive 3D Learning Hub

Welcome to the `pg_bio` video and interactive 3D tutoring directory! Every series and episode here pairs:
1. **Narrated 1080p MP4 Videos (`.mp4` + `voiceover.mp3` + `captions.srt`)** styled with the [`ideia.me`](https://ideia.me) dark theme.
2. **Interactive 3Dmol.js + Voiced Hovering Video Explorer Pages (`studio_deck.html` & `index.html`)** that let you scroll through SQL queries, toggle **⚙️ Systems Engineer $\leftrightarrow$ 🧬 Structural Biologist** mental models, and rotate 3D protein pockets while a floating Picture-in-Picture voiced video guides you.
3. **Runnable `psql` Demo Scripts (`live_demo.sql`), Teleprompter Talk Tracks (`talk_track.md`), Marp Slides (`slides.marp.md`), and Manim Scenes (`manim_scene.py`).**

---

## 🗂️ Available Series & Episodes

### 1. [Series 01: Hello World, `pg_bio`! — Intro to Biotech & Multiomics in PostgreSQL](series_01_hello_world_pg_bio/README.md)
* 🚀 **Interactive Explorer Hub:** [`series_01_hello_world_pg_bio/index.html`](series_01_hello_world_pg_bio/index.html)
* 🌐 **Web Library on `ideia.me`:** [https://ideia.me/pg-bio-videos/](https://ideia.me/pg-bio-videos/)
* **Episodes:**
  * **Ep 01:** [The Central Dogma in SQL (`int4range` GiST & Sequence Physics)](series_01_hello_world_pg_bio/ep01_central_dogma_and_genomics/studio_deck.html) — [MP4](series_01_hello_world_pg_bio/ep01_central_dogma_and_genomics/ep01_central_dogma_and_genomics.mp4) | [SQL](series_01_hello_world_pg_bio/ep01_central_dogma_and_genomics/live_demo.sql) | [Doc](../docs/07_genomics_io.md)
  * **Ep 02:** [From 1D Strings to 3D Atoms with Morton Curves (`z_order_encode` & SVD)](series_01_hello_world_pg_bio/ep02_3d_pockets_and_morton_curves/studio_deck.html) — [MP4](series_01_hello_world_pg_bio/ep02_3d_pockets_and_morton_curves/ep02_3d_pockets_and_morton_curves.mp4) | [SQL](series_01_hello_world_pg_bio/ep02_3d_pockets_and_morton_curves/live_demo.sql) | [Doc](../docs/03_spatial_indexing.md)
  * **Ep 03:** [Transcriptomics & CSR Sparse Attention Graphs (`SparseAttentionMap`)](series_01_hello_world_pg_bio/ep03_scrna_csr_and_attention_maps/studio_deck.html) — [MP4](series_01_hello_world_pg_bio/ep03_scrna_csr_and_attention_maps/ep03_scrna_csr_and_attention_maps.mp4) | [SQL](series_01_hello_world_pg_bio/ep03_scrna_csr_and_attention_maps/live_demo.sql) | [Doc](../docs/12_mmpbsa_free_energy_auditing.md)
  * **Ep 04:** [The Multiomics Holy Grail — Vectors & Live UniProt (`halfvec` HNSW)](series_01_hello_world_pg_bio/ep04_joint_vector_multiomics/studio_deck.html) — [MP4](series_01_hello_world_pg_bio/ep04_joint_vector_multiomics/ep04_joint_vector_multiomics.mp4) | [SQL](series_01_hello_world_pg_bio/ep04_joint_vector_multiomics/live_demo.sql) | [Doc](../docs/01_vector_homology.md)

### 2. [Standalone Feature Deep-Dive: From B-Trees & GiST to 3D Catalytic Pockets](ep01_biotech_for_sql_engineers/studio_deck.html)
* [MP4 Video](ep01_biotech_for_sql_engineers/ep01_biotech_for_sql_engineers.mp4) • [Interactive Studio Deck](ep01_biotech_for_sql_engineers/studio_deck.html) • [Talk Track](ep01_biotech_for_sql_engineers/talk_track.md) • [Live SQL](ep01_biotech_for_sql_engineers/live_demo.sql)

### 3. [Standalone Feature Deep-Dive: The Protein as a Modular State Machine (`Dock -> Cut -> Transform`)](ep02_modular_protein_state_machine/studio_deck.html)
* [MP4 Video](ep02_modular_protein_state_machine/ep02_modular_protein_state_machine.mp4) • [Interactive Studio Deck](ep02_modular_protein_state_machine/studio_deck.html) • [Talk Track](ep02_modular_protein_state_machine/talk_track.md) • [Live SQL](ep02_modular_protein_state_machine/live_demo.sql)
