Title: WebGL 最小的程序
Description: 用于测试的最少量的代码
TOC: WebGL 最小的程序

这篇文章假设你已经阅读了从 [WebGL 基础](webgl-fundamentals.html) 开始的其它文章。
如果你尚未阅读这些文章，则可能需要先阅读这些文章。

我不知道应该吧这篇文章放哪个分类下，因为它主要有两个目的：

1. 向你展示最小的 WebGL 程序

    这些技巧对于测试一些东西，或者做一个 [完整最小可验证集 (MCVE for Stack Overflow)](https://meta.stackoverflow.com/a/349790/128511)
    或者在找 bug 的时候都非常有用。

2. 学着跳出框子思考

    我希望多写几篇这样的文章，来帮助你宏观的思考，而不是一些通用的模板。
    [这里有个例子](webgl-drawing-without-data.html)。

## 清除

这里有个最小的 WebGL 程序：

```js
const gl = document.querySelector('canvas').getContext('webgl');
gl.clearColor(1, 0, 0, 1); // 红色
gl.clear(gl.COLOR_BUFFER_BIT);
```

这个程序所做的仅仅是将画布设置成红色，它确实做了一些事。

仔细思考一下，通过这个简单的程序我们确实可以测试一些东西。
例如你在 [渲染到纹理](webgl-render-to-texture.html) 时，但有些功能没有正常工作。
就像 [这篇文章](webgl-render-to-texture.html) 里的例子，
你在将 1 个或多个 3D 物体渲染到纹理上，然后将纹理渲染到立方体上。

你没有看到任何结果。一个简单的测试方法是，停止使用着色器渲染纹理，
给纹理一个指定的颜色。

```js
gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferWithTexture);
gl.clearColor(1, 0, 1, 1); // 品红色
gl.clear(gl.COLOR_BUFFER_BIT);
```

现在从帧缓存里渲染纹理，立方体变品红色了吗？
如果没有，那么你的问题出在别的地方，而不是渲染到纹理这部分。

## 使用 `SCISSOR_TEST` 和 `gl.clear`

`SCISSOR_TEST` 将绘制和清除区域剪裁到一些小的方形画布中（或者当前帧缓存）。

你可以通过下面代码开启剪裁

```js
gl.enable(gl.SCISSOR_TEST);
```

然后将剪裁矩形设置到相对于左下角的相对位置，以像素计。它使用和 `gl.viewport` 一样的参数。

```js
gl.scissor(x, y, width, height);
```

这样就可以使用 `SCISSOR_TEST` 和 `gl.clear` 画一个矩形。

例子：

```js
const gl = document.querySelector('#c').getContext('webgl');

gl.enable(gl.SCISSOR_TEST);

function drawRect(x, y, width, height, color) {
  gl.scissor(x, y, width, height);
  gl.clearColor(...color);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

for (let i = 0; i < 100; ++)) {
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


不是说这段特定的代码会很有用，但是知道总是好的。

## 使用一个大的 `gl.POINTS`

如大部分例子中展示的，在 WebGL 中做的最多的就是创建缓存，
将顶点数据放进缓存，创建带属性的着色器，设置属性从缓存中读取数据。
然后绘制，可能着色器还用到了全局变量和纹理。

但有时候你只是想测试一下。例如你只是想看到有东西绘制出来了。

那这个着色器怎么样：

```glsl
// 顶点着色器
void main() {
  gl_Position = vec4(0, 0, 0, 1); // 中心
  gl_PointSize = 120.0;
}
```

```glsl
// 片元着色器
precision mediump float;

void main() {
  gl_FragColor = vec4(1, 0, 0, 1); // 红色
}
```


下面是使用：

```js
// 设置 GLSL 程序
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

gl.useProgram(program);

const offset = 0;
const count = 1;
gl.drawArrays(gl.POINTS, offset, count);
```

不用创建缓存，不用设置全局变量，我们得到了一个在画布中心的单点。

{{{example url="../webgl-simple-point.html"}}}

> 注意：Safari 没有通过该特性的 [WebGL 一致性测试](https://www.khronos.org/registry/webgl/sdk/tests/conformance/rendering/point-no-attributes.html?webglVersion=1&quiet=0)。
> 这里有个 [提交的 Bug](https://bugs.webkit.org/show_bug.cgi?id=197592)。
> 请考虑礼貌的要求他们修复这个问题。
> 越多的人要求就越有可能得到修复。

关于 `gl.POINTS`: 当你将 `gl.POINTS` 传给 `gl.drawArrays` 时，
你需要在顶点着色器中将 `gl_PointSize` 设置成像素尺寸。
值得注意的是，不同的 GPU 或驱动有不同的可使用的最大 Point 尺寸。
你可以查询最大值：

```
const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
```

WebGL 规范只要求最大值为 1.0。幸运的是，[绝大多数 GPU 和驱动支持更大的值](https://webglstats.com/webgl/parameter/ALIASED_POINT_SIZE_RANGE)。

在你设置 `gl_PointSize` 后，当顶点着色器退出后，无论你给 `gl_Position` 设置了什么值，
都将被转变成在屏幕/画布中的像素值，然后会以这个位置为中点，
向四个方向延伸 +/- gl_PointSize / 2，生成一个矩形。

好了，我能听到你在说所以呢，谁会想要画一个单点呢。

单点能自动获得 [纹理座标](webgl-3d-textures.html)。它们能在片断着色器中通过特殊变量 `gl_PointCoord` 获取到。
所以，让我们在那个单点上绘制纹理。

首先，修改片元着色器。

```glsl
// 片元着色器
precision mediump float;

+uniform sampler2D tex;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);  // red
+  gl_FragColor = texture2D(tex, gl_PointCoord.xy);
}
```

为了保持简单，我们将根据 [数据纹理](webgl-data-textures.html) 中提到，使用原始数据制作纹理。

```js
// 2x2 像素数据
const pixels = new Uint8Array([
  0xFF, 0x00, 0x00, 0xFF,  // 红
  0x00, 0xFF, 0x00, 0xFF,  // 绿
  0x00, 0x00, 0xFF, 0xFF,  // 蓝
  0xFF, 0x00, 0xFF, 0xFF,  // 品红
]);
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                 // 级别
    gl.RGBA,           // 内部格式
    2,                 // 宽度
    2,                 // 高度
    0,                 // 边宽
    gl.RGBA,           // 格式
    gl.UNSIGNED_BYTE,  // 数据类型
    pixels,            // 原始数据
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

