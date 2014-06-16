Title: WebGL How It Works

This is a continuation from <a href="webgl-fundamentals.html">WebGL
Fundamentals</a>.  Before we continue I think we need to discuss at a
basic level what WebGL and your GPU actually do.  There are basically 2
parts to this GPU thing.  The first part processes vertices (or streams of
data) into clipspace vertices.  The second part draws pixels based on the
first part.

When you call

<pre class="prettyprint showlinemods">
    gl.drawArrays(gl.TRIANGLE, 0, 9);
</pre>

The 9 there means "process 9 vertices" so here are 9 vertices being processed.

<img src="resources/vertex-shader-anim.gif" class="webgl_center" />

On the left is the data you provide.  The vertex shader is a function you
write.  It gets called once for each vertex.  You do some math and set the
special variable “gl_Position” and the GPU takes your result and
stores it internally.

Assuming you're drawing TRIANGLES, every time this first part generates 3
vertices the GPU uses them to make a triangle.  It figures out which
pixels the 3 points of the triangle correspond to, and then rasterizes the
triangle which is a fancy word for “draws it with pixels”.  For each
pixel it will call your fragment shader asking you what color to make that
pixel.

That’s all very interesting but as you can see in our examples to up
this point the fragment shader has very little info per pixel.
Fortunately we can pass it more info.  We define “varyings” for each
value we want to pass from the vertex shader to the fragment shader.

As a simple example, lets just pass the clipspace coordinates we computed
directly from the vertex shader to the fragment shader.

We'll draw with a simple triangle.  Continuing from our <a
href="webgl-2d-matrices.html">previous example</a> let's change our F to a
triangle.

<pre class="prettyprint showlinemods">
// Fill the buffer with the values that define a rectangle.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
             0, -100,
           150,  125,
          -175,  100]),
      gl.STATIC_DRAW);
}
</pre>

And we have to only draw 3 vertices.

<pre class="prettyprint showlinemods">
  // Draw the scene.
  function drawScene() {
    ...
    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
</pre>

Then in our vertex shader we declare a *varying* to pass data to the
fragment shader.

<pre class="prettyprint showlinemods">
varying vec4 v_color;
...
void main() {
  // Multiply the position by the matrix.
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

  // Convert from clipspace to colorspace.
  // Clipspace goes -1.0 to +1.0
  // Colorspace goes from 0.0 to 1.0
  v_color = gl_Position * 0.5 + 0.5;
}
</pre>

And then we declare the same *varying* in the fragment shader.

<pre class="prettyprint showlinemods">
precision mediump float;

varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
}
</pre>

WebGL will connect the varying in the vertex shader to the varying of the
same name and type in the fragment shader.

Here's the working version.

<iframe class="webgl_example" width="400" height="300" src="../webgl-2d-triangle-with-position-for-color.html"></iframe>
<a class="webgl_center" href="../webgl-2d-triangle-with-position-for-color.html" target="_blank">click here to open in a separate window</a>

Move, scale and rotate the rectangle.  Notice that since the colors are
computed from clipspace they don't move with the rectangle.  They are
relative to the background.

Now think about it.  We only compute 3 vertices.  Our vertex shader only
gets called 3 times therefore it's only computing 3 colors yet our
triangle is many colors.  This is why it's called a *varying*.

WebGL takes the 3 values we computed for each vertex and as it rasterizes
the triangle it interpolates between the values we computed for the
vertices.  For each pixel it calls our fragment shader with the
interpolated value for that pixel.

In the example above we start out with the 3 vertices

<style>
table.vertex_table {
  border: 1px solid black;
  border-collapse: collapse;
  font-family: monospace;
  font-size: small;
}

table.vertex_table th {
  background-color: #88ccff;
  padding-right: 1em;
  padding-left: 1em;
}

table.vertex_table td {
  border: 1px solid black;
  text-align: right;
  padding-right: 1em;
  padding-left: 1em;
}
</style>
<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="2">Vertices</th></tr>
<tr><td>0</td><td>-100</td></tr>
<tr><td>150</td><td>125</td></tr>
<tr><td>-175</td><td>100</td></tr>
</table>
</div>

