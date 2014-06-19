/*
 * Copyright 2012, Gregg Tavares.
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

/** @module webgl-utils */
// These funcitions are meant solely to help unclutter the tutorials.
// They are not meant as production type functions.

//(function() {

/**
 * Wrapped logging function.
 * @param {string} msg The message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Wrapped logging function.
 * @param {string} msg The message to log.
 */
var error = function(msg) {
  if (window.console) {
    if (window.console.error) {
      window.console.error(msg);
    }
    else if (window.console.log) {
      window.console.log(msg);
    }
  }
};

/**
 * Turn off all logging.
 */
var loggingOff = function() {
  log = function() {};
  error = function() {};
};

/**
 * Check if the page is embedded.
 * @return {boolean} True of we are in an iframe
 */
var isInIFrame = function() {
  return window != window.top;
};

/**
 * Converts a WebGL enum to a string
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {number} value The enum value.
 * @return {string} The enum as a string.
 */
var glEnumToString = function(gl, value) {
  for (var p in gl) {
    if (gl[p] == value) {
      return p;
    }
  }
  return "0x" + value.toString(16);
};

/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
var makeFailHTML = function(msg) {
  return '' +
    '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
    '<td align="center">' +
    '<div style="display: table-cell; vertical-align: middle;">' +
    '<div style="">' + msg + '</div>' +
    '</div>' +
    '</td></tr></table>';
};

/**
 * Mesasge for getting a webgl browser
 * @type {string}
 */
var GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 */
var OTHER_PROBLEM = '' +
  "It doesn't appear your computer can support WebGL.<br/>" +
  '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';

/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {HTMLCanvasElement} canvas. The canvas element to
 *     create a context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any
 *     creation attributes you want to pass in.
 * @return {WebGLRenderingContext} The created context.
 */
var setupWebGL = function(canvas, opt_attribs) {
  function showLink(str) {
    var container = canvas.parentNode;
    if (container) {
      container.innerHTML = makeFailHTML(str);
    }
  };

  if (!window.WebGLRenderingContext) {
    showLink(GET_A_WEBGL_BROWSER);
    return null;
  }

  var context = create3DContext(canvas, opt_attribs);
  if (!context) {
    showLink(OTHER_PROBLEM);
  }
  return context;
};

/**
 * Creates a webgl context.
 * @param {HTMLCanvasElement} canvas The canvas tag to get
 *     context from. If one is not passed in one will be
 *     created.
 * @return {WebGLRenderingContext} The created context.
 */
var create3DContext = function(canvas, opt_attribs) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], opt_attribs);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  return context;
}

var updateCSSIfInIFrame = function() {
  if (isInIFrame()) {
    document.body.className = "iframe";
  }
};

/**
 * Gets a WebGL context.
 * makes its backing store the size it is displayed.
 */
var getWebGLContext = function(canvas, opt_attribs, opt_options) {
  var options = opt_options || {}

  if (isInIFrame()) {
    updateCSSIfInIFrame();

    // make the canvas backing store the size it's displayed.
    if (!options.dontResize) {
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
    }
  } else {
    var title = document.title;
    var h1 = document.createElement("h1");
    h1.innerText = title;
    document.body.insertBefore(h1, document.body.children[0]);
  }

  var gl = setupWebGL(canvas, opt_attribs);
  return gl;
};

/**
 * Loads a shader.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {string} shaderSource The shader source.
 * @param {number} shaderType The type of shader.
 * @param {function(string): void) opt_errorCallback callback for errors.
 * @return {WebGLShader} The created shader.
 */
var loadShader = function(gl, shaderSource, shaderType, opt_errorCallback) {
  var errFn = opt_errorCallback || error;
  // Create the shader object
  var shader = gl.createShader(shaderType);

  // Load the shader source
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check the compile status
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    // Something went wrong during compilation; get the error
    var lastError = gl.getShaderInfoLog(shader);
    errFn("*** Error compiling shader '" + shader + "':" + lastError);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Creates a program, attaches shaders, binds attrib locations, links the
 * program and calls useProgram.
 * @param {WebGLShader[]} shaders The shaders to attach
 * @param {string[]?} opt_attribs The attribs names.
 * @param {number[]?} opt_locations The locations for the
 *        attribs.
 * @param {function(string): void) opt_errorCallback callback for errors.
 */
var loadProgram = function(
    gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
  var errFn = opt_errorCallback || error;
  var program = gl.createProgram();
  for (var ii = 0; ii < shaders.length; ++ii) {
    gl.attachShader(program, shaders[ii]);
  }
  if (opt_attribs) {
    for (var ii = 0; ii < opt_attribs.length; ++ii) {
      gl.bindAttribLocation(
          program,
          opt_locations ? opt_locations[ii] : ii,
          opt_attribs[ii]);
    }
  }
  gl.linkProgram(program);

  // Check the link status
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
      // something went wrong with the link
      var lastError = gl.getProgramInfoLog (program);
      errFn("Error in program linking:" + lastError);

      gl.deleteProgram(program);
      return null;
  }
  return program;
};

