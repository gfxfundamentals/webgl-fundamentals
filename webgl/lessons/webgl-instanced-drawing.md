Title: WebGL Optimization - Instanced Drawing
Description: Drawing Multiple Instances of the same Object
TOC: Instanced Drawing

WebGL has a feature called *instanced drawing*.
It is basically a way to draw more than one of the
same thing faster than drawing each thing individually.

Note that the feature is an optional extension in WebGL1
but is apparently [available in pretty much all browsers and devices](https://webglstats.com/webgl/extension/ANGLE_instanced_arrays).

First let's make an example that draws multiple instances of the
same thing.

Starting with code *similar* to what we ended up with at
the end of [the article on orthographic projection](webgl-3d-orthographic.html)
we start with these 2 shaders

```html
<!-- vertex shader -->
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
uniform mat4 matrix;

void main() {
  // Multiply the position by the matrix.
  gl_Position = matrix * a_position;
}
</script>
```

and 

```html
<!-- fragment shader -->
<script id="fragment-shader-3d" type="x-shader/x-fragment">
precision mediump float;

uniform vec4 color;

void main() {
  gl_FragColor = color;
}
</script>  
```

The vertex shader multiplies each vertex by a single matrix which we
covered in [that article](webgl-3d-orthographic.html) as it is
a fairly flexible arrangement. The fragment shader just uses
a color we pass in via a uniform.

To draw we need to compile the shaders, link them together
and look up the locations of the attributes and uniforms.

```js
const program = webglUtils.createProgramFromScripts(
    gl, ['vertex-shader-3d', 'fragment-shader-3d']);

const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getUniformLocation(program, 'color');
const matrixLoc = gl.getUniformLocation(program, 'matrix');
```

Then we need to supply data for the positions via a buffer.

```js
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.1,  0.4,
    -0.1, -0.4,
     0.1, -0.4,
     0.1, -0.4,
    -0.1,  0.4,
     0.1,  0.4,
     0.4, -0.1,
    -0.4, -0.1,
    -0.4,  0.1,
    -0.4,  0.1,
     0.4, -0.1,
     0.4,  0.1,
  ]), gl.STATIC_DRAW);
const numVertices = 12;
```

Let's draw 5 instances. We'll make 5 matrices and 5 colors for
each instance.

```js
const numInstances = 5;
const matrices = [
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
];

const colors = [
  [ 1, 0, 0, 1, ],  // red
  [ 0, 1, 0, 1, ],  // green
  [ 0, 0, 1, 1, ],  // blue
  [ 1, 0, 1, 1, ],  // magenta
  [ 0, 1, 1, 1, ],  // cyan
];
```

To draw first we use the shader program, then setup the attribute,
and then loop over the 5 instances, computing a new matrix
for each one, setting the matrix uniform and color
and then drawing.

```js
function render(time) {
  time *= 0.001; // seconds

  gl.useProgram(program);

  // setup the position attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(
      positionLoc,  // location
      2,            // size (num values to pull from buffer per iteration)
      gl.FLOAT,     // type of data in buffer
      false,        // normalize
      0,            // stride (0 = compute from size and type above)
      0,            // offset in buffer
  );

  matrices.forEach((mat, ndx) => {
    m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
    m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

    const color = colors[ndx];

    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(matrixLoc, false, mat);

    gl.drawArrays(
        gl.TRIANGLES,
        0,             // offset
        numVertices,   // num vertices per instance
    );
  });

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

Note that the matrix math library takes an optional destination
matrix at the end of each matrix math function. In most articles we
haven't used this feature and just let the library allocate a new
matrix for us but this time we want the result to be stored
in the matrices we already created.

This works and we get 5 plus symbols of different colors rotating.

{{{example url="../webgl-instanced-drawing-not-instanced.html"}}}

That took 5 calls each to `gl.uniform4v`, `gl.uniformMatrix4fv`,
and `gl.drawArrays` for a total of 15 WebGL calls. If our
shaders were more complex, like the shaders in
[the article on spot lighting](webgl-3d-lighting-spot.html)
we'd have at least 7 calls per object, 6 calls to `gl.uniformXXX`
and one call to `gl.drawArrays`. If we were drawing 400 objects
that would be 2800 WebGL calls.

Instancing is a way to reduce those calls. It works by
letting you tell WebGL how many times you want the same
thing drawn (the number of instances). For each attribute
you designate if that attribute will advance to the *next value*
from its assigned buffer every time the vertex shader is
called (the default), or only every N instances where N is usually
1.

So for example instead of supplying `matrix` and `color`
from a uniform, we would instead supply them via `attribute`s.
We'd put the matrix and color for each instance in a buffer,
set up the attributes to pull data from those buffers, and
tell WebGL, only advance to the next value once per instance.

Let's do it!

The first thing we need to do is check for and enable this
optional feature of WebGL. It's called
[`ANGLE_instanced_arrays`](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays).

```js
const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
  return;
}

