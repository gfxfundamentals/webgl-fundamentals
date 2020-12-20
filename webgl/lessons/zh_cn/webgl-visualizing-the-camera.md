Title: WebGL 可视化相机
Description: 如何绘制一个相机视椎体
TOC: 可视化相机

本文假设你已经读过 [多个视角的文章](webgl-multiple-views.html) 了。如果你还没有读过，请 [先去阅读](webgl-multiple-views.html)。

本文还假设你已经读过 [码少趣多](webgl-less-code-more-fun.html)，因为本文使用到了那里提到的库，以便使得本文的例子更整洁。如果你不明白 `webglUtils.setBuffersAndAttributes` 函数是设置 buffers 和 attributes 的，或者不明白 `webglUtils.setUniforms` 函数是设置 uniforms 的，等等之类的函数你都不能理解，那么你可能要往回 [读读基础](webgl-fundamentals.html)。

将相机能看到什么进行可视化通常是非常有用的，即可视化相机的视椎体。这也是非常容易的。如 [正交](webgl-3d-orthographic.html) 投影和 [透视](webgl-3d-perspective.html) 投影所说的那样，那些投影矩阵将某些空间的坐标转换为范围在 -1 到 +1 的裁剪空间。一个相机矩阵只是一个在世界空间中表示相机位置和方位的矩阵。

所以，如果要可视化相机的话，第一件要做的事就很显然了。如果我们只是使用相机矩阵去绘制某些东西，我们就可以得到一个代表相机的物体。复杂的地方在于相机并不能看到它本身，但是，如果使用 [多个视角](webgl-multiple-views.html) 中的技术，我们就可以拥有 2 个视角。对于每个视角，我们会使用不同的相机。第 2 个视角会看向第 1 个视角，因此第 2 个视角能够看到我们正在绘制的这个物体，这个物体表示的是第 1 个视角中的相机。

首先，让我们创建一些表示相机的数据。让我们创建一个立方体，然后在立方体的末端添加一个圆锥。我们会使用线段来绘制这个物体。我们会使用 [索引](webgl-indexed-vertices.html) 来连接顶点。

[相机](webgl-3d-camera.html) 看向的是 -Z 方向，所以，让我们把立方体和圆锥放到 +Z 这边，而圆锥的开口方向是 -Z 方向。

首先的是立方体的线框

