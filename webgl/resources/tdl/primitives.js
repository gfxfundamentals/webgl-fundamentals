/*
 * Copyright 2009, Google Inc.
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
 *     * Neither the name of Google Inc. nor the names of its
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
 * @fileoverview This file contains objects to make primitives.
 */

tdl.provide('tdl.primitives');

tdl.require('tdl.math');
tdl.require('tdl.log');

/**
 * A module for primitives.
 * @namespace
 */
tdl.primitives = tdl.primitives || {};

/**
 * AttribBuffer manages a TypedArray as an array of vectors.
 *
 * @param {number} numComponents Number of components per
 *     vector.
 * @param {number|!Array.<number>} numElements Number of vectors or the data.
 * @param {string} opt_type The type of the TypedArray to
 *     create. Default = 'Float32Array'.
 * @param {!Array.<number>} opt_data The data for the array.
 */
tdl.primitives.AttribBuffer = function(
    numComponents, numElements, opt_type) {
  opt_type = opt_type || 'Float32Array';
  var type = window[opt_type];
  if (numElements.length) {
    this.buffer = new type(numElements);
    numElements = this.buffer.length / numComponents;
    this.cursor = numElements;
  } else {
    this.buffer = new type(numComponents * numElements);
    this.cursor = 0;
  }
  this.numComponents = numComponents;
  this.numElements = numElements;
  this.type = opt_type;
};

tdl.primitives.AttribBuffer.prototype.stride = function() {
  return 0;
};

tdl.primitives.AttribBuffer.prototype.offset = function() {
  return 0;
};

tdl.primitives.AttribBuffer.prototype.getElement = function(index) {
  var offset = index * this.numComponents;
  var value = [];
  for (var ii = 0; ii < this.numComponents; ++ii) {
    value.push(this.buffer[offset + ii]);
  }
  return value;
};

tdl.primitives.AttribBuffer.prototype.setElement = function(index, value) {
  var offset = index * this.numComponents;
  for (var ii = 0; ii < this.numComponents; ++ii) {
    this.buffer[offset + ii] = value[ii];
  }
};

tdl.primitives.AttribBuffer.prototype.fillRange = function(index, count, value) {
  var offset = index * this.numComponents;
  for (var jj = 0; jj < count; ++jj) {
    for (var ii = 0; ii < this.numComponents; ++ii) {
      this.buffer[offset++] = value[ii];
    }
  }
};

tdl.primitives.AttribBuffer.prototype.clone = function() {
  var copy = new tdl.primitives.AttribBuffer(
      this.numComponents, this.numElements, this.type);
  copy.pushArray(this);
  return copy;
}

tdl.primitives.AttribBuffer.prototype.push = function(value) {
  this.setElement(this.cursor++, value);
};

tdl.primitives.AttribBuffer.prototype.pushArray = function(array) {
//  this.buffer.set(array, this.cursor * this.numComponents);
//  this.cursor += array.numElements;
  for (var ii = 0; ii < array.numElements; ++ii) {
    this.push(array.getElement(ii));
  }
};

tdl.primitives.AttribBuffer.prototype.pushArrayWithOffset =
   function(array, offset) {
  for (var ii = 0; ii < array.numElements; ++ii) {
    var elem = array.getElement(ii);
    for (var jj = 0; jj < offset.length; ++jj) {
      elem[jj] += offset[jj];
    }
    this.push(elem);
  }
};

/**
 * Computes the extents
 * @param {!AttribBuffer} positions The positions
 * @return {!{min: !tdl.math.Vector3, max:!tdl.math.Vector3}}
 *     The min and max extents.
 */
tdl.primitives.AttribBuffer.prototype.computeExtents = function() {
  var numElements = this.numElements;
  var numComponents = this.numComponents;
  var minExtent = this.getElement(0);
  var maxExtent = this.getElement(0);
  for (var ii = 1; ii < numElements; ++ii) {
    var element = this.getElement(ii);
    for (var jj = 0; jj < numComponents; ++jj) {
      minExtent[jj] = Math.min(minExtent[jj], element[jj]);
      maxExtent[jj] = Math.max(maxExtent[jj], element[jj]);
    }
  }
  return {min: minExtent, max: maxExtent};
};

/**
 * Reorients positions by the given matrix. In other words, it
 * multiplies each vertex by the given matrix.
 * @param {!tdl.primitives.AttribBuffer} array AttribBuffer to
 *     reorient.
 * @param {!tdl.math.Matrix4} matrix Matrix by which to
 *     multiply.
 */
tdl.primitives.mulComponents = function(array, multiplier) {
  var numElements = array.numElements;
  var numComponents = array.numComponents;
  for (var ii = 0; ii < numElements; ++ii) {
    var element = array.getElement(ii);
    for (var jj = 0; jj < numComponents; ++jj) {
      element[jj] *= multiplier[jj];
    }
    array.setElement(ii, element);
  }
};

/**
 * Reorients positions by the given matrix. In other words, it
 * multiplies each vertex by the given matrix.
 * @param {!tdl.primitives.AttribBuffer} array AttribBuffer to
 *     reorient.
 * @param {!tdl.math.Matrix4} matrix Matrix by which to
 *     multiply.
 */
