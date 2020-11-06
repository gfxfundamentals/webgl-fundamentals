Title: WebGL 跨平台相关问题
Description: 当想要 WebGL 应用在各个平台正常运行时应该注意的事。
TOC: WebGL 跨平台相关问题

对于不是所有 WebGL 程序都能跑在所有设备或者浏览器上，我并不是很意外。
单就 WebGL2，至少 2020 年 7 月，[在 Safari 上并不是完全支持](#safari)。

这些是我能先想到的，你可能会遇到的问题列表

## 性能

一块高端的 GPU 可能会比低端的 GPU 快 100 倍。
我唯一能想到的方法，就是将开发目标朝向低端硬件，
或者像 PC 桌面应用那样，给用户选项：选择性能或高保真。

## 内存

类似的，高端 GPU 可能会有 12 GB 到 24 GB 的 RAM，但低端 GPU 可能少于 1 GB。
（我比较大了，所以有点惊讶，低端 = 1 GB，因为我开始编程时，机器内存只有 16 KB 到 64 KB。）

## 设备限制

WebGL 有很多最低支持的特性，但你的设备可能支持的特性 \> 那个最低支持。
这意味着应用可能在支持更少的设备上不能运行。

例子包括：

* 允许的最大纹理尺寸

  2048 或者 4096 看起来很合理。
  至少在 2020 年 [99% 的设备支持 4096 但只有 50% 的设备支持 > 4096](https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE)。

  注意：最大纹理尺寸是 GPU 能处理的最大维度。
  它并不意味着 GPU 有足够的内存给该维度的正方形（对于 2D 纹理）或立方体（对于 3D 纹理）。
  比如有些 GPU 有最大内存 16384\. 但一个 3D 纹理，每个面 16384，一共就需要 16 TB 的内存！！！

* 在单个程序中顶点属性的最大数量

  在 WebGL1 中，最多支持数量是 8。在 WebGL2 中是 16。
  如果你使用的比这多，你的代码不会正常运行。

* 最大全局向量数量

  顶点着色器和片段着色器有着不同的数量。

  在 WebGL1 中，顶点着色器是 128，片段着色器是 16。
  在 WebGL2 中，顶点着色器是 256，片段着色器是 224。

  注意，全局变量可以被封装起来，所以上面的数字是能被使用的 `vec4` 的数量。
  理论上你可以使用 4 倍数量的 `float` 类型的全局变量。
  这里有个算法用来填充它们。
  你可以想象一个有 4 个列的数组，一行就是上面最大全局向量的一个。

    ```
    +-+-+-+-+
    | | | | |   <- 一个 vec4
    | | | | |   |
    | | | | |   |
    | | | | |   V
    | | | | |   最大全局向量行数
    | | | | |
    | | | | |
    | | | | |
    ...

    ```

  一个 `mat4` 就是 4 个 `vec4`。然后 `vec3` 会填充接下来的空间。
  然后是 `vec2`，后面跟着 `float`。想象一下我们有 1 个 `mat4`，2 个 `vec3`，2 个 `vec2` 和 3 个 `float`：

    ```
    +-+-+-+-+
    |m|m|m|m|   <- mat4 占 4 行
    |m|m|m|m|
    |m|m|m|m|
    |m|m|m|m|
    |3|3|3| |   <- 2 个 vec3 占 2 行
    |3|3|3| |
    |2|2|2|2|   <- 2 个 vec2 合并成 1 行
    |f|f|f| |   <- 3 个 float 占一行
    ...

    ```

  进一步，全局变量数组都是竖着的，所以举个例子，如果允许的最大全局向量数是 16，
  那你就不能有长度为 17、类型为 `float` 的数组。
  事实上，如果你有单个 `vec4`，它会占用整行，这样就只剩 15 行。
  这意味着你可有创建的最大数组只能包含 15 个元素。

  我的建议是不要完美的去计算。尽管规范指出了上面的算法，但这有太多的组合需要在所有驱动上进行测试。
  只要注意你接近限制了就可以。

  注意：变量和属性不能被封装。

* 最大变量向量的数量

  WebGL 中最少是 8。WebGL2 中最少是 16。

  如果你使用了大于上面的值，你的代码在最低支持的机器上不会工作。

* 最大纹理单元数量

  这里有 3 个值：

  1. 有多少纹理单元
  2. 顶点着色器能引用多少纹理单元
  3. 片段着色器能引用多少纹理单元

  <table class="tabular-data">
    <thead>
      <tr><th></th><th>WebGL1</th><th>WebGL2</th></tr>
    </thead>
    <tbody>
      <tr><td>最低支持的最多纹理单元数量</td><td>8</td><td>32</td></tr>
      <tr><td>顶点着色器能引用的最低支持的最多纹理单元数量</td><th style="color: red;">0!</td><td>16</td></tr>
      <tr><td>片段着色器能引用的最低支持的最多纹理单元数量</td><td>8</td><td>16</td></tr>
    </tbody>
  </table>

  注意在 WebGL1 中，顶点着色器中的 **0**。显然 [~97% 的设备支持的数量至少是 4](https://webglstats.com/webgl/parameter/MAX_VERTEX_TEXTURE_IMAGE_UNITS)。
  所以，你需要对此进行检查，然后告诉用户你的应用不会工作或者回退使用其它着色器。

还有其它限制。使用下面值，调用 `gl.getParameter` 进行查找：

<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_TEXTURE_SIZE                </td><td>最大纹理尺寸</td></tr>
    <tr><td>MAX_VERTEX_ATTRIBS              </td><td>可以使用属性数量</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_VECTORS      </td><td>顶点着色器可以使用 vec4 数量</td></tr>
    <tr><td>MAX_VARYING_VECTORS             </td><td>可以使用变量数量</td></tr>
    <tr><td>MAX_COMBINED_TEXTURE_IMAGE_UNITS</td><td>存在的纹理单元数量</td></tr>
    <tr><td>MAX_VERTEX_TEXTURE_IMAGE_UNITS  </td><td>顶点着色器可以引用纹理单元数量</td></tr>
    <tr><td>MAX_TEXTURE_IMAGE_UNITS         </td><td>片段着色器可以引用纹理单元数量</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_VECTORS    </td><td>片段着色器可以使用 vec4 数量</td></tr>
    <tr><td>MAX_CUBE_MAP_TEXTURE_SIZE       </td><td>立方体贴图最大尺寸</td></tr>
    <tr><td>MAX_RENDERBUFFER_SIZE           </td><td>renderbuffer 最大尺寸</td></tr>
    <tr><td>MAX_VIEWPORT_DIMS               </td><td>viewport 最大尺寸</td></tr>
  </tbody>
</table>
</div>

这不是完整的列表。例如，没有最大点数量，线最大宽度，
但你应该假设最大线宽为 1.0，点只在简单的 demo 中有用，不需要关心。[关于裁剪的问题](#points-lines-viewport-scissor-behavior)。

WebGL2 添加了一些。比较常用的是：

<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_3D_TEXTURE_SIZE                </td><td>3D 纹理最大尺寸</td></tr>
    <tr><td>MAX_DRAW_BUFFERS              </td><td>可使用的颜色附件数量</td></tr>
    <tr><td>MAX_ARRAY_TEXTURE_LAYERS      </td><td>2D 纹理数组中最大层数</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS             </td><td>使用转换反馈时可输出至单独缓存的变量数量</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS</td><td>一次性输出至单个缓冲的变量数量</td></tr>
    <tr><td>MAX_COMBINED_UNIFORM_BLOCKS  </td><td>全部可使用全局变量块数量</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_BLOCKS         </td><td>顶点着色器可使用全局变量块数量</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_BLOCKS    </td><td>片段着色器可使用全局变量块数量</td></tr>
  </tbody>
</table>
</div>

## 色深缓存分辨率

一些老的移动设备使用 16 位的色深缓存。据我所知，99% 的设备使用 24 位色深，所以你可能不需要担心这个。

## readPixels 格式/类型组合

只有一些特定组合的格式/类型能保证工作。其它组合是可选的。
[这篇文章](webgl-readpixels.html) 中涵盖了这部分内容。

## 帧缓存附件组合

帧缓存可以有 1 个或多个纹理或渲染缓存作为附件。

在 WebGL1 中，只有 3 中组合的附件可以保证工作。

1. 单个格式为 `RGBA`，类型为 `UNSIGNED_BYTE` 的纹理作为 `COLOR_ATTACHMENT0`
2. 格式为 `RGBA`，类型为 `UNSIGNED_BYTE` 的纹理作为 `COLOR_ATTACHMENT0` 和
   格式为 `DEPTH_COMPONENT` 的渲染缓存作为 `DEPTH_ATTACHMENT`
3. 格式为 `RGBA`，类型为 `UNSIGNED_BYTE` 的纹理作为 `COLOR_ATTACHMENT0` 和
   格式为 `DEPTH_STENCIL` 的渲染缓存作为 `DEPTH_STENCIL_ATTACHMENT`

其它的所有组合取决于代码实现，可以通过调用 `gl.checkFramebufferStatus` 检查是否返回 `FRAMEBUFFER_COMPLETE`。

WebGL2 保证了可以写更多的格式，但还是有着 **任意组合都可能失败** 的限制。
你最好打赌如果附上了多于 1 个颜色附件，它们的格式是一致的。


## 扩展

很多 WebGL1 和 WebGL2 中的特性是可选的。
有个 `getExtension` 的 API，如果扩展不存在就会失败。
所以你要检查是否失败，而不是盲目的认为它会成功。

在 WebGL1 和 WebGL2 中，最可能缺失的扩展应该是 `OES_texture_float_linear`，
它能够过滤纹理中 float 类型的点，也就是能够支持将 `TEXTURE_MIN_FILTER` 和 `TEXTURE_MAX_FILTER` 设置成任何数（除了 `NEAREST`)。
很多移动设备不支持这个扩展。

在 WebGL1 中，另一个经常缺失的扩展是 `WEBGL_draw_buffers`。
该扩展的功能是向帧缓存附上多于 1 个的颜色附件。
目前大概 70% 的桌面支持，没有智能手机支持（这是错的）。
基本上只要能运行 WebGL2 的设备就能支持 WebGL1 中的 `WEBGL_draw_buffers`，但这却依然是个问题。
如果你页面需要一次性渲染多个纹理，那么目前你可能需要一个高端 GPU。
无论如何，你还是需要检查用户设备的支持性，如果不支持，提供一个友好的解释。

对于 WebGL1，下面的 3 个扩展几乎是普遍支持的。所以如果它们缺失了，你需要告知用户你的页面不会正常工作，
因为用户的设备过于老旧，无论如何页面都不能很好的运行。

它们是：
`ANGLE_instance_arrays` (能够使用 [实例化绘制](webgl-instanced-drawing.html)）,
`OES_vertex_array_object` (能够将所有属性状态存储在一个对象中，这样就能在一次函数调用中将所有状态传过去，看 [这篇文章](webgl-attributes.html)），
和 `OES_element_index_unit` （能够在 [`drawElements`](webgl-indexed-vertices.html) 中使用 32 位索引）

## 属性位置

有个常见的 bug 是，不查找属性位置。例如，你有这样一个顶点着色器：

```glsl
attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 matrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = matrix * position;
   v_texcoord = texcoord;
}
```

代码假设 `position` 是属性 0，`texcoord` 是属性 1，但这是没有保证的。
所以这段代码在你这儿可以正常，在别人那儿不会。
尽管你不是故意这么做的，但通过代码中的错误，当以一种方式查找位置时工作，另一种方式时不工作。这通常是一个 bug。

有 3 种解决方法：

1. 总是查找位置
2. 在调用 `gl.linkProgram` 前，调用 `gl.bindAttribLocation` 来分配位置
3. （只对 WebGL2）在着色器中设置位置：

   ```glsl
   #version 300es
   layout(location = 0) vec4 position;
   layout(location = 1) vec2 texcoord;
   ...
   ```

   方案 2 看起来最 [D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)，
   而方案 3 最 [W.E.T.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself#DRY_vs_WET_solutions)，
   除非你在渲染时生成纹理。

## GLSL 未定义行为

有一些 GLSL 函数有未定义行为。例如，如果 `x < 0`，那么 `pow(x, y)` 返回未定义。
在 [关于点光源的文章底部](webgl-3d-lighting-spot.html) 中一个长列表。

## 着色器精度问题

2020 年，这里最大的问题是，如果在着色器中使用 `mediump` 或者 `lowp`，
那么在桌面端 GPU 会使用 `highp`，但在移动端就是 `mediump` 或者 `lowp`。
所以你在桌面端开发时不会注意到任何问题。

看 [这篇文章获取更多细节](webgl-precision-issues.html)。

## 点、线、视窗、裁剪行为

在 WebGL 中，`POINTS` 和 `LINES` 的最大尺寸是 1。实际上现在这是对 `LINES` 的限制（线宽）。
当点的中心在视窗外时，点是否会被截去，由实现来定义。看 [这篇文章](webgl-drawing-without-data.html#pointissues) 的底部。

类似的，视窗是否只截去顶点，还是所有像素，是没有定义的。
裁剪总是截去像素，所以如果视窗尺寸小于你在绘制对象大小，打开裁剪测试并设置裁剪大小。

## Safari Bugs

相比于其它浏览器，Safari 有更多的 bug。Apple 看起来也没有兴趣修复它们。

这里有一些多年未被修复的 bug 列表：

* toDataURL (and just guessing toBlob) returns upside down result if premultipledAlpha = false (4yrs old)
[bug](https://bugs.webkit.org/show_bug.cgi?id=156129)

* preserveDrawingBuffer=true wrongly double-buffers on current iOS (4yrs old)
[bug](https://bugs.webkit.org/show_bug.cgi?id=159608)

* `OES_texture_float` implementation must support non-ArrayBufferView entry points (10yrs old)
[bug](https://bugs.webkit.org/show_bug.cgi?id=51015)

* readPixels generates INVALID_ENUM for RGBA/UNSIGNED_BYTE (3yrs old)
[bug](https://bugs.webkit.org/show_bug.cgi?id=170341)

* Changes to a WebGL canvas and to layer transforms are not always synchronized (3yrs old)
[bug](https://bugs.webkit.org/show_bug.cgi?id=172969)

* PNG textures with zero alpha channel have wrong rgb colors (4yrs old)
[bug](https://bugs.webkit.org/show_bug.cgi?id=165297)

* Safari doesn't handle common no attribute use case (1yr old)
[bug](https://bugs.webkit.org/show_bug.cgi?id=197592)

* <a id="safari"></a>注意，在 Safari 中开启 WebGL2 的方法，只要在着色器中加入 `#version 300 es`。
  其它 80 多个 WebGL2 的 API 并没有被实现，至少到 2020 七月。
  [查看来源](https://trac.webkit.org/browser/webkit/trunk/Source/WebCore/html/canvas/WebGL2RenderingContext.cpp)，搜索 “not implemented”。

