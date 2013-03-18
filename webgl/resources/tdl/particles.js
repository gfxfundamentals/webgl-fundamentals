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
 * @fileoverview This file contains various functions and classes for rendering
 * gpu based particles.
 */

tdl.provide('tdl.particles');

tdl.require('tdl.math');

tdl.require('tdl.shader');

/**
 * A Module with various io functions and classes.
 * @namespace
 */
tdl.particles = tdl.particles || {};

/**
 * Enum for pre-made particle states.
 * @enum
 */
tdl.particles.ParticleStateIds = {
  BLEND: 0,
  ADD: 1,
  BLEND_PREMULTIPLY: 2,
  BLEND_NO_ALPHA: 3,
  SUBTRACT: 4,
  INVERSE: 5};

/**
 * Vertex and fragment program strings for 2D and 3D particles.
 * @private
 * @type {!Array.<string>}
 */
tdl.particles.SHADER_STRINGS = [
  // 3D (oriented) vertex shader
  'uniform mat4 worldViewProjection;\n' +
  'uniform mat4 world;\n' +
  'uniform vec3 worldVelocity;\n' +
  'uniform vec3 worldAcceleration;\n' +
  'uniform float timeRange;\n' +
  'uniform float time;\n' +
  'uniform float timeOffset;\n' +
  'uniform float frameDuration;\n' +
  'uniform float numFrames;\n' +
  '\n' +
  '// Incoming vertex attributes\n' +
  'attribute vec4 uvLifeTimeFrameStart; // uv, lifeTime, frameStart\n' +
  'attribute vec4 positionStartTime;    // position.xyz, startTime\n' +
  'attribute vec4 velocityStartSize;    // velocity.xyz, startSize\n' +
  'attribute vec4 accelerationEndSize;  // acceleration.xyz, endSize\n' +
  'attribute vec4 spinStartSpinSpeed;   // spinStart.x, spinSpeed.y\n' +
  'attribute vec4 orientation;          // orientation quaternion\n' +
  'attribute vec4 colorMult;            // multiplies color and ramp textures\n' +
  '\n' +
  '// Outgoing variables to fragment shader\n' +
  'varying vec2 outputTexcoord;\n' +
  'varying float outputPercentLife;\n' +
  'varying vec4 outputColorMult;\n' +
  '\n' +
  'void main() {\n' +
  '  vec2 uv = uvLifeTimeFrameStart.xy;\n' +
  '  float lifeTime = uvLifeTimeFrameStart.z;\n' +
  '  float frameStart = uvLifeTimeFrameStart.w;\n' +
  '  vec3 position = positionStartTime.xyz;\n' +
  '  float startTime = positionStartTime.w;\n' +
  '  vec3 velocity = (world * vec4(velocityStartSize.xyz,\n' +
  '                                0.)).xyz + worldVelocity;\n' +
  '  float startSize = velocityStartSize.w;\n' +
  '  vec3 acceleration = (world * vec4(accelerationEndSize.xyz,\n' +
  '                                    0)).xyz + worldAcceleration;\n' +
  '  float endSize = accelerationEndSize.w;\n' +
  '  float spinStart = spinStartSpinSpeed.x;\n' +
  '  float spinSpeed = spinStartSpinSpeed.y;\n' +
  '\n' +
  '  float localTime = mod((time - timeOffset - startTime), timeRange);\n' +
  '  float percentLife = localTime / lifeTime;\n' +
  '\n' +
  '  float frame = mod(floor(localTime / frameDuration + frameStart),\n' +
  '                    numFrames);\n' +
  '  float uOffset = frame / numFrames;\n' +
  '  float u = uOffset + (uv.x + 0.5) * (1. / numFrames);\n' +
  '\n' +
  '  outputTexcoord = vec2(u, uv.y + 0.5);\n' +
  '  outputColorMult = colorMult;\n' +
  '\n' +
  '  float size = mix(startSize, endSize, percentLife);\n' +
  '  size = (percentLife < 0. || percentLife > 1.) ? 0. : size;\n' +
  '  float s = sin(spinStart + spinSpeed * localTime);\n' +
  '  float c = cos(spinStart + spinSpeed * localTime);\n' +
  '\n' +
  '  vec4 rotatedPoint = vec4((uv.x * c + uv.y * s) * size, 0., \n' +
  '                           (uv.x * s - uv.y * c) * size, 1.);\n' +
  '  vec3 center = velocity * localTime +\n' +
  '                acceleration * localTime * localTime + \n' +
  '                position;\n' +
  '\n' +
  '  vec4 q2 = orientation + orientation;\n' +
  '  vec4 qx = orientation.xxxw * q2.xyzx;\n' +
  '  vec4 qy = orientation.xyyw * q2.xyzy;\n' +
  '  vec4 qz = orientation.xxzw * q2.xxzz;\n' +
  '\n' +
  '  mat4 localMatrix = mat4(\n' +
  '      (1.0 - qy.y) - qz.z, \n' +
  '      qx.y + qz.w, \n' +
  '      qx.z - qy.w,\n' +
  '      0,\n' +
  '\n' +
  '      qx.y - qz.w, \n' +
  '      (1.0 - qx.x) - qz.z, \n' +
  '      qy.z + qx.w,\n' +
  '      0,\n' +
  '\n' +
  '      qx.z + qy.w, \n' +
  '      qy.z - qx.w, \n' +
  '      (1.0 - qx.x) - qy.y,\n' +
  '      0,\n' +
  '\n' +
  '      center.x, center.y, center.z, 1);\n' +
  '  rotatedPoint = localMatrix * rotatedPoint;\n' +
  '  outputPercentLife = percentLife;\n' +
  '  gl_Position = worldViewProjection * rotatedPoint;\n' +
  '}\n',

  // 2D (billboarded) vertex shader
  'uniform mat4 viewProjection;\n' +
  'uniform mat4 world;\n' +
  'uniform mat4 viewInverse;\n' +
  'uniform vec3 worldVelocity;\n' +
  'uniform vec3 worldAcceleration;\n' +
  'uniform float timeRange;\n' +
  'uniform float time;\n' +
  'uniform float timeOffset;\n' +
  'uniform float frameDuration;\n' +
  'uniform float numFrames;\n' +
  '\n' +
  '// Incoming vertex attributes\n' +
  'attribute vec4 uvLifeTimeFrameStart; // uv, lifeTime, frameStart\n' +
  'attribute vec4 positionStartTime;    // position.xyz, startTime\n' +
  'attribute vec4 velocityStartSize;    // velocity.xyz, startSize\n' +
  'attribute vec4 accelerationEndSize;  // acceleration.xyz, endSize\n' +
  'attribute vec4 spinStartSpinSpeed;   // spinStart.x, spinSpeed.y\n' +
  'attribute vec4 colorMult;            // multiplies color and ramp textures\n' +
  '\n' +
  '// Outgoing variables to fragment shader\n' +
  'varying vec2 outputTexcoord;\n' +
  'varying float outputPercentLife;\n' +
  'varying vec4 outputColorMult;\n' +
  '\n' +
  'void main() {\n' +
  '  vec2 uv = uvLifeTimeFrameStart.xy;\n' +
  '  float lifeTime = uvLifeTimeFrameStart.z;\n' +
  '  float frameStart = uvLifeTimeFrameStart.w;\n' +
  '  vec3 position = positionStartTime.xyz;\n' +
//  '  vec3 position = (world * vec4(positionStartTime.xyz, 1.0)).xyz;\n' +
  '  float startTime = positionStartTime.w;\n' +
  '  vec3 velocity = (world * vec4(velocityStartSize.xyz,\n' +
  '                                0.)).xyz + worldVelocity;\n' +
  '  float startSize = velocityStartSize.w;\n' +
  '  vec3 acceleration = (world * vec4(accelerationEndSize.xyz,\n' +
  '                                    0)).xyz + worldAcceleration;\n' +
  '  float endSize = accelerationEndSize.w;\n' +
  '  float spinStart = spinStartSpinSpeed.x;\n' +
  '  float spinSpeed = spinStartSpinSpeed.y;\n' +
  '\n' +
  '  float localTime = mod((time - timeOffset - startTime), timeRange);\n' +
  '  float percentLife = localTime / lifeTime;\n' +
  '\n' +
  '  float frame = mod(floor(localTime / frameDuration + frameStart),\n' +
  '                    numFrames);\n' +
  '  float uOffset = frame / numFrames;\n' +
  '  float u = uOffset + (uv.x + 0.5) * (1. / numFrames);\n' +
  '\n' +
  '  outputTexcoord = vec2(u, uv.y + 0.5);\n' +
  '  outputColorMult = colorMult;\n' +
  '\n' +
  '  vec3 basisX = viewInverse[0].xyz;\n' +
  '  vec3 basisZ = viewInverse[1].xyz;\n' +
  '\n' +
  '  float size = mix(startSize, endSize, percentLife);\n' +
  '  size = (percentLife < 0. || percentLife > 1.) ? 0. : size;\n' +
  '  float s = sin(spinStart + spinSpeed * localTime);\n' +
  '  float c = cos(spinStart + spinSpeed * localTime);\n' +
  '\n' +
  '  vec2 rotatedPoint = vec2(uv.x * c + uv.y * s, \n' +
  '                           -uv.x * s + uv.y * c);\n' +
  '  vec3 localPosition = vec3(basisX * rotatedPoint.x +\n' +
  '                            basisZ * rotatedPoint.y) * size +\n' +
  '                       velocity * localTime +\n' +
  '                       acceleration * localTime * localTime + \n' +
  '                       position;\n' +
  '\n' +
  '  outputPercentLife = percentLife;\n' +
  '  gl_Position = viewProjection * vec4(localPosition + world[3].xyz, 1.);\n' +
  '}\n',

  // Fragment shader used by both 2D and 3D vertex shaders
  '#ifdef GL_ES\n' +
  'precision highp float;\n' +
  '#endif\n' +
  'uniform sampler2D rampSampler;\n' +
  'uniform sampler2D colorSampler;\n' +
  '\n' +
  '// Incoming variables from vertex shader\n' +
  'varying vec2 outputTexcoord;\n' +
  'varying float outputPercentLife;\n' +
  'varying vec4 outputColorMult;\n' +
  '\n' +
  'void main() {\n' +
  '  vec4 colorMult = texture2D(rampSampler, \n' +
  '                             vec2(outputPercentLife, 0.5)) *\n' +
  '                   outputColorMult;\n' +
  '  gl_FragColor = texture2D(colorSampler, outputTexcoord) * colorMult;\n' +
  // For debugging: requires setup of some uniforms and vertex
  // attributes to be commented out to avoid GL errors
  //  '  gl_FragColor = vec4(1., 0., 0., 1.);\n' +
  '}\n'
];