tdl.primitives.reorientPositions = function(array, matrix) {
  var math = tdl.math;
  var numElements = array.numElements;
  for (var ii = 0; ii < numElements; ++ii) {
    array.setElement(ii,
        math.matrix4.transformPoint(matrix,
            array.getElement(ii)));
  }
};

/**
 * Reorients normals by the inverse-transpose of the given
 * matrix..
 * @param {!tdl.primitives.AttribBuffer} array AttribBuffer to
 *     reorient.
 * @param {!tdl.math.Matrix4} matrix Matrix by which to
 *     multiply.
 */
tdl.primitives.reorientNormals = function(array, matrix) {
  var math = tdl.math;
  var numElements = array.numElements;
  for (var ii = 0; ii < numElements; ++ii) {
    array.setElement(ii,
        math.matrix4.transformNormal(matrix,
            array.getElement(ii)));
  }
};

/**
 * Reorients directions by the given matrix..
 * @param {!tdl.primitives.AttribBuffer} array AttribBuffer to
 *     reorient.
 * @param {!tdl.math.Matrix4} matrix Matrix by which to
 *     multiply.
 */
tdl.primitives.reorientDirections = function(array, matrix) {
  var math = tdl.math;

  var numElements = array.numElements;
  for (var ii = 0; ii < numElements; ++ii) {
    array.setElement(ii,
        math.matrix4.transformDirection(matrix,
            array.getElement(ii)));
  }
};

/**
 * Reorients arrays by the given matrix. Assumes arrays have
 * names that start with 'position', 'normal', 'tangent',
 * 'binormal'
 *
 * @param {!Object.<string, !tdl.primitive.AttribBuffer>} arrays
 *        The arrays to remap.
 * @param {!tdl.math.Matrix4} matrix The matrix to remap by
 */
tdl.primitives.reorient = function(arrays, matrix) {
  for (var array in arrays) {
    if (array.match(/^position/)) {
      tdl.primitives.reorientPositions(arrays[array], matrix);
    } else if (array.match(/^normal/)) {
      tdl.primitives.reorientNormals(arrays[array], matrix);
    } else if (array.match(/^tangent/) || array.match(/^binormal/)) {
      tdl.primitives.reorientDirections(arrays[array], matrix);
    }
  }
};

/**
 * Creates tangents and normals.
 *
 * @param {!AttibArray} positionArray Positions
 * @param {!AttibArray} normalArray Normals
 * @param {!AttibArray} normalMapUVArray UVs for the normal map.
 * @param {!AttibArray} triangles The indicies of the trianlges.
 * @returns {!{tangent: {!AttribArray},
 *     binormal: {!AttribArray}}
 */
