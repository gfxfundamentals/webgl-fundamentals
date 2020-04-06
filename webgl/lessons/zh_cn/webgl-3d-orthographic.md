Title: WebGL 三维正射投影
Description: 从正射投影开始讲WebGL中的三维
TOC: WebGL 三维正射投影


此文上接一系列相关文章，首先是[基础概念](webgl-fundamentals.html)，上一篇是
[二维矩阵运算](webgl-2d-matrices.html)，如果没读过请从那里开始。

上一篇文章概述了二维矩阵的工作原理，我们讲到了如何平移，
旋转，缩放甚至从像素空间投影到裁剪空间，并且将这些操作通过一个矩阵实现，
做三维只需要再迈出一小步。

二维例子中的二维点 (x, y) 与 3x3 的矩阵相乘，
在三维中我们需要三维点 (x, y, z) 与 4x4 的矩阵相乘。

让我们将上个例子改成三维的，这里会继续使用 F ，但是这次是三维的 'F' 。

首先需要修改顶点着色器以支持三维处理，这是原顶点着色器，

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform mat3 u_matrix;

void main() {
  // 将位置和矩阵相乘
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
</script>
```

这是新着色器

```
<script id="vertex-shader-3d" type="x-shader/x-vertex">
*attribute vec4 a_position;

*uniform mat4 u_matrix;

void main() {
  // 将位置和矩阵相乘
*  gl_Position = u_matrix * a_position;
}
</script>
```

它甚至变简单了！在二维中我们提供`x`和`y`并设置`z`为1，
在三维中我们将提供`x`，`y`和`z`，然后将`w`设置为1,
而在属性中`w`的默认值就是1，我们可以利用这点不用再次设置。

然后提供三维数据。

```
  ...

  // 告诉属性怎么从 positionBuffer (ARRAY_BUFFER) 中读取位置
*  var size = 3;          // 每次迭代使用 3 个单位的数据
  var type = gl.FLOAT;   // 单位数据类型是32位的浮点型
  var normalize = false; // 不需要归一化数据
  var stride = 0;        // 0 = 移动距离 * 单位距离长度sizeof(type)  每次迭代跳多少距离到下一个数据
  var offset = 0;        // 从绑定缓冲的起始处开始
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  ...

// 填充当前 ARRAY_BUFFER 缓冲
// 使用组成 'F' 的数据填充缓冲.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
           // 左竖
            0,   0,  0,
           30,   0,  0,
            0, 150,  0,
            0, 150,  0,
           30,   0,  0,
           30, 150,  0,

           // 上横
           30,   0,  0,
          100,   0,  0,
           30,  30,  0,
           30,  30,  0,
          100,   0,  0,
          100,  30,  0,

           // 下横
           30,  60,  0,
           67,  60,  0,
           30,  90,  0,
           30,  90,  0,
           67,  60,  0,
           67,  90,  0]),
      gl.STATIC_DRAW);
}
```

接下来把二维矩阵方法改成三维的

这是二维（之前的）版本的 m3.translation, m3.rotation, 和 m3.scaling 方法

```
var m3 = {
  translation: function translation(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1
    ];
  },

  rotation: function rotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1
    ];
  },

  scaling: function scaling(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1
    ];
  },
};
```

这是升级到三维的版本。

```
var m4 = {
  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },
};
```

注意到我们现在有三个旋转方法，在二维中只需要一个是因为我们只需要绕 Z
轴旋转，现在在三维中还可以绕 X 轴和 Y 轴旋转。它们看起来还是很简单，
如果使用它们后你会发现和之前一样

绕 Z 轴旋转

<div class="webgl_center">
<div>newX = x *  c + y * s;</div>
<div>newY = x * -s + y * c;</div>
</div>

绕 Y 轴旋转

<div class="webgl_center">
<div>newX = x *  c + z * s;</div>
<div>newZ = x * -s + z * c;</div>
</div>

绕 X 轴旋转

<div class="webgl_center">
<div>newY = y *  c + z * s;</div>
<div>newZ = y * -s + z * c;</div>
</div>

它们提供这些旋转方式。

<iframe class="external_diagram" src="resources/axis-diagram.html" style="width: 540px; height: 240px;"></iframe>

同样的我们将实现一些简单的方法

```
  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },
