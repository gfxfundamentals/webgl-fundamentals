Title: WebGL Resizing the Canvas.
Description: How to resize a WebGL canvas and the issues involved
Category: misc
TOC: WebGL Resizing the Canvas


Here's what you need to know to change the size of the canvas.

Every canvas has 2 sizes. The size of its drawingbuffer. This is how many pixels are in the canvas.
The second size is the size the canvas is displayed. CSS determines the size the canvas is
displayed.

You can set the size of the canvas's drawingbuffer in 2 ways. One using HTML

    <canvas id="c" width="400" height="300"></canvas>

The other using JavaScript

    <canvas id="c" ></canvas>

JavaScript

    var canvas = document.getElementById("c");
    canvas.width = 400;
    canvas.height = 300;

As for setting a canvas's display size if you don't have any CSS that affects the canvas's display size
the display size will be the same size as its drawingbuffer. So in the 2 examples above the canvas's drawingbuffer is 400x300
and its display size is also 400x300.

Here's an example of a canvas whose drawingbuffer is 10x15 pixels that is displayed 400x300 pixels on the page

    <canvas id="c" width="10" height="15" style="width: 400px; height: 300px;"></canvas>

or for example like this

    <style>
    #c {
      width: 400px;
      height: 300px;
    }
    </style>
    <canvas id="c" width="10" height="15"></canvas>

If we draw a single pixel wide rotating line into that canvas we'll see something like this

{{{example url="../webgl-10x15-canvas-400x300-css.html" }}}

Why is it so blurry? Because the browser takes our 10x15 pixel canvas and stretches it to 400x300 pixels and
generally it filters it when it stretches it.

So, what do we do if, for example, we want the canvas to fill the window? Well, first we can get
the browser to stretch the canvas to fill the window with CSS. Example

    <html>
      <head>
        <style>
          /* remove the border */
          body {
            border: 0;
            background-color: white;
          }
          /* make the canvas the size of the viewport */
          canvas {
            width: 100vw;
            height: 100vh;
            display: block;
          }
        <style>
      </head>
      <body>
        <canvas id="c"></canvas>
      </body>
    </html>

Now we just need to make the drawingbuffer match whatever size the browser has stretched the canvas. We can
do that using `clientWidth` and `clientHeight` which are properties every element in HTML has that let
JavaScript check what size that element is being displayed.

    function resize(canvas) {
      // Lookup the size the browser is displaying the canvas.
      var displayWidth  = canvas.clientWidth;
      var displayHeight = canvas.clientHeight;

      // Check if the canvas is not the same size.
      if (canvas.width  != displayWidth ||
          canvas.height != displayHeight) {

        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
      }
    }

Most WebGL apps <a href="webgl-animation.html">are animated</a> so let's call this function just before we render
so it will always adjust the canvas to our desired size just before drawing.

    function drawScene() {
       resize(gl.canvas);

       ...

And here's that

{{{example url="../webgl-resize-canvas.html" }}}

Hey, something is wrong? Why is the line not covering the entire area?

The reason is when we resize the canvas we also need to call `gl.viewport` to set the viewport.
`gl.viewport` tells WebGL how to convert from clipspace (-1 to +1) back to pixels and where to do
it within the canvas. When you first create the WebGL context WebGL will set the viewport to match the size
of the canvas but after that it's up to you to set it. If you change the size of the canvas
you need to tell WebGL a new viewport setting.

Let's change the code to handle this. On top of that, since the WebGL context has a
reference to the canvas let's pass that into resize.

    function drawScene() {
       resize(gl.canvas);

    +   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       ...

Now it's working.

{{{example url="../webgl-resize-canvas-viewport.html" }}}

Open that in a separate window, size the window, notice it always fills the window.

I can hear you asking, why doesn't WebGL set the viewport for us automatically when we change the size of
the canvas? The reason is it doesn't know how or why you are using the viewport. You could be rendering to
a framebuffer or doing something else that requires a different viewport size. WebGL has no way of knowing
your intent so it can't automatically set the viewport for you.

If you look at many WebGL programs they handle resizing or setting the size of the canvas in many different ways.
If you're curious <a href="webgl-anti-patterns.html">here are some of the reasons I think the way described above is preferable</a>.

<div class="webgl_bottombar">
<h3>How do I handle Retina or HD-DPI displays?</h3>
<p>
When you specify a size in CSS or Canvas by pixels those are called CSS pixels which may or may not be actual pixels.
Most current smartphones have what's called a high-definition DPI display (HD-DPI) or as Apple calls it a "Retina Display".
For text and most CSS styling the browser can automatically render HD-DPI graphics but for WebGL, since you're drawing the
graphics it's up to you to render at a higher resolution if you want your graphics to be "HD-DPI" quality.
</p>
<p>To do that we can look at the <code>window.devicePixelRatio</code> value. This value tells us how many real pixels
equals 1 CSS pixel. We can change our resize function to handle that like this.</p>
<pre class="prettyprint">
function resize(gl) {
  var realToCSSPixels = window.devicePixelRatio;

  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  var displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  // Check if the canvas is not the same size.
  if (gl.canvas.width  !== displayWidth ||
      gl.canvas.height !== displayHeight) {

    // Make the canvas the same size
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;
  }
}
</pre>
<p>If you have an HD-DPI display, for example if you view this page on your smartphone
you should notice the line below is thinner than the one above which didn't adjust for
HD-DPI displays</p>
{{{example url="../webgl-resize-canvas-hd-dpi.html" }}}
<p>Whether you really want to adjust for HD-DPI is up to you. On iPhone4 or iPhone5 <code>window.devicePixelRatio</code> is <code>2</code> which
means you'll be drawing 4 times as many pixels. I believe on an iPhone6Plus that value is <code>3</code> which means you'd be drawing
9 times as many pixels. That can really slow down your program. In fact it's a common optimization in games to actually render
less pixels than are displayed and let the GPU scale them up. It really depends on what your needs are. If you're drawing
a graph for printing you might want to support HD-DPI. If you're making a game you might not or you might want to give the
user the option to turn support on or off if their system is not fast enough to draw so many pixels.</p>
</div>


