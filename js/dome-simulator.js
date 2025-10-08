
class DomeSimulator {
    constructor() {
        this.frequency = 3;
        this.selectedTriangle = null;
        this.selectedStrutType = null;
        this.strutTypes = [];
        this.viewMode = 'full';
        this.zoom = 1;
        this.strutWidth = 40;
        this.strutHeight = 90;
        this.walkthroughStage = 0;
        this.lastTap = 0;
        
        // Three.js objects
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.domeGroup = null;
        this.allTriangles = [];
        
        // Animation frames
        this.animationId = null;
        this.walkthroughAnimationId = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        this.setupEventListeners();
        this.initMainDomeView();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Frequency slider
        const frequencySlider = document.getElementById('frequency-slider');
        frequencySlider.addEventListener('input', (e) => {
            this.frequency = parseInt(e.target.value);
            this.selectedTriangle = null;
            this.updateUI();
            this.initMainDomeView();
        });
        
        // Zoom slider
        const zoomSlider = document.getElementById('zoom-slider');
        zoomSlider.addEventListener('input', (e) => {
            this.zoom = parseFloat(e.target.value);
            this.updateUI();
        });
        
        // Strut dimensions
        const strutWidthSlider = document.getElementById('strut-width');
        strutWidthSlider.addEventListener('input', (e) => {
            this.strutWidth = parseInt(e.target.value);
            this.updateUI();
            this.updateStrutViews();
        });
        
        const strutHeightSlider = document.getElementById('strut-height');
        strutHeightSlider.addEventListener('input', (e) => {
            this.strutHeight = parseInt(e.target.value);
            this.updateUI();
            this.updateStrutViews();
        });
        
        // Clear selection button
        const clearButton = document.getElementById('clear-selection');
        clearButton.addEventListener('click', () => {
            this.selectedTriangle = null;
            this.updateUI();
            this.initMainDomeView();
        });
    }
    
    updateUI() {
        // Update frequency display
        document.getElementById('frequency-display').textContent = this.frequency;
        document.getElementById('sidebar-frequency').textContent = this.frequency;
        
        // Update zoom display
        document.getElementById('zoom-display').textContent = this.zoom.toFixed(1);
        
        // Update strut dimensions display
        document.getElementById('strut-width-display').textContent = `${this.strutWidth}mm`;
        document.getElementById('strut-height-display').textContent = `${this.strutHeight}mm`;
        
        // Update strut types count
        document.getElementById('strut-types-count').textContent = this.strutTypes.length;
        
        // Update view mode info
        const viewModeInfo = {
            full: '🏠 Full Dome View',
            hexagon: '⬡ Top View (Hexagon Pattern)',
            inner: '👁️ Inside View',
            sky: '☁️ Sky View (Looking Up)'
        };
        document.getElementById('view-mode-info').textContent = viewModeInfo[this.viewMode];
        
        // Show/hide triangle info
        const triangleInfo = document.getElementById('triangle-info');
        const clearButton = document.getElementById('clear-selection');
        if (this.selectedTriangle) {
            triangleInfo.classList.remove('hidden');
            clearButton.classList.remove('hidden');
            this.updateTriangleInfo();
        } else {
            triangleInfo.classList.add('hidden');
            clearButton.classList.add('hidden');
        }
        
        // Show/hide cutting guide
        const cuttingGuide = document.getElementById('cutting-guide');
        if (this.selectedStrutType) {
            cuttingGuide.classList.remove('hidden');
            this.updateCuttingGuide();
        } else {
            cuttingGuide.classList.add('hidden');
        }
        
        // Update strut types list
        this.updateStrutTypesList();
    }
    
    updateTriangleInfo() {
        if (!this.selectedTriangle) return;
        
        document.getElementById('triangle-number').textContent = this.selectedTriangle.triangleIndex;
        
        const strutsList = document.getElementById('struts-list');
        strutsList.innerHTML = '';
        
        this.selectedTriangle.struts.forEach((strut, i) => {
            const button = document.createElement('button');
            button.className = `flex items-center gap-2 p-3 rounded transition-all ${
                this.selectedStrutType?.type === strut.type 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-white hover:bg-gray-100'
            }`;
            
            button.innerHTML = `
                <div class="w-4 h-4 rounded flex-shrink-0" style="background-color: ${strut.color}"></div>
                <span class="font-medium">Strut ${i + 1}: Type ${strut.type}</span>
                <span class="ml-auto font-bold">${strut.length.toFixed(1)}mm</span>
                ${this.selectedStrutType?.type === strut.type ? '<span class="text-xs">← Selected</span>' : ''}
            `;
            
            button.addEventListener('click', () => {
                this.selectedStrutType = strut;
                this.updateUI();
                this.initStrutViews();
            });
            
            strutsList.appendChild(button);
        });
    }
    
