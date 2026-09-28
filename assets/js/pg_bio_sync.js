window.addEventListener('load', function() {
    // Wait a brief moment to ensure 3Dmol has auto-initialized the declarative HTML viewers
    setTimeout(() => {
        if (typeof $3Dmol === 'undefined' || !$3Dmol.viewers || $3Dmol.viewers.length < 2) return;

        const vLeft = $3Dmol.viewers[0];
        const vRight = $3Dmol.viewers[1];
        
        // We extract the color from the HTML data-style attribute, falling back to cyan/magenta
        // e.g. data-style="cartoon:color=cyan"
        const getBaseColor = (viewerContainer) => {
            const styleStr = viewerContainer.getAttribute('data-style');
            if (styleStr && styleStr.includes('color=')) {
                return styleStr.split('color=')[1].split(';')[0];
            }
            return 'white'; // fallback
        };

        const leftContainer = vLeft.renderer.domElement.parentElement;
        const rightContainer = vRight.renderer.domElement.parentElement;

        const leftColor = getBaseColor(leftContainer) || 'cyan';
        const rightColor = getBaseColor(rightContainer) || 'magenta';

        const flexContainer = leftContainer.parentElement;

        // ----------------------------------------------------
        // Feature 0: Fullscreen Mode
        // ----------------------------------------------------
        const fsButton = document.createElement('button');
        fsButton.innerHTML = '<i class="bi bi-arrows-fullscreen"></i> Enter Fullscreen Comparison';
        fsButton.style.cssText = 'display: block; margin: 10px auto 0 auto; padding: 8px 16px; background: #1e1e1e; color: #fff; border: 1px solid #444; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 14px; transition: 0.2s;';
        
        fsButton.onmouseover = () => fsButton.style.background = '#333';
        fsButton.onmouseout = () => fsButton.style.background = '#1e1e1e';

        flexContainer.parentNode.insertBefore(fsButton, flexContainer);

        fsButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                flexContainer.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === flexContainer) {
                flexContainer.style.background = '#121212';
                flexContainer.style.alignItems = 'center';
                flexContainer.style.height = '100vh';
                flexContainer.style.width = '100vw';
                flexContainer.style.margin = '0';
                flexContainer.style.gap = '5vw';
                
                // left container and viewer
                leftContainer.style.width = '40vw';
                const lv = leftContainer.querySelector('.viewer_3Dmoljs');
                lv.style.height = '80vh';
                lv.style.width = '100%';
                
                // right container and viewer
                rightContainer.style.width = '40vw';
                const rv = rightContainer.querySelector('.viewer_3Dmoljs');
                rv.style.height = '80vh';
                rv.style.width = '100%';
                
            } else {
                flexContainer.style.background = 'transparent';
                flexContainer.style.height = 'auto';
                flexContainer.style.width = 'auto';
                flexContainer.style.marginTop = '20px';
                flexContainer.style.gap = '20px';
                
                leftContainer.style.width = 'auto';
                const lv = leftContainer.querySelector('.viewer_3Dmoljs');
                lv.style.height = '400px';
                lv.style.width = '350px';
                
                rightContainer.style.width = 'auto';
                const rv = rightContainer.querySelector('.viewer_3Dmoljs');
                rv.style.height = '400px';
                rv.style.width = '350px';
            }
        });


        // ----------------------------------------------------
        // Feature 1: Double Click to Sync Cameras
        // ----------------------------------------------------
        let syncing = false;
        let syncInterval;

        const rightCanvas = vRight.renderer.domElement;
        const leftCanvas = vLeft.renderer.domElement;

        const toggleSync = (sourceViewer, targetViewer) => {
            if(syncing) {
                clearInterval(syncInterval);
                syncing = false;
                console.log("3D Viewers Unsynced");
            } else {
                syncing = true;
                targetViewer.setView(sourceViewer.getView());
                targetViewer.render();
                console.log("3D Viewers Synced");
                
                syncInterval = setInterval(() => {
                    targetViewer.setView(sourceViewer.getView());
                    targetViewer.render();
                }, 30);
            }
        };

        rightCanvas.addEventListener('dblclick', () => toggleSync(vRight, vLeft));
        leftCanvas.addEventListener('dblclick', () => toggleSync(vLeft, vRight));

        // ----------------------------------------------------
        // Feature 2: Click to Highlight Matching Residues
        // ----------------------------------------------------
        
        // Right viewer click (Orphan Discovery)
        vRight.setClickable({}, true, function(atom, viewer, event, container) {
            const resi = atom.resi;
            
            // Reset right to base color, highlight clicked residue white
            vRight.setStyle({}, {cartoon: {color: rightColor}});
            vRight.setStyle({resi: resi}, {cartoon: {color: 'white'}});
            vRight.render();

            // Reset left to base color, highlight ALL matching residues with right's color
            // This natively supports multimeric complexes by styling `resi` across all chains!
            vLeft.setStyle({}, {cartoon: {color: leftColor}});
            vLeft.setStyle({resi: resi}, {cartoon: {color: rightColor}});
            vLeft.render();
        });

        // Left viewer click (Known Bait)
        vLeft.setClickable({}, true, function(atom, viewer, event, container) {
            const resi = atom.resi;
            
            // Reset left to base color, highlight clicked residue white
            vLeft.setStyle({}, {cartoon: {color: leftColor}});
            vLeft.setStyle({resi: resi}, {cartoon: {color: 'white'}});
            vLeft.render();

            // Reset right to base color, highlight ALL matching residues with left's color
            vRight.setStyle({}, {cartoon: {color: rightColor}});
            vRight.setStyle({resi: resi}, {cartoon: {color: leftColor}});
            vRight.render();
        });

    }, 1500); // 1.5s delay ensures asynchronous PDB fetching by 3Dmol is largely complete
});
