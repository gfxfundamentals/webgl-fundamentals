Title: WebGL 二维矩阵
Description: 用简单易懂的方式讲解矩阵运算的用法
TOC: WebGL 二维矩阵


此文上接一系列文章，先[从基础概念开始](webgl-fundamentals.html)，上一篇是
[物体缩放](webgl-2d-scale.html)。

之前的三篇文章讲了如何对二维物体进行[平移](webgl-2d-translation.html)，
[旋转](webgl-2d-rotation.html)，和 [缩放](webgl-2d-scale.html)。
每种变换都改变了着色器并且这些变换还受先后顺序影响。在
[前例](webgl-2d-scale.html)中我们先缩放，再旋转，最后平移，如果执行顺序不同
结果也不同。

例如这是缩放 2, 1 ，旋转30度，然后平移 100, 0 的结果。

<img src="../resources/f-scale-rotation-translation.svg" class="webgl_center" width="400" />

这是平移 100, 0 ，旋转30度，然后缩放 2, 1 的结果。

<img src="../resources/f-translation-rotation-scale.svg" class="webgl_center" width="400" />

结果截然不同，更糟的是，针对第二种情况中的转换顺序，需要写一个新的着色器。

有些比我聪明的人可能已经想到了矩阵，对于二维我们使用 3x3 的矩阵，
3x3 的矩阵就像是有9个格子的格网。

<link href="resources/webgl-2d-matrices.css" rel="stylesheet">
<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>2.0</td><td>3.0</td></tr><tr><td>4.0</td><td>5.0</td><td>6.0</td></tr><tr><td>7.0</td><td>8.0</td><td>9.0</td></tr></table></div>

在计算的时候我们将位置坐标沿着矩阵列的方向依次相乘再将结果加起来。
我们的位置信息只有两个值， x 和 y 。但是要进行运算需要三个值，
所以我们将第三个值赋值为 1 。

在这个例子中结果将是

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/>
<tr><td class="glocal-right">newX&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">2.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">3.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">4.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">5.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">6.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1&nbsp;*&nbsp;</td><td>7.0</td><td>&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>8.0</td><td>&nbsp;&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>9.0</td><td>&nbsp;</td></tr></table></div>

你可能会想“这样做有什么意义？”，好吧，假设我们要进行平移，
平移的量为 tx 和 ty ，然后定义一个这样的矩阵

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>1.0</td><td>0.0</td></tr><tr><td>tx</td><td>ty</td><td>1.0</td></tr></table></div>

然后计算结果

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

如果你还记得线性代数的知识，我们可以删除和 0 相乘的部分，
和 1 相乘相当于没变，所以简化后为

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td></td><td>y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

或者更简洁

<div class="webgl_center"><pre class="webgl_math">
newX = x + tx;
newY = y + ty;
</pre></div>

其他的就不用关心了。这个看起来和[平移例子中的代码](webgl-2d-translation.html)有些相似。

同样的来实现旋转，在旋转章节提到过，旋转只需要和旋转角对应的正弦和余弦值

<div class="webgl_center"><pre class="webgl_math">
s = Math.sin(angleToRotateInRadians);
c = Math.cos(angleToRotateInRadians);
</pre></div>

然后我们创建一个这样的矩阵

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>c</td><td>-s</td><td>0.0</td></tr><tr><td>s</td><td>c</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

使用矩阵后得到

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

遮住没有意义的部分（和 0 或 1 相乘的部分）

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

然后得到简化版

<pre class="webgl_center">
newX = x *  c + y * s;
newY = x * -s + y * c;
</pre>

正是我们在[旋转例子](webgl-2d-rotation.html)中得到的结果。

最后是缩放，我们将两个缩放因子叫做 sx 和 sy 。

然后创建一个这样的矩阵

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>sx</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>sy</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

使用矩阵后得到

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

实际上是

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

简化后

<pre class="webgl_center">
newX = x * sx;
newY = y * sy;
</pre>

和[缩放例子](webgl-2d-scale.html)相似。

现在你可能还会想“那又怎样，有什么意义？”，
好像花了更多精力做之前做过的事情。

现在开始有趣的部分了，相乘后他们可以用一个矩阵代表三个变换，
假定有一个方法`m3.multiply`可以将两个矩阵相乘并返回结果。

为了方便讲解，我们先创建平移，旋转和缩放矩阵。

    var m3 = {
      translation: function(tx, ty) {
        return [
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ];
      },

      rotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          c,-s, 0,
          s, c, 0,
          0, 0, 1,
        ];
      },

      scaling: function(sx, sy) {
        return [
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ];
      },
    };

