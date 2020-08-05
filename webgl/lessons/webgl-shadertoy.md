Title: WebGL Shadertoy
Description: Shadertoy shaders
TOC: Shadertoy

This article assumes you've read many of the other articles
starting with [the fundamentals](webgl-fundamentals.html).
If you have not read them please start there first. 

In [the article on the drawing without data](webgl-drawing-without-data.html)
we showed a few examples of drawing things with no data using a
vertex shader. This article will be about drawing things with
no data using fragment shaders.

We'll start with a simple solid color shader
with no math using the code [from the very first article](webgl-fundamentals.html).

A simple vertex shader

```js
const vs = `
  // an attribute will receive data from a buffer
  attribute vec4 a_position;

  // all shaders have a main function
  void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = a_position;
  }
`;
```

and a simple fragment shader 

```js
const fs = `
  precision highp float;
  void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting

    gl_FragColor = vec4(1, 0, 0.5, 1); // return reddish-purple
  }
`;
```

Then we need to compile and link the shaders and look up position attribute location.

```js
function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  // look up where the vertex data needs to go.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
```

and fill out a buffer with 2 triangles that make a rectangle in clip space that
goes from -1 to +1 in x and y to cover the canvas.

```js
  // Create a buffer to put three 2d clip space points in
  const positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // fill it with a 2 triangles that cover clip space
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  // first triangle
     1, -1,
    -1,  1,
    -1,  1,  // second triangle
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);  
```

And then we draw

```js
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(
      positionAttributeLocation,
      2,          // 2 components per iteration
      gl.FLOAT,   // the data is 32bit floats
      false,      // don't normalize the data
      0,          // 0 = move forward size * sizeof(type) each iteration to get the next position
      0,          // start at the beginning of the buffer
  );

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // offset
      6,     // num vertices to process
  );
```

And of course we get a solid color that covers the canvas.

{{{example url="../webgl-shadertoy-solid.html"}}}

In [the article on how WebGL works](webgl-how-it-works.html) we added more
color by providing a color for each vertex. In [the article on textures](webgl-3d-textures.html)
we added more color by supplying textures and texture coordinates.
So how do we get something more than a solid color with out any more data? 
WebGL provides a variable called `gl_FragCoord` that is equal to the **pixel**
coordinate of the pixel currently being drawn.

So let's change our fragment shader to use that to compute a color

```js
const fs = `
  precision highp float;
  void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting

-    gl_FragColor = vec4(1, 0, 0.5, 1); // return reddish-purple
+    gl_FragColor = vec4(fract(gl_FragCoord.xy / 50.0), 0, 1);
  }
`;
```

Like we mentioned above `gl_FragCoord` is a **pixel** coordinate so it will
count across and up the canvas. By dividing by 50 we'll get a value that goes
from 0 to 1 from as `gl_FragCoord` goes from 0 to 50. By using `fract` we'll
keep just the *fract*ional part so for example when `gl_FragCoord` is 75.
75 / 50 = 1.5, fract(1.5) = 0.5 so we'll get a value that goes from 0 to 1
every 50 pixels.

{{{example url="../webgl-shadertoy-gl-fragcoord.html"}}}

As you can see above every 50 pixels across red goes from 0 to 1
and every 50 pixels up green goes from 0 to 1.

With our setup now we could make more complex math for a fancier image.
but we have one problem in that we have no idea how large the canvas is
so we'd have to hard code for a specific size. We can solve that problem
by passing in the size of the canvas and then divide `gl_FragCoord` by
the size to give us a value that goes from 0 to 1 across and up the canvas
regardless of size.

```js
const fs = `
  precision highp float;

+  uniform vec2 u_resolution;

  void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting

-    gl_FragColor = vec4(fract(gl_FragCoord.xy / 50.0), 0, 1);
+    gl_FragColor = vec4(fract(gl_FragCoord.xy / u_resolution), 0, 1);
  }
`;
```

and look up and set the uniform

```js
// look up where the vertex data needs to go.
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

+// look up uniform locations
+const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

...

+gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

gl.drawArrays(
    gl.TRIANGLES,
    0,     // offset
    6,     // num vertices to process
);

...

```

which lets us make our spread of red and green always fit the canvas regardless
of resolution

{{{example url="../webgl-shadertoy-w-resolution.html"}}}

Let's also pass in the mouse position in pixel coordinates.

```js
const fs = `
  precision highp float;

  uniform vec2 u_resolution;
+  uniform vec2 u_mouse;

  void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting

-    gl_FragColor = vec4(fract(gl_FragCoord.xy / u_resolution), 0, 1);
:   gl_FragColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
  }
`;
```

And then we need to look up the uniform location,

