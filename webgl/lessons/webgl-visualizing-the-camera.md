Title: WebGL Visualizing the Camera
Description: How to draw a camera frustum
TOC: Visualizing the Camera

This article assumes you've read [the article on multiple views](webgl-multiple-views.html)
If you have not read that article please [go read it first](webgl-multiple-views.html).

This article also assumes you've read the article on
[less code more fun](webgl-less-code-more-fun.html)
as it uses the library mentioned there so as to
unclutter the example. If you don't understand
when a function named `webglUtils.setBuffersAndAttributes`
what it means to set the buffers and attributes, or when
a function named `webglUtils.setUniforms` what it means
to set uniforms, etc... then you should probably to go further back and
[read the fundamentals](webgl-fundamentals.html).

It's often useful to be able to visualize what a camera
sees, it's "frustum". This is surprisingly easy.
As pointed in the articles on [orthographic](webgl-3d-orthographic.html)
and [perspective](webgl-3d-perspective.html) projection those projection
matrices take some space and convert them into the -1 to +1 box of clip space.
Further a camera matrix is just a matrix that represents some
place and orientation in world space of the camera.

So, the first thing that should be kind of obvious. If we just
use the camera matrix to draw something we'll have an object
representing the camera. The complication is that a camera
can't see itself, but, using the techniques from
[the article on multiple views](webgl-multiple-views.html)
we can have 2 views. We'll use a different camera in each
view. The 2nd view will look at the first and so will see
be able to see this object we're drawing to represent the
camera used in the other view.

First let's make some data to represent the camera.
Let's make a cube and then let's add a cone to the end.
We're going to draw this with lines. We'll use [indices](webgl-indexed-vertices.html)
to connect the vertices.

[Cameras](webgl-3d-camera.html) view down the -Z direction
so let's put the cube and cone on the positive side with the
cone opening toward -Z

First the cube lines

```js
// create geometry for a camera
function createCameraBufferInfo(gl) {
  // first let's add a cube. It goes from 1 to 3
  // because cameras look down -Z so we want
  // the camera to start at Z = 0.
  const positions = [
    -1, -1,  1,  // cube vertices
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // cube indices
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Then let's add in the cone lines

```js
// create geometry for a camera
function createCameraBufferInfo(gl) {
  // first let's add a cube. It goes from 1 to 3
  // because cameras look down -Z so we want
  // the camera to start at Z = 0.
+  // We'll put a cone in front of this cube opening
+  // toward -Z
  const positions = [
    -1, -1,  1,  // cube vertices
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
+     0,  0,  1,  // cone tip
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // cube indices
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
+  // add cone segments
+  const numSegments = 6;
+  const coneBaseIndex = positions.length / 3; 
+  const coneTipIndex =  coneBaseIndex - 1;
+  for (let i = 0; i < numSegments; ++i) {
+    const u = i / numSegments;
+    const angle = u * Math.PI * 2;
+    const x = Math.cos(angle);
+    const y = Math.sin(angle);
+    positions.push(x, y, 0);
+    // line from tip to edge
+    indices.push(coneTipIndex, coneBaseIndex + i);
+    // line from point on edge to next point on edge
+    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
+  }
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

And then finally let's add in a scale because our F is
150 units tall and this camera is 2 to 3 units big it will
be tiny next to our F. We could scale it by multiplying in
a scale matrix when we draw it or we could scale the data
itself here.

```js
-function createCameraBufferInfo(gl) {
+function createCameraBufferInfo(gl, scale = 1) {
  // first let's add a cube. It goes from 1 to 3
  // because cameras look down -Z so we want
  // the camera to start at Z = 0.
  // We'll put a cone in front of this cube opening
  // toward -Z
  const positions = [
    -1, -1,  1,  // cube vertices
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
     0,  0,  1,  // cone tip
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // cube indices
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  // add cone segments
  const numSegments = 6;
  const coneBaseIndex = positions.length / 3; 
  const coneTipIndex =  coneBaseIndex - 1;
  for (let i = 0; i < numSegments; ++i) {
    const u = i / numSegments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, 0);
    // line from tip to edge
    indices.push(coneTipIndex, coneBaseIndex + i);
    // line from point on edge to next point on edge
    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
  }
+  positions.forEach((v, ndx) => {
+    positions[ndx] *= scale;
+  });
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Our current shader program draws with vertex colors.
Let's make another that draws with a solid color.

```html
<script id="solid-color-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;

uniform mat4 u_matrix;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
}
</script>
<!-- fragment shader -->
<script id="solid-color-fragment-shader" type="x-shader/x-fragment">
precision mediump float;

uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
</script>  
```

Now let's use those to draw one scene with a camera viewing the
other scene

```js
// setup GLSL programs
// compiles shaders, links program, looks up locations
-const programInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
+const vertexColorProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
+const solidColorProgramInfo = webglUtils.createProgramInfo(gl, ['solid-color-vertex-shader', 'solid-color-fragment-shader']);

// create buffers and fill with data for a 3D 'F'
const fBufferInfo = primitives.create3DFBufferInfo(gl);

...

+const cameraScale = 20;
+const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);

...

const settings = {
  rotation: 150,  // in degrees
+  cam1FieldOfView: 60,  // in degrees
+  cam1PosX: 0,
+  cam1PosY: 0,
+  cam1PosZ: -200,
};


function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);

  // we're going to split the view in 2
  const effectiveWidth = gl.canvas.clientWidth / 2;
  const aspect = effectiveWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // Compute a perspective projection matrix
  const perspectiveProjectionMatrix =
-      m4.perspective(fieldOfViewRadians), aspect, near, far);
+      m4.perspective(degToRad(settings.cam1FieldOfView), aspect, near, far);

  // Compute the camera's matrix using look at.