```

我们还需要更新投影方法，这是原代码

```
  projection: function (width, height) {
    // 注意：这个矩阵翻转了 Y 轴，所以 0 在上方
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },
}
```

它将像素坐标转换到裁剪空间，在初次尝试三维时我们将这样做

```
  projection: function(width, height, depth) {
    // 注意：这个矩阵翻转了 Y 轴，所以 0 在上方
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },
```

就像 X 和 Y 需要从像素空间转换到裁剪空间一样，Z 也需要。
在这个例子中我也将 Z 单位化了，我会传递一些和 `width` 相似的值给
`depth` ，所以我们的空间将会是 0 到 `width` 像素宽，0 到 `height` 像素高，
但是对于`depth`将会是 `-depth / 2` 到 `+depth / 2` 。

最后需要更新计算矩阵的代码

```
  // 计算矩阵
*  var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
*  matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
*  matrix = m4.xRotate(matrix, rotation[0]);
*  matrix = m4.yRotate(matrix, rotation[1]);
*  matrix = m4.zRotate(matrix, rotation[2]);
*  matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

  // 设置矩阵
*  gl.uniformMatrix4fv(matrixLocation, false, matrix);
```

这是结果

{{{example url="../webgl-3d-step1.html" }}}

我们遇到的第一个问题是 F 在三维中过于扁平，
所以很难看出三维效果。解决这个问题的方法是将它拉伸成三维几何体。
现在的 F 是由三个矩形组成，每个矩形两个三角形。让它变三维需要 16 个矩形。
三个矩形在正面，三个背面，一个左侧，四个右侧，两个上侧，三个底面。

<img class="webgl_center nodarkinvert" width="300" src="resources/3df.svg" />

需要列出的还有很多，16 个矩形每个有两个三角形，每个三角形有 3 个顶点，
所以一共有 96 个顶点。如果你想看这些可以去示例的源码里找。

我们需要绘制更多顶点所以

```
    // 绘制几何体
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
```

这是对应结果

{{{example url="../webgl-3d-step2.html" }}}

拖动滑块很难看出它是三维的，让我们给矩形上不同的颜色。
需要在顶点着色器中添加一个属性和一个可变量，
将颜色值传到片断着色器中。

这是新的顶点着色器

```
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
+attribute vec4 a_color;

uniform mat4 u_matrix;

+varying vec4 v_color;

void main() {
  // 将位置和矩阵相乘.
  gl_Position = u_matrix * a_position;

+  // 将颜色传递给片断着色器
+  v_color = a_color;
}
</script>
```

然后在片断着色器中使用颜色

```
<script id="fragment-shader-3d" type="x-shader/x-fragment">
precision mediump float;

+// 从顶点着色器中传入
+varying vec4 v_color;

void main() {
*   gl_FragColor = v_color;
}
</script>
```

我们需要找到属性的位置，然后在另一个缓冲中存入对应的颜色。

```
  ...
  var colorLocation = gl.getAttribLocation(program, "a_color");

  ...
  // 给颜色创建一个缓冲
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // 将颜色值传入缓冲
  setColors(gl);


  ...
// 向缓冲传入 'F' 的颜色值

