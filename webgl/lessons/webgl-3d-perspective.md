Title: WebGL 3D Perspective

This post is a continuation of a series of posts about WebGL.
The first <a href="webgl-fundamentals.html">started with fundamentals</a> and
the previous was about <a href="webgl-3d-orthographic.html">3D Basics</a>.
If you haven't read those please view them first.

In the last post we went over how to do 3D but that 3D didn't have any perspective.
It was using what's called an "orthographic" view which has its uses but it's
generally not what people want when they say "3D".

Instead we need to add perspective. Just what is perspective?
It's basically the feature that things that are further away appear
smaller.

<img class="webgl_center" width="500" src="resources/perspective-example.svg" />

Looking at the example above we see that things further away
are drawn smaller. Given our current sample one easy way to
make it so that things that are further away appear smaller
would be to divide the clipspace X and Y by Z.

Think of it this way: If you have a line from (10, 15) to (20,15)
it's 10 units long. In our current sample it would be drawn 10 pixels
long. But if we divide by Z then for example if Z is 1

<pre class="webgl_center">
10 / 1 = 10
20 / 1 = 20
abs(10-20) = 10
</pre>

it would be 10 pixels long, If Z is 2 it would be

<pre class="webgl_center">
10 / 2 = 5
20 / 2 = 10
abs(5 - 10) = 5
</pre>

5 pixels long.  At Z = 3 it would be

<pre class="webgl_center">
10 / 3 = 3.333
20 / 3 = 6.666
abs(3.333 - 6.666) = 3.333
</pre>

You can see that as Z increases, as it gets further away, we'll end up drawing it smaller.
If we divide in clipspace we might get better results because Z will a smaller number (-1 to +1).
If we add a fudgeFactor to multiply Z before we divide we can adjust how much smaller things
get for a given distance.

Let's try it. First let's change the vertex shader to divide by Z after we've
multiplied it by our "fudgeFactor".

<pre class="prettyprint showlinemods">
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
...
uniform float u_fudgeFactor;
...
void main() {
  // Multiply the position by the matrix.
  vec4 position = u_matrix * a_position;

  // Adjust the z to divide by
  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

  // Divide x and y by z.
  gl_Position = vec4(position.xy / zToDivideBy, position.zw);
}
&lt;/script&gt;
</pre>

Note, because Z in clipspace goes from -1 to +1 I added 1 to get `zToDivideBy` to go from 0 to +2 * fudgeFactor

We also need to update the code to let us set the fudgeFactor.

<pre class="prettyprint showlinemods">
  ...
  var fudgeLocation = gl.getUniformLocation(program, "u_fudgeFactor");

  ...
  var fudgeFactor = 1;
  ...
  function drawScene() {
    ...
    // Set the fudgeFactor
    gl.uniform1f(fudgeLocation, fudgeFactor);

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
</pre>

And here's the result.

<iframe class="webgl_example" src="../webgl-3d-perspective.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-3d-perspective.html" target="_blank">click here to open in a separate window</a>

If it's not clear drag the "fudgeFactor" slider from 1.0 to 0.0 to see what things used to look like before
we added our divide by Z code.

<img class="webgl_center" src="resources/orthographic-vs-perspective.png" />
<div class="webgl_center">orthographic vs perspective</div>

It turns out WebGL takes the x,y,z,w value we assign to `gl_Position` in our vertex
shader and divides it by w automatically.

We can prove this very easily by changing the shader and instead of doing the
division ourselves, put `zToDivideBy` in `gl_Position.w`.

<pre class="prettyprint showlinemods">
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
...
uniform float u_fudgeFactor;
...
void main() {
  // Multiply the position by the matrix.
  vec4 position = u_matrix * a_position;

  // Adjust the z to divide by
  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

  // Divide x, y and z by zToDivideBy
  gl_Position = vec4(position.xyz,  zToDivideBy);
}
&lt;/script&gt;
</pre>

and see how it's exactly the same.

<iframe class="webgl_example" src="../webgl-3d-perspective-w.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-3d-perspective-w.html" target="_blank">click here to open in a separate window</a>

Why is the fact that WebGL automatically divides by W useful? Because now, using
more matrix magic, we can just use yet another matrix to copy z to w.

A Matrix like this

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 0,
</pre></div>

will copy z to w. You can look at each of those columns as

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in * 1 +
        y_in * 0 +
        z_in * 0 +
        w_in * 0 ;

y_out = x_in * 0 +
        y_in * 1 +
        z_in * 0 +
        w_in * 0 ;

z_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;

w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;
</pre></div>

which when simplified is

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in;
y_out = y_in;
z_out = z_in;
w_out = z_in;
</pre></div>

We can add the plus 1 we had before with this matrix since we know <code>w_in</code> is always 1.0.

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 1,
</pre></div>

that will change the W calculation to

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 1 ;
</pre></div>

and since we know <code>w_in</code> = 1.0 then that's really

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in + 1;
</pre></div>

Finally we can work our fudgeFactor back in if the matrix is this

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, fudgeFactor,
0, 0, 0, 1,
</pre></div>

which means

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * fudgeFactor +
        w_in * 1 ;
</pre></div>

and simplified that's

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in * fudgeFactor + 1;
</pre></div>

So, let's modify the program again to just use matrices.

First let's put the vertex shader back. It's simple again

<pre class="prettyprint showlinemods">
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
uniform mat4 u_matrix;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
  ...
}
&lt;/script&gt;
</pre>

Next let's make a function to make our Z -&gt; W matrix.

