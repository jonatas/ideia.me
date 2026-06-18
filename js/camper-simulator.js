
class CamperSimulator {
    constructor() {
        this.frequency = 2;
        this.apexHeight = 1931;
        this.taperStrength = 0.00;
        this.bedLength = 1500;
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
        this.activeView = 'side';

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
        
        // Define view switcher globally
        window.setCamperView = (view) => {
            this.activeView = view;
            
            // Highlight active thumbnail
            ['side', 'front', 'back'].forEach(v => {
                const thumb = document.getElementById(`thumb-btn-${v}`);
                if (thumb) {
                    if (v === this.activeView) {
                        thumb.classList.add('border-primary');
                        thumb.classList.remove('border-slate-700');
                    } else {
                        thumb.classList.add('border-slate-700');
                        thumb.classList.remove('border-primary');
                    }
                }
            });
            
            this.renderSVG();
        };
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

        // Tab Switching
        const btnDesign = document.getElementById('btn-tab-design');
        const btnInventory = document.getElementById('btn-tab-inventory');
        const tabDesign = document.getElementById('tab-design');
        const tabInventory = document.getElementById('tab-inventory');

        if (btnDesign && btnInventory && tabDesign && tabInventory) {
            const switchTab = (activeTab) => {
                if (activeTab === 'design') {
                    tabDesign.classList.remove('hidden');
                    tabInventory.classList.add('hidden');
                    btnDesign.className = "flex-1 py-4 text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary bg-slate-800/50";
                    btnInventory.className = "flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b-2 border-transparent hover:bg-slate-800/30";
                } else {
                    tabDesign.classList.add('hidden');
                    tabInventory.classList.remove('hidden');
                    btnDesign.className = "flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b-2 border-transparent hover:bg-slate-800/30";
                    btnInventory.className = "flex-1 py-4 text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary bg-slate-800/50";
                }
            };
            btnDesign.onclick = () => switchTab('design');
            btnInventory.onclick = () => switchTab('inventory');
        }
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

        let newSphereFaces = [];
        let newSphereVertices = [...sphereVertices];

        const getPoint = (v1, v2, v3, c1, c2) => {
            const c3 = this.frequency - c1 - c2;
            const p = new THREE.Vector3(0,0,0);
            p.addScaledVector(sphereVertices[v1], c1/this.frequency);
            p.addScaledVector(sphereVertices[v2], c2/this.frequency);
            p.addScaledVector(sphereVertices[v3], c3/this.frequency);
            return p.normalize().multiplyScalar(radius);
        };

        const vertexMap = new Map();
        const getVertexKey = (v) => `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
        
        sphereVertices.forEach((v, idx) => {
            vertexMap.set(getVertexKey(v), { v: v, idx: idx, isPPT: true });
        });

        const addVertex = (p, isPPT) => {
            const key = getVertexKey(p);
            if (!vertexMap.has(key)) {
                vertexMap.set(key, { v: p, idx: newSphereVertices.length, isPPT: isPPT });
                newSphereVertices.push(p);
            }
            return vertexMap.get(key).idx;
        };

        sphereFaces.forEach(face => {
            const v1 = face[0];
            const v2 = face[1];
            const v3 = face[2];
            
            for (let c1 = 0; c1 < this.frequency; c1++) {
                for (let c2 = 0; c2 < this.frequency - c1; c2++) {
                    const p1 = addVertex(getPoint(v1, v2, v3, c1 + 1, c2), false);
                    const p2 = addVertex(getPoint(v1, v2, v3, c1, c2 + 1), false);
                    const p3 = addVertex(getPoint(v1, v2, v3, c1, c2), false);
                    newSphereFaces.push([p1, p2, p3]);
                    
                    if (c1 + c2 < this.frequency - 1) {
                        const p4 = addVertex(getPoint(v1, v2, v3, c1 + 1, c2 + 1), false);
                        newSphereFaces.push([p1, p4, p2]);
                    }
                }
            }
        });

        // Apply Kruschke magic
        if (this.frequency === 3 || this.frequency === 4) {
            const MAGIC_FIX_RATIO = this.frequency === 3 ? 0.9442890204731844 : (0.22219 / 0.253185 * 0.9983958444733023);
            const ppts = Array.from(vertexMap.values()).filter(o => o.isPPT).map(o => o.idx);
            
            const connections = new Map();
            newSphereFaces.forEach(tri => {
                for (let i = 0; i < 3; i++) {
                    const a = tri[i];
                    const b = tri[(i+1)%3];
                    if (!connections.has(a)) connections.set(a, new Set());
                    if (!connections.has(b)) connections.set(b, new Set());
                    connections.get(a).add(b);
                    connections.get(b).add(a);
                }
            });

            Array.from(vertexMap.values()).forEach(obj => {
                if (obj.isPPT) return;
                const idx = obj.idx;
                const connected = Array.from(connections.get(idx));
                const connectedPPTIdx = connected.find(n => ppts.includes(n));
                
                if (connectedPPTIdx !== undefined) {
                    const E = newSphereVertices[connectedPPTIdx];
                    const S = newSphereVertices[idx];
                    const mr = MAGIC_FIX_RATIO;
                    const newPos = E.clone().multiplyScalar(1 - mr).add(S.clone().multiplyScalar(mr)).normalize().multiplyScalar(radius);
                    S.copy(newPos);
                }
            });
        }
        
        sphereVertices = newSphereVertices;
        sphereFaces = newSphereFaces;

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

        // 3. Main Room (Cylinder with multiple rings for uniformity)
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

        // Calculate average boundary edge length for uniform ring spacing
        let totalEdgeLen = 0;
        for (let i = 0; i < boundaryIndices.length; i++) {
            totalEdgeLen += sphereVertices[boundaryIndices[i]].distanceTo(sphereVertices[boundaryIndices[(i + 1) % boundaryIndices.length]]);
        }
        const avgEdgeLen = totalEdgeLen / boundaryIndices.length;
        const numRings = Math.max(1, Math.round(mainRoomLength / avgEdgeLen));
        const ringSpacing = mainRoomLength / numRings;

        let prevRingIndices = boundaryIndices.map(vIdx => frontVertexMap.get(vIdx));

        for (let r = 1; r <= numRings; r++) {
            const currentZ = frontZOffset + (r * ringSpacing);
            let currentRingIndices = [];

            if (r === numRings) {
                // Last ring is the back dome boundary
                currentRingIndices = boundaryIndices.map(vIdx => backVertexMap.get(vIdx));
            } else {
                // Create new intermediate ring of vertices
                boundaryIndices.forEach(vIdx => {
                    let v = sphereVertices[vIdx].clone();
                    v.y *= yScale;
                    v.z = currentZ;
                    this.vertices.push(v);
                    currentRingIndices.push(this.vertices.length - 1);
                });
            }

            // Triangulate between prevRing and currentRing
            for (let i = 0; i < boundaryIndices.length; i++) {
                const p1 = prevRingIndices[i];
                const p2 = prevRingIndices[(i + 1) % boundaryIndices.length];
                const c1 = currentRingIndices[i];
                const c2 = currentRingIndices[(i + 1) % boundaryIndices.length];

                if (p1 !== undefined && p2 !== undefined && c1 !== undefined && c2 !== undefined) {
                    this.faces.push([p1, c1, c2], [p1, c2, p2]);
                    this.faceSegments.push('main', 'main');
                }
            }
            prevRingIndices = currentRingIndices;
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
        this.faceNormals = this.faces.map(face => {
            const v1 = this.vertices[face[0]], v2 = this.vertices[face[1]], v3 = this.vertices[face[2]];
            return new THREE.Vector3().subVectors(v2, v1).cross(new THREE.Vector3().subVectors(v3, v1)).normalize();
        });

        // Map to find adjacent faces for dihedral (bevel) calculation
        const edgeToFaces = new Map();
        this.faces.forEach((face, fIdx) => {
            for (let i = 0; i < 3; i++) {
                const v1 = face[i], v2 = face[(i + 1) % 3];
                const key = v1 < v2 ? `${v1}_${v2}` : `${v2}_${v1}`;
                if (!edgeToFaces.has(key)) edgeToFaces.set(key, []);
                edgeToFaces.get(key).push(fIdx);
            }
        });

        const strutData = [];
        this.faces.forEach((face, fIdx) => {
            const segment = this.faceSegments[fIdx];
            const normal = this.faceNormals[fIdx];
            const v = face.map(idx => this.vertices[idx]);

            // Calculate internal angles of the triangle
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
                const v1Idx = face[i], v2Idx = face[(i + 1) % 3];
                const edgeKey = v1Idx < v2Idx ? `${v1Idx}_${v2Idx}` : `${v2Idx}_${v1Idx}`;
                const adjacentFaces = edgeToFaces.get(edgeKey);
                
                let bevel = 0;
                if (adjacentFaces.length === 2) {
                    const n1 = this.faceNormals[adjacentFaces[0]];
                    const n2 = this.faceNormals[adjacentFaces[1]];
                    bevel = (n1.angleTo(n2) * 180 / Math.PI) / 2;
                }

                // Good Karma Miter is 90 - (Interior Angle / 2) if it were equilateral
                // But since they overlap, it's 90 - Angle at the vertex.
                // For a "spinning" joint, each end of the strut has a different miter if the triangle isn't equilateral.
                // However, for simplicity in most guides, we use the average or the specific vertex angle.
                // Let's use the angle at the vertex for this specific strut end.
                const angleAtVertex = angles[i] * 180 / Math.PI;
                const miter = Math.abs(90 - angleAtVertex);

                const length = sides[i];
                // Inside length accounts for the "spinning" overlap: L - (Width / tan(Angle))
                const width = 40; // Default width
                const insideLength = length - (width / Math.tan(angles[i]));

                strutData.push({
                    length: length * 1000,
                    insideLength: insideLength * 1000,
                    bevel,
                    miter,
                    v1Idx,
                    v2Idx,
                    segment,
                    fIdx
                });
            }
        });

        // Apply Door Cutout (filtering out struts that intersect the door)
        let filteredStruts = this.applyDoorCutout(strutData);

        // Group into Cut Families
        const families = [];
        filteredStruts.forEach(s => {
            if (s.length < 5) return; 
            const existingFamily = families.find(f => Math.abs(f.miter - s.miter) < 0.5 && Math.abs(f.bevel - s.bevel) < 0.5);
            if (existingFamily) {
                const existingLength = existingFamily.lengths.find(l => Math.abs(l.length - s.length) < 2);
                if (existingLength) {
                    existingLength.count++;
                } else {
                    existingFamily.lengths.push({ length: s.length, insideLength: s.insideLength, count: 1 });
                }
                existingFamily.segments[s.segment] = (existingFamily.segments[s.segment] || 0) + 1;
            } else {
                families.push({
                    miter: s.miter,
                    bevel: s.bevel,
                    lengths: [{ length: s.length, insideLength: s.insideLength, count: 1 }],
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
        filteredStruts.forEach(s => {
            const family = families.find(f => Math.abs(f.miter - s.miter) < 0.5 && Math.abs(f.bevel - s.bevel) < 0.5);
            if (family) {
                s.familyId = family.id;
                const lengthIndex = family.lengths.findIndex(l => Math.abs(l.length - s.length) < 2);
                if (lengthIndex !== -1) {
                    s.strutId = `${family.id}${lengthIndex + 1}`;
                }
            }
        });
        this.struts = filteredStruts; // Now includes .v1, .v2, .familyId, .strutId
    }

    applyDoorCutout(strutData) {
        const doorW = this.doorWidth;
        const doorH = this.doorHeight;
        const backZ = this.bedLength / 2 + 1000; // rough back boundary

        // Door bounding box in 3D
        // Centered on X=0, Y from floor (-100) to doorH-100, Z at the very back
        const boxMin = { x: -doorW / 2, y: -100, z: this.bedLength / 2 };
        const boxMax = { x: doorW / 2, y: doorH - 100, z: backZ + 500 };

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
                        const len = seg.p1.distanceTo(seg.p2);
                        if (len < 5) return;

                        const v1Idx = this.vertices.length;
                        this.vertices.push(seg.p1);
                        const v2Idx = this.vertices.length;
                        this.vertices.push(seg.p2);
                        newStruts.push({ ...s, v1Idx, v2Idx, length: len });
                        
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
            let pts = doorFramePoints.filter(p => Math.abs(p[edge.axis] - edge.val) < threshold);
            
            // Deduplicate points
            const uniquePts = [];
            pts.forEach(p => {
                if (!uniquePts.some(up => up.distanceTo(p) < 2)) uniquePts.push(p);
            });
            pts = uniquePts;

            // Sort by the other axis to connect them in order
            const otherAxis = edge.axis === 'x' ? 'y' : 'x';
            pts.sort((a, b) => a[otherAxis] - b[otherAxis]);

            for (let i = 0; i < pts.length - 1; i++) {
                const len = pts[i].distanceTo(pts[i+1]);
                if (len < 5) continue;

                const v1Idx = this.vertices.length;
                this.vertices.push(pts[i]);
                const v2Idx = this.vertices.length;
                this.vertices.push(pts[i+1]);
                newStruts.push({
                    length: len,
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
                        <div class="text-xs text-primary mb-1">UNIQUE</div>
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
                            <td class="font-mono text-white py-2">
                                <span class="text-primary">${l.insideLength.toFixed(1)}</span>
                                <span class="text-slate-500 text-[10px] ml-1">(${l.length.toFixed(0)})</span>
                            </td>
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
                            <span>Sway (Miter): <strong class="text-white">${f.miter.toFixed(1)}°</strong></span>
                            <span>Tilt (Bevel): <strong class="text-white">${f.bevel.toFixed(1)}°</strong></span>
                        </div>
                    </div>
                    <div class="flex gap-2 text-[10px] mb-3 opacity-80">
                        ${segmentBadges}
                    </div>
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="px-2">Type</th>
                                <th>Length (mm)</th>
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

        if (sideTruck && sideGeo) {
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

        // Clear the new main groups if they exist
        const mainTruck = document.getElementById('main-truck');
        const mainGeo = document.getElementById('main-geodesic');
        const mainDim = document.getElementById('main-dim');
        
        if (mainTruck) {
            mainTruck.innerHTML = ''; 
            mainGeo.innerHTML = ''; 
            mainDim.innerHTML = '';

            // Calculate Dynamic Scale (Auto-zoom)
            // Total height in model units: apex + 600 (bed height) + 380 (wheel drop)
            const totalModelHeight = this.apexHeight + 600 + 380;
            const viewBoxHeight = 1400;
            const verticalPadding = 100; // Total top+bottom padding
            
            let mainScale = 0.45;
            if (totalModelHeight * mainScale > (viewBoxHeight - verticalPadding)) {
                mainScale = (viewBoxHeight - verticalPadding) / totalModelHeight;
            }
            
            const mainOx = 1000; 
            // mainOy is the baseline (wheel center). 
            // We want it as low as possible: viewBoxHeight - (wheel drop * scale) - bottom margin
            const mainOy = viewBoxHeight - (400 * mainScale); 
            
            const thumbScale = 0.35;
            const thumbOx = 1000;
            const thumbOy = 1000;

            // Draw Main View
            if (this.activeView === 'side') {
                this.renderTruckSide(mainTruck, mainOx, mainOy, mainScale, false);
                this.renderGeodesic(mainGeo, mainOx + (this.bedLength / 2) * mainScale, mainOy - 600 * mainScale, mainScale, 'side');

                // Apex Dimension (at center of bed)
                const apexY = mainOy - 600*mainScale - this.apexHeight * mainScale;
                const dimApexX = mainOx + (this.bedLength / 2) * mainScale;

                // Door Dimension (at the back)
                const doorY = mainOy - 600*mainScale - (this.doorHeight - 100) * mainScale;
                const dimDoorX = mainOx + (this.bedLength / 2 + 1000) * mainScale + 100 * mainScale;

                mainDim.innerHTML = `
                    <!-- Apex Dimension -->
                    <line x1="${dimApexX}" y1="${mainOy - 600*mainScale}" x2="${dimApexX}" y2="${apexY}" stroke="#fb7185" stroke-width="2" stroke-dasharray="4,2" />
                    <circle cx="${dimApexX}" cy="${apexY}" r="4" fill="#fb7185" />
                    <text x="${dimApexX + 10}" y="${apexY + 20}" fill="#fb7185" font-size="14" font-weight="bold" font-family="monospace">APEX: ${Math.round(this.apexHeight)}mm</text>
                    
                    <!-- Door Dimension -->
                    <line x1="${dimDoorX}" y1="${mainOy - 500*mainScale}" x2="${dimDoorX}" y2="${doorY}" stroke="#38bdf8" stroke-width="2" />
                    <line x1="${dimDoorX - 10}" y1="${mainOy - 500*mainScale}" x2="${dimDoorX + 10}" y2="${mainOy - 500*mainScale}" stroke="#38bdf8" stroke-width="2" />
                    <line x1="${dimDoorX - 10}" y1="${doorY}" x2="${dimDoorX + 10}" y2="${doorY}" stroke="#38bdf8" stroke-width="2" />
                    <text x="${dimDoorX + 15}" y="${(mainOy - 500*mainScale + doorY)/2}" fill="#38bdf8" font-size="14" font-weight="bold" font-family="monospace">DOOR: ${Math.round(this.doorHeight)}mm</text>
                `;
            } else if (this.activeView === 'front') {
                this.renderTruckFront(mainTruck, mainOx, mainOy, mainScale, false);
                this.renderGeodesic(mainGeo, mainOx, mainOy - 600 * mainScale, mainScale, 'front');
            } else if (this.activeView === 'back') {
                this.renderTruckBack(mainTruck, mainOx, mainOy, mainScale, false);
                this.renderGeodesic(mainGeo, mainOx, mainOy - 600 * mainScale, mainScale, 'back');

                // Door Dimension (in back view)
                const w = this.truckWidth * mainScale;
                const doorY = mainOy - 600*mainScale - (this.doorHeight - 100) * mainScale;
                const dimDoorX = mainOx + w/2 + 50*mainScale;

                mainDim.innerHTML = `
                    <line x1="${dimDoorX}" y1="${mainOy - 500*mainScale}" x2="${dimDoorX}" y2="${doorY}" stroke="#38bdf8" stroke-width="2" />
                    <line x1="${dimDoorX - 10}" y1="${mainOy - 500*mainScale}" x2="${dimDoorX + 10}" y2="${mainOy - 500*mainScale}" stroke="#38bdf8" stroke-width="2" />
                    <line x1="${dimDoorX - 10}" y1="${doorY}" x2="${dimDoorX + 10}" y2="${doorY}" stroke="#38bdf8" stroke-width="2" />
                    <text x="${dimDoorX + 15}" y="${(mainOy - 500*mainScale + doorY)/2}" fill="#38bdf8" font-size="14" font-weight="bold" font-family="monospace">DOOR: ${Math.round(this.doorHeight)}mm</text>
                `;
            }

            // Draw Thumbnails using the old IDs but mapping them to the new thumb layout
            const thumbSideTruckNode = document.getElementById('thumb-side-truck');
            const thumbSideGeoNode = document.getElementById('thumb-side-geodesic');
            const thumbFrontTruckNode = document.getElementById('thumb-front-truck');
            const thumbFrontGeoNode = document.getElementById('thumb-front-geodesic');
            const thumbBackTruckNode = document.getElementById('thumb-back-truck');
            const thumbBackGeoNode = document.getElementById('thumb-back-geodesic');

            if (thumbSideTruckNode) {
                thumbSideTruckNode.innerHTML = ''; thumbSideGeoNode.innerHTML = '';
                thumbFrontTruckNode.innerHTML = ''; thumbFrontGeoNode.innerHTML = '';
                thumbBackTruckNode.innerHTML = ''; thumbBackGeoNode.innerHTML = '';

                this.renderTruckSide(thumbSideTruckNode, thumbOx, thumbOy, thumbScale, true);
                this.renderGeodesic(thumbSideGeoNode, thumbOx + (this.bedLength / 2) * thumbScale, thumbOy - 600 * thumbScale, thumbScale, 'side');

                this.renderTruckFront(thumbFrontTruckNode, thumbOx, thumbOy, thumbScale, true);
                this.renderGeodesic(thumbFrontGeoNode, thumbOx, thumbOy - 600 * thumbScale, thumbScale, 'front');

                this.renderTruckBack(thumbBackTruckNode, thumbOx, thumbOy, thumbScale, true);
                this.renderGeodesic(thumbBackGeoNode, thumbOx, thumbOy - 600 * thumbScale, thumbScale, 'back');
            }
        }
    }

    renderTruckSide(group, ox, oy, scale, showText = true) {
        const bedLengthScaled = this.bedLength * scale;
        const textLabel = showText ? `<text x="${ox}" y="${oy + 150}" fill="#64748b" font-size="16" font-weight="bold" font-family="monospace">SIDE VIEW</text>` : '';
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
            ${textLabel}
        `;
    }