```js
// 为一个相机创建几何
function createCameraBufferInfo(gl) {
  // 首先，让我们添加一个立方体。它的范围是 1 到 3，
  // 因为相机看向的是 -Z 方向，所以我们想要相机在 Z = 0 处开始
  const positions = [
    -1, -1,  1,  // 立方体的顶点
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // 立方体的索引
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

然后，让我们添加圆锥的的线框

```js
// 为一个相机创建几何
function createCameraBufferInfo(gl) {
  // 首先，让我们添加一个立方体。它的范围是 1 到 3，
  // 因为相机看向的是 -Z 方向，所以我们想要相机在 Z = 0 处开始。
+  // 我们会把一个圆锥放到该立方体的前面，
+  // 且该圆锥的开口方向朝 -Z 方向。
  const positions = [
    -1, -1,  1,  // 立方体的顶点
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
+     0,  0,  1,  // 圆锥的尖头
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // 立方体的索引
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
+  // 添加圆锥的片段
+  const numSegments = 6;
+  const coneBaseIndex = positions.length / 3; 
+  const coneTipIndex =  coneBaseIndex - 1;
+  for (let i = 0; i < numSegments; ++i) {
+    const u = i / numSegments;
+    const angle = u * Math.PI * 2;
+    const x = Math.cos(angle);
+    const y = Math.sin(angle);
+    positions.push(x, y, 0);
+    // 从圆锥尖头到圆锥边缘的线段
+    indices.push(coneTipIndex, coneBaseIndex + i);
+    // 从圆锥边缘一点到圆锥边缘下一点的线段
+    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
+  }
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

最后，让我们添加一个缩放比例，因为我们的 F 高 150 个单位长度，而这个相机的尺寸是 2 到 3 个单位长度，所以它在我们的 F 旁边会很小。当我们绘制它的时候，我们可以将它乘以一个缩放矩阵，使其缩放一定的比例，或者我们也可以像下面这样直接对数据本身进行缩放。

```js
-function createCameraBufferInfo(gl) {
+function createCameraBufferInfo(gl, scale = 1) {
  // 首先，让我们添加一个立方体。它的范围是 1 到 3，
  // 因为相机看向的是 -Z 方向，所以我们想要相机在 Z = 0 处开始。
  // 我们会把一个圆锥放到该立方体的前面，
  // 且该圆锥的开口方向朝 -Z 方向。
  const positions = [
    -1, -1,  1,  // 立方体的顶点
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
     0,  0,  1,  // 圆锥的尖头
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // 立方体的索引
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  // 添加圆锥的片段
  const numSegments = 6;
  const coneBaseIndex = positions.length / 3; 
  const coneTipIndex =  coneBaseIndex - 1;
  for (let i = 0; i < numSegments; ++i) {
    const u = i / numSegments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, 0);
    // 从圆锥尖头到圆锥边缘的线段
    indices.push(coneTipIndex, coneBaseIndex + i);
    // 从圆锥边缘一点到圆锥边缘下一点的线段
    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
  }
+  positions.forEach((v, ndx) => {
+    positions[ndx] *= scale;
+  });
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

我们现在的着色器程序绘制的是顶点的颜色。让我们创建另一个绘制纯色的着色器程序。

```html
<script id="solid-color-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;

uniform mat4 u_matrix;

void main() {
  // 将 position 乘以矩阵
  gl_Position = u_matrix * a_position;
}
</script>
<!-- fragment shader -->
<script id="solid-color-fragment-shader" type="x-shader/x-fragment">
precision mediump float;

uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
</script>  
```

现在，让我们使用它们来绘制一个场景，该场景内有一个相机看着另一个场景。

```js
// 设置 GLSL 程序
// 编译着色器、链接程序、查找 locations
-const programInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
+const vertexColorProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
+const solidColorProgramInfo = webglUtils.createProgramInfo(gl, ['solid-color-vertex-shader', 'solid-color-fragment-shader']);

// 为一个 3D 的 'F' 创建 buffers 并用数据来填充
const fBufferInfo = primitives.create3DFBufferInfo(gl);

...

+const cameraScale = 20;
+const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);

...

const settings = {
  rotation: 150,  // 以角度为单位
+  cam1FieldOfView: 60,  // 以角度为单位
+  cam1PosX: 0,
+  cam1PosY: 0,
+  cam1PosZ: -200,
};


function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);

  // 我们要把视角分成 2 个
  const effectiveWidth = gl.canvas.clientWidth / 2;
  const aspect = effectiveWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // 计算一个透视投影矩阵
  const perspectiveProjectionMatrix =
-      m4.perspective(fieldOfViewRadians), aspect, near, far);
+      m4.perspective(degToRad(settings.cam1FieldOfView), aspect, near, far);

  // 使用 look at 计算相机的矩阵
-  const cameraPosition = [0, 0, -75];
+  const cameraPosition = [
+      settings.cam1PosX, 
+      settings.cam1PosY,
+      settings.cam1PosZ,
+  ];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // 使 F 围绕着它的原点
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // draw on the left with orthographic camera
  // 使用正交相机绘制在左边
  gl.viewport(0, 0, leftWidth, height);
  gl.scissor(0, 0, leftWidth, height);
  gl.clearColor(1, 0.8, 0.8, 1);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);

  // 使用透视相机绘制在右边
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
  gl.scissor(leftWidth, 0, rightWidth, height);
  gl.clearColor(0.8, 0.8, 1, 1);

  // 计算第二个投影矩阵和第二个相机
+  const perspectiveProjectionMatrix2 =
+      m4.perspective(degToRad(60), aspect, near, far);
+
+  // 使用 look at 计算相机的矩阵
+  const cameraPosition2 = [-600, 400, -400];
+  const target2 = [0, 0, 0];
+  const cameraMatrix2 = m4.lookAt(cameraPosition2, target2, up);

-  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
+  drawScene(perspectiveProjectionMatrix2, cameraMatrix2, worldMatrix);

