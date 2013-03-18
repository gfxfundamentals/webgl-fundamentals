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
 * @fileoverview This file contains matrix/vector math functions.
 */

tdl.provide('tdl.fast');

/**
 * A module for math for tdl.fast.
 * @namespace
 */
tdl.fast = tdl.fast || {};


if (!window.Float32Array) {
  // This just makes some errors go away when there is no WebGL.
  window.Float32Array = function() { };
}

tdl.fast.temp0v3_ = new Float32Array(3);
tdl.fast.temp1v3_ = new Float32Array(3);
tdl.fast.temp2v3_ = new Float32Array(3);

tdl.fast.temp0v4_ = new Float32Array(4);
tdl.fast.temp1v4_ = new Float32Array(4);
tdl.fast.temp2v4_ = new Float32Array(4);

tdl.fast.temp0m4_ = new Float32Array(16);
tdl.fast.temp1m4_ = new Float32Array(16);
tdl.fast.temp2m4_ = new Float32Array(16);

/**
 * Functions which deal with 4-by-4 transformation matrices are kept in their
 * own namespsace.
 * @namespace
 */
tdl.fast.matrix4 = tdl.fast.matrix4 || {};

/**
 * Functions that are specifically row major are kept in their own namespace.
 * @namespace
 */
tdl.fast.rowMajor = tdl.fast.rowMajor || {};

/**
 * Functions that are specifically column major are kept in their own namespace.
 * @namespace
 */
tdl.fast.columnMajor = tdl.fast.columnMajor || {};

/**
 * An Array of 2 floats
 * @type {!Float32Array}
 */
tdl.fast.Vector2 = goog.typedef;

/**
 * An Array of 3 floats
 * @type {!Float32Array}
 */
tdl.fast.Vector3 = goog.typedef;

/**
 * An Array of 4 floats
 * @type {!Float32Array}
 */
tdl.fast.Vector4 = goog.typedef;

/**
 * An Array of floats.
 * @type {!Float32Array}
 */
tdl.fast.Vector = goog.typedef;

/**
 * A 2x2 Matrix of floats
 * @type {!Float32Array}
 */
tdl.fast.Matrix2 = goog.typedef;

/**
 * A 3x3 Matrix of floats
 * @type {!Float32Array}
 */
tdl.fast.Matrix3 = goog.typedef;

/**
 * A 4x4 Matrix of floats
 * @type {!Float32Array}
 */
tdl.fast.Matrix4 = goog.typedef;

/**
 * A arbitrary size Matrix of floats
 * @type {!Array.<!Array.<number>>}
 */
tdl.fast.Matrix = goog.typedef;

/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} a Operand vector.
 * @param {!tdl.fast.Vector} b Operand vector.
 */
tdl.fast.addVector = function(dst, a, b) {
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i)
    dst[i] = a[i] + b[i];
  return dst;
};

/**
 * Subtracts two vectors.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} a Operand vector.
 * @param {!tdl.fast.Vector} b Operand vector.
 */
tdl.fast.subVector = function(dst, a, b) {
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i)
    dst[i] = a[i] - b[i];
  return dst;
};

/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * (1 - t) * a + t * b.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} a Operand vector.
 * @param {!tdl.fast.Vector} b Operand vector.
 * @param {number} t Interpolation coefficient.
 */
tdl.fast.lerpVector = function(dst, a, b, t) {
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i)
    dst[i] = (1 - t) * a[i] + t * b[i];
  return dst;
};

/**
 * Divides a vector by a scalar.
 * @param {!tdl.fast.Vector} dst The vector.
 * @param {!tdl.fast.Vector} v The vector.
 * @param {number} k The scalar.
 * @return {!tdl.fast.Vector} dst.
 */
tdl.fast.divVectorScalar = function(dst, v, k) {
  var vLength = v.length;
  for (var i = 0; i < vLength; ++i)
    dst[i] = v[i] / k;
  return dst;
};

/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} a Operand vector.
 * @param {!tdl.fast.Vector} b Operand vector.
 * @return {!tdl.fast.Vector} The vector a cross b.
 */
tdl.fast.cross = function(dst, a, b) {
  dst[0] = a[1] * b[2] - a[2] * b[1];
  dst[1] = a[2] * b[0] - a[0] * b[2];
  dst[2] = a[0] * b[1] - a[1] * b[0];
  return dst;
};

/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param {!tdl.fast.Vector} a Operand vector.
 * @param {!tdl.fast.Vector} b Operand vector.
 * @return {number} dot product
 */
tdl.fast.dot = function(a, b) {
  return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
};

/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} a The vector.
 * @return {!tdl.fast.Vector} The normalized vector.
 */
tdl.fast.normalize = function(dst, a) {
  var n = 0.0;
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i)
    n += a[i] * a[i];
  n = Math.sqrt(n);
  if (n > 0.00001) {
    for (var i = 0; i < aLength; ++i)
      dst[i] = a[i] / n;
  } else {
    for (var i = 0; i < aLength; ++i)
      dst[i] = 0;
  }
  return dst;
};

/**
 * Negates a vector.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} v The vector.
 * @return {!tdl.fast.Vector} -v.
 */
tdl.fast.negativeVector = function(dst, v) {
 var vLength = v.length;
 for (var i = 0; i < vLength; ++i) {
   dst[i] = -v[i];
 }
 return dst;
};

/**
 * Negates a matrix.
 * @param {!tdl.fast.Matrix} dst matrix.
 * @param {!tdl.fast.Matrix} v The matrix.
 * @return {!tdl.fast.Matrix} -v.
 */
tdl.fast.negativeMatrix = function(dst, v) {
  var vLength = v.length;
  for (var i = 0; i < vLength; ++i) {
    dst[i] = -v[i];
  }
  return dst;
};

/**
 * Copies a vector.
 * @param {!tdl.fast.Vector} v The vector.
 * @return {!tdl.fast.Vector} A copy of v.
 */
