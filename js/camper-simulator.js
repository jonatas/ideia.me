
class CamperSimulator {
    constructor() {
        this.frequency = 2;
        this.apexHeight = 1931;
        this.taperStrength = 0.00;
        this.bedLength = 3000;
        this.caboverOverhang = 1626;
        this.cabinClearance = 738;
        this.rearSquaring = 0.43;
        this.doorWidth = 800;
        this.doorHeight = 1600;
        
        this.truckWidth = 1860;
        this.truckLength = 1560;
        this.cabinExtension = 1850;
        this.bedRailHeightFromGround = 1370;

        this.vertices = [];
        this.faces = [];
        this.faceSegments = [];
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
        bind('param-door-w', 'doorWidth', 'val-door-w');
        bind('param-door-h', 'doorHeight', 'val-door-h');
    }

    calculate() {
        this.generatePillGeometry();
        this.decomposeStruts();
        this.updateUI();
    }

    generatePillGeometry() {
        const radius = 1000;
        const phi = (1 + Math.sqrt(5)) / 2;
        
        // 1. Generate standard Geodesic Sphere
        let sphereVertices = [
            new THREE.Vector3(-1, phi, 0), new THREE.Vector3(1, phi, 0),
            new THREE.Vector3(-1, -phi, 0), new THREE.Vector3(1, -phi, 0),
            new THREE.Vector3(0, -1, phi), new THREE.Vector3(0, 1, phi),
            new THREE.Vector3(0, -1, -phi), new THREE.Vector3(0, 1, -phi),
            new THREE.Vector3(phi, 0, -1), new THREE.Vector3(phi, 0, 1),
            new THREE.Vector3(-phi, 0, -1), new THREE.Vector3(-phi, 0, 1)
        ].map(v => v.normalize().multiplyScalar(radius));

        let sphereFaces = [
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
                const mid = new THREE.Vector3().addVectors(sphereVertices[v1], sphereVertices[v2]).normalize().multiplyScalar(radius);
                sphereVertices.push(mid);
                midpoints.set(k, sphereVertices.length - 1);
                return sphereVertices.length - 1;
            };
            sphereFaces.forEach(face => {
                const m01 = getMid(face[0], face[1]);
                const m12 = getMid(face[1], face[2]);
                const m20 = getMid(face[2], face[0]);
                newFaces.push([face[0], m01, m20], [face[1], m12, m01], [face[2], m20, m12], [m01, m12, m20]);
            });
            sphereFaces = newFaces;
        }

        this.vertices = [];
        this.faces = [];
        this.faceSegments = [];

        // 2. Split and Shift
        const mainRoomLength = this.bedLength;
        const frontZOffset = -mainRoomLength / 2;
        const backZOffset = mainRoomLength / 2;

        const yScale = this.apexHeight / 1000;
        const overhangScale = this.caboverOverhang / 1000;

        // Front Dome (Hemisphere Z < 0)
        const frontVertexMap = new Map();
        sphereFaces.forEach(face => {
            const centroidZ = (sphereVertices[face[0]].z + sphereVertices[face[1]].z + sphereVertices[face[2]].z) / 3;
            if (centroidZ <= 0) {
                const newFace = face.map(vIdx => {
                    if (frontVertexMap.has(vIdx)) return frontVertexMap.get(vIdx);
                    let v = sphereVertices[vIdx].clone();
                    
                    // Scale and Shift
                    v.z = v.z * overhangScale + frontZOffset;
                    v.y *= yScale;

                    // Apply Taper
                    const taper = 1.0 - (Math.abs(v.z - frontZOffset) / this.caboverOverhang * this.taperStrength);
                    v.y *= taper;

                    this.vertices.push(v);
                    frontVertexMap.set(vIdx, this.vertices.length - 1);
                    return this.vertices.length - 1;
                });
                this.faces.push(newFace);
                this.faceSegments.push('front');
            }
        });

        // Back Dome (Hemisphere Z > 0)
        const backVertexMap = new Map();
        sphereFaces.forEach(face => {
            const centroidZ = (sphereVertices[face[0]].z + sphereVertices[face[1]].z + sphereVertices[face[2]].z) / 3;
            if (centroidZ > 0) {
                const newFace = face.map(vIdx => {
                    if (backVertexMap.has(vIdx)) return backVertexMap.get(vIdx);
                    let v = sphereVertices[vIdx].clone();

                    // Scale and Shift
                    v.y *= yScale;
                    
                    // Rear Squaring logic (Simplified for pill)
                    if (this.rearSquaring > 0) {
                        const zFactor = v.z / radius; 
                        const targetZ = radius * Math.pow(zFactor, 1.0 - this.rearSquaring * 0.9);
                        v.z = v.z * (1 - this.rearSquaring) + targetZ * this.rearSquaring;
                    }
                    
                    v.z += backZOffset;

                    this.vertices.push(v);
                    backVertexMap.set(vIdx, this.vertices.length - 1);
                    return this.vertices.length - 1;
                });
                this.faces.push(newFace);
                this.faceSegments.push('back');
            }
        });

