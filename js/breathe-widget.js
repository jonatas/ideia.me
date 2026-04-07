class BreatheWidget {
    constructor(containerId, configId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.config = PREDEFINED_CONFIGS.find(c => c.id === configId) || PREDEFINED_CONFIGS[0];
        this.active = false;
        this.raf = null;
        this.t0 = null;
        this.cycleMs = this.config.phases.reduce((s, p) => s + p.ms, 0);
        this.lastElapsed = 0;

        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="breathe-widget-inner" style="position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <div class="breathe-ring-wrapper" style="position: relative; width: 120px; height: 120px; cursor: pointer;">
                    <div class="breathe-glow" style="position: absolute; inset: -10px; border-radius: 50%; pointer-events: none;"></div>
                    <div class="breathe-ring" style="width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 38% 32%, ${this.config.idle}, #1E3A8A); transform: scale(0.72); transition: transform 0.1s linear;">
                        <span class="breathe-count" style="color: white; font-size: 1.5rem; font-weight: 700;"></span>
                    </div>
                </div>
                <div style="text-align: center;">
                    <div class="breathe-phase" style="font-size: 0.9rem; font-weight: 600; letter-spacing: 0.1em; color: var(--yoga-teal); margin-bottom: 4px; text-transform: uppercase;">${this.config.name}</div>
                    <div class="breathe-hint" style="color: var(--text-muted); font-size: 0.8rem;">Click circle to start</div>
                </div>
            </div>
        `;

        this.ring = this.container.querySelector('.breathe-ring');
        this.glow = this.container.querySelector('.breathe-glow');
        this.count = this.container.querySelector('.breathe-count');
        this.phase = this.container.querySelector('.breathe-phase');
        this.hint = this.container.querySelector('.breathe-hint');
        this.wrapper = this.container.querySelector('.breathe-ring-wrapper');

        this.wrapper.addEventListener('click', () => this.toggle());
    }

    toggle() {
        this.active = !this.active;
        if (this.active) {
            this.t0 = null;
            this.lastElapsed = 0;
            this.raf = requestAnimationFrame((now) => this.tick(now));
        } else {
            cancelAnimationFrame(this.raf);
            this.reset();
        }
    }

    reset() {
        this.ring.style.transform = 'scale(0.72)';
        this.ring.style.background = `radial-gradient(circle at 38% 32%, ${this.config.idle}, #1E3A8A)`;
        this.glow.style.boxShadow = 'none';
        this.count.textContent = '';
        this.phase.textContent = this.config.name.toUpperCase();
        this.hint.textContent = 'Click circle to start';
    }

    ease(t) { return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t; }
    lerp(a, b, t) { return a + (b-a)*t; }

    tick(now) {
        if (!this.active) return;
        if (!this.t0) this.t0 = now;
        let totalElapsed = now - this.t0;
        let elapsed = totalElapsed % this.cycleMs;
        
        let acc = 0, ph, pe;
        for (let i = 0; i < this.config.phases.length; i++) {
            if (elapsed < acc + this.config.phases[i].ms) { 
                ph = this.config.phases[i]; 
                pe = elapsed - acc; 
                break; 
            }
            acc += this.config.phases[i].ms;
        }

        let t  = this.ease(pe / ph.ms);
        let sc = this.lerp(ph.s0, ph.s1, t);
        let rem = Math.ceil((ph.ms - pe) / 1000);
        
        this.ring.style.transform = `scale(${sc})`;
        this.ring.style.background = `radial-gradient(circle at 38% 32%, ${ph.color}, #1E3A8A)`;
        this.glow.style.boxShadow = `0 0 ${Math.round(20 * sc)}px ${ph.color}55`;
        
        this.count.textContent = rem > 0 ? rem : '';
        this.phase.textContent = ph.label;
        this.phase.style.color = ph.color;
        this.hint.textContent = ph.hint;

        this.raf = requestAnimationFrame((now) => this.tick(now));
    }
}
