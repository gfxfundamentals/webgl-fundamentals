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
 * @fileoverview This file contains objects strings.
 */

tdl.provide('tdl.string');

/**
 * A module for string.
 * @namespace
 */
tdl.string = tdl.string || {};

/**
 * Whether a haystack ends with a needle.
 * @param {string} haystack String to search
 * @param {string} needle String to search for.
 * @param {boolean} True if haystack ends with needle.
 */
tdl.string.endsWith = function(haystack, needle) {
  return haystack.substr(haystack.length - needle.length) === needle;
};

/**
 * Whether a haystack starts with a needle.
 * @param {string} haystack String to search
 * @param {string} needle String to search for.
 * @param {boolean} True if haystack starts with needle.
 */
tdl.string.startsWith = function(haystack, needle) {
  return haystack.substr(0, needle.length) === needle;
};

/**
 * Converts a non-homogenious array into a string.
 * @param {!Array.<*>} args Args to turn into a string
 */
tdl.string.argsToString = function(args) {
  var lastArgWasNumber = false;
  var numArgs = args.length;
  var strs = [];
  for (var ii = 0; ii < numArgs; ++ii) {
    var arg = args[ii];
    if (arg === undefined) {
      strs.push('undefined');
    } else if (typeof arg == 'number') {
      if (lastArgWasNumber) {
        strs.push(", ");
      }
      if (arg == Math.floor(arg)) {
        strs.push(arg.toFixed(0));
      } else {
      strs.push(arg.toFixed(3));
      }
      lastArgWasNumber = true;
    } else if (window.Float32Array && arg instanceof Float32Array) {
      // TODO(gman): Make this handle other types of arrays.
      strs.push(tdl.string.argsToString(arg));
    } else {
      strs.push(arg.toString());
      lastArgWasNumber = false;
    }
  }
  return strs.join("");
};

/**
 * Converts an object into a string. Similar to JSON.stringify but just used
 * for debugging.
 */
tdl.string.objToString = function(obj, opt_prefix) {
  var strs = [];

  function objToString(obj, opt_prefix) {
    opt_prefix = opt_prefix || "";
    if (typeof obj == 'object') {
      if (obj.length !== undefined) {
        for (var ii = 0; ii < obj.length; ++ii) {
          objToString(obj[ii], opt_prefix + "[" + ii + "]");
        }
      } else {
        for (var name in obj) {
          objToString(obj[name], opt_prefix + "." + name);
        }
      }
    } else {
      strs.push(tdl.string.argsToString([opt_prefix, ": ", obj]));
    }
  }

  objToString(obj);

  return strs.join("\n");
};