/**
 * Loads a shader from a script tag.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {string} scriptId The id of the script tag.
 * @param {number} opt_shaderType The type of shader. If not passed in it will
 *     be derived from the type of the script tag.
 * @param {function(string): void) opt_errorCallback callback for errors.
 * @return {WebGLShader} The created shader.
 */
var createShaderFromScript = function(
    gl, scriptId, opt_shaderType, opt_errorCallback) {
  var shaderSource = "";
  var shaderType;
  var shaderScript = document.getElementById(scriptId);
  if (!shaderScript) {
    throw("*** Error: unknown script element" + scriptId);
  }
  shaderSource = shaderScript.text;

  if (!opt_shaderType) {
    if (shaderScript.type == "x-shader/x-vertex") {
      shaderType = gl.VERTEX_SHADER;
    } else if (shaderScript.type == "x-shader/x-fragment") {
      shaderType = gl.FRAGMENT_SHADER;
    } else if (shaderType != gl.VERTEX_SHADER && shaderType != gl.FRAGMENT_SHADER) {
      throw("*** Error: unknown shader type");
      return null;
    }
  }

  return loadShader(
      gl, shaderSource, opt_shaderType ? opt_shaderType : shaderType,
      opt_errorCallback);
};

var defaultShaderType = [
  "VERTEX_SHADER",
  "FRAGMENT_SHADER"
];

/**
 * Creates a program from 2 script tags.
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext
 *        to use.
 * @param {string[]} shaderScriptIds Array of ids of the script
 *        tags for the shaders. The first is assumed to be the
 *        vertex shader, the second the fragment shader.
 * @param {string[]?} opt_attribs The attribs names.
 * @param {number[]?} opt_locations The locations for the
 *        attribs.
 * @param {function(string): void) opt_errorCallback callback for errors.
 * @return {WebGLProgram} The created program.
 */
var createProgramFromScripts = function(
    gl, shaderScriptIds, opt_attribs, opt_locations, opt_errorCallback) {
  var shaders = [];
  for (var ii = 0; ii < shaderScriptIds.length; ++ii) {
    shaders.push(createShaderFromScript(
        gl, shaderScriptIds[ii], gl[defaultShaderType[ii]], opt_errorCallback));
  }
  return loadProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
};

/**
 * Creates a program from 2 sources.
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext
 *        to use.
 * @param {string[]} shaderSourcess Array of sources for the
 *        shaders. The first is assumed to be the vertex shader,
 *        the second the fragment shader.
 * @param {string[]?} opt_attribs The attribs names.
 * @param {number[]?} opt_locations The locations for the
 *        attribs.
 * @param {function(string): void) opt_errorCallback callback for errors.
 * @return {WebGLProgram} The created program.
 */
var createProgramFromSources = function(
    gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
  var shaders = [];
  for (var ii = 0; ii < shaderSources.length; ++ii) {
    shaders.push(loadShader(
        gl, shaderSources[ii], gl[defaultShaderType[ii]], opt_errorCallback));
  }
  return loadProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
};

/**
 * Returns the corresponding bind point for a given sampler type
 */
var getBindPointForSamplerType = function(gl, type) {
  if (type == gl.SAMPLER_2D)   return gl.TEXTURE_2D;
  if (type == gl.SAMPLER_CUBE) return gl.TEXTURE_CUBE_MAP;
};

/**
 * @typedef {Object.<string, function>} Setters
 */

/**
 * Creates setter functions for all uniforms of a shader
 * program.
 *
 * @see setUniforms for example
 *
 * @param {WebGLProgram} program the program to create setters
 *        for.
 * @returns {Setters} an object with a setter for each uniform
 *        by name.
 */