tdl.fast.copyVector = function(dst, v) {
  dst.set(v);
  return dst;
};

/**
 * Copies a matrix.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @return {!tdl.fast.Matrix} A copy of m.
 */
tdl.fast.copyMatrix = function(dst, m) {
  dst.set(m);
  return dst;
};

/**
 * Multiplies a scalar by a vector.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {number} k The scalar.
 * @param {!tdl.fast.Vector} v The vector.
 * @return {!tdl.fast.Vector} The product of k and v.
 */
tdl.fast.mulScalarVector = function(dst, k, v) {
  var vLength = v.length;
  for (var i = 0; i < vLength; ++i) {
    dst[i] = k * v[i];
  }
  return dst;
};

/**
 * Multiplies a vector by a scalar.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} v The vector.
 * @param {number} k The scalar.
 * @return {!tdl.fast.Vector} The product of k and v.
 */
tdl.fast.mulVectorScalar = function(dst, v, k) {
  return tdl.fast.mulScalarVector(dst, k, v);
};

/**
 * Multiplies a scalar by a matrix.
 * @param {!tdl.fast.Matrix} dst matrix.
 * @param {number} k The scalar.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @return {!tdl.fast.Matrix} The product of m and k.
 */
tdl.fast.mulScalarMatrix = function(dst, k, m) {
  var mLength = m.length;
  for (var i = 0; i < mLength; ++i) {
    dst[i] = k * m[i];
  }
  return dst;
};

/**
 * Multiplies a matrix by a scalar.
 * @param {!tdl.fast.Matrix} dst matrix.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {number} k The scalar.
 * @return {!tdl.fast.Matrix} The product of m and k.
 */
tdl.fast.mulMatrixScalar = function(dst, m, k) {
  return tdl.fast.mulScalarMatrix(dst, k, m);
};

/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} a Operand vector.
 * @param {!tdl.fast.Vector} b Operand vector.
 * @return {!tdl.fast.Vector} The vector of products of entries of a and
 *     b.
 */
tdl.fast.mulVectorVector = function(dst, a, b) {
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i)
    dst[i] = a[i] * b[i];
  return dst;
};

/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} a Operand vector.
 * @param {!tdl.fast.Vector} b Operand vector.
 * @return {!tdl.fast.Vector} The vector of quotients of entries of a and
 *     b.
 */
tdl.fast.divVectorVector = function(dst, a, b) {
  var aLength = a.length;
  for (var i = 0; i < aLength; ++i)
    dst[i] = a[i] / b[i];
  return dst;
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [row][column] fashion.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} v The vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @return {!tdl.fast.Vector} The product of v and m as a row vector.
 */
tdl.fast.rowMajor.mulVectorMatrix4 = function(dst, v, m) {
  for (var i = 0; i < 4; ++i) {
    dst[i] = 0.0;
    for (var j = 0; j < 4; ++j)
      dst[i] += v[j] * m[j * 4 + i];
  }
  return dst;
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector; assumes
 * matrix entries are accessed in [column][row] fashion.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Vector} v The vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @return {!tdl.fast.Vector} The product of v and m as a row vector.
 */
tdl.fast.columnMajor.mulVectorMatrix4 = function(dst, v, m) {
  var mLength = m.length;
  var vLength = v.length;
  for (var i = 0; i < 4; ++i) {
    dst[i] = 0.0;
    var col = i * 4;
    for (var j = 0; j < 4; ++j)
      dst[i] += v[j] * m[col + j];
  }
  return dst;
};

/**
 * Multiplies a vector by a matrix; treats the vector as a row vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {!tdl.fast.Vector} v The vector.
 * @return {!tdl.fast.Vector} The product of m and v as a row vector.
 */
tdl.fast.mulVectorMatrix4 = null;

/**
 * Multiplies a matrix by a vector; treats the vector as a column vector.
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {!tdl.fast.Vector} v The vector.
 * @return {!tdl.fast.Vector} The product of m and v as a column vector.
 */
tdl.fast.rowMajor.mulMatrix4Vector = function(dst, m, v) {
  for (var i = 0; i < 4; ++i) {
    dst[i] = 0.0;
    var row = i * 4;
    for (var j = 0; j < 4; ++j)
      dst[i] += m[row + j] * v[j];
  }
  return dst;
};

/**
 * Multiplies a matrix by a vector; treats the vector as a column vector;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {!tdl.fast.Vector} v The vector.
 * @return {!tdl.fast.Vector} The product of m and v as a column vector.
 */
tdl.fast.columnMajor.mulMatrix4Vector = function(dst, m, v) {
  for (var i = 0; i < 4; ++i) {
    dst[i] = 0.0;
    for (var j = 0; j < 4; ++j)
      dst[i] += v[j] * m[j * 4 + i];
  }
  return dst;
};

/**
 * Multiplies a matrix by a vector; treats the vector as a column vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {!tdl.fast.Vector} v The vector.
 * @return {!tdl.fast.Vector} The product of m and v as a column vector.
 */
tdl.fast.mulMatrix4Vector = null;

/**
 * Multiplies two 3-by-3 matrices; assumes that the given matrices are 3-by-3;
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!tdl.fast.Matrix3} dst matrix.
 * @param {!tdl.fast.Matrix3} a The matrix on the left.
 * @param {!tdl.fast.Matrix3} b The matrix on the right.
 * @return {!tdl.fast.Matrix3} The matrix product of a and b.
 */
