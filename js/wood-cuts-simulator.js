
class WoodCutsSimulator {
    constructor() {
        this.cornerAngle = 90;
        this.slopeAngle = 45;
        this.woodWidth = 40;
        this.woodHeight = 90;
        this.woodLength = 300;

        this.miterAngle = 0;
        this.bevelAngle = 0;

        // Three.js objects
        this.scenes = {};
        this.cameras = {};
        this.renderers = {};
        this.groups = {};

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('miter') && params.has('bevel')) {
            const miterDeg = parseFloat(params.get('miter'));
            const bevelDeg = parseFloat(params.get('bevel'));
            
            const M = miterDeg * Math.PI / 180;
            const B = bevelDeg * Math.PI / 180;
            
            // Inverse formulas:
            // sin(C/2) = sqrt(sin^2(M) + sin^2(B)*cos^2(M))
            // cos(S) = sin(B) / sin(C/2)
            
            const sinSqHalfC = Math.pow(Math.sin(M), 2) + Math.pow(Math.sin(B), 2) * Math.pow(Math.cos(M), 2);
            const halfC = Math.asin(Math.sqrt(Math.max(0, Math.min(1, sinSqHalfC))));
            const C = halfC * 2 * 180 / Math.PI;
            
            let S = 0;
            if (halfC > 0.0001) {
                const cosS = Math.sin(B) / Math.sin(halfC);
                S = Math.acos(Math.max(-1, Math.min(1, cosS))) * 180 / Math.PI;
            }
            
            this.cornerAngle = isNaN(C) ? 90 : C;
            this.slopeAngle = isNaN(S) ? 0 : S;
            
            // Update UI sliders
            const cornerSlider = document.getElementById('corner-angle-slider');
            const slopeSlider = document.getElementById('slope-angle-slider');
            if (cornerSlider) cornerSlider.value = this.cornerAngle;
            if (slopeSlider) slopeSlider.value = this.slopeAngle;
        }
        
        if (params.has('width')) {
            const w = parseFloat(params.get('width'));
            if (!isNaN(w)) {
                this.woodWidth = w;
                const widthInput = document.getElementById('wood-width');
                if (widthInput) widthInput.value = this.woodWidth;
            }
        }
        
