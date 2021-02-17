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
  'use strict';
  const gopt = getQueryParams();

  function setupSlider(selector, options) {
    var parent = document.querySelector(selector);
    if (!parent) {
      // like jquery don't fail on a bad selector
      return;
    }
    if (!options.name) {
      options.name = selector.substring(1);
    }
    return createSlider(parent, options); // eslint-disable-line
  }

  function createSlider(parent, options) {
    var precision = options.precision || 0;
    var min = options.min || 0;
    var step = options.step || 1;
    var value = options.value || 0;
    var max = options.max || 1;
    var fn = options.slide;
    var name = gopt["ui-" + options.name] || options.name;
    var uiPrecision = options.uiPrecision === undefined ? precision : options.uiPrecision;
    var uiMult = options.uiMult || 1;

    min /= step;
    max /= step;
    value /= step;

    parent.innerHTML = `
      <div class="gman-widget-outer">
        <div class="gman-widget-label">${name}</div>
        <div class="gman-widget-value"></div>
        <input class="gman-widget-slider" type="range" min="${min}" max="${max}" value="${value}" />
      </div>
    `;
    var valueElem = parent.querySelector(".gman-widget-value");
    var sliderElem = parent.querySelector(".gman-widget-slider");

    function updateValue(value) {
      valueElem.textContent = (value * step * uiMult).toFixed(uiPrecision);
    }

    updateValue(value);

    function handleChange(event) {
      var value = parseInt(event.target.value);
      updateValue(value);
      fn(event, { value: value * step });
    }

    sliderElem.addEventListener('input', handleChange);
    sliderElem.addEventListener('change', handleChange);

    return {
      elem: parent,
      updateValue: (v) => {
        v /= step;
        sliderElem.value = v;
        updateValue(v);
      },
    };
  }

  function makeSlider(options) {
    const div = document.createElement("div");
    return createSlider(div, options);
  }

  var widgetId = 0;
  function getWidgetId() {
    return "__widget_" + widgetId++;
  }

  function makeCheckbox(options) {
    const div = document.createElement("div");
    div.className = "gman-widget-outer";
    const label = document.createElement("label");
    const id = getWidgetId();
    label.setAttribute('for', id);
    label.textContent = gopt["ui-" + options.name] || options.name;
    label.className = "gman-checkbox-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = options.value;
    input.id = id;
    input.className = "gman-widget-checkbox";
    div.appendChild(label);
    div.appendChild(input);
    input.addEventListener('change', function(e) {
       options.change(e, {
         value: e.target.checked,
       });
    });

    return {
      elem: div,
      updateValue: function(v) {
        input.checked = !!v;
      },
    };
  }

  function makeOption(options) {
    const div = document.createElement("div");
    div.className = "gman-widget-outer";
    const label = document.createElement("label");
    const id = getWidgetId();
    label.setAttribute('for', id);
    label.textContent = gopt["ui-" + options.name] || options.name;
    label.className = "gman-widget-label";
    const selectElem = document.createElement("select");
    options.options.forEach((name, ndx) => {
      const opt = document.createElement("option");
      opt.textContent = gopt["ui-" + name] || name;
      opt.value = ndx;
      opt.selected = ndx === options.value;
      selectElem.appendChild(opt);
    });
    selectElem.className = "gman-widget-select";
    div.appendChild(label);
    div.appendChild(selectElem);
    selectElem.addEventListener('change', function(e) {
       options.change(e, {
         value: selectElem.selectedIndex,
       });
    });

    return {
      elem: div,
      updateValue: function(v) {
        selectElem.selectedIndex = v;
      },
    };
  }

  function noop() {
  }

  function genSlider(object, ui) {
    const changeFn = ui.change || noop;
    ui.name = ui.name || ui.key;
    ui.value = object[ui.key];
    ui.slide = ui.slide || function(event, uiInfo) {
      object[ui.key] = uiInfo.value;
      changeFn();
    };
    return makeSlider(ui);
  }

  function genCheckbox(object, ui) {
    const changeFn = ui.change || noop;
    ui.value = object[ui.key];
    ui.name = ui.name || ui.key;
    ui.change = function(event, uiInfo) {
      object[ui.key] = uiInfo.value;
      changeFn();
    };
    return makeCheckbox(ui);
  }

  function genOption(object, ui) {
    const changeFn = ui.change || noop;
    ui.value = object[ui.key];
    ui.name = ui.name || ui.key;
    ui.change = function(event, uiInfo) {
      object[ui.key] = uiInfo.value;
      changeFn();
    };
    return makeOption(ui);
  }

  const uiFuncs = {
    slider: genSlider,
    checkbox: genCheckbox,
    option: genOption,
  };

  function setupUI(parent, object, uiInfos) {
    const widgets = {};
    uiInfos.forEach(function(ui) {
      const widget = uiFuncs[ui.type](object, ui);
      parent.appendChild(widget.elem);
      widgets[ui.key] = widget;
    });
    return widgets;
  }

  function updateUI(widgets, data) {
    Object.keys(widgets).forEach(key => {
      const widget = widgets[key];
      widget.updateValue(data[key]);
    });
  }

  function getQueryParams() {
    var params = {};
    if (window.hackedParams) {
      Object.keys(window.hackedParams).forEach(function(key) {
        params[key] = window.hackedParams[key];
      });
    }
    if (window.location.search) {
      window.location.search.substring(1).split("&").forEach(function(pair) {
        var keyValue = pair.split("=").map(function(kv) {
          return decodeURIComponent(kv);
        });
        params[keyValue[0]] = keyValue[1];
      });
    }
    return params;
  }

  return {
    setupUI: setupUI,
    updateUI: updateUI,
    setupSlider: setupSlider,
    makeSlider: makeSlider,
    makeCheckbox: makeCheckbox,
  };

}));

