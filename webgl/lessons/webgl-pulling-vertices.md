Title: WebGL Pulling Vertices
Description: Using independent indices
TOC: Pulling Vertices

This article assumes you've read many of the other articles
starting with [the fundamentals](webgl-fundamentals.html).
If you have not read them please start there first.

Traditionally, WebGL apps put geometry data in buffers.
They then use attributes to automatically supply vertex data from those buffers
to the vertex shader where the programmer provides code to convert them to clip space.

The word **traditionally** is important. It's only a **tradition**
to do it this way. It is in no way a requirement. WebGL doesn't
care how we do it, it only cares that our vertex shaders
assign clip space coordinates to `gl_Position`.

Let's draw a texture mapped cube using code like the examples in [the article on textures](webgl-3d-textures.html). 
We're told we need at least 24 unique vertices. This is because even though there are only 8 corner
positions the same corner gets used on 3 different faces of the
cube and each face needs different texture coordinates.

<div class="webgl_center"><img src="resources/cube-vertices-uv.svg" style="width: 400px;"></div>

In the diagram above we can see that the left face's use of corner 3 needs
texture coordinates 1,1 but the right face's use of corner 3 needs texture coordinates
0,1. The top face would need different texture coordinates as well.

This is usually accomplished by expanding from 8 corner positions
to 24 vertices

```js
  // front
  { pos: [-1, -1,  1], uv: [0, 1], }, // 0
  { pos: [ 1, -1,  1], uv: [1, 1], }, // 1
  { pos: [-1,  1,  1], uv: [0, 0], }, // 2
  { pos: [ 1,  1,  1], uv: [1, 0], }, // 3
  // right
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 4
  { pos: [ 1, -1, -1], uv: [1, 1], }, // 5
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 6
  { pos: [ 1,  1, -1], uv: [1, 0], }, // 7
  // back
  { pos: [ 1, -1, -1], uv: [0, 1], }, // 8
  { pos: [-1, -1, -1], uv: [1, 1], }, // 9
  { pos: [ 1,  1, -1], uv: [0, 0], }, // 10
  { pos: [-1,  1, -1], uv: [1, 0], }, // 11
  // left
  { pos: [-1, -1, -1], uv: [0, 1], }, // 12
  { pos: [-1, -1,  1], uv: [1, 1], }, // 13
  { pos: [-1,  1, -1], uv: [0, 0], }, // 14
  { pos: [-1,  1,  1], uv: [1, 0], }, // 15
  // top
  { pos: [ 1,  1, -1], uv: [0, 1], }, // 16
  { pos: [-1,  1, -1], uv: [1, 1], }, // 17
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 18
  { pos: [-1,  1,  1], uv: [1, 0], }, // 19
  // bottom
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 20
  { pos: [-1, -1,  1], uv: [1, 1], }, // 21
  { pos: [ 1, -1, -1], uv: [0, 0], }, // 22
  { pos: [-1, -1, -1], uv: [1, 0], }, // 23
```

Those positions and texture coordinates are
put into buffers and provided to the vertex shader
via attributes.

But do we really need to do it this way? What if
we wanted to actually have just the 8 corners
and 4 texture coordinates. Something like

```js
positions = [
  -1, -1,  1,  // 0
   1, -1,  1,  // 1
  -1,  1,  1,  // 2
   1,  1,  1,  // 3
  -1, -1, -1,  // 4
   1, -1, -1,  // 5
  -1,  1, -1,  // 6
   1,  1, -1,  // 7
];
uvs = [
  0, 0,  // 0
  1, 0,  // 1
  0, 1,  // 2
  1, 1,  // 3
];
```

And then for each of the 24 vertices we'd specify which of those
to use.

```js
positionIndexUVIndex = [
  // front
  0, 1, // 0
  1, 3, // 1
  2, 0, // 2
  3, 2, // 3
  // right
  1, 1, // 4
  5, 3, // 5
  3, 0, // 6
  7, 2, // 7
  // back
  5, 1, // 8
  4, 3, // 9
  7, 0, // 10
  6, 2, // 11
  // left
  4, 1, // 12
  0, 3, // 13
  6, 0, // 14
  2, 2, // 15
  // top
  7, 1, // 16
  6, 3, // 17
  3, 0, // 18
  2, 2, // 19
  // bottom
  1, 1, // 20
  0, 3, // 21
  5, 0, // 22
  4, 2, // 23
];
```

Could we use this on the GPU? Why not!?

We'll upload the positions and texture coordinates
each to their own textures. First we'll check for and enable
floating point textures as this will make it easy
to put our positions in the texture. Otherwise
we'd need to encode them in some other way.

```js
const gl = canvas.getContext("webgl");
if (!gl) {
  return;
}
+const ext = gl.getExtension('OES_texture_float');
+if (!ext) {
+  alert('need OES_texture_float');
+  return;
+}
```

Then we'll put the data into a textures like
we covered in [the article on data textures](webgl-data-textures.html).