```js
// look up uniform locations
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
+const mouseLocation = gl.getUniformLocation(program, "u_mouse");
```

track the mouse,

```js
let mouseX = 0;
let mouseY = 0;

function setMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // bottom is 0 in WebGL
  render();
}

canvas.addEventListener('mousemove', setMousePosition);
```

and set the uniform.

```js
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
+gl.uniform2f(mouseLocation, mouseX, mouseY);
```

We also need to change the code so we render when the mouse position changes

```js
function setMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // bottom is 0 in WebGL
+  render();
}

+function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  ...

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // offset
      6,     // num vertices to process
  );
+}
+render();
```

and while we're at it lets handle touch too

```js
canvas.addEventListener('mousemove', setMousePosition);
+canvas.addEventListener('touchstart', (e) => {
+  e.preventDefault();
+}, {passive: false});
+canvas.addEventListener('touchmove', (e) => {
+  e.preventDefault();
+  setMousePosition(e.touches[0]);
+}, {passive: false});
```

and now you can see if you move the mouse over the example it affects our image.

{{{example url="../webgl-shadertoy-w-mouse.html"}}}

The final major piece is we want to be able to animate something so we pass in one
more thing, a time value we can use to add to our computations.

For example if we did this

```js
const fs = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
+  uniform float u_time;

  void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting

-    gl_FragColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
+    gl_FragColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), fract(u_time), 1);
  }
`;
```

And now the blue channel will pulse to the time. We just need to 
look up the uniform, and set it in a [requestAnimationFrame loop](webgl-animation.html).

```js
// look up uniform locations
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const mouseLocation = gl.getUniformLocation(program, "u_mouse");
+const timeLocation = gl.getUniformLocation(program, "u_time");

...

-function render() {
+function render(time) {
+  time *= 0.001;  // convert to seconds

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  ...

  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(mouseLocation, mouseX, mouseY);
+  gl.uniform1f(timeLocation, time);

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // offset
      6,     // num vertices to process
  );

+  requestAnimationFrame(render);
+}
+requestAnimationFrame(render);
-render();
```

Also we no longer need to render on mousemove since we're rendering continuously.

```js
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // bottom is 0 in WebGL
-  render();
});
```

And we get some simple but boring animation.

{{{example url="../webgl-shadertoy-w-time.html"}}}

So now with all of that we can take a shader from [Shadertoy.com](https://shadertoy.com). Shadertoy shaders you provide a function called `mainImage` in this form

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{	
}
```

Where your job is to set `fragColor` just like you'd normally set `gl_FragColor` and
`fragCoord` is the same as `gl_FragCoord`. Adding this extra function lets Shadertoy
impose a little more structure as well as do some extra work before or after calling
`mainImage`. For us to use it we just need to call it like this

```glsl
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

//---insert shadertoy code here--

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
```

Except that Shadertoy uses the uniform names `iResolution`, `iMouse` and `iTime` so let's rename them.

```glsl
precision highp float;

-uniform vec2 u_resolution;
-uniform vec2 u_mouse;
-uniform float u_time;
+uniform vec2 iResolution;
+uniform vec2 iMouse;
+uniform float iTime;

//---insert shadertoy code here--

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
```

and look them up by the new names

```js
// look up uniform locations
-const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
-const mouseLocation = gl.getUniformLocation(program, "u_mouse");
-const timeLocation = gl.getUniformLocation(program, "u_time");
+const resolutionLocation = gl.getUniformLocation(program, "iResolution");
+const mouseLocation = gl.getUniformLocation(program, "iMouse");
+const timeLocation = gl.getUniformLocation(program, "iTime");
```

