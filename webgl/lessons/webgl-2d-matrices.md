Title: WebGL 2D Matrices

This post is a continuation of a series of posts about WebGL. The first <a href="webgl-fundamentals.html">started with fundamentals</a> and the previous was <a href="webgl-2d-scale.html">about scaling 2D geometry</a>.

In the last 3 posts we went over how to <a href="webgl-2d-translation.html">translate geometry</a>, <a href="webgl-2d-rotation.html">rotate geometry</a>, and <a href="webgl-2d-scale.html">scale geometry</a>. Translation, rotation and scale are each considered a type of 'transformation'. Each of these transformations required changes to the shader and each of the 3 transformations was order dependent. In <a href="webgl-2d-scale.html">our previous example</a> we scaled, then rotated, the translated. If we applied those in a different order we'd get a different result.
<!--more-->
For example here is a scale of 2, 1, rotation of 30%, and translation of 100, 0.

<img src="../resources/f-scale-rotation-translation.svg" class="webgl_center" width="400" />

And here is a translation of 100,0, rotation of 30% and scale of 2, 1

<img src="../resources/f-translation-rotation-scale.svg" class="webgl_center" width="400" />

The results are completely different. Even worse, if we needed the second example we'd have to write a different shader that applied the translation, rotation, and scale in our new desired order.

Well, some people way smarter than me, figured out that you can do all the same stuff with matrix math. For 2d we use a 3x3 matrix. A 3x3 matrix is like grid with 9 boxes. 

<style>.glocal-center { text-align: center; } .glocal-center-content { margin-left: auto; margin-right: auto; } .glocal-mat td, .glocal-b { border: 1px solid black; text-align: left;} .glocal-mat td { text-align: center; } .glocal-border { border: 1px solid black; } .glocal-sp { text-align: right !important;  width: 8em;} .glocal-blk { color: black; background-color: black; } .glocal-left { text-align: left; } .glocal-right { text-align: right; }</style>
<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>2.0</td><td>3.0</td></tr><tr><td>4.0</td><td>5.0</td><td>6.0</td></tr><tr><td>7.0</td><td>8.0</td><td>9.0</td></tr></table></div>

To do the math we multiply the position down the columns of the matrix and add up the results. Our positions only have 2 values, x and y but to do this math we need 3 values so we'll use 1 for the third value.

in this case our result would be

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/>
<tr><td class="glocal-right">newX&nbsp;= </td><td>x * </td><td class="glocal-border">1.0</td><td class="glocal-left"> +</td><td class="glocal-right">newY = </td><td>x * </td><td class="glocal-border">2.0</td><td class="glocal-left">+</td><td class="glocal-right">extra = </td><td>x * </td><td class="glocal-border">3.0</td><td> +</td></tr>
<tr><td></td><td>y * </td><td class="glocal-border">4.0</td><td class="glocal-left"> +</td><td></td><td>y * </td><td class="glocal-border">5.0</td><td class="glocal-left"> + </td><td></td><td>y * </td><td class="glocal-border">6.0</td><td> +</td></tr>
<tr><td></td><td>1 * </td><td>7.0</td><td> </td><td></td><td>1 * </td><td>8.0</td><td>  </td><td></td><td>1 * </td><td>9.0</td><td> </td></tr></table></div>

You're probably looking at that and thinking "WHAT'S THE POINT". Well, Let's assume we have a translation. We'll call the amount we want to translate tx and ty. Let's make a matrix like this

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>1.0</td><td>0.0</td></tr><tr><td>tx</td><td>ty</td><td>1.0</td></tr></table></div>

And now check it out

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;= </td><td>x</td><td> * </td><td class="glocal-border">1.0</td><td class="glocal-left"> +</td><td class="glocal-right">newY = </td><td>x</td><td> * </td><td class="glocal-border">0.0</td><td class="glocal-left">+</td><td class="glocal-right">extra = </td><td>x</td><td> * </td><td class="glocal-border">0.0</td><td> +</td></tr><tr><td></td><td>y</td><td> * </td><td class="glocal-border">0.0</td><td class="glocal-left"> +</td><td></td><td>y</td><td> * </td><td class="glocal-border">1.0</td><td class="glocal-left"> + </td><td></td><td>y</td><td> * </td><td class="glocal-border">0.0</td><td> +</td></tr>
<tr><td></td><td>1</td><td> * </td><td>tx</td><td> </td><td></td><td>1</td><td> * </td><td>ty</td><td>  </td><td></td><td>1</td><td> * </td><td>1.0</td><td> </td></tr></table></div>