因为 WebGL 默认使用纹理单元从 0 开始，全局变量默认为 0，所以不需要其它设置。

{{{example url="../webgl-simple-point-w-texture.html"}}}

这应该是测试纹理相关问题的一个比较好的方法。
我们没有使用缓存、属性，不用设置和查找全局变量。
比如我们加载了一张图片，但没有显示。如果我们使用上面的着色器，图片显示在单点了吗？
我们渲染到了纹理，如果想要查看纹理，通常我们会通过缓存和属性设置一些几何体。
但我们可以将纹理展示在单点上来渲染纹理。

## 使用多个单独的 `POINTS`

这里有另一个对上面例子的简单修改。我们可以将顶点着色器修改成：

```glsl
// 顶点着色器

+attribute vec4 position;

void main() {
-  gl_Position = vec4(0, 0, 0, 1);
+  gl_Position = position;
  gl_PointSize = 120.0;
}
```

属性有默认值 `0, 0, 0, 1`，所以像我们上面的修改还是可以正常工作的。
但现在，我们可以设置我们想要的位置了。

```js
+const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');

...

+const numPoints = 5;
+for (let i = 0; i < numPoints; ++i) {
+  const u = i / (numPoints - 1);    // 0 到 1
+  const clipspace = u * 1.6 - 0.8;  // -0.8 到 +0.8
+  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

*  const offset = 0;
*  const count = 1;
*  gl.drawArrays(gl.POINTS, offset, count);
+}
```

在我们运行之前，先让点小一些：

```glsl
// 顶点着色器

attribute vec4 position;
+uniform float size;

void main() {
  gl_Position = position;
-  gl_PointSize = 120.0;
+  gl_PointSize = 20.0;
}
```

让我们把它变成可以修改点的颜色。
（注意：我切换回了没有纹理的代码。）

```glsl
precision mediump float;

+uniform vec4 color;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);   // 红色
+  gl_FragColor = color;
}
```

然后我们需要查找颜色的位置：

```js
// 设置 GLSL 程序
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
+const colorLoc = gl.getUniformLocation(program, 'color');
```

然后使用：

```js
gl.useProgram(program);

const numPoints = 5;
for (let i = 0; i < numPoints; ++i) {
  const u = i / (numPoints - 1);    // 0 到 1
  const clipspace = u * 1.6 - 0.8;  // -0.8 到 +0.8
  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

+  gl.uniform4f(colorLoc, u, 0, 1 - u, 1);

  const offset = 0;
  const count = 1;
  gl.drawArrays(gl.POINTS, offset, count);
}
```

现在，我们得到了 5 种颜色的 5 个点，而且我们没有设置缓存或者属性。

{{{example url="../webgl-simple-points.html"}}}

当然，这 **不是** 你应该在 WebGL 里画多个点的方法。
如果你想画多个点，你应该为每个点设置带位置的属性、颜色，并且在一次绘制调用中绘制所有的点。

但是！为了测试、调试、或编写一个 [MCVE](https://meta.stackoverflow.com/a/349790/128511)，
**最小化** 代码是个不错的方式。
再举一个例子，假如我们在为后处理效果绘制到纹理，我们想要显示它们。
我们可以用上面例子的组合，为每个纹理绘制一个大的点。
没有复杂的缓存和属性设置，对于调试来说非常好。
