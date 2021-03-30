Title: WebGL Picking
Description: How to pick things in WebGL
TOC: Picking (clicking on stuff)

This article is about how to use WebGL to let the user pick or select
things.

If you've read the other articles on this site you have hopefully realized
that WebGL itself is just a rasterization library. It draws triangles,
lines, and points into the canvas so it has no concept of "objects to be
selected". It just outputs pixels via shaders you supply. That means
any concept of "picking" something has to come from your code. You need
to define what these things you're letting the user select are.
That means while this article can cover general concepts you'll need to
decide for yourself how to translate what you see here into usable
concepts in your own application.

## Clicking on an Object

One of the easiest ways figure out which thing a user clicked on is
we come up with a numeric id for each object, we can then draw 
all of the objects using their id as their color with no lighting
and no textures. This will give us an image of the silhouettes of
each object. The depth buffer will handle sorting for us.
We can then read the color of the pixel under the
mouse which will give us the id of the object that was rendered there.

To implement this technique we'll need to combine several previous
articles. The first is the article on [drawing multiple objects](webgl-drawing-multiple-things.html)
which we'll use because given it draws multiple things we can try to
pick them.

On top of that we generally want to render these ids off screen
by [rendering to a texture](webgl-render-to-texture.html) so we'll
add in that code as well.

So, let's start with the last example from
[the article on drawing multiple things](webgl-drawing-multiple-things.html)
that draws 200 things.

To it let's add a framebuffer with attached texture and depth buffer from
the last example in [the article on rendering to a texture](webgl-render-to-texture.html).

```js
// Create a texture to render to
const targetTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, targetTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// create a depth renderbuffer
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

function setFramebufferAttachmentSizes(width, height) {
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  // define size and format of level 0
  const level = 0;
  const internalFormat = gl.RGBA;
  const border = 0;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  const data = null;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border,
                format, type, data);

  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
}

// Create and bind the framebuffer
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

// attach the texture as the first color attachment
const attachmentPoint = gl.COLOR_ATTACHMENT0;
const level = 0;
gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

// make a depth buffer and the same size as the targetTexture
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
```

We put the code to set the sizes of the texture and
the depth renderbuffer into a function so we can
call it to resize them to match the size of the
canvas.

In our rendering code if the canvas changes size
we'll adjust the texture and renderbuffer to match.

```js
function drawScene(time) {
  time *= 0.0005;

-  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
+  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
+    // the canvas was resized, make the framebuffer attachments match
+    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
+  }

...
```

Next we need a second shader. The shader in the
sample renders using vertex colors but we need
one we can set to a solid color to render with ids.
So first here is our second shader

```html
<!-- vertex shader -->
<script id="pick-vertex-shader" type="x-shader/x-vertex">
  attribute vec4 a_position;
  
  uniform mat4 u_matrix;
  
  void main() {
    // Multiply the position by the matrix.
    gl_Position = u_matrix * a_position;
  }
</script>
<!-- fragment shader -->
<script id="pick-fragment-shader" type="x-shader/x-fragment">
  precision mediump float;
  
  uniform vec4 u_id;
  
  void main() {
     gl_FragColor = u_id;
  }
</script>
```

And we need to compile, link and look up the locations
using our [helpers](webgl-less-code-more-fun.html).

```js
// setup GLSL programs
const programInfo = webglUtils.createProgramInfo(
    gl, ["3d-vertex-shader", "3d-fragment-shader"]);
+const pickingProgramInfo = webglUtils.createProgramInfo(
+    gl, ["pick-vertex-shader", "pick-fragment-shader"]);
```

We need to be able to render all the objects
twice. Once with whatever shader we assigned to
them and again with the shader we just wrote
so let's extract the code that currently renders
all the objects into a function.

```js
function drawObjects(objectsToDraw, overrideProgramInfo) {
  objectsToDraw.forEach(function(object) {
    const programInfo = overrideProgramInfo || object.programInfo;
    const bufferInfo = object.bufferInfo;

    gl.useProgram(programInfo.program);

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // Set the uniforms.
    webglUtils.setUniforms(programInfo, object.uniforms);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
  });
}
```

`drawObjects` takes an optional `overrideProgramInfo`
we can pass in to use our picking shader instead of
the object's assigned shader.

