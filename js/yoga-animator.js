// Animator Studio Logic for Yoga App

const SCENES = {
    hill: `
        <rect x="-300" y="-100" width="800" height="600" fill="transparent"></rect>
        <path fill="var(--teal-color)" d="M -400 350 Q 50 200 600 380 L 600 500 L -400 500 Z" opacity="0.6" />
        <path fill="var(--primary-color)" d="M -200 400 Q 250 250 700 350 L 700 500 L -200 500 Z" opacity="0.8" />
    `,
    night: `
        <rect x="-300" y="-100" width="800" height="600" fill="#0f172a"></rect>
        <circle cx="350" cy="0" r="40" fill="#fef08a"></circle>
        <path fill="#475569" d="M -400 350 Q 50 200 600 380 L 600 500 L -400 500 Z" />
        <path fill="#1e293b" d="M -200 400 Q 250 250 700 350 L 700 500 L -200 500 Z" />
    `,
    sun: `
        <rect x="-300" y="-100" width="800" height="600" fill="#fff7ed"></rect>
        <circle cx="0" cy="150" r="150" fill="#fdba74"></circle>
        <circle cx="0" cy="150" r="100" fill="#fb923c"></circle>
    `,
    none: ``
};

let animatorPlayTimeout = null;
let animatorIsPlaying = false;

window.stringifyAnimatorScript = function(frames) {
    let script = "";
    frames.forEach(frame => {
        script += `@@ ${frame.id || 'frame'}\n`;
        if (frame.scene !== null) script += `scene: ${frame.scene}\n`;
        script += `duration: ${frame.duration}\n`;
        if (frame.pose) script += `pose: ${frame.pose}\n`;
        Object.keys(frame.vars).forEach(k => {
            script += `${k}: ${frame.vars[k]}\n`;
        });
        script += "\n";
    });
    return script.trim();
};

window.bootstrapAnimatorScript = function() {
    const scriptArea = document.getElementById('animatorScriptArea');
    if (scriptArea.value.trim() !== '') return; // Don't overwrite if user has started editing
    
    let text = `@@ intro\nscene: hill\nduration: 1000\npose: tadasana\n--fig-x: -300\n\n`;
    text += `@@ walk_1\npose: walking-1\nduration: 500\n--fig-x: -200\n\n`;
    text += `@@ walk_2\npose: walking-2\nduration: 500\n--fig-x: -100\n\n`;
    text += `@@ walk_3\npose: tadasana\nduration: 800\n--fig-x: 0\n\n`;
    
    // Inject current sequence
    if (typeof sequence !== 'undefined' && sequence.length > 0) {
        sequence.forEach((item, i) => {
            text += `@@ seq_${i}_${item.id}\npose: ${item.id}\nduration: ${item.breaths ? item.breaths * 1500 : 2000}\n\n`;
        });
    }
    
    text += `@@ finale\nscene: sun\npose: namaste\nduration: 2000\n--fig-x: 0\n`;
    
    scriptArea.value = text;
    if (typeof renderAnimatorTimeline === 'function') {
        renderAnimatorTimeline();
    }
};

window.parseAnimatorScript = function() {
    const script = document.getElementById('animatorScriptArea').value;
    const blocks = script.split(/@@\s+/).map(p => p.trim()).filter(p => p);
    
    let frames = [];
    
    blocks.forEach(block => {
        const lines = block.split('\n');
        const frameName = lines.shift().trim();
        
        let frameConfig = {
            id: frameName,
            duration: 1000,
            scene: null,
            pose: null,
            vars: {}
        };

        lines.forEach(line => {
            if (!line.includes(':')) return;
            const parts = line.split(':');
            const key = parts[0].trim();
            const val = parts.slice(1).join(':').trim();
            
            if (key === 'duration') {
                frameConfig.duration = parseInt(val) || 1000;
            } else if (key === 'scene') {
                frameConfig.scene = val;
            } else if (key === 'pose') {
                frameConfig.pose = val;
            } else if (key.startsWith('--')) {
                frameConfig.vars[key] = val;
            }
        });
        
        frames.push(frameConfig);
    });
    
    return frames;
}

