Title: WebGL 数据纹理
Description: 向纹理种传入数据
TOC: WebGL 数据纹理


此文上接WebGL系列文章，第一篇是[基础概念](webgl-fundamentals.html)，
上一篇是[纹理](webgl-3d-textures.html)。

上节中讲到了纹理的工作原理以及如何使用，我们用下载的图像创建纹理，
在这篇文章中我们将直接用JavaScript创建数据。

用JavaScript为纹理创建数据是比较直接的，默认情况下WebGL1只支持少量数据类型的纹理

<div class="webgl_center">
  <table class="tabular-data tabular-data1">
    <thead>
      <tr><td>格式</td><td>数据类型</td><td>通道数</td><td>单像素字节数</td></tr>
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

让我们创建一个 3×2 像素的 `LUMINANCE` （亮度/黑白）纹理，由于它是 `LUMINANCE`
纹理，所以每个像素只有一个值，在 R， G， B通道是相同的。

我们继续使用[上篇文章](webgl-3d-textures.html)中的例子，
首先修改纹理坐标，每个面使用整个纹理

```
// 填充立方体纹理坐标的缓冲
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // 正面
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        ...
```

然后修改代码创建一个纹理

```
// 创建一个纹理
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

-// 用 1x1 的蓝色像素填充纹理
-gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
-              new Uint8Array([0, 0, 255, 255]));

// 用 3x2 的像素填充纹理
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

// 设置筛选器，我们不需要使用贴图所以就不用筛选器了
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// 异步加载图像
-...
```

这是结果

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

哦！为什么不管用？！？！！

查看 JavaScript 控制台看到这样的错误信息

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```
结果是WebGL中有一种首次创建OpenGL后的模糊设定，
计算机有时在数据为某些特定大小时速度会快一些，
例如一次拷贝2，4 或 8 个字节比一次拷贝 1 个字节要快，
WebGL默认使用 4 字节长度，所以它期望每一行数据是多个 4 字节数据（最后一行除外）。

我们之前的数据每行只有 3 个字节，总共为 6 字节，
但是 WebGL 试图在第一行获取 4 个字节，第二行获取 3 个字节，
总共 7 个字节，所以会出现这样的报错。

我们可以告诉WebGL一次处理 1 个字节

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

有效参数为 1，2，4 和 8.

我觉得你可能无法计算出对齐数据和非对齐数据的速度区别，
所以希望默认值是 1 而不是 4， 这样这个问题就不会困扰新手，
但是为了适配OpenGL，所以要保留相同的默认设置，这样移植应用就不用改变行数，
然后可以为新的应用在需要的地方设置属性为 1。

有了这个设置后就能正常运行了

{{{example url="../webgl-data-texture-3x2.html" }}}

有着这些基础就可以讲[渲染到材质](webgl-render-to-texture.html)了。

<div class="webgl_bottombar">
<h3>Pixel vs Texel</h3>
<p>有时纹理上的像素叫 texels，像素是图片元素的简写，Texel 是纹理元素的简写。
</p>
<p>我知道我可能会收到一些图形学大师的牢骚，但是我所说的 "texel" 是一种行话。
我通常在使用纹理的元素时不假思索的使用了“像素”这个词。 &#x1f607;
</p>
</div>



