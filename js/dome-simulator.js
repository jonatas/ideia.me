
class DomeSimulator {
    constructor() {
        this.frequency = 3;
        this.selectedTriangle = null;
        this.selectedStrutType = null;
        this.selectedStrut = null;
        this.selectedJoint = null;
        this.strutTypes = [];
        this.viewMode = 'full';
        this.assemblyMode = false;
        this.assemblyStep = 0;
        this.maxAssemblySteps = 0;
        this.zoom = 1;
        this.maxZoom = 50; // Much deeper zoom for joint inspection
        this.minZoom = 0.1;
        this.strutWidth = 40;
        this.strutHeight = 90;
        this.lastTap = 0; // For double-tap detection
        
        // Enhanced Assembly Mode Properties
        this.assemblyPhase = 0; // 0: strut collection, 1: triangle assembly, 2: component integration
        this.maxAssemblyPhases = 3;
        this.triangleTypes = new Map(); // Categorize triangles by strut composition
        this.assemblyInventory = new Map(); // Track component counts and states
        this.groundTriangles = []; // Base layer triangles
        this.assemblyLayers = []; // Organized layers for construction
        this.selectedTriangleType = null; // Currently selected triangle type
        
        // Three.js objects
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.domeGroup = null;
        this.allTriangles = [];
        
        // Animation frames
        this.animationId = null;
        
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
            this.selectedStrut = null;
            this.selectedJoint = null;
            this.updateUI();
            this.initMainDomeView();
        });
        
        // Assembly mode controls
        const assemblyToggle = document.getElementById('assembly-mode-toggle');
        assemblyToggle.addEventListener('click', () => {
            this.toggleAssemblyMode();
        });
        
        const assemblyExit = document.getElementById('assembly-mode-exit');
        assemblyExit.addEventListener('click', () => {
            this.exitAssemblyMode();
        });
        
        const assemblyPrev = document.getElementById('assembly-prev');
        assemblyPrev.addEventListener('click', () => {
            this.previousAssemblyStep();
        });
        
        const assemblyNext = document.getElementById('assembly-next');
        assemblyNext.addEventListener('click', () => {
            this.nextAssemblyStep();
        });
        
        const assemblyAuto = document.getElementById('assembly-auto');
        assemblyAuto.addEventListener('click', () => {
            this.toggleAutoAssembly();
        });
        
        // Phase navigation controls
        const assemblyPhasePrev = document.getElementById('assembly-phase-prev');
        assemblyPhasePrev.addEventListener('click', () => {
            this.previousAssemblyPhase();
        });
        
        const assemblyPhaseNext = document.getElementById('assembly-phase-next');
        assemblyPhaseNext.addEventListener('click', () => {
            this.nextAssemblyPhase();
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
        
        // Show/hide selection info
        const triangleInfo = document.getElementById('triangle-info');
        const clearButton = document.getElementById('clear-selection');
        
        if (this.selectedTriangle || this.selectedStrut || this.selectedJoint) {
            triangleInfo.classList.remove('hidden');
            clearButton.classList.remove('hidden');
            
            if (this.selectedTriangle) {
                this.updateTriangleInfo();
            } else if (this.selectedStrut) {
                this.updateStrutInfo();
            } else if (this.selectedJoint) {
                this.updateJointInfo();
            }
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
        
        // Update assembly controls
        this.updateAssemblyControls();
        
        // Update triangle inventory
        this.updateTriangleInventory();
    }
    
    updateAssemblyControls() {
        const assemblyControls = document.getElementById('assembly-controls');
        const assemblyToggle = document.getElementById('assembly-mode-toggle');
        
        if (this.assemblyMode) {
            assemblyControls.classList.remove('hidden');
            assemblyToggle.textContent = '🏠 Normal Mode';
            assemblyToggle.className = 'px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 active:bg-blue-700 shadow-md';
            
            document.getElementById('assembly-step-display').textContent = this.assemblyStep;
            document.getElementById('assembly-total-display').textContent = this.maxAssemblySteps;
            
            // Update phase display
            const phaseNames = [
                "Phase 1: Strut Collection",
                "Phase 2: Triangle Assembly", 
                "Phase 3: Component Integration"
            ];
            document.getElementById('assembly-phase-display').textContent = 
                phaseNames[this.assemblyPhase] || `Phase ${this.assemblyPhase + 1}`;
            
            // Update button states
            document.getElementById('assembly-prev').disabled = this.assemblyStep <= 0;
            document.getElementById('assembly-next').disabled = this.assemblyStep >= this.maxAssemblySteps;
            document.getElementById('assembly-phase-prev').disabled = this.assemblyPhase <= 0;
            document.getElementById('assembly-phase-next').disabled = this.assemblyPhase >= this.maxAssemblyPhases - 1;
            
            // Update phase and step descriptions
            const phaseDescNames = [
                "Phase 1: Strut Collection & Organization",
                "Phase 2: Triangle Assembly",
                "Phase 3: Component Integration & Construction"
            ];
            
            const phaseDescriptions = [
                [
                    "Organize struts by type (A, B, C, etc.)",
                    "Cut compound angles: 18° miter + 27.8° bevel",
                    "Prepare Good Karma hubless joint system",
                    "Sort components for efficient assembly"
                ],
                [
                    "Assemble triangles with overlapping struts",
                    "Create triangle type A (using struts A-A-B)",
                    "Create triangle type B (using struts A-B-C)", 
                    "Stack completed triangles by type for integration"
                ],
                [
                    "Start with ground foundation triangles",
                    "Connect overlapping struts at compound angles",
                    "Build rings with Good Karma joint system",
                    "Complete dome with hubless overlapping joints"
                ]
            ];
            
            const currentPhase = Math.min(this.assemblyPhase, phaseDescNames.length - 1);
            const currentPhaseDesc = phaseDescriptions[currentPhase];
            const stepDesc = currentPhaseDesc[Math.min(this.assemblyStep, currentPhaseDesc.length - 1)] || 
                           `${phaseDescNames[currentPhase]} - Step ${this.assemblyStep + 1}`;
            
            document.getElementById('assembly-description').textContent = stepDesc;
        } else {
            assemblyControls.classList.add('hidden');
            assemblyToggle.textContent = '🔧 Assembly Mode';
            assemblyToggle.className = 'px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 active:bg-green-700 shadow-md';
        }
    }
    
    updateTriangleInventory() {
        const triangleInventory = document.getElementById('triangle-inventory');
        const triangleTypesGrid = document.getElementById('triangle-types-grid');
        
        if (this.assemblyMode && this.triangleTypes.size > 0) {
            triangleInventory.classList.remove('hidden');
            triangleTypesGrid.innerHTML = '';
            
            this.triangleTypes.forEach((typeData, typeKey) => {
                const inventoryData = this.assemblyInventory.get(typeKey);
                const isSelected = this.selectedTriangleType === typeKey;
                
                const typeCard = document.createElement('div');
                typeCard.className = `p-2 rounded border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white hover:border-gray-300'
                }`;
                
                typeCard.innerHTML = `
                    <div class="flex items-center gap-2 mb-1">
                        <div class="w-3 h-3 rounded" style="background-color: ${typeData.color}"></div>
                        <span class="font-bold text-xs">${typeKey}</span>
                    </div>
                    <div class="text-xs text-gray-600">
                        <div>Struts: ${typeData.strutTypes.join('-')}</div>
                        <div>Count: ${typeData.count}</div>
                        ${inventoryData ? `
                            <div class="mt-1">
                                <div class="text-xs">
                                    ${this.getPhaseProgressText(inventoryData)}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                typeCard.addEventListener('click', () => {
                    this.selectTriangleType(isSelected ? null : typeKey);
                });
                
                triangleTypesGrid.appendChild(typeCard);
            });
        } else {
            triangleInventory.classList.add('hidden');
        }
    }
    
    getPhaseProgressText(inventoryData) {
        switch (this.assemblyPhase) {
            case 0: // Strut Collection
                return `📦 ${inventoryData.collected}/${inventoryData.total} collected`;
            case 1: // Triangle Assembly
                return `🔧 ${inventoryData.assembled}/${inventoryData.total} assembled`;
            case 2: // Integration
                return `🏗️ ${inventoryData.integrated}/${inventoryData.total} integrated`;
            default:
                return `${inventoryData.total} total`;
        }
    }
    
    toggleAssemblyMode() {
        this.assemblyMode = !this.assemblyMode;
        if (this.assemblyMode) {
            this.startAssemblyMode();
        } else {
            this.exitAssemblyMode();
        }
    }
    
    startAssemblyMode() {
        this.assemblyStep = 0;
        this.assemblyPhase = 0; // Start with strut collection phase
        this.maxAssemblySteps = this.getMaxStepsForCurrentPhase();
        this.selectedTriangle = null;
        this.selectedStrut = null;
        this.selectedJoint = null;
        this.selectedTriangleType = null;
        this.updateUI();
        this.initMainDomeView();
    }
    
    exitAssemblyMode() {
        this.assemblyMode = false;
        this.assemblyStep = 0;
        this.assemblyPhase = 0;
        this.selectedTriangleType = null;
        this.updateUI();
        this.initMainDomeView();
    }
    
    nextAssemblyPhase() {
        if (this.assemblyPhase < this.maxAssemblyPhases - 1) {
            this.assemblyPhase++;
            this.assemblyStep = 0; // Reset step when changing phases
            this.maxAssemblySteps = this.getMaxStepsForCurrentPhase();
            this.updateUI();
            this.initMainDomeView();
        }
    }
    
    previousAssemblyPhase() {
        if (this.assemblyPhase > 0) {
            this.assemblyPhase--;
            this.assemblyStep = 0; // Reset step when changing phases
            this.maxAssemblySteps = this.getMaxStepsForCurrentPhase();
            this.updateUI();
            this.initMainDomeView();
        }
    }
    
    selectTriangleType(typeKey) {
        this.selectedTriangleType = typeKey;
        this.updateUI();
        this.initMainDomeView();
    }
    
    getMaxStepsForCurrentPhase() {
        switch (this.assemblyPhase) {
            case 0: // Strut Collection Phase
                return Math.max(1, this.triangleTypes.size);
            case 1: // Triangle Assembly Phase
                return Math.max(1, this.triangleTypes.size);
            case 2: // Component Integration Phase
                return Math.max(1, this.assemblyLayers.length);
            default:
                return Math.min(this.allTriangles.length, 20);
        }
    }
    
    previousAssemblyStep() {
        if (this.assemblyStep > 0) {
            this.assemblyStep--;
            this.updateUI();
            this.initMainDomeView();
        }
    }
    
    nextAssemblyStep() {
        if (this.assemblyStep < this.maxAssemblySteps) {
            this.assemblyStep++;
            this.updateUI();
            this.initMainDomeView();
        }
    }
    
    toggleAutoAssembly() {
        if (this.autoAssemblyInterval) {
            clearInterval(this.autoAssemblyInterval);
            this.autoAssemblyInterval = null;
            document.getElementById('assembly-auto').textContent = '▶ Auto';
        } else {
            this.autoAssemblyInterval = setInterval(() => {
                if (this.assemblyStep < this.maxAssemblySteps) {
                    this.nextAssemblyStep();
                } else {
                    this.assemblyStep = 0;
                    this.updateUI();
                    this.initMainDomeView();
                }
            }, 1000);
            document.getElementById('assembly-auto').textContent = '⏸ Stop';
        }
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
    
    updateStrutInfo() {
        if (!this.selectedStrut) return;
        
        const strutInfo = this.selectedStrut.strutInfo;
        document.getElementById('triangle-number').textContent = `Good Karma Strut Type ${strutInfo.type}`;
        
        const strutsList = document.getElementById('struts-list');
        strutsList.innerHTML = `
            <div class="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-lg">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-6 h-6 rounded" style="background-color: ${strutInfo.color}"></div>
                    <h3 class="font-bold text-lg">Good Karma Hubless Strut</h3>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="font-semibold">Type: ${strutInfo.type}</p>
                        <p>Length: ${strutInfo.length.toFixed(1)}mm</p>
                        <p>Width: ${this.strutWidth}mm</p>
                        <p>Height: ${this.strutHeight}mm</p>
                    </div>
                    <div>
                        <p class="font-semibold">Hubless Cuts:</p>
                        <p>Miter: 18° (horizontal)</p>
                        <p>Bevel: 27.8° (vertical)</p>
                        <p>Cross-section: Rectangular</p>
                    </div>
                </div>
                <div class="mt-3 p-2 bg-white bg-opacity-20 rounded">
                    <p class="text-xs">🔨 <strong>Good Karma Method:</strong> Rectangular strut with compound cuts - overlaps with other struts for hubless connections!</p>
                </div>
            </div>
        `;
    }
    
    updateJointInfo() {
        if (!this.selectedJoint) return;
        
        const connections = this.selectedJoint.connections;
        const jointType = connections === 5 ? 'Pentagon Vertex' : 
                         connections === 6 ? 'Hexagon Vertex' : 
                         'Edge Vertex';
        const jointColor = connections === 5 ? 'Gold' : 
                          connections === 6 ? 'Silver' : 'Red';
        
        document.getElementById('triangle-number').textContent = `${jointType} (Hubless)`;
        
        const strutsList = document.getElementById('struts-list');
        strutsList.innerHTML = `
            <div class="bg-gradient-to-r from-amber-600 to-orange-700 text-white p-4 rounded-lg">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-6 h-6 rounded-full bg-amber-300"></div>
                    <h3 class="font-bold text-lg">Good Karma Hubless Joint</h3>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="font-semibold">Type: ${jointType}</p>
                        <p>Connections: ${connections} struts</p>
                        <p>Method: Overlapping cuts</p>
                    </div>
                    <div>
                        <p class="font-semibold">Hubless System:</p>
                        <p>No metal hubs needed!</p>
                        <p>Miter + Bevel cuts create fit</p>
                        <p>${connections === 5 ? 'Creates dome curvature' : connections === 6 ? 'Maintains structure' : 'Edge connection'}</p>
                    </div>
                </div>
                <div class="mt-3 p-2 bg-white bg-opacity-20 rounded">
                    <p class="text-xs">🔨 <strong>Good Karma Method:</strong> ${connections} rectangular struts overlap at precise compound angles - no complex hubs required!</p>
                </div>
            </div>
        `;
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
                    <div class="ml-auto text-right">
                        <div class="text-sm font-medium">${strut.length.toFixed(1)}mm</div>
                        <div class="text-xs text-gray-600">${strut.count} struts</div>
                    </div>
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
        
        // Organize triangles for enhanced assembly mode
        this.organizeTrianglesByType();
        
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
        const strutCountMap = new Map();
        
        // Track all struts to avoid counting duplicates
        const processedStruts = new Set();
        
        this.allTriangles.forEach((tri) => {
            for (let i = 0; i < 3; i++) {
                const v1 = tri[i];
                const v2 = tri[(i + 1) % 3];
                const length = v1.distanceTo(v2) * 1000;
                const key = Math.round(length);
                
                // Create a unique strut identifier to avoid counting shared struts twice
                const strutKey = this.getStrutKey(v1, v2);
                
                if (!strutLengthMap.has(key)) {
                    strutLengthMap.set(key, length);
                }
                
                // Count each unique strut only once
                if (!processedStruts.has(strutKey)) {
                    processedStruts.add(strutKey);
                    strutCountMap.set(key, (strutCountMap.get(key) || 0) + 1);
                }
            }
        });

        const uniqueLengths = Array.from(strutLengthMap.values()).sort((a, b) => a - b);
        this.strutTypes = uniqueLengths.map((len, idx) => ({
            type: String.fromCharCode(65 + idx),
            length: len,
            count: strutCountMap.get(Math.round(len)) || 0,
            color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'][idx % 5]
        }));
    }
    
    organizeTrianglesByType() {
        // Clear previous organization
        this.triangleTypes.clear();
        this.assemblyInventory.clear();
        this.groundTriangles = [];
        this.assemblyLayers = [];
        
        // Analyze each triangle's strut composition
        this.allTriangles.forEach((tri, idx) => {
            const strutComposition = this.analyzeTriangleStrutComposition(tri, idx);
            const triangleTypeKey = strutComposition.typeSignature;
            const heightLevel = this.getTriangleHeightLevel(tri);
            
            // Group triangles by type
            if (!this.triangleTypes.has(triangleTypeKey)) {
                this.triangleTypes.set(triangleTypeKey, {
                    signature: triangleTypeKey,
                    strutTypes: strutComposition.strutTypes,
                    color: this.generateTriangleTypeColor(triangleTypeKey),
                    triangles: [],
                    count: 0
                });
            }
            
            const triangleType = this.triangleTypes.get(triangleTypeKey);
            triangleType.triangles.push({
                index: idx,
                triangle: tri,
                heightLevel: heightLevel,
                strutComposition: strutComposition
            });
            triangleType.count++;
            
            // Organize by height for ground-up assembly
            if (heightLevel === 0) {
                this.groundTriangles.push({
                    index: idx,
                    triangle: tri,
                    type: triangleTypeKey,
                    strutComposition: strutComposition
                });
            }
        });
        
        // Create assembly layers
        this.createAssemblyLayers();
        
        // Initialize assembly inventory
        this.initializeAssemblyInventory();
    }
    
    analyzeTriangleStrutComposition(tri, triangleIndex) {
        const side1 = tri[0].distanceTo(tri[1]) * 1000;
        const side2 = tri[1].distanceTo(tri[2]) * 1000;
        const side3 = tri[2].distanceTo(tri[0]) * 1000;
        
        const sides = [side1, side2, side3];
        const strutTypes = sides.map(length => {
            const matchIdx = this.strutTypes.findIndex(st => Math.abs(st.length - length) < 1);
            return this.strutTypes[matchIdx]?.type || 'A';
        });
        
        // Create a normalized signature (sorted to group similar triangles)
        const sortedTypes = [...strutTypes].sort();
        const typeSignature = sortedTypes.join('-');
        
        return {
            typeSignature,
            strutTypes,
            lengths: sides,
            triangleIndex
        };
    }
    
    getTriangleHeightLevel(tri) {
        const avgY = (tri[0].y + tri[1].y + tri[2].y) / 3;
        const normalizedHeight = (avgY + 3.5) / 7.0; // Normalize to 0-1 range
        
        // Divide into 5 levels for assembly layers
        if (normalizedHeight < 0.2) return 0; // Ground level
        if (normalizedHeight < 0.4) return 1; // First ring
        if (normalizedHeight < 0.6) return 2; // Second ring
        if (normalizedHeight < 0.8) return 3; // Third ring
        return 4; // Top level
    }
    
    generateTriangleTypeColor(typeSignature) {
        // Generate consistent colors based on strut type signature
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        
        let hash = 0;
        for (let i = 0; i < typeSignature.length; i++) {
            hash = typeSignature.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
    
    createAssemblyLayers() {
        // Organize triangles into assembly layers for ground-up construction
        for (let level = 0; level <= 4; level++) {
            const layerTriangles = [];
            
            this.triangleTypes.forEach((typeData, typeKey) => {
                const trianglesAtLevel = typeData.triangles.filter(t => t.heightLevel === level);
                if (trianglesAtLevel.length > 0) {
                    layerTriangles.push({
                        type: typeKey,
                        triangles: trianglesAtLevel,
                        color: typeData.color
                    });
                }
            });
            
            if (layerTriangles.length > 0) {
                this.assemblyLayers.push({
                    level: level,
                    name: this.getLayerName(level),
                    triangleGroups: layerTriangles
                });
            }
        }
    }
    
    getLayerName(level) {
        const names = [
            'Ground Foundation',
            'First Ring',
            'Second Ring', 
            'Third Ring',
            'Top Cap'
        ];
        return names[level] || `Layer ${level}`;
    }
    
    initializeAssemblyInventory() {
        // Initialize inventory tracking for each triangle type
        this.triangleTypes.forEach((typeData, typeKey) => {
            this.assemblyInventory.set(typeKey, {
                total: typeData.count,
                collected: 0,
                assembled: 0,
                integrated: 0,
                inProgress: false
            });
        });
    }
    
    getTrianglesToShowInAssembly() {
        switch (this.assemblyPhase) {
            case 0: // Strut Collection Phase
                return this.getTrianglesForStrutCollection();
            case 1: // Triangle Assembly Phase  
                return this.getTrianglesForTriangleAssembly();
            case 2: // Component Integration Phase
                return this.getTrianglesForIntegration();
            default:
                return this.allTriangles.slice(0, this.assemblyStep);
        }
    }
    
    getTrianglesForStrutCollection() {
        // Show organized stacks of triangle types for strut collection
        if (this.selectedTriangleType) {
            const typeData = this.triangleTypes.get(this.selectedTriangleType);
            return typeData ? typeData.triangles.map(t => t.triangle) : [];
        }
        
        // Show a few examples of each triangle type
        const exampleTriangles = [];
        let typeIndex = 0;
        this.triangleTypes.forEach((typeData, typeKey) => {
            if (typeIndex < this.assemblyStep + 1) {
                // Show first triangle of each type as example
                if (typeData.triangles.length > 0) {
                    exampleTriangles.push(typeData.triangles[0].triangle);
                }
            }
            typeIndex++;
        });
        
        return exampleTriangles;
    }
    
    getTrianglesForTriangleAssembly() {
        // Show triangles being assembled by type
        const assembledTriangles = [];
        let typeIndex = 0;
        
        this.triangleTypes.forEach((typeData, typeKey) => {
            if (typeIndex <= this.assemblyStep) {
                // Show all triangles of completed types
                assembledTriangles.push(...typeData.triangles.map(t => t.triangle));
            }
            typeIndex++;
        });
        
        return assembledTriangles;
    }
    
    getTrianglesForIntegration() {
        // Show layer-by-layer construction
        const integratedTriangles = [];
        
        for (let layerIndex = 0; layerIndex <= this.assemblyStep && layerIndex < this.assemblyLayers.length; layerIndex++) {
            const layer = this.assemblyLayers[layerIndex];
            layer.triangleGroups.forEach(group => {
                integratedTriangles.push(...group.triangles.map(t => t.triangle));
            });
        }
        
        return integratedTriangles;
    }
    
    getTriangleTypeInfo(triangle) {
        // Find the triangle type info for a given triangle
        for (const [typeKey, typeData] of this.triangleTypes) {
            const matchingTriangle = typeData.triangles.find(t => 
                t.triangle === triangle || this.trianglesEqual(t.triangle, triangle)
            );
            if (matchingTriangle) {
                return typeData;
            }
        }
        return null;
    }
    
    trianglesEqual(tri1, tri2) {
        // Check if two triangles are the same (within tolerance)
        const tolerance = 0.001;
        for (let i = 0; i < 3; i++) {
            if (Math.abs(tri1[i].x - tri2[i].x) > tolerance ||
                Math.abs(tri1[i].y - tri2[i].y) > tolerance ||
                Math.abs(tri1[i].z - tri2[i].z) > tolerance) {
                return false;
            }
        }
        return true;
    }
    
    createDomeGeometry() {
        this.domeGroup = new THREE.Group();
        this.strutMeshes = new Map(); // Track strut meshes to avoid duplicates
        this.jointMeshes = new Map(); // Track joint meshes
        
        // In assembly mode, show triangles based on phase and step
        const trianglesToShow = this.assemblyMode ? 
            this.getTrianglesToShowInAssembly() : 
            this.allTriangles;
        
        trianglesToShow.forEach((tri, displayIdx) => {
            // Find the original index of this triangle in allTriangles
            const originalIdx = this.allTriangles.findIndex(originalTri => 
                this.trianglesEqual(tri, originalTri)
            );
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                tri[0].x, tri[0].y, tri[0].z,
                tri[1].x, tri[1].y, tri[1].z,
                tri[2].x, tri[2].y, tri[2].z
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();

            const isHighlighted = this.selectedTriangle?.triangleIndex === originalIdx;
            const triangleTypeInfo = this.getTriangleTypeInfo(tri);
            const isSelectedType = this.selectedTriangleType === triangleTypeInfo?.signature;
            
            let color = 0xffffff;
            let opacity = 0.3;
            
            if (isHighlighted) {
                color = 0xffff00; // Yellow for selected triangle
                opacity = 0.9;
            } else if (this.assemblyMode && triangleTypeInfo) {
                // Color by triangle type in assembly mode
                color = new THREE.Color(triangleTypeInfo.color).getHex();
                opacity = isSelectedType ? 0.8 : 0.5;
            } else if (this.assemblyMode) {
                color = 0x00ff00; // Green for newly added (fallback)
                opacity = 0.6;
            }
            
            const material = new THREE.MeshStandardMaterial({
                color: color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: opacity,
                metalness: 0.1,
                roughness: 0.5
            });

            const mesh = new THREE.Mesh(geometry, material);
            
            // Add triangle border edges for better visualization
            this.addTriangleBorders(mesh, tri, triangleTypeInfo);
            
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
                triangleIndex: originalIdx, 
                vertices: tri,
                center: new THREE.Vector3(
                    (tri[0].x + tri[1].x + tri[2].x) / 3,
                    (tri[0].y + tri[1].y + tri[2].y) / 3,
                    (tri[0].z + tri[1].z + tri[2].z) / 3
                ),
                struts: strutInfo
            };
            this.domeGroup.add(mesh);

            // Create real 3D struts instead of just lines
            strutInfo.forEach((strut, strutIdx) => {
                const strutKey = this.getStrutKey(strut.vertices[0], strut.vertices[1]);
                
                // Only create strut if we haven't already created it
                if (!this.strutMeshes.has(strutKey)) {
                    const strutMesh = this.createRealStrut(strut);
                    this.strutMeshes.set(strutKey, strutMesh);
                    this.domeGroup.add(strutMesh);
                }
            });
        });

        // Create joints at all vertices
        this.createJoints();

        this.scene.add(this.domeGroup);
    }
    
    getStrutKey(v1, v2) {
        // Create a unique key for a strut based on its endpoints
        const key1 = `${v1.x.toFixed(3)},${v1.y.toFixed(3)},${v1.z.toFixed(3)}`;
        const key2 = `${v2.x.toFixed(3)},${v2.y.toFixed(3)},${v2.z.toFixed(3)}`;
        return key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
    }
    
    createRealStrut(strutInfo) {
        const v1 = strutInfo.vertices[0];
        const v2 = strutInfo.vertices[1];
        const length = v1.distanceTo(v2);
        
        // Extend strut for Good Karma overlapping joint system
        const extendFactor = 1.05; // 5% extension to create overlap at joints
        const extendedLength = length * extendFactor;
        
        // Create strut geometry with Good Karma overlapping system
        const strutGeometry = this.createStrutGeometryForDome(extendedLength);
        const strutMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(strutInfo.color),
            metalness: 0.3,
            roughness: 0.4
        });
        
        const strutMesh = new THREE.Mesh(strutGeometry, strutMaterial);
        
        // Position strut with Good Karma overlapping system - struts extend to vertices for overlap
        const direction = v2.clone().sub(v1);
        // For Good Karma system, struts should overlap at joints, not have gaps
        const extendedV1 = v1.clone().sub(direction.clone().multiplyScalar((extendFactor - 1) / 2));
        const extendedV2 = v2.clone().add(direction.clone().multiplyScalar((extendFactor - 1) / 2));
        const midPoint = extendedV1.clone().add(extendedV2).multiplyScalar(0.5);
        strutMesh.position.copy(midPoint);
        
        // Simplified and corrected strut orientation for proper yaw rotation
        const normalizedDirection = direction.clone().normalize();
        
        // Position strut along the direction vector using extended endpoints for overlap
        strutMesh.lookAt(extendedV2);
        
        // Correct the orientation - struts should align along their length (Y-axis in geometry)
        // The lookAt method aligns the Z-axis, so we need to rotate to align Y-axis
        strutMesh.rotateX(Math.PI / 2);
        
        // Apply hubless rotation around the strut's length axis for proper joint assembly
        const heightFactor = (midPoint.y + 3.5) / 7.0; // Normalize height
        const radialDistance = Math.sqrt(midPoint.x * midPoint.x + midPoint.z * midPoint.z);
        
        // Calculate rotation angle based on position for optimal joint fit
        // This creates the compound angle cuts effect for hubless joints
        let rotationAngle = 0;
        
        // Base rotation for hubless system
        const baseRotation = Math.PI / 6; // 30 degrees
        
        // Add variation based on height and radial position
        const heightVariation = Math.sin(heightFactor * Math.PI) * 0.2; // Varies with height
        const radialVariation = (radialDistance / 3.5) * 0.1; // Varies with distance from center
        
        rotationAngle = baseRotation + heightVariation + radialVariation;
        
        // Apply the rotation around the strut's length axis (now Y-axis after correction)
        strutMesh.rotateY(rotationAngle);
        
        // Store strut info for interaction
        strutMesh.userData = {
            isStrut: true,
            strutInfo: strutInfo,
            vertices: [v1, v2],
            length: length,
            extendedLength: extendedLength,
            midPoint: midPoint,
            direction: direction,
            rotationApplied: rotationAngle,
            heightFactor: heightFactor,
            radialDistance: radialDistance,
            isGoodKarmaOverlap: true
        };
        
        return strutMesh;
    }
    
    addTriangleBorders(triangleMesh, triangle, triangleTypeInfo) {
        // Create border edges for triangle visualization
        const borderGeometry = new THREE.BufferGeometry();
        const borderVertices = new Float32Array([
            // Edge 1: v0 -> v1
            triangle[0].x, triangle[0].y, triangle[0].z,
            triangle[1].x, triangle[1].y, triangle[1].z,
            // Edge 2: v1 -> v2
            triangle[1].x, triangle[1].y, triangle[1].z,
            triangle[2].x, triangle[2].y, triangle[2].z,
            // Edge 3: v2 -> v0
            triangle[2].x, triangle[2].y, triangle[2].z,
            triangle[0].x, triangle[0].y, triangle[0].z
        ]);
        
        borderGeometry.setAttribute('position', new THREE.BufferAttribute(borderVertices, 3));
        
        // Use a darker version of the triangle type color for borders
        let borderColor = 0x000000; // Default black
        if (triangleTypeInfo && triangleTypeInfo.color) {
            const typeColor = new THREE.Color(triangleTypeInfo.color);
            // Darken the color for border
            borderColor = typeColor.clone().multiplyScalar(0.3).getHex();
        }
        
        const borderMaterial = new THREE.LineBasicMaterial({
            color: borderColor,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const borderLines = new THREE.LineSegments(borderGeometry, borderMaterial);
        triangleMesh.add(borderLines);
    }
    
    createStrutGeometryForDome(length) {
        // Create rectangular strut geometry matching actual dimensions (Good Karma hubless style)
        // Scale down strut cross-section to be more proportional to dome size
        const scaleFactor = 0.5; // Make struts thinner for better visualization
        const width = (this.strutWidth / 1000) * scaleFactor; // Convert mm to meters and scale
        const height = (this.strutHeight / 1000) * scaleFactor; // Convert mm to meters and scale
        
        // Create box geometry with proper rectangular cross-section
        const geometry = new THREE.BoxGeometry(width, length, height);
        
        // Apply Good Karma compound cuts for hubless joints - enhanced for overlapping system
        const miterAngle = 18 * Math.PI / 180; // Horizontal cut angle
        const bevelAngle = 27.8 * Math.PI / 180; // Vertical cut angle
        // Enhanced cuts for better overlap visualization
        
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        // Apply compound cuts at both ends with better joint assembly
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            
            // Apply cuts to vertices near the ends (more precise cut zone)
            if (Math.abs(vertex.y) > length * 0.35) {
                const endSign = Math.sign(vertex.y);
                const distanceFromEnd = Math.abs(Math.abs(vertex.y) - length * 0.5);
                const cutIntensity = Math.max(0, 1 - (distanceFromEnd / (length * 0.15)));
                
                // Apply miter cut (18° horizontal angle) - improved for geodesic alignment
                const miterOffset = Math.abs(vertex.z) * Math.tan(miterAngle) * endSign;
                vertex.x += miterOffset * 0.8 * cutIntensity;
                
                // Apply bevel cut (27.8° vertical angle) - improved for joint assembly
                const bevelOffset = Math.abs(vertex.x) * Math.tan(bevelAngle) * endSign;
                vertex.z += bevelOffset * 0.8 * cutIntensity;
                
                // Additional fine-tuning for smooth joint assembly
                // Slightly chamfer the edges for better fit
                const chamferAmount = 0.001 * cutIntensity;
                if (Math.abs(vertex.x) > width * 0.4) {
                    vertex.x -= Math.sign(vertex.x) * chamferAmount;
                }
                if (Math.abs(vertex.z) > height * 0.4) {
                    vertex.z -= Math.sign(vertex.z) * chamferAmount;
                }
                
                positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
        }
        
        geometry.computeVertexNormals();
        return geometry;
    }
    
    createJoints() {
        const vertexMap = new Map();
        
        // Collect unique vertices from visible triangles only
        const trianglesToShow = this.assemblyMode ? 
            this.allTriangles.slice(0, this.assemblyStep) : 
            this.allTriangles;
            
        trianglesToShow.forEach(tri => {
            tri.forEach(vertex => {
                const key = `${vertex.x.toFixed(3)},${vertex.y.toFixed(3)},${vertex.z.toFixed(3)}`;
                if (!vertexMap.has(key)) {
                    vertexMap.set(key, {
                        position: vertex.clone(),
                        connections: 0
                    });
                }
                vertexMap.get(key).connections++;
            });
        });
        
        // Create Good Karma hubless joint indicators - representing overlapping strut intersections
        vertexMap.forEach((vertexData, key) => {
            // Joint size represents the overlapping zone where struts meet
            const baseRadius = 0.004; // Slightly larger to show overlap zone
            const connectionMultiplier = Math.max(1, vertexData.connections / 5);
            const jointRadius = baseRadius * connectionMultiplier;
            const jointGeometry = new THREE.SphereGeometry(jointRadius, 16, 16);
            
            // Enhanced color coding for different joint types
            let jointColor = 0xffd700; // Gold for pentagon vertices (5 connections)
            let emissiveIntensity = 0.2;
            
            if (vertexData.connections === 6) {
                jointColor = 0xe6e6fa; // Lavender for hexagon vertices (6 connections)
                emissiveIntensity = 0.15;
            } else if (vertexData.connections < 5) {
                jointColor = 0xff6b6b; // Coral for edge vertices
                emissiveIntensity = 0.25;
            } else if (vertexData.connections > 6) {
                jointColor = 0x00ff7f; // Spring green for complex joints
                emissiveIntensity = 0.3;
            }
            
            const jointMaterial = new THREE.MeshStandardMaterial({
                color: jointColor,
                metalness: 0.7,
                roughness: 0.2,
                emissive: jointColor,
                emissiveIntensity: emissiveIntensity,
                transparent: true,
                opacity: 0.85
            });
            
            const jointMesh = new THREE.Mesh(jointGeometry, jointMaterial);
            
            // Enhanced joint positioning for perfect geodesic alignment
            const basePosition = vertexData.position.clone();
            
            // Calculate surface normal for this vertex
            const surfaceNormal = basePosition.clone().normalize();
            
            // Slightly inset the joint to show proper hubless connection
            const insetDistance = jointRadius * 0.5;
            const adjustedPosition = basePosition.clone().sub(
                surfaceNormal.clone().multiplyScalar(insetDistance)
            );
            
            jointMesh.position.copy(adjustedPosition);
            
            // Add subtle rotation animation for better visual appeal
            if (this.assemblyMode) {
                const time = Date.now() * 0.001;
                const pulseScale = 1 + 0.15 * Math.sin(time * 2 + vertexData.connections);
                jointMesh.scale.setScalar(pulseScale);
                
                // Gentle rotation for pentagon vertices
                if (vertexData.connections === 5) {
                    jointMesh.rotation.y = time * 0.5;
                }
            }
            
            // Store enhanced joint info
            jointMesh.userData = {
                isJoint: true,
                connections: vertexData.connections,
                position: vertexData.position,
                adjustedPosition: adjustedPosition,
                surfaceNormal: surfaceNormal,
                isHubless: true,
                jointType: vertexData.connections === 5 ? 'pentagon' : 
                          vertexData.connections === 6 ? 'hexagon' : 
                          vertexData.connections < 5 ? 'edge' : 'complex',
                color: jointColor
            };
            
            this.jointMeshes.set(key, jointMesh);
            this.domeGroup.add(jointMesh);
        });
    }
    
    setupMainViewInteraction() {
        const raycaster = new THREE.Raycaster();
        raycaster.params.Line.threshold = 0.5;
        const mouse = new THREE.Vector2();
        
        // Camera control variables
        let isDragging = false;
        let isRightDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let cameraTarget = new THREE.Vector3(0, 2, 0);
        let cameraDistance = 12;
        let cameraTheta = Math.PI / 4; // Horizontal rotation
        let cameraPhi = Math.PI / 3; // Vertical rotation

        const updateCameraPosition = () => {
            if (this.viewMode === 'full') {
                // Handle selection-based camera positioning
                if (this.selectedJoint) {
                    const pos = this.selectedJoint.position;
                    const distance = Math.max(0.05, 0.2 / this.zoom);
                    this.camera.position.set(
                        pos.x + distance * Math.sin(cameraPhi) * Math.cos(cameraTheta),
                        pos.y + distance * Math.cos(cameraPhi),
                        pos.z + distance * Math.sin(cameraPhi) * Math.sin(cameraTheta)
                    );
                    this.camera.lookAt(pos);
                } else if (this.selectedStrut) {
                    const v1 = this.selectedStrut.vertices[0];
                    const v2 = this.selectedStrut.vertices[1];
                    const center = v1.clone().add(v2).multiplyScalar(0.5);
                    const distance = Math.max(0.05, 0.3 / this.zoom);
                    this.camera.position.set(
                        center.x + distance * Math.sin(cameraPhi) * Math.cos(cameraTheta),
                        center.y + distance * Math.cos(cameraPhi),
                        center.z + distance * Math.sin(cameraPhi) * Math.sin(cameraTheta)
                    );
                    this.camera.lookAt(center);
                } else if (this.selectedTriangle) {
                    const center = this.selectedTriangle.center;
                    const distance = Math.max(0.1, 0.8 / this.zoom);
                    this.camera.position.set(
                        center.x + distance * Math.sin(cameraPhi) * Math.cos(cameraTheta),
                        center.y + distance * Math.cos(cameraPhi),
                        center.z + distance * Math.sin(cameraPhi) * Math.sin(cameraTheta)
                    );
                    this.camera.lookAt(center);
                } else {
                    // Free camera navigation
                    const distance = cameraDistance / this.zoom;
                    this.camera.position.set(
                        cameraTarget.x + distance * Math.sin(cameraPhi) * Math.cos(cameraTheta),
                        cameraTarget.y + distance * Math.cos(cameraPhi),
                        cameraTarget.z + distance * Math.sin(cameraPhi) * Math.sin(cameraTheta)
                    );
                    this.camera.lookAt(cameraTarget);
                }
            }
        };

        const onInteraction = (event) => {
            // Only handle clicks if not dragging
            if (isDragging || isRightDragging) return;
            
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
                
                // Handle strut selection
                if (obj.userData.isStrut) {
                    this.selectedStrut = obj.userData;
                    this.selectedJoint = null;
                    this.updateUI();
                    this.initMainDomeView();
                }
                // Handle joint selection  
                else if (obj.userData.isJoint) {
                    this.selectedJoint = obj.userData;
                    this.selectedStrut = null;
                    this.updateUI();
                    this.initMainDomeView();
                }
                // Handle triangle selection
                else if (obj.userData.triangleIndex !== undefined) {
                    this.selectedTriangle = obj.userData;
                    this.selectedStrut = null;
                    this.selectedJoint = null;
                    this.updateUI();
                    this.initMainDomeView(); // Refresh to show highlighting
                }
            }
        };

        const onMouseDown = (event) => {
            event.preventDefault();
            
            if (event.button === 0) { // Left click
                isDragging = true;
            } else if (event.button === 2) { // Right click
                isRightDragging = true;
            }
            
            previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseMove = (event) => {
            if (!isDragging && !isRightDragging) return;
            
            event.preventDefault();
            
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };
            
            if (isDragging) {
                // Left drag: Orbit camera around target
                cameraTheta -= deltaMove.x * 0.01;
                cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi + deltaMove.y * 0.01));
                updateCameraPosition();
            } else if (isRightDragging) {
                // Right drag: Pan camera target
                const panSpeed = 0.005 * (cameraDistance / this.zoom);
                const right = new THREE.Vector3();
                const up = new THREE.Vector3();
                
                this.camera.getWorldDirection(new THREE.Vector3());
                right.setFromMatrixColumn(this.camera.matrix, 0);
                up.setFromMatrixColumn(this.camera.matrix, 1);
                
                cameraTarget.add(right.multiplyScalar(-deltaMove.x * panSpeed));
                cameraTarget.add(up.multiplyScalar(deltaMove.y * panSpeed));
                updateCameraPosition();
            }
            
            previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseUp = (event) => {
            if (event.button === 0) {
                // Only trigger click if we didn't drag much
                const dragDistance = Math.abs(event.clientX - previousMousePosition.x) + 
                                   Math.abs(event.clientY - previousMousePosition.y);
                if (dragDistance < 5) { // Small threshold for clicks
                    onInteraction(event);
                }
                isDragging = false;
            } else if (event.button === 2) {
                isRightDragging = false;
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
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
            this.updateUI();
            document.getElementById('zoom-slider').value = this.zoom;
            updateCameraPosition();
        };

        // Touch handling for mobile
        const onTouchStart = (event) => {
            if (event.touches.length === 1) {
                isDragging = true;
                const touch = event.touches[0];
                previousMousePosition = { x: touch.clientX, y: touch.clientY };
            } else if (event.touches.length === 2) {
                // Two-finger touch for panning
                isRightDragging = true;
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                previousMousePosition = { 
                    x: (touch1.clientX + touch2.clientX) / 2, 
                    y: (touch1.clientY + touch2.clientY) / 2 
                };
            }
        };

        const onTouchMove = (event) => {
            event.preventDefault();
            
            if (event.touches.length === 1 && isDragging) {
                const touch = event.touches[0];
                const deltaMove = {
                    x: touch.clientX - previousMousePosition.x,
                    y: touch.clientY - previousMousePosition.y
                };
                
                cameraTheta -= deltaMove.x * 0.01;
                cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi + deltaMove.y * 0.01));
                updateCameraPosition();
                
                previousMousePosition = { x: touch.clientX, y: touch.clientY };
            } else if (event.touches.length === 2 && isRightDragging) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const currentPos = { 
                    x: (touch1.clientX + touch2.clientX) / 2, 
                    y: (touch1.clientY + touch2.clientY) / 2 
                };
                
                const deltaMove = {
                    x: currentPos.x - previousMousePosition.x,
                    y: currentPos.y - previousMousePosition.y
                };
                
                const panSpeed = 0.005 * (cameraDistance / this.zoom);
                const right = new THREE.Vector3();
                const up = new THREE.Vector3();
                
                right.setFromMatrixColumn(this.camera.matrix, 0);
                up.setFromMatrixColumn(this.camera.matrix, 1);
                
                cameraTarget.add(right.multiplyScalar(-deltaMove.x * panSpeed));
                cameraTarget.add(up.multiplyScalar(deltaMove.y * panSpeed));
                updateCameraPosition();
                
                previousMousePosition = currentPos;
            }
        };

        const onTouchEnd = (event) => {
            if (event.touches.length === 0) {
                // Only trigger click if we didn't drag much
                if (isDragging) {
                    onInteraction(event.changedTouches[0]);
                }
                isDragging = false;
                isRightDragging = false;
            }
        };

        // Add event listeners
        this.renderer.domElement.addEventListener('mousedown', onMouseDown);
        this.renderer.domElement.addEventListener('mousemove', onMouseMove);
        this.renderer.domElement.addEventListener('mouseup', onMouseUp);
        this.renderer.domElement.addEventListener('dblclick', onDoubleTap);
        this.renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
        this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable right-click menu
        
        this.renderer.domElement.addEventListener('touchstart', onTouchStart);
        this.renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        this.renderer.domElement.addEventListener('touchend', onTouchEnd);
        this.renderer.domElement.addEventListener('touchstart', onDoubleTap);
        
        // Store camera control functions for external access
        this.cameraControls = {
            updateCameraPosition,
            cameraTarget,
            setCameraTarget: (target) => {
                cameraTarget.copy(target);
                updateCameraPosition();
            },
            setCameraDistance: (distance) => {
                cameraDistance = distance;
                updateCameraPosition();
            }
        };
        
        // Initialize camera position
        updateCameraPosition();
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (!this.camera || !this.renderer || !this.scene) return;
        
        // Handle different view modes with proper geodesic positioning
        if (this.viewMode !== 'full') {
            const baseDistance = 10 / this.zoom;
            
            switch(this.viewMode) {
                case 'hexagon':
                    this.camera.position.set(0, baseDistance, 0);
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
        } else if (this.cameraControls) {
            // Use the new camera control system for full view
            this.cameraControls.updateCameraPosition();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    initStrutViews() {
        if (!this.selectedStrutType) return;
        
        // Initialize the step views
        this.initStepView('step1-view', 0);
        this.initStepView('step2-view', 1);
        this.initStepView('step3-view', 2);
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
        let autoRotate = false; // Disabled auto-rotation by default

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
