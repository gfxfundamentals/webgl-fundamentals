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
 * @fileoverview This file contains various functions for quaternion arithmetic
 * and converting between rotation matrices and quaternions.  It adds them to
 * the "quaternions" module on the tdl object.  Javascript arrays with
 * four entries are used to represent quaternions, and functions are provided
 * for doing operations on those.
 *
 * Operations are done assuming quaternions are of the form:
 * q[0] + q[1]i + q[2]j + q[3]k and using the hamiltonian rules for
 * multiplication as described on Brougham Bridge:
 * i^2 = j^2 = k^2 = ijk = -1.
 *
 */

tdl.provide('tdl.quaternions');

/**
 * A Module for quaternion math.
 * @namespace
 */
tdl.quaternions = tdl.quaternions || {};

/**
 * A Quaternion.
 * @type {!Array.<number>}
 */
tdl.quaternions.Quaternion = goog.typedef;

/**
 * Quickly determines if the object a is a scalar or a quaternion;
 * assumes that the argument is either a number (scalar), or an array of
 * numbers.
 * @param {(number|!tdl.quaternions.Quaternion)} a A number or array the type
 *     of which is in question.
 * @return {string} Either the string 'Scalar' or 'Quaternion'.
 */
tdl.quaternions.mathType = function(a) {
  if (typeof(a) === 'number')
    return 'Scalar';
  return 'Quaternion';
};

/**
 * Creates an identity quaternion.
 * @return {!tdl.quaternions.Quaternion} The identity quaternion.
 */
tdl.quaternions.identity = function() {
  return [ 0, 0, 0, 1 ];
};

/**
 * Copies a quaternion.
 * @param {!tdl.quaternions.Quaternion} q The quaternion.
 * @return {!tdl.quaternions.Quaternion} A new quaternion identical to q.
 */
tdl.quaternions.copy = function(q) {
  return q.slice();
};

/**
 * Negates a quaternion.
 * @param {!tdl.quaternions.Quaternion} q The quaternion.
 * @return {!tdl.quaternions.Quaternion} -q.
 */
tdl.quaternions.negative = function(q) {
  return [-q[0], -q[1], -q[2], -q[3]];
};

/**
 * Adds two Quaternions.
 * @param {!tdl.quaternions.Quaternion} a Operand Quaternion.
 * @param {!tdl.quaternions.Quaternion} b Operand Quaternion.
 * @return {!tdl.quaternions.Quaternion} The sum of a and b.
 */
tdl.quaternions.addQuaternionQuaternion = function(a, b) {
  return [a[0] + b[0],
          a[1] + b[1],
          a[2] + b[2],
          a[3] + b[3]];
};

/**
 * Adds a quaternion to a scalar.
 * @param {!tdl.quaternions.Quaternion} a Operand Quaternion.
 * @param {number} b Operand Scalar.
 * @return {!tdl.quaternions.Quaternion} The sum of a and b.
 */
tdl.quaternions.addQuaternionScalar = function(a, b) {
  return a.slice(0, 3).concat(a[3] + b);
};

/**
 * Adds a scalar to a quaternion.
 * @param {number} a Operand scalar.
 * @param {!tdl.quaternions.Quaternion} b Operand quaternion.
 * @return {!tdl.quaternions.Quaternion} The sum of a and b.
 */
tdl.quaternions.addScalarQuaternion = function(a, b) {
  return b.slice(0, 3).concat(a + b[3]);
};

/**
 * Subtracts two quaternions.
 * @param {!tdl.quaternions.Quaternion} a Operand quaternion.
 * @param {!tdl.quaternions.Quaternion} b Operand quaternion.
 * @return {!tdl.quaternions.Quaternion} The difference a - b.
 */
tdl.quaternions.subQuaternionQuaternion = function(a, b) {
  return [a[0] - b[0],
          a[1] - b[1],
          a[2] - b[2],
          a[3] - b[3]];
};

/**
 * Subtracts a scalar from a quaternion.
 * @param {!tdl.quaternions.Quaternion} a Operand quaternion.
 * @param {number} b Operand scalar.
 * @return {!tdl.quaternions.Quaternion} The difference a - b.
 */
