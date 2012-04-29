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

