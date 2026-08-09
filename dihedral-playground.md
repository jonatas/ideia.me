---
layout: dihedral
title: "Dihedral Playground"
permalink: /dihedral-playground/
---

<main id="dihedral-app">
    <!-- Left Panel: Inventory -->
    <div class="side-panel custom-scrollbar">
        <div class="panel-content">
            <div class="section-title"><i class="bi bi-box"></i> Inventory</div>
            
            <div class="mb-6">
                <h3 class="text-[10px] font-bold text-slate-400 uppercase mb-2">My Cuts (from wood-cuts.html)</h3>
                <div id="inventory-cuts" class="space-y-2">
                    <!-- Populated by JS -->
                    <p class="text-xs text-slate-500 italic" id="empty-cuts-msg">No saved cuts found.</p>
                </div>
            </div>

            <div class="mb-6">
                <h3 class="text-[10px] font-bold text-slate-400 uppercase mb-2">Primitives</h3>
                <div class="grid grid-cols-2 gap-2">
                    <button class="add-primitive-btn p-2 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:text-white hover:border-sky-400 transition-colors" data-type="cube">
                        Block
                    </button>
                    <button class="add-primitive-btn p-2 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:text-white hover:border-sky-400 transition-colors" data-type="strut">
                        Strut
                    </button>
                </div>
            </div>

            <div class="mb-6">
                <h3 class="text-[10px] font-bold text-slate-400 uppercase mb-2">Assemblies</h3>
                <div class="grid grid-cols-2 gap-2">
                    <button class="add-assembly-btn p-2 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:text-white hover:border-sky-400 transition-colors" data-type="triangle">
                        Triangle
                    </button>
                    <button class="add-assembly-btn p-2 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:text-white hover:border-sky-400 transition-colors" data-type="square">
                        Square
                    </button>
                    <button class="add-assembly-btn p-2 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:text-white hover:border-sky-400 transition-colors" data-type="icosahedron">
                        Icosahedron
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Center Panel: 3D Workspace -->
    <div class="visual-area">
        <!-- Floating Toolbar -->
        <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur p-2 rounded-xl border border-slate-700/80 flex gap-2 shadow-lg z-30">
            <button id="tool-translate" class="w-10 h-10 rounded bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-900 hover:border-sky-400 transition-all active-tool" title="Move (T)">
                <i class="bi bi-arrows-move"></i>
            </button>
            <button id="tool-rotate" class="w-10 h-10 rounded bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-900 hover:border-sky-400 transition-all" title="Rotate (R)">
                <i class="bi bi-arrow-clockwise"></i>
            </button>
            
            <div class="w-px h-6 bg-slate-700/50 my-auto mx-1"></div>
            
            <button id="action-glue" class="w-10 h-10 rounded bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-green-900 hover:border-green-400 transition-all" title="Glue Selected (G)">
                <i class="bi bi-magnet-fill"></i>
            </button>
            <button id="action-flip" class="w-10 h-10 rounded bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-orange-900 hover:border-orange-400 transition-all" title="Flip Face (F)">
                <i class="bi bi-symmetry-horizontal"></i>
            </button>
            <button id="action-magic" class="w-10 h-10 rounded bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-pink-900 hover:border-pink-400 transition-all" title="Auto-Complete Shape (Space)">
                <i class="bi bi-magic"></i>
            </button>
            
            <div class="w-px h-6 bg-slate-700/50 my-auto mx-1"></div>

            <button id="action-delete" class="w-10 h-10 rounded bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-900/30 hover:border-red-400 transition-all" title="Delete (Del/Backspace)">
                <i class="bi bi-trash"></i>
            </button>
        </div>

        <div id="main-canvas" class="playground-container"></div>
    </div>

    <!-- Right Panel: Inspector -->
    <div class="side-panel custom-scrollbar" style="border-left: 1px solid #334155; border-right: none;">
        <div class="panel-content" id="inspector-panel">
            <div class="section-title"><i class="bi bi-sliders"></i> Inspector</div>
            
            <div id="no-selection-msg" class="text-xs text-slate-500 italic mt-4">
                Select an object to inspect its properties.
            </div>

            <div id="selection-details" class="hidden">
                <h3 class="text-sm font-bold text-sky-400 mb-4" id="inspector-title">Piece</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Position</label>
                        <div class="grid grid-cols-3 gap-2">
                            <input type="number" id="pos-x" class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full" placeholder="X">
                            <input type="number" id="pos-y" class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full" placeholder="Y">
                            <input type="number" id="pos-z" class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full" placeholder="Z">
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Rotation</label>
                        <div class="grid grid-cols-3 gap-2">
                            <input type="number" id="rot-x" class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full" placeholder="X">
                            <input type="number" id="rot-y" class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full" placeholder="Y">
                            <input type="number" id="rot-z" class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full" placeholder="Z">
                        </div>
                    </div>

                    <div class="border-t border-slate-700 pt-4 mt-4" id="parametric-controls">
                        <!-- Filled dynamically based on selection -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>
