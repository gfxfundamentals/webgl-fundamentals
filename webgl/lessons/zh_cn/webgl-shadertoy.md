Title: WebGL Shadertoy
Description: Shadertoy 着色器
TOC: Shadertoy

这篇文章假设你已经度过了很多从 [the fundamentals](webgl-fundamentals.html) 开始的其他文章。

如果你还没有读过，请先从那里开始。

在文章[无数据绘图](webgl-drawing-without-data.html)中我们展示了一些使用顶点着色器进行无数据绘图的例子。本文将介绍如何使用片元着色器进行无数据绘图。

我们将从一个简单的纯色着色器开始，没有任何数学操作，使用 [from the very first article](webgl-fundamentals.html) 的代码。

一个简单的顶点着色器

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

和一个简单的片元着色器

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

接着我们需要链接和编译着色器并且寻找位置属性的位置。

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

用 2 个三角形填充缓冲区，在剪辑空间中形成一个矩形，在 x 和 y 上从 -1 到 +1 覆盖画布。

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

然后我们绘制

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

当然我们得到了一个覆盖了画布的纯色区域。

{{{example url="../webgl-shadertoy-solid.html"}}}

在文章 [the article on how WebGL works](webgl-how-it-works.html) 我们通过给每个顶点提供颜色添加了更多颜色。在文章 [the article on textures](webgl-3d-textures.html) 中我们通过提供纹理和纹理坐标来添加更多颜色。那么在没有更多数据的情况下，我们如果获得比纯色更多的颜色呢？
WebGL 提供了一个变量叫作 `gl_FragCoord`，它等于当前正在绘制像素的**像素**坐标。

所以，让我们改变一下我们的片元着色器使用它来计算一个颜色

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

就像我们上面提到的 `gl_FragCoord` 是**像素**坐标，所以它会根据画布来计数。通过除以 50，当 `gl_FragCoord` 从 0 到 50 的时候我们会得到从 0 到 1 的值。通过使用 `fract` 我们将只保留小数部分。所以在例子中当 `gl_FragCoord` 为 75 时，75 / 50 = 1.5，fract(1.5) = 0.5。所以我们会得到一个每 50 像素从 0 到 1 的值。

{{{example url="../webgl-shadertoy-gl-fragcoord.html"}}}

如你所见，每 50 个像素红色从 0 到 1，每 50 个像素绿色从 0 到 1。

有了我们现在的设置，我们可以为更漂亮的图像进行更复杂的数学计算。但是在这里有一个问题，我们不知道 canvas 的大小，所以我们将硬编码一个特殊的大小。我们可以通过传入 canvas 的大小来解决这个问题，将 `gl_FragCoord` 除以我们给的大小，我们会得到一个从 0 到 1 的值，无论 canvas 是什么大小。

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

接着寻找并设置 uniform

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
这让我们让我们的红色和绿色的蔓延总是适合画布，而不管分辨率如何

{{{example url="../webgl-shadertoy-w-resolution.html"}}}

让我们同样以像素坐标传递鼠标位置。

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

我们需要寻找 uniform 的位置，

```js
// look up uniform locations
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
+const mouseLocation = gl.getUniformLocation(program, "u_mouse");
```

监听鼠标事件，

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

并设置 uniform。

```js
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
+gl.uniform2f(mouseLocation, mouseX, mouseY);
```

我们也需要修改代码，让我们可以在鼠标位置改变的时候渲染

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

在这里我们也处理一下触摸事件

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

现在你可以看到如果你把鼠标移到例子上它会影响我们的图像。

{{{example url="../webgl-shadertoy-w-mouse.html"}}}

最后一个主要部分是我们想要内容动起来，所以我们传递了一个东西，一个时间值，我们可以用它来添加到我们的计算中。

例如，如果我们这样做

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

现在蓝色通道会随着时间跳动。我们只需要查一下 uniform，然后在 [requestAnimationFrame loop](webgl-animation.html) 里面设置它。

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

当然我们不再需要在鼠标移动的时候渲染，因为我们是不间断渲染。

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

我们得到一个简单但是无聊的动画。

{{{example url="../webgl-shadertoy-w-time.html"}}}

