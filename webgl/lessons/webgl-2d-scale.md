Title: WebGL 2D Scale

This post is a continuation of a series of posts about WebGL. The first <a href="webgl-fundamentals.html">started with fundamentals</a> and the previous was <a href="webgl-2d-rotation.html">about rotating geometry</a>.

Scaling is just as <a href="webgl-2d-translation.html">easy as translation</a>.
<!--more-->
We multiply the position by our desired scale. Here's are the changes from our <a href="webgl-2d-rotation.html">previous sample</a>.

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
</pre>

and we add the JavaScript needed to set the scale when we draw.

<pre class="prettyprint showlinemods">
  ...
  var scaleLocation = gl.getUniformLocation(program, "u_scale");
  ...
  var scale = [1, 1];
  ...
  // Draw the scene.
  function drawScene() {
    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set the translation.
    gl.uniform2fv(translationLocation, translation);

    // Set the rotation.
    gl.uniform2fv(rotationLocation, rotation);

    // Set the scale.
    gl.uniform2fv(scaleLocation, scale);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 18);
  }
</pre>

And now we have scale. Drag the sliders.

<iframe class="webgl_example" src="../webgl-2d-geometry-scale.html" width="400" height="300"></iframe>
<a class="webgl_center" href="../webgl-2d-geometry-scale.html" target="_blank">click here to open in a separate window</a>

One thing to notice is that scaling by a negative value flips our geometry.

I hope these last 3 posts were helpful in understanding <a href="webgl-2d-translation.html">translation</a>, <a href="webgl-2d-rotation.html">rotation</a> and scale. Next we'll go over <a href="webgl-2d-matrices.html">the magic that is matrices</a> that combine all 3 of these into a much simpler and often more useful form.

<div class="webgl_bottombar">
<h3>Why an 'F'?</h3>
<p>
The first time I saw someone use a 'F' was on a texture. The 'F' itself is not important. What is important is that you can tell its orientation from any direction. If we used a heart ? or a triangle △ for example we couldn't tell if it was flipped horizontally. A circle ○ would be even worse. A colored rectangle would arguably work with different colors on each corner but then you'd have to remember which corner was which. An F's orientation is instantly recognizable. 
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
Any shape that you can tell the orientation of would work, I've just used 'F' ever since I was 'F'irst introduced to the idea.
</p>
</div>




