Title: WebGL 立方体贴图
Description: 如何在WebGL中使用立方体贴图
TOC: WebGL 立方体贴图


这篇文章是WebGL系列文章的一部分。
从[基础概念](webgl-fundamentals.html)开始。
上接[三维纹理](webgl-3d-textures.html)。
这篇文章也用到了[WebGL 三维方向光源](webgl-3d-lighting-directional.html)中介绍的概念。
如果你尚未阅读这些文章，则可能需要先阅读这些文章。

在[三维纹理](webgl-3d-textures.html) 中我们介绍了如果使用纹理，
怎样通过横纵从0到1的纹理坐标引用，以及如何使用mip筛选。

还有一种纹理是*cubemap*。它包含了6个纹理代表立方体的6个面。不像常规的纹理坐标有2个纬度，立方体纹理使用法向量，换句话说三维方向。
根据法向量的朝向选取立方体6个面中的一个，这个面的像素用来采样生成颜色。

这六个面通过他们相对于立方体中心的方向被引用。
它们是

    gl.TEXTURE_CUBE_MAP_POSITIVE_X
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z

我们来做一个简单的例子，我们会使用二维canvas来生成6个面的图片

这是填充画布纯色中心文字的代码

```
function generateFace(ctx, faceColor, textColor, text) {
  const {width, height} = ctx.canvas;
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${width * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(text, width / 2, height / 2);
}
```

这是调用它生成6个图片的代码

```
// 获取二维上下文
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);

  // 展示结果
  ctx.canvas.toBlob((blob) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });
});
```

{{{example url="../webgl-cubemap-faces.html" }}}

现在我们将其应用在立方体上。 我们会使用 [三维纹理](webgl-3d-textures.html)中使用纹理图集的代码。

首先我们修改着色器来使用立方体纹理

```
attribute vec4 a_position;

uniform mat4 u_matrix;

varying vec3 v_normal;

void main() {
  // 将位置和矩阵相乘。
  gl_Position = u_matrix * a_position;

  // 传递法向量。因为位置是以几何中心为原点的
  // 我们可以直接传递位置
  v_normal = normalize(a_position.xyz);
}
```

我们从着色器中移除了纹理坐标增加了一个varing来传递法向量给片段着色器。
由于位置坐标是完全以立方体中心为原点的，我们可以用它们来作为法向量。

回忆[WebGL 三维方向光源](webgl-3d-lighting-directional.html)这篇文章，法向量通常用来描述顶点所在面的方向。 由于我们使用单位化的位置来作为法向量，如果光照，我们会得到平滑的光照立方体。对于法线立方体我们需要为每个面的顶点设定不同的法向量。

{{{diagram url="resources/cube-normals.html" caption="standard cube normal vs this cube's normals" }}}

我们已经不使用纹理坐标所以我们可以移除所有和设定纹理坐标相关的代码了。

在片段着色器中我们需要用`samplerCube` 代替 `sampler2D`  用 `textureCube` 代替`texture2D`。`textureCube` 需要vec3 方向值
所以我们传递单位化的法向量。 因为法向量是varing会被插值，我们需要单位化它。

```
precision mediump float;

// 从顶点着色器传入。
varying vec3 v_normal;

// 纹理。
uniform samplerCube u_texture;

void main() {
   gl_FragColor = textureCube(u_texture, normalize(v_normal));
}
```

之后, 在JavaScript中我们需要设置纹理

```
// 生成纹理。
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

// 获取2维上下文。
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {target, faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);
  
  // 上传画布到立方体贴图的每个面。
  const level = 0;
  const internalFormat = gl.RGBA;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  gl.texImage2D(target, level, internalFormat, format, type, ctx.canvas);
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

需要注意的事情：

* 我们使用 `gl.TEXTURE_CUBE_MAP` 代替 `gl.TEXTURE_2D`。

  这告诉WebGL生成一个立方体纹理而不是二维纹理。

* 用特殊的目标上传到纹理的每个面。

  `gl.TEXTURE_CUBE_MAP_POSITIVE_X`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_X`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Z`, 和
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Z`.

* 每个面都是正方形。上面的例子是 128x128的。

  立方体纹理需要正方形纹理。
  和二维纹理一样如果在两个方向上不是2的幂大小我们就不能使用mip进行筛选。
  在这个例子中它们是2的幂(128) 所以我们生成mip设置筛选来使用它们。

证明

{{{example url="../webgl-cubemap.html" }}}

立方体纹理通常**不是**给立方体设置纹理的。 *正确*或者说标准的给立方体设置纹理的方法是使用之前[三维纹理](webgl-3d-textures.html)中介绍的纹理图集的方法。

我们已经学习了立方体纹理是什么那么立方体纹理被用来做什么呢？

可能立方体纹理最常见的用法是用来做[*环境贴图*](webgl-environment-maps.html)。

