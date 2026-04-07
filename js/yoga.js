function getExportDataJSON() {
    if (typeof mySequences === 'undefined' || Object.keys(mySequences).length === 0) return null;
    const exportData = {};
    for (const key in mySequences) {
        const seq = mySequences[key];
        exportData[key] = {
            name: seq.name,
            color: seq.color,
            poses: seq.poses.map(p => typeof p === 'string' ? p : (p.breaths && p.breaths > 1 ? `${p.id}:${p.breaths}` : p.id))
        };
    }
    return JSON.stringify(exportData);
}

function saveThisApp(btn) {
    if (window.userProfile) {
        let urlPath = window.location.pathname;
        let fullUrl = window.location.href;
        let title = 'Yoga Sequences';
        
        const exportJSON = getExportDataJSON();
        if (exportJSON) {
            const searchParams = new URLSearchParams();
            searchParams.set('all_seqs', exportJSON);
            searchParams.set('view', '1');
            
            urlPath = window.location.pathname + '?' + searchParams.toString();
            fullUrl = window.location.origin + urlPath;
            title = (typeof activeSequenceKey !== 'undefined' && mySequences[activeSequenceKey]) ? mySequences[activeSequenceKey].name : 'Yoga Sequences';
        }

        const isSaved = window.userProfile.toggleFavorite('yoga', urlPath, fullUrl, title, 'bi-person-arms-up');
        btn.innerHTML = isSaved ? '<i class="bi bi-bookmark-fill text-info"></i>' : '<i class="bi bi-bookmark"></i>';
    }
}

function updateSaveButtonState() {
    const btn = document.getElementById('saveAppBtn');
    if (!btn || !window.userProfile) return;
    
    let urlPath = window.location.pathname;
    const exportJSON = getExportDataJSON();
    if (exportJSON) {
        const searchParams = new URLSearchParams();
        searchParams.set('all_seqs', exportJSON);
        searchParams.set('view', '1');
        urlPath = window.location.pathname + '?' + searchParams.toString();
    }
    
    if (window.userProfile.isSaved(urlPath)) {
        btn.innerHTML = '<i class="bi bi-bookmark-fill text-info"></i>';
    } else {
        btn.innerHTML = '<i class="bi bi-bookmark"></i>';
    }
}

document.addEventListener('DOMContentLoaded', updateSaveButtonState);

const varsDef = [
    { id: '--fig-rot', min: -180, max: 180, label: 'Fig Rot' },
    { id: '--fig-x', min: -200, max: 200, label: 'Fig X' },
    { id: '--fig-y', min: -200, max: 200, label: 'Fig Y' },
    { id: '--torso-cx', min: 0, max: 200, label: 'Spine Curve' },
    { id: '--ub-rot', min: -180, max: 180, label: 'Hip Bend' },
    { id: '--head-rot', min: -90, max: 90, label: 'Head' },
    { id: '--la-rot', min: -360, max: 360, label: 'L Arm Upper' },
    { id: '--le-rot', min: -180, max: 180, label: 'L Arm Lower' },
    { id: '--ra-rot', min: -360, max: 360, label: 'R Arm Upper' },
    { id: '--re-rot', min: -180, max: 180, label: 'R Arm Lower' },
    { id: '--ll-rot', min: -180, max: 180, label: 'L Leg Upper' },
    { id: '--lk-rot', min: -180, max: 180, label: 'L Leg Lower' },
    { id: '--rl-rot', min: -180, max: 180, label: 'R Leg Upper' },
    { id: '--rk-rot', min: -180, max: 180, label: 'R Leg Lower' },
];

// Elements
const nameEl = document.getElementById('poseName');
const descEl = document.getElementById('poseDesc');
const svgContainer = document.getElementById('svgContainer');
const navContainer = document.getElementById('poseNav');
const debugPanel = document.getElementById('debugPanel');
const debugBtn = document.getElementById('debugBtn');
const controls = document.getElementById('controls');
const mainUse = document.getElementById('mainUse');
const yogaManWrapper = document.getElementById('yogaManWrapper');

const zoomOverlay = document.getElementById('zoomOverlay');
const zoomOverlayTitle = document.getElementById('zoomOverlayTitle');
const zoomOverlayText = document.getElementById('zoomOverlayText');

let currentVars = {};
let activeIndex = 0;
let originalSearchPoseIndex = 0;
let currentView = 'side';

let settings = {
    breathDurationMs: 6000
};

// Generate Styles for Variables
function getVarStyles(v) {
    let s = '';
    Object.keys(v).forEach(k => {
        const val = (k.includes('rot')) ? `${v[k]}deg` : `${v[k]}px`;
        s += `${k}: ${val}; `;
    });
    return s;
}

// Save the original poses for patch generation before doing anything
// Note: POSES must be defined before this script is loaded
const ORIGINAL_POSES = typeof POSES !== 'undefined' ? JSON.parse(JSON.stringify(POSES)) : [];
const YOGA_PATCHES_KEY = 'yoga_pose_patches';

function applyYogaPatches() {
    if (typeof POSES === 'undefined') return;
    const rawPatches = localStorage.getItem(YOGA_PATCHES_KEY) || '';
    if (!rawPatches.trim()) return;

    let patchesToKeep = [];
    const blocks = rawPatches.split(/^@@\s+/m).filter(b => b.trim());
    
    for (const block of blocks) {
        const lines = block.split('\n');
        const poseId = lines[0].trim();
        const poseIndex = POSES.findIndex(p => p.id === poseId);
        
        if (poseIndex === -1) continue;
        const pose = POSES[poseIndex];
        
        let modificationsToKeep = [];
        const varMods = {};
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const match = line.match(/^([+-])\s+(--[\w-]+):\s*(.+)$/);
            if (match) {
                const type = match[1];
                const varName = match[2];
                const numVal = parseFloat(match[3]);
                const val = isNaN(numVal) ? match[3] : numVal;
                
                if (!varMods[varName]) varMods[varName] = {};
                varMods[varName][type] = { val, line };
            }
        }
        
        let keptVars = 0;
        for (const varName in varMods) {
            const mod = varMods[varName];
            if (mod['+']) {
                const plusVal = mod['+'].val;
                let upstreamVal = pose.vars?.[varName] ?? pose.varsFront?.[varName];
                
                if (String(upstreamVal) !== String(plusVal)) {
                    if (pose.vars && pose.vars[varName] !== undefined) pose.vars[varName] = plusVal;
                    else if (pose.varsFront && pose.varsFront[varName] !== undefined) pose.varsFront[varName] = plusVal;
                    else { if (!pose.vars) pose.vars = {}; pose.vars[varName] = plusVal; }
                    
                    if (mod['-']) modificationsToKeep.push(mod['-'].line);
                    modificationsToKeep.push(mod['+'].line);
                    keptVars++;
                } else {
                    console.log(`[Yoga Patch] Discarding upstreamed patch: ${poseId} ${varName} = ${plusVal}`);
                }
            }
        }
        
        if (keptVars > 0) {
            patchesToKeep.push(`@@ ${poseId}`);
            patchesToKeep.push(...modificationsToKeep);
        }
    }
    
    const newPatchesStr = patchesToKeep.join('\n');
    if (newPatchesStr !== rawPatches.trim()) {
        localStorage.setItem(YOGA_PATCHES_KEY, newPatchesStr);
    }
}

