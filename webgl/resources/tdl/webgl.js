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
 * @fileoverview This file contains objects to deal with basic webgl stuff.
 */
tdl.provide('tdl.webgl');

tdl.require('tdl.log');
tdl.require('tdl.misc');

/**
 * A module for log.
 * @namespace
 */
tdl.webgl = tdl.webgl || {};

/**
 * The current GL context
 * @type {WebGLRenderingContext}
 */
gl = null;

tdl.webgl.makeCurrent = function(context) {
  gl = context;
}

/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
tdl.webgl.makeFailHTML = function(msg) {
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
tdl.webgl.GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 */
tdl.webgl.OTHER_PROBLEM = '' +
  "It does not appear your computer supports WebGL.<br/>" +
  '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';

/**
 * Creates a webgl context.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any
 *     creation attributes you want to pass in.
 * @param {function:(msg)} opt_onError An function to call
 *     if there is an error during creation.
 * @return {!WebGLRenderingContext} The created context.
 */
tdl.webgl.setupWebGL = function(canvas, opt_attribs, opt_onError) {
  function handleCreationError(msg) {
    var container = canvas.parentNode;
    if (container) {
      var str = window.WebGLRenderingContext ?
           tdl.webgl.OTHER_PROBLEM :
           tdl.webgl.GET_A_WEBGL_BROWSER;
      if (msg) {
        str += "<br/><br/>Status: " + msg;
      }
      container.innerHTML = tdl.webgl.makeFailHTML(str);
    }
  };

  opt_onError = opt_onError || handleCreationError;

  if (canvas.addEventListener) {
    canvas.addEventListener("webglcontextcreationerror", function(event) {
          opt_onError(event.statusMessage);
        }, false);
  }
  var context = tdl.webgl.create3DContext(canvas, opt_attribs);
  if (context) {
    if (canvas.addEventListener) {
      canvas.addEventListener("webglcontextlost", function(event) {
        //tdl.log("call tdl.webgl.handleContextLost");
        event.preventDefault();
        tdl.webgl.handleContextLost(canvas);
      }, false);
      canvas.addEventListener("webglcontextrestored", function(event) {
        //tdl.log("call tdl.webgl.handleContextRestored");
        tdl.webgl.handleContextRestored(canvas);
      }, false);
    }
  } else {
    if (!window.WebGLRenderingContext) {
      opt_onError("");
    }
  }
  return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLRenderingContext} The created context.
 */
tdl.webgl.create3DContext = function(canvas, opt_attribs) {
  if (opt_attribs === undefined) {
    opt_attribs = {alpha:false};
    tdl.misc.applyUrlSettings(opt_attribs, 'webgl');
  }
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
  if (context) {
    if (!tdl.webgl.glEnums) {
      tdl.webgl.init(context);
    }
    tdl.webgl.makeCurrent(context);
    tdl.webgl.setupCanvas_(canvas);
    context.tdl = {};
    context.tdl.depthTexture = tdl.webgl.getExtensionWithKnownPrefixes("WEBGL_depth_texture");

    // Disallow selection by default. This keeps the cursor from changing to an
    // I-beam when the user clicks and drags.  It's easier on the eyes.
    function returnFalse() {
      return false;
    }

    canvas.onselectstart = returnFalse;
    canvas.onmousedown = returnFalse;
  }
  return context;
};

tdl.webgl.setupCanvas_ = function(canvas) {
  if (!canvas.tdl) {
    canvas.tdl = {};
  }
};

/**
 * Browser prefixes for extensions.
 * @type {!Array.<string>}
 */
tdl.webgl.browserPrefixes_ = [
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
tdl.webgl.getExtensionWithKnownPrefixes = function(name) {
  for (var ii = 0; ii < tdl.webgl.browserPrefixes_.length; ++ii) {
    var prefixedName = tdl.webgl.browserPrefixes_[ii] + name;
    var ext = gl.getExtension(prefixedName);
    if (ext) {
      return ext;
    }
  }
};

tdl.webgl.runHandlers_ = function(handlers) {
  //tdl.log("run handlers: " + handlers.length);
  var handlersCopy = handlers.slice();
  for (var ii = 0; ii < handlersCopy.length; ++ii) {
    //tdl.log("run: " + ii);
    handlersCopy[ii]();
  }
};

tdl.webgl.registerContextLostHandler = function(
    canvas, handler, opt_sysHandler) { 
  tdl.webgl.setupCanvas_(canvas);
  if (!canvas.tdl.contextLostHandlers) {
    canvas.tdl.contextLostHandlers = [[],[]];
  }
  var a = canvas.tdl.contextLostHandlers[opt_sysHandler ? 0 : 1];
  a.push(handler);
};

tdl.webgl.registerContextRestoredHandler = function(
    canvas, handler, opt_sysHandler) {
  tdl.webgl.setupCanvas_(canvas);
  if (!canvas.tdl.contextRestoredHandlers) {
    canvas.tdl.contextRestoredHandlers = [[],[]];
  }
  var a = canvas.tdl.contextRestoredHandlers[opt_sysHandler ? 0 : 1];
  a.push(handler);
};

tdl.webgl.handleContextLost = function(canvas) {
  // first run tdl's handlers then the user's
  //tdl.log("tdl.webgl.handleContextLost");
  if (canvas.tdl.contextLostHandlers) {
    tdl.webgl.runHandlers_(canvas.tdl.contextLostHandlers[0]);
    tdl.webgl.runHandlers_(canvas.tdl.contextLostHandlers[1]);
  }
};

tdl.webgl.handleContextRestored = function(canvas) {
  // first run tdl's handlers then the user's
  //tdl.log("tdl.webgl.handleContextRestored");
  if (canvas.tdl.contextRestoredHandlers) {
    tdl.webgl.runHandlers_(canvas.tdl.contextRestoredHandlers[0]);
    tdl.webgl.runHandlers_(canvas.tdl.contextRestoredHandlers[1]);
  }
};

/**
 * Which arguements are enums.
 * @type {!Object.<number, string>}
 */
tdl.webgl.glValidEnumContexts = {

  // Generic setters and getters

  'enable': { 0:true },
  'disable': { 0:true },
  'getParameter': { 0:true },

  // Rendering

  'drawArrays': { 0:true },
  'drawElements': { 0:true, 2:true },

  // Shaders

  'createShader': { 0:true },
  'getShaderParameter': { 1:true },
  'getProgramParameter': { 1:true },

  // Vertex attributes

  'getVertexAttrib': { 1:true },
  'vertexAttribPointer': { 2:true },

  // Textures

  'bindTexture': { 0:true },
  'activeTexture': { 0:true },
  'getTexParameter': { 0:true, 1:true },
  'texParameterf': { 0:true, 1:true },
  'texParameteri': { 0:true, 1:true, 2:true },
  'texImage2D': { 0:true, 2:true, 6:true, 7:true },
  'texSubImage2D': { 0:true, 6:true, 7:true },
  'copyTexImage2D': { 0:true, 2:true },
  'copyTexSubImage2D': { 0:true },
  'generateMipmap': { 0:true },

  // Buffer objects

  'bindBuffer': { 0:true },
  'bufferData': { 0:true, 2:true },
  'bufferSubData': { 0:true },
  'getBufferParameter': { 0:true, 1:true },

  // Renderbuffers and framebuffers

  'pixelStorei': { 0:true, 1:true },
  'readPixels': { 4:true, 5:true },
  'bindRenderbuffer': { 0:true },
  'bindFramebuffer': { 0:true },
  'checkFramebufferStatus': { 0:true },
  'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
  'framebufferTexture2D': { 0:true, 1:true, 2:true },
  'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
  'getRenderbufferParameter': { 0:true, 1:true },
  'renderbufferStorage': { 0:true, 1:true },

  // Frame buffer operations (clear, blend, depth test, stencil)

  'clear': { 0:true },
  'depthFunc': { 0:true },
  'blendFunc': { 0:true, 1:true },
  'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
  'blendEquation': { 0:true },
  'blendEquationSeparate': { 0:true, 1:true },
  'stencilFunc': { 0:true },
  'stencilFuncSeparate': { 0:true, 1:true },
  'stencilMaskSeparate': { 0:true },
  'stencilOp': { 0:true, 1:true, 2:true },
  'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },

  // Culling

  'cullFace': { 0:true },
  'frontFace': { 0:true }
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
tdl.webgl.glEnums = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
tdl.webgl.init = function(ctx) {
  if (tdl.webgl.glEnums == null) {
    tdl.webgl.glEnums = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        tdl.webgl.glEnums[ctx[propertyName]] = propertyName;
      }
    }
  }
};

/**
 * Checks the utils have been initialized.
 */
tdl.webgl.checkInit = function() {
  if (tdl.webgl.glEnums == null) {
    throw 'tdl.webgl.init(ctx) not called';
  }
};

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
tdl.webgl.mightBeEnum = function(value) {
  tdl.webgl.checkInit();
  return (tdl.webgl.glEnums[value] !== undefined);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
tdl.webgl.glEnumToString = function(value) {
  tdl.webgl.checkInit();
  if (value === undefined) {
    return "undefined";
  }
  var name = tdl.webgl.glEnums[value];
  return (name !== undefined) ? name :
      ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
};

/**
 * Returns the string version of a WebGL argument.
 * Attempts to convert enum arguments to strings.
 * @param {string} functionName the name of the WebGL function.
 * @param {number} argumentIndx the index of the argument.
 * @param {*} value The value of the argument.
 * @return {string} The value as a string.
 */
tdl.webgl.glFunctionArgToString = function(functionName, argumentIndex, value) {
  var funcInfo = tdl.webgl.glValidEnumContexts[functionName];
  if (funcInfo !== undefined) {
    if (funcInfo[argumentIndex]) {
      return tdl.webgl.glEnumToString(value);
    }
  }
  if (value === null) {
    return "null";
  } else if (value === undefined) {
    return "undefined";
  } else {
    return value.toString();
  }
};

/**
 * Converts the arguments of a WebGL function to a string.
 * Attempts to convert enum arguments to strings.
 *
 * @param {string} functionName the name of the WebGL function.
 * @param {number} args The arguments.
 * @return {string} The arguments as a string.
 */
tdl.webgl.glFunctionArgsToString = function(functionName, args) {
  // apparently we can't do args.join(",");
  var argStr = "";
  for (var ii = 0; ii < args.length; ++ii) {
    argStr += ((ii == 0) ? '' : ', ') +
        tdl.webgl.glFunctionArgToString(functionName, ii, args[ii]);
  }
  return argStr;
};

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 * @param {!function(funcName, args): void} opt_onFunc The
 *        function to call when each webgl function is called.
 *        You can use this to log all calls for example.
 */
tdl.webgl.makeDebugContext = function(ctx, opt_onErrorFunc, opt_onFunc) {
  tdl.webgl.init(ctx);
  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        tdl.error(
          "WebGL error "+ tdl.webgl.glEnumToString(err) + " in " +
          functionName + "(" + tdl.webgl.glFunctionArgsToString(
              functionName, args) + ")");
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      if (opt_onFunc) {
        opt_onFunc(functionName, arguments);
      }
      try {
        var result = ctx[functionName].apply(ctx, arguments);
      } catch (e) {
        opt_onErrorFunc(ctx.NO_ERROR, functionName, arguments);
        throw(e);
      }
      var err = ctx.getError();
      if (err != 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  function makePropertyWrapper(wrapper, original, propertyName) {
    wrapper.__defineGetter__(propertyName, function() {
      return original[propertyName];
    });
    // TODO(gmane): this needs to handle properties that take more than
    // one value?
    wrapper.__defineSetter__(propertyName, function(value) {
      original[propertyName] = value;
    });
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
       wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
     } else {
       makePropertyWrapper(wrapper, ctx, propertyName);
     }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow[err]) {
        glErrorShadow[err] = false;
        return err;
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
};

/**
 * Provides requestAnimationFrame in a cross browser way.
 * @param {function(RequestAnimationEvent): void} callback. Callback that will
 *        be called when a frame is ready.
 * @param {!Element} element Element to request an animation frame for.
 * @return {number} request id.
 */
tdl.webgl.requestAnimationFrame = function(callback, element) {
  if (!tdl.webgl.requestAnimationFrameImpl_) {
    tdl.webgl.requestAnimationFrameImpl_ = function() {
      var functionNames = [
        "requestAnimationFrame",
        "webkitRequestAnimationFrame",
        "mozRequestAnimationFrame",
        "oRequestAnimationFrame",
        "msRequestAnimationFrame"
      ];
      for (var jj = 0; jj < functionNames.length; ++jj) {
        var functionName = functionNames[jj];
        if (window[functionName]) {
          tdl.log("using ", functionName);
          return function(name) {
            return function(callback, element) {
              return window[name].call(window, callback, element);
            };
          }(functionName);
        }
      }
      tdl.log("using window.setTimeout");
      return function(callback, element) {
           return window.setTimeout(callback, 1000 / 70);
        };
    }();
  }

  return tdl.webgl.requestAnimationFrameImpl_(callback, element);
};


/**
 * Provides cancelRequestAnimationFrame in a cross browser way.
 * @param {number} requestId.
 */
tdl.webgl.cancelRequestAnimationFrame = function(requestId) {
  if (!tdl.webgl.cancelRequestAnimationFrameImpl_) {
    tdl.webgl.cancelRequestAnimationFrameImpl_ = function() {
      var functionNames = [
        "cancelRequestAnimationFrame",
        "webkitCancelRequestAnimationFrame",
        "mozCancelRequestAnimationFrame",
        "oCancelRequestAnimationFrame",
        "msCancelRequestAnimationFrame"
      ];
      for (var jj = 0; jj < functionNames.length; ++jj) {
        var functionName = functionNames[jj];
        if (window[functionName]) {
          return function(name) {
            return function(requestId) {
              window[name].call(window, requestId);
            };
          }(functionName);
        }
      }
      return function(requestId) {
           window.clearTimeout(requestId);
        };
    }();
  }

  tdl.webgl.cancelRequestAnimationFrameImpl_(requestId);
};



