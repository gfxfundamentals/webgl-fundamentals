Title: WebGL 三维相机
Description: WebGL中相机的使用方式
TOC: WebGL 三维相机


此文上接WebGL系列文章，从[基础概念](webgl-fundamentals.html)开始，
上一篇是[三维透视投影](webgl-3d-perspective.html)，如果没读过请从那里开始。

在上篇文章中我们将 F 移动到了视锥中，原因是 `m4.perspective`
默认将相机放在了原点(0, 0, 0)并且视锥的范围是 `-zNear` 到 `-zFar`。

将物体移动到视场中可能并不是正确的方法，在实际生活中通常是移动相机去拍摄建筑物。

{{{diagram url="resources/camera-move-camera.html?mode=0" caption="将相机移动到物体前" }}}

将物体移动到相机前面并不是常见做法。

{{{diagram url="resources/camera-move-camera.html?mode=1" caption="将物体移动到相机前" }}}

但在上节中由于投影的原因物体需要在 -Z 轴上，我们通过将相机移动到原点，
物体移动到相机前来保持原始的**相对位置**。

{{{diagram url="resources/camera-move-camera.html?mode=2" caption="将物体移动到相机前" }}}

高效的将物体移动到相机前是非常重要的。最简单的方式是使用一个“逆向”矩阵，
计算逆矩阵的数学原理比较复杂但概念很简单，逆就是你想通过一个值去抵消一个值。
例如，123 的逆就是 -123 ，一个缩放为 5 的缩放矩阵的逆是缩放为 1/5 或 0.2
的缩放矩阵，一个绕 X 轴旋转 30&deg; 的旋转矩阵的逆是绕 X 旋转 -30&deg;。

目前为止我们使用过平移，旋转和缩放去控制 'F' 的位置和姿态，
将这些矩阵相乘后得到一个矩阵，可以将物体从原始位置移动到期望的位置，大小和姿态。
我们可以对相机进行同样的操作，一旦有了相机从原点移动旋转到目标位置的矩阵后，
就可以计算出它的逆矩阵，利用这个逆矩阵可以不动相机，将物体从相反的方向移动到相机前。

让我们来做一个三维场景，像上图一样有一圈 'F' 。

首先，由于5个物体使用的是同一个投影矩阵，所以我们将投影矩阵的计算放在循环外

```

// 计算投影矩阵
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zNear = 1;
var zFar = 2000;
var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

```

接着计算相机矩阵，这个矩阵代表的是相机在世界坐标中的位置和姿态。
下方的代码计算的是看向原点，在半径为 radius * 1.5 的圆上移动的相机。

{{{diagram url="resources/camera-move-camera.html?mode=3" caption="相机运动" }}}

```
var numFs = 5;
var radius = 200;

// 计算相机的矩阵
var cameraMatrix = m4.yRotation(cameraAngleRadians);
cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);
```

然后通过相机矩阵计算“视图矩阵”，视图矩阵是将所有物体以相反于相机的方向运动，
尽管相机还是在原点但是相对关系是期望的。我们可以使用 `inverse` 方法计算逆矩阵（
完全对立的转换矩阵），在这个例子中提供的是绕原点转动的矩阵，
它的逆矩阵是移动相机以外的所有物体，好像相机在原点一样。

```
// 通过相机矩阵计算视图矩阵
var viewMatrix = m4.inverse(cameraMatrix);
```

现在将视图矩阵和投影矩阵结合在一起

```
// 计算组合矩阵
var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
```

最后绘制一圈 F，将每个 F 乘以视图投影矩阵，然后旋转和向外平移 radius 个单位。

```
for (var ii = 0; ii < numFs; ++ii) {
  var angle = ii * Math.PI * 2 / numFs;
  var x = Math.cos(angle) * radius;
  var y = Math.sin(angle) * radius

  // 从视图投影矩阵开始
  // 计算 F 的矩阵
  var matrix = m4.translate(viewProjectionMatrix, x, 0, y);

  // 设置矩阵
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // 获得几何体
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 16 * 6;
  gl.drawArrays(primitiveType, offset, count);
}
```

看！一个绕 F 旋转的相机。拖动 `cameraAngle` 滑块移动相机。

{{{example url="../webgl-3d-camera.html" }}}

这样做没什么问题，但是有时利用旋转和平移去移动相机，
让它到达期望的位置并看向期望的方向并不容易。
例如你想让它总是看向一个特定的 F , 而相机又在绕一圈 F 旋转，
这时计算会变的相当复杂。

幸好这有一个简单的方法，我们可以同时定义相机位置和朝向，然后矩阵就可以将相机放在那，
基于矩阵这个工作就会变得非常简单。

首先我们需要知道相机的期望位置，将它叫做 `cameraPosition`，
然后需要知道看向或对准的目标位置，将它叫做 `target`。
如果将 `target` 减去 `cameraPosition` 就会得到相机的朝向，
将它叫做 `zAxis`。由于我们知道相机看向的是 -Z 方向，
所以可以用另一种方式相减  `cameraPosition - target`，
将结果单位化后直接赋给矩阵的 `z` 区域。

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
| Zx | Zy | Zz |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
</pre></div>

矩阵的这个区域代表的是 Z 轴。在这个例子中相机的 Z-axis 进行了单位化，
单位化也就是一个做一个类似 1.0 的矢量，如果你回到[二维旋转的文章](webgl-2d-rotation.html)，
那里讲到的单位圆在二维旋转中用法，在三维中需要一个单位球，单位向量表示单位球上的点。