+  // 绘制代表第一个相机的物体
+  {
+    // 从第 2 个相机矩阵中创建一个视图矩阵
+    const viewMatrix = m4.inverse(cameraMatrix2);
+
+    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
+    // 使用第一个相机的矩阵作为表示相机的物体的世界矩阵
+    mat = m4.multiply(mat, cameraMatrix);
+
+    gl.useProgram(solidColorProgramInfo.program);
+
+    // ------ 绘制表示相机的物体 --------
+
+    // 设置所有需要的 attributes
+    webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, cameraBufferInfo);
+
+    // 设置 uniforms
+    webglUtils.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    webglUtils.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);
+  }
}
render();
```

现在，我们可以在右边的场景内看到用来渲染左边场景的相机了。

{{{example url="../webgl-visualize-camera.html"}}}

让我们再绘制一些东西来表示相机的视椎体。

因为视椎体表示的是将某一空间的坐标转换到裁剪空间的转换，这样我们就可以创建一个表示裁剪空间的立方体，然后使用投影矩阵的逆矩阵把该立方体放置到场景内。

首先，我们需要一个裁剪空间的立方体线框。

```js
function createClipspaceCubeBufferInfo(gl) {
  // 首先，让我们添加一个立方体。它的范围是 1 到 3，
  // 因为相机看向的是 -Z 方向，所以我们想要相机在 Z = 0 处开始。
  // 我们会把一个圆锥放到该立方体的前面，
  // 且该圆锥的开口方向朝 -Z 方向。
  const positions = [
    -1, -1, -1,  // 立方体的顶点
     1, -1, -1,
    -1,  1, -1,
     1,  1, -1,
    -1, -1,  1,
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // 立方体的索引
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

然后我们创建一个立方体并绘制它

```js
const cameraScale = 20;
const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);

+const clipspaceCubeBufferInfo = createClipspaceCubeBufferInfo(gl);

...

  // 绘制表示第一个相机的物体
  {
    // 从相机矩阵中创建一个视图矩阵
    const viewMatrix = m4.inverse(cameraMatrix2);

    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
    // 使用第一个相机的矩阵作为表示相机的物体的世界矩阵
    mat = m4.multiply(mat, cameraMatrix);

    gl.useProgram(solidColorProgramInfo.program);

    // ------ 绘制表示相机的物体 --------

    // 设置所有需要的 attributes
    webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, cameraBufferInfo);

    // 设置 uniforms
    webglUtils.setUniforms(solidColorProgramInfo, {
      u_matrix: mat,
      u_color: [0, 0, 0, 1],
    });

    webglUtils.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);

+    // ----- 绘制视椎体 -------
+
+    mat = m4.multiply(mat, m4.inverse(perspectiveProjectionMatrix));
+
+    // 设置所有需要的 attributes
+    webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, clipspaceCubeBufferInfo);
+
+    // 设置 uniforms
+    webglUtils.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    webglUtils.drawBufferInfo(gl, clipspaceCubeBufferInfo, gl.LINES);
  }
}
```

让我们修改一下，以便我们可以调整第一个相机的近平面和远平面设置

```js
const settings = {
  rotation: 150,  // 以角度为单位
  cam1FieldOfView: 60,  // 以角度为单位
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
+  cam1Near: 30,
+  cam1Far: 500,
};

...

  // 计算一个透视投影矩阵
  const perspectiveProjectionMatrix =
      m4.perspective(degToRad(settings.cam1FieldOfView),
      aspect,
-      near,
-      far);
+      settings.cam1Near,
+      settings.cam1Far);
```

现在我们可以同时看到视椎体了。

{{{example url="../webgl-visualize-camera-with-frustum.html"}}}

如果你调整近平面或远平面或视场角，则它们会裁剪那个 F，你可以看到表示视椎体的物体匹配上了。

无论我们为左边的相机使用的是透视投影还是正交投影，它都能正常工作，因为一个投影矩阵总是会转换为裁剪空间，所以投影矩阵的逆矩阵总是会把我们传入的 +1 到 -1 立方体进行适当的扭曲。

```js
const settings = {
  rotation: 150,  // 以角度为单位
  cam1FieldOfView: 60,  // 以角度为单位
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
  cam1Near: 30,
  cam1Far: 500,
+  cam1Ortho: true,
+  cam1OrthoUnits: 120,
};

...

// 计算一个投影矩阵
const perspectiveProjectionMatrix = settings.cam1Ortho
    ? m4.orthographic(
        -settings.cam1OrthoUnits * aspect,  // left
         settings.cam1OrthoUnits * aspect,  // right
        -settings.cam1OrthoUnits,           // bottom
         settings.cam1OrthoUnits,           // top
         settings.cam1Near,
         settings.cam1Far)
    : m4.perspective(degToRad(settings.cam1FieldOfView),
        aspect,
        settings.cam1Near,
        settings.cam1Far);
```

{{{example url="../webgl-visualize-camera-with-orthographic.html"}}}

那些使用 3D 建模软件（例如 [Blender](https://blender.org)）或者带有场景编辑工具的游戏引擎（例如 [Unity](https://unity.com) 或 [Godot](https://godotengine.org/)）的人应该对这种可视化非常熟悉。

这种可视化对于 debugging 也非常有用。
