Title: WebGL Fundamentals
Description: Your first WebGL lesson starting with the fundamentals

WebGL makes it possible to display amazing realtime 3D graphics in your
browser but what many people don't know is that
[WebGL is actually a rasterization API, not a 3D API](webgl-2d-vs-3d-library.html).

Let me explain.

WebGL only cares about 2 things. Clipspace coordinates and colors.
Your job as a programmer using WebGL is to provide WebGL with those 2 things.
You provide 2 "shaders" to do this. A Vertex shader which provides the
clipspace coordinates and a fragment shader that provides the color.

Clipspace coordinates always go from -1 to +1 no matter what size your
canvas is. Here is a simple WebGL example that shows WebGL in its simplest form.

    // Get A WebGL context
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("experimental-webgl");

    // setup a GLSL program
    var program = createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");

    // Create a buffer and put a single clipspace rectangle in
    // it (2 triangles)
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0]),
        gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

Here's the 2 shaders

    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    void main() {
      gl_Position = vec4(a_position, 0, 1);
    }
    </script>

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    void main() {
      gl_FragColor = vec4(0, 1, 0, 1);  // green
    }
    </script>

This will draw a green rectangle the entire size of the canvas. Here it is

%(example: { url: "../webgl-fundamentals.html" })s

Not very exciting :-p

Again, clipspace coordinates always go from -1 to +1 regardless of the
size of the canvas. In the case above you can see we are doing nothing
but passing on our position data directly. Since the position data is
already in clipspace there is no work to do. *If you want 3D it's up to you
to supply shaders that convert from 3D to clipspace because WebGL is only
a rasterization API*.

For 2D stuff you would probably rather work in pixels than clipspace so
let's change the shader so we can supply rectangles in pixels and have
it convert to clipspace for us. Here's the new vertex shader

    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;

    void main() {
       // convert the rectangle from pixels to 0.0 to 1.0
       vec2 zeroToOne = a_position / u_resolution;

       // convert from 0->1 to 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;

       // convert from 0->2 to -1->+1 (clipspace)
       vec2 clipSpace = zeroToTwo - 1.0;

       gl_Position = vec4(clipSpace, 0, 1);
    }
    </script>

Now we can change our data from clipspace to pixels

    // set the resolution
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    // setup a rectangle from 10,20 to 80,30 in pixels
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30]), gl.STATIC_DRAW);

And here it is

%(example: { url: "../webgl-2d-rectangle.html" })s

You might notice the rectangle is near the bottom of that area. WebGL considers the bottom left
corner to be 0,0. To get it to be the more traditional top left corner used for 2d graphics APIs
we just flip the y coordinate.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

And now our rectangle is where we expect it.

%(example: { url: "../webgl-2d-rectangle-top-left.html" })s

Let's make the code that defines a rectangle into a function so
we can call it for different sized rectangles. While we're at it
we'll make the color settable.

First we make the fragment shader take a color uniform input.

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    +uniform vec4 u_color;

    void main() {
    *   gl_FragColor = u_color;
    }
    </script>

And here's the new code that draws 50 rectangles in random places and random colors.

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...
      // Create a buffer
      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // draw 50 random rectangles in random colors
      for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Set a random color.
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Fills the buffer with the values that define a rectangle.
    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

And here's the rectangles.

%(example: { url: "../webgl-2d-rectangles.html" })s

I hope you can see that WebGL is actually a pretty simple API.
While it can get more complicated to do 3D that complication is
added by you, the programmer, in the form of more complex shaders.
The WebGL API itself is 2D and fairly simple.

If you're 100% new to WebGL and have no idea what GLSL is or shaders or what the GPU does
then checkout [the basics of how WebGL really works](webgl-how-it-works.html).

Otherwise from here you can go in 2 directions. If you are interested in image procesing
I'll show you [how to do some 2D image processing](webgl-image-processing.html).
If you are interesting in learning about translation,
rotation and scale then [start here](webgl-2d-translation.html).

<div class="webgl_bottombar">
<h3>What do type="x-shader/x-vertex" and type="x-shader/x-fragment" mean?</h3>
<p>
<code>&lt;script&gt;</code> tags default to having JavaScript in them.
You can put no type or you can put <code>type="javascript"</code> or
<code>type="text/javascript"</code> and the browser will interpret the
contents as JavaScript. If you put anything else the browser ignores the
contents of the script tag.
</p>
<p>
We can use this feature to store shaders in script tags. Even better, we
can make up our own type and in our javascript look for that to decide
whether to compile the shader as a vertex shader or a fragment shader.
</p>
<p>
In this case the function <code>createProgramFromScripts</code> looks for
scripts with specified ids and then looks at the <code>type</code> to
decide what type of shader to create.
</p>
<p>
<code>createProgramFromScripts</code> is part of some <a href="webgl-boilerplate.html">boilerplate like code</a>
that almost every WebGL program needs.
</p>
</div>