tdl.fast.rowMajor.mulMatrixMatrix3 = function(dst, a, b) {
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a10 = a[3 + 0];
  var a11 = a[3 + 1];
  var a12 = a[3 + 2];
  var a20 = a[6 + 0];
  var a21 = a[6 + 1];
  var a22 = a[6 + 2];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b10 = b[3 + 0];
  var b11 = b[3 + 1];
  var b12 = b[3 + 2];
  var b20 = b[6 + 0];
  var b21 = b[6 + 1];
  var b22 = b[6 + 2];
  dst[0] = a00 * b00 + a01 * b10 + a02 * b20;
  dst[1] = a00 * b01 + a01 * b11 + a02 * b21;
  dst[2] = a00 * b02 + a01 * b12 + a02 * b22;
  dst[3] = a10 * b00 + a11 * b10 + a12 * b20;
  dst[4] = a10 * b01 + a11 * b11 + a12 * b21;
  dst[5] = a10 * b02 + a11 * b12 + a12 * b22;
  dst[6] = a20 * b00 + a21 * b10 + a22 * b20;
  dst[7] = a20 * b01 + a21 * b11 + a22 * b21;
  dst[8] = a20 * b02 + a21 * b12 + a22 * b22;
  return dst;
};

/**
 * Multiplies two 3-by-3 matrices; assumes that the given matrices are 3-by-3;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!tdl.fast.Matrix3} dst matrix.
 * @param {!tdl.fast.Matrix3} a The matrix on the left.
 * @param {!tdl.fast.Matrix3} b The matrix on the right.
 * @return {!tdl.fast.Matrix3} The matrix product of a and b.
 */
tdl.fast.columnMajor.mulMatrixMatrix3 = function(dst, a, b) {
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a10 = a[3 + 0];
  var a11 = a[3 + 1];
  var a12 = a[3 + 2];
  var a20 = a[6 + 0];
  var a21 = a[6 + 1];
  var a22 = a[6 + 2];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b10 = b[3 + 0];
  var b11 = b[3 + 1];
  var b12 = b[3 + 2];
  var b20 = b[6 + 0];
  var b21 = b[6 + 1];
  var b22 = b[6 + 2];
  dst[0] = a00 * b00 + a10 * b01 + a20 * b02;
  dst[1] = a01 * b00 + a11 * b01 + a21 * b02;
  dst[2] = a02 * b00 + a12 * b01 + a22 * b02;
  dst[3] = a00 * b10 + a10 * b11 + a20 * b12;
  dst[4] = a01 * b10 + a11 * b11 + a21 * b12;
  dst[5] = a02 * b10 + a12 * b11 + a22 * b12;
  dst[6] = a00 * b20 + a10 * b21 + a20 * b22;
  dst[7] = a01 * b20 + a11 * b21 + a21 * b22;
  dst[8] = a02 * b20 + a12 * b21 + a22 * b22;
  return dst;
};

/**
 * Multiplies two 3-by-3 matrices; assumes that the given matrices are 3-by-3.
 * @param {!tdl.fast.Matrix3} a The matrix on the left.
 * @param {!tdl.fast.Matrix3} b The matrix on the right.
 * @return {!tdl.fast.Matrix3} The matrix product of a and b.
 */
tdl.fast.mulMatrixMatrix3 = null;

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4;
 * assumes matrix entries are accessed in [row][column] fashion.
 * @param {!tdl.fast.Matrix4} dst matrix.
 * @param {!tdl.fast.Matrix4} a The matrix on the left.
 * @param {!tdl.fast.Matrix4} b The matrix on the right.
 * @return {!tdl.fast.Matrix4} The matrix product of a and b.
 */
