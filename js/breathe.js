function saveThisApp(btn) {
    if (window.userProfile) {
        const isSaved = window.userProfile.toggleFavorite('breathe', window.location.pathname, window.location.href, 'Breathing Exercises', 'bi-lungs');
        btn.innerHTML = isSaved ? '<i class="bi bi-bookmark-fill text-info"></i>' : '<i class="bi bi-bookmark"></i>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('saveAppBtn');
    if (btn && window.userProfile && window.userProfile.isSaved(window.location.pathname)) {
        btn.innerHTML = '<i class="bi bi-bookmark-fill text-info"></i>';
    }
});

let CONFIGS = [...PREDEFINED_CONFIGS];

// Elements
const selectEl = document.getElementById('exerciseSelect');
const wrapEl = document.getElementById('breatheWrap');
const glowEl = document.getElementById('breatheGlow');
const ringEl = document.getElementById('breatheRing');
const countEl = document.getElementById('breatheCount');
const phaseEl = document.getElementById('breathePhase');
const hintEl = document.getElementById('breatheHint');
const timelineBg = document.getElementById('timelineChartBg');
const timelineProg = document.getElementById('timelineProgress');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const sessionTracker = document.getElementById('sessionTracker');
const giftBtn = document.getElementById('giftBtn');
const customModal = document.getElementById('customModal');
const statsModal = document.getElementById('statsModal');

const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const infoTitle = document.getElementById('infoTitle');
const infoSubtitle = document.getElementById('infoSubtitle');
const infoText = document.getElementById('infoText');

// State
let currentCfg = CONFIGS[0];
let active = false;
let raf = null;
let t0 = null;
let cycleMs = 0;
let lastElapsed = 0;
let sessionBreaths = 0;

// Init Selector
function populateSelector() {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    CONFIGS.forEach((cfg, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = cfg.name;
        selectEl.appendChild(opt);
    });
    // Add custom button
    const opt = document.createElement('option');
    opt.value = 'custom';
    opt.textContent = 'Custom...';
    selectEl.appendChild(opt);
    
    // Re-select if previously selected
    const customIdx = CONFIGS.findIndex(c => c.id === 'custom_cfg');
    if (currentCfg.id === 'custom_cfg' && customIdx !== -1) {
        selectEl.value = customIdx;
    } else {
        selectEl.value = CONFIGS.indexOf(currentCfg);
    }
}
populateSelector();

function setupExercise() {
    // reset state
    active = false;
    cancelAnimationFrame(raf);
    
    if (!selectEl) return;
    const val = selectEl.value;
    if (val === 'custom') {
        if (customModal) customModal.classList.add('active');
        // revert selection temporarily
        selectEl.value = CONFIGS.indexOf(currentCfg);
        return;
    }

    currentCfg = CONFIGS[val];
    cycleMs = currentCfg.phases.reduce((s, p) => s + p.ms, 0);

    // update info btn visibility
    if (infoBtn) {
        if (currentCfg.description) {
            infoBtn.style.display = 'flex';
        } else {
            infoBtn.style.display = 'none';
        }
    }

    // update visual defaults
    if (ringEl) {
        ringEl.style.transform = 'scale(0.72)';
        ringEl.style.background = `radial-gradient(circle at 38% 32%, ${currentCfg.idle}, #1E3A8A)`;
    }
    if (glowEl) glowEl.style.boxShadow = 'none';
    if (countEl) countEl.textContent = '';
    if (phaseEl) {
        phaseEl.textContent = currentCfg.name.toUpperCase();
        phaseEl.style.color = 'var(--text-color)';
    }
    if (hintEl) hintEl.textContent = 'Click the circle to start';
    
    // Build timeline chart bg
    if (timelineBg) {
        timelineBg.innerHTML = '';
        currentCfg.phases.forEach(ph => {
            const perc = (ph.ms / cycleMs) * 100;
            const seg = document.createElement('div');
            seg.className = 'timeline-segment';
            seg.style.width = `${perc}%`;
            seg.style.backgroundColor = ph.color;
            timelineBg.appendChild(seg);
        });
    }
    if (timelineProg) {
        timelineProg.style.width = '0%';
        timelineProg.style.background = 'transparent';
        timelineProg.style.borderRightColor = 'transparent';
    }

    // Reset session tracking for this exercise
    sessionBreaths = 0;
    if (sessionTracker) sessionTracker.innerHTML = '';
}

if (selectEl) selectEl.addEventListener('change', setupExercise);
setupExercise();

// Custom config handlers
window.closeCustomModal = function() {
    if (customModal) customModal.classList.remove('active');
};

window.saveCustomConfig = function() {
    const inh = parseInt(document.getElementById('inpInhale').value) || 4;
    const hl1 = parseInt(document.getElementById('inpHold1').value) || 0;
    const exh = parseInt(document.getElementById('inpExhale').value) || 4;
    const hl2 = parseInt(document.getElementById('inpHold2').value) || 0;

    const phases = [];
    if (inh > 0) phases.push({ label: 'INHALE', hint: 'Inhale smoothly', ms: inh * 1000, color: '#0EA5E9', s0: 0.54, s1: 1.00 });
    if (hl1 > 0) phases.push({ label: 'HOLD FULL', hint: 'Hold breath in', ms: hl1 * 1000, color: '#FBBF24', s0: 1.00, s1: 1.00 });
    if (exh > 0) phases.push({ label: 'EXHALE', hint: 'Exhale fully', ms: exh * 1000, color: '#7c3aed', s0: 1.00, s1: 0.54 });
    if (hl2 > 0) phases.push({ label: 'HOLD EMPTY', hint: 'Hold breath out', ms: hl2 * 1000, color: '#EF4444', s0: 0.54, s1: 0.54 });

    const newCfg = {
        id: 'custom_cfg',
        name: 'Custom Breathing',
        idle: '#0EA5E9',
        phases: phases
    };

    // Replace existing custom or add
    const existingIdx = CONFIGS.findIndex(c => c.id === 'custom_cfg');
    if (existingIdx !== -1) {
        CONFIGS[existingIdx] = newCfg;
    } else {
        CONFIGS.push(newCfg);
    }

    closeCustomModal();
    currentCfg = newCfg;
    populateSelector();
    setupExercise();
};

