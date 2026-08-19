class MerkabaSimulator {
    constructor() {
        this.recursion = 1;
        this.baseSize = 500;
        this.strutWidth = 20;
        this.strutHeight = 20;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.group = null;
        
        this.struts = [];
        this.autoRotate = true;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.init3D();
        this.setupEvents();
        this.generate();
    }

    setupEvents() {
        window.switchTab = (tabId) => {
            const tabs = ['design', 'inventory'];
            tabs.forEach(t => {
                document.getElementById(`btn-tab-${t}`).classList.toggle('active', t === tabId);
                document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== tabId);
            });
        };

        const bind = (id, prop) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                this[prop] = parseFloat(e.target.value);
                document.getElementById(id.replace('-slider', '-display')).textContent = e.target.value;
                this.generate();
            });
        };

        bind('recursion-slider', 'recursion');
        bind('size-slider', 'baseSize');
        bind('width-slider', 'strutWidth');
        bind('height-slider', 'strutHeight');

        const toggle = document.getElementById('good-karma-toggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.useGoodKarma = e.target.checked;
                this.generate();
            });
            this.useGoodKarma = toggle.checked;
        } else {
            this.useGoodKarma = false;
        }

        window.addEventListener('resize', () => {
            const container = document.getElementById('main-canvas');
            if (!container) return;
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    init3D() {
        const container = document.getElementById('main-canvas');
        if (!container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000);
        this.camera.position.set(0, 0, this.baseSize * 3);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.localClippingEnabled = true;
        container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 200, 100);
        this.scene.add(dirLight);

        this.starGroup1 = new THREE.Group();
        this.starGroup2 = new THREE.Group();
        this.scene.add(this.starGroup1);
        this.scene.add(this.starGroup2);

        // Simple mouse interaction
        let isDragging = false;
        let isMouseDown = false;
        let prevMouse = { x: 0, y: 0 };
        
        container.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            isDragging = false;
            prevMouse = { x: e.clientX, y: e.clientY };
        });
        window.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        container.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                isDragging = true;
                const dx = (e.clientX - prevMouse.x) * 0.01;
                const dy = (e.clientY - prevMouse.y) * 0.01;
                
                this.starGroup1.rotation.y += dx;
                this.starGroup1.rotation.x += dy;
                
                this.starGroup2.rotation.y += dx;
                this.starGroup2.rotation.x += dy;
                
                prevMouse = { x: e.clientX, y: e.clientY };
            }
        });
        container.addEventListener('click', () => {
            if (!isDragging) {
                this.autoRotate = !this.autoRotate;
            }
        });
        
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.position.z += e.deltaY * 0.5;
            this.camera.position.z = Math.max(100, Math.min(this.camera.position.z, 5000));
        });

        this.animate();
    }

    generate() {
        this.starGroup1.clear();
        this.starGroup2.clear();
        
        this.struts = [];
        
        // Root star tetrahedron (defines the geometry for one star)
        this.buildStarTetrahedron(new THREE.Vector3(0,0,0), this.baseSize, this.recursion);
        
        // Render the same geometry into two different groups
        this.renderStruts(this.starGroup1, this.struts);
        this.renderStruts(this.starGroup2, this.struts);
        
        // Initialize their rotations differently so they are crossing
        this.starGroup1.rotation.set(0, 0, 0);
        this.starGroup2.rotation.set(Math.PI / 4, Math.PI / 4, 0);
        
        this.updateInventory();
    }

    buildStarTetrahedron(center, size, level) {
        if (level <= 0) return;

        // A Star Tetrahedron has 8 vertices (which form a cube)
        // Let's define the 8 points of the stella octangula
        // An upright tetrahedron has 4 vertices
        const r = size / 2;
        const v1 = [
            new THREE.Vector3(r, r, r),
            new THREE.Vector3(-r, -r, r),
            new THREE.Vector3(-r, r, -r),
            new THREE.Vector3(r, -r, -r)
        ];
        // An inverted tetrahedron has 4 vertices
        const v2 = [
            new THREE.Vector3(-r, -r, -r),
            new THREE.Vector3(r, r, -r),
            new THREE.Vector3(r, -r, r),
            new THREE.Vector3(-r, r, r)
        ];

        // The intersection of these two is an octahedron with vertices at the centers of the faces of the cube
        // But for the physical frame (not crossing), we just build the 24 outer edges!
        // These are the edges of the 8 small tetrahedra on the faces of the central octahedron.
        
        // Vertices of the inner octahedron
        const ov = [
            new THREE.Vector3(r/2, r/2, 0),
            new THREE.Vector3(-r/2, -r/2, 0),
            new THREE.Vector3(r/2, -r/2, 0),
            new THREE.Vector3(-r/2, r/2, 0),
            new THREE.Vector3(0, r/2, r/2),
            new THREE.Vector3(0, -r/2, -r/2),
            new THREE.Vector3(0, r/2, -r/2),
            new THREE.Vector3(0, -r/2, r/2),
            new THREE.Vector3(r/2, 0, r/2),
            new THREE.Vector3(-r/2, 0, -r/2),
            new THREE.Vector3(r/2, 0, -r/2),
            new THREE.Vector3(-r/2, 0, r/2)
        ];

        if (level === 1) {
            // Base case: build the 24 edges (frame)
            const addEdge = (p1, p2) => {
                this.struts.push({
                    p1: p1.clone().add(center),
                    p2: p2.clone().add(center),
                    length: p1.distanceTo(p2)
                });
            };

            // Top right front point (v1[0]) connects to its 3 adjacent octahedron vertices
            addEdge(v1[0], new THREE.Vector3(r/2, r/2, 0));
            addEdge(v1[0], new THREE.Vector3(0, r/2, r/2));
            addEdge(v1[0], new THREE.Vector3(r/2, 0, r/2));
            
            // Bottom left front point (v1[1])
            addEdge(v1[1], new THREE.Vector3(-r/2, -r/2, 0));
            addEdge(v1[1], new THREE.Vector3(0, -r/2, r/2));
            addEdge(v1[1], new THREE.Vector3(-r/2, 0, r/2));
            
            // Top left back point (v1[2])
            addEdge(v1[2], new THREE.Vector3(-r/2, r/2, 0));
            addEdge(v1[2], new THREE.Vector3(0, r/2, -r/2));
            addEdge(v1[2], new THREE.Vector3(-r/2, 0, -r/2));
            
            // Bottom right back point (v1[3])
            addEdge(v1[3], new THREE.Vector3(r/2, -r/2, 0));
            addEdge(v1[3], new THREE.Vector3(0, -r/2, -r/2));
            addEdge(v1[3], new THREE.Vector3(r/2, 0, -r/2));

            // Point v2[0] (bottom left back)
            addEdge(v2[0], new THREE.Vector3(-r/2, -r/2, 0));
            addEdge(v2[0], new THREE.Vector3(0, -r/2, -r/2));
            addEdge(v2[0], new THREE.Vector3(-r/2, 0, -r/2));

            // Point v2[1] (top right back)
            addEdge(v2[1], new THREE.Vector3(r/2, r/2, 0));
            addEdge(v2[1], new THREE.Vector3(0, r/2, -r/2));
            addEdge(v2[1], new THREE.Vector3(r/2, 0, -r/2));
            
            // Point v2[2] (bottom right front)
            addEdge(v2[2], new THREE.Vector3(r/2, -r/2, 0));
            addEdge(v2[2], new THREE.Vector3(0, -r/2, r/2));
            addEdge(v2[2], new THREE.Vector3(r/2, 0, r/2));
            
            // Point v2[3] (top left front)
            addEdge(v2[3], new THREE.Vector3(-r/2, r/2, 0));
            addEdge(v2[3], new THREE.Vector3(0, r/2, r/2));
            addEdge(v2[3], new THREE.Vector3(-r/2, 0, r/2));

        } else {
            // Recursive case: place smaller merkabas at the 8 vertices
            const allV = [...v1, ...v2];
            for (const v of allV) {
                // To keep it connected, size is halved, and they are shifted
                const newSize = size / 2;
                // Move towards the corner
                const offset = v.clone().multiplyScalar(0.5);
                this.buildStarTetrahedron(center.clone().add(offset), newSize, level - 1);
            }
        }
    }

    renderStruts(targetGroup, strutsToRender) {
        const baseColor = 0x8B4513;
        const overlapColor = 0xef4444; // red-500
        
        if (!this.activePlanes) this.activePlanes = [];

        // Group struts by node
        const nodes = [];
        const findNode = (p) => {
            for(let n of nodes) {
                if(n.distanceTo(p) < 0.1) return n;
            }
            const n = p.clone();
            nodes.push(n);
            return n;
        };

        const strutConnections = strutsToRender.map(s => ({
            s: s,
            n1: findNode(s.p1),
            n2: findNode(s.p2),
            planes: []
        }));

        // Always compute clipping planes to define the perfectly mitered boundaries
        nodes.forEach(node => {
            const connected = strutConnections.filter(c => c.n1 === node || c.n2 === node);
            connected.forEach(c => {
                const dir = c.n1 === node ? 
                    c.s.p2.clone().sub(c.s.p1).normalize() : 
                    c.s.p1.clone().sub(c.s.p2).normalize();
                
                connected.forEach(other => {
                    if (c === other) return;
                    const otherDir = other.n1 === node ? 
                        other.s.p2.clone().sub(other.s.p1).normalize() : 
                        other.s.p1.clone().sub(other.s.p2).normalize();
                        
                    const normal = dir.clone().sub(otherDir).normalize();
                    const plane = new THREE.Plane(normal, -normal.dot(node));
                    c.planes.push(plane);
                    
                    this.activePlanes.push({
                        plane: plane,
                        localNormal: normal.clone(),
                        localConstant: plane.constant
                    });
                });
            });
        });
        
        let hasOverlap = !this.useGoodKarma && strutsToRender.length > 0;

        // Build meshes
        strutConnections.forEach(c => {
            const dist = c.s.length;
            const E = this.strutWidth; // Extend past nodes to fill outer corners of the miter joint
            
            const strutGeo = new THREE.BoxGeometry(this.strutWidth, dist + 2 * E, this.strutHeight);
            strutGeo.translate(0, dist / 2, 0); // Box goes from -E to dist+E
            
            // BASE MESH: The perfectly cut brown strut
            const material = new THREE.MeshStandardMaterial({ 
                color: baseColor,
                roughness: 0.8,
                side: THREE.DoubleSide
            });
            
            if (c.planes.length > 0) {
                material.clippingPlanes = c.planes;
                material.clipIntersection = false;
            }

            const mesh = new THREE.Mesh(strutGeo, material);
            const dir = c.s.p2.clone().sub(c.s.p1).normalize();
            
            mesh.position.copy(c.s.p1);
            
            
            // Align strut symmetrically with the center of the Merkaba
            const mid = new THREE.Vector3().addVectors(c.s.p1, c.s.p2).multiplyScalar(0.5);
            if (mid.lengthSq() < 0.001) mid.set(0, 1, 0); // fallback if at origin
            mid.normalize();
            
            // local Y = dir
            // local X = dir x mid
            const xAxis = new THREE.Vector3().crossVectors(dir, mid).normalize();
            // local Z = X x dir
            const zAxis = new THREE.Vector3().crossVectors(xAxis, dir).normalize();
            
            const matrix = new THREE.Matrix4();
            matrix.makeBasis(xAxis, dir, zAxis);
            mesh.quaternion.setFromRotationMatrix(matrix);
            
            targetGroup.add(mesh);

            // OVERLAP MESHES: If Good Karma is off, render the cut-off tips in red
            if (!this.useGoodKarma) {
                c.planes.forEach(plane => {
                    const invNormal = plane.normal.clone().negate();
                    const invConstant = -plane.constant;
                    const invertedPlane = new THREE.Plane(invNormal, invConstant);
                    
                    this.activePlanes.push({
                        plane: invertedPlane,
                        localNormal: invNormal,
                        localConstant: invConstant
                    });

                    const redMat = new THREE.MeshStandardMaterial({
                        color: overlapColor,
                        roughness: 0.8,
                        side: THREE.DoubleSide,
                        clippingPlanes: [invertedPlane]
                    });
                    
                    const redMesh = new THREE.Mesh(strutGeo, redMat);
                    // Slightly inflate width/height to avoid Z-fighting at the seams, but keep length identical (scale Y = 1)
                    redMesh.scale.set(1.02, 1, 1.02);
                    redMesh.position.copy(c.s.p1);
                    redMesh.quaternion.copy(mesh.quaternion);
                    
                    targetGroup.add(redMesh);
                });
            }
        });

        const warningEl = document.getElementById('overlap-warning');
        if (warningEl) {
            // Replace element to cleanly remove old event listeners
            const newWarningEl = warningEl.cloneNode(true);
            warningEl.parentNode.replaceChild(newWarningEl, warningEl);
            
            newWarningEl.classList.toggle('hidden', !hasOverlap);
            
            if (hasOverlap && nodes.length > 0) {
                newWarningEl.style.cursor = 'pointer';
                newWarningEl.title = 'Click to zoom into the overlapping cuts';
                newWarningEl.addEventListener('click', () => {
                    this.zoomToNode(nodes[0]);
                });
            }
        }
    }

    updateInventory() {
        const list = document.getElementById('inventory-list');
        if (!list) return;

        // Group by length
        const counts = {};
        this.struts.forEach(s => {
            const l = Math.round(s.length);
            counts[l] = (counts[l] || 0) + 1;
        });

        let html = '';
        let totalPieces = 0;
        
        Object.keys(counts).sort((a,b)=>b-a).forEach(l => {
            const count = counts[l];
            totalPieces += count;
            
            // Calculate compound angles for this cut.
            // For a star tetrahedron, the point vertex joins 3 struts.
            // Corner angle = 60°, slope = 70.53°
            const M = 28.6;
            const B = 9.6;
            const miterStr = M.toFixed(1);
            const bevelStr = B.toFixed(1);
            const simulatorUrl = `/wood-cuts/?miter=${miterStr}&bevel=${bevelStr}&width=${this.strutWidth}&height=${this.strutHeight}`;

            html += `
            <div class="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sky-400 font-bold text-lg">${count}x Struts</span>
                    <span class="font-mono text-slate-300">${l} mm length</span>
                </div>
                <div class="grid grid-cols-2 gap-4 mt-4">
                    <div class="bg-slate-900 p-2 rounded text-center">
                        <div class="text-[10px] text-slate-500 uppercase">Tip Miter</div>
                        <div class="font-bold text-emerald-400">${M}°</div>
                    </div>
                    <div class="bg-slate-900 p-2 rounded text-center">
                        <div class="text-[10px] text-slate-500 uppercase">Tip Bevel</div>
                        <div class="font-bold text-pink-400">${B}°</div>
                    </div>
                </div>
                <div class="mt-4 text-center">
                    <a href="${simulatorUrl}" target="_blank" class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-colors">
                        <i class="bi bi-box-arrow-up-right mr-1"></i> Open in Wood Cuts Simulator
                    </a>
                </div>
                <p class="text-[10px] text-slate-400 mt-2 text-center">Note: Cuts are symmetric at both ends. At the inner valleys, 4 struts meet.</p>
            </div>
            `;
        });
        
        html = `<div class="mb-4 text-sm text-slate-300 border-b border-slate-700 pb-2">Total pieces: <strong>${totalPieces}</strong></div>` + html;

        list.innerHTML = html;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Auto-rotation slowly in opposite directions
        if (this.autoRotate) {
            if (this.starGroup1) {
                this.starGroup1.rotation.y += 0.002;
                this.starGroup1.rotation.x += 0.001;
            }
            if (this.starGroup2) {
                this.starGroup2.rotation.y -= 0.003;
                this.starGroup2.rotation.x -= 0.0015;
            }
        }

        if (this.activePlanes && this.starGroup1) {
            this.starGroup1.updateMatrixWorld();
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(this.starGroup1.matrixWorld);
            this.activePlanes.forEach(p => {
                p.plane.normal.copy(p.localNormal).applyMatrix3(normalMatrix).normalize();
                const localPoint = p.localNormal.clone().multiplyScalar(-p.localConstant);
                const worldPoint = localPoint.applyMatrix4(this.starGroup1.matrixWorld);
                p.plane.constant = -p.plane.normal.dot(worldPoint);
            });
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    zoomToNode(localNode) {
        this.autoRotate = false;
        
        // Get world position of the node (using group 1 as reference)
        this.starGroup1.updateMatrixWorld();
        const worldNode = localNode.clone().applyMatrix4(this.starGroup1.matrixWorld);
        
        // Target camera position: look down from a closer distance
        const camDir = this.camera.position.clone().normalize();
        const targetCamPos = worldNode.clone().add(camDir.multiplyScalar(this.baseSize * 0.8));
        
        const startPos = this.camera.position.clone();
        
        // Assume camera initially looks at 0,0,0
        // We will lerp the lookAt target from 0,0,0 to the node
        const startTarget = new THREE.Vector3(0, 0, 0);
        
        let frame = 0;
        const frames = 40;
        const anim = () => {
            frame++;
            const t = frame / frames;
            // easeInOutQuad
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            
            this.camera.position.lerpVectors(startPos, targetCamPos, ease);
            
            const currentTarget = startTarget.clone().lerp(worldNode, ease);
            this.camera.lookAt(currentTarget);
            
            if (frame < frames) {
                requestAnimationFrame(anim);
            }
        };
        anim();
    }
}

new MerkabaSimulator();