tdl.primitives.createTangentsAndBinormals = function(
    positionArray, normalArray, normalMapUVArray, triangles) {
  var math = tdl.math;
  // Maps from position, normal key to tangent and binormal matrix.
  var tangentFrames = {};

  // Rounds a vector to integer components.
  function roundVector(v) {
    return [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];
  }

  // Generates a key for the tangentFrames map from a position and normal
  // vector. Rounds position and normal to allow some tolerance.
  function tangentFrameKey(position, normal) {
    return roundVector(math.mulVectorScalar(position, 100)) + ',' +
        roundVector(math.mulVectorScalar(normal, 100));
  }

  // Accumulates into the tangent and binormal matrix at the approximate
  // position and normal.
  function addTangentFrame(position, normal, tangent, binormal) {
    var key = tangentFrameKey(position, normal);
    var frame = tangentFrames[key];
    if (!frame) {
      frame = [[0, 0, 0], [0, 0, 0]];
    }
    frame[0] = math.addVector(frame[0], tangent);
    frame[1] = math.addVector(frame[1], binormal);
    tangentFrames[key] = frame;
  }

  // Get the tangent and binormal matrix at the approximate position and
  // normal.
  function getTangentFrame(position, normal) {
    var key = tangentFrameKey(position, normal);
    return tangentFrames[key];
  }

  var numTriangles = triangles.numElements;
  for (var triangleIndex = 0; triangleIndex < numTriangles; ++triangleIndex) {
    // Get the vertex indices, uvs and positions for the triangle.
    var vertexIndices = triangles.getElement(triangleIndex);
    var uvs = [];
    var positions = [];
    var normals = [];
    for (var i = 0; i < 3; ++i) {
      var vertexIndex = vertexIndices[i];
      uvs[i] = normalMapUVArray.getElement(vertexIndex);
      positions[i] = positionArray.getElement(vertexIndex);
      normals[i] = normalArray.getElement(vertexIndex);
    }

    // Calculate the tangent and binormal for the triangle using method
    // described in Maya documentation appendix A: tangent and binormal
    // vectors.
    var tangent = [0, 0, 0];
    var binormal = [0, 0, 0];
    for (var axis = 0; axis < 3; ++axis) {
      var edge1 = [positions[1][axis] - positions[0][axis],
                   uvs[1][0] - uvs[0][0], uvs[1][1] - uvs[0][1]];
      var edge2 = [positions[2][axis] - positions[0][axis],
                   uvs[2][0] - uvs[0][0], uvs[2][1] - uvs[0][1]];
      var edgeCross = math.normalize(math.cross(edge1, edge2));
      if (edgeCross[0] == 0) {
        edgeCross[0] = 1;
      }
      tangent[axis] = -edgeCross[1] / edgeCross[0];
      binormal[axis] = -edgeCross[2] / edgeCross[0];
    }

    // Normalize the tangent and binornmal.
    var tangentLength = math.length(tangent);
    if (tangentLength > 0.00001) {
      tangent = math.mulVectorScalar(tangent, 1 / tangentLength);
    }
    var binormalLength = math.length(binormal);
    if (binormalLength > 0.00001) {
      binormal = math.mulVectorScalar(binormal, 1 / binormalLength);
    }

    // Accumulate the tangent and binormal into the tangent frame map.
    for (var i = 0; i < 3; ++i) {
      addTangentFrame(positions[i], normals[i], tangent, binormal);
    }
  }

  // Add the tangent and binormal streams.
  var numVertices = positionArray.numElements;
  var tangents = new tdl.primitives.AttribBuffer(3, numVertices);
  var binormals = new tdl.primitives.AttribBuffer(3, numVertices);

  // Extract the tangent and binormal for each vertex.
  for (var vertexIndex = 0; vertexIndex < numVertices; ++vertexIndex) {
    var position = positionArray.getElement(vertexIndex);
    var normal = normalArray.getElement(vertexIndex);
    var frame = getTangentFrame(position, normal);

    // Orthonormalize the tangent with respect to the normal.
    var tangent = frame[0];
    tangent = math.subVector(
        tangent, math.mulVectorScalar(normal, math.dot(normal, tangent)));
    var tangentLength = math.length(tangent);
    if (tangentLength > 0.00001) {
      tangent = math.mulVectorScalar(tangent, 1 / tangentLength);
    }

    // Orthonormalize the binormal with respect to the normal and the tangent.
    var binormal = frame[1];
    binormal = math.subVector(
        binormal, math.mulVectorScalar(tangent, math.dot(tangent, binormal)));
    binormal = math.subVector(
        binormal, math.mulVectorScalar(normal, math.dot(normal, binormal)));
    var binormalLength = math.length(binormal);
    if (binormalLength > 0.00001) {
      binormal = math.mulVectorScalar(binormal, 1 / binormalLength);
    }

    tangents.push(tangent);
    binormals.push(binormal);
  }

  return {
    tangent: tangents,
    binormal: binormals};
};

/**
 * Adds tangents and binormals.
 *
 * @param {!Object.<string,!AttibArray>} arrays Arrays containing position,
 *        normal and texCoord.
 */
tdl.primitives.addTangentsAndBinormals = function(arrays) {
  var bn = tdl.primitives.createTangentsAndBinormals(
      arrays.position,
      arrays.normal,
      arrays.texCoord,
      arrays.indices);
  arrays.tangent = bn.tangent;
  arrays.binormal = bn.binormal;
  return arrays;
};

tdl.primitives.clone = function(arrays) {
  var newArrays = { };
  for (var array in arrays) {
    newArrays[array] = arrays[array].clone();
  }
  return newArrays;
};

/**
 * Concats 2 or more sets of arrays. Assumes each set of arrays has arrays that
 * match the other sets.
 * @param {!Array<!Object.<string, !AttribBuffer>>} arrays Arrays to concat
 * @return {!Object.<string, !AttribBuffer>} concatenated result.
 */
tdl.primitives.concat = function(arrayOfArrays) {
  var names = {};
  var baseName;
  // get names of all arrays.
  for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
    var arrays = arrayOfArrays[ii];
    for (var name in arrays) {
      if (!names[name]) {
        names[name] = [];
      }
      if (!baseName && name != 'indices') {
        baseName = name;
      }
      var array = arrays[name];
      names[name].push(array.numElements);
    }
  }

  var base = names[baseName];

  var newArrays = {};
  for (var name in names) {
    var numElements = 0;
    var numComponents;
    var type;
    for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
      var arrays = arrayOfArrays[ii];
      var array = arrays[name];
      numElements += array.numElements;
      numComponents = array.numComponents;
      type = array.type;
    }
    var newArray = new tdl.primitives.AttribBuffer(
        numComponents, numElements, type);
    var baseIndex = 0;
    for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
      var arrays = arrayOfArrays[ii];
      var array = arrays[name];
      if (name == 'indices') {
        newArray.pushArrayWithOffset(
            array, [baseIndex, baseIndex, baseIndex]);
        baseIndex += base[ii];
      } else {
        newArray.pushArray(array);
      }
    }
    newArrays[name] = newArray;
  }
  return newArrays;
};

