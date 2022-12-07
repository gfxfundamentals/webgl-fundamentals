Title: WebGL 中的无数据绘图
Description: 创造性编程 - 无数据绘图
TOC: 无数据绘图

本文假设你已经阅读了从[基础概念](webgl-fundamentals.html)开始的很多文章。
如果你还没有阅读过他们，请先从那里开始。

在关于[最小的 WebGL 程序](webgl-smallest-programs.html)的文章中，
我们介绍了一些用极少的代码进行绘图的例子。
在这篇文章中，我们将讨论没有数据的绘图。

传统上, WebGL 应用将几何数据放入缓冲区。
然后它使用 attribute 将顶点数据从这些缓冲区拉到到着色器中，并将它们转换为裁剪空间。

**传统** 一词十分重要。上述只是绘图的**传统方式**。它绝不是必须要求。
WebGL 不在乎我们怎么做，它只关心我们的顶点着色器将裁剪空间下的坐标转换到`gl_Position`。

所以，现在让我们只提供计数给 attribute，而不是顶点位置。

```js
const numVerts = 20;
const vertexIds = new Float32Array(numVerts);
vertexIds.forEach((v, i) => {
  vertexIds[i] = i;
});

const idBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexIds, gl.STATIC_DRAW);
```

现在让我们编写顶点着色器，基于上面的计数来绘制一个顶点组成的圆。

```glsl
attribute float vertexId;
uniform float numVerts;

#define PI radians(180.0)

void main() {
  float u = vertexId / numVerts;      // 取值 0 到 1
  float angle = u * PI * 2.0;         // 取值 0 到 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

  gl_Position = vec4(pos, 0, 1);
  gl_PointSize = 5.0;
}
```

上面的代码应该是非常明了的。
`vertexId`将从 0 计数到`numVerts`。
在此基础上，我们为圆生成顶点位置。

如果我们停在这里，这个圆将是个椭圆，因为裁剪空间是标准化分布(从-1 到 1)到画布。
如果我们传递了分辨率，就会考虑到投影空间的-1 到 1 覆盖范围与画布上的-1 到 1 并不相同。

```glsl
attribute float vertexId;
uniform float numVerts;
+uniform vec2 resolution;

#define PI radians(180.0)

void main() {
  float u = vertexId / numVerts;      // 取值 0 到 1
  float angle = u * PI * 2.0;         // 取值 0 到 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

+  float aspect = resolution.y / resolution.x;
+  vec2 scale = vec2(aspect, 1);

+  gl_Position = vec4(pos * scale, 0, 1);
  gl_PointSize = 5.0;
}
```

而我们的片段着色器可以只输出单一颜色。

```glsl
precision mediump float;

void main() {
  gl_FragColor = vec4(1, 0, 0, 1);
}
```

在我们 Javascript 代码的初始化阶段，我们将编译着色器并查找 attribuites 和 uniforms。

```js
// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const vertexIdLoc = gl.getAttribLocation(program, "vertexId");
const numVertsLoc = gl.getUniformLocation(program, "numVerts");
const resolutionLoc = gl.getUniformLocation(program, "resolution");
```

而为了渲染，我们将使用该程序，用顶点 id 设置我们的一个 attribute。
设置 "resolution "和 "numVerts "的 uniform，最后画出这些点。

```js
gl.useProgram(program);

{
  // 启用 attribute
  gl.enableVertexAttribArray(vertexIdLoc);

  // 绑定缓冲区 idBuffer .
  gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);

  // 告诉attribute如何从idBuffer中提取数据 (ARRAY_BUFFER)
  const size = 1; // 每个指针有一个数据
  const type = gl.FLOAT; // 数据类型 32bit floats
  const normalize = false; // 不要归一化数据
  const stride = 0; // 0 = 每次迭代都向前移动大小 size * sizeof(type)，以获得下一个位置。
  const offset = 0; // 缓冲区读取数据的起点位置
  gl.vertexAttribPointer(vertexIdLoc, size, type, normalize, stride, offset);
}

// 告知着色器顶点数量
gl.uniform1f(numVertsLoc, numVerts);
// 告知着色器分辨率
gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

const offset = 0;
gl.drawArrays(gl.POINTS, offset, numVerts);
```

