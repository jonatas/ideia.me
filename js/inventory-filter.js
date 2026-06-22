class InventoryFilter {
    /**
     * @param {HTMLElement} container 
     * @param {Array} strutTypes Array of { id: string, color: string, count: number, length: number, miter: number, bevel: number }
     * @param {Function} onFilterChange Callback when active filter changes (passes id or null)
     */
    constructor(container, strutTypes, onFilterChange) {
        this.container = container;
        this.strutTypes = strutTypes;
        this.onFilterChange = onFilterChange;
        this.activeFilter = null;
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        this.container.className = 'flex flex-wrap gap-2 mb-4';

        this.strutTypes.forEach(type => {
            const btn = document.createElement('button');
            const isActive = this.activeFilter === type.id;
            
            btn.className = `group relative flex items-center justify-center w-10 h-10 rounded-full font-bold text-xs border-2 transition-all cursor-pointer shadow-lg
                ${isActive ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}
                ${this.activeFilter && !isActive ? 'opacity-30' : ''}`;
            
            // Set colors dynamically
            btn.style.backgroundColor = `${type.color}22`;
            btn.style.borderColor = type.color;
            btn.style.color = type.color;
            
            btn.innerHTML = `
                <span>${type.count}</span>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div class="text-[10px] text-white flex justify-between border-b border-slate-700 pb-1 mb-1">
                        <strong style="color: ${type.color}">Type ${type.id}</strong>
                        <span class="text-slate-400">Qty: ${type.count}</span>
                    </div>
                    <div class="text-[10px] text-slate-300 grid grid-cols-2 gap-1 text-left">
                        <span class="text-slate-500">Len:</span> <span class="font-mono text-primary">${type.length.toFixed(1)}</span>
                        <span class="text-slate-500">Miter:</span> <span class="font-mono" style="color: #fb7185">${type.miter.toFixed(1)}°</span>
                        <span class="text-slate-500">Bevel:</span> <span class="font-mono" style="color: #34d399">${type.bevel.toFixed(1)}°</span>
                    </div>
                </div>
            `;

            btn.onclick = () => {
                if (this.activeFilter === type.id) {
                    this.activeFilter = null;
                } else {
                    this.activeFilter = type.id;
                }
                this.render();
                if (this.onFilterChange) {
                    this.onFilterChange(this.activeFilter);
                }
            };

            this.container.appendChild(btn);
        });
    }
}