/**
 * Same as tdl.primitives.concat except this one returns an array
 * of arrays if the models have indices. This is because WebGL can only handle
 * 16bit indices (ie, < 65536) So, as it is concatenating, if the data would
 * make indices > 65535 it starts a new set of arrays.
 *
 * @param {!Array<!Object.<string, !AttribBuffer>>} arrays Arrays to concat
 * @return {!{arrays:{!Array<{!Object.<string, !AttribBuffer>>,
 *     instances:{!Array<{firstVertex:number, numVertices:number, arrayIndex:
 *     number}>}} object result.
 */
//
tdl.primitives.concatLarge = function(arrayOfArrays) {
  // Step 2: convert instances to expanded geometry
  var instances = [];
  var expandedArrays = [];
  var expandedArray;
  var totalElements = 0;
  for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
    // WebGL can only handle 65536 indexed vertices so check if this
    // geometry can fit the current model
    var array = arrayOfArrays[ii];
    if (!expandedArray || totalElements + array.position.numElements > 65536) {
      // Start a new array.
      totalElements = 0;
      expandedArray = [array];
      expandedArrays.push(expandedArray);
    } else {
      // Add our new stuff on to the old one.
      expandedArray.push(array);
    }
    instances.push({
        firstVertex: totalElements,
        numVertices: array.position.numElements,
        arrayIndex: expandedArrays.length - 1
    });
    totalElements += array.position.numElements;
  }

  for (var ii = 0; ii < expandedArrays.length; ++ii) {
    //tdl.log("concat:", ii, " of ", expandedArrays.length);
    expandedArrays[ii] = tdl.primitives.concat(expandedArrays[ii]);
  }
  return {
      arrays: expandedArrays,
      instances: instances
  };
};

/**
 * Applies planar UV mapping in the XZ plane.
 * @param {!AttribBuffer} positions The positions
 * @param {!AttribBuffer} texCoords The texCoords
 */
tdl.primitives.applyPlanarUVMapping = function(positions, texCoords) {
  // compute the extents
  var extents = positions.computeExtents();
  var ranges = tdl.math.subVector(extents.max, extents.min);

  var numElements = positions.numElements;
  for (var ii = 0; ii < numElements; ++ii) {
    var position = positions.getElement(ii);
    var u = (position[0] - extents.min[0]) / ranges[0];
    var v = (position[2] - extents.min[2]) / ranges[2];
    texCoords.setElement(ii, [u, v]);
  }
};

/**
 * Takes a bunch of instances of geometry and converts them
 * to 1 or more geometries that represent all the instances.
 *
 * In other words, if make a cube
 *
 *    var cube = tdl.primitives.createCube(1);
 *
 * And you put 4 of those in an array
 *
 *    var instances = [cube, cube, cube, cube]
 *
 * Then if you call this function it will return a mesh that contains
 * all 4 cubes.  it
 *
 * @author gman (4/19/2011)
 *
 * @param instances
 */
tdl.primitives.expandInstancesToGeometry = function(instances) {

};

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
 * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
 *         created plane vertices.
 */
tdl.primitives.createSphere = function(
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
  var math = tdl.math;

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
  var positions = new tdl.primitives.AttribBuffer(3, numVertices);
  var normals = new tdl.primitives.AttribBuffer(3, numVertices);
  var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);

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
      positions.push([radius * ux, radius * uy, radius * uz]);
      normals.push([ux, uy, uz]);
      texCoords.push([1 - u, v]);
    }
  }

  var numVertsAround = subdivisionsAxis + 1;
  var indices = new tdl.primitives.AttribBuffer(
      3, subdivisionsAxis * subdivisionsHeight * 2, 'Uint16Array');
  for (var x = 0; x < subdivisionsAxis; x++) {
    for (var y = 0; y < subdivisionsHeight; y++) {
      // Make triangle 1 of quad.
      indices.push([
          (y + 0) * numVertsAround + x,
          (y + 0) * numVertsAround + x + 1,
          (y + 1) * numVertsAround + x]);

      // Make triangle 2 of quad.
      indices.push([
          (y + 1) * numVertsAround + x,
          (y + 0) * numVertsAround + x + 1,
          (y + 1) * numVertsAround + x + 1]);
    }
  }

  return {
    position: positions,
    normal: normals,
    texCoord: texCoords,
    indices: indices};
};

/**
 * Creates cresent vertices. The created sphere has position, normal and uv
 * streams.
 *
 * @param {number} verticalRadius The vertical radius of the cresent.
 * @param {number} outerRadius The outer radius of the cresent.
 * @param {number} innerRadius The inner radius of the cresent.
 * @param {number} thickness The thickness of the cresent.
 * @param {number} subdivisionsDown number of steps around the sphere.
 * @param {number} subdivisionsThick number of vertically on the sphere.
 * @param {number} opt_startOffset Where to start arc Default 0.
 * @param {number} opt_endOffset Where to end arg Default 1.
 * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
 *         created plane vertices.
 */