var createUniformSetters = function(gl, program) {
  var textureUnit = 0;

  /**
   * Creates a setter for a uniform of the given program with it's
   * location embedded in the setter.
   * @param {WebGLProgram} program
   * @param {WebGLUniformInfo} uniformInfo
   * @returns {function} the created setter.
   */
  var createUniformSetter = function(program, uniformInfo) {
    var location = gl.getUniformLocation(program, uniformInfo.name);
    var type = uniformInfo.type;
    // Check if this uniform is an array
    var isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) == "[0]");
    if (type == gl.FLOAT && isArray)
      return function(v) { gl.uniform1fv(location, v); };
    if (type == gl.FLOAT)
      return function(v) { gl.uniform1f(location, v); };
    if (type == gl.FLOAT_VEC2)
      return function(v) { gl.uniform2fv(location, v); };
    if (type == gl.FLOAT_VEC3)
      return function(v) { gl.uniform3fv(location, v); };
    if (type == gl.FLOAT_VEC4)
      return function(v) { gl.uniform4fv(location, v); };
    if (type == gl.INT && isArray)
      return function(v) { gl.uniform1iv(location, v); };
    if (type == gl.INT)
      return function(v) { gl.uniform1i(location, v); };
    if (type == gl.INT_VEC2)
      return function(v) { gl.uniform2iv(location, v); };
    if (type == gl.INT_VEC3)
      return function(v) { gl.uniform3iv(location, v); };
    if (type == gl.INT_VEC4)
      return function(v) { gl.uniform4iv(location, v); };
    if (type == gl.BOOL)
      return function(v) { gl.uniform1iv(location, v); };
    if (type == gl.BOOL_VEC2)
      return function(v) { gl.uniform2iv(location, v); };
    if (type == gl.BOOL_VEC3)
      return function(v) { gl.uniform3iv(location, v); };
    if (type == gl.BOOL_VEC4)
      return function(v) { gl.uniform4iv(location, v); };
    if (type == gl.FLOAT_MAT2)
      return function(v) { gl.uniformMatrix2fv(location, false, v); };
    if (type == gl.FLOAT_MAT3)
      return function(v) { gl.uniformMatrix3fv(location, false, v); };
    if (type == gl.FLOAT_MAT4)
      return function(v) { gl.uniformMatrix4fv(location, false, v); };
    if ((type == gl.SAMPLER_2D || type == gl.SAMPLER_CUBE) && isArray) {
      var units = [];
      for (var ii = 0; ii < info.size; ++ii) {
        units.push(textureUnit++);
      }
      return function(bindPoint, units) {
        return function(textures) {
          gl.uniform1iv(location, units);
          textures.forEach(function(texture, index) {
            gl.activeTexture(gl.TEXTURE0 + units[index]);
            gl.bindTexture(bindPoint, tetxure);
          });
        }
      }(getBindPointForSamplerType(gl, type), units);
    }
    if (type == gl.SAMPLER_2D || type == gl.SAMPLER_CUBE)
      return function(bindPoint, unit) {
        return function(texture) {
          gl.uniform1i(location, unit);
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(bindPoint, texture);
        };
      }(getBindPointForSamplerType(gl, type), textureUnit++);
    throw ("unknown type: 0x" + type.toString(16)); // we should never get here.
  };

  var uniformSetters = { };
  var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  for (var ii = 0; ii < numUniforms; ++ii) {
    var uniformInfo = gl.getActiveUniform(program, ii);
    if (!uniformInfo) {
      break;
    }
    var name = uniformInfo.name;
    // remove the array suffix.
    if (name.substr(-3) == "[0]") {
      name = name.substr(0, name.length - 3);
    }
    var setter = createUniformSetter(program, uniformInfo);
    uniformSetters[name] = setter;
  }
  return uniformSetters;
};

/**
 * Set uniforms and binds related textures.
 *
 * @example
 *
 *    var program = createProgramFromScripts(
 *        gl, ["some-vs", "some-fs");
 *
 *    var uniformSetters = createUniformSetters(program);
 *
 *    var tex1 = gl.createTexture();
 *    var tex2 = gl.createTexture();
 *
 *    ... assume we setup the textures with data ...
 *
 *    var uniforms = {
 *      u_someSampler: tex1,
 *      u_someOtherSampler: tex2,
 *      u_someColor: [1,0,0,1],
 *      u_somePosition: [0,1,1],
 *      u_someMatrix: [
 *        1,0,0,0,
 *        0,1,0,0,
 *        0,0,1,0,
 *        0,0,0,0,
 *      ],
 *    }
 *
 *    gl.useProgram(program);
 *
 *  This will automatically bind the textures AND set the
 *  uniforms.
 *
 *    setUniforms(uniformSetters, uniforms);
 *
 * @param {Setters} setters the setters returned from
 *        createUniformSettersForProgram
 * @param {Object.<string, value>} an object with values for the
 *        uniforms.
 */
var setUniforms = function(setters, values) {
  Object.keys(values).forEach(function(name) {
    var setter = setters[name];
    if (setter) {
      setter(values[name]);
    }
  });
};

