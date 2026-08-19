---
layout: default
title: "Merkaba Builder - Interactive 3D Simulator"
permalink: /merkaba/
---

<style>
    :root {
        --bg-color: #0f172a;
        --card-bg: #1e293b;
        --text-color: #f1f5f9;
        --primary-color: #38bdf8;
        --header-height: 60px;
    }

    #merkaba-app {
        height: calc(100vh - var(--header-height));
        display: grid;
        grid-template-columns: 1fr 340px;
        overflow: hidden;
        background-color: var(--bg-color);
        color: var(--text-color);
    }

    @media (max-width: 768px) {
        #merkaba-app {
            display: flex;
            flex-direction: column;
        }
        .visual-area { height: 50vh; }
        .side-panel { height: 50vh; border-left: none; border-top: 1px solid #334155; }
    }

    .visual-area {
        padding: 20px;
        display: flex;
        flex-direction: column;
        background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
        position: relative;
    }

    .canvas-container {
        width: 100%;
        height: 100%;
        background: #000;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border: 1px solid #334155;
    }

    .side-panel {
        background: #1e293b;
        border-left: 1px solid #334155;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .panel-content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
    }

    .section-title {
        font-size: 0.75rem;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 16px;
    }

    .param-item { margin-bottom: 16px; }
    .param-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .param-label { font-size: 0.85rem; color: #94a3b8; }
    .param-value { font-size: 0.85rem; font-weight: 600; color: var(--primary-color); font-family: monospace; }
    .slider { width: 100%; accent-color: var(--primary-color); }

    .tab-btn {
        flex: 1;
        padding: 1rem 0.5rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #94a3b8;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
        background: none;
        border: none;
        cursor: pointer;
    }
    .tab-btn:hover { color: #fff; background: rgba(255,255,255,0.02); }
    .tab-btn.active { color: var(--primary-color); border-bottom: 2px solid var(--primary-color); background: rgba(56,189,248,0.05); }

    /* Custom scrollbar */
    .panel-content::-webkit-scrollbar { width: 6px; }
    .panel-content::-webkit-scrollbar-track { background: transparent; }
    .panel-content::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
</style>

<!-- Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>

<div id="merkaba-app">
    <div class="visual-area">
        <div id="main-canvas" class="canvas-container"></div>
        <div class="absolute top-4 left-4 bg-slate-900/50 p-3 rounded text-[10px] text-slate-400 pointer-events-none">
            Drag to rotate | Scroll to zoom | Click to pause
        </div>
        <div id="overlap-warning" class="hidden absolute top-16 left-4 bg-red-900/90 text-red-200 p-3 rounded text-xs border border-red-500 max-w-xs shadow-lg">
            <i class="bi bi-exclamation-triangle-fill mr-1"></i> <strong>Overlapping Cuts Detected!</strong>
            <p class="mt-1 opacity-80">Struts highlighted in red are physically occupying the same space at the joints and will not fit. Apply Good Karma cuts to resolve.</p>
        </div>
    </div>
    <div class="side-panel">
        <div class="flex border-b border-slate-700 text-center">
            <button id="btn-tab-design" class="tab-btn active" onclick="switchTab('design')">Design</button>
            <button id="btn-tab-inventory" class="tab-btn" onclick="switchTab('inventory')">Inventory</button>
        </div>
        
        <div id="tab-design" class="panel-content">
            <div class="section-title">Fractal Parameters</div>
            <div class="param-item">
                <div class="param-row">
                    <span class="param-label">Recursion Level</span>
                    <span class="param-value" id="recursion-display">1</span>
                </div>
                <input type="range" id="recursion-slider" min="1" max="4" value="1" class="slider">
            </div>
            <div class="param-item mt-4">
                <div class="param-row">
                    <span class="param-label">Base Size (mm)</span>
                    <span class="param-value" id="size-display">500</span>
                </div>
                <input type="range" id="size-slider" min="100" max="2000" value="500" class="slider" step="50">
            </div>
            
            <div class="section-title mt-8">Wood Dimensions</div>
            <div class="param-item">
                <div class="param-row">
                    <span class="param-label">Strut Width (mm)</span>
                    <span class="param-value" id="width-display">20</span>
                </div>
                <input type="range" id="width-slider" min="5" max="100" value="20" class="slider">
            </div>
            <div class="param-item mt-4">
                <div class="param-row">
                    <span class="param-label">Strut Height (mm)</span>
                    <span class="param-value" id="height-display">20</span>
                </div>
                <input type="range" id="height-slider" min="5" max="100" value="20" class="slider">
            </div>

            <label class="flex items-center text-sm text-slate-300 mt-6 cursor-pointer bg-slate-800 p-3 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
                <input type="checkbox" id="good-karma-toggle" class="mr-3 w-4 h-4 accent-sky-500">
                <span>Apply Good Karma / Miter Cuts</span>
            </label>

            <div class="mt-6 text-xs text-slate-400 bg-slate-800 p-4 rounded-lg">
                <p>This builder creates a fractal Merkaba (Star Tetrahedron) without intersecting center struts.</p>
                <p class="mt-2">Instead of overlapping, it places solid tetrahedra at the vertices, creating a continuous hollow frame or a true fractal structure.</p>
            </div>
        </div>
        
        <div id="tab-inventory" class="panel-content hidden">
            <div class="section-title">Cut List</div>
            <div id="inventory-list" class="space-y-4 mb-8">
                <!-- Filled by JS -->
            </div>
            
            <div class="mt-8 border-t border-slate-700 pt-6">
                <h3 class="text-sm font-bold text-emerald-400 mb-4">Alternative: The 36-Piece Method</h3>
                <p class="text-[11px] text-slate-300 mb-4">If you prefer to build the Merkaba by constructing a central Octahedron core and attaching 8 small Tetrahedrons to its faces, use this receipt:</p>
                <div class="space-y-4">
                    <div class="bg-slate-800/50 p-3 rounded border border-slate-700/50 text-xs">
                        <h4 class="font-bold text-sky-300 mb-1">1. The Core: Regular Octahedron</h4>
                        <ul class="list-disc list-inside space-y-1 text-slate-400">
                            <li><strong>Qty:</strong> 12 struts</li>
                            <li><strong>Miter:</strong> <span class="text-white font-mono bg-slate-900 px-1 rounded">35.3°</span></li>
                            <li>4 pieces meet at each inner vertex.</li>
                        </ul>
                    </div>
                    <div class="bg-slate-800/50 p-3 rounded border border-slate-700/50 text-xs">
                        <h4 class="font-bold text-pink-300 mb-1">2. The Points: 8 Tetrahedrons</h4>
                        <ul class="list-disc list-inside space-y-1 text-slate-400">
                            <li><strong>Qty:</strong> 24 struts</li>
                            <li><strong>Miter:</strong> <span class="text-white font-mono bg-slate-900 px-1 rounded">28.6°</span></li>
                            <li><strong>Bevel:</strong> <span class="text-white font-mono bg-slate-900 px-1 rounded">9.6°</span></li>
                            <li>Attach these 8 pyramids to the core faces.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="{{ '/js/merkaba-simulator.js' | relative_url }}"></script>
