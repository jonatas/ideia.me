
class DomeSimulator {
    constructor() {
        this.frequency = 3;
        this.diameter = 7;
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
        this.baseShape = 'icosahedron';
        this.spherePortion = 'auto';
        this.structure = 'geodesic'; // geodesic or fullerene
        this.jointStyle = 'karma'; // standard, double, karma
        this.independentTriangles = false; // We use true single-layer hubless GoodKarma now
        this.lastTap = 0; // For double-tap detection
        
        // Enhanced Assembly Mode Properties
        this.assemblyPhase = 0; // 0: strut collection, 1: triangle assembly, 2: component integration
        this.maxAssemblyPhases = 3;
        this.triangleTypes = new Map(); // Categorize triangles by strut composition
        this.assemblyInventory = new Map(); // Track component counts and states
        this.groundTriangles = []; // Base layer triangles
        this.assemblyLayers = []; // Organized layers for construction
        this.assemblySegments = []; // New: more granular segments for construction
        this.selectedTriangleType = null; // Currently selected triangle type
        this.walkthroughStage = 0; // Initialize walkthrough stage
        
        // Door definition
        this.doorAzimuth = 0; // Front is at 0 degrees (positive Z)
        this.doorWidth = Math.PI / 4; // Width of the door area
        
        // Three.js objects
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.domeGroup = null;
        this.allFaces = [];
        
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
    
    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Update tab buttons
        const tabs = ['design', 'inventory', 'assembly', 'panels'];
        tabs.forEach(t => {
            const btn = document.getElementById(`btn-tab-${t}`);
            const content = document.getElementById(`tab-${t}`);
            if (btn && content) {
                if (t === tabId) {
                    btn.classList.add('active');
                    content.classList.remove('hidden');
                } else {
                    btn.classList.remove('active');
                    content.classList.add('hidden');
                }
            }
        });
        
        if (tabId === 'assembly' && !this.assemblyMode) {
            this.startAssemblyMode();
        } else if (tabId !== 'assembly' && this.assemblyMode) {
            this.exitAssemblyMode();
        }


    }

    showDetails(title, contentHtml) {
        const modal = document.getElementById('details-modal');
        const titleEl = document.getElementById('details-title');
        const contentEl = document.getElementById('details-content');
        
        if (modal && titleEl && contentEl) {
            titleEl.textContent = title;
            contentEl.innerHTML = contentHtml;
            modal.classList.remove('hidden');
            
            // If content contains step views, initialize them
            if (contentHtml.includes('step-view')) {
                setTimeout(() => this.updateStrutViews(), 100);
            }
        }
    }

    closeDetails() {
        const modal = document.getElementById('details-modal');
        if (modal) modal.classList.add('hidden');
    }

    setupEventListeners() {
        const bind = (id, prop, isFloat = false, needsInit = true) => {
            const el = document.getElementById(id);
            if (!el) return;
            
            const shortParam = id.replace('-slider', '');
            const urlParams = new URLSearchParams(window.location.search);
            
            if (urlParams.has(shortParam)) {
                let val = parseFloat(urlParams.get(shortParam));
                if (!isNaN(val)) {
                    el.value = val;
                    this[prop] = isFloat ? val : parseInt(val);
                }
            }
            
            el.addEventListener('input', (e) => {
                this[prop] = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value);
                if (id === 'frequency-slider') this.selectedTriangle = null;
                
                // Update URL
                const newUrlParams = new URLSearchParams(window.location.search);
                newUrlParams.set(shortParam, e.target.value);
                window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
                
                if (needsInit) this.initMainDomeView();
                this.updateUI();
            });
        };

        // Bind all sliders
        bind('frequency-slider', 'frequency', false, true);
        bind('diameter-slider', 'diameter', true, true);
        bind('zoom-slider', 'zoom', true, false);
        bind('strut-width', 'strutWidth', false, true);
        bind('strut-height', 'strutHeight', false, true);
        
        // Bind base shape buttons
        const btnShapeIcosahedron = document.getElementById('btn-shape-icosahedron');
        const btnShapeOctahedron = document.getElementById('btn-shape-octahedron');
        
        const updateShapeButtons = () => {
            if (btnShapeIcosahedron) {
                btnShapeIcosahedron.classList.toggle('text-sky-400', this.baseShape === 'icosahedron');
                btnShapeIcosahedron.classList.toggle('border-sky-400', this.baseShape === 'icosahedron');
                btnShapeIcosahedron.classList.toggle('bg-slate-800', this.baseShape === 'icosahedron');
                btnShapeIcosahedron.classList.toggle('text-slate-400', this.baseShape !== 'icosahedron');
                btnShapeIcosahedron.classList.toggle('border-slate-700', this.baseShape !== 'icosahedron');
            }
            if (btnShapeOctahedron) {
                btnShapeOctahedron.classList.toggle('text-sky-400', this.baseShape === 'octahedron');
                btnShapeOctahedron.classList.toggle('border-sky-400', this.baseShape === 'octahedron');
                btnShapeOctahedron.classList.toggle('bg-slate-800', this.baseShape === 'octahedron');
                btnShapeOctahedron.classList.toggle('text-slate-400', this.baseShape !== 'octahedron');
                btnShapeOctahedron.classList.toggle('border-slate-700', this.baseShape !== 'octahedron');
            }
        };

