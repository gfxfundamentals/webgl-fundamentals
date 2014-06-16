Title: WebGL 3D - Cameras

This post is a continuation of a series of posts about WebGL.
The first <a href="webgl-fundamentals.html">started with fundamentals</a> and
the previous was about <a href="webgl-3d-perspective.html">3D perspective projection</a>.
If you haven't read those please view them first.

In the last post we had to move the F in front of the frustum because the `makePerspective`
function expects it sits at the origin (0, 0, 0) and that objects in the frustum are -zNear
to -zFar in front of it.

Moving stuff in front of the view doesn't seem the right way to go does it? In the real world
you usually move your camera to take a picture of a building.

<iframe class="webgl_example" src="resources/camera-move-camera.html?mode=0" width="400" height="300"></iframe>
<div class="webgl_center">moving the camera to the objects</div>

You don't usually move the buildings to be in front of the camera.

<iframe class="webgl_example" src="resources/camera-move-camera.html?mode=1" width="400" height="300"></iframe>
<div class="webgl_center">moving the objects to the camera</div>

But in our last post we came up with projection that requires things to be
in front of the origin on the -Z axis.  To achieve this what we want to do
is move the camera to the origin and move everything else the right amount
so it's still in the same place *relative to the camera*.

<iframe class="webgl_example" src="resources/camera-move-camera.html?mode=2" width="400" height="300"></iframe>
<div class="webgl_center">moving the objects to the view</div>

We need to effectively move the world in front of the camera.  The easiest
way to do this is to use an "inverse" matrix.  The math to compute an
inverse matrix in the general case is complex but conceptually it's easy.
The inverse is the value you'd use to negate some other value.  For
example, the inverse of 123 is -123.  The inverse of a scale matrix that
scaled by 5 would be 1/5th or 0.2.  The inverse of a matrix that rotated
30&deg; in X would be one that rotates -30&deg; in X.


Up until this point we've used translation, rotation and scale to affect
the position and orientation of our 'F'.  After multiplying all the
matrices together we have a single matrix that represents how to move the
'F' from the origin to the place, size and orientation we want it.  We can
do the same for a camera.  Once we have the matrix that tells us how to
move and rotate the camera from the origin to where we want it we can
compute its inverse which will give us a matrix that tells us how to move
and rotate everything else the opposite amount which will effectively make
it so the camera is at (0, 0, 0) and we've moved everything in front of
it.

Let's make a 3D scene with a circle of 'F's like the diagrams above.

Here's the code.

<pre class="prettyprint showlinemods">
  var numFs = 5;
  var radius = 200;

  // Compute the projection matrix
  var aspect = canvas.clientWidth / canvas.clientHeight;
  var projectionMatrix =
      makePerspective(fieldOfViewRadians, aspect, 1, 2000);

  // Draw 'F's in a circle
  for (var ii = 0; ii < numFs; ++ii) {
    var angle = ii * Math.PI * 2 / numFs;

    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    var translationMatrix = makeTranslation(x, 0, z);

    // Multiply the matrices.
    var matrix = translationMatrix;
    matrix = matrixMultiply(matrix, projectionMatrix);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
  }
</pre>

Just after we compute our projection matrix let's compute a camera that
goes around the 'F's like in the diagram above.

<pre class="prettyprint showlinemods">
  // Compute the camera's matrix
  var cameraMatrix = makeTranslation(0, 0, radius * 1.5);
  cameraMatrix = matrixMultiply(
      cameraMatrix, makeYRotation(cameraAngleRadians));
</pre>

We then compute a "view matrix" from the camera matrix.  A "view matrix"
is the matrix that moves everything the opposite of the camera effectively
making everything relative to the camera as though the camera was at the
origin (0,0,0)

<pre class="prettyprint showlinemods">
  // Make a view matrix from the camera matrix.
  var viewMatrix = makeInverse(cameraMatrix);
</pre>

Finally we need to apply the view matrix when we compute the matrix for each 'F'