tdl.primitives.createCresent = function(
    verticalRadius,
    outerRadius,
    innerRadius,
    thickness,
    subdivisionsDown,
    opt_startOffset,
    opt_endOffset) {
  if (subdivisionsDown <= 0) {
    throw Error('subdivisionDown must be > 0');
  }
  var math = tdl.math;

  opt_startOffset = opt_startOffset || 0;
  opt_endOffset = opt_endOffset || 1;

  var subdivisionsThick = 2;

  var offsetRange = opt_endOffset - opt_startOffset;
  var numVertices = (subdivisionsDown + 1) * 2 * (2 + subdivisionsThick);
  var positions = new tdl.primitives.AttribBuffer(3, numVertices);
  var normals = new tdl.primitives.AttribBuffer(3, numVertices);
  var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);

  function createArc(arcRadius, x, normalMult, normalAdd, uMult, uAdd) {
    for (var z = 0; z <= subdivisionsDown; z++) {
      var uBack = x / (subdivisionsThick - 1);
      var v = z / subdivisionsDown;
      var xBack = (uBack - 0.5) * 2;
      var angle = (opt_startOffset + (v * offsetRange)) * Math.PI;
      var s = Math.sin(angle);
      var c = Math.cos(angle);
      var radius = math.lerpScalar(verticalRadius, arcRadius, s);
      var px = xBack * thickness;
      var py = c * verticalRadius;
      var pz = s * radius;
      positions.push([px, py, pz]);
      // TODO(gman): fix! This is not correct.
      var n = math.addVector(
          math.mulVectorVector([0, s, c], normalMult), normalAdd);
      normals.push(n);
      texCoords.push([uBack * uMult + uAdd, v]);
    }
  }

  // Generate the individual vertices in our vertex buffer.
  for (var x = 0; x < subdivisionsThick; x++) {
    var uBack = (x / (subdivisionsThick - 1) - 0.5) * 2;
    createArc(outerRadius, x, [1, 1, 1], [0,     0, 0], 1, 0);
    createArc(outerRadius, x, [0, 0, 0], [uBack, 0, 0], 0, 0);
    createArc(innerRadius, x, [1, 1, 1], [0,     0, 0], 1, 0);
    createArc(innerRadius, x, [0, 0, 0], [uBack, 0, 0], 0, 1);
  }

  // Do outer surface.
  var indices = new tdl.primitives.AttribBuffer(
      3, (subdivisionsDown * 2) * (2 + subdivisionsThick), 'Uint16Array');

  function createSurface(leftArcOffset, rightArcOffset) {
    for (var z = 0; z < subdivisionsDown; ++z) {
      // Make triangle 1 of quad.
      indices.push([
          leftArcOffset + z + 0,
          leftArcOffset + z + 1,
          rightArcOffset + z + 0]);

      // Make triangle 2 of quad.
      indices.push([
          leftArcOffset + z + 1,
          rightArcOffset + z + 1,
          rightArcOffset + z + 0]);
    }
  }

  var numVerticesDown = subdivisionsDown + 1;
  // front
  createSurface(numVerticesDown * 0, numVerticesDown * 4);
  // right
  createSurface(numVerticesDown * 5, numVerticesDown * 7);
  // back
  createSurface(numVerticesDown * 6, numVerticesDown * 2);
  // left
  createSurface(numVerticesDown * 3, numVerticesDown * 1);

  return {
    position: positions,
    normal: normals,
    texCoord: texCoords,
    indices: indices};
};

/**
 * Creates XZ plane vertices.
 * The created plane has position, normal and uv streams.
 *
 * @param {number} width Width of the plane.
 * @param {number} depth Depth of the plane.
 * @param {number} subdivisionsWidth Number of steps across the plane.
 * @param {number} subdivisionsDepth Number of steps down the plane.
 * @param {!o3djs.math.Matrix4} opt_matrix A matrix by which to multiply
 *     all the vertices.
 * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
 *         created plane vertices.
 */
tdl.primitives.createPlane = function(
    width,
    depth,
    subdivisionsWidth,
    subdivisionsDepth) {
  if (subdivisionsWidth <= 0 || subdivisionsDepth <= 0) {
    throw Error('subdivisionWidth and subdivisionDepth must be > 0');
  }
  var math = tdl.math;

  var numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
  var positions = new tdl.primitives.AttribBuffer(3, numVertices);
  var normals = new tdl.primitives.AttribBuffer(3, numVertices);
  var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);

  for (var z = 0; z <= subdivisionsDepth; z++) {
    for (var x = 0; x <= subdivisionsWidth; x++) {
      var u = x / subdivisionsWidth;
      var v = z / subdivisionsDepth;
      positions.push([
          width * u - width * 0.5,
          0,
          depth * v - depth * 0.5]);
      normals.push([0, 1, 0]);
      texCoords.push([u, v]);
    }
  }

  var numVertsAcross = subdivisionsWidth + 1;
  var indices = new tdl.primitives.AttribBuffer(
      3, subdivisionsWidth * subdivisionsDepth * 2, 'Uint16Array');

  for (var z = 0; z < subdivisionsDepth; z++) {
    for (var x = 0; x < subdivisionsWidth; x++) {
      // Make triangle 1 of quad.
      indices.push([
          (z + 0) * numVertsAcross + x,
          (z + 1) * numVertsAcross + x,
          (z + 0) * numVertsAcross + x + 1]);

      // Make triangle 2 of quad.
      indices.push([
          (z + 1) * numVertsAcross + x,
          (z + 1) * numVertsAcross + x + 1,
          (z + 0) * numVertsAcross + x + 1]);
    }
  }

  return {
    position: positions,
    normal: normals,
    texCoord: texCoords,
    indices: indices};
};


