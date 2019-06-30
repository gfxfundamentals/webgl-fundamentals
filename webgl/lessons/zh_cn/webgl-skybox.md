Title: WebGL 天空盒
Description: 用天空盒来展示天空!
TOC: WebGL 天空盒


这篇文章是WebGL系列文章的一部分。
从[基础概念](webgl-fundamentals.html)开始。
上接[环境贴图](webgl-environment-maps.html)。

*天空盒*是一个赋予材质的盒子看起来好像四周全是天空或者看起来像是在很远的地方，包括地平线。想象你站在一个房间里每面墙上都是全尺寸的海报，天花板的海报是天空，地板上的显示地面，这就是天空盒。

许多3D游戏用一个立方体实现它，使它非常大，给它赋予天空的材质。

这有效但有问题。一个问题是你有一个立方体你需要看向许多方向，无论相机看向什么方向，你希望最远的所有物体都能被绘制，但是你不希望立方体的角在裁剪面之外。深入解释这个问题，出于性能考虑你希望在远的物体之前先绘制近的物体，因为GPU使用[深度缓冲检测](webgl-3d-orthographic.html)，会不绘制无法通过测试的像素。所以理想情况下你需要在深度检测的情况下最后绘制天空盒，但是如果你真的用了一个盒子，当相机朝不同的方向看时，盒子的角会比侧面更远这会引起问题。

<div class="webgl_center"><img src="resources/skybox-issues.svg" style="width: 500px"></div>

你可以看到上图，我们需要确保立方体最远点在视锥体内，但是由于这个原因，立方体的某些边缘可能最终覆盖了我们不想掩盖的物体。

典型的解决方案是关闭深度检测并首先绘制天空盒，但是我们也不能利用深度检测不会绘制场景中会被覆盖的物体的特性了。

代替使用立方体，我们仅仅绘制一个覆盖整个画布的矩形，并使用[立方体贴图](webgl-cube-maps.html)。通常我们使用视图投影矩阵在三维空间中投影矩形。在这里，我们会做相反的事情。我们会反过来使用视图投影矩阵的逆来获取相机看向矩形每一个像素的方向。这会是看向立方体贴图的方向。

从[环境贴图](webgl-environment-maps.html)文章中的例子开始，我移除了所有在这里我们不需要使用的关于法线的代码。之后我们需要一个矩形。

```
// 填充定义矩形的值给缓冲
function setGeometry(gl) {
  var positions = new Float32Array(
    [
      -1, -1, 
       1, -1, 
      -1,  1, 
      -1,  1,
       1, -1,
       1,  1,
    ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}
```

因为已经是裁剪空间中的坐标，矩形会铺满画布。由于每个顶点只有2个值，我们需要更改设置属性的代码。

```
// 告诉位置属性怎么从位置缓冲positionBuffer (ARRAY_BUFFER)中取数据
-var size = 3;          // 每次迭代提取3个单位数据
+var size = 2;          // 每次迭代提取2个单位数据
var type = gl.FLOAT;   // 数据是32位浮点型
var normalize = false; // 不归一化数据
var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存sizeof(type)
var offset = 0;        // 从缓冲起始位置开始读取
gl.vertexAttribPointer(
    positionLocation, size, type, normalize, stride, offset)
```

接下来对于顶点着色器，我们直接将`gl_Position`设置为四边形顶点。不需要任何矩阵变换因为位置已经在裁剪空间中，被设定为覆盖整个画布。我们设置 `gl_Position.z`为1 确保像素有最远的深度。接下来我们传递位置给片断着色器。

```
attribute vec4 a_position;
varying vec4 v_position;
void main() {
  v_position = a_position;
  gl_Position = a_position;
  gl_Position.z = 1;
}
```

在片断着色器中我们将position和视图投影矩阵的逆相乘，除以w转换4D到3D。

```
precision mediump float;

uniform samplerCube u_skybox;
uniform mat4 u_viewDirectionProjectionInverse;

varying vec4 v_position;
void main() {
  vec4 t = u_viewDirectionProjectionInverse * v_position;
  gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
}
```

最后我们需要获取全局属性位置

```
var skyboxLocation = gl.getUniformLocation(program, "u_skybox");
var viewDirectionProjectionInverseLocation = 
    gl.getUniformLocation(program, "u_viewDirectionProjectionInverse");
```

设置他们

