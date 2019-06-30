Title: WebGL 实现二维矩阵栈
Description: 如何用WebGL实现二维的translate/rotate/scale方法
TOC: WebGL 二维矩阵栈


此文上接[WebGL二维DrawImage](webgl-2d-drawimage.html)，
如果没读建议从[那里开始](webgl-2d-drawimage.html)。

上篇文章中实现了画布的二维 `drawImage` 接口，包括可以自定义源矩形和目标矩形。

还没有实现的是从任意点旋转或/和缩放，我么可以增加参数来实现，
最少需要一个中心点，旋转角和 x , y 方向缩放量。幸运的是有更普遍和好用的方式，
画布的二维接口中使用的是一个矩阵栈，它有`save`, `restore`, `translate`,
`rotate`, 和 `scale`方法。

实现矩阵栈其实很简单，我们创建一个存放矩阵的栈，使用[之前创建的方法](webgl-2d-matrices.html)
生成平移，旋转，缩放矩阵，放在栈中，创建一个方法每次和最顶部的矩阵相乘。

这是实现。

首先是构造器和 `save`, `restore` 方法。

```
function MatrixStack() {
  this.stack = [];

  // 因为栈是空的，需要放入一个初始化矩阵
  this.restore();
}

// 抛出顶部的矩阵，重置为前一个矩阵
MatrixStack.prototype.restore = function() {
  this.stack.pop();
  // 永远不要让栈为空
  if (this.stack.length < 1) {
    this.stack[0] = m4.identity();
  }
};

// 讲当前矩阵备份到栈中
MatrixStack.prototype.save = function() {
  this.stack.push(this.getCurrentMatrix());
};
```

还需要一个方法获取或设置栈顶的矩阵

```
// 获取当前矩阵（栈顶的矩阵）
MatrixStack.prototype.getCurrentMatrix = function() {
  return this.stack[this.stack.length - 1].slice();
};

// 设置当前矩阵
MatrixStack.prototype.setCurrentMatrix = function(m) {
  return this.stack[this.stack.length - 1] = m;
};

```

最后使用之前的矩阵方法实现 `translate`, `rotate`, 和 `scale`。