/**
 * Creates setter functions for all attributes of a shader
 * program
 *
 * @see setAttributes for example
 *
 * @param {WebGLProgram} program the program to create setters
 *        for.
 * @returns {Setters} an object with a setter for each uniform
 *        by name.
 */
var createAttributeSetters = function(gl, program) {
  var attribSetters = {
  };

  function createAttribSetter(index) {
    return function(b) {
        gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
        gl.enableVertexAttribArray(index);
        gl.vertexAttribPointer(
            index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
      };
  }

  var numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (var ii = 0; ii < numAttribs; ++ii) {
    var attribInfo = gl.getActiveAttrib(program, ii);
    if (!attribInfo) {
      break;
    }
    var index = gl.getAttribLocation(program, attribInfo.name);
    attribSetters[attribInfo.name] = createAttribSetter(index);
  }

  return attribSetters;
};

/**
 * Sets attributes and binds buffers.
 *
 * @example
 *
 *    var program = createProgramFromScripts(
 *        gl, ["some-vs", "some-fs");
 *
 *    var attribSetters = createAttributeSetters(program);
 *
 *    var positionBuffer = gl.createBuffer();
 *    var texcoordBuffer = gl.createBuffer();
 *
 *    var attribs = {
 *      a_position: {buffer: positionBuffer, numComponents: 3},
 *      a_texcoord: {buffer: texcoordBuffer, numComponents: 2},
 *    };
 *
 *    gl.useProgram(program);
 *
 *  This will automatically bind the buffers AND set the
 *  attributes.
 *
 *    setAttributes(attribSetters, attribs);
 *
 *  Properties of attribs. For each attrib you can add
 *  properties:
 *
 *    type: the type of data in the buffer. Default = gl.FLOAT
 *    normalize: whether or not to normalize the data. Default =
 *       false
 *    stride: the stride. Default = 0
 *    offset: offset into the buffer. Default = 0
 *
 *  For example if you had 3 value float positions, 2 value
 *  float texcoord and 4 value uint8 colors you'd setup your
 *  attribs like this
 *
 *    var attribs = {
 *      a_position: {buffer: positionBuffer, numComponents: 3},
 *      a_texcoord: {buffer: texcoordBuffer, numComponents: 2},
 *      a_color: {
 *        buffer: colorBuffer,
 *        numComponents: 4,
 *        type: gl.UNSIGNED_BYTE,
 *        normalize: true,
 *      },
 *    };
 *
 */
var setAttributes = function(setters, buffers) {
  Object.keys(buffers).forEach(function(name) {
    var setter = setters[name];
    if (setter) {
      setter(buffers[name]);
    }
  });
};

// Add your prefix here.
var browserPrefixes = [
  "",
  "MOZ_",
  "OP_",
  "WEBKIT_"
];

/**
 * Given an extension name like WEBGL_compressed_texture_s3tc
 * returns the supported version extension, like
 * WEBKIT_WEBGL_compressed_teture_s3tc
 * @param {string} name Name of extension to look for
 * @return {WebGLExtension} The extension or undefined if not
 *     found.
 */
var getExtensionWithKnownPrefixes = function(gl, name) {
  for (var ii = 0; ii < browserPrefixes.length; ++ii) {
    var prefixedName = browserPrefixes[ii] + name;
    var ext = gl.getExtension(prefixedName);
    if (ext) {
      return ext;
    }
  }
};


/**
 * Resize a canvas to match the size it's displayed.
 * @param {HTMLCanvasElement} canvas The canvas to resize.
 * @param {boolean} true if the canvas was resized.
 */
var resizeCanvasToDisplaySize = function(canvas) {
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;
  if (canvas.width != width ||
      canvas.height != height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

/* export functions */
window.createAttributeSetters = createAttributeSetters;
window.createProgram = loadProgram;
window.createProgramFromScripts = createProgramFromScripts;
window.createProgramFromSources = createProgramFromSources;
window.createShaderFromScriptElement = createShaderFromScript;
window.createUniformSetters = createUniformSetters;
window.getWebGLContext = getWebGLContext;
window.updateCSSIfInIFrame = updateCSSIfInIFrame;
window.getExtensionWithKnownPrefixes = getExtensionWithKnownPrefixes;
window.resizeCanvasToDisplaySize = resizeCanvasToDisplaySize;
window.setAttributes = setAttributes;
window.setUniforms = setUniforms;
window.setupWebGL = setupWebGL;

// All browsers that support WebGL support requestAnimationFrame
window.requestAnimFrame = window.requestAnimationFrame;       // just to stay backward compatible.
window.cancelRequestAnimFrame = window.cancelAnimationFrame;  // just to stay backward compatible.

//}());

