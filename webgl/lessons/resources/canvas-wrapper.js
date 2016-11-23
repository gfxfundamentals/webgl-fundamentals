/*
 * Copyright 2014, Gregg Tavares.
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
 *     * Neither the name of Gregg Tavares. nor the names of its
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

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['./transform'], factory);
  } else {
    // Browser globals
    var lib = factory();
    root.wrapCanvasRenderingContext2D = lib.wrap;
  }
}(this, function () {
  "use strict";

  var wrap = function(ctx) {

    if (ctx.currentTransform) {
      return ctx;
    }

    var stack = [];

    ctx.scale = function(scale) {
      return function(x, y) {
        ctx.currentTransform.scale(x, y);
        scale(x, y);
      };
    }(ctx.scale.bind(ctx));

    ctx.rotate = function(rotate) {
      return function(r) {
        ctx.currentTransform.rotate(r);
        rotate(r);
      };
    }(ctx.rotate.bind(ctx));

    ctx.translate = function(translate) {
      return function(x, y) {
        ctx.currentTransform.translate(x, y);
        translate(x, y);
      };
    }(ctx.translate.bind(ctx));

    ctx.save = function(save) {
      return function() {
        stack.push(ctx.currentTransform.duplicate());
        save();
      };
    }(ctx.save.bind(ctx));

    ctx.restore = function(restore) {
      return function() {
        if (stack.length) {
          ctx.currentTransform = stack.pop();
        } else {
          throw "transform stack empty!";
        }
        restore();
      };
    }(ctx.restore.bind(ctx));

    ctx.transform = function(transform) {
      return function(m11, m12, m21, m22, dx, dy) {
        ctx.currentTransform.multiply(m11, m12, m21, m22, dx, dy);
        transform(m11, m12, m21, m22, dx, dy);
      };
    }(ctx.transform.bind(ctx));

    ctx.setTransform = function(setTransform) {
      return function(m11, m12, m21, m22, dx, dy) {
        ctx.currentTransform.multiply(m11, m12, m21, m22, dx, dy);
        setTransform(m11, m12, m21, m22, dx, dy);
      };
    }(ctx.setTransform.bind(ctx));

    ctx.currentTransform = new Transform();

    ctx.validateTransformStack = function() {
      if (stack.length != 0) {
        throw ("transform stack not 0");
      }
    };

    return ctx;
  };

  return {
    wrap: wrap,
  };
}));


