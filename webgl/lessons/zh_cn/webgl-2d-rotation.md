Title: WebGL 二维旋转
Description: 如何在二维中旋转
TOC: WebGL 二维旋转


此文上接一系列文章，先[从基础概念开始](webgl-fundamentals.html)，上一篇是
[物体平移](webgl-2d-translation.html)。

我承认我不知道怎么解释比较好，但是管它呢！先试试吧。

首先我想向你介绍一个叫做“单位圆”的东西。如果你还记得初中数学的话（别睡着了啊~喂！），
一个圆有一个半径，圆的半径是圆心到圆边缘的距离。单位圆是半径为 1.0 的圆。

这里有个单位圆。

{{{diagram url="../unit-circle.html" width="300" height="300" }}}

当你拖拽蓝色圆点的时候 X 和 Y 会改变，它们是那一点在圆上的坐标，
在最上方时 Y 是 1 并且 X 是 0 ，在最右边的时候 X 是 1 并且 Y 是 0 。

如果你还记得三年级的数学知识，数字和 1 相乘结果不变。
例如 123 * 1 = 123 。非常基础，对吧？那么，单位圆，半径为 1.0 
的圆也是 1 的一种形式，它是旋转的 1 。所以你可以把一些东西和单位圆相乘，
除了发生一些魔法和旋转之外，某种程度上和乘以 1 相似。

我们将从单位元上任取一点，并将该点的 X 和 Y 与[之前例子](webgl-2d-translation.html)
中的几何体相乘。

这是新的着色器。

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    +uniform vec2 u_rotation;

    void main() {
    +  // 旋转位置
    +  vec2 rotatedPosition = vec2(
    +     a_position.x * u_rotation.y + a_position.y * u_rotation.x,
    +     a_position.y * u_rotation.y - a_position.x * u_rotation.x);

      // 加上平移
    *  vec2 position = rotatedPosition + u_translation;

更新JavaScript，传递两个值进去。

      ...

    +  var rotationLocation = gl.getUniformLocation(program, "u_rotation");

      ...

    +  var rotation = [0, 1];

      ...

      // 绘制场景
      function drawScene() {

        ...

        // 设置平移
        gl.uniform2fv(translationLocation, translation);

    +    // 设置旋转
    +    gl.uniform2fv(rotationLocation, rotation);

        // 绘制几何体
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;  // 6 个三角形组成 'F', 每个三角形 3 个点
        gl.drawArrays(primitiveType, offset, count);
      }

这是结果，拖动圆形手柄来旋转或拖动滑块来平移。

{{{example url="../webgl-2d-geometry-rotation.html" }}}

为什么会这样？来看看数学公式。

    rotatedX = a_position.x * u_rotation.y + a_position.y * u_rotation.x;
    rotatedY = a_position.y * u_rotation.y - a_position.x * u_rotation.x;

假如你想旋转一个矩形，在开始旋转之前矩形右上角坐标是 3.0, 9.0 ，
让我们在单位圆上以十二点方向为起点顺时针旋转30度后取一个点。

<img src="../resources/rotate-30.png" class="webgl_center" />

圆上该点的位置是 0.50 和 0.87

<pre class="webgl_center">
   3.0 * 0.87 + 9.0 * 0.50 = 7.1
   9.0 * 0.87 - 3.0 * 0.50 = 6.3
</pre>

这个结果正好是我们需要的结果

<img src="../resources/rotation-drawing.svg" width="500" class="webgl_center"/>

顺时针60度也一样

<img src="../resources/rotate-60.png" class="webgl_center" />

圆上该点的位置是 0.87 和 0.50 。

<pre class="webgl_center">
   3.0 * 0.50 + 9.0 * 0.87 = 9.3
   9.0 * 0.50 - 3.0 * 0.87 = 1.9
</pre>

你会发现在我们顺时针旋转到右边的过程中，X 变大 Y 变小。如果我们继续旋转超过90
度后，X 变小 Y 变大，这种形式形成了旋转。

单位圆上的点还有一个名字，叫做正弦和余弦。所以对于任意给定角，
我们只需要求出正弦和余弦，像这样

    function printSineAndCosineForAnAngle(angleInDegrees) {
      var angleInRadians = angleInDegrees * Math.PI / 180;
      var s = Math.sin(angleInRadians);
      var c = Math.cos(angleInRadians);
      console.log("s = " + s + " c = " + c);
    }

如果你吧代码复制到JavaScript控制台，然后输入 `printSineAndCosignForAngle(30)` ，
会打印出 `s = 0.49 c = 0.87` (注意：我对结果四舍五入了)。

如果你把这些组合起来，就可以对几何体旋转任意角度，使用时只需要设置旋转的角度。

      ...
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[0] = Math.sin(angleInRadians);
      rotation[1] = Math.cos(angleInRadians);

这里有一个设置角度的版本，拖动滑块来旋转或平移。

{{{example url="../webgl-2d-geometry-rotation-angle.html" }}}

希望我解释的还过得去，这并不是旋转常用的方式，请继续阅读，
我们将会在2篇文章后讲旋转的通用方式，[下一篇比较简单，缩放](webgl-2d-scale.html)。

<div class="webgl_bottombar"><h3>弧度是什么?</h3>
<p>
弧度是圈，旋转和角度的一个单位。就像可以用英尺，米，码等单位来表示距离一样，我们可以用角度或弧度来量测角。
</p>
<p>
你可能会发现国际测量单位比皇家测量单位更好用。从英寸到英尺要乘以12，从英寸到码要乘以36，我不知道你怎么样但是我无法心算乘以36。但是国际单位就好用多了，从千米到百米需要乘以10，从千米到米需要乘以1000。我<strong>可以</strong>心算乘以1000。
</p>
<p>
弧度和角度的对比是相似的，角度不易计算，弧度简单一些。一圈有360度但是只有 2π 弧度。所以一半是 1π 弧度，90度是 1/2π 弧度。如果想旋转90度只需要使用<code>Math.PI * 0.5</code>，45度只需要使用<code>Math.PI * 0.25</code>，以此类推。
</p>
<p>
涉及角度，圈或旋转的计算用弧度去思考一般会简单一些。试一试吧，使用弧度代替角度，尤其在有用户交互的地方。
</p>
</div>