if (typeof POSES !== 'undefined') {
    applyYogaPatches();

    // Resolve Mathematical Inheritance
    const poseMap = {};
    POSES.forEach(p => poseMap[p.id] = p);
    POSES.forEach(p => {
        if (p.inherit) {
            const parent = poseMap[p.inherit];
            if (parent && parent.vars) {
                p.vars = Object.assign({}, parent.vars, p.vars);
            }
        }
    });

    // Setup UI
    POSES.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'pose-card' + (i === 0 ? ' active' : '');
        card.draggable = true;
        card.dataset.name = p.name;
        card.addEventListener('dragstart', (e) => drag(e, p.id));
        
        // Extract short name for the thumbnail (e.g. "Tree Pose")
        const shortName = p.name.split('(')[0].trim();
        
        card.innerHTML = `
            <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" class="mini-pose" style="${getVarStyles(p.vars)}">
                <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.05)" stroke-width="4" />
                <use href="#stickman" />
            </svg>
            <div class="pose-card-name">${shortName}</div>
        `;
        
        card.addEventListener('mouseenter', () => {
            const ff = document.getElementById('fuzzyFinder');
            if (ff && ff.style.display !== 'none') {
                const visibleCards = Array.from(document.querySelectorAll('#poseNav .pose-card')).filter(c => c.style.display !== 'none');
                visibleCards.forEach(c => c.classList.remove('search-selected'));
                card.classList.add('search-selected');
                loadPose(i);
            }
        });
        
        card.addEventListener('click', () => {
            loadPose(i);
            const ff = document.getElementById('fuzzyFinder');
            if (ff && ff.style.display !== 'none') {
                ff.style.display = 'none';
                document.getElementById('fuzzyInput').value = '';
                filterPoses('');
            }
        });
        if (navContainer) navContainer.appendChild(card);
    });
}

function applyVars(v) {
    if (!svgContainer) return;
    // First remove any properties that were in currentVars but are not in the new v
    Object.keys(currentVars).forEach(k => {
        if (!(k in v)) {
            svgContainer.style.removeProperty(k);
        }
    });

    // Generate torso paths
    let cx = v['--torso-cx'] !== undefined ? v['--torso-cx'] : 100;
    let cy = v['--torso-cy'] !== undefined ? v['--torso-cy'] : 150;
    let tp = document.getElementById('torso-path');
    if (tp) tp.setAttribute('d', `M 100 200 Q ${cx} ${cy} 100 100`);
    svgContainer.style.setProperty('--torso-path', `path('M 100 200 Q ${cx} ${cy} 100 100')`);
    
    let cxf = v['--torso-cx-f'] !== undefined ? v['--torso-cx-f'] : 100;
    let cyf = v['--torso-cy-f'] !== undefined ? v['--torso-cy-f'] : 150;
    let tpf = document.getElementById('torso-path-f');
    if (tpf) tpf.setAttribute('d', `M 100 200 Q ${cxf} ${cyf} 100 100`);
    svgContainer.style.setProperty('--torso-path-f', `path('M 100 200 Q ${cxf} ${cyf} 100 100')`);

    Object.keys(v).forEach(k => {
        if (k.startsWith('--torso-cx') || k.startsWith('--torso-cy')) return;
        const val = (k.includes('opacity')) ? `${v[k]}` : (k.includes('rot') ? `${v[k]}deg` : `${v[k]}px`);
        svgContainer.style.setProperty(k, val);
        
        // update debug UI if applicable
        const inp = document.getElementById('inp_' + k);
        const num = document.getElementById('num_' + k);
        if (inp && num) {
            inp.value = v[k];
            num.value = v[k];
        }
    });
    currentVars = { ...v };
}

function loadPose(index) {
    if (typeof POSES === 'undefined') return;
    // Update Active State
    const cards = navContainer ? navContainer.querySelectorAll('.pose-card') : [];
    if (cards.length > 0) {
        cards[activeIndex].classList.remove('active');
        activeIndex = index;
        cards[activeIndex].classList.add('active');
    }

    const pose = POSES[index];
    if (!pose) return;
    
    // Format name to separate sanskrit
    const match = pose.name.match(/(.+?)\s*\((.+?)\)$/);
    if (match) {
        const displayName = match[1].trim();
        const sanskritName = match[2].trim();
        if (nameEl) nameEl.innerHTML = `${displayName}<br><span class="sanskrit-name">${sanskritName}</span>`;
    } else {
        if (nameEl) nameEl.textContent = pose.name;
    }

    if (descEl) descEl.textContent = pose.desc;
    // Check views and apply logic
    if (pose.view === 'front' || pose.varsFront) {
        if (pose.view === 'front') {
            toggleView('front');
        } else if (currentView === 'front' && !pose.varsFront) {
            toggleView('side');
        } else if (currentView === 'front' && pose.varsFront) {
            toggleView('front');
        } else {
            applyVars(pose.vars);
        }
    } else {
        if (currentView === 'front') toggleView('side');
        applyVars(pose.vars);
    }
    
    renderFlowSuggestions(pose.id);
}

window.updateFlowSuggestions = function() {
    const toggle = document.getElementById('suggestFlowsToggle');
    if (toggle && !toggle.checked) {
        const container = document.getElementById('flowSuggestions');
        if (container) {
            container.innerHTML = '';
            container.classList.remove('active');
        }
        return;
    }
    if (sequence.length > 0) {
        const lastPoseId = sequence[sequence.length - 1].id;
        renderFlowSuggestions(lastPoseId);
    } else {
        const container = document.getElementById('flowSuggestions');
        if (container) {
            container.innerHTML = '';
            container.classList.remove('active');
        }
    }
};

function calculatePoseDistance(pose1, pose2) {
    const v1 = pose1.vars || {};
    const v2 = pose2.vars || {};
    const keys = ['--fig-rot', '--fig-x', '--fig-y', '--ub-rot', '--head-rot', '--la-rot', '--le-rot', '--ra-rot', '--re-rot', '--ll-rot', '--lk-rot', '--rl-rot', '--rk-rot'];
    
    let sumSq = 0;
    keys.forEach(k => {
        let val1 = parseFloat(v1[k]) || 0;
        let val2 = parseFloat(v2[k]) || 0;
        
        // Weight torso and legs more heavily for structural similarity
        let weight = 1;
        if (k.includes('fig-rot') || k.includes('ub-rot') || k.includes('ll-rot') || k.includes('rl-rot')) weight = 2;
        if (k.includes('x') || k.includes('y')) weight = 0.5; // X/Y position matters less than angles
        
        let diff = val1 - val2;
        
        if (k.includes('rot')) {
            while (diff > 180) diff -= 360;
            while (diff < -180) diff += 360;
        }
        
        sumSq += (diff * weight) ** 2;
    });
    return Math.sqrt(sumSq);
}

function renderFlowSuggestions(poseId) {
    const container = document.getElementById('flowSuggestions');
    if (!container) return;
    container.innerHTML = '';
    
    if (typeof activeSequenceKey === 'undefined' || !activeSequenceKey.startsWith('custom-') || playTimeout !== null) {
        container.classList.remove('active');
        return;
    }

    const toggle = document.getElementById('suggestFlowsToggle');
    if (toggle && !toggle.checked) {
        container.classList.remove('active');
        return;
    }

    if (typeof POSES === 'undefined') return;
    const pose = POSES.find(p => p.id === poseId);
    if (!pose) {
        container.classList.remove('active');
        return;
    }

    let flowIds = [...(pose.flow || [])];
    let autoSuggestedIds = [];

    // Expand or fallback: guarantee at least 4 suggestions via vector search 
    if (flowIds.length < 4) {
        const distances = POSES.map(p => ({
            id: p.id,
            distance: calculatePoseDistance(pose, p)
        })).filter(d => d.id !== poseId && !flowIds.includes(d.id));
        
        distances.sort((a, b) => a.distance - b.distance);
        
        const needed = 4 - flowIds.length;
        autoSuggestedIds = distances.slice(0, needed).map(d => d.id);
        flowIds = flowIds.concat(autoSuggestedIds);
    }

    if (flowIds.length === 0) {
        container.classList.remove('active');
        return;
    }

    container.classList.add('active');
    
    flowIds.forEach(flowId => {
        const fPose = POSES.find(p => p.id === flowId);
        if (!fPose) return;

        const isAuto = autoSuggestedIds.includes(flowId);
        const btn = document.createElement('button');
        btn.className = 'flow-card';
        btn.dataset.id = flowId;
        
        const icon = isAuto ? '<i class="bi bi-stars"></i>' : '<i class="bi bi-bezier2"></i>';
        btn.innerHTML = `${icon} <span>${fPose.name.split(' (')[0]}</span>`;
        btn.title = isAuto ? `Similar pose to ${fPose.name}` : `Flow into ${fPose.name}`;
        
        btn.onclick = () => {
            const fIndex = POSES.indexOf(fPose);
            const placeholder = document.getElementById('timelinePlaceholder');
            if (placeholder) placeholder.style.display = 'none';
            sequence.push({ id: flowId, breaths: 1 });
            saveTimelineToCurrentSequence();
            renderTimeline();
            loadPose(fIndex);
        };
        container.appendChild(btn);
    });
}