        if (btnShapeIcosahedron && btnShapeOctahedron) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('shape')) {
                this.baseShape = urlParams.get('shape');
            }
            updateShapeButtons();

            const setShape = (shape) => {
                if (this.baseShape === shape) return;
                this.baseShape = shape;
                // Revert structure appropriately based on user expectation
                this.structure = shape === 'octahedron' ? 'fullerene' : 'geodesic';
                this.selectedTriangle = null;
                updateShapeButtons();
                
                const newUrlParams = new URLSearchParams(window.location.search);
                newUrlParams.set('shape', this.baseShape);
                newUrlParams.set('structure', this.structure);
                window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
                
                // Manually trigger the struct buttons update
                const btnStructGeodesic = document.getElementById('btn-struct-geodesic');
                const btnStructFullerene = document.getElementById('btn-struct-fullerene');
                if (btnStructGeodesic) {
                    btnStructGeodesic.classList.toggle('border-sky-400', this.structure === 'geodesic');
                    btnStructGeodesic.classList.toggle('text-sky-400', this.structure === 'geodesic');
                    btnStructGeodesic.classList.toggle('border-slate-700', this.structure !== 'geodesic');
                    btnStructGeodesic.classList.toggle('text-slate-400', this.structure !== 'geodesic');
                }
                if (btnStructFullerene) {
                    btnStructFullerene.classList.toggle('border-sky-400', this.structure === 'fullerene');
                    btnStructFullerene.classList.toggle('text-sky-400', this.structure === 'fullerene');
                    btnStructFullerene.classList.toggle('border-slate-700', this.structure !== 'fullerene');
                    btnStructFullerene.classList.toggle('text-slate-400', this.structure !== 'fullerene');
                }

                this.initMainDomeView();
                this.updateUI();
            };

            btnShapeIcosahedron.addEventListener('click', () => setShape('icosahedron'));
            btnShapeOctahedron.addEventListener('click', () => setShape('octahedron'));
        }
        
        // Bind sphere portion buttons
        const btnPortionAuto = document.getElementById('btn-portion-auto');
        const btnPortionFull = document.getElementById('btn-portion-full');

        const updatePortionButtons = () => {
            if (btnPortionAuto) {
                btnPortionAuto.classList.toggle('text-sky-400', this.spherePortion === 'auto');
                btnPortionAuto.classList.toggle('border-sky-400', this.spherePortion === 'auto');
                btnPortionAuto.classList.toggle('bg-slate-800', this.spherePortion === 'auto');
                btnPortionAuto.classList.toggle('text-slate-400', this.spherePortion !== 'auto');
                btnPortionAuto.classList.toggle('border-slate-700', this.spherePortion !== 'auto');
            }
            if (btnPortionFull) {
                btnPortionFull.classList.toggle('text-sky-400', this.spherePortion === '1/1');
                btnPortionFull.classList.toggle('border-sky-400', this.spherePortion === '1/1');
                btnPortionFull.classList.toggle('bg-slate-800', this.spherePortion === '1/1');
                btnPortionFull.classList.toggle('text-slate-400', this.spherePortion !== '1/1');
                btnPortionFull.classList.toggle('border-slate-700', this.spherePortion !== '1/1');
            }
        };

        if (btnPortionAuto && btnPortionFull) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('shape')) {
                this.baseShape = urlParams.get('shape');
                if (this.baseShape === 'octahedron') {
                    this.structure = 'fullerene'; // User expectation for octahedron based on acidome
                }
            }
            if (urlParams.has('portion')) {
                this.spherePortion = urlParams.get('portion');
            }
            if (urlParams.has('structure')) {
                this.structure = urlParams.get('structure');
            }
            updatePortionButtons();

            const setPortion = (portion) => {
                if (this.spherePortion === portion) return;
                this.spherePortion = portion;
                this.selectedTriangle = null;
                updatePortionButtons();
                const newUrlParams = new URLSearchParams(window.location.search);
                newUrlParams.set('portion', this.spherePortion);
                window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
                this.initMainDomeView();
                this.updateUI();
            };

            btnPortionAuto.addEventListener('click', () => setPortion('auto'));
            btnPortionFull.addEventListener('click', () => setPortion('1/1'));
        }
        
        // Bind joint styles
        const jointKarma = document.getElementById('joint-karma');
        const jointDouble = document.getElementById('joint-double');
        if (jointKarma && jointDouble) {
            const updateJointParams = (style) => {
                this.jointStyle = style;
                this.independentTriangles = this.jointStyle === 'karma';
                const newUrlParams = new URLSearchParams(window.location.search);
                newUrlParams.set('joint', style);
                window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
                this.initMainDomeView();
                this.updateUI();
            };
            
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('joint')) {
                this.jointStyle = urlParams.get('joint');
                this.independentTriangles = this.jointStyle === 'karma';
            }
            
            jointKarma.addEventListener('click', () => updateJointParams('karma'));
            jointDouble.addEventListener('click', () => updateJointParams('double'));
        }
        
        // Bind flat base toggle
        const flatBaseToggle = document.getElementById('flat-base-toggle');
        if (flatBaseToggle) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('fb')) {
                const fbVal = urlParams.get('fb') === '1';
                flatBaseToggle.checked = fbVal;
                this.flatBase = fbVal;
            } else {
                this.flatBase = flatBaseToggle.checked;
            }
            
            flatBaseToggle.addEventListener('change', (e) => {
                this.flatBase = e.target.checked;
                const newUrlParams = new URLSearchParams(window.location.search);
                newUrlParams.set('fb', this.flatBase ? '1' : '0');
                window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
                
                this.initMainDomeView();
                this.updateUI();
            });
        }

        // Bind explode joints toggle
        const explodeJointsToggle = document.getElementById('explode-joints-toggle');
        if (explodeJointsToggle) {
            this.explodeJoints = false;
            explodeJointsToggle.addEventListener('click', (e) => {
                this.explodeJoints = !this.explodeJoints;
                if(this.explodeJoints) {
                    explodeJointsToggle.classList.add('text-sky-400');
                } else {
                    explodeJointsToggle.classList.remove('text-sky-400');
                }
                this.initMainDomeView();
            });
        } else {
            this.flatBase = true;
        }
        
        // Clear selection button
        const clearButton = document.getElementById('clear-selection');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.selectedTriangle = null;
                this.selectedStrut = null;
                this.selectedJoint = null;
                this.initMainDomeView();
                this.updateUI();
            });
        }
        
        // Assembly mode controls
        const assemblyToggle = document.getElementById('assembly-mode-toggle');
        assemblyToggle.addEventListener('click', () => {
            this.toggleAssemblyMode();
            if (this.assemblyMode) this.switchTab('assembly');
        });
        
        const assemblyAuto = document.getElementById('assembly-auto');
        assemblyAuto.addEventListener('click', () => {
            this.toggleAutoAssembly();
        });

        // View mode cycle
        const viewModeCycle = document.getElementById('view-mode-cycle');
        if (viewModeCycle) {
            viewModeCycle.addEventListener('click', () => {
                const modes = ['full', 'hexagon', 'inner', 'sky'];
                const currentIdx = modes.indexOf(this.viewMode);
                this.viewMode = modes[(currentIdx + 1) % modes.length];
                this.updateUI();
            });
        }

        const resetView = document.getElementById('reset-view');
        if (resetView) {
            resetView.addEventListener('click', () => {
                this.viewMode = 'full';
                this.zoom = 1.0;
                document.getElementById('zoom-slider').value = 1.0;
                this.cameraTarget = undefined;
                this.cameraDistance = undefined;
                this.cameraTheta = undefined;
                this.cameraPhi = undefined;
                this.initMainDomeView();
                this.updateUI();
            });
        }

        const btnStructGeodesic = document.getElementById('btn-struct-geodesic');
        const btnStructFullerene = document.getElementById('btn-struct-fullerene');

        const updateStructButtons = () => {
            if (btnStructGeodesic) {
                btnStructGeodesic.classList.toggle('border-sky-400', this.structure === 'geodesic');
                btnStructGeodesic.classList.toggle('text-sky-400', this.structure === 'geodesic');
                btnStructGeodesic.classList.toggle('border-slate-700', this.structure !== 'geodesic');
                btnStructGeodesic.classList.toggle('text-slate-400', this.structure !== 'geodesic');
            }
            if (btnStructFullerene) {
                btnStructFullerene.classList.toggle('border-sky-400', this.structure === 'fullerene');
                btnStructFullerene.classList.toggle('text-sky-400', this.structure === 'fullerene');
                btnStructFullerene.classList.toggle('border-slate-700', this.structure !== 'fullerene');
                btnStructFullerene.classList.toggle('text-slate-400', this.structure !== 'fullerene');
            }
        };

        if (btnStructGeodesic && btnStructFullerene) {
            updateStructButtons();
            
            const setStructureUrlParam = (struct) => {
                const newUrlParams = new URLSearchParams(window.location.search);
                newUrlParams.set('structure', struct);
                window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
            };

            btnStructGeodesic.addEventListener('click', () => {
                this.structure = 'geodesic';
                this.selectedTriangle = null;
                setStructureUrlParam('geodesic');
                updateStructButtons();
                this.generateGeodesicDome();
            });
            
            btnStructFullerene.addEventListener('click', () => {
                this.structure = 'fullerene';
                this.selectedTriangle = null;
                setStructureUrlParam('fullerene');
                updateStructButtons();
                this.generateGeodesicDome();
            });
        }

        const blueprintScaleSlider = document.getElementById('blueprint-scale-slider');
        if (blueprintScaleSlider) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('scale')) blueprintScaleSlider.value = urlParams.get('scale');
            document.getElementById('blueprint-scale-display').textContent = `1:${blueprintScaleSlider.value}`;
            
            blueprintScaleSlider.addEventListener('input', (e) => {
                document.getElementById('blueprint-scale-display').textContent = `1:${e.target.value}`;
                const newUrlParams = new URLSearchParams(window.location.search);
                newUrlParams.set('scale', e.target.value);
                window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
                if (this.blueprintMode) {
                    this.renderBlueprint();
                }
            });
        }
        
        const blueprintFlapsToggle = document.getElementById('blueprint-flaps-toggle');
        if (blueprintFlapsToggle) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('flaps')) blueprintFlapsToggle.checked = urlParams.get('flaps') === '1';
            
            blueprintFlapsToggle.addEventListener('change', () => {
                const newUrlParams = new URLSearchParams(window.location.search);
                newUrlParams.set('flaps', blueprintFlapsToggle.checked ? '1' : '0');
                window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
                if (this.blueprintMode) {
                    this.renderBlueprint();
                }
            });
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('origami_style')) {
            this.blueprintViewMode = urlParams.get('origami_style');
            // update UI button
            const btnStyle = document.getElementById('btn-blueprint-style');
            if (btnStyle) {
                if (this.blueprintViewMode === 'panels') {
                    btnStyle.innerHTML = '<i class="bi bi-scissors"></i>';
                    btnStyle.title = "Switch to Panels (Scissors)";
                } else {
                    btnStyle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <polygon points="8,12 16,12 12,18.93" />
                    <polygon points="8,12 16,12 12,5.07" />
                    <polygon points="8,12 12,18.93 4,18.93" />
                    <polygon points="16,12 12,18.93 20,18.93" />
                </svg>`;
                    btnStyle.title = "Switch to Origami Net";
                }
            }
        }
        
        if (urlParams.has('origami') && urlParams.get('origami') === '1') {
            setTimeout(() => {
                if (!this.blueprintMode) this.toggleOrigamiMode();
            }, 100);
        }
    }
    
    updateUI() {
        // Update frequency display
        document.getElementById('frequency-display').textContent = this.frequency;
        
        // Update diameter display
        const diaDisplay = document.getElementById('diameter-display');
        if (diaDisplay) diaDisplay.textContent = `${this.diameter}m`;
        
        // Update app title
        const appTitle = document.getElementById('app-title');
        if (appTitle) appTitle.textContent = `${this.diameter}m Geodesic Dome Builder`;
        
        // Update zoom display
        document.getElementById('zoom-display').textContent = `${this.zoom.toFixed(1)}x`;
        
        // Update strut dimensions display
        document.getElementById('strut-width-display').textContent = `${this.strutWidth}mm`;
        document.getElementById('strut-height-display').textContent = `${this.strutHeight}mm`;
        
        // Show/hide selection info
        const triangleInfo = document.getElementById('triangle-info');
        
        if (this.selectedTriangle || this.selectedStrut || this.selectedJoint) {
            triangleInfo.classList.remove('hidden');
            if (this.selectedTriangle) {
                this.updateTriangleInfo();
            } else if (this.selectedStrut) {
                this.updateStrutInfo();
            } else if (this.selectedJoint) {
                this.updateJointInfo();
            }
        } else {
            triangleInfo.classList.add('hidden');
        }
        
        // Update joint style buttons
        const jointKarma = document.getElementById('joint-karma');
        const jointDouble = document.getElementById('joint-double');
        if (jointKarma && jointDouble) {
            if (this.jointStyle === 'double') {
                jointDouble.className = 'flex-1 py-1.5 px-2 text-[10px] font-bold rounded border border-sky-400 bg-sky-400/10 text-sky-400 transition-colors';
                jointKarma.className = 'flex-1 py-1.5 px-2 text-[10px] font-bold rounded border border-slate-700 bg-slate-800 text-slate-400 transition-colors';
            } else {
                jointKarma.className = 'flex-1 py-1.5 px-2 text-[10px] font-bold rounded border border-sky-400 bg-sky-400/10 text-sky-400 transition-colors';
                jointDouble.className = 'flex-1 py-1.5 px-2 text-[10px] font-bold rounded border border-slate-700 bg-slate-800 text-slate-400 transition-colors';
            }
        }
        
        // Show/hide Flat Base option based on compatibility
        const flatBaseContainer = document.getElementById('flat-base-container');
        if (flatBaseContainer) {
            const hasFlatBase = (this.structure === 'fullerene' && this.spherePortion === '1/1') ||
                                (this.spherePortion === '1/2' && (this.frequency % 2 === 0 || this.baseShape === 'octahedron'));
            flatBaseContainer.style.display = hasFlatBase ? 'block' : 'none';
        }
        
        // Update strut types list
        this.updateStrutTypesList();
        
        // Update assembly controls
        this.updateAssemblyControls();
        
        // Update triangle inventory
        this.updateTriangleInventory();
        
        // Refresh blueprint if in origami mode
        if (this.blueprintMode) {
            this.renderBlueprint();
        }
    }
    
    updateAssemblyControls() {
        const assemblyProgressBar = document.getElementById('assembly-progress-bar');
        const assemblyProgressPercent = document.getElementById('assembly-progress-percent');
        const assemblyToggle = document.getElementById('assembly-mode-toggle');
        const stepsContainer = document.getElementById('assembly-steps-container');
        
        if (this.assemblyMode) {
            assemblyToggle.textContent = 'Exit Assembly Mode';
            assemblyToggle.className = 'flex-1 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded hover:bg-red-600 transition-colors';
            
            const progress = (this.assemblyStep / Math.max(1, this.maxAssemblySteps)) * 100;
            if (assemblyProgressBar) assemblyProgressBar.style.width = `${progress}%`;
            if (assemblyProgressPercent) assemblyProgressPercent.textContent = `${Math.round(progress)}%`;
            
            // Populate segments
            if (stepsContainer) {
                stepsContainer.innerHTML = '';
                
                // Add Phase selector
                const phaseNames = ["Component Prep", "Unit Assembly", "Final Construction"];
                const phaseSelector = document.createElement('div');
                phaseSelector.className = 'flex gap-1 mb-4 bg-slate-800 p-1 rounded-lg';
                phaseNames.forEach((name, idx) => {
                    const btn = document.createElement('button');
                    btn.className = `flex-1 py-1.5 text-[9px] font-bold uppercase rounded ${this.assemblyPhase === idx ? 'bg-primary text-slate-900' : 'text-slate-400 hover:text-white'}`;
                    btn.textContent = name;
                    btn.onclick = () => {
                        this.assemblyPhase = idx;
                        this.assemblyStep = 0;
                        this.maxAssemblySteps = this.getMaxStepsForCurrentPhase();
                        this.updateUI();
                        this.initMainDomeView();
                    };
                    phaseSelector.appendChild(btn);
                });
                stepsContainer.appendChild(phaseSelector);

                // Add Step items based on current phase
                if (this.assemblyPhase === 2) { // Final Construction
                    this.assemblySegments.forEach((segment, idx) => {
                        const card = document.createElement('div');
                        const isActive = this.assemblyStep === idx;
                        card.className = `data-card ${isActive ? 'active' : ''}`;
                        card.innerHTML = `
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-bold ${isActive ? 'text-primary' : 'text-slate-300'}">${segment.name}</span>
                                ${idx <= this.assemblyStep ? '<i class="bi bi-check-circle-fill text-primary text-xs"></i>' : '<i class="bi bi-circle text-slate-600 text-xs"></i>'}
                            </div>
                            <div class="flex justify-between items-center mt-1">
                                <div class="text-[10px] text-slate-500">${segment.triangles.length} units to integrate</div>
                                <div class="text-[10px] text-primary/60">Details <i class="bi bi-chevron-right"></i></div>
                            </div>
                        `;
                        card.onclick = () => {
                            this.assemblyStep = idx;
                            this.updateUI();
                            this.initMainDomeView();
                        };
                        stepsContainer.appendChild(card);
                    });
                } else {
                    // Placeholder for other phases or simple step list
                    const stepCount = this.maxAssemblySteps + 1;
                    for (let i = 0; i < stepCount; i++) {
                        const card = document.createElement('div');
                        const isActive = this.assemblyStep === i;
                        card.className = `data-card ${isActive ? 'active' : ''}`;
                        card.innerHTML = `
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-bold ${isActive ? 'text-primary' : 'text-slate-300'}">Step ${i + 1}</span>
                                ${i <= this.assemblyStep ? '<i class="bi bi-check-circle-fill text-primary text-xs"></i>' : '<i class="bi bi-circle text-slate-600 text-xs"></i>'}
                            </div>
                        `;
                        card.onclick = () => {
                            this.assemblyStep = i;
                            this.updateUI();
                            this.initMainDomeView();
                        };
                        stepsContainer.appendChild(card);
                    }
                }
            }
        } else {
            assemblyToggle.textContent = 'Enter Assembly Mode';
            assemblyToggle.className = 'flex-1 py-2 border border-sky-400 text-sky-400 text-[10px] font-black uppercase tracking-tighter rounded hover:bg-sky-400 hover:text-slate-900 transition-colors';
            if (stepsContainer) stepsContainer.innerHTML = '<div class="text-center py-8 text-slate-500 text-xs italic">Enable assembly mode to see construction steps</div>';
        }
    }
    
    updateTriangleInventory() {
        const triangleTypesGrid = document.getElementById('triangle-types-grid');
        if (!triangleTypesGrid) return;

        triangleTypesGrid.innerHTML = '';
        this.triangleTypes.forEach((typeData, typeKey) => {
            const card = document.createElement('div');
            const isSelected = this.selectedTriangleType === typeKey;
            card.className = `data-card ${isSelected ? 'active' : ''}`;
            
            card.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black" style="background-color: ${typeData.color}22; color: ${typeData.color}">
                        ${typeKey.split('-').length}
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between">
                            <span class="text-xs font-bold text-slate-200">${typeKey}</span>
                            <span class="text-xs font-mono text-primary">${typeData.count} Units</span>
                        </div>
                        <div class="text-[10px] text-slate-500 mt-0.5">Struts: ${typeData.strutTypes.join(', ')}</div>
                    </div>
                </div>
            `;
            
            card.onclick = () => {
                this.selectTriangleType(isSelected ? null : typeKey);
            };
            
            triangleTypesGrid.appendChild(card);
        });
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
        this.selectedStrutType = null;
        if (typeKey) {
            this.highlightTriangleTypeUntil = Date.now() + 3000;
            setTimeout(() => {
                if (this.selectedTriangleType === typeKey) {
                    this.initMainDomeView();
                }
            }, 3000);
        }
        this.updateUI();
        this.initMainDomeView();
    }
    
    getMaxStepsForCurrentPhase() {
        switch (this.assemblyPhase) {
            case 0: // Strut Collection Phase
                // Calculate total examples to show (3 per type)
                let totalExamples = 0;
                this.triangleTypes.forEach((typeData) => {
                    totalExamples += Math.min(3, typeData.triangles.length);
                });
                return Math.max(1, totalExamples - 1);
            case 1: // Triangle Assembly Phase
                // Show all triangles one by one from ground up
                return Math.max(1, this.allFaces.length - 1);
            case 2: // Component Integration Phase (Segments)
                return Math.max(1, this.assemblySegments.length - 1);
            default:
                return Math.min(this.allFaces.length, 20);
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
            const btn = document.createElement('button');
            const isSelected = this.selectedStrutType?.type === strut.type;
            btn.className = `w-full flex items-center gap-3 p-2.5 rounded-lg transition-all border ${
                isSelected ? 'bg-primary/20 border-primary text-primary' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`;
            
            btn.innerHTML = `
                <div class="w-2 h-2 rounded-full" style="background-color: ${strut.color}"></div>
                <span class="text-[10px] font-bold uppercase tracking-wider">Strut ${i + 1} (${strut.type})</span>
                <span class="ml-auto font-mono text-[10px]">${strut.length.toFixed(1)}mm</span>
            `;
            
            btn.addEventListener('click', () => {
                this.selectedStrutType = strut;
                this.updateUI();
            });
            
            strutsList.appendChild(btn);
        });
    }
    
    updateStrutInfo() {
        if (!this.selectedStrut) return;
        
        const strutInfo = this.selectedStrut.strutInfo;
        const insideLength = strutInfo.length - (this.strutWidth / Math.tan((90 - strutInfo.miterAngle) * Math.PI / 180));

        document.getElementById('triangle-number').textContent = `Strut Type ${strutInfo.type}`;
        
        const strutsList = document.getElementById('struts-list');
        strutsList.innerHTML = `
            <div class="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${strutInfo.color}"></div>
                    <span class="text-xs font-bold text-primary">Good Karma Strut ${strutInfo.type}</span>
                </div>
                <div class="grid grid-cols-2 gap-y-2 text-[10px]">
                    <span class="text-slate-500">Inside L</span><span class="text-primary font-bold font-mono">${insideLength.toFixed(1)}mm</span>
                    <span class="text-slate-500">Outside L</span><span class="text-slate-200 font-mono">${strutInfo.length.toFixed(1)}mm</span>
                    <span class="text-slate-500">Sway (Miter)</span><span style="color: #fb7185" class="font-mono">${strutInfo.miterAngle.toFixed(1)}°</span>
                    <span class="text-slate-500">Tilt (Bevel)</span><span style="color: #34d399" class="font-mono">${strutInfo.bevelAngle.toFixed(1)}°</span>
                </div>
            </div>
        `;
    }
    
    updateJointInfo() {
        if (!this.selectedJoint) return;
        
        const connections = this.selectedJoint.connections;
        const jointType = connections === 5 ? 'Pentagon' : 
                         connections === 6 ? 'Hexagon' : 
                         'Foundation';
        
        document.getElementById('triangle-number').textContent = `${jointType} Node`;
        
        const strutsList = document.getElementById('struts-list');
        strutsList.innerHTML = `
            <div class="bg-slate-800/80 border border-slate-700 p-3 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                    <span class="text-xs font-bold text-amber-400">Hubless Connection</span>
                </div>
                <p class="text-[10px] text-slate-400 leading-relaxed">
                    This node connects <strong>${connections} struts</strong> using precise overlapping miter and bevel cuts.
                </p>
                <div class="mt-2 text-[9px] text-slate-500 italic">
                    * No metal hubs required in the Good Karma system.
                </div>
            </div>
        `;
    }
    
    updateCuttingGuide() {
        if (!this.selectedStrutType) return;
        
        document.getElementById('selected-strut-type').textContent = this.selectedStrutType.type;
        document.getElementById('selected-strut-length').textContent = this.selectedStrutType.length.toFixed(1);
        
        // Update dimension displays based on actual dynamic angles
        const miterLoss = (this.strutHeight * Math.tan(this.selectedStrutType.miterAngle * Math.PI / 180)).toFixed(1);
        const bevelLoss = (this.strutWidth * Math.tan(this.selectedStrutType.bevelAngle * Math.PI / 180)).toFixed(1);
        
        document.getElementById('miter-loss').textContent = miterLoss;
        document.getElementById('bevel-loss').textContent = bevelLoss;
        
        // Update UI displays for dynamic angles (dome-builder.md spans)
        const updateSpanIfExt = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.textContent = val;
        };
        updateSpanIfExt('guide-miter-angle', this.selectedStrutType.miterAngle.toFixed(1));
        updateSpanIfExt('guide-bevel-angle', this.selectedStrutType.bevelAngle.toFixed(1));
        updateSpanIfExt('guide-miter-angle-2', this.selectedStrutType.miterAngle.toFixed(1));
        updateSpanIfExt('guide-miter-angle-3', this.selectedStrutType.miterAngle.toFixed(1));
        updateSpanIfExt('guide-miter-angle-4', this.selectedStrutType.miterAngle.toFixed(1));
        updateSpanIfExt('guide-bevel-angle-2', this.selectedStrutType.bevelAngle.toFixed(1));
        updateSpanIfExt('guide-bevel-angle-3', this.selectedStrutType.bevelAngle.toFixed(1));
        updateSpanIfExt('guide-bevel-angle-4', this.selectedStrutType.bevelAngle.toFixed(1));
        
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
        const list = document.getElementById('strut-types-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        const filterContainer = document.getElementById('inventory-filters');
        if (filterContainer && typeof InventoryFilter !== 'undefined') {
            const filterTypes = this.strutTypes.map(s => ({
                id: s.type,
                color: s.color || '#94a3b8',
                count: s.count,
                length: s.length,
                miter1: s.miter1 || s.miterAngle || 0,
                miter2: s.miter2 || s.miterAngle || 0,
                miter: s.miterAngle || 0,
                bevel: s.bevelAngle || 0
            }));
            
            if (!this.inventoryFilter) {
                this.inventoryFilter = new InventoryFilter(filterContainer, filterTypes, (activeId) => {
                    this.inventoryActiveFilter = activeId;
                    if (activeId) {
                        this.selectedStrutType = this.strutTypes.find(s => s.type === activeId);
                        this.highlightStrutTypeUntil = Date.now() + 3000;
                        setTimeout(() => {
                            if (this.selectedStrutType?.type === activeId) {
                                this.initMainDomeView();
                            }
                        }, 3000);
                    } else {
                        this.selectedStrutType = null;
                    }
                    this.updateStrutTypesList();
                    this.initMainDomeView();
                });
            } else {
                this.inventoryFilter.strutTypes = filterTypes;
                this.inventoryFilter.activeFilter = this.inventoryActiveFilter;
                this.inventoryFilter.render();
            }
        }

        const createSection = (title, filterFn) => {
            const struts = this.strutTypes.filter(filterFn).filter(s => !this.inventoryActiveFilter || s.type === this.inventoryActiveFilter);
            if (struts.length === 0) return;
            
            const header = document.createElement('div');
            header.className = 'text-xs font-bold text-slate-400 uppercase tracking-widest mt-6 mb-3 border-b border-slate-700 pb-2';
            header.textContent = title;
            list.appendChild(header);
            
            struts.forEach(strut => {
                const card = document.createElement('div');
                const isSelected = this.selectedStrutType?.type === strut.type;
                card.className = `data-card mb-3 cursor-pointer transition-colors ${isSelected ? 'active border-primary' : 'border-slate-700 hover:border-slate-500'}`;
                
                let qtyText = strut.count + ' Pieces';

                let insideLength;
                if (this.independentTriangles) {
                    const short1 = (this.strutWidth / 2) * Math.tan(strut.miter1 * Math.PI / 180);
                    const short2 = (this.strutWidth / 2) * Math.tan(strut.miter2 * Math.PI / 180);
                    // For asymmetric pinwheel, inner length is just shorter by the two miters since outer corners are far out
                    insideLength = strut.length - short1 - short2;
                } else {
                    insideLength = strut.length - (this.strutWidth / Math.tan((90 - strut.miterAngle) * Math.PI / 180));
                }

                card.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style="background-color: ${strut.color}22; color: ${strut.color}">
                            ${strut.type}
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-center mb-1">
                                <div class="flex items-baseline gap-2">
                                    <span class="text-sm font-bold text-slate-100">Inner: ${insideLength.toFixed(1)}</span>
                                    <span class="text-[10px] text-slate-500">(Outer: ${strut.length.toFixed(0)})</span>
                                </div>
                                <span class="text-xs font-mono text-primary">${qtyText}</span>
                            </div>
                            <div class="flex gap-3 text-[10px] text-slate-400">
                                <span style="color: #fb7185">Sway: ${this.independentTriangles ? `${strut.miter1?.toFixed(1)}° / ${strut.miter2?.toFixed(1)}°` : strut.miterAngle.toFixed(1) + '°'}</span>
                                <span style="color: #34d399">Tilt: ${strut.bevelAngle.toFixed(1)}°</span>
                            </div>
                        </div>
                    </div>
                    ${isSelected ? `
                    <div class="mt-4 pt-4 border-t border-slate-700/50">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <span class="block text-[10px] text-slate-400 mb-1">1. Miter Cut (Sway)</span>
                                <span style="color: #fb7185" class="font-mono text-sm">${this.independentTriangles ? `${strut.miter1?.toFixed(1)}° & ${strut.miter2?.toFixed(1)}°` : strut.miterAngle.toFixed(1) + '°'}</span>
                                <div class="mt-1 text-[10px] text-slate-500">${this.independentTriangles ? 'Asymmetric Pinwheel Cuts' : 'Both Ends (Point/V-Cut)'}</div>
                            </div>
                            <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <span class="block text-[10px] text-slate-400 mb-1">2. Bevel Cut (Tilt)</span>
                                <span style="color: #34d399" class="font-mono text-sm">${strut.bevelAngle.toFixed(1)}°</span>
                                <div class="mt-1 text-[10px] text-slate-500">Rip full edge</div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <a href="/wood-cuts/?miter=${this.independentTriangles ? strut.miter1.toFixed(1) : strut.miterAngle.toFixed(1)}&bevel=${strut.bevelAngle.toFixed(1)}&width=${this.strutWidth}&height=${this.strutHeight}" target="_blank" class="block text-center py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold rounded hover:bg-blue-600 hover:text-white transition-colors" onclick="event.stopPropagation();">
                                <i class="bi bi-box-arrow-up-right mr-1"></i> Open in Miter Saw Simulator
                            </a>
                        </div>
                    </div>
                    ` : ''}
                `;
                
                card.onclick = () => {
                    this.selectedStrutType = isSelected ? null : strut;
                    if (this.selectedStrutType) {
                        this.highlightStrutTypeUntil = Date.now() + 3000;
                        setTimeout(() => {
                            if (this.selectedStrutType?.type === strut.type) {
                                this.initMainDomeView();
                            }
                        }, 3000);
                    }
                    this.selectedTriangleType = null;
                    this.updateUI();
                    this.initMainDomeView();
                };
                
                list.appendChild(card);
            });
        };

        // Just show all struts as one list to avoid duplication
        createSection('All Struts', s => true);
    }
    
    initMainDomeView() {
        const mountElement = document.getElementById('main-dome-view');
        if (!mountElement) return;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear previous renderer
        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode === mountElement) {
            mountElement.removeChild(this.renderer.domElement);
        }
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
        sunLight.position.set(10, 10, 5);
        this.scene.add(sunLight);
        
        // Add ground
        const groundGeometry = new THREE.CircleGeometry(6, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1e293b,
            wireframe: true,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        
        // Generate geodesic dome
        this.generateGeodesicDome();

        // Setup interaction
        this.setupMainViewInteraction();
        
        // Start animation
        this.animate();
        
        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    generateGeodesicDome() {
        this.calculateGeometry();
        this.createDomeGeometry();
    }
    
    calculateGeometry() {
        this.allFaces = [];
        this.yRange = null; // Reset cached range
        
        // Calculate initial vertices
        const radius = this.diameter / 2;
        let baseVertices = [];
        let baseFaces = [];

        if (this.baseShape === 'octahedron') {
            baseVertices = [
                new THREE.Vector3(0, radius, 0),    // Top (0)
                new THREE.Vector3(0, -radius, 0),   // Bottom (1)
                new THREE.Vector3(radius, 0, 0),    // Right (2)
                new THREE.Vector3(-radius, 0, 0),   // Left (3)
                new THREE.Vector3(0, 0, radius),    // Front (4)
                new THREE.Vector3(0, 0, -radius)    // Back (5)
            ];

            baseFaces = [
                // Top hemisphere (counter-clockwise looking from outside for outward normal)
                [0, 4, 2], [0, 3, 4], [0, 5, 3], [0, 2, 5],
                // Bottom hemisphere
                [1, 2, 4], [1, 4, 3], [1, 3, 5], [1, 5, 2]
            ];
        } else {
            const phi = (1 + Math.sqrt(5)) / 2;
            const t = radius / Math.sqrt(1 + phi * phi);
            baseVertices = [
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

            // Rotate the icosahedron so that vertex 0 is at the top (0, radius, 0)
            // to align with the Kruschke method (zenith is a pentagon hub and base is flat)
            const q = new THREE.Quaternion().setFromUnitVectors(
                baseVertices[0].clone().normalize(),
                new THREE.Vector3(0, 1, 0)
            );
            baseVertices.forEach(v => v.applyQuaternion(q));

            baseFaces = [
                [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
                [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
                [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
                [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
            ];
        }

        // Generate all triangles through subdivision
        this.allFaces = [];
        baseFaces.forEach(face => {
            const v1 = baseVertices[face[0]];
            const v2 = baseVertices[face[1]];
            const v3 = baseVertices[face[2]];
            this.allFaces.push(...this.subdivideTriangle(v1, v2, v3, this.frequency, radius));
        });

        // Apply Kruschke magic fix for flat base
        if (this.baseShape === 'icosahedron' && (this.frequency === 3 || this.frequency === 4)) {
            const MAGIC_FIX_RATIO = this.frequency === 3 ? 0.9442890204731844 : (0.22219 / 0.253185 * 0.9983958444733023);
            
            const vertexMap = new Map();
            const getVertexKey = (v) => `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
            
            baseVertices.forEach(v => {
                vertexMap.set(getVertexKey(v), { v: v.clone(), isPPT: true });
            });

            this.allFaces.forEach(tri => {
                tri.forEach((v, i) => {
                    const key = getVertexKey(v);
                    if (!vertexMap.has(key)) {
                        vertexMap.set(key, { v: v.clone(), isPPT: false });
                    }
                    tri[i] = vertexMap.get(key).v;
                });
            });

            const ppts = Array.from(vertexMap.values()).filter(o => o.isPPT).map(o => o.v);
            const connections = new Map();
            
            this.allFaces.forEach(tri => {
                for (let i = 0; i < 3; i++) {
                    const a = tri[i];
                    const b = tri[(i+1)%3];
                    const keyA = getVertexKey(a);
                    const keyB = getVertexKey(b);
                    if (!connections.has(keyA)) connections.set(keyA, new Set());
                    if (!connections.has(keyB)) connections.set(keyB, new Set());
                    connections.get(keyA).add(b);
                    connections.get(keyB).add(a);
                }
            });

            Array.from(vertexMap.values()).forEach(obj => {
                if (obj.isPPT) return;
                const v = obj.v;
                const key = getVertexKey(v);
                const connected = Array.from(connections.get(key));
                const connectedPPT = connected.find(n => ppts.some(p => getVertexKey(p) === getVertexKey(n)));
                
                if (connectedPPT) {
                    const E = connectedPPT;
                    const S = v;
                    const mr = MAGIC_FIX_RATIO;
                    const newPos = E.clone().multiplyScalar(1 - mr).add(S.clone().multiplyScalar(mr)).normalize().multiplyScalar(radius);
                    S.copy(newPos);
                }
            });
        }

        // Apply Fullerene transform if selected
        if (this.structure === 'fullerene') {
            this.applyFullereneTransform(radius);
        }

        // Filter triangles (keep upper hemisphere / 5/8 dome for odd frequencies)
        // Even frequencies have a flat equator at Y=0.
        // Odd frequencies have a zig-zag equator, extending below Y=0 (creating a 5/8 dome).
        let cutoff = -0.01 * radius;
        if (this.spherePortion === '1/1') {
            cutoff = -Infinity;
        } else if (this.baseShape === 'icosahedron' && this.frequency % 2 !== 0) {
            cutoff = this.frequency === 1 ? -0.5 * radius : -0.25 * radius;
        }

        this.allFaces = this.allFaces.filter(tri => {
            let minY = Infinity;
            tri.forEach(v => {
                if (v.y < minY) minY = v.y;
            });
            return minY >= cutoff;
        });

        // Set the floor to exactly Y=0 for visual alignment
        // The lowest Y coordinate after the cut should be set to 0.
        let lowestY = Infinity;
        this.allFaces.forEach(tri => {
            tri.forEach(v => {
                if (v.y < lowestY) lowestY = v.y;
            });
        });
        
        // Offset all points so the base sits exactly on the floor (Y=0)
        // Use a Set to ensure we only offset each unique vertex object once, preventing multiple-subtraction warping.
        const uniqueVertices = new Set();
        this.allFaces.forEach(tri => {
            tri.forEach(v => {
                uniqueVertices.add(v);
            });
        });
        uniqueVertices.forEach(v => {
            v.y -= lowestY;
        });

        // Calculate Y range for proper height level calculation
        this.yRange = this.calculateYRange();
        
        // Calculate strut types
        this.calculateStrutTypes();
        
        // Organize triangles for enhanced assembly mode
        this.organizeTrianglesByType();
        
        // Create dome geometry
        this.createDomeGeometry();
    }
    
    applyFullereneTransform(radius) {
        // Acidome's "Fullerene" mode is actually a Truncation operation!
        const getVertexKey = (v) => `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`;
        const getEdgeKey = (v1, v2) => {
            const k1 = getVertexKey(v1);
            const k2 = getVertexKey(v2);
            return k1 < k2 ? `${k1}-${k2}` : `${k2}-${k1}`;
        };

        // 1. Generate truncated vertices on every edge
        const edgeMap = new Map(); // edgeKey -> { v1, v2, pt1, pt2 }
        this.allFaces.forEach(face => {
            for (let i = 0; i < face.length; i++) {
                const v1 = face[i];
                const v2 = face[(i+1)%face.length];
                const key = getEdgeKey(v1, v2);
                if (!edgeMap.has(key)) {
                    // Create points 1/3 and 2/3 along the edge, normalized
                    const pt1 = v1.clone().lerp(v2, 1/3).normalize().multiplyScalar(radius);
                    const pt2 = v1.clone().lerp(v2, 2/3).normalize().multiplyScalar(radius);
                    edgeMap.set(key, { v1, v2, pt1, pt2 });
                }
            }
        });

        const newFaces = [];

        // 2. Create Hexagon faces for each original triangle
        this.allFaces.forEach(face => {
            if (face.length !== 3) return;
            const A = face[0], B = face[1], C = face[2];
            const getEdgePoints = (start, end) => {
                const edge = edgeMap.get(getEdgeKey(start, end));
                if (getVertexKey(edge.v1) === getVertexKey(start)) {
                    return { close: edge.pt1, far: edge.pt2 };
                } else {
                    return { close: edge.pt2, far: edge.pt1 };
                }
            };
            
            const edgeAB = getEdgePoints(A, B);
            const edgeBC = getEdgePoints(B, C);
            const edgeCA = getEdgePoints(C, A);
            
            // Hexagon: A_B, B_A, B_C, C_B, C_A, A_C
            newFaces.push([
                edgeAB.close, edgeAB.far,
                edgeBC.close, edgeBC.far,
                edgeCA.close, edgeCA.far
            ]);
        });

        // 3. Create Polygon faces for each original vertex
        const vertexEdges = new Map(); // vertexKey -> { V, edges: [{otherV, pt}] }
        edgeMap.forEach(edge => {
            const k1 = getVertexKey(edge.v1);
            if (!vertexEdges.has(k1)) vertexEdges.set(k1, { V: edge.v1, edges: [] });
            vertexEdges.get(k1).edges.push({ otherV: edge.v2, pt: edge.pt1 });
            
            const k2 = getVertexKey(edge.v2);
            if (!vertexEdges.has(k2)) vertexEdges.set(k2, { V: edge.v2, edges: [] });
            vertexEdges.get(k2).edges.push({ otherV: edge.v1, pt: edge.pt2 });
        });
        
        vertexEdges.forEach(vData => {
            const V = vData.V;
            const edges = vData.edges;
            if (edges.length < 3) return;
            
            const N = V.clone().normalize();
            const temp = Math.abs(N.x) < 0.9 ? new THREE.Vector3(1,0,0) : new THREE.Vector3(0,1,0);
            const U = new THREE.Vector3().crossVectors(N, temp).normalize();
            const V_basis = new THREE.Vector3().crossVectors(N, U).normalize();

            edges.sort((a, b) => {
                const cA = a.otherV.clone().sub(V);
                const cB = b.otherV.clone().sub(V);
                const angleA = Math.atan2(cA.dot(V_basis), cA.dot(U));
                const angleB = Math.atan2(cB.dot(V_basis), cB.dot(U));
                return angleA - angleB;
            });
            
            const newFace = edges.map(e => e.pt.clone());
            // Make sure normal points outward
            const center = new THREE.Vector3();
            newFace.forEach(v => center.add(v));
            center.multiplyScalar(1 / newFace.length);
            const vA = new THREE.Vector3().subVectors(newFace[1], newFace[0]);
            const vB = new THREE.Vector3().subVectors(newFace[2], newFace[0]);
            if (new THREE.Vector3().crossVectors(vA, vB).dot(center) < 0) {
                newFace.reverse();
            }

            newFaces.push(newFace);
        });

        this.allFaces = newFaces;
    }

    subdivideTriangle(v1, v2, v3, frequency, radius) {
        if (frequency === 1) {
            return [[v1.clone(), v2.clone(), v3.clone()]];
        }

        const triangles = [];
        const getPoint = (c1, c2) => {
            const c3 = frequency - c1 - c2;
            const p = new THREE.Vector3(0,0,0);
            p.addScaledVector(v1, c1/frequency);
            p.addScaledVector(v2, c2/frequency);
            p.addScaledVector(v3, c3/frequency);
            return p.normalize().multiplyScalar(radius);
        };
        
        for (let c1 = 0; c1 < frequency; c1++) {
            for (let c2 = 0; c2 < frequency - c1; c2++) {
                // Upright triangle
                triangles.push([
                    getPoint(c1 + 1, c2),
                    getPoint(c1, c2 + 1),
                    getPoint(c1, c2)
                ]);
                
                // Inverted triangle
                if (c1 + c2 < frequency - 1) {
                    triangles.push([
                        getPoint(c1 + 1, c2),
                        getPoint(c1 + 1, c2 + 1),
                        getPoint(c1, c2 + 1)
                    ]);
                }
            }
        }
        return triangles;
    }
    
    calculateStrutTypes() {
        const strutMap = new Map(); // Key: length_miter_bevel
        this.edgeToType = new Map();
        
        // Map to find adjacent faces for dihedral (bevel) calculation
        const edgeToFaces = new Map();
        const faceNormals = this.allFaces.map(tri => {
            const vA = new THREE.Vector3().subVectors(tri[1], tri[0]);
            const vB = new THREE.Vector3().subVectors(tri[2], tri[0]);
            let normal = new THREE.Vector3().crossVectors(vA, vB).normalize();
            if (normal.dot(tri[0]) < 0) normal.negate();
            return normal;
        });

        this.allFaces.forEach((tri, fIdx) => {
            for (let i = 0; i < tri.length; i++) {
                const v1 = tri[i];
                const v2 = tri[(i + 1) % tri.length];
                const key = this.getStrutKey(v1, v2);
                if (!edgeToFaces.has(key)) edgeToFaces.set(key, []);
                edgeToFaces.get(key).push(fIdx);
            }
        });

        const processedEdges = new Set();
        this.allFaces.forEach((tri, fIdx) => {
            const v = tri.map(vert => vert.clone());
            const sides = [];
            const angles = [];
            for (let i = 0; i < tri.length; i++) {
                sides.push(v[i].distanceTo(v[(i + 1) % tri.length]));
            }
            for (let i = 0; i < tri.length; i++) {
                const prev = v[(i - 1 + tri.length) % tri.length];
                const curr = v[i];
                const next = v[(i + 1) % tri.length];
                const v1 = new THREE.Vector3().subVectors(prev, curr).normalize();
                const v2 = new THREE.Vector3().subVectors(next, curr).normalize();
                angles.push(Math.acos(v1.dot(v2)));
            }

            for (let i = 0; i < tri.length; i++) {
                const v1 = tri[i], v2 = tri[(i + 1) % tri.length];
                const edgeKey = this.getStrutKey(v1, v2);
                
                // Deduplicate edges so each strut is only counted once (for single layer lattices).
                // For independent triangles, we want to count every strut (which doubles shared edges).
                if (!this.independentTriangles && processedEdges.has(edgeKey)) continue;
                processedEdges.add(edgeKey);

                const adjacentFaces = edgeToFaces.get(edgeKey);
                
                const isBase = v1.y < 0.01 && v2.y < 0.01;
                const isStand = (v1.y < 0.01 && v2.y >= 0.01) || (v2.y < 0.01 && v1.y >= 0.01);

                let bevel = 0;
                if (this.flatBase && isBase) {
                    // Base struts usually have a 0 bevel or a specific angle for the foundation
                    bevel = 0;
                } else if (adjacentFaces.length === 2) {
                    const n1 = faceNormals[adjacentFaces[0]];
                    const n2 = faceNormals[adjacentFaces[1]];
                    bevel = (n1.angleTo(n2) * 180 / Math.PI) / 2;
                }

                const angleAtVertex = angles[i] * 180 / Math.PI;
                const miter = this.jointStyle === 'double' ? Math.abs(90 - (angleAtVertex / 2)) : Math.abs(90 - angleAtVertex);
                const length = sides[i] * 1000;
                
                const rLen = Math.round(length);
                const rBevel = Math.round(bevel * 10) / 10;
                
                let miter1 = miter;
                let miter2 = miter;
                if (this.independentTriangles) {
                    const angleAtNextVertex = angles[(i+1) % tri.length] * 180 / Math.PI;
                    miter2 = Math.abs(90 - angleAtNextVertex);
                }
                
                // Order miters so A->B is equivalent to B->A for identical boards
                const minMiter = Math.round(Math.min(miter1, miter2) * 10) / 10;
                const maxMiter = Math.round(Math.max(miter1, miter2) * 10) / 10;
                
                // Group by length, bevel, and both miters to perfectly distinguish asymmetric cuts
                const key = `${rLen}-${rBevel}-${minMiter}-${maxMiter}`;

                if (!strutMap.has(key)) {
                    strutMap.set(key, { length, miter, bevel, miter1: minMiter, miter2: maxMiter, count: 0, baseCount: 0, standCount: 0 });
                }
                const entry = strutMap.get(key);
                entry.count++;
                
                // Store by face AND edge index to perfectly map independent struts
                const faceEdgeKey = `${fIdx}-${i}`;
                this.edgeToType.set(faceEdgeKey, entry);
                
                // Keep the old edgeKey mapping as fallback for single-lattice
                if (!this.independentTriangles) {
                    this.edgeToType.set(edgeKey, entry);
                }

                if (isBase) {
                    entry.baseCount++;
                } else if (isStand) {
                    entry.standCount++;
                }
            }
        });

        // Convert Map to sorted array of families
        const families = Array.from(strutMap.values()).sort((a, b) => b.length - a.length);
        
        this.strutTypes = families.map((f, idx) => {
            const typeLetter = String.fromCharCode(65 + idx);
            f.type = typeLetter; // Save type back to entry for edgeToType reference
            
            // High-contrast, vibrant palette specifically designed for dark backgrounds
            const palette = [
                '#FF1493', // Deep Pink
                '#00FF00', // Lime
                '#00FFFF', // Cyan
                '#FFD700', // Gold
                '#FF4500', // Orange Red
                '#8A2BE2', // Blue Violet
                '#FF00FF', // Magenta
                '#1E90FF', // Dodger Blue
                '#32CD32', // Lime Green
                '#FF8C00'  // Dark Orange
            ];
            
            return {
                type: typeLetter,
                length: f.length,
                count: f.count,
                color: palette[idx % palette.length],
                miterAngle: f.miter,
                miter1: f.miter1,
                miter2: f.miter2,
                bevelAngle: f.bevel,
                baseCount: f.baseCount,
                standCount: f.standCount
            };
        });
    }
    
    organizeTrianglesByType() {
        // Clear previous organization
        this.triangleTypes.clear();
        this.assemblyInventory.clear();
        this.groundTriangles = [];
        this.assemblyLayers = [];
        this.assemblySegments = [];
        
        // Analyze each triangle's strut composition
        this.allFaces.forEach((tri, idx) => {
            const strutComposition = this.analyzeTriangleStrutComposition(tri, idx);
            const triangleTypeKey = strutComposition.typeSignature;
            const heightLevel = this.getTriangleHeightLevel(tri);
            const azimuth = this.getTriangleAzimuth(tri);
            const isDoor = heightLevel === 0 && Math.abs(azimuth - this.doorAzimuth) < this.doorWidth;
            
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
            const triangleData = {
                index: idx,
                triangle: tri,
                heightLevel: heightLevel,
                azimuth: azimuth,
                isDoor: isDoor,
                strutComposition: strutComposition
            };
            
            triangleType.triangles.push(triangleData);
            triangleType.count++;
            
            // Organize by height for ground-up assembly
            if (heightLevel === 0) {
                this.groundTriangles.push(triangleData);
            }
        });
        
        // Create assembly layers and segments
        this.createAssemblyLayers();
        this.createAssemblySegments();
        
        // Initialize assembly inventory
        this.initializeAssemblyInventory();
    }

    getTriangleAzimuth(tri) {
        let x = 0, z = 0;
        tri.forEach(v => { x += v.x; z += v.z; });
        const center = new THREE.Vector3(x / tri.length, 0, z / tri.length);
        // atan2(x, z) gives angle from Z axis. 0 is Front (+Z).
        return Math.atan2(center.x, center.z);
    }
    
    analyzeTriangleStrutComposition(tri, triangleIndex) {
        const sides = [];
        for (let i = 0; i < tri.length; i++) {
            sides.push(tri[i].distanceTo(tri[(i + 1) % tri.length]) * 1000);
        }
        const strutTypes = sides.map((length, i) => {
            const faceEdgeKey = `${triangleIndex}-${i}`;
            const v1 = tri[i];
            const v2 = tri[(i+1)%tri.length];
            const edgeKey = this.getStrutKey(v1, v2);
            
            // Try faceEdgeKey first (perfect mapping for independent panels), fallback to edgeKey (single lattice)
            const typeEntry = this.edgeToType.get(faceEdgeKey) || this.edgeToType.get(edgeKey);
            return typeEntry ? typeEntry.type : 'A';
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
        let avgY = 0;
        tri.forEach(v => avgY += v.y);
        avgY /= tri.length;
        
        // Find the actual Y range of all triangles for proper normalization
        if (!this.yRange) {
            this.yRange = this.calculateYRange();
        }
        
        const normalizedHeight = (avgY - this.yRange.min) / (this.yRange.max - this.yRange.min);
        
        // Divide into 5 levels for assembly layers
        if (normalizedHeight < 0.2) return 0; // Ground level
        if (normalizedHeight < 0.4) return 1; // First ring
        if (normalizedHeight < 0.6) return 2; // Second ring
        if (normalizedHeight < 0.8) return 3; // Third ring
        return 4; // Top level
    }
    
    calculateYRange() {
        if (!this.allFaces || this.allFaces.length === 0) {
            return { min: -0.5, max: 3.5 }; // Fallback
        }
        
        let minY = Infinity;
        let maxY = -Infinity;
        
        this.allFaces.forEach(tri => {
            tri.forEach(vertex => {
                minY = Math.min(minY, vertex.y);
                maxY = Math.max(maxY, vertex.y);
            });
        });
        
        return { min: minY, max: maxY };
    }
    
    generateTriangleTypeColor(typeSignature) {
        // Generate consistent colors based on strut type signature matching brand colors
        // High-contrast, vibrant palette specifically designed for dark backgrounds
        const colors = [
            '#FF1493', // Deep Pink
            '#00FF00', // Lime
            '#00FFFF', // Cyan
            '#FFD700', // Gold
            '#FF4500', // Orange Red
            '#8A2BE2', // Blue Violet
            '#FF00FF', // Magenta
            '#1E90FF', // Dodger Blue
            '#32CD32', // Lime Green
            '#FF8C00'  // Dark Orange
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

    createAssemblySegments() {
        // Organize triangles into more granular segments: Bottom-Up, Front-to-Back, Door Last
        const normalTriangles = [];
        const doorTriangles = [];

        this.triangleTypes.forEach(typeData => {
            typeData.triangles.forEach(triData => {
                if (triData.isDoor) {
                    doorTriangles.push(triData);
                } else {
                    normalTriangles.push(triData);
                }
            });
        });

        // Sort normal triangles: height level (bottom up) -> azimuth (front to back)
        // For front-to-back, we want to start from the "back" (-PI) and go to "front" (0) 
        // OR start from 0 and go circular. 
        // Let's go circular from door position + width to door position - width.
        normalTriangles.sort((a, b) => {
            if (a.heightLevel !== b.heightLevel) {
                return a.heightLevel - b.heightLevel;
            }
            // Sort by azimuth, shifted so door is at the end of the circular loop
            const adjA = (a.azimuth - this.doorAzimuth + Math.PI) % (2 * Math.PI);
            const adjB = (b.azimuth - this.doorAzimuth + Math.PI) % (2 * Math.PI);
            return adjA - adjB;
        });

        // Group into segments (e.g., each level is divided into 4 segments)
        const segmentsPerLevel = 4;
        for (let level = 0; level <= 4; level++) {
            const levelTriangles = normalTriangles.filter(t => t.heightLevel === level);
            const chunkSize = Math.ceil(levelTriangles.length / segmentsPerLevel);
            
            for (let i = 0; i < segmentsPerLevel; i++) {
                const chunk = levelTriangles.slice(i * chunkSize, (i + 1) * chunkSize);
                if (chunk.length > 0) {
                    this.assemblySegments.push({
                        name: `${this.getLayerName(level)} - Segment ${i + 1}`,
                        triangles: chunk.map(t => t.triangle),
                        level: level
                    });
                }
            }
        }

        // Add door triangles as the last segment
        if (doorTriangles.length > 0) {
            this.assemblySegments.push({
                name: 'Final Step: The Door 🚪',
                triangles: doorTriangles.map(t => t.triangle),
                level: 0
            });
        }
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
                return this.allFaces.slice(0, this.assemblyStep);
        }
    }
    
    getTrianglesForStrutCollection() {
        // Show organized stacks of triangle types for strut collection
        if (this.selectedTriangleType) {
            const typeData = this.triangleTypes.get(this.selectedTriangleType);
            return typeData ? typeData.triangles.map(t => t.triangle) : [];
        }
        
        // Show progressive examples of each triangle type, building up step by step
        const exampleTriangles = [];
        let currentStep = 0;
        
        this.triangleTypes.forEach((typeData, typeKey) => {
            if (currentStep <= this.assemblyStep && typeData.triangles.length > 0) {
                // Show multiple examples of each type to demonstrate strut collection
                const examplesPerType = Math.min(3, typeData.triangles.length);
                const trianglesToShow = Math.min(examplesPerType, Math.max(1, this.assemblyStep - currentStep + 1));
                
                for (let i = 0; i < trianglesToShow; i++) {
                    if (typeData.triangles[i]) {
                        exampleTriangles.push(typeData.triangles[i].triangle);
                    }
                }
                currentStep += examplesPerType;
            }
        });
        
        return exampleTriangles;
    }
    
    getTrianglesForTriangleAssembly() {
        // Show triangles being assembled triangle by triangle from ground up
        const assembledTriangles = [];
        
        // Start with ground triangles and build up layer by layer
        const allFacesByHeight = [];
        
        // Collect all triangles with their height levels
        this.triangleTypes.forEach((typeData, typeKey) => {
            typeData.triangles.forEach(triangleData => {
                allFacesByHeight.push({
                    triangle: triangleData.triangle,
                    heightLevel: triangleData.heightLevel,
                    azimuth: triangleData.azimuth,
                    isDoor: triangleData.isDoor,
                    type: typeKey
                });
            });
        });
        
        // Sort by height level (ground first), then door last, then azimuth
        allFacesByHeight.sort((a, b) => {
            if (a.heightLevel !== b.heightLevel) {
                return a.heightLevel - b.heightLevel;
            }
            if (a.isDoor !== b.isDoor) {
                return a.isDoor ? 1 : -1;
            }
            const adjA = (a.azimuth - this.doorAzimuth + Math.PI) % (2 * Math.PI);
            const adjB = (b.azimuth - this.doorAzimuth + Math.PI) % (2 * Math.PI);
            return adjA - adjB;
        });
        
        // Show triangles up to current assembly step
        const trianglesToShow = Math.min(this.assemblyStep + 1, allFacesByHeight.length);
        for (let i = 0; i < trianglesToShow; i++) {
            assembledTriangles.push(allFacesByHeight[i].triangle);
        }
        
        return assembledTriangles;
    }
    
    getTrianglesForIntegration() {
        // Show segment-by-segment construction
        const integratedTriangles = [];
        
        for (let segmentIndex = 0; segmentIndex <= this.assemblyStep && segmentIndex < this.assemblySegments.length; segmentIndex++) {
            const segment = this.assemblySegments[segmentIndex];
            integratedTriangles.push(...segment.triangles);
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
        if (tri1.length !== tri2.length) return false;
        // Check if two triangles are the same (within tolerance)
        const tolerance = 0.001;
        for (let i = 0; i < tri1.length; i++) {
            if (Math.abs(tri1[i].x - tri2[i].x) > tolerance ||
                Math.abs(tri1[i].y - tri2[i].y) > tolerance ||
                Math.abs(tri1[i].z - tri2[i].z) > tolerance) {
                return false;
            }
        }
        return true;
    }
    
    createDomeGeometry() {
        if (this.domeGroup && this.scene) {
            this.scene.remove(this.domeGroup);
            // Dispose of materials and geometries to prevent memory leaks
            this.domeGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        
        this.domeGroup = new THREE.Group();
        this.strutMeshes = new Map(); // Track strut meshes to avoid duplicates
        this.jointMeshes = new Map(); // Track joint meshes
        this.highlightedStrutMoved = false;
        
        // In assembly mode, show triangles based on phase and step
        const trianglesToShow = this.assemblyMode ? 
            this.getTrianglesToShowInAssembly() : 
            this.allFaces;
        
        const renderedEdges = new Set();
        
        trianglesToShow.forEach((tri, displayIdx) => {
            // Find the original index of this triangle in allFaces
            const originalIdx = this.allFaces.findIndex(originalTri => 
                this.trianglesEqual(tri, originalTri)
            );
            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            for (let i = 1; i < tri.length - 1; i++) {
                vertices.push(
                    tri[0].x, tri[0].y, tri[0].z,
                    tri[i].x, tri[i].y, tri[i].z,
                    tri[i+1].x, tri[i+1].y, tri[i+1].z
                );
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            geometry.computeVertexNormals();

            const isHighlighted = this.selectedTriangle?.triangleIndex === originalIdx;
            const triangleTypeInfo = this.getTriangleTypeInfo(tri);
            const isSelectedType = this.selectedTriangleType === triangleTypeInfo?.signature;
            
            let color = 0xffffff;
            let opacity = 0.3;
            
            if (isHighlighted) {
                color = 0x38bdf8; // Primary blue for selected triangle
                opacity = 0.9;
            } else if (this.assemblyMode && triangleTypeInfo) {
                // Color by triangle type in assembly mode
                color = new THREE.Color(triangleTypeInfo.color).getHex();
                opacity = isSelectedType ? 0.8 : 0.5;
            } else if (this.assemblyMode) {
                color = 0x334155; // Slate for newly added (fallback)
                opacity = 0.6;
            }
            
            const material = new THREE.MeshStandardMaterial({
                color: color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.0, // Make completely transparent so struts are fully visible
                depthWrite: false, // Prevent it from blocking struts
                metalness: 0.1,
                roughness: 0.5
            });

            // Bright highlight for 3 seconds if newly selected
            if (isSelectedType && this.highlightTriangleTypeUntil && Date.now() < this.highlightTriangleTypeUntil) {
                material.opacity = 0.5;
                material.emissive.setHex(color);
                material.emissiveIntensity = 0.8;
            }

            const mesh = new THREE.Mesh(geometry, material);
            
            // Do not add borders by default so the wooden struts stand out
            if (this.assemblyMode || (isSelectedType && this.highlightTriangleTypeUntil && Date.now() < this.highlightTriangleTypeUntil)) {
                this.addTriangleBorders(mesh, tri, triangleTypeInfo);
            }
            
            // Calculate strut info
            const sides = [];
            const angles = [];
            for (let i = 0; i < tri.length; i++) {
                sides.push(tri[i].distanceTo(tri[(i + 1) % tri.length]) * 1000);
            }
            for (let i = 0; i < tri.length; i++) {
                const prev = tri[(i - 1 + tri.length) % tri.length];
                const curr = tri[i];
                const next = tri[(i + 1) % tri.length];
                const v1 = new THREE.Vector3().subVectors(prev, curr).normalize();
                const v2 = new THREE.Vector3().subVectors(next, curr).normalize();
                
                if (this.independentTriangles) {
                    angles.push(Math.acos(v1.dot(v2)));
                } else {
                    const normal = curr.clone().normalize();
                    const v1_proj = v1.clone().projectOnPlane(normal).normalize();
                    const v2_proj = v2.clone().projectOnPlane(normal).normalize();
                    angles.push(Math.acos(Math.max(-1, Math.min(1, v1_proj.dot(v2_proj)))));
                }
            }
            
            const strutInfoRaw = [];
            for (let i = 0; i < tri.length; i++) {
                strutInfoRaw.push({ length: sides[i], angleStart: angles[i], angleEnd: angles[(i+1)%tri.length], vertices: [tri[i], tri[(i+1)%tri.length]] });
            }

            const strutInfo = strutInfoRaw.map((strut, i) => {
                const faceEdgeKey = `${originalIdx}-${i}`;
                const edgeKey = this.getStrutKey(strut.vertices[0], strut.vertices[1]);
                
                const typeEntry = this.edgeToType.get(faceEdgeKey) || this.edgeToType.get(edgeKey);
                const typeData = typeEntry ? this.strutTypes.find(t => t.type === typeEntry.type) : null;
                const isBaseStrut = strut.vertices[0].y < 0.01 && strut.vertices[1].y < 0.01;
                
                return {
                    length: strut.length,
                    type: typeData?.type || 'A',
                    color: typeData?.color || '#000000',
                    miterAngleStart: this.jointStyle === 'double' ? Math.abs(90 - ((strut.angleStart * 180 / Math.PI) / 2)) : Math.abs(90 - (strut.angleStart * 180 / Math.PI)),
                    miterAngleEnd: this.jointStyle === 'double' ? Math.abs(90 - ((strut.angleEnd * 180 / Math.PI) / 2)) : Math.abs(90 - (strut.angleEnd * 180 / Math.PI)),
                    bevelAngle: typeData?.bevelAngle || 0,
                    vertices: strut.vertices,
                    angleStart: strut.angleStart,
                    angleEnd: strut.angleEnd
                };
            });

            mesh.userData = { 
                triangleIndex: originalIdx, 
                vertices: tri,
                center: (() => {
                    const c = new THREE.Vector3();
                    tri.forEach(v => c.add(v));
                    return c.multiplyScalar(1 / tri.length);
                })(),
                struts: strutInfo
            };
            this.domeGroup.add(mesh);

            // Create real 3D struts for each triangle face
            strutInfo.forEach((strut, strutIdx) => {
                const edgeKey = this.getStrutKey(strut.vertices[0], strut.vertices[1]);
                // For independent triangles (panelized), we DO NOT skip already rendered edges!
                // We want double struts layered side-by-side.
                if (!this.independentTriangles && renderedEdges.has(edgeKey)) return;
                renderedEdges.add(edgeKey);

                const isBase = strut.vertices[0].y < 0.01 && strut.vertices[1].y < 0.01;
                // The third vertex used to define the face normal (inward)
                const c = new THREE.Vector3();
                tri.forEach(v => c.add(v));
                const thirdVertex = c.multiplyScalar(1 / tri.length);
                const strutMesh = this.createRealStrut(strut, thirdVertex, isBase);
                
                // Track strut mesh per face
                const strutKey = `${originalIdx}-${strutIdx}`;
                this.strutMeshes.set(strutKey, strutMesh);
                
                if (this.selectedStrutType && strut.type === this.selectedStrutType.type) {
                    const isFlashing = this.highlightStrutTypeUntil && Date.now() < this.highlightStrutTypeUntil;
                    strutMesh.material.emissive.setHex(new THREE.Color(strut.color).getHex());
                    strutMesh.material.emissiveIntensity = isFlashing ? 0.8 : 0.3;
                    
                    if (isFlashing) {
                        strutMesh.material.opacity = 0.9;
                        strutMesh.material.transparent = true;
                    }

                    if (!this.highlightedStrutMoved) {
                        // Move this specific strut out to inspect it
                        const centerOut = strutMesh.position.clone().setY(0).normalize();
                        strutMesh.position.add(centerOut.multiplyScalar(0.5));
                        strutMesh.position.y += 0.2;
                        this.highlightedStrutMoved = true;
                    }
                }
                
                this.domeGroup.add(strutMesh);
            });
        });

        // Create joints at all vertices (disabled to show clean good karma intersections)
        // this.createJoints();

        this.scene.add(this.domeGroup);
        if (this.jointStyle === 'karma') {
            this.validateJointOverlaps();
        }

    }
    
    getStrutKey(v1, v2) {
        // Create a unique key for a strut based on its endpoints
        const key1 = `${v1.x.toFixed(3)},${v1.y.toFixed(3)},${v1.z.toFixed(3)}`;
        const key2 = `${v2.x.toFixed(3)},${v2.y.toFixed(3)},${v2.z.toFixed(3)}`;
        return key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
    }
    
    createRealStrut(strutInfo, thirdVertex, isBase = false) {
        const v1 = strutInfo.vertices[0]; // The butt end
        const v2 = strutInfo.vertices[1]; // The lap end
        const v3 = thirdVertex;
        const length = v1.distanceTo(v2);
        
        // Calculate basis vectors for the strut orientation
        const U = v2.clone().sub(v1).normalize();
        const N = v2.clone().sub(v1).cross(thirdVertex.clone().sub(v1)).normalize();
        
        // X_basis: points outwards in the plane of the face (perpendicular to edge)
        const X_basis = U.clone().cross(N).normalize();
        const Y_basis = U;
        const Z_basis = N;
        
        const width = this.strutWidth / 1000;
        const height = this.strutHeight / 1000;
        
        let boardLength = length;
        let shorteningV1 = 0;
        let shorteningV2 = 0;
        
        const miterAngleStartRad = (strutInfo.miterAngleStart || 0) * Math.PI / 180;
        const miterAngleEndRad = (strutInfo.miterAngleEnd || 0) * Math.PI / 180;
        const bevelAngleRad = (strutInfo.bevelAngle || 0) * Math.PI / 180;
        
        // True projected width on the bisecting plane (or face plane)
        const apparentWidth = width * Math.cos(bevelAngleRad) + height * Math.abs(Math.sin(bevelAngleRad));
        
        if (this.jointStyle === 'karma') {
            if (this.independentTriangles) {
                // Good Karma Panelized (Independent Triangles):
                // Forms a 2D pinwheel on the triangle face. v1 is LAP, v2 is BUTT.
                const alphaStart = strutInfo.angleStart;
                const alphaEnd = strutInfo.angleEnd;
                
                // Lap end (v1): Outer corner exactly touches the vertex. 
                shorteningV1 = (apparentWidth / 2) * Math.tan(miterAngleStartRad);
                
                // Butt end (v2): Outer corner touches the inner corner of the adjacent Lap strut.
                shorteningV2 = (apparentWidth / Math.sin(alphaEnd)) + (apparentWidth / 2) * Math.tan(miterAngleEndRad);
                
                // Add clearance to prevent raycaster false positives due to simple miter geometric overlap
                shorteningV1 += 0.002;
                shorteningV2 += 0.002;
            } else {
                // True single-layer GoodKarma swirl (hubless)
                // Left edge touches V2, Right edge touches V1
                shorteningV1 = -(apparentWidth / 2) * Math.tan(miterAngleStartRad);
                shorteningV2 = (apparentWidth / 2) * Math.tan(miterAngleEndRad);
            }
        }
        
        boardLength = length - shorteningV1 - shorteningV2;
        
        // For independent triangles, use negative miter to make the outside edge longer.
        // For single-lattice double, use positive miter to make the center the longest point.
        // miter1 is applied to +z (which is v2), miter2 is applied to -z (which is v1)
        // Therefore, lapMiter (for v1) must be passed as miter2, and buttMiter (for v2) as miter1.
        let lapMiter = this.independentTriangles ? -miterAngleStartRad : miterAngleStartRad;
        let buttMiter = this.independentTriangles ? miterAngleEndRad : miterAngleEndRad;
        
        let strutGeometry = this.createStrutGeometryForDome(boardLength, buttMiter, lapMiter, bevelAngleRad, isBase);
        
        let color = strutInfo.color;
        let metalness = 0.1; // Reduced metalness to avoid washed-out white highlights
        let roughness = 0.7; // Matte finish to make the vibrant colors pop
        let emissive = 0x000000;
        
        // Boost contrast for base struts so they visually ground the dome
        if (isBase) {
            metalness = 0.0;
            roughness = 0.9;
            color = new THREE.Color(strutInfo.color).lerp(new THREE.Color(0xffffff), 0.2);
        }
        
        const strutMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness: metalness,
            roughness: roughness,
            emissive: emissive
        });
        
        const strutMesh = new THREE.Mesh(strutGeometry, strutMaterial);
        
        // Shift along the edge to center the board between the two shortenings
        // shiftAlongEdge shifts the midpoint. 
        // If we want +z (v2) to have gap S2, and -z (v1) to have gap S1:
        // The +z end is at midPoint + boardLength/2.
        // We want it to be at v2 - S2 = v1 + L - S2.
        // midPoint = v1 + L - S2 - (L - S1 - S2)/2 = v1 + L/2 + (S1 - S2)/2.
        // So shift from center (v1 + L/2) is (S1 - S2)/2.
        const shiftMag = (shorteningV1 - shorteningV2) / 2;
        const shiftAlongEdge = U.clone().multiplyScalar(shiftMag);
        
        // For independent triangles and true single-layer GoodKarma, shift inwards so the outer face is on the mathematical edge
        const shiftInwards = (this.independentTriangles || this.jointStyle === 'karma') ? X_basis.clone().multiplyScalar(-width / 2) : new THREE.Vector3(0, 0, 0);
        
        const midPoint = v1.clone().add(v2).multiplyScalar(0.5).add(shiftAlongEdge).add(shiftInwards);
        
        if (this.explodeJoints) {
            midPoint.multiplyScalar(1.08); // Radially scale position outward by 8% to detach joints
        }
        
        strutMesh.position.copy(midPoint);
        
        // Create rotation matrix to align local axes (X, Y, Z) with (X_basis, Y_basis, Z_basis)
        const matrix = new THREE.Matrix4();
        matrix.makeBasis(X_basis, Y_basis, Z_basis);
        strutMesh.rotation.setFromRotationMatrix(matrix);
        
        // Rotate around local Y-axis (length) by bevel angle to meet neighboring board flush
        strutMesh.rotateY(bevelAngleRad);
        
        // Store strut info for interaction
        strutMesh.userData = {
            isStrut: true,
            strutInfo: strutInfo,
            vertices: [v1, v2],
            length: length,
            extendedLength: boardLength,
            midPoint: midPoint,
            direction: v2.clone().sub(v1),
            bevelApplied: bevelAngleRad,
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
        let borderColor = 0x334155; // Default slate border
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


    createStrutGeometryForDome(boardLength, miterAngle1Rad, miterAngle2Rad, bevelAngleRad, isBase = false) {
        // Create rectangular strut geometry matching actual dimensions (Good Karma hubless style)
        
        const width = this.strutWidth / 1000; // Convert mm to meters
        const height = this.strutHeight / 1000; // Convert mm to meters
        
        const wSegs = this.jointStyle === 'double' ? 2 : 1;
        const geometry = new THREE.BoxGeometry(width, boardLength, height, wSegs, 1, 1);
        
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        // Apply flat compound cuts to vertices
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            
            if (this.jointStyle === 'double' && !this.independentTriangles) {
                if (vertex.y > 0) {
                    // Top end: Double miter to form a point
                    const newY = boardLength / 2 - Math.abs(vertex.x) * Math.tan(miterAngle2Rad) + vertex.z * Math.tan(bevelAngleRad);
                    positions.setY(i, newY);
                } else {
                    // Bottom end: Double miter to form a point
                    const newY = -boardLength / 2 + Math.abs(vertex.x) * Math.tan(miterAngle1Rad) - vertex.z * Math.tan(bevelAngleRad);
                    positions.setY(i, newY);
                }
            } else {
                if (vertex.y > 0) {
                    // Top end: Single miter cut
                    const newY = boardLength / 2 - vertex.x * Math.tan(miterAngle2Rad) + vertex.z * Math.tan(bevelAngleRad);
                    positions.setY(i, newY);
                } else {
                    // Bottom end: Single miter cut
                    const newY = -boardLength / 2 + vertex.x * Math.tan(miterAngle1Rad) - vertex.z * Math.tan(bevelAngleRad);
                    positions.setY(i, newY);
                }
            }
        }
        
        geometry.computeVertexNormals();
        return geometry;
    }
    
    createJoints() {
        const vertexMap = new Map();
        
        // Collect unique vertices from visible triangles only
        const trianglesToShow = this.assemblyMode ? 
            this.allFaces.slice(0, this.assemblyStep) : 
            this.allFaces;
            
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
        let cameraTarget = this.cameraTarget || new THREE.Vector3(0, this.diameter / 2, 0);
        let cameraDistance = this.cameraDistance || Math.max(2, this.diameter * 1.5);
        let cameraTheta = this.cameraTheta !== undefined ? this.cameraTheta : Math.PI / 4; // Horizontal rotation
        let cameraPhi = this.cameraPhi !== undefined ? this.cameraPhi : Math.PI / 3; // Vertical rotation

        const updateCameraPosition = () => {
            this.cameraTarget = cameraTarget;
            this.cameraDistance = cameraDistance;
            this.cameraTheta = cameraTheta;
            this.cameraPhi = cameraPhi;
            
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
            },
            setCameraTheta: (theta) => {
                cameraTheta = theta;
                updateCameraPosition();
            },
            setCameraPhi: (phi) => {
                cameraPhi = phi;
                updateCameraPosition();
            }
        };
        
        // Initialize camera position
        updateCameraPosition();
    }
    
    setView(viewName) {
        if (!this.cameraControls) return;
        
        // Reset selections
        this.selectedJoint = null;
        this.selectedStrut = null;
        this.selectedTriangle = null;
        
        switch(viewName) {
            case 'front':
                this.viewMode = 'full';
                this.cameraControls.setCameraTheta(Math.PI / 2);
                this.cameraControls.setCameraPhi(Math.PI / 2);
                this.cameraControls.setCameraTarget(new THREE.Vector3(0, this.diameter / 2, 0));
                this.zoom = 1.0;
                break;
            case 'top':
                this.viewMode = 'full';
                this.cameraControls.setCameraTheta(0);
                this.cameraControls.setCameraPhi(0.1);
                this.cameraControls.setCameraTarget(new THREE.Vector3(0, 0, 0));
                this.zoom = 1.2;
                break;
            case 'diagonal':
                this.viewMode = 'full';
                this.cameraControls.setCameraTheta(Math.PI / 4);
                this.cameraControls.setCameraPhi(Math.PI / 3);
                this.cameraControls.setCameraTarget(new THREE.Vector3(0, this.diameter / 2, 0));
                this.zoom = 1.0;
                break;
            case 'inner':
                this.viewMode = 'inner';
                this.zoom = 1.0;
                break;
            case 'joint':
                this.viewMode = 'full';
                if (this.geometry && this.geometry.joints && this.geometry.joints.length > 0) {
                    // Find a joint near the front to focus on
                    let targetJoint = this.geometry.joints[0];
                    for (let j of this.geometry.joints) {
                        if (j.position.z > targetJoint.position.z && j.position.y > this.diameter / 4) {
                            targetJoint = j;
                        }
                    }
                    this.selectedJoint = targetJoint;
                    this.zoom = 15.0;
                }
                break;
        }
        
        const zoomSlider = document.getElementById('zoom-slider');
        if (zoomSlider) zoomSlider.value = this.zoom;
        
        if (this.viewMode === 'full') {
            this.cameraControls.updateCameraPosition();
        }
        this.updateUI();
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
                    this.camera.position.set(0, 0.1, 0);
                    this.camera.lookAt(0, this.diameter, 0);
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
        scene.background = new THREE.Color(0x0f172a);

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
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 });
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
            const angleLine = new THREE.Line(angleGeometry, new THREE.LineBasicMaterial({ color: 0xfb7185, linewidth: 3 }));
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
            const angleLine = new THREE.Line(angleGeometry, new THREE.LineBasicMaterial({ color: 0x34d399, linewidth: 3 }));
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
        scene.background = new THREE.Color(0x0f172a); // Match dark theme

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

    setupStageSelection(scene, camera, renderer) {
        this.walkthroughStage = 0;
        for (let i = 0; i < 4; i++) {
            const el = document.getElementById(`stage-${i}`);
            if (el) {
                el.addEventListener('click', () => {
                    this.walkthroughStage = i;
                    this.updateWalkthroughStage();
                    this.updateWalkthroughScene(scene, this.walkthroughStage, 0);
                });
            }
        }
    }

    setupWalkthroughCameraControls(domElement, camera, scene, renderer) {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let cameraRotationY = Math.PI / 4;
        let cameraRotationX = Math.PI / 6;
        const cameraDistance = 3.5;

        const updateCamera = () => {
            camera.position.x = cameraDistance * Math.cos(cameraRotationX) * Math.sin(cameraRotationY);
            camera.position.y = cameraDistance * Math.sin(cameraRotationX);
            camera.position.z = cameraDistance * Math.cos(cameraRotationX) * Math.cos(cameraRotationY);
            camera.lookAt(0, 0, 0);
        };

        domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            cameraRotationY -= deltaMove.x * 0.01;
            cameraRotationX = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, cameraRotationX + deltaMove.y * 0.01));
            updateCamera();
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        domElement.addEventListener('mouseup', () => isDragging = false);
        
        // Touch support
        domElement.addEventListener('touchstart', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });

        domElement.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const deltaMove = {
                x: e.touches[0].clientX - previousMousePosition.x,
                y: e.touches[0].clientY - previousMousePosition.y
            };
            cameraRotationY -= deltaMove.x * 0.01;
            cameraRotationX = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, cameraRotationX + deltaMove.y * 0.01));
            updateCamera();
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });

        domElement.addEventListener('touchend', () => isDragging = false);

        updateCamera();
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
                    '• Accent spheres mark cut locations',
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
            <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p class="font-semibold text-primary mb-2">${currentStage.title}</p>
                <ul class="space-y-1 text-slate-300 text-sm">
                    ${currentStage.points.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
            <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p class="font-semibold text-accent mb-2" style="color: var(--accent-color);">💡 Interactive Tips:</p>
                <ul class="space-y-1 text-slate-300 text-sm">
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
            color: new THREE.Color('#1e293b'), // Slate background strut
            metalness: 0.2,
            roughness: 0.4
        });
        
        const strut = new THREE.Mesh(strutGeometry, strutMaterial);
        
        // Add edges to make the dark strut visible
        const edges = new THREE.EdgesGeometry(strutGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 1 }); // Primary blue edges
        const edgeLines = new THREE.LineSegments(edges, edgesMaterial);
        strut.add(edgeLines);
        
        scene.add(strut);
        
        // Add bright spheres at cut locations
        const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: 0xfb7185, // Accent color for cut marks
            emissive: 0xfb7185,
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
    
    validateJointOverlaps() {
        console.log('Validating overlaps...');
        const struts = Array.from(this.strutMeshes.values());
        let overlapFound = false;

        const vertexToStruts = new Map();
        struts.forEach(strut => {
            if (!strut.userData || !strut.userData.vertices) return;
            const v1 = strut.userData.vertices[0];
            const v2 = strut.userData.vertices[1];
            const k1 = `${v1.x.toFixed(2)},${v1.y.toFixed(2)},${v1.z.toFixed(2)}`;
            const k2 = `${v2.x.toFixed(2)},${v2.y.toFixed(2)},${v2.z.toFixed(2)}`;
            
            if (!vertexToStruts.has(k1)) vertexToStruts.set(k1, []);
            if (!vertexToStruts.has(k2)) vertexToStruts.set(k2, []);
            vertexToStruts.get(k1).push(strut);
            vertexToStruts.get(k2).push(strut);
        });

        const overlapMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9, depthTest: false });
        const overlapGeometry = new THREE.SphereGeometry(0.015, 8, 8);

        const checkPair = (meshA, meshB) => {
            if (meshA.uuid === meshB.uuid) return;
            if (!meshA.userData.checkedWith) meshA.userData.checkedWith = new Set();
            if (!meshB.userData.checkedWith) meshB.userData.checkedWith = new Set();
            if (meshA.userData.checkedWith.has(meshB.uuid)) return;
            
            meshA.userData.checkedWith.add(meshB.uuid);
            meshB.userData.checkedWith.add(meshA.uuid);

            const edgesA = new THREE.EdgesGeometry(meshA.geometry);
            const posA = edgesA.attributes.position;
            const matrixWorldA = meshA.matrixWorld;

            const raycaster = new THREE.Raycaster();
            
            for (let i = 0; i < posA.count; i += 2) {
                const p1 = new THREE.Vector3().fromBufferAttribute(posA, i).applyMatrix4(matrixWorldA);
                const p2 = new THREE.Vector3().fromBufferAttribute(posA, i + 1).applyMatrix4(matrixWorldA);
                
                const dir = new THREE.Vector3().subVectors(p2, p1);
                const length = dir.length();
                if (length < 0.001) continue;
                dir.normalize();

                raycaster.set(p1, dir);
                raycaster.far = 0.0001;
                const intersects = raycaster.intersectObject(meshB, false);

                if (intersects.length > 0) {
                    overlapFound = true;
                    const overlapMesh = new THREE.Mesh(overlapGeometry, overlapMaterial);
                    overlapMesh.position.copy(intersects[0].point);
                    this.scene.add(overlapMesh);
                }
            }
        };

        vertexToStruts.forEach((connectedStruts) => {
            for (let i = 0; i < connectedStruts.length; i++) {
                for (let j = i + 1; j < connectedStruts.length; j++) {
                    checkPair(connectedStruts[i], connectedStruts[j]);
                }
            }
        });

        if (overlapFound) {
            console.log('Overlap detected! Visualizing with red dots.');
        } else {
            console.log('Perfect joining! No overlap.');
        }
    }


    
    flattenPolygon(points3D) {
        if(points3D.length < 3) return [];
        
        let nx = 0, ny = 0, nz = 0;
        for(let i=0; i<points3D.length; i++) {
            let p1 = points3D[i];
            let p2 = points3D[(i+1)%points3D.length];
            nx += (p1.y - p2.y) * (p1.z + p2.z);
            ny += (p1.z - p2.z) * (p1.x + p2.x);
            nz += (p1.x - p2.x) * (p1.y + p2.y);
        }
        const len = Math.hypot(nx, ny, nz);
        nx /= len; ny /= len; nz /= len;
        
        const v0 = points3D[0];
        const v1 = points3D[1];
        
        let ux = v1.x - v0.x;
        let uy = v1.y - v0.y;
        let uz = v1.z - v0.z;
        const ulen = Math.hypot(ux, uy, uz);
        ux /= ulen; uy /= ulen; uz /= ulen;
        
        let vx = ny * uz - nz * uy;
        let vy = nz * ux - nx * uz;
        let vz = nx * uy - ny * ux;
        
        const points2D = points3D.map(p => {
            let dx = p.x - v0.x;
            let dy = p.y - v0.y;
            let dz = p.z - v0.z;
            return {
                x: dx * ux + dy * uy + dz * uz,
                y: dx * vx + dy * vy + dz * vz
            };
        });
        
        let area = 0;
        for(let i=0; i<points2D.length; i++) {
            let p1 = points2D[i];
            let p2 = points2D[(i+1)%points2D.length];
            area += (p2.x - p1.x) * (p2.y + p1.y);
        }
        if (area < 0) {
            points2D.reverse();
        }
        
        return points2D.map(p => ({ x: p.x * 1000, y: p.y * 1000 }));
    }




    renderBlueprint() {
        const container = document.getElementById('blueprint-container');
        if (!container) return;
        
        const mode = this.blueprintViewMode || 'origami';
        let svgContent = '';
        if (mode === 'panels') {
            svgContent = this.generateBlueprintSVG();
        } else {
            svgContent = this.generateOrigamiSVG();
        }
        
        container.innerHTML = `<div class="w-full flex justify-center bg-slate-900 rounded-xl border border-slate-700 shadow-inner p-4">${svgContent}</div>`;
    }

    generateBlueprintSVG() {
        const scaleInput = document.getElementById('blueprint-scale-slider');
        const scale = scaleInput ? parseFloat(scaleInput.value) : 20;
        const flapsInput = document.getElementById('blueprint-flaps-toggle');
        const includeFlaps = flapsInput ? flapsInput.checked : true;
        
        let allGroups = '';
        const PAGE_WIDTH = 210; // A4 width in mm
        const margin = 5;
        const flapDepth = includeFlaps ? 10 : 0;
        const inset = 3;
        
        let currentX = margin;
        let currentY = margin;
        let currentRowHeight = 0;
        let isRotated = false;
        
        this.triangleTypes.forEach((typeData, typeKey) => {
            if (typeData.triangles.length === 0) return;
            
            const tri = typeData.triangles[0];
            const pts2D = this.flattenPolygon(tri.triangle);
            if (pts2D.length < 3) return;
            
            const ptsScaled = pts2D.map(p => ({ x: p.x / scale, y: p.y / scale }));
            
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            ptsScaled.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            });
            
            const bbWidth = (maxX - minX) + flapDepth * 2;
            const bbHeight = (maxY - minY) + flapDepth * 2;
            const L = ptsScaled[1].x - ptsScaled[0].x; // Base length for stepping
            const stepX = (L / 2) + flapDepth * 2.5 + 5;
            
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;
            const ptsString = ptsScaled.map(p => `${p.x},${p.y}`).join(' ');
            
            for (let i = 0; i < typeData.count; i++) {
                if (currentX + bbWidth > PAGE_WIDTH - margin) {
                    currentX = margin;
                    currentY += currentRowHeight + margin;
                    currentRowHeight = 0;
                    isRotated = false; // Reset rotation for new row
                }
                
                if (bbHeight > currentRowHeight) currentRowHeight = bbHeight;
                
                const startX = currentX - minX + flapDepth;
                const startY = currentY - minY + flapDepth;
                
                let transform = `translate(${startX}, ${startY})`;
                if (isRotated) {
                    transform += ` rotate(180, ${cx}, ${cy})`;
                }
                
                let g = `<g transform="${transform}">`;
                g += `<polygon points="${ptsString}" class="${includeFlaps ? 'fold' : 'cut'}" fill="${typeData.color}33" stroke="${typeData.color}" stroke-width="0.5" onmouseenter="window.sim.selectTriangleType('${typeKey}')" onmouseleave="window.sim.selectTriangleType(null)"/>`;
                
                if (includeFlaps) {
                    for(let j=0; j<ptsScaled.length; j++) {
                        let p1 = ptsScaled[j];
                        let p2 = ptsScaled[(j+1)%ptsScaled.length];
                        let dx = p2.x - p1.x, dy = p2.y - p1.y;
                        let len = Math.hypot(dx, dy);
                        let nx = -dy / len, ny = dx / len;
                        let f1x = p1.x + nx * flapDepth, f1y = p1.y + ny * flapDepth;
                        let f2x = p2.x + nx * flapDepth, f2y = p2.y + ny * flapDepth;
                        let insetDx = dx * (inset/len), insetDy = dy * (inset/len);
                        g += `<polygon points="${p1.x},${p1.y} ${p2.x},${p2.y} ${f2x - insetDx},${f2y - insetDy} ${f1x + insetDx},${f1y + insetDy}" class="cut" fill="none" stroke="white" stroke-width="0.3"/>`;
                    }
                }
                g += `</g>`;
                
                const textX = startX + cx;
                const textY = startY + cy;
                g += `<text x="${textX}" y="${textY}" class="text" text-anchor="middle">T${typeKey}</text>`;
                
                allGroups += g;
                
                currentX += stepX;
                isRotated = !isRotated;
            }
        });
        
        const totalHeight = currentY + currentRowHeight + margin;
        
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_WIDTH} ${totalHeight}" width="${PAGE_WIDTH}mm" height="${totalHeight}mm" class="max-w-full h-auto">`;
        svgContent += `<style>
            .cut { stroke: #ff0000; stroke-width: 0.2; fill: none; }
            .fold { stroke: #0000ff; stroke-width: 0.2; fill: none; stroke-dasharray: 2,2; }
            .text { font-family: sans-serif; font-size: 3px; fill: #000; pointer-events: none; }
            polygon { cursor: pointer; transition: opacity 0.2s; }
            polygon:hover { opacity: 0.8; }
        </style>`;
        
        svgContent += allGroups;
        svgContent += `</svg>`;
        
        return svgContent;
    }

    exportBlueprintSVG() {
        const mode = this.blueprintViewMode || 'origami';
        const svgContent = mode === 'panels' ? this.generateBlueprintSVG() : this.generateOrigamiSVG();
        const scaleInput = document.getElementById('blueprint-scale-slider');
        const scale = scaleInput ? parseFloat(scaleInput.value) : 20;
        const prefix = mode === 'panels' ? 'dome_panels' : 'origami_net';
        
        const blob = new Blob([svgContent], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${prefix}_scale_1_${scale}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggleOrigamiMode() {
        this.blueprintMode = !this.blueprintMode;
        if (!this.blueprintViewMode) this.blueprintViewMode = 'origami';
        
        const newUrlParams = new URLSearchParams(window.location.search);
        if (this.blueprintMode) {
            newUrlParams.set('origami', '1');
            newUrlParams.set('origami_style', this.blueprintViewMode);
        } else {
            newUrlParams.delete('origami');
            // optionally leave origami_style or remove it. We'll leave it in case they re-open.
        }
        window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
        
        const bpView = document.getElementById('blueprint-view');
        const btnBp = document.getElementById('btn-blueprint-mode');
        const btnDownload = document.getElementById('btn-blueprint-download');
        const btnStyle = document.getElementById('btn-blueprint-style');
        
        if (this.blueprintMode) {
            bpView.classList.remove('hidden');
            btnBp.classList.add('bg-pink-900', 'border-pink-400', 'text-white');
            if (btnDownload) { btnDownload.classList.remove('hidden'); btnDownload.classList.add('flex'); }
            if (btnStyle) { btnStyle.classList.remove('hidden'); btnStyle.classList.add('flex'); }
            this.renderBlueprint();
        } else {
            bpView.classList.add('hidden');
            btnBp.classList.remove('bg-pink-900', 'border-pink-400', 'text-white');
            if (btnDownload) { btnDownload.classList.add('hidden'); btnDownload.classList.remove('flex'); }
            if (btnStyle) { btnStyle.classList.add('hidden'); btnStyle.classList.remove('flex'); }
        }
    }

    toggleBlueprintStyle() {
        if (this.blueprintViewMode === 'origami') {
            this.blueprintViewMode = 'panels';
            const btnStyle = document.getElementById('btn-blueprint-style');
            if (btnStyle) {
                btnStyle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <polygon points="8,12 16,12 12,18.93" />
                    <polygon points="8,12 16,12 12,5.07" />
                    <polygon points="8,12 12,18.93 4,18.93" />
                    <polygon points="16,12 12,18.93 20,18.93" />
                </svg>`;
                btnStyle.title = "Switch to Origami Net";
            }
        } else {
            this.blueprintViewMode = 'origami';
            const btnStyle = document.getElementById('btn-blueprint-style');
            if (btnStyle) {
                btnStyle.innerHTML = '<i class="bi bi-scissors"></i>';
                btnStyle.title = "Switch to Panels (Scissors)";
            }
        }
        
        const newUrlParams = new URLSearchParams(window.location.search);
        newUrlParams.set('origami_style', this.blueprintViewMode);
        window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);
        
        this.renderBlueprint();
    }
    destroy() {
        document.getElementById('btn-blueprint-mode')?.removeEventListener('click', this.toggleBlueprintMode);
        document.getElementById('blueprint-scale-slider')?.removeEventListener('input', this.renderBlueprint);
        document.getElementById('blueprint-flaps-toggle')?.removeEventListener('change', this.renderBlueprint);
        document.getElementById('btn-export-blueprint')?.removeEventListener('click', this.exportBlueprintSVG);
    }

    // Removed unused initBlueprintListeners


    generateOrigamiSVG() {
        const scaleInput = document.getElementById('blueprint-scale-slider');
        const scale = scaleInput ? parseFloat(scaleInput.value) : 20;

        const getEdgeKey = (v1, v2) => {
            const k1 = `${v1.x.toFixed(3)},${v1.y.toFixed(3)},${v1.z.toFixed(3)}`;
            const k2 = `${v2.x.toFixed(3)},${v2.y.toFixed(3)},${v2.z.toFixed(3)}`;
            return k1 < k2 ? `${k1}-${k2}` : `${k2}-${k1}`;
        };

        const edgeMap = new Map();
        this.allFaces.forEach((face, fIdx) => {
            for (let i = 0; i < face.length; i++) {
                const v1 = face[i];
                const v2 = face[(i + 1) % face.length];
                const key = getEdgeKey(v1, v2);
                if (!edgeMap.has(key)) edgeMap.set(key, []);
                edgeMap.get(key).push({ fIdx, v1, v2 });
            }
        });

        const faceAdj = this.allFaces.map(() => []);
        edgeMap.forEach(edges => {
            if (edges.length === 2) {
                faceAdj[edges[0].fIdx].push({ neighbor: edges[1].fIdx, sharedV1: edges[0].v1, sharedV2: edges[0].v2 });
                faceAdj[edges[1].fIdx].push({ neighbor: edges[0].fIdx, sharedV1: edges[1].v1, sharedV2: edges[1].v2 });
            }
        });

        const visited = new Set();
        const nets = [];

        const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
        const intersectSegments = (p1, p2, p3, p4) => {
            return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
        };

        const pointInPoly = (pt, poly) => {
            let inside = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const xi = poly[i].x, yi = poly[i].y;
                const xj = poly[j].x, yj = poly[j].y;
                const intersect = ((yi > pt.y) !== (yj > pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        };

        const polyIntersect = (polyA, polyB) => {
            let minXa = Infinity, maxXa = -Infinity, minYa = Infinity, maxYa = -Infinity;
            polyA.forEach(p => { minXa = Math.min(minXa, p.x); maxXa = Math.max(maxXa, p.x); minYa = Math.min(minYa, p.y); maxYa = Math.max(maxYa, p.y); });
            let minXb = Infinity, maxXb = -Infinity, minYb = Infinity, maxYb = -Infinity;
            polyB.forEach(p => { minXb = Math.min(minXb, p.x); maxXb = Math.max(maxXb, p.x); minYb = Math.min(minYb, p.y); maxYb = Math.max(maxYb, p.y); });
            if (maxXa < minXb - 1e-3 || minXa > maxXb + 1e-3 || maxYa < minYb - 1e-3 || minYa > maxYb + 1e-3) return false;

            const centerB = { x: 0, y: 0 };
            polyB.forEach(p => { centerB.x += p.x; centerB.y += p.y; });
            centerB.x /= polyB.length; centerB.y /= polyB.length;
            const shrunkB = polyB.map(p => ({ x: p.x * 0.98 + centerB.x * 0.02, y: p.y * 0.98 + centerB.y * 0.02 }));

            for (let i = 0; i < polyA.length; i++) {
                const a1 = polyA[i], a2 = polyA[(i + 1) % polyA.length];
                for (let j = 0; j < shrunkB.length; j++) {
                    const b1 = shrunkB[j], b2 = shrunkB[(j + 1) % shrunkB.length];
                    if (intersectSegments(a1, a2, b1, b2)) return true;
                }
            }
            
            if (shrunkB.some(p => pointInPoly(p, polyA))) return true;
            if (polyA.some(p => pointInPoly(p, shrunkB))) return true;
            
            return false;
        };

        const isSame = (a, b) => a.distanceTo(b) < 1e-4;

        for (let startIdx = 0; startIdx < this.allFaces.length; startIdx++) {
            if (visited.has(startIdx)) continue;

            const net = { faces: [], folds: [], cuts: [] };
            const facePts = new Map();

            const startFace = this.allFaces[startIdx];
            const xAxis = startFace[1].clone().sub(startFace[0]).normalize();
            
            const v0 = startFace[0], v1 = startFace[1], v2 = startFace[2];
            let normal = new THREE.Vector3().crossVectors(v1.clone().sub(v0), v2.clone().sub(v0)).normalize();
            if (normal.dot(v0) < 0) normal.negate();
            const yAxis = new THREE.Vector3().crossVectors(normal, xAxis).normalize();

            const pts2D = startFace.map(pt => {
                const d = pt.clone().sub(startFace[0]);
                return { x: d.dot(xAxis) * 1000 / scale, y: d.dot(yAxis) * 1000 / scale };
            });

            net.faces.push({ fIdx: startIdx, pts2D });
            facePts.set(startIdx, pts2D);
            visited.add(startIdx);

            const queue = [];
            faceAdj[startIdx].forEach(adj => queue.push({ parent: startIdx, current: adj.neighbor, sv1: adj.sharedV1, sv2: adj.sharedV2 }));

            while (queue.length > 0) {
                const item = queue.shift();
                if (visited.has(item.current)) continue;

                const pFace2D = facePts.get(item.parent);
                const pFace3D = this.allFaces[item.parent];
                const cFace3D = this.allFaces[item.current];

                let p1_2d, p2_2d;
                for (let i = 0; i < pFace3D.length; i++) {
                    if (isSame(pFace3D[i], item.sv1)) p1_2d = pFace2D[i];
                    if (isSame(pFace3D[i], item.sv2)) p2_2d = pFace2D[i];
                }
                if (!p1_2d || !p2_2d) continue;

                const cxAxis = item.sv1.clone().sub(item.sv2).normalize();
                const cv0 = cFace3D[0], cv1 = cFace3D[1], cv2 = cFace3D[2];
                let cNormal = new THREE.Vector3().crossVectors(cv1.clone().sub(cv0), cv2.clone().sub(cv0)).normalize();
                if (cNormal.dot(cv0) < 0) cNormal.negate();
                let cyAxis = new THREE.Vector3().crossVectors(cNormal, cxAxis).normalize();

                const localPts = cFace3D.map(pt => {
                    const d = pt.clone().sub(item.sv2);
                    return { x: d.dot(cxAxis) * 1000 / scale, y: d.dot(cyAxis) * 1000 / scale };
                });

                const targetX = { x: p1_2d.x - p2_2d.x, y: p1_2d.y - p2_2d.y };
                const len = Math.hypot(targetX.x, targetX.y);
                const ux = { x: targetX.x / len, y: targetX.y / len };
                const uy = { x: -targetX.y / len, y: targetX.x / len };

                const transformedPts = localPts.map(pt => ({
                    x: p2_2d.x + pt.x * ux.x + pt.y * uy.x,
                    y: p2_2d.y + pt.x * ux.y + pt.y * uy.y
                }));

                let overlap = false;
                for (let placedPts of facePts.values()) {
                    if (polyIntersect(transformedPts, placedPts)) { overlap = true; break; }
                }

                if (!overlap) {
                    net.faces.push({ fIdx: item.current, pts2D: transformedPts });
                    facePts.set(item.current, transformedPts);
                    visited.add(item.current);
                    net.folds.push({ p1: p1_2d, p2: p2_2d });
                    
                    faceAdj[item.current].forEach(adj => {
                        if (!visited.has(adj.neighbor)) {
                            queue.push({ parent: item.current, current: adj.neighbor, sv1: adj.sharedV1, sv2: adj.sharedV2 });
                        }
                    });
                } else {
                    net.cuts.push({ p1: p1_2d, p2: p2_2d });
                }
            }
            nets.push(net);
        }

        let globalMinX = Infinity;
        let globalMinY = Infinity;
        let globalMaxX = -Infinity;
        let globalMaxY = -Infinity;
        
        let offsetX = 0;
        let offsetY = 0;
        
        let allNetsSvg = "";

        nets.forEach((net, idx) => {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            net.faces.forEach(f => {
                f.pts2D.forEach(p => {
                    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
                    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
                });
            });
            const w = maxX - minX;
            const h = maxY - minY;
            const dx = offsetX - minX;
            const dy = offsetY - minY;
            
            globalMinX = Math.min(globalMinX, offsetX);
            globalMinY = Math.min(globalMinY, offsetY);
            globalMaxX = Math.max(globalMaxX, offsetX + w);
            globalMaxY = Math.max(globalMaxY, offsetY + h);

            allNetsSvg += `<g transform="translate(${dx}, ${dy})">\n`;
            
            net.faces.forEach(f => {
                const ptsStr = f.pts2D.map(p => `${p.x},${p.y}`).join(' ');
                
                const face = this.allFaces[f.fIdx];
                let typeKey = null, typeData = null;
                for (const [key, data] of this.triangleTypes) {
                    if (data.triangles.find(t => t.triangle === face || this.trianglesEqual(t.triangle, face))) {
                        typeKey = key;
                        typeData = data;
                        break;
                    }
                }
                const color = typeData ? typeData.color : '#ffffff';
                
                allNetsSvg += `<polygon points="${ptsStr}" class="cut" fill="${color}33" stroke="${color}" onmouseenter="window.sim.selectTriangleType('${typeKey}')" onmouseleave="window.sim.selectTriangleType(null)"/>\n`;
            });

            net.folds.forEach(fold => {
                allNetsSvg += `<line x1="${fold.p1.x}" y1="${fold.p1.y}" x2="${fold.p2.x}" y2="${fold.p2.y}" class="fold"/>\n`;
            });

            allNetsSvg += `</g>\n`;
            offsetX += w + 20;
        });

        // Add padding
        globalMinX -= 20;
        globalMinY -= 20;
        const viewBoxWidth = (globalMaxX - globalMinX) + 40;
        const viewBoxHeight = (globalMaxY - globalMinY) + 40;

        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="auto" viewBox="${globalMinX} ${globalMinY} ${viewBoxWidth} ${viewBoxHeight}">\n`;
        svgContent += `<style>
            .cut { stroke: #ff0000; stroke-width: 0.5; }
            .fold { stroke: #0000ff; stroke-width: 0.5; stroke-dasharray: 4,4; fill: none; pointer-events: none; }
            .text { font-family: sans-serif; font-size: 8px; fill: #64748b; pointer-events: none; }
            polygon { cursor: pointer; transition: opacity 0.2s; }
            polygon:hover { opacity: 0.7; }
        </style>\n`;
        
        svgContent += allNetsSvg;
        svgContent += `</svg>`;
        return svgContent;
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
window.sim = domeSimulator;
