Title: WebGL 工作原理
Description: WebGL究竟做了什么？！！

此文上接[WebGL 基础概念](webgl-fundamentals.html)。
在继续学习之前，我们需要探讨一下WebGL在GPU上究竟做了什么。
WebGL在GPU上的工作基本上分为两部分，第一部分是将顶点（或数据流）转换到剪辑空间坐标，
第二部分是基于第一部分的结果绘制像素点。

当你调用

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 9;
    gl.drawArrays(primitiveType, offset, count);

这里的9表示“处理9个顶点”，所以将会有9个顶点被转换。

<img src="../resources/vertex-shader-anim.gif" class="webgl_center" />

左侧是你提供的数据。顶点着色器（Vertex Shader）是你写进[GLSL](webgl-shaders-and-glsl.html)
中的一个方法，每个顶点调用一次，在这个方法中做一些数学运算后设置了一个特殊的`gl_Position`变量，
这个变量就是该顶点转换到剪辑空间中的坐标值，GPU接收该值并将其保存起来。

假设你正在画三角形，第一部分每完成三次顶点处理就会用这三个顶点画一个三角形。
它计算出这三个顶点对应的像素后，就会光栅化这个三角形，“光栅化”其实就是“用像素画出来”
的花哨叫法。对于每一个像素，它会调用你的片断着色器询问你使用什么颜色。
你通过给片断着色器的一个特殊变量`gl_FragColor`设置一个颜色值，来实现自定义像素颜色。

使用它们做出非常有趣的东西，但如你所见，到目前为止的例子中，
处理每个像素时片断着色器可用信息很少，幸运的是我们可以给它传递更多信息。
想要从顶点着色器传值到片断着色器，我们可以定义“可变量（varyings）”。

做一个简单的例子，让我们将顶点着色器计算出的剪辑空间坐标从顶点着色器传递到片段着色器。

我们来画一个简单的三角形，从[上一个例子](webgl-2d-matrices.html)继续，让我们把矩形改成三角形。

    // 定义一个三角形填充到缓冲里
    function setGeometry(gl) {
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
                 0, -100,
               150,  125,
              -175,  100]),
          gl.STATIC_DRAW);
    }

我们只需要画三个顶点。

    // 绘制场景
    function drawScene() {
      ...
      // 绘制几何体
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 3;
      gl.drawArrays(primitiveType, offset, count);
    }

然后在我们的顶点着色器中定义一个*varying*（可变量）用来传值给片断着色器。

    varying vec4 v_color;
    ...
    void main() {
      // Multiply the position by the matrix.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // Convert from clipspace to colorspace.
      // Clipspace goes -1.0 to +1.0
      // Colorspace goes from 0.0 to 1.0
    *  v_color = gl_Position * 0.5 + 0.5;
    }

在片断着色器中定义同名*varying*变量。

    precision mediump float;

    *varying vec4 v_color;

    void main() {
    *  gl_FragColor = v_color;
    }

WebGL会将同名的可变量从顶点着色器输入到片断着色器中。

下面是运行结果。

{{{example url="../webgl-2d-triangle-with-position-for-color.html" }}}

Move, scale and rotate the triangle.  Notice that since the colors are
computed from clipspace they don't move with the triangle.  They are
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
<tr><td>0.5000</td><td>0.830</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.086</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

Those 3 values written to v_color are then interpolated and passed to the
fragment shader for each pixel.

{{{diagram url="resources/fragment-shader-anim.html" caption="v_color is interpolated between v0, v1 and v2" }}}

We can also pass in more data to the vertex shader which we can then pass
on to the fragment shader.  So for example let's draw a rectangle, that
consists of 2 triangles, in 2 colors.  To do this we'll add another
attribute to the vertex shader so we can pass it more data and we'll pass
that data directly to the fragment shader.

    attribute vec2 a_position;
    +attribute vec4 a_color;
    ...
    varying vec4 v_color;

    void main() {
       ...
      // Copy the color from the attribute to the varying.
    *  v_color = a_color;
    }

We now have to supply colors for WebGL to use.

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position");
    +  var colorLocation = gl.getAttribLocation(program, "a_color");
      ...
    +  // Create a buffer for the colors.
    +  var colorBuffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    +  // Set the colors.
    +  setColors(gl);
      ...

    +// Fill the buffer with colors for the 2 triangles
    +// that make the rectangle.
    +function setColors(gl) {
    +  // Pick 2 random colors.
    +  var r1 = Math.random();
    +  var b1 = Math.random();
    +  var g1 = Math.random();
    +
    +  var r2 = Math.random();
    +  var b2 = Math.random();
    +  var g2 = Math.random();
    +
    +  gl.bufferData(
    +      gl.ARRAY_BUFFER,
    +      new Float32Array(
    +        [ r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1]),
    +      gl.STATIC_DRAW);
    +}

