Title: WebGL 雾
Description: 怎样实现雾
TOC: WebGL 雾


这篇文章是WebGL系列文章的一部分。从[基础概念](webgl-fundamentals.html)开始。

WebGL实现雾效果对我来说很有趣，因为当我思考它是如何实现时，会觉得它很*假*。基本上你所做的就是在着色器中使用某些从相机位置计算的深度或者距离来使颜色或多或少的成为雾色。 

换句话说你从这样的基本公式开始

```glsl
gl_FragColor = mix(originalColor, fogColor, fogAmount);
```

其中`fogAmount`是0到1之间的值。`mix`函数混合前2个值。当`fogAmount`为0时，`mix`返回`originalColor`。当`fogAmount`为1时，`mix` 返回`fogColor`。在0到1之间时，你会获得两个颜色按百分比混合的颜色值。你可以像这样自己实现`mix` 

```glsl
gl_FragColor = originalColor + (fogColor - originalColor) * fogAmount;
```

让我们来写一个这样的着色器。我们会使用[纹理](webgl-3d-textures.html)文章中的纹理立方体。

让我们将混合函数添加到片断着色器

```glsl
precision mediump float;

// 由顶点着色器传入。
varying vec2 v_texcoord;

// 纹理。
uniform sampler2D u_texture;

+uniform vec4 u_fogColor;
+uniform float u_fogAmount;

void main() {
+  vec4 color = texture2D(u_texture, v_texcoord);
+  gl_FragColor = mix(color, u_fogColor, u_fogAmount);  
}
```

然后在初始化阶段，我们需要查找新的全局变量位置

```js
var fogColorLocation = gl.getUniformLocation(program, "u_fogColor");
var fogAmountLocation = gl.getUniformLocation(program, "u_fogAmount");
```

在渲染阶段设置他们

```js
var fogColor = [0.8, 0.9, 1, 1];
var settings = {
  fogAmount: .5,
};

...

function drawScene(time) {
  ...

  // 清除画布和深度缓冲区。
  // 用雾的颜色清除
  gl.clearColor(...fogColor);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  ...

  // 设置雾色和雾量
  gl.uniform4fv(fogColorLocation, fogColor);
  gl.uniform1f(fogAmountLocation, settings.fogAmount);

  ...
}
```

在这里你会看到如果拖动滑块，可以在纹理和雾色之间变化

{{{example url="../webgl-3d-fog-just-mix.html" }}}

所以现在我们真正需要做的是根据一些原则例如以相机为基准的深度来计算雾量代替传入雾量。

回想关于[相机](webgl-3d-camera.html)的文章，在我们应用视图矩阵之后，所有位置转换为相对于相机的位置。相机看向-z轴，所以如果我们只看z位置，在乘以世界和视图矩阵之后，我们会得到一个值代表相较于相机所在z平面的距离。

让我们改变顶点着色器来传递那个数据给片断着色器，使我们能够用它来计算雾量。为此，我们将`u_matrix`分成两部分。一个投影矩阵和一个世界视图矩阵。

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;

-uniform mat4 u_matrix;
+uniform mat4 u_worldView;
+uniform mat4 u_projection;

varying vec2 v_texcoord;
+varying float v_fogDepth;

void main() {
  // 给位置乘以矩阵
-  gl_Position = u_matrix * a_position;
+  gl_Position = u_projection * u_worldView * a_position;

  // 传递纹理坐标给片断着色器
  v_texcoord = a_texcoord;

+  // 传递相对于相机的负z位置
+  // 相机看向-z方向，所以通常
+  // 在相机前面的物体会有一个负Z位置
+  // 取负我们得到一个正的深度
+  v_fogDepth = -(u_worldView * a_position).z;
}
```

现在在片断着色器中我们希望如果深度小于某些值，不融合雾色(fogAmount = 0)。如果深度大于某个值则为100%雾色(fogAmount = 1)。在两个值之间则融合颜色。

我们可以编写代码来实现这点，但GLSL有一个函数`smoothstep`就是这样做的。你给定最小值，最大值，和要测试的值。如果测试值小于等于最小值返回0。如果测试值大于等于最大值返回1。如果测试值在两值之间，则根据测试值在最小值和最大值之间的位置返回0到1之间的插值。

所以，在我们的片断着色器中使用它来计算雾量会是非常简单的。

```glsl
precision mediump float;

