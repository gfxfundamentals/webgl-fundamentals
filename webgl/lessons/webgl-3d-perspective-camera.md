Title: WebGL 3D Perspective and Camera

This post is a continuation of a series of posts about WebGL.
The first <a href="webgl-fundamentals.html">started with fundamentals</a> and
the previous was about <a href="webgl-3d-basics.html">3d basics.</a>.
If you haven't read those please view them first.

In the last post we went over how to do 3D but that 3D didn't have any perspective.
It was using what's called an "orthographic" view which has it's uses but it's
generally not what people want when they want 3D.

Instead we need to add perspective. Just what is perspective?
Is basically the feature that things that are further away appear
smaller.

<img class="webgl_center" src="resources/perspective-example.jpg" />

Looking at the example above we see that things further away
are drawn smaller. Given our current sample one easy way to
make it so that things that are further away appear smaller
would be to divide by Z. Think of it this way.

If you have a line from (10, 15) to (20,15) it's 10 units long.
In our current sample it would be drawn 10 pixels long. But if we
divide by Z then for example if Z is 1

    10 / 1 = 10
    20 / 1 = 20
    abs(10-20) = 10

it would be 10 pixels long, If Z is 2 it would be

    10 / 2 = 5
    20 / 2 = 10
    abs(5 - 10) = 5

5 pixels long.  At Z = 3 it would be

    10 / 3 = 3.333
    20 / 3 = 6.666
    abs(3.333 - 6.666) = 3.333

You can see that as Z increases, as it gets further away, we'll end up drawing it smaller.
Halfing the size just one pixel away more away is probably a little too much so maybe we
should try dividing by Z multiplied by some amount like 0.001 to get a result a little
closer to reality.

Let's try it. First let's change the vertex shader to divide by Z after we've
multiplied it by our "fudgeFactor".

<pre class="prettyprint">
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

Note, I added 1.0 because if Z is 0 we'd divide by 0 and that would not give us the results we want
since we know our 'F' starts at 0.

We also need to update the code to let us set the fudgeFactor.

<pre class="prettyprint">
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

<img class="webgl_center" src="resources/orthographc-vs-perspective.png" />

There are 2 issues
So that worked but generally we don't want just a 'fudgeFactor' to decide how much to divide by Z. Instead
we want to decide on the "field of view". We can compute a fudgeFactor from an angle like this

    fudgeFactor = -Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians

Let's try it.

<iframe class="webgl_example" src="../webgl-3d-perspective-fov.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-3d-perspective-fov.html" target="_blank">click here to open in a separate window</a>

x = x * f +
    y * 0
    z * 0
    w * 0;

y = x * 0 +
    y * f +
    z * 0 +
    w * 0;

z = x * 0 +
    y * 0 +
    z * (near + far) * rangeInv
    w * (near * far * rangeInv * 2)

w = x * 0 +
    y * 0 +
    z * -1 +
    w * 0


