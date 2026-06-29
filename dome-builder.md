---
layout: dome
title: "7m Geodesic Dome - Interactive Builder"
permalink: /dome-builder/
---

<main id="dome-app">
    <div class="visual-area">
        <div id="main-dome-view" class="dome-container"></div>
        
        <div id="selection-overlay" class="absolute bottom-8 left-8 right-8 pointer-events-none">
            <div id="triangle-info" class="bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-2xl max-w-md pointer-events-auto hidden">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-sm font-bold text-sky-400 uppercase tracking-wider">Triangle #<span id="triangle-number"></span></h3>
                    <button id="clear-selection" class="text-slate-400 hover:text-white"><i class="bi bi-x-lg"></i></button>
                </div>
                <div id="struts-list" class="space-y-2">
                    <!-- Struts populated by JS -->
                </div>
            </div>
        </div>

        <div class="absolute top-4 left-4 bg-slate-900/50 backdrop-blur p-3 rounded-lg border border-slate-700/50 text-[10px] text-slate-400">
            <div class="flex items-center gap-2 mb-1">
                <span class="w-2 h-2 rounded-full bg-slate-500"></span> Orbit: Left Drag
            </div>
            <div class="flex items-center gap-2 mb-1">
                <span class="w-2 h-2 rounded-full bg-slate-600"></span> Pan: Right Drag
            </div>
            <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-slate-700"></span> Zoom: Scroll
            </div>
        </div>

        <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur p-2 rounded-xl border border-slate-700/80 flex gap-2 shadow-lg z-30">
            <button onclick="domeSimulator.setView('front')" class="w-10 h-10 rounded bg-slate-800 hover:bg-sky-900 border border-slate-600 hover:border-sky-400 flex items-center justify-center text-slate-300 hover:text-white transition-all" title="Front View">
                <i class="bi bi-box-arrow-in-right"></i>
            </button>
            <button onclick="domeSimulator.setView('top')" class="w-10 h-10 rounded bg-slate-800 hover:bg-sky-900 border border-slate-600 hover:border-sky-400 flex items-center justify-center text-slate-300 hover:text-white transition-all" title="Top View">
                <i class="bi bi-caret-down-square"></i>
            </button>
            <button onclick="domeSimulator.setView('diagonal')" class="w-10 h-10 rounded bg-slate-800 hover:bg-sky-900 border border-slate-600 hover:border-sky-400 flex items-center justify-center text-slate-300 hover:text-white transition-all" title="Diagonal View">
                <i class="bi bi-arrows-move"></i>
            </button>
            <button onclick="domeSimulator.setView('inner')" class="w-10 h-10 rounded bg-slate-800 hover:bg-sky-900 border border-slate-600 hover:border-sky-400 flex items-center justify-center text-slate-300 hover:text-white transition-all" title="Inner View">
                <i class="bi bi-bullseye"></i>
            </button>
            <button onclick="domeSimulator.setView('joint')" class="w-10 h-10 rounded bg-slate-800 hover:bg-sky-900 border border-slate-600 hover:border-sky-400 flex items-center justify-center text-slate-300 hover:text-white transition-all" title="Joint Focus">
                <i class="bi bi-zoom-in"></i>
            </button>
            <div class="w-px h-6 bg-slate-700/50 my-auto mx-1"></div>
            <button onclick="domeSimulator.toggleOrigamiMode()" id="btn-blueprint-mode" class="w-10 h-10 rounded bg-slate-800 hover:bg-pink-900 border border-slate-600 hover:border-pink-400 flex items-center justify-center text-slate-300 hover:text-white transition-all" title="Origami View">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <polygon points="8,12 16,12 12,18.93" />
                    <polygon points="8,12 16,12 12,5.07" />
                    <polygon points="8,12 12,18.93 4,18.93" />
                    <polygon points="16,12 12,18.93 20,18.93" />
                </svg>
            </button>
            <button onclick="domeSimulator.exportBlueprintSVG()" id="btn-blueprint-download" class="w-10 h-10 rounded bg-slate-800 hover:bg-pink-900 border border-slate-600 hover:border-pink-400 hidden items-center justify-center text-slate-300 hover:text-white transition-all" title="Download SVG">
                <i class="bi bi-download"></i>
            </button>
            <button onclick="domeSimulator.toggleBlueprintStyle()" id="btn-blueprint-style" class="w-10 h-10 rounded bg-slate-800 hover:bg-pink-900 border border-slate-600 hover:border-pink-400 hidden items-center justify-center text-slate-300 hover:text-white transition-all" title="Switch to Panels (Scissors)">
                <i class="bi bi-scissors"></i>
            </button>
        </div>

        <div id="blueprint-view" class="absolute inset-0 bg-slate-900 z-20 overflow-auto hidden p-8 pt-24">
            <div id="blueprint-controls" class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-700/80 flex gap-6 shadow-2xl z-30 pointer-events-auto">
                <div class="flex items-center gap-3 text-sm font-bold text-slate-300">
                    <span>Scale 1:</span>
                    <span id="blueprint-scale-display" class="font-mono text-sky-400 w-8">20</span>
                    <input type="range" id="blueprint-scale-slider" min="1" max="100" value="20" class="w-32 accent-pink-500">
                </div>
                <div class="w-px h-6 bg-slate-700 my-auto"></div>
                <label class="flex items-center gap-2 text-sm font-bold text-slate-300 cursor-pointer">
                    <input type="checkbox" id="blueprint-flaps-toggle" class="w-4 h-4 text-pink-400 bg-slate-900 border-slate-700 rounded accent-pink-500" checked>
                    Flaps
                </label>
            </div>
            <div id="blueprint-container" class="max-w-4xl mx-auto flex items-center justify-center h-full">
                <!-- SVG layouts generated by JS -->
            </div>
        </div>
    </div>

    <div class="side-panel">
        <div class="flex border-b border-slate-700 text-center text-xs">
            <button id="btn-tab-design" class="tab-btn active flex-1 py-3" onclick="domeSimulator.switchTab('design')" title="Design">
                <i class="bi bi-sliders2"></i><span class="hidden md:inline ml-1">Design</span>
            </button>
            <button id="btn-tab-inventory" class="tab-btn flex-1 py-3" onclick="domeSimulator.switchTab('inventory')" title="Inventory">
                <i class="bi bi-box"></i><span class="hidden md:inline ml-1">Inventory</span>
            </button>
            <button id="btn-tab-assembly" class="tab-btn flex-1 py-3" onclick="domeSimulator.switchTab('assembly')" title="Assembly">
                <i class="bi bi-tools"></i><span class="hidden md:inline ml-1">Assembly</span>
            </button>

        </div>

        <!-- Design Tab -->
        <div id="tab-design" class="panel-content">
            <div class="section-title"><i class="bi bi-gear-fill"></i> Dome Parameters</div>
            <div class="param-group">
                <div class="param-item">
                    <div class="param-row">
                        <span class="param-label">Frequency (V)</span>
                        <span class="param-value" id="frequency-display">3</span>
                    </div>
                    <input type="range" id="frequency-slider" min="1" max="6" value="3" class="slider" step="1">
                </div>
                <div class="param-item mt-4">
                    <div class="grid grid-cols-3 gap-2 text-center mb-1">
                        <div class="text-[10px] font-bold text-slate-400 uppercase">Base Shape</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase">Structure</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase">Geometry</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div class="flex gap-1" id="shape-toggle-group">
                            <button id="btn-shape-icosahedron" class="flex-1 py-1 bg-slate-900 border border-slate-700 rounded text-slate-400 hover:text-white hover:border-sky-400 transition-colors" title="Icosahedron">
                                <i class="bi bi-hexagon-fill text-sm"></i>
                            </button>
                            <button id="btn-shape-octahedron" class="flex-1 py-1 bg-slate-900 border border-slate-700 rounded text-slate-400 hover:text-white hover:border-sky-400 transition-colors" title="Octahedron">
                                <i class="bi bi-diamond-fill text-sm"></i>
                            </button>
                        </div>
                        <div class="flex gap-1" id="struct-toggle-group">
                            <button id="btn-struct-geodesic" class="flex-1 py-1 bg-slate-900 border border-slate-700 rounded text-slate-400 hover:text-white hover:border-sky-400 transition-colors" title="Geodesic (Triangles)">
                                <i class="bi bi-triangle-fill text-sm"></i>
                            </button>
                            <button id="btn-struct-fullerene" class="flex-1 py-1 bg-slate-900 border border-slate-700 rounded text-slate-400 hover:text-white hover:border-sky-400 transition-colors" title="Fullerene (Hexagons)">
                                <i class="bi bi-hexagon-fill text-sm"></i>
                            </button>
                        </div>
                        <div class="flex gap-1" id="portion-toggle-group">
                            <button id="btn-portion-auto" class="flex-1 py-1 bg-slate-900 border border-slate-700 rounded text-slate-400 hover:text-white hover:border-sky-400 transition-colors" title="Dome (Auto)">
                                <i class="bi bi-circle-half text-sm"></i>
                            </button>
                            <button id="btn-portion-full" class="flex-1 py-1 bg-slate-900 border border-slate-700 rounded text-slate-400 hover:text-white hover:border-sky-400 transition-colors" title="Full Sphere (1/1)">
                                <i class="bi bi-circle-fill text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="param-item mt-4">
                    <div class="param-row">
                        <span class="param-label">Diameter (m)</span>
                        <span class="param-value" id="diameter-display">7m</span>
                    </div>
                    <input type="range" id="diameter-slider" min="0.5" max="20" value="7" class="slider" step="0.5">
                </div>
                <div class="param-item mt-4">
                    <div class="param-row">
                        <span class="param-label">Camera Zoom</span>
                        <span class="param-value" id="zoom-display">1.0x</span>
                    </div>
                    <input type="range" id="zoom-slider" min="0.1" max="50.0" value="1.0" class="slider" step="0.1">
                </div>
            </div>

            <div class="section-title mt-8"><i class="bi bi-rulers"></i> Strut Dimensions (mm)</div>
            <div class="param-group">
                <div class="param-item">
                    <div class="param-row">
                        <span class="param-label">Strut Width</span>
                        <span class="param-value" id="strut-width-display">40mm</span>
                    </div>
                    <input type="range" id="strut-width" min="20" max="100" value="40" class="slider">
                </div>
                <div class="param-item">
                    <div class="param-row">
                        <span class="param-label">Strut Height</span>
                        <span class="param-value" id="strut-height-display">90mm</span>
                    </div>
                    <input type="range" id="strut-height" min="40" max="200" value="90" class="slider">
                </div>
            </div>

            <div class="param-group mt-6">
                <div class="flex justify-between items-center mb-2">
                    <span class="param-label">Joint Style</span>
                </div>
                <div class="flex gap-2">
                    <button id="joint-karma" class="flex-1 py-1.5 px-2 text-[10px] font-bold rounded border border-sky-400 bg-sky-400/10 text-sky-400 transition-colors">Good Karma</button>
                    <button id="joint-double" class="flex-1 py-1.5 px-2 text-[10px] font-bold rounded border border-slate-700 bg-slate-800 text-slate-400 transition-colors">Double Cut</button>
                </div>
            </div>

            <div class="param-group mt-6" id="flat-base-container">
                <div class="param-item">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="flat-base-toggle" class="w-4 h-4 text-sky-400 bg-slate-900 border-slate-700 rounded" checked>
                        <span class="param-label !mb-0" style="margin-bottom: 0;">Flat Base (Bevel 0°)</span>
                    </label>
                </div>

            </div>

            <div class="footer-info mt-8">
                <p><strong>Note:</strong> Adjusting frequency recalculates all geodesic points. Strut dimensions affect the compound angle calculations for the hubless system.</p>
            </div>
        </div>

        <!-- Inventory Tab -->
        <div id="tab-inventory" class="panel-content hidden">
            <div class="section-title"><i class="bi bi-list-check"></i> Strut Cutting List</div>
            <div id="inventory-filters"></div>
            <div id="strut-types-list" class="space-y-3 mb-8">
                <!-- Populated by JS -->
            </div>

            <div class="section-title"><i class="bi bi-triangle-half"></i> Triangle Types</div>
            <div id="triangle-types-grid" class="grid grid-cols-1 gap-3">
                <!-- Populated by JS -->
            </div>
        </div>


        <!-- Assembly Tab -->
        <div id="tab-assembly" class="panel-content hidden">
            <div class="section-title"><i class="bi bi-diagram-3"></i> Construction Progress</div>
            
            <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Progress</span>
                    <span id="assembly-progress-percent" class="text-xs font-mono text-sky-400">0%</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-1.5 mb-4">
                    <div id="assembly-progress-bar" class="bg-sky-400 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
                </div>
                <div class="flex gap-2">
                    <button id="assembly-mode-toggle" class="flex-1 py-2 border border-sky-400 text-sky-400 text-[10px] font-black uppercase tracking-tighter rounded hover:bg-sky-400 hover:text-slate-900 transition-colors">
                        Enter Assembly Mode
                    </button>
                    <button id="assembly-auto" class="px-4 py-2 border border-slate-700 text-slate-400 text-[10px] font-bold rounded hover:bg-slate-800">
                        <i class="bi bi-play-fill"></i>
                    </button>
                </div>
            </div>

            <div id="assembly-steps-container" class="space-y-3">
                <!-- Populated by JS with segments -->
            </div>
        </div>
    </div>

</main>