/**
 * Corner values.
 * @private
 * @type {!Array.<!Array.<number>>}
 */
tdl.particles.CORNERS_ = [
  [-0.5, -0.5],
  [+0.5, -0.5],
  [+0.5, +0.5],
  [-0.5, +0.5]];

/**
 * Creates a particle system.
 * You only need one of these to run multiple emitters of different types
 * of particles.
 * @constructor
 * @param {!WebGLRenderingContext} gl The WebGLRenderingContext
 *     into which the particles will be rendered.
 * @param {!function(): number} opt_clock A function that returns the
 *     number of seconds elapsed. The "time base" does not matter; it is
 *     corrected for internally in the particle system. If not supplied,
 *     wall clock time defined by the JavaScript Date API will be used.
 * @param {!function(): number} opt_randomFunction A function that returns
 *     a random number between 0.0 and 1.0. This allows you to pass in a
 *     pseudo random function if you need particles that are reproducible.
 */
tdl.particles.ParticleSystem = function(gl,
                                          opt_clock,
                                          opt_randomFunction) {
  this.gl = gl;

  // Entities which can be drawn -- emitters or OneShots
  this.drawables_ = [];

  var shaders = [];
  shaders.push(new tdl.shader.Shader(gl,
                                       tdl.particles.SHADER_STRINGS[0],
                                       tdl.particles.SHADER_STRINGS[2]));
  shaders.push(new tdl.shader.Shader(gl,
                                       tdl.particles.SHADER_STRINGS[1],
                                       tdl.particles.SHADER_STRINGS[2]));

  var blendFuncs = {};
  blendFuncs[tdl.particles.ParticleStateIds.BLEND] = {
    src:  gl.SRC_ALPHA,
    dest: gl.ONE_MINUS_SRC_ALPHA
  };
  blendFuncs[tdl.particles.ParticleStateIds.ADD] = {
    src:  gl.SRC_ALPHA,
    dest: gl.ONE
  };
  blendFuncs[tdl.particles.ParticleStateIds.BLEND_PREMULTIPLY] = {
    src:  gl.ONE,
    dest: gl.ONE_MINUS_SRC_ALPHA
  };
  blendFuncs[tdl.particles.ParticleStateIds.BLEND_NO_ALPHA] = {
    src:  gl.SRC_COLOR,
    dest: gl.ONE_MINUS_SRC_COLOR
  };
  blendFuncs[tdl.particles.ParticleStateIds.SUBTRACT] = {
    src:  gl.SRC_ALPHA,
    dest: gl.ONE_MINUS_SRC_ALPHA,
    eq:   gl.FUNC_REVERSE_SUBTRACT
  };
  blendFuncs[tdl.particles.ParticleStateIds.INVERSE] = {
    src:  gl.ONE_MINUS_DST_COLOR,
    dest: gl.ONE_MINUS_SRC_COLOR
  };
  this.blendFuncs_ = blendFuncs;

  var pixelBase = [0, 0.20, 0.70, 1, 0.70, 0.20, 0, 0];
  var pixels = [];
  for (var yy = 0; yy < 8; ++yy) {
    for (var xx = 0; xx < 8; ++xx) {
      var pixel = pixelBase[xx] * pixelBase[yy];
      pixels.push(pixel, pixel, pixel, pixel);
    }
  }
  var colorTexture = this.createTextureFromFloats(8, 8, pixels);
  // Note difference in texture size from O3D sample to avoid NPOT
  // texture creation
  var rampTexture = this.createTextureFromFloats(2, 1, [1, 1, 1, 1,
                                                        1, 1, 1, 0]);

  this.now_ = new Date();
  this.timeBase_ = new Date();
  if (opt_clock) {
    this.timeSource_ = opt_clock;
  } else {
    this.timeSource_ = tdl.particles.createDefaultClock_(this);
  }

  this.randomFunction_ = opt_randomFunction || function() {
        return Math.random();
      };

  // This FloatArray is used to store a single particle's data
  // in the VBO. As of this writing there wasn't a way to store less
  // than a full WebGLArray's data in a bufferSubData call.
  this.singleParticleArray_ = new Float32Array(4 * tdl.particles.LAST_IDX);

  /**
   * The shaders for particles.
   * @type {!Array.<!Shader>}
   */
  this.shaders = shaders;

  /**
   * The default color texture for particles.
   * @type {!o3d.Texture2D}
   */
  this.defaultColorTexture = colorTexture;

  /**
   * The default ramp texture for particles.
   * @type {!o3d.Texture2D}
   */
  this.defaultRampTexture = rampTexture;
};

