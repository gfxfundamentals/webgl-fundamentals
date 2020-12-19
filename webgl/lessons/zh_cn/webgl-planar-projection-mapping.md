Title: WebGL 平面的和透视的投影映射
Description: 将纹理投影成一个平面
TOC: 平面的和透视的投影映射

本文假设你已经读过 [码少趣多](webgl-less-code-more-fun.html)，因为本文使用到了那里提到的库，以便使得本文的例子更整洁。如果你不明白 `webglUtils.setBuffersAndAttributes` 函数是设置 buffers 和 attributes 的，或者不明白 `webglUtils.setUniforms` 函数是设置 uniforms 的，等等之类的函数你都不能理解，那么你可能要往回 [读读基础](webgl-fundamentals.html)。

本文还假设你已经读了 [透视的文章](webgl-3d-perspective.html)、[相机的文章](webgl-3d-camera.html)、[纹理的文章](webgl-3d-textures.html) 和 [可视化相机的文章](webgl-visualizing-the-camera.html)，如果你还没有读过，那你应该首先从那里开始阅读。

投影映射是“投影”一张图像的过程，就像一个电影放映机对准一个屏幕，然后将电影投影到屏幕上。电影放映机投影的是一个透视的平面。屏幕离放映机越远，则图像就会越大。如果你将屏幕旋转使其不与电影放映机垂直，那么结果将会是一个梯形或者是任意的四边形。

<div class="webgl_center"><img src="resources/perspective-projection.svg" style="width: 400px"></div>

当然，投影映射并不只能投影到平面。还有圆柱型的投影映射、球形的投影映射，等等。

我们先来介绍下平面的投影映射。在这种情况下，你需要将电影放映机想象成和屏幕一样大，这样即使屏幕离电影放映机很远，电影的图像也不会变得很大，它会保持原来的尺寸。

<div class="webgl_center"><img src="resources/orthographic-projection.svg" style="width: 400px"></div>

首先，让我们创建一个场景，该场景会绘制一个平面和一个球体。我们将用一个简单的 8x8 棋盘纹理对它们进行贴图。

这些着色器和 [纹理文章](webgl-3d-textures.html) 中的那些着色器是类似的，只是各个矩阵是分开的，这样我们就不需要在 JavaScript 中把它们乘在一起了。

```glsl
// 顶点着色器
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec2 v_texcoord;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;

  // 把纹理坐标传给片段着色器
  v_texcoord = a_texcoord;
}
```

另外，我还添加了一个 `u_colorMult` uniform 来乘以纹理颜色。这样我们就可以通过制作一个单色纹理（monochrome texture）来改变它的颜色。

```glsl
// 片段着色器
precision mediump float;

// 从顶点着色器传来的
varying vec2 v_texcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_texcoord) * u_colorMult;
}
```

下面是设置程序、球体 buffers 和平面 buffers 的代码

```js
// 设置 GLSL 程序
// 编译着色器、链接程序、查找 locations
const textureProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // 半径
    12, // 横轴细分数
    6,  // 纵轴细分数
);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // 宽
    20,  // 高
    1,   // 横轴细分数
    1,   // 纵轴细分数
);
```

和创建一个 8x8 棋盘纹理的代码，使用了我们在 [数据纹理文章](webgl-data-textures.html) 中介绍过的技术。

```js
// 创建一个 8x8 棋盘纹理
const checkerboardTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // mip level
    gl.LUMINANCE,     // internal format
    8,                // width
    8,                // height
    0,                // border
    gl.LUMINANCE,     // format
    gl.UNSIGNED_BYTE, // type
    new Uint8Array([  // data
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
    ]));
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

为了绘制，我们将会创建一个函数，该函数需要一个投影矩阵和一个相机矩阵作为参数，以便从相机矩阵中计算出视图矩阵，然后绘制球体和立方体

```js
// 每个物体的 uniforms
const planeUniforms = {
  u_colorMult: [0.5, 0.5, 1, 1],  // 浅蓝色
  u_texture: checkerboardTexture,
  u_world: m4.translation(0, 0, 0),
};
const sphereUniforms = {
  u_colorMult: [1, 0.5, 0.5, 1],  // 粉红色
  u_texture: checkerboardTexture,
  u_world: m4.translation(2, 3, 4),
};