```js
function makeDataTexture(gl, data, numComponents) {
  // expand the data to 4 values per pixel.
  const numElements = data.length / numComponents;
  const expandedData = new Float32Array(numElements * 4);
  for (let i = 0; i < numElements; ++i) {
    const srcOff = i * numComponents;
    const dstOff = i * 4;
    for (let j = 0; j < numComponents; ++j) {
      expandedData[dstOff + j] = data[srcOff + j];
    }
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,            // mip level
      gl.RGBA,      // format
      numElements,  // width
      1,            // height
      0,            // border
      gl.RGBA,      // format
      gl.FLOAT,     // type
      expandedData,
  );
  // make it possible to use a non-power-of-2 texture and
  // we don't need any filtering
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

const positionTexture = makeDataTexture(gl, positions, 3);
const texcoordTexture = makeDataTexture(gl, uvs, 2);
```

Since textures have up to 4 values per pixel `makeDataTexture`
expands whatever data we give it to 4 values per pixel. 

Next we need up load the position and texcoord indices to a buffer.

```js
// Create a buffer for the position and UV indices
const positionIndexUVIndexBuffer = gl.createBuffer();
// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, positionIndexUVIndexBuffer);
// Put the position and texcoord indices in the buffer
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionIndexUVIndex), gl.STATIC_DRAW);
```

Even though we only need 24 vertices we still need draw 6 faces, 12 triangles
each, 3 vertices per triangle for 36 vertices. To tell it which 6 vertices
to use for each face we'll use [vertex indices](webgl-indexed-vertices.html).

```js
const indices = [
   0,  1,  2,   2,  1,  3,  // front
   4,  5,  6,   6,  5,  7,  // right
   8,  9, 10,  10,  9, 11,  // back
  12, 13, 14,  14, 13, 15,  // left
  16, 17, 18,  18, 17, 19,  // top
  20, 21, 22,  22, 21, 23,  // bottom
];
// Create an index buffer
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
// Put the indices in the buffer
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
```

As we want to draw an image on the cube itself we need a 3rd texture
with that image. Let's just make another 4x4 data texture with a checkerboard.
We'll use `gl.LUMINANCE` as the format since then we only need one byte per pixel.

```js
// Create a checker texture.
const checkerTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// Fill the texture with a 4x4 gray checkerboard.
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    4,
    4,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      0xDD, 0x99, 0xDD, 0xAA,
      0x88, 0xCC, 0x88, 0xDD,
      0xCC, 0x88, 0xCC, 0xAA,
      0x88, 0xCC, 0x88, 0xCC,
    ]),
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

On to the vertex shader... We can look up a pixel from the texture like
this

```glsl
vec4 texelFetch(sampler2D tex, vec2 texSize, vec2 pixelCoord) {
  vec2 uv = (pixelCoord + 0.5) / texSize;
  return texture2D(tex, uv);
}
```

So given an integer pixel coordinate and the size of the texture in pixels the
code above will pull out a pixel value. If you're curious why the `+ 0.5` see [the
article on skinning](webgl-skinning.html).

Using the `texelFetch` function we can take a 1D array index
and lookup a value out of a 2D texture like this

```glsl
vec4 getValueByIndexFromTexture(sampler2D tex, vec2 texSize, float index) {
  float col = mod(index, texSize.x);
  float row = floor(index / texSize.x);
  return texelFetch(tex, texSize, vec2(col, row));
}
```

So given those 2 functions here is our shader

```glsl
attribute vec2 positionAndTexcoordIndices;

uniform sampler2D positionTexture;
uniform vec2 positionTextureSize;
uniform sampler2D texcoordTexture;
uniform vec2 texcoordTextureSize;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

vec4 texelFetch(sampler2D tex, vec2 texSize, vec2 pixelCoord) {
  vec2 uv = (pixelCoord + 0.5) / texSize;
  return texture2D(tex, uv);
} 

vec4 getValueByIndexFromTexture(sampler2D tex, vec2 texSize, float index) {
  float col = mod(index, texSize.x);
  float row = floor(index / texSize.x);
  return texelFetch(tex, texSize, vec2(col, row));
}

void main() {
  float positionIndex = positionAndTexcoordIndices.x;
  vec3 position = getValueByIndexFromTexture(
      positionTexture, positionTextureSize, positionIndex).xyz;
 
  // Multiply the position by the matrix.
  gl_Position = u_matrix * vec4(position, 1);

  float texcoordIndex = positionAndTexcoordIndices.y;
  vec2 texcoord = getValueByIndexFromTexture(
      texcoordTexture, texcoordTextureSize, texcoordIndex).xy;

  // Pass the texcoord to the fragment shader.
  v_texcoord = texcoord;
}
```

At the bottom it's effectively the same shader we used
in [the article on textures](webgl-3d-textures.html).
We multiply a `position` by `u_matrix` and we output
a texcoord to `v_texcoord` to pass on the fragment shader.

The difference is only in how we get the position and
texcoord. We're using the indices passed in and getting
those values from their respective textures.

To use the shader we need to lookup all the locations

```js
// setup GLSL program
const program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