// 从顶点着色器传入的。
varying vec2 v_texcoord;
varying float v_fogDepth;

// 纹理。
uniform sampler2D u_texture;
uniform vec4 u_fogColor;
-uniform float u_fogAmount;
+uniform float u_fogNear;
+uniform float u_fogFar;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);

+  float fogAmount = smoothstep(u_fogNear, u_fogFar, v_fogDepth);

-  gl_FragColor = mix(color, u_fogColor, u_fogAmount);  
+ gl_FragColor = mix(color, u_fogColor, fogAmount);  
}
```

当然我们需要在初始化阶段找到所有的全局变量

```js
// 查找全局变量
+var projectionLocation = gl.getUniformLocation(program, "u_projection");
+var worldViewLocation = gl.getUniformLocation(program, "u_worldView");
var textureLocation = gl.getUniformLocation(program, "u_texture");
var fogColorLocation = gl.getUniformLocation(program, "u_fogColor");
+var fogNearLocation = gl.getUniformLocation(program, "u_fogNear");
+var fogFarLocation = gl.getUniformLocation(program, "u_fogFar");
```

在渲染阶段设置他们 

```js
var fogColor = [0.8, 0.9, 1, 1];
var settings = {
-  fogAmount: .5,
+  fogNear: 1.1,
+  fogFar: 2.0,
};