```
// 计算投影矩阵
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var projectionMatrix =
    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

// 相机在以原点为圆心直径2个单位的圆上看向原点
var cameraPosition = [Math.cos(time * .1), 0, Math.sin(time * .1)];
var target = [0, 0, 0];
var up = [0, 1, 0];
// 用look at计算相机矩阵。
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// 由相机矩阵得出视图矩阵。
var viewMatrix = m4.inverse(cameraMatrix);

// 我们只关心方向所以清除移动的部分
viewMatrix[12] = 0;
viewMatrix[13] = 0;
viewMatrix[14] = 0;

var viewDirectionProjectionMatrix = 
    m4.multiply(projectionMatrix, viewMatrix);
var viewDirectionProjectionInverseMatrix = 
    m4.inverse(viewDirectionProjectionMatrix);

// 设置全局变量
gl.uniformMatrix4fv(
    viewDirectionProjectionInverseLocation, false, 
    viewDirectionProjectionInverseMatrix);

// 告诉着色器对于u_skybox使用纹理单元0
gl.uniform1i(skyboxLocation, 0);
```

注意上边我们围绕原点旋转相机并计算相机位置`cameraPosition`。 然后，在转换相机矩阵`cameraMatrix`到视图矩阵`viewMatrix`之后，我们将表示移动的部分清零因为我们只关心相机看向哪里，而非它在哪里。

给结果乘以投影矩阵，求逆矩阵，之后设置矩阵。

{{{example url="../webgl-skybox.html" }}}

让我们在这个例子中结合环境映射的立方体。我们会使用[码少趣多](webgl-less-code-more-fun.html)中介绍的utils.

我们需要加入两组着色器

```
<script id="skybox-vertex-shader" type="x-shader/x-vertex">
...
<script id="skybox-fragment-shader" type="x-shader/x-fragment">
...
<script id="envmap-vertex-shader" type="x-shader/x-vertex">
...
<script id="envmap-fragment-shader" type="x-shader/x-fragment">
...
```

然后编译着色器，找到所有的属性和全局变量的位置

```
// 设置GLSL程序查找位置 
const envmapProgramInfo = webglUtils.createProgramInfo(
    gl, ["envmap-vertex-shader", "envmap-fragment-shader"]);
const skyboxProgramInfo = webglUtils.createProgramInfo(
    gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);
```

使用顶点数据设置缓冲。 `primitives`库已经有提供这些数据的函数，所以我们可以使用它们。

```
// 创建缓冲并填充顶点数据
const cubeBufferInfo = primitives.createCubeBufferInfo(gl, 1);
const quadBufferInfo = primitives.createXYQuadBufferInfo(gl);
```

在渲染阶段我们计算了所有矩阵

```
// 相机在以原点为圆心直径2个单位的圆上看向原点 
var cameraPosition = [Math.cos(time * .1) * 2, 0, Math.sin(time * .1) * 2];
var target = [0, 0, 0];
var up = [0, 1, 0];
// 使用look at计算相机矩阵
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// 通过相机矩阵创建视图矩阵
var viewMatrix = m4.inverse(cameraMatrix);

// 以x轴旋转立方体
var worldMatrix = m4.xRotation(time * 0.11);

// 我们只关心方向所以清除移动的部分
var viewDirectionMatrix = m4.copy(viewMatrix);
viewDirectionMatrix[12] = 0;
viewDirectionMatrix[13] = 0;
viewDirectionMatrix[14] = 0;

var viewDirectionProjectionMatrix = m4.multiply(
    projectionMatrix, viewDirectionMatrix);
var viewDirectionProjectionInverseMatrix = 
    m4.inverse(viewDirectionProjectionMatrix);
```

然后先绘制立方体

```
// 绘制立方体
gl.useProgram(envmapProgramInfo.program);
webglUtils.setBuffersAndAttributes(gl, envmapProgramInfo, cubeBufferInfo);
webglUtils.setUniforms(envmapProgramInfo, {
  u_world: worldMatrix,
  u_view: viewMatrix,
  u_projection: projectionMatrix,
  u_texture: texture,
  u_worldCameraPosition: cameraPosition,
});
webglUtils.drawBufferInfo(gl, cubeBufferInfo);
```

之后天空盒

```
// 绘制天空盒
gl.useProgram(skyboxProgramInfo.program);
webglUtils.setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo);
webglUtils.setUniforms(skyboxProgramInfo, {
  u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
  u_skybox: texture,
});
webglUtils.drawBufferInfo(gl, quadBufferInfo);
```

结果

{{{example url="../webgl-skybox-plus-environment-map.html" }}}

我希望这3篇文章能让您了解如何使用立方体贴图。比较常见的是用[计算光照](webgl-3d-lighting-spot.html)的代码， 结合结果和环境贴图的结果用来做类似汽车引擎盖或抛光地板的材质。还有一种使用立方体贴图计算光照的技术。和环境贴图方法相同，除了不使用环境贴图的值作为颜色值而是将其作为光照方程的输入。