tdl.quaternions.subQuaternionScalar = function(a, b) {
  return a.slice(0, 3).concat(a[3] - b);
};

/**
 * Subtracts a quaternion from a scalar.
 * @param {number} a Operand scalar.
 * @param {!tdl.quaternions.Quaternion} b Operand quaternion.
 * @return {!tdl.quaternions.Quaternion} The difference a - b.
 */
tdl.quaternions.subScalarQuaternion = function(a, b) {
  return [-b[0], -b[1], -b[2], a - b[3]];
};

/**
 * Multiplies a scalar by a quaternion.
 * @param {number} k The scalar.
 * @param {!tdl.quaternions.Quaternion} q The quaternion.
 * @return {!tdl.quaternions.Quaternion} The product of k and q.
 */
tdl.quaternions.mulScalarQuaternion = function(k, q) {
  return [k * q[0], k * q[1], k * q[2], k * q[3]];
};

/**
 * Multiplies a quaternion by a scalar.
 * @param {!tdl.quaternions.Quaternion} q The Quaternion.
 * @param {number} k The scalar.
 * @return {!tdl.quaternions.Quaternion} The product of k and v.
 */
tdl.quaternions.mulQuaternionScalar = function(q, k) {
  return [k * q[0], k * q[1], k * q[2], k * q[3]];
};

/**
 * Multiplies two quaternions.
 * @param {!tdl.quaternions.Quaternion} a Operand quaternion.
 * @param {!tdl.quaternions.Quaternion} b Operand quaternion.
 * @return {!tdl.quaternions.Quaternion} The quaternion product a * b.
 */
tdl.quaternions.mulQuaternionQuaternion = function(a, b) {
  var aX = a[0];
  var aY = a[1];
  var aZ = a[2];
  var aW = a[3];
  var bX = b[0];
  var bY = b[1];
  var bZ = b[2];
  var bW = b[3];

  return [
      aW * bX + aX * bW + aY * bZ - aZ * bY,
      aW * bY + aY * bW + aZ * bX - aX * bZ,
      aW * bZ + aZ * bW + aX * bY - aY * bX,
      aW * bW - aX * bX - aY * bY - aZ * bZ];
};

/**
 * Divides two quaternions; assumes the convention that a/b = a*(1/b).
 * @param {!tdl.quaternions.Quaternion} a Operand quaternion.
 * @param {!tdl.quaternions.Quaternion} b Operand quaternion.
 * @return {!tdl.quaternions.Quaternion} The quaternion quotient a / b.
 */
tdl.quaternions.divQuaternionQuaternion = function(a, b) {
  var aX = a[0];
  var aY = a[1];
  var aZ = a[2];
  var aW = a[3];
  var bX = b[0];
  var bY = b[1];
  var bZ = b[2];
  var bW = b[3];

  var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);
  return [
      (aX * bW - aW * bX - aY * bZ + aZ * bY) * d,
      (aX * bZ - aW * bY + aY * bW - aZ * bX) * d,
      (aY * bX + aZ * bW - aW * bZ - aX * bY) * d,
      (aW * bW + aX * bX + aY * bY + aZ * bZ) * d];
};

/**
 * Divides a Quaternion by a scalar.
 * @param {!tdl.quaternions.Quaternion} q The quaternion.
 * @param {number} k The scalar.
 * @return {!tdl.quaternions.Quaternion} q The quaternion q divided by k.
 */
tdl.quaternions.divQuaternionScalar = function(q, k) {
  return [q[0] / k, q[1] / k, q[2] / k, q[3] / k];
};

/**
 * Divides a scalar by a quaternion.
 * @param {number} a Operand scalar.
 * @param {!tdl.quaternions.Quaternion} b Operand quaternion.
 * @return {!tdl.quaternions.Quaternion} The quaternion product.
 */
tdl.quaternions.divScalarQuaternion = function(a, b) {
  var b0 = b[0];
  var b1 = b[1];
  var b2 = b[2];
  var b3 = b[3];

  var d = 1 / (b0 * b0 + b1 * b1 + b2 * b2 + b3 * b3);
  return [-a * b0 * d, -a * b1 * d, -a * b2 * d, a * b3 * d];
};