tdl.particles.createDefaultClock_ = function(particleSystem) {
  return function() {
    var now = particleSystem.now_;
    var base = particleSystem.timeBase_;
    return (now.getTime() - base.getTime()) / 1000.0;
  }
}

/**
 * Creates an OpenGL texture from an array of floating point values.
 * @private
 */
tdl.particles.ParticleSystem.prototype.createTextureFromFloats = function(width, height, pixels, opt_texture) {
  var gl = this.gl;
  var texture = null;
  if (opt_texture != null) {
    texture = opt_texture;
  } else {
    texture = gl.createTexture();
  }
  // = opt_texture || gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // FIXME: this is not 100% correct; will end up extending the ends
  // of the range too far out toward the edge. Really need to pull in
  // the texture coordinates used to sample this texture by half a
  // texel.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  var data = new Uint8Array(pixels.length);
  for (var i = 0; i < pixels.length; i++) {
    var t = pixels[i] * 255.;
    data[i] = t;
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return texture;
}

/**
 * A ParticleSpec specifies how to emit particles.
 *
 * NOTE: For all particle functions you can specific a ParticleSpec as a
 * Javascript object, only specifying the fields that you care about.
 *
 * <pre>
 * emitter.setParameters({
 *   numParticles: 40,
 *   lifeTime: 2,
 *   timeRange: 2,
 *   startSize: 50,
 *   endSize: 90,
 *   positionRange: [10, 10, 10],
 *   velocity:[0, 0, 60], velocityRange: [15, 15, 15],
 *   acceleration: [0, 0, -20],
 *   spinSpeedRange: 4}
 * );
 * </pre>
 *
 * Many of these parameters are in pairs. For paired paramters each particle
 * specfic value is set like this
 *
 * particle.field = value + Math.random() - 0.5 * valueRange * 2;
 *
 * or in English
 *
 * particle.field = value plus or minus valueRange.
 *
 * So for example, if you wanted a value from 10 to 20 you'd pass 15 for value
 * and 5 for valueRange because
 *
 * 15 + or - 5  = (10 to 20)
 *
 * @constructor
 */
tdl.particles.ParticleSpec = function() {
  /**
   * The number of particles to emit.
   * @type {number}
   */
  this.numParticles = 1;

  /**
   * The number of frames in the particle texture.
   * @type {number}
   */
  this.numFrames = 1;

  /**
   * The frame duration at which to animate the particle texture in seconds per
   * frame.
   * @type {number}
   */
  this.frameDuration = 1;

  /**
   * The initial frame to display for a particular particle.
   * @type {number}
   */
  this.frameStart = 0;

  /**
   * The frame start range.
   * @type {number}
   */
  this.frameStartRange = 0;

  /**
   * The life time of the entire particle system.
   * To make a particle system be continuous set this to match the lifeTime.
   * @type {number}
   */
  this.timeRange = 99999999;

  /**
   * The startTime of a particle.
   * @type {?number}
   */
  this.startTime = null;
  // TODO: Describe what happens if this is not set. I still have some
  //     work to do there.

  /**
   * The lifeTime of a particle.
   * @type {number}
   */
  this.lifeTime = 1;

  /**
   * The lifeTime range.
   * @type {number}
   */
  this.lifeTimeRange = 0;

  /**
   * The starting size of a particle.
   * @type {number}
   */
  this.startSize = 1;

  /**
   * The starting size range.
   * @type {number}
   */
  this.startSizeRange = 0;

  /**
   * The ending size of a particle.
   * @type {number}
   */
  this.endSize = 1;

  /**
   * The ending size range.
   * @type {number}
   */
  this.endSizeRange = 0;

  /**
   * The starting position of a particle in local space.
   * @type {!tdl.math.Vector3}
   */
  this.position = [0, 0, 0];

  /**
   * The starting position range.
   * @type {!tdl.math.Vector3}
   */
  this.positionRange = [0, 0, 0];

  /**
   * The velocity of a paritcle in local space.
   * @type {!tdl.math.Vector3}
   */
  this.velocity = [0, 0, 0];

  /**
   * The velocity range.
   * @type {!tdl.math.Vector3}
   */
  this.velocityRange = [0, 0, 0];

  /**
   * The acceleration of a particle in local space.
   * @type {!tdl.math.Vector3}
   */
  this.acceleration = [0, 0, 0];

  /**
   * The accleration range.
   * @type {!tdl.math.Vector3}
   */
  this.accelerationRange = [0, 0, 0];

  /**
   * The starting spin value for a particle in radians.
   * @type {number}
   */
  this.spinStart = 0;

  /**
   * The spin start range.
   * @type {number}
   */
  this.spinStartRange = 0;

  /**
   * The spin speed of a particle in radians.
   * @type {number}
   */
  this.spinSpeed = 0;

  /**
   * The spin speed range.
   * @type {number}
   */
  this.spinSpeedRange = 0;

  /**
   * The color multiplier of a particle.
   * @type {!tdl.math.Vector4}
   */
  this.colorMult = [1, 1, 1, 1];

  /**
   * The color multiplier range.
   * @type {!tdl.math.Vector4}
   */
  this.colorMultRange = [0, 0, 0, 0];

  /**
   * The velocity of all paritcles in world space.
   * @type {!tdl.math.Vector3}
   */
  this.worldVelocity = [0, 0, 0];

  /**
   * The acceleration of all paritcles in world space.
   * @type {!tdl.math.Vector3}
   */
  this.worldAcceleration = [0, 0, 0];

  /**
   * Whether these particles are oriented in 2d or 3d. true = 2d, false = 3d.
   * @type {boolean}
   */
  this.billboard = true;

  /**
   * The orientation of a particle. This is only used if billboard is false.
   * @type {!tdl.quaternions.Quaternion}
   */
  this.orientation = [0, 0, 0, 1];
};

/**
 * Creates a particle emitter.
 * @param {!o3d.Texture} opt_texture The texture to use for the particles.
 *     If you don't supply a texture a default is provided.
 * @param {!function(): number} opt_clock

 A ParamFloat to be the clock for
 *     the emitter.
 * @return {!tdl.particles.ParticleEmitter} The new emitter.
 */
tdl.particles.ParticleSystem.prototype.createParticleEmitter =
    function(opt_texture, opt_clock) {
  var emitter = new tdl.particles.ParticleEmitter(this, opt_texture, opt_clock);
  this.drawables_.push(emitter);
  return emitter;
};

/**
 * Creates a Trail particle emitter.
 * You can use this for jet exhaust, etc...
 * @param {!o3d.Transform} parent Transform to put emitter on.
 * @param {number} maxParticles Maximum number of particles to appear at once.
 * @param {!tdl.particles.ParticleSpec} parameters The parameters used to
 *     generate particles.
 * @param {!o3d.Texture} opt_texture The texture to use for the particles.
 *     If you don't supply a texture a default is provided.
 * @param {!function(number, !tdl.particles.ParticleSpec): void}
 *     opt_perParticleParamSetter A function that is called for each particle to
 *     allow it's parameters to be adjusted per particle. The number is the
 *     index of the particle being created, in other words, if numParticles is
 *     20 this value will be 0 to 19. The ParticleSpec is a spec for this
 *     particular particle. You can set any per particle value before returning.
 * @param {!function(): number} opt_clock A function to be the clock for
 *     the emitter.
 * @return {!tdl.particles.Trail} A Trail object.
 */
tdl.particles.ParticleSystem.prototype.createTrail = function(
    maxParticles,
    parameters,
    opt_texture,
    opt_perParticleParamSetter,
    opt_clock) {
  var trail = new tdl.particles.Trail(
      this,
      maxParticles,
      parameters,
      opt_texture,
      opt_perParticleParamSetter,
      opt_clock);
  this.drawables_.push(trail);
  return trail;
};

/**
 * Draws all of the particle emitters managed by this ParticleSystem.
 * This modifies the depth mask, depth test, blend function and its
 * enabling, array buffer binding, element array buffer binding, the
 * textures bound to texture units 0 and 1, and which is the active
 * texture unit.
 * @param {!Matrix4x4} viewProjection The viewProjection matrix.
 * @param {!Matrix4x4} world The world matrix.
 * @param {!Matrix4x4} viewInverse The viewInverse matrix.
 */
tdl.particles.ParticleSystem.prototype.draw = function(viewProjection, world, viewInverse) {
  // Update notion of current time
  this.now_ = new Date();
  // Set up global state
  var gl = this.gl;
  gl.depthMask(false);
  gl.enable(gl.DEPTH_TEST);
  // Set up certain uniforms once per shader per draw.
  var shader = this.shaders[1];
  shader.bind();
  gl.uniformMatrix4fv(shader.viewProjectionLoc,
                      false,
                      viewProjection);
  gl.uniformMatrix4fv(shader.viewInverseLoc,
                      false,
                      viewInverse);
  // Draw all emitters
  // FIXME: this is missing O3D's z-sorting logic from the
  // zOrderedDrawList
  for (var ii = 0; ii < this.drawables_.length; ++ii) {
    this.drawables_[ii].draw(world, viewProjection, 0);
  }
};

// Base element indices for the interleaved floating point data.
// Each of the four corners of the particle has four floats for each
// of these pieces of information.
tdl.particles.UV_LIFE_TIME_FRAME_START_IDX = 0;
tdl.particles.POSITION_START_TIME_IDX = 4;
tdl.particles.VELOCITY_START_SIZE_IDX = 8;
tdl.particles.ACCELERATION_END_SIZE_IDX = 12;
tdl.particles.SPIN_START_SPIN_SPEED_IDX = 16;
tdl.particles.ORIENTATION_IDX = 20;
tdl.particles.COLOR_MULT_IDX = 24;
tdl.particles.LAST_IDX = 28;

/**
 * A ParticleEmitter
 * @private
 * @constructor
 * @param {!tdl.particles.ParticleSystem} particleSystem The particle system
 *     to manage this emitter.
 * @param {!o3d.Texture} opt_texture The texture to use for the particles.
 *     If you don't supply a texture a default is provided.
 * @param {!function(): number} opt_clock (optional) A function that
 *     returns the number of seconds elapsed.
 A function, returning
 *     seconds elapsed, to be the time source for the emitter.
 */
tdl.particles.ParticleEmitter = function(particleSystem,
                                           opt_texture,
                                           opt_clock) {
  opt_clock = opt_clock || particleSystem.timeSource_;

  this.gl = particleSystem.gl;

  this.createdParticles_ = false;

  this.tmpWorld_ = new Float32Array(16);

  // This Float32Array is used to store a single particle's data
  // in the VBO. As of this writing there wasn't a way to store less
  // than a full WebGLArray's data in a bufferSubData call.
  this.singleParticleArray_ = new Float32Array(4 * tdl.particles.LAST_IDX);

  // The VBO holding the particles' data, (re-)allocated in
  // allocateParticles_().
  this.particleBuffer_ = gl.createBuffer();

  // The buffer object holding the particles' indices, (re-)allocated
  // in allocateParticles_().
  this.indexBuffer_ = gl.createBuffer();

  // The number of particles that are stored in the particle buffer.
  this.numParticles_ = 0;

  this.rampTexture_ = particleSystem.defaultRampTexture;
  this.colorTexture_ = opt_texture || particleSystem.defaultColorTexture;

  /**
   * The particle system managing this emitter.
   * @type {!tdl.particles.ParticleSystem}
   */
  this.particleSystem = particleSystem;

  /**
   * A function that is the source for the time for this emitter.
   * @private
   * @type {!function(): number}
   */
  this.timeSource_ = opt_clock;

  /**
   * The translation for this ParticleEmitter. (FIXME: generalize.)
   * @private
   * @type {!tdl.math.Vector3}
   */
  this.translation_ = [0, 0, 0];

  // Set up the blend functions for drawing the particles.
  this.setState(tdl.particles.ParticleStateIds.BLEND);
};

/**
 * Sets the world translation for this ParticleEmitter.
 * @param {!tdl.math.Vector3} translation The translation for this emitter.
 */
tdl.particles.ParticleEmitter.prototype.setTranslation = function(x, y, z) {
  this.translation_[0] = x;
  this.translation_[1] = y;
  this.translation_[2] = z;
};

/**
 * Sets the blend state for the particles.
 * You can use this to set the emitter to draw with BLEND, ADD, SUBTRACT, etc.
 * @param {ParticleStateIds} stateId The state you want.
 */
tdl.particles.ParticleEmitter.prototype.setState = function(stateId) {
  this.blendFunc_ = this.particleSystem.blendFuncs_[stateId];
};

/**
 * Sets the colorRamp for the particles.
 * The colorRamp is used as a multiplier for the texture. When a particle
 * starts it is multiplied by the first color, as it ages to progressed
 * through the colors in the ramp.
 *
 * <pre>
 * particleEmitter.setColorRamp([
 *   1, 0, 0, 1,    // red
 *   0, 1, 0, 1,    // green
 *   1, 0, 1, 0]);  // purple but with zero alpha
 * </pre>
 *
 * The code above sets the particle to start red, change to green then
 * fade out while changing to purple.
 *
 * @param {!Array.<number>} colorRamp An array of color values in
 *     the form RGBA.
 */
tdl.particles.ParticleEmitter.prototype.setColorRamp = function(colorRamp) {
  var width = colorRamp.length / 4;
  if (width % 1 != 0) {
    throw 'colorRamp must have multiple of 4 entries';
  }

  var gl = this.gl;

  if (this.rampTexture_ == this.particleSystem.defaultRampTexture) {
    this.rampTexture_ = null;
  }

  this.rampTexture_ = this.particleSystem.createTextureFromFloats(width, 1, colorRamp, this.rampTexture_);
};

/**
 * Validates and adds missing particle parameters.
 * @param {!tdl.particles.ParticleSpec} parameters The parameters to validate.
 */
tdl.particles.ParticleEmitter.prototype.validateParameters = function(
    parameters) {
  var defaults = new tdl.particles.ParticleSpec();
  for (var key in parameters) {
    if (typeof defaults[key] === 'undefined') {
      throw 'unknown particle parameter "' + key + '"';
    }
  }
  for (var key in defaults) {
    if (typeof parameters[key] === 'undefined') {
      parameters[key] = defaults[key];
    }
  }
};

/**
 * Creates particles.
 * @private
 * @param {number} firstParticleIndex Index of first particle to create.
 * @param {number} numParticles The number of particles to create.
 * @param {!tdl.particles.ParticleSpec} parameters The parameters for the
 *     emitters.
 * @param {!function(number, !tdl.particles.ParticleSpec): void}
 *     opt_perParticleParamSetter A function that is called for each particle to
 *     allow it's parameters to be adjusted per particle. The number is the
 *     index of the particle being created, in other words, if numParticles is
 *     20 this value will be 0 to 19. The ParticleSpec is a spec for this
 *     particular particle. You can set any per particle value before returning.
 */
tdl.particles.ParticleEmitter.prototype.createParticles_ = function(
    firstParticleIndex,
    numParticles,
    parameters,
    opt_perParticleParamSetter) {
  var singleParticleArray = this.particleSystem.singleParticleArray_;
  var gl = this.gl;

  // Set the globals.
  this.billboard_ = parameters.billboard;
  this.timeRange_ = parameters.timeRange;
  this.numFrames_ = parameters.numFrames;
  this.frameDuration_ = parameters.frameDuration;
  this.worldVelocity_ = [ parameters.worldVelocity[0],
                          parameters.worldVelocity[1],
                          parameters.worldVelocity[2] ];
  this.worldAcceleration_ = [ parameters.worldAcceleration[0],
                              parameters.worldAcceleration[1],
                              parameters.worldAcceleration[2] ];

  var random = this.particleSystem.randomFunction_;

  var plusMinus = function(range) {
    return (random() - 0.5) * range * 2;
  };

  // TODO: change to not allocate.
  var plusMinusVector = function(range) {
    var v = [];
    for (var ii = 0; ii < range.length; ++ii) {
      v.push(plusMinus(range[ii]));
    }
    return v;
  };

  gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer_);

  for (var ii = 0; ii < numParticles; ++ii) {
    if (opt_perParticleParamSetter) {
      opt_perParticleParamSetter(ii, parameters);
    }
    var pLifeTime = parameters.lifeTime;
    var pStartTime = (parameters.startTime === null) ?
        (ii * parameters.lifeTime / numParticles) : parameters.startTime;
    var pFrameStart =
        parameters.frameStart + plusMinus(parameters.frameStartRange);
    var pPosition = tdl.math.addVector(
        parameters.position, plusMinusVector(parameters.positionRange));
    var pVelocity = tdl.math.addVector(
        parameters.velocity, plusMinusVector(parameters.velocityRange));
    var pAcceleration = tdl.math.addVector(
        parameters.acceleration,
        plusMinusVector(parameters.accelerationRange));
    var pColorMult = tdl.math.addVector(
        parameters.colorMult, plusMinusVector(parameters.colorMultRange));
    var pSpinStart =
        parameters.spinStart + plusMinus(parameters.spinStartRange);
    var pSpinSpeed =
        parameters.spinSpeed + plusMinus(parameters.spinSpeedRange);
    var pStartSize =
        parameters.startSize + plusMinus(parameters.startSizeRange);
    var pEndSize = parameters.endSize + plusMinus(parameters.endSizeRange);
    var pOrientation = parameters.orientation;

    // make each corner of the particle.
    for (var jj = 0; jj < 4; ++jj) {
      var offset0 = tdl.particles.LAST_IDX * jj;
      var offset1 = offset0 + 1;
      var offset2 = offset0 + 2;
      var offset3 = offset0 + 3;

      singleParticleArray[tdl.particles.UV_LIFE_TIME_FRAME_START_IDX + offset0] = tdl.particles.CORNERS_[jj][0];
      singleParticleArray[tdl.particles.UV_LIFE_TIME_FRAME_START_IDX + offset1] = tdl.particles.CORNERS_[jj][1];
      singleParticleArray[tdl.particles.UV_LIFE_TIME_FRAME_START_IDX + offset2] = pLifeTime;
      singleParticleArray[tdl.particles.UV_LIFE_TIME_FRAME_START_IDX + offset3] = pFrameStart;

      singleParticleArray[tdl.particles.POSITION_START_TIME_IDX + offset0] = pPosition[0];
      singleParticleArray[tdl.particles.POSITION_START_TIME_IDX + offset1] = pPosition[1];
      singleParticleArray[tdl.particles.POSITION_START_TIME_IDX + offset2] = pPosition[2];
      singleParticleArray[tdl.particles.POSITION_START_TIME_IDX + offset3] = pStartTime;

      singleParticleArray[tdl.particles.VELOCITY_START_SIZE_IDX + offset0] = pVelocity[0];
      singleParticleArray[tdl.particles.VELOCITY_START_SIZE_IDX + offset1] = pVelocity[1];
      singleParticleArray[tdl.particles.VELOCITY_START_SIZE_IDX + offset2] = pVelocity[2];
      singleParticleArray[tdl.particles.VELOCITY_START_SIZE_IDX + offset3] = pStartSize;

      singleParticleArray[tdl.particles.ACCELERATION_END_SIZE_IDX + offset0] = pAcceleration[0];
      singleParticleArray[tdl.particles.ACCELERATION_END_SIZE_IDX + offset1] = pAcceleration[1];
      singleParticleArray[tdl.particles.ACCELERATION_END_SIZE_IDX + offset2] = pAcceleration[2];
      singleParticleArray[tdl.particles.ACCELERATION_END_SIZE_IDX + offset3] = pEndSize;

      singleParticleArray[tdl.particles.SPIN_START_SPIN_SPEED_IDX + offset0] = pSpinStart;
      singleParticleArray[tdl.particles.SPIN_START_SPIN_SPEED_IDX + offset1] = pSpinSpeed;
      singleParticleArray[tdl.particles.SPIN_START_SPIN_SPEED_IDX + offset2] = 0;
      singleParticleArray[tdl.particles.SPIN_START_SPIN_SPEED_IDX + offset3] = 0;

      singleParticleArray[tdl.particles.ORIENTATION_IDX + offset0] = pOrientation[0];
      singleParticleArray[tdl.particles.ORIENTATION_IDX + offset1] = pOrientation[1];
      singleParticleArray[tdl.particles.ORIENTATION_IDX + offset2] = pOrientation[2];
      singleParticleArray[tdl.particles.ORIENTATION_IDX + offset3] = pOrientation[3];

      singleParticleArray[tdl.particles.COLOR_MULT_IDX + offset0] = pColorMult[0];
      singleParticleArray[tdl.particles.COLOR_MULT_IDX + offset1] = pColorMult[1];
      singleParticleArray[tdl.particles.COLOR_MULT_IDX + offset2] = pColorMult[2];
      singleParticleArray[tdl.particles.COLOR_MULT_IDX + offset3] = pColorMult[3];
    }

    // Upload this particle's information into the VBO.
    // FIXME: probably want to make fewer bufferSubData calls
    gl.bufferSubData(gl.ARRAY_BUFFER,
                       singleParticleArray.byteLength * (ii + firstParticleIndex),
                       singleParticleArray);
  }

  this.createdParticles_ = true;
};