        // 3. Main Room (Cylinder)
        // Find vertices on the boundary (Z=0 in sphere)
        const boundaryIndices = [];
        sphereVertices.forEach((v, i) => {
            if (Math.abs(v.z) < 0.1) boundaryIndices.push(i);
        });

        // Sort boundary indices by angle to form a loop
        boundaryIndices.sort((a, b) => {
            const angA = Math.atan2(sphereVertices[a].y, sphereVertices[a].x);
            const angB = Math.atan2(sphereVertices[b].y, sphereVertices[b].x);
            return angA - angB;
        });

        // Create cylinder faces connecting the two dome boundaries
        for (let i = 0; i < boundaryIndices.length; i++) {
            const v1Idx = boundaryIndices[i];
            const v2Idx = boundaryIndices[(i + 1) % boundaryIndices.length];

            const f1 = frontVertexMap.get(v1Idx);
            const f2 = frontVertexMap.get(v2Idx);
            const b1 = backVertexMap.get(v1Idx);
            const b2 = backVertexMap.get(v2Idx);

            if (f1 !== undefined && f2 !== undefined && b1 !== undefined && b2 !== undefined) {
                this.faces.push([f1, b1, b2], [f1, b2, f2]);
                this.faceSegments.push('main', 'main');
            }
        }

        // Apply Bed Rail / Cabin Clearance logic
        const zStartCabin = -this.bedLength / 2;
        const zFullCabin = zStartCabin - 400;

