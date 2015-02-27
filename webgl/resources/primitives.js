/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of his
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

(function() {

/**
 * Creates sphere vertices.
 * The created sphere has position, normal and uv streams.
 *
 * @param {number} radius radius of the sphere.
 * @param {number} subdivisionsAxis number of steps around the sphere.
 * @param {number} subdivisionsHeight number of vertically on the sphere.
 * @param {number} opt_startLatitudeInRadians where to start the
 *     top of the sphere. Default = 0.
 * @param {number} opt_endLatitudeInRadians Where to end the
 *     bottom of the sphere. Default = Math.PI.
 * @param {number} opt_startLongitudeInRadians where to start
 *     wrapping the sphere. Default = 0.
 * @param {number} opt_endLongitudeInRadians where to end
 *     wrapping the sphere. Default = 2 * Math.PI.
 * @return {Object.<string, TypedArray>} The
 *         created plane vertices.
 */
var createSphereVertices = function(
    radius,
    subdivisionsAxis,
    subdivisionsHeight,
    opt_startLatitudeInRadians,
    opt_endLatitudeInRadians,
    opt_startLongitudeInRadians,
    opt_endLongitudeInRadians) {
  if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
    throw Error('subdivisionAxis and subdivisionHeight must be > 0');
  }

  opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
  opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
  opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
  opt_endLongitudeInRadians = opt_endLongitudeInRadians || (Math.PI * 2);

  var latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
  var longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;

  // We are going to generate our sphere by iterating through its
  // spherical coordinates and generating 2 triangles for each quad on a
  // ring of the sphere.
  var numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
  var positions = createAugmentedTypedArray(3, numVertices);
  var normals   = createAugmentedTypedArray(3, numVertices);
  var texCoords = createAugmentedTypedArray(2 , numVertices);

  // Generate the individual vertices in our vertex buffer.
  for (var y = 0; y <= subdivisionsHeight; y++) {
    for (var x = 0; x <= subdivisionsAxis; x++) {
      // Generate a vertex based on its spherical coordinates
      var u = x / subdivisionsAxis;
      var v = y / subdivisionsHeight;
      var theta = longRange * u;
      var phi = latRange * v;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);
      var ux = cosTheta * sinPhi;
      var uy = cosPhi;
      var uz = sinTheta * sinPhi;
      positions.push(radius * ux, radius * uy, radius * uz);
      normals.push(ux, uy, uz);
      texCoords.push(1 - u, v);
    }
  }

  var numVertsAround = subdivisionsAxis + 1;
  var indices = createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
  for (var x = 0; x < subdivisionsAxis; x++) {
    for (var y = 0; y < subdivisionsHeight; y++) {
      // Make triangle 1 of quad.
      indices.push(
          (y + 0) * numVertsAround + x,
          (y + 0) * numVertsAround + x + 1,
          (y + 1) * numVertsAround + x);

      // Make triangle 2 of quad.
      indices.push(
          (y + 1) * numVertsAround + x,
          (y + 0) * numVertsAround + x + 1,
          (y + 1) * numVertsAround + x + 1);
    }
  }

  return {
    position: positions,
    normal: normals,
    texcoord: texCoords,
    indices: indices,
  };
};

/**
 * Array of the indices of corners of each face of a cube.
 * @type {number[][]}
 */
var CUBE_FACE_INDICES = [
  [3, 7, 5, 1], // right
  [6, 2, 0, 4], // left
  [6, 7, 3, 2], // ??
  [0, 1, 5, 4], // ??
  [7, 6, 4, 5], // front
  [2, 3, 1, 0]  // back
];

/**
 * Creates the vertices and indices for a cube. The
 * cube will be created around the origin. (-size / 2, size / 2)
 *
 * @param {number} size Width, height and depth of the cube.
 * @return {Object.<string, TypedArray>} The
 *         created plane vertices.
 */