/**
 * Allocates particles.
 * @private
 * @param {number} numParticles Number of particles to allocate.
 */
tdl.particles.ParticleEmitter.prototype.allocateParticles_ = function(
    numParticles) {
  if (this.numParticles_ != numParticles) {
    var gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER,
                  numParticles * this.particleSystem.singleParticleArray_.byteLength,
                  gl.DYNAMIC_DRAW);
    var numIndices = 6 * numParticles;
    if (numIndices > 65536) {
      throw "can't have more than 10922 particles per emitter";
    }
    var indices = new Uint16Array(numIndices);
    var idx = 0;
    for (var ii = 0; ii < numParticles; ++ii) {
      // Make 2 triangles for the quad.
      var startIndex = ii * 4;
      indices[idx++] = startIndex + 0;
      indices[idx++] = startIndex + 1;
      indices[idx++] = startIndex + 2;
      indices[idx++] = startIndex + 0;
      indices[idx++] = startIndex + 2;
      indices[idx++] = startIndex + 3;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
                    this.indexBuffer_);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                    indices,
                    gl.STATIC_DRAW);
    this.numParticles_ = numParticles;
  }
};

/**
 * Sets the parameters of the particle emitter.
 *
 * Each of these parameters are in pairs. The used to create a table
 * of particle parameters. For each particle a specfic value is
 * set like this
 *
 * particle.field = value + Math.random() - 0.5 * valueRange * 2;
 *
 * or in English
 *
 * particle.field = value plus or minus valueRange.
 *
 * So for example, if you wanted a value from 10 to 20 you'd pass 15 for value
 * and 5 for valueRange because
 *
 * 15 + or - 5  = (10 to 20)
 *
 * @param {!tdl.particles.ParticleSpec} parameters The parameters for the
 *     emitters.
 * @param {!function(number, !tdl.particles.ParticleSpec): void}
 *     opt_perParticleParamSetter A function that is called for each particle to
 *     allow it's parameters to be adjusted per particle. The number is the
 *     index of the particle being created, in other words, if numParticles is
 *     20 this value will be 0 to 19. The ParticleSpec is a spec for this
 *     particular particle. You can set any per particle value before returning.
 */