-  const cameraPosition = [0, 0, -75];
+  const cameraPosition = [
+      settings.cam1PosX, 
+      settings.cam1PosY,
+      settings.cam1PosZ,
+  ];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // center the 'F' around its origin
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // draw on the left with orthographic camera
  gl.viewport(0, 0, leftWidth, height);
  gl.scissor(0, 0, leftWidth, height);
  gl.clearColor(1, 0.8, 0.8, 1);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);

  // draw on right with perspective camera
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
  gl.scissor(leftWidth, 0, rightWidth, height);
  gl.clearColor(0.8, 0.8, 1, 1);

  // compute a second projection matrix and a second camera
+  const perspectiveProjectionMatrix2 =
+      m4.perspective(degToRad(60), aspect, near, far);
+
+  // Compute the camera's matrix using look at.
+  const cameraPosition2 = [-600, 400, -400];
+  const target2 = [0, 0, 0];
+  const cameraMatrix2 = m4.lookAt(cameraPosition2, target2, up);

-  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
+  drawScene(perspectiveProjectionMatrix2, cameraMatrix2, worldMatrix);

+  // draw object to represent first camera
+  {
+    // Make a view matrix from the 2nd camera matrix.
+    const viewMatrix = m4.inverse(cameraMatrix2);
+
+    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
+    // use the first's camera's matrix as the matrix to position
+    // the camera's representative in the scene
+    mat = m4.multiply(mat, cameraMatrix);
+
+    gl.useProgram(solidColorProgramInfo.program);
+
+    // ------ Draw the Camera Representation --------
+
+    // Setup all the needed attributes.
+    webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, cameraBufferInfo);
+
+    // Set the uniforms
+    webglUtils.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    webglUtils.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);
+  }
}
render();
```

And now we can see the camera used to render the left scene
in the scene on the right.

{{{example url="../webgl-visualize-camera.html"}}}

Let's also draw something to represent the camera's frustum.

Since the frustum represents a conversion to clip space
then we can make a cube that represents clip space
and use the inverse of the projection matrix to place it
in the scene.

First we need a clip space line cube.

```js
function createClipspaceCubeBufferInfo(gl) {
  // first let's add a cube. It goes from 1 to 3
  // because cameras look down -Z so we want
  // the camera to start at Z = 0. We'll put a
  // a cone in front of this cube opening
  // toward -Z
  const positions = [
    -1, -1, -1,  // cube vertices
     1, -1, -1,
    -1,  1, -1,
     1,  1, -1,
    -1, -1,  1,
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // cube indices
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Then we can create one and draw it

```js
const cameraScale = 20;
const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);

+const clipspaceCubeBufferInfo = createClipspaceCubeBufferInfo(gl);

...

  // draw object to represent first camera
  {
    // Make a view matrix from the camera matrix.
    const viewMatrix = m4.inverse(cameraMatrix2);

    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
    // use the first's camera's matrix as the matrix to position
    // the camera's representative in the scene
    mat = m4.multiply(mat, cameraMatrix);

    gl.useProgram(solidColorProgramInfo.program);

    // ------ Draw the Camera Representation --------

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, cameraBufferInfo);

    // Set the uniforms
    webglUtils.setUniforms(solidColorProgramInfo, {
      u_matrix: mat,
      u_color: [0, 0, 0, 1],
    });

    webglUtils.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);

+    // ----- Draw the frustum -------
+
+    mat = m4.multiply(mat, m4.inverse(perspectiveProjectionMatrix));
+
+    // Setup all the needed attributes.
+    webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, clipspaceCubeBufferInfo);
+
+    // Set the uniforms
+    webglUtils.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    webglUtils.drawBufferInfo(gl, clipspaceCubeBufferInfo, gl.LINES);
  }
}
```

Let's also make it so we can adjust the near and far settings
of the first camera

```js
const settings = {
  rotation: 150,  // in degrees
  cam1FieldOfView: 60,  // in degrees
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
+  cam1Near: 30,
+  cam1Far: 500,
};

...

  // Compute a perspective projection matrix
  const perspectiveProjectionMatrix =
      m4.perspective(degToRad(settings.cam1FieldOfView),
      aspect,
-      near,
-      far);
+      settings.cam1Near,
+      settings.cam1Far);
```

and now we can see the frustum as well

{{{example url="../webgl-visualize-camera-with-frustum.html"}}}

If you adjust the near or far planes or the field of view so they clip the F you'll
see the frustum representation matches.

Whether we use a perspective projection or an orthographic
projection for the camera on the left it will work either way
because a projection matrix always converts to clip space
so it's inverse will always take our +1 to -1 cube and warp
it appropriately.

```js
const settings = {
  rotation: 150,  // in degrees
  cam1FieldOfView: 60,  // in degrees
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
  cam1Near: 30,
  cam1Far: 500,
+  cam1Ortho: true,
+  cam1OrthoUnits: 120,
};

...

// Compute a projection matrix
const perspectiveProjectionMatrix = settings.cam1Ortho
    ? m4.orthographic(
        -settings.cam1OrthoUnits * aspect,  // left
         settings.cam1OrthoUnits * aspect,  // right
        -settings.cam1OrthoUnits,           // bottom
         settings.cam1OrthoUnits,           // top
         settings.cam1Near,
         settings.cam1Far)
    : m4.perspective(degToRad(settings.cam1FieldOfView),
        aspect,
        settings.cam1Near,
        settings.cam1Far);
```

{{{example url="../webgl-visualize-camera-with-orthographic.html"}}}

This kind of visualization should be familiar to anyone that's
used a 3D modeling package like [Blender](https://blender.org) 
or a 3D game engine with scene editing tools like [Unity](https://unity.com)
or [Godot](https://godotengine.org/).

It can also be pretty useful for debugging. 
