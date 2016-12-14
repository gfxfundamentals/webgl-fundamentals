// Licensed under a BSD license. See ../license.html for license

// These funcitions are meant solely to help unclutter the tutorials.
// They are not meant as production type functions.

(function() {

/**
 * Wrapped logging function.
 * @param {string} msg The message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Wrapped logging function.
 * @param {string} msg The message to log.
 */
var error = function(msg) {
  if (window.console) {
    if (window.console.error) {
      window.console.error(msg);
    }
    else if (window.console.log) {
      window.console.log(msg);
    }
  }
};

/**
 * Turn off all logging.
 */
var loggingOff = function() {
  log = function() {};
  error = function() {};
};

/**
 * Check if the page is embedded.
 * @return {boolean} True of we are in an iframe
 */
var isInIFrame = function() {
  return window != window.top;
};

var updateCSSIfInIFrame = function() {
  if (isInIFrame()) {
    document.body.className = "iframe";
  }
};

/**
 * Gets a 2d context.
 * makes its backing store the size it is displayed.
 */
var get2DContext = function(canvas, opt_attribs) {
  if (isInIFrame()) {
    updateCSSIfInIFrame();

    // make the canvas backing store the size it's displayed.
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;
  } else {
    var title = document.title;
    var h1 = document.createElement("h1");
    h1.innerText = title;
    document.body.insertBefore(h1, document.body.children[0]);
  }

  return canvas.getContext("2d");
};

/**
 * Resize a canvas to match the size it's displayed.
 * @param {!Canvas} canvas The canvas to resize.
 */
var resizeCanvasToDisplaySize = function(canvas) {
  if (canvas.width != canvas.clientWidth ||
      canvas.height != canvas.clientHeight) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
}

/* export functions */
this.get2DContext = get2DContext;
this.updateCSSIfInIFrame = updateCSSIfInIFrame;
this.resizeCanvasToDisplaySize = resizeCanvasToDisplaySize;

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
this.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           return window.setTimeout(callback, 1000/60);
         };
})();

/**
 * Provides cancelRequestAnimationFrame in a cross browser way.
 */
this.cancelRequestAnimFrame = (function() {
  return window.cancelCancelRequestAnimationFrame ||
         window.webkitCancelRequestAnimationFrame ||
         window.mozCancelRequestAnimationFrame ||
         window.oCancelRequestAnimationFrame ||
         window.msCancelRequestAnimationFrame ||
         window.clearTimeout;
})();



}());

