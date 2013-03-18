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
 * @fileoverview Base for all tdl sample utilties.
 *
 * The main point of this module is to provide a central place to
 * have an init function to register an tdl namespace object because many other
 * modules need access to it.
 */

/**
 * A namespace for all the tdl utility libraries.
 * @namespace
 */
var tdl = tdl || {};

/**
 * Define this because the Google internal JSCompiler needs goog.typedef below.
 */
var goog = goog || {};


if (!window.Int32Array) {
  window.Int32Array = function() { };
  window.Float32Array = function() { };
  window.Uint16Array = function() { };
}

/**
 * A macro for defining composite types.
 *
 * By assigning goog.typedef to a name, this tells Google internal JSCompiler
 * that this is not the name of a class, but rather it's the name of a composite
 * type.
 *
 * For example,
 * /** @type {Array|NodeList} / goog.ArrayLike = goog.typedef;
 * will tell JSCompiler to replace all appearances of goog.ArrayLike in type
 * definitions with the union of Array and NodeList.
 *
 * Does nothing in uncompiled code.
 */
goog.typedef = true;

/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
tdl.global = this;

/**
 * Some javascripts don't support __defineGetter__ or __defineSetter__
 * so we define some here so at least we don't get compile errors.
 * We expect the initialzation code will check and complain. This stubs
 * are just here to make sure we can actually get to the initialization code.
 */
//if (!Object.prototype.__defineSetter__) {
//  Object.prototype.__defineSetter__ = function() {}
//  Object.prototype.__defineGetter__ = function() {}
//}
//
/**
 * Flag used to force a function to run in the browser when it is called
 * from V8.
 * @type {boolean}
 */
tdl.BROWSER_ONLY = true;

/**
 * Array of namespaces that have been provided.
 * @private
 * @type {!Array.<string>}
 */
tdl.provided_ = [];

/**
 * Creates object stubs for a namespace. When present in a file,
 * tdl.provide also indicates that the file defines the indicated
 * object.
 * @param {string} name name of the object that this file defines.
 */
tdl.provide = function(name) {
  // Ensure that the same namespace isn't provided twice.
  if (tdl.getObjectByName(name) &&
      !tdl.implicitNamespaces_[name]) {
    throw 'Namespace "' + name + '" already declared.';
  }

  var namespace = name;
  while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
    tdl.implicitNamespaces_[namespace] = true;
  }

  tdl.exportPath_(name);
  tdl.provided_.push(name);
};


/**
 * Namespaces implicitly defined by tdl.provide. For example,
 * tdl.provide('tdl.events.Event') implicitly declares
 * that 'tdl' and 'tdl.events' must be namespaces.
 *
 * @type {Object}
 * @private
 */
tdl.implicitNamespaces_ = {};

/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by tdl.provide and tdl.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {Object} opt_object the object to expose at the end of the path.
 * @param {Object} opt_objectToExportTo The object to add the path to; default
 *     is |tdl.global|.
 * @private
 */
