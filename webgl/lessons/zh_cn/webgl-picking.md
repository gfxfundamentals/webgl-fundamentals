Title: WebGL 抓取
Description: 如何在 WebGL 中抓取物体
TOC: 抓取 (点击的东西)

这篇文章是关于如何使用 WebGL 来让用户抓取或选择对象。

如果你读过本网站的其他文章，你可能已经意识到 WebGL 本身只是一个栅格化库。它在画布上绘制三角形、直线和点。
它在画布上绘制三角形、线和点，所以它没有"选择对象"的概念，它只是通过你提供的着色器输出像素。
这意味着任何"抓取"对象的概念都必须来自你的代码，你需要自行定义你让用户选择对象的形式。
这也意味着虽然这篇文章可以覆盖(WebGL抓取的)常用概念，但你需要自己决定如何将你在这里看到的东西转化为你自己应用中可用的程序。

## 点击一个物体

关于找到用户点击的物体，一个最简单的方法是：为每一个对象赋予一个数字id，我们可以在关闭光照和纹理的情况下将数字id当作颜色绘制所有对象。
随后我们将得到一帧图片，上面绘制了所有物体的剪影，而深度缓冲会自动帮我们排序。
我们可以读取鼠标坐标下的像素颜色为数字id，就能得到这个位置上渲染的对应物体。

为了实现这一技术，我们需要结合以前的几篇文章。
第一篇是关于[绘制多个物体](webgl-drawing-multiple-things.html),
参考它的内容，我们可以绘制多个物体并尝试抓取。

此外，我们需要在屏幕外渲染这些id，[渲染到纹理](webgl-render-to-texture.html) 中的代码也将添加进来。

那么，让我们参考上个案例，在[多物体绘制](webgl-drawing-multiple-things.html)中绘制了200个物体。

同时，让我们为它添加一个带有纹理和深度缓冲器的帧缓冲器，参考[渲染到纹理](webgl-render-to-texture.html).

```js
// 创建一个纹理对象作为渲染目标
const targetTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, targetTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// 创建一个深度缓冲
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

function setFramebufferAttachmentSizes(width, height) {
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  // 定义 0 级贴图的尺寸和格式
  const level = 0;
  const internalFormat = gl.RGBA;
  const border = 0;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  const data = null;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border,
                format, type, data);

  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
}

// 创建并绑定帧缓冲
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

// 绑定纹理作为一个颜色附件
const attachmentPoint = gl.COLOR_ATTACHMENT0;
const level = 0;
gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

// 创建一个和渲染目标储存相同的深度缓冲
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
```

我们将纹理和深度渲染缓冲区配置代码放到一个函数中，通过调用它来调整它们的尺寸，使之与画布的大小一致。

在我们的代码里，如果Canvas改变尺寸，我们将调整纹理和渲染缓冲区以匹配它。

```js
function drawScene(time) {
  time *= 0.0005;

-  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
+  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
+    // 当canvas改变尺寸后，同步帧缓冲的尺寸
+    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
+  }

...
```

接下来我们需要第二个着色器。例子中的着色器使用顶点颜色，但这个案例中我们的着色器要可以通过id设置固定颜色。
所以以下是我们的第二个着色器。

```html
<!-- vertex shader -->
<script id="pick-vertex-shader" type="x-shader/x-vertex">
  attribute vec4 a_position;
  
  uniform mat4 u_matrix;
  
  void main() {
    // 顶点坐标与矩阵相乘
    gl_Position = u_matrix * a_position;
  }
</script>
<!-- fragment shader -->
<script id="pick-fragment-shader" type="x-shader/x-fragment">
  precision mediump float;
  
  uniform vec4 u_id;
  
  void main() {
     gl_FragColor = u_id;
  }
</script>
```

然后我们需要编译, 链接和查找着色器指向，参考[建议](webgl-less-code-more-fun.html).

```js
// 设置 GLSL 程序
const programInfo = webglUtils.createProgramInfo(
    gl, ["3d-vertex-shader", "3d-fragment-shader"]);
+const pickingProgramInfo = webglUtils.createProgramInfo(
+    gl, ["pick-vertex-shader", "pick-fragment-shader"]);
```

我们需要实现渲染所有的对象两次。一次是用我们分配给它们的着色器，第二次用我们上面写的着色器渲染。
所以我们把目前渲染所有物体的代码提取到一个函数中。

```js
function drawObjects(objectsToDraw, overrideProgramInfo) {
  objectsToDraw.forEach(function(object) {
    const programInfo = overrideProgramInfo || object.programInfo;
    const bufferInfo = object.bufferInfo;

    gl.useProgram(programInfo.program);

    // 设置所有需要的 attributes
    webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // 设置 uniforms.
    webglUtils.setUniforms(programInfo, object.uniforms);

    // 绘制图形
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
  });
}
```

