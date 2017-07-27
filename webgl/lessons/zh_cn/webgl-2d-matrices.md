Title: WebGL 二维矩阵
Description: 用简单易懂的方式讲解矩阵运算的用法

此文上接一系列文章，先[从基础概念开始](webgl-fundamentals.html)，上一篇是
[物体缩放](webgl-2d-scale.html)。

之前的三篇文章讲了如何对二维物体进行[平移](webgl-2d-translation.html)，
[旋转](webgl-2d-rotation.html)，和 [缩放](webgl-2d-scale.html)。
每种变换都改变了着色器并且这些变换还受先后顺序影响。在
[前例](webgl-2d-scale.html)中我们先缩放，再旋转，最后平移，如果执行顺序不同
结果也不同。

例如这是缩放 2, 1 ，旋转30度，然后平移 100, 0 的结果。

<img src="../../resources/f-scale-rotation-translation.svg" class="webgl_center" width="400" />

这是平移 100, 0 ，旋转30度，然后缩放 2, 1 的结果。

<img src="../../resources/f-translation-rotation-scale.svg" class="webgl_center" width="400" />

结果截然不同，更糟的是，针对第二种情况中的转换顺序，需要写一个新的着色器。

有些比我聪明的人可能已经想到了矩阵，对于二维我们使用 3x3 的矩阵，
3x3 的矩阵就像是有9个格子的格网。

<style>.glocal-center { text-align: center; } .glocal-center-content { margin-left: auto; margin-right: auto; } .glocal-mat td, .glocal-b { border: 1px solid black; text-align: left;} .glocal-mat td { text-align: center; } .glocal-border { border: 1px solid black; } .glocal-sp { text-align: right !important;  width: 8em;} .glocal-blk { color: black; background-color: black; } .glocal-left { text-align: left; } .glocal-right { text-align: right; }</style>
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

<pre class="webgl_center">
newX = x + tx;
newY = y + ty;
</pre>

其他的就不用关心了。这个看起来和[平移例子中的代码](webgl-2d-translation.html)有些相似。

同样的来实现旋转，在旋转章节提到过，旋转只需要和旋转角对应的正弦和余弦值