Our vertex shader applies a matrix to translate, rotate, scale and convert
to clipspace.  The defaults for translation, rotation and scale are
translation = 200, 150, rotation = 0, scale = 1,1 so that's really only
translation.  Given our backbuffer is 400x300 our vertex shader applies
the matrix and then computes the following 3 clipspace vertices.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">values written to gl_Position</th></tr>
<tr><td>0.000</td><td>0.660</td></tr>
<tr><td>0.750</td><td>-0.830</td></tr>
<tr><td>-0.875</td><td>-0.660</td></tr>
</table>
</div>

It also converts those to colorspace and writes them to the *varying*
v_color that we declared.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">values written to v_color</th></tr>
<tr><td>0.5000</td><td>0.750</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.915</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

Those 3 values written to v_color are then interpolated and passed to the
fragment shader for each pixel.

<iframe class="webgl_example" width="400" height="300" src="resources/fragment-shader-anim.html"></iframe>
<div class="webgl_center">v_color is interpolated between v0, v1 and v2</div>

We can also pass in more data to the vertex shader which we can then pass
on to the fragment shader.  So for example lets draw a rectangle, that
consists of 2 triangles, in 2 colors.  To do this we'll add another
attribute to the vertex shader so we can pass it more data and we'll pass
that data directly to the fragment shader.

<pre class="prettyprint showlinemods">
attribute vec2 a_position;
attribute vec4 a_color;
...
varying vec4 v_color;

void main() {
   ...
  // Copy the color from the attribute to the varying.
  v_color = a_color;
}
</pre>

We now have to supply colors for WebGL to use.

<pre class="prettyprint showlinemods">
  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");
  ...
  // Create a buffer for the colors.
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

  // Set the colors.
  setColors(gl);
  ...

// Fill the buffer with colors for the 2 triangles
// that make the rectangle.
function setColors(gl) {
  // Pick 2 random colors.
  var r1 = Math.random();
  var b1 = Math.random();
  var g1 = Math.random();

  var r2 = Math.random();
  var b2 = Math.random();
  var g2 = Math.random();

  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        [ r1, b1, g1, 1,
          r1, b1, g1, 1,
          r1, b1, g1, 1,
          r2, b2, g2, 1,
          r2, b2, g2, 1,
          r2, b2, g2, 1]),
      gl.STATIC_DRAW);
}
</pre>

And here's the result.

<iframe class="webgl_example" width="400" height="300" src="../webgl-2d-rectangle-with-2-colors.html"></iframe>
<a class="webgl_center" href="../webgl-2d-rectangle-with-2-colors.html" target="_blank">click here to open in a separate window</a>

Notice that we have 2 solid color triangles.  Yet we're passing the values
in a *varying* so they are being varied or interpolated across the
triangle.  It's just that we used the same color on each of the 3 vertices
of each triangle.  If we make each color different we'll see the
interpolation.

<pre class="prettyprint showlinemods">
// Fill the buffer with colors for the 2 triangles
// that make the rectangle.
function setColors(gl) {
  // Make every vertex a different color.
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        [ Math.random(), Math.random(), Math.random(), 1,
          Math.random(), Math.random(), Math.random(), 1,
          Math.random(), Math.random(), Math.random(), 1,
          Math.random(), Math.random(), Math.random(), 1,
          Math.random(), Math.random(), Math.random(), 1,
          Math.random(), Math.random(), Math.random(), 1]),
      gl.STATIC_DRAW);
}
</pre>

And now we see the interpolated *varying*.

<iframe class="webgl_example" width="400" height="300" src="../webgl-2d-rectangle-with-random-colors.html"></iframe>
<a class="webgl_center" href="../webgl-2d-rectangle-with-random-colors.html" target="_blank">click here to open in a separate window</a>

Not very exciting I suppose but it does demonstrate using more than one
attribute and passing data from a vertex shader to a fragment shader.  If
you check out <a href="webgl-image-processing.html">the image processing
examples</a> you'll see they also use an extra attribute to pass in
texture coordinates.

Before we move on just one more thing.

<h2>What do these buffer and attibute commands do?</h2>