`drawObjects` 中的可选参数 `overrideProgramInfo` 让我们得以传入指定的着色器而不是对象自带的着色器。

我们要调用它两次，一次通过物体id绘制到纹理上，第二次绘制场景到画布上。

```js
// 绘制场景.
function drawScene(time) {
  time *= 0.0005;

  ...

  // 计算所有对象的矩阵.
  objects.forEach(function(object) {
    object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.xRotationSpeed * time,
        object.yRotationSpeed * time);
  });

+  // ------ 将对象绘制到纹理 --------
+
+  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+
+  gl.enable(gl.CULL_FACE);
+  gl.enable(gl.DEPTH_TEST);
+
+  // 清空画布和深度缓冲.
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+
+  drawObjects(objectsToDraw, pickingProgramInfo);
+
+  // ------ 将对象绘制到画布
+
+  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+
+  drawObjects(objectsToDraw);

  requestAnimationFrame(drawScene);
}
```

我们指定的着色器需要使用 `u_id` 来设置物体 id ，我们在设置物体时将它添加到uniforms数据中.

```js
// 配置每个对象的信息
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
+  const id = ii + 1;
  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
      u_matrix: m4.identity(),
+      u_id: [
+        ((id >>  0) & 0xFF) / 0xFF,
+        ((id >>  8) & 0xFF) / 0xFF,
+        ((id >> 16) & 0xFF) / 0xFF,
+        ((id >> 24) & 0xFF) / 0xFF,
+      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
  objects.push(object);
  objectsToDraw.push({
    programInfo: programInfo,
    bufferInfo: shapes[ii % shapes.length],
    uniforms: object.uniforms,
  });
}
```

以上代码通过我们的[实用工具](webgl-less-code-more-fun.html)来处理uniforms调用。

由于我们的目标纹理类型是 `gl.RGBA`, `gl.UNSIGNED_BYTE`，这里必须把id分解为 R, G, B, A 四个通道，每个通道容量为8bit。
8bit意味着只能容纳256个值，但是当我们将id分解为4通道，就拥有了32bit总容量，这对应着40亿以上个值。

我们把id + 1是因为在这里我们使用0代表“指针下没有东西”。

现在让我们高亮指针下的物体。

首先我们需要获取画布下的指针坐标。

```js
// mouseX 和 mouseY 是CSS显示空间下画布中指针的相对位置
let mouseX = -1;
let mouseY = -1;

...

gl.canvas.addEventListener('mousemove', (e) => {
   const rect = canvas.getBoundingClientRect();
   mouseX = e.clientX - rect.left;
   mouseY = e.clientY - rect.top;
});
```

需要注意的是，上面代码中的 `mouseX` 和 `mouseY` 将返回CSS显示空间的像素位置。
这意味着他们在画布显示空间中，而不是画布渲染的像素空间。
换句话说，如果你有这样一个画布

```html
<canvas width="11" height="22" style="width:33px; height:44px;"></canvas>
```

指针穿过画布时 `mouseX` 将从0变化到33，而 `mouseY` 将从0变化到44。  
查看[这个](webgl-resizing-the-canvas.html)以获得更多信息。

现在我们有了指针坐标，编写代码来找到指针下方的像素。

```js
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
const data = new Uint8Array(4);
gl.readPixels(
    pixelX,            // x
    pixelY,            // y
    1,                 // width
    1,                 // height
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    data);             // typed array to hold result
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
```

后面的代码将 `mouseX` 和 `mouseY` 计算为 `pixelX` 和 `pixelY`，这表示从显示空间转换到了渲染空间。
换句话说，在上面的例子中，`mouseX` 的范围是0到33， `mouseY` 的范围是0到44，而转换后 `pixelX` 的范围是0到11，`pixelY` 的范围是0到22。

在实际代码中，使用我们的工具函数`resizeCanvasToDisplaySize`来保持渲染纹理与画布的尺寸相同，所以显示尺寸和画布尺寸是一致的，至少我们为它们可能不一致的情况做了准备。

现在我们得到了一个id，为了确实突出被选中的物体，我们来改变渲染它到画布上的颜色。 我们使用的着色器有一个名为`u_colorMult`的uniform可用。如果一个物体在鼠标下，我们会查找并保存它的`u_colorMult`值，用被选中的颜色替换它，然后恢复它。

