window.addEventListener('load', function() {
    setTimeout(() => {
        if (typeof $3Dmol === 'undefined' || !$3Dmol.viewers || $3Dmol.viewers.length < 2) return;

        const vLeft = $3Dmol.viewers[0];
        const vRight = $3Dmol.viewers[1];
        
        const getBaseColor = (viewerContainer) => {
            const styleStr = viewerContainer.getAttribute('data-style');
            if (styleStr && styleStr.includes('color=')) {
                return styleStr.split('color=')[1].split(';')[0];
            }
            return 'white';
        };

        const leftContainer = vLeft.renderer.domElement.parentElement;
        const rightContainer = vRight.renderer.domElement.parentElement;
        
        const leftColor = getBaseColor(leftContainer) || 'cyan';
        const rightColor = getBaseColor(rightContainer) || 'magenta';

        // Robustly find the main flex container holding both
        let mainFlex = leftContainer.closest('div[style*="display: flex"]');
        if (!mainFlex) mainFlex = leftContainer.parentElement.parentElement; // Fallback
        
        mainFlex.style.position = 'relative';

        // ----------------------------------------------------
        // Feature 0: Fullscreen with Draggable Divider
        // ----------------------------------------------------
        
        const fsButton = document.createElement('button');
        fsButton.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
        fsButton.title = "Fullscreen Comparison";
        fsButton.style.cssText = 'position: absolute; top: -10px; right: -10px; z-index: 1000; padding: 10px; background: #222; color: #fff; border: 1px solid #444; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
        
        fsButton.onmouseover = () => fsButton.style.background = '#444';
        fsButton.onmouseout = () => fsButton.style.background = '#222';

        mainFlex.appendChild(fsButton);

        // Divider for resizing
        const resizer = document.createElement('div');
        resizer.style.cssText = 'display: none; width: 10px; cursor: col-resize; background: #444; z-index: 10;';
        
        // Insert resizer between left and right parent wrappers
        const leftWrapper = leftContainer.parentElement;
        const rightWrapper = rightContainer.parentElement;
        mainFlex.insertBefore(resizer, rightWrapper);

        let isResizing = false;
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing || !document.fullscreenElement) return;
            const containerWidth = mainFlex.clientWidth;
            const newLeftWidth = (e.clientX / containerWidth) * 100;
            const newRightWidth = 100 - newLeftWidth;
            
            // Adjust widths
            leftWrapper.style.width = `calc(${newLeftWidth}% - 5px)`;
            rightWrapper.style.width = `calc(${newRightWidth}% - 5px)`;
            
            // Trigger 3Dmol resize? Sometimes it helps to poke the renderer
            vLeft.resize();
            vRight.resize();
        });

        document.addEventListener('mouseup', () => {
            if(isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                vLeft.resize();
                vRight.resize();
            }
        });

        fsButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                mainFlex.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === mainFlex) {
                fsButton.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
                
                mainFlex.style.background = '#121212';
                mainFlex.style.alignItems = 'center';
                mainFlex.style.height = '100vh';
                mainFlex.style.width = '100vw';
                mainFlex.style.margin = '0';
                mainFlex.style.gap = '0';
                
                // Show resizer
                resizer.style.display = 'block';
                
                // left wrapper
                leftWrapper.style.width = 'calc(50% - 5px)';
                leftWrapper.style.height = '100%';
                leftWrapper.style.display = 'flex';
                leftWrapper.style.flexDirection = 'column';
                leftWrapper.style.justifyContent = 'center';

                const lv = leftContainer;
                lv.style.height = '90vh';
                lv.style.width = '100%';
                
                // right wrapper
                rightWrapper.style.width = 'calc(50% - 5px)';
                rightWrapper.style.height = '100%';
                rightWrapper.style.display = 'flex';
                rightWrapper.style.flexDirection = 'column';
                rightWrapper.style.justifyContent = 'center';

                const rv = rightContainer;
                rv.style.height = '90vh';
                rv.style.width = '100%';
                
                setTimeout(() => { vLeft.resize(); vRight.resize(); }, 100);
            } else {
                fsButton.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
                
                mainFlex.style.background = 'transparent';
                mainFlex.style.height = 'auto';
                mainFlex.style.width = '100%';
                mainFlex.style.margin = '20px 0 0 0';
                mainFlex.style.gap = '20px';
                
                resizer.style.display = 'none';
                
                leftWrapper.style.width = 'auto';
                leftWrapper.style.height = 'auto';
                leftWrapper.style.display = 'block';

                const lv = leftContainer;
                lv.style.height = '400px';
                lv.style.width = '350px';
                
                rightWrapper.style.width = 'auto';
                rightWrapper.style.height = 'auto';
                rightWrapper.style.display = 'block';

                const rv = rightContainer;
                rv.style.height = '400px';
                rv.style.width = '350px';
                
                setTimeout(() => { vLeft.resize(); vRight.resize(); }, 100);
            }
        });

        // ----------------------------------------------------
        // Feature 1: Double Click to Sync Rotations (Ignore Center/Translation)
        // ----------------------------------------------------
        let syncing = false;
        let syncInterval;

        const rightCanvas = vRight.renderer.domElement;
        const leftCanvas = vLeft.renderer.domElement;

        const syncViewsRobustly = (source, target) => {
            let sView = source.getView(); // [cx, cy, cz, zoom, qx, qy, qz, qw]
            let tView = target.getView();
            
            // Keep target's translation (tView 0,1,2), copy zoom (3) and rotation (4,5,6,7)
            tView[3] = sView[3];
            tView[4] = sView[4];
            tView[5] = sView[5];
            tView[6] = sView[6];
            tView[7] = sView[7];
            
            target.setView(tView);
            target.render();
        };

        const toggleSync = (sourceViewer, targetViewer) => {
            if(syncing) {
                clearInterval(syncInterval);
                syncing = false;
            } else {
                syncing = true;
                syncViewsRobustly(sourceViewer, targetViewer);
                
                syncInterval = setInterval(() => {
                    syncViewsRobustly(sourceViewer, targetViewer);
                }, 30);
            }
        };

        rightCanvas.addEventListener('dblclick', () => toggleSync(vRight, vLeft));
        leftCanvas.addEventListener('dblclick', () => toggleSync(vLeft, vRight));

        // ----------------------------------------------------
        // Feature 2: Click to Highlight Matching Residues
        // ----------------------------------------------------
        vRight.setClickable({}, true, function(atom, viewer, event, container) {
            const resi = atom.resi;
            vRight.setStyle({}, {cartoon: {color: rightColor}});
            vRight.setStyle({resi: resi}, {cartoon: {color: 'white'}});
            vRight.render();

            vLeft.setStyle({}, {cartoon: {color: leftColor}});
            vLeft.setStyle({resi: resi}, {cartoon: {color: rightColor}});
            vLeft.render();
        });

        vLeft.setClickable({}, true, function(atom, viewer, event, container) {
            const resi = atom.resi;
            vLeft.setStyle({}, {cartoon: {color: leftColor}});
            vLeft.setStyle({resi: resi}, {cartoon: {color: 'white'}});
            vLeft.render();

            vRight.setStyle({}, {cartoon: {color: rightColor}});
            vRight.setStyle({resi: resi}, {cartoon: {color: leftColor}});
            vRight.render();
        });

    }, 1500);
});
