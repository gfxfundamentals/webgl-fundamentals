Title: WebGL 3D - Data Textures
Description: Supplying data to a texture.
TOC: Data Textures


This post is a continuation of a series of posts about WebGL.
The first [started with fundamentals](webgl-fundamentals.html)
and the previous was about [textures](webgl-3d-textures.html).

In the last post we went over how textures work and how to apply them.
We created them from images we downloaded. In this article instead of
using an image we'll create the data in JavaScript directly.

Creating data for a texture in JavaScript is pretty straight forward.
By default, WebGL1 only supports a few types of textures

<div class="webgl_center">
  <table class="tabular-data tabular-data1">
    <thead>
      <tr><td>Format</td><td>Type</td><td>Channels</td><td>Bytes per pixel</td></tr>
    </thead>
    <tbody>
      <tr><td>RGBA</td><td>UNSIGNED_BYTE</td><td>4</td><td>4</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_BYTE</td><td>3</td><td>3</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_4_4_4_4</td><td>4</td><td>2</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_5_5_5_1</td><td>4</td><td>2</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_SHORT_5_6_5</td><td>3</td><td>2</td></tr>
      <tr><td>LUMINANCE_ALPHA</td><td>UNSIGNED_BYTE</td><td>2</td><td>2</td></tr>
      <tr><td>LUMINANCE</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
      <tr><td>ALPHA</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
    </tbody>
  </table>
</div>

Let's create a 3x2 pixel `LUMINANCE` texture. Because it's `LUMINANCE` texture
there is only 1 value per pixel and it is repeated for each R, G, and B channels.

We'll take the sample from the [last article](webgl-3d-textures.html). First we'll change
the texture coordinates to use the entire texture on each face of the cube.

```
// Fill the buffer with texture coordinates the cube.
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // front face
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        ...
```

Then we'll change the code that creates a texture

```
// Create a texture.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

-// Fill the texture with a 1x1 blue pixel.
-gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
-              new Uint8Array([0, 0, 255, 255]));

// fill texture with 3x2 pixels
const level = 0;
const internalFormat = gl.LUMINANCE;
const width = 3;
const height = 2;
const border = 0;
const format = gl.LUMINANCE;
const type = gl.UNSIGNED_BYTE;
const data = new Uint8Array([
  128,  64, 128,
    0, 192,   0,
]);
gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
              format, type, data);

// set the filtering so we don't need mips and it's not filtered
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// Asynchronously load an image
-...
```

And here's that

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

Oops! Why is this not working?!?!?

Checking the JavaScript console we see this error something like this

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```

It turns out there's a kind of obscure setting in WebGL left
over from when OpenGL was first created. Computers sometimes
go faster when data is a certain size. For example it can
be faster to copy 2, 4, or 8 bytes at a time instead of 1 a time.
WebGL defaults to using 4 bytes at a time so it expects each
row of data to be a multiple of 4 bytes (except for the last row).

Our data above is only 3 bytes per row, 6 bytes total but WebGL
is going to try to read 4 bytes for the first row and 3 bytes
for the 2nd row for a total of 7 bytes which is why it's complaining.

We can tell WebGL to deal with 1 byte at a time like this

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

Valid alignment values are 1, 2, 4, and 8.

I suspect in WebGL you will not be able to measure a difference
in speed between aligned data and un-aligned data. I wish the default
was 1 instead of 4 so this issue wouldn't bite new users but, in order
to stay compatible with OpenGL the default needed to stay the same.
That way if a ported app supplies padded rows it will work unchanged.
At the same time, in a new app you can just always set it to `1` and
then be done with it.

With that set things should be working

{{{example url="../webgl-data-texture-3x2.html" }}}

And with that covered lets move on to [rendering to a texture](webgl-render-to-texture.html).

<div class="webgl_bottombar">
<h3>Pixel vs Texel</h3>
<p>Sometimes the pixels in a texture are called texels. Pixel is short for Picture Element.
Texel is short for Texture Element.
</p>
<p>I'm sure I'll get an earful from some graphics guru but as far as I can tell "texel" is an example of jargon.
Personally I generally use "pixel" when referring to the elements of a texture without thinking about it. &#x1f607;
</p>
</div>



