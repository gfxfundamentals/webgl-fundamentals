Title: WebGL 2D Scale
Description: How to scale in 2D

This post is a continuation of a series of posts about WebGL.  The first
[started with fundamentals](webgl-fundamentals.html) and the previous was
[about rotating geometry](webgl-2d-rotation.html).

Scaling is just as [easy as translation](webgl-2d-translation.html).

We multiply the position by our desired scale.  Here are the changes from
our [previous sample](webgl-2d-rotation.html).

```
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // Scale the positon
+  vec2 scaledPosition = a_position * u_scale;

  // Rotate the position
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Add in the translation.
  vec2 position = rotatedPosition + u_translation;
```

and we add the JavaScript needed to set the scale when we draw.

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];

  ...

  // Draw the scene.
  function drawScene() {

    ...

    // Set the translation.
    gl.uniform2fv(translationLocation, translation);

    // Set the rotation.
    gl.uniform2fv(rotationLocation, rotation);

+    // Set the scale.
+    gl.uniform2fv(scaleLocation, scale);

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;  // 6 triangles in the 'F', 3 points per triangle
    gl.drawArrays(primitiveType, offset, count);
  }
```

And now we have scale. Drag the sliders.

{{{example url="../webgl-2d-geometry-scale.html" }}}

One thing to notice is that scaling by a negative value flips our
geometry.

I hope these last 3 posts were helpful in understanding
[translation](webgl-2d-translation.html),
[rotation](webgl-2d-rotation.html) and scale.  Next we'll go over [the
magic that is matrices](webgl-2d-matrices.html) that combines all 3 of
these into a much simpler and often more useful form.

<div class="webgl_bottombar">
<h3>Why an 'F'?</h3>
<p>
The first time I saw someone use an 'F' was on a texture.  The 'F' itself
is not important.  What is important is that you can tell its orientation
from any direction.  If we used a heart ❤ or a triangle △ for example we
couldn't tell if it was flipped horizontally.  A circle ○ would be even
worse.  A colored rectangle would arguably work with different colors on
each corner but then you'd have to remember which corner was which.  An
F's orientation is instantly recognizable.
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
Any shape that you can tell the orientation of would work, I've just used
'F' ever since I was 'F'irst introduced to the idea.
</p>
</div>