/**
 * Computes the multiplicative inverse of a quaternion.
 * @param {!tdl.quaternions.Quaternion} q The quaternion.
 * @return {!tdl.quaternions.Quaternion} The multiplicative inverse of q.
 */
tdl.quaternions.inverse = function(q) {
  var q0 = q[0];
  var q1 = q[1];
  var q2 = q[2];
  var q3 = q[3];

  var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
  return [-q0 * d, -q1 * d, -q2 * d, q3 * d];
};

/**
 * Multiplies two objects which are either scalars or quaternions.
 * @param {(!tdl.quaternions.Quaternion|number)} a Operand.
 * @param {(!tdl.quaternions.Quaternion|number)} b Operand.
 * @return {(!tdl.quaternions.Quaternion|number)} The product of a and b.
 */
tdl.quaternions.mul = function(a, b) {
  return tdl.quaternions['mul' + tdl.quaternions.mathType(a) +
      tdl.quaternions.mathType(b)](a, b);
};

/**
 * Divides two objects which are either scalars or quaternions.
 * @param {(!tdl.quaternions.Quaternion|number)} a Operand.
 * @param {(!tdl.quaternions.Quaternion|number)} b Operand.
 * @return {(!tdl.quaternions.Quaternion|number)} The quotient of a and b.
 */
tdl.quaternions.div = function(a, b) {
  return tdl.quaternions['div' + tdl.quaternions.mathType(a) +
      tdl.quaternions.mathType(b)](a, b);
};

/**
 * Adds two objects which are either scalars or quaternions.
 * @param {(!tdl.quaternions.Quaternion|number)} a Operand.
 * @param {(!tdl.quaternions.Quaternion|number)} b Operand.
 * @return {(!tdl.quaternions.Quaternion|number)} The sum of a and b.
 */
tdl.quaternions.add = function(a, b) {
  return tdl.quaternions['add' + tdl.quaternions.mathType(a) +
      tdl.quaternions.mathType(b)](a, b);
};

/**
 * Subtracts two objects which are either scalars or quaternions.
 * @param {(!tdl.quaternions.Quaternion|number)} a Operand.
 * @param {(!tdl.quaternions.Quaternion|number)} b Operand.
 * @return {(!tdl.quaternions.Quaternion|number)} The difference of a and b.
 */
tdl.quaternions.sub = function(a, b) {
  return tdl.quaternions['sub' + tdl.quaternions.mathType(a) +
      tdl.quaternions.mathType(b)](a, b);
};

/**
 * Computes the length of a Quaternion, i.e. the square root of the
 * sum of the squares of the coefficients.
 * @param {!tdl.quaternions.Quaternion} a The Quaternion.
 * @return {number} The length of a.
 */
tdl.quaternions.length = function(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3]);
};

/**
 * Computes the square of the length of a quaternion, i.e. the sum of the
 * squares of the coefficients.
 * @param {!tdl.quaternions.Quaternion} a The quaternion.
 * @return {number} The square of the length of a.
 */
tdl.quaternions.lengthSquared = function(a) {
  return a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3];
};

/**
 * Divides a Quaternion by its length and returns the quotient.
 * @param {!tdl.quaternions.Quaternion} a The Quaternion.
 * @return {!tdl.quaternions.Quaternion} A unit length quaternion pointing in
 *     the same direction as a.
 */
tdl.quaternions.normalize = function(a) {
  var d = 1 / Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3]);
  return [a[0] * d, a[1] * d, a[2] * d, a[3] * d];
};

/**
 * Computes the conjugate of the given quaternion.
 * @param {!tdl.quaternions.Quaternion} q The quaternion.
 * @return {!tdl.quaternions.Quaternion} The conjugate of q.
 */
tdl.quaternions.conjugate = function(q) {
  return [-q[0], -q[1], -q[2], q[3]];
};


/**
 * Creates a quaternion which rotates around the x-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.quaternions.Quaternion} The quaternion.
 */
tdl.quaternions.rotationX = function(angle) {
  return [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)];
};

/**
 * Creates a quaternion which rotates around the y-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.quaternions.Quaternion} The quaternion.
 */
tdl.quaternions.rotationY = function(angle) {
  return [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];
};