window.toggleView = function(viewStr) {
    if (typeof POSES === 'undefined') return;
    const pose = POSES[activeIndex];
    if (!pose) return;

    currentView = viewStr;
    if (viewStr === 'front' && pose.varsFront) {
        if (mainUse) mainUse.setAttribute('href', '#stickman-front');
        applyVars(pose.varsFront);
    } else {
        currentView = 'side';
        if (mainUse) mainUse.setAttribute('href', '#stickman');
        applyVars(pose.vars);
    }
};

// Hotspot Overlay Logic
window.showDetails = function(part, event) {
    if (typeof POSES === 'undefined') return;
    const pose = POSES[activeIndex];
    if (!pose || !pose.details || !pose.details[part]) return;

    if (zoomOverlayTitle) zoomOverlayTitle.textContent = part.charAt(0).toUpperCase() + part.slice(1);
    if (zoomOverlayText) zoomOverlayText.textContent = pose.details[part];

    // Get screen coordinates
    const x = event.clientX;
    const y = event.clientY;

    if (zoomOverlay) {
        zoomOverlay.style.left = `${x + 15}px`;
        zoomOverlay.style.top = `${y + 15}px`;
        zoomOverlay.classList.add('visible');
    }
};

window.hideDetails = function() {
    if (zoomOverlay) zoomOverlay.classList.remove('visible');
};

// Follow mouse while hovering
if (svgContainer) {
    svgContainer.addEventListener('mousemove', (e) => {
        if (zoomOverlay && zoomOverlay.classList.contains('visible')) {
            zoomOverlay.style.left = `${e.clientX + 15}px`;
            zoomOverlay.style.top = `${e.clientY + 15}px`;
        }
    });
}

// Dynamic Sequences & Theming
let customSequenceCounter = 1;
let mySequences = {
    'sun-a': {
        name: 'Sun Salutation A', color: '#fbbf24',
        poses: ['tadasana', 'urdhva-hastasana', 'uttanasana-a', 'ardha-uttanasana', 'chaturanga-dandasana', 'urdhva-mukha-svanasana', 'adho-mukha-svanasana', 'ardha-uttanasana', 'uttanasana-a', 'urdhva-hastasana', 'tadasana']
    },
    'standing': {
        name: 'Standing Sequence', color: '#34d399',
        poses: ['padangusthasana', 'padahastasana', 'trikonasana', 'parivrtta-trikonasana', 'utthita-parsvakonasana', 'parivrtta-parsvakonasana', 'prasarita-padottanasana', 'prasarita-padottanasana-b', 'prasarita-padottanasana-c', 'prasarita-padottanasana-d', 'parsvottanasana']
    },
    'seated': {
        name: 'Seated Sequence', color: '#60a5fa',
        poses: ['dandasana', 'paschimottanasana', 'purvottanasana', 'ardha-baddha-padma-paschimottanasana', 'triang-mukha-eka-pada-paschimottanasana', 'janu-sirsasana', 'marichyasana-a', 'navasana', 'kurmasana']
    },
    'finishing': {
        name: 'Finishing Sequence', color: '#a78bfa',
        poses: ['urdhva-dhanurasana', 'paschimottanasana', 'salamba-sarvangasana', 'halasana', 'sirsasana', 'balasana', 'baddha-padmasana', 'padmasana', 'tolasana', 'savasana']
    }
};

let activeSequenceKey = 'sun-a';

function renderSeqDots() {
    const container = document.getElementById('seqDots');
    const classContainer = document.getElementById('classroomSeqDots');
    if (container) container.innerHTML = '';
    if (classContainer) classContainer.innerHTML = '';
    
    Object.keys(mySequences).forEach(key => {
        const seq = mySequences[key];
        
        if (container) {
            const btn = document.createElement('button');
            btn.className = 'seq-dot' + (key === activeSequenceKey ? ' active' : '');
            btn.style.setProperty('--dot-color', seq.color);
            btn.title = seq.name;
            btn.onclick = () => loadMacroSequence(key);
            container.appendChild(btn);
        }
        
        if (classContainer) {
            const classBtn = document.createElement('button');
            classBtn.className = 'seq-dot' + (key === activeSequenceKey ? ' active' : '');
            classBtn.style.setProperty('--dot-color', seq.color);
            classBtn.title = seq.name;
            classBtn.onclick = () => { loadMacroSequence(key); if (sequence.length > 0) { const p = POSES.find(pose => pose.id === sequence[playIndex].id); loadPose(POSES.indexOf(p)); } updateClassroomThumbnails(); };
            classContainer.appendChild(classBtn);
        }
    });
    
    if (container) {
        const addBtn = document.createElement('button');
        addBtn.className = 'seq-dot add-seq';
        addBtn.title = 'Add New Sequence';
        addBtn.innerHTML = '<i class="bi bi-plus"></i>';
        addBtn.onclick = addNewSequence;
        container.appendChild(addBtn);
    }
}

function addNewSequence() {
    const key = 'custom-' + customSequenceCounter++;
    mySequences[key] = {
        name: 'New Sequence',
        color: '#f43f5e',
        poses: []
    };
    loadMacroSequence(key);
}

function loadMacroSequence(key) {
    activeSequenceKey = key;
    const seqData = mySequences[key];
    sequence = seqData.poses.map(p => typeof p === 'string' ? { id: p, breaths: 1 } : { ...p });
    
    const nameDisp = document.getElementById('seqNameDisplay');
    if (nameDisp) nameDisp.innerText = seqData.name;
    const nameInp = document.getElementById('seqNameInput');
    if (nameInp) nameInp.value = seqData.name;
    const colorPick = document.getElementById('seqColorPicker');
    if (colorPick) colorPick.value = seqData.color;
    
    stopSequence();
    playIndex = 0;
    renderTimeline();
    renderSeqDots();
    updateAppTheme();
    updateSaveButtonState();
}

function saveTimelineToCurrentSequence() {
    if (mySequences[activeSequenceKey]) {
        mySequences[activeSequenceKey].poses = sequence.map(p => ({ ...p }));
        updateSaveButtonState();
    }
}

function editSeqName() {
    const nameDisp = document.getElementById('seqNameDisplay');
    if (nameDisp) nameDisp.style.display = 'none';
    const input = document.getElementById('seqNameInput');
    if (input) {
        input.style.display = 'block';
        input.focus();
    }
}

function updateSeqName() {
    const input = document.getElementById('seqNameInput');
    const nameDisp = document.getElementById('seqNameDisplay');
    if (!input || !nameDisp) return;
    const newName = input.value;
    input.style.display = 'none';
    nameDisp.style.display = 'block';
    nameDisp.innerText = newName;
    
    if (mySequences[activeSequenceKey]) {
        mySequences[activeSequenceKey].name = newName;
    }
    renderSeqDots();
    updateSaveButtonState();
}

function updateSeqColor(colorVal) {
    if (mySequences[activeSequenceKey]) {
        mySequences[activeSequenceKey].color = colorVal;
        updateAppTheme();
        renderSeqDots();
        updateSaveButtonState();
    }
}

function updateAppTheme() {
    const root = document.documentElement;
    if (mySequences[activeSequenceKey]) {
        root.style.setProperty('--accent-color', mySequences[activeSequenceKey].color);
    }
}

// Drag and Drop Logic
let sequence = [];
let draggedTimelineIndex = null;

function shareSequence() {
    const exportDataJSON = getExportDataJSON();
    if (!exportDataJSON) return alert('No sequences to share!');
    
    const searchParams = new URLSearchParams();
    searchParams.set('all_seqs', exportDataJSON);
    searchParams.set('view', '1');
    const url = window.location.origin + window.location.pathname + '?' + searchParams.toString();
    navigator.clipboard.writeText(url).then(() => {
        alert('Shareable link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy', err);
        prompt('Copy this link:', url);
    });
}

