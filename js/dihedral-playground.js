/**
 * Dihedral Playground Simulator
 * A 3D environment to build structures using compound wood cuts.
 */

class DihedralPlayground {
    constructor() {
        this.container = document.getElementById('main-canvas');
        this.pieces = [];
        this.selectedObject = null;
        
        this.initThreeJS();
        this.initControls();
        this.initUI();
        this.loadInventory();
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.animate();
    }

    initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 10000);
        this.camera.position.set(200, 200, 300);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(100, 200, 50);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // Grid
        this.gridHelper = new THREE.GridHelper(1000, 50, 0x334155, 0x1e293b);
        this.scene.add(this.gridHelper);
    }

    initControls() {
        // Orbit Controls (Camera)
        this.orbit = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.orbit.enableDamping = true;
        this.orbit.dampingFactor = 0.05;

        // Transform Controls (Moving pieces)
        this.transformControl = new THREE.TransformControls(this.camera, this.renderer.domElement);
        this.transformControl.addEventListener('dragging-changed', (event) => {
            this.orbit.enabled = !event.value;
            if (!event.value) {
                this.executeSnapping();
                this.onObjectTransformed();
            }
        });
        this.scene.add(this.transformControl);

        // Raycaster for selection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    }

    initUI() {
        // Toolbar tools
        document.getElementById('tool-translate').addEventListener('click', (e) => this.setTransformMode('translate', e.currentTarget));
        document.getElementById('tool-rotate').addEventListener('click', (e) => this.setTransformMode('rotate', e.currentTarget));
        
        document.getElementById('action-flip').addEventListener('click', () => this.flipSelected());
        document.getElementById('action-glue').addEventListener('click', () => this.glueSelected());
        document.getElementById('action-delete').addEventListener('click', () => this.deleteSelected());
        document.getElementById('action-magic').addEventListener('click', () => this.autoCompleteShape());

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return; // ignore when typing
            if (e.code === 'Space') {
                e.preventDefault();
                this.autoCompleteShape();
            }
            const key = e.key.toLowerCase();
            if (key === 't') document.getElementById('tool-translate').click();
            if (key === 'r') document.getElementById('tool-rotate').click();
            if (key === 'g') this.glueSelected();
            if (key === 'f') this.flipSelected();
            if (e.key === 'Backspace' || e.key === 'Delete') this.deleteSelected();
        });

        // Add primitives
        document.querySelectorAll('.add-primitive-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.addPrimitive(type);
            });
        });

        // Add assemblies
        document.querySelectorAll('.add-assembly-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.addAssembly(type);
            });
        });
    }

    setTransformMode(mode, btnElement) {
        this.transformControl.setMode(mode);
        document.querySelectorAll('#tool-translate, #tool-rotate').forEach(b => {
            b.classList.remove('active-tool', 'border-sky-400');
            b.classList.add('border-slate-600');
        });
        btnElement.classList.add('active-tool', 'border-sky-400');
        btnElement.classList.remove('border-slate-600');
    }

    loadInventory() {
        const container = document.getElementById('inventory-cuts');
        const emptyMsg = document.getElementById('empty-cuts-msg');
        container.innerHTML = '';
        
        let foundSaved = false;
        try {
            const profileStr = localStorage.getItem('user_profile_data');
            if (profileStr) {
                const profile = JSON.parse(profileStr);
                if (profile.savedItems && profile.savedItems.app) {
                    Object.values(profile.savedItems.app).forEach(item => {
                        if (item.url && (item.url.includes('miter') || item.url.includes('bevel'))) {
                            const params = new URLSearchParams(item.url.split('?')[1]);
                            const miter = parseFloat(params.get('miter')) || 0;
                            const bevel = parseFloat(params.get('bevel')) || 0;
                            const width = parseFloat(params.get('width')) || 40;
                            const height = parseFloat(params.get('height')) || 90;
                            
                            const btn = document.createElement('button');
                            btn.className = 'w-full text-left p-2 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 hover:text-white hover:border-sky-400 transition-colors flex justify-between items-center mb-2';
                            btn.innerHTML = `
                                <span>${item.title || 'Saved Cut'}</span>
                                <i class="bi bi-plus-lg text-sky-400"></i>
                            `;
                            btn.onclick = () => this.addPieceFromData({
                                type: 'cut',
                                width, height, length: 300,
                                miterA: miter, bevelA: bevel,
                                miterB: miter, bevelB: bevel
                            });
                            container.appendChild(btn);
                            foundSaved = true;
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Error loading cuts", e);
        }

        if (!foundSaved) {
            this.addMockInventoryCut(container);
        } else {
            emptyMsg.style.display = 'none';
        }
    }

    addMockInventoryCut(container) {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-2 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:text-white hover:border-sky-400 transition-colors flex justify-between items-center';
        btn.innerHTML = `
            <span>Angle: 31.7° (Icosahedron)</span>
            <i class="bi bi-plus-lg text-sky-400"></i>
        `;
        btn.onclick = () => this.addPieceFromData({
            type: 'cut',
            width: 40, height: 90, length: 300,
            miterA: 0, bevelA: 31.7,
            miterB: 0, bevelB: 31.7
        });
        container.appendChild(btn);
    }

    addPrimitive(type) {
        if (type === 'cube') {
            const geometry = new THREE.BoxGeometry(50, 50, 50);
            const material = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.8, metalness: 0.1 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.ports = [
                { id: 'top', localPosition: new THREE.Vector3(0, 25, 0), localNormal: new THREE.Vector3(0, 1, 0) },
                { id: 'bottom', localPosition: new THREE.Vector3(0, -25, 0), localNormal: new THREE.Vector3(0, -1, 0) }
            ];
            mesh.position.y = 50;
            this.scene.add(mesh);
            this.pieces.push(mesh);
            this.selectObject(mesh);
        } else if (type === 'strut') {
            this.addPieceFromData({
                type: 'cut',
                width: 40, height: 90, length: 300,
                miterA: 0, bevelA: 0,
                miterB: 0, bevelB: 0
            });
        }
    }

    addAssembly(type) {
        if (type === 'icosahedron') {
            if (typeof GeodesicMath === 'undefined') {
                console.error("GeodesicMath not found. Ensure geodesic-math.js is loaded.");
                return;
            }
            
            const radius = 150;
            const faces = GeodesicMath.generateIcosahedron(radius);
            const edges = GeodesicMath.getEdges(faces);
            const angles = GeodesicMath.calculateIcosahedronStrutAngles();
            
            const group = new THREE.Group();
            group.position.y = radius + 50;
            this.scene.add(group);
            
            const w = 15;
            const h = 40; 
            
            const gluedPieces = [];
            
            edges.forEach(edge => {
                const length = edge.v1.distanceTo(edge.v2);
                
                const cutData = {
                    width: w,
                    height: h,
                    length: length,
                    miterA: angles.miter,
                    bevelA: angles.bevel,
                    miterB: angles.miter,
                    bevelB: angles.bevel,
                    joint: 'karma'
                };
                
                const { geometry, normR, normL, l } = this.createCompoundCutGeometry(cutData);
                const material = new THREE.MeshStandardMaterial({ 
                    color: 0x8B5A2B,
                    roughness: 0.8,
                    metalness: 0.1
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.userData.ports = [
                    { id: 'endA', localPosition: new THREE.Vector3(l/2, 0, 0), localNormal: normR },
                    { id: 'endB', localPosition: new THREE.Vector3(-l/2, 0, 0), localNormal: normL }
                ];
                
                // Position and orient the strut
                const midPoint = edge.v1.clone().add(edge.v2).multiplyScalar(0.5);
                mesh.position.copy(midPoint);
                
                const direction = edge.v2.clone().sub(edge.v1).normalize();
                const surfaceNormal = midPoint.clone().normalize();
                
                const strutDir = new THREE.Vector3(1, 0, 0); // X axis is length in createCompoundCutGeometry
                const qAlign = new THREE.Quaternion().setFromUnitVectors(strutDir, direction);
                
                // Roll alignment so local Y (top face) points to surfaceNormal
                const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(qAlign);
                const projSurfaceNormal = surfaceNormal.clone().sub(direction.clone().multiplyScalar(surfaceNormal.dot(direction))).normalize();
                const projLocalY = localY.clone().sub(direction.clone().multiplyScalar(localY.dot(direction))).normalize();
                
                const rollAngle = Math.atan2(
                    direction.clone().dot(projLocalY.clone().cross(projSurfaceNormal)),
                    projLocalY.dot(projSurfaceNormal)
                );
                
                const qRoll = new THREE.Quaternion().setFromAxisAngle(direction, rollAngle);
                mesh.quaternion.multiplyQuaternions(qRoll, qAlign);
                
                // Good Karma Pinwheel correction for the true centroid shift
                // The strut needs to be shifted perpendicular to both surfaceNormal and direction
                const shiftInward = new THREE.Vector3().crossVectors(surfaceNormal, direction).normalize();
                const actualShift = (w / 2) / Math.cos(angles.bevel * Math.PI / 180);
                mesh.position.add(shiftInward.multiplyScalar(actualShift));
                
                group.add(mesh);
                gluedPieces.push(mesh);
            });
            
            gluedPieces.forEach(mesh => {
                mesh.userData.parentGroup = group;
                this.pieces.push(mesh);
            });
            
            this.selectObject(gluedPieces[0]);
        } else if (type === 'triangle') {
            console.log("Triangle assembly coming soon");
        } else if (type === 'square') {
            console.log("Square assembly coming soon");
        }
    }

    createCompoundCutGeometry(data) {
        const w = data.width || 40;
        const h = data.height || 90;
        const l = data.length || 300;
        
        const geometry = new THREE.BufferGeometry();
        const corners = [
            new THREE.Vector3(-l/2, -h/2, -w/2),
            new THREE.Vector3(-l/2,  h/2, -w/2),
            new THREE.Vector3(-l/2,  h/2,  w/2),
            new THREE.Vector3(-l/2, -h/2,  w/2),
            new THREE.Vector3( l/2, -h/2, -w/2),
            new THREE.Vector3( l/2,  h/2, -w/2),
            new THREE.Vector3( l/2,  h/2,  w/2),
            new THREE.Vector3( l/2, -h/2,  w/2)
        ];

        const applyCut = (verts, isRightSide, miter, bevel) => {
            const M = (miter || 0) * Math.PI / 180;
            const B = (bevel || 0) * Math.PI / 180;
            
            const signM = isRightSide ? M : (data.joint === 'karma' ? M : -M);
            const signB = isRightSide ? -B : B;
            
            const normal = new THREE.Vector3(1, 0, 0); 
            normal.applyAxisAngle(new THREE.Vector3(0, 1, 0), signM);
            normal.applyAxisAngle(new THREE.Vector3(0, 0, 1), signB);
            
            const planePt = new THREE.Vector3(isRightSide ? l/2 : -l/2, 0, 0);
            
            for(let i=0; i<4; i++) {
                const idx = isRightSide ? (i+4) : i;
                const basePt = corners[idx];
                const dir = new THREE.Vector3(isRightSide ? -1 : 1, 0, 0); 
                
                const denom = dir.dot(normal);
                if (Math.abs(denom) > 0.0001) {
                    const t = planePt.clone().sub(basePt).dot(normal) / denom;
                    if (t > 0) {
                        verts[idx].addScaledVector(dir, t);
                    }
                }
            }
            return normal;
        };

        const verts = corners.map(v => v.clone());
        const normR = applyCut(verts, true, data.miterA, data.bevelA);
        const normL = applyCut(verts, false, data.miterB, data.bevelB);
        normL.negate(); 
        
        const vertices = new Float32Array(24);
        for(let i=0; i<8; i++) {
            vertices[i*3] = verts[i].x;
            vertices[i*3+1] = verts[i].y;
            vertices[i*3+2] = verts[i].z;
        }

        const indices = [
            0, 3, 2,  0, 2, 1, // Left (-X)
            4, 5, 6,  4, 6, 7, // Right (+X)
            0, 4, 5,  0, 5, 1, // Front (-Z)
            3, 7, 6,  3, 6, 2, // Back (+Z)
            2, 6, 5,  2, 5, 1, // Top (+Y)
            0, 4, 7,  0, 7, 3  // Bottom (-Y)
        ];

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        
        return { geometry, normR, normL, l };
    }

    addPieceFromData(data) {
        const { geometry, normR, normL, l } = this.createCompoundCutGeometry(data);
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x8B5A2B,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.userData.ports = [
            { id: 'endA', localPosition: new THREE.Vector3(l/2, 0, 0), localNormal: normR },
            { id: 'endB', localPosition: new THREE.Vector3(-l/2, 0, 0), localNormal: normL }
        ];
        
        mesh.position.y = 50;
        
        this.scene.add(mesh);
        this.pieces.push(mesh);
        this.selectObject(mesh);
    }

    onPointerDown(event) {
        if (event.button !== 0) return; // Only left click

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.pieces, true);

        if (intersects.length > 0) {
            // Find root group if part of assembly
            let object = intersects[0].object;
            while (object.parent && object.parent !== this.scene && object.parent.type === 'Group') {
                object = object.parent;
            }
            this.selectObject(object);
        } else {
            // Clicking empty space deselects unless clicking gizmo
            const gizmoIntersects = this.raycaster.intersectObjects(this.transformControl.children, true);
            if (gizmoIntersects.length === 0) {
                this.selectObject(null);
            }
        }
    }

    selectObject(object) {
        this.selectedObject = object;
        if (object) {
            this.transformControl.attach(object);
            this.updateInspector(object);
            
            // Highlight selected
            this.pieces.forEach(p => {
                if(p.material && p.material.emissive) p.material.emissive.setHex(0x000000);
            });
            if(object.material && object.material.emissive) object.material.emissive.setHex(0x222222);
            
        } else {
            this.transformControl.detach();
            document.getElementById('no-selection-msg').classList.remove('hidden');
            document.getElementById('selection-details').classList.add('hidden');
            
            this.pieces.forEach(p => {
                if(p.material && p.material.emissive) p.material.emissive.setHex(0x000000);
            });
        }
    }

    updateInspector(object) {
        if (!object) return;
        document.getElementById('no-selection-msg').classList.add('hidden');
        document.getElementById('selection-details').classList.remove('hidden');

        document.getElementById('pos-x').value = object.position.x.toFixed(1);
        document.getElementById('pos-y').value = object.position.y.toFixed(1);
        document.getElementById('pos-z').value = object.position.z.toFixed(1);
        
        document.getElementById('rot-x').value = THREE.MathUtils.radToDeg(object.rotation.x).toFixed(1);
        document.getElementById('rot-y').value = THREE.MathUtils.radToDeg(object.rotation.y).toFixed(1);
        document.getElementById('rot-z').value = THREE.MathUtils.radToDeg(object.rotation.z).toFixed(1);
    }

    onObjectTransformed() {
        if (this.selectedObject) {
            this.updateInspector(this.selectedObject);
        }
    }

    executeSnapping() {
        if (!this.selectedObject || !this.selectedObject.userData.ports) return;

        const snapThreshold = 30; // distance threshold in mm
        let bestSnap = null;
        let minDistance = snapThreshold;

        this.scene.updateMatrixWorld(true);

        // Get world positions and normals for selected object's ports
        const selPorts = this.selectedObject.userData.ports.map(p => {
            const pos = p.localPosition.clone().applyMatrix4(this.selectedObject.matrixWorld);
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(this.selectedObject.matrixWorld);
            const norm = p.localNormal.clone().applyMatrix3(normalMatrix).normalize();
            return { original: p, pos, norm };
        });

        // Find nearest port on OTHER objects
        this.pieces.forEach(target => {
            if (target === this.selectedObject || !target.userData.ports) return;

            // Prevent snapping to pieces in the same group (already glued)
            if (target.parent && target.parent === this.selectedObject.parent && target.parent !== this.scene) return;

            const targetPorts = target.userData.ports.map(p => {
                const pos = p.localPosition.clone().applyMatrix4(target.matrixWorld);
                const normalMatrix = new THREE.Matrix3().getNormalMatrix(target.matrixWorld);
                const norm = p.localNormal.clone().applyMatrix3(normalMatrix).normalize();
                return { original: p, pos, norm, parent: target };
            });

            for (const sPort of selPorts) {
                for (const tPort of targetPorts) {
                    const dist = sPort.pos.distanceTo(tPort.pos);
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestSnap = { sPort, tPort };
                    }
                }
            }
        });

        if (bestSnap) {
            this.snapObjectTo(this.selectedObject, bestSnap.sPort, bestSnap.tPort);
        } else {
            this.selectedObject.userData.snappedTo = null;
        }
    }

    snapObjectTo(object, sPort, tPort) {
        // 1. Align normals (tPort.norm should be exactly OPPOSITE to sPort.norm)
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
        const currentWorldNormal = sPort.original.localNormal.clone().applyMatrix3(normalMatrix).normalize();
        
        const targetWorldNormal = tPort.norm.clone().negate(); 

        const quaternion = new THREE.Quaternion().setFromUnitVectors(currentWorldNormal, targetWorldNormal);
        object.quaternion.premultiply(quaternion);
        object.updateMatrixWorld(true);

        // 2. Translate so positions match
        const newWorldPos = sPort.original.localPosition.clone().applyMatrix4(object.matrixWorld);
        const offset = new THREE.Vector3().subVectors(tPort.pos, newWorldPos);
        object.position.add(offset);
        
        object.updateMatrixWorld(true);
        
        // Save the snap relationship
        object.userData.snappedTo = {
            target: tPort.parent,
            sPortId: sPort.original.id,
            tPortId: tPort.original.id
        };
        
        console.log("Snapped!");
    }

    flipSelected() {
        if (!this.selectedObject || !this.selectedObject.userData.snappedTo) return;
        const snapInfo = this.selectedObject.userData.snappedTo;
        
        const port = this.selectedObject.userData.ports.find(p => p.id === snapInfo.sPortId);
        if (!port) return;

        // Rotate 90 degrees around the local normal
        this.selectedObject.rotateOnAxis(port.localNormal, Math.PI / 2);
        this.selectedObject.updateMatrixWorld(true);
        
        // Re-align position
        const tPortOriginal = snapInfo.target.userData.ports.find(p => p.id === snapInfo.tPortId);
        const tWorldPos = tPortOriginal.localPosition.clone().applyMatrix4(snapInfo.target.matrixWorld);
        
        const newWorldPos = port.localPosition.clone().applyMatrix4(this.selectedObject.matrixWorld);
        const offset = new THREE.Vector3().subVectors(tWorldPos, newWorldPos);
        this.selectedObject.position.add(offset);
        
        this.selectedObject.updateMatrixWorld(true);
        this.updateInspector(this.selectedObject);
    }

    glueSelected() {
        if (!this.selectedObject || !this.selectedObject.userData.snappedTo) return;
        
        const target = this.selectedObject.userData.snappedTo.target;
        
        let group;
        if (target.parent && target.parent.type === 'Group' && target.parent !== this.scene) {
            group = target.parent;
        } else {
            group = new THREE.Group();
            this.scene.add(group);
            group.attach(target); // preserves transform
        }
        
        group.attach(this.selectedObject);
        this.selectedObject.userData.snappedTo = null; // consume the snap
        
        // Highlight logic requires resetting individual pieces
        this.pieces.forEach(p => {
            if(p.material && p.material.emissive) p.material.emissive.setHex(0x000000);
        });
        
        this.selectObject(group);
        console.log("Glued into Assembly!");
    }

    deleteSelected() {
        if (!this.selectedObject) return;
        
        const removePiece = (obj) => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            this.pieces = this.pieces.filter(p => p !== obj);
        };

        if (this.selectedObject.type === 'Group') {
            const children = [...this.selectedObject.children];
            children.forEach(c => removePiece(c));
            this.scene.remove(this.selectedObject);
        } else {
            removePiece(this.selectedObject);
        }
        
        this.selectObject(null);
    }

    autoCompleteShape() {
        if (!this.selectedObject) return;
        
        let piecesToCheck = [];
        if (this.selectedObject.type === 'Group') {
            piecesToCheck = this.selectedObject.children;
        } else {
            piecesToCheck = [this.selectedObject];
        }

        this.scene.updateMatrixWorld(true);

        // 1. Gather all ports with world coordinates
        const allPorts = [];
        piecesToCheck.forEach(piece => {
            if (!piece.userData.ports) return;
            piece.userData.ports.forEach(p => {
                const pos = p.localPosition.clone().applyMatrix4(piece.matrixWorld);
                const normalMatrix = new THREE.Matrix3().getNormalMatrix(piece.matrixWorld);
                const norm = p.localNormal.clone().applyMatrix3(normalMatrix).normalize();
                allPorts.push({ piece, port: p, worldPos: pos, worldNormal: norm });
            });
        });

        // 2. Filter out connected ports
        const openPorts = [];
        for (let i = 0; i < allPorts.length; i++) {
            let isConnected = false;
            for (let j = 0; j < allPorts.length; j++) {
                if (i === j) continue;
                if (allPorts[i].worldPos.distanceTo(allPorts[j].worldPos) < 1.0) {
                    isConnected = true;
                    break;
                }
            }
            if (!isConnected) {
                openPorts.push(allPorts[i]);
            }
        }

        if (openPorts.length < 2) {
            console.log("Not enough open ports for auto-complete.");
            return;
        }

        // 3. Find a pair of open ports to bridge
        const strutLength = 300;
        let successfulCompletion = false;

        for (let i = 0; i < openPorts.length; i++) {
            for (let j = i + 1; j < openPorts.length; j++) {
                const portA = openPorts[i];
                const portB = openPorts[j];
                
                const dist = portA.worldPos.distanceTo(portB.worldPos);
                
                if (Math.abs(dist - strutLength) < 10) { 
                    
                    this.addPrimitive('strut'); 
                    const newStrut = this.pieces[this.pieces.length - 1]; 
                    
                    const strutPort0 = { original: newStrut.userData.ports[0] };
                    const strutPort1 = { original: newStrut.userData.ports[1] };
                    
                    const targetPortA = { pos: portA.worldPos, norm: portA.worldNormal, parent: portA.piece, original: portA.port };
                    
                    this.snapObjectTo(newStrut, strutPort0, targetPortA);
                    this.scene.updateMatrixWorld(true);
                    
                    let matchedAfterFlip = false;
                    for (let f = 0; f < 4; f++) { // check 4 rotations
                        const newPort1Pos = strutPort1.original.localPosition.clone().applyMatrix4(newStrut.matrixWorld);
                        if (newPort1Pos.distanceTo(portB.worldPos) < 10) {
                            matchedAfterFlip = true;
                            break;
                        }
                        this.flipSelected();
                        this.scene.updateMatrixWorld(true);
                    }
                    
                    if (matchedAfterFlip) {
                        this.glueSelected();
                        successfulCompletion = true;
                        console.log("Auto-complete successful!");
                        break;
                    } else {
                        this.deleteSelected(); // Doesn't fit, clean up
                    }
                }
            }
            if (successfulCompletion) break;
        }

        if (!successfulCompletion) {
            console.log("Could not find a valid auto-complete bridge.");
        }
    }

    onWindowResize() {
        if(!this.camera || !this.renderer) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (this.orbit) this.orbit.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.dihedralSimulator = new DihedralPlayground();
});