现在该修改着色器了，原来的着色器像这样

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    uniform vec2 u_rotation;
    uniform vec2 u_scale;

    void main() {
      // 缩放
      vec2 scaledPosition = a_position * u_scale;

      // 旋转
      vec2 rotatedPosition = vec2(
         scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
         scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

      // 平移
      vec2 position = rotatedPosition + u_translation;
      ...

新着色器就简单多了。

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform mat3 u_matrix;

    void main() {
      // 将位置乘以矩阵
      vec2 position = (u_matrix * vec3(a_position, 1)).xy;
      ...

这是使用的方法

      // 绘制场景
      function drawScene() {

        ,,,

        // 计算矩阵
        var translationMatrix = m3.translation(translation[0], translation[1]);
        var rotationMatrix = m3.rotation(angleInRadians);
        var scaleMatrix = m3.scaling(scale[0], scale[1]);

        // 矩阵相乘
        var matrix = m3.multiply(translationMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);

        // 设置矩阵
        gl.uniformMatrix3fv(matrixLocation, false, matrix);

        // 绘制图形
        gl.drawArrays(gl.TRIANGLES, 0, 18);
      }

这个例子用的新代码，滑块没变，还是对应平移，旋转和缩放，
但是他们在着色器中做的事情是相似的。

{{{example url="../webgl-2d-geometry-matrix-transform.html" }}}

可能你还会问，那又怎样？看起来没什么特别好的地方。
但是，如果现在我们想改变转换顺序的话，就不需要重写一个着色器了，只需要改变一下数学运算。

        ...
        // 矩阵相乘
        var matrix = m3.multiply(scaleMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, translationMatrix);
        ...

这是对应的版本。

{{{example url="../webgl-2d-geometry-matrix-transform-trs.html" }}}

像这样的矩阵相乘对层级变换至关重要，比如身体的手臂部分运动，
月球属于绕太阳转动的地球的一部分，或者树上的树枝。
写一个简单的层级运动的例子，我们来画5个 'F' ，并且每个 'F'
都以前一个的矩阵为基础。

      // 绘制场景
      function drawScene() {
        // 清空画布
        gl.clear(gl.COLOR_BUFFER_BIT);

        // 计算矩阵
        var translationMatrix = m3.translation(translation[0], translation[1]);
        var rotationMatrix = m3.rotation(angleInRadians);
        var scaleMatrix = m3.scaling(scale[0], scale[1]);

        // 初始矩阵
        var matrix = m3.identity();

        for (var i = 0; i < 5; ++i) {
          // 矩阵相乘
          matrix = m3.multiply(matrix, translationMatrix);
          matrix = m3.multiply(matrix, rotationMatrix);
          matrix = m3.multiply(matrix, scaleMatrix);

          // 设置矩阵
          gl.uniformMatrix3fv(matrixLocation, false, matrix);

          // 绘制图形
          gl.drawArrays(gl.TRIANGLES, 0, 18);
        }
      }

在这个例子中用到了一个新方法， `m3.identity`，
这个方法创建一个单位矩阵。单位矩阵就像 1.0 一样，
和它相乘的矩阵不会变化，就像

<div class="webgl_center">X * 1 = X</div>

同样的

<div class="webgl_center">matrixX * identity = matrixX</div>

这是创建单位矩阵的代码。

    var m3 = {
      identity: function() {
        return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
      },

      ...

这是5个 F 。

{{{example url="../webgl-2d-geometry-matrix-transform-hierarchical.html" }}}

再看一个例子，之前的每个例子中 'F' 都是绕着它的左上角旋转
（当然，改变转换顺序的那个例子除外）。
这是因为我们总是绕原点旋转，而 'F' 的原点就是左上角，也就是 (0, 0) 。

现在我们可以使用矩阵运算，并且自定义转换的顺序。所以让我们改变旋转的中心

        // 创建一个矩阵，可以将原点移动到 'F' 的中心
        var moveOriginMatrix = m3.translation(-50, -75);
        ...

        // 矩阵相乘
        var matrix = m3.multiply(translationMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);
        matrix = m3.multiply(matrix, moveOriginMatrix);

这是结果，注意到 F 现在绕中心旋转和缩放了。

{{{example url="../webgl-2d-geometry-matrix-transform-center-f.html" }}}

通过这种方式你可以绕任意点旋转和缩放，
所以现在你可能知道为什么PhotoShop或Flash可以让你移动旋转中心。

还可以做更有趣的事情，如果你回想第一篇文章[WebGL 基础概念](webgl-fundamentals.html)，
可能会记得在着色器中我们将像素坐标转换到裁剪空间，这是当时的代码

      ...
      // 从像素坐标转换到 0.0 到 1.0
      vec2 zeroToOne = position / u_resolution;

      // 再把 0->1 转换 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;

      // 把 0->2 转换到 -1->+1 (裁剪空间)
      vec2 clipSpace = zeroToTwo - 1.0;

      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

逐步观察，首先，“从像素坐标转换到 0.0 到 1.0”，
事实上是一个缩放变换，第二步也是缩放变换，接着是一个平移和一个 Y
为 -1 的缩放。我们可以将这些操作放入一个矩阵传给着色器，
创建两个缩放矩阵，一个缩放 1.0/分辨率，另一个缩放 2.0 ，
第三个平移  -1.0,-1.0 然后第四个将 Y 缩放 -1。
然后将他们乘在一起，由于运算很简单，所以我们就直接定义一个 `projection`
方法，根据分辨率直接生成矩阵。

    var m3 = {
      projection: function(width, height) {
        // 注意：这个矩阵翻转了 Y 轴，所以 0 在上方
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1
        ];
      },

      ...

现在可以简化着色器，这是新的着色器。

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform mat3 u_matrix;

    void main() {
      // 使位置和矩阵相乘
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    }
    </script>

在JavaScript中需要乘上投影矩阵

      // 绘制场景
      function drawScene() {
        ...

        // 计算矩阵
        var projectionMatrix = m3.projection(
            gl.canvas.clientWidth, gl.canvas.clientHeight);

        ...

        // 矩阵相乘
        var matrix = m3.multiply(projectionMatrix, translationMatrix);
        matrix = m3.multiply(matrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);

        ...
      }

这里还去除了设置分辨率的代码，通过使用矩阵，
我们就把着色器中 6-7 步的操作在一步中完成。

{{{example url="../webgl-2d-geometry-matrix-transform-with-projection.html" }}}

在继续之前我们可以先简化一下操作，虽然先创建一些矩阵再将它们相乘很常见，
但是按照我们的顺序依次操作矩阵也比较常见，比较高效的做法是创建这样的方法

```
var m3 = {

  ...

  translate: function(m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },

  rotate: function(m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },

  scale: function(m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },

  ...

};
```

这能够让我们将 7 行的矩阵代码转换成 4 行

```
// 计算矩阵
var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
matrix = m3.translate(matrix, translation[0], translation[1]);
matrix = m3.rotate(matrix, angleInRadians);
matrix = m3.scale(matrix, scale[0], scale[1]);
```

这是结果

{{{example url="../webgl-2d-geometry-matrix-transform-simpler-functions.html" }}}

最后一件事，我们之前使用了多种矩阵顺序。第一例中使用

    translation * rotation * scale // 平移 * 旋转 * 缩放

第二例中使用

    scale * rotation * translation // 缩放 * 旋转 * 平移

然后观察了它们的区别。

这有两种方式解读矩阵运算，给定这样一个表达式

    projectionMat * translationMat * rotationMat * scaleMat * position

第一种可能是多数人觉得比较自然的方式，从右向左解释

首先将位置乘以缩放矩阵获得缩放后的位置

    scaledPosition = scaleMat * position

然后将缩放后的位置和旋转矩阵相乘得到缩放旋转位置

    rotatedScaledPosition = rotationMat * scaledPosition

然后将缩放旋转位置和平移矩阵相乘得到缩放旋转平移位置

    translatedRotatedScaledPosition = translationMat * rotatedScaledPosition

最后和投影矩阵相乘得到裁剪空间中的坐标

    clipspacePosition = projectioMatrix * translatedRotatedScaledPosition

第二种方式是从左往右解释，在这个例子中每一个矩阵改变的都是画布的**坐标空间**，
画布的起始空间是裁剪空间的范围(-1 到 +1)，矩阵从左到右改变着画布所在的空间。

第一步：没有矩阵（或者单位矩阵）

> {{{diagram url="resources/matrix-space-change.html?stage=0" caption="裁剪空间" }}}
>
> 白色区域是画布，蓝色是画布以外，我们正在裁剪空间中。
> 传递到这里的点需要在裁剪空间内。

第二步：`matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);`

> {{{diagram url="resources/matrix-space-change.html?stage=1" caption="from clip space to pixel space" }}}
>
> 现在我们在像素空间，X 范围是 0 到 400 ，Y 范围是 0 到 300，0,0 点在左上角。
> 传递到这里的点需要在像素空间内，你看到的闪烁是 Y 轴上下颠倒的原因。

第三步：`matrix = m3.translate(matrix, tx, ty);`

> {{{diagram url="resources/matrix-space-change.html?stage=2" caption="move origin to tx, ty" }}}
>
> 原点被移动到了 tx, ty (150, 100)，所以空间移动了。

第四步：`matrix = m3.rotate(matrix, rotationInRadians);`

> {{{diagram url="resources/matrix-space-change.html?stage=3" caption="rotate 33 degrees" }}}
>
> 空间绕 tx, ty 旋转

第五步：`matrix = m3.scale(matrix, sx, sy);`

> {{{diagram url="resources/matrix-space-change.html?stage=4" capture="scale the space" }}}
>
> 之前的旋转空间中心在 tx, ty ，x 方向缩放 2 ，y 方向缩放 1.5

在着色器中执行`gl_Position = matrix * position;`，`position`被直接转换到这个空间。

选一个你容易接受的方式去理解吧。

希望此系列文章向你揭秘了矩阵运算，如果你还想深入学习二维我建议你看看
[响应式画布绘制二维图片](webgl-2d-drawimage.html)，然后接着阅读
[响应式画布的二维矩阵堆](webgl-2d-matrix-stack.html)。

否则接下来[我们将进入三维部分](webgl-3d-orthographic.html)。
三维矩阵运算遵循相似的原则和用法，从二维讲起是为了便于理解。

另外，如果你想精通矩阵运算[就看看这个神奇的视频](https://www.youtube.com/watch?v=kjBOesZCoqc&list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab)吧！

<div class="webgl_bottombar">
<h3><code>clientWidth</code> 和 <code>clientHeight</code>是什么？</h3>
<p>在此之前每当我使用画布的大小时都用的<code>canvas.width</code>和<code>canvas.height</code>，但是这篇文章中使用<code>m3.projection</code>时却用了<code>canvas.clientWidth</code> 和 <code>canvas.clientHeight</code>，为什么？</p>
<p>投影矩阵是将坐标在裁剪空间(各方向单位为 -1 到 +1 )和像素空间之间进行转换。但是在浏览器中，有两种类型的像素空间，一种是画布本身的表现的像素个数，所以例子中画布是这样定义的。</p>
<pre class="prettyprint">
  &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;
</pre>
<p>或者像这样定义</p>
<pre class="prettyprint">
  var canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
</pre>
<p>两种都包含一个400像素宽300像素高的图像，但是这个大小和浏览器显示的 400×300 像素的画布是有区别的，CSS决定画布在浏览器中占用的实际像素个数。例如我们定义一个这样的画布。</p>
<pre class="prettyprint"><!>
  &lt;style&gt;
  canvas {
    width: 100vw;
    height: 100vh;
  }
  &lt;/style&gt;
  ...
  &lt;canvas width="400" height="300">&lt;/canvas&gt;
</pre>
<p>画布的大小将会和他所在的容器一样大，很可能不是 400×300 。</p>
<p>这有两个例子，都设置画布大小为 100%，所以画布会被拉伸到页面大小。第一个例子使用<code>canvas.width</code> 和 <code>canvas.height</code>，在新窗口中打开，然后改变窗口大小，会发现 'F' 的比例失调，变得扭曲了。</p>
{{{example url="../webgl-canvas-width-height.html" width="500" height="150" }}}
<p>第二个例子使用<code>canvas.clientWidth</code> 和 <code>canvas.clientHeight</code>，<code>canvas.clientWidth</code> 和 <code>canvas.clientHeight</code>返回的是画布在浏览器中实际显示的大小，所以在这个例子中，即使画布还是 400x300 像素，但是长宽比是按照画布实际大小设置的，最终<code>F</code>看起来始终正常。</p>
{{{example url="../webgl-canvas-clientwidth-clientheight.html" width="500" height="150" }}}
<p>大多数程序在画布大小改变时都会保持<code>canvas.width</code> 和 <code>canvas.height</code> 与
<code>canvas.clientWidth</code> 和 <code>canvas.clientHeight</code> 一致，因为他们希望屏幕一像素对应绘制一像素。但是我们之前看到，那并不是唯一的选择，也就是说在大多数情况下正确的做法是用<code>canvas.clientHeight</code> 和 <code>canvas.clientWidth</code>来计算长宽比。</p>
</div>

