
/**
 * Creates a new height map for a function y = f(x, z).
 *
 * The num points arguments define the resolution of the grid.  Increasing
 * these without changing the arguments gives the same shape with more detail.
 *
 * The min/max/X/Z arguments give a bounding box that defines the range of
 * values sampled from the function f.
 *
 * Ex: HeightMap(pow, 2, 3, 1, 2, 0, 1) would sample pow(x, z) at these points:
 * (x,z) = (1, 0),   (2, 0),
 *         (1, 0.5), (2, 0.5),
 *         (1, 1),   (2, 1)
 *
 * And would end up with these vertices:
 * (x,y,z) = (1, 1, 0),   (2, 1, 0),
 *           (1, 1, 0.5), (2, sqrt(2), 0.5),
 *           (1, 1, 1),   (2, 2, 1)
 *
 * @param f - Function to derive y-values (height) for each (x,z) point
 *                in the grid
 * @param  numPointsX - Number of grid points in the x-dimension, at least 2
 * @param  numPointsZ - Number of grid points in the z-dimension, at least 2
 * @param  minX       - X value of the first point in the x-dimension
 * @param  maxX       - X value of the last point in the x-dimension
 * @param  minZ       - Z value of the first point in the z-dimension
 * @param  maxZ       - Z value of the last point in the z-dimension
 */
var HeightMap = function (f, numPointsX, numPointsZ, minX, maxX, minZ, maxZ) {
    let verticesArray = this.generateVertices(f, numPointsX, numPointsZ, minX, maxX, minZ, maxZ);
    this.vertices = new Float32Array(verticesArray);
    this.numVertices = verticesArray.length / 3;

    let wireframeIndicesArray = this.generateWireframeIndices(numPointsX, numPointsZ)
    this.wireframeIndices = new Uint16Array(wireframeIndicesArray);
    this.numWireframeIndices = wireframeIndicesArray.length;

    let meshIndicesArray = this.generateMeshIndices(numPointsX, numPointsZ)
    this.meshIndices = new Uint16Array(meshIndicesArray);
    this.numMeshIndices = meshIndicesArray.length;

    let normalsArray = this.generateNormals();
    this.normals = new Float32Array(normalsArray);
};

HeightMap.prototype.generateVertices = function (f, numPointsX, numPointsZ, minX, maxX, minZ, maxZ) {
    let verticesArray = [];

    // Generate vertices.  This produces an array of floats in which
    // every three values represents the x, y, and z coordinates of
    // one vertex.  Thus the vertex that is logically at index 'a' has
    // its three coordinates at array index 3a, 3a + 1, and 3a + 2.
    let xStep = (maxX - minX) / (numPointsX - 1);
    let zStep = (maxZ - minZ) / (numPointsZ - 1);
    let firstPoint = true;
    for (let z = 0; z < numPointsZ; z++) {
        for (let x = 0; x < numPointsX; x++) {
            // Figure out where the point is
            let sampleX = minX + x * xStep;
            let sampleZ = minZ + z * zStep;

            // Use the function to determine our height (y)
            let sampleY = f(sampleX, sampleZ);

            // Use the function to determine our height (y)
            verticesArray.push(sampleX);
            verticesArray.push(sampleY);
            verticesArray.push(sampleZ);

            // Check if this is a new minimum or maximum
            if (firstPoint || sampleY < this.minY)
                this.minY = sampleY;
            if (firstPoint || sampleY > this.maxY)
                this.maxY = sampleY;
            firstPoint = false;
        }
    }
    return verticesArray;
}

HeightMap.prototype.generateWireframeIndices = function (numPointsX, numPointsZ) {
    let indices = [];

    for (let z = 0; z < numPointsZ - 1; z++) {
        for (let x = 0; x < numPointsX - 1; x++) {
            // Grab one square from the grid and make it into five lines:
            //     (x-2) (x-1)   x   (x+1)
            // (z-2) * --- * --- * --- * --- ...
            //       |  \  |  \  |  \  |  \  ...
            // (z-1) * --- * --- * --- * --- ...
            //       |  \  |  \  |  \  |  \  ...
            //   z   * --- * --- * --- * --- ...
            //       |  \  |  \  |  \  |  \  ...
            // (z+1) * --- * --- * --- * --- ...
            //
            // If we are currently at (x,z), we make a square from these points:
            // P0: (x,z)   P1: (x+1,z)
            // P2: (x,z+1) P3: (x+1,z+1)
            //
            // We then make five lines to outline our triangles:
            // P0,P1  P1,P3  P3,P2  P2,P0  P0,P3
            //
            // Note we are expecting to use GL_LINES, not GL_LINE_STRIP.  (A line strip would
            // give a line tracing back across the grid at the start of each row.)
            //
            // We will be indexing into our 1d array of vertices.  The way we
            // calculated the vertices, the point that was obtained from a given
            // (x, z) pair will be located at index z * numPointsX + x.
            //

            let p0 = z * numPointsX + x;
            let p1 = p0 + 1;
            let p2 = p0 + numPointsX;
            let p3 = p2 + 1;

            indices.push(p0);
            indices.push(p1);

            indices.push(p1);
            indices.push(p3);

            indices.push(p3);
            indices.push(p2);

            indices.push(p2);
            indices.push(p0);

            indices.push(p0);
            indices.push(p3);
        }
    }
    return indices;
}