tdl.particles.ParticleEmitter.prototype.setParameters = function(
    parameters,
    opt_perParticleParamSetter) {
  this.validateParameters(parameters);

  var numParticles = parameters.numParticles;

  this.allocateParticles_(numParticles);
  this.createParticles_(
      0,
      numParticles,
      parameters,
      opt_perParticleParamSetter);
};

tdl.particles.ParticleEmitter.prototype.draw = function(world, viewProjection, timeOffset) {
  if (!this.createdParticles_) {
    return;
  }

  var gl = this.gl;

  // Set up blend function
  gl.enable(gl.BLEND);
  var blendFunc = this.blendFunc_;
  gl.blendFunc(blendFunc.src, blendFunc.dest);
  if (blendFunc.eq) {
    gl.blendEquation(blendFunc.eq);
  } else {
    gl.blendEquation(gl.FUNC_ADD);
  }

  var shader = this.particleSystem.shaders[this.billboard_ ? 1 : 0];
  shader.bind();

  var tmpWorld = this.tmpWorld_;
  tdl.fast.matrix4.copy(tmpWorld, world);

  tdl.fast.matrix4.translate(tmpWorld, this.translation_);
  gl.uniformMatrix4fv(shader.worldLoc,
                      false,
                      tmpWorld);
  if (!this.billboard_) {
    var worldViewProjection = new Float32Array(16);
    tdl.fast.matrix4.mul.mulMatrixMatrix4(worldViewProjection, tmpWorld, viewProjection);
    gl.uniformMatrix4fv(shader.worldViewProjectionLoc,
                        false,
                        worldViewProjection);
  }

  gl.uniform3f(shader.worldVelocityLoc,
               this.worldVelocity_[0],
               this.worldVelocity_[1],
               this.worldVelocity_[2]);
  gl.uniform3f(shader.worldAccelerationLoc,
               this.worldAcceleration_[0],
               this.worldAcceleration_[1],
               this.worldAcceleration_[2]);
  gl.uniform1f(shader.timeRangeLoc, this.timeRange_);
  gl.uniform1f(shader.numFramesLoc, this.numFrames_);
  gl.uniform1f(shader.frameDurationLoc, this.frameDuration_);

  // Compute and set time
  var curTime = this.timeSource_();
  gl.uniform1f(shader.timeLoc, curTime);
  // This is non-zero only for OneShots
  gl.uniform1f(shader.timeOffsetLoc, timeOffset);

  // Set up textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.rampTexture_);
  gl.uniform1i(shader.rampSamplerLoc, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, this.colorTexture_);
  gl.uniform1i(shader.colorSamplerLoc, 1);
  gl.activeTexture(gl.TEXTURE0);

  // Set up vertex attributes
  var sizeofFloat = 4;
  var stride = sizeofFloat * tdl.particles.LAST_IDX;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer_);
  gl.vertexAttribPointer(shader.uvLifeTimeFrameStartLoc, 4, gl.FLOAT, false, stride,
                         sizeofFloat * tdl.particles.UV_LIFE_TIME_FRAME_START_IDX);
  gl.enableVertexAttribArray(shader.uvLifeTimeFrameStartLoc);
  gl.vertexAttribPointer(shader.positionStartTimeLoc, 4, gl.FLOAT, false, stride,
                         sizeofFloat * tdl.particles.POSITION_START_TIME_IDX);
  gl.enableVertexAttribArray(shader.positionStartTimeLoc);
  gl.vertexAttribPointer(shader.velocityStartSizeLoc, 4, gl.FLOAT, false, stride,
                         sizeofFloat * tdl.particles.VELOCITY_START_SIZE_IDX);
  gl.enableVertexAttribArray(shader.velocityStartSizeLoc);
  gl.vertexAttribPointer(shader.accelerationEndSizeLoc, 4, gl.FLOAT, false, stride,
                         sizeofFloat * tdl.particles.ACCELERATION_END_SIZE_IDX);
  gl.enableVertexAttribArray(shader.accelerationEndSizeLoc);
  gl.vertexAttribPointer(shader.spinStartSpinSpeedLoc, 4, gl.FLOAT, false, stride,
                         sizeofFloat * tdl.particles.SPIN_START_SPIN_SPEED_IDX);
  gl.enableVertexAttribArray(shader.spinStartSpinSpeedLoc);
  // Only for non-billboarded, i.e., 3D, particles
  if (shader.orientationLoc != undefined) {
    gl.vertexAttribPointer(shader.orientationLoc, 4, gl.FLOAT, false, stride,
                           sizeofFloat * tdl.particles.ORIENTATION_IDX);
    gl.enableVertexAttribArray(shader.orientationLoc);
  }
  // NOTE: comment out the next two calls if using debug shader which
  // only outputs red.
  gl.vertexAttribPointer(shader.colorMultLoc, 4, gl.FLOAT, false, stride,
                         sizeofFloat * tdl.particles.COLOR_MULT_IDX);
  gl.enableVertexAttribArray(shader.colorMultLoc);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
  gl.drawElements(gl.TRIANGLES, this.numParticles_ * 6,
                  gl.UNSIGNED_SHORT, 0);

  gl.disableVertexAttribArray(shader.uvLifeTimeFrameStartLoc);
  gl.disableVertexAttribArray(shader.positionStartTimeLoc);
  gl.disableVertexAttribArray(shader.velocityStartSizeLoc);
  gl.disableVertexAttribArray(shader.accelerationEndSizeLoc);
  gl.disableVertexAttribArray(shader.spinStartSpinSpeedLoc);
  // FIXME: only for billboarded, i.e., 3D, particles?
  if (shader.orientationLoc != undefined) {
    gl.disableVertexAttribArray(shader.orientationLoc);
  }
  gl.disableVertexAttribArray(shader.colorMultLoc);
};