```js
// mouseX 和 mouseY 是CSS显示空间下画布中指针的相对位置
let mouseX = -1;
let mouseY = -1;
+let oldPickNdx = -1;
+let oldPickColor;
+let frameCount = 0;

// 绘制场景
function drawScene(time) {
  time *= 0.0005;
+  ++frameCount;

  // ------ 把物体绘制到纹理上 --------

  ...

  // ------ 找到指针下的像素颜色并读取

  const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
  const data = new Uint8Array(4);
  gl.readPixels(
      pixelX,            // x
      pixelY,            // y
      1,                 // width
      1,                 // height
      gl.RGBA,           // format
      gl.UNSIGNED_BYTE,  // type
      data);             // typed array to hold result
  const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

  // 恢复对象的颜色
  if (oldPickNdx >= 0) {
    const object = objects[oldPickNdx];
    object.uniforms.u_colorMult = oldPickColor;
    oldPickNdx = -1;
  }

  // 高亮指针下的颜色
  if (id > 0) {
    const pickNdx = id - 1;
    oldPickNdx = pickNdx;
    const object = objects[pickNdx];
    oldPickColor = object.uniforms.u_colorMult;
    object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
  }

  // ------ 绘制对象到画布上

```

有了以上工作，我们在场景上移动鼠标时，鼠标下的物体就会闪烁。

{{{example url="../webgl-picking-w-gpu.html" }}}

这里我们可以做一个优化，我们要把物品通过id渲染到与画布相同大小的纹理上。在概念上这是最容易做到的。

但是，我们可以只渲染鼠标下面的像素。为了做到这一点，我们使用一个只覆盖这个像素空间的视锥体。

到目前为止，对于3D处理，我们一直在使用一个叫做 `perspective`(透视投影) 的函数，该函数将视场、长宽和近远平面的z值作为输入，并制作一个透视投影矩阵，将这些值所定义的视锥体转换为裁剪空间。

大多数三维数学库都有另一个叫做 `frustum`(正交投影) 的函数，它需要6个值，近Z面的左、右、上、下值，然后是Z面的Z-近和Z-远值，并生成一个由这些值定义的投影矩阵。

利用上述方法，我们可以为鼠标下方的一个像素生成一个投影矩阵

首先，让我们计算近平面的边缘和大小，看看如果我们使用 `perspective`功能，*会是*什么样子的

```js
// 计算覆盖视锥体前方的近平面矩形尺寸
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const top = Math.tan(fieldOfViewRadians * 0.5) * near;
const bottom = -top;
const left = aspect * bottom;
const right = aspect * top;
const width = Math.abs(right - left);
const height = Math.abs(top - bottom);
```

所以 `左`、`右`、`宽`、`高` 是近平面的大小和位置。现在在这个平面上，我们可以计算出鼠标下此像素需要的视锥体大小和位置，并将其传递给`frustum`函数，以生成一个只覆盖这一个像素的投影矩阵

```js
// 计算近平面覆盖鼠标下1像素的部分
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

const subLeft = left + pixelX * width / gl.canvas.width;
const subBottom = bottom + pixelY * height / gl.canvas.height;
const subWidth = 1 / gl.canvas.width;
const subHeight = 1 / gl.canvas.height;

// 为此像素创建视锥体
const projectionMatrix = m4.frustum(
    subLeft,
    subLeft + subWidth,
    subBottom,
    subBottom + subHeight,
    near,
    far);
```

为了使用它，我们需要做一些改变。现在我们的着色器只接受 `u_matrix`，这意味着为了用不同的投影矩阵绘图，我们需要在每一帧为每个物体重新计算矩阵两次，一次是用我们的正常投影矩阵绘制到画布上，另一次是用这个1像素的投影矩阵。

我们可以把这个乘法运算负担从 Javascript 转移到顶点着色器上。

```html
<!-- vertex shader -->
<script id="3d-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;
attribute vec4 a_color;

-uniform mat4 u_matrix;
+uniform mat4 u_viewProjection;
+uniform mat4 u_world;

varying vec4 v_color;

void main() {
-  // 将位置坐标和矩阵相乘
-  gl_Position = u_matrix * a_position;
+  // 
+  gl_Position = u_viewProjection * u_world * a_position;

  // 将颜色传到片段着色器
  v_color = a_color;
}
</script>

...

<!-- vertex shader -->
<script id="pick-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;
  
-uniform mat4 u_matrix;
+uniform mat4 u_viewProjection;
+uniform mat4 u_world;
  
void main() {
-  // 将位置坐标和矩阵相乘
-  gl_Position = u_matrix * a_position;
+  // 将位置坐标和多个矩阵相乘
+  gl_Position = u_viewProjection * u_world * a_position;
}
</script>
```