If you remember your algebra, we can delete any place that multiplies by zero. Multiplying by 1 effectively does nothing so let's simplify to see what's happening

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;= </td><td>x</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left"> +</td><td class="glocal-right">newY = </td><td class="glocal-blk">x</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">+</td><td class="glocal-right">extra = </td><td class="glocal-blk">x</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk"> +</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left"> +</td><td></td><td>y</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left"> + </td><td></td><td class="glocal-blk">y</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk"> +</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk"> * </td><td>tx</td><td> </td><td></td><td class="glocal-blk">1</td><td class="glocal-blk"> * </td><td>ty</td><td>  </td><td></td><td>1</td><td class="glocal-blk"> * </td><td class="glocal-blk">1.0</td><td> </td></tr></table></div>

or more succinctly

<pre class="webgl_center">
newX = x + tx;
newY = y + ty;
</pre>

And extra we don't really care about. That looks surprisingly like <a href="webgl-2d-translation.html">the translation code from our translation example</a>.

Similarly let's do rotation. Like we pointed out in the rotation post we just need the sine and cosine of the angle at which we want to rotate so.

<pre class="webgl_center">
s = Math.sin(angleToRotateInRadians);
c = Math.cos(angleToRotateInRadians);
</pre>

And we build a matrix like this

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>c</td><td>-s</td><td>0.0</td></tr><tr><td>s</td><td>c</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

Applying the matrix we get this

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;= </td><td>x</td><td> * </td><td class="glocal-border">c</td><td class="glocal-left"> +</td><td class="glocal-right">newY = </td><td>x</td><td> * </td><td class="glocal-border">-s</td><td class="glocal-left">+</td><td class="glocal-right">extra = </td><td>x</td><td> * </td><td class="glocal-border">0.0</td><td> +</td></tr>
<tr><td></td><td>y</td><td> * </td><td class="glocal-border">s</td><td class="glocal-left"> +</td><td></td><td>y</td><td> * </td><td class="glocal-border">c</td><td class="glocal-left"> + </td><td></td><td>y</td><td> * </td><td class="glocal-border">0.0</td><td> +</td></tr>
<tr><td></td><td>1</td><td> * </td><td>0.0</td><td> </td><td></td><td>1</td><td> * </td><td>0.0</td><td>  </td><td></td><td>1</td><td> * </td><td>1.0</td><td> </td></tr></table></div>

Blacking out all multiply by 0s and 1s we get

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;= </td><td>x</td><td> * </td><td class="glocal-border">c</td><td class="glocal-left"> +</td><td class="glocal-right">newY = </td><td>x</td><td> * </td><td class="glocal-border">-s</td><td class="glocal-left">+</td><td class="glocal-right">extra = </td><td class="glocal-blk">x</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk"> +</td></tr>
<tr><td></td><td>y</td><td> * </td><td class="glocal-border">s</td><td class="glocal-left glocal-blk"> +</td><td></td><td>y</td><td> * </td><td class="glocal-border">c</td><td class="glocal-left glocal-blk"> + </td><td></td><td class="glocal-blk">y</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk"> +</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk"> * </td><td class="glocal-blk">0.0</td><td> </td><td></td><td class="glocal-blk">1</td><td class="glocal-blk"> * </td><td class="glocal-blk">0.0</td><td>  </td><td></td><td>1</td><td class="glocal-blk"> * </td><td class="glocal-blk">1.0</td><td> </td></tr></table></div>

And simplifying we get

<pre class="webgl_center">
newX = x *  c + y * s;
newY = x * -s + y * c;
</pre>

Which is exactly what we had in our <a href="webgl-2d-rotation.html">rotation sample</a>.

And lastly scale. We'll call our 2 scale factors sx and sy

And we build a matrix like this

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>sx</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>sy</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