var createCubeVertices = function(size) {
  var k = size / 2;

  var cornerVertices = [
    [-k, -k, -k],
    [+k, -k, -k],
    [-k, +k, -k],
    [+k, +k, -k],
    [-k, -k, +k],
    [+k, -k, +k],
    [-k, +k, +k],
    [+k, +k, +k],
  ];

  var faceNormals = [
    [+1, +0, +0],
    [-1, +0, +0],
    [+0, +1, +0],
    [+0, -1, +0],
    [+0, +0, +1],
    [+0, +0, -1],
  ];

  var uvCoords = [
    [1, 0],
    [0, 0],
    [0, 1],
    [1, 1]
  ];

  var numVertices = 6 * 4;
  var positions = createAugmentedTypedArray(3, numVertices);
  var normals   = createAugmentedTypedArray(3, numVertices);
  var texCoords = createAugmentedTypedArray(2 , numVertices);
  var indices   = createAugmentedTypedArray(3, 6 * 2, Uint16Array);

  for (var f = 0; f < 6; ++f) {
    var faceIndices = CUBE_FACE_INDICES[f];
    for (var v = 0; v < 4; ++v) {
      var position = cornerVertices[faceIndices[v]];
      var normal = faceNormals[f];
      var uv = uvCoords[v];

      // Each face needs all four vertices because the normals and texture
      // coordinates are not all the same.
      positions.push(position);
      normals.push(normal);
      texCoords.push(uv);

    }
    // Two triangles make a square face.
    var offset = 4 * f;
    indices.push(offset + 0, offset + 1, offset + 2);
    indices.push(offset + 0, offset + 2, offset + 3);
  }

  return {
    position: positions,
    normal: normals,
    texcoord: texCoords,
    indices: indices,
  };
};

/**
 * Creates vertices for a truncated cone, which is like a cylinder
 * except that it has different top and bottom radii. A truncated cone
 * can also be used to create cylinders and regular cones. The
 * truncated cone will be created centered about the origin, with the
 * y axis as its vertical axis. The created cone has position, normal
 * and uv streams.
 *
 * @param {number} bottomRadius Bottom radius of truncated cone.
 * @param {number} topRadius Top radius of truncated cone.
 * @param {number} height Height of truncated cone.
 * @param {number} radialSubdivisions The number of subdivisions around the
 *     truncated cone.
 * @param {number} verticalSubdivisions The number of subdivisions down the
 *     truncated cone.
 * @param {boolean?} opt_topCap Create top cap. Default = true.
 * @param {boolean?} opt_bottomCap Create bottom cap. Default =
 *        true.
 * @return {Object.<string, TypedArray>} The
 *         created plane vertices.
 */