然后我们可以让我们的JavaScript计算出的`viewProjectionMatrix`在所有对象之间共享。

```js
const objectsToDraw = [];
const objects = [];
+const viewProjectionMatrix = m4.identity();

// 配置每个对象的信息
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
  const id = ii + 1;
  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
-      u_matrix: m4.identity(),
+      u_world: m4.identity(),
+      u_viewProjection: viewProjectionMatrix,
      u_id: [
        ((id >>  0) & 0xFF) / 0xFF,
        ((id >>  8) & 0xFF) / 0xFF,
        ((id >> 16) & 0xFF) / 0xFF,
        ((id >> 24) & 0xFF) / 0xFF,
      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
```

而在我们为每个物体计算矩阵的地方，我们不再纳入视图投影矩阵。
```js
-function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
-  let matrix = m4.translate(viewProjectionMatrix,
+function computeMatrix(translation, xRotation, yRotation) {
+  let matrix = m4.translation(
      translation[0],
      translation[1],
      translation[2]);
  matrix = m4.xRotate(matrix, xRotation);
  return m4.yRotate(matrix, yRotation);
}
...

// 为每一个物体计算矩阵
objects.forEach(function(object) {
  object.uniforms.u_world = computeMatrix(
-      viewProjectionMatrix,
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});
```

我们将创建一个只有1x1像素的纹理和深度缓冲。

```js
setFramebufferAttachmentSizes(1, 1);

...

// 绘制场景
function drawScene(time) {
  time *= 0.0005;
  ++frameCount;

-  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
-    // 当canvas改变尺寸后，同步帧缓冲的尺寸
-    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
-  }
+  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
```

然后在离屏渲染物体id之前，我们将使用我们的1像素投影矩阵，然后在画布上绘图时，我们将使用原始投影矩阵。

```js
-// 计算投影矩阵
-const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
-const projectionMatrix =
-    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

// 使用 lookAt 函数计算相机的矩阵
const cameraPosition = [0, 0, 100];
const target = [0, 0, 0];
const up = [0, 1, 0];
const cameraMatrix = m4.lookAt(cameraPosition, target, up);

// 通过相机矩阵计算视图矩阵
const viewMatrix = m4.inverse(cameraMatrix);

-const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

// 为每个物体计算矩阵
objects.forEach(function(object) {
  object.uniforms.u_world = computeMatrix(
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});

// ------ 把物体渲染到纹理 --------

// 找到指针下的像素
// 并设置渲染此像素的视锥体

{
  // 计算覆盖视锥体前方的近平面矩形尺寸
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const top = Math.tan(fieldOfViewRadians * 0.5) * near;
  const bottom = -top;
  const left = aspect * bottom;
  const right = aspect * top;
  const width = Math.abs(right - left);
  const height = Math.abs(top - bottom);

  // 计算近平面覆盖鼠标下1像素的部分
  const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

  const subLeft = left + pixelX * width / gl.canvas.width;
  const subBottom = bottom + pixelY * height / gl.canvas.height;
  const subWidth = 1 / gl.canvas.width;
  const subHeight = 1 / gl.canvas.height;

  // 为这个像素创建视锥体
  const projectionMatrix = m4.frustum(
      subLeft,
      subLeft + subWidth,
      subBottom,
      subBottom + subHeight,
      near,
      far);
+  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
}

gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.viewport(0, 0, 1, 1);

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

// 清除画布和深度缓冲
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

drawObjects(objectsToDraw, pickingProgramInfo);

// 读取这1个像素
-const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
-const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
const data = new Uint8Array(4);
gl.readPixels(
-    pixelX,            // x
-    pixelY,            // y
+    0,                 // x
+    0,                 // y
    1,                 // width
    1,                 // height
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    data);             // typed array to hold result
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

// 恢复物体的颜色
if (oldPickNdx >= 0) {
  const object = objects[oldPickNdx];
  object.uniforms.u_colorMult = oldPickColor;
  oldPickNdx = -1;
}

// 高亮指针下的物体
if (id > 0) {
  const pickNdx = id - 1;
  oldPickNdx = pickNdx;
  const object = objects[pickNdx];
  oldPickColor = object.uniforms.u_colorMult;
  object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
}

// ------ 将物体绘制到画布上

+{
+  // 计算投影矩阵
+  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+  const projectionMatrix =
+      m4.perspective(fieldOfViewRadians, aspect, near, far);
+
+  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
+}

gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

drawObjects(objectsToDraw);
```

现在你可以看到计算生效了，即使我们只渲染了一个像素，也依然能找到指针下的物体

{{{example url="../webgl-picking-w-gpu-1pixel.html"}}}