```
// 平移当前矩阵
MatrixStack.prototype.translate = function(x, y, z) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

// 旋转当前矩阵
MatrixStack.prototype.rotateZ = function(angleInRadians) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.zRotate(m, angleInRadians));
};

// 缩放当前矩阵
MatrixStack.prototype.scale = function(x, y, z) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

注意我们使用的是三维矩阵方法，需要在平移时设置 `z` 为 `0`，缩放时设置 `z` 为 `1`。
由于我用惯了二维接口，经常忘记设置 `z` 值，所以就让 `z` 为可选参数。

```
// 平移当前矩阵
MatrixStack.prototype.translate = function(x, y, z) {
+  if (z === undefined) {
+    z = 0;
+  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

...

// 缩放当前矩阵
MatrixStack.prototype.scale = function(x, y, z) {
+  if (z === undefined) {
+    z = 1;
+  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

使用[上一节中实现的 `drawImage`](webgl-2d-drawimage.html)这些代码

```
// 将坐标从像素空间转换到裁剪空间
var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

// 将矩形平移到 dstX, dstY
matrix = m4.translate(matrix, dstX, dstY, 0);

// 将单位矩形的宽高缩放到 texWidth, texHeight 个单位
// from 1 unit to texWidth, texHeight units
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

只需要创建一个矩阵栈

```
var matrixStack = new MatrixStack();
```

然后将栈顶的矩阵乘起来

```
// 将坐标从像素空间转换到裁剪空间
var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

+// 将原点移动到栈顶矩阵代表的转换
+matrix = m4.multiply(matrix, matrixStack.getCurrentMatrix());

// 将矩形平移到 dstX, dstY
matrix = m4.translate(matrix, dstX, dstY, 0);

// 将单位矩形的宽高缩放到 texWidth, texHeight 个单位
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

现在就可以像用画布二维接口一样使用了。

如果你不清楚如何使用矩阵栈，可以把它想成平移和重定向原点。
例如二维画布默认原点 (0,0) 为左上角。

如果我们将原点移动到中心然后在绘制在 0,0 点，它的起点就是画布的中心

让我们使用[之前的例子](webgl-2d-drawimage.html)画一个图像

```
var textureInfo = loadImageAndCreateTextureInfo('resources/star.jpg');

function draw(time) {
  gl.clear(gl.COLOR_BUFFER_BIT);

  matrixStack.save();
  matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
  matrixStack.rotateZ(time);

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

  matrixStack.restore();
}
```

这是结果。

{{{example url="../webgl-2d-matrixstack-01.html" }}}

你可以看到，即使我们给 `drawImage` 传的 `0, 0`，由于使用了 `matrixStack.translate`
将原点移动到画布的中心，图像画在中心，并绕中心转动。

让我们将原点移动到图像中间

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);
+matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
```

现在图像就在画布中心绕图像中心旋转。

{{{example url="../webgl-2d-matrixstack-02.html" }}}

让我们在每个角画一个旋转的图像

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);

+matrixStack.save();
+{
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // 我们在中间图像的中心，所以去左上角
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
+  matrixStack.rotateZ(Math.sin(time * 2.2));
+  matrixStack.scale(0.2, 0.2);
+  // 我想让图像的右下角绘制在这里
+  matrixStack.translate(-textureInfo.width, -textureInfo.height);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // 我们在中间图像的中心，所以去右上角
+  matrixStack.translate(textureInfo.width / 2, textureInfo.height / -2);
+  matrixStack.rotateZ(Math.sin(time * 2.3));
+  matrixStack.scale(0.2, 0.2);
+  // 我想让图像的左下角绘制在这里
+  matrixStack.translate(0, -textureInfo.height);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // 我们在中间图像的中心，所以去左下角
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / 2);
+  matrixStack.rotateZ(Math.sin(time * 2.4));
+  matrixStack.scale(0.2, 0.2);
+  // 我想让图像的右上角绘制在这里
+  matrixStack.translate(-textureInfo.width, 0);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // 我们在中间图像的中心，所以去右下角
+  matrixStack.translate(textureInfo.width / 2, textureInfo.height / 2);
+  matrixStack.rotateZ(Math.sin(time * 2.5));
+  matrixStack.scale(0.2, 0.2);
+  // 我想让图像的左上角绘制在这里
+  matrixStack.translate(0, 0);  // 0,0 表示这行代码其实什么也没做
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
```

这是结果

{{{example url="../webgl-2d-matrixstack-03.html" }}}

仔细想想使用不同的矩阵栈方法`translate`, `rotateZ`, 和 `scale`
变换原点的过程中，决定旋转中心的的方式是
**在调用 drawImage 绘制某个部分前我应该将如何移动才能将旋转中心移动到之前的原点？**。

换句话说如果我们有一个 400x300 的画布，我调用 `matrixStack.translate(220, 150)`，
在这时原点在 220, 50，所有的绘制都是相对于这一点，如果用 `0, 0` 调用 `drawImage`
这里就是图像绘制的地方。

<img class="webgl_center" width="400" src="resources/matrixstack-before.svg" />

假设我想让旋转中心在右下角，在这种情况下就将原点移动到哪里调用 `drawImage`
才会将旋转中心也就是右下角移动到之前的原点？
纹理的右下角对应的坐标应该是 `-textureWidth, -textureHeight`，
所以使用 `0, 0` 调用 `drawImage` 时右下角应该在之前的原点。

<img class="webgl_center" width="400" src="resources/matrixstack-after.svg" />

在矩阵栈上之前的的任何操作是无关的，我们在调用 `drawImage` 之前做了一系列移动旋转或缩放，
只和当前时刻相关的原点有关，是新的原点，如果在栈前没有东西的话我们只需要决定将它移动到哪里。
（一个好点的方法是从 `drawImage` 开始往上看，先平移到旋转中心，再缩放，再旋转，再移动到中间图像的某一角，
其中每个操作的原点只和前一步有关）。

你可能发现矩阵栈和[场景图](webgl-scene-graph.html)十分相似，
场景图有树和节点，遍历数将每个节点和它的父节点的矩阵相乘，
矩阵栈只是是另一个版本而已。