        if (params.has('height')) {
            const h = parseFloat(params.get('height'));
            if (!isNaN(h)) {
                this.woodHeight = h;
                const heightInput = document.getElementById('wood-height');
                if (heightInput) heightInput.value = this.woodHeight;
            }
        }
    }

    init() {
        this.parseUrlParams();
        this.setupEventListeners();
        this.calculateAngles();
        this.init3DViews();
        this.updateUI();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        Object.keys(this.renderers).forEach(id => {
            const container = this.renderers[id].domElement.parentElement;
            if (!container) return;
            
            this.cameras[id].aspect = container.clientWidth / container.clientHeight;
            this.cameras[id].updateProjectionMatrix();
            this.renderers[id].setSize(container.clientWidth, container.clientHeight);
        });
    }

    setupEventListeners() {
        const cornerSlider = document.getElementById('corner-angle-slider');
        const slopeSlider = document.getElementById('slope-angle-slider');
        const widthInput = document.getElementById('wood-width');
        const heightInput = document.getElementById('wood-height');

        cornerSlider.addEventListener('input', (e) => {
            this.cornerAngle = parseFloat(e.target.value);
            this.updateAll();
        });

        slopeSlider.addEventListener('input', (e) => {
            this.slopeAngle = parseFloat(e.target.value);
            this.updateAll();
        });

        widthInput.addEventListener('change', (e) => {
            this.woodWidth = parseFloat(e.target.value);
            this.updateAll();
        });

        heightInput.addEventListener('change', (e) => {
            this.woodHeight = parseFloat(e.target.value);
            this.updateAll();
        });

        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cornerAngle = parseFloat(btn.dataset.corner);
                this.slopeAngle = parseFloat(btn.dataset.slope);
                
                // Update UI
                cornerSlider.value = this.cornerAngle;
                slopeSlider.value = this.slopeAngle;
                
                this.updateAll();
            });
        });
    }

    updateAll() {
        this.calculateAngles();
        this.updateUI();
        this.update3DGeometries();
    }

    calculateAngles() {
        // C = Corner Angle, S = Slope Angle (from horizontal)
        // M = atan(tan(C/2) * sin(S))
        // B = asin(sin(C/2) * cos(S))
        
        const halfC = (this.cornerAngle / 2) * Math.PI / 180;
        const S = this.slopeAngle * Math.PI / 180;

        this.miterAngle = Math.atan(Math.tan(halfC) * Math.sin(S)) * 180 / Math.PI;
        this.bevelAngle = Math.asin(Math.sin(halfC) * Math.cos(S)) * 180 / Math.PI;
    }

    updateUI() {
        document.getElementById('corner-angle-display').textContent = `${this.cornerAngle.toFixed(1)}°`;
        document.getElementById('slope-angle-display').textContent = `${this.slopeAngle.toFixed(1)}°`;
        document.getElementById('calc-miter').textContent = `${this.miterAngle.toFixed(1)}°`;
        document.getElementById('calc-bevel').textContent = `${this.bevelAngle.toFixed(1)}°`;
        document.getElementById('saw-miter-val').textContent = `${this.miterAngle.toFixed(1)}°`;
        document.getElementById('saw-bevel-val').textContent = `${this.bevelAngle.toFixed(1)}°`;
    }

    init3DViews() {
        this.initMainJointView();
        this.initSawView();
        this.initStepViews();
    }

    initMainJointView() {
        const container = document.getElementById('main-canvas-container');
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
        camera.position.set(400, 300, 400);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(200, 500, 200);
        scene.add(directionalLight);

        const group = new THREE.Group();
        scene.add(group);

        this.scenes['main'] = scene;
        this.cameras['main'] = camera;
        this.renderers['main'] = renderer;
        this.groups['main'] = group;

        this.updateJointGeometry();
        this.setupInteraction(renderer.domElement, camera, group);
    }

    initSawView() {
        const container = document.getElementById('saw-view');
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 200, 300);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const group = new THREE.Group();
        scene.add(group);

        this.scenes['saw'] = scene;
        this.cameras['saw'] = camera;
        this.renderers['saw'] = renderer;
        this.groups['saw'] = group;

        this.updateSawGeometry();
    }

    initStepViews() {
        ['step1', 'step2', 'step3'].forEach((id, index) => {
            const container = document.getElementById(`${id}-view`);
            if (!container) return;

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a0a);

            const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
            
            // Camera positions for each step
            if (index === 0) camera.position.set(0, 0, 300); // Front
            if (index === 1) camera.position.set(0, 400, 0); // Top
            if (index === 2) camera.position.set(300, 0, 0); // Side
            
            camera.lookAt(0, 0, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            container.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambientLight);

            const group = new THREE.Group();
            scene.add(group);

            this.scenes[id] = scene;
            this.cameras[id] = camera;
            this.renderers[id] = renderer;
            this.groups[id] = group;

            this.updateStepGeometry(id, index);
            this.setupInteraction(renderer.domElement, camera, group);
        });
    }

    update3DGeometries() {
        this.updateJointGeometry();
        this.updateSawGeometry();
        ['step1', 'step2', 'step3'].forEach((id, index) => this.updateStepGeometry(id, index));
    }

    updateJointGeometry() {
        const group = this.groups['main'];
        if (!group) return;
        group.clear();

        const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });

        for (let i = 0; i < 2; i++) {
            const geometry = this.createClippedWoodGeometry(i);
            const mesh = new THREE.Mesh(geometry, woodMaterial);
            const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
            
            group.add(mesh);
            group.add(lines);
        }
    }

    updateSawGeometry() {
        const group = this.groups['saw'];
        if (!group) return;
        group.clear();

        // Table
        const tableGeo = new THREE.BoxGeometry(400, 5, 400);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.y = -2.5;
        group.add(table);

        // Blade (simplified as a disc)
        const bladeRadius = 120;
        const bladeGeo = new THREE.CylinderGeometry(bladeRadius, bladeRadius, 1, 64);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.2 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        
        const bladeGroup = new THREE.Group();
        bladeGroup.add(blade);
        blade.rotation.x = Math.PI / 2;
        
        bladeGroup.rotation.order = 'YXZ';
        bladeGroup.rotation.y = -this.miterAngle * Math.PI / 180;
        bladeGroup.rotation.x = this.bevelAngle * Math.PI / 180;
        bladeGroup.position.y = 20;
        group.add(bladeGroup);

        // Use the clipped geometry but transform it back to "local" space for the saw
        const geometry = this.createClippedWoodGeometry(0, true);
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, transparent: true, opacity: 0.6 });
        const wood = new THREE.Mesh(geometry, woodMat);
        const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true }));
        
        const woodGroup = new THREE.Group();
        woodGroup.add(wood);
        woodGroup.add(lines);
        woodGroup.position.y = this.woodHeight / 2;
        group.add(woodGroup);
    }

    updateStepGeometry(id, index) {
        const group = this.groups[id];
        if (!group) return;
        group.clear();

        const geometry = this.createClippedWoodGeometry(0, true);
        const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const mesh = new THREE.Mesh(geometry, material);
        const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true }));
        
        group.add(mesh);
        group.add(lines);

        if (index === 0) this.addAngleIndicator(group, 'bevel', index);
        if (index === 1) this.addAngleIndicator(group, 'miter', index);
    }

    createClippedWoodGeometry(pieceIndex, localOnly = false) {
        const w = this.woodWidth;
        const h = this.woodHeight;
        const l = this.woodLength;
        const hC = (this.cornerAngle / 2) * Math.PI / 180;
        const S = this.slopeAngle * Math.PI / 180;

        // Arrangement around Z=0 for a Good Karma joint
        const angleY = -hC + pieceIndex * (this.cornerAngle * Math.PI / 180);
        const roll = Math.atan(Math.tan(S) / Math.sin(hC));
        
        const matrix = new THREE.Matrix4();
        const isOdd = pieceIndex % 2 === 1;
        const currentRoll = isOdd ? roll : -roll;
        
        matrix.makeRotationY(angleY);
        matrix.multiply(new THREE.Matrix4().makeRotationZ(S));
        matrix.multiply(new THREE.Matrix4().makeRotationX(currentRoll));

        const geometry = new THREE.BufferGeometry();
        const corners = [
            new THREE.Vector3(0, -h/2, -w/2),
            new THREE.Vector3(0,  h/2, -w/2),
            new THREE.Vector3(0,  h/2,  w/2),
            new THREE.Vector3(0, -h/2,  w/2)
        ];

        const vertices = new Float32Array(24);
        const dir = new THREE.Vector3(1, 0, 0).transformDirection(matrix);
        const invMatrix = new THREE.Matrix4().copy(matrix).invert();
        
        // Good Karma joints meet side-by-side.
        // We clip exactly at the bisector plane shared with the *previous* piece.
        // Piece 0 and 1 meet at Z=0 (bisectorAngle = 0).
        // Piece 2 and 3 meet at 2*cornerAngle, etc.
        const bisectorAngle = (pieceIndex % 2 === 0) ? (angleY + hC) : (angleY - hC);
        const planeNormal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), bisectorAngle);

        for (let i = 0; i < 4; i++) {
            // Far end (flat)
            const pFar = corners[i].clone().add(new THREE.Vector3(-l, 0, 0));
            const pFarWorld = pFar.clone().applyMatrix4(matrix);
            
            const pNear = corners[i].clone().applyMatrix4(matrix);
            
            // Single plane clipping for the Good Karma style
            const t = -pNear.dot(planeNormal) / dir.dot(planeNormal);
            const pClippedWorld = pNear.addScaledVector(dir, t);

            if (localOnly) {
                const pFarLocal = pFarWorld.applyMatrix4(invMatrix);
                const pClippedLocal = pClippedWorld.applyMatrix4(invMatrix);
                vertices[i * 3 + 0] = pFarLocal.x + l/2;
                vertices[i * 3 + 1] = pFarLocal.y;
                vertices[i * 3 + 2] = pFarLocal.z;
                vertices[(i + 4) * 3 + 0] = pClippedLocal.x + l/2;
                vertices[(i + 4) * 3 + 1] = pClippedLocal.y;
                vertices[(i + 4) * 3 + 2] = pClippedLocal.z;
            } else {
                vertices[i * 3 + 0] = pFarWorld.x;
                vertices[i * 3 + 1] = pFarWorld.y;
                vertices[i * 3 + 2] = pFarWorld.z;
                vertices[(i + 4) * 3 + 0] = pClippedWorld.x;
                vertices[(i + 4) * 3 + 1] = pClippedWorld.y;
                vertices[(i + 4) * 3 + 2] = pClippedWorld.z;
            }
        }

        const indices = [
            0, 1, 2,  0, 2, 3, // Far
            4, 6, 5,  4, 7, 6, // Near
            0, 4, 5,  0, 5, 1, // Front
            1, 5, 6,  1, 6, 2, // Top
            2, 6, 7,  2, 7, 3, // Back
            3, 7, 4,  3, 4, 0  // Bottom
        ];

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        return geometry;
    }

    addAngleIndicator(group, type, index) {
        const material = new THREE.LineBasicMaterial({ 
            color: type === 'miter' ? 0x60a5fa : 0x4ade80, 
            linewidth: 3 
        });
        
        const h = this.woodHeight;
        const w = this.woodWidth;
        const l = this.woodLength;
        
        let points = [];
        if (type === 'miter') {
            const miterOffset = w * Math.tan(this.miterAngle * Math.PI / 180);
            points = [
                new THREE.Vector3(l/2, h/2 + 5, -w/2),
                new THREE.Vector3(l/2 - miterOffset, h/2 + 5, w/2)
            ];
        } else {
            const bevelOffset = h * (Math.tan(this.bevelAngle * Math.PI / 180) / Math.cos(this.miterAngle * Math.PI / 180));
            points = [
                new THREE.Vector3(l/2, -h/2, w/2 + 5),
                new THREE.Vector3(l/2 - bevelOffset, h/2, w/2 + 5)
            ];
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        group.add(line);
    }

    setupInteraction(element, camera, group) {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        const initialPosition = camera.position.clone();
        const initialRotation = group.rotation.clone();

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
        });

        element.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaMove = {
                    x: e.offsetX - previousMousePosition.x,
                    y: e.offsetY - previousMousePosition.y
                };

                group.rotation.y += deltaMove.x * 0.01;
                group.rotation.x += deltaMove.y * 0.01;
            }
            previousMousePosition = { x: e.offsetX, y: e.offsetY };
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        element.addEventListener('dblclick', () => {
            camera.position.copy(initialPosition);
            group.rotation.copy(initialRotation);
        });

        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = camera.position.length() * 0.001;
            camera.position.z += e.deltaY * zoomSpeed;
            camera.position.z = Math.max(50, Math.min(camera.position.z, 2000));
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        Object.keys(this.renderers).forEach(id => {
            this.renderers[id].render(this.scenes[id], this.cameras[id]);
        });
    }
}

new WoodCutsSimulator();
