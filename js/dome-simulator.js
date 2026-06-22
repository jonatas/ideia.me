
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
    
    switchTab(tabId) {
        // Update tab buttons
        const tabs = ['design', 'inventory', 'assembly'];
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
        });
        
        const strutHeightSlider = document.getElementById('strut-height');
        strutHeightSlider.addEventListener('input', (e) => {
            this.strutHeight = parseInt(e.target.value);
            this.updateUI();
        });
        
        // Clear selection button
        const clearButton = document.getElementById('clear-selection');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.selectedTriangle = null;
                this.selectedStrut = null;
                this.selectedJoint = null;
                this.updateUI();
                this.initMainDomeView();
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
                this.cameraControls?.setCameraTarget(new THREE.Vector3(0, 2, 0));
                this.updateUI();
            });
        }
    }
    
    updateUI() {
        // Update frequency display
        document.getElementById('frequency-display').textContent = this.frequency;
        
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
        
        // Update strut types list
        this.updateStrutTypesList();
        
        // Update assembly controls
        this.updateAssemblyControls();
        
        // Update triangle inventory
        this.updateTriangleInventory();
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
                            this.showSegmentDetails(segment);
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
            assemblyToggle.className = 'flex-1 py-2 bg-primary text-slate-900 text-[10px] font-black uppercase rounded hover:bg-white transition-colors';
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
                return Math.max(1, this.allTriangles.length - 1);
            case 2: // Component Integration Phase (Segments)
                return Math.max(1, this.assemblySegments.length - 1);
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
                this.showStrutDetails(strut);
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
                <button onclick="domeSimulator.showStrutDetails({type:'${strutInfo.type}', length:${strutInfo.length}, miterAngle:${strutInfo.miterAngle}, bevelAngle:${strutInfo.bevelAngle}, color:'${strutInfo.color}'})" class="w-full mt-3 py-1.5 bg-primary/20 text-primary text-[9px] font-bold uppercase rounded border border-primary/30 hover:bg-primary/30">
                    View Cutting Guide
                </button>
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
        
        const createSection = (title, filterFn) => {
            const struts = this.strutTypes.filter(filterFn);
            if (struts.length === 0) return;
            
            const header = document.createElement('div');
            header.className = 'text-xs font-bold text-slate-400 uppercase tracking-widest mt-6 mb-3 border-b border-slate-700 pb-2';
            header.textContent = title;
            list.appendChild(header);
            
            struts.forEach(strut => {
                const card = document.createElement('div');
                const isSelected = this.selectedStrutType?.type === strut.type;
                card.className = `data-card mb-3 cursor-pointer transition-colors ${isSelected ? 'active border-primary' : 'border-slate-700 hover:border-slate-500'}`;
                
                let qtyText = strut.count + ' Total';
                if (title === 'Base Ring') qtyText = strut.baseCount + ' Pieces';
                else if (title === 'Verticals (Standing on Base)') qtyText = strut.standCount + ' Pieces';
                else qtyText = (strut.count - (strut.baseCount || 0) - (strut.standCount || 0)) + ' Pieces';

                const insideLength = strut.length - (this.strutWidth / Math.tan((90 - strut.miterAngle) * Math.PI / 180));

                card.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style="background-color: ${strut.color}22; color: ${strut.color}">
                            ${strut.type}
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-center mb-1">
                                <div class="flex items-baseline gap-2">
                                    <span class="text-sm font-bold text-slate-100">${insideLength.toFixed(1)}</span>
                                    <span class="text-[10px] text-slate-500">(${strut.length.toFixed(0)})</span>
                                </div>
                                <span class="text-xs font-mono text-primary">${qtyText}</span>
                            </div>
                            <div class="flex gap-3 text-[10px] text-slate-400">
                                <span style="color: #fb7185">Sway: ${strut.miterAngle.toFixed(1)}°</span>
                                <span style="color: #34d399">Tilt: ${strut.bevelAngle.toFixed(1)}°</span>
                                <span class="ml-auto text-primary/50">Details <i class="bi bi-chevron-right"></i></span>
                            </div>
                        </div>
                    </div>
                `;
                
                card.onclick = () => {
                    this.selectedStrutType = strut;
                    this.updateUI();
                    this.showStrutDetails(strut);
                };
                
                list.appendChild(card);
            });
        };

        // If baseCount isn't calculated in the new face-based logic, just show all
        if (this.strutTypes.some(s => s.baseCount > 0)) {
            createSection('Base Ring', s => s.baseCount > 0);
            createSection('Verticals (Standing on Base)', s => s.standCount > 0);
            createSection('Dome Canopy', s => (s.count - s.baseCount - s.standCount) > 0);
        } else {
            createSection('All Struts', s => true);
        }
    }

    showStrutDetails(strut) {
        const miterLoss = (this.strutWidth / Math.tan((90 - strut.miterAngle) * Math.PI / 180)).toFixed(1);
        const insideLength = (strut.length - parseFloat(miterLoss)).toFixed(1);
        
        const content = `
            <div class="space-y-6">
                <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <h3 class="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" style="background-color: #fb7185"></span>
                        1. Miter Cut (Sway)
                    </h3>
                    <div id="step2-view" class="w-full aspect-video bg-black rounded-lg step-view"></div>
                    <div class="mt-4 grid grid-cols-2 gap-4">
                        <div class="text-[10px]">
                            <span class="block text-slate-500">Angle</span>
                            <span style="color: #fb7185" class="font-mono text-sm">${strut.miterAngle.toFixed(1)}°</span>
                        </div>
                        <div class="text-[10px]">
                            <span class="block text-slate-500">Material Loss</span>
                            <span style="color: #fb7185" class="font-mono text-sm">${miterLoss}mm</span>
                        </div>
                    </div>
                </div>
                <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <h3 class="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" style="background-color: #34d399"></span>
                        2. Bevel Cut (Tilt)
                    </h3>
                    <div id="step3-view" class="w-full aspect-video bg-black rounded-lg step-view"></div>
                    <div class="mt-4 grid grid-cols-2 gap-4">
                        <div class="text-[10px]">
                            <span class="block text-slate-500">Angle</span>
                            <span style="color: #34d399" class="font-mono text-sm">${strut.bevelAngle.toFixed(1)}°</span>
                        </div>
                        <div class="text-[10px]">
                            <span class="block text-slate-500">Note</span>
                            <span style="color: #34d399" class="font-mono text-xs">Rip along full edge</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="space-y-6">
                <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full">
                    <h3 class="text-xs font-bold text-slate-400 uppercase mb-6 tracking-widest">Good Karma Fabrication</h3>
                    <div class="space-y-4">
                        <div class="flex justify-between border-b border-slate-700 pb-2">
                            <span class="text-xs text-slate-400">Inside Length (Short)</span>
                            <span class="text-xs font-bold text-primary">${insideLength}mm</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-700 pb-2">
                            <span class="text-xs text-slate-400">Outside Length (Long)</span>
                            <span class="text-xs font-bold text-white">${strut.length.toFixed(1)}mm</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-700 pb-2">
                            <span class="text-xs text-slate-400">Stock Width</span>
                            <span class="text-xs font-bold text-white">${this.strutWidth}mm</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-700 pb-2">
                            <span class="text-xs text-slate-400">Stock Height</span>
                            <span class="text-xs font-bold text-white">${this.strutHeight}mm</span>
                        </div>
                    </div>
                    <div class="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <p class="text-[10px] text-primary leading-relaxed">
                            <i class="bi bi-info-circle-fill mr-1"></i>
                            <strong>Important:</strong> Each strut receives BOTH miter and bevel cuts on BOTH ends. The rectangular cross-section with compound cuts creates perfect overlapping joints without metal hubs.
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        this.showDetails(`Strut Type ${strut.type} Manufacturing Guide`, content);
        }

        showSegmentDetails(segment) {
        const isDoor = segment.name.includes('Door');

        let content = `
            <div class="space-y-6">
                <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full">
                    <h3 class="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Segment Information</h3>
                    <div class="space-y-4">
                        <div class="flex justify-between border-b border-slate-700 pb-2">
                            <span class="text-xs text-slate-400">Segment Name</span>
                            <span class="text-xs font-bold text-white">${segment.name}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-700 pb-2">
                            <span class="text-xs text-slate-400">Total Units</span>
                            <span class="text-xs font-bold text-white">${segment.triangles.length}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-700 pb-2">
                            <span class="text-xs text-slate-400">Level</span>
                            <span class="text-xs font-bold text-white">${segment.level}</span>
                        </div>
                    </div>
                    <div class="mt-6 p-4 ${isDoor ? 'bg-amber-500/10 border-amber-500/20' : 'bg-primary/10 border-primary/20'} rounded-lg border">
                        <p class="text-[10px] ${isDoor ? 'text-amber-400' : 'text-primary'} leading-relaxed">
                            <i class="bi ${isDoor ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} mr-1"></i>
                            <strong>Construction Note:</strong> ${
                                isDoor 
                                ? 'The door segment is installed last to maintain the structural integrity of the lower rings during assembly.'
                                : 'Follow the bottom-up, front-to-back sequence. Ensure all hubs are tightly fitted using the Good Karma overlapping system before moving to the next segment.'
                            }
                        </p>
                    </div>
                </div>
            </div>
            <div class="space-y-6">
                <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full">
                    <h3 class="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Walkthrough Connection</h3>
                    <p class="text-xs text-slate-300 leading-relaxed mb-4">
                        Review the 3D walkthrough stages below to understand how the units in this segment connect.
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="domeSimulator.closeDetails(); document.getElementById('stage-1').click();" class="p-3 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 text-left transition-colors">
                            <span class="block text-[10px] font-bold text-slate-400">Stage 2</span>
                            <span class="block text-xs font-bold text-white mt-1">Joints Forming</span>
                        </button>
                        <button onclick="domeSimulator.closeDetails(); document.getElementById('stage-2').click();" class="p-3 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 text-left transition-colors">
                            <span class="block text-[10px] font-bold text-slate-400">Stage 3</span>
                            <span class="block text-xs font-bold text-white mt-1">Complete Triangle</span>
                        </button>
                        <button onclick="domeSimulator.closeDetails(); document.getElementById('stage-3').click();" class="p-3 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 text-left transition-colors col-span-2">
                            <span class="block text-[10px] font-bold text-slate-400">Stage 4</span>
                            <span class="block text-xs font-bold text-white mt-1">Star Pattern Assembly</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.showDetails(`Assembly Details: ${segment.name}`, content);
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

        // Rotate the icosahedron so that vertex 0 is at the top (0, radius, 0)
        // to align with the Kruschke method (zenith is a pentagon hub and base is flat)
        const q = new THREE.Quaternion().setFromUnitVectors(
            baseVertices[0].clone().normalize(),
            new THREE.Vector3(0, 1, 0)
        );
        baseVertices.forEach(v => v.applyQuaternion(q));

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
            this.allTriangles.push(...this.subdivideTriangle(v1, v2, v3, this.frequency, radius));
        });

        // Apply Kruschke magic fix for flat base
        if (this.frequency === 3 || this.frequency === 4) {
            const MAGIC_FIX_RATIO = this.frequency === 3 ? 0.9442890204731844 : (0.22219 / 0.253185 * 0.9983958444733023);
            
            const vertexMap = new Map();
            const getVertexKey = (v) => `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
            
            baseVertices.forEach(v => {
                vertexMap.set(getVertexKey(v), { v: v.clone(), isPPT: true });
            });

            this.allTriangles.forEach(tri => {
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
            
            this.allTriangles.forEach(tri => {
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

        // Filter triangles (keep upper hemisphere / 5/8 dome for odd frequencies)
        // Even frequencies have a flat equator at Y=0.
        // Odd frequencies have a zig-zag equator, extending below Y=0 (creating a 5/8 dome).
        let cutoff = -0.01 * radius;
        if (this.frequency % 2 !== 0) {
            cutoff = this.frequency === 1 ? -0.5 * radius : -0.25 * radius;
        }

        this.allTriangles = this.allTriangles.filter(tri => {
            const minY = Math.min(tri[0].y, tri[1].y, tri[2].y);
            return minY >= cutoff;
        });

        // Set the floor to exactly Y=0 for visual alignment
        // The lowest Y coordinate after the cut should be set to 0.
        let lowestY = Infinity;
        this.allTriangles.forEach(tri => {
            tri.forEach(v => {
                if (v.y < lowestY) lowestY = v.y;
            });
        });
        
        // Offset all points so the base sits exactly on the floor (Y=0)
        // Use a Set to ensure we only offset each unique vertex object once, preventing multiple-subtraction warping.
        const uniqueVertices = new Set();
        this.allTriangles.forEach(tri => {
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
        
        // Map to find adjacent faces for dihedral (bevel) calculation
        const edgeToFaces = new Map();
        const faceNormals = this.allTriangles.map(tri => {
            const vA = new THREE.Vector3().subVectors(tri[1], tri[0]);
            const vB = new THREE.Vector3().subVectors(tri[2], tri[0]);
            return new THREE.Vector3().crossVectors(vA, vB).normalize();
        });

        this.allTriangles.forEach((tri, fIdx) => {
            for (let i = 0; i < 3; i++) {
                const v1 = tri[i];
                const v2 = tri[(i + 1) % 3];
                const key = this.getStrutKey(v1, v2);
                if (!edgeToFaces.has(key)) edgeToFaces.set(key, []);
                edgeToFaces.get(key).push(fIdx);
            }
        });

        this.allTriangles.forEach((tri, fIdx) => {
            const v = tri.map(vert => vert.clone());
            const sides = [
                v[0].distanceTo(v[1]),
                v[1].distanceTo(v[2]),
                v[2].distanceTo(v[0])
            ];

            const angles = [
                Math.acos((sides[0]**2 + sides[2]**2 - sides[1]**2) / (2 * sides[0] * sides[2])),
                Math.acos((sides[0]**2 + sides[1]**2 - sides[2]**2) / (2 * sides[0] * sides[1])),
                Math.acos((sides[1]**2 + sides[2]**2 - sides[0]**2) / (2 * sides[1] * sides[2]))
            ];

            for (let i = 0; i < 3; i++) {
                const v1 = tri[i], v2 = tri[(i + 1) % 3];
                const edgeKey = this.getStrutKey(v1, v2);
                const adjacentFaces = edgeToFaces.get(edgeKey);
                
                let bevel = 0;
                if (adjacentFaces.length === 2) {
                    const n1 = faceNormals[adjacentFaces[0]];
                    const n2 = faceNormals[adjacentFaces[1]];
                    bevel = (n1.angleTo(n2) * 180 / Math.PI) / 2;
                } else if (adjacentFaces.length === 1) {
                    // Base struts usually have a 0 bevel or a specific angle for the foundation
                    bevel = 0;
                }

                const angleAtVertex = angles[i] * 180 / Math.PI;
                const miter = Math.abs(90 - angleAtVertex);
                const length = sides[i] * 1000;
                
                // Round values for grouping
                const rLen = Math.round(length);
                const rMiter = Math.round(miter * 10) / 10;
                const rBevel = Math.round(bevel * 10) / 10;
                const key = `${rLen}_${rMiter}_${rBevel}`;

                if (!strutMap.has(key)) {
                    strutMap.set(key, { length, miter, bevel, count: 0, baseCount: 0, standCount: 0 });
                }
                const entry = strutMap.get(key);
                entry.count++;

                // Determine if this edge is on the base or stands on the base
                const isBase = v1.y < 0.01 && v2.y < 0.01;
                const isStand = (v1.y < 0.01 && v2.y >= 0.01) || (v2.y < 0.01 && v1.y >= 0.01);

                if (isBase) {
                    entry.baseCount++;
                } else if (isStand) {
                    entry.standCount++;
                }
            }
        });

        // Convert Map to sorted array of families
        const families = Array.from(strutMap.values()).sort((a, b) => b.length - a.length);
        
        this.strutTypes = families.map((f, idx) => ({
            type: String.fromCharCode(65 + idx),
            length: f.length,
            count: f.count,
            color: ['#4361ee', '#f72585', '#7209b7', '#4ECDC4', '#FBBF24', '#0EA5E9', '#EF4444', '#10b981', '#f78c6b', '#8338ec'][idx % 10],
            miterAngle: f.miter,
            bevelAngle: f.bevel,
            baseCount: f.baseCount,
            standCount: f.standCount
        }));
    }
    
    organizeTrianglesByType() {
        // Clear previous organization
        this.triangleTypes.clear();
        this.assemblyInventory.clear();
        this.groundTriangles = [];
        this.assemblyLayers = [];
        this.assemblySegments = [];
        
        // Analyze each triangle's strut composition
        this.allTriangles.forEach((tri, idx) => {
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
        const center = new THREE.Vector3(
            (tri[0].x + tri[1].x + tri[2].x) / 3,
            0,
            (tri[0].z + tri[1].z + tri[2].z) / 3
        );
        // atan2(x, z) gives angle from Z axis. 0 is Front (+Z).
        return Math.atan2(center.x, center.z);
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
        if (!this.allTriangles || this.allTriangles.length === 0) {
            return { min: -0.5, max: 3.5 }; // Fallback
        }
        
        let minY = Infinity;
        let maxY = -Infinity;
        
        this.allTriangles.forEach(tri => {
            tri.forEach(vertex => {
                minY = Math.min(minY, vertex.y);
                maxY = Math.max(maxY, vertex.y);
            });
        });
        
        return { min: minY, max: maxY };
    }
    
    generateTriangleTypeColor(typeSignature) {
        // Generate consistent colors based on strut type signature matching brand colors
        const colors = [
            '#4361ee', '#f72585', '#7209b7', '#4ECDC4', '#FBBF24',
            '#0EA5E9', '#EF4444', '#10b981', '#f78c6b', '#8338ec'
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
                return this.allTriangles.slice(0, this.assemblyStep);
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
        const allTrianglesByHeight = [];
        
        // Collect all triangles with their height levels
        this.triangleTypes.forEach((typeData, typeKey) => {
            typeData.triangles.forEach(triangleData => {
                allTrianglesByHeight.push({
                    triangle: triangleData.triangle,
                    heightLevel: triangleData.heightLevel,
                    azimuth: triangleData.azimuth,
                    isDoor: triangleData.isDoor,
                    type: typeKey
                });
            });
        });
        
        // Sort by height level (ground first), then door last, then azimuth
        allTrianglesByHeight.sort((a, b) => {
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
        const trianglesToShow = Math.min(this.assemblyStep + 1, allTrianglesByHeight.length);
        for (let i = 0; i < trianglesToShow; i++) {
            assembledTriangles.push(allTrianglesByHeight[i].triangle);
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
                opacity: opacity,
                metalness: 0.1,
                roughness: 0.5
            });

            const mesh = new THREE.Mesh(geometry, material);
            
            // Add triangle border edges for better visualization
            this.addTriangleBorders(mesh, tri, triangleTypeInfo);
            
            // Calculate strut info
            const sides = [
                tri[0].distanceTo(tri[1]) * 1000,
                tri[1].distanceTo(tri[2]) * 1000,
                tri[2].distanceTo(tri[0]) * 1000
            ];
            
            const angles = [
                Math.acos((sides[0]**2 + sides[2]**2 - sides[1]**2) / (2 * sides[0] * sides[2])),
                Math.acos((sides[0]**2 + sides[1]**2 - sides[2]**2) / (2 * sides[0] * sides[1])),
                Math.acos((sides[1]**2 + sides[2]**2 - sides[0]**2) / (2 * sides[1] * sides[2]))
            ];

            const strutInfo = [
                { length: sides[0], angle: angles[0], vertices: [tri[0], tri[1]] },
                { length: sides[1], angle: angles[1], vertices: [tri[1], tri[2]] },
                { length: sides[2], angle: angles[2], vertices: [tri[2], tri[0]] }
            ].map(strut => {
                const matchIdx = this.strutTypes.findIndex(st => Math.abs(st.length - strut.length) < 1);
                const typeData = this.strutTypes[matchIdx];
                return {
                    length: strut.length,
                    type: typeData?.type || 'A',
                    color: typeData?.color || '#000000',
                    miterAngle: Math.abs(90 - (strut.angle * 180 / Math.PI)),
                    bevelAngle: typeData?.bevelAngle || 0,
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

            // Create real 3D struts for each triangle face
            strutInfo.forEach((strut, strutIdx) => {
                const isBase = strut.vertices[0].y < 0.01 && strut.vertices[1].y < 0.01;
                // The third vertex of this triangle face (opposite to this strut)
                const thirdVertex = tri[(strutIdx + 2) % 3];
                const strutMesh = this.createRealStrut(strut, thirdVertex, isBase);
                
                // Track strut mesh per face
                const strutKey = `${originalIdx}-${strutIdx}`;
                this.strutMeshes.set(strutKey, strutMesh);
                this.domeGroup.add(strutMesh);
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
    
    createRealStrut(strutInfo, thirdVertex, isBase = false) {
        const v1 = strutInfo.vertices[0]; // The butt end
        const v2 = strutInfo.vertices[1]; // The lap end
        const v3 = thirdVertex;
        const length = v1.distanceTo(v2);
        
        // Calculate basis vectors for the strut orientation
        const U = v2.clone().sub(v1).normalize();
        const N = v2.clone().sub(v1).cross(v3.clone().sub(v1)).normalize();
        
        // X_basis: points outwards in the plane of the face (perpendicular to edge)
        const X_basis = U.clone().cross(N).normalize();
        const Y_basis = U;
        const Z_basis = N;
        
        // Inward direction points from the edge to the center of the triangle
        const I = N.clone().cross(U).normalize();
        
        // Shift board inwards by half its width
        const scaleFactor = 0.5; // Matches scaleFactor in createStrutGeometryForDome
        const visualThickness = isBase ? 1.5 : 1.0;
        const width = (this.strutWidth / 1000) * scaleFactor * visualThickness;
        
        // In the Good Karma system, the butt end is shortened by width / tan(alpha)
        const alpha = strutInfo.angle; // Corner angle at v1 in radians
        const shortening = width / Math.tan(alpha);
        const boardLength = length - shortening;
        
        const miterAngleRad = (strutInfo.miterAngle || 0) * Math.PI / 180;
        const bevelAngleRad = (strutInfo.bevelAngle || 0) * Math.PI / 180;
        
        const strutGeometry = this.createStrutGeometryForDome(boardLength, miterAngleRad, bevelAngleRad, isBase);
        
        let color = strutInfo.color;
        let metalness = 0.3;
        let roughness = 0.4;
        let emissive = 0x000000;
        
        // Boost contrast for base struts so they visually ground the dome
        if (isBase) {
            metalness = 0.1;
            roughness = 0.8;
            color = new THREE.Color(strutInfo.color).lerp(new THREE.Color(0xffffff), 0.2);
        }
        
        const strutMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness: metalness,
            roughness: roughness,
            emissive: emissive
        });
        
        const strutMesh = new THREE.Mesh(strutGeometry, strutMaterial);
        
        // Shift along the edge by shortening / 2 towards the lap end (v2)
        const shiftAlongEdge = U.clone().multiplyScalar(shortening / 2);
        // Shift inwards by width / 2
        const shiftInwards = I.clone().multiplyScalar(width / 2);
        
        const midPoint = v1.clone().add(v2).multiplyScalar(0.5).add(shiftAlongEdge).add(shiftInwards);
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
    
    createStrutGeometryForDome(boardLength, miterAngleRad, bevelAngleRad, isBase = false) {
        // Create rectangular strut geometry matching actual dimensions (Good Karma hubless style)
        // Scale down strut cross-section to be more proportional to dome size
        const scaleFactor = 0.5; // Make struts thinner for better visualization
        
        // Base struts can be drawn slightly thicker for visual grounding
        const visualThickness = isBase ? 1.5 : 1.0;
        const width = (this.strutWidth / 1000) * scaleFactor * visualThickness; // Convert mm to meters and scale
        const height = (this.strutHeight / 1000) * scaleFactor * visualThickness; // Convert mm to meters and scale
        
        // Create box geometry with proper rectangular cross-section
        const geometry = new THREE.BoxGeometry(width, boardLength, height);
        
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        // Apply flat compound cuts to vertices: lap end at y > 0 (miter=0) and butt end at y < 0 (miter=miterAngle)
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            
            if (vertex.y > 0) {
                // Lap end: miter = 0, bevel = bevelAngle
                const newY = boardLength / 2 + vertex.z * Math.tan(bevelAngleRad);
                positions.setY(i, newY);
            } else {
                // Butt end: miter = miterAngle, bevel = bevelAngle
                const newY = -boardLength / 2 - vertex.x * Math.tan(miterAngleRad) - vertex.z * Math.tan(bevelAngleRad);
                positions.setY(i, newY);
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
