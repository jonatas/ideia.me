const PREDEFINED_CONFIGS = [
    {
        id: 'bw0', name: 'Belly Breathing', idle: '#0d9488',
        ancientName: 'Diaphragmatic Breathing (Foundation)',
        description: 'Foundational across early Taoist Qi Gong and yogic traditions to support proper life force (Prana/Qi) flow. By breathing deeply into the diaphragm, the vagus nerve is activated, signaling immediate safety and calm to the nervous system.',
        phases: [
            { label: 'BELLY RISE', hint: 'let the belly expand outward', ms: 4000, color: '#0d9488', s0: 0.54, s1: 1.00 },
            { label: 'BELLY FALL', hint: 'let the belly fall gently',    ms: 4000, color: '#2563eb', s0: 1.00, s1: 0.54 }
        ]
    },
    {
        id: 'bw1', name: 'Physiological Sigh', idle: '#0EA5E9',
        ancientName: 'Spontaneous Release',
        description: 'While mapped by modern science in the 1930s to describe mammalian emotional release (like a sigh of relief or a dog settling down), this mimics natural neuro-somatic reset sequences. The double inhale pops collapsed alveoli, and the long exhale radically offloads CO2.',
        phases: [
            { label: 'INHALE',       hint: 'inhale through nose',          ms: 2000, color: '#0EA5E9', s0: 0.54, s1: 0.82 },
            { label: '+ INHALE',     hint: 'quick second inhale on top',   ms: 900,  color: '#FBBF24', s0: 0.82, s1: 1.00 },
            { label: 'LONG EXHALE',  hint: 'slow exhale through mouth',    ms: 6000, color: '#7c3aed', s0: 1.00, s1: 0.54 },
            { label: 'PAUSE',        hint: 'rest before next sigh',        ms: 2100, color: '#374151', s0: 0.54, s1: 0.54 }
        ]
    },
    {
        id: 'bw2', name: '3-2-5 Breathing', idle: '#0EA5E9',
        ancientName: 'Prolonged Rechaka (Exhalation)',
        description: 'A variation of prolonged exhalation practices used in ancient relaxation techniques to activate the parasympathetic nervous system. Extending the exhale is universally recognized as the surest way to signal safety to the body.',
        phases: [
            { label: 'BREATHE IN',  hint: 'slow inhale through the nose',  ms: 3000, color: '#0EA5E9', s0: 0.54, s1: 1.00 },
            { label: 'HOLD',        hint: 'hold gently',                   ms: 2000, color: '#FBBF24', s0: 1.00, s1: 1.00 },
            { label: 'BREATHE OUT', hint: 'slow exhale through the mouth', ms: 5000, color: '#7c3aed', s0: 1.00, s1: 0.54 }
        ]
    },
    {
        id: 'bw3', name: 'Box Breathing', idle: '#0EA5E9',
        ancientName: 'Sama Vritti Pranayama (Equal Fluctuations)',
        description: 'Originally "Sama Vritti" means equal mental fluctuations in ancient India. The symmetry is deliberate, designed to force mental regularity and interrupt thought loops. Modern forces (like Navy SEALs) use it as a powerful grounding combat tactic.',
        phases: [
            { label: 'INHALE',      hint: 'in through the nose',     ms: 4000, color: '#0EA5E9', s0: 0.54, s1: 1.00 },
            { label: 'HOLD FULL',   hint: 'hold at the top',         ms: 4000, color: '#FBBF24', s0: 1.00, s1: 1.00 },
            { label: 'EXHALE',      hint: 'out through the mouth',   ms: 4000, color: '#7c3aed', s0: 1.00, s1: 0.54 },
            { label: 'HOLD EMPTY',  hint: 'hold at the bottom',      ms: 4000, color: '#EF4444', s0: 0.54, s1: 0.54 }
        ]
    },
    {
        id: 'bw4', name: 'Resonant Breathing', idle: '#0d9488',
        ancientName: 'Resonance / Mantra Breath',
        description: 'Found in the natural breathing pace of ancient recitations—such as the Rosary or yoga mantras (like "Om Mani Padme Hum"). Modern HRV analysis shows breathing exactly 5.5 to 6 times a minute achieves optimal cardiovascular coherence.',
        phases: [
            { label: 'BREATHE IN',  hint: 'slow — count to 5.5',     ms: 5500, color: '#0d9488', s0: 0.54, s1: 1.00 },
            { label: 'BREATHE OUT', hint: 'slow — count to 5.5',     ms: 5500, color: '#2563eb', s0: 1.00, s1: 0.54 }
        ]
    },
    {
        id: 'bw5', name: '4-7-8 Breathing', idle: '#0EA5E9',
        ancientName: 'Kumbhaka (Breath Retention)',
        description: 'Rooted in the ancient yogic practice of Pranayama, specifically focusing on extending the out-breath and breath retention ("Kumbhaka"). The deliberate mild CO2 buildup created during the long hold counterintuitively sedates the nervous system.',
        phases: [
            { label: 'INHALE',  hint: 'quiet inhale through the nose',   ms: 4000, color: '#0EA5E9', s0: 0.54, s1: 1.00 },
            { label: 'HOLD',    hint: 'hold — feel the stillness',       ms: 7000, color: '#FBBF24', s0: 1.00, s1: 1.00 },
            { label: 'EXHALE',  hint: 'exhale fully through the mouth',  ms: 8000, color: '#7c3aed', s0: 1.00, s1: 0.54 }
        ]
    },
    {
        id: 'bw6', name: 'Alternate Nostril', idle: '#0EA5E9',
        ancientName: 'Nadi Shodhana Pranayama (Channel Purification)',
        description: 'Used in Hatha Yoga to balance the left (Ida / lunar / parasympathetic) and right (Pingala / solar / sympathetic) hemispheres of the brain. Historically practiced to clear energetic "Nadis" before deep meditation.',
        phases: [
            { label: 'INHALE LEFT',  hint: 'close right nostril · inhale left',  ms: 4000, color: '#0EA5E9', s0: 0.54, s1: 1.00 },
            { label: 'HOLD',         hint: 'close both nostrils',                ms: 1000, color: '#FBBF24', s0: 1.00, s1: 1.00 },
            { label: 'EXHALE RIGHT', hint: 'open right · exhale',                ms: 4000, color: '#0d9488', s0: 1.00, s1: 0.54 },
            { label: 'INHALE RIGHT', hint: 'inhale through right nostril',       ms: 4000, color: '#0EA5E9', s0: 0.54, s1: 1.00 },
            { label: 'HOLD',         hint: 'close both nostrils',                ms: 1000, color: '#FBBF24', s0: 1.00, s1: 1.00 },
            { label: 'EXHALE LEFT',  hint: 'open left · exhale',                 ms: 4000, color: '#7c3aed', s0: 1.00, s1: 0.54 }
        ]
    },
    {
        id: 'bw7', name: 'Bhramari (Humming Bee)', idle: '#FBBF24',
        ancientName: 'Bhramari Pranayama',
        description: 'Named after the black Indian bee, this ancient Ayurvedic practice uses a sustained humming sound on the exhalation. The gentle vibrations soothe the nervous system, lower blood pressure, and are traditionally used to relieve anxiety and insomnia.',
        phases: [
            { label: 'INHALE',       hint: 'inhale smoothly',              ms: 4000, color: '#0EA5E9', s0: 0.54, s1: 1.00 },
            { label: 'HUM EXHALE',   hint: 'exhale making a humming sound',ms: 8000, color: '#FBBF24', s0: 1.00, s1: 0.54 }
        ]
    },
    {
        id: 'bw8', name: 'Ocean Breath', idle: '#0EA5E9',
        ancientName: 'Ujjayi Pranayama (Victorious Breath)',
        description: 'Translates to "Victorious Breath". Practiced by gently constricting the back of the throat to create an audible, ocean-like whispering sound. It builds internal body heat (tapas) while powerfully anchoring the mind to the present moment.',
        phases: [
            { label: 'INHALE',       hint: 'inhale with constricted throat', ms: 5000, color: '#0EA5E9', s0: 0.54, s1: 1.00 },
            { label: 'HOLD FULL',    hint: 'pause briefly',                  ms: 1000, color: '#FBBF24', s0: 1.00, s1: 1.00 },
            { label: 'EXHALE',       hint: 'exhale with ocean sound',        ms: 5000, color: '#7c3aed', s0: 1.00, s1: 0.54 },
            { label: 'HOLD EMPTY',   hint: 'pause briefly',                  ms: 1000, color: '#EF4444', s0: 0.54, s1: 0.54 }
        ]
    }
];