HeightMap.prototype.generateMeshIndices = function (numPointsX, numPointsZ) {
    // Grab one square from the grid and make it into two triangles:
    //     (x-2) (x-1)   x   (x+1)
    // (z-2) * --- * --- * --- * --- ...
    //       |  \  |  \  |  \  |  \  ...
    // (z-1) * --- * --- * --- * --- ...
    //       |  \  |  \  |  \  |  \  ...
    //   z   * --- * --- * --- * --- ...
    //       |  \  |  \  |  \  |  \  ...
    // (z+1) * --- * --- * --- * --- ...
    //
    // If we are currently at (x,z), we make a square from these points:
    // P0: (x,z)   P1: (x+1,z)
    // P2: (x,z+1) P3: (x+1,z+1)
    //
    // We then make two triangles in counter clockwise order:
    // P0,P2,P3  P0,P3,P1
    //

    // TODO

    var indices = [];

    for (var z = 0; z < numPointsZ - 1; z++) {
        for (var x = 0; x < numPointsX - 1; x++) {
            var P0 = x * numPointsX + z;
            var P1 = (x + 1) * numPointsX + z;
            var P2 = x * numPointsX + (z + 1);
            var P3 = (x + 1) * numPointsX + (z + 1);

            indices.push(P0, P2, P3);
            indices.push(P0, P3, P1);
        }
    }

    return indices;

}

HeightMap.prototype.generateNormals = function () {
    // Basic algorithm:  We have already the array 'vertices' in which
    // the vertex with logical index a has its three coordinates at actual
    // indices 3a, 3a + 1, 3a + 2 in the array of floats.  We want to
    // produce a parallel array 'normals' in which the same three positions
    // contain the coordinates for the normal vector at vertex a.  When we
    // say "the normal vector at vertex a" we mean a kind of "average"
    // of the face normals for the triangles that include vertex a.
    // It's not literally an average, but what we do is add up the neighboring
    // face normals, and then normalize the result.
    //
    // This is easier in practice than it might sound.
    // First, create an array of zeros whose length is the same as the
    // 'vertices' array.  The normal vector for vertex with index a will
    // have its coordinates at indices 3a, 3a + 1, 3a + 2.  So iterate over
    // all the triangles using the mesh indices. You get three indices,
    // say a, b, and c, for the vertices of each triangle. For each you
    // get three numbers for the coordinates of each vertex.
    // Use a cross product to find th the face normal, and normalize it.
    // Then ADD those three coordinates to the corresponding locations
    // 3a, 3a + 1, 3a + 2 in the normals array, likewise for b and c.
    // When that's all done for each triangle, you have an array such that
    // each triple of indices of the form 3a, 3a + 1, 3a + 2 will contain
    // the sum of the normalized face normals for all triangles containing
    // that particular vertex a.
    //
    // Then all you have to do is iterate over the whole thing and
    // normalize each of those triples.

    //TODO


    var normals = new Array(this.vertices.length);
    normals.fill(0);

    let n = this.numMeshIndices;

    for (var i = 0; i < n; i += 3) {
        var a = this.meshIndices[i];
        var b = this.meshIndices[i + 1];
        var c = this.meshIndices[i + 2];

        var vertexA = new THREE.Vector3(
            this.vertices[3 * a],
            this.vertices[3 * a + 1],
            this.vertices[3 * a + 2]
        );
        var vertexB = new THREE.Vector3(
            this.vertices[3 * b],
            this.vertices[3 * b + 1],
            this.vertices[3 * b + 2]
        );
        var vertexC = new THREE.Vector3(
            this.vertices[3 * c],
            this.vertices[3 * c + 1],
            this.vertices[3 * c + 2]
        );

        var faceNormal = new THREE.Vector3()
            .crossVectors(vertexB.clone().sub(vertexA), vertexC.clone().sub(vertexA))
            .normalize();

        normals[3 * a] += faceNormal.x;
        normals[3 * a + 1] += faceNormal.y;
        normals[3 * a + 2] += faceNormal.z;
        normals[3 * b] += faceNormal.x;
        normals[3 * b + 1] += faceNormal.y;
        normals[3 * b + 2] += faceNormal.z;
        normals[3 * c] += faceNormal.x;
        normals[3 * c + 1] += faceNormal.y;
        normals[3 * c + 2] += faceNormal.z;
    }

    for (var i = 0; i < normals.length; i += 3) {
        var normal = new THREE.Vector3(normals[i], normals[i + 1], normals[i + 2]);
        normal.normalize();
        normals[i] = normal.x;
        normals[i + 1] = normal.y;
        normals[i + 2] = normal.z;
    }

    return normals;
}

// Helper function for computing cross products.
// If (a1, a2, a3), (b1, b2, b3), (c1, c2, c3) are coordinates
// for three vertices of a triangle, in counterclockwise order,
// this function returns an outward-facing normal vector for
// the triangle.  The result is normalized and is returned as
// a JS array with three elements.
function crossProduct(a1, a2, a3, b1, b2, b3, c1, c2, c3) {

    let u1 = b1 - a1;
    let u2 = b2 - a2;
    let u3 = b3 - a3;
    let v1 = c1 - a1;
    let v2 = c2 - a2;
    let v3 = c3 - a3;
    let n1 = u2 * v3 - u3 * v2;
    let n2 = u3 * v1 - u1 * v3
    let n3 = u1 * v2 - u2 * v1;

    // then normalize
    let d = 1 / Math.sqrt(n1 * n1 + n2 * n2 + n3 * n3)
    return [n1 * d, n2 * d, n3 * d];
}