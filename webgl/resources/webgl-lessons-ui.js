
(function(root, factory) {  // eslint-disable-line
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function() {
      return factory.call(root);
    });
  } else {
    // Browser globals
    root.webglLessonsUI = factory.call(root);
  }
}(this, function() {

  function setupSlider(selector, options) {
    var precision = options.precision || 0;
    var min = options.min || 0;
    var step = options.step || 1;
    var value = options.value || 0;
    var max = options.max || 1;
    var fn = options.slide;

    min /= step;
    max /= step;
    value /= step;

    var parent = document.querySelector(selector);
    if (!parent) {
      return; // like jquery don't fail on a bad selector
    }
    parent.innerHTML = `
      <div class="gman-slider-outer">
        <div class="gman-slider-label">${selector.substring(1)}</div>
        <div class="gman-slider-value"></div>
        <input class="gman-slider-slider" type="range" min="${min}" max="${max}" value="${value}" />
      </div>
    `;
    var valueElem = parent.querySelector(".gman-slider-value");
    var sliderElem = parent.querySelector(".gman-slider-slider");

    function updateValue(value) {
      valueElem.textContent = (value * step).toFixed(precision);
    }

    updateValue(value);

    function handleChange(event) {
      var value = parseInt(event.target.value);
      updateValue(value);
      fn(event, { value: value * step });
    }

    sliderElem.addEventListener('input', handleChange);
    sliderElem.addEventListener('change', handleChange);
  }

  return {
    setupSlider: setupSlider,
  };

}));