Applying the matrix we get this

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;= </td><td>x</td><td> * </td><td class="glocal-border">sx</td><td class="glocal-left"> +</td><td class="glocal-right">newY = </td><td>x</td><td> * </td><td class="glocal-border">0.0</td><td class="glocal-left">+</td><td class="glocal-right">extra = </td><td>x</td><td> * </td><td class="glocal-border">0.0</td><td> +</td></tr>
<tr><td></td><td>y</td><td> * </td><td class="glocal-border">0.0</td><td class="glocal-left"> +</td><td></td><td>y</td><td> * </td><td class="glocal-border">sy</td><td class="glocal-left"> + </td><td></td><td>y</td><td> * </td><td class="glocal-border">0.0</td><td> +</td></tr>
<tr><td></td><td>1</td><td> * </td><td>0.0</td><td> </td><td></td><td>1</td><td> * </td><td>0.0</td><td>  </td><td></td><td>1</td><td> * </td><td>1.0</td><td> </td></tr></table></div>

which is really

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;= </td><td>x</td><td> * </td><td class="glocal-border">sx</td><td class="glocal-left glocal-blk"> +</td><td>newY = </td><td class="glocal-blk">x</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">+</td><td>extra = </td><td class="glocal-blk">x</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk"> +</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk"> +</td><td></td><td>y</td><td> * </td><td class="glocal-border">sy</td><td class="glocal-left glocal-blk"> + </td><td></td><td class="glocal-blk">y</td><td class="glocal-blk"> * </td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk"> +</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk"> * </td><td class="glocal-blk">0.0</td><td> </td><td></td><td class="glocal-blk">1</td><td class="glocal-blk"> * </td><td class="glocal-blk">0.0</td><td>  </td><td></td><td>1</td><td class="glocal-blk"> * </td><td class="glocal-blk">1.0</td><td> </td></tr></table></div>

which simplified is

<pre class="webgl_center">
newX = x * sx;
newY = y * sy;
</pre>

Which is the same as our <a href="webgl-2d-scale.html">scaling sample</a>.

Now I'm sure you might still be thinking. So what? What's the point. That seems like a lot of work just to do the same thing we were already doing?

This is where the magic comes in. It turns out we can multiply matrices together and apply all the transformations at once. Let's assume we have function, <code>matrixMultiply</code>, that takes two matrices, multiplies them and returns the result.

To make things clearer let's make functions to build matrices for translation, rotation and scale.

<pre class="prettyprint showlinemods">
function makeTranslation(tx, ty) {
  return [
    1, 0, 0,
    0, 1, 0,
    tx, ty, 1
  ];
}

function makeRotation(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);
  return [
    c,-s, 0,
    s, c, 0,
    0, 0, 1
  ];
}

function makeScale(sx, sy) {
  return [
    sx, 0, 0,
    0, sy, 0,
    0, 0, 1
  ];
}
</pre>

Now let's change our shader. The old shader looked like this

<pre class="prettyprint showlinemods">
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