function drawScene(projectionMatrix, cameraMatrix) {
  // 从相机矩阵中计算出视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(textureProgramInfo.program);

  // 设置球体和平面共享的 uniforms
  webglUtils.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
  });

  // ------ 绘制球体 --------

  // 设置所有需要的 attributes
  webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);

  // 设置球体特有的 uniforms
  webglUtils.setUniforms(textureProgramInfo, sphereUniforms);

  // 调用 gl.drawArrays 或 gl.drawElements
  webglUtils.drawBufferInfo(gl, sphereBufferInfo);

  // ------ 绘制平面 --------

  // 设置所有需要的 attributes
  webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo);

  // 设置平面特有的 uniforms
  webglUtils.setUniforms(textureProgramInfo, planeUniforms);

  // 调用 gl.drawArrays 或 gl.drawElements
  webglUtils.drawBufferInfo(gl, planeBufferInfo);
}
```

我们可以在一个 `render` 函数中使用这份代码，就像这样

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
};
const fieldOfViewRadians = degToRad(60);

function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // 告诉 WebGL 如何从裁剪空间转换为像素
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // 清除 canvas 和深度缓冲区
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 计算投影矩阵
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // 使用 look at 计算相机的矩阵
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  drawScene(projectionMatrix, cameraMatrix);
}
render();
```

所以，现在我们有了一个简单的场景，场景内有一个平面和一个球体。我添加了一对滑块来让你改变相机的位置，以便你理解该场景。

{{{example url="../webgl-planar-projection-setup.html"}}}

现在，让我们使用平面投影的方式将一个纹理投影到该球体和平面上。

首先要做的是，[加载一个纹理](webgl-3d-textures.html)。

```js
function loadImageTexture(url) {
  // 创建一个纹理
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // 用一个 1x1 蓝色像素填充该纹理
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  // 异步加载一张图片
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // 现在图片加载完了，把它拷贝到纹理中
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    // 假设该纹理的宽高是 2 的整次幂
    gl.generateMipmap(gl.TEXTURE_2D);
    render();
  });
  return texture;
}

const imageTexture = loadImageTexture('resources/f-texture.png');
```

回想一下 [可视化相机的文章](webgl-visualizing-the-camera.html)。我们创建了一个 -1 到 +1 的立方体，然后把它绘制出来表示相机的视椎体。我们的矩阵使得视椎体内的空间表示的是世界空间中一些锥体形状的区域，这些区域从世界空间中被转换到了 -1 到 +1 的裁剪空间。我们可以在这里做类似的事。

让我们来试试吧。首先，在我们的片段着色器中，我们会在 0.0 到 1.0 之间的纹理坐标上绘制投影的纹理。而在这个范围外的纹理坐标，我们将会使用棋盘纹理。

```glsl
precision mediump float;

// 从顶点着色器传来的
varying vec2 v_texcoord;
+varying vec4 v_projectedTexcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
+uniform sampler2D u_projectedTexture;

void main() {
-  gl_FragColor = texture2D(u_texture, v_texcoord) * u_colorMult;
+  // 除以 w 得到正确的值，详见透视投影的文章
+  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
+
+  bool inRange = 
+      projectedTexcoord.x >= 0.0 &&
+      projectedTexcoord.x <= 1.0 &&
+      projectedTexcoord.y >= 0.0 &&
+      projectedTexcoord.y <= 1.0;
+
+  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
+  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
+
+  float projectedAmount = inRange ? 1.0 : 0.0;
+  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}
```

为了计算投影的纹理坐标，我们会创建一个矩阵，该矩阵表示 3D 空间中一个确切方向的方位和位置，就像 [可视化相机文章](webgl-visualizing-the-camera.html) 中的相机那样。然后我们会通过那个 3D 空间投影球体顶点和平面顶点的世界坐标。使用我们刚刚写的代码，那些位于 0 到 1 的投影纹理坐标就会显示该投影纹理。

让我们添加代码到顶点着色器，通过该*空间*投影球体和平面的世界坐标

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
+uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;
+varying vec4 v_projectedTexcoord;