{{{diagram url="resources/cross-product-diagram.html?mode=0" caption="<span class='z-axis'>z 轴</span>" }}}

这些信息还不够，只给了一个单位圆上点，如何来确定物体的姿态呢？
这就需要填充矩阵的其他区域，尤其是 X 轴和 Y 轴。通常情况下我们知道它们互相垂直，
如果再知道哪里是上方，在该例中是(0,1,0)，就可以使用“叉乘”去计算矩阵的 X 轴和 Y 轴。

我不知道叉乘的数学意义是什么，但我知道将两个单位向量叉乘后可以得到一个和它们都垂直的向量。
换句话说，如果你有一个向量指向东南方，一个向量指向上方，
叉乘后会得到一个指向西南方或东北方的矢量，因为这两个矢量都和东南方和上方垂直。
相乘的顺序不同的到结果相反。

在任何情况下我们可以通过叉乘<span class="z-axis">`zAxis`</span>
和<span style="color: gray;">`up`</span> 得到相机的<span class="x-axis">xAxis</span>。

{{{diagram url="resources/cross-product-diagram.html?mode=1" caption="<span style='color:gray;'>up</span> 叉乘 <span class='z-axis'>zAxis</span> = <span class='x-axis'>xAxis</span>" }}}

现在我们有了 <span class="x-axis">`xAxis`</span> ，
可以叉乘 <span class="z-axis">`zAxis`</span> 和 <span class="x-axis">`xAxis`</span>
的到相机的 <span class="y-axis">`yAxis`</span>。

{{{diagram url="resources/cross-product-diagram.html?mode=2" caption="<span class='z-axis'>zAxis</span> 叉乘 <span class='x-axis'>xAxis</span> = <span class='y-axis'>yAxis</span>"}}}

现在将三个轴插入矩阵中，会给我们提供一个从 `cameraPosition` 指向 `target`
的转换，只需要再加上 `position`

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
| <span class="x-axis">Xx</span> | <span class="x-axis">Xy</span> | <span class="x-axis">Xz</span> |  0 |  <- <span class="x-axis">x axis</span>
+----+----+----+----+
| <span class="y-axis">Yx</span> | <span class="y-axis">Yy</span> | <span class="y-axis">Yz</span> |  0 |  <- <span class="y-axis">y axis</span>
+----+----+----+----+
| <span class="z-axis">Zx</span> | <span class="z-axis">Zy</span> | <span class="z-axis">Zz</span> |  0 |  <- <span class="z-axis">z axis</span>
+----+----+----+----+
| Tx | Ty | Tz |  1 |  <- 相机位置
+----+----+----+----+
</pre></div>

这是计算叉乘的代码

```
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}
```

这是向量相减的代码

```
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
```

这是单位化向量的代码

```
function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // 确定不会除以 0
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}
```

这是计算“朝向”矩阵的代码

```
var m4 = {
  lookAt: function(cameraPosition, target, up) {
    var zAxis = normalize(
        subtractVectors(cameraPosition, target));
    var xAxis = normalize(cross(up, zAxis));
    var yAxis = normalize(cross(zAxis, xAxis));

    return [
       xAxis[0], xAxis[1], xAxis[2], 0,
       yAxis[0], yAxis[1], yAxis[2], 0,
       zAxis[0], zAxis[1], zAxis[2], 0,
       cameraPosition[0],
       cameraPosition[1],
       cameraPosition[2],
       1,
    ];
  }
```

这是在移动过程中朝向某个确切的 'F' 的用法。

```
  ...

  // 计算第一个 F 的位置
  var fPosition = [radius, 0, 0];

  // 计算相机在圆上的位置矩阵
  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);

  // 获得矩阵中相机的位置
  var cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14],
  ];

  var up = [0, 1, 0];

  // 计算相机的朝向矩阵
  var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

  // 通过相机矩阵获得视图矩阵
  var viewMatrix = m4.inverse(cameraMatrix);

  ...
```

这是结果。

{{{example url="../webgl-3d-camera-look-at.html" }}}

拖动滑块观察相机是如何追踪单个 'F' 的。

你也可以对其他东西使用“lookAt”方法而不只是相机。通常是让角色视线跟着某人，
将炮塔指向目标，让物体沿着路径移动。你可以算出物体当前在路径上的位置和不久后的位置，
然后将这两个值放入 `lookAt` 方法，可以让物体沿着路径移动并且朝着路径的方向。

接下来让我们[学习动画](webgl-animation.html)。

<div class="webgl_bottombar">
<h3>lookAt 标准</h3>
<p>

大多数三维数学库都有<code>lookAt</code>方法，通常它是用于计算“视图矩阵”
而不是“相机矩阵”。换句话说这个矩阵将所有物体移动到相机前而不是将相机移动到物体前。

</p>
<p>

我发现它并不好用，前面指出，一个 lookAt 方法有很多用处，
当你需要视图矩阵的时候只需要调用<code>inverse</code>方法，
但当你想要让角色跟随另一个角色或者炮台跟随目标的时候，
在我看来<code>lookAt</code>方法返回世界坐标中的朝向和位置转换会好一些。

</p>
{{{example url="../webgl-3d-camera-look-at-heads.html" }}}
</div>



