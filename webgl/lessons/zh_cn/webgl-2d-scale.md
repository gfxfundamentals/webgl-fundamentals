Title: WebGL 二维缩放
Description: 如何在二维中缩放物体
TOC: WebGL 二维缩放


此文上接一系列文章，先[从基础概念开始](webgl-fundamentals.html)，上一篇是
[物体旋转](webgl-2d-rotation.html)。

缩放和[平移](webgl-2d-translation.html)一样简单。

让我们将位置乘以期望的缩放值，这是[前例](webgl-2d-rotation.html)中的变化部分。

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // 缩放
+  vec2 scaledPosition = a_position * u_scale;

  // 旋转
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // 平移
  vec2 position = rotatedPosition + u_translation;
```

然后需要在JavaScript中绘制的地方设置缩放量。

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];

  ...

  // 绘制场景
  function drawScene() {

    ...

    // 设置平移
    gl.uniform2fv(translationLocation, translation);

    // 设置旋转
    gl.uniform2fv(rotationLocation, rotation);

+    // 设置缩放
+    gl.uniform2fv(scaleLocation, scale);

    // 绘制几何体
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;  // 6 个三角形组成 'F', 每个三角形 3 个点
    gl.drawArrays(primitiveType, offset, count);
  }
```

现在我们有了缩放，拖动滑块试试。

{{{example url="../webgl-2d-geometry-scale.html" }}}

值得一提的是，缩放值为负数的时候会翻转几何体。

希望之前的3篇文章能够帮助你理解[平移](webgl-2d-translation.html)，
[旋转](webgl-2d-rotation.html) 和缩放。接下来我们将复习
[神奇的矩阵](webgl-2d-matrices.html)，这三种操作将包含在一个矩阵中，
并表现为一种常用形式。

<div class="webgl_bottombar">
<h3>为什么使用'F'做示例?</h3>
<p>
起初我看到有人在纹理上使用'F'，'F'本身并不重要，重要的是你可以从任何角度辨别出它的方向。如果我们使用心形❤或者三角形△，就无法判断出在水平方向是否翻转，一个圆形○就更糟糕了。理论上使用一个四个角有不同颜色的矩形也可以，但这样你就要记住每个角是什么颜色，F的方向可以立即判断出来。
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
可以分辨方向的任何形状都是可以的，自从我知道了这些后就一直用的'F'。
</p>
</div>




