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
 * @fileoverview This file contains objects to deal with logging.
 */

tdl.provide('tdl.log');

tdl.require('tdl.string');

/**
 * A module for log.
 * @namespace
 */
tdl.log = tdl.log || {};


/**
 * Wrapped logging function.
 * @param {*} msg The message to log.
 */
tdl.log = function() {
  var str = tdl.string.argsToString(arguments);
  if (window.console && window.console.log) {
    window.console.log(str);
  } else if (window.dump) {
    window.dump(str + "\n");
  }
};

/**
 * Wrapped logging function.
 * @param {*} msg The message to log.
 */
tdl.error = function() {
  var str = tdl.string.argsToString(arguments);
  if (window.console) {
    if (window.console.error) {
      window.console.error(str);
    } else if (window.console.log) {
      window.console.log(str);
    } else if (window.dump) {
      window.dump(str + "\n");
    }
  }
};

/**
 * Dumps an object to the console.
 *
 * @param {!Object} obj Object to dump.
 * @param {string} opt_prefix string to prefix each value with.
 */
tdl.dumpObj = function(obj, opt_prefix) {
  tdl.log(tdl.string.objToString(obj, opt_prefix));
};