async function exportSequence() {
    if (sequence.length === 0) return alert('Add poses to the sequence first!');
    
    const btn = document.getElementById('exportSeqBtn');
    if (!btn) return;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    btn.style.color = '#ef4444';
    
    try {
        // Fetch worker locally to avoid cross-origin taint
        const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
        const text = await res.text();
        const workerBlob = new Blob([text], { type: 'application/javascript' });
        const workerScriptUrl = URL.createObjectURL(workerBlob);

        const gif = new GIF({
            workers: 4,
            quality: 10,
            workerScript: workerScriptUrl,
            width: 800,
            height: 600,
            background: '#0f172a'
        });

        const canvas = document.createElement('canvas');
        canvas.width = 800; canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        const svgNode = document.getElementById('yogaManSvg');
        
        const renderFrameToCanvas = (vars, view) => {
            return new Promise((resolve) => {
                const clone = svgNode.cloneNode(true);
                
                // Ensure xmlns namespace is defined
                if (!clone.getAttribute('xmlns')) {
                    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                }

                // The external <defs> must be embedded inside this SVG so it can render headlessly
                const defs = document.querySelector('svg > defs');
                if (defs) {
                    clone.insertBefore(defs.cloneNode(true), clone.firstChild);
                }

                // Missing CSS classes must be explicitly inserted so the frame draws with color
                const styleNode = document.createElement('style');
                styleNode.textContent = `
                    .bone-front { stroke: #F8FAFC; stroke-width: 14; stroke-linecap: round; stroke-linejoin: round; }
                    .bone-back { stroke: #94A3B8; stroke-width: 14; stroke-linecap: round; stroke-linejoin: round; }
                    .head { fill: #F8FAFC; }
                    .joint-group { transform-box: view-box; }
                `;
                clone.insertBefore(styleNode, clone.firstChild);

                const mainUse = clone.querySelector('#mainUse');
                if (mainUse) {
                    mainUse.setAttribute('href', view === 'front' ? '#stickman-front' : '#stickman');
                }
                
                const jointGroups = clone.querySelectorAll('.joint-group, .yoga-man, .yoga-man-wrapper');
                jointGroups.forEach(g => {
                    g.style.transition = 'none'; // Ensure instantly applied for snapshots
                });
                Object.keys(vars).forEach(k => {
                    const val = (k.includes('opacity')) ? `${vars[k]}` : (k.includes('rot') ? `${vars[k]}deg` : `${vars[k]}px`);
                    clone.style.setProperty(k, val);
                });
                
                // Force styles into the string
                const xml = new XMLSerializer().serializeToString(clone);
                const svg64 = btoa(unescape(encodeURIComponent(xml)));
                const image64 = 'data:image/svg+xml;base64,' + svg64;
                const img = new Image();
                img.onload = img.onerror = () => {
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve();
                };
                img.src = image64;
            });
        };

        const fps = 20;
        let lastVars = null;
        let lastView = 'side';

        for(let i=0; i<sequence.length; i++) {
            const poseId = sequence[i].id;
            const p = POSES.find(pose => pose.id === poseId);
            const targetView = p.view === 'front' || p.varsFront ? 'front' : 'side';
            const targetVars = targetView === 'front' ? p.varsFront : p.vars;
            
            // Fixed fast timing for GIF: 1 second per pose (800ms transition + 200ms hold)
            const transitionDuration = 800;
            const holdDuration = 200;
            
            if (lastVars) {
                const transitionFrames = Math.floor((transitionDuration / 1000) * fps);
                for (let f = 1; f <= transitionFrames; f++) {
                    const progress = f / transitionFrames;
                    const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out
                    
                    const interpVars = {};
                    Object.keys(targetVars).forEach(k => {
                        const startVal = (lastVars[k] !== undefined && lastView === targetView) ? parseFloat(lastVars[k]) : parseFloat(targetVars[k]);
                        const endVal = parseFloat(targetVars[k]);
                        
                        let diff = endVal - startVal;
                        if (k.includes('rot')) {
                            while (diff > 180) diff -= 360;
                            while (diff < -180) diff += 360;
                        }
                        interpVars[k] = startVal + (diff * ease);
                    });
                    
                    await renderFrameToCanvas(interpVars, targetView);
                    gif.addFrame(ctx, {copy: true, delay: 1000 / fps});
                }
            } else {
                await renderFrameToCanvas(targetVars, targetView);
            }
            
            const holdFrames = Math.floor((holdDuration / 1000) * fps);
            if (holdFrames > 0) {
                await renderFrameToCanvas(targetVars, targetView);
                gif.addFrame(ctx, {copy: true, delay: holdDuration}); 
            }
            
            lastVars = targetVars;
            lastView = targetView;
        }

        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sequence.gif`;
            a.click();
            URL.revokeObjectURL(url);
            
            btn.innerHTML = originalHtml;
            btn.style.color = '';
            URL.revokeObjectURL(workerScriptUrl);
        });

        gif.render();
        
    } catch(e) {
        console.error(e);
        alert("Error generating GIF. Make sure you have a working internet connection.");
        btn.innerHTML = originalHtml;
        btn.style.color = '';
    }
}

// Initial Render
setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    const isView = params.get('view') === '1';

    if (params.has('all_seqs')) {
        try {
            const sequences = JSON.parse(params.get('all_seqs'));
            
            for (const key in sequences) {
                const seqData = sequences[key];
                const formattedPoses = seqData.poses.map(pstr => {
                    if (typeof pstr === 'object') return pstr; 
                    const parts = String(pstr).split(':');
                    return { id: parts[0], breaths: parts[1] ? parseInt(parts[1]) : 1 };
                });
                
                mySequences[key] = {
                    name: seqData.name || 'Shared Sequence',
                    color: seqData.color || '#ffffff',
                    poses: formattedPoses
                };
            }
            
            if (isView) document.body.classList.add('view-mode');
            
            const firstKey = Object.keys(sequences)[0];
            if (firstKey) {
                loadMacroSequence(firstKey);
            } else {
                loadMacroSequence('sun-a');
            }
        } catch(e) {
            console.error('Failed to parse all_seqs', e);
            loadMacroSequence('sun-a');
        }
    } else if (params.has('seq')) {
        const poses = params.get('seq').split(',').filter(p => p).map(pstr => {
            const parts = pstr.split(':');
            return { id: parts[0], breaths: parts[1] ? parseInt(parts[1]) : 1 };
        });
        const name = params.get('name') || 'Shared Sequence';
        const color = params.get('color') || '#ffffff';

        const key = 'shared-1';
        mySequences[key] = {
            name: name,
            color: color,
            poses: poses
        };
        
        if (isView) {
            document.body.classList.add('view-mode');
        }
        
        loadMacroSequence(key);
    } else {
        loadMacroSequence('sun-a');
    }
}, 0);

function allowDrop(ev) {
    ev.preventDefault();
}

function dragEnter(ev) {
    ev.preventDefault();
    const track = document.getElementById('timelineTrack');
    if (track) track.classList.add('drag-over');
}

function dragLeave(ev) {
    const track = document.getElementById('timelineTrack');
    if (track) track.classList.remove('drag-over');
}

function drag(ev, poseId) {
    ev.dataTransfer.setData("poseId", poseId);
    draggedTimelineIndex = null;
}

function dragTimeline(ev, tIndex) {
    ev.dataTransfer.setData("timelineIndex", tIndex);
    draggedTimelineIndex = tIndex;
}

function drop(ev) {
    ev.preventDefault();
    const track = document.getElementById('timelineTrack');
    if (track) track.classList.remove('drag-over');

    const pId = ev.dataTransfer.getData("poseId");
    const tIndex = ev.dataTransfer.getData("timelineIndex");

    if (pId !== "") {
        // Add new from library
        sequence.push({ id: pId, breaths: 1 });
        saveTimelineToCurrentSequence();
        renderTimeline();
    } else if (tIndex !== "") {
        // Reorder to end
        const movedItem = sequence.splice(parseInt(tIndex), 1)[0];
        sequence.push(movedItem);
        saveTimelineToCurrentSequence();
        renderTimeline();
    }
}

function removeFromTimeline(ev, tIndex) {
    ev.stopPropagation();
    sequence.splice(tIndex, 1);
    if (sequence.length === 0) stopSequence();
    saveTimelineToCurrentSequence();
    renderTimeline();
}

function clearSequence() {
    sequence = [];
    stopSequence();
    playIndex = 0;
    saveTimelineToCurrentSequence();
    renderTimeline();
}

window.cycleBreaths = function(ev, tIndex) {
    ev.stopPropagation();
    let b = sequence[tIndex].breaths || 1;
    b = b >= 3 ? 1 : b + 1;
    sequence[tIndex].breaths = b;
    saveTimelineToCurrentSequence();
    renderTimeline();
};

function renderTimeline() {
    const track = document.getElementById('timelineTrack');
    const ph = document.getElementById('timelinePlaceholder');
    if (!track) return;
    
    const existing = track.querySelectorAll('.timeline-card');
    existing.forEach(e => e.remove());

    if (sequence.length === 0) {
        if (ph) ph.style.display = 'block';
        return;
    }
    if (ph) ph.style.display = 'none';

    sequence.forEach((poseItem, tIndex) => {
        const poseId = poseItem.id;
        const breaths = poseItem.breaths || 1;
        if (typeof POSES === 'undefined') return;
        const p = POSES.find(pose => pose.id === poseId);
        if (!p) return; // fail safe
        const poseIdx = POSES.indexOf(p);
        
        const card = document.createElement('div');
        card.className = 'timeline-card';
        
        // Visual Indicator for Phase
        const phase = tIndex % 2 === 0 ? 'inhale' : 'exhale';
        card.classList.add(phase);
        card.title = phase === 'inhale' ? 'Inhale phase' : 'Exhale phase';
        
        // Size Timeline Graph visually
        card.style.minWidth = (60 * breaths) + 'px';

        card.draggable = true;
        card.addEventListener('dragstart', (e) => dragTimeline(e, tIndex));
        card.onclick = () => loadPose(poseIdx);

        card.innerHTML = `
            <div class="breath-badge" onclick="cycleBreaths(event, ${tIndex})" title="Click to change breaths">${breaths}<i class="bi bi-lungs"></i></div>
            <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" class="mini-pose" style="${getVarStyles(p.vars)}">
                <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.05)" stroke-width="4" />
                <use href="#stickman" />
            </svg>
            <button class="remove-btn" onclick="removeFromTimeline(event, ${tIndex})"><i class="bi bi-x"></i></button>
        `;
        track.appendChild(card);
    });
    updateTimelineHighlight(playIndex - 1);
    updateFlowSuggestions();
}

// Auto-play Engine
let playTimeout = null;
let playIndex = 0;

function togglePlaySequence() {
    if (playTimeout) {
        stopSequence();
    } else {
        if (sequence.length === 0) return;
        startSequence();
    }
}

function startSequence() {
    if (document.body.classList.contains('classroom-mode')) return;
    const icon = document.getElementById('playIcon');
    if (icon) icon.className = 'bi bi-pause-fill';
    playNextPose();
}

function stopSequence() {
    const icon = document.getElementById('playIcon');
    if (icon) icon.className = 'bi bi-play-fill';
    if (playTimeout) clearTimeout(playTimeout);
    playTimeout = null;
}

function playNextPose() {
    if (sequence.length === 0) {
        stopSequence();
        return;
    }
    if (playIndex >= sequence.length) playIndex = 0; // loop back to start
    
    const poseItem = sequence[playIndex];
    if (typeof POSES === 'undefined') return;
    const p = POSES.find(pose => pose.id === poseItem.id);
    if (p) {
        const poseIdx = POSES.indexOf(p);
        loadPose(poseIdx);
        updateTimelineHighlight(playIndex);
    }
    
    const duration = (poseItem.breaths || 1) * settings.breathDurationMs;
    
    playIndex++;
    playTimeout = setTimeout(playNextPose, duration);
}

function updateTimelineHighlight(tIndex) {
    const cards = document.querySelectorAll('#timelineTrack .timeline-card');
    cards.forEach((c, idx) => {
        if (idx === tIndex) c.classList.add('playing');
        else c.classList.remove('playing');
    });
}

// Debug Setup
if (debugBtn) {
    debugBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (debugPanel) debugPanel.classList.toggle('active');
        if (debugPanel && !debugPanel.classList.contains('active') && window.isPatchFilterActive) {
            window.isPatchFilterActive = false;
            filterPoses('');
        }
    });
}

document.addEventListener('click', (e) => {
    if (debugPanel && debugPanel.classList.contains('active') && !debugPanel.contains(e.target)) {
        debugPanel.classList.remove('active');
        if (window.isPatchFilterActive) {
            window.isPatchFilterActive = false;
            filterPoses('');
        }
    }
});

function updateGalleryLayout(layoutOverride) {
    let layout = layoutOverride;
    if (!layout) {
        layout = localStorage.getItem('yoga-gallery-layout') || 'auto';
    }
    document.body.classList.remove('layout-horizontal', 'layout-vertical');
    if (layout === 'horizontal') document.body.classList.add('layout-horizontal');
    if (layout === 'vertical') document.body.classList.add('layout-vertical');
    
    // Update active states
    const btns = {
        'auto': document.getElementById('layoutBtnAuto'),
        'horizontal': document.getElementById('layoutBtnHoriz'),
        'vertical': document.getElementById('layoutBtnVert')
    };
    Object.keys(btns).forEach(k => {
        if (btns[k]) {
            btns[k].style.color = (k === layout) ? 'var(--accent-color)' : 'var(--muted-color)';
        }
    });
    
    localStorage.setItem('yoga-gallery-layout', layout);
}

updateGalleryLayout();

function updateGallerySort(sortMode) {
    const sortInp = document.getElementById('gallerySort');
    if (sortInp) sortInp.value = sortMode;
    
    const btns = {
        'default': document.getElementById('sortBtnDefault'),
        'name': document.getElementById('sortBtnName'),
        'similarity': document.getElementById('sortBtnSimilarity')
    };
    
    Object.keys(btns).forEach(k => {
        if (btns[k]) {
            if (k === sortMode) {
                btns[k].classList.add('active');
            } else {
                btns[k].classList.remove('active');
            }
        }
    });
    
    renderGallery();
}

// Add Breath Duration Setting
if (controls) {
    const breathRow = document.createElement('div');
    breathRow.className = 'debug-row';
    breathRow.style.marginTop = '20px';
    breathRow.style.paddingTop = '10px';
    breathRow.style.borderTop = '1px solid rgba(255,255,255,0.1)';
    breathRow.innerHTML = `
        <label style="width: auto;flex: 1;">Breath Cycle (s)</label>
        <input type="number" id="breathSettingsInput" min="1" max="10" value="6" style="width: 50px;">
    `;
    controls.appendChild(breathRow);
    const breathInput = document.getElementById('breathSettingsInput');
    if (breathInput) {
        breathInput.addEventListener('input', (e) => {
            settings.breathDurationMs = parseInt(e.target.value) * 1000;
            // Also update the global animation duration
            const duration = e.target.value + 's';
            document.documentElement.style.setProperty('--breath-anim-duration', duration);
        });
    }

    varsDef.forEach(v => {
        const row = document.createElement('div');
        row.className = 'debug-row';
        
        const lbl = document.createElement('label');
        lbl.textContent = v.label;
        
        const range = document.createElement('input');
        range.type = 'range';
        range.id = 'inp_' + v.id;
        range.min = v.min;
        range.max = v.max;
        range.value = 0;
        
        const num = document.createElement('input');
        num.type = 'number';
        num.id = 'num_' + v.id;
        num.value = 0;

        const update = (val) => {
            range.value = val;
            num.value = val;
            currentVars[v.id] = parseInt(val);
            applyVars(currentVars);
            
            // Live sync to POSES
            if (typeof POSES !== 'undefined') {
                const activeP = POSES[activeIndex];
                if (activeP.vars && activeP.vars[v.id] !== undefined) {
                    activeP.vars[v.id] = currentVars[v.id];
                } else if (activeP.varsFront && activeP.varsFront[v.id] !== undefined) {
                    activeP.varsFront[v.id] = currentVars[v.id];
                } else {
                    if (!activeP.vars) activeP.vars = {};
                    activeP.vars[v.id] = currentVars[v.id];
                }
            }
            
            window.updatePatchAreaLive();
        };

        range.addEventListener('input', (e) => update(e.target.value));
        num.addEventListener('input', (e) => update(e.target.value));

        row.appendChild(lbl);
        row.appendChild(range);
        row.appendChild(num);
        controls.appendChild(row);
    });
}

const patchArea = document.getElementById('patchArea');
if (patchArea) {
    patchArea.value = localStorage.getItem(YOGA_PATCHES_KEY) || '';
}

window.updatePatchAreaLive = function() {
    if (typeof POSES === 'undefined') return "";
    let allPatchText = "";
    POSES.forEach(p => {
        const originalPose = ORIGINAL_POSES.find(op => op.id === p.id);
        if (!originalPose) return;
        
        let patchLines = [];
        const pVars = p.vars || {};
        const pVarsFront = p.varsFront || {};
        const oVars = originalPose.vars || {};
        const oVarsFront = originalPose.varsFront || {};
        
        const allKeys = new Set([...Object.keys(pVars), ...Object.keys(pVarsFront)]);
        for (const key of allKeys) {
            const curVal = pVars[key] !== undefined ? pVars[key] : pVarsFront[key];
            const origVal = oVars[key] !== undefined ? oVars[key] : oVarsFront[key];
            
            if (origVal !== undefined && String(origVal) !== String(curVal)) {
                patchLines.push("- " + key + ": " + origVal);
                patchLines.push("+ " + key + ": " + curVal);
            }
        }
        
        if (patchLines.length > 0) {
            allPatchText += "@@ " + p.id + "\n" + patchLines.join("\n") + "\n";
        }
    });
    
    const patchArea = document.getElementById('patchArea');
    if (patchArea && allPatchText) {
        // If it's different from current we overwrite
        patchArea.value = allPatchText;
    } else if (patchArea) {
        patchArea.value = "";
    }
    return allPatchText;
};

window.copyAllPatches = function(btn) {
    const allPatchText = window.updatePatchAreaLive();
    
    if (allPatchText) {
        navigator.clipboard.writeText(allPatchText).then(() => {
            if (btn) {
                const icon = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-check2-all"></i>';
                setTimeout(() => btn.innerHTML = icon, 2000);
            }
        });
    } else {
        alert('No changes detected compared to the original poses.');
    }
};

window.applyPatchesFromUI = function() {
    if (typeof POSES === 'undefined') return;
    const patchArea = document.getElementById('patchArea');
    if (!patchArea) return;
    const text = patchArea.value;
    localStorage.setItem(YOGA_PATCHES_KEY, text);
    
    POSES.forEach((p) => {
        const originalPose = ORIGINAL_POSES.find(op => op.id === p.id);
        if (originalPose) {
            p.vars = JSON.parse(JSON.stringify(originalPose.vars || {}));
            if (originalPose.varsFront) {
                p.varsFront = JSON.parse(JSON.stringify(originalPose.varsFront));
            } else {
                delete p.varsFront;
            }
        }
    });
    
    applyYogaPatches();
    
    const poseMap = {};
    POSES.forEach(p => poseMap[p.id] = p);
    POSES.forEach(p => {
        if (p.inherit) {
            const parent = poseMap[p.inherit];
            if (parent && parent.vars) {
                p.vars = Object.assign({}, parent.vars, p.vars);
            }
        }
    });
    
    window.filterPosesByPatch();
};

window.filterPosesByPatch = function() {
    if (typeof POSES === 'undefined') return;
    const cards = document.querySelectorAll('#poseNav .pose-card');
    let firstPatchedIndex = -1;
    
    POSES.forEach((p, i) => {
        const originalPose = ORIGINAL_POSES.find(op => op.id === p.id);
        let isPatched = false;
        
        if (originalPose) {
            const oVars = originalPose.vars || {};
            const oVarsFront = originalPose.varsFront || {};
            const pVars = p.vars || {};
            const pVarsFront = p.varsFront || {};
            
            const allKeys = new Set([...Object.keys(pVars), ...Object.keys(pVarsFront)]);
            for (const key of allKeys) {
                const curVal = pVars[key] !== undefined ? pVars[key] : pVarsFront[key];
                const origVal = oVars[key] !== undefined ? oVars[key] : oVarsFront[key];
                if (origVal !== undefined && String(origVal) !== String(curVal)) {
                    isPatched = true;
                    break;
                }
            }
        }
        
        if (isPatched && i < cards.length) {
            cards[i].style.display = 'flex';
            if (firstPatchedIndex === -1) firstPatchedIndex = i;
        } else if (i < cards.length) {
            cards[i].style.display = 'none';
        }
    });
    window.isPatchFilterActive = true;
    
    if (firstPatchedIndex !== -1) {
        loadPose(firstPatchedIndex);
        cards[firstPatchedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
};

window.clearPatches = function() {
    if (typeof POSES === 'undefined') return;
    if (confirm('Are you sure you want to remove all local patches and reset to original poses?')) {
        localStorage.removeItem(YOGA_PATCHES_KEY);
        const patchArea = document.getElementById('patchArea');
        if (patchArea) patchArea.value = '';
        
        POSES.forEach((p) => {
            const originalPose = ORIGINAL_POSES.find(op => op.id === p.id);
            if (originalPose) {
                p.vars = JSON.parse(JSON.stringify(originalPose.vars || {}));
                if (originalPose.varsFront) {
                    p.varsFront = JSON.parse(JSON.stringify(originalPose.varsFront));
                } else {
                    delete p.varsFront;
                }
            }
        });
        
        const poseMap = {};
        POSES.forEach(p => poseMap[p.id] = p);
        POSES.forEach(p => {
            if (p.inherit) {
                const parent = poseMap[p.inherit];
                if (parent && parent.vars) {
                    p.vars = Object.assign({}, parent.vars, p.vars);
                }
            }
        });
        
        window.isPatchFilterActive = false;
        filterPoses('');
        loadPose(activeIndex);
    }
};

window.exportPose = function() {
    const expArea = document.getElementById('exportArea');
    if (expArea) {
        expArea.style.display = 'block';
        expArea.value = JSON.stringify(currentVars, null, 2);
    }
};

// Keyboard Shortcuts & Fuzzy Finder
window.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('classroom-mode')) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevClassroomPose(); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); nextClassroomPose(); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); cycleClassroomSequence(-1); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); cycleClassroomSequence(1); return; }
    }
    
    // Fullscreen Cmd+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        toggleFullScreen();
    }
    
    // Cmd+F or Ctrl+F Fuzzy Finder
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        const ff = document.getElementById('fuzzyFinder');
        if (ff && ff.style.display === 'none') {
            originalSearchPoseIndex = activeIndex;
            ff.style.display = 'flex';
            const fInp = document.getElementById('fuzzyInput');
            if (fInp) fInp.focus();
        }
    }

    // 'b' toggles breathing sync
    if (e.key === 'b' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleBreathing();
    }

    // Spacebar Play/Pause/Skip
    if (e.key === ' ' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlaySequence();
    }
    
    // Escape to close fuzzy finder
    if (e.key === 'Escape') {
        const ff = document.getElementById('fuzzyFinder');
        if (ff && ff.style.display !== 'none') {
            ff.style.display = 'none';
            loadPose(originalSearchPoseIndex);
            const fInp = document.getElementById('fuzzyInput');
            if (fInp) {
                fInp.value = '';
                filterPoses('');
                fInp.blur();
            }
        }
        // (Esc also exits fullscreen natively in the browser)
    }
});

window.toggleFullScreen = function() {
    const isNativeFs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
    const isPseudoFs = document.body.classList.contains('classroom-mode');
    
    if (!isNativeFs && !isPseudoFs) {
        switchView('pose');
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("Error attempting to enable fullscreen:", err.message);
                applyClassroomMode(true);
            });
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else {
            applyClassroomMode(true);
        }
    } else {
        if (isNativeFs) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        } else if (isPseudoFs) {
            applyClassroomMode(false);
        }
    }
};

function applyClassroomMode(enable) {
    document.body.classList.toggle('classroom-mode', enable);
    if (enable) {
        stopSequence();
        if (sequence.length > 0) {
            if (playIndex >= sequence.length) playIndex = 0;
            if (typeof POSES !== 'undefined') {
                const p = POSES.find(pose => pose.id === sequence[playIndex].id);
                const poseIdx = POSES.indexOf(p);
                if (poseIdx >= 0) loadPose(poseIdx);
            }
        }
        updateClassroomThumbnails();
    }
}

document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    applyClassroomMode(isFullscreen);
});

document.addEventListener('webkitfullscreenchange', () => {
    const isFullscreen = !!document.webkitFullscreenElement;
    applyClassroomMode(isFullscreen);
});

window.prevClassroomPose = function() {
    if (sequence.length === 0) return;
    playIndex--;
    if (playIndex < 0) playIndex = sequence.length - 1;
    if (typeof POSES !== 'undefined') {
        const p = POSES.find(pose => pose.id === sequence[playIndex].id);
        loadPose(POSES.indexOf(p));
    }
    updateClassroomThumbnails();
};

window.nextClassroomPose = function() {
    if (sequence.length === 0) return;
    playIndex++;
    if (playIndex >= sequence.length) playIndex = 0;
    if (typeof POSES !== 'undefined') {
        const p = POSES.find(pose => pose.id === sequence[playIndex].id);
        loadPose(POSES.indexOf(p));
    }
    updateClassroomThumbnails();
};

window.cycleClassroomSequence = function(dir) {
    const keys = Object.keys(mySequences);
    let idx = keys.indexOf(activeSequenceKey);
    idx += dir;
    if (idx < 0) idx = keys.length - 1;
    if (idx >= keys.length) idx = 0;
    loadMacroSequence(keys[idx]);
    if (sequence.length > 0) {
       if (typeof POSES !== 'undefined') {
           const p = POSES.find(pose => pose.id === sequence[playIndex].id);
           loadPose(POSES.indexOf(p));
       }
    }
    updateClassroomThumbnails();
};

function updateClassroomThumbnails() {
    if (!document.body.classList.contains('classroom-mode') || sequence.length === 0) return;
    const prevIdx = (playIndex - 1 + sequence.length) % sequence.length;
    const nextIdx = (playIndex + 1) % sequence.length;
    
    if (typeof POSES === 'undefined') return;
    const pPrev = POSES.find(p => p.id === sequence[prevIdx].id);
    const pNext = POSES.find(p => p.id === sequence[nextIdx].id);
    
    const prevThumb = document.getElementById('prevPoseThumbnail');
    if (prevThumb) {
        prevThumb.innerHTML = pPrev ? `
            <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" style="${getVarStyles(pPrev.vars)}; width:100%; height:100%;">
                <use href="#stickman" />
            </svg>
        ` : '';
    }
    
    const nextThumb = document.getElementById('nextPoseThumbnail');
    if (nextThumb) {
        nextThumb.innerHTML = pNext ? `
            <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" style="${getVarStyles(pNext.vars)}; width:100%; height:100%;">
                <use href="#stickman" />
            </svg>
        ` : '';
    }
}

window.toggleBreathing = function() {
    document.body.classList.toggle('breathing-sync');
    const btn = document.getElementById('breathBtn');
    if (btn) {
        if (document.body.classList.contains('breathing-sync')) {
            btn.style.color = 'var(--accent-color)';
        } else {
            btn.style.color = '';
        }
    }
    if (typeof gtag === 'function') {
        gtag('event', 'interaction', {
            event_category: 'yoga_app',
            event_label: document.body.classList.contains('breathing-sync') ? 'on' : 'off',
            action: 'toggle_breathing'
        });
    }
};

const fuzzyInp = document.getElementById('fuzzyInput');
if (fuzzyInp) {
    fuzzyInp.addEventListener('input', (e) => filterPoses(e.target.value));
    
    fuzzyInp.addEventListener('keydown', (e) => {
        const ff = document.getElementById('fuzzyFinder');
        if (!ff || ff.style.display === 'none') return;
        
        const cards = Array.from(document.querySelectorAll('#poseNav .pose-card')).filter(c => c.style.display !== 'none');
        if (cards.length === 0) return;
        
        let currentIndex = cards.findIndex(c => c.classList.contains('search-selected'));
        if (currentIndex === -1) currentIndex = 0;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % cards.length;
            cards.forEach(c => c.classList.remove('search-selected'));
            cards[currentIndex].classList.add('search-selected');
            const poseIndex = Array.from(document.querySelectorAll('#poseNav .pose-card')).indexOf(cards[currentIndex]);
            if (poseIndex !== -1) loadPose(poseIndex);
            cards[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            cards.forEach(c => c.classList.remove('search-selected'));
            cards[currentIndex].classList.add('search-selected');
            const poseIndex = Array.from(document.querySelectorAll('#poseNav .pose-card')).indexOf(cards[currentIndex]);
            if (poseIndex !== -1) loadPose(poseIndex);
            cards[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const poseIndex = Array.from(document.querySelectorAll('#poseNav .pose-card')).indexOf(cards[currentIndex]);
            if (poseIndex !== -1 && typeof POSES !== 'undefined') {
                loadPose(poseIndex);
                if (typeof activeSequenceKey !== 'undefined' && activeSequenceKey.startsWith('custom-')) {
                    sequence.push({ id: POSES[poseIndex].id, breaths: 1 });
                    saveTimelineToCurrentSequence();
                    renderTimeline();
                }
            }
            ff.style.display = 'none';
            e.target.value = '';
            filterPoses('');
            e.target.blur();
        }
    });
}

const poseNavEl = document.getElementById('poseNav');
if (poseNavEl) {
    let touchStartY = 0;
    poseNavEl.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, {passive: true});
    
    poseNavEl.addEventListener('touchmove', (e) => {
        if (poseNavEl.scrollTop === 0) {
            let touchEndY = e.touches[0].clientY;
            if (touchEndY - touchStartY > 60) {
                const ff = document.getElementById('fuzzyFinder');
                if (ff && ff.style.display === 'none') {
                    originalSearchPoseIndex = activeIndex;
                    ff.style.display = 'flex';
                    const fInp = document.getElementById('fuzzyInput');
                    if (fInp) fInp.focus();
                }
            }
        }
    }, {passive: true});
}

function filterPoses(query) {
    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    query = normalize(query);
    const cards = document.querySelectorAll('#poseNav .pose-card');
    let firstVisibleIndex = -1;
    cards.forEach((card, i) => {
        const searchString = normalize(card.dataset.name || card.querySelector('.pose-card-name').textContent);
        if (searchString.includes(query)) {
            card.style.display = 'flex';
            if (firstVisibleIndex === -1 && query !== '') {
                firstVisibleIndex = i;
            }
        } else {
            card.style.display = 'none';
        }
        card.classList.remove('search-selected');
    });
    
    // Auto-preview first match if query is not empty
    if (firstVisibleIndex !== -1 && query !== '') {
        cards[firstVisibleIndex].classList.add('search-selected');
        loadPose(firstVisibleIndex);
        cards[firstVisibleIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else if (query === '' && cards[originalSearchPoseIndex]) {
        // If empty query, preview the original pose
        loadPose(originalSearchPoseIndex);
        cards[originalSearchPoseIndex].classList.add('search-selected');
        cards[originalSearchPoseIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function toggleSearch() {
    const ff = document.getElementById('fuzzyFinder');
    if (!ff) return;
    if (ff.style.display === 'none') {
        originalSearchPoseIndex = activeIndex;
        ff.style.display = 'flex';
        const fInp = document.getElementById('fuzzyInput');
        if (fInp) fInp.focus();
    } else {
        ff.style.display = 'none';
        const fInp = document.getElementById('fuzzyInput');
        if (fInp) {
            fInp.value = '';
            filterPoses('');
            fInp.blur();
        }
    }
}

function switchView(viewMode) {
    const viewPoseBtn = document.getElementById('viewPoseBtn');
    const viewGalleryBtn = document.getElementById('viewGalleryBtn');
    const viewQuizBtn = document.getElementById('viewQuizBtn');
    const mainContainer = document.querySelector('.main-wrapper') || document.querySelector('main');
    const timelineArea = document.querySelector('.timeline-area');
    const galleryView = document.getElementById('galleryView');
    const quizView = document.getElementById('quizView');
    
    [viewPoseBtn, viewGalleryBtn, viewQuizBtn].forEach(b => b ? b.classList.remove('active') : null);
    [galleryView, quizView].forEach(v => v ? v.classList.remove('active') : null);
    
    if (viewMode === 'gallery') {
        if (viewGalleryBtn) viewGalleryBtn.classList.add('active');
        if (mainContainer) mainContainer.style.display = 'none';
        if (timelineArea) timelineArea.style.display = 'none';
        if (galleryView) {
            galleryView.classList.add('active');
            renderGallery();
        }
    } else if (viewMode === 'quiz') {
        if (viewQuizBtn) viewQuizBtn.classList.add('active');
        if (mainContainer) mainContainer.style.display = 'none';
        if (timelineArea) timelineArea.style.display = 'none';
        if (quizView) {
            quizView.classList.add('active');
            initQuiz();
        }
    } else {
        if (viewPoseBtn) viewPoseBtn.classList.add('active');
        if (mainContainer) mainContainer.style.display = ''; 
        if (timelineArea) timelineArea.style.display = '';
    }
}

function renderGallery() {
    if (typeof POSES === 'undefined') return;
    const sortInp = document.getElementById('gallerySort');
    const sortVal = sortInp ? sortInp.value : 'default';
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    let posesList = POSES.map((pose, index) => ({ pose, index }));
    
    if (sortVal === 'name') {
        posesList.sort((a, b) => a.pose.name.localeCompare(b.pose.name));
    } else if (sortVal === 'similarity') {
        const currentPose = POSES[activeIndex];
        posesList.sort((a, b) => calculatePoseDistance(currentPose, a.pose) - calculatePoseDistance(currentPose, b.pose));
    }
    
    posesList.forEach(item => {
        const p = item.pose;
        const i = item.index;
        const card = document.createElement('div');
        card.className = 'pose-card' + (i === activeIndex ? ' active' : '');
        
        const shortName = p.name.split('(')[0].trim();
        
        card.innerHTML = `
            <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" class="mini-pose" style="${getVarStyles(p.vars)}">
                <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.05)" stroke-width="4" />
                <use href="#stickman" />
            </svg>
            <div class="pose-card-name">${shortName}</div>
        `;
        
        card.onclick = () => {
            loadPose(i);
            // Update active state in gallery visually immediately
            grid.querySelectorAll('.pose-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            if (typeof activeSequenceKey !== 'undefined' && activeSequenceKey.startsWith('custom-')) {
                sequence.push({ id: p.id, breaths: 1 });
                saveTimelineToCurrentSequence();
                renderTimeline();
            }
            
            if (sortVal === 'similarity') {
                // Re-render if similarity changed to keep the top accurate
                renderGallery();
            }

            // Return to pose view automatically!
            setTimeout(() => {
                switchView('pose');
            }, 100);
        };
        
        grid.appendChild(card);
    });
}

// Quiz System
let currentQuizPose = null;
let quizFormat = 'both';
let quizOptions = [];
let canGuess = true;

window.updateQuizFormat = function(format) {
    quizFormat = format;
    if (window.userProfile && window.userProfile.settings) {
        window.userProfile.settings.yogaQuizFormat = format;
        window.userProfile.save();
    } else {
        localStorage.setItem('yoga-quiz-format', format);
    }
    const qView = document.getElementById('quizView');
    if (qView && qView.classList.contains('active')) {
        // Rerender prompt immediately if active
        if (currentQuizPose) setQuizPrompt(currentQuizPose);
    }
};

function initQuizSettings() {
    let savedFormat = 'both';
    if (window.userProfile && window.userProfile.settings && window.userProfile.settings.yogaQuizFormat) {
        savedFormat = window.userProfile.settings.yogaQuizFormat;
    } else if (localStorage.getItem('yoga-quiz-format')) {
        savedFormat = localStorage.getItem('yoga-quiz-format');
    }
    quizFormat = savedFormat;
    const select = document.getElementById('quizFormatSelect');
    if (select) select.value = savedFormat;
}

window.initQuiz = function() {
    initQuizSettings();
    loadNextQuizQuestion();
};

function setQuizPrompt(pose) {
    const promptEl = document.getElementById('quizPrompt');
    if (!promptEl) return;
    const match = pose.name.match(/(.+?)\s*\((.+?)\)$/);
    let pName = pose.name;
    if (match) {
        const english = match[1].trim();
        const sanskrit = match[2].trim();
        if (quizFormat === 'sanskrit') pName = sanskrit;
        else if (quizFormat === 'english') pName = english;
        else pName = `${english} <br><span class="sanskrit-name" style="font-size: 0.8em; color: var(--teal-color);">(${sanskrit})</span>`;
    }
    promptEl.innerHTML = pName;
}

window.loadNextQuizQuestion = function() {
    if (typeof POSES === 'undefined') return;
    const grid = document.getElementById('quizGrid');
    const feedback = document.getElementById('quizFeedback');
    const nextBtn = document.getElementById('quizNextBtn');
    if (!grid) return;
    
    grid.innerHTML = '';
    if (feedback) feedback.innerHTML = '';
    if (nextBtn) nextBtn.style.display = 'none';
    canGuess = true;

    // Pick 3 random unique poses
    let options = [];
    let availablePoses = POSES.map((p, i) => i);
    for(let i=0; i<Math.min(3, availablePoses.length); i++) {
        const r = Math.floor(Math.random() * availablePoses.length);
        options.push(availablePoses.splice(r, 1)[0]);
    }
    
    // Assign correct answer
    const correctIndex = options[Math.floor(Math.random() * options.length)];
    currentQuizPose = POSES[correctIndex];
    quizOptions = options;

    setQuizPrompt(currentQuizPose);

    options.forEach((optIndex) => {
        const p = POSES[optIndex];
        const match = p.name.match(/(.+?)\s*\((.+?)\)$/);
        let displayName = p.name;
        if (match) {
            displayName = `${match[1].trim()}<br><span class="sanskrit-name">${match[2].trim()}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.innerHTML = `
            <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" style="width: 150px; height: 150px; ${getVarStyles(p.vars)}">
                <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.05)" stroke-width="4" />
                <use href="#stickman" />
            </svg>
            <div class="pose-card-name">${displayName}</div>
        `;
        card.onclick = () => handleQuizGuess(card, p.id);
        grid.appendChild(card);
    });
};

