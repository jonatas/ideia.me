-- ============================================================================
-- pg_bio Live Video Demo: The Protein as a Modular State Machine (Dock -> Cut -> Transform)
-- Layer: Layers 8, 10, 13 & 14: Domain Pairing, Theozyme Cutters, CSR Allostery & RK4 Cascades
-- Target Benchmark: 94.9x to 1,513x faster in-database multi-stage screening
-- Blog: https://ideia.me  |  Repo: https://github.com/jonatas/pg_bio
-- Run inside psql: \i videos/ep02_modular_protein_state_machine/live_demo.sql
-- ============================================================================

\pset linestyle unicode
\pset border 2
\timing on

\echo ''
\echo '======================================================================'
\echo ' STAGE 1: SEGMENT 1 & 2 (DOCK ANCHOR + LINKER) -> PARETO DOMAIN PAIRING'
\echo '======================================================================'

WITH domain_segments(segment_id, role, seq_span, sequence) AS (
    VALUES
        ('Seg1_Hydrophobin_Dock', 'DOCK_ANCHOR', '[1,72]'::int4range,   'WFFVLITYAVVAAALAQTVDGLPVAVVAAAL'),
        ('Seg2_Flexible_Hinge',   'HINGE_WIRE',  '[73,88]'::int4range,  'GSGQGSPGSGQGSG'),
        ('Seg3_Hydrolase_Scissor','CUT_THEOZYME','[89,285]'::int4range, 'VNGHEHEYRKMFEGFERRLVDWPSTDKTKREEVDHCH'),
        ('Seg4_Mineralizer_Sink', 'TRANSFORM',   '[286,320]'::int4range,'DESDEDESDEDESDE')
)
SELECT
    segment_id,
    role,
    seq_span,
    round(gravy_score(sequence)::numeric, 3) AS hydropathy_gravy,
    round(isoelectric_point(sequence)::numeric, 2) AS segment_pI,
    round(sequence_entropy(sequence)::numeric, 3) AS shannon_entropy,
    prosite_match(sequence, 'H-E-x-H') AS has_catalytic_clamp
FROM domain_segments;

\echo ''
\echo '======================================================================'
\echo ' STAGE 2: THE 4-STEP CATALYTIC STATE MACHINE (DOCK -> ARM -> CUT -> SINK)'
\echo '======================================================================'

WITH state_machine AS (
    SELECT
        'Chimera_Dock_Cut_v1'::text AS design_id,
        'WFFVLITYAVVAAALAQTVD'::text AS dock_seq,
        'VNGHEHEYRKMFEGFERRLVDWPSTDKTKREEVDHCH'::text AS scissor_seq,
        -- Guide beta-strand register (Res 12-14) vs Substrate backbone (Res 101-103)
        ARRAY[
            create_residue_coord(4.220, 0.650, -3.380, 'VAL12:CA'),
            create_residue_coord(0.820, 1.880, -2.380, 'ASN13:CA'),
            create_residue_coord(-2.250, 1.280, -0.220, 'GLY14:CA')
        ] AS guide_strand_ca,
        ARRAY[
            create_residue_coord(4.150, 0.180, -0.420, 'SUB101:CA'),
            create_residue_coord(0.920, 1.450, 0.580, 'LEU102:CA'),
            create_residue_coord(-2.120, 0.980, 2.680, 'ALA103:CA')
        ] AS substrate_ca,
        -- Canonical 4QHP Zn2+ Pentad + Nucleophilic HOH (Step 2 & Step 3)
        ARRAY[
            create_residue_coord(12.420, 18.150, 24.080, 'HIS1:NE2'),
            create_residue_coord(15.610, 17.890, 23.620, 'HIS2:NE2'),
            create_residue_coord(13.850, 14.520, 22.410, 'GLU1:OE2'),
            create_residue_coord(13.940, 19.680, 21.140, 'GLU2:OE1'),
            create_residue_coord(16.480, 15.240, 25.190, 'TYR:OH'),
            create_residue_coord(14.020, 17.910, 22.980, 'ZN'),
            create_residue_coord(14.110, 16.050, 23.820, 'HOH:O')
        ] AS theozyme_atoms,
        -- Bürgi-Dunitz nucleophilic attack triad: HOH:O -> Substrate C=O
        create_residue_coord(14.110, 16.050, 23.820, 'HOH:O') AS water_o,
        create_residue_coord(14.850, 14.320, 24.950, 'SUB:C') AS scissile_c,
        create_residue_coord(15.920, 14.680, 25.420, 'SUB:O') AS oxyanion_o
)
SELECT
    s.design_id,
    -- Step 1 (DOCK): Domain Pareto compatibility + Beta-strand guide register
    round(pareto_score_domain_pair(
        gravy_score(s.dock_seq), sequence_entropy(s.dock_seq),
        molecular_weight(s.scissor_seq) / 1000.0, isoelectric_point(s.scissor_seq),
        sequence_entropy(s.scissor_seq), 7.4
    )::numeric, 3) AS step1_dock_pareto,
    strand_pairing_check(s.guide_strand_ca, s.substrate_ca) AS step1_strand_locked,
    -- Step 2 (ARM): Zn2+ coordination & nucleophilic water polarization
    has_coordinated_water_shell(s.theozyme_atoms, 'ZN', 2.4) AS step2_water_armed,
    -- Step 3 (CUT): 3D Theozyme RMSD (< 0.9 A) & Bürgi-Dunitz attack angle (100-115 deg)
    round(theozyme_rmsd(s.theozyme_atoms, '4qhp_zn_pentad')::numeric, 3) AS step3_theozyme_rmsd,
    round(bio_angle(s.water_o, s.scissile_c, s.oxyanion_o)::numeric, 1) AS step3_burgi_dunitz_deg,
    -- Step 4 (TRANSFORM SINK): 24h RK4 cascade conversion with 2.5x Dock adsorption boost
    round(kin.fractional_conversion::numeric, 3) AS step4_cascade_yield_24h
FROM state_machine s
CROSS JOIN LATERAL (
    SELECT fractional_conversion
    FROM simulate_cascade_kinetics(120.0, 45.0, 260.0, 25.0, 15.0, 2.5, 500.0, 24.0, 24)
    ORDER BY time_hr DESC LIMIT 1
) kin;

\echo ''
\echo '======================================================================'
\echo ' STAGE 3: ENGINE EXECUTION PLAN & SHARED-BUFFER TELEMETRY'
\echo '======================================================================'

EXPLAIN (ANALYZE, BUFFERS)
SELECT
    example_name,
    modality,
    round(sc_rmsd::numeric, 3) AS sc_rmsd,
    cross_interface_hbonds,
    buried_unsatisfied_polars AS buns,
    passes_example_gate
FROM chaperone_core_examples() c
CROSS JOIN LATERAL evaluate_chaperone_core_example_block(
    c.example_name, c.candidate_pdb, c.reference_pdb, c.ligand_smiles
);

\echo ''
\echo '🌐 Blog: https://ideia.me   |   🐙 GitHub: https://github.com/jonatas/pg_bio'
