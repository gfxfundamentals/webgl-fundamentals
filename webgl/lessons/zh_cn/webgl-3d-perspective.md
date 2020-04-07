Title: WebGL 三维透视投影
Description: 在WebGL中如何实现三维透视投影
TOC: WebGL 三维透视投影


此文上接WebGL系列文章，从[基础概念](webgl-fundamentals.html)开始，
上一篇是[三维的基础内容](webgl-3d-orthographic.html)，如果没读过请从那里开始。

上一篇文章讲述了如何实现三维，那个三维用的不是透视投影，
而是的所谓的“正射”投影，但那不是我们日常观看三维的方式。

我们应使用透视投影代替它，但什么是透视投影？
它的基础特性就是离得越远显得越小。

<img class="webgl_center noinvertdark" width="500" src="resources/perspective-example.svg" />

在上方的示例中，远处的物体会变小，想要实现例子中近大远小的效果，
简单的做法就是将裁减空间中的 X 和 Y 值除以 Z 值。

你可以这么想：如果一个线段是 (10, 15) 到 (20,15)，
它长度为十个单位，在当前的代码中它就是 10 个像素长，
但是如果我们将它除以 Z ，且 Z 值 为 1

<pre class="webgl_center">
10 / 1 = 10
20 / 1 = 20
abs(10-20) = 10
</pre>

它将是 10 个像素长，如果 Z 值为 2

<pre class="webgl_center">
10 / 2 = 5
20 / 2 = 10
abs(5 - 10) = 5
</pre>

就是 5 像素了，当 Z 值为 3 时

<pre class="webgl_center">
10 / 3 = 3.333
20 / 3 = 6.666
abs(3.333 - 6.666) = 3.333
</pre>

你可以看出随着 Z 变大距离就变远了，画的也会小一点。
如果我们除以裁剪空间中的 Z ，值可能会变大，因为 Z 
是一个较小的值(-1 到 +1)。但是我们可以提供一个
fudgeFactor 因子和 Z 相乘，这样就可以调整缩放的程度。

让我们来试试，首先修改顶点着色器，除以 Z 再乘以我们的
"fudgeFactor" 因子。

```
<script id="vertex-shader-3d" type="x-shader/x-vertex">
...
+uniform float u_fudgeFactor;
...
void main() {
  // 将位置和矩阵相乘
  vec4 position = u_matrix * a_position;

+  // 调整除数
+  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

*  // x 和 y 除以调整后的除数
*  gl_Position = vec4(position.xy / zToDivideBy, position.zw);
}
</script>
```

注意，由于裁减空间中的 Z 值是 -1 到 +1 的，所以 +1 是为了让
`zToDivideBy` 变成 0 到 +2 * fudgeFactor

还需要更新代码以设置 fudgeFactor。

```
  ...
  var fudgeLocation = gl.getUniformLocation(program, "u_fudgeFactor");

  ...
  var fudgeFactor = 1;
  ...
  function drawScene() {
    ...
    // 设置 fudgeFactor
    gl.uniform1f(fudgeLocation, fudgeFactor);

    // 绘制几何体
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
```

这是结果。

{{{example url="../webgl-3d-perspective.html" }}}

如果效果不明显，可以将 "fudgeFactor" 滑块从 1.0 拖到 0.0
来对比没添加这些代码之前的样子。

<img class="webgl_center" src="resources/orthographic-vs-perspective.png" />
<div class="webgl_center">orthographic vs perspective</div>

事实上WebGL会将我们提供给 `gl_Position` 的  x,y,z,w 值自动除以 w 。

我们可以通过修改着色器来证明，用 `zToDivideBy` 代替 `gl_Position.w`

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
...
uniform float u_fudgeFactor;
...
void main() {
  // 将位置和矩阵相乘
  vec4 position = u_matrix * a_position;

  // 调整除数
  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

  // 将 x y z 除以 zToDivideBy
*  gl_Position = vec4(position.xyz, zToDivideBy);

  // 传递颜色到给片断着色器
  v_color = a_color;
}
</script>
```

看他们多像。

{{{example url="../webgl-3d-perspective-w.html" }}}

为什么WebGL会自动除以 W ？因为使用矩阵的魔力，可以用把值从 z 传值到 w 。

一个这样的矩阵

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 0,
</pre></div>

将会把 z 的值复制给 w ， 你可以把每列看作

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in * 1 +
        y_in * 0 +
        z_in * 0 +
        w_in * 0 ;

y_out = x_in * 0 +
        y_in * 1 +
        z_in * 0 +
        w_in * 0 ;

z_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;

w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;
</pre></div>

简化后得到

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in;
y_out = y_in;
z_out = z_in;
w_out = z_in;
</pre></div>

如果 w 原来就是 1.0 就会加 1

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 1,
</pre></div>

他会将 W 的运算变为

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 1 ;
</pre></div>

因为 `w_in` = 1.0 是已知的

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in + 1;
</pre></div>

最后可以将 fudgeFactor 像这样放入矩阵中

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, fudgeFactor,
0, 0, 0, 1,
</pre></div>

相当于

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * fudgeFactor +
        w_in * 1 ;
</pre></div>

简化后为

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in * fudgeFactor + 1;
</pre></div>

我们来修改代码，使用这个矩阵。

首先将顶点着色器还原，又变成简单的样子

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
uniform mat4 u_matrix;

void main() {
  // 位置和矩阵相乘
  gl_Position = u_matrix * a_position;
  ...
}
</script>
```