function setColors(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array([
        // 正面左竖
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

        // 正面上横
        200,  70, 120,
        200,  70, 120,
        ...
        ...
      gl.STATIC_DRAW);
}
```

在渲染时告诉颜色属性如何从缓冲中获取颜色值

```
// 启用颜色属性
gl.enableVertexAttribArray(colorLocation);

// 绑定颜色缓冲
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

// 告诉颜色属性怎么从 colorBuffer (ARRAY_BUFFER) 中读取颜色值
var size = 3;                 // 每次迭代使用3个单位的数据
var type = gl.UNSIGNED_BYTE;  // 单位数据类型是无符号 8 位整数
var normalize = true;         // 标准化数据 (从 0-255 转换到 0.0-1.0)
var stride = 0;               // 0 = 移动距离 * 单位距离长度sizeof(type)  每次迭代跳多少距离到下一个数据
var offset = 0;               // 从绑定缓冲的起始处开始
gl.vertexAttribPointer(
    colorLocation, size, type, normalize, stride, offset)

```

现在我们得到这个。

{{{example url="../webgl-3d-step3.html" }}}

呃，发生了什么？它好像把 'F' 的所有部分都按照提供的顺序显示出来了，
正面，背面，侧面等等。有时候这并不是想要的结果，在背面的物体反而被绘制出来了。

<img class="webgl_center" style="background-color: transparent;" width="163" height="190" src="resources/polygon-drawing-order.gif" />

<span style="background: rgb(200, 70, 120); color: white; padding: 0.25em">红色部分</span>
是 'F' 的**正面**，但是因为它在数据的前部所以最先被绘制出来，然后它后面的面绘制后挡住了它。
例如<span style="background: rgb(80, 70, 200); color: white; padding: 0.25em">紫色部分</span>
实际上是 'F' 的背面，由于它在数据中是第二个所以第二个被画出来。

WebGL中的三角形有正反面的概念，正面三角形的顶点顺序是逆时针方向，
反面三角形是顺时针方向。

<img src="resources/triangle-winding.svg" class="webgl_center" width="400" />

WebGL可以只绘制正面或反面三角形，可以这样开启

```
  gl.enable(gl.CULL_FACE);
```

将它放在 `drawScene` 方法里，开启这个特性后WebGL默认“剔除”背面三角形，
"剔除"在这里是“不用绘制”的花哨叫法。

对于WebGL而言，一个三角形是顺时针还是逆时针是根据裁剪空间中的顶点顺序判断的，
换句话说，WebGL是根据你在顶点着色器中运算后提供的结果来判定的，
这就意味着如果你把一个顺时针的三角形沿 X 轴缩放 -1 ，它将会变成逆时针，
或者将顺时针的三角形旋转180度后变成逆时针。由于我们没有开启 CULL_FACE，
所以可以同时看到顺时针（正面）和逆时针（反面）三角形。现在开启了，
任何时候正面三角形无论是缩放还是旋转的原因导致翻转了，WebGL就不会绘制它。
这件事很有用，因为通常情况下你只需要看到你正面对的面。

开启 CULL_FACE 后得到

{{{example url="../webgl-3d-step4.html" }}}

嗨！三角形都去哪了？结果证明，大多数三角形朝向都是错的，
旋转的时候你会看到背面的三角形，幸好它很容易解决，
我们只需要看看哪些是三角形是反的，然后交换它们的两个顶点。
例如一个反的三角形

```
           1,   2,   3,
          40,  50,  60,
         700, 800, 900,
```

只需要交换后两个顶点的位置

```
           1,   2,   3,
         700, 800, 900,
          40,  50,  60,
```

通过修正朝向错误后得到

{{{example url="../webgl-3d-step5.html" }}}

这很接近实际效果了但是还有一个问题，即使所有三角形的朝向是正确的，
然后背面的被剔除了，有些应该在背面的部分还是出现在了前面。

接触 DEPTH BUFFER（深度缓冲）。

深度缓冲有时也叫 Z-Buffer，是一个存储像素深度的矩形，
一个深度像素对应一个着色像素，在绘制图像时组合使用。
当WebGL绘制每个着色像素时也会写入深度像素，
它的值基于顶点着色器返回的Z值，就像我们将 X 和 Y 转换到裁剪空间一样，
Z 也在裁剪空间或者 (-1 到 +1) 。这个值会被转换到深度空间( 0 到 +1)，
WebGL绘制一个着色像素之前会检查对应的深度像素，
如果对应的深度像素中的深度值小于当前像素的深度值，WebGL就不会绘制新的颜色。
反之它会绘制片断着色器提供的新颜色并更新深度像素中的深度值。
这也意味着在其他像素后面的像素不会被绘制。

我们可以像这样开启这个特性

```
  gl.enable(gl.DEPTH_TEST);
```

在开始绘制前还需要清除深度缓冲为 1.0 。

```
  // 绘制场景
  function drawScene() {
    ...

    // 清空画布和深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    ...
```

现在得到

{{{example url="../webgl-3d-step6.html" }}}

这才是三维！

还有一件小事，在大多数三维数学库中没有负责像素空间与裁剪空间转换的 `projection` 方法。
代替的是叫做 `ortho` 或 `orthographic` 的方法，它看起来像这样

    var m4 = {
      orthographic: function(left, right, bottom, top, near, far) {
        return [
          2 / (right - left), 0, 0, 0,
          0, 2 / (top - bottom), 0, 0,
          0, 0, 2 / (near - far), 0,

          (left + right) / (left - right),
          (bottom + top) / (bottom - top),
          (near + far) / (near - far),
          1,
        ];
      }

和我们简单的 `projection` 方法不同的是正射投影有更多的参数可以传递，
左，右，上，下，近和远，给我们更灵活的选择。为了用这个方法实现之前的投影，
需要这样调用

    var left = 0;
    var right = gl.canvas.clientWidth;
    var bottom = gl.canvas.clientHeight;
    var top = 0;
    var near = 400;
    var far = -400;
    m4.orthographic(left, right, bottom, top, near, far);

下一篇将讲述[如何实现透视投影](webgl-3d-perspective.html)。

<div class="webgl_bottombar">
<h3>为什么属性类型是 vec4 但是 gl.vertexAttribPointer 的大小是 3</h3>
<p>
注意细节的你可能发现，我们定义了这样两个属性
</p>
<pre class="prettyprint showlinemods">
attribute vec4 a_position;
attribute vec4 a_color;
</pre>
<p>两个都是 'vec4' 类型，当我们告诉WebGL如何从缓冲中获取数据时使用</p>
<pre class="prettyprint showlinemods">
// 告诉属性怎么从 positionBuffer (ARRAY_BUFFER) 中读取位置
var size = 3;          // 每次迭代使用 3 个单位的数据
var type = gl.FLOAT;   // 单位数据类型是32位的浮点型
var normalize = false; // 不需要归一化数据
var stride = 0;        // 0 = 移动距离 * 单位距离长度sizeof(type)
                       // 每次迭代跳多少距离到下一个数据
var offset = 0;        // 从绑定缓冲的起始处开始
gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset);

...
// 告诉颜色属性怎么从 colorBuffer (ARRAY_BUFFER) 中读取颜色值
var size = 3;          // 每次迭代使用3个单位的数据
var type = gl.UNSIGNED_BYTE;   // 单位数据类型是无符号 8 位整数
var normalize = true;  // 标准化数据 (从 0-255 转换到 0.0-1.0)
var stride = 0;        // 0 = 移动距离 * 单位距离长度sizeof(type)
                       // 每次迭代跳多少距离到下一个数据
var offset = 0;        // 从绑定缓冲的起始处开始
gl.vertexAttribPointer(
    colorAttributeLocation, size, type, normalize, stride, offset);
</pre>
<p>
这里的 '3' 表示的时每次迭代从缓冲中提取三个值给顶点着色器中的属性。
能正常运行是因为WebGL会给这些值设定默认值，默认值是0, 0, 0, 1
也就是 x = 0, y = 0, z = 0 和 w = 1 。我们需要传入 x 和 y 并且需要 z 是 1 ，
由于 z 的默认值是 0 所以我们需要额外提供 z 值，对于三维，即使我们没有提供 'w'，
默认的 1 正是矩阵运算需要的值。
</p>
</div>