function stopAnimator() {
    clearTimeout(animatorPlayTimeout);
    animatorIsPlaying = false;
}

function applySceneLayer(sceneName) {
    const layer = document.getElementById('scene-layer');
    if (!layer) return;
    
    if (!sceneName || sceneName === 'none' || !SCENES[sceneName]) {
        layer.style.display = 'none';
        layer.innerHTML = '';
        return;
    }
    
    layer.style.display = '';
    layer.innerHTML = SCENES[sceneName];
}

function playAnimatorFrame(frames, index) {
    if (!animatorIsPlaying || index >= frames.length) {
        stopAnimator();
        return;
    }
    
    const frame = frames[index];
    
    // Apply Scene
    if (frame.scene !== null) {
        applySceneLayer(frame.scene);
    }
    
    // Apply Pose
    let targetVars = {};
    if (frame.pose) {
        const pIndex = POSES.findIndex(p => p.id === frame.pose);
        if (pIndex !== -1) {
            targetVars = { ...POSES[pIndex].vars };
        }
    }
    
    // Apply Overrides
    Object.keys(frame.vars).forEach(k => {
        targetVars[k] = frame.vars[k];
    });

    if (Object.keys(targetVars).length > 0) {
        applyVars(targetVars);
    }
    
    animatorPlayTimeout = setTimeout(() => {
        playAnimatorFrame(frames, index + 1);
    }, frame.duration);
}

window.previewAnimator = function() {
    stopSequence(); // Stop any standard yoga sequence
    stopAnimator();
    
    const frames = parseAnimatorScript();
    if (frames.length === 0) return alert("Write some frames first!");
    
    animatorIsPlaying = true;
    playAnimatorFrame(frames, 0);
};

