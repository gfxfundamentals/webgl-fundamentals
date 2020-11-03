Title: WebGL 纹理单元
Description: WebGL 中的纹理单元是什么？
TOC: WebGL 纹理单元

这篇文章是想形象的介绍如何在 WebGL 中设置纹理单元。
有一篇类似的文章 [关于属性](webgl-attributes.html)。

作为前置要求，你可能需要先阅读 [WebGL 是如何工作的](webgl-how-it-works.html) 和 [WebGL 着色器和 GLSL](webgl-shaders-and-glsl.html)，
以及 [WebGL 纹理](webgl-3d-textures.html)。

## 纹理单元

在 WebGL 中有纹理。纹理通常是二维矩阵数据，可以传给着色器使用。
在着色器中，你会像这样声明 *均匀采样器*：

```glsl
uniform sampler2D someTexture;
```

但着色器怎么知道 `someTexture` 使用了哪个纹理？

这就是需要纹理单元的地方。
纹理单元是引用纹理的 **全局数组**。你可以想象如果写成 JavaScript 它会有一些看起来像这样的全局状态：

```js
const gl = {
  activeTextureUnit: 0,
  textureUnits: [
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
  ];
}
```

从上面可以看到 `textureUnits` 是数组。你将纹理分配给纹理单元数组中的一个 *绑定点*。
假设将 `ourTexture` 分配给纹理单元 5：

```js
// 初始化时
const ourTexture = gl.createTexture();
// 插入初始化纹理的代码

...

// 渲染时
const indexOfTextureUnit = 5;
gl.activeTexture(gl.TEXTURE0 + indexOfTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, ourTexture);
```

然后通过调用下面代码，告诉着色器你将纹理绑定到了哪个纹理单元：

```js
gl.uniform1i(someTextureUniformLocation, indexOfTextureUnit);
```

如果用 JavaScript 实现 WebGL 的 `activeTexture` 和 `bindTexture` 函数，看起来会是这样：

```js
// 伪代码！！！
gl.activeTexture = function(unit) {
  gl.activeTextureUnit = unit - gl.TEXTURE0;  // 转成从 0 开始的索引
};

gl.bindTexture = function(target, texture) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  textureUnit[target] = texture;
}:
```

你甚至可以想象其它有关纹理的函数是如何工作的。
它们都需要拿到 `target`，就像 `gl.texImage2D(target, ...)` 或 `gl.texParameteri(target)`。
实现起来像这样：

```js
// 伪代码！！！
gl.texImage2D = function(target, level, internalFormat, width, height, border, format, type, data) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture.mips[level] = convertDataToInternalFormat(internalFormat, width, height, format, type, data);
}

gl.texParameteri = function(target, pname, value) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture[pname] = value; 
}
```

通过上面的伪代码应该可以知道，`gl.activeTexture` 将一个 WebGL 内的内部全局变量设置成了纹理单元数组的一个索引。
从这以后，所有其它有关纹理单元的函数，都需要一个 `target`(所有纹理单元函数的第一个参数)，引用了当前纹理单元的绑定点。

## 最大纹理单元数量

WebGL 要求实现支持至少 8 个纹理单元。你可以通过下面代码查询支持的数量：

```js
const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
```

注意顶点着色器和片段着色器对于可以使用的单元数量有着不同的限制。
可以通过下面代码查询：

```js
const maxVertexShaderTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
const maxFragmentShaderTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
```

假设：

```js
maxTextureUnits = 8
maxVertexShaderTextureUnits = 4
maxFragmentShaderTextureUnits = 8
```

这意味这，例如，如果你有两个纹理单元被用在顶点着色器中，那么还剩 6 个可以使用在片段着色器中，
因为最多能使用的纹理单元只有 8 个。

另一个需要注意的事是，WebGL 允许 `gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)` 返回 0！！！
也就是说，**有可能设备不支持在顶点着色器中使用纹理**。
幸运的是 [这种情况很少见](https://webglstats.com/webgl/parameter/MAX_VERTEX_TEXTURE_IMAGE_UNITS)。
不过，如果你决定在顶点着色器中使用一些纹理，你需要先检查 `gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)` 是否支持你的需求，
如果不支持，通知用户。