Buffers are the way of getting vertex and other per vertex data onto the
GPU.  <code>gl.createBuffer</code> creates a buffer.
<code>gl.bindBuffer</code> sets that buffer as the buffer to be worked on.
<code>gl.bufferData</code> copies data into the buffer.

Once the data is in the buffer we need to tell WebGL how to get data out
of it and provide it to the vertex shader's attributes.

To do this, first we ask WebGL what locations it assigned to the
attributes.  For example in the code above we have

<pre class="prettyprint showlinemods">
  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");
</pre>

Once we know the location of the attribute we then issue 2 commands.

<pre class="prettyprint showlinemods">
    gl.enableVertexAttribArray(location);
</pre>

This command tells WebGL we want to supply data from a buffer.

<pre class="prettyprint showlinemods">
    gl.vertexAttribPointer(
        location,
        numComponents,
        typeOfData,
        normalizeFlag,
        strideToNextPieceOfData,
        offsetIntoBuffer);
</pre>

And this command tells WebGL to get data from the buffer that's was last
bound with gl.bindBuffer, how many components per vertex (1 - 4), what the
type of data is (BYTE, FLOAT, INT, UNSIGNED_SHORT, etc...), the stride
which means how many bytes to skip to get from one piece of data to the
next piece of data, and an offset for how far into the buffer our data is.

Number of components is always 1 to 4.

If you are using 1 buffer per type of data then both stride and offset can
always be 0.  0 for stride means "use a stride that matches the type and
size".  0 for offset means start at the beginning of the buffer.  Setting
them to values other than 0 is more complicated and though it has some
benefits in terms of performance it's not worth the complication unless
you are trying to push WebGL to its absolute limits.

I hope that clears up buffers and attributes.

<div class="webgl_bottombar"><h3>What's normalizeFlag for in vertexAttribPointer?</h3>
<p>
The normalize flag is for all the non floating point types. If you pass in false then values will be interpreted as the type they are. BYTE goes from -128 to 127, UNSIGNED_BYTE goes from 0 to 255, SHORT goes from -32768 to 32776 etc...
</p>
<p>
If you set the normalize flag to true then the values of a BYTE (-128 to 127) represent the values -1.0 to +1.0, UNSIGNED_BYTE (0 to 255) become 0.0 to +1.0, A normalized SHORT also goes from -1.0 to +1.0 it just has more resolution than a BYTE.</p>
<p>The most common use for normalized data is for colors. Most of the time colors only go from 0.0 to 1.0. Using a full float each for red, green, blue and alpha would use 16 bytes per vertex per color. If you have complicated geometry that can add up to a lot of bytes. Instead you could convert your colors to UNSIGNED_BYTEs where 0 represnets 0.0 and 255 represents 1.0. Now you'd only need 4 bytes per color per vertex, a 75% savings.
</p>
<p>Let's change our code to do this. When we tell WebGL how to extract our colors we'd use</p>
<pre class="prettyprint showlinemods">
  gl.vertexAttribPointer(colorLocation, 4, gl.UNSIGNED_BYTE, true, 0, 0);
</pre>
<p>And when we fill out our buffer with colors we'd use</p>
<pre class="prettyprint showlinemods">
// Fill the buffer with colors for the 2 triangles
// that make the rectangle.
function setColors(gl) {
  // Pick 2 random colors.
  var r1 = Math.random() * 256; // 0 to 255.99999
  var b1 = Math.random() * 256; // these values
  var g1 = Math.random() * 256; // will be truncated
  var r2 = Math.random() * 256; // when stored in the
  var b2 = Math.random() * 256; // Uint8Array
  var g2 = Math.random() * 256;

  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(   // Uint8Array
        [ r1, b1, g1, 255,
          r1, b1, g1, 255,
          r1, b1, g1, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255]),
      gl.STATIC_DRAW);
}
</pre>
<p>
Here's that sample.
</p>
<iframe class="webgl_example" width="400" height="300" src="../webgl-2d-rectangle-with-2-byte-colors.html"></iframe>
<a class="webgl_center" href="../webgl-2d-rectangle-with-2-byte-colors.html" target="_blank">click here to open in a separate window</a>
</div>