void main() {
  // Scale the positon
  vec2 scaledPosition = a_position * u_scale;

  // Rotate the position
  vec2 rotatedPosition = vec2(
     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Add in the translation.
  vec2 position = rotatedPosition + u_translation;
  ...
</pre>

Our new shader will be much simpler.

<pre class="prettyprint showlinemods">
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

void main() {
  // Multiply the position by the matrix.
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;
  ...
</pre>

And here's how we use it

<pre class="prettyprint showlinemods">
  // Draw the scene.
  function drawScene() {
    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Compute the matrices
    var translationMatrix = makeTranslation(translation[0], translation[1]);
    var rotationMatrix = makeRotation(angleInRadians);
    var scaleMatrix = makeScale(scale[0], scale[1]);

    // Multiply the matrices.
    var matrix = matrixMultiply(scaleMatrix, rotationMatrix);
    matrix = matrixMultiply(matrix, translationMatrix);

    // Set the matrix.
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 18);
  }
</pre>

Here's a sample using our new code. The sliders are the same, translation, rotation and scale. But the way they get used in the shader is much simpler. 

<iframe class="webgl_example" src="../webgl-2d-geometry-matrix-transform.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-2d-geometry-matrix-transform.html" target="_blank">click here to open in a separate window</a>

Still, you might be asking, so what? That doesn't seem like much of a benefit . But, now if we want to change the order we don't have to write a new shader. We can just change the math.

<pre class="prettyprint showlinemods">
    ...
    // Multiply the matrices.
    var matrix = matrixMultiply(translationMatrix, rotationMatrix);
    matrix = matrixMultiply(matrix, scaleMatrix);
    ...
</pre>

Here's that version.

<iframe class="webgl_example" src="../webgl-2d-geometry-matrix-transform-trs.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-2d-geometry-matrix-transform-trs.html" target="_blank">click here to open in a separate window</a>

Being able to apply matrices like this is especially important for hierarchical animation like arms on a body, moons on a planet around a sun, or branches on a tree. For a simple example of hierarchical animation lets draw draw our 'F' 5 times but each time lets start with the matrix from the previous 'F'.

<pre class="prettyprint showlinemods">
  // Draw the scene.
  function drawScene() {
    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Compute the matrices
    var translationMatrix = makeTranslation(translation[0], translation[1]);
    var rotationMatrix = makeRotation(angleInRadians);
    var scaleMatrix = makeScale(scale[0], scale[1]);

    // Starting Matrix.
    var matrix = makeIdentity();

    for (var i = 0; i < 5; ++i) {
      // Multiply the matrices.
      matrix = matrixMultiply(matrix, scaleMatrix);
      matrix = matrixMultiply(matrix, rotationMatrix);
      matrix = matrixMultiply(matrix, translationMatrix);

      // Set the matrix.
      gl.uniformMatrix3fv(matrixLocation, false, matrix);

      // Draw the geometry.
      gl.drawArrays(gl.TRIANGLES, 0, 18);
    }
  }
</pre>

To do this we had introduce the function, <code>makeIdentity</code>, that makes an identity matrix. An identity matrix is a matrix that effectively represents 1.0 so that if you multiply by the identity nothing happens. Just like 

<div class="webgl_center">X * 1 = X</div> 

so too 

<div class="webgl_center">matrixX * identity = matrixX</div>

Here's the code to make an identity matrix.

<pre class="prettyprint showlinemods">
function makeIdentity() {
  return [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ];
}
</pre>

Here's the 5 Fs.

<iframe class="webgl_example" src="../webgl-2d-geometry-matrix-transform-hierarchical.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-2d-geometry-matrix-transform-hierarchical.html" target="_blank">click here to open in a separate window</a>

One more example, In every sample so far our 'F' rotates around its top left corner. This is because the math we are using always rotates around the origin and the top left corner of our 'F' is at the origin, (0, 0)

But now, because we can do matrix math and we can choose the order that transforms are applied we can move the origin before the rest of the transforms are applied.

<pre class="prettyprint showlinemods">
    // make a matrix that will move the origin of the 'F' to its center.
    var moveOriginMatrix = makeTranslation(-50, -75);
    ...

    // Multiply the matrices.
    var matrix = matrixMultiply(moveOriginMatrix, scaleMatrix);
    matrix = matrixMultiply(matrix, rotationMatrix);
    matrix = matrixMultiply(matrix, translationMatrix);
</pre>

Here's that sample. Notice the F rotates and scales around the center.

<iframe class="webgl_example" src="../webgl-2d-geometry-matrix-transform-center-f.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-2d-geometry-matrix-transform-center-f.html" target="_blank">click here to open in a separate window</a>

Using that technique you can rotate or scale from any point. Now you know how Photoshop or Flash let you move the rotation point.

Let's go even more crazy. If you go back to the first article on <a href="webgl-fundamentals.html">WebGL fundamentals</a> you might remember we have code in the shader to convert from pixels to clipspace that looks like this.

<pre class="prettyprint showlinemods">
  ...
  // convert the rectangle from pixels to 0.0 to 1.0
  vec2 zeroToOne = position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;
  
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
</pre>

If you look at each of those steps in turn, the first step, "convert from pixels to 0.0 to 1.0", is really a scale operation. The second is also a scale operation. The next is a translation and the very last scales Y by -1. We can actually do that all in the matrix we pass into the shader. We could make 2 scale matrices, one to scale by 1.0/resolution, another to scale by 2.0, a 3rd to translate by -1.0,-1.0 and a 4th to scale Y by -1 then multiply them all together but instead, because the math is simple, we'll just make a function that makes a 'projection' matrix for a given resolution directly.

<pre class="prettyprint showlinemods">
function make2DProjection(width, height) {
  // Note: This matrix flips the Y axis so that 0 is at the top.
  return [
    2 / width, 0, 0,
    0, -2 / height, 0,
    -1, 1, 1
  ];
}
</pre>

Now we can simplify the shader even more. Here's the entire new vertex shader.

<pre class="prettyprint showlinemods">
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
attribute vec2 a_position;

uniform mat3 u_matrix;

void main() {
  // Multiply the position by the matrix.
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
&lt;/script&gt;
</pre>

And in JavaScript we need to multiply by the projection matrix

<pre class="prettyprint showlinemods">
  // Draw the scene.
  function drawScene() {
    ...
    // Compute the matrices
    var projectionMatrix = make2DProjection(
        canvas.clientWidth, canvas.clientHeight);
    ...

    // Multiply the matrices.
    var matrix = matrixMultiply(scaleMatrix, rotationMatrix);
    matrix = matrixMultiply(matrix, translationMatrix);
    matrix = matrixMultiply(matrix, projectionMatrix);
    ...
  }
</pre>

We also removed the code that set the resolution. With this last step we've gone from a rather complicated shader with 6-7 steps to a very simple shader with only 1 step all do to the magic of matrix math.

<iframe class="webgl_example" src="../webgl-2d-geometry-matrix-transform-with-projection.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-2d-geometry-matrix-transform-with-projection.html" target="_blank">click here to open in a separate window</a>

I hope these posts have helped demystified matrix math. <a href="webgl-3d-orthographic.html">I'll move on to 3D next</a>. In 3D matrix math follows the same principles and usage. I started with 2D to hopefully keep it simple to understand.

<div class="webgl_bottombar">
<h3>What are <code>clientWidth</code> and <code>clientHeight</code>?</h3>
<p>Up until this point whenever I referred to the canvas's dimensions I used <code>canvas.width</code> and <code>canvas.height</code>
but above when I called <code>make2DProjection</code> I instead used <code>canvas.clientWidth</code> and <code>canvas.clientHeight</code>. Why?</p>
<p>Projection matrixes are concerned with how to take clipspace (-1 to +1 in each dimension) and convert it back
to pixels. But, in the browser, there are 2 types of pixels we are dealing with. One is the number of pixels in
the canvas itself. So for example a canvas defined like this.</p>
<pre class="prettyprint">
  &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;
</pre>
<p>or one defined like this</p>
<pre class="prettyprint">
  var canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
</pre>
<p>both contain an image 400 pixels wide by 300 pixels tall. But, that size is separate from what size
the browser actually displays that 400x300 pixel canvas. CSS defines what size the canvas is displayed.
For example if we made a canvas like this.</p>
<pre class="prettyprint"><!>
  &lt;style&gt;
  canvas {
    width: 100%;
    height: 100%;
  }
  &lt;/style&gt;
  ...
  &lt;canvas width="400" height="300">&lt;/canvas&gt;
</pre>
<p>The canvas will be displayed whatever size its container is. That's likely not 400x300.</p>
<p>Here's two examples that set the canvas's CSS display size to 100% so the canvas stretched
out to fill the page. The first one uses <code>canvas.width</code> and <code>canvas.height</code>. Open it in a new
window and resize the window. Notice how the 'F' doesn't have the correct aspect. It gets
distorted.</p>
<iframe class="webgl_example" src="../webgl-canvas-width-height.html" width="500" height="150"></iframe>
<a class="webgl_center" href="../webgl-canvas-width-height.html" target="_blank">click here to open in a separate window</a>
<p>In this second example we use <code>canvas.clientWidth</code> and <code>canvas.clientHeight</code>. <code>canvas.clientWidth</code> and <code>canvas.clientHeight</code> report
the size the canvas is actually being displayed by the browser so in this case, even though the canvas still only has 400x300 pixels
since we're defining our aspect ratio based on the size the canvas is being displayed the <code>F</code> always looks correct.</p>
<iframe class="webgl_example" src="../webgl-canvas-clientwidth-clientheight.html" width="500" height="150"></iframe>
<a class="webgl_center" href="../webgl-canvas-clientwidth-clientheight.html" target="_blank">click here to open in a separate window</a>
<p>Most apps that allow their canvases to be resized try to make the <code>canvas.width</code> and <code>canvas.height</code> match
the <code>canvas.clientWidth</code> and <code>canvas.clientHeight</code> because they want there to be
one pixel in the canvas for each pixel displayed by the browser. But, as we've seen above, that's not
the only option. That means, in almost all cases, it's more technically correct to compute a
projection matrix's aspect ration using <code>canvas.clientHeight</code> and <code>canvas.clientWidth</code>.
</p>
</div>

