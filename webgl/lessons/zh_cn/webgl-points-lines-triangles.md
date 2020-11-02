Title: WebGL 点、线和三角
Description: 关于绘制点、线和三角的一些细节
TOC: WebGL 点、线和三角

这个网站的使用三角绘制绝大多数内容。可以说 99% 的 WebGL 都在干这事儿。
但为了完整性，让我们看看其它情况。

在 [第一篇文章](webgl-fundamentals.html) 中提到了，WebGL 绘制点、线和三角。
当我们调用 `gl.drawArrays` 或 `gl.drawElements` 时 WebGL 进行绘制。
我们提供顶点着色器，它输出裁剪空间座标，调用 `gl.drawArrays` 或 `gl.drawElements`，根据第一个参数，
WebGL 就会绘制点、线或三角了。

`gl.drawArrays` 或 `gl.drawElements` 第一个有效参数是：

* `POINTS`

  对于每个顶点着色器输出的裁剪空间顶点，绘制以该顶点为中心的正方形。
  正方形的大小，由设置在顶点着色器中的特殊变量 `gl_PointSize` 决定，
  它是预期的像素值。

  注意：正方形的最大（最小）值取决于 WebGL 的实现，可以通过下面代码查询：

      const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

  也可以看 [这里](webgl-drawing-without-data.html#pointsissues)。

* `LINES`

  对于每两个顶点着色器输出的裁剪空间顶点，绘制连接两个点的线。
  如果我们有点 A、B、C、D、E、F，我们就得到了三条线。

  <div class="webgl_center"><img src="resources/gl-lines.svg" style="width: 400px;"></div>

  规范指出，我们可以通过调用 `gl.lineWidth` 并指定像素宽度来设置线的粗细。
  尽管宽度的最大值取决于 WebGL 的实现，但通常大多数情况下最大宽度值为 1。

      const [minSize, maxSize] = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);

  > 这是因为在桌面 OpenGL 中 > 1 的值被弃用了。

* `LINE_STRIP`

  对于每个顶点着色器输出的裁剪空间顶点，绘制连接到顶点着色器输出的前一个点的线。

  所以，如果输出的裁剪空间顶点是 A、B、C、D、E、F，你会得到 5 条线。

  <div class="webgl_center"><img src="resources/gl-line-strip.svg" style="width: 400px;"></div>

* `LINE_LOOP`

  这和 `LINE_STRIP` 一样，但是多了从最后一个点到第一个点的线。

  <div class="webgl_center"><img src="resources/gl-line-loop.svg" style="width: 400px;"></div>

* `TRIANGLES`

  对于每三个顶点着色器输出的裁剪空间顶点，绘制以这三个点为顶点的三角形。
  这是最常使用的模式。

  <div class="webgl_center"><img src="resources/gl-triangles.svg" style="width: 400px;"></div>

* `TRIANGLES_STRIP`

  对于每个顶点着色器输出的裁剪空间顶点，绘制以最后三个点为顶点的三角形。
  也就是说，如果输出了 6 个点 A、B、C、D、E、F，就会绘制 4 个三角形：
  A,B,C 和 B,C,D 和 C,D,E 和 D,E,F。

  <div class="webgl_center"><img src="resources/gl-triangle-strip.svg" style="width: 400px;"></div>

* `TRIANGLES_FAN`

  对于每个顶点着色器输出的裁剪空间顶点，绘制以第一个点和最后两个点为顶点的三角形。
  也就是说，如果输出了 6 个顶点 A、B、C、D、E、F，就会绘制 4 个三角形：
  A,B,C 和 A,C,D 和 A,D,E 和 A,E,F。

  <div class="webgl_center"><img src="resources/gl-triangle-fan.svg" style="width: 400px;" align="center"></div>

尽管有人不同意，但根据我的经验，`TRIANGLE_FAN` 和 `TRIANGLE_STRIP` 最好避免使用。
它们只适用一些特殊情况，而且需要额外的代码来处理，这并不值得。
尤其你可能使用工具来构建法线、生成纹理坐标或对顶点数据做其它处理。
仅仅使用 `TRIANGLES` 并没有什么问题。只要一开始添加 `TRIANGLE_FAN` 和 `TRIANGLE_STRIP`，
你就会需要更多的函数来处理更多的情况。
你可以不同意，按你的想法做。这只是我自身的经验，和一些我咨询过的 3A 游戏开发者的经验。

类似的 `LINE_LOOP` 和 `LINE_STRIP` 也不是很有用，它们有类似的问题。
就像 `TRIANGLE_FAN` 和 `TRIANGLE_STRIP`，使用它们的场景很少。
比如你想绘制 4 条连接着的线，每条线由 4 个点组成。

<div class="webgl_center"><img src="resources/4-lines-4-points.svg" style="width: 400px;" align="center"></div>

如果你使用 `LINE_STRIP`，每绘制一条线，就会调用 4 次 `gl.drawArrays` 和更多次的调用来设置属性。
而如果使用 `LINES`，你可以插入绘制 4 条线所需要的所有点，只调用一次 `gl.drawArrays`。
那会快非常多。

进一步来说，`LINES` 对于调试或简单的效果非常好用，不过多数平台给予它 1 像素的最大宽度，这不是个好方案。
如果想要为图形绘制网格，或者在 3D 模型程序中绘制多边形的轮廓，使用 `LINES` 是不错的选择。
但如果想要绘制结构化的图形，像 SVG 或者 Adobe Illustrator，就不行。
你需要 [渲染线的其它方法，通常使用三角形](https://mattdesl.svbtle.com/drawing-lines-is-hard)。