<pre class="webgl_center">
s = Math.sin(angleToRotateInRadians);
c = Math.cos(angleToRotateInRadians);
</pre>

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

    <script id="2d-vertex-shader" type="x-shader/x-vertex">
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

    <script id="2d-vertex-shader" type="x-shader/x-vertex">
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
但是，现在如果我们想改变转换顺序不再需要重写一个着色器，只需要改变一下数学运算。

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
      identity function() {
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
所以现在你可能明白了为什么PhotoShop或Flash可以让你移动旋转中心。

来做一些更有趣的事情，如果你回想第一篇文章[WebGL 基础概念](webgl-fundamentals.html)，
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
然后将他们乘在一起，由于运算很简单，所以我们就直接定义一个'projection'
方法，根据分辨率直接生成矩阵。

    var m3 = {
      projection: function(width, height) {
        // Note: This matrix flips the Y axis so that 0 is at the top.
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1
        ];
      },

      ...

Now we can simplify the shader even more.  Here's the entire new vertex
shader.

    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform mat3 u_matrix;

    void main() {
      // Multiply the position by the matrix.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    }
    </script>

And in JavaScript we need to multiply by the projection matrix

      // Draw the scene.
      function drawScene() {
        ...

        // Compute the matrices
        var projectionMatrix = m3.projection(
            gl.canvas.clientWidth, gl.canvas.clientHeight);

        ...

        // Multiply the matrices.
        var matrix = m3.multiply(projectionMatrix, translationMatrix);
        matrix = m3.multiply(matrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);

        ...
      }

We also removed the code that set the resolution.  With this last step
we've gone from a rather complicated shader with 6-7 steps to a very
simple shader with only 1 step all due to the magic of matrix math.

{{{example url="../webgl-2d-geometry-matrix-transform-with-projection.html" }}}

Before we move on let's simplifiy a little bit. While it's common to generate
various matrices and separately multiply them together it's also common to just
multiply them as we go. Effectively we could functions like this

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

This would let us change 7 lines of matrix code above to just 4 lines like this

```
// Compute the matrix
var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
matrix = m3.translate(matrix, translation[0], translation[1]);
matrix = m3.rotate(matrix, angleInRadians);
matrix = m3.scale(matrix, scale[0], scale[1]);
```

And here's that

{{{example url="../webgl-2d-geometry-matrix-transform-simpler-functions.html" }}}

One last thing, we saw above order matters. In the first example we had

    translation * rotation * scale

and in the second we had

    scale * rotation * translation

And we saw how they are different.

The are 2 ways to look at matrices. Given the expression

    projectionMat * translationMat * rotationMat * scaleMat * position

The first way which many people find natural is to start on the right and work
to the left

First we mutiply the positon by the scale matrix to get a scaled postion

    scaledPosition = scaleMat * position

Then we multiply the scaledPostion by the rotation matrix to get a rotatedScaledPosition

    rotatedScaledPosition = rotationMat * scaledPosition

Then we multiply the rotatedScaledPositon by the translation matrix to get a
translatedRotatedScaledPosition

    translatedRotatedScaledPosition = translationMat * rotatedScaledPosition

And finally we multiple that by the projection matrix to get clipspace positions

    clipspacePosition = projectioMatrix * translatedRotatedScaledPosition

The 2nd way to look at matrices is reading from left to right. In that case
each matrix changes the *space" respesented by the canvas. The canvas starts
with representing clipspace (-1 to +1) in each direction. Each matrix applied
from left to right changes the space represented by the canvas.

Step 1:  no matrix (or the identiy matrix)

> {{{diagram url="resources/matrix-space-change.html?stage=0" caption="clip space" }}}
>
> The white area is the canvas. Blue is outside the canvas. We're in clip space.
> Positions passed in need to be in clip space

Step 2:  `matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight)`;

> {{{diagram url="resources/matrix-space-change.html?stage=1" caption="from clip space to pixel space" }}}
>
> We're now in pixel space. X = 0 to 400, Y = 0 to 300 with 0,0 at the top left.
> Positions passed using this matrix in need to be in pixel space. The flash you see
> is when the space flips from positive Y = up to positive Y = down.

Step 3:  `matrix = m3.translate(matrix, tx, ty);`

> {{{diagram url="resources/matrix-space-change.html?stage=2" caption="move origin to tx, ty" }}}
>
> The origin has now been moved to tx, ty (150, 100). The space has moved.

Step 4:  `matrix = m3.rotate(matrix, rotationInRadians);`

> {{{diagram url="resources/matrix-space-change.html?stage=3" caption="rotate 33 degrees" }}}
>
> The space has been rotated around tx, ty

Step 5:  `matrix = m3.scale(matrix, sx, sy);`

> {{{diagram url="resources/matrix-space-change.html?stage=4" capture="scale the space" }}}
>
> The previously rotated space with its center at tx, ty has been scaled 2 in x, 1.5 in y

In the shader we then do `gl_Position = matrix * position;`. The `position` values are effectively in this final space.

Use which ever way you feel is easier to understand.

I hope these posts have helped demystify matrix math. If you want
to stick with 2D I'd suggest checking out [recreating canvas 2d's
drawImage function](webgl-2d-drawimage.html) and following that
into [recreating canvas 2d's matrix stack](webgl-2d-matrix-stack.html).

Otherwise next [we'll move on to 3D](webgl-3d-orthographic.html).
In 3D the matrix math follows the same principles and usage.
I started with 2D to hopefully keep it simple to understand.

Also, if you really want to become an expert
in matrix math [check out this amazing videos](https://www.youtube.com/watch?v=kjBOesZCoqc&list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab).

<div class="webgl_bottombar">
<h3>What are <code>clientWidth</code> and <code>clientHeight</code>?</h3>
<p>Up until this point whenever I referred to the canvas's dimensions I used <code>canvas.width</code> and <code>canvas.height</code>
but above when I called <code>m3.projection</code> I instead used <code>canvas.clientWidth</code> and <code>canvas.clientHeight</code>. Why?</p>
<p>Projection matrixes are concerned with how to take clipspace (-1 to +1 in each dimension) and convert it back
to pixels. But, in the browser, there are 2 types of pixels we are dealing with. One is the number of pixels in
the canvas itself. So for example a canvas defined like this.</p>
<pre class="prettyprint">
  &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;
</pre>
<p>or one defined like this</p>
<pre class="prettyprint">
  var canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
</pre>
<p>both contain an image 400 pixels wide by 300 pixels tall. But, that size is separate from what size
the browser actually displays that 400x300 pixel canvas. CSS defines what size the canvas is displayed.
For example if we made a canvas like this.</p>
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
<p>The canvas will be displayed whatever size its container is. That's likely not 400x300.</p>
<p>Here are two examples that set the canvas's CSS display size to 100% so the canvas is stretched
out to fill the page. The first one uses <code>canvas.width</code> and <code>canvas.height</code>. Open it in a new
window and resize the window. Notice how the 'F' doesn't have the correct aspect. It gets
distorted.</p>
{{{example url="../webgl-canvas-width-height.html" width="500" height="150" }}}
<p>In this second example we use <code>canvas.clientWidth</code> and <code>canvas.clientHeight</code>. <code>canvas.clientWidth</code> and <code>canvas.clientHeight</code> report
the size the canvas is actually being displayed by the browser so in this case, even though the canvas still only has 400x300 pixels
since we're defining our aspect ratio based on the size the canvas is being displayed the <code>F</code> always looks correct.</p>
{{{example url="../webgl-canvas-clientwidth-clientheight.html" width="500" height="150" }}}
<p>Most apps that allow their canvases to be resized try to make the <code>canvas.width</code> and <code>canvas.height</code> match
the <code>canvas.clientWidth</code> and <code>canvas.clientHeight</code> because they want there to be
one pixel in the canvas for each pixel displayed by the browser. But, as we've seen above, that's not
the only option. That means, in almost all cases, it's more technically correct to compute a
projection matrix's aspect ratio using <code>canvas.clientHeight</code> and <code>canvas.clientWidth</code>.
</p>
</div>