tdl.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || tdl.global;
  var part;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Parentheses added to eliminate strict JS warning in Firefox.
  while (parts.length && (part = parts.shift())) {
    if (!parts.length && tdl.isDef(opt_object)) {
      // last part and we have an object; use it.
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object} opt_obj The object within which to look; default is
 *     |tdl.global|.
 * @return {Object} The object or, if not found, null.
 */
tdl.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || tdl.global;
  for (var pp = 0; pp < parts.length; ++pp) {
    var part = parts[pp];
    if (cur[part]) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Implements a system for the dynamic resolution of dependencies.
 * @param {string} rule Rule to include, in the form tdl.package.part.
 */
tdl.require = function(rule) {
  // TODO(gman): For some unknown reason, when we call
  // tdl.util.getScriptTagText_ it calls
  // document.getElementsByTagName('script') and for some reason the scripts do
  // not always show up. Calling it here seems to fix that as long as we
  // actually ask for the length, at least in FF 3.5.1 It would be nice to
  // figure out why.
  var dummy = document.getElementsByTagName('script').length;
  // if the object already exists we do not need do do anything
  if (tdl.getObjectByName(rule)) {
    return;
  }
  var path = tdl.getPathFromRule_(rule);
  if (path) {
    tdl.included_[path] = true;
    tdl.writeScripts_();
  } else {
    throw new Error('tdl.require could not find: ' + rule);
  }
};


/**
 * Path for included scripts.
 * @type {string}
 */
tdl.basePath = '';


/**
 * Object used to keep track of urls that have already been added. This
 * record allows the prevention of circular dependencies.
 * @type {Object}
 * @private
 */
tdl.included_ = {};


/**
 * This object is used to keep track of dependencies and other data that is
 * used for loading scripts.
 * @private
 * @type {Object}
 */
tdl.dependencies_ = {
  visited: {},  // used when resolving dependencies to prevent us from
                // visiting the file twice.
  written: {}  // used to keep track of script files we have written.
};


/**
 * Tries to detect the base path of the tdl-base.js script that
 * bootstraps the tdl libraries.
 * @private
 */
tdl.findBasePath_ = function() {
  var doc = tdl.global.document;
  if (typeof doc == 'undefined') {
    return;
  }
  if (tdl.global.BASE_PATH) {
    tdl.basePath = tdl.global.BASE_PATH;
    return;
  } else {
    // HACKHACK to hide compiler warnings :(
    tdl.global.BASE_PATH = null;
  }
  var expectedBase = 'tdl/base.js';
  var scripts = doc.getElementsByTagName('script');
  for (var script, i = 0; script = scripts[i]; i++) {
    var src = script.src;
    var l = src.length;
    if (src.substr(l - expectedBase.length) == expectedBase) {
      tdl.basePath = src.substr(0, l - expectedBase.length);
      return;
    }
  }
};


/**
 * Writes a script tag if, and only if, that script hasn't already been added
 * to the document.  (Must be called at execution time.)
 * @param {string} src Script source.
 * @private
 */
tdl.writeScriptTag_ = function(src) {
  var doc = tdl.global.document;
  if (typeof doc != 'undefined' &&
      !tdl.dependencies_.written[src]) {
    tdl.dependencies_.written[src] = true;
    var html = '<script type="text/javascript" src="' +
               src + '"></' + 'script>'
    doc.write(html);
  }
};


/**
 * Resolves dependencies based on the dependencies added using addDependency
 * and calls writeScriptTag_ in the correct order.
 * @private
 */
tdl.writeScripts_ = function() {
  // the scripts we need to write this time.
  var scripts = [];
  var seenScript = {};
  var deps = tdl.dependencies_;

  function visitNode(path) {
    if (path in deps.written) {
      return;
    }

    // we have already visited this one. We can get here if we have cyclic
    // dependencies.
    if (path in deps.visited) {
      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
      return;
    }

    deps.visited[path] = true;

    if (!(path in seenScript)) {
      seenScript[path] = true;
      scripts.push(path);
    }
  }

  for (var path in tdl.included_) {
    if (!deps.written[path]) {
      visitNode(path);
    }
  }

  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i]) {
      tdl.writeScriptTag_(tdl.basePath + scripts[i]);
    } else {
      throw Error('Undefined script input');
    }
  }
};


/**
 * Looks at the dependency rules and tries to determine the script file that
 * fulfills a particular rule.
 * @param {string} rule In the form tdl.namespace.Class or
 *     project.script.
 * @return {string?} Url corresponding to the rule, or null.
 * @private
 */
tdl.getPathFromRule_ = function(rule) {
  var parts = rule.split('.');
  return parts.join('/') + '.js';
};

tdl.findBasePath_();