接下来定义一个方法实现 Z &rarr; W 的矩阵

```
function makeZToWMatrix(fudgeFactor) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, fudgeFactor,
    0, 0, 0, 1,
  ];
}
```

然后使用它。

```
    ...
    // 计算矩阵
*    var matrix = makeZToWMatrix(fudgeFactor);
*    matrix = m4.multiply(matrix, m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400));
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    ...
```

和之前的很像。

{{{example url="../webgl-3d-perspective-w-matrix.html" }}}

这只是展示了除以 Z 值获可以实现透视投影，以及在WebGL中简单实现。

但还有一些问题需要解决，比如将 Z 值设置为 -100 左右的时候会遇到下面的情形

<img class="webgl_center" src="resources/z-clipping.gif" style="border: 1px solid black;" />

为什么会这样？为什么 F 提前消失了？WebGL裁剪空间中的 X 和 Y 会被 +1
和 -1 裁剪， Z也一样。我们看到的是 Z < -1 的情况。

我可以从数学方法深入探讨并寻找解决办法，但是你可以
[联想](https://stackoverflow.com/a/28301213/128511)
二维中的的解决方法。我们需要获取 Z 值，然后加上一些量，
缩放一些量，就可以将任意范围映射到 -1 到 +1 的范围内。

最有意思的是这件事可以在一个矩阵中完成，更方便的是，
我们可以定义一个 `fieldOfView` 代替 `fudgeFactor` ，
计算出更合适的值。

这是创建矩阵的方法。

```
var m4 = {
  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },

  ...
```

这个矩阵会为我们完成所有转换。它可以调整单位以适应裁剪空间，
它可以自定义视场角，选择 Z-裁剪面。假设有一个**眼睛**或者**摄像机**
在原点(0, 0, 0)，根据 `zNear` 和 `fieldOfView` 可以将 `zNear` 
对应到 `Z = -1` ，在 `zNear` 平面上一半的 `fieldOfView` 长度
对应画布中心到 `Y = -1` 或 `Y = 1` 的距离，X 的值通过乘以
`aspect` 获取，最后通过设置 zFar 对应 `Z = 1` ，控制缩放的程度。

这是矩阵的图解。

{{{example url="../frustum-diagram.html" width="400" height="600" }}}

正方体所在的有四个侧面的椎体叫做“视锥”，矩阵将视锥中的空间转换到裁剪空间中，
`zNear` 决定了被正面切割的位置，`zFar` 决定被背面切割的位置。
将 `zNear` 设置为 23 就会看到正方体正面被切割，
将 `zFar` 设置为 24 就会看到正方体背面被切割。

还有一个问题，矩阵假定观察位置为 0,0,0 并且看向 Z 轴负方向，
Y 轴为上方向。这和我们目前为止做法不同，
为了解决这个问题我们需要将物体放到视图范围内。

我们在 (45, 150, 0) 绘制的 F，可以将它移动到 (-150, 0, -360)

使用 `m4.projection` 方法代替之前的投影方法，可以调用
`m4.perspective`

```
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zNear = 1;
var zFar = 2000;
var matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
matrix = m4.xRotate(matrix, rotation[0]);
matrix = m4.yRotate(matrix, rotation[1]);
matrix = m4.zRotate(matrix, rotation[2]);
matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
```

结果在这里。

{{{example url="../webgl-3d-perspective-matrix.html" }}}

我们讲了矩阵乘法，视角和自定义 Z 范围。还有很多没讲完，
但这篇文章已经很长了，所以接下来继续讲[相机](webgl-3d-camera.html)。

<div class="webgl_bottombar">
<h3>为什么将 F 移动到那么远的距离(Z = -360)?</h3>
<p>

在其他的例子中 F 都在  (45, 150, 0) ，但在最后一个例子中它被移动到了
 (-150, 0, -360)。为什么它被移动到那么远的地方？

</p>
<p>

原因是在最后一个例子中用 <code>m4.projection</code> 方法将
像素移动到裁减空间，我们的显示范围是 400x300 像素，
“像素”在三维中无法解释。所以新投影创建了一个视锥，它在 <code>zNear</code> 
的距离时是 2 个单位高和 2 * aspect 个单位宽。由于 'F' 的大小是 150 个单位，
在近平面的时候只能看到 2 个单位的高度，
所以我们将它移到足够远的地方才能看到完整的它。

</p>
<p>

同样的将 'X' 从 45 移动到 -150 。过去视图表示的范围是 0 到 400 个单位，
现在它表示的 -1 到 +1 个单位。

</p>
</div>