function handleQuizGuess(card, guessedId) {
    if (!canGuess) return;
    canGuess = false;

    const isCorrect = guessedId === currentQuizPose.id;
    const feedback = document.getElementById('quizFeedback');
    const nextBtn = document.getElementById('quizNextBtn');

    if (isCorrect) {
        card.classList.add('correct');
        if (feedback) feedback.innerHTML = '<span style="color: #10b981;">Correct!</span> <a href="/learn-yoga.html" style="color: var(--accent-color); margin-left: 10px; font-size: 0.8em;">Learn more</a>';
    } else {
        card.classList.add('wrong');
        if (feedback) feedback.innerHTML = '<span style="color: #ef4444;">Incorrect!</span> <a href="/learn-yoga.html" style="color: var(--accent-color); margin-left: 10px; font-size: 0.8em;">Review lessons</a>';
        // highlight correct
        const cards = document.querySelectorAll('.quiz-card');
        quizOptions.forEach((optIndex, i) => {
            if (POSES[optIndex].id === currentQuizPose.id) {
                cards[i].classList.add('correct');
            }
        });
    }

    // Reveal all names
    document.querySelectorAll('.quiz-card').forEach(c => c.classList.add('revealed'));
    if (nextBtn) nextBtn.style.display = 'block';
}

// Init
if (typeof POSES !== 'undefined') {
    loadPose(0);
}
initQuizSettings();
