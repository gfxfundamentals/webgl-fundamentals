Title: WebGL 三维方向光源
Description: 如何在WebGL中实现方向光源
TOC: WebGL 三维方向光源


此文上接[WebGL 三维相机](webgl-3d-camera.html)，
如果没读建议[从那里开始](webgl-3d-camera.html)。

实施光照的方式有很多种，最简单的可能就是**方向光源**了。

方向光是指光照均匀地来自某一个方向，晴朗天气下的太阳经常被当作方向光源，
它距离太远所以光线被看作是平行的照到地面上。

计算方向光非常简单，将方向光的方向和面的朝向**点乘**就可以得到两个方向的余弦值。

这有个例子

{{{diagram url="resources/dot-product.html" caption="drag the points"}}}

随意拖动其中的点，如果两点方向刚好相反，点乘结果则为 -1。
如果方向相同结果为 1。

这有什么用呢？如果将三维物体的朝向和光的方向点乘，
结果为 1 则物体朝向和光照方向相同，为 -1 则物体朝向和光照方向相反。

{{{diagram url="resources/directional-lighting.html" caption="rotate the direction" width="500" height="400"}}}

我们可以将颜色值和点乘结果相乘，BOOM！有光了！

还有一个问题，我们如何知道三维物体的朝向？

## 法向量

我不知道为什么叫**法向量**，但是在三维图形学中法向量就是描述面的朝向的单位向量。

这是正方体和球体的一些法向量。

{{{diagram url="resources/normals.html"}}}

这些插在物体上的线就是对应顶点的法向量。

注意到正方体在每个顶角有 3 个法向量。 这是因为需要 3 个法向量去描述相邻的每个面的朝向。

这里的法向量是基于他们的方向着色的，正 x 方向为<span style="color: red;">红色</span>，
上方向为<span style="color: green;">绿色</span>，正 z 方向为<span style="color: blue;">蓝色</span>。

让我们来给[上节](webgl-3d-camera.html)中的 `F` 添加法向量。
由于 `F` 非常规则并且朝向都是 x, y, z轴，所以非常简单。正面的的部分法向量为 `0, 0, 1`，
背面的部分法向量为 `0, 0, -1`，左面为 `-1, 0, 0`，右面为 `1, 0, 0`，上面为 `0, 1, 0`，
然后底面为 `0, -1, 0`。

```
function setNormals(gl) {
  var normals = new Float32Array([
          // 正面左竖
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 正面上横
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 正面中横
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 背面左竖
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 背面上横
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 背面中横
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 顶部
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // 上横右面
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 上横下面
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 上横和中横之间
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 中横上面
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // 中横右面
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 中横底面
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 底部右侧
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 底面
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 左面
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}
```

在代码中使用它们，先移除顶点颜色以便观察光照效果。

    // 找顶点着色器中的属性
    var positionLocation = gl.getAttribLocation(program, "a_position");
    -var colorLocation = gl.getAttribLocation(program, "a_color");
    +var normalLocation = gl.getAttribLocation(program, "a_normal");

    ...

    -// 创建一个缓冲存储颜色
    -var colorBuffer = gl.createBuffer();
    -// 绑定到 ARRAY_BUFFER
    -gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    -// 将几何数据放入缓冲
    -setColors(gl);

    +// 创建缓冲存储法向量
    +var normalBuffer = gl.createBuffer();
    +// 绑定到 ARRAY_BUFFER (可以看作 ARRAY_BUFFER = normalBuffer)
    +gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    +// 将法向量存入缓冲
    +setNormals(gl);

在渲染的时候

