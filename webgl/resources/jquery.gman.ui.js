/*
 * Copyright 2012, GFXFundamentals.
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
  $.widget("gman.gmanSlider", {
    // the default options.
    options: {
      min: 0,         // min value
      step: 1,        // lets you set a smaller increment. For example 0.001 would let you adjust by 1000ths
      value: 0,       // starting value
      precision: 0,   // decimal precision to display
    },

    // Setup
    _create: function() {
      var self = this;
      this.options.max /= this.options.step;
      this.options.min /= this.options.step;
      this.options.value /= this.options.step;
      var originalFunc = this.options.slide;
      this.options.slide = function(event, ui) {
        updateValue(ui.value);
        ui.value *= self.options.step;
        originalFunc(event, ui);
      };

      var updateValue = function(value) {
        self._value.text((value * self.options.step).toFixed(self.options.precision));
      }

      this._label = $('<div class="gman-slider-label">');
      this._value = $('<div class="gman-slider-value">');
      this._slider = $('<div class="gman-slider-slider">').slider(this.options);
      var upper = $('<div class="gman-slider-upper">');
      var outer = $('<div class="gman-slider-outer">');
      this._label.appendTo(upper);
      this._value.appendTo(upper);
      upper.appendTo(outer);
      this._slider.appendTo(outer);
      outer.appendTo(this.element);

      this._label.text($(this.element).attr('id'));
      updateValue(this.options.value);
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

