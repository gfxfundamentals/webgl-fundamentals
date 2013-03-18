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
 * @fileoverview This file contains objects to deal with WebGL
 *               programs.
 */

tdl.provide('tdl.programs');

tdl.require('tdl.log');
tdl.require('tdl.string');
tdl.require('tdl.webgl');

/**
 * A module for programs.
 * @namespace
 */
tdl.programs = tdl.programs || {};

/**
 * Loads a program from script tags.
 * @param {string} vertexShaderId The id of the script tag that contains the
 *     vertex shader source.
 * @param {string} fragmentShaderId The id of the script tag that contains the
 *     fragment shader source.
 * @return {tdl.programs.Program} The created program.
 */
tdl.programs.loadProgramFromScriptTags = function(
    vertexShaderId, fragmentShaderId) {
  var vertElem = document.getElementById(vertexShaderId);
  var fragElem = document.getElementById(fragmentShaderId);
  if (!vertElem) {
    throw("Can't find vertex program tag: " + vertexShaderId);
  }
  if (!fragElem) {
    throw("Can't find fragment program tag: " + fragmentShaderId);
  }
  return tdl.programs.loadProgram(
      document.getElementById(vertexShaderId).text,
      document.getElementById(fragmentShaderId).text);
};

tdl.programs.makeProgramId = function(vertexShader, fragmentShader) {
  return vertexShader + fragmentShader;
};

/**
 * Loads a program.
 * @param {string} vertexShader The vertex shader source.
 * @param {string} fragmentShader The fragment shader source.
 * @param {!function(error)) opt_asyncCallback. Called with
 *        undefined if success or string if failure.
 * @return {tdl.programs.Program} The created program.
 */
tdl.programs.loadProgram = function(vertexShader, fragmentShader, opt_asyncCallback) {
  var id = tdl.programs.makeProgramId(vertexShader, fragmentShader);
  tdl.programs.init_();
  var program = gl.tdl.programs.programDB[id];
  if (program) {
    if (opt_asyncCallback) {
      setTimeout(function() { opt_asyncCallback(); }, 1);
    }
    return program;
  }
  try {
    program = new tdl.programs.Program(vertexShader, fragmentShader, opt_asyncCallback);
  } catch (e) {
    tdl.error(e);
    return null;
  }
  if (!opt_asyncCallback) {
    gl.tdl.programs.programDB[id] = program;
  }
  return program;
};

/**
 * A object to manage a WebGLProgram.
 * @constructor
 * @param {string} vertexShader The vertex shader source.
 * @param {string} fragmentShader The fragment shader source.
 * @param {!function(error)) opt_asyncCallback. Called with
 *        undefined if success or string if failure.
 */