/**
 * Array of the indices of corners of each face of a cube.
 * @private
 * @type {!Array.<!Array.<number>>}
 */
tdl.primitives.CUBE_FACE_INDICES_ = [
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
 * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
 *         created plane vertices.
 */
tdl.primitives.createCube = function(size) {
  var k = size / 2;

  var cornerVertices = [
    [-k, -k, -k],
    [+k, -k, -k],
    [-k, +k, -k],
    [+k, +k, -k],
    [-k, -k, +k],
    [+k, -k, +k],
    [-k, +k, +k],
    [+k, +k, +k]
  ];

  var faceNormals = [
    [+1, +0, +0],
    [-1, +0, +0],
    [+0, +1, +0],
    [+0, -1, +0],
    [+0, +0, +1],
    [+0, +0, -1]
  ];

  var uvCoords = [
    [1, 0],
    [0, 0],
    [0, 1],
    [1, 1]
  ];

  var numVertices = 6 * 4;
  var positions = new tdl.primitives.AttribBuffer(3, numVertices);
  var normals = new tdl.primitives.AttribBuffer(3, numVertices);
  var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);
  var indices = new tdl.primitives.AttribBuffer(3, 6 * 2, 'Uint16Array');

  for (var f = 0; f < 6; ++f) {
    var faceIndices = tdl.primitives.CUBE_FACE_INDICES_[f];
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
    indices.push([offset + 0, offset + 1, offset + 2]);
    indices.push([offset + 0, offset + 2, offset + 3]);
  }

  return {
    position: positions,
    normal: normals,
    texCoord: texCoords,
    indices: indices};
};


/**
 * Creates the vertices and indices for a flared cube (extrude the edges).
 * The U texture coordinate will be a gradient 0-1 from inside out. Use
 * the vertex shader to distort using U as an angle for fun effects.
 *
 * @param {number} size Width, height and depth of the cube.
 * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
 *         created plane vertices.
 */
tdl.primitives.createFlaredCube = function(innerSize, outerSize, layerCount) {
  var numVertices = 2 * (layerCount + 1);
  var positions = new tdl.primitives.AttribBuffer(3, numVertices);
  var normals = new tdl.primitives.AttribBuffer(3, numVertices);
  var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);
  var indices = new tdl.primitives.AttribBuffer(
      3, layerCount * 2, 'Uint16Array');

  // make a trapazoid plane.
  for (var z = 0; z <= layerCount; z++) {
    for (var x = 0; x <= 1; x++) {
      var u = x;
      var v = z / layerCount;
      var width = tdl.math.lerpScalar(innerSize, outerSize, v);
      positions.push([
          width * u - width * 0.5,
          0,
          tdl.math.lerpScalar(innerSize, outerSize, v) * 0.7
      ]);
      normals.push([0, 1, 0]);
      texCoords.push([v, u]);
    }
  }

  var numVertsAcross = 2;
  for (var z = 0; z < layerCount; z++) {
    // Make triangle 1 of quad.
    indices.push([
        (z + 0) * numVertsAcross,
        (z + 1) * numVertsAcross,
        (z + 0) * numVertsAcross + 1]);

    // Make triangle 2 of quad.
    indices.push([
        (z + 1) * numVertsAcross,
        (z + 1) * numVertsAcross + 1,
        (z + 0) * numVertsAcross + 1]);
  }

  var arrays = {
    position: positions,
    normal: normals,
    texCoord: texCoords,
    indices: indices
  };

  // rotate it 45 degrees
  tdl.primitives.reorient(arrays, tdl.math.matrix4.rotationX(Math.PI / 4));

  // make 3 copies of plane each rotated 90
  var planes = [arrays];
  for (var ii = 0; ii < 3; ++ii) {
    var clone = tdl.primitives.clone(arrays);
    tdl.primitives.reorient(clone, tdl.math.matrix4.rotationZ(Math.PI * (ii + 1) / 2));
    planes.push(clone);
  }
  // concat 4 planes to make a cone
  var arrays = tdl.primitives.concat(planes);

  // make 3 copies of cone each rotated 90
  var cones = [arrays];
  for (var ii = 0; ii < 3; ++ii) {
    var clone = tdl.primitives.clone(arrays);
    tdl.primitives.reorient(clone, tdl.math.matrix4.rotationY(Math.PI * (ii + 1) / 2));
    cones.push(clone);
  }
  // concat 4 cones to make flared cube
  var arrays = tdl.primitives.concat(cones);
  return arrays;
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
 * @param {boolean} opt_topCap Create top cap. Default = true.
 * @param {boolean} opt_bottomCap Create bottom cap. Default =
 *        true.
 * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
 *         created plane vertices.
 */
