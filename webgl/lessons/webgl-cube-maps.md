Title: WebGL Cubemaps
Description: How to use cubemaps in WebGL
TOC: Cubemaps

This article is part of a series of articles about WebGL.
[The first article starts with the fundamentals](webgl-fundamentals.html).
This article continues from [the article on textures](webgl-3d-textures.html).
This article also uses concepts covered in [the article on lighting](webgl-3d-lighting-directional.html).
If you have not read those articles already you might want to read them first.

In a [previous article](webgl-3d-textures.html) we covered how to use textures,
how they are referenced by texture coordinates that go from 0 to 1 across and up
the texture, and how they are filtered optionally using mips.

Another kind of texture is a *cubemap*. It consists of 6 faces representing
the 6 faces of a cube. Instead of the traditional texture coordinates that
have 2 dimensions, a cubemap uses a normal, in other words a 3D direction.
Depending on the direction the normal points one of the 6 faces of the cube
is selected and then within that face the pixels are sampled to produce a color.

The 6 faces are referenced by their direction from the center of the cube.
They are

```js
gl.TEXTURE_CUBE_MAP_POSITIVE_X
gl.TEXTURE_CUBE_MAP_NEGATIVE_X
gl.TEXTURE_CUBE_MAP_POSITIVE_Y
gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
gl.TEXTURE_CUBE_MAP_POSITIVE_Z
gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
```

Let's make a simple example, we'll use a 2D canvas to make the images used in
each of the 6 faces.

Here's some code to fill a canvas with a color and a centered message

```js
function generateFace(ctx, faceColor, textColor, text) {
  const {width, height} = ctx.canvas;
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${width * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(text, width / 2, height / 2);
}
```

And here's some code to call it to generate 6 images

```js
// Get A 2D context
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);

  // show the result
  ctx.canvas.toBlob((blob) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });
});
```

{{{example url="../webgl-cubemap-faces.html" }}}

Now let's apply that to a cube. We'll start with the code
from the texture atlas example [in the previous article](webgl-3d-textures.html).

First off let's change the shaders to use a cube map

```glsl
attribute vec4 a_position;

uniform mat4 u_matrix;

varying vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass a normal. Since the positions are
  // centered around the origin we can just 
  // pass the position
  v_normal = normalize(a_position.xyz);
}
```

We've removed the texture coordinates from the shader and
added a varying to pass a normal to the fragment shader.
Since the positions of our cube are perfectly centered around the origin
we can just use them as our normals.

Recall from [the article on lighting](webgl-3d-lighting-directional.html) that
normals are a direction and are usually used to specify the direction of
the surface of some vertex. Because we are using the normalized positions
for our normals if we were to light this we'd get smooth lighting across
the cube. For a normal cube we'd have to have different normals for each
vertex for each face.

{{{diagram url="resources/cube-normals.html" caption="standard cube normal vs this cube's normals" }}}

Since we're not using texture coordinates we can remove all code related to
setting up the texture coordinates.

In the fragment shader we need to use a `samplerCube` instead of a `sampler2D`  
and use `textureCube` instead of `texture2D`. `textureCube` takes a vec3 direction
so we pass the normalized normal. Since the normal is a varying and will be interpolated
we need to normalize it again.

```glsl
precision mediump float;

// Passed in from the vertex shader.
varying vec3 v_normal;

// The texture.
uniform samplerCube u_texture;

void main() {
   gl_FragColor = textureCube(u_texture, normalize(v_normal));
}
```

Then, in the JavaScript we need to setup the texture

```js
// Create a texture.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

// Get A 2D context
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {target, faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);
  
  // Upload the canvas to the cubemap face.
  const level = 0;
  const internalFormat = gl.RGBA;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  gl.texImage2D(target, level, internalFormat, format, type, ctx.canvas);
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

Things to notice above:

* We are using `gl.TEXTURE_CUBE_MAP` instead of `gl.TEXTURE_2D`.

  This tells WebGL to make a cube map instead of a 2D texture.

* To upload each face of the texture we use special targets.

  `gl.TEXTURE_CUBE_MAP_POSITIVE_X`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_X`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Z`, and
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Z`.

* Each face is a square. Above they are 128x128.

  Cubemaps are required to have square textures.
  And, like 2D textures if they are not a power of 2
  in both dimensions then we can't filter them or use mips.
  In this case they are a power of 2 (128) so we're
  generating mips and turning on filtering to use the mips.

And poof

{{{example url="../webgl-cubemap.html" }}}

Using a cubemap to texture a cube is **not** what cubemaps are normally
used for. The *correct* or rather standard way to texture a cube is
to use a texture atlas like we [mentioned before](webgl-3d-textures.html).

Now that we've learned what a cubemap is and how to set one up what is a cubemap
used for? Probably the single most common thing a cubemap is used for is as an
[*environment map*](webgl-environment-maps.html). 

