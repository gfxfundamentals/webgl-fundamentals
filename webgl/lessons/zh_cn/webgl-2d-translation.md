Title: WebGL 二维平移
Description: 如何在二维中平移
TOC: WebGL 二维平移


在学习三维之前让我们先看一看二维，还请见谅。
这个主题对有些人来说可能过于简单，但我还是准备在几篇文章中加以阐述。

此文上接[WebGL 基础概念](webgl-fundamentals.html)系列，如果没有阅读，
我建议你先读第一篇再来这里。

平移就是普通意义的“移动”物体。
用[第一篇文章](webgl-fundamentals.html)中的代码，你可以改变传递给 setRectangle
的值，移动矩形的位置。这里有个例子基于[前一个例子](webgl-fundamentals.html)。

首先我们来定义一些变量存储矩形的平移，宽，高和颜色。

```
  var translation = [0, 0];
  var width = 100;
  var height = 30;
  var color = [Math.random(), Math.random(), Math.random(), 1];
```

然后定义一个方法重绘所有东西，我们可以在更新变换之后调用这个方法。

```
  // 绘制场景
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // 告诉WebGL如何从裁剪空间对应到像素
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 清空画布
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 使用我们的程序
    gl.useProgram(program);

    // 启用属性
    gl.enableVertexAttribArray(positionLocation);

    // 绑定位置缓冲
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 设置矩形参数
    setRectangle(gl, translation[0], translation[1], width, height);

    // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
    var size = 2;          // 每次迭代运行提取两个单位数据
    var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
    var normalize = false; // 不需要归一化数据
    var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
    var offset = 0;        // 从缓冲起始位置开始读取
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset)

    // 设置分辨率
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // 设置颜色
    gl.uniform4fv(colorLocation, color);

    // 绘制矩形
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

在下方的例子中，我添加了一对滑块，当它们值改变时会更新`translation[0]` 和 `translation[1]`
并且调用`drawScene`方法。拖动滑块来平移矩形。

{{{example url="../webgl-2d-rectangle-translate.html" }}}

到目前为止还不错！但是想象一下如果对一个更复杂的图形做类似操作怎么办。

假设我们想绘制一个由六个三角形组成的 ‘F’ ，像这样

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center">

接着当前的代码我们需要修改`setRectangle`，像这样

```
// 在缓冲存储构成 'F' 的值
function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // 左竖
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // 上横
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // 中横
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3,
      ]),
      gl.STATIC_DRAW);
}
```

你可能发现这样做可能并不好，如果我们想绘制一个含有成百上千个线条的几何图形，
将会有很复杂的代码。最重要的是，每次绘制JavaScript都要更新所有点。

这里有个简单的方式，上传几何体然后在着色器中进行平移。

这是新的着色器

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
+uniform vec2 u_translation;

void main() {
*   // 加上平移量
*   vec2 position = a_position + u_translation;

   // 从像素坐标转换到 0.0 到 1.0
*   vec2 zeroToOne = position / u_resolution;
   ...
```

重构一下代码，首先我们只需要设置一次几何体。

```
// 在缓冲存储构成 'F' 的值
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // 左竖
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // 上横
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // 中横
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90,
      ]),
      gl.STATIC_DRAW);
}
```

然后我们只需要在绘制前更新`u_translation`为期望的平移量。

```
  ...

+  var translationLocation = gl.getUniformLocation(
+             program, "u_translation");
  ...

  // 创建一个存放位置信息的缓冲
  var positionBuffer = gl.createBuffer();
  // 绑定到 ARRAY_BUFFER (简单的理解为 ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
+  // 将几何数据存到缓冲
+  setGeometry(gl);

  ...

  // 绘制场景
  function drawScene() {

    ...

+    // 设置平移
+    gl.uniform2fv(translationLocation, translation);

    // 绘制矩形
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

注意到`setGeometry`只调用了一次，它不在`drawScene`内部了。

这里是那个例子，同样的，拖动滑块来更新平移量。

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

现在当我们绘制时，WebGL几乎做了所有事情，我们做的仅仅是设置平移然后让它绘制，
即使我们的几何体有成千上万个点，主要的代码还是保持不变。

你可以对比[上方例子中使用JavaScript更新所有点的情况](../webgl-2d-geometry-translate.html)。

我希望这个例子不会过于简单，请继续阅读，我们会用更好的方式实现平移。
[下一篇文章讲旋转](webgl-2d-rotation.html)。