/**
 * Creates a quaternion which rotates around the z-axis by the given angle.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.quaternions.Quaternion} The quaternion.
 */
tdl.quaternions.rotationZ = function(angle) {
  return [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)];
};

/**
 * Creates a quaternion which rotates around the given axis by the given
 * angle.
 * @param {!tdl.math.Vector3} axis The axis about which to rotate.
 * @param {number} angle The angle by which to rotate (in radians).
 * @return {!tdl.quaternions.Quaternion} A quaternion which rotates angle
 *     radians around the axis.
 */
tdl.quaternions.axisRotation = function(axis, angle) {
  var d = 1 / Math.sqrt(axis[0] * axis[0] +
                        axis[1] * axis[1] +
                        axis[2] * axis[2]);
  var sin = Math.sin(angle / 2);
  var cos = Math.cos(angle / 2);
  return [sin * axis[0] * d, sin * axis[1] * d, sin * axis[2] * d, cos];
};

/**
 * Computes a 4-by-4 rotation matrix (with trivial translation component)
 * given a quaternion.  We assume the convention that to rotate a vector v by
 * a quaternion r means to express that vector as a quaternion q by letting
 * q = [v[0], v[1], v[2], 0] and then obtain the rotated vector by evaluating
 * the expression (r * q) / r.
 * @param {!tdl.quaternions.Quaternion} q The quaternion.
 * @return {!tdl.math.Matrix4} A 4-by-4 rotation matrix.
 */
tdl.quaternions.quaternionToRotation = function(q) {
  var qX = q[0];
  var qY = q[1];
  var qZ = q[2];
  var qW = q[3];

  var qWqW = qW * qW;
  var qWqX = qW * qX;
  var qWqY = qW * qY;
  var qWqZ = qW * qZ;
  var qXqW = qX * qW;
  var qXqX = qX * qX;
  var qXqY = qX * qY;
  var qXqZ = qX * qZ;
  var qYqW = qY * qW;
  var qYqX = qY * qX;
  var qYqY = qY * qY;
  var qYqZ = qY * qZ;
  var qZqW = qZ * qW;
  var qZqX = qZ * qX;
  var qZqY = qZ * qY;
  var qZqZ = qZ * qZ;

  var d = qWqW + qXqX + qYqY + qZqZ;

  return [
    [(qWqW + qXqX - qYqY - qZqZ) / d,
     2 * (qWqZ + qXqY) / d,
     2 * (qXqZ - qWqY) / d, 0],
    [2 * (qXqY - qWqZ) / d,
     (qWqW - qXqX + qYqY - qZqZ) / d,
     2 * (qWqX + qYqZ) / d, 0],
    [2 * (qWqY + qXqZ) / d,
     2 * (qYqZ - qWqX) / d,
     (qWqW - qXqX - qYqY + qZqZ) / d, 0],
    [0, 0, 0, 1]];
};

/**
 * Computes a quaternion whose rotation is equivalent to the given matrix.
 * @param {(!tdl.math.Matrix4|!tdl.math.Matrix3)} m A 3-by-3 or 4-by-4
 *     rotation matrix.
 * @return {!tdl.quaternions.Quaternion} A quaternion q such that
 *     quaternions.quaternionToRotation(q) is m.
 */
tdl.quaternions.rotationToQuaternion = function(m) {
  var u;
  var v;
  var w;

  // Choose u, v, and w such that u is the index of the biggest diagonal entry
  // of m, and u v w is an even permutation of 0 1 and 2.
  if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) {
    u = 0;
    v = 1;
    w = 2;
  } else if (m[1][1] > m[0][0] && m[1][1] > m[2][2]) {
    u = 1;
    v = 2;
    w = 0;
  } else {
    u = 2;
    v = 0;
    w = 1;
  }

  var r = Math.sqrt(1 + m[u][u] - m[v][v] - m[w][w]);
  var q = [];
  q[u] = 0.5 * r;
  q[v] = 0.5 * (m[v][u] + m[u][v]) / r;
  q[w] = 0.5 * (m[u][w] + m[w][u]) / r;
  q[3] = 0.5 * (m[v][w] - m[w][v]) / r;

  return q;
};