<pre class="prettyprint showlinemods">
    // Multiply the matrices.
    var matrix = translationMatrix;
    matrix = matrixMultiply(matrix, viewMatrix);  // <=-- added
    matrix = matrixMultiply(matrix, projectionMatrix);
</pre>

And wahlah! A camera that goes around the circle of 'F's. Drag the `cameraAngle` slider
to move the camera around.

<iframe class="webgl_example" src="../webgl-3d-camera.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-3d-camera.html" target="_blank">click here to open in a separate window</a>

That's all fine but using rotate and translate to move a camera where you want it and point toward
what you want to see is not always easy. For example if we wanted the camera to always point
at a specific one of the 'F's it would take some pretty crazy math to compute how to rotate the
camera to point at that 'F' while it goes around the circle of 'F's.

Fortunately there's an easier way. We can just decide where we want the camera and what we want it to point at
and then compute a matrix that will put the camera there. Based on how matrices work this is surpurisingly easy.

First we need to know where we want the camera.  We'll call this the
`cameraPosition`.  Then we need to know the positon of the thing we want
to look at or aim at.  We'll call it the `target`.  If we subtract the
`target`from the `cameraPosition` we'll have a vector that points in the
direction we'd need to go from the camera to get to the target.  Let's
call it `zAxis`.  Since we know the camera points in the -Z direction we
can subtract the other way `cameraPosition - target`. We normalize the
results and copy it directly into the `z` part matrix.

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
| Zx | Zy | Zz |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
</pre></div>

This part of a matrix represents the Z axis.  In this case the Z-axis of
the camera.  Normalizing a vector means making it a vector that represents
1.0.  If you go back to <a href="webgl-2d-rotation.html">the 2D rotation article</a> where we talked about unit
circles and how thosehelped with 2D rotation, in 3D we need unit spheres
and a normalized vector represents a point on a unit sphere.

<iframe class="webgl_example" src="resources/cross-product-diagram.html?mode=0" width="400" height="300"></iframe>
<div class="webgl_center">the <span style="color:blue;">z axis</span></div>

That's not enough info though.  Just a single vector gives us a point on a
unit sphere but which orientation from that point to orient things?  We
need to fill out the other parts of the matrix.  Specificaly the X axis
and Y axis parts.  We know the in general these 3 parts are perpendicular to
each other.  We also know that "in general" we don't point the camera
straight up.  Given that, if we know which way is up, in this case (0,1,0),
We can use that and something called a "cross product" to compute the X
axis and Y axis for the matrix.

I have no idea what a cross product means in mathmatical terms.  What I do
know is that if you have 2 unit vectors and you compute the cross product
of them you'll get a vector that is perpendicular to those 2 vectors.  In
other words, if you have a vector pointing south east, and a vector
pointing up,and you compute the cross product you'll get a vector pointing
either north west or north east since those are the 2 vectors that are purpendicular
to south east and up.  Depending on which order you compute the cross product
you'll get the opposite answer.

In any case if we compute the cross product of our <span style="color: blue;">`zAxis`</span> and
<span style="color: gray;">`up`</span> we'll get the <span style="color:red;">xAxis</span> for the camera.

<iframe class="webgl_example" src="resources/cross-product-diagram.html?mode=1" width="400" height="300"></iframe>
<div class="webgl_center"><span style="color:blue;">zAxis</span> cross <span style="color:gray;">up</span> = <span style="color:red;">xAxis</span></div>

And now that we have the <span style="color:red;">`xAxis`</span> we can cross the <span style="color:blue;">`zAxis`</span> and the <span style="color:red;">`xAxis`</span>
which will give us the camera's <span style="color:green;">`yAxis`</span>

<iframe class="webgl_example" src="resources/cross-product-diagram.html?mode=2" width="400" height="300"></iframe>