// 绘制场景
function drawScene(time) {
  ...

  // 计算投影矩阵
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  var cameraPosition = [0, 0, 2];
  var up = [0, 1, 0];
  var target = [0, 0, 0];

  // 使用look at函数计算相机矩阵
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // 由相机矩阵计算视图矩阵
  var viewMatrix = m4.inverse(cameraMatrix);

-  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
-
-  var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
-  matrix = m4.yRotate(matrix, modelYRotationRadians);

+  var worldViewMatrix = m4.xRotate(viewMatrix, modelXRotationRadians);
+  worldViewMatrix = m4.yRotate(worldViewMatrix, modelYRotationRadians);

  // 设置矩阵
-  gl.uniformMatrix4fv(matrixLocation, false, matrix);
+  gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
+  gl.uniformMatrix4fv(worldViewLocation, false, worldViewMatrix);

  // 告诉着色器对于u_texture使用纹理单元0
  gl.uniform1i(textureLocation, 0);

  // 设置雾颜色和最近值，最远值
  gl.uniform4fv(fogColorLocation, fogColor);
+  gl.uniform1f(fogNearLocation, settings.fogNear);
+  gl.uniform1f(fogFarLocation, settings.fogFar);
-  gl.uniform1f(fogAmountLocation, settings.fogAmount);
```

我们绘制了40个立方体在不同的距离上，以便更容易看到雾效果。

```js
var settings = {
  fogNear: 1.1,
  fogFar: 2.0,
+  xOff: 1.1,
+  zOff: 1.4,
};

...

const numCubes = 40;
for (let i = 0; i <= numCubes; ++i) {
  var worldViewMatrix = m4.translate(viewMatrix, -2 + i * settings.xOff, 0, -i * settings.zOff);
  worldViewMatrix = m4.xRotate(worldViewMatrix, modelXRotationRadians + i * 0.1);
  worldViewMatrix = m4.yRotate(worldViewMatrix, modelYRotationRadians + i * 0.1);

  gl.uniformMatrix4fv(worldViewLocation, false, worldViewMatrix);

  // 绘制几何体
  gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
}
```

现在我们得到了基于深度的雾

{{{example url="../webgl-3d-fog-depth-based.html" }}}

注意：我们没有添加任何代码来确保`fogNear`小于等于`fogFar`，这可能是无效的设置，所以确保设定它们为合适的值。

正如上面提到的，对我来说这像一个诡计。它看起来像雾因为雾色和背景色相同。改变背景色，幻觉消失了。

```js
-gl.clearColor(...fogColor);
+gl.clearColor(1, 0, 0, 1);  // red
```

得到

<div class="webgl_center"><img src="resources/fog-background-color-mismatch.png"></div>

所以请记住，你需要设置背景颜色匹配雾色。

使用深度很简单但是有一个问题。假设围绕相机有一圈物体。我们根据到相机z平面的距离计算雾量。这意味着你转动相机，当它在视图空间中的z值趋近于0，物体会越来越不受雾的影响。

<div class="webgl_center"><img src="resources/fog-depth.svg" style="width: 600px;"></div>

在这个例子中你会看到问题

{{{example url="../webgl-3d-fog-depth-based-issue.html" }}}

上面有8个立方体在相机为中心的圆环上。相机在它的位置旋转。这意味着立方体总是距相机相同的距离，但是距离Z平面不同的距离。所以我们的雾量计算方法会导致边缘附近的立方体会从雾中出来。
 
修复方法是用计算到相机的距离代替，这对于所有的立方体都是相同的。

<div class="webgl_center"><img src="resources/fog-distance.svg" style="width: 600px;"></div>

为此，我们只需将视图空间中的顶点位置从顶点着色器传递到片断着色器

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_worldView;
uniform mat4 u_projection;

varying vec2 v_texcoord;
-varying float v_fogDepth;
+varying vec3 v_position;

void main() {
  // 给位置乘以矩阵。
  gl_Position = u_projection * u_worldView * a_position;

  // 传递纹理坐标给片断着色器。
  v_texcoord = a_texcoord;

-  // 传递相对于相机的负z位置
-  // 相机看向-z方向，所以通常
-  // 在相机前面的物体会有一个负Z位置
-  // 取负我们得到一个正的深度
-  v_fogDepth = -(u_worldView * a_position).z;
+  // 传递视图位置给片断着色器
+  v_position = (u_worldView * a_position).xyz;
}
```

然后在片断着色器中我们可以使用位置来计算距离

```
precision mediump float;

// 从顶点着色器传入
varying vec2 v_texcoord;
-varying float v_fogDepth;
+varying vec3 v_position;

// 纹理。
uniform sampler2D u_texture;
uniform vec4 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);

-  float fogAmount = smoothstep(u_fogNear, u_fogFar, v_fogDepth);
+  float fogDistance = length(v_position);
+  float fogAmount = smoothstep(u_fogNear, u_fogFar, fogDistance);

  gl_FragColor = mix(color, u_fogColor, fogAmount);  
}
```

现在，当相机转动时，立方体不再从雾中出来

{{{example url="../webgl-3d-fog-distance-based.html" }}}

到目前为止，我们所有的雾都使用了线性计算。换句话说，在最近处到最远处之间雾颜色被线性地施加。像现实中的许多事物一样，雾是指数方式显现的。它根据距观察者距离的平方变厚。一个常见的指数雾公式是

```glsl
#define LOG2 1.442695

fogAmount = 1. - exp2(-fogDensity * fogDensity * fogDistance * fogDistance * LOG2));
fogAmount = clamp(fogAmount, 0., 1.);
```

要使用它，我们将片断着色器改成这样

```
precision mediump float;

// 从顶点着色器传入。
varying vec2 v_texcoord;
varying vec3 v_position;

// 纹理。
uniform sampler2D u_texture;
uniform vec4 u_fogColor;
-uniform float u_fogNear;
-uniform float u_fogFar;
+uniform float u_fogDensity;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);

  #define LOG2 1.442695

  float fogDistance = length(v_position);
-  float fogAmount = smoothstep(u_fogNear, u_fogFar, fogDistance);
+  float fogAmount = 1. - exp2(-u_fogDensity * u_fogDensity * fogDistance * fogDistance * LOG2);
  fogAmount = clamp(fogAmount, 0., 1.);

  gl_FragColor = mix(color, u_fogColor, fogAmount);  
}
```

我们得到了距离*exp2*基于密度的雾

{{{example url="../webgl-3d-fog-distance-exp2.html" }}}

需要注意的是基于密度的雾没有最近值和最远值设置。它可能更符合真实情况但也可能不符合你的审美需求。你更喜欢哪一个是一个艺术问题。

还有很多其他计算雾的方法。在低性能GPU上，你可能只使用`gl_FragCoord.z`。`gl_FragCoord`是WebGL内置的全局变量。`x`和`y`分量是被绘制像素的坐标。`z`坐标是像素的深度，范围从0到1。虽然不能直接转换到距离，但你仍然可以选取从0到1的某些值作为最近值和最远值来获得看起来像雾的效果。没有需要从顶点着色器传递到片断着色器的值，也不需要距离计算，所以这是一个在低性能GPU上节省的方法。

{{{example url="../webgl-3d-fog-depth-based-gl_FragCoord.html" }}}

