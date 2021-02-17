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

"use strict";

(function() {

var ctx = document.createElement("canvas").getContext("2d");

var setCanvasSize = function(width, height) {
  ctx.canvas.width  = width;
  ctx.canvas.height = height;
};

var makeTexture = function(gl) {
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
};

var makeStripeTexture = function(gl, options) {
  options = options || {};
  var width  = options.width  || 2;
  var height = options.height || 2;
  var color1 = options.color1 || "white";
  var color2 = options.color2 || "black";

  setCanvasSize(width, height);

  ctx.fillStyle = color1 || "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color2 || "black";
  ctx.fillRect(0, 0, width, height / 2);

  return makeTexture(gl);
};

var makeCheckerTexture = function(gl, options) {
  options = options || {};
  var width  = options.width  || 2;
  var height = options.height || 2;
  var color1 = options.color1 || "white";
  var color2 = options.color2 || "black";

  setCanvasSize(width, height);

  ctx.fillStyle = color1 || "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color2 || "black";
  ctx.fillRect(0, 0, width / 2, height / 2);
  ctx.fillRect(width / 2, height / 2, width / 2, height / 2);

  return makeTexture(gl);
};

var makeCircleTexture = function(gl, options) {
  options = options || {};
  var width  = options.width  || 128;
  var height = options.height || 128;
  var color1 = options.color1 || "white";
  var color2 = options.color2 || "black";

  setCanvasSize(width, height);

  var size = Math.min(width, height);
  ctx.fillStyle = color1 || "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color2 || "black";
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.beginPath();
  ctx.arc(0, 0, width / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color1 || "white";
  ctx.beginPath();
  ctx.arc(0, 0, width / 4 - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  return makeTexture(gl);
};

var makeRandomTexture = function(gl, options) {
  options = options || {};
  var w   = options.width  || 2;
  var h   = options.height || 2;
  var min = options.min    || 0;
  var max = options.max    || 256;

  var numPixels = w * h;
  var pixels = new Uint8Array(numPixels * 4);
  var strong = 4;randInt(3);
  for (var p = 0; p < numPixels; ++p) {
    var off = p * 4;
    pixels[off + 0] = rand(min, max);
    pixels[off + 1] = rand(min, max);
    pixels[off + 2] = rand(min, max);
    pixels[off + 3] = 255;
  }
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
};

var textureUtils = {
  makeStripeTexture: makeStripeTexture,
  makeCheckerTexture: makeCheckerTexture,
  makeCircleTexture: makeCircleTexture,
  makeRandomTexture: makeRandomTexture,
};

var isAMD = window.define && typeof window.define === "function";

if (isAMD) {
  define([], function() { return textureUtils; });
} else {
  window.textureUtils = textureUtils;
}

}());

