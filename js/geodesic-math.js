class GeodesicMath {
    // Generate base icosahedron (frequency 1)
    static generateIcosahedron(radius = 1) {
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

        // Rotate so vertex 0 is at the top
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

        return baseFaces.map(face => [
            baseVertices[face[0]],
            baseVertices[face[1]],
            baseVertices[face[2]]
        ]);
    }

    // Extract unique edges from faces
    static getEdges(faces) {
        const edges = new Map();
        
        const getEdgeKey = (v1, v2) => {
            const k1 = `${v1.x.toFixed(3)},${v1.y.toFixed(3)},${v1.z.toFixed(3)}`;
            const k2 = `${v2.x.toFixed(3)},${v2.y.toFixed(3)},${v2.z.toFixed(3)}`;
            return k1 < k2 ? `${k1}-${k2}` : `${k2}-${k1}`;
        };

        faces.forEach(face => {
            for (let i = 0; i < face.length; i++) {
                const v1 = face[i];
                const v2 = face[(i + 1) % face.length];
                const v3 = face[(i + 2) % face.length]; // third vertex of the triangle
                const key = getEdgeKey(v1, v2);
                
                if (!edges.has(key)) {
                    edges.set(key, {
                        v1: v1.clone(),
                        v2: v2.clone(),
                        faces: [face],
                        thirdVertices: [v3.clone()]
                    });
                } else {
                    edges.get(key).faces.push(face);
                    edges.get(key).thirdVertices.push(v3.clone());
                }
            }
        });

        return Array.from(edges.values());
    }

    // Calculate angles for standard icosahedron struts
    static calculateIcosahedronStrutAngles() {
        // For a standard icosahedron:
        // Dihedral angle is acos(-sqrt(5)/3) ~ 138.189685 degrees
        const dihedral = Math.acos(-Math.sqrt(5) / 3) * 180 / Math.PI;
        // Bevel is half the supplement of the dihedral angle
        const bevel = (180 - dihedral) / 2;
        // Internal angle of equilateral triangle is 60 degrees
        // Standard miter is 90 - (60/2)? No, standard miter is 90 - 60 = 30 for Karma, or 90 - 60 = 30 for Standard.
        // Wait, for standard (trapezoid), miter = 90 - internal_angle/2 = 90 - 30 = 60? 
        // No! In dome-simulator.js:
        // const miter = this.jointStyle === 'double' ? Math.abs(90 - (angleAtVertex / 2)) : Math.abs(90 - angleAtVertex);
        // For 'karma' (single), it's 90 - 60 = 30 degrees.
        const miter = 30;

        return { miter, bevel };
    }
}

    static createStrutGeometry(boardLength, miterAngle1Rad, miterAngle2Rad, bevelAngleRad, jointStyle, independentTriangles, strutWidth, strutHeight, wSegsOverride) {
        const width = strutWidth / 1000; // Convert mm to meters
        const height = strutHeight / 1000; // Convert mm to meters
        
        const wSegs = wSegsOverride !== undefined ? wSegsOverride : (jointStyle === 'double' ? 2 : 1);
        const geometry = new THREE.BoxGeometry(width, boardLength, height, wSegs, 1, 1);
        
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        // Apply flat compound cuts to vertices
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            
            if (jointStyle === 'double' && !independentTriangles) {
                if (vertex.y > 0) {
                    // Top end: Double miter to form a point
                    const newY = boardLength / 2 - Math.abs(vertex.x) * Math.tan(miterAngle2Rad) + vertex.z * Math.tan(bevelAngleRad);
                    positions.setY(i, newY);
                } else {
                    // Bottom end: Double miter to form a point
                    const newY = -boardLength / 2 + Math.abs(vertex.x) * Math.tan(miterAngle1Rad) - vertex.z * Math.tan(bevelAngleRad);
                    positions.setY(i, newY);
                }
            } else {
                if (vertex.y > 0) {
                    // Top end: Single miter cut
                    const newY = boardLength / 2 - vertex.x * Math.tan(miterAngle2Rad) + vertex.z * Math.tan(bevelAngleRad);
                    positions.setY(i, newY);
                } else {
                    // Bottom end: Single miter cut
                    const newY = -boardLength / 2 + vertex.x * Math.tan(miterAngle1Rad) - vertex.z * Math.tan(bevelAngleRad);
                    positions.setY(i, newY);
                }
            }
        }
        
        geometry.computeVertexNormals();
        return geometry;
    }
}