function ease(t) { return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t; }
function lerp(a, b, t) { return a + (b-a)*t; }

if (wrapEl) {
    wrapEl.addEventListener('click', () => {
        active = !active;
        if (active) {
            t0 = null;
            lastElapsed = 0;
            raf = requestAnimationFrame(tick);
            if (timelineProg) timelineProg.style.borderRightColor = 'white';
        } else {
            setupExercise(); // resets everything
        }
    });
}

function recordCycle() {
    sessionBreaths++;
    
    // Create miniature dot tracker
    const dot = document.createElement('div');
    dot.className = 'tracker-dot';
    dot.style.backgroundColor = currentCfg.idle;
    if (sessionTracker) sessionTracker.appendChild(dot);

    // Save to localStorage
    const totalB = parseInt(localStorage.getItem('ideia_breathe_totalCycles') || '0') + 1;
    const totalT = parseFloat(localStorage.getItem('ideia_breathe_totalTime') || '0') + (cycleMs / 1000);
    localStorage.setItem('ideia_breathe_totalCycles', totalB);
    localStorage.setItem('ideia_breathe_totalTime', totalT);

    // Trigger gift icon
    if (sessionBreaths >= 3 && giftBtn) {
        giftBtn.style.display = 'block';
    }
}

function tick(now) {
    if (!active) return;
    if (!t0) t0 = now;
    var totalElapsed = now - t0;
    var elapsed = totalElapsed % cycleMs;
    
    if (elapsed < lastElapsed && totalElapsed > cycleMs / 2) {
        // cycle rollover!
        recordCycle();
    }
    lastElapsed = elapsed;

    var acc = 0, ph, pe;
    for (var i = 0; i < currentCfg.phases.length; i++) {
        if (elapsed < acc + currentCfg.phases[i].ms) { 
            ph = currentCfg.phases[i]; 
            pe = elapsed - acc; 
            break; 
        }
        acc += currentCfg.phases[i].ms;
    }

    var t  = ease(pe / ph.ms);
    var sc = lerp(ph.s0, ph.s1, t);
    var rem = Math.ceil((ph.ms - pe) / 1000);
    
    if (ringEl) {
        ringEl.style.transform = 'scale(' + sc + ')';
        ringEl.style.background = 'radial-gradient(circle at 38% 32%, ' + ph.color + ', #1E3A8A)';
    }
    if (glowEl) glowEl.style.boxShadow = '0 0 ' + Math.round(38 * sc) + 'px ' + ph.color + '55';
    
    if (countEl) countEl.textContent = rem > 0 ? rem : '';
    if (phaseEl) {
        phaseEl.textContent = ph.label;
        phaseEl.style.color = ph.color;
    }
    if (hintEl) hintEl.textContent = ph.hint;

    // timeline progress
    if (timelineProg) {
        const perc = (elapsed / cycleMs) * 100;
        timelineProg.style.width = `${perc}%`;
        timelineProg.style.background = `linear-gradient(90deg, transparent, ${ph.color}88)`;
    }
    
    raf = requestAnimationFrame(tick);
}

// Modals Handlers
if (infoBtn) {
    infoBtn.addEventListener('click', () => {
        if (currentCfg) {
            if (infoTitle) infoTitle.textContent = currentCfg.name;
            if (infoSubtitle) infoSubtitle.textContent = currentCfg.ancientName || 'Custom Phase Settings';
            
            // Show description or default fallback
            if (infoText) infoText.textContent = currentCfg.description || 'A custom breathing setup created by you. Remember that extending the exhale naturally relaxes the nervous system, while strong inhales generate energy and alertness.';
            
            if (infoModal) infoModal.classList.add('active');
        }
    });
}

window.closeInfoModal = function() {
    if (infoModal) infoModal.classList.remove('active');
};

if (giftBtn) {
    giftBtn.addEventListener('click', () => {
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
        openStatsModal();
    });
}

window.openStatsModal = function() {
    const tb = parseInt(localStorage.getItem('ideia_breathe_totalCycles') || '0');
    const ttSeconds = parseFloat(localStorage.getItem('ideia_breathe_totalTime') || '0');
    const ttMins = (ttSeconds / 60).toFixed(1);

    const statBreaths = document.getElementById('statBreaths');
    const statTime = document.getElementById('statTime');
    if (statBreaths) statBreaths.textContent = tb;
    if (statTime) statTime.textContent = ttMins;
    if (statsModal) statsModal.classList.add('active');
};

window.closeStatsModal = function() {
    if (statsModal) statsModal.classList.remove('active');
};

// Fullscreen logic
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
            });
            fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
        } else {
            document.exitFullscreen();
            fullscreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
        }
    });
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && fullscreenBtn) {
        fullscreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
    }
});