/**
 * Creates a OneShot particle emitter instance.
 * You can use this for dust puffs, explosions, fireworks, etc...
 * @return {!tdl.particles.OneShot} A OneShot object.
 */
tdl.particles.ParticleEmitter.prototype.createOneShot = function() {
  return new tdl.particles.OneShot(this);
};

/**
 * An object to manage a particle emitter instance as a one
 * shot. Examples of one shot effects are things like an explosion,
 * some fireworks. Note that once a OneShot has been created for a
 * given emitter, that emitter can only be treated as containing one
 * or more OneShots.
 * @private
 * @constructor
 * @param {!tdl.particles.ParticleEmitter} emitter The emitter to use for the
 *     one shot.
 * @param {!o3d.Transform} opt_parent The parent for this one shot.
 */
tdl.particles.OneShot = function(emitter) {
  this.emitter_ = emitter;

  /**
   * Translation for OneShot.
   * @type {!tdl.math.Vector3}
   */
  this.world_ = tdl.fast.matrix4.translation(new Float32Array(16), [0, 0, 0]);
  this.tempWorld_ = tdl.fast.matrix4.translation(new Float32Array(16), [0, 0, 0]);
  this.timeOffset_ = 0;
  this.visible_ = false;

  // Remove the parent emitter from the particle system's drawable
  // list (if it's still there) and add ourselves instead.
  var particleSystem = emitter.particleSystem;
  var idx = particleSystem.drawables_.indexOf(emitter);
  if (idx >= 0) {
    particleSystem.drawables_.splice(idx, 1);
  }
  particleSystem.drawables_.push(this);
};

