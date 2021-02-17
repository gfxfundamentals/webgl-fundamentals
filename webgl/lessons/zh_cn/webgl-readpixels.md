Title: WebGL readPixels
Description: 关于 readPixels 的细节
TOC: WebGL readPixels

在 WebGL 中，你给 `readPixels` 传格式/类型。
对于给定的纹理内部格式（附加在帧缓冲器上），只有 2 种有效的格式/类型组合。

在规范中：

> 对于归一化的固定点渲染的表面，格式 `RGBA` 和类型 `UNSIGNED_BYTE` 是可用的。
对于有符号整型渲染的表面，格式 `RGBA_INTEGER` 和类型 `INT` 是可用的。
对于无符号整型渲染的表面，格式 `RGBA_INTEGER` 和类型 `UNSIGNED_INT` 是可用的。

其中第二种组合取决于具体实现，<span style="color: red;">这意味着如果你想要你的代码具有可移植性，你不应该使用它</span>。
可以通过下面的代码查询格式/类型的组合：

```js
// 假定帧缓冲器绑定了纹理
const format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
```

同时注意什么纹理格式是可以渲染的（也就是你可以把它们附加到帧缓冲器上并渲染），这也是由具体实现决定的。
WebGL1 只要求了一种可被渲染的组合 `RGBA`/`UNSIGNED_BYTE`。
其它都是可选的（比如 `LUMINANCE`)，有些可以通过扩展实现可渲染，比如 `RGBA`/`FLOAT`。

**下面的表是实时的**。你可能注意到了，它根据不同机器、操作系统、GPU 甚至浏览器给出不同结果。
我知道在我的机器上，Chrome 和 Firefox 给出了不同的结果，因为它们实现的不同。

<div class="webgl_center" data-diagram="formats"></div>

<script src="../resources/twgl-full.min.js"></script>
<script src="resources/webgl-readpixels.js"></script>