Let's call it, once to draw into the texture with
ids and again to draw the scene to the canvas.

```js
// Draw the scene.
function drawScene(time) {
  time *= 0.0005;

  ...

  // Compute the matrices for each object.
  objects.forEach(function(object) {
    object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.xRotationSpeed * time,
        object.yRotationSpeed * time);
  });

+  // ------ Draw the objects to the texture --------
+
+  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+
+  gl.enable(gl.CULL_FACE);
+  gl.enable(gl.DEPTH_TEST);
+
+  // Clear the canvas AND the depth buffer.
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+
+  drawObjects(objectsToDraw, pickingProgramInfo);
+
+  // ------ Draw the objects to the canvas
+
+  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+
+  drawObjects(objectsToDraw);

  requestAnimationFrame(drawScene);
}
```

Our picking shader needs `u_id` set to an id so let's
add that to our uniform data where we setup our objects.

```js
// Make infos for each object for each object.
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
+  const id = ii + 1;
  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
      u_matrix: m4.identity(),
+      u_id: [
+        ((id >>  0) & 0xFF) / 0xFF,
+        ((id >>  8) & 0xFF) / 0xFF,
+        ((id >> 16) & 0xFF) / 0xFF,
+        ((id >> 24) & 0xFF) / 0xFF,
+      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
  objects.push(object);
  objectsToDraw.push({
    programInfo: programInfo,
    bufferInfo: shapes[ii % shapes.length],
    uniforms: object.uniforms,
  });
}
```

This will work because our [helper library](webgl-less-code-more-fun.html)
handles applying uniforms for us.

We had to split ids across R, G, B, and A. Because our
texture's format/type is `gl.RGBA`, `gl.UNSIGNED_BYTE`
we get 8 bits per channel. 8 bits only represent 256 values
but by splitting the id across 4 channels we get 32bits total
which is > 4 billion values.

We add 1 to the id because we'll use 0 for meaning
"nothing under the mouse".

Now let's highlight the object under the mouse.

First we need some code to get a canvas relative
mouse position.

```js
// mouseX and mouseY are in CSS display space relative to canvas
let mouseX = -1;
let mouseY = -1;

...

gl.canvas.addEventListener('mousemove', (e) => {
   const rect = canvas.getBoundingClientRect();
   mouseX = e.clientX - rect.left;
   mouseY = e.clientY - rect.top;
});
```

Note that with the code above `mouseX` and `mouseY`
are in CSS pixels in display space. That means
they are in the space the canvas is displayed,
not the space of how many pixels are in the canvas.
In other words if you had a canvas like this

```html
<canvas width="11" height="22" style="width:33px; height:44px;"></canvas>
```

then `mouseX` will go from 0 to 33 across the canvas and
`mouseY` will go from 0 to 44 across the canvas. See [this](webgl-resizing-the-canvas.html)
for more info.

Now that we have a mouse position let's add some code
look up the pixel under the mouse

```js
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
const data = new Uint8Array(4);
gl.readPixels(
    pixelX,            // x
    pixelY,            // y
    1,                 // width
    1,                 // height
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    data);             // typed array to hold result
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
```

The code above that is computing `pixelX` and `pixelY` is converting
from `mouseX` and `mouseY` in display space to pixel in the canvas
space. In other words, given the example above where `mouseX` went from
0 to 33 and `mouseY` went from 0 to 44. `pixelX` will go from 0 to 11
and `pixelY` will go from 0 to 22.

In our actual code we're using our utility function `resizeCanvasToDisplaySize`
and we're making our texture the same size as the canvas so the display
size and the canvas size match but at least we're prepared for the case
where they do not match.

Now that we have an id, to actually highlight the selected object
let's change the color we're using to render it to the canvas.
The shader we were using has a `u_colorMult`
uniform we can use so if an object is under the mouse we'll look it up,
save off its `u_colorMult` value, replace it with a selection color,
and restore it.