```
-// 启用颜色属性
-gl.enableVertexAttribArray(colorLocation);
-
-// 绑定颜色缓冲
-gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
-
-// 告诉颜色属性怎么从 colorBuffer (ARRAY_BUFFER) 中读取颜色值
-var size = 3;                 // 每次迭代使用3个单位的数据
-var type = gl.UNSIGNED_BYTE;  // 单位数据类型是无符号 8 位整数
-var normalize = true;         // 标准化数据 (从 0-255 转换到 0.0-1.0)
-var stride = 0;               // 0 = 移动距离 * 单位距离长度sizeof(type)  每次迭代跳多少距离到下一个数据
-var offset = 0;               // 从绑定缓冲的起始处开始
-gl.vertexAttribPointer(
-    colorLocation, size, type, normalize, stride, offset)

+// 启用法向量属性
+gl.enableVertexAttribArray(normalLocation);
+
+// 绑定法向量缓冲
+gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
+
+// 告诉法向量属性怎么从 normalBuffer (ARRAY_BUFFER) 中读取值
+var size = 3;          // 每次迭代使用3个单位的数据
+var type = gl.FLOAT;   // 单位数据类型是 32 位浮点型
+var normalize = false; // 单位化 (从 0-255 转换到 0-1)
+var stride = 0;        // 0 = 移动距离 * 单位距离长度sizeof(type)  每次迭代跳多少距离到下一个数据
+var offset = 0;        // 从绑定缓冲的起始处开始
+gl.vertexAttribPointer(
+    normalLocation, size, type, normalize, stride, offset)
```

现在让着色器使用它

首先在顶点着色器中只将法向量传递给片断着色器

    attribute vec4 a_position;
    -attribute vec4 a_color;
    +attribute vec3 a_normal;

    uniform mat4 u_matrix;

    -varying vec4 v_color;
    +varying vec3 v_normal;

    void main() {
      // 将位置和矩阵相乘
      gl_Position = u_matrix * a_position;

    -  // 将颜色传到片断着色器
    -  v_color = a_color;

    +  // 将法向量传到片断着色器
    +  v_normal = a_normal;
    }

然后在片断着色器中将法向量和光照方向点乘

```
precision mediump float;

// 从顶点着色器中传入的值
-varying vec4 v_color;
+varying vec3 v_normal;

+uniform vec3 u_reverseLightDirection;
+uniform vec4 u_color;

void main() {
+   // 由于 v_normal 是插值出来的，和有可能不是单位向量，
+   // 可以用 normalize 将其单位化。
+   vec3 normal = normalize(v_normal);
+
+   float light = dot(normal, u_reverseLightDirection);

*   gl_FragColor = u_color;

+   // 将颜色部分（不包括 alpha）和 光照相乘
+   gl_FragColor.rgb *= light;
}
```

然后找到 `u_color` 和 `u_reverseLightDirection` 的位置。

```
  // 寻找全局变量
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
+  var colorLocation = gl.getUniformLocation(program, "u_color");
+  var reverseLightDirectionLocation =
+      gl.getUniformLocation(program, "u_reverseLightDirection");

```

为它们赋值

```
  // 设置矩阵
  gl.uniformMatrix4fv(matrixLocation, false, worldViewProjectionMatrix);

+  // 设置使用的颜色
+  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
+
+  // 设置光线方向
+  gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
```

我们之前用到的 `normalize` 会将原向量转换为单位向量。
例子中的 `x = 0.5` 说明光线是从右往左照，`y = 0.7` 说明光线从上方往下照，
`z = 1` 说明光线从在场景前方。对应的值表示光源大多指向场景，在靠右方和上方一点的位置。

这是结果

{{{example url="../webgl-3d-lighting-directional.html" }}}

如果你旋转了 F 就会发现，F 虽然旋转了但是光照没变，
我们希望随着 F 的旋转正面总是被照亮的。

为了解决这个问题就需要在物体重定向时重定向法向量，
和位置一样我们也可以将向量和矩阵相乘，这个矩阵显然是 `world` 矩阵，
现在我们只传了一个矩阵 `u_matrix`，所以先来改成传递两个矩阵，
一个叫做 `u_world` 的世界矩阵，另一个叫做 `u_worldViewProjection`
也就是我们现在的 `u_matrix`。

```
attribute vec4 a_position;
attribute vec3 a_normal;

*uniform mat4 u_worldViewProjection;
+uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  // 将位置和矩阵相乘
*  gl_Position = u_worldViewProjection * a_position;

*  // 重定向法向量并传递给片断着色器
*  v_normal = mat3(u_world) * a_normal;
}
```

注意到我们将 `a_normal` 与 `mat3(u_world)` 相乘，
那是因为法向量是方向所以不用关心位移，
矩阵的左上 3x3 部分才是控制姿态的。

找到全局变量