void main() {
+  vec4 worldPosition = u_world * a_position;

-  gl_Position = u_projection * u_view * u_world * a_position;
+  gl_Position = u_projection * u_view * worldPosition;

  // 将纹理坐标传给片段着色器
  v_texcoord = a_texcoord;

+  v_projectedTexcoord = u_textureMatrix * worldPosition;
}
```

现在，剩下要做的就是计算定义了该方位空间的矩阵。我们要做的就是计算出一个世界矩阵，就像我们对其他物体做的那样，然后取它的逆矩阵。这样我们就得到了一个矩阵，该矩阵可以让我们将其他物体的世界坐标转换为相对于该空间的坐标。这和 [相机文章](webgl-3d-camera.html) 中的视图矩阵做的事情是完全一样的。

我们会使用在 [那篇相同的文章](webgl-3d-camera.html) 中创建的 `lookAt` 函数

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
+  posX: 3.5,
+  posY: 4.4,
+  posZ: 4.7,
+  targetX: 0.8,
+  targetY: 0,
+  targetZ: 4.7,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // 从相机矩阵中创建一个视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );

  // 使用这个世界矩阵的逆矩阵来创建
  // 一个矩阵，该矩阵会变换其他世界坐标
  // 为相对于这个空间的坐标。
  const textureMatrix = m4.inverse(textureWorldMatrix);

  // 设置对球体和平面都一样的 uniforms
  webglUtils.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
+    u_textureMatrix: textureMatrix,
+    u_projectedTexture: imageTexture,
  });

  ...
}
```

当然，你不一定要用 `lookAt`。你可以任选一种方法来创建一个世界矩阵，
例如使用一个 [场景图](webgl-scene-graph.html) 或 [矩阵栈](webgl-2d-matrix-stack.html)。

在我们运行之前，让我们添加一些缩放比例

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 3.5,
  posY: 4.4,
  posZ: 4.7,
  targetX: 0.8,
  targetY: 0,
  targetZ: 4.7,
+  projWidth: 2,
+  projHeight: 2,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // 从相机矩阵中创建一个视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );
+  textureWorldMatrix = m4.scale(
+      textureWorldMatrix,
+      settings.projWidth, settings.projHeight, 1,
+  );

  // 使用这个世界矩阵的逆矩阵来创建
  // 一个矩阵，该矩阵会变换其他世界坐标
  // 为相对于这个空间的坐标。
  const textureMatrix = m4.inverse(textureWorldMatrix);

  ...
}
```

这样我们就得到了一个投影的纹理。

{{{example url="../webgl-planar-projection.html"}}}

但我觉得这样很难看到该纹理所处的空间。让我们添加一个线框立方体来帮助可视化。


首先，我们需要一个单独的着色器集合。这些着色器只能绘制纯色，没有纹理。

```html
<script id="color-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main() {
  // 将 position 乘以矩阵
  gl_Position = u_projection * u_view * u_world * a_position;
}
</script>
```

```html
<script id="color-fragment-shader" type="x-shader/x-fragment">
precision mediump float;

uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
</script>
```

然后我们还需要编译和链接这些着色器

```js
// 设置 GLSL 程序
const textureProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
+const colorProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);
```

然后我们需要一些数据来绘制线框立方体

```js
const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // 半径
    12, // 横轴细分数
    6,  // 纵轴细分数
);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // 宽度
    20,  // 高度
    1,   // 横轴细分数
    1,   // 纵轴细分数
);
+const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
+  position: [
+     0,  0, -1,
+     1,  0, -1,
+     0,  1, -1,
+     1,  1, -1,
+     0,  0,  1,
+     1,  0,  1,
+     0,  1,  1,
+     1,  1,  1,
+  ],
+  indices: [
+    0, 1,
+    1, 3,
+    3, 2,
+    2, 0,
+
+    4, 5,
+    5, 7,
+    7, 6,
+    6, 4,
+
+    0, 4,
+    1, 5,
+    3, 7,
+    2, 6,
+  ],
+});
```

注意，为了匹配纹理坐标，该立方体在 X 轴和 Y 轴上的范围是 0 到 1。而在 Z 轴上，它的范围是 -1 到 1。这样我们缩放它的时候就能使其在两个方向上都拉伸了。

要使用该立方体的话，我们只需要使用之前的 `textureWorldMatrix` 就可以了，因为我们要做的是绘制表示那个空间的立方体。

```js
function drawScene(projectionMatrix, cameraMatrix) {

  ...
+  // ------ 绘制立方体 ------
+
+  gl.useProgram(colorProgramInfo.program);
+
+  // 设置所有需要的 attributes
+  webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);
+
+  // 在 Z 轴上缩放该立方体，
+  // 以便表示该纹理是被投影到无限远的。
+  const mat = m4.scale(textureWorldMatrix, 1, 1, 1000);
+
+  // 设置我们计算出来的 unifroms
+  webglUtils.setUniforms(colorProgramInfo, {
+    u_color: [0, 0, 0, 1],
+    u_view: viewMatrix,
+    u_projection: projectionMatrix,
+    u_world: mat,
+  });
+
+  // 调用 gl.drawArrays 或者 gl.drawElements
+  webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
}
```

有了这些，现在我们可以更加容易地看到投影位于哪里了。

{{{example url="../webgl-planar-projection-with-lines.html"}}}

有一点需要注意的是，我们并没有真正地*投影*该纹理。我们在做的是相反的事情。
即对被渲染物体的每一个像素，我们判断纹理的哪一部分是被投影到该像素上的，
然后再查找该部分纹理上的颜色。

既然我们在上面提到了电影放映机，那么我们如何模拟一台电影放映机呢？
我们只需要简单地使用一个投影矩阵来乘以它（即上面的纹理矩阵）

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
+  perspective: true,
+  fieldOfView: 45,
};

...

function drawScene(projectionMatrix, cameraMatrix) {
  // 从相机矩阵中创建一个视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

  const textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );
-  textureWorldMatrix = m4.scale(
-      textureWorldMatrix,
-      settings.projWidth, settings.projHeight, 1,
-  );
  
+  const textureProjectionMatrix = settings.perspective
+      ? m4.perspective(
+          degToRad(settings.fieldOfView),
+          settings.projWidth / settings.projHeight,
+          0.1,  // near
+          200)  // far
+      : m4.orthographic(
+          -settings.projWidth / 2,   // left
+           settings.projWidth / 2,   // right
+          -settings.projHeight / 2,  // bottom
+           settings.projHeight / 2,  // top
+           0.1,                      // near
+           200);                     // far

  // 使用这个世界矩阵的逆矩阵来创建
  // 一个矩阵，该矩阵会变换其他世界坐标
  // 为相对于这个空间的坐标。
-  const textureMatrix = m4.inverse(textureWorldMatrix);
+  const textureMatrix = m4.multiply(
+      textureProjectionMatrix,
+      m4.inverse(textureWorldMatrix));
```

注意，我添加了一个选项，可以选择是使用透视投影矩阵还是使用正交投影矩阵。

在绘制线框的时候我们也需要使用那个投影矩阵

```js
// ------ 绘制立方体 ------

...

-// 在 Z 轴上缩放该立方体，
-// 以便表示该纹理是被投影到无限远的。
-const mat = m4.scale(textureWorldMatrix, 1, 1, 1000);

+// 调整立方体使其匹配该投影
+const mat = m4.multiply(
+    textureWorldMatrix, m4.inverse(textureProjectionMatrix));
```

有了这些，我们就得到了

{{{example url="../webgl-planar-projection-with-projection-matrix-0-to-1.html"}}}

它已经正常工作了，但我们的投影和我们的线框立方体都只是使用了 0 到 1 的空间，
所以它只使用到了投影视椎体的 1/4。

要修复这个问题，首先让我们的立方体在所有方向上都是 -1 到 +1

```js
const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
  position: [
-     0,  0, -1,
-     1,  0, -1,
-     0,  1, -1,
-     1,  1, -1,
-     0,  0,  1,
-     1,  0,  1,
-     0,  1,  1,
-     1,  1,  1,
+    -1, -1, -1,
+     1, -1, -1,
+    -1,  1, -1,
+     1,  1, -1,
+    -1, -1,  1,
+     1, -1,  1,
+    -1,  1,  1,
+     1,  1,  1,
  ],
  indices: [
    0, 1,
    1, 3,
    3, 2,
    2, 0,

    4, 5,
    5, 7,
    7, 6,
    6, 4,

    0, 4,
    1, 5,
    3, 7,
    2, 6,
  ],
});
```

然后当将其用于纹理矩阵时，我们需要使视椎体内的空间范围是 0 到 1。
这可以通过使空间偏移 0.5 然后将其缩放 0.5 倍来实现。