然后我们得到组成一个圆所需的点。

{{{example url="../webgl-no-data-point-circle.html"}}}

这一技术有用吗？用一些创造性的代码，我们几乎不需要数据，
只需调用一次绘制请求就可以做出一个星空或简单的雨景。

让我们做一个雨景的效果，看看它是否有效。首先，我们将顶点着色器改为：

```glsl
attribute float vertexId;
uniform float numVerts;
uniform float time;

void main() {
  float u = vertexId / numVerts;          // 取值 0 到 1
  float x = u * 2.0 - 1.0;                // -1 到 1
  float y = fract(time + u) * -2.0 + 1.0; // 1.0 -> -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 5.0;
}
```

在这种情况下，我们不需要分辨率。

我们添加了名为"time"的 unifrom，它代表页面加载后经过的秒数。

对于'x'，我们只让他从-1 到 1。

对于'y'，我们使用`time + u`，但`fract`只返回小数部分，所以是一个从 0.0 到 1.0 的值。
通过把他扩展到 1.0 到-1.0，我们得到一个往复的 y ，而每个点的偏移是不同的。

让我们把片段着色器中的颜色改为蓝色：

```glsl
precision mediump float;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);
+  gl_FragColor = vec4(0, 0, 1, 1);
}
```

然后在 JavaScript 中，我们需要查找时间的 uniform

```js
// 准备GLSL程序
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const vertexIdLoc = gl.getAttribLocation(program, 'vertexId');
const numVertsLoc = gl.getUniformLocation(program, 'numVerts');
-const resolutionLoc = gl.getUniformLocation(program, 'resolution');
+const timeLoc = gl.getUniformLocation(program, 'time');
```

然后我们需要通过创建一个渲染循环并设置`time`uniform 将代码转换为[动画](webgl-animation.html)。

```js
+function render(time) {
+  time *= 0.001;  // 转换到秒

+  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  {
      // 启用 attribute
    gl.enableVertexAttribArray(vertexIdLoc);

    // 绑定缓冲区 idBuffer .
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);

    // 告诉attribute如何从idBuffer中提取数据 (ARRAY_BUFFER)
    const size = 1; // 每个指针有一个数据
    const type = gl.FLOAT; // 数据类型 32bit floats
    const normalize = false; // 不要归一化数据
    const stride = 0; // 0 = 每次迭代都向前移动大小 size * sizeof(type)，以获得下一个位置。
    const offset = 0; // 缓冲区读取数据的起点位置

    gl.vertexAttribPointer(
        vertexIdLoc, size, type, normalize, stride, offset);
  }

  // 告知着色器顶点数量
  gl.uniform1f(numVertsLoc, numVerts);
+  // 告知着色器时间
+  gl.uniform1f(timeLoc, time);

  const offset = 0;
  gl.drawArrays(gl.POINTS, offset, numVerts);

+  requestAnimationFrame(render);
+}
+requestAnimationFrame(render);
```

{{{example url="../webgl-no-data-point-rain-linear.html"}}}

我们得到了屏幕上下落的点，但它们都是顺序的。我们需要增加一些随机性。
在 GLSL 中没有随机数发生器。相反，我们可以使用一个函数来生成一些看上去足够随机的数据。

这是一个：

```glsl
// 哈希函数来自 https://www.shadertoy.com/view/4djSRW
// 提供一个 0 到 1 的值
// 返回一个 0 到 1 内看似随机的值
float hash(float p) {
  vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
  p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
  return fract(p2.x * p2.y * 95.4337);
}
```

我们可以像这样使用

