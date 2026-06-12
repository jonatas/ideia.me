
class CamperSimulator {
    constructor() {
        this.frequency = 3;
        this.apexHeight = 900;
        this.taperStrength = 0.45;
        this.totalStretch = 3500;
        this.cabinClearance = 600;
        
        this.truckWidth = 1860;
        this.truckLength = 1560;
        this.cabinExtension = 1850;
        this.bedRailHeightFromGround = 1370;

        this.vertices = [];
        this.faces = [];
        this.struts = [];
        this.strutTypes = [];

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.setupEventListeners();
        this.calculate();
        window.addEventListener('resize', () => this.renderSVG());
    }

    setupEventListeners() {
        const bind = (id, prop, valId, scale = 1) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                this[prop] = parseFloat(e.target.value) / scale;
                const displayEl = document.getElementById(valId);
                if (displayEl) {
                    displayEl.textContent = (scale === 1 ? Math.round(this[prop]) : this[prop].toFixed(2)) + (scale === 1 ? "mm" : "");
                }
                this.calculate();
            });
        };

        bind('param-apex', 'apexHeight', 'val-apex');
        bind('param-taper', 'taperStrength', 'val-taper', 100);
        bind('param-stretch', 'totalStretch', 'val-stretch');
        bind('param-clearance', 'cabinClearance', 'val-clearance');
    }

    calculate() {
        this.generateBaseGeometry();
        this.applyOverlanderTransform();
        this.decomposeStruts();
        this.updateUI();
    }

    generateBaseGeometry() {
        const radius = 1000;
        const phi = (1 + Math.sqrt(5)) / 2;
        this.vertices = [
            new THREE.Vector3(-1, phi, 0), new THREE.Vector3(1, phi, 0),
            new THREE.Vector3(-1, -phi, 0), new THREE.Vector3(1, -phi, 0),
            new THREE.Vector3(0, -1, phi), new THREE.Vector3(0, 1, phi),
            new THREE.Vector3(0, -1, -phi), new THREE.Vector3(0, 1, -phi),
            new THREE.Vector3(phi, 0, -1), new THREE.Vector3(phi, 0, 1),
            new THREE.Vector3(-phi, 0, -1), new THREE.Vector3(-phi, 0, 1)
        ].map(v => v.normalize().multiplyScalar(radius));

        this.faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ];

        for (let f = 1; f < this.frequency; f++) {
            let newFaces = [];
            let midpoints = new Map();
            const getMid = (v1, v2) => {
                const k = v1 < v2 ? `${v1}_${v2}` : `${v2}_${v1}`;
                if (midpoints.has(k)) return midpoints.get(k);
                const mid = new THREE.Vector3().addVectors(this.vertices[v1], this.vertices[v2]).normalize().multiplyScalar(radius);
                this.vertices.push(mid);
                midpoints.set(k, this.vertices.length - 1);
                return this.vertices.length - 1;
            };
            this.faces.forEach(face => {
                const m01 = getMid(face[0], face[1]);
                const m12 = getMid(face[1], face[2]);
                const m20 = getMid(face[2], face[0]);
                newFaces.push([face[0], m01, m20], [face[1], m12, m01], [face[2], m20, m12], [m01, m12, m20]);
            });
            this.faces = newFaces;
        }
    }

    applyOverlanderTransform() {
        const totalZ = this.totalStretch;
        const zScale = totalZ / 2000;
        const yScale = this.apexHeight / 1000;

        this.vertices.forEach(v => {
            v.z *= zScale;
            v.y *= yScale;
            const zNorm = (v.z + totalZ/2) / totalZ;
            const taper = 1.0 - (Math.max(0, 1.0 - zNorm) * this.taperStrength);
            v.y *= taper;
        });

        const zStartCabin = -500; // aligns with front edge of bed where cabin starts
        const zFullCabin = -900; // slope up over the cabin windshield

        this.vertices.forEach(v => {
            let minY = -100; // base drops 100mm below rail

            if (v.z < zFullCabin) {
                // over the cabin
                minY = this.cabinClearance;
            } else if (v.z < zStartCabin) {
                // smooth transition
                const t = (zStartCabin - v.z) / (zStartCabin - zFullCabin);
                const smoothT = t * t * (3 - 2 * t);
                minY = -100 + smoothT * (this.cabinClearance + 100);
            }

            if (v.y < minY) v.y = minY;
        });
    }

    decomposeStruts() {
        const edgeMap = new Map();
        const faceNormals = this.faces.map(face => {
            const v1 = this.vertices[face[0]], v2 = this.vertices[face[1]], v3 = this.vertices[face[2]];
            return new THREE.Vector3().subVectors(v2, v1).cross(new THREE.Vector3().subVectors(v3, v1)).normalize();
        });

        this.faces.forEach((face, fIdx) => {
            for (let i = 0; i < 3; i++) {
                const v1Idx = face[i], v2Idx = face[(i + 1) % 3];
                const key = v1Idx < v2Idx ? `${v1Idx}_${v2Idx}` : `${v2Idx}_${v1Idx}`;
                if (!edgeMap.has(key)) {
                    edgeMap.set(key, { v1Idx, v2Idx, faces: [] });
                }
                edgeMap.get(key).faces.push(fIdx);
            }
        });

        const strutData = [];
        edgeMap.forEach((edge) => {
            const p1 = this.vertices[edge.v1Idx], p2 = this.vertices[edge.v2Idx];
            const length = p1.distanceTo(p2);

            let bevel = 0, miter = 0;
            if (edge.faces.length === 2) {
                const n1 = faceNormals[edge.faces[0]], n2 = faceNormals[edge.faces[1]];
                const dihedral = n1.angleTo(n2) * 180 / Math.PI;
                bevel = dihedral / 2; 

                const dir = p2.clone().sub(p1).normalize();
                const faceNormal = n1.clone().add(n2).normalize();
                const vertexNormal = p1.clone().normalize();
                const perpendicular = new THREE.Vector3().crossVectors(dir, faceNormal).normalize();
                miter = Math.abs(perpendicular.angleTo(vertexNormal) * 180 / Math.PI - 90);
            }

            strutData.push({ length, bevel, miter });
        });

        const types = [];
        strutData.forEach(s => {
            const existing = types.find(t => Math.abs(t.length - s.length) < 2);
            if (existing) {
                existing.count++;
            } else {
                types.push({ ...s, count: 1, id: String.fromCharCode(65 + types.length) });
            }
        });

        this.strutTypes = types.sort((a, b) => a.length - b.length);
        this.struts = strutData;
    }

    updateUI() {
        this.renderSVG();
        const inventory = document.getElementById('inventory-body');
        if (inventory) {
            inventory.innerHTML = '';
            this.strutTypes.forEach(t => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><span class="badge-type type-${t.id.toLowerCase()}">${t.id}</span></td>
                    <td class="font-mono">${t.length.toFixed(1)}mm</td>
                    <td>${t.count}</td>
                    <td class="text-xs text-slate-500">${t.miter.toFixed(1)}° / ${t.bevel.toFixed(1)}°</td>
                `;
                inventory.appendChild(row);
            });
        }

        const guide = document.getElementById('cutting-guide-container');
        if (guide) {
            guide.innerHTML = '';
            this.strutTypes.forEach(t => {
                const card = document.createElement('div');
                card.className = 'data-card';
                card.innerHTML = `
                    <div class="flex justify-between items-center mb-3">
                        <span class="font-bold text-primary">STRUT TYPE ${t.id}</span>
                        <span class="text-xs bg-slate-800 px-2 py-1 rounded">QTY: ${t.count}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <div class="text-slate-500 mb-1">Miter Saw Setting</div>
                            <div class="text-lg font-mono text-white">${t.miter.toFixed(1)}°</div>
                        </div>
                        <div>
                            <div class="text-slate-500 mb-1">Bevel (Tilt) Setting</div>
                            <div class="text-lg font-mono text-white">${t.bevel.toFixed(1)}°</div>
                        </div>
                    </div>
                `;
                guide.appendChild(card);
            });
        }
    }

    renderSVG() {
        const truckGroup = document.getElementById('truck-group');
        const geodesicGroup = document.getElementById('geodesic-group');
        const dimGroup = document.getElementById('dimensions-group');
        if (!truckGroup || !geodesicGroup) return;

        truckGroup.innerHTML = '';
        geodesicGroup.innerHTML = '';
        dimGroup.innerHTML = '';

        const scale = 0.22; 
        const offsetX = 800; 
        const offsetY = 600; 

        // --- 1. Draw Ford Ranger 2021 Profile (Stylized SVG) ---
        const rangerSVG = `
            <!-- Background Outline -->
            <path d="M -2800 0 L -2700 -200 L -2500 -250 L -2000 -250 L -1800 -400 
                     L -1500 -1200 L -800 -1250 L 0 -1250 L 200 -1200 L 300 -600 
                     L 2200 -600 L 2300 0 Z" 
                  fill="#1e293b" stroke="#334155" stroke-width="5" transform="translate(${offsetX}, ${offsetY}) scale(${scale})"/>

            <!-- Bed Detail -->
            <rect x="${offsetX + 300*scale}" y="${offsetY - 600*scale}" width="${2000*scale}" height="${600*scale}" fill="#334155" opacity="0.3" stroke="#475569" stroke-width="1" />

            <!-- Cabin Detail -->
            <path d="M 0 0 L -1800 0 L -1800 -400 L -1500 -${this.cabinClearance} L 0 -${this.cabinClearance} Z" 
                  fill="#334155" opacity="0.4" stroke="#475569" stroke-width="1" transform="translate(${offsetX + 300*scale}, ${offsetY - 600*scale})"/>

            <!-- Wheels -->
            <circle cx="${offsetX - 1800*scale}" cy="${offsetY}" r="${380*scale}" fill="#0f172a" stroke="#334155" stroke-width="4" />
            <circle cx="${offsetX + 1500*scale}" cy="${offsetY}" r="${380*scale}" fill="#0f172a" stroke="#334155" stroke-width="4" />

            <!-- Bed Rail Reference Line -->
            <line x1="${offsetX - 3000*scale}" y1="${offsetY - 600*scale}" x2="${offsetX + 3000*scale}" y2="${offsetY - 600*scale}" stroke="#334155" stroke-dasharray="10,10" />
        `;
        truckGroup.innerHTML = rangerSVG;

        // --- 2. Draw Geodesic Shell ---
        const railX = offsetX + 300*scale; // Alignment with bed start
        const railY = offsetY - 600*scale;

        this.faces.forEach(face => {
            const points = face.map(vIdx => {
                const v = this.vertices[vIdx];
                const x = railX + (v.z + 500) * scale; 
                const y = railY - v.y * scale;
                return `${x},${y}`;
            });

            const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            poly.setAttribute("points", points.join(" "));
            poly.setAttribute("fill", "rgba(56, 189, 248, 0.15)");
            poly.setAttribute("stroke", "#38bdf8");
            poly.setAttribute("stroke-width", "1.5");
            geodesicGroup.appendChild(poly);
        });

        // --- 3. Dynamic Dimensions ---
        const apexY = railY - this.apexHeight * scale;
        const dimX = railX + 1000*scale;

        const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hLine.setAttribute("x1", dimX); hLine.setAttribute("y1", railY);
        hLine.setAttribute("x2", dimX); hLine.setAttribute("y2", apexY);
        hLine.setAttribute("stroke", "#fb7185"); hLine.setAttribute("stroke-width", "2");
        dimGroup.appendChild(hLine);

        const hText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        hText.setAttribute("x", dimX + 10); hText.setAttribute("y", (railY + apexY)/2);
        hText.setAttribute("fill", "#fb7185"); hText.setAttribute("font-size", "14"); hText.setAttribute("font-weight", "bold");
        hText.textContent = `${Math.round(this.apexHeight)}mm`;
        dimGroup.appendChild(hText);
    }
}

new CamperSimulator();