var createTruncatedConeVertices = function(
    bottomRadius,
    topRadius,
    height,
    radialSubdivisions,
    verticalSubdivisions,
    opt_topCap,
    opt_bottomCap) {
  if (radialSubdivisions < 3) {
    throw Error('radialSubdivisions must be 3 or greater');
  }

  if (verticalSubdivisions < 1) {
    throw Error('verticalSubdivisions must be 1 or greater');
  }

  var topCap = (opt_topCap === undefined) ? true : opt_topCap;
  var bottomCap = (opt_bottomCap === undefined) ? true : opt_bottomCap;

  var extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

  var numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
  var positions = createAugmentedTypedArray(3, numVertices);
  var normals   = createAugmentedTypedArray(3, numVertices);
  var texCoords = createAugmentedTypedArray(2, numVertices);
  var indices   = createAugmentedTypedArray(3, radialSubdivisions * (verticalSubdivisions + extra) * 2, Uint16Array);

  var vertsAroundEdge = radialSubdivisions + 1;

  // The slant of the cone is constant across its surface
  var slant = Math.atan2(bottomRadius - topRadius, height);
  var cosSlant = Math.cos(slant);
  var sinSlant = Math.sin(slant);

  var start = topCap ? -2 : 0;
  var end = verticalSubdivisions + (bottomCap ? 2 : 0);

  for (var yy = start; yy <= end; ++yy) {
    var v = yy / verticalSubdivisions
    var y = height * v;
    var ringRadius;
    if (yy < 0) {
      y = 0;
      v = 1;
      ringRadius = bottomRadius;
    } else if (yy > verticalSubdivisions) {
      y = height;
      v = 1;
      ringRadius = topRadius;
    } else {
      ringRadius = bottomRadius +
        (topRadius - bottomRadius) * (yy / verticalSubdivisions);
    }
    if (yy == -2 || yy == verticalSubdivisions + 2) {
      ringRadius = 0;
      v = 0;
    }
    y -= height / 2;
    for (var ii = 0; ii < vertsAroundEdge; ++ii) {
      var sin = Math.sin(ii * Math.PI * 2 / radialSubdivisions);
      var cos = Math.cos(ii * Math.PI * 2 / radialSubdivisions);
      positions.push(sin * ringRadius, y, cos * ringRadius);
      normals.push(
          (yy < 0 || yy > verticalSubdivisions) ? 0 : (sin * cosSlant),
          (yy < 0) ? -1 : (yy > verticalSubdivisions ? 1 : sinSlant),
          (yy < 0 || yy > verticalSubdivisions) ? 0 : (cos * cosSlant));
      texCoords.push((ii / radialSubdivisions), 1 - v);
    }
  }

  for (var yy = 0; yy < verticalSubdivisions + extra; ++yy) {
    for (var ii = 0; ii < radialSubdivisions; ++ii) {
      indices.push(vertsAroundEdge * (yy + 0) + 0 + ii,
                   vertsAroundEdge * (yy + 0) + 1 + ii,
                   vertsAroundEdge * (yy + 1) + 1 + ii);
      indices.push(vertsAroundEdge * (yy + 0) + 0 + ii,
                   vertsAroundEdge * (yy + 1) + 1 + ii,
                   vertsAroundEdge * (yy + 1) + 0 + ii);
    }
  }

  return {
    position: positions,
    normal: normals,
    texcoord: texCoords,
    indices: indices,
  };
};

var allButIndices = function(name) {
  return name !== "indices";
};

/**
 * Given indexed vertices creates a new set of vertices unindexed by expanding the indexed vertices.
 * @param {Object.<string, TypedArray>} vertices The indexed vertices to deindex
 * @return {Object.<string, TypedArray>} The deindexed vertices
 */
var deindexVertices = function(vertices) {
  var indices = vertices.indices;
  var newVertices = {};
  var numElements = indices.length;

  function expandToUnindexed(channel) {
    var srcBuffer = vertices[channel];
    var numComponents = srcBuffer.numComponents;
    var dstBuffer = createAugmentedTypedArray(numComponents, numElements, srcBuffer.constructor);
    for (var ii = 0; ii < numElements; ++ii) {
      var ndx = indices[ii];
      var offset = ndx * numComponents;
      for (var jj = 0; jj < numComponents; ++jj) {
        dstBuffer.push(srcBuffer[offset + jj]);
      }
    }
    newVertices[channel] = dstBuffer;
  }

  Object.keys(vertices).filter(allButIndices).forEach(expandToUnindexed);

  return newVertices;
};

/**
 * flattens the normals of deindexed vertices in place.
 * @param {Object.<string, TypedArray>} vertices The deindexed vertices who's normals to flatten
 * @return {Object.<string, TypedArray>} The flattened vertices (same as was passed in)
 */