```js
// mouseX and mouseY are in CSS display space relative to canvas
let mouseX = -1;
let mouseY = -1;
+let oldPickNdx = -1;
+let oldPickColor;
+let frameCount = 0;

// Draw the scene.
function drawScene(time) {
  time *= 0.0005;
+  ++frameCount;

  // ------ Draw the objects to the texture --------

  ...

  // ------ Figure out what pixel is under the mouse and read it

  const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
  const data = new Uint8Array(4);
  gl.readPixels(
      pixelX,            // x
      pixelY,            // y
      1,                 // width
      1,                 // height
      gl.RGBA,           // format
      gl.UNSIGNED_BYTE,  // type
      data);             // typed array to hold result
  const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

  // restore the object's color
  if (oldPickNdx >= 0) {
    const object = objects[oldPickNdx];
    object.uniforms.u_colorMult = oldPickColor;
    oldPickNdx = -1;
  }

  // highlight object under mouse
  if (id > 0) {
    const pickNdx = id - 1;
    oldPickNdx = pickNdx;
    const object = objects[pickNdx];
    oldPickColor = object.uniforms.u_colorMult;
    object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
  }

  // ------ Draw the objects to the canvas

```

And with that we should be able to move the mouse over
the scene and the object under the mouse will flash

{{{example url="../webgl-picking-w-gpu.html" }}}

One optimization we can make, we're rendering
the ids to a texture that's the same size
as the canvas. This is conceptually the easiest
thing to do.

But, we could instead just render the pixel
under the mouse. To do this we use a frustum
who's math will cover just the space for that
1 pixel.

Until now, for 3D we've been using a function called
`perspective` that takes as input a field of view, an aspect, and a
near and far value for the z-planes and makes a
perspective projection matrix that converts from the
frustum defined by those values to clip space.

Most 3D math libraries have another function called
`frustum` that takes 6 values, the left, right, top,
and bottom values for the near z-plane and then the
z-near and z-far values for the z-planes and generates
a perspective matrix defined by those values.

Using that we can generate a perspective matrix for
the one pixel under the mouse

First we compute the edges and size of what our near plane *would be*
if we were to use the `perspective` function

```js
// compute the rectangle the near plane of our frustum covers
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const top = Math.tan(fieldOfViewRadians * 0.5) * near;
const bottom = -top;
const left = aspect * bottom;
const right = aspect * top;
const width = Math.abs(right - left);
const height = Math.abs(top - bottom);
```

So `left`, `right`, `width`, and `height` are the
size and position of the near plane. Now on that
plane we can compute the size and position of the
one pixel under the mouse and pass that to the
`frustum` function to generate a projection matrix
that covers just that 1 pixel

```js
// compute the portion of the near plane covers the 1 pixel
// under the mouse.
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

const subLeft = left + pixelX * width / gl.canvas.width;
const subBottom = bottom + pixelY * height / gl.canvas.height;
const subWidth = 1 / gl.canvas.width;
const subHeight = 1 / gl.canvas.height;

// make a frustum for that 1 pixel
const projectionMatrix = m4.frustum(
    subLeft,
    subLeft + subWidth,
    subBottom,
    subBottom + subHeight,
    near,
    far);
```

To use this we need to make some changes. As it now our shader
just takes `u_matrix` which means in order to draw with a different
projection matrix we'd need to recompute the matrices for every object
twice each frame, once with our normal projection matrix for drawing
to the canvas and again for this 1 pixel projection matrix.

We can remove that responsibility from JavaScript by moving that
multiplication to the vertex shaders.

```html
<!-- vertex shader -->
<script id="3d-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;
attribute vec4 a_color;

-uniform mat4 u_matrix;
+uniform mat4 u_viewProjection;
+uniform mat4 u_world;

varying vec4 v_color;

void main() {
-  // Multiply the position by the matrix.
-  gl_Position = u_matrix * a_position;
+  // Multiply the position by the matrices
+  gl_Position = u_viewProjection * u_world * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
</script>

...

<!-- vertex shader -->
<script id="pick-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;
  
-uniform mat4 u_matrix;
+uniform mat4 u_viewProjection;
+uniform mat4 u_world;
  
void main() {
-  // Multiply the position by the matrix.
-  gl_Position = u_matrix * a_position;
+  // Multiply the position by the matrices
+  gl_Position = u_viewProjection * u_world * a_position;
}
</script>
```

Then we can make our JavaScript `viewProjectionMatrix` shared
among all the objects.