/**
 * Triggers the oneshot.
 *
 * Note: You must have set the parent either at creation, with setParent, or by
 * passing in a parent here.
 *
 * @param {!tdl.math.Vector3} opt_position The position of the one shot
 *     relative to its parent.
 */
tdl.particles.OneShot.prototype.trigger = function(opt_world) {
  if (opt_world) {
    this.world_.set(opt_world)
  }
  this.visible_ = true;
  this.timeOffset_ = this.emitter_.timeSource_();
};

/**
 * Draws the oneshot.
 *
 * @private
 */
tdl.particles.OneShot.prototype.draw = function(world, viewProjection, timeOffset) {
  if (this.visible_) {
    tdl.fast.matrix4.mul(this.tempWorld_, this.world_, world);
    this.emitter_.draw(this.tempWorld_, viewProjection, this.timeOffset_);
  }
};

/**
 * A type of emitter to use for particle effects that leave trails like exhaust.
 * @constructor
 * @extends {tdl.particles.ParticleEmitter}
 * @param {!tdl.particles.ParticleSystem} particleSystem The particle system
 *     to manage this emitter.
 * @param {!o3d.Transform} parent Transform to put emitter on.
 * @param {number} maxParticles Maximum number of particles to appear at once.
 * @param {!tdl.particles.ParticleSpec} parameters The parameters used to
 *     generate particles.
 * @param {!o3d.Texture} opt_texture The texture to use for the particles.
 *     If you don't supply a texture a default is provided.
 * @param {!function(number, !tdl.particles.ParticleSpec): void}
 *     opt_perParticleParamSetter A function that is called for each particle to
 *     allow it's parameters to be adjusted per particle. The number is the
 *     index of the particle being created, in other words, if numParticles is
 *     20 this value will be 0 to 19. The ParticleSpec is a spec for this
 *     particular particle. You can set any per particle value before returning.
 * @param {!function(): number} opt_clock A function to be the clock for
 *     the emitter.
 */
