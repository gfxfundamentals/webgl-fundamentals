Title: WebGL Smallest Programs
Description: Smallest Code for Testing
TOC: Smallest Programs

This article assumes you've read many of the other articles
starting with [the fundamentals](webgl-fundamentals.html).
If you have not read them please start there first.

I don't really know what to file this article under because it has two
purposes.

1. Show you the smallest WebGL programs.

   These techniques are super useful for testing something or
   when making an [MCVE for Stack Overflow](https://meta.stackoverflow.com/a/349790/128511) or when trying to narrow
   down a bug.

2. Learning to think outside the box

   I hope to write several more articles on this
   to help you see the bigger picture rather than just the common patterns.
   [Here's one](webgl-drawing-without-data.html).

## Just clearing

Here's the smallest WebGL program that actually does something

```js
const gl = document.querySelector('canvas').getContext('webgl');
gl.clearColor(1, 0, 0, 1);  // red
gl.clear(gl.COLOR_BUFFER_BIT);
```

All this program does is clear the canvas to red but it did actually do something.

Think about it through. With just this you can actually test some things. Let's say
you are [rendering to a texture](webgl-render-to-texture.html) but things aren't working.
Let's say it's just like the example in [that article](webgl-render-to-texture.html).
You're rendering 1 or more 3D things into a texture then rending that result onto a cube.

You're not seeing anything. Well, as a simple test, stop rendering to the texture with
shaders are just clear the texture to a known color.

```js
gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferWithTexture)
gl.clearColor(1, 0, 1, 1);  // magenta
gl.clear(gl.COLOR_BUFFER_BIT);
```

Now render with the texture from the framebuffer. Does your cube turn magenta? If not
then your issue is not the rendering to the texture part it's something else.

## Using the `SCISSOR_TEST` and `gl.clear`

The `SCISSOR_TEST` clips both drawing and clearing to some sub rectangle of the canvas (or current framebuffer).

You enable the scissor test with

```js
gl.enable(gl.SCISSOR_TEST);
```

and then you set the scissor rectangle in pixels relative to the bottom left corner. It uses the same parameters
as `gl.viewport`.

```js
gl.scissor(x, y, width, height);
```

Using that can draw rectangles using the `SCISSOR_TEST` and `gl.clear`.

Example

```js
const gl = document.querySelector('#c').getContext('webgl');

gl.enable(gl.SCISSOR_TEST);

function drawRect(x, y, width, height, color) {
  gl.scissor(x, y, width, height);
  gl.clearColor(...color);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

for (let i = 0; i < 100; ++i) {
  const x = rand(0, 300);
  const y = rand(0, 150);
  const width = rand(0, 300 - x);
  const height = rand(0, 150 - y);
  drawRect(x, y, width, height, [rand(1), rand(1), rand(1), 1]);
}


function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}
```

{{{example url="../webgl-simple-scissor.html"}}}

Not saying that particular one is all that useful but still
it's good to know.

## Using one large `gl.POINTS`

As most of the examples show, the most common thing to do in WebGL
is create buffers. Put vertex data in those buffers. Create
shaders with attributes. Set up the attributes to pull data from
those buffers. Then draw, possibly with uniforms and texture also
used by your shaders.

But sometimes you just want to test. Let's say you want just see
something draw.

How about this set of shaders

```glsl
// vertex shader
void main() {
  gl_Position = vec4(0, 0, 0, 1);  // center
  gl_PointSize = 120.0;
}
```

```glsl
// fragment shader
precision mediump float;

void main() {
  gl_FragColor = vec4(1, 0, 0, 1);  // red
}
```

And here's the code to use it

```js
// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

gl.useProgram(program);

const offset = 0;
const count = 1;
gl.drawArrays(gl.POINTS, offset, count);
```

No buffers to create, no uniforms to setup, and we get a single
point in the middle of the canvas.

{{{example url="../webgl-simple-point.html"}}}

> NOTE: Safari pre 15 didn't pass [the WebGL Conformance Tests](https://www.khronos.org/registry/webgl/sdk/tests/conformance/rendering/point-no-attributes.html?webglVersion=1&quiet=0) for this feature.

About `gl.POINTS`: When you pass `gl.POINTS` to `gl.drawArrays` you're also
required to set `gl_PointSize` in your vertex shader to a size in pixels. It's
important to note that different GPU/Drivers have a different maximum point size
you can use. You can query that maximum size with

```
const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
```

The WebGL spec only requires a max size of 1.0. Fortunately
[most if not all GPUs and drivers support a larger size](https://webglstats.com/webgl/parameter/ALIASED_POINT_SIZE_RANGE).

After you set `gl_PointSize` then when the vertex shader exits, whatever value you set on `gl_Position` is converted
to screen/canvas space in pixels, then a square is generated around that position that is +/- gl_PointSize / 2 in all 4 directions.

Okay, I can hear you thinking so what, who wants to draw a single point.

Well, points automatically get free [texture coordinates](webgl-3d-textures.html). They are available in the fragment
shader with the special variable `gl_PointCoord`. So, let's draw a texture on that point.

First let's change the fragment shader.

```glsl
// fragment shader
precision mediump float;

+uniform sampler2D tex;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);  // red
+  gl_FragColor = texture2D(tex, gl_PointCoord.xy);
}
```

Now to keep it simple let's make a texture with raw data like we covered in
[the article on data textures](webgl-data-textures.html).

```js
// 2x2 pixel data
const pixels = new Uint8Array([
  0xFF, 0x00, 0x00, 0xFF,  // red
  0x00, 0xFF, 0x00, 0xFF,  // green
  0x00, 0x00, 0xFF, 0xFF,  // blue
  0xFF, 0x00, 0xFF, 0xFF,  // magenta
]);
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                 // level
    gl.RGBA,           // internal format
    2,                 // width
    2,                 // height
    0,                 // border
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    pixels,            // data
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

Because WebGL defaults to using texture unit 0 and because uniforms
default to 0 there is nothing else to setup

{{{example url="../webgl-simple-point-w-texture.html"}}}

This can be a great way to test texture related problems.
We're still using no buffers, no attributes, and we didn't have
to look up and set any uniforms. For example if we loaded an image,
it's not showing up. What if we try the shader above, does it
show the image on the point? We rendered to a texture and then
we want to view the texture. Normally we'd setup some geometry
via buffers and attributes but we can render the texture just
by showing it on this single point.

## Using Multiple Single `POINTS`

Another simple change to the example above. We can change the vertex
shader to this

```glsl
// vertex shader

+attribute vec4 position;

void main() {
-  gl_Position = vec4(0, 0, 0, 1);
+  gl_Position = position;
  gl_PointSize = 120.0;
}
```

attributes have a default value of `0, 0, 0, 1` so with just that
change the examples above would still continue to work. But, now
we gain the ability to set the position if we want.

```js
+const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');

...

+const numPoints = 5;
+for (let i = 0; i < numPoints; ++i) {
+  const u = i / (numPoints - 1);    // 0 to 1
+  const clipspace = u * 1.6 - 0.8;  // -0.8 to +0.8
+  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

*  const offset = 0;
*  const count = 1;
*  gl.drawArrays(gl.POINTS, offset, count);
+}
```

Before we run it lets make the point smaller

```glsl
// vertex shader

attribute vec4 position;
+uniform float size;

void main() {
  gl_Position = position;
-  gl_PointSize = 120.0;
+  gl_PointSize = 20.0;
}
```

And lets make it so we can set the color of the point.
(note: I switched back to the code without a texture).

```glsl
precision mediump float;

+uniform vec4 color;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);   // red
+  gl_FragColor = color;
}
```

and we need to lookup the color location

```js
// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
+const colorLoc = gl.getUniformLocation(program, 'color');
```

And use them

```js
gl.useProgram(program);

const numPoints = 5;
for (let i = 0; i < numPoints; ++i) {
  const u = i / (numPoints - 1);    // 0 to 1
  const clipspace = u * 1.6 - 0.8;  // -0.8 to +0.8
  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

+  gl.uniform4f(colorLoc, u, 0, 1 - u, 1);

  const offset = 0;
  const count = 1;
  gl.drawArrays(gl.POINTS, offset, count);
}
```

And now we get 5 points with 5 colors
and we still didn't have to setup any buffers or
attributes.

{{{example url="../webgl-simple-points.html"}}}

Of course this is **NOT** the way you should
draw lots of points in WebGL. If you want to draw lots
of points you should do something like setup an attribute with a position
for each point, and a color for each point and draw all the points
in a single draw call.

BUT!, for testing, for debugging, for making an [MCVE](https://meta.stackoverflow.com/a/349790/128511) it's a great way to **minimize**
the code. As another example let's say we're drawing to textures for a post processing
affect and we want to visualize them. We could just draw one large
point for each one using the combination of this example and
the previous one with a texture. No complicated step of buffers
and attributes needed, great for debugging.