+const ext = gl.getExtension('ANGLE_instanced_arrays');
+if (!ext) {
+  return alert('need ANGLE_instanced_arrays');
+}
```

Next we'll change the shaders to use attributes for `matrix`
and `color` instead of uniforms.

```html
<!-- vertex shader -->
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
-uniform mat4 matrix;
+attribute vec4 color;
+attribute mat4 matrix;
+
+varying vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = matrix * a_position;

+  // Pass the vertex color to the fragment shader.
+  v_color = color;
}
</script>
```

and 

```html
<!-- fragment shader -->
<script id="fragment-shader-3d" type="x-shader/x-fragment">
precision mediump float;

-uniform vec4 color;
+// Passed in from the vertex shader.
+varying vec4 v_color;

void main() {
-  gl_FragColor = color;
+  gl_FragColor = v_color;
}
</script>  
```

attributes only work in the vertex shader so we need to
get the color from an attribute in the vertex shader
and pass it to the fragment shader via a varying.

Next we need to look up the locations of these attributes.

```js
const program = webglUtils.createProgramFromScripts(
    gl, ['vertex-shader-3d', 'fragment-shader-3d']);

const positionLoc = gl.getAttribLocation(program, 'a_position');
-const colorLoc = gl.getUniformLocation(program, 'color');
-const matrixLoc = gl.getUniformLocation(program, 'matrix');
+const colorLoc = gl.getAttribLocation(program, 'color');
+const matrixLoc = gl.getAttribLocation(program, 'matrix');
```

Now, we need a buffer hold the matrices at will get applied
to the attribute. Since a buffer is best updated in one
*chuck* we'll put all of our matrices in the same `Float32Array`

```js
// setup matrices, one per instance
const numInstances = 5;
+// make a typed array with one view per matrix
+const matrixData = new Float32Array(numInstances * 16);
```

We'll then make `Float32Array` views, one for each matrix.

```js
-const matrices = [
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-];
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
  const byteOffsetToMatrix = i * 16 * 4;
  const numFloatsForView = 16;
  matrices.push(new Float32Array(
      matrixData.buffer,
      byteOffsetToMatrix,
      numFloatsForView));
}
```

This way when we want to reference the data for all the matrices
we can use `matrixData` but when we want any individual matrix
we can use `matrices[ndx]`.

We also need to create a buffer on the GPU for this data.
We only need to allocate the buffer at this point, we don't
need to supply data so the 2nd parameter to `gl.bufferData`
is a size which just allocates the buffer.

```js
const matrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
// just allocate the buffer
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);
```

Notice we passed `gl.DYNAMIC_DRAW` as the last parameter. This is a *hint*
to WebGL that we're going to change this data often.

Next we need our colors also in a buffer. This data will not
be changing, at least in this example, so we'll just upload
the data.

```js
-const colors = [
-  [ 1, 0, 0, 1, ],  // red
-  [ 0, 1, 0, 1, ],  // green
-  [ 0, 0, 1, 1, ],  // blue
-  [ 1, 0, 1, 1, ],  // magenta
-  [ 0, 1, 1, 1, ],  // cyan
-];
+// setup colors, one per instance
+const colorBuffer = gl.createBuffer();
+gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
+gl.bufferData(gl.ARRAY_BUFFER,
+    new Float32Array([
+        1, 0, 0, 1,  // red
+        0, 1, 0, 1,  // green
+        0, 0, 1, 1,  // blue
+        1, 0, 1, 1,  // magenta
+        0, 1, 1, 1,  // cyan
+      ]),
+    gl.STATIC_DRAW);
```

At draw time instead of looping over each instance,
setting the matrix and color uniforms, and then calling draw
we'll first compute the matrix for each instance.

```js
// update all the matrices
matrices.forEach((mat, ndx) => {
  m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
  m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

-  const color = colors[ndx];
-
-  gl.uniform4fv(colorLoc, color);
-  gl.uniformMatrix4fv(matrixLoc, false, mat);
-
-  gl.drawArrays(
-      gl.TRIANGLES,
-      0,             // offset
-      numVertices,   // num vertices per instance
-  );
});
```

Because our matrix library takes an optional destination matrix
and because our matrices are just `Float32Array` views into
the same larger `Float32Array`, when we're done all the matrix
data is ready to upload to the GPU directly.

```js
// upload the new matrix data
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);
```

Now we need to set up the attributes for the matrices and colors.
The matrix attribute is a `mat4`. A `mat4` actually uses
4 attribute slots.

```js
const bytesPerMatrix = 4 * 16;
for (let i = 0; i < 4; ++i) {
  const loc = matrixLoc + i;
  gl.enableVertexAttribArray(loc);
  // note the stride and offset
  const offset = i * 16;  // 4 floats per row, 4 bytes per float
  gl.vertexAttribPointer(
      loc,              // location
      4,                // size (num values to pull from buffer per iteration)
      gl.FLOAT,         // type of data in buffer
      false,            // normalize
      bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
      offset,           // offset in buffer
  );
  // this line says this attribute only changes for each 1 instance
  ext.vertexAttribDivisorANGLE(loc, 1);
}
```

The most important point relative to instanced drawing is
the call to `ext.vertexAttribDivisorANGLE`. It sets this
attribute to only advance to the next value once per instance.
This means the `matrix` attributes will use the first matrix for
every vertex for the first instance, the second matrix for the
second instance and so on.

We also need to setup the color attribute

```js
// set attribute for color
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.enableVertexAttribArray(colorLoc);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
// this line says this attribute only changes for each 1 instance
ext.vertexAttribDivisorANGLE(colorLoc, 1);
```

It's important to remember, now that we've set the divisor
on these 2 attributes if we want to use them to draw something
else we'd need to set them back to their default of 0 **or, better**
we should use [vertex array objects](webgl-attributes.html#vaos).

Finally we can draw all instances in a single draw call.

```js
ext.drawArraysInstancedANGLE(
  gl.TRIANGLES,
  0,             // offset
  numVertices,   // num vertices per instance
  numInstances,  // num instances
);
```

{{{example url="../webgl-instanced-drawing.html"}}}

In the example above we had 3 WebGL calls per shape * 5 shapes
which were 15 calls total. We now have just 2 calls for all 5 shapes,
one to upload the matrices, another to draw.
There is a some setup for the colors and matrices to start
drawing. We could move that setup from render time to init time
by using a [vertex array object](webgl-attributes.html#vaos).

I feel like this should go without saying but I then again maybe
it's only obvious to me because I've done this too much. The code
above does not take into account the aspect of the canvas.
It does not use a [projection matrix](webgl-3d-orthographic.html)
or a [view matrix](webgl-3d-camera.html). It was meant only
to demonstrate instanced drawing. If you wanted a projection and/or
a view matrix we could add the calculation to JavaScript. That would
mean more work for JavaScript. The more obvious way would be to add
one or two more uniforms to the vertex shader.

```html
<!-- vertex shader -->
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
attribute vec4 color;
attribute mat4 matrix;
+uniform mat4 projection;
+uniform mat4 view;

varying vec4 v_color;

void main() {
  // Multiply the position by the matrix.
-  gl_Position = matrix * a_position;
+  gl_Position = projection * view * matrix * a_position;

  // Pass the vertex color to the fragment shader.
  v_color = color;
}
</script>
```

and then look up their locations at init time

```js
const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getAttribLocation(program, 'color');
const matrixLoc = gl.getAttribLocation(program, 'matrix');
+const projectionLoc = gl.getUniformLocation(program, 'projection');
+const viewLoc = gl.getUniformLocation(program, 'view');
```

and set them appropriately at render time.

```js
gl.useProgram(program);

+// set the view and projection matrices since
+// they are shared by all instances
+const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+gl.uniformMatrix4fv(projectionLoc, false,
+    m4.orthographic(-aspect, aspect, -1, 1, -1, 1));
+gl.uniformMatrix4fv(viewLoc, false, m4.zRotation(time * .1));
```

{{{example url="../webgl-instanced-drawing-projection-view.html"}}}