tdl.particles.Trail = function(
    particleSystem,
    maxParticles,
    parameters,
    opt_texture,
    opt_perParticleParamSetter,
    opt_clock) {
  tdl.particles.ParticleEmitter.call(
      this, particleSystem, opt_texture, opt_clock);

  this.allocateParticles_(maxParticles);
  this.validateParameters(parameters);

  this.parameters = parameters;
  this.perParticleParamSetter = opt_perParticleParamSetter;
  this.birthIndex_ = 0;
  this.maxParticles_ = maxParticles;
};

tdl.base.inherit(tdl.particles.Trail, tdl.particles.ParticleEmitter);

/**
 * Births particles from this Trail.
 * @param {!tdl.math.Vector3} position Position to birth particles at.
 */
tdl.particles.Trail.prototype.birthParticles = function(position) {
  var numParticles = this.parameters.numParticles;
  this.parameters.startTime = this.timeSource_();
  this.parameters.position = position;
  while (this.birthIndex_ + numParticles >= this.maxParticles_) {
    var numParticlesToEnd = this.maxParticles_ - this.birthIndex_;
    this.createParticles_(this.birthIndex_,
                          numParticlesToEnd,
                          this.parameters,
                          this.perParticleParamSetter);
    numParticles -= numParticlesToEnd;
    this.birthIndex_ = 0;
  }
  this.createParticles_(this.birthIndex_,
                        numParticles,
                        this.parameters,
                        this.perParticleParamSetter);
  this.birthIndex_ += numParticles;
};

tdl.particles.OneShotManager = function(emitter, numOneshots) {
  this.numOneshots = numOneshots;
  this.oneshotIndex = 0;
  this.oneshots = [];
  for (var ii = 0; ii < numOneshots; ++ii) {
     this.oneshots.push(emitter.createOneShot());
  }
};

tdl.particles.OneShotManager.prototype.startOneShot = function(worldMatrix) {
  this.oneshots[this.oneshotIndex].trigger(worldMatrix);
  this.oneshotIndex = (this.oneshotIndex + 1) % this.numOneshots;
};

tdl.particles.createOneShotManager = function(emitter, numOneshots) {
  return new tdl.particles.OneShotManager(emitter, numOneshots);
};

