(function () {
    const boundViewerEls = new WeakSet();
    const boundPairs = new Set();
    const activePairs = [];
    const registeredContainers = [];
    let rafRunning = false;

    function resolveContainerEl(elOrId) {
        if (!elOrId) return null;
        if (typeof elOrId === 'string') {
            return document.getElementById(elOrId.replace(/^#/, '')) || document.querySelector(elOrId);
        }
        if (elOrId.jquery && elOrId[0]) return elOrId[0];
        if (elOrId instanceof HTMLElement) return elOrId;
        return null;
    }

    function captureBaseCenter(viewer) {
        if (!viewer || typeof viewer.getView !== 'function') return;
        const v = viewer.getView();
        if (v && v.length >= 8 && Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2])) {
            viewer.__pgBioBaseCenter = [v[0], v[1], v[2]];
        }
    }

    function instrumentViewer(viewer, containerEl) {
        if (!viewer) return viewer;
        const el =
            resolveContainerEl(containerEl) ||
            (viewer.renderer && viewer.renderer.domElement ? viewer.renderer.domElement.parentElement : null);

        if (el) {
            el.__pgBioViewer = viewer;
            viewer.__pgBioContainer = el;
            if (!registeredContainers.includes(el)) {
                registeredContainers.push(el);
            }
        }

        if (!viewer.__pgBioWrapped) {
            viewer.__pgBioWrapped = true;
            if (typeof viewer.zoomTo === 'function') {
                const origZoomTo = viewer.zoomTo.bind(viewer);
                viewer.zoomTo = function (...args) {
                    const res = origZoomTo(...args);
                    captureBaseCenter(viewer);
                    return res;
                };
            }
            if (typeof viewer.addModel === 'function') {
                const origAddModel = viewer.addModel.bind(viewer);
                viewer.addModel = function (...args) {
                    const res = origAddModel(...args);
                    setTimeout(() => captureBaseCenter(viewer), 0);
                    return res;
                };
            }
            setTimeout(() => captureBaseCenter(viewer), 50);
        }

        return viewer;
    }

    function hook3DmolCreateViewer() {
        if (typeof window.$3Dmol === 'undefined' || !window.$3Dmol) return;
        if (window.$3Dmol.__pgBioHookedCreateViewer) return;
        if (typeof window.$3Dmol.createViewer !== 'function') return;

        const origCreate = window.$3Dmol.createViewer.bind(window.$3Dmol);
        window.$3Dmol.createViewer = function (elOrId, config) {
            const viewer = origCreate(elOrId, config);
            instrumentViewer(viewer, elOrId);
            setTimeout(discoverAndBindPairs, 60);
            return viewer;
        };
        window.$3Dmol.__pgBioHookedCreateViewer = true;
    }

    function syncPairViews(pair) {
        const source = pair.leader;
        const target = pair.follower;
        if (!source || !target) return;
        if (typeof source.getView !== 'function' || typeof target.getView !== 'function') return;

        const sView = source.getView(); // [cx, cy, cz, zoom, qx, qy, qz, qw]
        const tView = target.getView();
        if (!sView || !tView || sView.length < 8 || tView.length < 8) return;
        if (!Number.isFinite(sView[3]) || !Number.isFinite(sView[7])) return;

        if (!source.__pgBioBaseCenter) captureBaseCenter(source);
        if (!target.__pgBioBaseCenter) captureBaseCenter(target);

        const sBase = source.__pgBioBaseCenter || [sView[0], sView[1], sView[2]];
        const tBase = target.__pgBioBaseCenter || [tView[0], tView[1], tView[2]];

        // Mirror pan delta (0,1,2), zoom/scroll (3), and 3D rotation quaternion (4,5,6,7)
        const want0 = tBase[0] + (sView[0] - sBase[0]);
        const want1 = tBase[1] + (sView[1] - sBase[1]);
        const want2 = tBase[2] + (sView[2] - sBase[2]);
        const want3 = sView[3];
        const want4 = sView[4];
        const want5 = sView[5];
        const want6 = sView[6];
        const want7 = sView[7];

        const delta =
            Math.abs(tView[0] - want0) +
            Math.abs(tView[1] - want1) +
            Math.abs(tView[2] - want2) +
            Math.abs(tView[3] - want3) +
            Math.abs(tView[4] - want4) +
            Math.abs(tView[5] - want5) +
            Math.abs(tView[6] - want6) +
            Math.abs(tView[7] - want7);

        if (delta < 1e-5) return;

        tView[0] = want0;
        tView[1] = want1;
        tView[2] = want2;
        tView[3] = want3;
        tView[4] = want4;
        tView[5] = want5;
        tView[6] = want6;
        tView[7] = want7;

        target.setView(tView);
        target.render();
    }

    function startGlobalSyncLoop() {
        if (rafRunning) return;
        rafRunning = true;
        function tick() {
            for (let i = 0; i < activePairs.length; i++) {
                syncPairViews(activePairs[i]);
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function getBaseColor(viewerContainer, fallback) {
        const styleStr = viewerContainer ? viewerContainer.getAttribute('data-style') : null;
        if (styleStr && styleStr.includes('color=')) {
            return styleStr.split('color=')[1].split(';')[0];
        }
        return fallback;
    }

    function bindViewerPair(vLeft, vRight, leftContainer, rightContainer) {
        if (!vLeft || !vRight || vLeft === vRight || !leftContainer || !rightContainer) return;
        const pairId =
            (leftContainer.id || leftContainer.dataset.href || registeredContainers.indexOf(leftContainer)) +
            '::' +
            (rightContainer.id || rightContainer.dataset.href || registeredContainers.indexOf(rightContainer));
        if (boundPairs.has(pairId)) return;
        boundPairs.add(pairId);

        boundViewerEls.add(leftContainer);
        boundViewerEls.add(rightContainer);

        captureBaseCenter(vLeft);
        captureBaseCenter(vRight);

        const pairState = {
            vLeft,
            vRight,
            leftContainer,
            rightContainer,
            leader: vLeft,
            follower: vRight
        };
        activePairs.push(pairState);
        startGlobalSyncLoop();

        const setLeader = (src, dst) => {
            if (!src.__pgBioBaseCenter) captureBaseCenter(src);
            if (!dst.__pgBioBaseCenter) captureBaseCenter(dst);
            pairState.leader = src;
            pairState.follower = dst;
        };

        ['pointerdown', 'mousedown', 'touchstart', 'wheel', 'contextmenu'].forEach(evtName => {
            leftContainer.addEventListener(evtName, () => setLeader(vLeft, vRight), { passive: true, capture: true });
            rightContainer.addEventListener(evtName, () => setLeader(vRight, vLeft), { passive: true, capture: true });
        });

        // Fullscreen & Resizer UI
        let mainFlex = leftContainer.closest('div[style*="display: flex"], div[style*="display:flex"]');
        if (!mainFlex) mainFlex = leftContainer.parentElement ? leftContainer.parentElement.parentElement : null;

        if (mainFlex && !mainFlex.dataset.pgBioFsBound) {
            mainFlex.dataset.pgBioFsBound = '1';
            mainFlex.style.position = 'relative';

            const fsButton = document.createElement('button');
            fsButton.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
            fsButton.title = 'Fullscreen Comparison';
            fsButton.style.cssText =
                'position: absolute; top: -10px; right: -10px; z-index: 1000; padding: 10px; background: #222; color: #fff; border: 1px solid #444; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
            fsButton.onmouseover = () => (fsButton.style.background = '#444');
            fsButton.onmouseout = () => (fsButton.style.background = '#222');
            mainFlex.appendChild(fsButton);

            const resizer = document.createElement('div');
            resizer.style.cssText = 'display: none; width: 10px; cursor: col-resize; background: #444; z-index: 10;';
            const leftWrapper = leftContainer.parentElement;
            const rightWrapper = rightContainer.parentElement;
            if (leftWrapper && rightWrapper && rightWrapper.parentElement === mainFlex) {
                mainFlex.insertBefore(resizer, rightWrapper);
            }

            let isResizing = false;
            resizer.addEventListener('mousedown', e => {
                isResizing = true;
                document.body.style.cursor = 'col-resize';
                e.preventDefault();
            });

            document.addEventListener('mousemove', e => {
                if (!isResizing || !document.fullscreenElement || !leftWrapper || !rightWrapper) return;
                const containerWidth = mainFlex.clientWidth;
                const newLeftWidth = (e.clientX / containerWidth) * 100;
                const newRightWidth = 100 - newLeftWidth;
                leftWrapper.style.width = `calc(${newLeftWidth}% - 5px)`;
                rightWrapper.style.width = `calc(${newRightWidth}% - 5px)`;
                vLeft.resize();
                vRight.resize();
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = 'default';
                    vLeft.resize();
                    vRight.resize();
                }
            });

            fsButton.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    mainFlex.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen();
                }
            });

            document.addEventListener('fullscreenchange', () => {
                if (!leftWrapper || !rightWrapper) return;
                if (document.fullscreenElement === mainFlex) {
                    fsButton.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
                    mainFlex.style.background = '#121212';
                    mainFlex.style.alignItems = 'center';
                    mainFlex.style.height = '100vh';
                    mainFlex.style.width = '100vw';
                    mainFlex.style.margin = '0';
                    mainFlex.style.gap = '0';
                    resizer.style.display = 'block';

                    [leftWrapper, rightWrapper].forEach(w => {
                        w.style.width = 'calc(50% - 5px)';
                        w.style.height = '100%';
                        w.style.display = 'flex';
                        w.style.flexDirection = 'column';
                        w.style.justifyContent = 'center';
                    });
                    leftContainer.style.height = '90vh';
                    leftContainer.style.width = '100%';
                    rightContainer.style.height = '90vh';
                    rightContainer.style.width = '100%';
                    setTimeout(() => {
                        vLeft.resize();
                        vRight.resize();
                    }, 100);
                } else {
                    fsButton.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
                    mainFlex.style.background = 'transparent';
                    mainFlex.style.height = 'auto';
                    mainFlex.style.width = '100%';
                    mainFlex.style.margin = '20px 0 0 0';
                    mainFlex.style.gap = '20px';
                    resizer.style.display = 'none';

                    [leftWrapper, rightWrapper].forEach(w => {
                        w.style.width = '';
                        w.style.height = '';
                        w.style.display = '';
                    });
                    leftContainer.style.height = '400px';
                    leftContainer.style.width = '100%';
                    rightContainer.style.height = '400px';
                    rightContainer.style.width = '100%';
                    setTimeout(() => {
                        vLeft.resize();
                        vRight.resize();
                    }, 100);
                }
            });
        }

        // Click to Highlight Matching Chain & Residue
        const leftColor = getBaseColor(leftContainer, 'cyan');
        const rightColor = getBaseColor(rightContainer, 'magenta');

        if (typeof vRight.setClickable === 'function' && typeof vLeft.setClickable === 'function') {
            vRight.setClickable({}, true, function (atom) {
                const resi = atom.resi;
                const chain = atom.chain;
                vRight.setStyle({}, { cartoon: { color: rightColor } });
                if (chain) {
                    vRight.setStyle({ chain: chain }, { cartoon: { color: 'orange' } });
                    vRight.setStyle({ chain: chain, resi: resi }, { cartoon: { color: 'white' } });
                } else {
                    vRight.setStyle({ resi: resi }, { cartoon: { color: 'white' } });
                }
                vRight.render();

                vLeft.setStyle({}, { cartoon: { color: leftColor } });
                if (chain) vLeft.setStyle({ chain: chain }, { cartoon: { color: 'orange' } });
                vLeft.setStyle({ resi: resi }, { cartoon: { color: rightColor } });
                if (chain) vLeft.setStyle({ chain: chain, resi: resi }, { cartoon: { color: 'white' } });
                vLeft.render();
            });

            vLeft.setClickable({}, true, function (atom) {
                const resi = atom.resi;
                const chain = atom.chain;
                vLeft.setStyle({}, { cartoon: { color: leftColor } });
                if (chain) {
                    vLeft.setStyle({ chain: chain }, { cartoon: { color: 'orange' } });
                    vLeft.setStyle({ chain: chain, resi: resi }, { cartoon: { color: 'white' } });
                } else {
                    vLeft.setStyle({ resi: resi }, { cartoon: { color: 'white' } });
                }
                vLeft.render();

                vRight.setStyle({}, { cartoon: { color: rightColor } });
                if (chain) vRight.setStyle({ chain: chain }, { cartoon: { color: 'orange' } });
                vRight.setStyle({ resi: resi }, { cartoon: { color: leftColor } });
                if (chain) vRight.setStyle({ chain: chain, resi: resi }, { cartoon: { color: 'white' } });
                vRight.render();
            });
        }
    }

    function discoverAndBindPairs() {
        hook3DmolCreateViewer();

        // 1. Harvest any viewers created by $3Dmol.autoload in $3Dmol.viewers
        if (typeof window.$3Dmol !== 'undefined' && window.$3Dmol && window.$3Dmol.viewers) {
            Object.values(window.$3Dmol.viewers).forEach(v => {
                if (v && v.renderer && v.renderer.domElement) {
                    instrumentViewer(v, v.renderer.domElement.parentElement);
                }
            });
        }

        // 2. Group instrumented containers by their shared flex/grid comparison parent
        const flexGroups = new Map();
        const ungrouped = [];

        registeredContainers.forEach(el => {
            if (!el || !el.__pgBioViewer) return;
            const flexParent = el.closest('div[style*="display: flex"], div[style*="display:flex"], div[style*="display: grid"]');
            if (flexParent) {
                if (!flexGroups.has(flexParent)) flexGroups.set(flexParent, []);
                flexGroups.get(flexParent).push(el);
            } else {
                ungrouped.push(el);
            }
        });

        flexGroups.forEach(group => {
            for (let i = 0; i + 1 < group.length; i += 2) {
                const leftEl = group[i];
                const rightEl = group[i + 1];
                bindViewerPair(leftEl.__pgBioViewer, rightEl.__pgBioViewer, leftEl, rightEl);
            }
        });

        for (let i = 0; i + 1 < ungrouped.length; i += 2) {
            const leftEl = ungrouped[i];
            const rightEl = ungrouped[i + 1];
            bindViewerPair(leftEl.__pgBioViewer, rightEl.__pgBioViewer, leftEl, rightEl);
        }
    }

    // Hook as early as possible and re-scan after DOMContentLoaded and window.load
    hook3DmolCreateViewer();
    document.addEventListener('DOMContentLoaded', () => {
        hook3DmolCreateViewer();
        setTimeout(discoverAndBindPairs, 200);
        setTimeout(discoverAndBindPairs, 800);
    });
    window.addEventListener('load', () => {
        hook3DmolCreateViewer();
        setTimeout(discoverAndBindPairs, 300);
        setTimeout(discoverAndBindPairs, 1200);
    });
})();