Taking [this shadertoy shader](https://www.shadertoy.com/view/3l23Rh) and pasting it
in our shader above where it says `//---insert shadertoy code here--` gives us...

{{{example url="../webgl-shadertoy.html"}}}

That's an extraordinarily beautiful image for having no data!

I made the sample above only render when the mouse is over the canvas or when touched.
This is because the math required
to draw the image above is complex and slow and letting it run continuously would
make it very difficult to interact with this page. If you have
a very fast GPU the image above might run smooth. On my laptop
though it runs slow and jerky.

This brings up an extremely important point. **The shaders on
shadertoy are not best practice**. Shadertoy is a puzzle and
a challenge of *"If I have no data and only a function that
takes very little input can I make an interesting or beautiful
image"*. It's not the way to make performant WebGL.

Take for example [this amazing shadertoy shader](https://www.shadertoy.com/view/4sS3zG) that looks like this

<div class="webgl_center"><img src="resources/shadertoy-dolphin.png" style="width: 639px;"></div>

It's beautiful but it runs at about 19 frames a second in a tiny
640x360 window on my medium powered laptop. Expand the window to fullscreen and it runs around
2 or 3 frames per second. Testing on my higher spec desktop it still only hits 45 frames per
second at 640x360 and maybe 10 fullscreen.

Compare it to this game that's also fairly beautiful and yet runs at 30 to 60 frames per second
even on lower-powered GPUs

<iframe class="webgl_center" style="width:560px; height: 360px;" src="https://www.youtube-nocookie.com/embed/7v9gZK9HqqI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

This is because the game uses best practices drawing things with textured
triangles instead of complex math.

So, please take that to heart. The examples on Shadertoy are
simply amazing in part because now you know they are made
under the extreme limit of almost no data and are complex
functions that draw pretty pictures. As such they are a thing
of wonder.

They are also a great way to learn a lot of math.
But, they are also not remotely the way you get a performant
WebGL app. So please keep that in mind.

Otherwise, if you want to run more Shadertoy shaders you'll
need to provide a few more uniforms. Here's a list of the
uniforms Shadertoy provides 

<div class="webgl_center"><table  class="tabular-data tabular-data1">
<thead><tr><td>type</td><td>name</td><td>where</td><td>description</td></tr></thead>
<tbody>
<tr><td><b>vec3</b></td><td><b>iResolution</b></td><td>image / buffer</td><td>The viewport resolution (z is pixel aspect ratio, usually 1.0)</td></tr>
<tr><td><b>float</b></td><td><b>iTime</b></td><td>image / sound / buffer</td><td>Current time in seconds</td></tr>
<tr><td><b>float</b></td><td><b>iTimeDelta</b></td><td>image / buffer</td><td>Time it takes to render a frame, in seconds</td></tr>
<tr><td><b>int</b></td><td><b>iFrame</b></td><td>image / buffer</td><td>Current frame</td></tr>
<tr><td><b>float</b></td><td><b>iFrameRate</b></td><td>image / buffer</td><td>Number of frames rendered per second</td></tr>
<tr><td><b>float</b></td><td><b>iChannelTime[4]</b></td><td>image / buffer</td><td>Time for channel (if video or sound), in seconds</td></tr>
<tr><td><b>vec3</b></td><td><b>iChannelResolution[4]</b></td><td>image / buffer / sound</td><td>Input texture resolution for each channel</td></tr>
<tr><td><b>vec4</b></td><td><b>iMouse</b></td><td>image / buffer</td><td>xy = current pixel coords (if LMB is down). zw = click pixel</td></tr>
<tr><td><b>sampler2D</b></td><td><b>iChannel{i}</b></td><td>image / buffer / sound</td><td>Sampler for input textures i</td></tr>
<tr><td><b>vec4</b></td><td><b>iDate</b></td><td>image / buffer / sound</td><td>Year, month, day, time in seconds in .xyzw</td></tr>
<tr><td><b>float</b></td><td><b>iSampleRate</b></td><td>image / buffer / sound</td><td>The sound sample rate (typically 44100)</td></tr>
</tbody></table></div>

Notice `iMouse` and `iResolution` are actually supposed to be
a `vec4` and a `vec3` respectively so you may need to adjust
those to match.

`iChannel` are textures so if the shader needs them you'll need
to provide [textures](webgl-3d-textures.html).

Shadertoy also lets you use multiple shaders to render to
offscreen textures so if a shader needs those you'll need to setup
[textures to render to](webgl-render-to-texture.html).

The "where" column indicates which uniforms are
available in which shaders. "image" is a shader
that renders to the canvas. "buffer" is a shader
that renders to an offscreen texture. "sound" is
a shader where [your shader is expected to generate
sound data into a texture](https://stackoverflow.com/questions/34859701/how-do-shadertoys-audio-shaders-work).

One last thing is some shaders on shadertoy require [WebGL2](https://webgl2fundamentals.org).

I hope this helped explain Shadertoy. It's a great site with amazing works
but is good to know what's really going on. If you want to learn more about
the techniques used in these kinds of shader 2 good resources are
[the blog of the person that created the shadertoy website]("https://www.iquilezles.org/www/index.htm) and [The Book of Shaders](https://thebookofshaders.com/) (which is a little misleading since it really only covers the kind of shaders used on shadertoy, not the kind used in performant apps and games. Still, it's a great resource!

<div class="webgl_bottombar" id="pixel-coords">
<h3>Pixel Coordinates</h3>
<p>Pixel coordinates in WebGL
are referenced by their edges. So for example if we had a canvas that was 3x2 pixels big then
the value for <code>gl_FragCoord</code> at the pixel 2
from the left and 1 from the bottom
would be 2.5, 1.5
</p>
<div class="webgl_center"><img src="resources/webgl-pixels.svg" style="width: 500px;"></div>
</div>