```js
const objectsToDraw = [];
const objects = [];
+const viewProjectionMatrix = m4.identity();

// Make infos for each object for each object.
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
  const id = ii + 1;
  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
-      u_matrix: m4.identity(),
+      u_world: m4.identity(),
+      u_viewProjection: viewProjectionMatrix,
      u_id: [
        ((id >>  0) & 0xFF) / 0xFF,
        ((id >>  8) & 0xFF) / 0xFF,
        ((id >> 16) & 0xFF) / 0xFF,
        ((id >> 24) & 0xFF) / 0xFF,
      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
```

And where we compute the matrices for each object we no longer need
to include the view projection matrix

```js
-function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
-  let matrix = m4.translate(viewProjectionMatrix,
+function computeMatrix(translation, xRotation, yRotation) {
+  let matrix = m4.translation(
      translation[0],
      translation[1],
      translation[2]);
  matrix = m4.xRotate(matrix, xRotation);
  return m4.yRotate(matrix, yRotation);
}
...

// Compute the matrices for each object.
objects.forEach(function(object) {
  object.uniforms.u_world = computeMatrix(
-      viewProjectionMatrix,
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});
```

We'll create just a 1x1 pixel texture and depth buffer

```js
setFramebufferAttachmentSizes(1, 1);

...

// Draw the scene.
function drawScene(time) {
  time *= 0.0005;
  ++frameCount;

-  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
-    // the canvas was resized, make the framebuffer attachments match
-    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
-  }
+  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
```

Then before rendering the off screen ids we'll set the view projection
using our 1 pixel projection matrix and then when drawing to the canvas
we'll use the original projection matrix

```js
-// Compute the projection matrix
-const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
-const projectionMatrix =
-    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

// Compute the camera's matrix using look at.
const cameraPosition = [0, 0, 100];
const target = [0, 0, 0];
const up = [0, 1, 0];
const cameraMatrix = m4.lookAt(cameraPosition, target, up);

// Make a view matrix from the camera matrix.
const viewMatrix = m4.inverse(cameraMatrix);

-const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

// Compute the matrices for each object.
objects.forEach(function(object) {
  object.uniforms.u_world = computeMatrix(
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});

// ------ Draw the objects to the texture --------

// Figure out what pixel is under the mouse and setup
// a frustum to render just that pixel

{
  // compute the rectangle the near plane of our frustum covers
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const top = Math.tan(fieldOfViewRadians * 0.5) * near;
  const bottom = -top;
  const left = aspect * bottom;
  const right = aspect * top;
  const width = Math.abs(right - left);
  const height = Math.abs(top - bottom);

  // compute the portion of the near plane covers the 1 pixel
  // under the mouse.
  const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

  const subLeft = left + pixelX * width / gl.canvas.width;
  const subBottom = bottom + pixelY * height / gl.canvas.height;
  const subWidth = 1 / gl.canvas.width;
  const subHeight = 1 / gl.canvas.height;

  // make a frustum for that 1 pixel
  const projectionMatrix = m4.frustum(
      subLeft,
      subLeft + subWidth,
      subBottom,
      subBottom + subHeight,
      near,
      far);
+  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
}

gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.viewport(0, 0, 1, 1);

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

// Clear the canvas AND the depth buffer.
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

drawObjects(objectsToDraw, pickingProgramInfo);

// read the 1 pixel
-const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
-const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
const data = new Uint8Array(4);
gl.readPixels(
-    pixelX,            // x
-    pixelY,            // y
+    0,                 // x
+    0,                 // y
    1,                 // width
    1,                 // height
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    data);             // typed array to hold result
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

// restore the object's color
if (oldPickNdx >= 0) {
  const object = objects[oldPickNdx];
  object.uniforms.u_colorMult = oldPickColor;
  oldPickNdx = -1;
}

// highlight object under mouse
if (id > 0) {
  const pickNdx = id - 1;
  oldPickNdx = pickNdx;
  const object = objects[pickNdx];
  oldPickColor = object.uniforms.u_colorMult;
  object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
}

// ------ Draw the objects to the canvas

+{
+  // Compute the projection matrix
+  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+  const projectionMatrix =
+      m4.perspective(fieldOfViewRadians, aspect, near, far);
+
+  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
+}

gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

drawObjects(objectsToDraw);
```

And you can see the math works, we're only drawing a single pixel
and we're still figuring out what is under the mouse

{{{example url="../webgl-picking-w-gpu-1pixel.html"}}}