    updateCuttingGuide() {
        if (!this.selectedStrutType) return;
        
        document.getElementById('selected-strut-type').textContent = this.selectedStrutType.type;
        document.getElementById('selected-strut-length').textContent = this.selectedStrutType.length.toFixed(1);
        
        // Update dimension displays
        const miterLoss = (this.strutHeight * Math.tan(18 * Math.PI / 180)).toFixed(1);
        const bevelLoss = (this.strutWidth * Math.tan(27.8 * Math.PI / 180)).toFixed(1);
        
        document.getElementById('miter-loss').textContent = miterLoss;
        document.getElementById('bevel-loss').textContent = bevelLoss;
        
        // Update all width/height displays
        ['width-display-1', 'summary-width-before'].forEach(id => {
            document.getElementById(id).textContent = this.strutWidth;
        });
        
        ['height-display-1', 'summary-height-before'].forEach(id => {
            document.getElementById(id).textContent = this.strutHeight;
        });
        
        // Update summary section
        document.getElementById('summary-strut-type').textContent = this.selectedStrutType.type;
        document.getElementById('summary-length').textContent = this.selectedStrutType.length.toFixed(1);
        document.getElementById('summary-width-after').textContent = (this.strutWidth - parseFloat(bevelLoss)).toFixed(1);
        document.getElementById('summary-height-after').textContent = (this.strutHeight - parseFloat(miterLoss)).toFixed(1);
    }
    