window.exportAnimatorGif = async function() {
    const frames = parseAnimatorScript();
    if (frames.length === 0) return alert("Write some frames first!");
    
    const btn = document.querySelector('button[onclick="exportAnimatorGif()"]');
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Rendering...';
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';
    
    try {
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
            background: document.documentElement.style.getPropertyValue('--bg-color') || '#0f172a'
        });

        const canvas = document.createElement('canvas');
        canvas.width = 800; canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const svgNode = document.getElementById('yogaManSvg');
        
        const renderFrameToCanvas = (vars, frameNodeOverrides, sceneHtml) => {
            return new Promise((resolve) => {
                const clone = svgNode.cloneNode(true);
                if (!clone.getAttribute('xmlns')) {
                    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                }

                const defs = document.querySelector('svg > defs');
                if (defs) {
                    clone.insertBefore(defs.cloneNode(true), clone.firstChild);
                }

                const styleNode = document.createElement('style');
                let rootStyles = '';
                // Need to embed primary and teal color CSS variables so SVG processes them natively
                const bodyStyles = getComputedStyle(document.body);
                const pColor = bodyStyles.getPropertyValue('--primary-color');
                const tColor = bodyStyles.getPropertyValue('--teal-color');
                const aColor = bodyStyles.getPropertyValue('--accent-color');
                
                rootStyles = `:root { --primary-color: ${pColor}; --teal-color: ${tColor}; --accent-color: ${aColor}; }`;
                
                styleNode.textContent = `
                    ${rootStyles}
                    .bone-front { stroke: #F8FAFC; stroke-width: 14; stroke-linecap: round; stroke-linejoin: round; }
                    .bone-back { stroke: #94A3B8; stroke-width: 14; stroke-linecap: round; stroke-linejoin: round; }
                    .head { fill: #F8FAFC; }
                    .joint-group { transform-box: view-box; }
                    .floor-line { stroke: rgba(255,255,255,0.1); stroke-width: 2; }
                `;
                clone.insertBefore(styleNode, clone.firstChild);

                const sceneLayer = clone.querySelector('#scene-layer');
                if (sceneLayer && sceneHtml !== undefined) {
                    if (sceneHtml === null) {
                        sceneLayer.style.display = 'none';
                    } else {
                        sceneLayer.innerHTML = sceneHtml;
                        sceneLayer.style.display = '';
                    }
                }

                const jointGroups = clone.querySelectorAll('.joint-group, .yoga-man, .yoga-man-wrapper');
                jointGroups.forEach(g => {
                    g.style.transition = 'none';
                });
                
                Object.keys(vars).forEach(k => {
                    const val = (k.includes('opacity')) ? `${vars[k]}` : (k.includes('rot') ? `${vars[k]}deg` : `${vars[k]}px`);
                    clone.style.setProperty(k, val);
                });
                
                const xml = new XMLSerializer().serializeToString(clone);
                const svg64 = btoa(unescape(encodeURIComponent(xml)));
                const image64 = 'data:image/svg+xml;base64,' + svg64;
                const img = new Image();
                img.onload = img.onerror = () => {
                    ctx.fillStyle = bodyStyles.getPropertyValue('--bg-color') || '#0f172a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve();
                };
                img.src = image64;
            });
        };

        const fps = 20;
        let lastVars = null;
        let currentSceneHtml = null;

        for(let i=0; i<frames.length; i++) {
            const frame = frames[i];
            
            if (frame.scene !== null && SCENES[frame.scene]) {
                currentSceneHtml = SCENES[frame.scene];
            } else if (frame.scene === 'none') {
                currentSceneHtml = null;
            }

            let targetVars = {};
            if (frame.pose) {
                const p = POSES.find(pose => pose.id === frame.pose);
                if (p && p.vars) {
                    targetVars = { ...p.vars };
                }
            } else if (lastVars) {
                targetVars = { ...lastVars };
            }
            
            // Apply frame overrides
            Object.keys(frame.vars).forEach(k => {
                targetVars[k] = frame.vars[k];
            });
            
            // Fixed assumption: we spend some time transitioning, and some time holding.
            // Let's make it 80% transition time, 20% hold time based on duration.
            const transitionDuration = frame.duration * 0.8;
            const holdDuration = frame.duration * 0.2;
            
            if (lastVars) {
                const transitionFrames = Math.floor((transitionDuration / 1000) * fps);
                for (let f = 1; f <= transitionFrames; f++) {
                    const progress = f / transitionFrames;
                    const ease = 1 - Math.pow(1 - progress, 3);
                    
                    const interpVars = {};
                    // We only interpolate keys that exist in targetVars
                    Object.keys(targetVars).forEach(k => {
                        const startVal = lastVars[k] !== undefined ? parseFloat(lastVars[k]) : parseFloat(targetVars[k]);
                        const endVal = parseFloat(targetVars[k]);
                        
                        let diff = endVal - startVal;
                        if (k.includes('rot')) {
                            while (diff > 180) diff -= 360;
                            while (diff < -180) diff += 360;
                        }
                        interpVars[k] = startVal + (diff * ease);
                    });
                    
                    await renderFrameToCanvas(interpVars, {}, currentSceneHtml);
                    gif.addFrame(ctx, {copy: true, delay: 1000 / fps});
                }
            } else {
                await renderFrameToCanvas(targetVars, {}, currentSceneHtml);
            }
            
            const holdFrames = Math.floor((holdDuration / 1000) * fps);
            if (holdFrames > 0) {
                await renderFrameToCanvas(targetVars, {}, currentSceneHtml);
                gif.addFrame(ctx, {copy: true, delay: holdDuration}); 
            }
            
            lastVars = targetVars;
        }

        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `animator_${Date.now()}.gif`;
            a.click();
            URL.revokeObjectURL(url);
            
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'all';
            URL.revokeObjectURL(workerScriptUrl);
        });

        gif.render();
        
    } catch(e) {
        console.error(e);
        alert("Error generating GIF. Make sure you have a working internet connection.");
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'all';
    }
};