```js
const textureWorldMatrix = m4.lookAt(
    [settings.posX, settings.posY, settings.posZ],          // position
    [settings.targetX, settings.targetY, settings.targetZ], // target
    [0, 1, 0],                                              // up
);
const textureProjectionMatrix = settings.perspective
    ? m4.perspective(
        degToRad(settings.fieldOfView),
        settings.projWidth / settings.projHeight,
        0.1,  // near
        200)  // far
    : m4.orthographic(
        -settings.projWidth / 2,   // left
         settings.projWidth / 2,   // right
        -settings.projHeight / 2,  // bottom
         settings.projHeight / 2,  // top
         0.1,                      // near
         200);                     // far

-// 使用这个世界矩阵的逆矩阵来创建
-// 一个矩阵，该矩阵会变换其他世界坐标
-// 为相对于这个空间的坐标。
-const textureMatrix = m4.multiply(
-    textureProjectionMatrix,
-    m4.inverse(textureWorldMatrix));

+let textureMatrix = m4.identity();
+textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
+textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
+textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
+// 使用这个世界矩阵的逆矩阵来创建
+// 一个矩阵，该矩阵会变换其他世界坐标
+// 为相对于这个空间的坐标。
+textureMatrix = m4.multiply(
+    textureMatrix,
+    m4.inverse(textureWorldMatrix));
```

现在，它看起来可以正常工作了

{{{example url="../webgl-planar-projection-with-projection-matrix.html"}}}

那么，平面投影一个纹理有什么作用呢？

一是因为你想要这么做，哈哈哈^_^。大多数 3D 建模软件都提供了一种将一个纹理进行平面投影的方法。

另一个作用是贴花（decal）。贴花是一种在物体表面上放置溅射的油漆或爆炸痕迹的方式。要实现贴花，通常不会使用上面着色器的那种做法。相反，你需要写一些函数来遍历需要应用贴花的模型的几何。对于每一个三角形，你需要检查该三角形是否位于该贴花的范围内，这与 JavaScript 的着色器例子中的 `inRange` 检查一样。对于在贴花范围内的每个三角形，你把该三角形和投影的纹理坐标添加到某个新的几何中。然后你把该贴花添加到你的绘制列表中。

为贴花生成几何是对的，否则你就需要为 2 个贴花、3 个贴、4 个贴花等等提供不同的着色器，然后你的着色器很快就会变得很复杂，并达到 GPUs 着色器的纹理限制。

还有另一个作用是模拟真实世界的 [投影映射](https://en.wikipedia.org/wiki/Projection_mapping)。你对一个物体进行了 3D 建模，你将会把视频投影到该模型上，你使用了类似上面那样的代码来实现投影，除了你的纹理是视频外。然后你可以编辑并完善该视频，使其匹配该模型，而不用在实际现场中使用一个真正的投影仪。

这种投影的另一个用处就是 [用阴影映射来计算阴影](webgl-shadows.html)。

<div class="webgl_bottombar">
<h3>在条件语句内的纹理引用</h3>
<p>在上面的片段着色器中，在所有的情况下我们都对两个纹理进行了读取</p>
<pre class="prettyprint"><code>
  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;

  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
</code></pre>
<p> 为什么我们不像下面这样做呢？</p>
<pre class="prettyprint"><code>
  if (inRange) {
    gl_FragColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
  } else {
    gl_FragColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  }
</code></pre>
<p>摘自 <a href="https://www.khronos.org/files/opengles_shading_language.pdf">GLSL ES 1.0 spec Appendix A, Section 6</a></p>
<blockquote>
<h4>Texture Accesses</h4>
<p>Accessing mip-mapped textures within the body of a non-uniform conditional block gives an undefined
value. A non-uniform conditional block is a block whose execution cannot be determined at compile
time.<p>
</blockquote>
<p>换句话说，如果我们要使用 mip-mapped 的纹理，那我们就必须确保总是能够访问到它们。
我们可以在条件语句内使用访问纹理的结果。例如我们可以写成这样：</p>
<pre class="prettyprint"><code>
  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;

  if (inRange) {
    gl_FragColor = projectedTexColor;
  } else {
    gl_FragColor = texColor;
  }
</code></pre>
<p>或者这样</p>
<pre class="prettyprint"><code>
  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;

  gl_FragColor = inRange ? projectedTexColor : texColor;
</code></pre>
<p>但是我们不能在条件语句内访问 mip-mapped 的纹理本身。这样做在你的 GPU 上可能是可行的，
但并不是在所有的 GPUs 上都能行。注意，规范没有说明能否在条件语句内访问 non-mipmapped 的纹理，所以，
如果你确定你的纹理是 non-mipmapped 的，那就没什么问题。</p>
<p>无论如何，重要的是你要知道有这么个东西</p>
<p>至于我为什么使用 <code>mix</code> 而不使用基于 <code>inRange</code> 的三元运算符，则只是一个个人喜好。<code>mix</code>
更加灵活，所以我通常这样写。</p>
</div>