所以现在有了所有这些，我们可以从 [Shadertoy.com](https://shadertoy.com) 取一个着色器。Shadertoy 着色器提供了一个名为 `mainImage` 的函数

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{	
}
```

你的工作就是设置 `fragColor`，就像你通常设置 `gl_FragColor` 一样，并且 `fragCoord` 和 `gl_FragCoord` 是相同的。添加这个额外的函数让 Shadertoy 施加更多的结构，以及在调用  `mainImage` 之前或之后做一些额外的工作。为了使用它，我们只需要这样调用它

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

除此之外 Shadertoy 使用统一名称 `iResolution`、`iMouse` 和 `iTime` 所以让我们重命名它们。

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

然后通过新名称寻找它们

```js
// look up uniform locations
-const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
-const mouseLocation = gl.getUniformLocation(program, "u_mouse");
-const timeLocation = gl.getUniformLocation(program, "u_time");
+const resolutionLocation = gl.getUniformLocation(program, "iResolution");
+const mouseLocation = gl.getUniformLocation(program, "iMouse");
+const timeLocation = gl.getUniformLocation(program, "iTime");
```

使用 [this shadertoy shader](https://www.shadertoy.com/view/3l23Rh) 并粘贴它到我们上面的着色器中 `//---insert shadertoy code here--` 的位置，我们可以得到

{{{example url="../webgl-shadertoy.html"}}}

这是一个非常漂亮的无数据的图片！

我使上面的例子只在鼠标在 canvas 上方或者触摸的时候 render。因为渲染需要的数学计算非常复杂而且很慢，如果让它持续运行使与此页面的交互变得非常困难。如果你有一个非常快的 GPU，那图片会运行的很顺滑。在我的笔记本电脑上，它运行缓慢并且不稳定。

这提出了一个极其重要的观点。**shadertoy 着色器不是最佳实践**。Shadertoy是一个谜题和挑战 *“如果我没有数据，只有一个需要很少输入的函数，我可以制作一个有趣或美丽的图像”*。这不是实现高性能 WebGL 的方法。

以 [this amazing shadertoy shader](https://www.shadertoy.com/view/4sS3zG) 为例，看起来像这样

<div class="webgl_center"><img src="resources/shadertoy-dolphin.png" style="width: 639px;"></div>

它很漂亮，但是在我的中等性能笔记本电脑上，它在一个 640x360 小窗口中运行，运行速度是 19 帧每秒。把窗口放大到全屏，它只能达到每秒 2 到 3 帧。在我更高规格的桌面上测试，在 640x360 的情况下，它仍然只能达到每秒 45 帧，全屏可能只有 10 帧。

相比之下，这款游戏也相当漂亮，即使在低功耗的gpu上也能以每秒30到60帧的速度运行

<iframe class="webgl_center" style="width:560px; height: 360px;" src="https://www.youtube-nocookie.com/embed/7v9gZK9HqqI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

这是因为这个游戏使用了最佳实践，用纹理三角形来绘制内容，而不是复杂的数学。

所以，请谨记于心。Shadertoy 上的例子令人惊叹，部分原因是你现在知道它们是在几乎没有数据的极端限制下制作的，而且是绘制漂亮图像的复杂函数。就其本身而言，它们是一个奇迹。

这也是一个很好的方式去学习很多数学知识。但是这不是你得到一个高性能 WebGL 应用程序的方式。所以请记住这一点。

如果你想运行更多的 Shadertoy 着色器，你需要提供更多的 uniform 。以下是 Shadertoy 提供的 uniform 清单

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

注意 `iMouse` 和 `iResolution` 实际上应该分别是 `vec4` 和 `vec3` 所以你可能需要调整以匹配。

`iChannel` 是纹理，如果着色器需要它们，你就需要提供 [textures](webgl-3d-textures.html)。

Shadertoy 还允许你使用多个着色器来渲染离屏纹理，所以如果着色器需要，你就需要设置 [textures to render to](webgl-render-to-texture.html)。

“where” 这一列表明了什么 uniform 可以用在什么着色器上。“image” 是渲染到画布上的着色器。“buffer” 是渲染到离屏纹理的着色器。“sound” 可以看这里 [your shader is expected to generate
sound data into a texture](https://stackoverflow.com/questions/34859701/how-do-shadertoys-audio-shaders-work)。

最后一点就是一些 shadertoy 需要 [WebGL2](https://webgl2fundamentals.org)。

我希望这对解释 Shadertoy 有帮助。这是一个很棒的网站，有令人惊叹的作品，也能很好地了解了如何实现。如果你希望学习更多关于这类着色器，有两个很好的资源 [the blog of the person that created the shadertoy website]("https://www.iquilezles.org/www/index.htm) 和 [The Book of Shaders](https://thebookofshaders.com/)(这有点误导，因为它实际上只涵盖了 shadertoy 上使用的着色器，而不是在性能应用程序和游戏中使用的着色器。尽管如此，这仍然是一个很好的资源!

<div class="webgl_bottombar" id="pixel-coords">
<h3>像素坐标</h3>
<p>在 WebGL 中像素坐标是根据边来计算的。例如我们有一个 3x2 像素大小的 canvas。那么左侧像素 2 和底部像素 1 处的<code>gl_FragCoord</code>值将为 2.5、1.5
</p>
<div class="webgl_center"><img src="resources/webgl-pixels.svg" style="width: 500px;"></div>
</div>