```glsl
void main() {
  float u = vertexId / numVerts;          // 取值 0 到 1
-  float x = u * 2.0 - 1.0;                // -1 到 1
+  float x = hash(u) * 2.0 - 1.0;          // 随机位置
  float y = fract(time + u) * -2.0 + 1.0; // 1.0 ->  -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 5.0;
}
```

我们把之前的 0 到 1 的值传给`hash`，它就会给我们一个 0 到 1 的伪随机值。

让我们还让这些点变得更小。

```glsl
  gl_Position = vec4(x, y, 0, 1);
-  gl_PointSize = 5.0;
+  gl_PointSize = 2.0;
```

同时提高我们绘制的点数量。

```js
-const numVerts = 20;
+const numVerts = 400;
```

如此，我们便得到了：

{{{example url="../webgl-no-data-point-rain.html"}}}

如果你非常仔细观察，你可以看到雨在重复进行。
找到任意一组点，会发现它们从底部落下，又从顶部出现。
但如果背景有更多的事情发生，例如这种廉价的雨水效果发生在一个 3D 游戏上，
那可能没有人会注意到它的重复性。

我们可以通过增加一点随机性来解决重复的问题。

```glsl
void main() {
  float u = vertexId / numVerts;          // 取值 0 到 1
+  float off = floor(time + u) / 1000.0;   // 每个点每秒钟变化
-  float x = hash(u) * 2.0 - 1.0;          // 随机位置
+  float x = hash(u + off) * 2.0 - 1.0;    // 随机位置
  float y = fract(time + u) * -2.0 + 1.0; // 1.0 ->  -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 2.0;
}
```

上面的代码中我们添加了`off`。因为我们通过`floor`得到`floor(time + u)`的值，
它有效地成为了第二个每秒每顶点变化一次的计时器。
这个偏移量与点在屏幕下落的代码是同步的，所以在点跳回屏幕顶部的同时，
一些小量被添加到正在传递的值`hash`中，这意味着这个特定的点将得到一个新的随机数，
从而得到一个新的随机水平位置。

得到的结果是雨滴效果不会再循环了：

{{{example url="../webgl-no-data-point-rain-less-repeat.html"}}}

那么相对`gl.POINTS`我们可以更进一步吗？当然可以!

让我们来绘制圆圈。要做到这一点，我们需要一些围绕中心点的三角形，就像切片的馅饼。
我们可以把每个三角形看成是围绕饼的边缘的 2 个点，以及中心的 1 个点。
然后我们对每一片饼都进行重复。

<div class="webgl_center"><img src="resources/circle-points.svg" style="width: 400px;"></div>

因此，首先我们要有一个计数器，在每个饼片上改变一次

```glsl
float sliceId = floor(vertexId / 3.0);
```

然后我们需要一个计数器沿着圆的边缘如下变化：

    0, 1, ?, 1, 2, ?, 2, 3, ?, ...

其中 ? 值其实并不重要，因为从上图来看，第 3 个值总是在中心位置（0,0），
所以我们可以直接乘以 0，不去考虑数值。

为了获得上述模式，可以这样做

```glsl
float triVertexId = mod(vertexId, 3.0);
float edge = triVertexId + sliceId;
```

对于边缘的点和中心的点，我们需要这种模式。循环 2 点个在边缘，1 个在中心。

    1, 1, 0, 1, 1, 0, 1, 1, 0, ...

我们可以通过以下方式获得该序列

```glsl
float radius = step(triVertexId, 1.5);
```

当 a < b `step(a, b)` 返回 1，否则返回 0。 你可以把它看作

```js
function step(a, b) {
  return a < b ? 1 : 0;
}
```

当 `triVertexId` 小于 1.5 时 `step(triVertexId, 1.5)` 会返回 1。
对每个三角形的前两个顶点返回 true，对最后一个顶点返回 false。

我们可以这样得到一个圆的三角形顶点

