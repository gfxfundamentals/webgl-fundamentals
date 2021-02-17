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
(function($, undefined){
  //document.onselectstart = function() { return false; }

  $.widget("gman.gmanUnitCircle", $.ui.mouse, {
    // the default options.
    options: {
      width: 300,
      height: 300,
      value: Math.PI / 5,
      xLabel: "X=",
      yLabel: "Y=",
    },

    // Setup
    _create: function() {
      var self = this;
      this._canvas = $('<canvas>');
      var canvas = this._canvas.get(0);

      canvas.width = this.options.width * window.devicePixelRatio;
      canvas.height = this.options.height * window.devicePixelRatio;
      canvas.style.width = this.options.width + "px";
      canvas.style.height = this.options.height + "px";
      canvas.onselectstart = function() { return false; }

      var ctx = canvas.getContext("2d");

      var width = this.options.width;
      var height = this.options.height;
      var halfWidth = width / 2;
      var halfHeight = height / 2;
      var gridSize = Math.floor(Math.min(halfWidth, halfHeight) * 0.8);
      var centerX = Math.floor(width / 2);
      var centerY = Math.floor(height / 2);
      var moving = false;
      var cursorRadius = 10;

      var angle = modClamp(this.options.value + Math.PI, Math.PI * 2);
      var circlePointX;
      var circlePointY;
      var flash = false;

      setInterval(function() {
         flash = !flash;
         if (!moving) {
           drawCircle(ctx, angle);
         }
      }, 500);

      drawCircle(ctx, angle);

      function start() {
        moving = true;
        drawCircle(ctx, angle);
      }

      function stop() {
        moving = false;
        drawCircle(ctx, angle);
      }

      this._canvas.mousecapture({
        down: function(e) {
          start();
        },
        move: function(e) {
          trackMouse(e);
        },
        up: function(e) {
          stop();
        },
        mouseCapture: function(e) {
          var position = toLocal(e, canvas);
          return inCircle(position.x, position.y);
        }
      });

      function trackMouse(e) {
        var position = toLocal(e, canvas);

        angle = Math.atan2(position.x, position.y);
        drawCircle(ctx, angle);
        var v = modClamp(angle + Math.PI, 2 * Math.PI);
        self._trigger("slide", e, {
          x: Math.sin(v), //circleSin,
          y: Math.cos(v), //circleCos,
          angle: v // ,
        });
      }

      function modClamp(v, range, opt_rangeStart) {
        var start = opt_rangeStart || 0;
        if (range < 0.00001) {
          return start;
        }
        v -= start;
        if (v < 0) {
          v -= Math.floor(v / range) * range;
        } else {
          v = v % range;
        }
        return v + start;
      }

      function toLocal(e, t) {
        var offset = $(t).offset();
        var x = e.pageX - offset.left;
        var y = e.pageY - offset.top;

        x -= halfWidth;
        y -= halfHeight;
        return {x: x, y: y};
      }

      function computeCircleCenter() {
        circleSin = Math.sin(angle);
        circleCos = Math.cos(angle);

        circlePointX = circleSin * gridSize;
        circlePointY = circleCos * gridSize;
      }

      function inCircle(x, y) {
        computeCircleCenter();
        var dx = Math.abs(x - circlePointX);
        var dy = Math.abs(y - circlePointY);
        return dx * dx + dy * dy < cursorRadius * cursorRadius;
      }

      function drawCircle(ctx) {
        var canvas = ctx.canvas;

        computeCircleCenter();

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.translate(centerX, centerY);
        drawGrid();
        drawTriangle();
        drawCircle();
        drawCursor();
        drawCoords();
        ctx.restore();

        function drawGrid() {
          for (var y = -1; y <= 1; ++y) {
            var position = y * gridSize;

            ctx.fillStyle = "#ccc";
            ctx.fillRect(-halfWidth, position, width, 1);
            ctx.fillRect(position, -halfWidth, 1, width);

            ctx.font = "10pt serif";
            ctx.fillStyle = "#888";
            ctx.fillText(y, position + 5, 12);
            if (y) {
              ctx.fillText(-y, 5, position + 12);
            }
          }
        }

        function drawCoords() {
          ctx.font = "10pt sans-serif";
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          //ctx.fillText("X=" + Math.sin(angle).toFixed(3), 10, -gridSize * 0.3);
          //ctx.fillText("Y=" + (-Math.cos(angle)).toFixed(3), 10, -gridSize * 0.3 + 14);
          for (var y = -2; y <= 2; ++y) {
            for (var x = -2; x <= 2; ++x) {
              drawText(x, y);
            }
          }
          ctx.fillStyle = "#000";
          drawText(0, 0);

          function drawText(x, y) {
            ctx.fillText(self.options.xLabel + Math.sin(angle).toFixed(2), circlePointX / 2 + x - 25, y - 5);
            ctx.fillText(self.options.yLabel + (-Math.cos(angle)).toFixed(2), circlePointX + x - 30, circlePointY / 2 + y);
          }
        }

        function drawTriangle() {
          ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
          ctx.strokeStyle = "#888";
          ctx.beginPath();
          ctx.moveTo(0, 1);
          ctx.lineTo(circlePointX, 1);
          ctx.lineTo(circlePointX, circlePointY);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#888";
          ctx.fillRect(0, 0, circlePointX, 1);
          ctx.fillRect(circlePointX, 0, 1, circlePointY);

          function sign(v) {
            return v < 0 ? -1 : v > 0 ? 1 : 0;
          }

          var arrowSize = 7
          var backX = circlePointX - sign(circlePointX) * arrowSize;
          var backY = circlePointY - sign(circlePointY) * arrowSize;

          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.moveTo(circlePointX, 1);
          ctx.lineTo(backX, -arrowSize * 0.7);
          ctx.lineTo(backX, +arrowSize * 0.7);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(circlePointX, circlePointY);
          ctx.lineTo(circlePointX - arrowSize * 0.7, backY);
          ctx.lineTo(circlePointX + arrowSize * 0.7, backY);
          ctx.fill();
        }

        function drawCircle() {
          ctx.strokeStyle = "#00f";
          ctx.beginPath();
          ctx.arc(0, 0, gridSize, 0, 360);
          ctx.closePath();
          ctx.stroke();
        }

        function drawCursor() {
          ctx.strokeStyle = "#000";
          ctx.fillStyle = moving ? "rgba(100, 0, 255, 0.5)" : "rgba(0, 0, 255, " + (flash ? 0.3 : 0.1) + ")";
          ctx.beginPath();
          ctx.arc(circlePointX, circlePointY, cursorRadius, 0, 360);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

//      var originalFunc = this.options.slide;
//      this.options.slide = function(event, ui) {
//        updateValue(ui.value);
//        originalFunc(event, ui);
//      };
//
//      var updateValue = function(value) {
//        self._value.text(value);
//      }
//
//      this._label = $('<div class="gman-slider-label">label</div>');
//      this._value = $('<div class="gman-slider-value">value</div>');
//      this._slider = $('<div class="gman-slider-slider"></div>').slider(this.options);
//      var upper = $('<div class="gman-slider-upper"></div>');
//      var outer = $('<div class="gman-slider-outer"></div>');
//      this._label.appendTo(upper);
//      this._value.appendTo(upper);
//      upper.appendTo(outer);
//      this._slider.appendTo(outer);
//      outer.appendTo(this.element);
      this._canvas.appendTo(this.element);

//      this._label.text($(this.element).attr('id'));
//      updateValue(0);


    },

    // respond to changes to options
    _setOption: function(key, value) {
      switch (key) {
      case "???":
        break;
      }

      // In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
      $.Widget.prototype._setOption.apply(this, arguments);
      // In jQuery UI 1.9 and above, you use the _super method instead
      // this._super( "_setOption", key, value );
    }
  });
})(jQuery);