/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
tdl.isDef = function(val) {
  return typeof val != 'undefined';
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * tdl.exportProperty.
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. tdl.exportSymbol('Foo', Foo);
 *
 * ex. tdl.exportSymbol('public.path.Foo.staticFunction',
 *                        Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. tdl.exportSymbol('public.path.Foo.prototype.myMethod',
 *                        Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {Object} object Object the name should point to.
 * @param {Object} opt_objectToExportTo The object to add the path to; default
 *     is |tdl.global|.
 */
tdl.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  tdl.exportPath_(publicPath, object, opt_objectToExportTo);
};

tdl.provide('tdl.base');

/**
 * The base module for tdl.
 * @namespace
 */
tdl.base = tdl.base || {};

/**
 * Determine whether a value is an array. Do not use instanceof because that
 * will not work for V8 arrays (the browser thinks they are Objects).
 * @param {*} value A value.
 * @return {boolean} Whether the value is an array.
 */
tdl.base.isArray = function(value) {
  var valueAsObject = /** @type {!Object} */ (value);
  return typeof(value) === 'object' && value !== null &&
      'length' in valueAsObject && 'splice' in valueAsObject;
};

/**
 * A stub for later optionally converting obfuscated names
 * @private
 * @param {string} name Name to un-obfuscate.
 * @return {string} un-obfuscated name.
 */
tdl.base.maybeDeobfuscateFunctionName_ = function(name) {
  return name;
};

/**
 * Makes one class inherit from another.
 * @param {!Object} subClass Class that wants to inherit.
 * @param {!Object} superClass Class to inherit from.
 */
tdl.base.inherit = function(subClass, superClass) {
  /**
   * TmpClass.
   * @ignore
   * @constructor
   */
  var TmpClass = function() { };
  TmpClass.prototype = superClass.prototype;
  subClass.prototype = new TmpClass();
};

/**
 * Parses an error stack from an exception
 * @param {!Exception} excp The exception to get a stack trace from.
 * @return {!Array.<string>} An array of strings of the stack trace.
 */
tdl.base.parseErrorStack = function(excp) {
  var stack = [];
  var name;
  var line;

  if (!excp || !excp.stack) {
    return stack;
  }

  var stacklist = excp.stack.split('\n');

  for (var i = 0; i < stacklist.length - 1; i++) {
    var framedata = stacklist[i];

    name = framedata.match(/^([a-zA-Z0-9_$]*)/)[1];
    if (name) {
      name = tdl.base.maybeDeobfuscateFunctionName_(name);
    } else {
      name = 'anonymous';
    }

    var result = framedata.match(/(.*:[0-9]+)$/);
    line = result && result[1];

    if (!line) {
      line = '(unknown)';
    }

    stack[stack.length] = name + ' : ' + line
  }

  // remove top level anonymous functions to match IE
  var omitRegexp = /^anonymous :/;
  while (stack.length && omitRegexp.exec(stack[stack.length - 1])) {
    stack.length = stack.length - 1;
  }

  return stack;
};

/**
 * Gets a function name from a function object.
 * @param {!function(...): *} aFunction The function object to try to get a
 *      name from.
 * @return {string} function name or 'anonymous' if not found.
 */
tdl.base.getFunctionName = function(aFunction) {
  var regexpResult = aFunction.toString().match(/function(\s*)(\w*)/);
  if (regexpResult && regexpResult.length >= 2 && regexpResult[2]) {
    return tdl.base.maybeDeobfuscateFunctionName_(regexpResult[2]);
  }
  return 'anonymous';
};

/**
 * Pretty prints an exception's stack, if it has one.
 * @param {Array.<string>} stack An array of errors.
 * @return {string} The pretty stack.
 */
tdl.base.formatErrorStack = function(stack) {
  var result = '';
  for (var i = 0; i < stack.length; i++) {
    result += '> ' + stack[i] + '\n';
  }
  return result;
};

/**
 * Gets a stack trace as a string.
 * @param {number} stripCount The number of entries to strip from the top of the
 *     stack. Example: Pass in 1 to remove yourself from the stack trace.
 * @return {string} The stack trace.
 */
tdl.base.getStackTrace = function(stripCount) {
  var result = '';

  if (typeof(arguments.caller) != 'undefined') { // IE, not ECMA
    for (var a = arguments.caller; a != null; a = a.caller) {
      result += '> ' + tdl.base.getFunctionName(a.callee) + '\n';
      if (a.caller == a) {
        result += '*';
        break;
      }
    }
  } else { // Mozilla, not ECMA
    // fake an exception so we can get Mozilla's error stack
    var testExcp;
    try {
      eval('var var;');
    } catch (testExcp) {
      var stack = tdl.base.parseErrorStack(testExcp);
      result += tdl.base.formatErrorStack(stack.slice(3 + stripCount,
                                                        stack.length));
    }
  }

  return result;
};

/**
 * Returns true if the user's browser is Microsoft IE.
 * @return {boolean} true if the user's browser is Microsoft IE.
 */
tdl.base.IsMSIE = function() {
  var ua = navigator.userAgent.toLowerCase();
  var msie = /msie/.test(ua) && !/opera/.test(ua);
  return msie;
};