At render time setup the color attribute


    +gl.enableVertexAttribArray(colorLocation);
    +
    +// Bind the color buffer.
    +gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    +
    +// Tell the color attribute how to get data out of colorBuffer (ARRAY_BUFFER)
    +var size = 4;          // 4 components per iteration
    +var type = gl.FLOAT;   // the data is 32bit floats
    +var normalize = false; // don't normalize the data
    +var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    +var offset = 0;        // start at the beginning of the buffer
    +gl.vertexAttribPointer(
    +    colorLocation, size, type, normalize, stride, offset)

And adjust the count to compute 6 vertices for 2 triangles

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

And here's the result.

{{{example url="../webgl-2d-rectangle-with-2-colors.html" }}}

Notice that we have 2 solid color triangles.  Yet we're passing the values
in a *varying* so they are being varied or interpolated across the
triangle.  It's just that we used the same color on each of the 3 vertices
of each triangle.  If we make each color different we'll see the
interpolation.

    // Fill the buffer with colors for the 2 triangles
    // that make the rectangle.
    function setColors(gl) {
      // Make every vertex a different color.
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(
    *        [ Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1]),
          gl.STATIC_DRAW);
    }

And now we see the interpolated *varying*.

{{{example url="../webgl-2d-rectangle-with-random-colors.html" }}}

Not very exciting I suppose but it does demonstrate using more than one
attribute and passing data from a vertex shader to a fragment shader.  If
you check out [the image processing examples](webgl-image-processing.html)
you'll see they also use an extra attribute to pass in texture coordinates.

##What do these buffer and attibute commands do?

Buffers are the way of getting vertex and other per vertex data onto the
GPU.  `gl.createBuffer` creates a buffer.
`gl.bindBuffer` sets that buffer as the buffer to be worked on.
`gl.bufferData` copies data into the buffer. This is usually done at
initialization time.

Once the data is in the buffer we need to tell WebGL how to get data out
of it and provide it to the vertex shader's attributes.

To do this, first we ask WebGL what locations it assigned to the
attributes.  For example in the code above we have

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");

This is also usually done at initialization time.

Once we know the location of the attribute we then issue 3 commands just
before drawing.

    gl.enableVertexAttribArray(location);

That command tells WebGL we want to supply data from a buffer.

    gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer);

That command binds a buffer to the ARRAY_BUFFER bind point. It's a global
variable internal to WebGL

    gl.vertexAttribPointer(
        location,
        numComponents,
        typeOfData,
        normalizeFlag,
        strideToNextPieceOfData,
        offsetIntoBuffer);

And that command tells WebGL to get data from the buffer that is currently
bound to the ARRAY_BUFFER bind point, how many components per vertex (1 - 4),
what the type of data is (`BYTE`, `FLOAT`, `INT`, `UNSIGNED_SHORT`, etc...),
the stride which means how many bytes to skip to get from one piece of data to the
next piece of data, and an offset for how far into the buffer our data is.

Number of components is always 1 to 4.

If you are using 1 buffer per type of data then both stride and offset can
always be 0.  0 for stride means "use a stride that matches the type and
size".  0 for offset means start at the beginning of the buffer.  Setting
them to values other than 0 is more complicated and though it has some
benefits in terms of performance it's not worth the complication unless
you are trying to push WebGL to its absolute limits.

I hope that clears up buffers and attributes.

Next let's go over [shaders and GLSL](webgl-shaders-and-glsl.html).

<div class="webgl_bottombar"><h3>What's normalizeFlag for in vertexAttribPointer?</h3>
<p>
The normalize flag is for all the non floating point types. If you pass
in false then values will be interpreted as the type they are. BYTE goes
from -128 to 127, UNSIGNED_BYTE goes from 0 to 255, SHORT goes from -32768 to 32767 etc...
</p>
<p>
If you set the normalize flag to true then the values of a BYTE (-128 to 127)
represent the values -1.0 to +1.0, UNSIGNED_BYTE (0 to 255) become 0.0 to +1.0.
A normalized SHORT also goes from -1.0 to +1.0 it just has more resolution than a BYTE.
</p>
<p>
The most common use for normalized data is for colors. Most of the time colors
only go from 0.0 to 1.0. Using a full float each for red, green, blue and alpha
would use 16 bytes per vertex per color. If you have complicated geometry that
can add up to a lot of bytes. Instead you could convert your colors to UNSIGNED_BYTEs
where 0 represents 0.0 and 255 represents 1.0. Now you'd only need 4 bytes per color
per vertex, a 75% savings.
</p>
<p>Let's change our code to do this. When we tell WebGL how to extract our colors we'd use</p>
<pre class="prettyprint showlinemods">
  // Tell the color attribute how to get data out of colorBuffer (ARRAY_BUFFER)
  var size = 4;                 // 4 components per iteration
*  var type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned bytes
*  var normalize = true;         // normalize the data
  var stride = 0;               // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;               // start at the beginning of the buffer
  gl.vertexAttribPointer(
      colorLocation, size, type, normalize, stride, offset)
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

{{{example url="../webgl-2d-rectangle-with-2-byte-colors.html" }}}
</div>