tdl.programs.Program = function(vertexShader, fragmentShader, opt_asyncCallback) {
  var that = this;
  this.programId = tdl.programs.makeProgramId(vertexShader, fragmentShader);
  this.asyncCallback = opt_asyncCallback;

  var shaderId;
  var program;
  var vs;
  var fs;

  /**
   * Loads a shader.
   * @param {!WebGLContext} gl The WebGLContext to use.
   * @param {string} shaderSource The shader source.
   * @param {number} shaderType The type of shader.
   * @return {!WebGLShader} The created shader.
   */
  var loadShader = function(gl, shaderSource, shaderType) {
    shaderId = shaderSource + shaderType;
    tdl.programs.init_();
    var shader = gl.tdl.programs.shaderDB[shaderId];
    if (shader) {
      return shader;
    }

    // Create the shader object
    var shader = gl.createShader(shaderType);

    // Load the shader source
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check the compile status
    if (!that.asyncCallback) {
      checkShader(shader);
    }
    return shader;
  }

  var checkShader = function(shader) {
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled && !gl.isContextLost()) {
      // Something went wrong during compilation; get the error
      tdl.programs.lastError = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw("*** Error compiling shader :" + tdl.programs.lastError);
    }
    gl.tdl.programs.shaderDB[shaderId] = shader;
  };

  /**
   * Loads shaders from script tags, creates a program, attaches the shaders and
   * links.
   * @param {!WebGLContext} gl The WebGLContext to use.
   * @param {string} vertexShader The vertex shader.
   * @param {string} fragmentShader The fragment shader.
   * @return {!WebGLProgram} The created program.
   */
  var loadProgram = function(gl, vertexShader, fragmentShader) {
    var e;
    try {
      vs = loadShader(gl, vertexShader, gl.VERTEX_SHADER);
      fs = loadShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      linkProgram(gl, program);
    } catch (e) {
      deleteAll(e);
    }
    return program;
  };

  var deleteAll = function(e) {
    if (vs) { gl.deleteShader(vs) }
    if (fs) { gl.deleteShader(fs) }
    if (program) { gl.deleteProgram(program) }
    throw e;
  };

  /**
   * Links a WebGL program, throws if there are errors.
   * @param {!WebGLContext} gl The WebGLContext to use.
   * @param {!WebGLProgram} program The WebGLProgram to link.
   */
  var linkProgram = function(gl, program) {
    // Link the program
    gl.linkProgram(program);

    // Check the link status
    if (!that.asyncCallback) {
      checkProgram(program);
    }
  };

  var checkProgram = function(program) {
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked && !gl.isContextLost()) {
      // something went wrong with the link
      tdl.programs.lastError = gl.getProgramInfoLog (program);
      throw("*** Error in program linking:" + tdl.programs.lastError);
    }
  };

  // Compile shaders
  var program = loadProgram(gl, vertexShader, fragmentShader);
  if (!program && !gl.isContextLost()) {
    throw ("could not compile program");
  }

  // TODO(gman): remove the need for this.
  function flatten(array){
    var flat = [];
    for (var i = 0, l = array.length; i < l; i++) {
      var type = Object.prototype.toString.call(array[i]).split(' ').pop().split(']').shift().toLowerCase();
      if (type) { flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? flatten(array[i]) : array[i]); }
    }
    return flat;
  }

  function createSetters(program) {
    // Look up attribs.
    var attribs = {
    };
    // Also make a plain table of the locs.
    var attribLocs = {
    };

    function createAttribSetter(info, index) {
      if (info.size != 1) {
        throw("arrays of attribs not handled");
      }
      return function(b) {
          gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer());
          gl.enableVertexAttribArray(index);
          gl.vertexAttribPointer(
              index, b.numComponents(), b.type(), b.normalize(), b.stride(), b.offset());
        };
    }

    var numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var ii = 0; ii < numAttribs; ++ii) {
      var info = gl.getActiveAttrib(program, ii);
    if (!info) {
      break;
    }
      var name = info.name;
      if (tdl.string.endsWith(name, "[0]")) {
        name = name.substr(0, name.length - 3);
      }
      var index = gl.getAttribLocation(program, info.name);
      attribs[name] = createAttribSetter(info, index);
      attribLocs[name] = index
    }

    // Look up uniforms
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    var uniforms = {
    };
    var textureUnit = 0;

    function createUniformSetter(info) {
      var loc = gl.getUniformLocation(program, info.name);
      var type = info.type;
      if (info.size > 1 && tdl.string.endsWith(info.name, "[0]")) {
        // It's an array.
        if (type == gl.FLOAT)
          return function() {
            var old;
            return function(v) {
              if (v !== old) {
                old = v;
                gl.uniform1fv(loc, v);
              }
            };
          }();
        if (type == gl.FLOAT_VEC2)
          return function() {
            // I hope they don't use -1,-1 as their first draw
            var old = new Float32Array([-1, -1]);
            return function(v) {
              if (v[0] != old[0] || v[1] != old[1]) {
                gl.uniform2fv(loc, v);
              }
            };
          }();
        if (type == gl.FLOAT_VEC3)
          return function() {
            // I hope they don't use -1,-1,-1 as their first draw
            var old = new Float32Array([-1, -1, -1]);
            return function(v) {
              if (v[0] != old[0] || v[1] != old[1] || v[2] != old[2]) {
                gl.uniform3fv(loc, v);
              }
            };
          }();
        if (type == gl.FLOAT_VEC4)
          return function(v) { gl.uniform4fv(loc, v); };
        if (type == gl.INT)
          return function(v) { gl.uniform1iv(loc, v); };
        if (type == gl.INT_VEC2)
          return function(v) { gl.uniform2iv(loc, v); };
        if (type == gl.INT_VEC3)
          return function(v) { gl.uniform3iv(loc, v); };
        if (type == gl.INT_VEC4)
          return function(v) { gl.uniform4iv(loc, v); };
        if (type == gl.BOOL)
          return function(v) { gl.uniform1iv(loc, v); };
        if (type == gl.BOOL_VEC2)
          return function(v) { gl.uniform2iv(loc, v); };
        if (type == gl.BOOL_VEC3)
          return function(v) { gl.uniform3iv(loc, v); };
        if (type == gl.BOOL_VEC4)
          return function(v) { gl.uniform4iv(loc, v); };
        if (type == gl.FLOAT_MAT2)
          return function(v) { gl.uniformMatrix2fv(loc, false, v); };
        if (type == gl.FLOAT_MAT3)
          return function(v) { gl.uniformMatrix3fv(loc, false, v); };
        if (type == gl.FLOAT_MAT4)
          return function(v) { gl.uniformMatrix4fv(loc, false, v); };
        if (type == gl.SAMPLER_2D || type == gl.SAMPLER_CUBE) {
          var units = [];
          for (var ii = 0; ii < info.size; ++ii) {
            units.push(textureUnit++);
          }
          return function(units) {
            return function(v) {
              gl.uniform1iv(loc, units);
              v.bindToUnit(units);
            };
          }(units);
        }
        throw ("unknown type: 0x" + type.toString(16));
      } else {
        if (type == gl.FLOAT)
          return function(v) { gl.uniform1f(loc, v); };
        if (type == gl.FLOAT_VEC2)
          return function(v) { gl.uniform2fv(loc, v); };
        if (type == gl.FLOAT_VEC3)
          return function(v) { gl.uniform3fv(loc, v); };
        if (type == gl.FLOAT_VEC4)
          return function(v) { gl.uniform4fv(loc, v); };
        if (type == gl.INT)
          return function(v) { gl.uniform1i(loc, v); };
        if (type == gl.INT_VEC2)
          return function(v) { gl.uniform2iv(loc, v); };
        if (type == gl.INT_VEC3)
          return function(v) { gl.uniform3iv(loc, v); };
        if (type == gl.INT_VEC4)
          return function(v) { gl.uniform4iv(loc, v); };
        if (type == gl.BOOL)
          return function(v) { gl.uniform1i(loc, v); };
        if (type == gl.BOOL_VEC2)
          return function(v) { gl.uniform2iv(loc, v); };
        if (type == gl.BOOL_VEC3)
          return function(v) { gl.uniform3iv(loc, v); };
        if (type == gl.BOOL_VEC4)
          return function(v) { gl.uniform4iv(loc, v); };
        if (type == gl.FLOAT_MAT2)
          return function(v) { gl.uniformMatrix2fv(loc, false, v); };
        if (type == gl.FLOAT_MAT3)
          return function(v) { gl.uniformMatrix3fv(loc, false, v); };
        if (type == gl.FLOAT_MAT4)
          return function(v) { gl.uniformMatrix4fv(loc, false, v); };
        if (type == gl.SAMPLER_2D || type == gl.SAMPLER_CUBE) {
          return function(unit) {
            return function(v) {
              gl.uniform1i(loc, unit);
              v.bindToUnit(unit);
            };
          }(textureUnit++);
        }
        throw ("unknown type: 0x" + type.toString(16));
      }
    }

    var textures = {};

    for (var ii = 0; ii < numUniforms; ++ii) {
      var info = gl.getActiveUniform(program, ii);
    if (!info) {
      break;
    }
      name = info.name;
      if (tdl.string.endsWith(name, "[0]")) {
        name = name.substr(0, name.length - 3);
      }
      var setter = createUniformSetter(info);
      uniforms[name] = setter;
      if (info.type == gl.SAMPLER_2D || info.type == gl.SAMPLER_CUBE) {
        textures[name] = setter;
      }
    }

    that.textures = textures;
    that.attrib = attribs;
    that.attribLoc = attribLocs;
    that.uniform = uniforms;
  }
  createSetters(program);

  this.loadNewShaders = function(vertexShaderSource, fragmentShaderSource) {
    var program = loadProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program && !gl.isContextLost()) {
      throw ("could not compile program");
    }
    that.program = program;
    createSetters();
  };

  this.program = program;
  this.good = this.asyncCallback ? false : true;

  var checkLater = function() {
    var e;
    try {
      checkShader(vs);
      checkShader(fs);
      checkProgram(program);
    } catch (e) {
      that.asyncCallback(e.toString());
      return;
    }
    gl.tdl.programs.programDB[that.programId] = this;
    that.asyncCallback();
  };
  if (this.asyncCallback) {
    setTimeout(checkLater, 1000);
  }
};

tdl.programs.handleContextLost_ = function() {
  if (gl.tdl && gl.tdl.programs && gl.tdl.programs.shaderDB) {
    delete gl.tdl.programs.shaderDB;
    delete gl.tdl.programs.programDB;
  }
};

tdl.programs.init_ = function() {
  if (!gl.tdl.programs) {
    gl.tdl.programs = { };
    tdl.webgl.registerContextLostHandler(gl.canvas, tdl.programs.handleContextLost_, true);
  }
  if (!gl.tdl.programs.shaderDB) {
    gl.tdl.programs.shaderDB = { };
    gl.tdl.programs.programDB = { };
  }
};

tdl.programs.Program.prototype.use = function() {
  gl.useProgram(this.program);
};

//function dumpValue(msg, name, value) {
//  var str;
//  if (value.length) {
//      str = value[0].toString();
//     for (var ii = 1; ii < value.length; ++ii) {
//       str += "," + value[ii];
//     }
//  } else {
//    str = value.toString();
//  }
//  tdl.log(msg + name + ": " + str);
//}

tdl.programs.Program.prototype.setUniform = function(uniform, value) {
  var func = this.uniform[uniform];
  if (func) {
    //dumpValue("SET UNI:", uniform, value);
    func(value);
  }
};


