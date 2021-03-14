/*
 * Copyright 2021 GFXFundamentals.
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
 *     * Neither the name of GFXFundamentals. nor the names of his
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

/**
 * Various functions to make simple primitives
 *
 * @module primitives
 */
(function(root, factory) {  // eslint-disable-line
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['./webgl-utils', './3d-math'], factory);
  } else {
    // Browser globals
    root.primitives = factory.call(root);
  }
}(this, function(webglUtils, m4) {
  'use strict';

  webglUtils = webglUtils || this.webglUtils;
  m4 = m4 || this.m4 || math3d;

  function allButIndices(name) {
    return name !== 'indices';
  }

  /**
   * Given indexed vertices creates a new set of vertices unindexed by expanding the indexed vertices.
   * @param {Object.<string, TypedArray>} vertices The indexed vertices to deindex
   * @return {Object.<string, TypedArray>} The deindexed vertices
   * @memberOf module:primitives
   */
  function deindexVertices(vertices) {
    const indices = vertices.indices;
    const newVertices = {};
    const numElements = indices.length;

    function expandToUnindexed(channel) {
      const srcBuffer = vertices[channel];
      const numComponents = srcBuffer.numComponents;
      const dstBuffer = webglUtils.createAugmentedTypedArray(numComponents, numElements, srcBuffer.constructor);
      for (let ii = 0; ii < numElements; ++ii) {
        const ndx = indices[ii];
        const offset = ndx * numComponents;
        for (let jj = 0; jj < numComponents; ++jj) {
          dstBuffer.push(srcBuffer[offset + jj]);
        }
      }
      newVertices[channel] = dstBuffer;
    }

    Object.keys(vertices).filter(allButIndices).forEach(expandToUnindexed);

    return newVertices;
  }

  /**
   * flattens the normals of deindexed vertices in place.
   * @param {Object.<string, TypedArray>} vertices The deindexed vertices who's normals to flatten
   * @return {Object.<string, TypedArray>} The flattened vertices (same as was passed in)
   * @memberOf module:primitives
   */
  function flattenNormals(vertices) {
    if (vertices.indices) {
      throw 'can\'t flatten normals of indexed vertices. deindex them first';
    }

    const normals = vertices.normal;
    const numNormals = normals.length;
    for (let ii = 0; ii < numNormals; ii += 9) {
      // pull out the 3 normals for this triangle
      const nax = normals[ii + 0];
      const nay = normals[ii + 1];
      const naz = normals[ii + 2];

      const nbx = normals[ii + 3];
      const nby = normals[ii + 4];
      const nbz = normals[ii + 5];

      const ncx = normals[ii + 6];
      const ncy = normals[ii + 7];
      const ncz = normals[ii + 8];

      // add them
      let nx = nax + nbx + ncx;
      let ny = nay + nby + ncy;
      let nz = naz + nbz + ncz;

      // normalize them
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

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
  }

  function applyFuncToV3Array(array, matrix, fn) {
    const len = array.length;
    const tmp = new Float32Array(3);
    for (let ii = 0; ii < len; ii += 3) {
      fn(matrix, [array[ii], array[ii + 1], array[ii + 2]], tmp);
      array[ii    ] = tmp[0];
      array[ii + 1] = tmp[1];
      array[ii + 2] = tmp[2];
    }
  }

  function transformNormal(mi, v, dst) {
    dst = dst || new Float32Array(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];

    dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
    dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
    dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

    return dst;
  }

  /**
   * Reorients directions by the given matrix..
   * @param {number[]|TypedArray} array The array. Assumes value floats per element.
   * @param {Matrix} matrix A matrix to multiply by.
   * @return {number[]|TypedArray} the same array that was passed in
   * @memberOf module:primitives
   */
  function reorientDirections(array, matrix) {
    applyFuncToV3Array(array, matrix, m4.transformDirection);
    return array;
  }

  /**
   * Reorients normals by the inverse-transpose of the given
   * matrix..
   * @param {number[]|TypedArray} array The array. Assumes value floats per element.
   * @param {Matrix} matrix A matrix to multiply by.
   * @return {number[]|TypedArray} the same array that was passed in
   * @memberOf module:primitives
   */
  function reorientNormals(array, matrix) {
    applyFuncToV3Array(array, m4.inverse(matrix), transformNormal);
    return array;
  }

  /**
   * Reorients positions by the given matrix. In other words, it
   * multiplies each vertex by the given matrix.
   * @param {number[]|TypedArray} array The array. Assumes value floats per element.
   * @param {Matrix} matrix A matrix to multiply by.
   * @return {number[]|TypedArray} the same array that was passed in
   * @memberOf module:primitives
   */
  function reorientPositions(array, matrix) {
    applyFuncToV3Array(array, matrix, m4.transformPoint);
    return array;
  }

  /**
   * Reorients arrays by the given matrix. Assumes arrays have
   * names that contains 'pos' could be reoriented as positions,
   * 'binorm' or 'tan' as directions, and 'norm' as normals.
   *
   * @param {Object.<string, (number[]|TypedArray)>} arrays The vertices to reorient
   * @param {Matrix} matrix matrix to reorient by.
   * @return {Object.<string, (number[]|TypedArray)>} same arrays that were passed in.
   * @memberOf module:primitives
   */
  function reorientVertices(arrays, matrix) {
    Object.keys(arrays).forEach(function(name) {
      const array = arrays[name];
      if (name.indexOf('pos') >= 0) {
        reorientPositions(array, matrix);
      } else if (name.indexOf('tan') >= 0 || name.indexOf('binorm') >= 0) {
        reorientDirections(array, matrix);
      } else if (name.indexOf('norm') >= 0) {
        reorientNormals(array, matrix);
      }
    });
    return arrays;
  }

  /**
   * creates a random integer between 0 and range - 1 inclusive.
   * @param {number} range
   * @return {number} random value between 0 and range - 1 inclusive.
   */
  function randInt(range) {
    return Math.random() * range | 0;
  }

  /**
   * Used to supply random colors
   * @callback RandomColorFunc
   * @param {number} ndx index of triangle/quad if unindexed or index of vertex if indexed
   * @param {number} channel 0 = red, 1 = green, 2 = blue, 3 = alpha
   * @return {number} a number from 0 to 255
   * @memberOf module:primitives
   */

  /**
   * @typedef {Object} RandomVerticesOptions
   * @property {number} [vertsPerColor] Defaults to 3 for non-indexed vertices
   * @property {module:primitives.RandomColorFunc} [rand] A function to generate random numbers
   * @memberOf module:primitives
   */

  /**
   * Creates an augmentedTypedArray of random vertex colors.
   * If the vertices are indexed (have an indices array) then will
   * just make random colors. Otherwise assumes they are triangless
   * and makes one random color for every 3 vertices.
   * @param {Object.<string, augmentedTypedArray>} vertices Vertices as returned from one of the createXXXVertices functions.
   * @param {module:primitives.RandomVerticesOptions} [options] options.
   * @return {Object.<string, augmentedTypedArray>} same vertices as passed in with `color` added.
   * @memberOf module:primitives
   */
  function makeRandomVertexColors(vertices, options) {
    options = options || {};
    const numElements = vertices.position.numElements;
    const vcolors = webglUtils.createAugmentedTypedArray(4, numElements, Uint8Array);
    const rand = options.rand || function(ndx, channel) {
      return channel < 3 ? randInt(256) : 255;
    };
    vertices.color = vcolors;
    if (vertices.indices) {
      // just make random colors if index
      for (let ii = 0; ii < numElements; ++ii) {
        vcolors.push(rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3));
      }
    } else {
      // make random colors per triangle
      const numVertsPerColor = options.vertsPerColor || 3;
      const numSets = numElements / numVertsPerColor;
      for (let ii = 0; ii < numSets; ++ii) {
        const color = [rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3)];
        for (let jj = 0; jj < numVertsPerColor; ++jj) {
          vcolors.push(color);
        }
      }
    }
    return vertices;
  }

  /**
   * creates a function that calls fn to create vertices and then
   * creates a buffers for them
   */
  function createBufferFunc(fn) {
    return function(gl) {
      const arrays = fn.apply(this, Array.prototype.slice.call(arguments, 1));
      return webglUtils.createBuffersFromArrays(gl, arrays);
    };
  }

  /**
   * creates a function that calls fn to create vertices and then
   * creates a bufferInfo object for them
   */
  function createBufferInfoFunc(fn) {
    return function(gl) {
      const arrays = fn.apply(null,  Array.prototype.slice.call(arguments, 1));
      return webglUtils.createBufferInfoFromArrays(gl, arrays);
    };
  }

  /**
   * Creates XZ plane vertices.
   * The created plane has position, normal and uv streams.
   *
   * @param {number} [width] Width of the plane. Default = 1
   * @param {number} [depth] Depth of the plane. Default = 1
   * @param {number} [subdivisionsWidth] Number of steps across the plane. Default = 1
   * @param {number} [subdivisionsDepth] Number of steps down the plane. Default = 1
   * @param {Matrix4} [matrix] A matrix by which to multiply all the vertices.
   * @return {Object.<string, TypedArray>} The
   *         created plane vertices.
   * @memberOf module:primitives
   */
  function createPlaneVertices(
      width,
      depth,
      subdivisionsWidth,
      subdivisionsDepth,
      matrix) {
    width = width || 1;
    depth = depth || 1;
    subdivisionsWidth = subdivisionsWidth || 1;
    subdivisionsDepth = subdivisionsDepth || 1;
    matrix = matrix || m4.identity();

    const numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
    const positions = webglUtils.createAugmentedTypedArray(3, numVertices);
    const normals = webglUtils.createAugmentedTypedArray(3, numVertices);
    const texcoords = webglUtils.createAugmentedTypedArray(2, numVertices);

    for (let z = 0; z <= subdivisionsDepth; z++) {
      for (let x = 0; x <= subdivisionsWidth; x++) {
        const u = x / subdivisionsWidth;
        const v = z / subdivisionsDepth;
        positions.push(
            width * u - width * 0.5,
            0,
            depth * v - depth * 0.5);
        normals.push(0, 1, 0);
        texcoords.push(u, v);
      }
    }

    const numVertsAcross = subdivisionsWidth + 1;
    const indices = webglUtils.createAugmentedTypedArray(
        3, subdivisionsWidth * subdivisionsDepth * 2, Uint16Array);

    for (let z = 0; z < subdivisionsDepth; z++) {
      for (let x = 0; x < subdivisionsWidth; x++) {
        // Make triangle 1 of quad.
        indices.push(
            (z + 0) * numVertsAcross + x,
            (z + 1) * numVertsAcross + x,
            (z + 0) * numVertsAcross + x + 1);

        // Make triangle 2 of quad.
        indices.push(
            (z + 1) * numVertsAcross + x,
            (z + 1) * numVertsAcross + x + 1,
            (z + 0) * numVertsAcross + x + 1);
      }
    }

    const arrays = reorientVertices({
      position: positions,
      normal: normals,
      texcoord: texcoords,
      indices: indices,
    }, matrix);
    return arrays;
  }

  function createXYQuadVertices(size, xOffset, yOffset) {
    size = size || 2;
    xOffset = xOffset || 0;
    yOffset = yOffset || 0;
    size *= 0.5;
    return {
      position: {
        numComponents: 2,
        data: [
          xOffset + -1 * size, yOffset + -1 * size,
          xOffset +  1 * size, yOffset + -1 * size,
          xOffset + -1 * size, yOffset +  1 * size,
          xOffset +  1 * size, yOffset +  1 * size,
        ],
      },
      normal: [
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
      ],
      texcoord: [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
      ],
      indices: [ 0, 1, 2, 2, 1, 3 ],
    };
  }

  /**
   * Creates sphere vertices.
   * The created sphere has position, normal and uv streams.
   *
   * @param {number} radius radius of the sphere.
   * @param {number} subdivisionsAxis number of steps around the sphere.
   * @param {number} subdivisionsHeight number of vertically on the sphere.
   * @param {number} [opt_startLatitudeInRadians] where to start the
   *     top of the sphere. Default = 0.
   * @param {number} [opt_endLatitudeInRadians] Where to end the
   *     bottom of the sphere. Default = Math.PI.
   * @param {number} [opt_startLongitudeInRadians] where to start
   *     wrapping the sphere. Default = 0.
   * @param {number} [opt_endLongitudeInRadians] where to end
   *     wrapping the sphere. Default = 2 * Math.PI.
   * @return {Object.<string, TypedArray>} The
   *         created plane vertices.
   * @memberOf module:primitives
   */
  function createSphereVertices(
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

    const latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
    const longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;

    // We are going to generate our sphere by iterating through its
    // spherical coordinates and generating 2 triangles for each quad on a
    // ring of the sphere.
    const numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
    const positions = webglUtils.createAugmentedTypedArray(3, numVertices);
    const normals   = webglUtils.createAugmentedTypedArray(3, numVertices);
    const texCoords = webglUtils.createAugmentedTypedArray(2 , numVertices);

    // Generate the individual vertices in our vertex buffer.
    for (let y = 0; y <= subdivisionsHeight; y++) {
      for (let x = 0; x <= subdivisionsAxis; x++) {
        // Generate a vertex based on its spherical coordinates
        const u = x / subdivisionsAxis;
        const v = y / subdivisionsHeight;
        const theta = longRange * u + opt_startLongitudeInRadians;
        const phi = latRange * v + opt_startLatitudeInRadians;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const ux = cosTheta * sinPhi;
        const uy = cosPhi;
        const uz = sinTheta * sinPhi;
        positions.push(radius * ux, radius * uy, radius * uz);
        normals.push(ux, uy, uz);
        texCoords.push(1 - u, v);
      }
    }

    const numVertsAround = subdivisionsAxis + 1;
    const indices = webglUtils.createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
    for (let x = 0; x < subdivisionsAxis; x++) {
      for (let y = 0; y < subdivisionsHeight; y++) {
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
  }

  /**
   * Array of the indices of corners of each face of a cube.
   * @type {Array.<number[]>}
   */
  const CUBE_FACE_INDICES = [
    [3, 7, 5, 1], // right
    [6, 2, 0, 4], // left
    [6, 7, 3, 2], // ??
    [0, 1, 5, 4], // ??
    [7, 6, 4, 5], // front
    [2, 3, 1, 0], // back
  ];

  /**
   * Creates the vertices and indices for a cube. The
   * cube will be created around the origin. (-size / 2, size / 2)
   *
   * @param {number} size Width, height and depth of the cube.
   * @return {Object.<string, TypedArray>} The
   *         created plane vertices.
   * @memberOf module:primitives
   */
  function createCubeVertices(size) {
    const k = size / 2;

    const cornerVertices = [
      [-k, -k, -k],
      [+k, -k, -k],
      [-k, +k, -k],
      [+k, +k, -k],
      [-k, -k, +k],
      [+k, -k, +k],
      [-k, +k, +k],
      [+k, +k, +k],
    ];

    const faceNormals = [
      [+1, +0, +0],
      [-1, +0, +0],
      [+0, +1, +0],
      [+0, -1, +0],
      [+0, +0, +1],
      [+0, +0, -1],
    ];

    const uvCoords = [
      [1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ];

    const numVertices = 6 * 4;
    const positions = webglUtils.createAugmentedTypedArray(3, numVertices);
    const normals   = webglUtils.createAugmentedTypedArray(3, numVertices);
    const texCoords = webglUtils.createAugmentedTypedArray(2 , numVertices);
    const indices   = webglUtils.createAugmentedTypedArray(3, 6 * 2, Uint16Array);

    for (let f = 0; f < 6; ++f) {
      const faceIndices = CUBE_FACE_INDICES[f];
      for (let v = 0; v < 4; ++v) {
        const position = cornerVertices[faceIndices[v]];
        const normal = faceNormals[f];
        const uv = uvCoords[v];

        // Each face needs all four vertices because the normals and texture
        // coordinates are not all the same.
        positions.push(position);
        normals.push(normal);
        texCoords.push(uv);

      }
      // Two triangles make a square face.
      const offset = 4 * f;
      indices.push(offset + 0, offset + 1, offset + 2);
      indices.push(offset + 0, offset + 2, offset + 3);
    }

    return {
      position: positions,
      normal: normals,
      texcoord: texCoords,
      indices: indices,
    };
  }

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
   * @param {boolean} [opt_topCap] Create top cap. Default = true.
   * @param {boolean} [opt_bottomCap] Create bottom cap. Default =
   *        true.
   * @return {Object.<string, TypedArray>} The
   *         created plane vertices.
   * @memberOf module:primitives
   */
  function createTruncatedConeVertices(
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

    const topCap = (opt_topCap === undefined) ? true : opt_topCap;
    const bottomCap = (opt_bottomCap === undefined) ? true : opt_bottomCap;

    const extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

    const numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
    const positions = webglUtils.createAugmentedTypedArray(3, numVertices);
    const normals   = webglUtils.createAugmentedTypedArray(3, numVertices);
    const texCoords = webglUtils.createAugmentedTypedArray(2, numVertices);
    const indices   = webglUtils.createAugmentedTypedArray(3, radialSubdivisions * (verticalSubdivisions + extra) * 2, Uint16Array);

    const vertsAroundEdge = radialSubdivisions + 1;

    // The slant of the cone is constant across its surface
    const slant = Math.atan2(bottomRadius - topRadius, height);
    const cosSlant = Math.cos(slant);
    const sinSlant = Math.sin(slant);

    const start = topCap ? -2 : 0;
    const end = verticalSubdivisions + (bottomCap ? 2 : 0);

    for (let yy = start; yy <= end; ++yy) {
      let v = yy / verticalSubdivisions;
      let y = height * v;
      let ringRadius;
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
      if (yy === -2 || yy === verticalSubdivisions + 2) {
        ringRadius = 0;
        v = 0;
      }
      y -= height / 2;
      for (let ii = 0; ii < vertsAroundEdge; ++ii) {
        const sin = Math.sin(ii * Math.PI * 2 / radialSubdivisions);
        const cos = Math.cos(ii * Math.PI * 2 / radialSubdivisions);
        positions.push(sin * ringRadius, y, cos * ringRadius);
        normals.push(
            (yy < 0 || yy > verticalSubdivisions) ? 0 : (sin * cosSlant),
            (yy < 0) ? -1 : (yy > verticalSubdivisions ? 1 : sinSlant),
            (yy < 0 || yy > verticalSubdivisions) ? 0 : (cos * cosSlant));
        texCoords.push((ii / radialSubdivisions), 1 - v);
      }
    }

    for (let yy = 0; yy < verticalSubdivisions + extra; ++yy) {
      for (let ii = 0; ii < radialSubdivisions; ++ii) {
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
  }

  /**
   * Expands RLE data
   * @param {number[]} rleData data in format of run-length, x, y, z, run-length, x, y, z
   * @param {number[]} [padding] value to add each entry with.
   * @return {number[]} the expanded rleData
   */
  function expandRLEData(rleData, padding) {
    padding = padding || [];
    const data = [];
    for (let ii = 0; ii < rleData.length; ii += 4) {
      const runLength = rleData[ii];
      const element = rleData.slice(ii + 1, ii + 4);
      element.push.apply(element, padding);
      for (let jj = 0; jj < runLength; ++jj) {
        data.push.apply(data, element);
      }
    }
    return data;
  }

  /**
   * Creates 3D 'F' vertices.
   * An 'F' is useful because you can easily tell which way it is oriented.
   * The created 'F' has position, normal and uv streams.
   *
   * @return {Object.<string, TypedArray>} The
   *         created plane vertices.
   * @memberOf module:primitives
   */
  function create3DFVertices() {

    const positions = [
      // left column front
      0,   0,  0,
      0, 150,  0,
      30,   0,  0,
      0, 150,  0,
      30, 150,  0,
      30,   0,  0,

      // top rung front
      30,   0,  0,
      30,  30,  0,
      100,   0,  0,
      30,  30,  0,
      100,  30,  0,
      100,   0,  0,

      // middle rung front
      30,  60,  0,
      30,  90,  0,
      67,  60,  0,
      30,  90,  0,
      67,  90,  0,
      67,  60,  0,

      // left column back
        0,   0,  30,
       30,   0,  30,
        0, 150,  30,
        0, 150,  30,
       30,   0,  30,
       30, 150,  30,

      // top rung back
       30,   0,  30,
      100,   0,  30,
       30,  30,  30,
       30,  30,  30,
      100,   0,  30,
      100,  30,  30,

      // middle rung back
       30,  60,  30,
       67,  60,  30,
       30,  90,  30,
       30,  90,  30,
       67,  60,  30,
       67,  90,  30,

      // top
        0,   0,   0,
      100,   0,   0,
      100,   0,  30,
        0,   0,   0,
      100,   0,  30,
        0,   0,  30,

      // top rung right
      100,   0,   0,
      100,  30,   0,
      100,  30,  30,
      100,   0,   0,
      100,  30,  30,
      100,   0,  30,

      // under top rung
      30,   30,   0,
      30,   30,  30,
      100,  30,  30,
      30,   30,   0,
      100,  30,  30,
      100,  30,   0,

      // between top rung and middle
      30,   30,   0,
      30,   60,  30,
      30,   30,  30,
      30,   30,   0,
      30,   60,   0,
      30,   60,  30,

      // top of middle rung
      30,   60,   0,
      67,   60,  30,
      30,   60,  30,
      30,   60,   0,
      67,   60,   0,
      67,   60,  30,

      // right of middle rung
      67,   60,   0,
      67,   90,  30,
      67,   60,  30,
      67,   60,   0,
      67,   90,   0,
      67,   90,  30,

      // bottom of middle rung.
      30,   90,   0,
      30,   90,  30,
      67,   90,  30,
      30,   90,   0,
      67,   90,  30,
      67,   90,   0,

      // right of bottom
      30,   90,   0,
      30,  150,  30,
      30,   90,  30,
      30,   90,   0,
      30,  150,   0,
      30,  150,  30,

      // bottom
      0,   150,   0,
      0,   150,  30,
      30,  150,  30,
      0,   150,   0,
      30,  150,  30,
      30,  150,   0,

      // left side
      0,   0,   0,
      0,   0,  30,
      0, 150,  30,
      0,   0,   0,
      0, 150,  30,
      0, 150,   0,
    ];

    const texcoords = [
      // left column front
      0.22, 0.19,
      0.22, 0.79,
      0.34, 0.19,
      0.22, 0.79,
      0.34, 0.79,
      0.34, 0.19,

      // top rung front
      0.34, 0.19,
      0.34, 0.31,
      0.62, 0.19,
      0.34, 0.31,
      0.62, 0.31,
      0.62, 0.19,

      // middle rung front
      0.34, 0.43,
      0.34, 0.55,
      0.49, 0.43,
      0.34, 0.55,
      0.49, 0.55,
      0.49, 0.43,

      // left column back
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,

      // top rung back
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,

      // middle rung back
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,

      // top
      0, 0,
      1, 0,
      1, 1,
      0, 0,
      1, 1,
      0, 1,

      // top rung right
      0, 0,
      1, 0,
      1, 1,
      0, 0,
      1, 1,
      0, 1,

      // under top rung
      0, 0,
      0, 1,
      1, 1,
      0, 0,
      1, 1,
      1, 0,

      // between top rung and middle
      0, 0,
      1, 1,
      0, 1,
      0, 0,
      1, 0,
      1, 1,

      // top of middle rung
      0, 0,
      1, 1,
      0, 1,
      0, 0,
      1, 0,
      1, 1,

      // right of middle rung
      0, 0,
      1, 1,
      0, 1,
      0, 0,
      1, 0,
      1, 1,

      // bottom of middle rung.
      0, 0,
      0, 1,
      1, 1,
      0, 0,
      1, 1,
      1, 0,

      // right of bottom
      0, 0,
      1, 1,
      0, 1,
      0, 0,
      1, 0,
      1, 1,

      // bottom
      0, 0,
      0, 1,
      1, 1,
      0, 0,
      1, 1,
      1, 0,

      // left side
      0, 0,
      0, 1,
      1, 1,
      0, 0,
      1, 1,
      1, 0,
    ];

    const normals = expandRLEData([
      // left column front
      // top rung front
      // middle rung front
      18, 0, 0, 1,

      // left column back
      // top rung back
      // middle rung back
      18, 0, 0, -1,

      // top
      6, 0, 1, 0,

      // top rung right
      6, 1, 0, 0,

      // under top rung
      6, 0, -1, 0,

      // between top rung and middle
      6, 1, 0, 0,

      // top of middle rung
      6, 0, 1, 0,

      // right of middle rung
      6, 1, 0, 0,

      // bottom of middle rung.
      6, 0, -1, 0,

      // right of bottom
      6, 1, 0, 0,

      // bottom
      6, 0, -1, 0,

      // left side
      6, -1, 0, 0,
    ]);

    const colors = expandRLEData([
          // left column front
          // top rung front
          // middle rung front
        18, 200,  70, 120,

          // left column back
          // top rung back
          // middle rung back
        18, 80, 70, 200,

          // top
        6, 70, 200, 210,

          // top rung right
        6, 200, 200, 70,

          // under top rung
        6, 210, 100, 70,

          // between top rung and middle
        6, 210, 160, 70,

          // top of middle rung
        6, 70, 180, 210,

          // right of middle rung
        6, 100, 70, 210,

          // bottom of middle rung.
        6, 76, 210, 100,

          // right of bottom
        6, 140, 210, 80,

          // bottom
        6, 90, 130, 110,

          // left side
        6, 160, 160, 220,
    ], [255]);

    const numVerts = positions.length / 3;

    const arrays = {
      position: webglUtils.createAugmentedTypedArray(3, numVerts),
      texcoord: webglUtils.createAugmentedTypedArray(2,  numVerts),
      normal: webglUtils.createAugmentedTypedArray(3, numVerts),
      color: webglUtils.createAugmentedTypedArray(4, numVerts, Uint8Array),
      indices: webglUtils.createAugmentedTypedArray(3, numVerts / 3, Uint16Array),
    };

    arrays.position.push(positions);
    arrays.texcoord.push(texcoords);
    arrays.normal.push(normals);
    arrays.color.push(colors);

    for (let ii = 0; ii < numVerts; ++ii) {
      arrays.indices.push(ii);
    }

    return arrays;
  }

  function createFlattenedFunc(vertFunc) {
    return function(gl, ...args) {
      let vertices = vertFunc(...args);
      vertices = deindexVertices(vertices);
      vertices = makeRandomVertexColors(vertices, {
          vertsPerColor: 6,
          rand: function(ndx, channel) {
            return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
          },
        });
      return webglUtils.createBufferInfoFromArrays(gl, vertices);
    };
  }



  return {
    create3DFBufferInfo: createBufferInfoFunc(create3DFVertices),
    create3DFBuffer: createBufferFunc(create3DFVertices),
    create3DFVertices,
    create3DFWithVertexColorsBufferInfo: createFlattenedFunc(create3DFVertices),
    createCubeBufferInfo: createBufferInfoFunc(createCubeVertices),
    createCubeBuffers: createBufferFunc(createCubeVertices),
    createCubeVertices,
    createCubeWithVertexColorsBufferInfo: createFlattenedFunc(createCubeVertices),
    createPlaneBufferInfo: createBufferInfoFunc(createPlaneVertices),
    createPlaneBuffers: createBufferFunc(createPlaneVertices),
    createPlaneVertices,
    createPlaneWithVertexColorsBufferInfo: createFlattenedFunc(createPlaneVertices),
    createXYQuadBufferInfo: createBufferInfoFunc(createXYQuadVertices),
    createXYQuadBuffers: createBufferFunc(createXYQuadVertices),
    createXYQuadVertices,
    createXYQuadWithVertexColorsBufferInfo: createFlattenedFunc(createXYQuadVertices),
    createSphereBufferInfo: createBufferInfoFunc(createSphereVertices),
    createSphereBuffers: createBufferFunc(createSphereVertices),
    createSphereVertices,
    createSphereWithVertexColorsBufferInfo: createFlattenedFunc(createSphereVertices),
    createTruncatedConeBufferInfo: createBufferInfoFunc(createTruncatedConeVertices),
    createTruncatedConeBuffers: createBufferFunc(createTruncatedConeVertices),
    createTruncatedConeVertices,
    createTruncatedConeWithVertexColorsBufferInfo: createFlattenedFunc(createTruncatedConeVertices),
    deindexVertices,
    flattenNormals,
    makeRandomVertexColors,
    reorientDirections,
    reorientNormals,
    reorientPositions,
    reorientVertices,
  };

}));