tdl.primitives.createTruncatedCone = function(
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
  var positions = new tdl.primitives.AttribBuffer(3, numVertices);
  var normals = new tdl.primitives.AttribBuffer(3, numVertices);
  var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);
  var indices = new tdl.primitives.AttribBuffer(
      3, radialSubdivisions * (verticalSubdivisions + extra) * 2, 'Uint16Array');

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
      positions.push([sin * ringRadius, y, cos * ringRadius]);
      normals.push([
          (yy < 0 || yy > verticalSubdivisions) ? 0 : (sin * cosSlant),
          (yy < 0) ? -1 : (yy > verticalSubdivisions ? 1 : sinSlant),
          (yy < 0 || yy > verticalSubdivisions) ? 0 : (cos * cosSlant)]);
      texCoords.push([(ii / radialSubdivisions), 1 - v]);
    }
  }

  for (var yy = 0; yy < verticalSubdivisions + extra; ++yy) {
    for (var ii = 0; ii < radialSubdivisions; ++ii) {
      indices.push([vertsAroundEdge * (yy + 0) + 0 + ii,
                   vertsAroundEdge * (yy + 0) + 1 + ii,
                   vertsAroundEdge * (yy + 1) + 1 + ii]);
      indices.push([vertsAroundEdge * (yy + 0) + 0 + ii,
                   vertsAroundEdge * (yy + 1) + 1 + ii,
                   vertsAroundEdge * (yy + 1) + 0 + ii]);
    }
  }

  return {
    position: positions,
    normal: normals,
    texCoord: texCoords,
    indices: indices};
};

/**
 * Creates cylinder vertices. The cylinder will be created around the origin
 * along the y-axis. The created cylinder has position, normal and uv streams.
 *
 * @param {number} radius Radius of cylinder.
 * @param {number} height Height of cylinder.
 * @param {number} radialSubdivisions The number of subdivisions around the
 *     cylinder.
 * @param {number} verticalSubdivisions The number of subdivisions down the
 *     cylinder.
 * @param {boolean} opt_topCap Create top cap. Default = true.
 * @param {boolean} opt_bottomCap Create bottom cap. Default =
 *        true.
 * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
 *         created plane vertices.
 */
tdl.primitives.createCylinder = function(
    radius,
    height,
    radialSubdivisions,
    verticalSubdivisions,
    opt_topCap,
    opt_bottomCap) {
  return tdl.primitives.createTruncatedCone(
      radius,
      radius,
      height,
      radialSubdivisions,
      verticalSubdivisions,
      opt_topCap,
      opt_bottomCap);
};

/**
 * Creates vertices for a torus, The created cone has position, normal
 * and texCoord streams.
 *
 * @param {number} radius radius of center of torus circle.
 * @param {number} thickness radius of torus ring.
 * @param {number} radialSubdivisions The number of subdivisions around the
 *     torus.
 * @param {number} bodySubdivisions The number of subdivisions around the
 *     body torus.
 * @param {boolean} opt_startAngle start angle in radians. Default = 0.
 * @param {boolean} opt_endAngle end angle in radians. Default = Math.PI * 2.
 * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
 *         created torus vertices.
 */
tdl.primitives.createTorus = function(
    radius,
    thickness,
    radialSubdivisions,
    bodySubdivisions,
    opt_startAngle,
    opt_endAngle) {
  if (radialSubdivisions < 3) {
    throw Error('radialSubdivisions must be 3 or greater');
  }

  if (bodySubdivisions < 3) {
    throw Error('verticalSubdivisions must be 3 or greater');
  }

  var startAngle = opt_startAngle || 0;
  var endAngle = opt_endAngle || Math.PI * 2;
  var range = endAngle - startAngle;

  // TODO(gman): cap the ends if not a full circle.

  var numVertices = (radialSubdivisions) * (bodySubdivisions);
  var positions = new tdl.primitives.AttribBuffer(3, numVertices);
  var normals = new tdl.primitives.AttribBuffer(3, numVertices);
  var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);
  var indices = new tdl.primitives.AttribBuffer(
      3, (radialSubdivisions) * (bodySubdivisions) * 2, 'Uint16Array');

  for (var slice = 0; slice < bodySubdivisions; ++slice) {
    var v = slice / bodySubdivisions;
    var sliceAngle = v * Math.PI * 2;
    var sliceSin = Math.sin(sliceAngle);
    var ringRadius = radius + sliceSin * thickness;
    var ny = Math.cos(sliceAngle);
    var y = ny * thickness;
    for (var ring = 0; ring < radialSubdivisions; ++ring) {
      var u = ring / radialSubdivisions;
      var ringAngle = startAngle + u * range;
      var xSin = Math.sin(ringAngle);
      var zCos = Math.cos(ringAngle);
      var x = xSin * ringRadius;
      var z = zCos * ringRadius;
      var nx = xSin * sliceSin;
      var nz = zCos * sliceSin;
      positions.push([x, y, z]);
      normals.push([nx, ny, nz]);
      texCoords.push([u, 1 - v]);
    }
  }

  for (var slice = 0; slice < bodySubdivisions; ++slice) {
    for (var ring = 0; ring < radialSubdivisions; ++ring) {
      var nextRingIndex = (1 + ring) % radialSubdivisions;
      var nextSliceIndex = (1 + slice) % bodySubdivisions;
      indices.push([radialSubdivisions * slice          + ring,
                    radialSubdivisions * nextSliceIndex + ring,
                    radialSubdivisions * slice          + nextRingIndex]);
      indices.push([radialSubdivisions * nextSliceIndex + ring,
                    radialSubdivisions * nextSliceIndex + nextRingIndex,
                    radialSubdivisions * slice          + nextRingIndex]);
    }
  }

  return {
    position: positions,
    normal: normals,
    texCoord: texCoords,
    indices: indices};
};