window.toggleAnimatorTab = function(tabName) {
    const timelineBtn = document.getElementById('animatorTimelineBtn');
    const textBtn = document.getElementById('animatorTextBtn');
    const timelineTab = document.getElementById('animatorTimelineTab');
    const textTab = document.getElementById('animatorTextTab');
    
    if (tabName === 'timeline') {
        timelineBtn.style.color = 'var(--text-color)';
        textBtn.style.color = 'var(--muted-color)';
        timelineTab.style.display = 'flex';
        textTab.style.display = 'none';
        window.renderAnimatorTimeline();
    } else {
        timelineBtn.style.color = 'var(--muted-color)';
        textBtn.style.color = 'var(--text-color)';
        timelineTab.style.display = 'none';
        textTab.style.display = 'flex';
    }
};

window.animatorTimelineZoom = 10;
window.setAnimatorTimelineZoom = function(dir) {
    if (dir === 'in') {
        window.animatorTimelineZoom = Math.max(2, window.animatorTimelineZoom - 2); 
    } else if (dir === 'out') {
        window.animatorTimelineZoom = Math.min(50, window.animatorTimelineZoom + 5); 
    } else if (dir === 'reset') {
        window.animatorTimelineZoom = 10;
    }
    if (typeof window.renderAnimatorTimeline === 'function') {
        window.renderAnimatorTimeline();
    }
};

window.renderAnimatorTimeline = function() {
    const frames = parseAnimatorScript();
    const container = document.getElementById('animatorTimelineNodes');
    if (!container) return;
    
    container.innerHTML = '';
    const ruler = document.getElementById('animatorTimelineRuler');
    if (ruler) ruler.innerHTML = '';
    
    if (frames.length === 0) {
        container.innerHTML = '<div style="color: var(--muted-color); font-size: 0.9rem; padding: 10px;">No frames yet. Switch to Text Editor to add scenes!</div>';
        return;
    }
    
    const zoomScale = window.animatorTimelineZoom;
    
    if (ruler) {
        const totalDuration = frames.reduce((a,f) => a + (parseInt(f.duration) || 1000), 0);
        const totalPx = totalDuration / zoomScale;
        ruler.style.width = totalPx + 'px';
        
        for (let t = 0; t <= totalDuration; t += 1000) {
            const tick = document.createElement('div');
            tick.style.position = 'absolute';
            tick.style.left = (t / zoomScale) + 'px';
            tick.style.borderLeft = '1px solid #475569';
            tick.style.height = '10px';
            tick.style.top = '20px';
            tick.innerHTML = `<span style="font-size: 10px; color: var(--muted-color); position: absolute; top: -18px; left: 2px;">${t/1000}s</span>`;
            ruler.appendChild(tick);
        }
    }
    
    frames.forEach((frame, index) => {
        const node = document.createElement('div');
        node.className = 'animator-node-block';
        node.style.padding = '8px';
        node.style.background = '#334155';
        
        const nodeWidthPx = Math.max(20, (parseInt(frame.duration) || 1000) / zoomScale);
        node.style.width = nodeWidthPx + 'px';
        node.style.minWidth = '20px';
        // Enable physical horizontal grab resizing
        node.style.resize = 'horizontal';
        node.style.overflow = 'hidden';
        
        node.style.cursor = 'pointer';
        node.style.display = 'flex';
        node.style.flexDirection = 'column';
        node.style.gap = '4px';
        node.style.borderRight = '2px solid #0f172a';
        
        node.onmouseover = () => node.style.background = '#475569';
        node.onmouseout = () => node.style.background = '#334155';
        
        node.onclick = () => window.previewAnimatorFrame(index);
        
        let miniVarsStyle = '';
        if (frame.pose && typeof POSES !== 'undefined') {
            const p = POSES.find(pose => pose.id === frame.pose);
            if (p) {
                const mergedVars = { ...p.vars, ...frame.vars };
                miniVarsStyle = typeof getVarStyles === 'function' ? getVarStyles(mergedVars) : '';
            }
        }
        
        node.innerHTML = `
            ${frame.pose ? `<span style="font-size: 11px; color: var(--teal-color);"><i class="bi bi-person"></i> ${frame.pose}</span>` : ''}
            ${frame.scene && frame.scene !== 'none' ? `<span style="font-size: 11px; color: var(--primary-color);"><i class="bi bi-image"></i> ${frame.scene}</span>` : ''}
            ${miniVarsStyle ? `
            <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 60px; margin-top: 5px; opacity: 0.8; ${miniVarsStyle}">
                <use href="#stickman" />
            </svg>` : ''}
        `;
        
        container.appendChild(node);
    });

    const addBtn = document.createElement('button');
    addBtn.style.padding = '10px';
    addBtn.style.background = 'transparent';
    addBtn.style.border = '2px dashed #475569';
    addBtn.style.borderRadius = '4px';
    addBtn.style.color = 'var(--teal-color)';
    addBtn.style.cursor = 'pointer';
    addBtn.innerHTML = '<i class="bi bi-plus-lg"></i> Add Frame';
    addBtn.onclick = () => window.promptAnimatorAddFrame();
    container.appendChild(addBtn);
};