    renderTruckFront(group, ox, oy, scale, showText = true) {
        const w = this.truckWidth * scale;
        const tW = 265 * scale;
        const tR = 380 * scale;
        const textLabel = showText ? `<text x="${ox - 50}" y="${oy + 150}" fill="#64748b" font-size="16" font-weight="bold" font-family="monospace">FRONT VIEW</text>` : '';
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
            ${textLabel}
        `;
    }

    renderTruckBack(group, ox, oy, scale, showText = true) {
        const w = this.truckWidth * scale;
        const tW = 265 * scale;
        const tR = 380 * scale;
        const textLabel = showText ? `<text x="${ox - 50}" y="${oy + 150}" fill="#64748b" font-size="16" font-weight="bold" font-family="monospace">BACK VIEW</text>` : '';
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
            ${textLabel}
        `;
    }

    renderGeodesic(group, ox, oy, scale, viewType) {
        const isHighlighting = this.highlightedFamily !== null || this.highlightedStrutId !== null;

        const mapCoords = (v) => {
            if (viewType === 'side') return { x: ox + v.z * scale, y: oy - v.y * scale };
            if (viewType === 'front') return { x: ox + v.x * scale, y: oy - v.y * scale };
            if (viewType === 'back') return { x: ox - v.x * scale, y: oy - v.y * scale };
        };

        // 1. Prepare and Sort Faces
        const visibleFaces = [];
        this.faces.forEach((face, fIdx) => {
            const segment = this.faceSegments[fIdx];
            const normal = this.faceNormals[fIdx];
            
            // Back-face Culling per view
            let isVisible = false;
            if (viewType === 'side') {
                if (normal.x >= 0) isVisible = true; // Show right side
            } else if (viewType === 'front') {
                if (normal.z <= 0) isVisible = true; // Show front
            } else if (viewType === 'back') {
                if (normal.z >= 0) isVisible = true; // Show back
            }

            if (!isVisible) return;

            // Door Cutout Culling
            if (segment === 'back') {
                const centroid = new THREE.Vector3();
                face.forEach(vIdx => centroid.add(this.vertices[vIdx]));
                centroid.divideScalar(3);
                // Cutout starts from floor (-100)
                if (Math.abs(centroid.x) < this.doorWidth / 2 && centroid.y < this.doorHeight - 100 && centroid.y > -100) {
                    return;
                }
            }

            // Calculate Depth for sorting
            const depthCentroid = new THREE.Vector3();
            face.forEach(vIdx => depthCentroid.add(this.vertices[vIdx]));
            depthCentroid.divideScalar(3);
            
            let depthValue = 0;
            if (viewType === 'side') depthValue = -depthCentroid.x;
            else if (viewType === 'front') depthValue = depthCentroid.z;
            else if (viewType === 'back') depthValue = -depthCentroid.z;

            visibleFaces.push({ face, fIdx, depthValue });
        });

        // Sort faces: Painters Algorithm (far to near)
        visibleFaces.sort((a, b) => b.depthValue - a.depthValue);

        // Draw sorted faces
        visibleFaces.forEach(({ face, fIdx }) => {
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

        // 2. Prepare and Sort Struts
        const visibleStruts = [];
        this.struts.forEach(strut => {
            const p1 = this.vertices[strut.v1Idx];
            const p2 = this.vertices[strut.v2Idx];

            let isVisible = false;
            if (viewType === 'side') {
                if (p1.x >= -10 || p2.x >= -10) isVisible = true;
            } else if (viewType === 'front') {
                if (p1.z <= 10 || p2.z <= 10) isVisible = true;
            } else if (viewType === 'back') {
                if (p1.z >= this.bedLength / 2 - 10 || p2.z >= this.bedLength / 2 - 10) isVisible = true;
            }

            if (!isVisible) return;

            let depthValue = 0;
            if (viewType === 'side') depthValue = -(p1.x + p2.x) / 2;
            else if (viewType === 'front') depthValue = (p1.z + p2.z) / 2;
            else if (viewType === 'back') depthValue = -(p1.z + p2.z) / 2;

            visibleStruts.push({ strut, depthValue });
        });

        visibleStruts.sort((a, b) => b.depthValue - a.depthValue);

        // Draw sorted struts
        visibleStruts.forEach(({ strut }) => {
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
                strokeColor = "#fb7185"; 
                strokeWidth = "2.5";
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