var flattenNormals = function(vertices) {
  if (vertices.indices) {
    throw "can't flatten normals of indexed vertices. deindex them first";
  }

  var normals = vertices.normal;
  var numNormals = normals.length;
  for (var ii = 0; ii < numNormals; ii += 9) {
    // pull out the 3 normals for this triangle
    var nax = normals[ii + 0];
    var nay = normals[ii + 1];
    var naz = normals[ii + 2];

    var nbx = normals[ii + 3];
    var nby = normals[ii + 4];
    var nbz = normals[ii + 5];

    var ncx = normals[ii + 6];
    var ncy = normals[ii + 7];
    var ncz = normals[ii + 8];

    // add them
    var nx = nax + nbx + ncx;
    var ny = nay + nby + ncy;
    var nz = naz + nbz + ncz;

    // normalize them
    var length = Math.sqrt(nx * nx + ny * ny + nz * nz);

    nx /= length;
    ny /= length;
    nz /= length;

    // copy them back in
    normals[ii + 0] = nx;
    normals[ii + 1] = ny;
    normals[ii + 2] = nz;

    normals[ii + 3] = nx;
    normals[ii + 4] = ny;
    normals[ii + 5] = nz;

    normals[ii + 6] = nx;
    normals[ii + 7] = ny;
    normals[ii + 8] = nz;
  }

  return vertices;
};

/**
 * creates a random integer between 0 and range - 1 inclusive.
 * @param {number} range
 * @return {number} random value between 0 and range - 1 inclusive.
 */
var randInt = function(range) {
  return Math.random() * range | 0;
};

/**
 * Creates an augmentedTypedArray of random vertex colors.
 * If the vertices are indexed (have an indices array) then will
 * just make random colors. Otherwise assumes they are triangless
 * and makes one random color for every 3 vertices.
 */
var makeRandomVertexColors = function(vertices) {
  var numElements = vertices.position.numElements;
  var vcolors = createAugmentedTypedArray(4, numElements, Uint8Array);
  vertices.color = vcolors;
  if (vertices.indices) {
    // just make random colors if index
    for (var ii = 0; ii < numElements; ++ii) {
      vcolors.push(randInt(256), randInt(256), randInt(256), 255);
    }
  } else {
    // make random colors per triangle
    var numTriangles = numElements / 3;
    for (var ii = 0; ii < numTriangles; ++ii) {
      var color = [randInt(256), randInt(256), randInt(256), 255];
      vcolors.push(color);
      vcolors.push(color);
      vcolors.push(color);
    }
  }
  return vertices;
};

/**
 * creates a function that calls fn to create vertices and then
 * creates a buffers for them
 */
var createBufferFunc = function(fn) {
  return function(gl) {
    var arrays = fn.apply(this, Array.prototype.slice.call(arguments, 1));
    return createBuffersFromArrays(gl, arrays);
  }
};

/**
 * creates a function that calls fn to create vertices and then
 * creates a bufferInfo object for them
 */
var createBufferInfoFunc = function(fn) {
  return function(gl) {
    var arrays = fn.apply(null,  Array.prototype.slice.call(arguments, 1));
    return createBufferInfoFromArrays(gl, arrays);
  };
};

var primitives = {
  createCubeBufferInfo: createBufferInfoFunc(createCubeVertices),
  createCubeBuffers: createBufferFunc(createCubeVertices),
  createCubeVertices: createCubeVertices,
  createSphereBufferInfo: createBufferInfoFunc(createSphereVertices),
  createSphereBuffers: createBufferFunc(createSphereVertices),
  createSphereVertices: createSphereVertices,
  createTruncatedConeBufferInfo: createBufferFunc(createTruncatedConeVertices),
  createTruncatedConeBuffers: createBufferFunc(createTruncatedConeVertices),
  createTruncatedConeVertices: createTruncatedConeVertices,
  deindexVertices: deindexVertices,
  flattenNormals: flattenNormals,
  makeRandomVertexColors: makeRandomVertexColors,
};

var isAMD = window.define && typeof window.define === "function";

if (isAMD) {
  define([], function() { return primitives; });
} else {
  window.primitives = primitives;
}

}());