        this.vertices.forEach(v => {
            let minY = -100;
            if (v.z < zFullCabin) {
                minY = this.cabinClearance;
            } else if (v.z < zStartCabin) {
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
            const segment = this.faceSegments[fIdx];
            for (let i = 0; i < 3; i++) {
                const v1Idx = face[i], v2Idx = face[(i + 1) % 3];
                const key = v1Idx < v2Idx ? `${v1Idx}_${v2Idx}` : `${v2Idx}_${v1Idx}`;
                if (!edgeMap.has(key)) {
                    edgeMap.set(key, { v1Idx, v2Idx, faces: [], segment });
                }
                edgeMap.get(key).faces.push(fIdx);
            }
        });

        let strutData = [];
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
            strutData.push({ length, bevel, miter, v1Idx: edge.v1Idx, v2Idx: edge.v2Idx, segment: edge.segment });
        });

        strutData = this.applyDoorCutout(strutData);

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
                existingFamily.segments[s.segment] = (existingFamily.segments[s.segment] || 0) + 1;
            } else {
                families.push({
                    miter: s.miter,
                    bevel: s.bevel,
                    lengths: [{ length: s.length, count: 1 }],
                    segments: { [s.segment]: 1 }
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

    applyDoorCutout(strutData) {
        const doorW = this.doorWidth;
        const doorH = this.doorHeight;
        const backZ = this.bedLength / 2 + 1000; // rough back boundary

        // Door bounding box in 3D
        // Centered on X=0, Y from 0 to doorH, Z at the very back
        const boxMin = { x: -doorW / 2, y: 0, z: this.bedLength / 2 };
        const boxMax = { x: doorW / 2, y: doorH, z: backZ + 500 };

        const newStruts = [];
        const doorFramePoints = [];

        strutData.forEach(s => {
            const p1 = this.vertices[s.v1Idx];
            const p2 = this.vertices[s.v2Idx];

            // Only clip struts in the back segment that might intersect the door
            if (s.segment === 'back') {
                const clip = this.clipSegmentBox(p1.clone(), p2.clone(), boxMin, boxMax);
                if (clip.status === 'outside') {
                    newStruts.push(s);
                } else if (clip.status === 'clipped') {
                    // If clipped, we add the segments that are outside
                    clip.segments.forEach(seg => {
                        const v1Idx = this.vertices.length;
                        this.vertices.push(seg.p1);
                        const v2Idx = this.vertices.length;
                        this.vertices.push(seg.p2);
                        newStruts.push({ ...s, v1Idx, v2Idx, length: seg.p1.distanceTo(seg.p2) });
                        
                        // Collect points that hit the door boundary to form the frame
                        if (seg.isIntersectionP1) doorFramePoints.push(seg.p1);
                        if (seg.isIntersectionP2) doorFramePoints.push(seg.p2);
                    });
                }
                // if status is 'inside', we just drop the strut
            } else {
                newStruts.push(s);
            }
        });

        // Add Door Frame Struts
        // Simple approach: connect points that are on the same door edge
        const threshold = 1.0;
        const frameEdges = [
            { axis: 'x', val: boxMin.x }, { axis: 'x', val: boxMax.x },
            { axis: 'y', val: boxMin.y }, { axis: 'y', val: boxMax.y }
        ];

        frameEdges.forEach(edge => {
            const pts = doorFramePoints.filter(p => Math.abs(p[edge.axis] - edge.val) < threshold);
            // Sort by the other axis to connect them in order
            const otherAxis = edge.axis === 'x' ? 'y' : 'x';
            pts.sort((a, b) => a[otherAxis] - b[otherAxis]);

            for (let i = 0; i < pts.length - 1; i++) {
                const v1Idx = this.vertices.length;
                this.vertices.push(pts[i]);
                const v2Idx = this.vertices.length;
                this.vertices.push(pts[i+1]);
                newStruts.push({
                    length: pts[i].distanceTo(pts[i+1]),
                    bevel: 0, miter: 0, // Frame is usually square-cut or special
                    v1Idx, v2Idx, segment: 'back', isFrame: true
                });
            }
        });

        return newStruts;
    }

    clipSegmentBox(p1, p2, min, max) {
        // Simplified Liang-Barsky or similar clipping
        // We only care about X and Y for the door hole
        let t0 = 0, t1 = 1;
        const dx = p2.x - p1.x, dy = p2.y - p1.y;

        const checks = [
            { p: -dx, q: p1.x - min.x }, { p: dx, q: max.x - p1.x },
            { p: -dy, q: p1.y - min.y }, { p: dy, q: max.y - p1.y }
        ];

        for (let i = 0; i < 4; i++) {
            const { p, q } = checks[i];
            if (p === 0) {
                if (q < 0) return { status: 'outside' };
                continue;
            }
            const r = q / p;
            if (p < 0) {
                if (r > t1) return { status: 'outside' };
                if (r > t0) t0 = r;
            } else if (p > 0) {
                if (r < t0) return { status: 'outside' };
                if (r < t1) t1 = r;
            }
        }

        if (t0 <= 0 && t1 >= 1) return { status: 'inside' }; // Entirely inside the door

        const segments = [];
        if (t0 > 0) {
            segments.push({ 
                p1: p1.clone(), 
                p2: p1.clone().add(p2.clone().sub(p1).multiplyScalar(t0)),
                isIntersectionP2: true
            });
        }
        if (t1 < 1) {
            segments.push({ 
                p1: p1.clone().add(p2.clone().sub(p1).multiplyScalar(t1)), 
                p2: p2.clone(),
                isIntersectionP1: true
            });
        }

        return { status: 'clipped', segments };
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

                const segmentBadges = Object.entries(f.segments).map(([seg, count]) => {
                    let color = 'bg-slate-700';
                    if (seg === 'front') color = 'bg-blue-900/40 text-blue-300';
                    if (seg === 'main') color = 'bg-emerald-900/40 text-emerald-300';
                    if (seg === 'back') color = 'bg-rose-900/40 text-rose-300';
                    return `<span class="px-2 py-0.5 rounded ${color}">${seg.toUpperCase()}: ${count}</span>`;
                }).join(' ');

                card.innerHTML = `
                    <div class="flex justify-between items-center mb-1 pb-1">
                        <span class="font-bold text-primary">CUT FAMILY ${f.id}</span>
                        <div class="flex gap-3 text-xs bg-slate-800 px-3 py-1 rounded text-slate-300">
                            <span>Miter: <strong class="text-white">${f.miter.toFixed(1)}°</strong></span>
                            <span>Bevel: <strong class="text-white">${f.bevel.toFixed(1)}°</strong></span>
                        </div>
                    </div>
                    <div class="flex gap-2 text-[10px] mb-3 opacity-80">
                        ${segmentBadges}
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
        this.faces.forEach((face, fIdx) => {
            const segment = this.faceSegments[fIdx];
            
            // Filter by view segment
            if (viewType === 'front' && segment !== 'front') return;
            if (viewType === 'back' && segment !== 'back') return;

            // Cull faces that are in the door area (back view)
            if (segment === 'back') {
                const doorW = this.doorWidth;
                const doorH = this.doorHeight;
                const centroid = new THREE.Vector3();
                face.forEach(vIdx => centroid.add(this.vertices[vIdx]));
                centroid.divideScalar(3);

                if (Math.abs(centroid.x) < doorW / 2 && centroid.y < doorH && centroid.y > 0) {
                    return;
                }
            }

            // Simple back-face culling for side view (don't show faces pointing away)
            if (viewType === 'side') {
                const v1 = this.vertices[face[0]], v2 = this.vertices[face[1]], v3 = this.vertices[face[2]];
                const normal = new THREE.Vector3().subVectors(v2, v1).cross(new THREE.Vector3().subVectors(v3, v1));
                if (normal.x < 0) return; // Only show right side
            }

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
            if (viewType === 'front' && strut.segment !== 'front') return;
            if (viewType === 'back' && strut.segment !== 'back') return;

            if (viewType === 'side') {
                // Only show struts on the positive X side for side view
                const p1 = this.vertices[strut.v1Idx], p2 = this.vertices[strut.v2Idx];
                if (p1.x < -10 && p2.x < -10) return; 
            }

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

            if (strut.isFrame) {
                strokeColor = "#fb7185"; // Accent color for door frame
                strokeWidth = "2";
                opacity = "1";
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
