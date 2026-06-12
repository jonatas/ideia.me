
class CamperSimulator {
    constructor() {
        this.frequency = 2;
        this.apexHeight = 1931;
        this.taperStrength = 0.00;
        this.bedLength = 3000;
        this.caboverOverhang = 1626;
        this.cabinClearance = 738;
        this.rearSquaring = 0.43;
        
        this.truckWidth = 1860;
        this.truckLength = 1560;
        this.cabinExtension = 1850;
        this.bedRailHeightFromGround = 1370;

        this.vertices = [];
        this.faces = [];
        this.struts = [];
        this.strutTypes = [];
        this.highlightedFamily = null;
        this.highlightedStrutId = null;

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
        const bind = (id, prop, valId, scale = 1, prefix = "") => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                this[prop] = parseFloat(e.target.value) / scale;
                const displayEl = document.getElementById(valId);
                if (displayEl) {
                    displayEl.textContent = prefix + (scale === 1 ? Math.round(this[prop]) : this[prop].toFixed(2)) + (scale === 1 && prefix === "" ? "mm" : "");
                }
                this.calculate();
            });
        };

        bind('param-freq', 'frequency', 'val-freq', 1, "V");
        bind('param-apex', 'apexHeight', 'val-apex');
        bind('param-taper', 'taperStrength', 'val-taper', 100);
        bind('param-stretch', 'bedLength', 'val-stretch');
        bind('param-overhang', 'caboverOverhang', 'val-overhang');
        bind('param-clearance', 'cabinClearance', 'val-clearance');
        bind('param-squaring', 'rearSquaring', 'val-squaring', 100);
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
        const yScale = this.apexHeight / 1000;
        
        // Front stretches for cabover, back stretches for bed
        const frontStretch = this.caboverOverhang + (this.bedLength / 2);
        const rearStretch = this.bedLength / 2;

        this.vertices.forEach(v => {
            // Non-uniform Z stretch
            if (v.z < 0) {
                v.z *= (frontStretch / 1000); 
            } else {
                v.z *= (rearStretch / 1000);
            }

            // Apply Y scaling
            v.y *= yScale;
            
            // Taper logic (mostly affecting the front cabover)
            const totalZ = frontStretch + rearStretch;
            const zNorm = (v.z + frontStretch) / totalZ; // 0 at front, 1 at back
            const taper = 1.0 - (Math.max(0, 1.0 - zNorm) * this.taperStrength);
            v.y *= taper;

            // Rear Squaring logic
            if (v.z > 0 && this.rearSquaring > 0) {
                // Determine how far this point is from the center plane
                const zFactor = v.z / rearStretch; // 0 to 1
                
                // We want to pull the back surface outward. 
                // A sphere naturally curves in. We pull it toward the bounding box (rearStretch).
                // The effect should be strongest near the back and top.
                // We interpolate v.z toward the rearStretch boundary.
                const targetZ = rearStretch * Math.pow(zFactor, 1.0 - this.rearSquaring * 0.9);
                v.z = v.z * (1 - this.rearSquaring) + targetZ * this.rearSquaring;
            }
        });

        // The bed starts at Z=0 (center of our original sphere roughly) and goes to +bedLength/2.
        // The cabin starts at some offset. Let's base it on the new coordinates.
        // We know Z=0 is the middle of the bed. The bed rail extends from -bedLength/2 to +bedLength/2.
        // The cabover starts at -bedLength/2.
        const zStartCabin = -this.bedLength / 2; 
        const zFullCabin = zStartCabin - 400; // 400mm slope up

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
            strutData.push({ length, bevel, miter, v1Idx: edge.v1Idx, v2Idx: edge.v2Idx });
        });

        // Group into Cut Families
        const families = [];
        strutData.forEach(s => {
            // Find existing family with matching cuts (tolerance 0.5 degrees)
            const existingFamily = families.find(f => Math.abs(f.miter - s.miter) < 0.5 && Math.abs(f.bevel - s.bevel) < 0.5);
            if (existingFamily) {
                const existingLength = existingFamily.lengths.find(l => Math.abs(l.length - s.length) < 2);
                if (existingLength) {
                    existingLength.count++;
                } else {
                    existingFamily.lengths.push({ length: s.length, count: 1 });
                }
            } else {
                families.push({
                    miter: s.miter,
                    bevel: s.bevel,
                    lengths: [{ length: s.length, count: 1 }]
                });
            }
        });

        // Sort families by miter angle (or total count)
        families.sort((a, b) => a.miter - b.miter);

        let totalStruts = 0;
        let totalLengths = 0;

        families.forEach((f, fIdx) => {
            f.id = String.fromCharCode(65 + fIdx); // A, B, C...
            // Sort lengths within family descending (longest is A1)
            f.lengths.sort((a, b) => b.length - a.length);
            
            totalLengths += f.lengths.length;
            f.lengths.forEach(l => {
                totalStruts += l.count;
            });
        });

        this.cutFamilies = families;
        this.stats = { families: families.length, lengths: totalLengths, struts: totalStruts, cuts: totalStruts * 2 };

        // Assign derived IDs back to individual struts for highlighting
        strutData.forEach(s => {
            const family = families.find(f => Math.abs(f.miter - s.miter) < 0.5 && Math.abs(f.bevel - s.bevel) < 0.5);
            if (family) {
                s.familyId = family.id;
                const lengthIndex = family.lengths.findIndex(l => Math.abs(l.length - s.length) < 2);
                if (lengthIndex !== -1) {
                    s.strutId = `${family.id}${lengthIndex + 1}`;
                }
            }
        });
        this.struts = strutData; // Now includes .v1, .v2, .familyId, .strutId
    }

    updateUI() {
        this.renderSVG();
        
        const summary = document.getElementById('fabrication-summary');
        if (summary) {
            summary.innerHTML = `
                <div class="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-xs text-primary mb-1">FAMILIES</div>
                        <div class="text-xl font-bold text-white">${this.stats.families}</div>
                    </div>
                    <div>
                        <div class="text-xs text-primary mb-1">LENGTHS</div>
                        <div class="text-xl font-bold text-white">${this.stats.lengths}</div>
                    </div>
                    <div>
                        <div class="text-xs text-primary mb-1">STRUTS</div>
                        <div class="text-xl font-bold text-white">${this.stats.struts}</div>
                    </div>
                    <div>
                        <div class="text-xs text-primary mb-1">TOTAL CUTS</div>
                        <div class="text-xl font-bold text-white">${this.stats.cuts}</div>
                    </div>
                </div>
            `;
        }

        const container = document.getElementById('inventory-container');
        if (container) {
            container.innerHTML = '';
            // Expose a method to the global scope for the inline onclick handlers in the HTML string
            window.selectCamperStrut = (id) => {
                this.highlightedStrutId = this.highlightedStrutId === id ? null : id;
                this.highlightedFamily = null;
                this.updateUI();
            };

            this.cutFamilies.forEach(f => {
                const card = document.createElement('div');
                card.className = `data-card mb-4 cursor-pointer border-2 transition-colors ${this.highlightedFamily === f.id ? 'border-primary' : 'border-slate-700 hover:border-slate-500'}`;
                
                card.onclick = (e) => {
                    // Stop propagation so row clicks don't also trigger card clicks
                    if (e.target.tagName === 'TD' || e.target.closest('tr')) return;
                    this.highlightedFamily = this.highlightedFamily === f.id ? null : f.id;
                    this.highlightedStrutId = null;
                    this.updateUI();
                };

                let rows = '';
                f.lengths.forEach((l, i) => {
                    const id = `${f.id}${i+1}`;
                    const isSelected = this.highlightedStrutId === id;
                    rows += `
                        <tr class="cursor-pointer transition-colors ${isSelected ? 'bg-primary/20' : 'hover:bg-slate-800'}" 
                            onclick="event.stopPropagation(); window.selectCamperStrut('${id}')">
                            <td class="py-2 px-2 rounded-l"><span class="badge-type type-${f.id.toLowerCase()}">${id}</span></td>
                            <td class="font-mono text-white py-2">${l.length.toFixed(1)}mm</td>
                            <td class="py-2">${l.count}</td>
                            <td class="py-2 px-2 rounded-r text-right">
                                <i class="bi bi-eye${isSelected ? '-fill text-primary' : ''}"></i>
                            </td>
                        </tr>
                    `;
                });

                card.innerHTML = `
                    <div class="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
                        <span class="font-bold text-primary">CUT FAMILY ${f.id}</span>
                        <div class="flex gap-3 text-xs bg-slate-800 px-3 py-1 rounded text-slate-300">
                            <span>Miter: <strong class="text-white">${f.miter.toFixed(1)}°</strong></span>
                            <span>Bevel: <strong class="text-white">${f.bevel.toFixed(1)}°</strong></span>
                        </div>
                    </div>
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="px-2">Type</th>
                                <th>Length</th>
                                <th>Qty</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                `;
                container.appendChild(card);
            });
        }
    }

    renderSVG() {
        const sideTruck = document.getElementById('view-side-truck');
        const sideGeo = document.getElementById('view-side-geodesic');
        const sideDim = document.getElementById('view-side-dim');

        const frontTruck = document.getElementById('view-front-truck');
        const frontGeo = document.getElementById('view-front-geodesic');

        const backTruck = document.getElementById('view-back-truck');
        const backGeo = document.getElementById('view-back-geodesic');

        if (!sideTruck || !sideGeo) return;

        sideTruck.innerHTML = ''; sideGeo.innerHTML = ''; sideDim.innerHTML = '';
        frontTruck.innerHTML = ''; frontGeo.innerHTML = '';
        backTruck.innerHTML = ''; backGeo.innerHTML = '';

        const scale = 0.22; 

        // Side View
        const sideOx = 1100; 
        const sideOy = 550; 
        this.renderTruckSide(sideTruck, sideOx, sideOy, scale);
        this.renderGeodesic(sideGeo, sideOx + (this.bedLength / 2) * scale, sideOy - 600 * scale, scale, 'side');

        const apexY = sideOy - 600*scale - this.apexHeight * scale;
        const dimX = sideOx + (this.bedLength / 2) * scale + 1000*scale;

        sideDim.innerHTML = `
            <line x1="${dimX}" y1="${sideOy - 600*scale}" x2="${dimX}" y2="${apexY}" stroke="#fb7185" stroke-width="2" />
            <text x="${dimX + 10}" y="${(sideOy - 600*scale + apexY)/2}" fill="#fb7185" font-size="14" font-weight="bold">${Math.round(this.apexHeight)}mm</text>
        `;

        // Front View
        const frontOx = 500;
        const frontOy = 1100;
        this.renderTruckFront(frontTruck, frontOx, frontOy, scale);
        this.renderGeodesic(frontGeo, frontOx, frontOy - 600 * scale, scale, 'front');

        // Back View
        const backOx = 1700;
        const backOy = 1100;
        this.renderTruckBack(backTruck, backOx, backOy, scale);
        this.renderGeodesic(backGeo, backOx, backOy - 600 * scale, scale, 'back');
    }

    renderTruckSide(group, ox, oy, scale) {
        const bedLengthScaled = this.bedLength * scale;
        group.innerHTML = `
            <path d="M -2800 0 L -2700 -200 L -2500 -250 L -2000 -250 L -1800 -400 
                     L -1500 -1200 L -800 -1250 L 0 -1250 L 200 -1200 L 300 -600 
                     L 2200 -600 L 2300 0 Z" 
                  fill="#1e293b" stroke="#334155" stroke-width="5" transform="translate(${ox}, ${oy}) scale(${scale})"/>
            <rect x="${ox}" y="${oy - 600*scale}" width="${bedLengthScaled}" height="${600*scale}" fill="#334155" opacity="0.3" stroke="#475569" stroke-width="1" />
            <path d="M 0 0 L -1800 0 L -1800 -400 L -1500 -${this.cabinClearance + 100} L 0 -${this.cabinClearance + 100} Z" 
                  fill="#334155" opacity="0.4" stroke="#475569" stroke-width="1" transform="translate(${ox}, ${oy - 500*scale})"/>
            <circle cx="${ox - 1800*scale}" cy="${oy}" r="${380*scale}" fill="#0f172a" stroke="#334155" stroke-width="4" />
            <circle cx="${ox + 1500*scale}" cy="${oy}" r="${380*scale}" fill="#0f172a" stroke="#334155" stroke-width="4" />
            <line x1="${ox - 3000*scale}" y1="${oy - 600*scale}" x2="${ox + 3000*scale}" y2="${oy - 600*scale}" stroke="#334155" stroke-dasharray="10,10" />
            <text x="${ox}" y="${oy + 150}" fill="#64748b" font-size="16" font-weight="bold" font-family="monospace">SIDE VIEW</text>
        `;
    }

    renderTruckFront(group, ox, oy, scale) {
        const w = this.truckWidth * scale;
        const tW = 265 * scale;
        const tR = 380 * scale;
        group.innerHTML = `
            <rect x="${ox - w/2}" y="${oy - tR}" width="${tW}" height="${tR*2}" rx="5" fill="#0f172a" stroke="#334155" stroke-width="3" />
            <rect x="${ox + w/2 - tW}" y="${oy - tR}" width="${tW}" height="${tR*2}" rx="5" fill="#0f172a" stroke="#334155" stroke-width="3" />
            <path d="M ${ox - w/2} ${oy - 500*scale} 
                     L ${ox + w/2} ${oy - 500*scale} 
                     L ${ox + w/2 - 100*scale} ${oy - 1200*scale} 
                     L ${ox - w/2 + 100*scale} ${oy - 1200*scale} Z" 
                  fill="#1e293b" stroke="#334155" stroke-width="4" />
            <rect x="${ox - w/2 - 50*scale}" y="${oy - 800*scale}" width="${50*scale}" height="${80*scale}" rx="5" fill="#1e293b" stroke="#334155" stroke-width="2" />
            <rect x="${ox + w/2}" y="${oy - 800*scale}" width="${50*scale}" height="${80*scale}" rx="5" fill="#1e293b" stroke="#334155" stroke-width="2" />
            <text x="${ox - 50}" y="${oy + 150}" fill="#64748b" font-size="16" font-weight="bold" font-family="monospace">FRONT VIEW</text>
        `;
    }

    renderTruckBack(group, ox, oy, scale) {
        const w = this.truckWidth * scale;
        const tW = 265 * scale;
        const tR = 380 * scale;
        group.innerHTML = `
            <rect x="${ox - w/2}" y="${oy - tR}" width="${tW}" height="${tR*2}" rx="5" fill="#0f172a" stroke="#334155" stroke-width="3" />
            <rect x="${ox + w/2 - tW}" y="${oy - tR}" width="${tW}" height="${tR*2}" rx="5" fill="#0f172a" stroke="#334155" stroke-width="3" />
            <path d="M ${ox - w/2 + 50*scale} ${oy - 600*scale} 
                     L ${ox + w/2 - 50*scale} ${oy - 600*scale} 
                     L ${ox + w/2 - 100*scale} ${oy - 1200*scale} 
                     L ${ox - w/2 + 100*scale} ${oy - 1200*scale} Z" 
                  fill="#0f172a" stroke="#1e293b" stroke-width="2" />
            <rect x="${ox - w/2}" y="${oy - 900*scale}" width="${w}" height="${400*scale}" fill="#1e293b" stroke="#334155" stroke-width="4" />
            <rect x="${ox - w/2 + 20*scale}" y="${oy - 800*scale}" width="${50*scale}" height="${150*scale}" rx="5" fill="#7f1d1d" opacity="0.8" />
            <rect x="${ox + w/2 - 70*scale}" y="${oy - 800*scale}" width="${50*scale}" height="${150*scale}" rx="5" fill="#7f1d1d" opacity="0.8" />
            <text x="${ox - 50}" y="${oy + 150}" fill="#64748b" font-size="16" font-weight="bold" font-family="monospace">BACK VIEW</text>
        `;
    }

    renderGeodesic(group, ox, oy, scale, viewType) {
        const isHighlighting = this.highlightedFamily !== null || this.highlightedStrutId !== null;

        const mapCoords = (v) => {
            if (viewType === 'side') return { x: ox + v.z * scale, y: oy - v.y * scale };
            if (viewType === 'front') return { x: ox + v.x * scale, y: oy - v.y * scale };
            if (viewType === 'back') return { x: ox - v.x * scale, y: oy - v.y * scale };
        };

        // Draw faces
        this.faces.forEach(face => {
            const points = face.map(vIdx => {
                const c = mapCoords(this.vertices[vIdx]);
                return `${c.x},${c.y}`;
            });
            const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            poly.setAttribute("points", points.join(" "));
            poly.setAttribute("fill", isHighlighting ? "rgba(56, 189, 248, 0.05)" : "rgba(56, 189, 248, 0.15)");
            poly.setAttribute("stroke", "none");
            group.appendChild(poly);
        });

        // Draw struts
        this.struts.forEach(strut => {
            const c1 = mapCoords(this.vertices[strut.v1Idx]);
            const c2 = mapCoords(this.vertices[strut.v2Idx]);

            let strokeColor = "#38bdf8"; 
            let strokeWidth = "1.5";
            let opacity = "0.5";

            if (isHighlighting) {
                if (this.highlightedStrutId === strut.strutId) {
                    strokeColor = "#fbbf24"; 
                    strokeWidth = "3";
                    opacity = "1";
                } else if (this.highlightedFamily === strut.familyId && this.highlightedStrutId === null) {
                    strokeColor = "#f472b6"; 
                    strokeWidth = "2.5";
                    opacity = "1";
                } else {
                    strokeColor = "#334155"; 
                    opacity = "0.3";
                }
            }

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", c1.x); line.setAttribute("y1", c1.y);
            line.setAttribute("x2", c2.x); line.setAttribute("y2", c2.y);
            line.setAttribute("stroke", strokeColor);
            line.setAttribute("stroke-width", strokeWidth);
            line.setAttribute("opacity", opacity);
            group.appendChild(line);
        });
    }
    }

new CamperSimulator();