Now all we have to do is plug in the 3 axes into a matrix. That gives as a
matrix that will orient something that points at the `target` from the
`cameraPosition`. We just need to add in the `position`

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
| <span style="color:red">Xx</span> | <span style="color:red">Xy</span> | <span style="color:red">Xz</span> |  0 |  <- <span style="color:red">x axis</span>
+----+----+----+----+
| <span style="color:green">Yx</span> | <span style="color:green">Yy</span> | <span style="color:green">Yz</span> |  0 |  <- <span style="color:green">y axis</span>
+----+----+----+----+
| <span style="color:blue">Zx</span> | <span style="color:blue">Zy</span> | <span style="color:blue">Zz</span> |  0 |  <- <span style="color:blue">z axis</span>
+----+----+----+----+
| Tx | Ty | Tz |  1 |  <- camera position
+----+----+----+----+
</pre></div>

Here's the code to compute the cross product of 2 vectors.

<pre class="prettyprint showlinemods">
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}
</pre>

Here's the code to subtract two vectors.

<pre class="prettyprint showlinemods">
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
</pre>

Here's the code to normalize a vector (make it into a unit vector).

<pre class="prettyprint showlinemods">
function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}
</pre>

Here's the code to compute a "lookAt" matrix.

<pre class="prettyprint showlinemods">
function makeLookAt(cameraPosition, target, up) {
  var zAxis = normalize(
      subtractVectors(cameraPosition, target));
  var xAxis = cross(up, zAxis);
  var yAxis = cross(zAxis, xAxis);

  return [
     xAxis[0], xAxis[1], xAxis[2], 0,
     yAxis[0], yAxis[1], yAxis[2], 0,
     zAxis[0], zAxis[1], zAxis[2], 0,
     cameraPosition[0],
     cameraPosition[1],
     cameraPosition[2],
     1];
}
</pre>


And here is how we might use it to make the camera point at a specific 'F' as we move it.

<pre class="prettyprint showlinemods">
  ...

  // Compute the position of the first F
  var fPosition = [radius, 0, 0];

  // Use matrix math to compute a position on the circle.
  var cameraMatrix = makeTranslation(0, 50, radius * 1.5);
  cameraMatrix = matrixMultiply(
      cameraMatrix, makeYRotation(cameraAngleRadians));

  // Get the camera's postion from the matrix we computed
  cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14]];

  var up = [0, 1, 0];

  // Compute the camera's matrix using look at.
  var cameraMatrix = makeLookAt(cameraPosition, fPosition, up);

  // Make a view matrix from the camera matrix.
  var viewMatrix = makeInverse(cameraMatrix);

  ...
</pre>

And here's the result.

<iframe class="webgl_example" src="../webgl-3d-camera-look-at.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-3d-camera-look-at.html" target="_blank">click here to open in a separate window</a>

Drag the slider and notice the camera tracks a single 'F'.

Note that you can use "lookAt" math for more than just cameras. Common uses are making a character's
head follow someone. Making a turret aim at a target. Making an object follow a path. You compute
where on the path the target is. Then you compute where on the path the target would be a few moments
in the future. Plug those 2 values into your lookAt function and you'll get a matrix that makes
your object follow the path and orient toward the path as well.

Let's <a href="webgl-animation.html">learn about animation next</a>.

<div class="webgl_bottombar">
<h3>lookAt standards</h3>
<p>Most 3D math libraries have a lookAt function. Often it is designed
specifically to make a "view matrix" and not a "camera matrix". Other words
it makes a matrix that moves everything else in front of the camera rather
than a matrix that moves the camera itself.</p>
<p>I find that less useful. As pointed out, a lookAt function has many uses. It's
easy to call inverse when you need a view matrix but if you are using lookAt
to make some character's head follow another character or some turret aim
at its target it's much more useful if lookAt returns a matrix that orients
and positions an object in world space in my opinion.
</p>
<iframe class="webgl_example" src="../webgl-3d-camera-look-at-heads.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-3d-camera-look-at-heads.html" target="_blank">click here to open in a separate window</a>
</div>



