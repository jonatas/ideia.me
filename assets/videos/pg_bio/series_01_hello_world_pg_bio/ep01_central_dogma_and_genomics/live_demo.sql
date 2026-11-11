-- ============================================================================
-- pg_bio Live Video Demo: Ep 1: Hello World, pg_bio! The Central Dogma in SQL
-- Layer: Layers 1 & 6: Genomics (int4range GiST) & Sequence Physics
-- Target Benchmark: 200x faster than BioPython (~200 ns/protein in Rust)
-- Blog: https://ideia.me  |  Repo: https://github.com/jonatas/pg_bio
-- Run inside psql: \i videos/ep01_central_dogma_and_genomics/live_demo.sql
-- ============================================================================

\pset linestyle unicode
\pset border 2
\timing on

\echo ''
\echo '======================================================================'
\echo ' STAGE 1: THE ATOMIC PRIMITIVE (Testing the Rust pgrx Function in SQL)'
\echo '======================================================================'

SELECT
    molecule_wl_hash('C1=CC=CC=C1') = molecule_wl_hash('c1ccccc1') AS kekule_eq_aromatic,
    molecules_are_identical('[Na+].O=C([O-])C1=CC=CC=C1', 'O=C(O)c1ccccc1') AS salt_stripped_eq,
    round((parse_smiles('CC(=O)OC1=CC=CC=C1C(=O)O') % parse_smiles('O=C(O)c1ccccc1'))::numeric, 4) AS tanimoto_sim;

\echo ''
\echo '======================================================================'
\echo ' STAGE 2: MULTI-CONSTRAINT BIOTECH PIPELINE (Index Filter -> Physics)'
\echo '======================================================================'

WITH candidate_enzymes(design_id, sequence, active_site_coords) AS (
    VALUES
        ('Design_Alpha_ZnO', 'MFEGFERRLVDWPSTDKTKREEVDHCH', '[{"x":0.0,"y":0.0,"z":0.0,"name":"ZN"},{"x":2.05,"y":0.1,"z":0.0,"name":"HOH"}]'::jsonb)
)
SELECT
    design_id,
    round(isoelectric_point(sequence)::numeric, 2) AS pI,
    round(gravy_score(sequence)::numeric, 3) AS hydropathy,
    round(sequence_entropy(sequence)::numeric, 3) AS shannon_entropy,
    prosite_match(sequence, 'H-x-H') AS has_catalytic_motif
FROM candidate_enzymes;

\echo ''
\echo '======================================================================'
\echo ' STAGE 3: ENGINE EXECUTION PLAN & SHARED-BUFFER TELEMETRY'
\echo '======================================================================'

EXPLAIN (ANALYZE, BUFFERS)
SELECT
    z_order_encode(12.4, -4.8, 29.1) AS morton_3d_key,
    bio_translate_dna('ATGTTCGAAGGTTTCGAACGTCGTCTGGTTGACTGG') AS translated_peptide;

\echo ''
\echo '🌐 Blog: https://ideia.me   |   🐙 GitHub: https://github.com/jonatas/pg_bio'
