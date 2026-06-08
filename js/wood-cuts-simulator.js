
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

    init() {
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
            if (index === 1) camera.position.set(0, 300, 0); // Top
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

        // Create two pieces forming the joint
        for (let i = 0; i < 2; i++) {
            const geometry = this.createCompoundWoodGeometry();
            const mesh = new THREE.Mesh(geometry, woodMaterial);
            
            const edges = new THREE.EdgesGeometry(geometry);
            const lines = new THREE.LineSegments(edges, edgeMaterial);

            const pieceGroup = new THREE.Group();
            pieceGroup.add(mesh);
            pieceGroup.add(lines);

            // Position and rotate pieces to form the joint
            const angle = (i === 0 ? -this.cornerAngle / 2 : this.cornerAngle / 2) * Math.PI / 180;
            const slope = (90 - this.slopeAngle) * Math.PI / 180; // Tilt from vertical

            pieceGroup.rotation.y = angle;
            pieceGroup.rotation.z = i === 0 ? slope : -slope;
            
            // Offset to align ends
            const offset = (this.woodLength / 2);
            pieceGroup.translateX(offset);

            group.add(pieceGroup);
        }
    }

    updateSawGeometry() {
        const group = this.groups['saw'];
        if (!group) return;
        group.clear();

        // Table
        const tableGeo = new THREE.BoxGeometry(300, 10, 300);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.y = -5;
        group.add(table);

        // Blade (simplified as a disc)
        const bladeGeo = new THREE.CylinderGeometry(50, 50, 2, 32);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        
        // Blade group for miter and bevel
        const bladeGroup = new THREE.Group();
        bladeGroup.add(blade);
        blade.rotation.x = Math.PI / 2;
        
        // Apply miter and bevel to blade group
        bladeGroup.rotation.order = 'YXZ';
        bladeGroup.rotation.y = -this.miterAngle * Math.PI / 180;
        bladeGroup.rotation.x = this.bevelAngle * Math.PI / 180;
        
        bladeGroup.position.y = 40;
        group.add(bladeGroup);

        // Wood piece on the saw
        const woodGeo = this.createCompoundWoodGeometry();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, transparent: true, opacity: 0.7 });
        const wood = new THREE.Mesh(woodGeo, woodMat);
        wood.position.y = this.woodHeight / 2;
        group.add(wood);
    }

    updateStepGeometry(id, index) {
        const group = this.groups[id];
        if (!group) return;
        group.clear();

        const geometry = this.createCompoundWoodGeometry();
        const material = new THREE.MeshStandardMaterial({ color: 0xd2b48c });
        const mesh = new THREE.Mesh(geometry, material);
        
        const edges = new THREE.EdgesGeometry(geometry);
        const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
        
        group.add(mesh);
        group.add(lines);

        // Add visual indicators
        if (index === 1) { // Miter - top view
            this.addAngleIndicator(group, 'miter');
        }
        if (index === 2) { // Bevel - side view
            this.addAngleIndicator(group, 'bevel');
        }
    }

    createCompoundWoodGeometry() {
        const w = this.woodWidth;
        const h = this.woodHeight;
        const l = this.woodLength;
        const miter = this.miterAngle * Math.PI / 180;
        const bevel = this.bevelAngle * Math.PI / 180;

        const geometry = new THREE.BufferGeometry();
        
        // Plane equation: x = offset_y * y + offset_z * z
        // For a miter saw:
        // offset_z (miter) = tan(miter)
        // offset_y (bevel) = tan(bevel) / cos(miter)
        
        const tanM = Math.tan(miter);
        const tanB_cosM = Math.tan(bevel) / Math.cos(miter);

        const getX = (y, z, end) => {
            const side = end === 'right' ? 1 : -1;
            const xBase = (l / 2) * side;
            // For the right end, we subtract the offsets to cut into the wood
            // For the left end, we could also cut it symmetrically or keep it flat
            if (end === 'right') {
                return xBase - (tanM * z) - (tanB_cosM * y);
            } else {
                return xBase; // Keep left end flat for reference
            }
        };

        const vertices = new Float32Array([
            // Left end (flat)
            getX(-h/2, -w/2, 'left'), -h/2, -w/2,  // 0
            getX( h/2, -w/2, 'left'),  h/2, -w/2,  // 1
            getX( h/2,  w/2, 'left'),  h/2,  w/2,  // 2
            getX(-h/2,  w/2, 'left'), -h/2,  w/2,  // 3

            // Right end (compound cut)
            getX(-h/2, -w/2, 'right'), -h/2, -w/2, // 4
            getX( h/2, -w/2, 'right'),  h/2, -w/2, // 5
            getX( h/2,  w/2, 'right'),  h/2,  w/2, // 6
            getX(-h/2,  w/2, 'right'), -h/2,  w/2  // 7
        ]);

        const indices = [
            0, 1, 2,  0, 2, 3, // Left
            4, 6, 5,  4, 7, 6, // Right
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

    addAngleIndicator(group, type) {
        const material = new THREE.LineBasicMaterial({ 
            color: type === 'miter' ? 0xff0000 : 0x00ff00, 
            linewidth: 2 
        });
        
        const l = this.woodLength;
        const h = this.woodHeight;
        const w = this.woodWidth;
        
        let points = [];
        if (type === 'miter') {
            const miterOffset = h * Math.tan(this.miterAngle * Math.PI / 180);
            points = [
                new THREE.Vector3(l/2, h/2 + 10, -w/2),
                new THREE.Vector3(l/2 - miterOffset, h/2 + 10, -w/2)
            ];
        } else {
            const bevelOffset = w * Math.tan(this.bevelAngle * Math.PI / 180);
            points = [
                new THREE.Vector3(l/2 + 10, -h/2, w/2),
                new THREE.Vector3(l/2 + 10, -h/2, w/2 - bevelOffset)
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