```glsl
float numSlices = 8.0;
float sliceId = floor(vertexId / 3.0);
float triVertexId = mod(vertexId, 3.0);
float edge = triVertexId + sliceId;
float angleU = edge / numSlices;  // 0.0 to 1.0
float angle = angleU * PI * 2.0;
float radius = step(triVertexId, 1.5);
vec2 pos = vec2(cos(angle), sin(angle)) * radius;
```

把所有这些放在一起，让我们来试着画一个圆。

```glsl
attribute float vertexId;
uniform float numVerts;
uniform vec2 resolution;

#define PI radians(180.0)

void main() {
  float numSlices = 8.0;
  float sliceId = floor(vertexId / 3.0);
  float triVertexId = mod(vertexId, 3.0);
  float edge = triVertexId + sliceId;
  float angleU = edge / numSlices;  // 0.0 到 1.0
  float angle = angleU * PI * 2.0;
  float radius = step(triVertexId, 1.5);
  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);

  gl_Position = vec4(pos * scale, 0, 1);
}
```

注意，这里我们把 `resolution` 放回去了，所以我们不会得到一个椭圆。

对于一个分为八份的圆，我们需要 8 \* 3 个顶点。

```js
-const numVerts = 400;
+const numVerts = 8 * 3;
```

同时我们要绘制 `TRIANGLES` 而不是 `POINTS`

```js
const offset = 0;
-gl.drawArrays(gl.POINTS, offset, numVerts);
+gl.drawArrays(gl.TRIANGLES, offset, numVerts);
```

{{{example url="../webgl-no-data-triangles-circle.html"}}}

那如果我们想画多个圆呢？

我们所要做的就是想出一个`circleId`，我们可以用它来为每个圆圈挑选一些位置。
我们可以用它来为每个圆选取一些位置，这些位置对圆中的所有顶点都是一样的。

```glsl
float numVertsPerCircle = numSlices * 3.0;
float circleId = floor(vertexId / numVertsPerCircle);
```

下面让我们绘制一组圆中的某一个圆。

首先让我们把上面的代码变成函数：

```glsl
vec2 computeCircleTriangleVertex(float vertexId) {
  float numSlices = 8.0;
  float sliceId = floor(vertexId / 3.0);
  float triVertexId = mod(vertexId, 3.0);
  float edge = triVertexId + sliceId;
  float angleU = edge / numSlices;  // 0.0 to 1.0
  float angle = angleU * PI * 2.0;
  float radius = step(triVertexId, 1.5);
  return vec2(cos(angle), sin(angle)) * radius;
}
```

这里是本文开头出现原始代码，用来绘制圆上的点。

```glsl
float u = vertexId / numVerts;      // 取值 0 到 1
float angle = u * PI * 2.0;         // 取值 0 到 2PI
float radius = 0.8;

vec2 pos = vec2(cos(angle), sin(angle)) * radius;

float aspect = resolution.y / resolution.x;
vec2 scale = vec2(aspect, 1);

gl_Position = vec4(pos * scale, 0, 1);
```

我们只需要把`vertexId`替换成`circleId`，
并除以圆的数量而非顶点数。

```glsl
void main() {
+  float circleId = floor(vertexId / numVertsPerCircle);
+  float numCircles = numVerts / numVertsPerCircle;

-  float u = vertexId / numVerts;      // 取值 0 到 1
+  float u = circleId / numCircles;    // 取值 0 到 1
  float angle = u * PI * 2.0;         // 取值 0 到 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

+  vec2 triPos = computeCircleTriangleVertex(vertexId) * 0.1;

  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);

-  gl_Position = vec4(pos * scale, 0, 1);
+  gl_Position = vec4((pos + triPos) * scale, 0, 1);
}
```

接下来我们只需要增加定点数量即可：

```js
-const numVerts = 8 * 3;
+const numVerts = 8 * 3 * 20;
```

而现在我们有一个由 20 个圆组成的大圆。

{{{example url="../webgl-no-data-triangles-circles.html"}}}