tdl.fast.rowMajor.mulMatrixMatrix4 = function(dst, a, b) {
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[ 4 + 0];
  var a11 = a[ 4 + 1];
  var a12 = a[ 4 + 2];
  var a13 = a[ 4 + 3];
  var a20 = a[ 8 + 0];
  var a21 = a[ 8 + 1];
  var a22 = a[ 8 + 2];
  var a23 = a[ 8 + 3];
  var a30 = a[12 + 0];
  var a31 = a[12 + 1];
  var a32 = a[12 + 2];
  var a33 = a[12 + 3];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b03 = b[3];
  var b10 = b[ 4 + 0];
  var b11 = b[ 4 + 1];
  var b12 = b[ 4 + 2];
  var b13 = b[ 4 + 3];
  var b20 = b[ 8 + 0];
  var b21 = b[ 8 + 1];
  var b22 = b[ 8 + 2];
  var b23 = b[ 8 + 3];
  var b30 = b[12 + 0];
  var b31 = b[12 + 1];
  var b32 = b[12 + 2];
  var b33 = b[12 + 3];
  dst[ 0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
  dst[ 1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
  dst[ 2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
  dst[ 3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
  dst[ 4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
  dst[ 5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
  dst[ 6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
  dst[ 7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
  dst[ 8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
  dst[ 9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
  dst[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
  dst[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
  dst[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
  dst[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
  dst[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
  dst[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
  return dst;
};

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4;
 * assumes matrix entries are accessed in [column][row] fashion.
 * @param {!tdl.fast.Matrix4} dst matrix.
 * @param {!tdl.fast.Matrix4} a The matrix on the left.
 * @param {!tdl.fast.Matrix4} b The matrix on the right.
 * @return {!tdl.fast.Matrix4} The matrix product of a and b.
 */
tdl.fast.columnMajor.mulMatrixMatrix4 = function(dst, a, b) {
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[ 4 + 0];
  var a11 = a[ 4 + 1];
  var a12 = a[ 4 + 2];
  var a13 = a[ 4 + 3];
  var a20 = a[ 8 + 0];
  var a21 = a[ 8 + 1];
  var a22 = a[ 8 + 2];
  var a23 = a[ 8 + 3];
  var a30 = a[12 + 0];
  var a31 = a[12 + 1];
  var a32 = a[12 + 2];
  var a33 = a[12 + 3];
  var b00 = b[0];
  var b01 = b[1];
  var b02 = b[2];
  var b03 = b[3];
  var b10 = b[ 4 + 0];
  var b11 = b[ 4 + 1];
  var b12 = b[ 4 + 2];
  var b13 = b[ 4 + 3];
  var b20 = b[ 8 + 0];
  var b21 = b[ 8 + 1];
  var b22 = b[ 8 + 2];
  var b23 = b[ 8 + 3];
  var b30 = b[12 + 0];
  var b31 = b[12 + 1];
  var b32 = b[12 + 2];
  var b33 = b[12 + 3];
  dst[ 0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  dst[ 1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  dst[ 2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  dst[ 3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  dst[ 4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  dst[ 5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  dst[ 6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  dst[ 7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  dst[ 8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  dst[ 9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  return dst;
};

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4.
 * @param {!tdl.fast.Matrix4} a The matrix on the left.
 * @param {!tdl.fast.Matrix4} b The matrix on the right.
 * @return {!tdl.fast.Matrix4} The matrix product of a and b.
 */
tdl.fast.mulMatrixMatrix4 = null;

/**
 * Gets the jth column of the given matrix m; assumes matrix entries are
 * accessed in [row][column] fashion.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {number} j The index of the desired column.
 * @return {!tdl.fast.Vector} The jth column of m as a vector.
 */
tdl.fast.rowMajor.column4 = function(dst, m, j) {
  for (var i = 0; i < 4; ++i) {
    dst[i] = m[i * 4 + j];
  }
  return dst;
};

/**
 * Gets the jth column of the given matrix m; assumes matrix entries are
 * accessed in [column][row] fashion.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {number} j The index of the desired column.
 * @return {!tdl.fast.Vector} The jth column of m as a vector.
 */
tdl.fast.columnMajor.column4 = function(dst, m, j) {
  var off = j * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  dst[3] = m[off + 3];
  return dst;
};

/**
 * Gets the jth column of the given matrix m.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {number} j The index of the desired column.
 * @return {!tdl.fast.Vector} The jth column of m as a vector.
 */
tdl.fast.column4 = null;

/**
 * Gets the ith row of the given matrix m; assumes matrix entries are
 * accessed in [row][column] fashion.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {number} i The index of the desired row.
 * @return {!tdl.fast.Vector} The ith row of m.
 */
tdl.fast.rowMajor.row4 = function(dst, m, i) {
  var off = i * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  dst[3] = m[off + 3];
  return dst;
};

/**
 * Gets the ith row of the given matrix m; assumes matrix entries are
 * accessed in [column][row] fashion.
 * @param {!tdl.fast.Vector} dst vector.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {number} i The index of the desired row.
 * @return {!tdl.fast.Vector} The ith row of m.
 */
tdl.fast.columnMajor.row4 = function(dst, m, i) {
  for (var j = 0; j < 4; ++j) {
    dst[j] = m[j * 4 + i];
  }
  return dst;
};

/**
 * Gets the ith row of the given matrix m.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @param {number} i The index of the desired row.
 * @return {!tdl.fast.Vector} The ith row of m.
 */
tdl.fast.row4 = null;

/**
 * Creates an n-by-n identity matrix.
 *
 * @param {!tdl.fast.Matrix} dst matrix.
 * @return {!tdl.fast.Matrix} An n-by-n identity matrix.
 */
tdl.fast.identity4 = function(dst) {
  dst[ 0] = 1;
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = 1;
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
};

/**
 * Takes the transpose of a matrix.
 * @param {!tdl.fast.Matrix} dst matrix.
 * @param {!tdl.fast.Matrix} m The matrix.
 * @return {!tdl.fast.Matrix} The transpose of m.
 */
tdl.fast.transpose4 = function(dst, m) {
  if (dst === m) {
    var t;

    t = m[1];
    m[1] = m[4];
    m[4] = t;

    t = m[2];
    m[2] = m[8];
    m[8] = t;

    t = m[3];
    m[3] = m[12];
    m[12] = t;

    t = m[6];
    m[6] = m[9];
    m[9] = t;

    t = m[7];
    m[7] = m[13];
    m[13] = t;

    t = m[11];
    m[11] = m[14];
    m[14] = t;
    return dst;
  }

  var m00 = m[0 * 4 + 0];
  var m01 = m[0 * 4 + 1];
  var m02 = m[0 * 4 + 2];
  var m03 = m[0 * 4 + 3];
  var m10 = m[1 * 4 + 0];
  var m11 = m[1 * 4 + 1];
  var m12 = m[1 * 4 + 2];
  var m13 = m[1 * 4 + 3];
  var m20 = m[2 * 4 + 0];
  var m21 = m[2 * 4 + 1];
  var m22 = m[2 * 4 + 2];
  var m23 = m[2 * 4 + 3];
  var m30 = m[3 * 4 + 0];
  var m31 = m[3 * 4 + 1];
  var m32 = m[3 * 4 + 2];
  var m33 = m[3 * 4 + 3];

  dst[ 0] = m00;
  dst[ 1] = m10;
  dst[ 2] = m20;
  dst[ 3] = m30;
  dst[ 4] = m01;
  dst[ 5] = m11;
  dst[ 6] = m21;
  dst[ 7] = m31;
  dst[ 8] = m02;
  dst[ 9] = m12;
  dst[10] = m22;
  dst[11] = m32;
  dst[12] = m03;
  dst[13] = m13;
  dst[14] = m23;
  dst[15] = m33;
  return dst;
};

/**
 * Computes the inverse of a 4-by-4 matrix.
 * @param {!tdl.fast.Matrix4} dst matrix.
 * @param {!tdl.fast.Matrix4} m The matrix.
 * @return {!tdl.fast.Matrix4} The inverse of m.
 */
tdl.fast.inverse4 = function(dst, m) {
  var m00 = m[0 * 4 + 0];
  var m01 = m[0 * 4 + 1];
  var m02 = m[0 * 4 + 2];
  var m03 = m[0 * 4 + 3];
  var m10 = m[1 * 4 + 0];
  var m11 = m[1 * 4 + 1];
  var m12 = m[1 * 4 + 2];
  var m13 = m[1 * 4 + 3];
  var m20 = m[2 * 4 + 0];
  var m21 = m[2 * 4 + 1];
  var m22 = m[2 * 4 + 2];
  var m23 = m[2 * 4 + 3];
  var m30 = m[3 * 4 + 0];
  var m31 = m[3 * 4 + 1];
  var m32 = m[3 * 4 + 2];
  var m33 = m[3 * 4 + 3];
  var tmp_0  = m22 * m33;
  var tmp_1  = m32 * m23;
  var tmp_2  = m12 * m33;
  var tmp_3  = m32 * m13;
  var tmp_4  = m12 * m23;
  var tmp_5  = m22 * m13;
  var tmp_6  = m02 * m33;
  var tmp_7  = m32 * m03;
  var tmp_8  = m02 * m23;
  var tmp_9  = m22 * m03;
  var tmp_10 = m02 * m13;
  var tmp_11 = m12 * m03;
  var tmp_12 = m20 * m31;
  var tmp_13 = m30 * m21;
  var tmp_14 = m10 * m31;
  var tmp_15 = m30 * m11;
  var tmp_16 = m10 * m21;
  var tmp_17 = m20 * m11;
  var tmp_18 = m00 * m31;
  var tmp_19 = m30 * m01;
  var tmp_20 = m00 * m21;
  var tmp_21 = m20 * m01;
  var tmp_22 = m00 * m11;
  var tmp_23 = m10 * m01;

  var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
      (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
  var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
      (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
  var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
      (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
  var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
      (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

  var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

  dst[ 0] = d * t0;
  dst[ 1] = d * t1;
  dst[ 2] = d * t2;
  dst[ 3] = d * t3;
  dst[ 4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
          (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
  dst[ 5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
          (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
  dst[ 6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
          (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
  dst[ 7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
          (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
  dst[ 8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
          (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
  dst[ 9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
          (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
  dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
          (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
  dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
          (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
  dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
          (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
  dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
          (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
  dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
          (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
  dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
          (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
  return dst;
};

/**
 * Computes the inverse of a 4-by-4 matrix.
 * Note: It is faster to call this than tdl.fast.inverse.
 * @param {!tdl.fast.Matrix4} m The matrix.
 * @return {!tdl.fast.Matrix4} The inverse of m.
 */
tdl.fast.matrix4.inverse = function(dst,m) {
  return tdl.fast.inverse4(dst,m);
};

/**
 * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4.
 * Note: It is faster to call this than tdl.fast.mul.
 * @param {!tdl.fast.Matrix4} a The matrix on the left.
 * @param {!tdl.fast.Matrix4} b The matrix on the right.
 * @return {!tdl.fast.Matrix4} The matrix product of a and b.
 */
tdl.fast.matrix4.mul = function(dst, a, b) {
  return tdl.fast.mulMatrixMatrix4(dst, a, b);
};

/**
 * Copies a Matrix4.
 * Note: It is faster to call this than tdl.fast.copy.
 * @param {!tdl.fast.Matrix4} m The matrix.
 * @return {!tdl.fast.Matrix4} A copy of m.
 */
tdl.fast.matrix4.copy = function(dst, m) {
  return tdl.fast.copyMatrix(dst, m);
};

/**
 * Sets the translation component of a 4-by-4 matrix to the given
 * vector.
 * @param {!tdl.fast.Matrix4} a The matrix.
 * @param {(!tdl.fast.Vector3|!tdl.fast.Vector4)} v The vector.
 * @return {!tdl.fast.Matrix4} a once modified.
 */
tdl.fast.matrix4.setTranslation = function(a, v) {
  a[12] = v[0];
  a[13] = v[1];
  a[14] = v[2];
  a[15] = 1;
  return a;
};

/**
 * Returns the translation component of a 4-by-4 matrix as a vector with 3
 * entries.
 * @return {!tdl.fast.Vector3} dst vector..
 * @param {!tdl.fast.Matrix4} m The matrix.
 * @return {!tdl.fast.Vector3} The translation component of m.
 */
tdl.fast.matrix4.getTranslation = function(dst, m) {
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
};

/**
 * Creates a 4-by-4 identity matrix.
 * @param {!tdl.fast.Matrix4} dst matrix.
 * @return {!tdl.fast.Matrix4} The 4-by-4 identity.
 */
tdl.fast.matrix4.identity = function(dst) {
  return tdl.fast.identity4(dst);
};

tdl.fast.matrix4.getAxis = function(dst, m, axis) {
  var off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
};

/**
 * Computes a 4-by-4 perspective transformation matrix given the angular height
 * of the frustum, the aspect ratio, and the near and far clipping planes.  The
 * arguments define a frustum extending in the negative z direction.  The given
 * angle is the vertical angle of the frustum, and the horizontal angle is
 * determined to produce the given aspect ratio.  The arguments near and far are
 * the distances to the near and far clipping planes.  Note that near and far
 * are not z coordinates, but rather they are distances along the negative
 * z-axis.  The matrix generated sends the viewing frustum to the unit box.
 * We assume a unit box extending from -1 to 1 in the x and y dimensions and
 * from 0 to 1 in the z dimension.
 * @param {!tdl.fast.Matrix4} dst matrix.
 * @param {number} angle The camera angle from top to bottom (in radians).
 * @param {number} aspect The aspect ratio width / height.
 * @param {number} zNear The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param {number} zFar The depth (negative z coordinate)
 *     of the far clipping plane.
 * @return {!tdl.fast.Matrix4} The perspective matrix.
 */
tdl.fast.matrix4.perspective = function(dst, angle, aspect, zNear, zFar) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * angle);
  var rangeInv = 1.0 / (zNear - zFar);

  dst[0]  = f / aspect;
  dst[1]  = 0;
  dst[2]  = 0;
  dst[3]  = 0;

  dst[4]  = 0;
  dst[5]  = f;
  dst[6]  = 0;
  dst[7]  = 0;

  dst[8]  = 0;
  dst[9]  = 0;
  dst[10] = (zNear + zFar) * rangeInv;
  dst[11] = -1;

  dst[12] = 0;
  dst[13] = 0;
  dst[14] = zNear * zFar * rangeInv * 2;
  dst[15] = 0;

  return dst;
};


/**
 * Computes a 4-by-4 othogonal transformation matrix given the left, right,
 * bottom, and top dimensions of the near clipping plane as well as the
 * near and far clipping plane distances.
 * @param {!tdl.fast.Matrix4} dst Output matrix.
 * @param {number} left Left side of the near clipping plane viewport.
 * @param {number} right Right side of the near clipping plane viewport.
 * @param {number} top Top of the near clipping plane viewport.
 * @param {number} bottom Bottom of the near clipping plane viewport.
 * @param {number} near The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param {number} far The depth (negative z coordinate)
 *     of the far clipping plane.
 * @return {!tdl.fast.Matrix4} The perspective matrix.
 */
tdl.fast.matrix4.ortho = function(dst, left, right, bottom, top, near, far) {


  dst[0]  = 2 / (right - left);
  dst[1]  = 0;
  dst[2]  = 0;
  dst[3]  = 0;

  dst[4]  = 0;
  dst[5]  = 2 / (top - bottom);
  dst[6]  = 0;
  dst[7]  = 0;

  dst[8]  = 0;
  dst[9]  = 0;
  dst[10] = -1 / (far - near);
  dst[11] = 0;

  dst[12] = (right + left) / (left - right);
  dst[13] = (top + bottom) / (bottom - top);
  dst[14] = -near / (near - far);
  dst[15] = 1;

  return dst;
}

/**
 * Computes a 4-by-4 perspective transformation matrix given the left, right,
 * top, bottom, near and far clipping planes. The arguments define a frustum
 * extending in the negative z direction. The arguments near and far are the
 * distances to the near and far clipping planes. Note that near and far are not
 * z coordinates, but rather they are distances along the negative z-axis. The
 * matrix generated sends the viewing frustum to the unit box. We assume a unit
 * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
 * dimension.
 * @param {number} left The x coordinate of the left plane of the box.
 * @param {number} right The x coordinate of the right plane of the box.
 * @param {number} bottom The y coordinate of the bottom plane of the box.
 * @param {number} top The y coordinate of the right plane of the box.
 * @param {number} near The negative z coordinate of the near plane of the box.
 * @param {number} far The negative z coordinate of the far plane of the box.
 * @return {!tdl.fast.Matrix4} The perspective projection matrix.
 */
tdl.fast.matrix4.frustum = function(dst, left, right, bottom, top, near, far) {
  var dx = (right - left);
  var dy = (top - bottom);
  var dz = (near - far);

  dst[ 0] = 2 * near / dx;
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = 2 * near / dy;
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = (left + right) / dx;
  dst[ 9] = (top + bottom) / dy;
  dst[10] = far / dz;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = near * far / dz;
  dst[15] = 0;

  return dst;
};

/**
 * Computes a 4-by-4 look-at transformation.  The transformation generated is
 * an orthogonal rotation matrix with translation component.  The translation
 * component sends the eye to the origin.  The rotation component sends the
 * vector pointing from the eye to the target to a vector pointing in the
 * negative z direction, and also sends the up vector into the upper half of
 * the yz plane.
 * @return {!tdl.fast.Matrix4} dst matrix.
 * @param {(!tdl.fast.Vector3} eye The
 *     position of the eye.
 * @param {(!tdl.fast.Vector3} target The
 *     position meant to be viewed.
 * @param {(!tdl.fast.Vector3} up A vector
 *     pointing up.
 * @return {!tdl.fast.Matrix4} The look-at matrix.
 */
tdl.fast.matrix4.lookAt = function(dst, eye, target, up) {
  var t0 = tdl.fast.temp0v3_;
  var t1 = tdl.fast.temp1v3_;
  var t2 = tdl.fast.temp2v3_;

  var vz = tdl.fast.normalize(t0, tdl.fast.subVector(t0, eye, target));
  var vx = tdl.fast.normalize(t1, tdl.fast.cross(t1, up, vz));
  var vy = tdl.fast.cross(t2, vz, vx);

  dst[ 0] = vx[0];
  dst[ 1] = vy[0];
  dst[ 2] = vz[0];
  dst[ 3] = 0;
  dst[ 4] = vx[1];
  dst[ 5] = vy[1];
  dst[ 6] = vz[1];
  dst[ 7] = 0;
  dst[ 8] = vx[2];
  dst[ 9] = vy[2];
  dst[10] = vz[2];
  dst[11] = 0;
  dst[12] = -tdl.fast.dot(vx, eye);
  dst[13] = -tdl.fast.dot(vy, eye);
  dst[14] = -tdl.fast.dot(vz, eye);
  dst[15] = 1;

  return dst;
};

/**
 * Computes a 4-by-4 camera look-at transformation. This is the
 * inverse of lookAt The transformation generated is an
 * orthogonal rotation matrix with translation component.
 * @param {(!tdl.fast.Vector3|!tdl.fast.Vector4)} eye The position
 *     of the eye.
 * @param {(!tdl.fast.Vector3|!tdl.fast.Vector4)} target The
 *     position meant to be viewed.
 * @param {(!tdl.fast.Vector3|!tdl.fast.Vector4)} up A vector
 *     pointing up.
 * @return {!tdl.fast.Matrix4} The camera look-at matrix.
 */
tdl.fast.matrix4.cameraLookAt = function(dst, eye, target, up) {
  var t0 = tdl.fast.temp0v3_;
  var t1 = tdl.fast.temp1v3_;
  var t2 = tdl.fast.temp2v3_;

  var vz = tdl.fast.normalize(t0, tdl.fast.subVector(t0, eye, target));
  var vx = tdl.fast.normalize(t1, tdl.fast.cross(t1, up, vz));
  var vy = tdl.fast.cross(t2, vz, vx);

  dst[ 0] = vx[0];
  dst[ 1] = vx[1];
  dst[ 2] = vx[2];
  dst[ 3] = 0;
  dst[ 4] = vy[0];
  dst[ 5] = vy[1];
  dst[ 6] = vy[2];
  dst[ 7] = 0;
  dst[ 8] = vz[0];
  dst[ 9] = vz[1];
  dst[10] = vz[2];
  dst[11] = 0;
  dst[12] = eye[0];
  dst[13] = eye[1];
  dst[14] = eye[2];
  dst[15] = 1;

  return dst;
};

/**
 * Creates a 4-by-4 matrix which translates by the given vector v.
 * @param {(!tdl.fast.Vector3|!tdl.fast.Vector4)} v The vector by
 *     which to translate.
 * @return {!tdl.fast.Matrix4} The translation matrix.
 */
tdl.fast.matrix4.translation = function(dst, v) {
  dst[ 0] = 1;
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = 1;
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = v[0];
  dst[13] = v[1];
  dst[14] = v[2];
  dst[15] = 1;
  return dst;
};

/**
 * Modifies the given 4-by-4 matrix by translation by the given vector v.
 * @param {!tdl.fast.Matrix4} m The matrix.
 * @param {(!tdl.fast.Vector3|!tdl.fast.Vector4)} v The vector by
 *     which to translate.
 * @return {!tdl.fast.Matrix4} m once modified.
 */
tdl.fast.matrix4.translate = function(m, v) {
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];
  var m00 = m[0];
  var m01 = m[1];
  var m02 = m[2];
  var m03 = m[3];
  var m10 = m[1 * 4 + 0];
  var m11 = m[1 * 4 + 1];
  var m12 = m[1 * 4 + 2];
  var m13 = m[1 * 4 + 3];
  var m20 = m[2 * 4 + 0];
  var m21 = m[2 * 4 + 1];
  var m22 = m[2 * 4 + 2];
  var m23 = m[2 * 4 + 3];
  var m30 = m[3 * 4 + 0];
  var m31 = m[3 * 4 + 1];
  var m32 = m[3 * 4 + 2];
  var m33 = m[3 * 4 + 3];

  m[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
  m[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
  m[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
  m[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;

  return m;
};

tdl.fast.matrix4.transpose = tdl.fast.transpose4;

/**
 * Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.fast.Matrix4} The rotation matrix.
 */
tdl.fast.matrix4.rotationX = function(dst, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  dst[ 0] = 1;
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = c;
  dst[ 6] = s;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = -s;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;

  return dst;
};

/**
 * Modifies the given 4-by-4 matrix by a rotation around the x-axis by the given
 * angle.
 * @param {!tdl.fast.Matrix4} m The matrix.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.fast.Matrix4} m once modified.
 */
tdl.fast.matrix4.rotateX = function(m, angle) {
  var m10 = m[4];
  var m11 = m[5];
  var m12 = m[6];
  var m13 = m[7];
  var m20 = m[8];
  var m21 = m[9];
  var m22 = m[10];
  var m23 = m[11];
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  m[4]  = c * m10 + s * m20;
  m[5]  = c * m11 + s * m21;
  m[6]  = c * m12 + s * m22;
  m[7]  = c * m13 + s * m23;
  m[8]  = c * m20 - s * m10;
  m[9]  = c * m21 - s * m11;
  m[10] = c * m22 - s * m12;
  m[11] = c * m23 - s * m13;

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.fast.Matrix4} The rotation matrix.
 */
tdl.fast.matrix4.rotationY = function(dst, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  dst[ 0] = c;
  dst[ 1] = 0;
  dst[ 2] = -s;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = 1;
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = s;
  dst[ 9] = 0;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;

  return dst;
};

/**
 * Modifies the given 4-by-4 matrix by a rotation around the y-axis by the given
 * angle.
 * @param {!tdl.fast.Matrix4} m The matrix.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.fast.Matrix4} m once modified.
 */
tdl.fast.matrix4.rotateY = function(m, angle) {
  var m00 = m[0*4+0];
  var m01 = m[0*4+1];
  var m02 = m[0*4+2];
  var m03 = m[0*4+3];
  var m20 = m[2*4+0];
  var m21 = m[2*4+1];
  var m22 = m[2*4+2];
  var m23 = m[2*4+3];
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  m[ 0] = c * m00 - s * m20;
  m[ 1] = c * m01 - s * m21;
  m[ 2] = c * m02 - s * m22;
  m[ 3] = c * m03 - s * m23;
  m[ 8] = c * m20 + s * m00;
  m[ 9] = c * m21 + s * m01;
  m[10] = c * m22 + s * m02;
  m[11] = c * m23 + s * m03;

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.fast.Matrix4} The rotation matrix.
 */
tdl.fast.matrix4.rotationZ = function(dst, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  dst[ 0] = c;
  dst[ 1] = s;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = -s;
  dst[ 5] = c;
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;

  return dst;
};

/**
 * Modifies the given 4-by-4 matrix by a rotation around the z-axis by the given
 * angle.
 * @param {!tdl.fast.Matrix4} m The matrix.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.fast.Matrix4} m once modified.
 */
tdl.fast.matrix4.rotateZ = function(m, angle) {
  var m00 = m[0*4+0];
  var m01 = m[0*4+1];
  var m02 = m[0*4+2];
  var m03 = m[0*4+3];
  var m10 = m[1*4+0];
  var m11 = m[1*4+1];
  var m12 = m[1*4+2];
  var m13 = m[1*4+3];
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  m[ 0] = c * m00 + s * m10;
  m[ 1] = c * m01 + s * m11;
  m[ 2] = c * m02 + s * m12;
  m[ 3] = c * m03 + s * m13;
  m[ 4] = c * m10 - s * m00;
  m[ 5] = c * m11 - s * m01;
  m[ 6] = c * m12 - s * m02;
  m[ 7] = c * m13 - s * m03;

  return m;
};

/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle.
 * @param {(!tdl.fast.Vector3|!tdl.fast.Vector4)} axis The axis
 *     about which to rotate.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.fast.Matrix4} A matrix which rotates angle radians
 *     around the axis.
 */
tdl.fast.matrix4.axisRotation = function(dst, axis, angle) {
  var x = axis[0];
  var y = axis[1];
  var z = axis[2];
  var n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  var xx = x * x;
  var yy = y * y;
  var zz = z * z;
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var oneMinusCosine = 1 - c;

  dst[ 0] = xx + (1 - xx) * c;
  dst[ 1] = x * y * oneMinusCosine + z * s;
  dst[ 2] = x * z * oneMinusCosine - y * s;
  dst[ 3] = 0;
  dst[ 4] = x * y * oneMinusCosine - z * s;
  dst[ 5] = yy + (1 - yy) * c;
  dst[ 6] = y * z * oneMinusCosine + x * s;
  dst[ 7] = 0;
  dst[ 8] = x * z * oneMinusCosine + y * s;
  dst[ 9] = y * z * oneMinusCosine - x * s;
  dst[10] = zz + (1 - zz) * c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;

  return dst;
};

/**
 * Modifies the given 4-by-4 matrix by rotation around the given axis by the
 * given angle.
 * @param {!tdl.fast.Matrix4} m The matrix.
 * @param {(!tdl.fast.Vector3|!tdl.fast.Vector4)} axis The axis
 *     about which to rotate.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.fast.Matrix4} m once modified.
 */
tdl.fast.matrix4.axisRotate = function(m, axis, angle) {
  var x = axis[0];
  var y = axis[1];
  var z = axis[2];
  var n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  var xx = x * x;
  var yy = y * y;
  var zz = z * z;
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var oneMinusCosine = 1 - c;

  var r00 = xx + (1 - xx) * c;
  var r01 = x * y * oneMinusCosine + z * s;
  var r02 = x * z * oneMinusCosine - y * s;
  var r10 = x * y * oneMinusCosine - z * s;
  var r11 = yy + (1 - yy) * c;
  var r12 = y * z * oneMinusCosine + x * s;
  var r20 = x * z * oneMinusCosine + y * s;
  var r21 = y * z * oneMinusCosine - x * s;
  var r22 = zz + (1 - zz) * c;

  var m00 = m[0];
  var m01 = m[1];
  var m02 = m[2];
  var m03 = m[3];
  var m10 = m[4];
  var m11 = m[5];
  var m12 = m[6];
  var m13 = m[7];
  var m20 = m[8];
  var m21 = m[9];
  var m22 = m[10];
  var m23 = m[11];
  var m30 = m[12];
  var m31 = m[13];
  var m32 = m[14];
  var m33 = m[15];

  m[ 0] = r00 * m00 + r01 * m10 + r02 * m20;
  m[ 1] = r00 * m01 + r01 * m11 + r02 * m21;
  m[ 2] = r00 * m02 + r01 * m12 + r02 * m22;
  m[ 3] = r00 * m03 + r01 * m13 + r02 * m23;
  m[ 4] = r10 * m00 + r11 * m10 + r12 * m20;
  m[ 5] = r10 * m01 + r11 * m11 + r12 * m21;
  m[ 6] = r10 * m02 + r11 * m12 + r12 * m22;
  m[ 7] = r10 * m03 + r11 * m13 + r12 * m23;
  m[ 8] = r20 * m00 + r21 * m10 + r22 * m20;
  m[ 9] = r20 * m01 + r21 * m11 + r22 * m21;
  m[10] = r20 * m02 + r21 * m12 + r22 * m22;
  m[11] = r20 * m03 + r21 * m13 + r22 * m23;

  return m;
};

/**
 * Creates a 4-by-4 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param {!tdl.fast.Vector3} v A vector of
 *     three entries specifying the factor by which to scale in each dimension.
 * @return {!tdl.fast.Matrix4} The scaling matrix.
 */
tdl.fast.matrix4.scaling = function(dst, v) {
  dst[ 0] = v[0];
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = v[1];
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = 0;
  dst[10] = v[2];
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
};

/**
 * Modifies the given 4-by-4 matrix, scaling in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param {!tdl.fast.Matrix4} m The matrix to be modified.
 * @param {!tdl.fast.Vector3} v A vector of three entries specifying the
 *     factor by which to scale in each dimension.
 * @return {!tdl.fast.Matrix4} m once modified.
 */
tdl.fast.matrix4.scale = function(m, v) {
  var v0 = v[0];
  var v1 = v[1];
  var v2 = v[2];

  m[0] = v0 * m[0*4+0];
  m[1] = v0 * m[0*4+1];
  m[2] = v0 * m[0*4+2];
  m[3] = v0 * m[0*4+3];
  m[4] = v1 * m[1*4+0];
  m[5] = v1 * m[1*4+1];
  m[6] = v1 * m[1*4+2];
  m[7] = v1 * m[1*4+3];
  m[8] = v2 * m[2*4+0];
  m[9] = v2 * m[2*4+1];
  m[10] = v2 * m[2*4+2];
  m[11] = v2 * m[2*4+3];

  return m;
};

/**
 * Sets each function in the namespace tdl.fast to the row major
 * version in tdl.fast.rowMajor (provided such a function exists in
 * tdl.fast.rowMajor).  Call this function to establish the row major
 * convention.
 */
tdl.fast.installRowMajorFunctions = function() {
  for (var f in tdl.fast.rowMajor) {
    tdl.fast[f] = tdl.fast.rowMajor[f];
  }
};

/**
 * Sets each function in the namespace tdl.fast to the column major
 * version in tdl.fast.columnMajor (provided such a function exists in
 * tdl.fast.columnMajor).  Call this function to establish the column
 * major convention.
 */
tdl.fast.installColumnMajorFunctions = function() {
  for (var f in tdl.fast.columnMajor) {
    tdl.fast[f] = tdl.fast.columnMajor[f];
  }
};

// By default, install the row-major functions.
tdl.fast.installRowMajorFunctions();