<pre class="prettyprint showlinemods">
function makeZToWMatrix(fudgeFactor) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, fudgeFactor,
    0, 0, 0, 1,
  ];
}
</pre>

and we'll change the code to use it.

<pre class="prettyprint showlinemods">
    ...
    // Compute the matrices
    var zToWMatrix =
        makeZToWMatrix(fudgeFactor);

    ...

    // Multiply the matrices.
    var matrix = matrixMultiply(scaleMatrix, rotationZMatrix);
    matrix = matrixMultiply(matrix, rotationYMatrix);
    matrix = matrixMultiply(matrix, rotationXMatrix);
    matrix = matrixMultiply(matrix, translationMatrix);
    matrix = matrixMultiply(matrix, projectionMatrix);
    matrix = matrixMultiply(matrix, zToWMatrix);

    ...
</pre>

and note, again, it's exactly the same.

<iframe class="webgl_example" src="../webgl-3d-perspective-w-matrix.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-3d-perspective-w-matrix.html" target="_blank">click here to open in a separate window</a>

All that was basically to show you that dividing by Z gives us perspective
and that WebGL conveniently does this divide by Z for us.

But there's still some problems. For example if you set Z to around -100 you'll see something like
the animation below

<img class="webgl_center" src="resources/z-clipping.gif" style="border: 1px solid black;" />

What's going on? Why is the F disappearing early? Just like WebGL clips X and Y or +1 to -1 it also
clips Z. What were's seeing here is where Z < -1.

I could go into detail about how the math to fix it but you can derive it the same way
we did 2D projection. We need to take Z, add some amount and scale some amount and we can make any range we want
get remapped to the -1 to +1.

The cool thing is all of these steps can be done in 1 matrix. Even better, rather than a `fudgeFactor`
we'll decide on a `fieldOfView` and compute the right values to make that happen.

Here's a function to build the matrix.

<pre class="prettyprint showlinemods">
function makePerspective(fieldOfViewInRadians, aspect, near, far) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);

  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
};
</pre>

This matrix will do all our conversions for us. It will adjust the units so they are
in clipspace, it will do the math so that we can choose a field of view by angle
and it will let us choose our z-clipping space. It assumes there's an `eye` or `camera` at the
origin (0, 0, 0) and given a `zNear` and a `fieldOfView` it computes what it would take so that
stuff at `zNear` ends up at z=-1 and stuff at `zNear` that is half of `fieldOfView` above or below the center
ends up with y=-1 and y=1 respectively. It computes what to use for X by just multipling by the `aspect` passed in.
We'd normally set this to the `width / height` of the display area.
Finally, it figures out how much to scale things in Z so that stuff at zFar ends up at Z = 1.

Here's a diagram of the matrix in action.

<iframe class="webgl_example" src="../frustum-diagram.html" width="400" height="600"></iframe>
<a class="webgl_center" href="../frustum-diagram.html" target="_blank">click here to open in a separate window</a>

That shape that looks like 4 sided cone the cubes are spinning in is called a frustum".
The matrix takes the space inside the frustum and converts that to clipspace. `zNear` defines where
things will get clipped in front and zFar defines where things get clipped in back. Set `zNear` to 23 and
you'll see the front of the spinning cubes get clipped. Set `zFar` to 24 and you'll see the back of the cubes
get clipped.

There's just one problem left. This matrix assumes there's a viewer at 0,0,0 and it assumes it's looking
in the negative Z direction and that positive Y is up. Our matrices up to this point have done things
in a different way. To make this work we need to put our objects in front of the view.

We could do that by moving our F. We were drawing at (45, 150, 0). Let's move it to (-150, 0, -360)

Now, to use it we just need to replace our old call to make2DProjection with a call to
makePerspective

<pre class="prettyprint showlinemods">
    var aspect = canvas.clientWidth / canvas.clientHeight;
    var projectionMatrix =
        makePerspective(fieldOfViewRadians, aspect, 1, 2000);
    var translationMatrix =
        makeTranslation(translation[0], translation[1], translation[2]);
    var rotationXMatrix = makeXRotation(rotation[0]);
    var rotationYMatrix = makeYRotation(rotation[1]);
    var rotationZMatrix = makeZRotation(rotation[2]);
    var scaleMatrix = makeScale(scale[0], scale[1], scale[2]);
</pre>

And here it is.

<iframe class="webgl_example" src="../webgl-3d-perspective-matrix.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-3d-perspective-matrix.html" target="_blank">click here to open in a separate window</a>

We're back to just a matrix multiply and we're getting both a field of view and we're able to choose our z space.
We're not done but this article is getting too long. Next up, <a href="webgl-3d-camera.html">cameras</a>.

<div class="webgl_bottombar">
<h3>Why did we move the F so far in Z (-360)?</h3>
<p>
In the other samples we had the F at (45, 150, 0) but the last sample it's been moved to (-150, 0, -360).
Why did it need to be moved so far away? </p>
<p>The reason is up until this last sample our `make2DProjection` function has made a projection from
pixels to clipspace. That means the area we were displaying represented 400x300 pixels. Using 'pixels'
really doesn't make sense in 3D. The new projection makes a frustum that makes it so the area represented
at `zNear` is 2 units tall and 2 * aspect units wide. Since our 'F' is 150 units big and the view can only
see 2 units when it's at zNear we need to move it pretty far away from the origin to see it all.</p>
<p>Similarly we moved 'X' from 45 to -150. Again, the view used to represent 0 to 400 units across.
Now it represents -1 to +1 units across.
</p>
</div>