然后理所当然我们也可以把同样的功能应用到上面雨景中，来让雨滴编程圆。
这也许没什么意义，所以我不打算继续进行，
但上述内容确实显示了在顶点着色器不利用数据绘制的流程。

上述技术可用于制作矩形或正方形，然后生成 UV 坐标，
将其传递给片段着色器，并对生成的几何体进行纹理映射。
这可能很适合用于落下的雪花或树叶，
通过应用我们在文章中使用的 3D 技术，使它们在 3D 中翻转。
的文章中所使用的 3D 技术。 [3D perspective](webgl-3d-perspective.html).

我想强调 **上述技术** 并不常见。
制作一个简单的粒子系统或上面的降雨效果可能还算常见，但大量的计算会降低性能表现。
通常来说，如果你追求性能表现，你应该尽可能减少要求计算机负担的工作，
如果有些东西可以在初始化时预先计算，并以某种形式传递给着色器，你就应该这样做。

作为例子，这里有一个极端的顶点着色器程序，它计算了一批立方体:
(警告:有声音)

<iframe width="700" height="400" src="https://www.vertexshaderart.com/art/zd2E5vCZduc5JeoFz" frameborder="0" allowfullscreen></iframe>

但若把“如果我没有数据，只有顶点 ID，我可以画出有趣的东西吗？”
看作益智谜题来挑战，还是非常有趣的。
事实上[整个网站](https://www.vertexshaderart.com)都是围绕只使用顶点 ID
来得到有趣的结果这一问题展开。
但是为了性能考虑，使用传统方法把方块的顶点数据传入缓冲区，
并使用 attribute 或其他方法读取，会快上许多。
这方面我们将在其他文章中继续讨论。

这里需要做一些取舍。对于上面的雨的例子，如果你确实想要那种效果，那么上面的代码是相当有效的。
在性能与效果的，存在着一种技术比另一种技术更有性能的界限。
通常来说，更传统的技术也更灵活，但你必须根据具体情况决定何时选择哪种方式。

这篇文章的重点在于介绍这些想法，并强调应多方面思考 WebGL 实际应当负担的工作。
同样，它只关心你在着色器中设置的`gl_Position`和`gl_FragColor`，而并不关心你是怎么做的。

接下来请阅读[Shadertoy 着色器的运作方式](webgl-shadertoy.html).

<div class="webgl_bottombar" id="pointsissues">
<h3>关于 <code>gl.POINTS</code> 的问题</h3>
<p>
上述技术的用途之一在于模拟 <code>gl.POINTS</code> 的功能。
</p>

<code>gl.POINTS</code> 有两个问题

<ol>
<li>有尺寸上限<br/><br/>大多数人在小尺寸下使用 <code>gl.POINTS</code>。
但如果你需要的尺寸大于它的上限，你需要寻找其他解决方案。
</li>
<li>当它们被屏幕裁剪时，表现是不一致的<br/><br/>
想象一个问题，你把一个点的中心设置在画布外，距离边缘1像素的位置，
而你设置的 <code>gl_PointSize</code> 是 32.0。
<div class="webgl_center"><img src="resources/point-outside-canvas.svg" style="width: 400px"></div>
基于 OpenGL ES 1.0 的规范，最可能出现的情况是：因为32x32的像素中仍然有15列像素在画布上，
他们也许会被绘制。不幸的是，OpenGL（非ES）的说法完全相反。
如果点的中心不在画布上，什么都不会被绘制，更糟的是，直到现在 OpenGL 设备依然以缺乏测试闻名，所以有些设备驱动会绘制，另一些则不会😭
</li>
</ol>
<p>
所以，如果你的需求中需要面对任何上述的问题，你需要利用 <code>gl.TRIANGLES</code> 绘制你自己的四边形作为解决方案。如果你这么做了，上述问题都将不复存在。不在考虑尺寸上限和裁剪的问题后，你有很多方法来绘制大量四边形，其中之一是使用本文的技术
</p>
</div>