window.promptAnimatorAddFrame = function() {
    const search = prompt("Search for a pose to add (e.g., 'tree', 'tadasana'):");
    if (!search) return;
    
    const query = search.toLowerCase().trim();
    const matches = POSES.filter(p => p.id.includes(query) || p.name.toLowerCase().includes(query));
    if (matches.length === 0) {
        alert("No poses found matching '" + query + "'");
        return;
    }
    
    const poseId = matches[0].id;
    const frames = parseAnimatorScript();
    
    let fallbackX = 0;
    if (frames.length > 0) {
        fallbackX = frames[frames.length - 1].vars['--fig-x'] || fallbackX;
    }
    
    frames.push({
        id: `seq_${poseId}`,
        duration: 1500,
        scene: null,
        pose: poseId,
        vars: { '--fig-x': fallbackX }
    });
    
    document.getElementById('animatorScriptArea').value = window.stringifyAnimatorScript(frames);
    window.renderAnimatorTimeline();
    // auto-focus the new frame
    window.previewAnimatorFrame(frames.length - 1);
};

let isDraggingAnimatorSvg = false;
let animatorDragStartX = 0;
let animatorDragStartY = 0;
let animatorDragInitialFigX = 0;
let animatorDragInitialFigY = 0;
let activeAnimatorFrameIndex = 0;

