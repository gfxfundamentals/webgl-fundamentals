/*
 * Copyright 2012, Gregg Tavares.
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
 *     * Neither the name of Gregg Tavares. nor the names of his
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

(function(window) {
  var topWindow = window;

  /**
   * Check if the page is embedded.
   * @param {Window?) w window to check
   * @return {boolean} True of we are in an iframe
   */
  function isInIFrame(w) {
    w = w || topWindow;
    return w !== w.top;
  }

  function updateCSSIfInIFrame() {
    if (isInIFrame()) {
      document.body.className = "iframe";
    }
  }

  /**
   * Creates the HTLM for a failure message
   * @param {string} canvasContainerId id of container of th
   *        canvas.
   * @return {string} The html.
   */
  function makeFailHTML(msg) {
    return '' +
      '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
      '<td align="center">' +
      '<div style="display: table-cell; vertical-align: middle;">' +
      '<div style="">' + msg + '</div>' +
      '</div>' +
      '</td></tr></table>';
  }

  /**
   * Mesasge for getting a webgl browser
   * @type {string}
   */
  var GET_A_WEBGL_BROWSER = '' +
    'This page requires a browser that supports WebGL.<br/>' +
    '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

  /**
   * Mesasge for need better hardware
   * @type {string}
   */
  var OTHER_PROBLEM = '' +
    "It doesn't appear your computer can support WebGL.<br/>" +
    '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';

  /**
   * Creates a webgl context.
   * @param {HTMLCanvasElement} canvas The canvas tag to get
   *     context from. If one is not passed in one will be
   *     created.
   * @return {WebGLRenderingContext} The created context.
   */
  function create3DContext(canvas, opt_attribs) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {
      try {
        context = canvas.getContext(names[ii], opt_attribs);
      } catch(e) {}  // eslint-disable-line
      if (context) {
        break;
      }
    }
    return context;
  }

  /**
   * Creates a webgl context. If creation fails it will
   * change the contents of the container of the <canvas>
   * tag to an error message with the correct links for WebGL.
   * @param {HTMLCanvasElement} canvas. The canvas element to
   *     create a context from.
   * @param {WebGLContextCreationAttirbutes} opt_attribs Any
   *     creation attributes you want to pass in.
   * @return {WebGLRenderingContext} The created context.
   * @memberOf module:webgl-utils
   */
  function setupWebGL(canvas, opt_attribs) {
    function showLink(str) {
      var container = canvas.parentNode;
      if (container) {
        container.innerHTML = makeFailHTML(str);
      }
    }

    if (!topWindow.WebGLRenderingContext) {
      showLink(GET_A_WEBGL_BROWSER);
      return null;
    }

    var context = create3DContext(canvas, opt_attribs);
    if (!context) {
      showLink(OTHER_PROBLEM);
    }
    return context;
  }

  /**
   * @typedef {Object} GetWebGLContextOptions
   * @property {boolean} [dontResize] by default `getWebGLContext` will resize the canvas to match the size it's displayed.
   * @property {boolean} [noTitle] by default inserts a copy of the `<title>` content into the page
   * @memberOf module:webgl-utils
   */

  /**
   * Gets a WebGL context.
   * makes its backing store the size it is displayed.
   * @param {HTMLCanvasElement} canvas a canvas element.
   * @param {WebGLContextCreationAttirbutes} [opt_attribs] optional webgl context creation attributes
   * @param {module:webgl-utils.GetWebGLContextOptions} [opt_options] options
   * @memberOf module:webgl-utils
   */
  function setupLesson(canvas, opt_attribs, opt_options) {
    var attribs = opt_attribs || {};
    var options = opt_options || {};

    if (isInIFrame()) {
      updateCSSIfInIFrame();

      // make the canvas backing store the size it's displayed.
      if (!options.dontResize && options.resize !== false) {
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }
    } else if (!options.noTitle && options.title !== false) {
      var title = document.title;
      var h1 = document.createElement("h1");
      h1.innerText = title;
      document.body.insertBefore(h1, document.body.children[0]);
    }

    var gl = setupWebGL(canvas, attribs);
  }


  /**
   * Get's the iframe in the parent document
   * that is displaying the specified window .
   * @param {Window} window window to check.
   * @return {HTMLIFrameElement?) the iframe element if window is in an iframe
   */
  function getIFrameForWindow(window) {
    if (!isInIFrame(window)) {
      return;
    }
    var iframes = window.parent.document.getElementsByTagName("iframe");
    for (var ii = 0; ii < iframes.length; ++ii) {
      var iframe = iframes[ii];
      if (iframe.contentDocument === window.document) {
        return iframe;  // eslint-disable-line
      }
    }
  }

  /**
   * Returns true if window is on screen. The main window is
   * always on screen windows in iframes might not be.
   * @param {Window} window the window to check.
   * @return {boolean} true if window is on screen.
   */
  function isFrameVisible(window) {
    try {
      var iframe = getIFrameForWindow(window);
      if (!iframe) {
        return true;
      }

      var bounds = iframe.getBoundingClientRect();
      var isVisible = bounds.top < window.parent.innerHeight && bounds.bottom >= 0 &&
                      bounds.left < window.parent.innerWidth && bounds.right >= 0;

      return isVisible && isFrameVisible(window.parent);
    } catch (e) {
      return true;  // We got a security error?
    }
  }

  /**
   * Returns true if element is on screen.
   * @param {HTMLElement} element the element to check.
   * @return {boolean} true if element is on screen.
   */
  function isOnScreen(element) {
    var isVisible = true;

    if (element) {
      var bounds = element.getBoundingClientRect();
      isVisible = bounds.top < topWindow.innerHeight && bounds.bottom >= 0;
    }

    return isVisible && isFrameVisible(topWindow);
  }

  // Replace requestAnimationFrame.
  if (topWindow.requestAnimationFrame) {
    topWindow.requestAnimationFrame = (function(oldRAF) {

      return function(callback, element) {
        var handler = function() {
          if (isOnScreen(element)) {
            oldRAF(callback, element);
          } else {
            oldRAF(handler, element);
          }
        };
        handler();
      };

    }(topWindow.requestAnimationFrame));
  }

  updateCSSIfInIFrame();

  window.setupLesson = setupLesson;
}(this));