/**
 * Creates a disc. The disc will be in the xz plane, centered at
 * the origin. When creating, at least 3 divisions, or pie
 * pieces, need to be specified, otherwise the triangles making
 * up the disc will be degenerate. You can also specify the
 * number of radial pieces (opt_stacks). A value of 1 for
 * opt_stacks will give you a simple disc of pie pieces.  If you
 * want to create an annulus you can set opt_innerRadius to a
 * value > 0. Finally, stackPower allows you to have the widths
 * increase or decrease as you move away from the center. This
 * is particularly useful when using the disc as a ground plane
 * with a fixed camera such that you don't need the resolution
 * of small triangles near the perimeter. For example, a value
 * of 2 will produce stacks whose ouside radius increases with
 * the square of the stack index. A value of 1 will give uniform
 * stacks.
 *
 * @param {number} radius Radius of the ground plane.
 * @param {number} divisions Number of triangles in the ground plane
 *                 (at least 3).
 * @param {number} opt_stacks Number of radial divisions (default=1).
 * @param {number} opt_innerRadius. Default 0.
 * @param {number} opt_stackPower Power to raise stack size to for decreasing
 *                 width.
 * @return {!Object.<string, !tdl.primitives.AttribBuffer>} The
 *         created vertices.
 */
tdl.primitives.createDisc = function(
    radius,
    divisions,
    opt_stacks,
    opt_innerRadius,
    opt_stackPower) {
  if (divisions < 3) {
    throw Error('divisions must be at least 3');
  }

  var stacks = opt_stacks ? opt_stacks : 1;
  var stackPower = opt_stackPower ? opt_stackPower : 1;
  var innerRadius = opt_innerRadius ? opt_innerRadius : 0;

  // Note: We don't share the center vertex because that would
  // mess up texture coordinates.
  var numVertices = (divisions) * (stacks + 1);

  var positions = new tdl.primitives.AttribBuffer(3, numVertices);
  var normals = new tdl.primitives.AttribBuffer(3, numVertices);
  var texCoords = new tdl.primitives.AttribBuffer(2, numVertices);
  var indices = new tdl.primitives.AttribBuffer(
      3, stacks * divisions * 2, 'Uint16Array');

  var firstIndex = 0;
  var radiusSpan = radius - innerRadius;

  // Build the disk one stack at a time.
  for (var stack = 0; stack <= stacks; ++stack) {
    var stackRadius = innerRadius + radiusSpan * Math.pow(stack / stacks, stackPower);

    for (var i = 0; i < divisions; ++i) {
      var theta = 2.0 * Math.PI * i / divisions;
      var x = stackRadius * Math.cos(theta);
      var z = stackRadius * Math.sin(theta);

      positions.push([x, 0, z]);
      normals.push([0, 1, 0]);
      texCoords.push([1 - (i / divisions), stack / stacks]);
      if (stack > 0) {
        // a, b, c and d are the indices of the vertices of a quad.  unless
        // the current stack is the one closest to the center, in which case
        // the vertices a and b connect to the center vertex.
        var a = firstIndex + (i + 1) % divisions;
        var b = firstIndex + i;
        var c = firstIndex + i - divisions;
        var d = firstIndex + (i + 1) % divisions - divisions;

        // Make a quad of the vertices a, b, c, d.
        indices.push([a, b, c]);
        indices.push([a, c, d]);
      }
    }

    firstIndex += divisions;
  }

  return {
    position: positions,
    normal: normals,
    texCoord: texCoords,
    indices: indices};
};

/**
 * Interleaves vertex information into one large buffer
 * @param {Array of <string, tdl.primitives.AttribBuffer>}
 * @param {Object.<string, tdl.primitives.AttribBuffer>}
 */
tdl.primitives.interleaveVertexData = function(vertexDataArray) {
  var stride = 0;
  for (var s = 0; s < vertexDataArray.length; s++) {
    stride += vertexDataArray[s].numComponents;
  }
  // This assumes the first element is always positions.
  var numVertices = vertexDataArray[0].numElements;
  var vertexData = new Float32Array(stride * numVertices);
  var count = 0;
  for (var v = 0; v< numVertices; v++) {
    for (var i = 0; i < vertexDataArray.length; i++) {
      var element  = vertexDataArray[i].getElement(v);
      for (var d = 0; d < vertexDataArray[i].numComponents; d++) {
        vertexData[count++] = element[d];
      }
    }
  }
  return vertexData;
};