    updateStrutTypesList() {
        const strutTypesList = document.getElementById('strut-types-list');
        strutTypesList.innerHTML = '';
        
        this.strutTypes.forEach((strut) => {
            const button = document.createElement('button');
            button.className = `w-full text-left p-3 rounded border-2 transition-all ${
                this.selectedStrutType?.type === strut.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`;
            
            button.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded" style="background-color: ${strut.color}"></div>
                    <span class="font-bold">Type ${strut.type}</span>
                    <span class="ml-auto text-sm">${strut.length.toFixed(1)}mm</span>
                </div>
            `;
            
            button.addEventListener('click', () => {
                this.selectedStrutType = strut;
                this.updateUI();
                this.initStrutViews();
            });
            
            strutTypesList.appendChild(button);
        });
    }
    
    initMainDomeView() {
        const mountElement = document.getElementById('main-dome-view');
        if (!mountElement) return;
        
        // Clear previous renderer
        if (this.renderer) {
            mountElement.removeChild(this.renderer.domElement);
        }
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            mountElement.clientWidth / mountElement.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(8, 6, 8);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
        this.renderer.shadowMap.enabled = true;
        mountElement.appendChild(this.renderer.domElement);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(10, 10, 5);
        this.scene.add(sunLight);
        
        // Add ground
        const groundGeometry = new THREE.CircleGeometry(6, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x228b22,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        
        // Generate geodesic dome
        this.generateGeodесicDome();
        
        // Setup interaction
        this.setupMainViewInteraction();
        
        // Start animation
        this.animate();
        
        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    generateGeodесicDome() {
        const radius = 3.5;
        const phi = (1 + Math.sqrt(5)) / 2;
        
        const t = radius / Math.sqrt(1 + phi * phi);
        const baseVertices = [
            new THREE.Vector3(-t, phi * t, 0),
            new THREE.Vector3(t, phi * t, 0),
            new THREE.Vector3(-t, -phi * t, 0),
            new THREE.Vector3(t, -phi * t, 0),
            new THREE.Vector3(0, -t, phi * t),
            new THREE.Vector3(0, t, phi * t),
            new THREE.Vector3(0, -t, -phi * t),
            new THREE.Vector3(0, t, -phi * t),
            new THREE.Vector3(phi * t, 0, -t),
            new THREE.Vector3(phi * t, 0, t),
            new THREE.Vector3(-phi * t, 0, -t),
            new THREE.Vector3(-phi * t, 0, t)
        ];

        const baseFaces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ];

        // Generate all triangles through subdivision
        this.allTriangles = [];
        baseFaces.forEach(face => {
            const v1 = baseVertices[face[0]];
            const v2 = baseVertices[face[1]];
            const v3 = baseVertices[face[2]];
            this.allTriangles.push(...this.subdivideTriangle(v1, v2, v3, this.frequency - 1, radius));
        });

        // Filter triangles (keep only upper hemisphere)
        this.allTriangles = this.allTriangles.filter(tri => {
            const avgY = (tri[0].y + tri[1].y + tri[2].y) / 3;
            return avgY > -0.5;
        });

        // Calculate strut types
        this.calculateStrutTypes();
        
        // Create dome geometry
        this.createDomeGeometry();
    }
    
    subdivideTriangle(v1, v2, v3, depth, radius) {
        if (depth === 0) {
            return [[v1.clone(), v2.clone(), v3.clone()]];
        }

        const triangles = [];
        const m1 = v1.clone().add(v2).multiplyScalar(0.5).normalize().multiplyScalar(radius);
        const m2 = v2.clone().add(v3).multiplyScalar(0.5).normalize().multiplyScalar(radius);
        const m3 = v3.clone().add(v1).multiplyScalar(0.5).normalize().multiplyScalar(radius);

        triangles.push(...this.subdivideTriangle(v1, m1, m3, depth - 1, radius));
        triangles.push(...this.subdivideTriangle(v2, m2, m1, depth - 1, radius));
        triangles.push(...this.subdivideTriangle(v3, m3, m2, depth - 1, radius));
        triangles.push(...this.subdivideTriangle(m1, m2, m3, depth - 1, radius));

        return triangles;
    }
    
    calculateStrutTypes() {
        const strutLengthMap = new Map();
        this.allTriangles.forEach((tri) => {
            for (let i = 0; i < 3; i++) {
                const v1 = tri[i];
                const v2 = tri[(i + 1) % 3];
                const length = v1.distanceTo(v2) * 1000;
                const key = Math.round(length);
                if (!strutLengthMap.has(key)) {
                    strutLengthMap.set(key, length);
                }
            }
        });

        const uniqueLengths = Array.from(strutLengthMap.values()).sort((a, b) => a - b);
        this.strutTypes = uniqueLengths.map((len, idx) => ({
            type: String.fromCharCode(65 + idx),
            length: len,
            color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'][idx % 5]
        }));
    }
    
    createDomeGeometry() {
        this.domeGroup = new THREE.Group();
        
        this.allTriangles.forEach((tri, idx) => {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                tri[0].x, tri[0].y, tri[0].z,
                tri[1].x, tri[1].y, tri[1].z,
                tri[2].x, tri[2].y, tri[2].z
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();

            const isHighlighted = this.selectedTriangle?.triangleIndex === idx;
            const material = new THREE.MeshStandardMaterial({
                color: isHighlighted ? 0xffff00 : 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: isHighlighted ? 0.9 : 0.6,
                metalness: 0.1,
                roughness: 0.5
            });

            const mesh = new THREE.Mesh(geometry, material);
            
            // Calculate strut info
            const side1 = tri[0].distanceTo(tri[1]) * 1000;
            const side2 = tri[1].distanceTo(tri[2]) * 1000;
            const side3 = tri[2].distanceTo(tri[0]) * 1000;
            
            const strutInfo = [
                { length: side1, vertices: [tri[0], tri[1]] },
                { length: side2, vertices: [tri[1], tri[2]] },
                { length: side3, vertices: [tri[2], tri[0]] }
            ].map(strut => {
                const matchIdx = this.strutTypes.findIndex(st => Math.abs(st.length - strut.length) < 1);
                return {
                    length: strut.length,
                    type: this.strutTypes[matchIdx]?.type || 'A',
                    color: this.strutTypes[matchIdx]?.color || '#000000',
                    vertices: strut.vertices
                };
            });

            mesh.userData = { 
                triangleIndex: idx, 
                vertices: tri,
                center: new THREE.Vector3(
                    (tri[0].x + tri[1].x + tri[2].x) / 3,
                    (tri[0].y + tri[1].y + tri[2].y) / 3,
                    (tri[0].z + tri[1].z + tri[2].z) / 3
                ),
                struts: strutInfo
            };
            this.domeGroup.add(mesh);

            // Add strut lines
            strutInfo.forEach((strut) => {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(strut.vertices);
                const lineMaterial = new THREE.LineBasicMaterial({ 
                    color: new THREE.Color(strut.color),
                    linewidth: isHighlighted ? 4 : 3
                });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                this.domeGroup.add(line);
            });
        });

        this.scene.add(this.domeGroup);
    }
    
    setupMainViewInteraction() {
        const raycaster = new THREE.Raycaster();
        raycaster.params.Line.threshold = 0.5;
        const mouse = new THREE.Vector2();

        const onInteraction = (event) => {
            event.preventDefault();
            const rect = this.renderer.domElement.getBoundingClientRect();
            
            let clientX, clientY;
            if (event.type.startsWith('touch')) {
                if (event.touches.length === 0) return;
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }
            
            mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.domeGroup.children);

            if (intersects.length > 0) {
                const obj = intersects[0].object;
                if (obj.userData.triangleIndex !== undefined) {
                    this.selectedTriangle = obj.userData;
                    this.updateUI();
                    this.initMainDomeView(); // Refresh to show highlighting
                }
            }
        };

        const onDoubleTap = (event) => {
            const now = Date.now();
            const timeSince = now - this.lastTap;
            
            if (timeSince < 300 && timeSince > 0) {
                event.preventDefault();
                const modes = ['full', 'hexagon', 'inner', 'sky'];
                const currentIdx = modes.indexOf(this.viewMode);
                this.viewMode = modes[(currentIdx + 1) % modes.length];
                this.updateUI();
            }
            this.lastTap = now;
        };

        const onWheel = (event) => {
            event.preventDefault();
            const delta = event.deltaY * -0.001;
            this.zoom = Math.max(0.3, Math.min(3, this.zoom + delta));
            this.updateUI();
            document.getElementById('zoom-slider').value = this.zoom;
        };

        this.renderer.domElement.addEventListener('click', onInteraction);
        this.renderer.domElement.addEventListener('touchstart', onInteraction);
        this.renderer.domElement.addEventListener('dblclick', onDoubleTap);
        this.renderer.domElement.addEventListener('touchstart', onDoubleTap);
        this.renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (!this.camera || !this.renderer || !this.scene) return;
        
        const baseDistance = 10 / this.zoom;
        
        switch(this.viewMode) {
            case 'full':
                this.camera.position.set(8 / this.zoom, 6 / this.zoom, 8 / this.zoom);
                this.camera.lookAt(0, 2, 0);
                break;
            case 'hexagon':
                this.camera.position.set(0, 8 / this.zoom, 0);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'inner':
                this.camera.position.set(0, 1, 0);
                this.camera.lookAt(0, 3, 0);
                break;
            case 'sky':
                this.camera.position.set(0, -2, 0);
                this.camera.lookAt(0, 2, 0);
                break;
        }
        
        if (this.selectedTriangle && this.viewMode === 'full') {
            const center = this.selectedTriangle.center;
            this.camera.position.set(
                center.x + (0.8 / this.zoom),
                center.y + (0.6 / this.zoom),
                center.z + (0.8 / this.zoom)
            );
            this.camera.lookAt(center);
        }
        // Removed auto-rotation for better user control
        
        this.renderer.render(this.scene, this.camera);
    }
    
    initStrutViews() {
        if (!this.selectedStrutType) return;
        
        // Initialize the step views
        this.initStepView('step1-view', 0);
        this.initStepView('step2-view', 1);
        this.initStepView('step3-view', 2);
        this.initWalkthroughView();
    }
    
    initStepView(elementId, viewType) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Clear previous content
        element.innerHTML = '';
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);

        const camera = new THREE.PerspectiveCamera(45, element.clientWidth / element.clientHeight, 0.1, 1000);
        
        const length = this.selectedStrutType.length;
        
        // Different camera angles for each view - 7x zoom closer
        switch(viewType) {
            case 0: // Front view
                camera.position.set(0, 0, length * 0.00114);
                break;
            case 1: // Top view
                camera.position.set(0, length * 0.00114, 0);
                camera.lookAt(0, 0, 0);
                break;
            case 2: // Side view
                camera.position.set(length * 0.00114, 0, 0);
                camera.lookAt(0, 0, 0);
                break;
        }

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        const width = element.clientWidth;
        const height = element.clientHeight;
        renderer.setSize(width, height);
        element.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Create strut with compound angle cuts
        const strutGeometry = this.createStrutGeometry();
        const strutMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(this.selectedStrutType.color),
            metalness: 0.2,
            roughness: 0.7
        });

        const strutGroup = new THREE.Group();
        const strut = new THREE.Mesh(strutGeometry, strutMaterial);
        strutGroup.add(strut);

        const edges = new THREE.EdgesGeometry(strutGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        const edgeLines = new THREE.LineSegments(edges, edgesMaterial);
        strutGroup.add(edgeLines);

        // Add angle indicators for specific views
        if (viewType === 1) { // Top view - miter angle
            const miterAngle = 18 * Math.PI / 180;
            const h = this.strutHeight / 1000;
            const l = length / 1000;
            const w = this.strutWidth / 1000;
            const miterOffset = h * Math.tan(miterAngle);
            
            const angleGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-l/2, 0, 0),
                new THREE.Vector3(-l/2 + miterOffset, 0, 0),
                new THREE.Vector3(-l/2 + miterOffset, 0, w/2)
            ]);
            const angleLine = new THREE.Line(angleGeometry, new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 }));
            strutGroup.add(angleLine);
        }

        if (viewType === 2) { // Side view - bevel angle
            const bevelAngle = 27.8 * Math.PI / 180;
            const w = this.strutWidth / 1000;
            const l = length / 1000;
            const h = this.strutHeight / 1000;
            const bevelOffset = w * Math.tan(bevelAngle);
            
            const angleGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(l/2, 0, 0),
                new THREE.Vector3(l/2 - bevelOffset, 0, 0),
                new THREE.Vector3(l/2 - bevelOffset, h/2, 0)
            ]);
            const angleLine = new THREE.Line(angleGeometry, new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 }));
            strutGroup.add(angleLine);
        }

        scene.add(strutGroup);

        // Setup mouse interaction for rotation
        this.setupStrutViewInteraction(renderer.domElement, strutGroup);

        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        
        // Store for animation
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();
    }
    
    createStrutGeometry() {
        const miterAngle = 18 * Math.PI / 180;
        const bevelAngle = 27.8 * Math.PI / 180;
        const w = this.strutWidth / 1000;
        const h = this.strutHeight / 1000;
        const l = this.selectedStrutType.length / 1000;

        const strutGeometry = new THREE.BufferGeometry();
        
        const miterOffset = h * Math.tan(miterAngle);
        const bevelOffset = w * Math.tan(bevelAngle);

        // Both ends have BOTH miter and bevel cuts (compound angle)
        const vertices = new Float32Array([
            // Left end (compound: miter + bevel)
            -l/2, -h/2, -w/2,                           // 0: bottom-front
            -l/2 + miterOffset, h/2, -w/2,              // 1: top-front  
            -l/2 + miterOffset - bevelOffset, h/2, w/2, // 2: top-back
            -l/2 - bevelOffset, -h/2, w/2,              // 3: bottom-back
            
            // Right end (compound: miter + bevel)
            l/2, -h/2, -w/2,                            // 4: bottom-front
            l/2 - miterOffset, h/2, -w/2,               // 5: top-front
            l/2 - miterOffset + bevelOffset, h/2, w/2,  // 6: top-back
            l/2 + bevelOffset, -h/2, w/2,               // 7: bottom-back
        ]);

        const indices = [
            0, 1, 2, 0, 2, 3,  // Left face
            4, 6, 5, 4, 7, 6,  // Right face
            0, 4, 7, 0, 7, 3,  // Bottom
            1, 5, 6, 1, 6, 2,  // Top
            0, 4, 5, 0, 5, 1,  // Front
            3, 2, 6, 3, 6, 7   // Back
        ];

        strutGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        strutGeometry.setIndex(indices);
        strutGeometry.computeVertexNormals();
        
        return strutGeometry;
    }
    
    setupStrutViewInteraction(domElement, strutGroup) {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotationY = 0;
        let rotationX = 0;
        let autoRotate = true;

        const onMouseDown = (e) => {
            isDragging = true;
            autoRotate = false;
            previousMousePosition = { x: e.offsetX, y: e.offsetY };
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };

            rotationY += deltaMove.x * 0.01;
            rotationX += deltaMove.y * 0.01;

            strutGroup.rotation.y = rotationY;
            strutGroup.rotation.x = rotationX;

            previousMousePosition = { x: e.offsetX, y: e.offsetY };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        const onTouchStart = (e) => {
            isDragging = true;
            autoRotate = false;
            const touch = e.touches[0];
            const rect = domElement.getBoundingClientRect();
            previousMousePosition = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        };

        const onTouchMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const rect = domElement.getBoundingClientRect();
            const currentPosition = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            
            const deltaMove = {
                x: currentPosition.x - previousMousePosition.x,
                y: currentPosition.y - previousMousePosition.y
            };

            rotationY += deltaMove.x * 0.01;
            rotationX += deltaMove.y * 0.01;

            strutGroup.rotation.y = rotationY;
            strutGroup.rotation.x = rotationX;

            previousMousePosition = currentPosition;
        };

        const onTouchEnd = () => {
            isDragging = false;
        };

        domElement.addEventListener('mousedown', onMouseDown);
        domElement.addEventListener('mousemove', onMouseMove);
        domElement.addEventListener('mouseup', onMouseUp);
        domElement.addEventListener('touchstart', onTouchStart);
        domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        domElement.addEventListener('touchend', onTouchEnd);
        
        // Auto rotation when not dragging
        const animate = () => {
            if (autoRotate && !isDragging) {
                rotationY += 0.005;
                strutGroup.rotation.y = rotationY;
            }
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    initWalkthroughView() {
        const element = document.getElementById('walkthrough-view');
        if (!element) return;
        
        // Clear previous content
        element.innerHTML = '';
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2c3e50); // Brighter background

        const camera = new THREE.PerspectiveCamera(60, element.clientWidth / element.clientHeight, 0.1, 1000);
        camera.position.set(2.5, 2, 2.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(element.clientWidth, element.clientHeight);
        element.appendChild(renderer.domElement);

        // Bright, even lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(5, 5, 5);
        scene.add(directionalLight1);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, -5, -5);
        scene.add(directionalLight2);

        // Start walkthrough animation
        this.startWalkthroughAnimation(scene, camera, renderer);
    }
    
    startWalkthroughAnimation(scene, camera, renderer) {
        // Setup manual stage selection
        this.setupStageSelection(scene, camera, renderer);
        
        // Setup camera controls for navigation
        this.setupWalkthroughCameraControls(renderer.domElement, camera, scene, renderer);
        
        // Initial render of stage 0
        this.updateWalkthroughStage();
        this.updateWalkthroughScene(scene, this.walkthroughStage, 0);
        
        const animate = () => {
            this.walkthroughAnimationId = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        
        animate();
    }
    
    updateWalkthroughStage() {
        // Update stage indicators
        for (let i = 0; i < 4; i++) {
            const stageElement = document.getElementById(`stage-${i}`);
            if (stageElement) {
                if (i === this.walkthroughStage) {
                    stageElement.className = 'flex flex-col items-center p-3 rounded-lg transition-all bg-yellow-500 text-black scale-110 cursor-pointer hover:scale-125 shadow-lg';
                } else {
                    stageElement.className = 'flex flex-col items-center p-3 rounded-lg transition-all bg-gray-700 text-gray-400 cursor-pointer hover:scale-110 hover:bg-gray-600';
                }
            }
        }
        
        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${((this.walkthroughStage + 1) / 4) * 100}%`;
        }
        
        // Update stage content
        this.updateStageContent();
    }
    
    updateStageContent() {
        const stageContent = document.getElementById('stage-content');
        if (!stageContent) return;
        
        const stageData = [
            {
                title: '🪵 Stage 1: Single Strut & Cuts',
                points: [
                    '• See the compound angle cuts in 3D',
                    '• Red spheres mark cut locations',
                    '• Both ends get identical cuts',
                    '• 18° miter + 27.8° bevel = compound',
                    '• Labels show cut angles and measurements'
                ],
                tips: [
                    '• Drag to rotate and inspect all angles',
                    '• Zoom in to see cut details clearly',
                    '• This is your basic building component',
                    '• Precision here ensures perfect assembly'
                ]
            },
            {
                title: '🔩 Stage 2: Joints Forming',
                points: [
                    '• 3 struts converge at proper geodesic angles',
                    '• Golden joint shows connection point',
                    '• Each strut has different color',
                    '• Compound cuts create perfect fit',
                    '• Dome curvature starts to emerge'
                ],
                tips: [
                    '• Rotate to see how struts align perfectly',
                    '• Notice the slight upward angle (dome curve)',
                    '• This forms the triangle corners',
                    '• Joint strength is critical for dome'
                ]
            },
            {
                title: '🔺 Stage 3: Complete Triangle',
                points: [
                    '• Fully assembled triangle with dome curvature',
                    '• All 3 joints connected with hardware',
                    '• Semi-transparent face shows curved triangle',
                    '• This is your dome building block',
                    '• Notice the slight upward curve'
                ],
                tips: [
                    '• Examine the triangle from all angles',
                    '• See how it curves to follow dome shape',
                    '• This unit repeats throughout dome',
                    '• Quality here affects entire structure'
                ]
            },
            {
                title: '⭐ Stage 4: Pentagon Star Pattern',
                points: [
                    '• 5 triangles form pentagon vertex (corrected)',
                    '• Golden sphere = pentagon joint (5-way)',
                    '• Each triangle has unique color',
                    '• This pattern repeats 12 times in dome',
                    '• Golden lines show pentagon structure'
                ],
                tips: [
                    '• Zoom out to see full star pattern',
                    '• Pentagon vertices create dome curvature',
                    '• 12 pentagons + hexagons = geodesic',
                    '• This is the mathematical beauty of domes'
                ]
            }
        ];
        
        const currentStage = stageData[this.walkthroughStage];
        
        stageContent.innerHTML = `
            <div class="bg-purple-800 bg-opacity-50 p-4 rounded-lg">
                <p class="font-semibold text-yellow-300 mb-2">${currentStage.title}</p>
                <ul class="space-y-1">
                    ${currentStage.points.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
            <div class="bg-purple-800 bg-opacity-50 p-4 rounded-lg">
                <p class="font-semibold text-green-300 mb-2">💡 Interactive Tips:</p>
                <ul class="space-y-1">
                    ${currentStage.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    updateWalkthroughScene(scene, stage, stageTime) {
        // Clear previous objects (except lights)
        const objectsToRemove = [];
        scene.traverse((child) => {
            if (child.isMesh || child.isLine || child.isSprite) {
                objectsToRemove.push(child);
            }
        });
        objectsToRemove.forEach(obj => scene.remove(obj));
        
        switch (stage) {
            case 0: // Single Strut
                this.createWalkthroughStage0(scene);
                break;
            case 1: // Joints Forming
                this.createWalkthroughStage1(scene);
                break;
            case 2: // Complete Triangle
                this.createWalkthroughStage2(scene);
                break;
            case 3: // Star Pattern
                this.createWalkthroughStage3(scene);
                break;
        }
    }
    
    createWalkthroughStage0(scene) {
        // Single strut with cut indicators
        const strutGeometry = this.createStrutGeometry();
        const strutMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#3498db'), // Bright blue like dome
            metalness: 0.2,
            roughness: 0.4
        });
        
        const strut = new THREE.Mesh(strutGeometry, strutMaterial);
        scene.add(strut);
        
        // Add bright spheres at cut locations
        const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            emissive: 0xff2222,
            emissiveIntensity: 0.3
        });
        
        const l = this.selectedStrutType.length / 1000;
        const leftSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        leftSphere.position.x = -l/2;
        scene.add(leftSphere);
        
        const rightSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        rightSphere.position.x = l/2;
        scene.add(rightSphere);
        
        // Add 3D labels
        this.add3DLabel(scene, "Compound Cut\n18° + 27.8°", new THREE.Vector3(-l/2, 0.3, 0));
        this.add3DLabel(scene, "Compound Cut\n18° + 27.8°", new THREE.Vector3(l/2, 0.3, 0));
        this.add3DLabel(scene, `Strut Type ${this.selectedStrutType.type}\n${this.selectedStrutType.length.toFixed(1)}mm`, new THREE.Vector3(0, -0.4, 0));
    }
    
    createWalkthroughStage1(scene) {
        // Three struts coming together at proper angles to form a joint
        const strutGeometry = this.createStrutGeometry();
        const colors = ['#e74c3c', '#3498db', '#2ecc71']; // Bright dome colors
        
        // Calculate proper strut positioning for geodesic joint
        const strutLength = this.selectedStrutType.length / 1000;
        const jointRadius = strutLength * 0.4; // Struts extend from center
        
        for (let i = 0; i < 3; i++) {
            const strutMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(colors[i]),
                metalness: 0.2,
                roughness: 0.4
            });
            
            const strut = new THREE.Mesh(strutGeometry, strutMaterial);
            
            // Position struts to converge at center with proper geodesic angles
            const angle = (i * 120) * Math.PI / 180;
            const elevationAngle = 20 * Math.PI / 180; // Slight upward angle for dome curvature
            
            // Calculate end position for each strut
            const endX = Math.cos(angle) * jointRadius;
            const endZ = Math.sin(angle) * jointRadius;
            const endY = Math.sin(elevationAngle) * jointRadius;
            
            // Position strut so one end is at center, other at calculated position
            strut.position.x = endX * 0.5;
            strut.position.y = endY * 0.5;
            strut.position.z = endZ * 0.5;
            
            // Rotate strut to point from center to end position
            strut.lookAt(endX, endY, endZ);
            strut.rotateX(Math.PI / 2); // Adjust for strut geometry orientation
            
            scene.add(strut);
            
            // Add labels for each strut
            this.add3DLabel(scene, `Strut ${i + 1}`, new THREE.Vector3(
                endX * 1.2,
                endY + 0.2,
                endZ * 1.2
            ));
        }
        
        // Add golden joint at center
        const jointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const jointMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.6,
            roughness: 0.2,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3
        });
        
        const joint = new THREE.Mesh(jointGeometry, jointMaterial);
        scene.add(joint);
        
        this.add3DLabel(scene, "Connection\nPoint", new THREE.Vector3(0, 0.4, 0));
    }
    
    createWalkthroughStage2(scene) {
        // Complete triangle with proper geodesic curvature
        const strutGeometry = this.createStrutGeometry();
        const colors = ['#e74c3c', '#3498db', '#2ecc71'];
        const strutLength = this.selectedStrutType.length / 1000;
        
        // Create triangle vertices with slight dome curvature
        const triangleRadius = strutLength * 0.6;
        const elevationAngle = 15 * Math.PI / 180; // Dome curvature
        
        const vertices = [];
        for (let i = 0; i < 3; i++) {
            const angle = (i * 120) * Math.PI / 180;
            vertices.push(new THREE.Vector3(
                Math.cos(angle) * triangleRadius,
                Math.sin(elevationAngle) * triangleRadius * 0.3, // Slight upward curve
                Math.sin(angle) * triangleRadius
            ));
        }
        
        // Create struts connecting the vertices
        for (let i = 0; i < 3; i++) {
            const strutMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(colors[i]),
                metalness: 0.2,
                roughness: 0.4
            });
            
            const strut = new THREE.Mesh(strutGeometry, strutMaterial);
            const nextVertex = (i + 1) % 3;
            
            // Position strut between two vertices
            const midPoint = vertices[i].clone().add(vertices[nextVertex]).multiplyScalar(0.5);
            strut.position.copy(midPoint);
            
            // Rotate strut to align with edge
            const direction = vertices[nextVertex].clone().sub(vertices[i]);
            strut.lookAt(vertices[nextVertex]);
            strut.rotateX(Math.PI / 2); // Adjust for strut geometry orientation
            
            scene.add(strut);
        }
        
        // Add joints at vertices
        const jointGeometry = new THREE.SphereGeometry(0.06, 16, 16);
        const jointMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.6,
            roughness: 0.2,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3
        });
        
        vertices.forEach((vertex, i) => {
            const joint = new THREE.Mesh(jointGeometry, jointMaterial);
            joint.position.copy(vertex);
            scene.add(joint);
        });
        
        // Add triangle face with proper curvature
        const faceGeometry = new THREE.BufferGeometry();
        const faceVertices = new Float32Array([
            vertices[0].x, vertices[0].y, vertices[0].z,
            vertices[1].x, vertices[1].y, vertices[1].z,
            vertices[2].x, vertices[2].y, vertices[2].z
        ]);
        faceGeometry.setAttribute('position', new THREE.BufferAttribute(faceVertices, 3));
        faceGeometry.computeVertexNormals();
        
        const faceMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        scene.add(face);
        
        this.add3DLabel(scene, "Complete\nTriangle", new THREE.Vector3(0, 0.5, 0));
        this.add3DLabel(scene, "Building Block\nof Dome", new THREE.Vector3(0, -0.5, 0));
    }
    
    createWalkthroughStage3(scene) {
        // Pentagon star pattern showing dome curvature - 5 triangles around a central vertex
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
        const strutLength = this.selectedStrutType.length / 1000;
        
        // Create 5 triangles arranged around a central pentagon vertex (like in actual geodesic dome)
        const pentRadius = strutLength * 0.8;
        const domeElevation = 25 * Math.PI / 180; // More pronounced dome curvature
        
        for (let i = 0; i < 5; i++) { // 5 triangles for pentagon vertex
            const triangleGroup = new THREE.Group();
            
            // Calculate triangle position around pentagon center
            const pentAngle = (i * 72) * Math.PI / 180; // 360/5 = 72 degrees
            const triangleRadius = strutLength * 0.3;
            
            // Triangle vertices with dome curvature
            const triangleVertices = [];
            for (let j = 0; j < 3; j++) {
                const localAngle = (j * 120) * Math.PI / 180;
                const vertex = new THREE.Vector3(
                    Math.cos(localAngle) * triangleRadius,
                    Math.sin(domeElevation) * triangleRadius * 0.5,
                    Math.sin(localAngle) * triangleRadius
                );
                triangleVertices.push(vertex);
            }
            
            // Create struts for this triangle
            for (let j = 0; j < 3; j++) {
                const strutGeometry = this.createStrutGeometry();
                const strutMaterial = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(colors[i]),
                    metalness: 0.2,
                    roughness: 0.4,
                    transparent: true,
                    opacity: 0.8
                });
                
                const strut = new THREE.Mesh(strutGeometry, strutMaterial);
                const nextVertex = (j + 1) % 3;
                
                // Position and orient strut
                const midPoint = triangleVertices[j].clone().add(triangleVertices[nextVertex]).multiplyScalar(0.5);
                strut.position.copy(midPoint);
                strut.lookAt(triangleVertices[nextVertex]);
                strut.rotateX(Math.PI / 2);
                strut.scale.setScalar(0.6);
                
                triangleGroup.add(strut);
            }
            
            // Add triangle joints
            triangleVertices.forEach(vertex => {
                const jointGeometry = new THREE.SphereGeometry(0.04, 12, 12);
                const jointMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffd700,
                    metalness: 0.6,
                    roughness: 0.2,
                    emissive: 0xffaa00,
                    emissiveIntensity: 0.2
                });
                
                const joint = new THREE.Mesh(jointGeometry, jointMaterial);
                joint.position.copy(vertex);
                triangleGroup.add(joint);
            });
            
            // Position triangle group around central vertex
            triangleGroup.position.x = Math.cos(pentAngle) * pentRadius;
            triangleGroup.position.y = Math.sin(domeElevation) * pentRadius * 0.3;
            triangleGroup.position.z = Math.sin(pentAngle) * pentRadius;
            
            // Rotate to face center
            triangleGroup.lookAt(0, 0, 0);
            
            scene.add(triangleGroup);
            
            // Add labels for each triangle
            this.add3DLabel(scene, `Triangle ${i + 1}`, new THREE.Vector3(
                Math.cos(pentAngle) * (pentRadius + 0.4),
                Math.sin(domeElevation) * pentRadius * 0.3 + 0.2,
                Math.sin(pentAngle) * (pentRadius + 0.4)
            ));
        }
        
        // Central golden vertex (pentagon point) - larger and more prominent
        const centralGeometry = new THREE.SphereGeometry(0.15, 32, 32);
        const centralMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.6,
            roughness: 0.2,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        });
        
        const centralVertex = new THREE.Mesh(centralGeometry, centralMaterial);
        scene.add(centralVertex);
        
        // Add connecting struts from center to each triangle (showing the pentagon structure)
        for (let i = 0; i < 5; i++) {
            const pentAngle = (i * 72) * Math.PI / 180;
            const endPoint = new THREE.Vector3(
                Math.cos(pentAngle) * pentRadius * 0.7,
                Math.sin(domeElevation) * pentRadius * 0.2,
                Math.sin(pentAngle) * pentRadius * 0.7
            );
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                endPoint
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0xffd700, 
                linewidth: 3,
                transparent: true,
                opacity: 0.6
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(line);
        }
        
        this.add3DLabel(scene, "Pentagon Vertex\n(5-way joint)", new THREE.Vector3(0, 0.6, 0));
        this.add3DLabel(scene, "12 of these create\ndome curvature", new THREE.Vector3(0, -0.6, 0));
    }
    
    updateStrutViews() {
        if (this.selectedStrutType) {
            this.initStrutViews();
        }
    }
    
    add3DLabel(scene, text, position) {
        // Create a canvas for the text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Style the text
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = 'bold 18px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Handle multi-line text
        const lines = text.split('\n');
        const lineHeight = 24;
        const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
        
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });
        
        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        sprite.position.copy(position);
        sprite.scale.set(0.5, 0.25, 1);
        
        scene.add(sprite);
        return sprite;
    }
    
    setupStageSelection(scene, camera, renderer) {
        // Add click handlers to stage buttons
        for (let i = 0; i < 4; i++) {
            const stageElement = document.getElementById(`stage-${i}`);
            if (stageElement) {
                stageElement.addEventListener('click', () => {
                    this.walkthroughStage = i;
                    this.updateWalkthroughStage();
                    this.updateWalkthroughScene(scene, i, 0);
                });
                
                // Make it look clickable
                stageElement.style.cursor = 'pointer';
            }
        }
    }
    
    setupWalkthroughCameraControls(domElement, camera, scene, renderer) {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let cameraDistance = 3; // Closer for better detail view
        let cameraTheta = 0;
        let cameraPhi = Math.PI / 3; // Better angle for dome structures
        
        const updateCameraPosition = () => {
            camera.position.x = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
            camera.position.y = cameraDistance * Math.cos(cameraPhi);
            camera.position.z = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
            camera.lookAt(0, 0, 0);
        };
        
        const onMouseDown = (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            cameraTheta += deltaMove.x * 0.01;
            cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi + deltaMove.y * 0.01));
            
            updateCameraPosition();
            previousMousePosition = { x: e.clientX, y: e.clientY };
        };
        
        const onMouseUp = () => {
            isDragging = false;
        };
        
        const onWheel = (e) => {
            e.preventDefault();
            cameraDistance = Math.max(1, Math.min(10, cameraDistance + e.deltaY * 0.01));
            updateCameraPosition();
        };
        
        const onTouchStart = (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                const touch = e.touches[0];
                previousMousePosition = { x: touch.clientX, y: touch.clientY };
            }
        };
        
        const onTouchMove = (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const deltaMove = {
                x: touch.clientX - previousMousePosition.x,
                y: touch.clientY - previousMousePosition.y
            };
            
            cameraTheta += deltaMove.x * 0.01;
            cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi + deltaMove.y * 0.01));
            
            updateCameraPosition();
            previousMousePosition = { x: touch.clientX, y: touch.clientY };
        };
        
        const onTouchEnd = () => {
            isDragging = false;
        };
        
        domElement.addEventListener('mousedown', onMouseDown);
        domElement.addEventListener('mousemove', onMouseMove);
        domElement.addEventListener('mouseup', onMouseUp);
        domElement.addEventListener('wheel', onWheel, { passive: false });
        domElement.addEventListener('touchstart', onTouchStart);
        domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        domElement.addEventListener('touchend', onTouchEnd);
        
        // Initial camera position
        updateCameraPosition();
    }
    
    handleResize() {
        if (!this.camera || !this.renderer) return;
        
        const mountElement = document.getElementById('main-dome-view');
        if (!mountElement) return;
        
        this.camera.aspect = mountElement.clientWidth / mountElement.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
    }
    
    destroy() {
        // Cleanup method
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.walkthroughAnimationId) {
            cancelAnimationFrame(this.walkthroughAnimationId);
        }
        
        if (this.renderer) {
            const mountElement = document.getElementById('main-dome-view');
            if (mountElement && this.renderer.domElement.parentNode === mountElement) {
                mountElement.removeChild(this.renderer.domElement);
            }
        }
    }
}

// Initialize the dome simulator when the page loads
const domeSimulator = new DomeSimulator();