+// look up where the vertex data needs to go.
+const posTexIndexLoc = gl.getAttribLocation(
+    program, "positionAndTexcoordIndices");
+
+// lookup uniforms
+const matrixLoc = gl.getUniformLocation(program, "u_matrix");
+const positionTexLoc = gl.getUniformLocation(program, "positionTexture");
+const positionTexSizeLoc = gl.getUniformLocation(program, "positionTextureSize");
+const texcoordTexLoc = gl.getUniformLocation(program, "texcoordTexture");
+const texcoordTexSizeLoc = gl.getUniformLocation(program, "texcoordTextureSize");
+const u_textureLoc = gl.getUniformLocation(program, "u_texture");
```

At render time we setup the attributes

```js
// Tell it to use our program (pair of shaders)
gl.useProgram(program);

+// Bind the positionIndexUVIndex buffer.
+gl.bindBuffer(gl.ARRAY_BUFFER, positionIndexUVIndexBuffer);
+
+// Turn on the position index attribute
+gl.enableVertexAttribArray(posTexIndexLoc);
+
+// Tell the position/texcoord index attribute how to get data out
+// of positionIndexUVIndexBuffer (ARRAY_BUFFER)
+{
+  const size = 2;          // 2 components per iteration
+  const type = gl.FLOAT;   // the data is 32bit floats
+  const normalize = false; // don't normalize the data
+  const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
+  const offset = 0;        // start at the beginning of the buffer
+  gl.vertexAttribPointer(
+    posTexIndexLoc, size, type, normalize, stride, offset);
+}
```

Note the size is 2, since there is 1 position index and 1 texcoord
index per vertex.

We then setup our vertex indices

```js
// Set our indices
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
```

Then we need to bind all 3 textures and setup all the
uniforms

```js
// Set the matrix.
gl.uniformMatrix4fv(matrixLoc, false, matrix);

// put the position texture on texture unit 0
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, positionTexture);
// Tell the shader to use texture unit 0 for positionTexture
gl.uniform1i(positionTexLoc, 0);
// Tell the shader the size of the position texture
gl.uniform2f(positionTexSizeLoc, positions.length / 3, 1);

// put the texcoord texture on texture unit 1
gl.activeTexture(gl.TEXTURE0 + 1);
gl.bindTexture(gl.TEXTURE_2D, texcoordTexture);
// Tell the shader to use texture unit 1 for texcoordTexture
gl.uniform1i(texcoordTexLoc, 1);
// Tell the shader the size of the texcoord texture
gl.uniform2f(texcoordTexSizeLoc, uvs.length / 2, 1);

// put the checkerboard texture on texture unit 2
gl.activeTexture(gl.TEXTURE0 + 2);
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// Tell the shader to use texture unit 2 for u_texture
gl.uniform1i(u_textureLoc, 2);
```

And finally draw

```js
// Draw the geometry.
gl.drawElements(gl.TRIANGLES, 6 * 6, gl.UNSIGNED_SHORT, 0);
```

And we get a textured cube using only 8 positions and
4 texture coordinates

{{{example url="../webgl-pulling-vertices.html"}}}

Some things to note. The code is lazy and uses 1D
textures for the positions and texture coordinates.
Textures can only be so wide. [How wide is machine
specific](https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE) which you can query with 

```js
const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
```

If we wanted to handle more data than that we'd need
to pick some texture size that fits our data, and spread
the data across multiple rows possibly
padding the last row to make a rectangle.

Another thing we're doing here is using 2 textures,
one for positions, one for texture coordinates.
There is no reason we couldn't put both data in the
same texture either interleaved

    pos,uv,pos,uv,pos,uv...

or in different places in the texture

    pos,pos,pos,...
    uv, uv, uv,...

We'd just have to change the math in the vertex shader
that computes how to pull them out of the texture.

The question comes up, should you do things like this?
The answer is "it depends". Depending on the GPU this
might be slower than the more traditional way.

The point of this article was to point out yet again,
WebGL doesn't care how you set `gl_Position` with
clip space coordinates nor does it care how you set
`gl_FragColor`. All it cares is that you set them.
Textures are really just 2D arrays of random access
data.

When you have a problem you want to solve in WebGL
remember that WebGL just runs shaders and those shaders
have access to data via uniforms (global variables),
attributes (data that comes per vertex shader iteration),
and textures (random access 2D arrays). Don't let the
traditional ways of using WebGL prevent you from
seeing the real flexibility that's there.

<div class="webgl_bottombar">
<h3>Why is it called Vertex Pulling?</h3>
<p>I'd actually only heard the term recently (July 2019)
even though I'd used the technique before. It comes
from <a href='https://www.google.com/search?q=OpenGL+Insights+"Programmable+Vertex+Pulling"+article+by+Daniel+Rakos'>OpenGL Insights "Programmable Vertex Pulling" article by Daniel Rakos</a>.
</p>
<p>It's called vertex *pulling* since it's the vertex shader
that decides which vertex data to read vs the traditional way where
vertex data is supplied automatically via attributes. Effectively
the vertex shader is *pulling* data out of memory.</p>
</div>