```
  // 寻找全局变量
*  var worldViewProjectionLocation =
*      gl.getUniformLocation(program, "u_worldViewProjection");
+  var worldLocation = gl.getUniformLocation(program, "u_world");
```

然后更新它们

```
*// 设置矩阵
*gl.uniformMatrix4fv(
*    worldViewProjectionLocation, false,
*    worldViewProjectionMatrix);
*gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
```

结果

{{{example url="../webgl-3d-lighting-directional-world.html" }}}

旋转后就会发现面对 F 的面总是被照亮的。

这里有一个问题我不知道如何表述所以就用图解展示。
我们用 `normal` 和 `u_world` 相乘去重定向法向量，
如果世界矩阵被缩放了怎么办？事实是会得到错误的法向量。

{{{diagram url="resources/normals-scaled.html" caption="click to toggle normals" width="600" }}}

我从没想弄清为什么，但解决办法就是对世界矩阵求逆并转置，
用这个矩阵就会得到正确的结果。

在图解里中间的 <span style="color: #F0F;">紫色</span>球体是未缩放的，
左边的<span style="color: #F00;">红色</span>球体用的世界矩阵并缩放了，
你可以看出有些不太对劲。右边<span style="color: #00F;">蓝色</span>
的球体用的是世界矩阵求逆并转置后的矩阵。

点击图解循环观察不同的表示形式，你会发现在缩放严重时左边的（世界矩阵）
法向量和表面**没有**保持垂直关系，而右边的（世界矩阵求逆并转置）
一直保持垂直。最后一种模式是将它们渲染成红色，你会发现两个球体的光照结果相差非常大，
基于可视化的结果可以得出使用世界矩阵求逆转置是对的。

修改代码让示例使用这种矩阵，首先更新着色器，理论上我们可以直接更新 `u_world`
的值，但是最好将它重命名以表示它真正的含义，防止混淆。

```
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_worldViewProjection;
*uniform mat4 u_worldInverseTranspose;

varying vec3 v_normal;

void main() {
  // 将位置和矩阵相乘
  gl_Position = u_worldViewProjection * a_position;

  // 重定向法向量并传递给片断着色器
*  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
```

然后找到它

```
-  var worldLocation = gl.getUniformLocation(program, "u_world");
+  var worldInverseTransposeLocation =
+      gl.getUniformLocation(program, "u_worldInverseTranspose");
```

更新它

```
var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
var worldInverseMatrix = m4.inverse(worldMatrix);
var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

// 设置矩阵
gl.uniformMatrix4fv(
    worldViewProjectionLocation, false,
    worldViewProjectionMatrix);
-gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
+gl.uniformMatrix4fv(
+    worldInverseTransposeLocation, false,
+    worldInverseTransposeMatrix);
```

这是转置的代码

```
var m4 = {
  transpose: function(m) {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  },

  ...
```

由于我们并没有进行缩放，所以没有明显的变化，但防患于未然。

{{{example url="../webgl-3d-lighting-directional-worldinversetranspose.html" }}}

希望这光照的第一课解释的足够清楚，接下来是[点光源](webgl-3d-lighting-point.html)。

<div class="webgl_bottombar">
<h3>mat3(u_worldInverseTranspose) * a_normal 的可选方案</h3>
<p>之前的着色器中出现了这样的代码</p>
<pre class="prettyprint">
v_normal = mat3(u_worldInverseTranspose) * a_normal;
</pre>
<p>我们也可以这样做</p>
<pre class="prettyprint">
v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
</pre>
<p>由于 <code>w</code> 在相乘前被赋值为 0，所以在相乘后负责平移的部分与 0 相乘被移除了。
我认为这可能是更常用的方式，mat3 的做法只是对我来说更简洁但我经常用前一种方法。</p>
<p>当然另一种解决方案是将<code>u_worldInverseTranspose</code>直接构造成<code>mat3</code>。
这有两个不能这么做的理由，第一个是我们可能需要一个完整的 <code>u_worldInverseTranspose</code>
对象传递一个<code>mat4</code>给还要给其他地方使用，另一个是我们在JavaScript中的所有矩阵方法都是针对 4x4 的矩阵，如果没有其他特别的需求，没有必要构造一个3x3的矩阵，或者是把 4x4 转换成 3x3 。</p>
</div>