window.previewAnimatorFrame = function(index) {
    if (typeof stopSequence === 'function') stopSequence();
    stopAnimator();
    const frames = parseAnimatorScript();
    if (index >= frames.length) return;
    
    activeAnimatorFrameIndex = index;
    const frame = frames[index];
    
    // Compute cumulative targetVars based on historical frames (to respect inheritance correctly)
    let targetVars = {};
    for (let i = 0; i <= index; i++) {
        const f = frames[i];
        if (f.pose) {
            const p = POSES.find(pose => pose.id === f.pose);
            if (p && p.vars) {
                targetVars = { ...p.vars };
            }
        }
        Object.keys(f.vars).forEach(k => {
            targetVars[k] = f.vars[k];
        });
    }

    if (frame.scene !== null) {
        applySceneLayer(frame.scene);
    } else {
        // Fallback to finding the last known scene
        let lastScene = 'none';
        for (let i = index; i >= 0; i--) {
            if (frames[i].scene !== null) {
                lastScene = frames[i].scene;
                break;
            }
        }
        applySceneLayer(lastScene);
    }

    if (Object.keys(targetVars).length > 0) {
        applyVars(targetVars);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const svgNode = document.getElementById('yogaManSvg');
    if (!svgNode) return;
    
    svgNode.addEventListener('mousedown', (e) => {
        const animatorView = document.getElementById('animatorView');
        if (!animatorView || animatorView.style.display === 'none') return;
        
        isDraggingAnimatorSvg = true;
        animatorDragStartX = e.clientX;
        animatorDragStartY = e.clientY;
        
        const frames = parseAnimatorScript();
        if (frames.length === 0 || activeAnimatorFrameIndex >= frames.length) return;
        
        const frame = frames[activeAnimatorFrameIndex];
        
        let cX = parseFloat(getComputedStyle(svgNode).getPropertyValue('--fig-x') || 0);
        let cY = parseFloat(getComputedStyle(svgNode).getPropertyValue('--fig-y') || 0);
        
        animatorDragInitialFigX = frame.vars['--fig-x'] !== undefined ? parseFloat(frame.vars['--fig-x']) : cX;
        animatorDragInitialFigY = frame.vars['--fig-y'] !== undefined ? parseFloat(frame.vars['--fig-y']) : cY;
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isDraggingAnimatorSvg) return;
        
        const dx = e.clientX - animatorDragStartX;
        const dy = e.clientY - animatorDragStartY;
        
        const rect = svgNode.getBoundingClientRect();
        const scaleX = 800 / rect.width;
        const scaleY = 600 / rect.height;
        
        const newX = Math.round(animatorDragInitialFigX + (dx * scaleX));
        const newY = Math.round(animatorDragInitialFigY + (dy * scaleY));
        
        svgNode.style.setProperty('--fig-x', newX + 'px');
        svgNode.style.setProperty('--fig-y', newY + 'px');
    });
    
    window.addEventListener('mouseup', (e) => {
        if (!isDraggingAnimatorSvg) return;
        isDraggingAnimatorSvg = false;
        
        const dx = e.clientX - animatorDragStartX;
        const dy = e.clientY - animatorDragStartY;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
        
        const rect = svgNode.getBoundingClientRect();
        const scaleX = 800 / rect.width;
        const scaleY = 600 / rect.height;
        
        const newX = Math.round(animatorDragInitialFigX + (dx * scaleX));
        const newY = Math.round(animatorDragInitialFigY + (dy * scaleY));
        
        const frames = parseAnimatorScript();
        if (activeAnimatorFrameIndex < frames.length) {
            frames[activeAnimatorFrameIndex].vars['--fig-x'] = newX;
            frames[activeAnimatorFrameIndex].vars['--fig-y'] = newY;
            document.getElementById('animatorScriptArea').value = stringifyAnimatorScript(frames);
        }
    });

    // Handle horizontal node block resizing to adjust frame duration sync
    window.addEventListener('mouseup', () => {
        const timelineTab = document.getElementById('animatorTimelineTab');
        if (!timelineTab || timelineTab.style.display === 'none') return;
        
        const nodes = document.querySelectorAll('.animator-node-block');
        if (nodes.length === 0) return;
        
        const frames = parseAnimatorScript();
        if (frames.length !== nodes.length) return;
        
        let changed = false;
        frames.forEach((f, i) => {
            const wPx = nodes[i].offsetWidth;
            const newDuration = Math.round(wPx * window.animatorTimelineZoom);
            const currentDur = parseInt(f.duration) || 1000;
            if (Math.abs(currentDur - newDuration) > 15 && wPx > 22) {
                f.duration = newDuration;
                changed = true;
            }
        });
        
        if (changed) {
            document.getElementById('animatorScriptArea').value = window.stringifyAnimatorScript(frames);
            window.renderAnimatorTimeline();
        }
    });
});

